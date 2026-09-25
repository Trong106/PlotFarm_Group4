export type CarePriority = 'NORMAL' | 'ATTENTION' | 'URGENT';

export const carePriorities: { value: CarePriority; label: string; hint: string; color: string }[] = [
  { value: 'NORMAL', label: 'Bình thường', hint: 'Chăm sóc định kỳ, không có dấu hiệu bất thường.', color: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800' },
  { value: 'ATTENTION', label: 'Cần lưu ý', hint: 'Cây phát triển chậm hoặc cần kiểm tra thêm.', color: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800' },
  { value: 'URGENT', label: 'Khẩn cấp', hint: 'Phát hiện sâu bệnh, cây héo lá bất thường.', color: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800' },
];

export function resolveCarePriority(priority?: string, legacyNote = ''): CarePriority {
  if (priority === 'NORMAL' || priority === 'ATTENTION' || priority === 'URGENT') return priority;
  if (/\[(KHẨN CẤP|URGENT)\]/i.test(legacyNote)) return 'URGENT';
  return /\[(CẦN LƯU Ý|ATTENTION)\]/i.test(legacyNote) ? 'ATTENTION' : 'NORMAL';
}

export function PriorityBadge({ priority, note }: { priority?: string; note?: string }) {
  const option = carePriorities.find(item => item.value === resolveCarePriority(priority, note))!;
  return <span className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold ${option.color}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{option.label}</span>;
}

export function CarePrioritySelector({ value, onChange }: { value: CarePriority; onChange: (value: CarePriority) => void }) {
  return <fieldset className="space-y-2">
    <legend className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">2. Mức độ ưu tiên xử lý</legend>
    <div className="grid gap-2 sm:grid-cols-3">
      {carePriorities.map(option => <label key={option.value} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 ${value === option.value ? option.color : 'border-slate-200 dark:border-slate-700'} focus-within:ring-2 focus-within:ring-emerald-500`}>
        <input type="radio" name="care-priority" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="mt-1 shrink-0 accent-emerald-600" />
        <span className="min-w-0 space-y-2"><PriorityBadge priority={option.value} /><span className="block text-xs leading-relaxed text-slate-600 dark:text-slate-300">{option.hint}</span></span>
      </label>)}
    </div>
  </fieldset>;
}
