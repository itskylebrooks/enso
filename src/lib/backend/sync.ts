import type { SyncPayloadData, SyncPullResponse, SyncPushResponse } from '../supabase/types';

export interface SyncClient {
  pull(accessToken: string): Promise<SyncPullResponse>;
  push(accessToken: string, payload: SyncPayloadData): Promise<SyncPushResponse>;
}

const buildAuthHeaders = (accessToken: string): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${accessToken}`,
});

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const json = (await response.json()) as { message?: string; error?: string };
    return json.message || json.error || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

export const syncClient: SyncClient = {
  async pull(accessToken: string) {
    const response = await fetch('/api/sync/pull', {
      method: 'POST',
      headers: buildAuthHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as SyncPullResponse;
  },
  async push(accessToken: string, payload: SyncPayloadData) {
    const response = await fetch('/api/sync/push', {
      method: 'POST',
      headers: buildAuthHeaders(accessToken),
      body: JSON.stringify({ payload }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as SyncPushResponse;
  },
};
