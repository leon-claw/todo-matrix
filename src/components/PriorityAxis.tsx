import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import * as echarts from 'echarts/core';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { GraphicComponent, GridComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { ScatterChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import type { MatrixTask, TaskMetrics } from '../types';

echarts.use([
  GridComponent,
  GraphicComponent,
  MarkLineComponent,
  TooltipComponent,
  ScatterChart,
  CanvasRenderer,
]);

interface PriorityAxisProps {
  onInteractionEnd?: () => void;
  onInteractionStart?: () => void;
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
  raised: boolean;
}

const LABEL_Z_INDEX = 101;
const LABEL_RAISED_Z_INDEX = 1000;
const LABEL_MAX_WIDTH = 220;
const LABEL_MIN_WIDTH = 34;
const LABEL_HEIGHT = 32;
const LABEL_GAP = 14;
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

function getLabelTextWidth(title: string) {
  const textWidth = [...title].reduce((width, character) => {
    if (character === ' ') {
      return width + 4;
    }

    return width + (character.charCodeAt(0) > 255 ? 13 : 7);
  }, 0);

  return clamp(Math.ceil(textWidth), LABEL_MIN_WIDTH, LABEL_MAX_WIDTH);
}

function getLabelMetrics(title: string) {
  const width = getLabelTextWidth(title);

  return {
    boxHeight: LABEL_HEIGHT + LABEL_PADDING_Y,
    boxWidth: width + LABEL_PADDING_X,
    width,
  };
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

function getLabelPosition(chart: ECharts, point: number[], title: string) {
  const chartWidth = chart.getWidth();
  const chartHeight = chart.getHeight();
  const { boxWidth, boxHeight } = getLabelMetrics(title);
  const edge = 8;
  const centeredX = point[0] - boxWidth / 2;
  const centeredY = point[1] - boxHeight / 2;
  const candidates = [
    { x: centeredX, y: point[1] - boxHeight - LABEL_GAP },
    { x: centeredX, y: point[1] + LABEL_GAP },
    { x: point[0] + LABEL_GAP, y: centeredY },
    { x: point[0] - boxWidth - LABEL_GAP, y: centeredY },
  ];
  const visibleCandidate = candidates.find(
    (candidate) =>
      candidate.x >= edge &&
      candidate.y >= edge &&
      candidate.x + boxWidth <= chartWidth - edge &&
      candidate.y + boxHeight <= chartHeight - edge,
  );
  const preferred = visibleCandidate ?? candidates[0];

  return {
    x: clamp(preferred.x, edge, Math.max(edge, chartWidth - boxWidth - edge)),
    y: clamp(preferred.y, edge, Math.max(edge, chartHeight - boxHeight - edge)),
  };
}

function getLabelStyle(title: string, active: boolean) {
  const { width } = getLabelMetrics(title);

  return {
    text: title,
    fill: '#0f172a',
    font: '700 12px Roboto, system-ui, sans-serif',
    width,
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

function setLabelState(chart: ECharts, task: MatrixTask, position: number[], active: boolean, raised: boolean) {
  const labelText = getAxisLabelText(task);

  chart.setOption({
    graphic: [
      {
        id: `task-label-${task.id}`,
        z: raised ? LABEL_RAISED_Z_INDEX : LABEL_Z_INDEX,
        ...getLabelPosition(chart, position, labelText),
        style: getLabelStyle(labelText, active),
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
  raised: boolean,
) {
  controller.position = position;
  controller.active = active;
  controller.raised = raised;

  if (controller.pendingFrame !== null) {
    return;
  }

  controller.pendingFrame = requestAnimationFrame(() => {
    controller.pendingFrame = null;
    setLabelState(chart, task, controller.position, controller.active, controller.raised);
  });
}

function flushLabelState(chart: ECharts, task: MatrixTask, controller: LabelFrameController) {
  if (controller.pendingFrame !== null) {
    cancelAnimationFrame(controller.pendingFrame);
    controller.pendingFrame = null;
  }

  setLabelState(chart, task, controller.position, controller.active, controller.raised);
}

function buildGraphicElements(
  chart: ECharts,
  tasks: MatrixTask[],
  onMetricsChange: (taskId: string, metrics: Partial<TaskMetrics>) => void,
  onInteractionStart?: () => void,
  onInteractionEnd?: () => void,
) {
  return tasks.flatMap((task) => {
    const position = chart.convertToPixel({ gridIndex: 0 }, [
      task.importance,
      task.urgency,
    ]) as number[];
    const labelText = getAxisLabelText(task);
    const labelController: LabelFrameController = {
      active: false,
      isDragging: false,
      pendingFrame: null,
      position,
      raised: false,
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
          labelController.raised = true;
          flushLabelState(chart, task, labelController);
        },
        onmouseout(this: DragElement) {
          if (!labelController.isDragging) {
            labelController.position = this.position;
            labelController.active = false;
            labelController.raised = false;
            flushLabelState(chart, task, labelController);
          }
        },
        ondragstart(this: DragElement, event: ZrPointerEvent) {
          preventNativeGesture(event);
          labelController.isDragging = true;
          labelController.position = this.position;
          labelController.active = true;
          labelController.raised = true;
          onInteractionStart?.();
          setPageDragLock(true);
          flushLabelState(chart, task, labelController);
        },
        ondrag(this: DragElement, event: ZrPointerEvent) {
          preventNativeGesture(event);

          if (!labelController.isDragging) {
            labelController.isDragging = true;
            onInteractionStart?.();
            setPageDragLock(true);
          }

          this.position = clampPixelPosition(chart, this.position);
          scheduleLabelState(chart, task, labelController, this.position, true, true);
          this.dirty?.();
        },
        ondragend(this: DragElement, event: ZrPointerEvent) {
          preventNativeGesture(event);

          const { metrics, snappedPosition } = getDropState(chart, this.position);
          this.position = snappedPosition;
          labelController.isDragging = false;
          labelController.position = this.position;
          labelController.active = true;
          labelController.raised = false;
          setPageDragLock(false);
          flushLabelState(chart, task, labelController);
          this.dirty?.();
          onMetricsChange(task.id, metrics);
          onInteractionEnd?.();
        },
      },
      {
        id: `task-label-${task.id}`,
        type: 'text',
        silent: true,
        z: LABEL_Z_INDEX,
        ...getLabelPosition(chart, position, labelText),
        style: getLabelStyle(labelText, false),
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

export function PriorityAxis({ tasks, onInteractionEnd, onInteractionStart, onMetricsChange }: PriorityAxisProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);
  const onMetricsChangeRef = useRef(onMetricsChange);
  const onInteractionEndRef = useRef(onInteractionEnd);
  const onInteractionStartRef = useRef(onInteractionStart);
  const interactionDepthRef = useRef(0);
  const visibleTasks = useMemo(
    () => tasks.filter((task) => task.showOnAxis && !task.completed),
    [tasks],
  );
  const visibleTasksRef = useRef(visibleTasks);

  useEffect(() => {
    onMetricsChangeRef.current = onMetricsChange;
  }, [onMetricsChange]);

  useEffect(() => {
    onInteractionEndRef.current = onInteractionEnd;
  }, [onInteractionEnd]);

  useEffect(() => {
    onInteractionStartRef.current = onInteractionStart;
  }, [onInteractionStart]);

  useEffect(() => {
    visibleTasksRef.current = visibleTasks;
  }, [visibleTasks]);

  const beginInteraction = useCallback(() => {
    interactionDepthRef.current += 1;
    onInteractionStartRef.current?.();
  }, []);

  const endInteraction = useCallback(() => {
    if (interactionDepthRef.current === 0) {
      return;
    }

    interactionDepthRef.current -= 1;
    onInteractionEndRef.current?.();
  }, []);

  const releaseAllInteractions = useCallback(() => {
    while (interactionDepthRef.current > 0) {
      interactionDepthRef.current -= 1;
      onInteractionEndRef.current?.();
    }
  }, []);

  const renderGraphicOverlay = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    chart.setOption({
      graphic: buildGraphicElements(
        chart,
        visibleTasksRef.current,
        (taskId, metrics) => onMetricsChangeRef.current(taskId, metrics),
        beginInteraction,
        endInteraction,
      ),
    });
  }, [beginInteraction, endInteraction]);

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
      releaseAllInteractions();
      setPageDragLock(false);
      chart.dispose();
      chartRef.current = null;
    };
  }, [releaseAllInteractions, renderGraphicOverlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let isTouchingAxis = false;
    const nonPassiveOptions: AddEventListenerOptions = { capture: true, passive: false };
    const passiveOptions: AddEventListenerOptions = { capture: true, passive: true };

    const releaseAxisTouch = () => {
      const wasTouchingAxis = isTouchingAxis;
      isTouchingAxis = false;
      container.classList.remove('is-touching');
      setPageDragLock(false);
      if (wasTouchingAxis) {
        endInteraction();
      }
    };

    const handleAxisTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        releaseAxisTouch();
        return;
      }

      if (!isTouchingAxis) {
        beginInteraction();
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
  }, [beginInteraction, endInteraction]);

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
