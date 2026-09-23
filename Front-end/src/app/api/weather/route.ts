import { NextRequest, NextResponse } from 'next/server';
import { parseWeather, WEATHER_LOCATIONS } from '@/lib/farm-weather';

export async function GET(request: NextRequest) {
  const location = WEATHER_LOCATIONS.find((item) => item.id === request.nextUrl.searchParams.get('location'));
  if (!location) return NextResponse.json({ message: 'Vui lòng chọn khu vực thời tiết hợp lệ.' }, { status: 400 });
  const params = new URLSearchParams({
    latitude: String(location.latitude), longitude: String(location.longitude),
    current: 'temperature_2m,relative_humidity_2m,weather_code,is_day',
    daily: 'weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max',
    timezone: 'Asia/Bangkok', forecast_days: '2',
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 900 }, signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error('Weather provider unavailable');
    const weather = parseWeather(await response.json());
    return NextResponse.json({ location, ...weather, fetchedAt: new Date().toISOString(), source: 'Open-Meteo' });
  } catch {
    return NextResponse.json({ message: 'Chưa thể tải thời tiết. Vui lòng thử lại sau.' }, { status: 503 });
  }
}
