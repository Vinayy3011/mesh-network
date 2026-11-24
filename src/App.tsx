import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Download,
  Menu,
  Moon,
  Network,
  Pause,
  Play,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import {
  LatencyChart,
  NodeConnectivityChart,
  PacketLossChart,
  ThroughputChart,
} from './components/TelemetryCharts';
import { TopologyCanvas } from './components/TopologyCanvas';
import { NodeTable } from './components/NodeTable';
import { ReportModal } from './components/ReportModal';
import {
  formatTimeLabel,
  generateSeedHistory,
  stepMeshSimulation,
} from './engine/meshSimulation';
import {
  DashboardSection,
  DiagnosticEvent,
  MeshLinkEdge,
  MeshNode,
  SeverityLevel,
  SimulationConfig,
  TelemetrySample,
  TrafficProfile,
} from './types/network';

const DEFAULT_CONFIG: SimulationConfig = {
  isStreaming: true,
  intervalMs: 1000,
  trafficProfile: 'nominal',
  interferenceLevel: 12,
  latencyThresholdMs: 35,
  packetLossThresholdPct: 2.5,
};

const MAX_SAMPLES = 45;

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const initialSeed = useMemo(() => generateSeedHistory(DEFAULT_CONFIG, 24), []);

  const [nodes, setNodes] = useState<MeshNode[]>(initialSeed.nodes);
  const [links, setLinks] = useState<MeshLinkEdge[]>(initialSeed.links);
  const [samples, setSamples] = useState<TelemetrySample[]>(initialSeed.samples);
  const [events, setEvents] = useState<DiagnosticEvent[]>([
    {
      id: 'evt-init',
      timestamp: Date.now(),
      timeLabel: formatTimeLabel(Date.now()),
      severity: 'info',
      category: 'routing',
      nodeId: 'GW-01',
      title: 'Mesh telemetry session initialized',
      detail: 'All 8 wireless mesh nodes converged across 6 GHz, 5 GHz, and 2.4 GHz links.',
    },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('RL-04');
  const [nodeChartMetric, setNodeChartMetric] = useState<
    'latency' | 'throughput' | 'rssi'
  >('latency');
  const [eventSeverityFilter, setEventSeverityFilter] = useState<
    'all' | SeverityLevel
  >('all');
  const [pingResult, setPingResult] = useState<string | null>(null);

  const tickRef = useRef(24);
  const nodesRef = useRef(nodes);
  const linksRef = useRef(links);
  const configRef = useRef(config);

  nodesRef.current = nodes;
  linksRef.current = links;
  configRef.current = config;

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Real-time simulation loop
  useEffect(() => {
    if (!config.isStreaming) return;

    const timer = window.setInterval(() => {
      tickRef.current += 1;
      const result = stepMeshSimulation(
        nodesRef.current,
        linksRef.current,
        configRef.current,
        tickRef.current
      );

      setNodes(result.nodes);
      setLinks(result.links);
      setSamples((prev) => {
        const next = [...prev, result.sample];
        return next.length > MAX_SAMPLES
          ? next.slice(next.length - MAX_SAMPLES)
          : next;
      });

      if (result.newEvents.length > 0) {
        setEvents((prev) => [...result.newEvents, ...prev].slice(0, 100));
      }
    }, config.intervalMs);

    return () => window.clearInterval(timer);
  }, [config.isStreaming, config.intervalMs]);

  const appendEvent = useCallback(
    (
      severity: SeverityLevel,
      category: DiagnosticEvent['category'],
      nodeId: string,
      title: string,
      detail: string
    ) => {
      const now = Date.now();
      setEvents((prev) =>
        [
          {
            id: `evt-${now}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            timeLabel: formatTimeLabel(now),
            severity,
            category,
            nodeId,
            title,
            detail,
          },
          ...prev,
        ].slice(0, 100)
      );
    },
    []
  );

  const handleToggleNodeOffline = useCallback(
    (nodeId: string) => {
      const target = nodesRef.current.find((n) => n.id === nodeId);
      if (!target) return;
      const nextOffline = !target.forcedOffline;

      const updated = nodesRef.current.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              forcedOffline: nextOffline,
              forcedDegraded: nextOffline ? false : n.forcedDegraded,
            }
          : n
      );

      tickRef.current += 1;
      const stepped = stepMeshSimulation(
        updated,
        linksRef.current,
        configRef.current,
        tickRef.current
      );
      setNodes(stepped.nodes);
      setLinks(stepped.links);
      setSamples((prev) => [...prev, stepped.sample].slice(-MAX_SAMPLES));

      appendEvent(
        nextOffline ? 'critical' : 'info',
        'failover',
        nodeId,
        nextOffline ? `Node ${nodeId} dropped offline` : `Node ${nodeId} restored online`,
        nextOffline
          ? `Simulated link loss on ${target.name}; mesh routing recalculated.`
          : `${target.name} rejoined the wireless mesh topology.`
      );
    },
    [appendEvent]
  );

  const handleToggleNodeDegraded = useCallback(
    (nodeId: string) => {
      const target = nodesRef.current.find((n) => n.id === nodeId);
      if (!target || target.forcedOffline) return;
      const nextDegraded = !target.forcedDegraded;

      const updated = nodesRef.current.map((n) =>
        n.id === nodeId ? { ...n, forcedDegraded: nextDegraded } : n
      );

      tickRef.current += 1;
      const stepped = stepMeshSimulation(
        updated,
        linksRef.current,
        configRef.current,
        tickRef.current
      );
      setNodes(stepped.nodes);
      setLinks(stepped.links);
      setSamples((prev) => [...prev, stepped.sample].slice(-MAX_SAMPLES));

      appendEvent(
        nextDegraded ? 'warning' : 'info',
        'interference',
        nodeId,
        nextDegraded
          ? `RF attenuation injected on ${nodeId}`
          : `RF stress cleared on ${nodeId}`,
        nextDegraded
          ? `Added 12 dB path loss penalty on ${target.name}.`
          : `Signal attenuation returned to baseline.`
      );
    },
    [appendEvent]
  );

  const handleTrafficProfileChange = (profile: TrafficProfile) => {
    setConfig((prev) => ({ ...prev, trafficProfile: profile }));
    appendEvent(
      profile === 'congestion' ? 'warning' : 'info',
      'interference',
      'MESH',
      `Traffic profile set to ${profile}`,
      `Mesh traffic generator switched to ${profile} load pattern.`
    );
  };

  const handleResetSession = () => {
    const fresh = generateSeedHistory(DEFAULT_CONFIG, 24);
    tickRef.current = 24;
    setConfig(DEFAULT_CONFIG);
    setNodes(fresh.nodes);
    setLinks(fresh.links);
    setSamples(fresh.samples);
    setPingResult(null);
    setEvents([
      {
        id: `evt-reset-${Date.now()}`,
        timestamp: Date.now(),
        timeLabel: formatTimeLabel(Date.now()),
        severity: 'info',
        category: 'routing',
        nodeId: 'GW-01',
        title: 'Simulation session reset',
        detail: 'All nodes restored to nominal baseline and telemetry buffer re-seeded.',
      },
    ]);
  };

  const handleRunProbe = (node: MeshNode) => {
    if (node.status === 'offline') {
      setPingResult(`Probe ${node.ipAddress}: Request timed out (100% loss)`);
      return;
    }
    const min = Math.max(1.1, node.latencyMs - node.jitterMs).toFixed(1);
    const max = (node.latencyMs + node.jitterMs * 1.4).toFixed(1);
    setPingResult(
      `Probe ${node.ipAddress} via ${node.routePath.join(' → ')}: 5 packets, ${node.packetLossPct.toFixed(
        1
      )}% loss, rtt min/avg/max = ${min}/${node.latencyMs}/${max} ms`
    );
  };

  const latestSample = samples[samples.length - 1];
  const prevSample = samples[samples.length - 2] ?? latestSample;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0];

  const onlineNodesCount = nodes.filter((n) => n.status !== 'offline').length;
  const degradedNodesCount = nodes.filter((n) => n.status === 'degraded').length;

  const latencyDelta = latestSample
    ? Number((latestSample.avgLatencyMs - prevSample.avgLatencyMs).toFixed(1))
    : 0;
  const throughputDelta = latestSample
    ? Number((latestSample.throughputMbps - prevSample.throughputMbps).toFixed(1))
    : 0;

  const filteredEvents = useMemo(() => {
    if (eventSeverityFilter === 'all') return events;
    return events.filter((e) => e.severity === eventSeverityFilter);
  }, [events, eventSeverityFilter]);

  const navItems: {
    id: DashboardSection;
    label: string;
    icon: typeof Activity;
  }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'topology', label: 'Topology & Nodes', icon: Network },
    { id: 'links', label: 'Signal & Links', icon: Radio },
    { id: 'diagnostics', label: 'Diagnostics', icon: SlidersHorizontal },
  ];

  const sectionTitleMap: Record<DashboardSection, string> = {
    overview: 'Network Overview',
    topology: 'Topology & Node Connectivity',
    links: 'RF Signal & Link Matrix',
    diagnostics: 'Diagnostics & Alert Thresholds',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0B1120] dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary Sidebar"
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap dark:text-slate-100">
            MeshPulse
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Network Summary & Simulation Quick Controls */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Mesh Cluster
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Campus Mesh Alpha
          </div>
          <div className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
            {onlineNodesCount}/{nodes.length} online · {degradedNodesCount} degraded
          </div>

          <div className="mt-4 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>RF Interference</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-slate-200">
                  {config.interferenceLevel}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={85}
                step={5}
                value={config.interferenceLevel}
                aria-label="RF interference level"
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    interferenceLevel: Number(e.target.value),
                  }))
                }
                className="mt-1.5 w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs text-slate-600 dark:text-slate-400">
                Traffic Profile
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
                {(['nominal', 'burst', 'congestion'] as const).map((profile) => (
                  <button
                    key={profile}
                    type="button"
                    onClick={() => handleTrafficProfileChange(profile)}
                    className={`min-h-[30px] rounded px-1.5 text-[11px] font-medium capitalize transition-colors ${
                      config.trafficProfile === profile
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    {profile}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top Bar (strictly 1 row, <= 56px height) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-slate-500 sm:inline dark:text-slate-400">
                Campus Mesh Alpha
              </span>
              <span className="hidden text-slate-400 sm:inline dark:text-slate-600">
                /
              </span>
              <h1 className="truncate font-display text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100">
                {sectionTitleMap[activeSection]}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Live Telemetry Stream Toggle */}
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({ ...prev, isStreaming: !prev.isStreaming }))
              }
              className="inline-flex min-h-[38px] whitespace-nowrap shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {config.isStreaming ? (
                <>
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Live</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Paused</span>
                </>
              )}
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Primary Action: Download Report */}
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="inline-flex min-h-[38px] whitespace-nowrap shrink-0 items-center gap-2 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1380px] flex-1 space-y-6 p-4 sm:p-6">
          {/* Workspace Simulation Toolbar (Mobile-friendly controls) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-600 dark:text-slate-400">
              <span>
                Sampling:{' '}
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {config.intervalMs / 1000}s
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Profile:{' '}
                <span className="font-medium capitalize text-slate-900 dark:text-slate-100">
                  {config.trafficProfile}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Interference:{' '}
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {config.interferenceLevel}%
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Buffer:{' '}
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {samples.length}/{MAX_SAMPLES} samples
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5 dark:bg-slate-950"
                role="group"
                aria-label="Sampling interval"
              >
                {([1000, 2000, 5000] as const).map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, intervalMs: ms }))
                    }
                    className={`min-h-[30px] rounded px-2.5 text-xs font-mono font-medium transition-colors ${
                      config.intervalMs === ms
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetSession}
                className="inline-flex min-h-[32px] whitespace-nowrap items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>

          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <>
              {/* 4-Column KPI Strip */}
              <section
                aria-label="Key mesh performance metrics"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>End-to-End Latency</span>
                    <span className="font-mono">
                      P95: {latestSample.p95LatencyMs} ms
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {latestSample.avgLatencyMs} ms
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        latencyDelta > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {latencyDelta > 0 ? `+${latencyDelta}` : latencyDelta} ms
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Jitter {latestSample.jitterMs} ms · Threshold{' '}
                    {config.latencyThresholdMs} ms
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Packet Loss Rate</span>
                    <span className="font-mono">
                      Retx: {latestSample.retransmissionPct}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {latestSample.packetLossPct.toFixed(2)}%
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        latestSample.packetLossPct > config.packetLossThresholdPct
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {latestSample.packetLossPct > config.packetLossThresholdPct
                        ? 'Threshold Exceeded'
                        : 'Within SLA'}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Max acceptable {config.packetLossThresholdPct}%
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Mesh Throughput</span>
                    <span className="font-mono">
                      Goodput: {latestSample.goodputMbps} Mbps
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {latestSample.throughputMbps} Mbps
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums ${
                        throughputDelta >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {throughputDelta >= 0
                        ? `+${throughputDelta}`
                        : throughputDelta}{' '}
                      Mbps
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Aggregate multi-hop wireless bandwidth
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Node Connectivity</span>
                    <span className="font-mono">
                      Mean RSSI: {latestSample.avgRssiDbm} dBm
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                      {onlineNodesCount}/{nodes.length} Online
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      SNR {latestSample.avgSnrDb} dB
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {degradedNodesCount} degraded ·{' '}
                    {nodes.length - onlineNodesCount} offline
                  </div>
                </div>
              </section>

              {/* Real-Time Chart.js Graphs Grid (2x2) */}
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Latency & Jitter Time Series
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Real-time round-trip delay across active mesh routes
                      </p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <LatencyChart samples={samples} isDark={isDark} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Throughput & Effective Goodput
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Gross link capacity vs. payload delivery after retransmissions
                      </p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ThroughputChart samples={samples} isDark={isDark} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Packet Loss & Retransmissions
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Frame drops and MAC-layer retry overhead percentage
                      </p>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <PacketLossChart samples={samples} isDark={isDark} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Per-Node Connectivity Comparison
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live metric distribution across gateways, relays, and clients
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950"
                      role="group"
                      aria-label="Node comparison metric"
                    >
                      {(
                        [
                          { id: 'latency', label: 'Latency' },
                          { id: 'throughput', label: 'Throughput' },
                          { id: 'rssi', label: 'SNR' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNodeChartMetric(tab.id)}
                          className={`min-h-[30px] rounded px-2.5 text-xs font-medium transition-colors ${
                            nodeChartMetric === tab.id
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <NodeConnectivityChart
                      nodes={nodes}
                      isDark={isDark}
                      metric={nodeChartMetric}
                    />
                  </div>
                </div>
              </section>

              {/* Topology Snapshot + Quick Node Connectivity Table */}
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="xl:col-span-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Live Mesh Topology
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveSection('topology')}
                      className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Expand Topology
                    </button>
                  </div>
                  <TopologyCanvas
                    nodes={nodes}
                    links={links}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                    compact
                  />
                </div>

                <div className="xl:col-span-7">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Node Connectivity Summary
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Click any row or node to trace route
                    </span>
                  </div>
                  <NodeTable
                    nodes={nodes}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                    onToggleOffline={handleToggleNodeOffline}
                    onToggleDegraded={handleToggleNodeDegraded}
                  />
                </div>
              </section>
            </>
          )}

          {/* SECTION 2: TOPOLOGY & NODES */}
          {activeSection === 'topology' && (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="xl:col-span-8">
                  <TopologyCanvas
                    nodes={nodes}
                    links={links}
                    selectedNodeId={selectedNodeId}
                    onSelectNode={setSelectedNodeId}
                  />
                </div>

                {/* Selected Node Inspector */}
                <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 xl:col-span-4 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {selectedNode.id} · {selectedNode.name}
                        </h2>
                        <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {selectedNode.ipAddress} · {selectedNode.macAddress}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold capitalize ${
                          selectedNode.status === 'offline'
                            ? 'text-red-600 dark:text-red-400'
                            : selectedNode.status === 'degraded'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {selectedNode.status}
                      </span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          Role & Radio
                        </dt>
                        <dd className="mt-0.5 font-medium capitalize text-slate-900 dark:text-slate-100">
                          {selectedNode.role} · {selectedNode.band} (Ch{' '}
                          {selectedNode.channel})
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          Firmware
                        </dt>
                        <dd className="mt-0.5 font-mono text-slate-900 dark:text-slate-100">
                          {selectedNode.firmware}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          Active Route Path
                        </dt>
                        <dd className="mt-0.5 font-mono text-slate-900 dark:text-slate-100">
                          {selectedNode.routePath.length > 0
                            ? selectedNode.routePath.join(' → ')
                            : 'Unreachable'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          Airtime Utilization
                        </dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {selectedNode.airtimePct}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          Latency / Jitter
                        </dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {selectedNode.status === 'offline'
                            ? '—'
                            : `${selectedNode.latencyMs} ms / ${selectedNode.jitterMs} ms`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          RSSI / SNR
                        </dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {selectedNode.status === 'offline'
                            ? '—'
                            : `${selectedNode.rssiDbm} dBm / ${selectedNode.snrDb} dB`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          Packet Loss
                        </dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {selectedNode.packetLossPct.toFixed(2)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500 dark:text-slate-400">
                          Throughput
                        </dt>
                        <dd className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {selectedNode.throughputMbps} Mbps
                        </dd>
                      </div>
                    </dl>

                    {pingResult && (
                      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        {pingResult}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleRunProbe(selectedNode)}
                      className="min-h-[40px] w-full rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 dark:hover:bg-blue-500"
                    >
                      Run Path Probe ({selectedNode.id})
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleNodeDegraded(selectedNode.id)}
                        disabled={selectedNode.forcedOffline}
                        className="min-h-[40px] rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {selectedNode.forcedDegraded
                          ? 'Clear Stress'
                          : 'Inject Stress'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleNodeOffline(selectedNode.id)}
                        className="min-h-[40px] rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {selectedNode.forcedOffline ? 'Restore Node' : 'Drop Node'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <NodeTable
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onToggleOffline={handleToggleNodeOffline}
                onToggleDegraded={handleToggleNodeDegraded}
              />
            </>
          )}

          {/* SECTION 3: SIGNAL & LINKS */}
          {activeSection === 'links' && (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Per-Node Signal-to-Noise Ratio (SNR) & Throughput
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Live radio link margin across mesh participants
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
                      {(
                        [
                          { id: 'rssi', label: 'SNR (dB)' },
                          { id: 'throughput', label: 'Throughput' },
                          { id: 'latency', label: 'Latency' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNodeChartMetric(tab.id)}
                          className={`min-h-[30px] rounded px-2.5 text-xs font-medium transition-colors ${
                            nodeChartMetric === tab.id
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <NodeConnectivityChart
                      nodes={nodes}
                      isDark={isDark}
                      metric={nodeChartMetric}
                    />
                  </div>
                </div>

                {/* RF Environment Controls */}
                <div className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-5 dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    RF Environment & Traffic Load Controls
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Adjust wireless channel congestion and interference to observe real-time mesh recovery.
                  </p>

                  <div className="mt-5 space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Co-Channel RF Interference
                        </span>
                        <span className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {config.interferenceLevel}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={85}
                        step={5}
                        value={config.interferenceLevel}
                        aria-label="Co-channel RF interference"
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            interferenceLevel: Number(e.target.value),
                          }))
                        }
                        className="mt-2 w-full accent-blue-600"
                      />
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        Traffic Generation Profile
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['nominal', 'burst', 'congestion'] as const).map(
                          (profile) => (
                            <button
                              key={profile}
                              type="button"
                              onClick={() => handleTrafficProfileChange(profile)}
                              className={`min-h-[40px] rounded-md border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                                config.trafficProfile === profile
                                  ? 'border-blue-600 bg-blue-600/10 text-blue-700 dark:border-blue-500 dark:text-blue-300'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                            >
                              {profile}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wireless Link Matrix Table */}
              <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Point-to-Point Wireless Link Matrix ({links.length} links)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                        <th className="px-4 py-2.5">Link</th>
                        <th className="px-3 py-2.5">Radio & Channel</th>
                        <th className="px-3 py-2.5 text-right">Distance</th>
                        <th className="px-3 py-2.5 text-right">Capacity</th>
                        <th className="px-3 py-2.5 text-right">RSSI</th>
                        <th className="px-3 py-2.5 text-right">SNR</th>
                        <th className="px-3 py-2.5 text-right">Latency</th>
                        <th className="px-3 py-2.5 text-right">Loss</th>
                        <th className="px-4 py-2.5 text-right">Airtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {links.map((link) => (
                        <tr
                          key={link.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-2.5 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">
                            {link.source} ↔ {link.target}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                            {link.band} · Ch {link.channel}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {link.distanceMeters} m
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                            {link.maxCapacityMbps} Mbps
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                            {link.active ? `${link.currentRssi} dBm` : 'Down'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                            {link.active ? `${link.snrDb} dB` : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                            {link.active ? `${link.linkLatencyMs} ms` : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                            {link.active ? `${link.linkLossPct}%` : '100%'}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-slate-700 dark:text-slate-200">
                            {link.active ? `${link.utilizationPct}%` : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* SECTION 4: DIAGNOSTICS */}
          {activeSection === 'diagnostics' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 xl:col-span-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    SLA Alert Thresholds
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Nodes breaching these targets are flagged as Degraded and logged automatically.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Max Latency Threshold
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {config.latencyThresholdMs} ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={100}
                    step={5}
                    value={config.latencyThresholdMs}
                    aria-label="Maximum latency alert threshold"
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        latencyThresholdMs: Number(e.target.value),
                      }))
                    }
                    className="mt-2 w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Max Packet Loss Threshold
                    </span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {config.packetLossThresholdPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={config.packetLossThresholdPct}
                    aria-label="Maximum packet loss alert threshold"
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        packetLossThresholdPct: Number(e.target.value),
                      }))
                    }
                    className="mt-2 w-full accent-blue-600"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 dark:hover:bg-blue-500"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Generate Full Diagnostic Report
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white xl:col-span-8 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Diagnostic Event Log ({filteredEvents.length})
                  </h2>

                  <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
                    {(['all', 'info', 'warning', 'critical'] as const).map(
                      (sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setEventSeverityFilter(sev)}
                          className={`min-h-[30px] rounded px-2.5 text-xs font-medium capitalize transition-colors ${
                            eventSeverityFilter === sev
                              ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                          }`}
                        >
                          {sev}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <AlertCircle className="h-6 w-6 text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                      No diagnostic events match this severity
                    </p>
                    <button
                      type="button"
                      onClick={() => setEventSeverityFilter('all')}
                      className="mt-3 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Show All Events
                    </button>
                  </div>
                ) : (
                  <div className="max-h-[480px] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
                    {filteredEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span
                              className={`font-semibold uppercase ${
                                evt.severity === 'critical'
                                  ? 'text-red-600 dark:text-red-400'
                                  : evt.severity === 'warning'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {evt.severity}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {evt.nodeId}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {evt.title}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {evt.detail}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
                          {evt.timeLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Downloadable Diagnostic Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        nodes={nodes}
        links={links}
        samples={samples}
        events={events}
        config={config}
      />
    </div>
  );
}
