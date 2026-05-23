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

const defaults: BookletSettings = { paperSize: 'A4', bookletSize: 'A5', printMode: 'duplex', duplexFlip: 'short', margins: { inner: 8, outer: 8, top: 8, bottom: 8 }, gutter: 3, outputOrientation: 'portrait', signatures: 16, rtl: false, saddleStitch: true, coverMode: 'auto', cropMarks: false, bleedMarks: false, printMarks: false };

export const BookletPage = () => {
  const [activeTool, setActiveTool] = useState<ToolId>('booklet');
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [settings] = useState<BookletSettings>(defaults);
  const [outputPreview, setOutputPreview] = useState<Uint8Array | null>(null);

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

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold md:text-4xl">Print PDFs Like Real Books</h2>
          <p className="mt-3 max-w-3xl text-blue-100">Create booklets, signatures, zines, folded layouts, and print-ready documents entirely in your browser.</p>
          <div className="mt-6 flex flex-wrap gap-3"><button className="rounded-xl bg-white px-4 py-2 font-semibold text-blue-700">Start Creating</button><button className="rounded-xl border border-white/50 px-4 py-2">View Demo</button><a className="rounded-xl border border-white/50 px-4 py-2" href="https://github.com" target="_blank">GitHub</a></div>
          <div className="mt-6 grid gap-3 text-sm md:grid-cols-4"><div>🔒 Privacy-first</div><div>💻 100% client-side</div><div>📴 Works offline</div><div>🖨️ Designed for printing</div></div>
        </div>
      </section>
      <Shell active={activeTool} onSelect={setActiveTool}>
        <motion.div key={activeTool} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <DropzoneUploader onFile={onFile} />
              <div className="mt-4 text-xs text-slate-500">No uploads. Files stay on-device.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold">Smart print validation</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-300">
                {pageCount % 4 !== 0 && <li>Page count is not divisible by 4.</li>}
                {settings.margins.inner < 6 && <li>Binding margin may be too small.</li>}
                {settings.outputOrientation === 'landscape' && <li>Landscape layout selected; verify duplex flip direction.</li>}
              </ul>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-2 font-semibold">{activeTool === 'booklet' ? 'Booklet Creator' : 'Print Workspace'}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <PdfPreview file={file} ariaLabel="input" compact />
                <PdfPreview bytes={outputPreview} ariaLabel="output" showAllPages />
              </div>
              <PreviewGrid spreads={spreads} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-semibold">Settings & Education</h4>
              <p className="mt-2 text-slate-500">Sheet 1 example: Front → [32][1] | Back → [2][31]</p>
              <p className="mt-2">Pages: {pageCount} · {pagesPerSheet} pages/sheet · Signature: {settings.signatures}</p>
              <p className="mt-2">Duplex assistant: choose <strong>{settings.duplexFlip}</strong>-edge flip to avoid upside-down backs.</p>
            </div>
          </div>
        </motion.div>
      </Shell>
    </>
  );
};
