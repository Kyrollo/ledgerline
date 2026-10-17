import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Trash2, Play, RefreshCw } from 'lucide-react';

interface UploadedFile {
  id: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  uploaded_at: string;
  processed: boolean;
  details?: Record<string, any>;
}

interface FileUploadZoneProps {
  title?: string;
  acceptedTypes?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  title = 'Invoice & Purchase Order Ingestion',
  acceptedTypes = '.pdf,.csv,.xlsx,.txt,.json',
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/v1/files');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch {
      // Backend offline or error
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const formData = new FormData();
        formData.append('file', selectedFiles[i]);

        const res = await fetch('/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Upload failed');
        }
      }
      setStatusMessage(`Successfully uploaded ${selectedFiles.length} file(s).`);
      await fetchFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const res = await fetch(`/api/v1/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch {
      // error handling
    }
  };

  const handleProcess = async (fileId: string) => {
    setProcessingId(fileId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/files/${fileId}/process`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Processing failed');
      }
      const data = await res.json();
      setStatusMessage(data.message || 'File processed successfully');
      await fetchFiles();
    } catch (err: any) {
      setErrorMessage(err.message || 'File processing failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400">
            Upload enterprise documents ({acceptedTypes}) for OCR extraction &amp; 3-way reconciliation
          </p>
        </div>
        <button
          onClick={fetchFiles}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          title="Refresh files"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40 group"
      >
        <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mx-auto mb-2 transition" />
        <p className="text-xs font-medium text-slate-300">
          Click or drag files here to upload
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Supported: {acceptedTypes}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="text-xs text-emerald-400 font-mono animate-pulse">
          Uploading and validating files...
        </div>
      )}

      {statusMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2 mt-4">
          <span className="text-xs font-semibold text-slate-400 block">
            Ingested AP Documents ({files.length})
          </span>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-mono text-slate-200 font-medium">{file.filename}</p>
                    <p className="text-[10px] text-slate-500">
                      {(file.size_bytes / 1024).toFixed(1)} KB • {new Date(file.uploaded_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleProcess(file.id)}
                    disabled={processingId === file.id}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono transition ${
                      file.processed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>{processingId === file.id ? 'Processing...' : file.processed ? 'Re-Parse' : 'Parse Document'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
