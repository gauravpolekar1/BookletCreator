import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

(pdfjsLib as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = pdfWorker;

export const PdfPreview = ({ file }: { file: File | null }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!file || !canvasRef.current) return;
      const data = new Uint8Array(await file.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data }).promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 0.6 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      doc.destroy();
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [file]);

  return <canvas ref={canvasRef} className="w-full rounded-xl border border-slate-200 dark:border-slate-800" aria-label="PDF first page preview" />;
};
