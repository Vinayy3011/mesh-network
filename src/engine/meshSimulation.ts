import {
  DiagnosticEvent,
  MeshLinkEdge,
  MeshNode,
  NodeStatus,
  SimulationConfig,
  TelemetrySample,
} from '../types/network';

interface InitialNodeSeed {
  id: string;
  name: string;
  role: MeshNode['role'];
  ipAddress: string;
  macAddress: string;
  band: MeshNode['band'];
  channel: number;
  firmware: string;
  x: number;
  y: number;
}

interface InitialLinkSeed {
  id: string;
  source: string;
  target: string;
  baseRssi: number;
  maxCapacityMbps: number;
  distanceMeters: number;
  band: MeshLinkEdge['band'];
  channel: number;
}

const NODE_SEEDS: InitialNodeSeed[] = [
  {
    id: 'GW-01',
    name: 'Core Gateway North',
    role: 'gateway',
    ipAddress: '10.24.0.1',
    macAddress: 'A4:8B:2C:10:4F:01',
    band: '6 GHz',
    channel: 37,
    firmware: 'meshOS 4.2.1',
    x: 18,
    y: 28,
  },
  {
    id: 'GW-02',
    name: 'Core Gateway South',
    role: 'gateway',
    ipAddress: '10.24.0.2',
    macAddress: 'A4:8B:2C:10:4F:02',
    band: '6 GHz',
    channel: 53,
    firmware: 'meshOS 4.2.1',
    x: 18,
    y: 74,
  },
  {
    id: 'RL-01',
    name: 'Relay Atrium West',
    role: 'relay',
    ipAddress: '10.24.1.11',
    macAddress: 'A4:8B:2C:18:9A:11',
    band: '6 GHz',
    channel: 37,
    firmware: 'meshOS 4.2.1',
    x: 42,
    y: 24,
  },
  {
    id: 'RL-02',
    name: 'Relay Corridor Central',
    role: 'relay',
    ipAddress: '10.24.1.12',
    macAddress: 'A4:8B:2C:18:9A:12',
    band: '5 GHz',
    channel: 149,
    firmware: 'meshOS 4.2.1',
    x: 44,
    y: 52,
  },
  {
    id: 'RL-03',
    name: 'Relay Lab Wing',
    role: 'relay',
    ipAddress: '10.24.1.13',
    macAddress: 'A4:8B:2C:18:9A:13',
    band: '5 GHz',
    channel: 149,
    firmware: 'meshOS 4.2.0',
    x: 42,
    y: 78,
  },
  {
    id: 'RL-04',
    name: 'Relay Mezzanine East',
    role: 'relay',
    ipAddress: '10.24.1.14',
    macAddress: 'A4:8B:2C:18:9A:14',
    band: '5 GHz',
    channel: 157,
    firmware: 'meshOS 4.2.1',
    x: 68,
    y: 44,
  },
  {
    id: 'ED-01',
    name: 'Sensor Hub Alpha',
    role: 'client',
    ipAddress: '10.24.2.41',
    macAddress: 'D8:3A:DD:71:0C:41',
    band: '5 GHz',
    channel: 157,
    firmware: 'edgeOS 2.8.4',
    x: 86,
    y: 26,
  },
  {
    id: 'ED-02',
    name: 'Telemetry Terminal Beta',
    role: 'client',
    ipAddress: '10.24.2.42',
    macAddress: 'D8:3A:DD:71:0C:42',
    band: '2.4 GHz',
    channel: 6,
    firmware: 'edgeOS 2.8.4',
    x: 84,
    y: 72,
  },
];

const LINK_SEEDS: InitialLinkSeed[] = [
  { id: 'L-GW1-RL1', source: 'GW-01', target: 'RL-01', baseRssi: -47, maxCapacityMbps: 920, distanceMeters: 18, band: '6 GHz', channel: 37 },
  { id: 'L-GW1-RL2', source: 'GW-01', target: 'RL-02', baseRssi: -55, maxCapacityMbps: 740, distanceMeters: 26, band: '5 GHz', channel: 149 },
  { id: 'L-GW2-RL2', source: 'GW-02', target: 'RL-02', baseRssi: -53, maxCapacityMbps: 760, distanceMeters: 24, band: '5 GHz', channel: 149 },
  { id: 'L-GW2-RL3', source: 'GW-02', target: 'RL-03', baseRssi: -49, maxCapacityMbps: 860, distanceMeters: 19, band: '6 GHz', channel: 53 },
  { id: 'L-RL1-RL2', source: 'RL-01', target: 'RL-02', baseRssi: -52, maxCapacityMbps: 680, distanceMeters: 21, band: '5 GHz', channel: 149 },
  { id: 'L-RL2-RL3', source: 'RL-02', target: 'RL-03', baseRssi: -54, maxCapacityMbps: 640, distanceMeters: 22, band: '5 GHz', channel: 149 },
  { id: 'L-RL1-RL4', source: 'RL-01', target: 'RL-04', baseRssi: -56, maxCapacityMbps: 610, distanceMeters: 28, band: '5 GHz', channel: 157 },
  { id: 'L-RL2-RL4', source: 'RL-02', target: 'RL-04', baseRssi: -51, maxCapacityMbps: 710, distanceMeters: 22, band: '5 GHz', channel: 157 },
  { id: 'L-RL3-RL4', source: 'RL-03', target: 'RL-04', baseRssi: -60, maxCapacityMbps: 520, distanceMeters: 31, band: '5 GHz', channel: 157 },
  { id: 'L-RL4-ED1', source: 'RL-04', target: 'ED-01', baseRssi: -58, maxCapacityMbps: 480, distanceMeters: 23, band: '5 GHz', channel: 157 },
  { id: 'L-RL1-ED1', source: 'RL-01', target: 'ED-01', baseRssi: -68, maxCapacityMbps: 320, distanceMeters: 42, band: '5 GHz', channel: 149 },
  { id: 'L-RL4-ED2', source: 'RL-04', target: 'ED-02', baseRssi: -59, maxCapacityMbps: 410, distanceMeters: 27, band: '2.4 GHz', channel: 6 },
  { id: 'L-RL3-ED2', source: 'RL-03', target: 'ED-02', baseRssi: -63, maxCapacityMbps: 350, distanceMeters: 38, band: '2.4 GHz', channel: 6 },
];

export function formatTimeLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function noise(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude;
}

export function createInitialNodes(): MeshNode[] {
  return NODE_SEEDS.map((seed) => ({
    ...seed,
    forcedOffline: false,
    forcedDegraded: false,
    status: 'nominal',
    hopCount: seed.role === 'gateway' ? 0 : 1,
    uplinkNodeId: null,
    routePath: seed.role === 'gateway' ? [seed.id] : [],
    rssiDbm: seed.role === 'gateway' ? -42 : -55,
    snrDb: 36,
    latencyMs: seed.role === 'gateway' ? 2.4 : 12.0,
    jitterMs: 1.5,
    packetLossPct: 0.1,
    throughputMbps: seed.role === 'gateway' ? 540 : 280,
    airtimePct: 24,
    uptimeSec: 14280 + Math.floor(Math.random() * 5000),
  }));
}

export function createInitialLinks(): MeshLinkEdge[] {
  return LINK_SEEDS.map((seed) => ({
    ...seed,
    active: true,
    currentRssi: seed.baseRssi,
    snrDb: 95 + seed.baseRssi,
    linkLossPct: 0.15,
    linkLatencyMs: 3.5,
    utilizationPct: 28,
  }));
}

export interface SimulationStepResult {
  nodes: MeshNode[];
  links: MeshLinkEdge[];
  sample: TelemetrySample;
  newEvents: DiagnosticEvent[];
}

export function stepMeshSimulation(
  prevNodes: MeshNode[],
  prevLinks: MeshLinkEdge[],
  config: SimulationConfig,
  tickCount: number
): SimulationStepResult {
  const now = Date.now();
  const timeLabel = formatTimeLabel(now);
  const newEvents: DiagnosticEvent[] = [];

  const profileTrafficMultiplier =
    config.trafficProfile === 'nominal'
      ? 1.0
      : config.trafficProfile === 'burst'
      ? 1.55 + Math.sin(tickCount * 0.65) * 0.35
      : 2.15;

  const interferenceFactor = config.interferenceLevel / 100; // 0..1

  const nodeMap = new Map<string, MeshNode>();
  prevNodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  // 1. Update physical RF link conditions
  const updatedLinks: MeshLinkEdge[] = prevLinks.map((link) => {
    const srcNode = nodeMap.get(link.source);
    const dstNode = nodeMap.get(link.target);
    const bothOnline =
      srcNode && dstNode && !srcNode.forcedOffline && !dstNode.forcedOffline;

    const degradedPenalty =
      (srcNode?.forcedDegraded ? 12 : 0) + (dstNode?.forcedDegraded ? 12 : 0);

    const bandInterferencePenalty =
      link.band === '2.4 GHz'
        ? interferenceFactor * 16
        : link.band === '5 GHz'
        ? interferenceFactor * 11
        : interferenceFactor * 6;

    const currentRssi = clamp(
      link.baseRssi - bandInterferencePenalty - degradedPenalty + noise(1.8),
      -92,
      -34
    );

    const noiseFloor = -95 + interferenceFactor * 14 + noise(1.2);
    const snrDb = clamp(currentRssi - noiseFloor, 4, 52);

    // Packet loss rises sharply when SNR drops below 20 dB
    const snrLoss = snrDb < 22 ? Math.pow((22 - snrDb) / 5.5, 1.8) : 0.08;
    const congestionLoss =
      config.trafficProfile === 'congestion'
        ? 1.4
        : config.trafficProfile === 'burst'
        ? 0.45
        : 0.05;

    const linkLossPct = bothOnline
      ? clamp(snrLoss + congestionLoss + Math.abs(noise(0.28)), 0.02, 48)
      : 100;

    const baseHopLatency = 1.8 + link.distanceMeters * 0.065;
    const queueingDelay =
      profileTrafficMultiplier * 2.2 +
      (linkLossPct > 2 ? linkLossPct * 1.45 : 0) +
      interferenceFactor * 6.5;

    const linkLatencyMs = bothOnline
      ? clamp(baseHopLatency + queueingDelay + Math.abs(noise(1.1)), 1.4, 140)
      : 999;

    const utilizationPct = bothOnline
      ? clamp(
          (18 + (link.band === '2.4 GHz' ? 14 : 6)) * profileTrafficMultiplier +
            interferenceFactor * 20 +
            noise(4),
          4,
          98
        )
      : 0;

    return {
      ...link,
      active: Boolean(bothOnline),
      currentRssi: Number(currentRssi.toFixed(1)),
      snrDb: Number(snrDb.toFixed(1)),
      linkLossPct: Number(linkLossPct.toFixed(2)),
      linkLatencyMs: Number(linkLatencyMs.toFixed(1)),
      utilizationPct: Number(utilizationPct.toFixed(1)),
    };
  });

  // 2. Shortest-path routing from every node to nearest online gateway (Dijkstra)
  const distToGw = new Map<string, number>();
  const nextHop = new Map<string, string | null>();
  const hopCounts = new Map<string, number>();
  const pathLossToGw = new Map<string, number>();
  const visited = new Set<string>();

  prevNodes.forEach((n) => {
    if (n.role === 'gateway' && !n.forcedOffline) {
      distToGw.set(n.id, n.forcedDegraded ? 9.5 : 2.1 + Math.abs(noise(0.4)));
      nextHop.set(n.id, null);
      hopCounts.set(n.id, 0);
      pathLossToGw.set(n.id, n.forcedDegraded ? 1.8 : 0.05);
    } else {
      distToGw.set(n.id, Infinity);
      nextHop.set(n.id, null);
      hopCounts.set(n.id, -1);
      pathLossToGw.set(n.id, 100);
    }
  });

  for (let i = 0; i < prevNodes.length; i++) {
    let bestId: string | null = null;
    let bestCost = Infinity;
    for (const n of prevNodes) {
      if (visited.has(n.id) || n.forcedOffline) continue;
      const d = distToGw.get(n.id) ?? Infinity;
      if (d < bestCost) {
        bestCost = d;
        bestId = n.id;
      }
    }
    if (!bestId || bestCost === Infinity) break;
    visited.add(bestId);

    const bestNode = nodeMap.get(bestId)!;
    const currentHops = hopCounts.get(bestId) ?? 0;
    const currentLoss = pathLossToGw.get(bestId) ?? 0;

    for (const link of updatedLinks) {
      if (!link.active) continue;
      const neighborId =
        link.source === bestId
          ? link.target
          : link.target === bestId
          ? link.source
          : null;
      if (!neighborId || visited.has(neighborId)) continue;

      const neighborNode = nodeMap.get(neighborId);
      if (!neighborNode || neighborNode.forcedOffline) continue;

      // Cost considers latency + loss penalty
      const edgeCost = link.linkLatencyMs + link.linkLossPct * 1.8;
      const candidateDist = bestCost + edgeCost;
      if (candidateDist < (distToGw.get(neighborId) ?? Infinity)) {
        distToGw.set(neighborId, candidateDist);
        nextHop.set(neighborId, bestNode.id);
        hopCounts.set(neighborId, currentHops + 1);
        // Compound packet delivery probability across hops
        const delivery =
          (1 - currentLoss / 100) * (1 - link.linkLossPct / 100);
        pathLossToGw.set(neighborId, clamp((1 - delivery) * 100, 0, 100));
      }
    }
  }

  // Reconstruct route paths and compute final per-node metrics
  const updatedNodes: MeshNode[] = prevNodes.map((prev) => {
    if (prev.forcedOffline) {
      return {
        ...prev,
        status: 'offline',
        hopCount: -1,
        uplinkNodeId: null,
        routePath: [],
        rssiDbm: -96,
        snrDb: 0,
        latencyMs: 0,
        jitterMs: 0,
        packetLossPct: 100,
        throughputMbps: 0,
        airtimePct: 0,
      };
    }

    const hops = hopCounts.get(prev.id) ?? -1;
    const uplink = nextHop.get(prev.id) ?? null;

    if (hops === -1) {
      // Partitioned / isolated node
      return {
        ...prev,
        status: 'offline',
        hopCount: -1,
        uplinkNodeId: null,
        routePath: [],
        rssiDbm: -91,
        snrDb: 2,
        latencyMs: 0,
        jitterMs: 0,
        packetLossPct: 100,
        throughputMbps: 0,
        airtimePct: 0,
      };
    }

    // Build path array
    const routePath: string[] = [prev.id];
    let cursor = uplink;
    let safety = 0;
    while (cursor && safety < 10) {
      routePath.push(cursor);
      cursor = nextHop.get(cursor) ?? null;
      safety++;
    }

    // Find uplink edge stats
    const uplinkEdge = uplink
      ? updatedLinks.find(
          (l) =>
            (l.source === prev.id && l.target === uplink) ||
            (l.target === prev.id && l.source === uplink)
        )
      : null;

    const rssiDbm = uplinkEdge
      ? uplinkEdge.currentRssi
      : clamp(-41 - interferenceFactor * 5 + noise(1.2), -65, -32);
    const snrDb = uplinkEdge
      ? uplinkEdge.snrDb
      : clamp(44 - interferenceFactor * 9 + noise(1.5), 18, 52);

    const rawLatency = distToGw.get(prev.id) ?? 4.5;
    const latencyMs = clamp(
      rawLatency + (prev.forcedDegraded ? 18 : 0) + Math.abs(noise(1.3)),
      1.5,
      260
    );

    const jitterMs = clamp(
      0.8 + hops * 1.1 + interferenceFactor * 5.2 + Math.abs(noise(1.1)),
      0.3,
      45
    );

    const packetLossPct = clamp(
      (pathLossToGw.get(prev.id) ?? 0.1) + (prev.forcedDegraded ? 3.5 : 0),
      0.02,
      65
    );

    // Throughput degrades per hop (~30% overhead per wireless hop) and with packet loss
    const hopEfficiency = Math.pow(0.72, Math.max(0, hops - 1));
    const baseCap = uplinkEdge ? uplinkEdge.maxCapacityMbps : 880;
    const lossEfficiency = Math.max(0.15, 1 - packetLossPct / 45);
    const loadScale =
      config.trafficProfile === 'nominal'
        ? 0.56
        : config.trafficProfile === 'burst'
        ? 0.78 + Math.sin(tickCount * 0.65) * 0.14
        : 0.91;

    const throughputMbps = clamp(
      baseCap *
        hopEfficiency *
        lossEfficiency *
        loadScale *
        (prev.forcedDegraded ? 0.52 : 1) +
        noise(12),
      8,
      960
    );

    const airtimePct = uplinkEdge
      ? uplinkEdge.utilizationPct
      : clamp(22 * profileTrafficMultiplier + noise(3), 8, 95);

    let status: NodeStatus = 'nominal';
    if (
      prev.forcedDegraded ||
      latencyMs > config.latencyThresholdMs ||
      packetLossPct > config.packetLossThresholdPct ||
      rssiDbm < -76
    ) {
      status = 'degraded';
    }

    // Detect route reconvergence event
    if (
      prev.uplinkNodeId &&
      uplink &&
      prev.uplinkNodeId !== uplink &&
      tickCount > 1
    ) {
      newEvents.push({
        id: `evt-${now}-${prev.id}-route`,
        timestamp: now,
        timeLabel,
        severity: 'info',
        category: 'routing',
        nodeId: prev.id,
        title: `Route reconverged for ${prev.id}`,
        detail: `Uplink switched from ${prev.uplinkNodeId} to ${uplink} (${hops} hop${hops === 1 ? '' : 's'}).`,
      });
    }

    // Detect threshold transitions
    if (
      prev.status === 'nominal' &&
      status === 'degraded' &&
      !prev.forcedDegraded &&
      tickCount > 1
    ) {
      if (packetLossPct > config.packetLossThresholdPct) {
        newEvents.push({
          id: `evt-${now}-${prev.id}-loss`,
          timestamp: now,
          timeLabel,
          severity: 'warning',
          category: 'packet_loss',
          nodeId: prev.id,
          title: `Elevated packet loss on ${prev.id}`,
          detail: `Measured ${packetLossPct.toFixed(2)}% loss (threshold ${config.packetLossThresholdPct}%).`,
        });
      } else if (latencyMs > config.latencyThresholdMs) {
        newEvents.push({
          id: `evt-${now}-${prev.id}-lat`,
          timestamp: now,
          timeLabel,
          severity: 'warning',
          category: 'latency',
          nodeId: prev.id,
          title: `Latency threshold exceeded on ${prev.id}`,
          detail: `RTT reached ${latencyMs.toFixed(1)} ms (threshold ${config.latencyThresholdMs} ms).`,
        });
      }
    }

    return {
      ...prev,
      status,
      hopCount: hops,
      uplinkNodeId: uplink,
      routePath,
      rssiDbm: Number(rssiDbm.toFixed(1)),
      snrDb: Number(snrDb.toFixed(1)),
      latencyMs: Number(latencyMs.toFixed(1)),
      jitterMs: Number(jitterMs.toFixed(1)),
      packetLossPct: Number(packetLossPct.toFixed(2)),
      throughputMbps: Number(throughputMbps.toFixed(1)),
      airtimePct: Number(airtimePct.toFixed(1)),
      uptimeSec: prev.uptimeSec + Math.round(config.intervalMs / 1000),
    };
  });

  // 3. Aggregate telemetry sample
  const onlineNodes = updatedNodes.filter((n) => n.status !== 'offline');
  const latencies = onlineNodes
    .map((n) => n.latencyMs)
    .sort((a, b) => a - b);

  const avgLatencyMs =
    onlineNodes.length > 0
      ? onlineNodes.reduce((sum, n) => sum + n.latencyMs, 0) / onlineNodes.length
      : 0;

  const p95Index = Math.max(0, Math.ceil(latencies.length * 0.95) - 1);
  const p95LatencyMs = latencies.length > 0 ? latencies[p95Index] : 0;

  const avgJitterMs =
    onlineNodes.length > 0
      ? onlineNodes.reduce((sum, n) => sum + n.jitterMs, 0) / onlineNodes.length
      : 0;

  const avgPacketLossPct =
    onlineNodes.length > 0
      ? onlineNodes.reduce((sum, n) => sum + n.packetLossPct, 0) /
        onlineNodes.length
      : 100;

  const retransmissionPct = clamp(
    avgPacketLossPct * 2.4 + interferenceFactor * 4.2 + Math.abs(noise(0.4)),
    0.1,
    75
  );

  // Aggregate mesh throughput across client + relay links (gateway egress)
  const gatewayThroughput = updatedNodes
    .filter((n) => n.role === 'gateway' && n.status !== 'offline')
    .reduce((sum, n) => sum + n.throughputMbps, 0);

  const clientThroughput = updatedNodes
    .filter((n) => n.role !== 'gateway' && n.status !== 'offline')
    .reduce((sum, n) => sum + n.throughputMbps, 0);

  const aggregateThroughput =
    onlineNodes.length > 0
      ? Math.min(gatewayThroughput * 1.15, clientThroughput * 0.52)
      : 0;

  const goodputMbps = aggregateThroughput * Math.max(0.3, 1 - avgPacketLossPct / 100 - retransmissionPct / 220);

  const avgRssiDbm =
    onlineNodes.length > 0
      ? onlineNodes.reduce((sum, n) => sum + n.rssiDbm, 0) / onlineNodes.length
      : -95;

  const avgSnrDb =
    onlineNodes.length > 0
      ? onlineNodes.reduce((sum, n) => sum + n.snrDb, 0) / onlineNodes.length
      : 0;

  const sample: TelemetrySample = {
    timestamp: now,
    timeLabel,
    avgLatencyMs: Number(avgLatencyMs.toFixed(1)),
    p95LatencyMs: Number(p95LatencyMs.toFixed(1)),
    jitterMs: Number(avgJitterMs.toFixed(1)),
    packetLossPct: Number(avgPacketLossPct.toFixed(2)),
    retransmissionPct: Number(retransmissionPct.toFixed(2)),
    throughputMbps: Number(aggregateThroughput.toFixed(1)),
    goodputMbps: Number(goodputMbps.toFixed(1)),
    activeNodes: onlineNodes.length,
    avgRssiDbm: Number(avgRssiDbm.toFixed(1)),
    avgSnrDb: Number(avgSnrDb.toFixed(1)),
  };

  return {
    nodes: updatedNodes,
    links: updatedLinks,
    sample,
    newEvents,
  };
}

export function generateSeedHistory(
  config: SimulationConfig,
  count = 24
): {
  nodes: MeshNode[];
  links: MeshLinkEdge[];
  samples: TelemetrySample[];
} {
  let nodes = createInitialNodes();
  let links = createInitialLinks();
  const samples: TelemetrySample[] = [];
  const stepMs = config.intervalMs;
  const baseNow = Date.now() - count * stepMs;

  for (let i = 0; i < count; i++) {
    const res = stepMeshSimulation(nodes, links, config, i);
    const ts = baseNow + i * stepMs;
    nodes = res.nodes;
    links = res.links;
    samples.push({
      ...res.sample,
      timestamp: ts,
      timeLabel: formatTimeLabel(ts),
    });
  }

  return { nodes, links, samples };
}
