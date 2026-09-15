export type PackageTier = 'basic' | 'advanced' | 'vip';

export const PACKAGE_TIERS = {
  basic: { label: 'Cơ bản', responseHours: 24 },
  advanced: { label: 'Nâng cao', responseHours: 8 },
  vip: { label: 'VIP', responseHours: 2 },
} as const;

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().trim();
}

export function getPackageTier(name: unknown): PackageTier | null {
  if (typeof name !== 'string') return null;
  const normalized = normalize(name);
  const matches: PackageTier[] = [];
  if (/\b(co ban|basic)\b/.test(normalized)) matches.push('basic');
  if (/\b(nang cao|advanced)\b/.test(normalized)) matches.push('advanced');
  if (/\bvip\b/.test(normalized)) matches.push('vip');
  return matches.length === 1 ? matches[0] : null;
}

export function getPackageName(name: unknown) {
  return typeof name === 'string' && name.trim() ? name.trim() : 'Chưa có thông tin gói';
}

export function serviceKey(service: string) {
  // Preserve accents: two differently named services must not become one entitlement.
  return service.normalize('NFC').toLocaleLowerCase('vi-VN').replace(/\s+/g, ' ').trim();
}

export interface PackageServices {
  services: string[];
  available: boolean;
}

function cleanServices(values: unknown[]): PackageServices {
  const services = new Map<string, string>();
  let available = true;
  for (const value of values) {
    if (typeof value !== 'string') {
      available = false;
      continue;
    }
    const label = value.replace(/^\s*(?:[-*•✓✔]\s*|\d+[.)]\s+)/, '').replace(/\s+/g, ' ').trim();
    if (label) services.set(serviceKey(label), label);
  }
  return { services: Array.from(services.values()), available };
}

/** API values may be JSON string arrays or delimiter-separated text. Never render objects as benefits. */
export function parsePackageServices(value: unknown): PackageServices {
  if (Array.isArray(value)) return cleanServices(value);
  if (typeof value !== 'string' || !value.trim()) return { services: [], available: false };
  const text = value.trim();
  if (/^[\[{]/.test(text) || /^(null|undefined)$/i.test(text)) {
    try {
      const parsed: unknown = JSON.parse(text);
      return Array.isArray(parsed) ? cleanServices(parsed) : { services: [], available: false };
    } catch {
      return { services: [], available: false };
    }
  }

  // Prefer explicit list separators; commas inside prose/parentheses stay with the service.
  const hasListSeparator = /[;\n\r|•]/.test(text);
  const parts: string[] = [];
  let part = '';
  let depth = 0;
  for (const char of text) {
    if ('([{'.includes(char)) depth++;
    if (')]}'.includes(char)) depth = Math.max(0, depth - 1);
    const separator = hasListSeparator ? /[;\n\r|•]/.test(char) : char === ',';
    if (separator && depth === 0) {
      parts.push(part);
      part = '';
    } else {
      part += char;
    }
  }
  parts.push(part);
  return cleanServices(parts);
}
