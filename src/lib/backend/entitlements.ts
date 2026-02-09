export interface Entitlements {
  hasPaidSync: boolean;
  tier: 'free' | 'pro';
}

export const getUserEntitlements = async (_userId: string): Promise<Entitlements> => {
  void _userId;
  // TODO: resolve entitlements from backend once billing/sync is implemented.
  return {
    hasPaidSync: false,
    tier: 'free',
  };
};
