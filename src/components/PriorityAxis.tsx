import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import * as echarts from 'echarts/core';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { GraphicComponent, GridComponent, MarkLineComponent } from 'echarts/components';
import { ScatterChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { MatrixTask, TaskMetrics } from '../types';

echarts.use([
  GridComponent,
  GraphicComponent,
  MarkLineComponent,
  ScatterChart,
  CanvasRenderer,
]);

interface PriorityAxisProps {
  tasks: MatrixTask[];
  onMetricsChange: (taskId: string, metrics: Partial<TaskMetrics>) => void;
}

interface DragElement {
  position: number[];
  dirty?: () => void;
}

interface ZrPointerEvent {
  event?: {
    preventDefault?: () => void;
    stopPropagation?: () => void;
  };
}

interface LabelFrameController {
  active: boolean;
  isDragging: boolean;
  pendingFrame: number | null;
  position: number[];
}

const LABEL_WIDTH = 160;
const LABEL_HEIGHT = 32;
const LABEL_GAP = 18;
const LABEL_PADDING_X = 18;
const LABEL_PADDING_Y = 14;

let pageDragLockState: {
  left: string;
  overflow: string;
  position: string;
  right: string;
  scrollY: number;
  top: string;
  touchAction: string;
  width: string;
} | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clampMetric(value: number) {
  return clamp(Math.round(value), 0, 100);
}

function clampPixelPosition(chart: ECharts, position: number[]) {
  const minPoint = chart.convertToPixel({ gridIndex: 0 }, [0, 0]) as number[];
  const maxPoint = chart.convertToPixel({ gridIndex: 0 }, [100, 100]) as number[];

  return [
    clamp(position[0], Math.min(minPoint[0], maxPoint[0]), Math.max(minPoint[0], maxPoint[0])),
    clamp(position[1], Math.min(minPoint[1], maxPoint[1]), Math.max(minPoint[1], maxPoint[1])),
  ];
}

function getDropState(chart: ECharts, position: number[]) {
  const clampedPosition = clampPixelPosition(chart, position);
  const values = chart.convertFromPixel({ gridIndex: 0 }, clampedPosition) as number[];
  const metrics = {
    importance: clampMetric(values[0]),
    urgency: clampMetric(values[1]),
  };
  const snappedPosition = chart.convertToPixel({ gridIndex: 0 }, [
    metrics.importance,
    metrics.urgency,
  ]) as number[];

  return { metrics, snappedPosition };
}

function getLabelPosition(chart: ECharts, point: number[]) {
  const chartWidth = chart.getWidth();
  const chartHeight = chart.getHeight();
  const boxWidth = LABEL_WIDTH + LABEL_PADDING_X;
  const boxHeight = LABEL_HEIGHT + LABEL_PADDING_Y;
  const edge = 8;
  const rightX = point[0] + LABEL_GAP;
  const leftX = point[0] - boxWidth - LABEL_GAP;
  const preferredX = rightX + boxWidth > chartWidth - edge ? leftX : rightX;
  const centerY = point[1] - boxHeight / 2;
  const belowY = point[1] + LABEL_GAP;
  const aboveY = point[1] - boxHeight - 6;
  const preferredY = centerY < edge ? belowY : centerY + boxHeight > chartHeight - edge ? aboveY : centerY;

  return {
    x: clamp(preferredX, edge, Math.max(edge, chartWidth - boxWidth - edge)),
    y: clamp(preferredY, edge, Math.max(edge, chartHeight - boxHeight - edge)),
  };
}

function getLabelStyle(title: string, active: boolean) {
  return {
    text: title,
    fill: '#0f172a',
    font: '700 12px Roboto, system-ui, sans-serif',
    width: LABEL_WIDTH,
    overflow: 'truncate',
    ellipsis: '...',
    backgroundColor: '#ffffff',
    borderColor: active ? 'rgba(29, 78, 216, 0.5)' : 'rgba(29, 78, 216, 0.18)',
    borderWidth: 1,
    borderRadius: 10,
    padding: [7, 9],
    opacity: active ? 1 : 0.46,
    shadowBlur: active ? 18 : 8,
    shadowColor: active ? 'rgba(29, 78, 216, 0.24)' : 'rgba(17, 24, 39, 0.08)',
  };
}

function getAxisLabelText(task: MatrixTask) {
  return task.progress > 0 ? `${task.progress}% ${task.title}` : task.title;
}

function preventNativeGesture(event?: ZrPointerEvent) {
  event?.event?.preventDefault?.();
  event?.event?.stopPropagation?.();
}

function setPageDragLock(active: boolean) {
  if (active) {
    if (pageDragLockState) {
      return;
    }

    const bodyStyle = document.body.style;
    pageDragLockState = {
      left: bodyStyle.left,
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      right: bodyStyle.right,
      scrollY: window.scrollY,
      top: bodyStyle.top,
      touchAction: bodyStyle.touchAction,
      width: bodyStyle.width,
    };

    document.body.classList.add('axis-dragging');
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${pageDragLockState.scrollY}px`;
    bodyStyle.left = '0';
    bodyStyle.right = '0';
    bodyStyle.width = '100%';
    bodyStyle.overflow = 'hidden';
    bodyStyle.touchAction = 'none';
    return;
  }

  document.body.classList.remove('axis-dragging');

  if (!pageDragLockState) {
    return;
  }

  const previousState = pageDragLockState;
  const bodyStyle = document.body.style;
  pageDragLockState = null;

  bodyStyle.position = previousState.position;
  bodyStyle.top = previousState.top;
  bodyStyle.left = previousState.left;
  bodyStyle.right = previousState.right;
  bodyStyle.width = previousState.width;
  bodyStyle.overflow = previousState.overflow;
  bodyStyle.touchAction = previousState.touchAction;
  window.scrollTo(0, previousState.scrollY);
}

function setLabelState(chart: ECharts, task: MatrixTask, position: number[], active: boolean) {
  chart.setOption({
    graphic: [
      {
        id: `task-label-${task.id}`,
        ...getLabelPosition(chart, position),
        style: getLabelStyle(getAxisLabelText(task), active),
      },
    ],
  });
}

function scheduleLabelState(
  chart: ECharts,
  task: MatrixTask,
  controller: LabelFrameController,
  position: number[],
  active: boolean,
) {
  controller.position = position;
  controller.active = active;

  if (controller.pendingFrame !== null) {
    return;
  }

  controller.pendingFrame = requestAnimationFrame(() => {
    controller.pendingFrame = null;
    setLabelState(chart, task, controller.position, controller.active);
  });
}

function flushLabelState(chart: ECharts, task: MatrixTask, controller: LabelFrameController) {
  if (controller.pendingFrame !== null) {
    cancelAnimationFrame(controller.pendingFrame);
    controller.pendingFrame = null;
  }

  setLabelState(chart, task, controller.position, controller.active);
}

function buildGraphicElements(
  chart: ECharts,
  tasks: MatrixTask[],
  onMetricsChange: (taskId: string, metrics: Partial<TaskMetrics>) => void,
) {
  return tasks.flatMap((task) => {
    const position = chart.convertToPixel({ gridIndex: 0 }, [
      task.importance,
      task.urgency,
    ]) as number[];
    const labelController: LabelFrameController = {
      active: false,
      isDragging: false,
      pendingFrame: null,
      position,
    };

    return [
      {
        id: `task-${task.id}`,
        name: getAxisLabelText(task),
        type: 'circle',
        position,
        draggable: true,
        cursor: 'move',
        z: 100,
        shape: {
          cx: 0,
          cy: 0,
          r: 15,
        },
        style: {
          fill: task.completed ? '#94a3b8' : task.color,
          stroke: '#ffffff',
          lineWidth: 3,
          shadowBlur: 12,
          shadowColor: 'rgba(17, 24, 39, 0.18)',
        },
        onmouseover(this: DragElement) {
          labelController.position = this.position;
          labelController.active = true;
          flushLabelState(chart, task, labelController);
        },
        onmouseout(this: DragElement) {
          if (!labelController.isDragging) {
            labelController.position = this.position;
            labelController.active = false;
            flushLabelState(chart, task, labelController);
          }
        },
        ondragstart(this: DragElement, event: ZrPointerEvent) {
          preventNativeGesture(event);
          labelController.isDragging = true;
          labelController.position = this.position;
          labelController.active = true;
          setPageDragLock(true);
          flushLabelState(chart, task, labelController);
        },
        ondrag(this: DragElement, event: ZrPointerEvent) {
          preventNativeGesture(event);

          if (!labelController.isDragging) {
            labelController.isDragging = true;
            setPageDragLock(true);
          }

          this.position = clampPixelPosition(chart, this.position);
          scheduleLabelState(chart, task, labelController, this.position, true);
          this.dirty?.();
        },
        ondragend(this: DragElement, event: ZrPointerEvent) {
          preventNativeGesture(event);

          const { metrics, snappedPosition } = getDropState(chart, this.position);
          this.position = snappedPosition;
          labelController.isDragging = false;
          labelController.position = this.position;
          labelController.active = true;
          setPageDragLock(false);
          flushLabelState(chart, task, labelController);
          this.dirty?.();
          onMetricsChange(task.id, metrics);
        },
      },
      {
        id: `task-label-${task.id}`,
        type: 'text',
        silent: true,
        z: 101,
        ...getLabelPosition(chart, position),
        style: getLabelStyle(getAxisLabelText(task), false),
      },
    ];
  });
}

function buildBaseOption(tasks: MatrixTask[]): EChartsCoreOption {
  return {
    animation: false,
    tooltip: { show: false },
    grid: {
      left: 50,
      right: 28,
      top: 34,
      bottom: 46,
      containLabel: false,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '重要程度',
      nameLocation: 'middle',
      nameGap: 28,
      axisLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#e3e9f1',
        },
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '紧急程度',
      nameLocation: 'middle',
      nameGap: 36,
      axisLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#e3e9f1',
        },
      },
    },
    series: [
      {
        type: 'scatter',
        data: tasks.map((task) => ({
          name: getAxisLabelText(task),
          value: [task.importance, task.urgency],
          itemStyle: {
            color: task.completed ? '#94a3b8' : task.color,
            opacity: 0.16,
          },
        })),
        tooltip: {
          show: false,
        },
        label: { show: false },
        markLine: {
          silent: true,
          symbol: 'none',
          label: { show: false },
          lineStyle: {
            color: '#253044',
            width: 1.2,
            opacity: 0.68,
            type: 'solid',
          },
          data: [
            { xAxis: 50 },
            { yAxis: 50 },
          ],
        },
        symbolSize: 18,
      },
    ],
  };
}

export function PriorityAxis({ tasks, onMetricsChange }: PriorityAxisProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const onMetricsChangeRef = useRef(onMetricsChange);
  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.showOnAxis && !task.completed),
    [tasks],
  );
  const visibleTasksRef = useRef(visibleTasks);

  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  useEffect(() => {
    visibleTasksRef.current = visibleTasks;
  }, [visibleTasks]);

  const renderGraphicOverlay = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    chart.setOption({
      graphic: buildGraphicElements(chart, visibleTasksRef.current, (taskId, metrics) =>
        onMetricsChangeRef.current(taskId, metrics),
      ),
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const chart = echarts.init(container);
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
      requestAnimationFrame(renderGraphicOverlay);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      setPageDragLock(false);
      chart.dispose();
      chartRef.current = null;
    };
  }, [renderGraphicOverlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let isTouchingAxis = false;
    const nonPassiveOptions: AddEventListenerOptions = { capture: true, passive: false };
    const passiveOptions: AddEventListenerOptions = { capture: true, passive: true };

    const releaseAxisTouch = () => {
      isTouchingAxis = false;
      container.classList.remove('is-touching');
      setPageDragLock(false);
    };

    const handleAxisTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        releaseAxisTouch();
        return;
      }

      isTouchingAxis = true;
      container.classList.add('is-touching');
      setPageDragLock(true);
    };

    const handleGlobalTouchMove = (event: TouchEvent) => {
      if (!isTouchingAxis || !event.cancelable) {
        return;
      }

      event.preventDefault();
    };

    container.addEventListener('touchstart', handleAxisTouchStart, nonPassiveOptions);
    document.addEventListener('touchmove', handleGlobalTouchMove, nonPassiveOptions);
    document.addEventListener('touchend', releaseAxisTouch, passiveOptions);
    document.addEventListener('touchcancel', releaseAxisTouch, passiveOptions);
    window.addEventListener('blur', releaseAxisTouch, passiveOptions);

    return () => {
      container.removeEventListener('touchstart', handleAxisTouchStart, nonPassiveOptions);
      document.removeEventListener('touchmove', handleGlobalTouchMove, nonPassiveOptions);
      document.removeEventListener('touchend', releaseAxisTouch, passiveOptions);
      document.removeEventListener('touchcancel', releaseAxisTouch, passiveOptions);
      window.removeEventListener('blur', releaseAxisTouch, passiveOptions);
      releaseAxisTouch();
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    chart.setOption(buildBaseOption(visibleTasks), true);
    requestAnimationFrame(renderGraphicOverlay);
  }, [renderGraphicOverlay, visibleTasks]);

  return (
    <Paper
      aria-label="紧急程度和重要程度坐标轴"
      component="section"
      variant="outlined"
      sx={{
        boxShadow: '0 18px 45px rgba(17, 24, 39, 0.06)',
        display: 'grid',
        gap: 1.5,
        minHeight: { xs: 0, lg: 'calc(100vh - 132px)' },
        overflow: 'hidden',
        p: { xs: 1.25, md: 1.5 },
        position: { xs: 'static', lg: 'sticky' },
        top: 18,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2">优先级坐标轴</Typography>
          <Typography color="text.secondary" variant="body2">
            纵轴是紧急程度，横轴是重要程度。
          </Typography>
        </Box>
        <Chip
          label={`${visibleTasks.length} 项显示`}
          size="small"
          sx={{ bgcolor: 'rgba(29, 78, 216, 0.08)', color: 'primary.dark', fontWeight: 700 }}
        />
      </Stack>

      <Box className="axis-frame">
        <Box className="axis-chart" ref={containerRef} role="img" aria-label="任务优先级散点图" />
        {!visibleTasks.length ? (
          <Box className="axis-empty">
            <TouchAppRoundedIcon color="disabled" />
            <Typography color="text.secondary" variant="body2">
              在 TODO 中打开“显示在坐标轴中”后会出现在这里
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
