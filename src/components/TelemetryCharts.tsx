import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { MeshNode, TelemetrySample } from '../types/network';

interface TimeSeriesChartProps {
  samples: TelemetrySample[];
  isDark: boolean;
}

interface NodeChartProps {
  nodes: MeshNode[];
  isDark: boolean;
  metric: 'latency' | 'throughput' | 'rssi';
}

function getThemeColors(isDark: boolean) {
  return {
    text: isDark ? '#94a3b8' : '#475569',
    grid: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    tooltipBorder: isDark ? '#334155' : '#cbd5e1',
  };
}

export function LatencyChart({ samples, isDark }: TimeSeriesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = getThemeColors(isDark);

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: samples.map((s) => s.timeLabel),
        datasets: [
          {
            label: 'Avg Latency (ms)',
            data: samples.map((s) => s.avgLatencyMs),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: true,
          },
          {
            label: 'P95 Latency (ms)',
            data: samples.map((s) => s.p95LatencyMs),
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 1.75,
            borderDash: [4, 4],
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
          },
          {
            label: 'Jitter (ms)',
            data: samples.map((s) => s.jitterMs),
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: palette.text,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              font: { family: "'DM Sans', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: palette.tooltipBg,
            titleColor: palette.tooltipText,
            bodyColor: palette.tooltipText,
            borderColor: palette.tooltipBorder,
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            ticks: {
              color: palette.text,
              maxTicksLimit: 6,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: palette.text,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: (v) => `${v} ms`,
            },
            grid: { color: palette.grid },
          },
        },
      },
    });

    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const palette = getThemeColors(isDark);

    chart.data.labels = samples.map((s) => s.timeLabel);
    chart.data.datasets[0].data = samples.map((s) => s.avgLatencyMs);
    chart.data.datasets[1].data = samples.map((s) => s.p95LatencyMs);
    chart.data.datasets[2].data = samples.map((s) => s.jitterMs);

    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = palette.text;
    }
    if (chart.options.plugins?.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = palette.tooltipBg;
      chart.options.plugins.tooltip.titleColor = palette.tooltipText;
      chart.options.plugins.tooltip.bodyColor = palette.tooltipText;
      chart.options.plugins.tooltip.borderColor = palette.tooltipBorder;
    }
    if (chart.options.scales?.x?.ticks) {
      chart.options.scales.x.ticks.color = palette.text;
    }
    if (chart.options.scales?.y?.ticks && chart.options.scales?.y?.grid) {
      chart.options.scales.y.ticks.color = palette.text;
      chart.options.scales.y.grid.color = palette.grid;
    }

    chart.update('none');
  }, [samples, isDark]);

  return <canvas ref={canvasRef} />;
}

export function ThroughputChart({ samples, isDark }: TimeSeriesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = getThemeColors(isDark);

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: samples.map((s) => s.timeLabel),
        datasets: [
          {
            label: 'Throughput (Mbps)',
            data: samples.map((s) => s.throughputMbps),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.14)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Effective Goodput (Mbps)',
            data: samples.map((s) => s.goodputMbps),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.08)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: palette.text,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              font: { family: "'DM Sans', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: palette.tooltipBg,
            titleColor: palette.tooltipText,
            bodyColor: palette.tooltipText,
            borderColor: palette.tooltipBorder,
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            ticks: {
              color: palette.text,
              maxTicksLimit: 6,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: palette.text,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: (v) => `${v} Mbps`,
            },
            grid: { color: palette.grid },
          },
        },
      },
    });

    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const palette = getThemeColors(isDark);

    chart.data.labels = samples.map((s) => s.timeLabel);
    chart.data.datasets[0].data = samples.map((s) => s.throughputMbps);
    chart.data.datasets[1].data = samples.map((s) => s.goodputMbps);

    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = palette.text;
    }
    if (chart.options.plugins?.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = palette.tooltipBg;
      chart.options.plugins.tooltip.titleColor = palette.tooltipText;
      chart.options.plugins.tooltip.bodyColor = palette.tooltipText;
      chart.options.plugins.tooltip.borderColor = palette.tooltipBorder;
    }
    if (chart.options.scales?.x?.ticks) {
      chart.options.scales.x.ticks.color = palette.text;
    }
    if (chart.options.scales?.y?.ticks && chart.options.scales?.y?.grid) {
      chart.options.scales.y.ticks.color = palette.text;
      chart.options.scales.y.grid.color = palette.grid;
    }

    chart.update('none');
  }, [samples, isDark]);

  return <canvas ref={canvasRef} />;
}

export function PacketLossChart({ samples, isDark }: TimeSeriesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = getThemeColors(isDark);

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: samples.map((s) => s.timeLabel),
        datasets: [
          {
            type: 'line',
            label: 'Retransmission (%)',
            data: samples.map((s) => s.retransmissionPct),
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 1.75,
            pointRadius: 0,
            tension: 0.3,
          },
          {
            type: 'bar',
            label: 'Packet Loss (%)',
            data: samples.map((s) => s.packetLossPct),
            backgroundColor: 'rgba(220, 38, 38, 0.72)',
            borderColor: '#dc2626',
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: palette.text,
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              font: { family: "'DM Sans', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: palette.tooltipBg,
            titleColor: palette.tooltipText,
            bodyColor: palette.tooltipText,
            borderColor: palette.tooltipBorder,
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            ticks: {
              color: palette.text,
              maxTicksLimit: 6,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 5,
            ticks: {
              color: palette.text,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: (v) => `${v}%`,
            },
            grid: { color: palette.grid },
          },
        },
      },
    });

    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const palette = getThemeColors(isDark);

    chart.data.labels = samples.map((s) => s.timeLabel);
    chart.data.datasets[0].data = samples.map((s) => s.retransmissionPct);
    chart.data.datasets[1].data = samples.map((s) => s.packetLossPct);

    if (chart.options.plugins?.legend?.labels) {
      chart.options.plugins.legend.labels.color = palette.text;
    }
    if (chart.options.plugins?.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = palette.tooltipBg;
      chart.options.plugins.tooltip.titleColor = palette.tooltipText;
      chart.options.plugins.tooltip.bodyColor = palette.tooltipText;
      chart.options.plugins.tooltip.borderColor = palette.tooltipBorder;
    }
    if (chart.options.scales?.x?.ticks) {
      chart.options.scales.x.ticks.color = palette.text;
    }
    if (chart.options.scales?.y?.ticks && chart.options.scales?.y?.grid) {
      chart.options.scales.y.ticks.color = palette.text;
      chart.options.scales.y.grid.color = palette.grid;
    }

    chart.update('none');
  }, [samples, isDark]);

  return <canvas ref={canvasRef} />;
}

export function NodeConnectivityChart({
  nodes,
  isDark,
  metric,
}: NodeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const getValues = (list: MeshNode[], m: NodeChartProps['metric']) => {
    if (m === 'latency') return list.map((n) => (n.status === 'offline' ? 0 : n.latencyMs));
    if (m === 'throughput') return list.map((n) => (n.status === 'offline' ? 0 : n.throughputMbps));
    return list.map((n) => (n.status === 'offline' ? 0 : n.snrDb));
  };

  const getColors = (list: MeshNode[]) =>
    list.map((n) =>
      n.status === 'offline'
        ? 'rgba(148, 163, 184, 0.35)'
        : n.status === 'degraded'
        ? 'rgba(217, 119, 6, 0.8)'
        : 'rgba(37, 99, 235, 0.8)'
    );

  const getUnit = (m: NodeChartProps['metric']) =>
    m === 'latency' ? 'ms' : m === 'throughput' ? 'Mbps' : 'dB SNR';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const palette = getThemeColors(isDark);

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: nodes.map((n) => n.id),
        datasets: [
          {
            label:
              metric === 'latency'
                ? 'Node Latency (ms)'
                : metric === 'throughput'
                ? 'Node Throughput (Mbps)'
                : 'Signal-to-Noise Ratio (dB)',
            data: getValues(nodes, metric),
            backgroundColor: getColors(nodes),
            borderRadius: 4,
            barThickness: 18,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: palette.tooltipBg,
            titleColor: palette.tooltipText,
            bodyColor: palette.tooltipText,
            borderColor: palette.tooltipBorder,
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            ticks: {
              color: palette.text,
              font: { family: "'JetBrains Mono', monospace", size: 11 },
            },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: palette.text,
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: (v) => `${v} ${getUnit(metric)}`,
            },
            grid: { color: palette.grid },
          },
        },
      },
    });

    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const palette = getThemeColors(isDark);

    chart.data.labels = nodes.map((n) => n.id);
    chart.data.datasets[0].label =
      metric === 'latency'
        ? 'Node Latency (ms)'
        : metric === 'throughput'
        ? 'Node Throughput (Mbps)'
        : 'Signal-to-Noise Ratio (dB)';
    chart.data.datasets[0].data = getValues(nodes, metric);
    chart.data.datasets[0].backgroundColor = getColors(nodes);

    if (chart.options.plugins?.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = palette.tooltipBg;
      chart.options.plugins.tooltip.titleColor = palette.tooltipText;
      chart.options.plugins.tooltip.bodyColor = palette.tooltipText;
      chart.options.plugins.tooltip.borderColor = palette.tooltipBorder;
    }
    if (chart.options.scales?.x?.ticks) {
      chart.options.scales.x.ticks.color = palette.text;
    }
    if (chart.options.scales?.y?.ticks && chart.options.scales?.y?.grid) {
      chart.options.scales.y.ticks.color = palette.text;
      chart.options.scales.y.grid.color = palette.grid;
      chart.options.scales.y.ticks.callback = (v) => `${v} ${getUnit(metric)}`;
    }

    chart.update('none');
  }, [nodes, isDark, metric]);

  return <canvas ref={canvasRef} />;
}
