export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'user' | 'admin' | 'superadmin';
  is_active: boolean;
  is_premium: boolean;
  is_email_verified: boolean;
  provider: string;
  avatar_url?: string | null;
  dob?: string | null;
  gender?: string | null;
  reports_count: number;
  created_at: string;
  last_login_at: string | null;
};

export type Stats = {
  users_total: number;
  users_today: number;
  users_week: number;
  premium_users: number;
  reports_total: number;
  reports_today: number;
  reports_by_type: Record<string, number>;
  signups_series: { date: string; count: number }[];
  reports_series: { date: string; count: number }[];
  top_numbers: { number: number; count: number }[];
  recent_users: {
    id: string; email: string; full_name: string; provider: string;
    is_premium: boolean; created_at: string;
  }[];
  recent_reports: {
    id: string; type: string; title: string; subtitle: string;
    score: number | null; created_at: string; user_email: string | null;
  }[];
};

export type ReportRow = {
  id: string;
  type: string;
  tier: string;
  title: string;
  subtitle: string;
  score: number | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
};

export type Paged<T> = { total: number; page: number; size: number; pages: number; items: T[] };

export type AuditRow = {
  id: string;
  actor_email: string;
  action: string;
  target: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type RuleSet = {
  kind: string;
  items: Record<string, any>;
  overridden: string[];
};

export type Settings = Record<string, { value: any; label?: string; message?: string }>;
