export type GrowthFilter = 'ALL' | 'SHORT' | 'MEDIUM' | 'LONG';

const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();

export function filterSeeds<T extends { SeedName: string; GrowthDurationDays: number; Category?: string }>(
  seeds: T[], { query, growth, category = 'ALL' }: { query: string; growth: GrowthFilter; category?: string },
): T[] {
  const search = normalized(query);
  return seeds.filter((seed) => {
    const days = seed.GrowthDurationDays;
    const validDays = typeof days === 'number' && Number.isFinite(days) && days > 0;
    const matchesGrowth = growth === 'ALL' || (validDays && (
      growth === 'SHORT' ? days < 30 : growth === 'MEDIUM' ? days >= 30 && days <= 60 : days > 60
    ));
    return normalized(seed.SeedName || '').includes(search) && matchesGrowth
      && (category === 'ALL' || seed.Category === category);
  });
}
