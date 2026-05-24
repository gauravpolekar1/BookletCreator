import { BookletPage } from './pages/BookletPage';
import { useDarkMode } from './hooks/useDarkMode';

const App = () => {
  const [dark, toggleDark] = useDarkMode();

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4 md:px-8">
          <div>
            <div className="text-lg font-semibold md:text-xl">Printing & Booklet Specialist</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Browser-only print studio · Open source friendly · Offline-ready</p>
          </div>
          <button onClick={toggleDark} className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{dark ? 'Light' : 'Dark'}</button>
        </div>
      </header>
      <BookletPage />
      <footer className="mt-12 border-t border-slate-200 px-4 py-8 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 md:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div>Runs entirely in your browser · Privacy-first print layout studio</div><div className="flex gap-4"><a href="https://github.com" className="hover:underline">GitHub</a><a href="#" className="hover:underline">Sponsor</a><a href="#" className="hover:underline">Roadmap</a><a href="#" className="hover:underline">Changelog</a></div></div></footer>
    </div>
  );
};

export default App;
