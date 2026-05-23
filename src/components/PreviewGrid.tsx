import { SheetSpread } from '../types/booklet';

export const PreviewGrid = ({ spreads, currentSheet, onSheetChange }: { spreads: SheetSpread[]; currentSheet: number; onSheetChange: (sheet: number) => void }) => {
  if (!spreads.length) return <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">No sheets yet.</div>;

  const selected = spreads[Math.max(0, Math.min(spreads.length - 1, currentSheet - 1))];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 font-medium">Sheet {selected.sheetIndex} (same physical paper)</div>
        <div>Front side: {label(selected.front[0])} | {label(selected.front[1])}</div>
        <div>Back side: {selected.back ? `${label(selected.back[0])} | ${label(selected.back[1])}` : 'N/A'}</div>
        <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          Duplex mapping: front-left ⇄ back-left and front-right ⇄ back-right after flipping the <strong>same sheet</strong>.
        </div>
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {spreads.map((s) => (
          <button key={s.sheetIndex} type="button" onClick={() => onSheetChange(s.sheetIndex)} className={`w-full rounded-xl border p-2 text-left text-xs ${s.sheetIndex === selected.sheetIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
            <div className="font-medium">Sheet {s.sheetIndex}</div>
            <div className="text-slate-500">Front {label(s.front[0])}/{label(s.front[1])} · Back {s.back ? `${label(s.back[0])}/${label(s.back[1])}` : 'N/A'}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const label = (cell: { pageNumber: number | null; isBlank: boolean }): string => (cell.isBlank ? 'Blank' : `P${cell.pageNumber}`);
