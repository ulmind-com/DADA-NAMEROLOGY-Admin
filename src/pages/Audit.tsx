import React, { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Card, Empty, Pagination, Pill, Spinner } from '@/components/ui';
import { get } from '@/lib/api';
import { fmtDateTime } from '@/lib/format';
import type { AuditRow, Paged } from '@/lib/types';

const TONE: Record<string, 'good' | 'bad' | 'brand' | 'info' | 'muted'> = {
  'user.update': 'info',
  'user.delete': 'bad',
  'admin.create': 'brand',
  'rule.update': 'good',
  'rule.revert': 'muted',
  'setting.update': 'info',
  broadcast: 'brand',
};

export default function Audit() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => get<Paged<AuditRow>>(`/admin/audit?page=${page}&size=40`),
    placeholderData: keepPreviousData,
  });

  if (isLoading && !data) return <Spinner center />;

  return (
    <Card>
      {!data || data.items.length === 0 ? (
        <Empty title="Nothing logged yet" subtitle="Admin actions will appear here as they happen." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>WHEN</th>
                  <th>ADMIN</th>
                  <th>ACTION</th>
                  <th>TARGET</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <tr key={a.id}>
                    <td className="tiny" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(a.created_at)}</td>
                    <td className="small">{a.actor_email}</td>
                    <td>
                      <Pill tone={TONE[a.action] ?? 'muted'}>{a.action}</Pill>
                    </td>
                    <td className="small cell-strong">{a.target || '—'}</td>
                    <td className="tiny" style={{ maxWidth: 420 }}>
                      {Object.keys(a.meta ?? {}).length ? JSON.stringify(a.meta) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pages={Math.max(1, Math.ceil(data.total / data.size))}
            total={data.total}
            onPage={setPage}
          />
        </>
      )}
    </Card>
  );
}
