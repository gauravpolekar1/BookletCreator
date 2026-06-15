import { useDropzone } from 'react-dropzone';

interface Props {
  onFiles: (files: File[]) => void;
}

export const MultiPdfUploader = ({ onFiles }: Props) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    accept: { 'application/pdf': ['.pdf'] },
    onDropAccepted: onFiles
  });

  return (
    <div
      {...getRootProps()}
      className="cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
    >
      <input {...getInputProps()} />
      <p className="text-sm text-slate-500">{isDragActive ? 'Drop PDFs here...' : 'Drag & drop PDFs, or click to browse'}</p>
    </div>
  );
};
