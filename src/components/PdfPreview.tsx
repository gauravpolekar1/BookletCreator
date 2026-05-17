import { useEffect, useMemo, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

(pdfjsLib as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = pdfWorker;

interface PdfPreviewProps {
  file?: File | null;
  bytes?: Uint8Array | null;
  ariaLabel?: string;
  showAllPages?: boolean;
  compact?: boolean;
}

export const PdfPreview = ({
  file = null,
  bytes = null,
  ariaLabel = 'PDF first page preview',
  showAllPages = false,
  compact = false
}: PdfPreviewProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const selectedImage = useMemo(() => (selectedPage !== null ? images[selectedPage - 1] : null), [images, selectedPage]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!file && !bytes) {
        setImages([]);
        return;
      }
      const data = bytes ?? new Uint8Array(await file!.arrayBuffer());
      const doc = await pdfjsLib.getDocument({ data }).promise;
      const totalPages = showAllPages ? doc.numPages : 1;
      const renderedImages: string[] = [];

      for (let i = 1; i <= totalPages; i += 1) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: showAllPages ? 0.45 : 0.6 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx || cancelled) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        renderedImages.push(canvas.toDataURL('image/png'));
      }

      if (!cancelled) {
        setImages(renderedImages);
        setSelectedPage((current) => {
          if (renderedImages.length === 0) return null;
          if (current === null || current > renderedImages.length) return 1;
          return current;
        });
      }
      doc.destroy();
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [file, bytes, showAllPages]);

  if (images.length === 0) {
    return <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">No preview available.</div>;
  }

  const thumbnailClasses = compact ? 'max-w-[120px]' : 'w-full';

  return (
    <>
      <div className={showAllPages ? 'grid grid-cols-2 gap-3 md:grid-cols-3' : 'flex'}>
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setSelectedPage(index + 1)}
            className={`group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 ${thumbnailClasses}`}
            aria-label={`${ariaLabel} page ${index + 1}`}
          >
            <img src={src} alt={`Preview page ${index + 1}`} className="h-auto w-full" />
          </button>
        ))}
      </div>

      {selectedImage && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPage(null)}
          aria-label="Close enlarged preview"
        >
          <img src={selectedImage} alt={`Enlarged preview page ${selectedPage}`} className="max-h-[90vh] max-w-[90vw] rounded-lg border border-white/20 bg-white" />
        </button>
      )}
    </>
  );
};
