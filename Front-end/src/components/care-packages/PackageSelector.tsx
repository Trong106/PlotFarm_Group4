'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, HelpCircle, Minus, Package } from 'lucide-react';
import { getPackageName, getPackageTier, PACKAGE_TIERS, parsePackageServices, serviceKey } from '@/lib/care-packages';
import { ResponseTimeBadge } from './PackageBenefits';

interface CarePackageOption {
  PackageId: number;
  PackageName: string;
  MonthlyFee: number;
  ServicesIncluded: unknown;
}

function ComparisonTooltip({ packages }: { packages: CarePackageOption[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative shrink-0" onMouseEnter={() => setOpen(true)} onMouseLeave={() => {
      if (document.activeElement !== trigger.current) setOpen(false);
    }}>
      <button ref={trigger} type="button" onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)}
        aria-label="So sánh quyền lợi các gói" aria-describedby={open ? id : undefined}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-200">
        <HelpCircle aria-hidden="true" className="h-4 w-4" />
      </button>
      {open && (
        <div id={id} role="tooltip" className="absolute right-0 top-full z-30 w-60 max-w-[calc(100vw-5rem)] rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs leading-relaxed text-white shadow-xl">
          <p className="font-bold">So sánh quyền lợi</p>
          <p className="mt-1 text-slate-200">Dấu tick xanh: đã bao gồm. Cột xanh nhạt là gói bạn đang chọn.</p>
          <ul className="mt-2 space-y-2 border-t border-slate-700 pt-2">
            {packages.map((pkg) => {
              const tier = getPackageTier(pkg.PackageName);
              const benefits = parsePackageServices(pkg.ServicesIncluded);
              return <li key={pkg.PackageId} className="break-words">
                <strong>{getPackageName(pkg.PackageName)}:</strong>{' '}
                {benefits.available ? `${benefits.services.length} dịch vụ` : 'quyền lợi chưa đầy đủ'}
                {tier ? ` · phản hồi trong ${PACKAGE_TIERS[tier].responseHours}h.` : ' · chưa có thời gian phản hồi.'}
              </li>;
            })}
          </ul>
          <p className="mt-2 text-slate-200">Xem từng quyền lợi trong bảng bên dưới. Thời gian phản hồi là thời gian tiếp nhận và phản hồi yêu cầu.</p>
        </div>
      )}
    </div>
  );
}

export function PackageSelector<T extends CarePackageOption>({ packages, selectedPackage, onSelect, error }: {
  packages: T[];
  selectedPackage: T | null;
  onSelect: (pkg: T) => void;
  error?: string | null;
}) {
  const benefitSets = packages.map((pkg) => ({ pkg, ...parsePackageServices(pkg.ServicesIncluded) }));
  const services = new Map<string, string>();
  benefitSets.forEach((benefits) => benefits.services.forEach((service) => services.set(serviceKey(service), service)));

  return (
    <section aria-label="Gói dịch vụ chăm sóc" className="min-w-0 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
          <Package aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" /> Gói Dịch Vụ Chăm Sóc
        </h4>
        {packages.length > 0 && <ComparisonTooltip packages={packages} />}
      </div>
      {packages.length === 0 ? (
        <p role="status" className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {error || 'Hiện chưa có gói dịch vụ để lựa chọn. Vui lòng quay lại sau.'}
        </p>
      ) : (
        <>
          <div role="group" aria-label="Chọn gói chăm sóc" className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-3">
            {packages.map((pkg) => {
              const selected = selectedPackage?.PackageId === pkg.PackageId;
              return (
                <button key={pkg.PackageId} type="button" aria-pressed={selected} onClick={() => onSelect(pkg)}
                  className={`min-w-0 rounded-xl border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${selected
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 dark:bg-emerald-950/60'
                    : 'border-slate-200 bg-slate-50 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800/60'}`}>
                  <span className="flex items-start justify-between gap-1 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                    <span className="break-words">{getPackageName(pkg.PackageName)}</span>
                    {selected && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                  </span>
                  <span className="mt-1 block text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {pkg.MonthlyFee / 1000}k<span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">/tháng</span>
                  </span>
                </button>
              );
            })}
          </div>
          {selectedPackage && <div aria-live="polite" className="space-y-1.5">
            <p className="break-words text-xs text-slate-600 dark:text-slate-300">Đang chọn: <strong className="text-emerald-800 dark:text-emerald-200">{getPackageName(selectedPackage.PackageName)}</strong></p>
            <ResponseTimeBadge packageName={selectedPackage.PackageName} />
          </div>}
          <div tabIndex={0} role="region" aria-label="Bảng so sánh quyền lợi, cuộn ngang để xem các gói" className="max-w-full overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-slate-700">
            <table className="w-full min-w-[420px] border-collapse text-xs">
              <caption className="sr-only">Chi tiết dịch vụ đính kèm theo từng gói chăm sóc</caption>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th scope="col" className="w-[40%] bg-slate-50 p-3 text-left font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Dịch vụ đính kèm</th>
                  {packages.map((pkg) => <th key={pkg.PackageId} scope="col" className={`p-2 text-center font-bold ${selectedPackage?.PackageId === pkg.PackageId ? 'bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                    {getPackageName(pkg.PackageName)}
                    {selectedPackage?.PackageId === pkg.PackageId && <span className="mt-1 block text-[10px] font-semibold">Đang chọn</span>}
                  </th>)}
                </tr>
              </thead>
              <tbody>
                {Array.from(services).map(([key, label]) => <tr key={key} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                  <th scope="row" className="break-words p-3 text-left font-medium leading-relaxed text-slate-700 dark:text-slate-200">{label}</th>
                  {benefitSets.map(({ pkg, services: includedServices, available }) => {
                    const included = includedServices.some((service) => serviceKey(service) === key);
                    return <td key={pkg.PackageId} className={`p-2 text-center ${selectedPackage?.PackageId === pkg.PackageId ? 'bg-emerald-50/70 dark:bg-emerald-950/40' : ''}`}>
                      {included ? <><Check aria-hidden="true" className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" /><span className="sr-only">Đã bao gồm</span></> : available
                        ? <><Minus aria-hidden="true" className="mx-auto h-4 w-4 text-slate-400" /><span className="sr-only">Không bao gồm</span></>
                        : <span className="text-[10px] text-slate-500 dark:text-slate-400">Chưa rõ</span>}
                    </td>;
                  })}
                </tr>)}
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <th scope="row" className="p-3 text-left font-semibold text-slate-700 dark:text-slate-200">Cam kết phản hồi</th>
                  {packages.map((pkg) => {
                    const tier = getPackageTier(pkg.PackageName);
                    return <td key={pkg.PackageId} className={`p-2 text-center font-bold ${selectedPackage?.PackageId === pkg.PackageId ? 'bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-300'}`}>
                      {tier ? `${PACKAGE_TIERS[tier].responseHours}h` : 'Chưa rõ'}
                    </td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1"><Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" /> Đã bao gồm</span>
            <span className="inline-flex items-center gap-1"><Minus aria-hidden="true" className="h-3.5 w-3.5" /> Không bao gồm</span>
          </p>
          {benefitSets.some(({ available }) => !available) && <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">Một số quyền lợi chưa được cập nhật đầy đủ. Các ô “Chưa rõ” cần được nông trại xác nhận.</p>}
          {services.size === 0 && benefitSets.every(({ available }) => available) && <p className="text-xs text-slate-600 dark:text-slate-400">Chưa có dịch vụ đính kèm được công bố.</p>}
        </>
      )}
    </section>
  );
}
