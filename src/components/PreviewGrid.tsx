import { SheetSpread } from '../types/booklet';

export const PreviewGrid = ({ spreads }: { spreads: SheetSpread[] }) => (
  <div className="space-y-3">
    {spreads.map((s) => (
      <div key={s.sheetIndex} className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 font-medium">Sheet {s.sheetIndex}</div>
        <div>Front: {label(s.front[0])} | {label(s.front[1])}</div>
        <div>Back: {s.back ? `${label(s.back[0])} | ${label(s.back[1])}` : 'N/A'}</div>
      </div>
    ))}
  </div>
);

const label = (cell: { pageNumber: number | null; isBlank: boolean }): string => (cell.isBlank ? 'Blank' : `P${cell.pageNumber}`);
