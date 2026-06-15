import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DropzoneUploader } from '../components/DropzoneUploader';
import { MultiPdfUploader } from '../components/MultiPdfUploader';
import { PdfPreview } from '../components/PdfPreview';
import { PreviewGrid } from '../components/PreviewGrid';
import { Shell } from '../components/Shell';
import { BookletSettings, ToolId } from '../types/booklet';
import { buildSheetSpreads } from '../utils/imposition';
import { getSlotsPerSheet } from '../utils/layout';
import { generateBookletPdf, loadPdf } from '../utils/pdf';
import { ResizeOptions, SplitResult, downloadBytes, extractPages, mergePdfs, resizePdf, splitByRanges, splitEveryNPages } from '../utils/pdfTools';

const defaults: BookletSettings = { paperSize: 'A4', bookletSize: 'A5', printMode: 'duplex', duplexFlip: 'short', margins: { inner: 8, outer: 8, top: 8, bottom: 8 }, gutter: 3, outputOrientation: 'landscape', signatures: 16, rtl: false, saddleStitch: true, coverMode: 'auto', cropMarks: false, bleedMarks: false, printMarks: false, foldGuides: true, cutGuides: false, stitchGuides: true, insertBlankAfterEvery: 0, insertBlankAfterPages: '' };
const resizeDefaults: ResizeOptions = { size: 'A4', orientation: 'portrait', mode: 'preserve', customWidthMm: 210, customHeightMm: 297, marginMm: 0, centerHorizontal: true, centerVertical: true };

const workflow = ['Upload PDF', 'Pages Rearranged Automatically', 'Print Double-Sided', 'Fold Sheets', 'Finished Booklet'];
const tools = [
  ['Booklet Creator', 'Convert PDFs into print-ready booklet imposition with proper spreads.'],
  ['PDF Split', 'Split ranges, extract pages, or create fixed-size PDF chunks.'],
  ['PDF Merge', 'Combine multiple PDFs in a custom order without uploading files.'],
  ['PDF Resize', 'Resize pages to common paper sizes while preserving vector quality.']
];
const faqs = [
  ['Does the tool upload my files?', 'No. Processing runs locally in your browser and your PDFs stay on your device.'],
  ['Can I create zines from PDFs?', 'Yes. Use 2-up or 4-up layouts and fold/cut guides to produce printable zines.'],
  ['Can I split, merge, or resize PDFs?', 'Yes. The Tools section includes browser-only PDF Split, PDF Merge, and PDF Resize workflows.']
];

export const BookletPage = () => {
  const [activeTool, setActiveTool] = useState<ToolId>('booklet');
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [settings, setSettings] = useState<BookletSettings>(defaults);
  const [outputPreview, setOutputPreview] = useState<Uint8Array | null>(null);
  const [currentSheet, setCurrentSheet] = useState(1);
  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [splitMode, setSplitMode] = useState<'ranges' | 'every' | 'extract'>('ranges');
  const [splitRanges, setSplitRanges] = useState('1-10\n11-20');
  const [splitEvery, setSplitEvery] = useState(4);
  const [splitExtract, setSplitExtract] = useState('1,3,5,10');
  const [splitResults, setSplitResults] = useState<SplitResult[]>([]);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [mergePreview, setMergePreview] = useState<Uint8Array | null>(null);
  const [resizeOptions, setResizeOptions] = useState<ResizeOptions>(resizeDefaults);
  const [resizePreview, setResizePreview] = useState<Uint8Array | null>(null);

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
    return () => { cancelled = true; };
  }, [file, settings]);

  const onFile = async (f: File) => {
    setFile(f);
    setSplitResults([]);
    setResizePreview(null);
    const pdf = await loadPdf(f);
    setPageCount(pdf.getPageCount());
  };

  const updateMargin = (key: keyof BookletSettings['margins'], value: number) => setSettings((current) => ({ ...current, margins: { ...current.margins, [key]: Math.max(0, value) } }));

  const generateBooklet = async () => {
    if (!file) return;
    setBusy(true);
    try { downloadBytes(await generateBookletPdf(file, settings), `${file.name.replace(/\.pdf$/i, '')}-booklet.pdf`); } finally { setBusy(false); }
  };

  const runSplit = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const results = splitMode === 'ranges' ? await splitByRanges(file, splitRanges) : splitMode === 'every' ? await splitEveryNPages(file, splitEvery) : await extractPages(file, splitExtract);
      setSplitResults(results);
    } finally { setBusy(false); }
  };

  const runMerge = async () => {
    if (mergeFiles.length === 0) return;
    setBusy(true);
    try { setMergePreview(await mergePdfs(mergeFiles)); } finally { setBusy(false); }
  };

  const runResize = async () => {
    if (!file) return;
    setBusy(true);
    try { setResizePreview(await resizePdf(file, resizeOptions)); } finally { setBusy(false); }
  };

  const renderBooklet = () => (
    <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><DropzoneUploader onFile={onFile} /><div className="mt-4 text-xs text-slate-500">No uploads. Files stay on-device.</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-2 font-semibold">Booklet Preview Studio {previewLoading ? '· Updating…' : ''}</h3>
          <div className="grid gap-3 md:grid-cols-2"><PdfPreview file={file} ariaLabel="input" compact /><PdfPreview bytes={outputPreview} ariaLabel="output" showAllPages layout="scroll" /></div>
          <div className="mt-3"><PreviewGrid spreads={spreads} currentSheet={currentSheet} onSheetChange={setCurrentSheet} /></div>
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
        <div className="mt-2 grid grid-cols-2 gap-2">{(['inner', 'outer', 'top', 'bottom'] as const).map((key) => <input key={key} type="number" min={0} value={settings.margins[key]} onChange={(e) => updateMargin(key, Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white p-2 capitalize dark:border-slate-700 dark:bg-slate-950" placeholder={key} />)}</div>
        <h4 className="mt-4 font-semibold">Gutter (mm)</h4><input type="number" min={0} value={settings.gutter} onChange={(e) => setSettings((s) => ({ ...s, gutter: Math.max(0, Number(e.target.value)) }))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" />
        <h4 className="mt-4 font-semibold">Insert blank pages in-between</h4><select className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" value={settings.insertBlankAfterEvery} onChange={(e) => setSettings((v) => ({ ...v, insertBlankAfterEvery: Number(e.target.value) }))}><option value={0}>No inserted blanks</option><option value={1}>After every 1 page</option><option value={2}>After every 2 pages</option><option value={4}>After every 4 pages</option><option value={8}>After every 8 pages</option></select>
        <h4 className="mt-3 font-semibold">Insert blank after specific pages</h4><input type="text" value={settings.insertBlankAfterPages} onChange={(e) => setSettings((v) => ({ ...v, insertBlankAfterPages: e.target.value }))} placeholder="Example: 2, 7, 11" className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950" />
        <h4 className="mt-4 font-semibold">Guided production lines</h4><div className="mt-2 space-y-2"><label className="flex items-center gap-2"><input type="checkbox" checked={settings.foldGuides} onChange={(e) => setSettings((s) => ({ ...s, foldGuides: e.target.checked }))} /> Fold lines</label><label className="flex items-center gap-2"><input type="checkbox" checked={settings.cutGuides} onChange={(e) => setSettings((s) => ({ ...s, cutGuides: e.target.checked }))} /> Cut lines</label><label className="flex items-center gap-2"><input type="checkbox" checked={settings.stitchGuides} onChange={(e) => setSettings((s) => ({ ...s, stitchGuides: e.target.checked }))} /> Stitch marks</label></div>
        <p className="mt-4 text-xs text-slate-500">Pages: {pageCount} · {pagesPerSheet} pages/sheet · Duplex: {settings.duplexFlip}-edge.</p>
        <button type="button" disabled={!file || busy} onClick={generateBooklet} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Generating PDF…' : 'Generate PDF & Download'}</button>
      </div>
    </div>
  );

  const panel = 'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
  const input = 'mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-700 dark:bg-slate-950';

  const renderSplit = () => (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]"><div className="space-y-4"><div className={panel}><DropzoneUploader onFile={onFile} /></div><div className={panel}><h3 className="font-semibold">Split results</h3><div className="mt-3 space-y-2">{splitResults.length === 0 ? <p className="text-sm text-slate-500">Generate splits to download individual PDFs.</p> : splitResults.map((result) => <button key={result.name} type="button" onClick={() => downloadBytes(result.bytes, result.name)} className="block w-full rounded-xl border border-slate-200 p-3 text-left text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">Download {result.name} <span className="text-slate-500">({result.pages.join(', ')})</span></button>)}</div></div></div><div className={panel}><h3 className="font-semibold">PDF Split</h3><select className={input} value={splitMode} onChange={(e) => setSplitMode(e.target.value as typeof splitMode)}><option value="ranges">Split by page ranges</option><option value="every">Split every N pages</option><option value="extract">Extract specific pages</option></select>{splitMode === 'ranges' && <textarea rows={5} className={input} value={splitRanges} onChange={(e) => setSplitRanges(e.target.value)} placeholder="1-10&#10;11-20" />}{splitMode === 'every' && <input type="number" min={1} className={input} value={splitEvery} onChange={(e) => setSplitEvery(Number(e.target.value))} />}{splitMode === 'extract' && <input className={input} value={splitExtract} onChange={(e) => setSplitExtract(e.target.value)} placeholder="1,3,5,10-15" />}<button type="button" disabled={!file || busy} onClick={runSplit} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Splitting…' : 'Generate Split PDFs'}</button></div></div>
  );

  const renderMerge = () => (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]"><div className="space-y-4"><div className={panel}><MultiPdfUploader onFiles={(files) => setMergeFiles((current) => [...current, ...files])} /></div><div className={panel}><h3 className="font-semibold">Merge order</h3><div className="mt-3 space-y-2">{mergeFiles.map((f, i) => <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-800"><span className="flex-1 truncate">{i + 1}. {f.name}</span><button type="button" onClick={() => setMergeFiles((items) => { const copy = [...items]; [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]]; return copy; })} disabled={i === 0}>↑</button><button type="button" onClick={() => setMergeFiles((items) => { const copy = [...items]; [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]]; return copy; })} disabled={i === mergeFiles.length - 1}>↓</button><button type="button" onClick={() => setMergeFiles((items) => items.filter((_, index) => index !== i))}>Remove</button></div>)}</div></div></div><div className={panel}><h3 className="font-semibold">PDF Merge</h3><p className="mt-2 text-sm text-slate-500">Upload multiple PDFs, reorder them, then generate one combined file.</p><button type="button" disabled={mergeFiles.length === 0 || busy} onClick={runMerge} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Merging…' : 'Merge PDFs'}</button>{mergePreview && <><button type="button" onClick={() => downloadBytes(mergePreview, 'merged.pdf')} className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold">Download merged PDF</button><div className="mt-4"><PdfPreview bytes={mergePreview} showAllPages layout="scroll" ariaLabel="merged" /></div></>}</div></div>
  );

  const renderResize = () => (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]"><div className="space-y-4"><div className={panel}><DropzoneUploader onFile={onFile} /></div><div className={panel}><h3 className="font-semibold">Resize preview</h3><div className="mt-3 grid gap-3 md:grid-cols-2"><PdfPreview file={file} ariaLabel="resize source" compact /><PdfPreview bytes={resizePreview} ariaLabel="resized" showAllPages layout="scroll" /></div></div></div><div className={panel}><h3 className="font-semibold">PDF Resize</h3><select className={input} value={resizeOptions.size} onChange={(e) => setResizeOptions((o) => ({ ...o, size: e.target.value as ResizeOptions['size'] }))}>{['A5', 'A4', 'A3', 'Letter', 'Legal', 'Tabloid', 'Custom'].map((s) => <option key={s} value={s}>{s}</option>)}</select>{resizeOptions.size === 'Custom' && <div className="grid grid-cols-2 gap-2"><input type="number" className={input} value={resizeOptions.customWidthMm} onChange={(e) => setResizeOptions((o) => ({ ...o, customWidthMm: Number(e.target.value) }))} /><input type="number" className={input} value={resizeOptions.customHeightMm} onChange={(e) => setResizeOptions((o) => ({ ...o, customHeightMm: Number(e.target.value) }))} /></div>}<select className={input} value={resizeOptions.orientation} onChange={(e) => setResizeOptions((o) => ({ ...o, orientation: e.target.value as ResizeOptions['orientation'] }))}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select><select className={input} value={resizeOptions.mode} onChange={(e) => setResizeOptions((o) => ({ ...o, mode: e.target.value as ResizeOptions['mode'] }))}><option value="preserve">Preserve aspect ratio</option><option value="stretch">Stretch to fit</option><option value="fitWidth">Fit width</option><option value="fitHeight">Fit height</option></select><label className="mt-3 block text-sm">Margin (mm)<input type="number" min={0} className={input} value={resizeOptions.marginMm} onChange={(e) => setResizeOptions((o) => ({ ...o, marginMm: Number(e.target.value) }))} /></label><label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={resizeOptions.centerHorizontal} onChange={(e) => setResizeOptions((o) => ({ ...o, centerHorizontal: e.target.checked }))} /> Center horizontally</label><label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={resizeOptions.centerVertical} onChange={(e) => setResizeOptions((o) => ({ ...o, centerVertical: e.target.checked }))} /> Center vertically</label><button type="button" disabled={!file || busy} onClick={runResize} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Resizing…' : 'Resize PDF'}</button>{resizePreview && <button type="button" onClick={() => downloadBytes(resizePreview, `${file?.name.replace(/\.pdf$/i, '')}-resized.pdf`)} className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 font-semibold">Download resized PDF</button>}</div></div>
  );

  return (
    <>
      <main className="mx-auto max-w-7xl space-y-12 px-4 pb-8 pt-8 md:px-8">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-8 text-white shadow-2xl"><div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center"><div><h1 className="text-4xl font-bold tracking-tight md:text-6xl">Print PDFs Like Real Books</h1><p className="mt-4 max-w-2xl text-base text-blue-100 md:text-lg">Create booklets, split, merge, resize, and export print-ready PDFs directly in your browser. No uploads, accounts, or server processing.</p><div className="mt-6 flex flex-wrap gap-3"><a href="#studio" className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-900">Open Tools</a><a href="#how-it-works" className="rounded-xl border border-white/40 px-5 py-3 font-semibold">See How It Works</a></div></div><motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto w-full max-w-md"><div className="rounded-3xl bg-white/10 p-6 backdrop-blur"><motion.div animate={{ rotateY: [0, 8, -8, 0] }} transition={{ duration: 6, repeat: Infinity }} className="mx-auto h-52 rounded-2xl border border-white/30 bg-gradient-to-b from-white to-slate-100 p-4 text-slate-900 shadow-xl"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDF tool studio</p><div className="mt-4 grid grid-cols-2 gap-3 text-center text-lg font-bold"><div className="rounded-lg bg-white p-6 shadow">16</div><div className="rounded-lg bg-white p-6 shadow">1</div><div className="rounded-lg bg-white p-6 shadow">2</div><div className="rounded-lg bg-white p-6 shadow">15</div></div></motion.div></div></motion.div></div></section>
        <section id="how-it-works" className="space-y-4"><h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">How booklet imposition works</h2><div className="grid gap-4 md:grid-cols-5">{workflow.map((step, i) => <motion.article whileHover={{ y: -4 }} key={step} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"><p className="text-xs text-slate-500">Step {i + 1}</p><h3 className="mt-2 font-semibold">{step}</h3></motion.article>)}</div></section>
        <section><h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Tools</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{tools.map(([title, description]) => <motion.article whileHover={{ y: -5 }} key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800 dark:text-slate-100">📄 {title}</div><p className="text-sm text-slate-600 dark:text-slate-300">{description}</p></motion.article>)}</div></section>
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/70 dark:bg-emerald-950/30"><h2 className="text-3xl font-semibold text-emerald-900 dark:text-emerald-100">Your PDFs Never Leave Your Device</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{['100% browser processing', 'No uploads or account required', 'Original PDFs remain unchanged'].map((item) => <div key={item} className="rounded-xl bg-white p-4 text-sm text-emerald-900 shadow-sm dark:bg-slate-900 dark:text-emerald-200">🛡️ {item}</div>)}</div></section>
        <section><h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">FAQ</h2><div className="mt-4 space-y-3">{faqs.map(([q, a]) => <details key={q} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{a}</p></details>)}</div></section>
      </main>
      <section id="studio" className="mx-auto max-w-7xl px-4 md:px-8"><Shell active={activeTool} onSelect={setActiveTool}><motion.div key={activeTool} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">{activeTool === 'booklet' && renderBooklet()}{activeTool === 'split' && renderSplit()}{activeTool === 'merge' && renderMerge()}{activeTool === 'resize' && renderResize()}</motion.div></Shell></section>
    </>
  );
};
