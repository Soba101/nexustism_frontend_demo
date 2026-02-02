/**
 * Core Types for ITSM Dashboard
 * Generic naming for future ticket system implementation
 */

/** Ticket priority levels */
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

/** Ticket lifecycle states */
export type TicketState = 'New' | 'In Progress' | 'Resolved' | 'Closed';

/** Ticket record types */
export type TicketType = 'incident' | 'problem';

/** Problem root cause categories */
export type ProblemCategory =
  | 'Configuration'
  | 'Capacity'
  | 'Change Management'
  | 'Known Error'
  | 'Third Party'
  | 'Unknown';

/**
 * Core ticket interface representing an IT service ticket
 * @property similarity_score - AI-computed semantic similarity (0-100)
 * @property related_ids - IDs of semantically related tickets
 */
export interface Ticket {
  id: string;
  number: string;
  short_description: string;
  description: string;
  category: string;
  priority: TicketPriority;
  state: TicketState;
  opened_at: string;
  resolved_at?: string;
  assigned_group: string;
  similarity_score: number;
  related_ids: string[];
  ticket_type?: TicketType;
  problem_category?: ProblemCategory;
  affected_ticket_ids?: string[];
  root_cause_summary?: string;
}

export interface CreateProblemTicketForm {
  short_description: string;
  description: string;
  problem_category: ProblemCategory;
  priority: TicketPriority;
  assigned_group: string;
  affected_ticket_ids: string[];
  root_cause_summary?: string;
}

/** User profile information */
export interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

/** User preferences stored in localStorage */
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  defaultPage: 'search' | 'analyze' | 'dashboard' | 'settings';
  itemsPerPage: 5 | 10 | 25 | 50;
  notifications: {
    showToasts: boolean;
    emailAlerts: boolean;
    desktopNotifications: boolean;
  };
  accessibility: {
    fontSize: number;
    reduceMotion: boolean;
    highContrast: boolean;
  };
  uiDensity: 'comfortable' | 'compact';
}

/**
 * Visual cluster grouping for causal graph nodes
 * @property x, y - Center coordinates for force-directed layout
 * @property width, height - Cluster bounding box dimensions
 */
export interface GraphCluster {
  id: string;
  label: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
}

/**
 * Graph node representing a ticket or problem record in causal analysis
 * @property type - Node category for visualization (root incident, cause, etc.)
 * @property x, y - Position coordinates for rendering
 * @property vx, vy - Velocity vectors for physics simulation
 */
export interface GraphNode {
  id: string;
  label: string;
  type: 'root' | 'cause' | 'change' | 'related' | 'problem';
  details: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

/**
 * Causal relationship edge between graph nodes
 * @property confidence - ML model confidence score (0-1)
 */
export interface GraphEdge {
  source: string;
  target: string;
  confidence: number;
  label: string;
}

/** Toast notification message */
export interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'info' | 'error';
}

// ---------------------------------------------------------------------------
// Analytics Types
// ---------------------------------------------------------------------------

export type AnalyticsPeriod = '7d' | '30d' | '90d';

export interface AnalyticsDuplicates {
  period: AnalyticsPeriod;
  cluster_count: number;
  duplicate_rate: number;
  avg_cluster_size: number;
  trend: Array<{ date: string; duplicate_rate: number }>;
  top_themes: Array<{ theme: string; category: string; count: number }>;
}

export interface AnalyticsIsolation {
  period: AnalyticsPeriod;
  isolated_count: number;
  isolation_rate: number;
  by_priority: Array<{ priority: TicketPriority; count: number }>;
  by_category: Array<{ category: string; count: number }>;
  trend: Array<{ date: string; isolation_rate: number }>;
}

export interface AnalyticsModelAccuracy {
  period: AnalyticsPeriod;
  similarity_histogram: Array<{ bucket: string; count: number }>;
  high_confidence_rate: number;
  query_expansion_hit_rate: { with_expansion: number; without_expansion: number };
  graph_feedback: Array<{ date: string; positive: number; negative: number }>;
  false_positive_rate: number;
}

export interface AnalyticsSystems {
  period: AnalyticsPeriod;
  systems: Array<{
    system: string;
    ticket_count: number;
    critical_pct: number;
    avg_resolution_hours: number;
    sla_compliance_pct: number;
    problem_ticket_count: number;
  }>;
}

export interface AnalyticsProblemTickets {
  period: AnalyticsPeriod;
  problem_count: number;
  escalation_rate: number;
  avg_incidents_per_problem: number;
  by_category: Array<{ category: ProblemCategory; count: number }>;
  lifecycle_trend: Array<{ date: string; open: number; resolved: number }>;
  time_to_creation_hours: number;
}

export interface AnalyticsTeamWorkflow {
  period: AnalyticsPeriod;
  team_load: Array<{ team: string; new: number; in_progress: number; backlog: number }>;
  first_touch_rate: number;
  escalation_paths: Array<{ from: string; to: string; count: number }>;
  response_time_histogram: Array<{ bucket: string; count: number }>;
}

export interface AnalyticsPredictions {
  period: AnalyticsPeriod;
  forecast: Array<{ date: string; predicted: number; actual?: number }>;
  emerging_clusters: Array<{ theme: string; count: number; system?: string }>;
  seasonal_patterns: Array<{ day: string; hour: number; count: number }>;
}

export interface AnalyticsRootCauses {
  period: AnalyticsPeriod;
  coverage_pct: number;
  top_root_causes: Array<{ cause: string; count: number }>;
  graph_depth_histogram: Array<{ depth: number; count: number }>;
  change_related_pct: number;
}
