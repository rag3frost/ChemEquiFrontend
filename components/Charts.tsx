
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  RadialLinearScale,
  ScriptableContext
} from 'chart.js';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import { COLORS } from '../constants';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Custom glassmorphism tooltip handler
const getOrCreateTooltip = (chart: ChartJS) => {
  let tooltipEl = chart.canvas.parentNode?.querySelector('.chartjs-tooltip') as HTMLDivElement;

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chartjs-tooltip';
    tooltipEl.style.cssText = `
      position: absolute;
      pointer-events: none;
      transition: all 0.15s ease;
      opacity: 0;
      z-index: 100;
    `;
    chart.canvas.parentNode?.appendChild(tooltipEl);
  }

  return tooltipEl;
};

const externalTooltipHandler = (context: any, unit: string, isDarkMode: boolean) => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  // Get data
  const dataPoints = tooltip.dataPoints || [];
  if (dataPoints.length === 0) return;

  const point = dataPoints[0];
  const label = point.label || point.dataset?.label || '';

  // For horizontal bar charts, value is in parsed.x; for vertical charts, it's in parsed.y
  // Also check for raw value as fallback
  let value = point.raw;
  if (point.parsed !== undefined) {
    // Horizontal bar chart (indexAxis: 'y') stores value in x
    // Vertical bar/line chart stores value in y
    if (typeof point.parsed === 'object') {
      value = point.parsed.x !== undefined && point.parsed.y !== undefined
        ? (chart.options?.indexAxis === 'y' ? point.parsed.x : point.parsed.y)
        : point.parsed.x ?? point.parsed.y ?? point.raw;
    } else {
      value = point.parsed;
    }
  }

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  // Build tooltip HTML with enhanced glassmorphism
  tooltipEl.innerHTML = `
    <div style="
      background: ${isDarkMode
      ? 'linear-gradient(135deg, rgba(30, 30, 35, 0.75) 0%, rgba(40, 40, 48, 0.85) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 250, 252, 0.95) 100%)'};
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 24px;
      padding: 20px 24px;
      min-width: 180px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, ${isDarkMode ? '0.35' : '0.15'}),
        0 2px 8px rgba(0, 0, 0, ${isDarkMode ? '0.2' : '0.08'}),
        inset 0 1px 0 ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)'},
        inset 0 -1px 0 ${isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)'};
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${isDarkMode ? '#6B7280' : '#9CA3AF'};
          box-shadow: 0 0 4px ${isDarkMode ? 'rgba(107, 114, 128, 0.5)' : 'rgba(156, 163, 175, 0.5)'};
        "></div>
        <span style="
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
          text-transform: uppercase;
        ">PRECISE TIMESTAMP</span>
      </div>
      <div style="
        font-size: 20px;
        font-weight: 700;
        color: ${isDarkMode ? '#FFFFFF' : '#141416'};
        margin-bottom: 16px;
        font-family: 'Plus Jakarta Sans', sans-serif;
      ">${label}</div>
      
      <div style="
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
      ">
        <span style="
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
          text-transform: uppercase;
        ">MEASURED VALUE</span>
        <span style="
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #0B0B0C;
          background: #E6F76A;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(230, 247, 106, 0.4);
        ">LIVE</span>
      </div>
      <div style="
        display: flex;
        align-items: baseline;
        gap: 6px;
      ">
        <span style="
          font-size: 32px;
          font-weight: 800;
          color: ${isDarkMode ? '#FFFFFF' : '#141416'};
          line-height: 1;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-feature-settings: 'tnum';
        ">${formattedValue}</span>
        <span style="
          font-size: 14px;
          font-weight: 600;
          color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
          text-transform: uppercase;
        ">${unit}</span>
      </div>
    </div>
  `;

  // Position tooltip
  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.transform = 'translate(-50%, -110%)';
};

// Custom dashed grid plugin for line/area charts
const dashedGridPlugin = {
  id: 'dashedGrid',
  beforeDraw: (chart: any) => {
    const ctx = chart.ctx;
    const yAxis = chart.scales.y;
    const xAxis = chart.scales.x;

    if (!yAxis || !xAxis) return;

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Draw horizontal dashed lines at each y-axis tick
    yAxis.ticks.forEach((_: any, index: number) => {
      const y = yAxis.getPixelForTick(index);
      ctx.beginPath();
      ctx.moveTo(xAxis.left, y);
      ctx.lineTo(xAxis.right, y);
      ctx.stroke();
    });

    ctx.restore();
  }
};

// Crosshair plugin for line/area charts
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw: (chart: any) => {
    if (chart.tooltip?._active?.length) {
      const ctx = chart.ctx;
      const activePoint = chart.tooltip._active[0];
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      const isDark = document.documentElement.classList.contains('dark');

      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(20, 20, 22, 0.2)';
      ctx.stroke();
      ctx.restore();
    }
  }
};

interface ChartProps {
  data: any[];
  type: 'bar' | 'line' | 'area' | 'pie';
  dataKey: string;
  categoryKey: string;
  color?: string;
  unit?: string;
  isDarkMode?: boolean;
}

interface MultiLineChartProps {
  datasets: {
    label: string;
    data: { timestamp: string; value: number }[];
    color: string;
    unit: string;
  }[];
  isDarkMode?: boolean;
}

// Vibrant, eye-pleasing palette with soft gradients
const BAR_PALETTE = [
  '#E6F76A', // Primary Lime (brand color)
  '#6EE7B7', // Fresh Mint
  '#FBBF24', // Warm Amber
  '#60A5FA', // Soft Blue
  '#A78BFA', // Soft Violet
  '#F472B6', // Soft Pink
];

// Multi-line tooltip handler
const multiLineTooltipHandler = (context: any, isDarkMode: boolean) => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const dataPoints = tooltip.dataPoints || [];
  if (dataPoints.length === 0) return;

  const timestamp = dataPoints[0].label || '';

  // Build rows for each dataset with compact styling
  const rows = dataPoints.map((point: any, index: number) => {
    const datasetLabel = point.dataset.label || '';
    const value = typeof point.raw === 'number' ? point.raw.toLocaleString(undefined, { maximumFractionDigits: 2 }) : point.raw;
    const color = point.dataset.borderColor;
    const unit = point.dataset.unit || '';

    return `
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
        ${index < dataPoints.length - 1 ? `border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};` : ''}
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 0 6px ${color}60;
          "></div>
          <span style="
            font-size: 11px;
            font-weight: 600;
            color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${datasetLabel}</span>
        </div>
        <div style="display: flex; align-items: baseline; gap: 4px;">
          <span style="
            font-size: 14px;
            font-weight: 700;
            color: ${isDarkMode ? '#FFFFFF' : '#141416'};
            font-feature-settings: 'tnum';
          ">${value}</span>
          <span style="
            font-size: 10px;
            font-weight: 600;
            color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
            text-transform: uppercase;
          ">${unit}</span>
        </div>
      </div>
    `;
  }).join('');

  tooltipEl.innerHTML = `
    <div style="
      background: ${isDarkMode
      ? 'linear-gradient(135deg, rgba(30, 30, 35, 0.75) 0%, rgba(40, 40, 48, 0.85) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 250, 252, 0.95) 100%)'};
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 20px;
      padding: 16px 20px;
      min-width: 220px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, ${isDarkMode ? '0.35' : '0.15'}),
        0 2px 8px rgba(0, 0, 0, ${isDarkMode ? '0.2' : '0.08'}),
        inset 0 1px 0 ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)'},
        inset 0 -1px 0 ${isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)'};
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${isDarkMode ? '#6B7280' : '#9CA3AF'};
          box-shadow: 0 0 4px ${isDarkMode ? 'rgba(107, 114, 128, 0.5)' : 'rgba(156, 163, 175, 0.5)'};
        "></div>
        <span style="
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
          text-transform: uppercase;
        ">COMPARATIVE ANALYSIS</span>
        <span style="
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #0B0B0C;
          background: #E6F76A;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          box-shadow: 0 2px 6px rgba(230, 247, 106, 0.4);
          margin-left: auto;
        ">MULTI</span>
      </div>
      <div style="
        font-size: 14px;
        font-weight: 700;
        color: ${isDarkMode ? '#FFFFFF' : '#141416'};
        margin-bottom: 12px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        padding-bottom: 8px;
        border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'};
      ">${timestamp}</div>
      ${rows}
    </div>
  `;

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.transform = 'translate(-50%, -110%)';
};

// Multi-Line Chart Component
export const MultiLineChart: React.FC<MultiLineChartProps> = ({ datasets, isDarkMode = false }) => {
  const tickColor = isDarkMode ? '#D1D5DB' : '#1F2937';

  // Get all unique timestamps and sort them chronologically
  const allTimestamps = [...new Set(datasets.flatMap(ds => ds.data.map(d => d.timestamp)))].sort((a, b) => {
    // Parse timestamps like "May 1", "May 2", etc.
    const parseTimestamp = (ts: string) => {
      const parts = ts.split(' ');
      if (parts.length === 2) {
        const month = parts[0];
        const day = parseInt(parts[1]);
        // Simple month mapping for common months
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const monthIndex = monthMap[month] ?? 0;
        return monthIndex * 31 + day; // Simple chronological ordering
      }
      return 0;
    };

    return parseTimestamp(a) - parseTimestamp(b);
  });

  const chartData = useMemo(() => ({
    labels: allTimestamps,
    datasets: datasets.map((ds, index) => ({
      label: ds.label,
      data: allTimestamps.map(ts => {
        const point = ds.data.find(d => d.timestamp === ts);
        return point ? point.value : null;
      }),
      borderColor: ds.color,
      backgroundColor: (context: ScriptableContext<'line'>) => {
        const ctx = context.chart.ctx;
        const chartArea = context.chart.chartArea;
        if (!chartArea) return ds.color;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        // Gradient fill under the chart line using the line color
        if (isDarkMode) {
          gradient.addColorStop(0, ds.color + 'CC'); // ~80% opacity
          gradient.addColorStop(0.3, ds.color + '66'); // ~40% opacity
          gradient.addColorStop(0.6, ds.color + '33'); // ~20% opacity
          gradient.addColorStop(1, ds.color + '0D'); // ~5% opacity
        } else {
          gradient.addColorStop(0, ds.color + '4D'); // ~30% opacity
          gradient.addColorStop(0.3, ds.color + '26'); // ~15% opacity
          gradient.addColorStop(0.6, ds.color + '0D'); // ~5% opacity
          gradient.addColorStop(1, ds.color + '03'); // ~1% opacity
        }
        return gradient;
      },
      fill: index === 0 ? 'origin' : '-1', // Fill to baseline for first dataset, to previous dataset for others
      tension: 0.4,
      borderWidth: 5,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: ds.color,
      pointHoverBorderColor: isDarkMode ? '#0B0B0C' : '#FFFFFF',
      pointHoverBorderWidth: 3,
      unit: ds.unit,
    }))
  }), [datasets, allTimestamps, isDarkMode]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    hover: {
      mode: 'index' as const,
      intersect: false,
    },
    onHover: (event: any, elements: any[]) => {
      const target = event?.native?.target;
      if (target) {
        target.style.cursor = elements.length > 0 ? 'crosshair' : 'default';
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 11,
            weight: 'bold' as any,
            family: 'Plus Jakarta Sans'
          }
        }
      },
      tooltip: {
        enabled: false,
        external: (context: any) => multiLineTooltipHandler(context, isDarkMode),
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 10, weight: 700, family: 'Plus Jakarta Sans' },
          maxRotation: 45,
        }
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 11, weight: 700, family: 'Plus Jakarta Sans' }
        }
      }
    }
  };

  return (
    <div className="h-[280px] sm:h-[360px] w-full">
      <Line data={chartData} options={options} plugins={[dashedGridPlugin, crosshairPlugin]} />
    </div>
  );
};

export const Chart: React.FC<ChartProps> = ({ data, type, dataKey, categoryKey, color = COLORS.primary, unit = "Units", isDarkMode = false }) => {
  const tickColor = isDarkMode ? '#D1D5DB' : '#1F2937';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const labelColor = isDarkMode ? '#F3F4F6' : '#1F2937';

  // Component shared styles
  const commonOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        external: (context: any) => externalTooltipHandler(context, unit, isDarkMode),
      }
    }
  };

  if (type === 'bar') {
    const chartData = {
      labels: data.map(d => d[categoryKey]),
      datasets: [{
        label: 'Value',
        data: data.map(d => d[dataKey]),
        backgroundColor: data.map((_, i) => BAR_PALETTE[i % BAR_PALETTE.length]),
        hoverBackgroundColor: data.map((_, i) => {
          // Brighter glow on hover
          const baseColor = BAR_PALETTE[i % BAR_PALETTE.length];
          return baseColor;
        }),
        borderRadius: 10,
        maxBarThickness: 24,
      }]
    };

    const options = {
      ...commonOptions,
      indexAxis: 'y' as const,
      layout: {
        padding: {
          left: 8,
          right: 16,
          top: 8,
          bottom: 8,
        }
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'y' as const,
        intersect: false,
      },
      hover: {
        mode: 'nearest' as const,
        intersect: false,
      },
      onHover: (event: any, elements: any[]) => {
        const target = event?.native?.target;
        if (target) {
          target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            color: gridColor,
            drawBorder: false,
            lineWidth: 1,
          },
          ticks: {
            color: tickColor,
            font: { size: 10, weight: 600, family: 'Plus Jakarta Sans' },
            padding: 4,
          },
          border: {
            display: false,
          }
        },
        y: {
          grid: { display: false },
          ticks: {
            color: tickColor,
            font: {
              size: 11,
              weight: 600,
              family: 'Plus Jakarta Sans'
            },
            padding: 8,
          },
          border: {
            display: false,
          }
        }
      },
      elements: {
        bar: {
          hoverBorderWidth: 0,
        }
      }
    };

    return (
      <div className="h-[240px] sm:h-[320px] w-full">
        <Bar data={chartData} options={options} />
      </div>
    );
  }

  if (type === 'pie') {
    const chartData = {
      labels: data.map(d => d[categoryKey]),
      datasets: [{
        data: data.map(d => d[dataKey]),
        backgroundColor: data.map((_, i) => BAR_PALETTE[i % BAR_PALETTE.length] + 'CC'),
        hoverBackgroundColor: data.map((_, i) => BAR_PALETTE[i % BAR_PALETTE.length]),
        borderColor: isDarkMode ? '#141416' : '#FFFFFF',
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverOffset: 15
      }]
    };

    const options = {
      ...commonOptions,
      interaction: {
        mode: 'nearest' as const,
        intersect: true,
      },
      onHover: (event: any, elements: any[]) => {
        const target = event?.native?.target;
        if (target) {
          target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      },
      plugins: {
        ...commonOptions.plugins,
        legend: {
          display: true,
          position: 'right' as const,
          labels: {
            color: labelColor,
            usePointStyle: true,
            padding: 20,
            font: {
              size: 10,
              weight: 'bold' as any,
              family: 'Plus Jakarta Sans'
            }
          }
        }
      }
    };

    return (
      <div style={{ height: '360px', width: '100%', padding: '20px' }}>
        <Pie data={chartData} options={options} />
      </div>
    );
  }

  // Line / Area
  const chartData = useMemo(() => ({
    labels: data.map(d => d[categoryKey] || d.timestamp),
    datasets: [{
      label: 'Performance',
      data: data.map(d => d[dataKey]),
      borderColor: color,
      backgroundColor: (context: ScriptableContext<'line'>) => {
        const ctx = context.chart.ctx;
        const chartArea = context.chart.chartArea;
        if (!chartArea) return color;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        // Gradient fill under the chart line
        if (isDarkMode) {
          // Dark mode: use line color gradient
          gradient.addColorStop(0, color + 'CC'); // ~80% opacity
          gradient.addColorStop(0.3, color + '66'); // ~40% opacity
          gradient.addColorStop(0.6, color + '33'); // ~20% opacity
          gradient.addColorStop(1, color + '0D'); // ~5% opacity
        } else {
          // Light mode: use line color gradient
          gradient.addColorStop(0, color + '4D'); // ~30% opacity
          gradient.addColorStop(0.3, color + '26'); // ~15% opacity
          gradient.addColorStop(0.6, color + '0D'); // ~5% opacity
          gradient.addColorStop(1, color + '03'); // ~1% opacity
        }
        return gradient;
      },
      fill: type === 'area',
      tension: 0.4,
      borderWidth: 6,
      pointRadius: 0,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: color,
      pointHoverBorderColor: isDarkMode ? '#0B0B0C' : '#FFFFFF',
      pointHoverBorderWidth: 4,
    }]
  }), [data, categoryKey, dataKey, color, isDarkMode, type]);

  const options = {
    ...commonOptions,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    hover: {
      mode: 'index' as const,
      intersect: false,
    },
    onHover: (event: any, elements: any[]) => {
      const target = event?.native?.target;
      if (target) {
        target.style.cursor = elements.length > 0 ? 'crosshair' : 'default';
      }
    },
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 5,
        left: 5,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: tickColor,
          font: { size: 10, weight: 600, family: 'Plus Jakarta Sans' },
          maxRotation: 0,
          maxTicksLimit: 6,
          padding: 8,
        }
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          display: false, // We use custom dashed grid plugin
        },
        ticks: {
          color: tickColor,
          font: { size: 11, weight: 700, family: 'Plus Jakarta Sans' },
          padding: 12,
          maxTicksLimit: 5,
          callback: function (value: any) {
            return value.toLocaleString();
          }
        },
        beginAtZero: false,
      }
    }
  } as any;

  return (
    <div className="h-[200px] sm:h-[260px] w-full">
      <Line data={chartData} options={options} plugins={[dashedGridPlugin, crosshairPlugin]} />
    </div>
  );
};

// ============================================================================
// RADAR CHART - Health KPI Visualization
// ============================================================================

// Custom radar tooltip handler matching other charts
const radarTooltipHandler = (context: any, labels: string[], rawValues: number[], isDarkMode: boolean) => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const dataPoints = tooltip.dataPoints || [];
  if (dataPoints.length === 0 || dataPoints[0].datasetIndex !== 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  const point = dataPoints[0];
  const idx = point.dataIndex;
  const label = labels[idx] || '';
  const normalizedVal = point.raw;
  const rawVal = rawValues[idx] !== undefined ? rawValues[idx] : 'N/A';

  // User-friendly info
  const kpiInfo: Record<string, { icon: string; unit: string }> = {
    'Flowrate': { icon: '💧', unit: 'm³/h' },
    'Pressure': { icon: '🔴', unit: 'bar' },
    'Temperature': { icon: '🌡️', unit: '°C' }
  };
  const info = kpiInfo[label] || { icon: '📊', unit: '' };

  // Status
  const status = normalizedVal >= 70
    ? { text: 'Good', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' }
    : normalizedVal >= 40
      ? { text: 'Fair', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)' }
      : { text: 'Poor', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };

  tooltipEl.innerHTML = `
    <div style="
      background: ${isDarkMode
      ? 'linear-gradient(135deg, rgba(30, 30, 35, 0.85) 0%, rgba(40, 40, 48, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 252, 0.98) 100%)'};
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 20px;
      padding: 16px 20px;
      min-width: 180px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, ${isDarkMode ? '0.4' : '0.15'}),
        0 2px 8px rgba(0, 0, 0, ${isDarkMode ? '0.2' : '0.08'});
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 20px;">${info.icon}</span>
        <span style="font-size: 16px; font-weight: 800; color: ${isDarkMode ? '#FFFFFF' : '#141416'};">${label}</span>
      </div>
      
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <span style="font-size: 10px; font-weight: 600; letter-spacing: 1px; color: ${isDarkMode ? '#9CA3AF' : '#6B7280'}; text-transform: uppercase;">Health Score</span>
        <span style="font-size: 10px; font-weight: 700; color: ${status.color}; background: ${status.bg}; padding: 3px 8px; border-radius: 6px;">${status.text}</span>
      </div>
      
      <div style="font-size: 32px; font-weight: 800; color: ${isDarkMode ? '#FFFFFF' : '#141416'}; margin-bottom: 8px;">
        ${normalizedVal}<span style="font-size: 14px; font-weight: 600; color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};">%</span>
      </div>
      
      <div style="padding-top: 10px; border-top: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'};">
        <span style="font-size: 10px; font-weight: 600; color: ${isDarkMode ? '#9CA3AF' : '#6B7280'}; text-transform: uppercase;">Current Reading</span>
        <div style="font-size: 16px; font-weight: 700; color: ${isDarkMode ? '#E6F76A' : '#4A7C10'}; margin-top: 2px;">
          ${rawVal} <span style="font-size: 11px; font-weight: 500; color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};">${info.unit}</span>
        </div>
      </div>
    </div>
  `;

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = positionX + tooltip.caretX + 'px';
  tooltipEl.style.top = positionY + tooltip.caretY + 'px';
  tooltipEl.style.transform = 'translate(-50%, -110%)';
};

interface RadarChartProps {
  labels: string[];
  values: number[];
  rawValues?: number[];
  healthScore?: number;
  isDarkMode?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  labels,
  values,
  rawValues = [],
  healthScore = 0,
  isDarkMode = false
}) => {
  const primaryColor = COLORS.primary;
  const secondaryColor = COLORS.secondary;

  // Adaptive colors based on theme
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const angleLineColor = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
  const labelColor = isDarkMode ? '#F3F4F6' : '#374151';
  const tickColor = isDarkMode ? '#9CA3AF' : '#6B7280';

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'System Health',
        data: values,
        backgroundColor: isDarkMode
          ? 'rgba(230, 247, 106, 0.15)'
          : 'rgba(74, 124, 16, 0.12)',
        borderColor: isDarkMode ? primaryColor : '#4A7C10',
        borderWidth: 3,
        pointBackgroundColor: isDarkMode ? primaryColor : '#4A7C10',
        pointBorderColor: isDarkMode ? '#141416' : '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: secondaryColor,
        pointHoverBorderColor: isDarkMode ? '#141416' : '#FFFFFF',
        pointHoverBorderWidth: 3,
      },
      // Reference line at 50% (baseline)
      {
        label: 'Baseline',
        data: labels.map(() => 50),
        backgroundColor: 'transparent',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: angleLineColor,
          lineWidth: 1,
        },
        grid: {
          color: gridColor,
          circular: true,
          lineWidth: 1,
        },
        pointLabels: {
          color: labelColor,
          font: {
            size: 11,
            weight: 700 as const,
            family: 'Plus Jakarta Sans',
          },
          padding: 15,
        },
        ticks: {
          display: false,
          stepSize: 25,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        beginAtZero: true,
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        external: (context: any) => radarTooltipHandler(context, labels, rawValues, isDarkMode),
      }
    },
    interaction: {
      mode: 'nearest' as const,
      intersect: true,
    },
    elements: {
      line: {
        tension: 0.1,
      }
    }
  };

  // User-friendly status based on health score
  const healthStatus = healthScore >= 70
    ? { emoji: '✓', text: 'System Healthy', color: 'text-green-500' }
    : healthScore >= 40
      ? { emoji: '⚠', text: 'Needs Monitoring', color: 'text-yellow-500' }
      : { emoji: '⚡', text: 'Action Required', color: 'text-red-500' };

  return (
    <div className="relative h-[280px] sm:h-[320px] w-full">
      <Radar data={chartData} options={options} />

      {/* Health Score Badge - User Friendly */}
      {healthScore > 0 && (
        <div className="absolute top-2 right-2 flex flex-col items-end">
          <div className={`
            px-3 py-2 rounded-xl
            ${isDarkMode
              ? 'bg-surface-dark border border-border-dark'
              : 'bg-surface-light border border-border-light'}
            shadow-lg
          `}>
            <span className="text-[9px] font-bold uppercase tracking-widest text-textMuted-light dark:text-textMuted-dark">
              Overall Health
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black tracking-tight ${healthScore >= 70
                  ? 'text-green-500'
                  : healthScore >= 40
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}>
                {healthScore}
              </span>
              <span className="text-xs font-bold text-textMuted-light dark:text-textMuted-dark">
                / 100
              </span>
            </div>
            <div className={`text-[10px] font-semibold ${healthStatus.color} mt-0.5`}>
              {healthStatus.emoji} {healthStatus.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DONUT CHART - Modern Pie Chart for Categorical Distribution
// ============================================================================

interface DonutChartProps {
  data: { name: string; value: number }[];
  label: string;
  isDarkMode: boolean;
}

// Donut chart color palette
const DONUT_COLORS = [
  '#E6F76A', // Primary lime
  '#8B5CF6', // Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export const DonutChart: React.FC<DonutChartProps> = ({ data, label, isDarkMode }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.value),
      backgroundColor: DONUT_COLORS.slice(0, data.length),
      borderColor: isDarkMode ? '#0B0B0C' : '#FFFFFF',
      borderWidth: 3,
      hoverBorderWidth: 4,
      hoverOffset: 8,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#FFFFFF' : '#0B0B0C',
        bodyColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: { size: 13, weight: 700, family: 'Plus Jakarta Sans' },
        bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    }
  } as any;

  return (
    <div className="relative">
      <div className="h-[220px] w-full relative">
        <Pie data={chartData} options={options} />
        {/* Center label - positioned inside chart container */}
        <div 
          className="absolute text-center pointer-events-none"
          style={{
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="text-3xl font-black text-textPrimary-light dark:text-textPrimary-dark leading-none">
            {total}
          </div>
          <div className="text-xs font-medium text-textMuted-light dark:text-textMuted-dark mt-1">
            Total
          </div>
        </div>
      </div>
      
      {/* Legend - improved spacing */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
            />
            <span className="text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark truncate max-w-[100px]">
              {item.name}
            </span>
            <span className="text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// HISTOGRAM CHART - Distribution Visualization
// ============================================================================

interface HistogramProps {
  bins: { range: string; count: number; min: number; max: number }[];
  column: string;
  stats: { mean: number; std: number; min: number; max: number };
  isDarkMode: boolean;
}

export const HistogramChart: React.FC<HistogramProps> = ({ bins, column, stats, isDarkMode }) => {
  const maxCount = Math.max(...bins.map(b => b.count));
  
  const chartData = {
    labels: bins.map(b => b.range),
    datasets: [{
      label: 'Frequency',
      data: bins.map(b => b.count),
      backgroundColor: bins.map((_, idx) => {
        // Gradient effect based on position
        const intensity = 0.6 + (idx / bins.length) * 0.4;
        return isDarkMode 
          ? `rgba(230, 247, 106, ${intensity})`
          : `rgba(139, 92, 246, ${intensity})`;
      }),
      borderColor: isDarkMode ? '#E6F76A' : '#8B5CF6',
      borderWidth: 1,
      borderRadius: 4,
      barPercentage: 0.9,
      categoryPercentage: 0.95,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#FFFFFF' : '#0B0B0C',
        bodyColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: { size: 13, weight: 700, family: 'Plus Jakarta Sans' },
        bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
        callbacks: {
          title: function(context: any) {
            return `Range: ${context[0].label}`;
          },
          label: function(context: any) {
            const count = context.raw;
            const total = bins.reduce((sum, b) => sum + b.count, 0);
            const percentage = ((count / total) * 100).toFixed(1);
            return `Count: ${count} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? '#6B7280' : '#9CA3AF',
          font: { size: 8, weight: 600, family: 'Plus Jakarta Sans' },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 6,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDarkMode ? '#6B7280' : '#9CA3AF',
          font: { size: 10, weight: 600, family: 'Plus Jakarta Sans' },
          stepSize: Math.ceil(maxCount / 5),
        }
      }
    }
  } as any;

  return (
    <div>
      <div className="h-[220px] w-full">
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Stats footer */}
      <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-[10px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase">Mean</div>
          <div className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark">{stats.mean}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase">Std</div>
          <div className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark">{stats.std}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase">Min</div>
          <div className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark">{stats.min}</div>
        </div>
        <div>
          <div className="text-[10px] font-medium text-textMuted-light dark:text-textMuted-dark uppercase">Max</div>
          <div className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark">{stats.max}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GROUPED BAR CHART - Compare Metrics by Category
// ============================================================================

interface GroupedBarChartProps {
  groups: string[];
  datasets: { label: string; values: number[] }[];
  title: string;
  groupBy: string;
  isDarkMode: boolean;
}

const GROUPED_COLORS = [
  { bg: 'rgba(230, 247, 106, 0.8)', border: '#E6F76A' },  // Lime
  { bg: 'rgba(139, 92, 246, 0.8)', border: '#8B5CF6' },   // Purple
  { bg: 'rgba(16, 185, 129, 0.8)', border: '#10B981' },   // Emerald
  { bg: 'rgba(245, 158, 11, 0.8)', border: '#F59E0B' },   // Amber
  { bg: 'rgba(59, 130, 246, 0.8)', border: '#3B82F6' },   // Blue
];

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({ 
  groups, 
  datasets, 
  title, 
  groupBy,
  isDarkMode 
}) => {
  const chartData = {
    labels: groups,
    datasets: datasets.map((ds, idx) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: GROUPED_COLORS[idx % GROUPED_COLORS.length].bg,
      borderColor: GROUPED_COLORS[idx % GROUPED_COLORS.length].border,
      borderWidth: 2,
      borderRadius: 6,
      barPercentage: 0.8,
      categoryPercentage: 0.85,
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          font: { size: 11, weight: 600, family: 'Plus Jakarta Sans' },
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 3,
          useBorderRadius: true,
          padding: 16,
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDarkMode ? 'rgba(30, 30, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#FFFFFF' : '#0B0B0C',
        bodyColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
        titleFont: { size: 13, weight: 700, family: 'Plus Jakarta Sans' },
        bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? '#6B7280' : '#9CA3AF',
          font: { size: 10, weight: 600, family: 'Plus Jakarta Sans' },
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDarkMode ? '#6B7280' : '#9CA3AF',
          font: { size: 10, weight: 600, family: 'Plus Jakarta Sans' },
        }
      }
    }
  } as any;

  return (
    <div className="h-[280px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};
