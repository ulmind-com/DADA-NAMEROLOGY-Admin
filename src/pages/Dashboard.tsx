import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardHead, Empty, Pill, Spinner, Stat } from '@/components/ui';
import { IconCrown, IconReports, IconTrend, IconUsers } from '@/components/Icons';
import { get } from '@/lib/api';
import { fmtRelative, TYPE_LABEL } from '@/lib/format';
import type { Stats } from '@/lib/types';

const TYPE_COLORS: Record<string, string> = {
  name: '#B3441E',
  business: '#8C6239',
  newborn: '#C77C2E',
  mobile: '#2E7D6B',
  vehicle: '#3C6DA8',
};

const shortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => get<Stats>('/admin/stats'),
    refetchInterval: 60_000,
  });

  if (isLoading || !data) return <Spinner center />;

  const series = data.signups_series.map((s, i) => ({
    date: shortDate(s.date),
    signups: s.count,
    reports: data.reports_series[i]?.count ?? 0,
  }));

  const byType = Object.entries(data.reports_by_type).map(([k, v]) => ({
    type: TYPE_LABEL[k] ?? k,
    key: k,
    count: v,
  }));

  return (
    <>
      <div className="grid g4">
        <Stat
          label="Total users"
          value={data.users_total.toLocaleString('en-IN')}
          hint={`+${data.users_today} today · +${data.users_week} this week`}
          icon={<IconUsers size={18} />}
        />
        <Stat
          label="Premium members"
          value={data.premium_users.toLocaleString('en-IN')}
          hint={
            data.users_total
              ? `${Math.round((data.premium_users / data.users_total) * 100)}% conversion`
              : '—'
          }
          icon={<IconCrown size={18} />}
          tone="gold"
        />
        <Stat
          label="Reports generated"
          value={data.reports_total.toLocaleString('en-IN')}
          hint={`+${data.reports_today} today`}
          icon={<IconReports size={18} />}
          tone="good"
        />
        <Stat
          label="Most used module"
          value={byType.sort((a, b) => b.count - a.count)[0]?.type ?? '—'}
          hint={`${byType.sort((a, b) => b.count - a.count)[0]?.count ?? 0} readings`}
          icon={<IconTrend size={18} />}
          tone="info"
        />
      </div>

      <div className="grid g2 mt" style={{ gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)' }}>
        <Card>
          <CardHead title="Last 30 days" subtitle="Signups and reports per day" />
          <div style={{ padding: '16px 12px 8px', height: 268 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B3441E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#B3441E" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7D6B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2E7D6B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EBD9C0" strokeDasharray="3 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10.5, fill: '#8A7565' }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10.5, fill: '#8A7565' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #EBD9C0',
                    background: '#FFFDF8',
                    fontSize: 12,
                    boxShadow: '0 8px 24px rgba(140,98,57,.12)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="#B3441E"
                  strokeWidth={2}
                  fill="url(#gS)"
                  name="Signups"
                />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#2E7D6B"
                  strokeWidth={2}
                  fill="url(#gR)"
                  name="Reports"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHead title="Reports by module" subtitle="All time" />
          <div style={{ padding: '16px 12px 8px', height: 268 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#EBD9C0" strokeDasharray="3 4" vertical={false} />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 10.5, fill: '#8A7565' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10.5, fill: '#8A7565' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={44}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(179,68,30,.06)' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #EBD9C0',
                    background: '#FFFDF8',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[7, 7, 0, 0]} name="Reports">
                  {byType.map((b) => (
                    <Cell key={b.key} fill={TYPE_COLORS[b.key] ?? '#B3441E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid g2 mt">
        <Card>
          <CardHead
            title="Newest users"
            right={<Link className="btn btn-ghost btn-sm" to="/users">View all</Link>}
          />
          {data.recent_users.length === 0 ? (
            <Empty title="No users yet" />
          ) : (
            <div className="table-wrap">
              <table>
                <tbody>
                  {data.recent_users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link to={`/users/${u.id}`}>
                          <div className="cell-strong">{u.full_name || '—'}</div>
                          <div className="cell-sub">{u.email}</div>
                        </Link>
                      </td>
                      <td style={{ width: 110 }}>
                        <Pill tone={u.provider.includes('google') ? 'info' : 'muted'}>
                          {u.provider}
                        </Pill>
                      </td>
                      <td style={{ width: 96 }}>
                        {u.is_premium ? <Pill tone="good">Premium</Pill> : <Pill>Free</Pill>}
                      </td>
                      <td className="tiny" style={{ width: 92, textAlign: 'right' }}>
                        {fmtRelative(u.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHead
            title="Latest readings"
            right={<Link className="btn btn-ghost btn-sm" to="/reports">View all</Link>}
          />
          {data.recent_reports.length === 0 ? (
            <Empty title="No reports yet" />
          ) : (
            <div className="table-wrap">
              <table>
                <tbody>
                  {data.recent_reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link to={`/reports/${r.id}`}>
                          <div className="cell-strong">{r.title}</div>
                          <div className="cell-sub">{r.subtitle}</div>
                        </Link>
                      </td>
                      <td style={{ width: 104 }}>
                        <Pill tone="brand">{TYPE_LABEL[r.type] ?? r.type}</Pill>
                      </td>
                      <td className="tiny" style={{ width: 92, textAlign: 'right' }}>
                        {fmtRelative(r.created_at)}
                      </td>
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
