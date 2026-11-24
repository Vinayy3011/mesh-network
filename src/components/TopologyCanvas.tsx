import { MeshLinkEdge, MeshNode } from '../types/network';

interface TopologyCanvasProps {
  nodes: MeshNode[];
  links: MeshLinkEdge[];
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  compact?: boolean;
}

export function TopologyCanvas({
  nodes,
  links,
  selectedNodeId,
  onSelectNode,
  compact = false,
}: TopologyCanvasProps) {
  const nodeById = new Map<string, MeshNode>();
  nodes.forEach((n) => nodeById.set(n.id, n));

  const selectedNode = nodeById.get(selectedNodeId);

  // Build set of active route edges for the selected node so the path to gateway stands out
  const highlightedEdges = new Set<string>();
  if (selectedNode && selectedNode.routePath.length > 1) {
    for (let i = 0; i < selectedNode.routePath.length - 1; i++) {
      const a = selectedNode.routePath[i];
      const b = selectedNode.routePath[i + 1];
      highlightedEdges.add(`${a}::${b}`);
      highlightedEdges.add(`${b}::${a}`);
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className={`w-full ${compact ? 'h-56 sm:h-64' : 'h-72 sm:h-96'}`}
        role="img"
        aria-label="Interactive wireless mesh network topology graph"
      >
        <defs>
          <pattern
            id="mesh-grid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.18"
              className="text-slate-200 dark:text-slate-800/80"
            />
          </pattern>
        </defs>

        <rect width="100" height="100" fill="url(#mesh-grid)" />

        {/* Wireless links */}
        {links.map((link) => {
          const src = nodeById.get(link.source);
          const dst = nodeById.get(link.target);
          if (!src || !dst) return null;

          const isHighlighted =
            highlightedEdges.has(`${link.source}::${link.target}`);
          const isPrimaryUplink =
            (src.uplinkNodeId === dst.id || dst.uplinkNodeId === src.id) &&
            link.active;

          let strokeColor = '#64748b';
          let strokeOpacity = 0.28;
          let strokeWidth = 0.4;
          let dashArray = '';

          if (!link.active) {
            strokeColor = '#94a3b8';
            strokeOpacity = 0.16;
            dashArray = '1.2 1.2';
          } else if (isHighlighted) {
            strokeColor = '#3b82f6';
            strokeOpacity = 0.95;
            strokeWidth = 0.85;
          } else if (link.linkLossPct > 3) {
            strokeColor = '#d97706';
            strokeOpacity = 0.65;
            strokeWidth = 0.5;
            dashArray = '1.6 0.9';
          } else if (isPrimaryUplink) {
            strokeColor = '#10b981';
            strokeOpacity = 0.55;
            strokeWidth = 0.55;
          }

          const midX = (src.x + dst.x) / 2;
          const midY = (src.y + dst.y) / 2;

          return (
            <g key={link.id}>
              <line
                x1={src.x}
                y1={src.y}
                x2={dst.x}
                y2={dst.y}
                stroke={strokeColor}
                strokeOpacity={strokeOpacity}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeLinecap="round"
              />
              {!compact && isHighlighted && link.active && (
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-6.2"
                    y="-2.3"
                    width="12.4"
                    height="4.6"
                    rx="1.2"
                    className="fill-white stroke-blue-500/70 dark:fill-slate-900"
                    strokeWidth="0.25"
                  />
                  <text
                    textAnchor="middle"
                    dy="0.9"
                    className="fill-blue-700 font-mono text-[2.1px] font-medium dark:fill-blue-300"
                  >
                    {link.currentRssi} dBm
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Mesh Nodes */}
        {nodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const radius =
            node.role === 'gateway' ? 3.5 : node.role === 'relay' ? 2.9 : 2.5;

          const fillClass =
            node.status === 'offline'
              ? 'fill-red-500/20 stroke-red-500'
              : node.status === 'degraded'
              ? 'fill-amber-500/20 stroke-amber-500'
              : node.role === 'gateway'
              ? 'fill-blue-600/20 stroke-blue-500'
              : 'fill-emerald-500/20 stroke-emerald-500';

          const coreDotClass =
            node.status === 'offline'
              ? 'fill-red-500'
              : node.status === 'degraded'
              ? 'fill-amber-500'
              : node.role === 'gateway'
              ? 'fill-blue-500'
              : 'fill-emerald-500';

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelectNode(node.id)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Select node ${node.id} ${node.name}, status ${node.status}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectNode(node.id);
                }
              }}
            >
              {isSelected && (
                <circle
                  r={radius + 1.8}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.45"
                  strokeDasharray="1.2 0.8"
                />
              )}
              <circle
                r={radius}
                className={fillClass}
                strokeWidth={isSelected ? '0.65' : '0.45'}
              />
              <circle r={radius * 0.42} className={coreDotClass} />

              {/* Node ID Label */}
              <text
                y={radius + 3.4}
                textAnchor="middle"
                className="fill-slate-800 font-mono text-[2.5px] font-semibold dark:fill-slate-100"
              >
                {node.id}
              </text>
              {!compact && (
                <text
                  y={radius + 6.0}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[2.0px] dark:fill-slate-400"
                >
                  {node.status === 'offline'
                    ? 'Offline'
                    : `${node.latencyMs} ms · ${node.rssiDbm} dBm`}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Clean unboxed legend footer inside topology frame */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
            Gateway / Active Route
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Nominal Link
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            Degraded
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            Offline
          </span>
        </div>
        <span className="font-mono text-slate-500 dark:text-slate-400">
          Selected: {selectedNodeId}
          {selectedNode?.routePath.length
            ? ` · Path: ${selectedNode.routePath.join(' → ')}`
            : ' · No active route'}
        </span>
      </div>
    </div>
  );
}
