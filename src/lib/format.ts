export const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

export const fmtRelative = (iso?: string | null) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
};

export const initials = (name?: string, email?: string) =>
  (name?.trim() || email || 'U').charAt(0).toUpperCase();

export const TYPE_LABEL: Record<string, string> = {
  name: 'Name',
  business: 'Business',
  newborn: 'New Born',
  mobile: 'Mobile',
  vehicle: 'Vehicle',
};

export const ratingClass = (rating?: string) => {
  switch ((rating ?? '').toLowerCase()) {
    case 'excellent':
    case 'good':
      return 'pill-good';
    case 'caution':
      return 'pill-warn';
    case 'bad':
      return 'pill-bad';
    default:
      return 'pill-warn';
  }
};
