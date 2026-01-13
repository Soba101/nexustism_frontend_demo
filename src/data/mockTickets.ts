import { Ticket, GraphCluster, GraphNode, GraphEdge } from '../types';

/**
 * Mock Data for ITSM Dashboard
 * TODO: Replace with real API calls when backend is ready
 */

export const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    number: 'TKT001052',
    short_description: 'VPN connection failing for remote users in SG office',
    description: 'Multiple users reporting timeout when connecting to SG-VPN-01 gateway. The authentication phase passes, but the handshake fails at step 3. Network team has confirmed the firewall rules were updated last night.',
    category: 'Network',
    priority: 'High',
    state: 'New',
    opened_at: '2026-01-10T08:30:00Z',
    assigned_group: 'Network Operations',
    similarity_score: 98,
    related_ids: ['3', '4']
  },
  {
    id: '2',
    number: 'TKT001048',
    short_description: 'Outlook keeps prompting for password after 2FA',
    description: 'User recently changed password. Now Outlook desktop client prompts for credentials every 30 minutes. Webmail works fine.',
    category: 'Software',
    priority: 'Medium',
    state: 'In Progress',
    opened_at: '2026-01-10T07:15:00Z',
    assigned_group: 'Service Desk L2',
    similarity_score: 45,
    related_ids: []
  },
  {
    id: '3',
    number: 'TKT000985',
    short_description: 'Singapore VPN Gateway high latency',
    description: 'Monitoring alert: SG-VPN-01 exceeding 200ms latency threshold. Potential packet loss observed on upstream ISP link.',
    category: 'Network',
    priority: 'Medium',
    state: 'Resolved',
    opened_at: '2025-12-15T14:20:00Z',
    resolved_at: '2025-12-15T16:00:00Z',
    assigned_group: 'Network Operations',
    similarity_score: 82,
    related_ids: ['1']
  },
  {
    id: '4',
    number: 'TKT000821',
    short_description: 'Unable to connect to VPN (Error 800)',
    description: 'Users unable to establish VPN tunnel. Logs show certificate validation failure.',
    category: 'Network',
    priority: 'High',
    state: 'Closed',
    opened_at: '2025-11-20T09:00:00Z',
    resolved_at: '2025-11-20T11:30:00Z',
    assigned_group: 'Network Security',
    similarity_score: 75,
    related_ids: ['1']
  },
  {
    id: '5',
    number: 'TKT001055',
    short_description: 'SAP ERP Login extremely slow during report generation',
    description: 'Finance team reports SAP login takes >2 minutes. Coincides with end-of-month reporting batch jobs.',
    category: 'Software',
    priority: 'Critical',
    state: 'New',
    opened_at: '2026-01-10T09:15:00Z',
    assigned_group: 'SAP Basis',
    similarity_score: 12,
    related_ids: []
  },
  {
    id: '6',
    number: 'TKT001060',
    short_description: 'Printer 3F-North jamming continuously',
    description: 'Physical paper jam sensor error even after clearing tray.',
    category: 'Hardware',
    priority: 'Low',
    state: 'New',
    opened_at: '2026-01-10T10:00:00Z',
    assigned_group: 'Field Services',
    similarity_score: 5,
    related_ids: []
  },
  {
    id: '7',
    number: 'TKT001062',
    short_description: 'Unable to access shared drive H:',
    description: 'Drive mapping script fails on startup.',
    category: 'Access',
    priority: 'Medium',
    state: 'New',
    opened_at: '2026-01-10T11:20:00Z',
    assigned_group: 'Service Desk L1',
    similarity_score: 20,
    related_ids: []
  }
];

export const GRAPH_CLUSTERS: GraphCluster[] = [
  { id: 'cluster_vpn', label: 'Network Layer', color: '#3b82f6' },
  { id: 'cluster_change', label: 'Recent Changes', color: '#eab308' },
  { id: 'cluster_external', label: 'External Factors', color: '#ef4444' }
];

export const GRAPH_NODES: GraphNode[] = [
  { id: '1', label: 'TKT001052', type: 'root', parent: 'cluster_vpn', details: 'Root Ticket: VPN Connection Failure' },
  { id: '3', label: 'TKT000985', type: 'cause', parent: 'cluster_vpn', details: 'Previous Ticket: Gateway Latency' },
  { id: '8', label: 'CHG000451', type: 'change', parent: 'cluster_change', details: 'Change Request: Firewall Rule Update' },
  { id: '4', label: 'TKT000821', type: 'related', parent: 'cluster_vpn', details: 'Similar Issue: Cert Failure (Medium Confidence)' },
  { id: '9', label: 'PRB000120', type: 'problem', parent: 'cluster_external', details: 'Problem Investigation: ISP Stability' },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { source: '8', target: '3', confidence: 0.90, label: 'Caused' },
  { source: '3', target: '1', confidence: 0.95, label: 'Recurrence' },
  { source: '4', target: '1', confidence: 0.60, label: 'Similar' },
  { source: '1', target: '9', confidence: 0.85, label: 'Escalated To' },
];
