import { useEffect, useMemo, useState } from 'react';
import { DropzoneUploader } from '../components/DropzoneUploader';
import { PreviewGrid } from '../components/PreviewGrid';
import { PdfPreview } from '../components/PdfPreview';
import { BookletSettings } from '../types/booklet';
import { buildSheetSpreads } from '../utils/imposition';
import { getSlotsPerSheet } from '../utils/layout';
import { generateBookletPdf, loadPdf } from '../utils/pdf';

const defaults: BookletSettings = {
  paperSize: 'A4',
  bookletSize: 'A5',
  printMode: 'duplex',
  duplexFlip: 'short',
  margins: { inner: 8, outer: 8, top: 8, bottom: 8 },
  gutter: 3,
  signatures: 1,
  rtl: false
};

export const BookletPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [settings, setSettings] = useState<BookletSettings>(defaults);
  const [loading, setLoading] = useState(false);
  const [outputPreview, setOutputPreview] = useState<Uint8Array | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const spreads = useMemo(() => buildSheetSpreads(pageCount, settings), [pageCount, settings]);
  const slotsPerSheet = getSlotsPerSheet(settings.bookletSize);
  const pagesPerSheet = slotsPerSheet * 2;
  const sheets = Math.ceil(pageCount / pagesPerSheet);

  useEffect(() => {
    let cancelled = false;

    const regeneratePreview = async () => {
      if (!file) {
        setOutputPreview(null);
        return;
      }
      setPreviewLoading(true);
      try {
        const bytes = await generateBookletPdf(file, settings);
        if (!cancelled) {
          setOutputPreview(bytes);
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    };

    void regeneratePreview();

    return () => {
      cancelled = true;
    };
  }, [file, settings]);

  const onFile = async (f: File) => {
    setFile(f);
    const pdf = await loadPdf(f);
    setPageCount(pdf.getPageCount());
  };

  const create = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const bytes = await generateBookletPdf(file, settings);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.pdf$/i, '')}-booklet.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const updateMargin = (key: keyof BookletSettings['margins'], value: number) => {
    setSettings((s) => ({
      ...s,
      margins: {
        ...s.margins,
        [key]: Math.max(0, value)
      }
    }));
  };

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <DropzoneUploader onFile={onFile} />
          <div>
            <div className="mb-2 text-sm text-slate-500">Input preview</div>
            <PdfPreview file={file} ariaLabel="Input PDF first page preview" />
          </div>
          <div>
            <div className="mb-2 text-sm text-slate-500">Output preview {previewLoading ? '· Updating…' : ''}</div>
            <PdfPreview bytes={outputPreview} ariaLabel="Output PDF first page preview" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <label className="mb-2 block text-sm">Output paper size</label>
            <select className="w-full rounded-lg border p-2 bg-transparent" value={settings.paperSize} onChange={(e) => setSettings((s) => ({ ...s, paperSize: e.target.value as BookletSettings['paperSize'] }))}>
              <option>A4</option><option>Letter</option>
            </select>

            <label className="mb-2 mt-3 block text-sm">Pages per sheet</label>
            <select className="w-full rounded-lg border p-2 bg-transparent" value={settings.bookletSize} onChange={(e) => setSettings((s) => ({ ...s, bookletSize: e.target.value as BookletSettings['bookletSize'] }))}>
              <option value="A5">2 pages per sheet (A5)</option>
              <option value="A6">4 pages per sheet (A6)</option>
            </select>

            <label className="mb-2 mt-3 block text-sm">Print mode</label>
            <select className="w-full rounded-lg border p-2 bg-transparent" value={settings.printMode} onChange={(e) => setSettings((s) => ({ ...s, printMode: e.target.value as BookletSettings['printMode'] }))}>
              <option value="duplex">Double-sided</option><option value="single">Single-sided</option>
            </select>

            <label className="mb-2 mt-3 block text-sm">Margins (mm)</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} step={1} className="w-full rounded-lg border p-2 bg-transparent" value={settings.margins.inner} onChange={(e) => updateMargin('inner', Number(e.target.value))} placeholder="Inner" />
              <input type="number" min={0} step={1} className="w-full rounded-lg border p-2 bg-transparent" value={settings.margins.outer} onChange={(e) => updateMargin('outer', Number(e.target.value))} placeholder="Outer" />
              <input type="number" min={0} step={1} className="w-full rounded-lg border p-2 bg-transparent" value={settings.margins.top} onChange={(e) => updateMargin('top', Number(e.target.value))} placeholder="Top" />
              <input type="number" min={0} step={1} className="w-full rounded-lg border p-2 bg-transparent" value={settings.margins.bottom} onChange={(e) => updateMargin('bottom', Number(e.target.value))} placeholder="Bottom" />
            </div>

            <label className="mb-2 mt-3 block text-sm">Gutter (mm)</label>
            <input type="number" min={0} step={1} className="w-full rounded-lg border p-2 bg-transparent" value={settings.gutter} onChange={(e) => setSettings((s) => ({ ...s, gutter: Math.max(0, Number(e.target.value)) }))} />

            <button disabled={!file || loading} onClick={create} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900">
              {loading ? 'Generating…' : 'Generate booklet PDF'}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-sm text-slate-500">Input pages: {pageCount} · Pages per sheet: {pagesPerSheet} · Output sheets: {sheets}</div>
            <div className="mt-2 text-sm text-slate-500">Margins (mm): Inner {settings.margins.inner}, Outer {settings.margins.outer}, Top {settings.margins.top}, Bottom {settings.margins.bottom}</div>
            <div className="mt-2 text-sm">Print instructions: 1) Print {settings.printMode === 'duplex' ? 'double-sided' : 'single-sided'} 2) Flip on {settings.duplexFlip} edge 3) Fold in center</div>
            <div className="mt-2 text-sm text-slate-500">Pages are auto-resized and auto-rotated (portrait/landscape) for best fit.</div>
          </div>
          <PreviewGrid spreads={spreads} />
        </div>
      </div>
    </main>
  );
};
