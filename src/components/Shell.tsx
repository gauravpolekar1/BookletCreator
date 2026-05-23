import { motion } from 'framer-motion';
import { ToolId } from '../types/booklet';

const tools: { id: ToolId; label: string }[] = [
  { id: 'booklet', label: 'Booklet Creator' },
  { id: 'nup', label: 'N-Up Printing' },
  { id: 'signatures', label: 'Signature Generator' },
  { id: 'zine', label: 'Zine Creator' },
  { id: 'preview', label: 'Print Preview Studio' },
  { id: 'duplex', label: 'Duplex Assistant' },
  { id: 'arrange', label: 'Page Arrangement' },
  { id: 'calibration', label: 'Calibration' }
];

export const Shell = ({ active, onSelect, children }: { active: ToolId; onSelect: (tool: ToolId) => void; children: React.ReactNode }) => (
  <div className="mx-auto grid max-w-7xl gap-6 p-4 md:grid-cols-[250px_1fr] md:p-8">
    <aside className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <p className="px-3 text-xs uppercase tracking-wide text-slate-500">Print modules</p>
      <nav className="mt-2 space-y-1">
        {tools.map((tool) => (
          <button key={tool.id} onClick={() => onSelect(tool.id)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${active === tool.id ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
            {tool.label}
          </button>
        ))}
      </nav>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
        ✅ Files never leave your browser
      </motion.div>
    </aside>
    <section>{children}</section>
  </div>
);
