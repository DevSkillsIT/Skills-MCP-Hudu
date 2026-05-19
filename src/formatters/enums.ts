/**
 * Enum resolution helpers for Hudu API integer codes.
 *
 * Hudu.json (OpenAPI schema) defines several fields as plain integers
 * that map to human-readable labels. This module centralises all such
 * maps so every formatter uses a single source of truth.
 *
 * REQ-06 / BUG-06 — SPEC-HUDU-FIX-001
 */

// ---------------------------------------------------------------------------
// network_type
// Source: Hudu.json#/definitions/Network.properties.network_type
// "The type of network, represented as an integer."
// Empirically: 0 = IPv4, 1 = IPv6 (consistent with Hudu UI labels).
// ---------------------------------------------------------------------------
const NETWORK_TYPE_MAP: Record<number, string> = {
  0: 'IPv4',
  1: 'IPv6',
};

/**
 * Resolve a raw network_type integer (or string-encoded integer) from the
 * Hudu API to a human-readable label.
 *
 * Returns the label when recognised, the original stringified value when
 * out-of-range, and '-' when the value is absent.
 */
export function resolveNetworkType(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '-';
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (!Number.isFinite(num)) return String(value);
  return NETWORK_TYPE_MAP[num] ?? String(value);
}

// ---------------------------------------------------------------------------
// expiration_type
// Source: Hudu.json#/definitions/Expiration.properties.expiration_type
// "The type of expiration (e.g., domain)"
// The Hudu API returns expiration_type as a STRING (e.g. "domain", "ssl",
// "contract") rather than an integer. No int-to-label map is needed; the
// value is already human-readable. However, we expose a helper that
// normalises capitalisation and handles nulls for consistent display.
// ---------------------------------------------------------------------------

/**
 * Normalise an expiration_type string from the Hudu API.
 *
 * Returns the capitalised label when present, '-' when absent.
 */
export function resolveExpirationType(value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '-';
  // Capitalise first letter for consistent display
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------------------------------------------------------------------------
// status_list_item / role_list_item
// These are FK-style references to list items in Hudu's custom lists.
// The API does NOT return integer-to-label maps for these; the name must
// come from the actual list items in the API response or from a separate
// /lists call. The helpers below handle the common display fallback.
// ---------------------------------------------------------------------------

/**
 * Return the best-available display label for a list item.
 *
 * @param name  Human-readable name from the API payload (if present)
 * @param id    Numeric ID to display as fallback when name is absent
 */
export function resolveListItemLabel(
  name: string | undefined | null,
  id: number | undefined | null
): string {
  if (name && name.trim() !== '') return name.trim();
  if (id !== undefined && id !== null) return `ID ${id}`;
  return '-';
}
