import React from 'react';
import { IconClose, IconInbox, IconSearch } from './Icons';

export function Card({
  children,
  className = '',
  pad,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return <div className={`card ${pad ? 'card-pad' : ''} ${className}`}>{children}</div>;
}

export function CardHead({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="card-head">
      <div>
        <h3>{title}</h3>
        {!!subtitle && <p className="tiny" style={{ marginTop: 3 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'brand' | 'good' | 'info' | 'gold';
}) {
  const bg = {
    brand: 'var(--brand-soft)',
    good: 'var(--good-soft)',
    info: 'var(--info-soft)',
    gold: 'var(--gold-soft)',
  }[tone];
  const fg = {
    brand: 'var(--brand)',
    good: 'var(--good)',
    info: 'var(--info)',
    gold: '#a5761a',
  }[tone];
  return (
    <div className="card stat">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {!!icon && (
          <span className="stat-icon" style={{ background: bg, color: fg }}>
            {icon}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {!!hint && <div className="stat-delta" style={{ color: fg }}>{hint}</div>}
    </div>
  );
}

export function Avatar({
  url,
  name,
  email,
  size = 32,
}: {
  url?: string | null;
  name?: string;
  email?: string;
  size?: number;
}) {
  const letter = (name?.trim() || email || 'U').charAt(0).toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="avatar-img"
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <span className="who-av" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {letter}
    </span>
  );
}

export function Pill({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode;
  tone?: 'good' | 'warn' | 'bad' | 'info' | 'brand' | 'muted';
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <IconInbox size={24} />
      </div>
      <h3>{title}</h3>
      {!!subtitle && <p className="small muted" style={{ marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}

export function Spinner({ center }: { center?: boolean }) {
  const el = <div className="spinner" />;
  return center ? <div className="center-page">{el}</div> : el;
}

export function Search({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search" style={{ minWidth: 240 }}>
      <IconSearch size={16} />
      <input
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="row between">
            <div>
              <h2>{title}</h2>
              {!!subtitle && <p className="tiny" style={{ marginTop: 4 }}>{subtitle}</p>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
              <IconClose size={15} />
            </button>
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {!!footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      className={`switch ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    />
  );
}

export function Pagination({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="pagination">
      <span className="tiny">
        Page {page} of {pages} · {total} total
      </span>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="kv">
      <span className="kv-k">{k}</span>
      <span className="kv-v">{v}</span>
    </div>
  );
}
