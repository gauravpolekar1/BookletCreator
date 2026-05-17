import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

(pdfjsLib as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPreviewProps {
  file?: File | null;
  bytes?: Uint8Array | null;
  ariaLabel?: string;
}

export const PdfPreview = ({ file = null, bytes = null, ariaLabel = 'PDF first page preview' }: PdfPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if ((!file && !bytes) || !canvasRef.current) return;
      const data = bytes ?? new Uint8Array(await file!.arrayBuffer());
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
  }, [file, bytes]);

  return <canvas ref={canvasRef} className="w-full rounded-xl border border-slate-200 dark:border-slate-800" aria-label={ariaLabel} />;
};
