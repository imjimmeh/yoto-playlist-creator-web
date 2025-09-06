import { useSyncExternalStore } from 'react';
import jobQueueStore from '../services/jobQueueStore';

/**
 * A hook to subscribe to the global job queue store.
 * This ensures your components are always in sync with the background queue state.
 */
export function useJobQueueStore() {
  const state = useSyncExternalStore(
    jobQueueStore.subscribe,
    jobQueueStore.getSnapshot
  );
  return state;
}
