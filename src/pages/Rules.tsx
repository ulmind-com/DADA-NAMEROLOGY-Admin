import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Empty, Field, Modal, Pill, Search, Spinner } from '@/components/ui';
import { IconEdit, IconRevert } from '@/components/Icons';
import { del, get, put } from '@/lib/api';
import { ratingClass } from '@/lib/format';
import { useToast } from '@/lib/toast';
import type { RuleSet } from '@/lib/types';

const KINDS = [
  { key: 'compound_meanings', label: 'Compound numbers', hint: '1 – 52 · the meaning shown under every result' },
  { key: 'root_profiles', label: 'Planets 1 – 9', hint: 'Traits, colours, gems, friendly & enemy numbers' },
  { key: 'pair_meanings', label: 'Pair grid', hint: 'All 81 digit pairs used by the mobile TOTAL GRID' },
] as const;

type Kind = (typeof KINDS)[number]['key'];

/** Which fields to surface as friendly inputs for each rule set. */
const FIELDS: Record<Kind, { key: string; label: string; type: 'text' | 'area' | 'rating' | 'list' }[]> = {
  compound_meanings: [
    { key: 'title', label: 'TITLE', type: 'text' },
    { key: 'rating', label: 'RATING', type: 'rating' },
    { key: 'short', label: 'ONE-LINE SUMMARY', type: 'area' },
    { key: 'description', label: 'FULL DESCRIPTION', type: 'area' },
  ],
  root_profiles: [
    { key: 'planet', label: 'PLANET', type: 'text' },
    { key: 'title', label: 'TITLE', type: 'text' },
    { key: 'description', label: 'DESCRIPTION', type: 'area' },
    { key: 'colors', label: 'FAVOURABLE COLOURS (comma separated)', type: 'list' },
    { key: 'avoid_colors', label: 'COLOURS TO AVOID', type: 'list' },
    { key: 'lucky_days', label: 'LUCKY DAYS', type: 'list' },
    { key: 'gem', label: 'GEMSTONE', type: 'text' },
    { key: 'friendly', label: 'FRIENDLY NUMBERS', type: 'list' },
    { key: 'enemy', label: 'ENEMY NUMBERS', type: 'list' },
    { key: 'traits', label: 'STRENGTHS', type: 'list' },
    { key: 'shadow', label: 'WEAKNESSES', type: 'list' },
    { key: 'career', label: 'CAREERS', type: 'list' },
  ],
  pair_meanings: [
    { key: 'rating', label: 'RATING', type: 'rating' },
    { key: 'label', label: 'LABEL', type: 'text' },
    { key: 'color', label: 'COLOUR (hex)', type: 'text' },
    { key: 'impact', label: 'IMPACT TEXT', type: 'area' },
  ],
};

const RATINGS = ['excellent', 'good', 'average', 'caution', 'bad'];

export default function Rules() {
  const toast = useToast();
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind>('compound_meanings');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ key: string; data: any } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['rules', kind],
    queryFn: () => get<RuleSet>(`/admin/rules/${kind}`),
  });

  const save = useMutation({
    mutationFn: (body: { kind: string; key: string; data: any }) => put('/admin/rules', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      toast('Rule saved — it is live in the app immediately.', 'success');
      setEditing(null);
    },
    onError: (e: any) => toast(e?.message ?? 'Could not save.', 'error'),
  });

  const revert = useMutation({
    mutationFn: (key: string) => del(`/admin/rules/${kind}/${encodeURIComponent(key)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      toast('Reverted to the bundled default.', 'success');
    },
    onError: (e: any) => toast(e?.message ?? 'Could not revert.', 'error'),
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const list = Object.entries(data.items);
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(([key, v]: [string, any]) =>
      [key, v.title, v.short, v.impact, v.planet, v.label, v.description]
        .filter(Boolean)
        .some((s: string) => String(s).toLowerCase().includes(needle)),
    );
  }, [data, q]);

  const active = KINDS.find((k) => k.key === kind)!;

  return (
    <>
      <div className="tabs">
        {KINDS.map((k) => (
          <button
            key={k.key}
            className={`tab ${kind === k.key ? 'active' : ''}`}
            onClick={() => {
              setKind(k.key);
              setQ('');
            }}
          >
            {k.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="card-head wrap">
          <div>
            <h3>{active.label}</h3>
            <p className="tiny" style={{ marginTop: 3 }}>{active.hint}</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            {!!data?.overridden.length && (
              <Pill tone="brand">{data.overridden.length} customised</Pill>
            )}
            <Search value={q} onChange={setQ} placeholder="Search rules" />
          </div>
        </div>

        {isLoading || !data ? (
          <div style={{ padding: 60, display: 'grid', placeItems: 'center' }}>
            <Spinner />
          </div>
        ) : rows.length === 0 ? (
          <Empty title="Nothing matches" subtitle="Try a different search term." />
        ) : (
          <div>
            {rows.map(([key, v]: [string, any]) => {
              const overridden = data.overridden.includes(key);
              const tone = ratingClass(v.rating);
              return (
                <div className="rule-row" key={key}>
                  <div
                    className={`rule-key pill ${tone}`}
                    style={{ borderRadius: 'var(--r)', justifyContent: 'center' }}
                  >
                    {key}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="rule-title">
                      {v.title || v.planet || v.label || key}
                      {overridden && (
                        <>
                          {' '}
                          <Pill tone="brand">edited</Pill>
                        </>
                      )}
                    </div>
                    <div className="rule-sub">
                      {v.short || v.impact || v.description || '—'}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 7 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing({ key, data: { ...v } })}
                    >
                      <IconEdit size={14} /> Edit
                    </button>
                    {overridden && (
                      <button
                        className="btn btn-danger btn-sm"
                        title="Revert to the bundled default"
                        onClick={() => revert.mutate(key)}
                      >
                        <IconRevert size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {editing && (
        <Modal
          title={`Edit ${active.label} · ${editing.key}`}
          subtitle="Saved changes take effect in the mobile app instantly — no redeploy needed."
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={save.isPending}
                onClick={() => save.mutate({ kind, key: editing.key, data: editing.data })}
              >
                {save.isPending ? 'Saving…' : 'Save rule'}
              </button>
            </>
          }
        >
          {FIELDS[kind].map((f) => {
            const value = editing.data[f.key];
            const set = (v: any) =>
              setEditing({ ...editing, data: { ...editing.data, [f.key]: v } });

            if (f.type === 'rating') {
              return (
                <Field key={f.key} label={f.label}>
                  <select className="select" value={value ?? 'average'} onChange={(e) => set(e.target.value)}>
                    {RATINGS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            }
            if (f.type === 'area') {
              return (
                <Field key={f.key} label={f.label}>
                  <textarea className="textarea" value={value ?? ''} onChange={(e) => set(e.target.value)} />
                </Field>
              );
            }
            if (f.type === 'list') {
              const asText = Array.isArray(value) ? value.join(', ') : (value ?? '');
              return (
                <Field key={f.key} label={f.label}>
                  <input
                    className="input"
                    value={asText}
                    onChange={(e) =>
                      set(
                        e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((s) => (/^\d+$/.test(s) ? Number(s) : s)),
                      )
                    }
                  />
                </Field>
              );
            }
            return (
              <Field key={f.key} label={f.label}>
                <input className="input" value={value ?? ''} onChange={(e) => set(e.target.value)} />
              </Field>
            );
          })}
        </Modal>
      )}
    </>
  );
}
