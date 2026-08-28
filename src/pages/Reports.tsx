import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Card, Empty, Pagination, Pill, Search, Spinner } from '@/components/ui';
import { get } from '@/lib/api';
import { fmtDateTime, TYPE_LABEL } from '@/lib/format';
import type { Paged, ReportRow } from '@/lib/types';

const TYPES = ['', 'name', 'business', 'newborn', 'mobile', 'vehicle'];

export default function Reports() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [tier, setTier] = useState('');
  const [page, setPage] = useState(1);

  const query = [
    `page=${page}`,
    'size=25',
    q ? `q=${encodeURIComponent(q)}` : '',
    type ? `type=${type}` : '',
    tier ? `tier=${tier}` : '',
  ]
    .filter(Boolean)
    .join('&');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', query],
    queryFn: () => get<Paged<ReportRow>>(`/admin/reports?${query}`),
    placeholderData: keepPreviousData,
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
          placeholder="Search by name or number"
        />
        <div className="row wrap" style={{ gap: 6 }}>
          {TYPES.map((t) => (
            <button
              key={t || 'all'}
              className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setType(t);
                setPage(1);
              }}
            >
              {t ? TYPE_LABEL[t] : 'All'}
            </button>
          ))}
          <select
            className="select"
            style={{ width: 130 }}
            value={tier}
            onChange={(e) => {
              setTier(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any tier</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      {isLoading && !data ? (
        <div style={{ padding: 60, display: 'grid', placeItems: 'center' }}>
          <Spinner />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Empty title="No reports found" subtitle="Try a different module or search." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>READING</th>
                  <th>MODULE</th>
                  <th>USER</th>
                  <th>TIER</th>
                  <th>SCORE</th>
                  <th>GENERATED</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
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
                      <div className="small">{r.user_name || '—'}</div>
                      <div className="cell-sub">{r.user_email || 'anonymous'}</div>
                    </td>
                    <td>
                      <span className="row" style={{ gap: 5 }}>
                        <Pill tone={r.tier === 'premium' ? 'good' : 'muted'}>{r.tier}</Pill>
                        {!!r.pdf_url && <Pill tone="info">shared</Pill>}
                      </span>
                    </td>
                    <td className="mono">{r.score ?? '—'}</td>
                    <td className="tiny">{fmtDateTime(r.created_at)}</td>
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
