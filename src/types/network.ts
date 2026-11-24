export type NodeRole = 'gateway' | 'relay' | 'client';
export type NodeStatus = 'nominal' | 'degraded' | 'offline';
export type TrafficProfile = 'nominal' | 'burst' | 'congestion';
export type SeverityLevel = 'info' | 'warning' | 'critical';
export type DashboardSection = 'overview' | 'topology' | 'links' | 'diagnostics';

export interface MeshLinkEdge {
  id: string;
  source: string;
  target: string;
  baseRssi: number; // dBm, e.g. -52
  maxCapacityMbps: number;
  distanceMeters: number;
  band: '6 GHz' | '5 GHz' | '2.4 GHz';
  channel: number;
  active: boolean;
  currentRssi: number;
  snrDb: number;
  linkLossPct: number;
  linkLatencyMs: number;
  utilizationPct: number;
}

export interface MeshNode {
  id: string;
  name: string;
  role: NodeRole;
  ipAddress: string;
  macAddress: string;
  band: '6 GHz' | '5 GHz' | '2.4 GHz';
  channel: number;
  firmware: string;
  x: number; // 0-100 coordinate space
  y: number; // 0-100 coordinate space
  forcedOffline: boolean;
  forcedDegraded: boolean;
  status: NodeStatus;
  hopCount: number; // 0 for gateway, -1 if unreachable
  uplinkNodeId: string | null;
  routePath: string[]; // Node IDs from this node to nearest gateway
  rssiDbm: number;
  snrDb: number;
  latencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  throughputMbps: number;
  airtimePct: number;
  uptimeSec: number;
}

export interface TelemetrySample {
  timestamp: number;
  timeLabel: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  retransmissionPct: number;
  throughputMbps: number;
  goodputMbps: number;
  activeNodes: number;
  avgRssiDbm: number;
  avgSnrDb: number;
}

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  timeLabel: string;
  severity: SeverityLevel;
  category: 'latency' | 'packet_loss' | 'failover' | 'routing' | 'interference';
  nodeId: string;
  title: string;
  detail: string;
}

export interface SimulationConfig {
  isStreaming: boolean;
  intervalMs: 1000 | 2000 | 5000;
  trafficProfile: TrafficProfile;
  interferenceLevel: number; // 0 to 100
  latencyThresholdMs: number;
  packetLossThresholdPct: number;
}
