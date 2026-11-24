import { useMemo, useState } from 'react';
import { Search, RotateCcw, Power, AlertTriangle } from 'lucide-react';
import { MeshNode, NodeStatus } from '../types/network';

interface NodeTableProps {
  nodes: MeshNode[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onToggleOffline: (id: string) => void;
  onToggleDegraded: (id: string) => void;
}

export function NodeTable({
  nodes,
  selectedNodeId,
  onSelectNode,
  onToggleOffline,
  onToggleDegraded,
}: NodeTableProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NodeStatus>('all');

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nodes.filter((n) => {
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchesQuery =
        !q ||
        n.id.toLowerCase().includes(q) ||
        n.name.toLowerCase().includes(q) ||
        n.ipAddress.toLowerCase().includes(q) ||
        n.role.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [nodes, query, statusFilter]);

  const statusLabel = (status: NodeStatus) => {
    if (status === 'nominal') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Nominal
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Degraded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
        Offline
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by node ID, name, or IP..."
            aria-label="Filter mesh nodes"
            className="min-h-[40px] w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950"
          role="group"
          aria-label="Filter nodes by status"
        >
          {(['all', 'nominal', 'degraded', 'offline'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`min-h-[34px] whitespace-nowrap shrink-0 rounded px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No mesh nodes match the current filter
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Clear your search query or reset status filters to inspect all network nodes.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStatusFilter('all');
            }}
            className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                  <th className="px-4 py-2.5">Node</th>
                  <th className="px-3 py-2.5">Role & Radio</th>
                  <th className="px-3 py-2.5">Uplink / Hops</th>
                  <th className="px-3 py-2.5 text-right">RSSI</th>
                  <th className="px-3 py-2.5 text-right">Latency</th>
                  <th className="px-3 py-2.5 text-right">Packet Loss</th>
                  <th className="px-3 py-2.5 text-right">Throughput</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredNodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <tr
                      key={node.id}
                      onClick={() => onSelectNode(node.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {node.id} · {node.name}
                        </div>
                        <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {node.ipAddress}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="capitalize">{node.role}</span> · {node.band}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {node.hopCount === -1
                          ? 'Unreachable'
                          : node.role === 'gateway'
                          ? 'Backhaul (0 hops)'
                          : `${node.uplinkNodeId ?? '—'} (${node.hopCount} hop${
                              node.hopCount === 1 ? '' : 's'
                            })`}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {node.status === 'offline' ? '—' : `${node.rssiDbm} dBm`}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {node.status === 'offline' ? '—' : `${node.latencyMs} ms`}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {node.status === 'offline'
                          ? '100%'
                          : `${node.packetLossPct.toFixed(2)}%`}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                        {node.status === 'offline'
                          ? '0 Mbps'
                          : `${node.throughputMbps} Mbps`}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {statusLabel(node.status)}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleDegraded(node.id)}
                            disabled={node.forcedOffline}
                            title={
                              node.forcedDegraded
                                ? 'Clear link attenuation'
                                : 'Simulate RF degradation'
                            }
                            className={`min-h-[32px] whitespace-nowrap rounded border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                              node.forcedDegraded
                                ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                          >
                            {node.forcedDegraded ? 'Clear Stress' : 'Degrade'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleOffline(node.id)}
                            className={`min-h-[32px] whitespace-nowrap rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                              node.forcedOffline
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'border-slate-200 text-slate-600 hover:border-red-500/40 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-red-400'
                            }`}
                          >
                            {node.forcedOffline ? 'Restore' : 'Drop'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Card List */}
          <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
            {filteredNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`p-4 transition-colors ${
                    isSelected ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {node.id} · {node.name}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {node.ipAddress} · {node.role} · {node.band}
                      </div>
                    </div>
                    <div className="text-xs">{statusLabel(node.status)}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800/80">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Latency</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {node.status === 'offline' ? '—' : `${node.latencyMs} ms`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Loss</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {node.status === 'offline' ? '100%' : `${node.packetLossPct}%`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Throughput</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {node.status === 'offline' ? '0 Mbps' : `${node.throughputMbps} Mbps`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">RSSI</span>
                      <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {node.status === 'offline' ? '—' : `${node.rssiDbm} dBm`}
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-3 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleDegraded(node.id)}
                      disabled={node.forcedOffline}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      {node.forcedDegraded ? 'Clear Stress' : 'Degrade'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleOffline(node.id)}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Power className="h-3.5 w-3.5" aria-hidden="true" />
                      {node.forcedOffline ? 'Restore Node' : 'Drop Node'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
