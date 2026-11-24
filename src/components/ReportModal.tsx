import { useState } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, X } from 'lucide-react';
import {
  DiagnosticEvent,
  MeshLinkEdge,
  MeshNode,
  SimulationConfig,
  TelemetrySample,
} from '../types/network';
import {
  ReportFormat,
  computeSummaryStats,
  exportNetworkReport,
} from '../utils/reportExport';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MeshNode[];
  links: MeshLinkEdge[];
  samples: TelemetrySample[];
  events: DiagnosticEvent[];
  config: SimulationConfig;
}

export function ReportModal({
  isOpen,
  onClose,
  nodes,
  links,
  samples,
  events,
  config,
}: ReportModalProps) {
  const [format, setFormat] = useState<ReportFormat>('csv');
  const [reportTitle, setReportTitle] = useState(
    'Wireless Mesh Network Diagnostic Report'
  );
  const [operatorNote, setOperatorNote] = useState('');

  if (!isOpen) return null;

  const summary = computeSummaryStats(samples);
  const onlineCount = nodes.filter((n) => n.status !== 'offline').length;

  const handleDownload = () => {
    exportNetworkReport(format, {
      reportTitle: reportTitle.trim() || 'Wireless Mesh Network Diagnostic Report',
      operatorNote,
      nodes,
      links,
      samples,
      events,
      config,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2
              id="report-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Export Network Diagnostic Report
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {samples.length} telemetry samples · {onlineCount}/{nodes.length} nodes online ·{' '}
              {events.length} logged events
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Summary Preview Strip */}
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/60">
            <div>
              <div className="text-slate-500 dark:text-slate-400">Avg Latency</div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {summary.avgLatency} ms
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Avg Packet Loss</div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {summary.avgLoss}%
              </div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400">Avg Throughput</div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {summary.avgThroughput} Mbps
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Report Format
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  id: 'csv' as const,
                  label: 'CSV Dataset',
                  sub: 'Excel & Python ready',
                  icon: FileSpreadsheet,
                },
                {
                  id: 'json' as const,
                  label: 'JSON Bundle',
                  sub: 'Full raw telemetry',
                  icon: FileJson,
                },
                {
                  id: 'html' as const,
                  label: 'HTML Summary',
                  sub: 'Printable report',
                  icon: FileText,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = format === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`flex min-h-[44px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] opacity-75">{opt.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report Title */}
          <div>
            <label
              htmlFor="report-title-input"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Report Title
            </label>
            <input
              id="report-title-input"
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="min-h-[40px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          {/* Operator Note */}
          <div>
            <label
              htmlFor="report-note-input"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Diagnostic Context / Operator Note (Optional)
            </label>
            <textarea
              id="report-note-input"
              rows={2}
              value={operatorNote}
              onChange={(e) => setOperatorNote(e.target.value)}
              placeholder="e.g., Post-channel reassignment stress test with 35% co-channel interference"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-md border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download {format.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
