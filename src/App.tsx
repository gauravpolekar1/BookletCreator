import { BookletPage } from './pages/BookletPage';
import { useDarkMode } from './hooks/useDarkMode';

const App = () => {
  const [dark, toggleDark] = useDarkMode();

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4 md:px-8">
          <div>
            <h1 className="text-lg font-semibold md:text-xl">PDF Booklet Creator</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Turn any PDF into print-ready booklet pages in seconds.</p>
          </div>
          <button onClick={toggleDark} className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">{dark ? 'Light' : 'Dark'}</button>
        </div>
      </header>
      <BookletPage />
    </div>
  );
};

export default App;
