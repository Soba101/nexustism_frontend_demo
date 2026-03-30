import type {
  AnalyticsDuplicates,
  AnalyticsIsolation,
  AnalyticsModelAccuracy,
  AnalyticsPeriod,
  AnalyticsPredictions,
  AnalyticsProblemTickets,
  AnalyticsRootCauses,
  AnalyticsSystems,
  AnalyticsTeamWorkflow,
  AnalyticsVectorLabelBy,
  AnalyticsVectorMap,
  DataStatus,
  GraphEdge,
  GraphNode,
  ServiceNowConfig,
  ServiceNowSyncStatusItem,
  SyncType,
  ProblemCategory,
  Ticket,
  TicketPriority,
  UserPreferences,
  UserRoleInfo,
} from '@/types';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const NOW = new Date('2026-03-31T09:00:00.000Z');

const isoDaysAgo = (days: number, hour: number) => {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};

const isResolvedState = (state: Ticket['state']) => state === 'Resolved' || state === 'Closed';
const clampValue = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getResolutionHours = (ticket: Ticket) => {
  if (!ticket.resolved_at) return null;
  const opened = new Date(ticket.opened_at).getTime();
  const resolved = new Date(ticket.resolved_at).getTime();
  return Math.max(0.5, Math.round(((resolved - opened) / (1000 * 60 * 60)) * 10) / 10);
};

const buildInitialTickets = (): Ticket[] => [
  {
    id: 'INC100001',
    number: 'INC100001',
    short_description: 'VPN timeout for Singapore remote staff',
    description: 'Remote users lose VPN connectivity during peak login windows after 9 AM.',
    category: 'Network',
    priority: 'High',
    state: 'Resolved',
    opened_at: isoDaysAgo(1, 1),
    resolved_at: isoDaysAgo(1, 5),
    assigned_group: 'Network Ops',
    similarity_score: 92,
    related_ids: ['INC100002', 'INC100012', 'PRB000101'],
  },
  {
    id: 'INC100002',
    number: 'INC100002',
    short_description: 'VPN session drops after eight minutes',
    description: 'The VPN concentrator resets sessions for remote engineers after a few minutes.',
    category: 'Network',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(2, 2),
    assigned_group: 'Network Ops',
    similarity_score: 89,
    related_ids: ['INC100001', 'INC100012', 'PRB000101'],
  },
  {
    id: 'INC100003',
    number: 'INC100003',
    short_description: 'MFA push not delivered for finance laptops',
    description: 'Finance users are not receiving MFA push prompts after a certificate rollover.',
    category: 'Access',
    priority: 'Medium',
    state: 'New',
    opened_at: isoDaysAgo(3, 3),
    assigned_group: 'Identity Access',
    similarity_score: 76,
    related_ids: ['INC100009'],
  },
  {
    id: 'INC100004',
    number: 'INC100004',
    short_description: 'Database deadlocks on order sync job',
    description: 'The order sync batch is timing out due to deadlocks in the reporting cluster.',
    category: 'Database',
    priority: 'Critical',
    state: 'In Progress',
    opened_at: isoDaysAgo(4, 4),
    assigned_group: 'DBA Team',
    similarity_score: 95,
    related_ids: ['INC100010', 'PRB000102'],
  },
  {
    id: 'INC100005',
    number: 'INC100005',
    short_description: 'Payment API latency spike after deploy',
    description: 'Checkout response times increased following the latest payment service deployment.',
    category: 'Software',
    priority: 'High',
    state: 'Resolved',
    opened_at: isoDaysAgo(5, 5),
    resolved_at: isoDaysAgo(5, 9),
    assigned_group: 'Platform Services',
    similarity_score: 84,
    related_ids: ['INC100011'],
  },
  {
    id: 'INC100006',
    number: 'INC100006',
    short_description: 'Wi-Fi packet loss in east wing',
    description: 'The east wing access points show elevated packet loss for conference traffic.',
    category: 'Network',
    priority: 'Medium',
    state: 'Resolved',
    opened_at: isoDaysAgo(7, 8),
    resolved_at: isoDaysAgo(7, 12),
    assigned_group: 'Network Ops',
    similarity_score: 64,
    related_ids: [],
  },
  {
    id: 'INC100007',
    number: 'INC100007',
    short_description: 'Laptop blue screen after March security update',
    description: 'Endpoints crash after installing the latest security patch bundle.',
    category: 'Hardware',
    priority: 'High',
    state: 'New',
    opened_at: isoDaysAgo(6, 10),
    assigned_group: 'Endpoint Engineering',
    similarity_score: 81,
    related_ids: ['INC100013', 'INC100014'],
  },
  {
    id: 'INC100008',
    number: 'INC100008',
    short_description: 'Printer spooler crash on legal floor',
    description: 'Print jobs fail because the local spooler service keeps restarting.',
    category: 'Hardware',
    priority: 'Low',
    state: 'Resolved',
    opened_at: isoDaysAgo(10, 11),
    resolved_at: isoDaysAgo(10, 12),
    assigned_group: 'Endpoint Engineering',
    similarity_score: 52,
    related_ids: [],
  },
  {
    id: 'INC100009',
    number: 'INC100009',
    short_description: 'SSO redirect loop for contractors',
    description: 'Contractor accounts bounce between the identity provider and the portal.',
    category: 'Access',
    priority: 'Medium',
    state: 'Resolved',
    opened_at: isoDaysAgo(12, 7),
    resolved_at: isoDaysAgo(12, 10),
    assigned_group: 'Identity Access',
    similarity_score: 71,
    related_ids: ['INC100003'],
  },
  {
    id: 'INC100010',
    number: 'INC100010',
    short_description: 'Nightly ETL failed due to lock timeout',
    description: 'Warehouse refresh jobs fail when the reporting database is saturated.',
    category: 'Database',
    priority: 'High',
    state: 'Resolved',
    opened_at: isoDaysAgo(9, 2),
    resolved_at: isoDaysAgo(9, 6),
    assigned_group: 'DBA Team',
    similarity_score: 88,
    related_ids: ['INC100004', 'PRB000102'],
  },
  {
    id: 'INC100011',
    number: 'INC100011',
    short_description: 'Checkout service elevated 5xx errors',
    description: 'Checkout service returns intermittent 5xx errors after a config reload.',
    category: 'Software',
    priority: 'Critical',
    state: 'Closed',
    opened_at: isoDaysAgo(14, 1),
    resolved_at: isoDaysAgo(14, 7),
    assigned_group: 'Platform Services',
    similarity_score: 86,
    related_ids: ['INC100005'],
  },
  {
    id: 'INC100012',
    number: 'INC100012',
    short_description: 'VPN concentrator CPU saturation alert',
    description: 'Primary VPN concentrator CPU sustained above 90 percent for thirty minutes.',
    category: 'Network',
    priority: 'Critical',
    state: 'Resolved',
    opened_at: isoDaysAgo(16, 0),
    resolved_at: isoDaysAgo(16, 3),
    assigned_group: 'Network Ops',
    similarity_score: 93,
    related_ids: ['INC100001', 'INC100002', 'PRB000101'],
  },
  {
    id: 'INC100013',
    number: 'INC100013',
    short_description: 'Blue screen after endpoint hardening update',
    description: 'Devices reboot into blue screens after the endpoint hardening package installs.',
    category: 'Hardware',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(8, 9),
    assigned_group: 'Endpoint Engineering',
    similarity_score: 83,
    related_ids: ['INC100007', 'INC100014'],
  },
  {
    id: 'INC100014',
    number: 'INC100014',
    short_description: 'Workstations crash after overnight patch cycle',
    description: 'A subset of workstations crash after the overnight OS and firmware patch cycle.',
    category: 'Hardware',
    priority: 'Medium',
    state: 'New',
    opened_at: isoDaysAgo(11, 10),
    assigned_group: 'Endpoint Engineering',
    similarity_score: 79,
    related_ids: ['INC100007', 'INC100013'],
  },
  {
    id: 'INC100015',
    number: 'INC100015',
    short_description: 'Wireless roaming failures on executive floor',
    description: 'Executives lose connectivity when roaming between conference rooms on the east wing wireless fabric.',
    category: 'Network',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(2, 9),
    assigned_group: 'Network Ops',
    similarity_score: 87,
    related_ids: ['INC100006', 'INC100016', 'INC100017', 'PRB000105'],
  },
  {
    id: 'INC100016',
    number: 'INC100016',
    short_description: 'Core switch uplink flaps in HQ building B',
    description: 'The building B core switch uplink resets intermittently during heavy wireless usage windows.',
    category: 'Network',
    priority: 'Critical',
    state: 'Resolved',
    opened_at: isoDaysAgo(3, 6),
    resolved_at: isoDaysAgo(3, 10),
    assigned_group: 'Network Ops',
    similarity_score: 91,
    related_ids: ['INC100015', 'INC100017', 'INC100018', 'PRB000105'],
  },
  {
    id: 'INC100017',
    number: 'INC100017',
    short_description: 'East wing conference Wi-Fi stalls during town hall',
    description: 'Large meetings on the east wing cause Wi-Fi throughput collapse and packet retransmits.',
    category: 'Network',
    priority: 'High',
    state: 'Resolved',
    opened_at: isoDaysAgo(6, 9),
    resolved_at: isoDaysAgo(6, 13),
    assigned_group: 'Network Ops',
    similarity_score: 85,
    related_ids: ['INC100006', 'INC100015', 'INC100016', 'PRB000105'],
  },
  {
    id: 'INC100018',
    number: 'INC100018',
    short_description: 'Packet drops between SD-WAN edge and ERP subnet',
    description: 'ERP traffic sees intermittent packet loss across the SD-WAN edge after a routing policy update.',
    category: 'Network',
    priority: 'Medium',
    state: 'New',
    opened_at: isoDaysAgo(5, 4),
    assigned_group: 'Site Reliability',
    similarity_score: 77,
    related_ids: ['INC100016', 'PRB000105'],
  },
  {
    id: 'INC100019',
    number: 'INC100019',
    short_description: 'Provisioned users missing Okta groups after HR import',
    description: 'New hires are created without the expected Okta groups after the nightly HR feed runs.',
    category: 'Access',
    priority: 'High',
    state: 'Resolved',
    opened_at: isoDaysAgo(3, 1),
    resolved_at: isoDaysAgo(3, 7),
    assigned_group: 'Identity Access',
    similarity_score: 82,
    related_ids: ['INC100003', 'INC100021', 'PRB000103'],
  },
  {
    id: 'INC100020',
    number: 'INC100020',
    short_description: 'Password reset loop for sales contractors',
    description: 'Contractors can submit password resets but are sent back to the reset form repeatedly.',
    category: 'Access',
    priority: 'Medium',
    state: 'In Progress',
    opened_at: isoDaysAgo(4, 3),
    assigned_group: 'Identity Access',
    similarity_score: 74,
    related_ids: ['INC100009', 'PRB000103'],
  },
  {
    id: 'INC100021',
    number: 'INC100021',
    short_description: 'MFA enrollment blocked on mobile authenticator',
    description: 'Users cannot complete MFA enrollment because device tokens are rejected after policy sync.',
    category: 'Access',
    priority: 'High',
    state: 'Resolved',
    opened_at: isoDaysAgo(7, 2),
    resolved_at: isoDaysAgo(7, 8),
    assigned_group: 'Identity Access',
    similarity_score: 84,
    related_ids: ['INC100003', 'INC100019', 'PRB000103'],
  },
  {
    id: 'INC100022',
    number: 'INC100022',
    short_description: 'Read replica lag exceeds twelve minutes after promotion',
    description: 'The reporting read replica accumulates replication lag after a failover exercise and misses freshness targets.',
    category: 'Database',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(2, 5),
    assigned_group: 'DBA Team',
    similarity_score: 83,
    related_ids: ['INC100023', 'INC100024', 'PRB000102'],
  },
  {
    id: 'INC100023',
    number: 'INC100023',
    short_description: 'Inventory query cache invalidation causes lock waits',
    description: 'Cache invalidation jobs trigger lock waits on inventory reporting tables during the top of the hour.',
    category: 'Database',
    priority: 'Medium',
    state: 'Resolved',
    opened_at: isoDaysAgo(8, 6),
    resolved_at: isoDaysAgo(8, 11),
    assigned_group: 'DBA Team',
    similarity_score: 80,
    related_ids: ['INC100004', 'INC100022', 'PRB000102'],
  },
  {
    id: 'INC100024',
    number: 'INC100024',
    short_description: 'Finance dashboard timeouts during report refresh',
    description: 'Finance dashboards exceed timeout thresholds when concurrent report refreshes hit the reporting cluster.',
    category: 'Database',
    priority: 'High',
    state: 'New',
    opened_at: isoDaysAgo(1, 4),
    assigned_group: 'Analytics Engineering',
    similarity_score: 78,
    related_ids: ['INC100010', 'INC100022', 'PRB000102'],
  },
  {
    id: 'INC100025',
    number: 'INC100025',
    short_description: 'Feature flag rollout breaks checkout tax service',
    description: 'A new feature flag path causes tax computations to fail for a subset of checkout requests.',
    category: 'Software',
    priority: 'Critical',
    state: 'Resolved',
    opened_at: isoDaysAgo(2, 1),
    resolved_at: isoDaysAgo(2, 6),
    assigned_group: 'Platform Services',
    similarity_score: 90,
    related_ids: ['INC100011', 'INC100026', 'INC100028', 'PRB000104'],
  },
  {
    id: 'INC100026',
    number: 'INC100026',
    short_description: 'Cart service returns stale promotions after cache warmup',
    description: 'Customers see outdated promotions after the cart cache warmup job completes on new pods.',
    category: 'Software',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(3, 2),
    assigned_group: 'Platform Services',
    similarity_score: 86,
    related_ids: ['INC100005', 'INC100025', 'PRB000104'],
  },
  {
    id: 'INC100027',
    number: 'INC100027',
    short_description: 'Customer portal blank screen after release 2026.13',
    description: 'The portal loads shell assets but fails to hydrate after the latest release due to a chunk mismatch.',
    category: 'Software',
    priority: 'Medium',
    state: 'Resolved',
    opened_at: isoDaysAgo(9, 5),
    resolved_at: isoDaysAgo(9, 8),
    assigned_group: 'Digital Experience',
    similarity_score: 73,
    related_ids: ['INC100028'],
  },
  {
    id: 'INC100028',
    number: 'INC100028',
    short_description: 'Webhook retries flood payment orchestration queue',
    description: 'Failed webhook retries saturate the payment orchestration queue and amplify checkout latency.',
    category: 'Software',
    priority: 'High',
    state: 'New',
    opened_at: isoDaysAgo(1, 2),
    assigned_group: 'Site Reliability',
    similarity_score: 81,
    related_ids: ['INC100025', 'INC100026', 'PRB000104'],
  },
  {
    id: 'INC100029',
    number: 'INC100029',
    short_description: 'Conference room tablets fail after MDM certificate push',
    description: 'Room booking tablets stop checking in after a device management certificate rotation.',
    category: 'Hardware',
    priority: 'Medium',
    state: 'Resolved',
    opened_at: isoDaysAgo(5, 10),
    resolved_at: isoDaysAgo(5, 14),
    assigned_group: 'Digital Workplace',
    similarity_score: 69,
    related_ids: ['INC100030'],
  },
  {
    id: 'INC100030',
    number: 'INC100030',
    short_description: 'Docking stations disconnect monitors after firmware update',
    description: 'Users lose external monitor connectivity after the latest dock firmware is deployed through the endpoint tool.',
    category: 'Hardware',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(2, 11),
    assigned_group: 'Endpoint Engineering',
    similarity_score: 82,
    related_ids: ['INC100007', 'INC100013', 'INC100032', 'PRB000106'],
  },
  {
    id: 'INC100031',
    number: 'INC100031',
    short_description: 'Barcode scanners reboot during warehouse shift',
    description: 'Warehouse barcode scanners restart unexpectedly after extended Bluetooth peripheral usage.',
    category: 'Hardware',
    priority: 'Medium',
    state: 'New',
    opened_at: isoDaysAgo(4, 12),
    assigned_group: 'Field Support',
    similarity_score: 66,
    related_ids: [],
  },
  {
    id: 'INC100032',
    number: 'INC100032',
    short_description: 'VDI thin clients freeze on login banner',
    description: 'Thin clients hang on the VDI login banner after pulling a new graphics driver package.',
    category: 'Hardware',
    priority: 'High',
    state: 'Resolved',
    opened_at: isoDaysAgo(6, 11),
    resolved_at: isoDaysAgo(6, 16),
    assigned_group: 'Endpoint Engineering',
    similarity_score: 80,
    related_ids: ['INC100013', 'INC100030', 'PRB000106'],
  },
  {
    id: 'PRB000101',
    number: 'PRB000101',
    short_description: 'Recurring VPN concentrator saturation impacting remote access',
    description: 'Problem record for repeated VPN session drops and CPU saturation on the primary concentrator.',
    category: 'Problem Investigation',
    priority: 'Critical',
    state: 'In Progress',
    opened_at: isoDaysAgo(1, 6),
    assigned_group: 'Network Ops',
    similarity_score: 100,
    related_ids: ['INC100001', 'INC100002', 'INC100012'],
    ticket_type: 'problem',
    problem_category: 'Configuration',
    affected_ticket_ids: ['INC100001', 'INC100002', 'INC100012'],
    root_cause_summary: 'Primary VPN concentrator is undersized for peak remote-access traffic.',
  },
  {
    id: 'PRB000102',
    number: 'PRB000102',
    short_description: 'Repeated reporting cluster deadlocks during order sync',
    description: 'Problem record for recurring deadlocks on reporting jobs during ETL and order sync.',
    category: 'Problem Investigation',
    priority: 'High',
    state: 'New',
    opened_at: isoDaysAgo(4, 8),
    assigned_group: 'DBA Team',
    similarity_score: 100,
    related_ids: ['INC100004', 'INC100010', 'INC100022', 'INC100023', 'INC100024'],
    ticket_type: 'problem',
    problem_category: 'Capacity',
    affected_ticket_ids: ['INC100004', 'INC100010', 'INC100022', 'INC100023', 'INC100024'],
    root_cause_summary: 'Reporting cluster lock contention increases during batch windows.',
  },
  {
    id: 'PRB000103',
    number: 'PRB000103',
    short_description: 'Identity policy drift blocking access and MFA enrollment',
    description: 'Problem record for repeated access issues after identity policy and certificate synchronization drift.',
    category: 'Problem Investigation',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(2, 7),
    assigned_group: 'Identity Access',
    similarity_score: 100,
    related_ids: ['INC100003', 'INC100009', 'INC100019', 'INC100020', 'INC100021'],
    ticket_type: 'problem',
    problem_category: 'Known Error',
    affected_ticket_ids: ['INC100003', 'INC100009', 'INC100019', 'INC100020', 'INC100021'],
    root_cause_summary: 'Identity policy propagation lags after certificate rollover and group sync jobs.',
  },
  {
    id: 'PRB000104',
    number: 'PRB000104',
    short_description: 'Checkout platform instability after feature-flag changes',
    description: 'Problem record for recurring checkout failures tied to stale cache state and feature-flag rollouts.',
    category: 'Problem Investigation',
    priority: 'Critical',
    state: 'In Progress',
    opened_at: isoDaysAgo(1, 3),
    assigned_group: 'Platform Services',
    similarity_score: 100,
    related_ids: ['INC100005', 'INC100011', 'INC100025', 'INC100026', 'INC100028'],
    ticket_type: 'problem',
    problem_category: 'Change Management',
    affected_ticket_ids: ['INC100005', 'INC100011', 'INC100025', 'INC100026', 'INC100028'],
    root_cause_summary: 'Feature-flag state and cache invalidation are drifting across checkout service instances.',
  },
  {
    id: 'PRB000105',
    number: 'PRB000105',
    short_description: 'East wing network instability linked to uplink congestion',
    description: 'Problem record for repeated east wing wireless degradation tied to uplink congestion and routing churn.',
    category: 'Problem Investigation',
    priority: 'High',
    state: 'New',
    opened_at: isoDaysAgo(2, 8),
    assigned_group: 'Network Ops',
    similarity_score: 100,
    related_ids: ['INC100006', 'INC100015', 'INC100016', 'INC100017', 'INC100018'],
    ticket_type: 'problem',
    problem_category: 'Capacity',
    affected_ticket_ids: ['INC100006', 'INC100015', 'INC100016', 'INC100017', 'INC100018'],
    root_cause_summary: 'Wireless demand is oversubscribing the east wing uplink during high-density meetings.',
  },
  {
    id: 'PRB000106',
    number: 'PRB000106',
    short_description: 'Endpoint graphics and dock driver regression after security baseline',
    description: 'Problem record for repeated endpoint crashes, monitor disconnects, and VDI freezes after baseline updates.',
    category: 'Problem Investigation',
    priority: 'High',
    state: 'In Progress',
    opened_at: isoDaysAgo(2, 12),
    assigned_group: 'Endpoint Engineering',
    similarity_score: 100,
    related_ids: ['INC100007', 'INC100013', 'INC100014', 'INC100030', 'INC100032'],
    ticket_type: 'problem',
    problem_category: 'Known Error',
    affected_ticket_ids: ['INC100007', 'INC100013', 'INC100014', 'INC100030', 'INC100032'],
    root_cause_summary: 'The latest graphics and dock driver bundle conflicts with the security baseline on several device models.',
  },
];

let tickets = buildInitialTickets();
let preferences: UserPreferences = {
  theme: 'light',
  language: 'en',
  timezone: 'Asia/Singapore',
  dateFormat: 'YYYY-MM-DD',
  defaultPage: 'search',
  itemsPerPage: 10,
  notifications: {
    showToasts: true,
    emailAlerts: false,
    desktopNotifications: false,
  },
  accessibility: {
    fontSize: 16,
    reduceMotion: false,
    highContrast: false,
  },
  uiDensity: 'comfortable',
};

let serviceNowConfig: ServiceNowConfig = {
  instance_url: 'https://demo.service-now.example',
  auth_method: 'oauth',
  username: 'demo.integration',
  is_configured: true,
  last_test_at: NOW.toISOString(),
  last_test_success: true,
  last_test_message: 'Demo environment',
};

let syncStatus: ServiceNowSyncStatusItem[] = [
  {
    id: 1,
    sync_type: 'incremental',
    status: 'completed',
    started_at: isoDaysAgo(0, 1),
    completed_at: isoDaysAgo(0, 1),
    records_processed: 48,
    records_failed: 0,
    error_message: null,
    triggered_by: 'demo-admin',
  },
];

const parseBody = (body?: BodyInit | null): Record<string, unknown> => {
  if (!body || typeof body !== 'string') return {};
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const getProblemTickets = () => tickets.filter((ticket) => ticket.ticket_type === 'problem');

const sortByOpened = (list: Ticket[]) =>
  [...list].sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());

const matchesText = (ticket: Ticket, query: string) => {
  const haystack = [
    ticket.number,
    ticket.short_description,
    ticket.description,
    ticket.category,
    ticket.assigned_group,
    ticket.root_cause_summary || '',
  ]
    .join(' ')
    .toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
};

const scoreTicket = (ticket: Ticket, query: string) => {
  const text =
    `${ticket.number} ${ticket.short_description} ${ticket.description} ${ticket.category} ${ticket.assigned_group}`.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return ticket.similarity_score / 100;

  const matched = terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
  const exactPhrase = text.includes(query.toLowerCase()) ? 0.2 : 0;
  return Math.min(0.99, 0.35 + (matched / Math.max(terms.length, 1)) * 0.45 + exactPhrase);
};

const getFilteredTickets = (params: URLSearchParams) => {
  let filtered = sortByOpened(tickets);
  const category = params.get('category');
  const priority = params.get('priority');
  const state = params.get('state');
  const search = params.get('search');

  if (category) {
    filtered = filtered.filter((ticket) => ticket.category.toLowerCase() === category.toLowerCase());
  }
  if (priority) {
    filtered = filtered.filter((ticket) => ticket.priority.toLowerCase() === priority.toLowerCase());
  }
  if (state) {
    filtered = filtered.filter((ticket) => ticket.state.toLowerCase() === state.toLowerCase());
  }
  if (search) {
    filtered = filtered.filter((ticket) => matchesText(ticket, search));
  }
  return filtered;
};

const getPaginatedTickets = (params: URLSearchParams) => {
  const page = Number(params.get('page') || '1');
  const limit = Number(params.get('limit') || '10');
  const filtered = getFilteredTickets(params);
  const start = Math.max(0, (page - 1) * limit);

  return {
    tickets: clone(filtered.slice(start, start + limit)),
    total: filtered.length,
  };
};

const getPriorityBreakdown = () =>
  tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {});

const getMetrics = () => {
  const resolvedTickets = tickets.filter((ticket) => isResolvedState(ticket.state));
  const resolutionMinutes = tickets
    .map(getResolutionHours)
    .filter((value): value is number => value !== null)
    .map((value) => value * 60);
  const avgResolutionTime = resolutionMinutes.length
    ? Math.round(resolutionMinutes.reduce((sum, value) => sum + value, 0) / resolutionMinutes.length)
    : 0;
  const adoptionRate = Math.round(clampValue(74 + getProblemTickets().length * 2.4 + resolvedTickets.length / Math.max(tickets.length, 1) * 12, 0, 99) * 10) / 10;

  return {
    totalTickets: tickets.length,
    resolvedTickets: resolvedTickets.length,
    avgResolutionTime,
    adoptionRate,
    trendTotalTickets: 18.4,
    trendResolvedTickets: 11.6,
    trendAvgResolutionTime: -22,
    trendSlaCompliance: 3.1,
  };
};

const getVolume = (period: AnalyticsPeriod) => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const volume = new Map<string, number>();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(NOW);
    date.setUTCDate(date.getUTCDate() - index);
    volume.set(date.toISOString().slice(0, 10), 0);
  }

  tickets.forEach((ticket) => {
    const key = ticket.opened_at.slice(0, 10);
    if (volume.has(key)) {
      volume.set(key, (volume.get(key) || 0) + 1);
    }
  });

  return [...volume.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getTeamPerformance = () => {
  const byTeam = new Map<string, { name: string; resolved: number; inProgress: number; new: number }>();
  tickets.forEach((ticket) => {
    const entry =
      byTeam.get(ticket.assigned_group) ||
      { name: ticket.assigned_group, resolved: 0, inProgress: 0, new: 0 };

    if (ticket.state === 'Resolved' || ticket.state === 'Closed') entry.resolved += 1;
    else if (ticket.state === 'In Progress') entry.inProgress += 1;
    else entry.new += 1;

    byTeam.set(ticket.assigned_group, entry);
  });
  return [...byTeam.values()];
};

const getHeatmap = () => {
  const cells = new Map<string, { day: number; hour: number; count: number }>();
  tickets.forEach((ticket) => {
    const date = new Date(ticket.opened_at);
    const day = date.getUTCDay();
    const hour = date.getUTCHours();
    const key = `${day}:${hour}`;
    const current = cells.get(key) || { day, hour, count: 0 };
    current.count += 1;
    cells.set(key, current);
  });
  return [...cells.values()];
};

const getSlaCompliance = () => ({
  overall: 92.4,
  byPriority: {
    Critical: 88.5,
    High: 91.2,
    Medium: 94.8,
    Low: 97.1,
  },
});

const getSystems = (): AnalyticsSystems => {
  const incidentTickets = tickets.filter((ticket) => ticket.ticket_type !== 'problem');
  const problemCountsByCategory = new Map<string, number>();
  const slaTargets: Record<TicketPriority, number> = {
    Critical: 4,
    High: 8,
    Medium: 24,
    Low: 48,
  };

  getProblemTickets().forEach((problem) => {
    const affectedCategories = new Set(
      (problem.affected_ticket_ids || [])
        .map((ticketId) => getTicketById(ticketId)?.category)
        .filter((category): category is string => Boolean(category))
    );
    affectedCategories.forEach((category) => {
      problemCountsByCategory.set(category, (problemCountsByCategory.get(category) || 0) + 1);
    });
  });

  const systems = new Map<
    string,
    {
      system: string;
      ticket_count: number;
      critical_count: number;
      resolution_hours: number[];
      sla_met_count: number;
    }
  >();

  incidentTickets.forEach((ticket) => {
    const entry = systems.get(ticket.category) || {
      system: ticket.category,
      ticket_count: 0,
      critical_count: 0,
      resolution_hours: [],
      sla_met_count: 0,
    };

    entry.ticket_count += 1;
    if (ticket.priority === 'Critical') {
      entry.critical_count += 1;
    }

    const resolutionHours = getResolutionHours(ticket);
    if (resolutionHours !== null) {
      entry.resolution_hours.push(resolutionHours);
      if (resolutionHours <= slaTargets[ticket.priority]) {
        entry.sla_met_count += 1;
      }
    }

    systems.set(ticket.category, entry);
  });

  return {
    period: '30d',
    systems: [...systems.values()]
      .map((entry) => ({
        system: entry.system,
        ticket_count: entry.ticket_count,
        critical_pct: Math.round((entry.critical_count / Math.max(entry.ticket_count, 1)) * 1000) / 10,
        avg_resolution_hours: entry.resolution_hours.length
          ? Math.round((entry.resolution_hours.reduce((sum, value) => sum + value, 0) / entry.resolution_hours.length) * 10) / 10
          : 0,
        sla_compliance_pct: entry.resolution_hours.length
          ? Math.round((entry.sla_met_count / entry.resolution_hours.length) * 1000) / 10
          : 0,
        problem_ticket_count: problemCountsByCategory.get(entry.system) || 0,
      }))
      .sort((a, b) => b.ticket_count - a.ticket_count),
  };
};

const getProblemAnalytics = (period: AnalyticsPeriod): AnalyticsProblemTickets => {
  const problems = getProblemTickets();
  const byCategory = problems.reduce<Map<ProblemCategory, number>>((acc, ticket) => {
    const category = ticket.problem_category || 'Unknown';
    acc.set(category, (acc.get(category) || 0) + 1);
    return acc;
  }, new Map());
  const avgIncidentsPerProblem = problems.length
    ? problems.reduce((sum, ticket) => sum + (ticket.affected_ticket_ids?.length || 0), 0) / problems.length
    : 0;
  const lifecycleTrend = sortByOpened(problems)
    .slice()
    .reverse()
    .map((ticket, index, list) => ({
      date: ticket.opened_at.slice(0, 10),
      open: index + 1,
      resolved: list.slice(0, index + 1).filter((item) => isResolvedState(item.state)).length,
    }));

  return {
    period,
    problem_count: problems.length,
    escalation_rate: Math.round((problems.length / Math.max(tickets.length, 1)) * 1000) / 10,
    avg_incidents_per_problem: Math.round(avgIncidentsPerProblem * 10) / 10,
    by_category: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
    lifecycle_trend: lifecycleTrend,
    time_to_creation_hours: 11.8,
  };
};

const getDuplicates = (period: AnalyticsPeriod): AnalyticsDuplicates => ({
  period,
  cluster_count: 4,
  duplicate_rate: 18.6,
  avg_cluster_size: 2.7,
  trend: getVolume(period).slice(-7).map((item, index) => ({
    date: item.date,
    duplicate_rate: 14 + index,
  })),
  top_themes: [
    { theme: 'VPN saturation', category: 'Network', count: 3 },
    { theme: 'Blue screen after patch', category: 'Hardware', count: 3 },
    { theme: 'Reporting deadlocks', category: 'Database', count: 2 },
  ],
});

const getIsolation = (period: AnalyticsPeriod): AnalyticsIsolation => ({
  period,
  isolated_count: 3,
  isolation_rate: 12.5,
  by_priority: [
    { priority: 'Critical', count: 1 },
    { priority: 'High', count: 1 },
    { priority: 'Medium', count: 1 },
    { priority: 'Low', count: 0 },
  ],
  by_category: [
    { category: 'Hardware', count: 1 },
    { category: 'Network', count: 1 },
    { category: 'Access', count: 1 },
  ],
  trend: getVolume(period).slice(-7).map((item, index) => ({
    date: item.date,
    isolation_rate: 10 + (index % 3) * 2,
  })),
});

const getModelAccuracy = (period: AnalyticsPeriod): AnalyticsModelAccuracy => ({
  period,
  similarity_histogram: [
    { bucket: '90-100', count: 6 },
    { bucket: '80-89', count: 5 },
    { bucket: '70-79', count: 3 },
    { bucket: '60-69', count: 1 },
    { bucket: '<60', count: 1 },
  ],
  high_confidence_rate: 76.4,
  query_expansion_hit_rate: { with_expansion: 68.2, without_expansion: 52.7 },
  graph_feedback: getVolume(period).slice(-7).map((item, index) => ({
    date: item.date,
    positive: 3 + (index % 3),
    negative: index % 2,
  })),
  false_positive_rate: 7.4,
});

const getTeamWorkflow = (period: AnalyticsPeriod): AnalyticsTeamWorkflow => ({
  period,
  team_load: [
    { team: 'Network Ops', new: 1, in_progress: 2, backlog: 1 },
    { team: 'DBA Team', new: 1, in_progress: 1, backlog: 0 },
    { team: 'Endpoint Engineering', new: 2, in_progress: 1, backlog: 1 },
    { team: 'Identity Access', new: 1, in_progress: 0, backlog: 0 },
  ],
  first_touch_rate: 71.5,
  escalation_paths: [
    { from: 'Service Desk', to: 'Network Ops', count: 4 },
    { from: 'Service Desk', to: 'Endpoint Engineering', count: 3 },
    { from: 'Platform Services', to: 'DBA Team', count: 2 },
  ],
  response_time_histogram: [
    { bucket: '<15m', count: 4 },
    { bucket: '15-30m', count: 5 },
    { bucket: '30-60m', count: 3 },
    { bucket: '>60m', count: 2 },
  ],
});

const getPredictions = (period: AnalyticsPeriod): AnalyticsPredictions => ({
  period,
  forecast: Array.from({ length: 7 }, (_, index) => {
    const date = new Date(NOW);
    date.setUTCDate(date.getUTCDate() + index + 1);
    return {
      date: date.toISOString().slice(0, 10),
      predicted: 2 + (index % 3),
      actual: index < 2 ? 2 + index : undefined,
    };
  }),
  emerging_clusters: [
    { theme: 'Endpoint crash after patch', count: 3, system: 'Hardware' },
    { theme: 'Remote access instability', count: 3, system: 'Network' },
  ],
  seasonal_patterns: Array.from({ length: 28 }, (_, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index % 7],
    hour: (index % 4) * 6,
    count: 2 + (index % 5),
  })),
});

const getRootCauses = (period: AnalyticsPeriod): AnalyticsRootCauses => ({
  period,
  coverage_pct: 84.1,
  top_root_causes: [
    { cause: 'VPN concentrator capacity ceiling', count: 3 },
    { cause: 'Reporting cluster lock contention', count: 2 },
    { cause: 'Endpoint patch regression', count: 3 },
  ],
  graph_depth_histogram: [
    { depth: 1, count: 4 },
    { depth: 2, count: 6 },
    { depth: 3, count: 3 },
  ],
  change_related_pct: 41.3,
});

const getVectorMap = (period: AnalyticsPeriod, labelBy: AnalyticsVectorLabelBy): AnalyticsVectorMap => {
  const centers: Record<string, { x: number; y: number }> = {
    Network: { x: 0.18, y: 0.3 },
    Database: { x: 0.68, y: 0.34 },
    Access: { x: 0.46, y: 0.68 },
    Software: { x: 0.76, y: 0.58 },
    Hardware: { x: 0.24, y: 0.78 },
    'Problem Investigation': { x: 0.48, y: 0.16 },
  };
  const categoryCounts = new Map<string, number>();

  const points = tickets.map((ticket) => {
    const center = centers[ticket.category] || { x: 0, y: 0 };
    const categoryIndex = categoryCounts.get(ticket.category) || 0;
    categoryCounts.set(ticket.category, categoryIndex + 1);
    const angle = (categoryIndex * 1.65) % (Math.PI * 2);
    const radius = 0.028 + Math.floor(categoryIndex / 6) * 0.022 + (categoryIndex % 6) * 0.006;
    const labelValue =
      labelBy === 'assignment_group'
        ? ticket.assigned_group
        : labelBy === 'priority'
        ? ticket.priority
        : labelBy === 'state'
        ? ticket.state
        : ticket.category;

    return {
      id: ticket.id,
      number: ticket.number,
      short_description: ticket.short_description,
      category: ticket.category,
      priority: ticket.priority,
      state: ticket.state,
      assignment_group: ticket.assigned_group,
      opened_at: ticket.opened_at,
      label: labelValue,
      x: clampValue(center.x + Math.cos(angle) * radius, 0.06, 0.94),
      y: clampValue(center.y + Math.sin(angle) * radius, 0.08, 0.92),
    };
  });

  return {
    period,
    label_by: labelBy,
    projection: 'umap',
    sample_size: points.length,
    points,
  };
};

const getTicketById = (ticketId: string) =>
  tickets.find((ticket) => ticket.id === ticketId || ticket.number === ticketId);

const buildGraph = (ticket: Ticket): { nodes: GraphNode[]; edges: GraphEdge[] } => {
  if (ticket.ticket_type === 'problem') {
    const linked = (ticket.affected_ticket_ids || [])
      .map((id) => getTicketById(id))
      .filter((item): item is Ticket => Boolean(item));
    const linkedNodes: GraphNode[] = linked.map((item, index) => ({
      id: item.id,
      label: item.number,
      type: index === 0 ? 'cause' : 'related',
      details: item.short_description,
    }));

    return {
      nodes: [
        { id: ticket.id, label: ticket.number, type: 'problem', details: ticket.root_cause_summary || ticket.short_description },
        ...linkedNodes,
      ],
      edges: linked.map((item, index) => ({
        source: ticket.id,
        target: item.id,
        confidence: 0.92 - index * 0.08,
        label: 'linked incident',
      })),
    };
  }

  const related = (ticket.related_ids || [])
    .map((id) => getTicketById(id))
    .filter((item): item is Ticket => Boolean(item))
    .slice(0, 3);
  const relatedNodes: GraphNode[] = related.map((item) => ({
    id: item.id,
    label: item.number,
    type: item.ticket_type === 'problem' ? 'problem' : 'related',
    details: item.short_description,
  }));

  return {
    nodes: [
      { id: ticket.id, label: ticket.number, type: 'root', details: ticket.short_description },
      { id: `${ticket.id}-cause`, label: ticket.assigned_group, type: 'cause', details: `${ticket.assigned_group} identified a likely contributing factor.` },
      { id: `${ticket.id}-change`, label: 'Recent Change Window', type: 'change', details: 'The incident started shortly after a recent environment change.' },
      ...relatedNodes,
    ],
    edges: [
      { source: ticket.id, target: `${ticket.id}-cause`, confidence: 0.88, label: 'likely cause' },
      { source: `${ticket.id}-cause`, target: `${ticket.id}-change`, confidence: 0.71, label: 'change correlation' },
      ...related.map((item, index) => ({
        source: ticket.id,
        target: item.id,
        confidence: 0.83 - index * 0.09,
        label: 'related incident',
      })),
    ],
  };
};

const searchTickets = (query: string, topK: number, offset: number) => {
  const ranked = sortByOpened(tickets)
    .map((ticket) => ({
      ticket,
      score: scoreTicket(ticket, query),
    }))
    .filter((entry) => entry.score >= 0.3)
    .sort((a, b) => b.score - a.score);

  const results = ranked.slice(offset, offset + topK).map(({ ticket, score }) => ({
    number: ticket.number,
    short_description: ticket.short_description,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    state: ticket.state,
    assignment_group: ticket.assigned_group,
    opened_at: ticket.opened_at,
    similarity_score: score,
    rerank_score: Math.min(0.99, score + 0.04),
  }));

  return {
    results,
    query_original: query,
    query_expanded: query,
    total_candidates: ranked.length,
    reranking_enabled: true,
    total: ranked.length,
    offset,
    limit: topK,
    has_more: offset + topK < ranked.length,
  };
};

const createProblemTicket = (payload: Record<string, unknown>) => {
  const maxProblem = tickets
    .filter((ticket) => ticket.number.startsWith('PRB'))
    .map((ticket) => Number(ticket.number.replace('PRB', '')))
    .filter((value) => Number.isFinite(value))
    .reduce((max, value) => Math.max(max, value), 102);

  const number = `PRB${String(maxProblem + 1).padStart(6, '0')}`;
  const affectedIds = ((payload.affected_ticket_ids as string[]) || []).filter(Boolean);
  const created: Ticket = {
    id: number,
    number,
    short_description: String(payload.short_description || 'New Problem Ticket'),
    description: String(payload.description || ''),
    category: String(payload.category || 'Problem Investigation'),
    priority: (payload.priority as TicketPriority) || 'Medium',
    state: 'New',
    opened_at: NOW.toISOString(),
    assigned_group: String(payload.assignment_group || 'Service Desk'),
    similarity_score: 100,
    related_ids: affectedIds,
    ticket_type: 'problem',
    problem_category: (payload.category as Ticket['problem_category']) || 'Unknown',
    affected_ticket_ids: affectedIds,
    root_cause_summary: String(payload.root_cause_summary || ''),
  };

  tickets = [created, ...tickets].map((ticket) => {
    if (!affectedIds.includes(ticket.id)) return ticket;
    return {
      ...ticket,
      related_ids: [...new Set([...(ticket.related_ids || []), created.id])],
    };
  });

  return clone(created);
};

export async function demoApiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = new URL(endpoint, 'http://demo.local');
  const body = parseBody(options?.body);
  const path = url.pathname;

  if (path === '/api/tickets' && (!options?.method || options.method === 'GET')) {
    return getPaginatedTickets(url.searchParams) as T;
  }

  if (path === '/api/tickets' && options?.method === 'POST') {
    return createProblemTicket(body) as T;
  }

  if (path.startsWith('/api/tickets/') && path.endsWith('/related')) {
    const ticketId = path.split('/')[3];
    const ticket = getTicketById(ticketId);
    const related = (ticket?.related_ids || [])
      .map((id) => getTicketById(id))
      .filter((item): item is Ticket => Boolean(item));
    return clone(related) as T;
  }

  if (path.startsWith('/api/tickets/') && path.endsWith('/timeline')) {
    const ticketId = path.split('/')[3];
    const ticket = getTicketById(ticketId);
    return clone([
      { title: 'Ticket opened', timestamp: ticket?.opened_at || NOW.toISOString() },
      { title: 'Assigned to support team', timestamp: ticket?.opened_at || NOW.toISOString() },
    ]) as T;
  }

  if (path.startsWith('/api/tickets/') && path.endsWith('/audit')) {
    const ticketId = path.split('/')[3];
    const ticket = getTicketById(ticketId);
    return clone([
      { actor: 'System', action: 'Created ticket', timestamp: ticket?.opened_at || NOW.toISOString() },
      { actor: 'Nexus AI', action: 'Calculated similarity links', timestamp: ticket?.opened_at || NOW.toISOString() },
    ]) as T;
  }

  if (path.startsWith('/api/tickets/') && options?.method === 'PATCH') {
    const ticketId = path.split('/')[3];
    tickets = tickets.map((ticket) =>
      ticket.id === ticketId || ticket.number === ticketId
        ? { ...ticket, ...(body as Partial<Ticket>) }
        : ticket
    );
    return clone(getTicketById(ticketId)) as T;
  }

  if (path.startsWith('/api/tickets/')) {
    const ticketId = path.split('/')[3];
    return clone(getTicketById(ticketId)) as T;
  }

  if (path === '/search/hybrid') {
    const query = String(body.query || '');
    const topK = Number(body.top_k || 10);
    const offset = Number(body.offset || 0);
    return searchTickets(query, topK, offset) as T;
  }

  if (path === '/search/causal') {
    const query = String(body.query || '');
    const result = searchTickets(query, Number(body.top_k || 5), 0);
    return {
      results: result.results.filter((item) => item.number.startsWith('PRB') || item.category === 'Network'),
    } as T;
  }

  if (path.startsWith('/api/analytics/metrics')) return getMetrics() as T;
  if (path.startsWith('/api/analytics/volume')) return getVolume((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/team-performance')) return getTeamPerformance() as T;
  if (path.startsWith('/api/analytics/heatmap')) return getHeatmap() as T;
  if (path.startsWith('/api/analytics/priority-breakdown')) return getPriorityBreakdown() as T;
  if (path.startsWith('/api/analytics/sla-compliance')) return getSlaCompliance() as T;
  if (path.startsWith('/api/analytics/duplicates')) return getDuplicates((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/isolation')) return getIsolation((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/model-accuracy')) return getModelAccuracy((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/systems')) return getSystems() as T;
  if (path.startsWith('/api/analytics/problem-tickets')) return getProblemAnalytics((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/team-workflow')) return getTeamWorkflow((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/predictions')) return getPredictions((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/root-causes')) return getRootCauses((url.searchParams.get('period') as AnalyticsPeriod) || '30d') as T;
  if (path.startsWith('/api/analytics/vector-map')) {
    const period = (url.searchParams.get('period') as AnalyticsPeriod) || '30d';
    const labelBy = (url.searchParams.get('label_by') as AnalyticsVectorLabelBy) || 'category';
    return getVectorMap(period, labelBy) as T;
  }

  if (path.startsWith('/api/causal-graph/')) {
    const ticketId = path.split('/')[3];
    const ticket = getTicketById(ticketId);
    return buildGraph(ticket || tickets[0]) as T;
  }

  if (path === '/api/feedback/graph' || path === '/api/feedback/graph/flag-incorrect') {
    return { success: true } as T;
  }

  if (path === '/api/user/preferences' && (!options?.method || options.method === 'GET')) {
    return clone(preferences) as T;
  }

  if (path === '/api/user/preferences' && options?.method === 'PUT') {
    preferences = { ...preferences, ...(body as Partial<UserPreferences>) };
    return clone(preferences) as T;
  }

  if (path === '/api/data/status') {
    const value: DataStatus = {
      total_tickets: tickets.length,
      embedded_tickets: tickets.length,
      pending_tickets: 0,
      last_embedded_at: NOW.toISOString(),
      last_loaded_at: NOW.toISOString(),
    };
    return value as T;
  }

  if (path === '/api/data/embed-pending') {
    return { processed: tickets.length, failed: 0, remaining: 0 } as T;
  }

  if (path === '/api/user/role') {
    const value: UserRoleInfo = {
      user_id: 'demo-admin',
      role: 'admin',
    };
    return value as T;
  }

  if (path === '/api/admin/servicenow/config' && (!options?.method || options.method === 'GET')) {
    return clone(serviceNowConfig) as T;
  }

  if (path === '/api/admin/servicenow/config' && options?.method === 'PUT') {
    serviceNowConfig = {
      ...serviceNowConfig,
      instance_url: String(body.instance_url || serviceNowConfig.instance_url),
      auth_method: (body.auth_method as ServiceNowConfig['auth_method']) || serviceNowConfig.auth_method,
      username: String(body.username || serviceNowConfig.username),
      is_configured: true,
      last_test_success: true,
      last_test_message: 'Saved in demo mode',
      last_test_at: NOW.toISOString(),
    };
    return { success: true, message: 'Saved locally in demo mode' } as T;
  }

  if (path === '/api/admin/servicenow/test') {
    return {
      success: true,
      steps: [
        { name: 'DNS', status: 'passed', message: 'Demo endpoint reachable' },
        { name: 'Auth', status: 'passed', message: 'Demo credentials accepted' },
        { name: 'Incident API', status: 'passed', message: 'Sample payload retrieved' },
      ],
    } as T;
  }

  if (path === '/api/admin/servicenow/sync/status') {
    return clone(syncStatus) as T;
  }

  if (path === '/api/admin/servicenow/sync/trigger') {
    const syncType = (body.sync_type as SyncType) || 'incremental';
    const item: ServiceNowSyncStatusItem = {
      id: syncStatus.length + 1,
      sync_type: syncType,
      status: 'completed',
      started_at: NOW.toISOString(),
      completed_at: NOW.toISOString(),
      records_processed: tickets.length,
      records_failed: 0,
      error_message: null,
      triggered_by: 'demo-admin',
    };
    syncStatus = [item, ...syncStatus];
    return {
      job_id: item.id,
      message: 'Demo sync completed instantly',
      command: `demo-sync --type ${syncType}`,
    } as T;
  }

  if (path === '/api/export/csv') {
    return {} as T;
  }

  throw new Error(`Unhandled demo endpoint: ${endpoint}`);
}
