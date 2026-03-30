export const IS_STANDALONE_DEMO =
  process.env.NODE_ENV !== 'test' &&
  process.env.NEXT_PUBLIC_STANDALONE_DEMO !== 'false';

export const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@nexus.com';

export const FORCED_DATASET_MODE =
  process.env.NEXT_PUBLIC_FORCE_DATASET_MODE ||
  (IS_STANDALONE_DEMO ? 'demo' : '');
