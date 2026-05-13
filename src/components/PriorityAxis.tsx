import { MousePointer2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import type { ECharts, EChartsCoreOption } from 'echarts/core';
import { GridComponent, GraphicComponent, MarkLineComponent } from 'echarts/components';
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
  onMetricsChange: (taskId: string, metrics: TaskMetrics) => void;
}

interface DragElement {
  position: number[];
  dirty?: () => void;
}

const LABEL_WIDTH = 160;
const LABEL_HEIGHT = 32;
const LABEL_GAP = 18;
const LABEL_PADDING_X = 18;
const LABEL_PADDING_Y = 14;

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
    font: '700 12px Inter, system-ui, sans-serif',
    width: LABEL_WIDTH,
    overflow: 'truncate',
    ellipsis: '...',
    backgroundColor: '#ffffff',
    borderColor: active ? 'rgba(37, 99, 235, 0.42)' : 'rgba(37, 99, 235, 0.24)',
    borderWidth: 1,
    borderRadius: 8,
    padding: [7, 9],
    opacity: active ? 1 : 0.46,
    shadowBlur: active ? 16 : 8,
    shadowColor: active ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.08)',
  };
}

function setLabelState(chart: ECharts, task: MatrixTask, position: number[], active: boolean) {
  chart.setOption({
    graphic: [
      {
        id: `task-label-${task.id}`,
        ...getLabelPosition(chart, position),
        style: getLabelStyle(task.title, active),
      },
    ],
  });
}

function buildGraphicElements(
  chart: ECharts,
  tasks: MatrixTask[],
  onMetricsChange: (taskId: string, metrics: TaskMetrics) => void,
) {
  return tasks.flatMap((task) => {
    const position = chart.convertToPixel({ gridIndex: 0 }, [
      task.importance,
      task.urgency,
    ]) as number[];

    return [
      {
        id: `task-${task.id}`,
        name: task.title,
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
          fill: task.completed ? '#94a3b8' : '#2563eb',
          stroke: '#ffffff',
          lineWidth: 3,
          shadowBlur: 12,
          shadowColor: 'rgba(37, 99, 235, 0.25)',
        },
        onmouseover(this: DragElement) {
          setLabelState(chart, task, this.position, true);
        },
        onmouseout(this: DragElement) {
          setLabelState(chart, task, this.position, false);
        },
        ondragstart(this: DragElement) {
          setLabelState(chart, task, this.position, true);
        },
        ondrag(this: DragElement) {
          this.position = clampPixelPosition(chart, this.position);
          setLabelState(chart, task, this.position, true);
          this.dirty?.();
        },
        ondragend(this: DragElement) {
          const { metrics, snappedPosition } = getDropState(chart, this.position);
          this.position = snappedPosition;
          setLabelState(chart, task, this.position, true);
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
        style: getLabelStyle(task.title, false),
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
          color: '#e5edf7',
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
          color: '#e5edf7',
        },
      },
    },
    series: [
      {
        type: 'scatter',
        data: tasks.map((task) => ({
          name: task.title,
          value: [task.importance, task.urgency],
          itemStyle: {
            color: task.completed ? '#94a3b8' : '#2563eb',
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
            color: '#111827',
            width: 1.4,
            opacity: 0.72,
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
      chart.dispose();
      chartRef.current = null;
    };
  }, [renderGraphicOverlay]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    chart.setOption(buildBaseOption(visibleTasks), true);
    requestAnimationFrame(renderGraphicOverlay);
  }, [renderGraphicOverlay, visibleTasks]);

  return (
    <section className="axis-panel" aria-label="紧急程度和重要程度坐标轴">
      <div className="section-heading">
        <div>
          <h2>优先级坐标轴</h2>
          <p>纵轴是紧急程度，横轴是重要程度。</p>
        </div>
        <span>{visibleTasks.length} 项显示</span>
      </div>

      <div className="axis-frame">
        <div className="axis-chart" ref={containerRef} role="img" aria-label="任务优先级散点图" />
        {!visibleTasks.length ? (
          <div className="axis-empty">
            <MousePointer2 size={24} aria-hidden="true" />
            <p>在 TODO 中打开“显示在坐标轴上”后会出现在这里</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
