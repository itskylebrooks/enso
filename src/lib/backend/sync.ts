import type { SyncPayload } from '../supabase/types';

export interface SyncClient {
  pull(userId: string): Promise<SyncPayload | null>;
  push(payload: SyncPayload): Promise<void>;
}

export const syncClient: SyncClient = {
  async pull(_userId: string) {
    void _userId;
    // TODO: implement pull sync against future /api/sync route handlers.
    return null;
  },
  async push(_payload: SyncPayload) {
    void _payload;
    // TODO: implement push sync against future /api/sync route handlers.
  },
};
