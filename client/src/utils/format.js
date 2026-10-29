export function cx(...values) {
  return values.filter(Boolean).join(' ');
}

export function formatYear(year) {
  return Number.isInteger(year) ? String(year) : null;
}

export function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return null;
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatTotalDuration(tracks = []) {
  const total = tracks.reduce((sum, track) => sum + (track.durationMs ?? 0), 0);
  if (!total) return null;
  const minutes = Math.round(total / 60000);
  return `${minutes} min`;
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function albumHref(album) {
  if (album?.id) return `/album/${album.id}`;
  if (album?.externalId) return `/album/catalog/${album.externalId}`;
  return '/browse';
}

export function albumSubtitle(album) {
  return [album?.artist, formatYear(album?.releaseYear)].filter(Boolean).join(' · ');
}

export function formatAddedDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
