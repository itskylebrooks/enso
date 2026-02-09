export type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
};

export type AuthSession = {
  userId: string;
  email?: string;
  accessToken?: string;
};

export type SyncPayload = {
  userId: string;
  data: unknown;
  updatedAt: string;
};
