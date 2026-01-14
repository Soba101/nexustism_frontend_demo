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

export const GRAPH_NODES: GraphNode[] = [
  { id: '1', label: 'TKT001052', type: 'root', details: 'Root Ticket: VPN Connection Failure' },
  { id: '3', label: 'TKT000985', type: 'cause', details: 'Previous Ticket: Gateway Latency' },
  { id: '8', label: 'CHG000451', type: 'change', details: 'Change Request: Firewall Rule Update' },
  { id: '4', label: 'TKT000821', type: 'related', details: 'Similar Issue: Cert Failure (Medium Confidence)' },
  { id: '9', label: 'PRB000120', type: 'problem', details: 'Problem Investigation: ISP Stability' },
  // Additional nodes for stress testing (uncomment for larger graph)
  // { id: '10', label: 'TKT001053', type: 'cause', details: 'DNS Resolution Timeout' },
  // { id: '11', label: 'TKT001054', type: 'related', details: 'Network Slowness Report' },
  // { id: '12', label: 'CHG000452', type: 'change', details: 'Load Balancer Configuration' },
  // { id: '13', label: 'TKT001055', type: 'cause', details: 'Authentication Service Down' },
  // { id: '14', label: 'PRB000121', type: 'problem', details: 'Recurring VPN Issues' },
  // { id: '15', label: 'TKT001056', type: 'related', details: 'Email Access Problems' },
  // { id: '16', label: 'TKT001057', type: 'cause', details: 'Database Connection Pool Exhausted' },
  // { id: '17', label: 'CHG000453', type: 'change', details: 'SSL Certificate Renewal' },
  // { id: '18', label: 'TKT001058', type: 'related', details: 'Mobile App Login Failure' },
  // { id: '19', label: 'TKT001059', type: 'cause', details: 'Proxy Server Misconfiguration' },
  // { id: '20', label: 'PRB000122', type: 'problem', details: 'Authentication Infrastructure Review' },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { source: '8', target: '3', confidence: 0.90, label: 'Caused' },
  { source: '3', target: '1', confidence: 0.95, label: 'Recurrence' },
  { source: '4', target: '1', confidence: 0.60, label: 'Similar' },
  { source: '1', target: '9', confidence: 0.85, label: 'Escalated To' },
  // Additional edges for stress testing (uncomment with nodes above)
  // { source: '10', target: '1', confidence: 0.75, label: 'Related' },
  // { source: '11', target: '3', confidence: 0.65, label: 'Similar' },
  // { source: '12', target: '10', confidence: 0.82, label: 'Caused' },
  // { source: '13', target: '1', confidence: 0.88, label: 'Root Cause' },
  // { source: '14', target: '1', confidence: 0.70, label: 'Investigation' },
  // { source: '15', target: '13', confidence: 0.55, label: 'Related' },
  // { source: '16', target: '13', confidence: 0.78, label: 'Caused' },
  // { source: '17', target: '4', confidence: 0.92, label: 'Resolved' },
  // { source: '18', target: '13', confidence: 0.68, label: 'Similar' },
  // { source: '19', target: '3', confidence: 0.85, label: 'Caused' },
  // { source: '20', target: '13', confidence: 0.80, label: 'Escalated To' },
];
