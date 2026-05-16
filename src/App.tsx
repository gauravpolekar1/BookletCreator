import { BookletPage } from './pages/BookletPage';
import { useDarkMode } from './hooks/useDarkMode';

const App = () => {
  const [dark, toggleDark] = useDarkMode();

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4 md:px-8">
          <h1 className="text-lg font-semibold">PDF Booklet Creator</h1>
          <button onClick={toggleDark} className="rounded-lg border border-slate-300 px-3 py-1 text-sm dark:border-slate-700">{dark ? 'Light' : 'Dark'}</button>
        </div>
      </header>
      <BookletPage />
    </div>
  );
};

export default App;
