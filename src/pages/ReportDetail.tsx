import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHead, KV, Pill, Spinner } from '@/components/ui';
import { IconBack, IconDownload } from '@/components/Icons';
import { get, openPdf } from '@/lib/api';
import { fmtDateTime, ratingClass, TYPE_LABEL } from '@/lib/format';
import { useToast } from '@/lib/toast';

type Detail = {
  id: string;
  type: string;
  tier: string;
  title: string;
  subtitle: string;
  score: number | null;
  payload: Record<string, unknown>;
  result: any;
  created_at: string;
  user: { id: string; email: string; full_name: string } | null;
};

export default function ReportDetail() {
  const { id } = useParams();
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => get<Detail>(`/admin/reports/${id}`),
  });

  if (isLoading || !data) return <Spinner center />;
  const r = data.result ?? {};
  const grid: any[] = r.grid ?? [];

  return (
    <>
      <div className="row between" style={{ marginBottom: 16 }}>
        <Link to="/reports" className="btn btn-ghost btn-sm">
          <IconBack size={14} /> Back to reports
        </Link>
        <button
          className="btn btn-primary btn-sm"
          onClick={() =>
            openPdf(`/admin/reports/${id}/pdf`).catch(() => toast('Could not open the PDF.', 'error'))
          }
        >
          <IconDownload size={14} /> Open PDF
        </button>
      </div>

      <div className="grid g2" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)' }}>
        <div>
          <Card pad>
            <span className="label">{(TYPE_LABEL[data.type] ?? data.type).toUpperCase()} REPORT</span>
            <h2 style={{ marginTop: 6 }}>{data.title}</h2>
            <p className="small muted" style={{ marginTop: 4 }}>{data.subtitle}</p>

            <div className="row wrap" style={{ gap: 6, marginTop: 14 }}>
              <Pill tone={data.tier === 'premium' ? 'good' : 'muted'}>{data.tier}</Pill>
              {!!r.rating && <span className={`pill ${ratingClass(r.rating)}`}>{r.rating}</span>}
              {!!r.verdict?.label && (
                <span className="pill" style={{ background: `${r.verdict.color}1A`, color: r.verdict.color }}>
                  {r.verdict.label}
                </span>
              )}
            </div>

            <div style={{ marginTop: 18 }}>
              {data.user && (
                <KV
                  k="User"
                  v={<Link to={`/users/${data.user.id}`}>{data.user.full_name || data.user.email}</Link>}
                />
              )}
              <KV k="Generated" v={fmtDateTime(data.created_at)} />
              {r.compound !== undefined && <KV k="Compound" v={r.compound} />}
              {r.total !== undefined && <KV k="Total" v={r.total} />}
              {r.score !== undefined && <KV k="Score" v={`${r.score}%`} />}
              {r.alignment_score !== undefined && <KV k="Alignment" v={`${r.alignment_score}%`} />}
              {r.radical?.number !== undefined && (
                <KV k="Radical" v={`${r.radical.number} — ${r.radical.planet ?? ''}`} />
              )}
              {r.destiny?.number !== undefined && (
                <KV k="Destiny" v={`${r.destiny.number} — ${r.destiny.planet ?? ''}`} />
              )}
              {r.owner?.match?.label && <KV k="Personal fit" v={r.owner.match.label} />}
            </div>
          </Card>

          <Card className="mt">
            <CardHead title="Submitted input" />
            <div style={{ padding: 16 }}>
              <pre className="json-view">{JSON.stringify(data.payload, null, 2)}</pre>
            </div>
          </Card>
        </div>

        <div>
          {!!r.description && (
            <Card pad>
              <span className="label">MEANING</span>
              <h3 style={{ marginTop: 6 }}>{r.title}</h3>
              <p className="small" style={{ marginTop: 8, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
                {r.description}
              </p>
              {!!r.suggest && (
                <p className="small" style={{ marginTop: 12, fontWeight: 500 }}>
                  <strong>Suggestion:</strong> {r.suggest}
                </p>
              )}
            </Card>
          )}

          {grid.length > 0 && (
            <Card className={r.description ? 'mt' : ''}>
              <CardHead
                title="Total grid"
                subtitle={`${r.grid_summary?.good ?? 0} good · ${r.grid_summary?.average ?? 0} average · ${r.grid_summary?.bad ?? 0} bad`}
              />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>PAIR</th>
                      <th>PLANETS</th>
                      <th>RATING</th>
                      <th>IMPACT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map((g, i) => (
                      <tr key={`${g.pair}-${i}`}>
                        <td>
                          <span
                            className="pill"
                            style={{ background: `${g.color}1A`, color: g.color, fontWeight: 700 }}
                          >
                            {g.pair}
                          </span>
                        </td>
                        <td className="small">{g.planets}</td>
                        <td>
                          <span className="row" style={{ gap: 6 }}>
                            <span className="dot" style={{ background: g.color }} />
                            <span className="small" style={{ color: g.color, fontWeight: 600 }}>
                              {g.label}
                            </span>
                          </span>
                        </td>
                        <td className="small muted" style={{ maxWidth: 380 }}>{g.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {!!r.similar_names?.length && (
            <Card className="mt">
              <CardHead title="Suggested corrections" />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>COMPOUND</th>
                      <th>TOTAL</th>
                      <th>VIBRATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.similar_names.map((s: any, i: number) => (
                      <tr key={i}>
                        <td className="cell-strong">{s.name}</td>
                        <td className="mono">{s.compound}</td>
                        <td className="mono">{s.total}</td>
                        <td>
                          <span className={`pill ${ratingClass(s.rating)}`}>{s.title}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card className="mt">
            <CardHead title="Raw engine output" subtitle="Everything the numerology engine returned" />
            <div style={{ padding: 16 }}>
              <pre className="json-view">{JSON.stringify(data.result, null, 2)}</pre>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
