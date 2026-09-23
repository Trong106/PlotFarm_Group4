'use client';

import { useEffect, useId, useState } from 'react';
import { Cloud, CloudRain, Droplets, Loader2, MapPin, Moon, Sun } from 'lucide-react';
import { inferWeatherLocation, WEATHER_LOCATIONS, weatherDescription, WeatherLocationId } from '@/lib/farm-weather';

interface Weather {
  location: { id: string; label: string };
  current: { time: string; temperature: number | null; humidity: number | null; weatherCode: number | null; isDay: boolean };
  daily: { date: string; weatherCode: number | null; min: number | null; max: number | null; rainProbability: number | null }[];
  fetchedAt: string;
}

const show = (value: number | null, unit: string) => value === null ? '—' : `${Math.round(value)}${unit}`;

export function FarmWeatherCard({ farmAddress, farmName }: { farmAddress?: string; farmName?: string }) {
  const id = useId();
  const inferred = inferWeatherLocation(farmAddress);
  const [override, setOverride] = useState<WeatherLocationId | ''>('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const location = override || inferred;

  useEffect(() => { setOverride(''); }, [farmAddress, farmName]);
  useEffect(() => {
    setWeather(null);
    setError(false);
    if (!location) { setLoading(false); return; }
    let disposed = false;
    const controller = new AbortController();
    let refreshTimer: ReturnType<typeof setTimeout>;
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/weather?location=${location}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Weather unavailable');
        const data: Weather = await response.json();
        if (!data.current || !data.location || !Array.isArray(data.daily)) throw new Error('Invalid weather');
        if (!disposed) { setWeather(data); setError(false); }
      } catch {
        if (!disposed) { setError(true); setWeather(null); }
      } finally {
        if (!disposed) { setLoading(false); refreshTimer = setTimeout(load, 15 * 60 * 1000); }
      }
    };
    void load();
    return () => { disposed = true; controller.abort(); clearTimeout(refreshTimer); };
  }, [location, retry]);

  const code = weather?.current.weatherCode;
  const Icon = code != null && code >= 51 ? CloudRain : code === 0 ? (weather?.current.isDay ? Sun : Moon) : Cloud;
  return <section aria-labelledby={`${id}-title`} className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={`${id}-title`} className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white"><Sun aria-hidden="true" className="h-4 w-4 shrink-0 text-amber-600" /> Thời tiết nông trại</h2>
        {farmName && <p className="mt-1 break-words text-xs text-slate-600 dark:text-slate-300">{farmName}</p>}
      </div>
      <div className="w-full min-w-0 sm:w-auto sm:max-w-[240px]">
        <label htmlFor={`${id}-location`} className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Khu vực dự báo</label>
        <select id={`${id}-location`} value={override} onChange={(event) => setOverride(event.target.value as WeatherLocationId | '')} className="w-full min-w-0 rounded-lg border border-emerald-200 bg-white px-2 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="">{inferred ? `Theo địa chỉ: ${WEATHER_LOCATIONS.find((item) => item.id === inferred)?.label}` : 'Chọn khu vực để xem'}</option>
          {WEATHER_LOCATIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>
    </div>
    {!location && <p role="status" className="mt-4 text-sm text-slate-600 dark:text-slate-300">Chưa xác định được vị trí nông trại. Chọn Củ Chi hoặc Đà Lạt để xem dự báo theo khu vực.</p>}
    {loading && !weather && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Đang tải thời tiết…</p>}
    {error && <div role="status" className="mt-4 text-sm text-slate-700 dark:text-slate-200">Chưa tải được dự báo thời tiết. <button type="button" disabled={loading} onClick={() => setRetry((value) => value + 1)} className="rounded px-1 py-2 font-bold text-emerald-700 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 dark:text-emerald-300">Thử lại</button></div>}
    {weather && <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-[1fr_1.2fr]">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{weather.location.label}{override ? ' · Khu vực bạn chọn' : ''}</p>
        <div className="mt-2 flex items-center gap-3"><Icon aria-hidden="true" className="h-9 w-9 shrink-0 text-amber-600 dark:text-amber-400" /><span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{show(weather.current.temperature, '°C')}</span></div>
        <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{weatherDescription(weather.current.weatherCode, weather.current.isDay)}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"><Droplets aria-hidden="true" className="h-3.5 w-3.5 text-sky-600" /> Độ ẩm không khí: {show(weather.current.humidity, '%')}</p>
      </div>
      <div className="min-w-0 space-y-2">
        {weather.daily.length === 0 && <p className="text-xs text-slate-600 dark:text-slate-300">Chưa có dự báo theo ngày.</p>}
        {weather.daily.map((day, index) => <div key={day.date} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/70">
          <div><p className="font-bold text-slate-800 dark:text-slate-100">{index === 0 ? 'Hôm nay' : 'Ngày mai'}</p><p className="mt-1 text-slate-600 dark:text-slate-300">{weatherDescription(day.weatherCode)}</p></div>
          <div className="text-right"><p className="font-bold text-slate-800 dark:text-slate-100">{show(day.min, '°')} – {show(day.max, '°C')}</p><p className="mt-1 text-sky-700 dark:text-sky-300">Khả năng mưa {show(day.rainProbability, '%')}</p></div>
        </div>)}
      </div>
    </div>}
    <footer className="mt-4 border-t border-emerald-200/70 pt-3 text-[11px] leading-relaxed text-slate-600 dark:border-emerald-900 dark:text-slate-400">
      {weather && <p>Cập nhật thời tiết: {new Date(weather.current.time).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })} (giờ Việt Nam).</p>}
      <p>Dự báo theo khu vực, không phải cảm biến tại ô đất. Nguồn: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline dark:text-emerald-300">Open-Meteo</a>.</p>
    </footer>
  </section>;
}
