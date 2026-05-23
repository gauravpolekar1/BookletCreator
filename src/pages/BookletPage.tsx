import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DropzoneUploader } from '../components/DropzoneUploader';
import { PdfPreview } from '../components/PdfPreview';
import { PreviewGrid } from '../components/PreviewGrid';
import { Shell } from '../components/Shell';
import { BookletSettings, ToolId } from '../types/booklet';
import { buildSheetSpreads } from '../utils/imposition';
import { getSlotsPerSheet } from '../utils/layout';
import { generateBookletPdf, loadPdf } from '../utils/pdf';

const defaults: BookletSettings = { paperSize: 'A4', bookletSize: 'A5', printMode: 'duplex', duplexFlip: 'short', margins: { inner: 8, outer: 8, top: 8, bottom: 8 }, gutter: 3, outputOrientation: 'portrait', signatures: 16, rtl: false, saddleStitch: true, coverMode: 'auto', cropMarks: false, bleedMarks: false, printMarks: false, foldGuides: true, cutGuides: false, stitchGuides: true, insertBlankAfterEvery: 0 };

export const BookletPage = () => {
  const [activeTool, setActiveTool] = useState<ToolId>('booklet');
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [settings, setSettings] = useState<BookletSettings>(defaults);
  const [outputPreview, setOutputPreview] = useState<Uint8Array | null>(null);
  const [currentSheet, setCurrentSheet] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const spreads = useMemo(() => buildSheetSpreads(pageCount, settings), [pageCount, settings]);
  const pagesPerSheet = getSlotsPerSheet(settings.bookletSize) * 2;

  useEffect(() => {
    if (!file) return;
    generateBookletPdf(file, settings).then(setOutputPreview);
  }, [file, settings]);

  const onFile = async (f: File) => {
    setFile(f);
    const pdf = await loadPdf(f);
    setPageCount(pdf.getPageCount());
  };

  const updateMargin = (key: keyof BookletSettings['margins'], value: number) => {
    setSettings((current) => ({ ...current, margins: { ...current.margins, [key]: Math.max(0, value) } }));
  };

  const downloadPdf = async () => {
    if (!file) return;
    setDownloading(true);
    try {
      const bytes = await generateBookletPdf(file, settings);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, '')}-booklet.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold md:text-4xl">Print PDFs Like Real Books</h2>
          <p className="mt-3 max-w-3xl text-blue-100">Create booklets, signatures, zines, folded layouts, and print-ready documents entirely in your browser.</p>
        </div>
      </section>
      <Shell active={activeTool} onSelect={setActiveTool}>
        <motion.div key={activeTool} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <DropzoneUploader onFile={onFile} />
                <div className="mt-4 text-xs text-slate-500">No uploads. Files stay on-device.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-2 font-semibold">Booklet Preview Studio</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <PdfPreview file={file} ariaLabel="input" compact />
                  <PdfPreview bytes={outputPreview} ariaLabel="output" showAllPages />
                </div>
                <div className="mt-3">
                  <PreviewGrid spreads={spreads} currentSheet={currentSheet} onSheetChange={setCurrentSheet} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-semibold">Output paper size</h4>
              <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={settings.paperSize} onChange={(e) => setSettings((s) => ({ ...s, paperSize: e.target.value as BookletSettings['paperSize'] }))}><option value="A4">A4</option><option value="A5">A5</option><option value="A6">A6</option><option value="Letter">Letter</option></select>
              <h4 className="mt-4 font-semibold">Output orientation</h4>
              <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={settings.outputOrientation} onChange={(e) => setSettings((s) => ({ ...s, outputOrientation: e.target.value as BookletSettings['outputOrientation'] }))}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
              <h4 className="mt-4 font-semibold">Pages per sheet</h4>
              <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={settings.bookletSize} onChange={(e) => setSettings((s) => ({ ...s, bookletSize: e.target.value as BookletSettings['bookletSize'] }))}><option value="A5">2 pages per sheet (A5)</option><option value="A6">4 pages per sheet (A6)</option></select>
              <h4 className="mt-4 font-semibold">Print mode</h4>
              <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={settings.printMode} onChange={(e) => setSettings((s) => ({ ...s, printMode: e.target.value as BookletSettings['printMode'] }))}><option value="duplex">Double-sided</option><option value="single">Single-sided</option></select>
              <h4 className="mt-4 font-semibold">Margins (mm)</h4>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="number" min={0} value={settings.margins.inner} onChange={(e) => updateMargin('inner', Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Inner" />
                <input type="number" min={0} value={settings.margins.outer} onChange={(e) => updateMargin('outer', Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Outer" />
                <input type="number" min={0} value={settings.margins.top} onChange={(e) => updateMargin('top', Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Top" />
                <input type="number" min={0} value={settings.margins.bottom} onChange={(e) => updateMargin('bottom', Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Bottom" />
              </div>
              <h4 className="mt-4 font-semibold">Gutter (mm)</h4>
              <input type="number" min={0} value={settings.gutter} onChange={(e) => setSettings((s) => ({ ...s, gutter: Math.max(0, Number(e.target.value)) }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" />
              
              <h4 className="mt-4 font-semibold">Insert blank pages in-between</h4>
              <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={settings.insertBlankAfterEvery} onChange={(e) => setSettings((v) => ({ ...v, insertBlankAfterEvery: Number(e.target.value) }))}>
                <option value={0}>No inserted blanks</option>
                <option value={1}>After every 1 page</option>
                <option value={2}>After every 2 pages</option>
                <option value={4}>After every 4 pages</option>
                <option value={8}>After every 8 pages</option>
              </select>

              <h4 className="mt-4 font-semibold">Guided production lines</h4>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.foldGuides} onChange={(e) => setSettings((s) => ({ ...s, foldGuides: e.target.checked }))} /> Fold lines</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.cutGuides} onChange={(e) => setSettings((s) => ({ ...s, cutGuides: e.target.checked }))} /> Cut lines (best for 4-up)</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.stitchGuides} onChange={(e) => setSettings((s) => ({ ...s, stitchGuides: e.target.checked }))} /> Stitch marks</label>
              </div>
              <p className="mt-4 text-xs text-slate-500">Pages: {pageCount} · {pagesPerSheet} pages/sheet · Duplex: {settings.duplexFlip}-edge.</p>
              <p className="mt-2 text-xs text-slate-500">For each sheet: print the Front side first, then print the Back side on the reverse of the same paper (not on page P2 itself).</p>
              <p className="mt-2 text-xs text-slate-500">4-up order is signature-ready: each sheet side contains 4 logical pages; cut, stack, fold, then stitch.</p>
              <button type="button" disabled={!file || downloading} onClick={downloadPdf} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{downloading ? 'Generating PDF…' : 'Generate PDF & Download'}</button>
            </div>
          </div>
        </motion.div>
      </Shell>
    </>
  );
};
