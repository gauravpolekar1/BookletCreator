import { SheetSpread } from '../types/booklet';

export const PreviewGrid = ({ spreads, currentSheet, onSheetChange }: { spreads: SheetSpread[]; currentSheet: number; onSheetChange: (sheet: number) => void }) => {
  if (!spreads.length) return <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">No sheets yet.</div>;

  const selected = spreads[Math.max(0, Math.min(spreads.length - 1, currentSheet - 1))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" className="rounded-lg border border-slate-300 px-2 py-1 text-xs" onClick={() => onSheetChange(Math.max(1, currentSheet - 1))}>Previous</button>
        <div className="text-xs font-medium">Sheet {selected.sheetIndex} / {spreads.length}</div>
        <button type="button" className="rounded-lg border border-slate-300 px-2 py-1 text-xs" onClick={() => onSheetChange(Math.min(spreads.length, currentSheet + 1))}>Next</button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 font-medium">Sheet {selected.sheetIndex}</div>
        <div>Front: {label(selected.front[0])} | {label(selected.front[1])}</div>
        <div>Back: {selected.back ? `${label(selected.back[0])} | ${label(selected.back[1])}` : 'N/A'}</div>
      </div>

      <div className="max-h-40 space-y-2 overflow-auto pr-1">
        {spreads.map((s) => (
          <button key={s.sheetIndex} type="button" onClick={() => onSheetChange(s.sheetIndex)} className={`w-full rounded-xl border p-2 text-left text-xs ${s.sheetIndex === selected.sheetIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
            Sheet {s.sheetIndex}: F {label(s.front[0])}/{label(s.front[1])}
          </button>
        ))}
      </div>
    </div>
  );
};

const label = (cell: { pageNumber: number | null; isBlank: boolean }): string => (cell.isBlank ? 'Blank' : `P${cell.pageNumber}`);
