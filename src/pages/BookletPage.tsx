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

const defaults: BookletSettings = { paperSize: 'A4', bookletSize: 'A5', printMode: 'duplex', duplexFlip: 'short', margins: { inner: 8, outer: 8, top: 8, bottom: 8 }, gutter: 3, outputOrientation: 'portrait', signatures: 16, rtl: false, saddleStitch: true, coverMode: 'auto', cropMarks: false, bleedMarks: false, printMarks: false, foldGuides: true, cutGuides: false, stitchGuides: true, insertBlankAfterEvery: 0, insertBlankAfterPages: '' };

const workflow = ['Upload PDF', 'Pages Rearranged Automatically', 'Print Double-Sided', 'Fold Sheets', 'Finished Booklet'];
const features = [
  ['Booklet Creator', 'Convert PDFs into print-ready booklet imposition with proper spreads.'],
  ['N-Up Printing', 'Prepare 2-up and 4-up layouts for compact handouts and pocket guides.'],
  ['Signature Generator', 'Build print signatures that are ready to fold, stack, and stitch.'],
  ['Duplex Assistant', 'Understand long-edge vs short-edge duplex with orientation hints.'],
  ['Zine Creator', 'Turn PDFs into printable zines and foldable mini-booklets.'],
  ['Print Calibration', 'Tune margins, gutter, and orientation for your printer setup.'],
  ['Fold Guides', 'Enable fold, stitch, and cut guides to reduce printing errors.'],
  ['Manga RTL Layouts', 'Support right-to-left reading layouts for manga-style output.'],
  ['Print Preview Studio', 'Preview source and imposed pages side-by-side before printing.']
];

const faqs = [
  ['What is booklet printing?', 'Booklet printing rearranges pages so printed sheets can be folded into a readable book.'],
  ['How do I print a PDF as a booklet?', 'Upload your PDF, choose booklet options, export the imposed file, and print in duplex mode.'],
  ['What is duplex printing?', 'Duplex printing means printing both sides of the same sheet in the correct flip orientation.'],
  ['Can I create zines from PDFs?', 'Yes. Use 2-up or 4-up layouts and fold/cut guides to produce printable zines.'],
  ['Does the tool upload my files?', 'No. Processing runs locally in your browser and your PDFs stay on your device.'],
  ['Can I use it offline?', 'Yes, once loaded it works offline as a browser-based print layout studio.'],
  ['What are print signatures?', 'Signatures are grouped page sets designed to be folded and bound in sequence.'],
  ['How does booklet page arrangement work?', 'Pages are imposed as paired spreads such as [16,1] on front and [2,15] on back.']
];

export const BookletPage = () => {
  const [activeTool, setActiveTool] = useState<ToolId>('booklet');
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [settings, setSettings] = useState<BookletSettings>(defaults);
  const [outputPreview, setOutputPreview] = useState<Uint8Array | null>(null);
  const [currentSheet, setCurrentSheet] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const spreads = useMemo(() => buildSheetSpreads(pageCount, settings), [pageCount, settings]);
  const pagesPerSheet = getSlotsPerSheet(settings.bookletSize) * 2;

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
        if (!cancelled) setOutputPreview(bytes);
      } finally {
        if (!cancelled) setPreviewLoading(false);
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

  const updateMargin = (key: keyof BookletSettings['margins'], value: number) => setSettings((current) => ({ ...current, margins: { ...current.margins, [key]: Math.max(0, value) } }));

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
      <main className="mx-auto max-w-7xl space-y-12 px-4 pb-8 pt-8 md:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-8 text-white shadow-2xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Print PDFs Like Real Books</h1>
              <p className="mt-4 max-w-2xl text-base text-blue-100 md:text-lg">Create booklets, zines, signatures, and print-ready layouts directly in your browser. No uploads, no accounts, and no complicated print software.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#studio" className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-900">Create Booklet</a>
                <a href="#how-it-works" className="rounded-xl border border-white/40 px-5 py-3 font-semibold">See How It Works</a>
                <a href="https://github.com" className="rounded-xl border border-white/40 px-5 py-3 font-semibold">GitHub Repository</a>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto w-full max-w-md">
              <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
                <motion.div animate={{ rotateY: [0, 8, -8, 0] }} transition={{ duration: 6, repeat: Infinity }} className="mx-auto h-52 rounded-2xl border border-white/30 bg-gradient-to-b from-white to-slate-100 p-4 text-slate-900 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duplex spread</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center text-lg font-bold">
                    <div className="rounded-lg bg-white p-6 shadow">16</div><div className="rounded-lg bg-white p-6 shadow">1</div>
                    <div className="rounded-lg bg-white p-6 shadow">2</div><div className="rounded-lg bg-white p-6 shadow">15</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="how-it-works" className="space-y-4">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">How booklet imposition works</h2>
          <div className="grid gap-4 md:grid-cols-5">{workflow.map((step, i) => <motion.article whileHover={{ y: -4 }} key={step} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"><p className="text-xs text-slate-500">Step {i + 1}</p><h3 className="mt-2 font-semibold">{step}</h3></motion.article>)}</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h3 className="font-semibold">Real sheet example</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sheet Front: [16][1] · Sheet Back: [2][15]</p></div>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/70 dark:bg-emerald-950/30">
          <h2 className="text-3xl font-semibold text-emerald-900">Your PDFs Never Leave Your Device</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">{['100% browser processing', 'No uploads or account required', 'Works offline on GitHub Pages'].map((item) => <div key={item} className="rounded-xl bg-white p-4 text-sm text-emerald-900 shadow-sm dark:bg-slate-900 dark:text-emerald-200">🛡️ {item}</div>)}</div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Premium print workflow tools</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{features.map(([title, description]) => <motion.article whileHover={{ y: -5 }} key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800 dark:text-slate-100">📄 {title}</div><p className="text-sm text-slate-600 dark:text-slate-300">{description}</p></motion.article>)}</div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
          <div><h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Never Get Duplex Printing Wrong Again</h2><p className="mt-3 text-slate-600">Visual long-edge and short-edge guidance with troubleshooting hints for portrait and landscape printers.</p></div>
          <motion.div animate={{ rotate: [0, 1, -1, 0] }} transition={{ duration: 5, repeat: Infinity }} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">Long-edge flip: best for portrait booklets.<br />Short-edge flip: useful for calendar-style or landscape flips.</motion.div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Create Printable Zines from PDFs</h2>
          <p className="mt-2 text-slate-600">Turn any PDF into foldable mini-books and DIY zines directly in your browser. Great for a zine maker workflow, printable zines, foldable booklet design, DIY booklet printing, mini booklet creator projects, and print zine from PDF output.</p>
          <h3 className="mt-4 text-xl font-semibold">What Is a Zine?</h3>
          <p className="mt-2 text-slate-600">A zine is a small self-published booklet, often folded from a single sheet or short signature sets.</p>
        </section>

        <section>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Use cases</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{['Student Notes', 'Exam Booklets', 'Indie Comics', 'Tabletop RPG Manuals', 'Church Handouts', 'Pocket Guides', 'Manga Printing', 'DIY Publishing'].map((item) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">✦ {item}</div>)}</div>
        </section>

        <section className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Why BookletCreator</h2>
          <table className="mt-4 min-w-full text-left text-sm text-slate-700 dark:text-slate-200"><thead><tr className="border-b border-slate-200 dark:border-slate-800"><th className="py-2">Capability</th><th>BookletCreator</th><th>Generic PDF Tools</th></tr></thead><tbody>{['Browser-only processing', 'Booklet specialization', 'Duplex guidance', 'Fold visualizations', 'Offline support', 'Privacy-first workflow'].map((row) => <tr className="border-b border-slate-200 dark:border-slate-800" key={row}><td className="py-2">{row}</td><td>✓</td><td>Often missing</td></tr>)}</tbody></table>
        </section>

        <section>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">FAQ</h2>
          <div className="mt-4 space-y-3">{faqs.map(([q, a]) => <details key={q} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{a}</p></details>)}</div>
        </section>
      </main>

      <section id="studio" className="mx-auto max-w-7xl px-4 md:px-8">
      <Shell active={activeTool} onSelect={setActiveTool}>
        <motion.div key={activeTool} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <DropzoneUploader onFile={onFile} />
                <div className="mt-4 text-xs text-slate-500">No uploads. Files stay on-device.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-2 font-semibold">Booklet Preview Studio {previewLoading ? "· Updating…" : ""}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <PdfPreview file={file} ariaLabel="input" compact />
                  <PdfPreview bytes={outputPreview} ariaLabel="output" showAllPages layout="scroll" />
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
              <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={settings.outputOrientation} onChange={(e) => setSettings((s) => ({ ...s, outputOrientation: e.target.value as BookletSettings['outputOrientation'] }))}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select>
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


              <h4 className="mt-3 font-semibold">Insert blank after specific pages</h4>
              <input
                type="text"
                value={settings.insertBlankAfterPages}
                onChange={(e) => setSettings((v) => ({ ...v, insertBlankAfterPages: e.target.value }))}
                placeholder="Example: 2, 7, 11"
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
              />
              <p className="mt-1 text-xs text-slate-500">Adds one blank page immediately after each listed page number.</p>

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
      </section>
    </>
  );
};
