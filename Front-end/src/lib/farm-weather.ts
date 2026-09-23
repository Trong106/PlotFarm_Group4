export const WEATHER_LOCATIONS = [
  { id: 'cu-chi', label: 'Củ Chi', latitude: 10.9733, longitude: 106.4933 },
  { id: 'da-lat', label: 'Đà Lạt (Lâm Đồng)', latitude: 11.9404, longitude: 108.4583 },
] as const;
export type WeatherLocationId = typeof WEATHER_LOCATIONS[number]['id'];

export function inferWeatherLocation(address?: string): WeatherLocationId | null {
  const text = (address || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  if (/\bcu chi\b/.test(text)) return 'cu-chi';
  // Province alone is not a precise location: let the customer choose the region.
  if (/\bda lat\b/.test(text)) return 'da-lat';
  return null;
}

export function weatherDescription(code: number | null, isDay = true): string {
  if (code === 0) return isDay ? 'Trời nắng' : 'Trời quang';
  if (code === 1 || code === 2) return 'Ít mây';
  if (code === 3) return 'Nhiều mây';
  if (code === 45 || code === 48) return 'Sương mù';
  if ([51, 53, 55, 56, 57].includes(code ?? -1)) return 'Mưa phùn';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code ?? -1)) return 'Có mưa';
  if ([71, 73, 75, 77, 85, 86].includes(code ?? -1)) return 'Có tuyết';
  if ([95, 96, 99].includes(code ?? -1)) return 'Mưa dông';
  return 'Chưa có thông tin';
}

export function parseWeather(data: unknown) {
  const body = data as { current?: Record<string, unknown>; daily?: Record<string, unknown[]> };
  const current = body?.current;
  if (!current || typeof current.time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(current.time)) {
    throw new Error('Invalid weather response');
  }
  const numeric = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null;
  const daily = body.daily;
  return {
    current: {
      time: `${current.time}+07:00`,
      temperature: numeric(current.temperature_2m, -90, 65),
      humidity: numeric(current.relative_humidity_2m, 0, 100),
      weatherCode: numeric(current.weather_code, 0, 99), isDay: current.is_day === 1,
    },
    daily: (Array.isArray(daily?.time) ? daily.time : []).slice(0, 2).flatMap((date, i) => {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
      return [{ date, weatherCode: numeric(daily?.weather_code?.[i], 0, 99),
        min: numeric(daily?.temperature_2m_min?.[i], -90, 65), max: numeric(daily?.temperature_2m_max?.[i], -90, 65),
        rainProbability: numeric(daily?.precipitation_probability_max?.[i], 0, 100) }];
    }),
  };
}
