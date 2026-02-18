/**
 * Returns a deterministic HSL color for a user id. Used when the user has no
 * stored avatarColor.
 */
function fallbackColorFromId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i)
  const hue = Math.abs(h % 360)
  return `hsl(${hue}, 55%, 45%)`
}

/**
 * Returns the avatar background color for a user: stored color if valid,
 * otherwise a deterministic color derived from the user id.
 */
export function avatarColorFromUser(
  id: string,
  storedColor: string | null
): string {
  const trimmed = storedColor?.trim()
  if (trimmed) return trimmed
  return fallbackColorFromId(id)
}

/**
 * Returns initials from a display name (e.g. "Jane Doe" -> "JD", "Al" -> "AL").
 */
export function getInitials(displayName: string | null): string {
  if (!displayName?.trim()) return '?'
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return displayName.slice(0, 2).toUpperCase()
}

/** Preset avatar colors (hex). Used in settings and validated in the server action. */
export const AVATAR_COLOR_PRESETS = [
  '#e11d48', // rose
  '#ea580c', // orange
  '#ca8a04', // yellow
  '#65a30d', // lime
  '#16a34a', // green
  '#0d9488', // teal
  '#0891b2', // cyan
  '#2563eb', // blue
  '#7c3aed', // violet
  '#c026d3', // fuchsia
  '#db2777', // pink
  '#64748b', // slate
] as const

export function isAllowedAvatarColor(value: string | null): boolean {
  if (value == null || value.trim() === '') return true
  const hex = value.trim().toLowerCase()
  return AVATAR_COLOR_PRESETS.some((p) => p.toLowerCase() === hex)
}
