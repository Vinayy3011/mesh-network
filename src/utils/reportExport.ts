import {
  DiagnosticEvent,
  MeshLinkEdge,
  MeshNode,
  SimulationConfig,
  TelemetrySample,
} from '../types/network';

export type ReportFormat = 'csv' | 'json' | 'html';

export interface ReportExportInput {
  reportTitle: string;
  operatorNote: string;
  nodes: MeshNode[];
  links: MeshLinkEdge[];
  samples: TelemetrySample[];
  events: DiagnosticEvent[];
  config: SimulationConfig;
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsv(value: string | number | boolean | null | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function computeSummaryStats(samples: TelemetrySample[]) {
  if (samples.length === 0) {
    return {
      minLatency: 0,
      avgLatency: 0,
      maxLatency: 0,
      p95Latency: 0,
      avgLoss: 0,
      maxLoss: 0,
      avgThroughput: 0,
      peakThroughput: 0,
      avgGoodput: 0,
      avgRssi: -95,
    };
  }

  const latencies = samples.map((s) => s.avgLatencyMs);
  const p95s = samples.map((s) => s.p95LatencyMs);
  const losses = samples.map((s) => s.packetLossPct);
  const throughputs = samples.map((s) => s.throughputMbps);
  const goodputs = samples.map((s) => s.goodputMbps);
  const rssis = samples.map((s) => s.avgRssiDbm);

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return {
    minLatency: Number(Math.min(...latencies).toFixed(1)),
    avgLatency: Number(avg(latencies).toFixed(1)),
    maxLatency: Number(Math.max(...latencies).toFixed(1)),
    p95Latency: Number(avg(p95s).toFixed(1)),
    avgLoss: Number(avg(losses).toFixed(2)),
    maxLoss: Number(Math.max(...losses).toFixed(2)),
    avgThroughput: Number(avg(throughputs).toFixed(1)),
    peakThroughput: Number(Math.max(...throughputs).toFixed(1)),
    avgGoodput: Number(avg(goodputs).toFixed(1)),
    avgRssi: Number(avg(rssis).toFixed(1)),
  };
}

export function exportNetworkReport(format: ReportFormat, data: ReportExportInput) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const summary = computeSummaryStats(data.samples);

  if (format === 'json') {
    const payload = {
      generatedAt: new Date().toISOString(),
      reportTitle: data.reportTitle,
      operatorNote: data.operatorNote,
      simulationConfig: data.config,
      summaryMetrics: summary,
      nodes: data.nodes,
      links: data.links,
      telemetrySamples: data.samples,
      diagnosticEvents: data.events,
    };
    triggerDownload(
      `meshpulse-diagnostic-${stamp}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
    return;
  }

  if (format === 'csv') {
    const lines: string[] = [];
    lines.push('SECTION,SUMMARY_METRIC,VALUE,UNIT');
    lines.push(`Summary,Report Title,${escapeCsv(data.reportTitle)},text`);
    lines.push(`Summary,Generated At,${escapeCsv(new Date().toISOString())},ISO8601`);
    lines.push(`Summary,Traffic Profile,${escapeCsv(data.config.trafficProfile)},mode`);
    lines.push(`Summary,RF Interference Level,${data.config.interferenceLevel},%`);
    lines.push(`Summary,Samples Captured,${data.samples.length},count`);
    lines.push(`Summary,Average Latency,${summary.avgLatency},ms`);
    lines.push(`Summary,P95 Latency,${summary.p95Latency},ms`);
    lines.push(`Summary,Average Packet Loss,${summary.avgLoss},%`);
    lines.push(`Summary,Average Throughput,${summary.avgThroughput},Mbps`);
    lines.push(`Summary,Peak Throughput,${summary.peakThroughput},Mbps`);
    lines.push(`Summary,Average RSSI,${summary.avgRssi},dBm`);
    if (data.operatorNote.trim()) {
      lines.push(`Summary,Operator Note,${escapeCsv(data.operatorNote)},text`);
    }

    lines.push('');
    lines.push(
      'NODE_ID,NAME,ROLE,STATUS,IP_ADDRESS,BAND,CHANNEL,HOPS,UPLINK,RSSI_DBM,SNR_DB,LATENCY_MS,JITTER_MS,PACKET_LOSS_PCT,THROUGHPUT_MBPS,AIRTIME_PCT'
    );
    for (const n of data.nodes) {
      lines.push(
        [
          n.id,
          escapeCsv(n.name),
          n.role,
          n.status,
          n.ipAddress,
          n.band,
          n.channel,
          n.hopCount,
          n.uplinkNodeId ?? 'GATEWAY',
          n.rssiDbm,
          n.snrDb,
          n.latencyMs,
          n.jitterMs,
          n.packetLossPct,
          n.throughputMbps,
          n.airtimePct,
        ].join(',')
      );
    }

    lines.push('');
    lines.push(
      'LINK_ID,SOURCE,TARGET,ACTIVE,BAND,CHANNEL,DISTANCE_M,CAPACITY_MBPS,RSSI_DBM,SNR_DB,LATENCY_MS,LOSS_PCT,UTILIZATION_PCT'
    );
    for (const l of data.links) {
      lines.push(
        [
          l.id,
          l.source,
          l.target,
          l.active,
          l.band,
          l.channel,
          l.distanceMeters,
          l.maxCapacityMbps,
          l.currentRssi,
          l.snrDb,
          l.linkLatencyMs,
          l.linkLossPct,
          l.utilizationPct,
        ].join(',')
      );
    }

    lines.push('');
    lines.push(
      'SAMPLE_TIMESTAMP,TIME_LABEL,AVG_LATENCY_MS,P95_LATENCY_MS,JITTER_MS,PACKET_LOSS_PCT,RETRANSMISSION_PCT,THROUGHPUT_MBPS,GOODPUT_MBPS,ACTIVE_NODES,AVG_RSSI_DBM'
    );
    for (const s of data.samples) {
      lines.push(
        [
          new Date(s.timestamp).toISOString(),
          s.timeLabel,
          s.avgLatencyMs,
          s.p95LatencyMs,
          s.jitterMs,
          s.packetLossPct,
          s.retransmissionPct,
          s.throughputMbps,
          s.goodputMbps,
          s.activeNodes,
          s.avgRssiDbm,
        ].join(',')
      );
    }

    lines.push('');
    lines.push('EVENT_TIME,SEVERITY,CATEGORY,NODE_ID,TITLE,DETAIL');
    for (const e of data.events) {
      lines.push(
        [
          new Date(e.timestamp).toISOString(),
          e.severity,
          e.category,
          e.nodeId,
          escapeCsv(e.title),
          escapeCsv(e.detail),
        ].join(',')
      );
    }

    triggerDownload(
      `meshpulse-telemetry-report-${stamp}.csv`,
      lines.join('\n'),
      'text/csv;charset=utf-8'
    );
    return;
  }

  // Standalone Printable HTML Diagnostic Report
  const onlineCount = data.nodes.filter((n) => n.status !== 'offline').length;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(data.reportTitle)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 32px; line-height: 1.5; }
  .container { max-width: 1040px; margin: 0 auto; }
  h1 { font-size: 24px; margin: 0 0 4px 0; }
  .meta { color: #475569; font-size: 13px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc; }
  .kpi-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .kpi-value { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
  h2 { font-size: 16px; margin: 28px 0 10px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 24px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-variant-numeric: tabular-nums; }
  th { background: #f1f5f9; font-weight: 600; color: #334155; }
  .num { text-align: right; }
  .note { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; font-size: 13px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<div class="container">
  <h1>${escapeHtml(data.reportTitle)}</h1>
  <div class="meta">
    Generated ${escapeHtml(new Date().toLocaleString())} · Traffic Profile: ${escapeHtml(data.config.trafficProfile)} · RF Interference: ${data.config.interferenceLevel}% · Active Nodes: ${onlineCount}/${data.nodes.length} · Samples: ${data.samples.length}
  </div>
  ${data.operatorNote.trim() ? `<div class="note"><strong>Operator Note:</strong> ${escapeHtml(data.operatorNote)}</div>` : ''}
  <div class="grid">
    <div class="kpi"><div class="kpi-label">Avg / P95 Latency</div><div class="kpi-value">${summary.avgLatency} / ${summary.p95Latency} ms</div></div>
    <div class="kpi"><div class="kpi-label">Avg / Max Packet Loss</div><div class="kpi-value">${summary.avgLoss}% / ${summary.maxLoss}%</div></div>
    <div class="kpi"><div class="kpi-label">Avg / Peak Throughput</div><div class="kpi-value">${summary.avgThroughput} / ${summary.peakThroughput} Mbps</div></div>
    <div class="kpi"><div class="kpi-label">Mean Signal (RSSI)</div><div class="kpi-value">${summary.avgRssi} dBm</div></div>
  </div>

  <h2>Node Connectivity Snapshot</h2>
  <table>
    <thead>
      <tr>
        <th>Node</th><th>Role</th><th>Status</th><th>Route</th><th class="num">RSSI</th><th class="num">Latency</th><th class="num">Loss</th><th class="num">Throughput</th>
      </tr>
    </thead>
    <tbody>
      ${data.nodes
        .map(
          (n) => `<tr>
        <td><strong>${escapeHtml(n.id)}</strong> (${escapeHtml(n.name)})</td>
        <td>${escapeHtml(n.role)}</td>
        <td>${escapeHtml(n.status)}</td>
        <td>${n.routePath.length ? escapeHtml(n.routePath.join(' → ')) : 'Unreachable'}</td>
        <td class="num">${n.rssiDbm} dBm</td>
        <td class="num">${n.latencyMs} ms</td>
        <td class="num">${n.packetLossPct}%</td>
        <td class="num">${n.throughputMbps} Mbps</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>Wireless Link Matrix</h2>
  <table>
    <thead>
      <tr>
        <th>Link ID</th><th>Endpoints</th><th>Band / Ch</th><th class="num">Distance</th><th class="num">RSSI</th><th class="num">SNR</th><th class="num">Loss</th><th class="num">Utilization</th>
      </tr>
    </thead>
    <tbody>
      ${data.links
        .map(
          (l) => `<tr>
        <td>${escapeHtml(l.id)}</td>
        <td>${escapeHtml(l.source)} ↔ ${escapeHtml(l.target)}</td>
        <td>${escapeHtml(l.band)} · Ch ${l.channel}</td>
        <td class="num">${l.distanceMeters} m</td>
        <td class="num">${l.active ? `${l.currentRssi} dBm` : 'Down'}</td>
        <td class="num">${l.active ? `${l.snrDb} dB` : '—'}</td>
        <td class="num">${l.active ? `${l.linkLossPct}%` : '100%'}</td>
        <td class="num">${l.active ? `${l.utilizationPct}%` : '0%'}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>Diagnostic Event Log (${data.events.length})</h2>
  <table>
    <thead>
      <tr><th>Time</th><th>Severity</th><th>Node</th><th>Event</th><th>Details</th></tr>
    </thead>
    <tbody>
      ${
        data.events.length === 0
          ? '<tr><td colspan="5">No threshold breaches or failover events recorded during this window.</td></tr>'
          : data.events
              .slice(0, 60)
              .map(
                (e) => `<tr>
          <td>${escapeHtml(e.timeLabel)}</td>
          <td>${escapeHtml(e.severity)}</td>
          <td>${escapeHtml(e.nodeId)}</td>
          <td>${escapeHtml(e.title)}</td>
          <td>${escapeHtml(e.detail)}</td>
        </tr>`
              )
              .join('')
      }
    </tbody>
  </table>
</div>
</body>
</html>`;

  triggerDownload(
    `meshpulse-executive-report-${stamp}.html`,
    html,
    'text/html;charset=utf-8'
  );
}
