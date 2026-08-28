import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHead, Field, Modal, Spinner, Toggle } from '@/components/ui';
import { IconMegaphone, IconPlus } from '@/components/Icons';
import { get, post, put } from '@/lib/api';
import { useSession } from '@/lib/session';
import { useToast } from '@/lib/toast';
import type { Settings as SettingsMap } from '@/lib/types';

const NUMERIC = new Set(['free_full_reports', 'premium_price_inr']);
const BOOLEAN = new Set(['vehicle_enabled', 'maintenance']);

const LABELS: Record<string, { title: string; hint: string }> = {
  free_full_reports: {
    title: 'Free detailed reports',
    hint: 'How many full reports a non-premium user gets before the paywall.',
  },
  premium_price_inr: { title: 'Premium price (₹)', hint: 'Shown on the upgrade screen in the app.' },
  vehicle_enabled: {
    title: 'Vehicle numerology live',
    hint: 'Turn off to hide the vehicle module until the final rules arrive.',
  },
  maintenance: { title: 'Maintenance mode', hint: 'Shows a maintenance notice inside the app.' },
  support_whatsapp: { title: 'Support WhatsApp number', hint: 'Displayed on the profile screen.' },
  announcement: { title: 'Home screen announcement', hint: 'A banner shown at the top of the app home.' },
};

export default function Settings() {
  const toast = useToast();
  const qc = useQueryClient();
  const { isSuper } = useSession();
  const [draft, setDraft] = useState<SettingsMap>({});
  const [broadcast, setBroadcast] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => get<SettingsMap>('/admin/settings'),
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (body: { key: string; value: any }) => put('/admin/settings', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      toast('Setting saved.', 'success');
    },
    onError: (e: any) => toast(e?.message ?? 'Could not save.', 'error'),
  });

  if (isLoading || !data) return <Spinner center />;

  const setValue = (key: string, value: any) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], value } }));

  const commit = (key: string) => save.mutate({ key, value: draft[key] });

  return (
    <>
      <div className="grid g2">
        <Card>
          <CardHead title="App configuration" subtitle="Read by the mobile app on every launch" />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.keys(LABELS).map((key) => {
              const meta = LABELS[key];
              const entry = draft[key] ?? { value: '' };
              return (
                <div key={key} className="row between" style={{ alignItems: 'flex-start', gap: 18 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-strong">{meta.title}</div>
                    <div className="cell-sub">{meta.hint}</div>

                    {!BOOLEAN.has(key) && (
                      <div className="row" style={{ gap: 8, marginTop: 9 }}>
                        <input
                          className="input"
                          type={NUMERIC.has(key) ? 'number' : 'text'}
                          value={entry.value ?? ''}
                          onChange={(e) =>
                            setValue(
                              key,
                              NUMERIC.has(key) ? Number(e.target.value || 0) : e.target.value,
                            )
                          }
                        />
                        <button className="btn btn-ghost btn-sm" onClick={() => commit(key)}>
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {BOOLEAN.has(key) && (
                    <Toggle
                      on={!!entry.value}
                      onChange={(v) => {
                        setValue(key, v);
                        save.mutate({ key, value: { ...entry, value: v } });
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div>
          <Card>
            <CardHead title="Broadcast" subtitle="Email every user at once" />
            <div style={{ padding: 20 }}>
              <p className="small muted" style={{ lineHeight: 1.7 }}>
                Send an announcement to all users, or only to premium / free members. Emails go out
                through the configured SMTP account.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 14 }}
                disabled={!isSuper}
                onClick={() => setBroadcast(true)}
              >
                <IconMegaphone size={15} /> Compose broadcast
              </button>
              {!isSuper && (
                <p className="tiny" style={{ marginTop: 8 }}>
                  Only a super-admin can send broadcasts.
                </p>
              )}
            </div>
          </Card>

          {isSuper && <AdminCreator />}
        </div>
      </div>

      {broadcast && <BroadcastModal onClose={() => setBroadcast(false)} />}
    </>
  );
}

function BroadcastModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');

  const send = useMutation({
    mutationFn: () => post('/admin/broadcast', { subject, body, audience }),
    onSuccess: (res: any) => {
      toast(`Sent to ${res.sent} of ${res.recipients} recipients.`, 'success');
      onClose();
    },
    onError: (e: any) => toast(e?.message ?? 'Broadcast failed.', 'error'),
  });

  return (
    <Modal
      title="Send a broadcast"
      subtitle="This emails real users — double-check before sending."
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={send.isPending || subject.length < 3 || body.length < 3}
            onClick={() => send.mutate()}
          >
            {send.isPending ? 'Sending…' : 'Send now'}
          </button>
        </>
      }
    >
      <Field label="AUDIENCE">
        <select className="select" value={audience} onChange={(e) => setAudience(e.target.value)}>
          <option value="all">All active users</option>
          <option value="premium">Premium members only</option>
          <option value="free">Free users only</option>
        </select>
      </Field>
      <Field label="SUBJECT">
        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="MESSAGE">
        <textarea
          className="textarea"
          style={{ minHeight: 150 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

function AdminCreator() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'admin' });

  const create = useMutation({
    mutationFn: () => post('/admin/admins', form),
    onSuccess: () => {
      toast('Admin created.', 'success');
      setOpen(false);
      setForm({ email: '', full_name: '', password: '', role: 'admin' });
    },
    onError: (e: any) => toast(e?.message ?? 'Could not create the admin.', 'error'),
  });

  return (
    <>
      <Card className="mt">
        <CardHead title="Team" subtitle="Give a colleague access to this panel" />
        <div style={{ padding: 20 }}>
          <button className="btn btn-ghost" onClick={() => setOpen(true)}>
            <IconPlus size={15} /> Add an admin
          </button>
        </div>
      </Card>

      {open && (
        <Modal
          title="Add an admin"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={create.isPending || form.password.length < 8}
                onClick={() => create.mutate()}
              >
                {create.isPending ? 'Creating…' : 'Create'}
              </button>
            </>
          }
        >
          <Field label="FULL NAME">
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </Field>
          <Field label="EMAIL">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="TEMPORARY PASSWORD (min 8 characters)">
            <input
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="ROLE">
            <select
              className="select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super admin</option>
            </select>
          </Field>
        </Modal>
      )}
    </>
  );
}
