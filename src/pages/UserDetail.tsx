import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Card, CardHead, Empty, KV, Pill, Spinner, Toggle } from '@/components/ui';
import { IconBack } from '@/components/Icons';
import { del, get, patch } from '@/lib/api';
import { fmtDate, fmtDateTime, TYPE_LABEL } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useToast } from '@/lib/toast';
import type { AdminUser } from '@/lib/types';

type Detail = {
  user: AdminUser & { birth_time?: string | null; birth_place?: string | null; free_reports_used: number };
  reports: { id: string; type: string; tier: string; title: string; subtitle: string; score: number | null; created_at: string }[];
};

export default function UserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const { isSuper, me } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => get<Detail>(`/admin/users/${id}`),
  });

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => patch(`/admin/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', id] });
      toast('User updated.', 'success');
    },
    onError: (e: any) => toast(e?.message ?? 'Update failed.', 'error'),
  });

  const remove = useMutation({
    mutationFn: () => del(`/admin/users/${id}`),
    onSuccess: () => {
      toast('User deleted.', 'success');
      nav('/users');
    },
    onError: (e: any) => toast(e?.message ?? 'Delete failed.', 'error'),
  });

  if (isLoading || !data) return <Spinner center />;
  const u = data.user;

  return (
    <>
      <Link to="/users" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        <IconBack size={14} /> Back to users
      </Link>

      <div className="grid g2" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr)' }}>
        <Card pad>
          <div className="row" style={{ gap: 14 }}>
            <Avatar url={u.avatar_url} name={u.full_name} email={u.email} size={54} />
            <div style={{ minWidth: 0 }}>
              <h2>{u.full_name || '—'}</h2>
              <p className="small muted">{u.email}</p>
            </div>
          </div>

          <div className="row wrap" style={{ gap: 6, marginTop: 14 }}>
            <Pill tone={u.role === 'user' ? 'muted' : 'brand'}>{u.role}</Pill>
            <Pill tone={u.provider.includes('google') ? 'info' : 'muted'}>{u.provider}</Pill>
            {u.is_email_verified && <Pill tone="good">Email verified</Pill>}
            {u.is_premium && <Pill tone="good">Premium</Pill>}
            {!u.is_active && <Pill tone="bad">Disabled</Pill>}
          </div>

          <div style={{ marginTop: 18 }}>
            <KV k="Phone" v={u.phone || '—'} />
            <KV k="Date of birth" v={fmtDate(u.dob)} />
            <KV k="Birth time" v={u.birth_time || '—'} />
            <KV k="Birth place" v={u.birth_place || '—'} />
            <KV k="Gender" v={u.gender || '—'} />
            <KV k="Free reports used" v={u.free_reports_used} />
            <KV k="Joined" v={fmtDateTime(u.created_at)} />
            <KV k="Last login" v={fmtDateTime(u.last_login_at)} />
          </div>

          <div className="card-head" style={{ padding: '16px 0 0', borderBottom: 0 }}>
            <span className="label">PREMIUM ACCESS</span>
            <Toggle on={u.is_premium} onChange={(v) => update.mutate({ is_premium: v })} />
          </div>
          <div className="card-head" style={{ padding: '10px 0 0', borderBottom: 0 }}>
            <span className="label">ACCOUNT ACTIVE</span>
            <Toggle on={u.is_active} onChange={(v) => update.mutate({ is_active: v })} />
          </div>

          {isSuper && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <span className="label">ROLE</span>
              <select
                className="select"
                style={{ marginTop: 6 }}
                value={u.role}
                onChange={(e) => update.mutate({ role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super admin</option>
              </select>

              {u.id !== me?.id && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: 14, width: '100%' }}
                  onClick={() => {
                    if (confirm(`Permanently delete ${u.email} and all their reports?`)) remove.mutate();
                  }}
                >
                  Delete this account
                </button>
              )}
            </div>
          )}
        </Card>

        <Card>
          <CardHead title="Report history" subtitle={`${data.reports.length} saved readings`} />
          {data.reports.length === 0 ? (
            <Empty title="No reports yet" subtitle="This user has not run any readings." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>READING</th>
                    <th>MODULE</th>
                    <th>TIER</th>
                    <th>WHEN</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/reports/${r.id}`}>
                          <div className="cell-strong">{r.title}</div>
                          <div className="cell-sub">{r.subtitle}</div>
                        </Link>
                      </td>
                      <td>
                        <Pill tone="brand">{TYPE_LABEL[r.type] ?? r.type}</Pill>
                      </td>
                      <td>
                        <Pill tone={r.tier === 'premium' ? 'good' : 'muted'}>{r.tier}</Pill>
                      </td>
                      <td className="tiny">{fmtDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
