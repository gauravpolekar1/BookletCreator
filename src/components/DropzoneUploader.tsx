import { useDropzone } from 'react-dropzone';

interface Props {
  onFile: (file: File) => void;
}

export const DropzoneUploader = ({ onFile }: Props) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    onDropAccepted: (files) => onFile(files[0])
  });

  return (
    <div
      {...getRootProps()}
      className="cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-soft transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
    >
      <input {...getInputProps()} />
      <p className="text-sm text-slate-500">{isDragActive ? 'Drop PDF here...' : 'Drag & drop a PDF, or click to browse'}</p>
    </div>
  );
};
