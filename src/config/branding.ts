/**
 * Branding and Terminology Configuration
 * Centralized configuration for generic ticket system implementation
 */

export const branding = {
  appName: 'ITSM Nexus',
  appDescription: 'AI-Powered Ticket Management System',
  logoText: 'ITSM Nexus',
  
  // Generic terminology mapping
  terminology: {
    ticket: 'Ticket',
    tickets: 'Tickets',
    incident: 'Incident', // Legacy support
    incidents: 'Incidents', // Legacy support
  },
  
  // Feature flags for future implementation
  features: {
    enableRealtime: false,
    enableOAuth: false,
    enableExport: true,
    enableFeedback: true,
    enableAnalytics: true,
  },
};
