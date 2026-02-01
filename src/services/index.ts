// Conditional API module based on NEXT_PUBLIC_USE_MOCK_DATA env var.
// When mock mode is enabled, all hooks return mock data with no backend required.

export * from './mockApi';

// To switch back to real backend:
// 1. Set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local
// 2. Change this file to: export * from './api';
