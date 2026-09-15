'use client';

import { Check, Clock, Package } from 'lucide-react';
import { getPackageName, getPackageTier, PACKAGE_TIERS, parsePackageServices, serviceKey } from '@/lib/care-packages';

export function ResponseTimeBadge({ packageName }: { packageName: unknown }) {
  const tier = getPackageTier(packageName);
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
      tier === 'vip'
        ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
        : tier
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }`}>
      <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      {tier ? `Cam kết phản hồi trong ${PACKAGE_TIERS[tier].responseHours}h` : 'Chưa có cam kết thời gian phản hồi'}
    </span>
  );
}

export function PackageBenefits({ packageName, servicesIncluded }: { packageName: unknown; servicesIncluded: unknown }) {
  const { services, available } = parsePackageServices(servicesIncluded);
  return (
    <section aria-label="Gói dịch vụ đang sử dụng" className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Package aria-hidden="true" className="h-4 w-4 text-emerald-600" /> Gói dịch vụ đang sử dụng
          </p>
          <h3 className="mt-1 break-words text-base font-extrabold text-slate-900 dark:text-white">{getPackageName(packageName)}</h3>
        </div>
        <ResponseTimeBadge packageName={packageName} />
      </div>
      <p className="mb-2 mt-4 text-xs font-bold text-slate-700 dark:text-slate-200">Quyền lợi đi kèm ô đất</p>
      {services.length > 0 && (
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {services.map((service) => (
            <li key={serviceKey(service)} className="flex min-w-0 items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
              <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="min-w-0 break-words">{service}</span>
            </li>
          ))}
        </ul>
      )}
      {(!available || services.length === 0) && (
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {available ? 'Gói này chưa có dịch vụ đính kèm được công bố.' : 'Chi tiết quyền lợi chưa được cập nhật đầy đủ. Vui lòng liên hệ nông trại để xác nhận.'}
        </p>
      )}
    </section>
  );
}
