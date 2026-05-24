import { ToolId } from '../types/booklet';

const tools: { id: ToolId; label: string }[] = [
  { id: 'booklet', label: 'Booklet Creator' }
];

export const Shell = ({ active, onSelect, children }: { active: ToolId; onSelect: (tool: ToolId) => void; children: React.ReactNode }) => (
  <div className="mx-auto max-w-7xl p-4 md:p-8"> 
    <div className="mb-4 flex flex-wrap gap-2"> 
      {tools.map((tool) => (
        <button key={tool.id} onClick={() => onSelect(tool.id)} className={`rounded-xl px-3 py-2 text-sm transition ${active === tool.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}>
          {tool.label}
        </button>
      ))}
    </div>
    {children}
  </div>
);
