import { FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { formatBytes } from "../../utils/format";

function UploadPanel({
  file,
  fileInputRef,
  loadingAction,
  onDrop,
  onFileSelect,
  onReset,
  onTranscribe,
  onProcess,
  canTranscribe
}) {
  const isLoading = Boolean(loadingAction);

  return (
    <section className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-clinic-teal">Upload Audio</p>
          <h2 className="text-xl font-semibold">Conversation file</h2>
        </div>
        {file && (
          <button className="icon-button" type="button" onClick={onReset} aria-label="Clear audio file" disabled={isLoading}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <label
        className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-clinic-line bg-clinic-surface px-5 py-8 text-center transition hover:border-clinic-teal hover:bg-white"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="audio/*,video/mp4"
          onChange={(event) => onFileSelect(event.target.files?.[0])}
          disabled={isLoading}
        />
        <Upload className="mb-4 h-9 w-9 text-clinic-teal" />
        <span className="text-base font-semibold">{file ? file.name : "Drop audio here or browse"}</span>
        <span className="mt-2 text-sm text-clinic-muted">{file ? formatBytes(file.size) : "WAV, MP3, M4A, WEBM, OGG, FLAC, AAC, MP4"}</span>
      </label>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button className="btn-primary justify-center" type="button" onClick={onTranscribe} disabled={!canTranscribe}>
          {loadingAction === "transcribe" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Transcribe
        </button>
        <button className="btn-dark justify-center" type="button" onClick={onProcess} disabled={!file || isLoading}>
          {loadingAction === "process" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Process All
        </button>
      </div>
    </section>
  );
}

export default UploadPanel;
