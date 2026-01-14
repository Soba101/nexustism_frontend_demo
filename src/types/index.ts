/**
 * Core Types for ITSM Dashboard
 * Generic naming for future ticket system implementation
 */

/** Ticket priority levels */
export type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';

/** Ticket lifecycle states */
export type TicketState = 'New' | 'In Progress' | 'Resolved' | 'Closed';

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
