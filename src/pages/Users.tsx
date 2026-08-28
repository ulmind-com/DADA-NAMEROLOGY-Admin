import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Card, Empty, Pagination, Pill, Search, Spinner, Toggle } from '@/components/ui';
import { get, patch } from '@/lib/api';
import { fmtDate, fmtRelative } from '@/lib/format';
import { useToast } from '@/lib/toast';
import type { AdminUser, Paged } from '@/lib/types';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'premium=true', label: 'Premium' },
  { key: 'premium=false', label: 'Free' },
  { key: 'role=admin', label: 'Admins' },
  { key: 'active=false', label: 'Disabled' },
];

export default function Users() {
  const toast = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const query = [`page=${page}`, 'size=25', q ? `q=${encodeURIComponent(q)}` : '', filter]
    .filter(Boolean)
    .join('&');

  const { data, isLoading } = useQuery({
    queryKey: ['users', query],
    queryFn: () => get<Paged<AdminUser>>(`/admin/users?${query}`),
    placeholderData: keepPreviousData,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      patch(`/admin/users/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast('User updated.', 'success');
    },
    onError: (e: any) => toast(e?.message ?? 'Update failed.', 'error'),
  });

  return (
    <Card>
      <div className="card-head wrap">
        <Search
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Search name, email or phone"
        />
        <div className="row wrap" style={{ gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <div style={{ padding: 60, display: 'grid', placeItems: 'center' }}>
          <Spinner />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Empty title="No users found" subtitle="Try a different search or filter." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>USER</th>
                  <th>PHONE</th>
                  <th>SIGN-IN</th>
                  <th>REPORTS</th>
                  <th>JOINED</th>
                  <th>LAST SEEN</th>
                  <th style={{ textAlign: 'center' }}>PREMIUM</th>
                  <th style={{ textAlign: 'center' }}>ACTIVE</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link to={`/users/${u.id}`} className="row" style={{ gap: 11 }}>
                        <Avatar url={u.avatar_url} name={u.full_name} email={u.email} />
                        <span>
                          <span className="cell-strong" style={{ display: 'block' }}>
                            {u.full_name || '—'}
                            {u.role !== 'user' && (
                              <>
                                {' '}
                                <Pill tone="brand">{u.role}</Pill>
                              </>
                            )}
                          </span>
                          <span className="cell-sub">{u.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="mono">{u.phone || '—'}</td>
                    <td>
                      <Pill tone={u.provider.includes('google') ? 'info' : 'muted'}>{u.provider}</Pill>
                    </td>
                    <td className="mono">{u.reports_count}</td>
                    <td className="tiny">{fmtDate(u.created_at)}</td>
                    <td className="tiny">{fmtRelative(u.last_login_at)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Toggle
                        on={u.is_premium}
                        onChange={(v) => update.mutate({ id: u.id, body: { is_premium: v } })}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Toggle
                        on={u.is_active}
                        onChange={(v) => update.mutate({ id: u.id, body: { is_active: v } })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
        </>
      )}
    </Card>
  );
}
