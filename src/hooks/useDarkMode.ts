import { useEffect, useState } from 'react';

export const useDarkMode = (): [boolean, () => void] => {
  const [dark, setDark] = useState<boolean>(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return [dark, () => setDark((d) => !d)];
};
