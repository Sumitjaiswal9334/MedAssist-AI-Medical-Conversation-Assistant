import { ClipboardPlus, Loader2 } from "lucide-react";

function TranscriptCard({ transcript, loadingAction, onChange, onGenerateSummary, canSummarize }) {
  return (
    <section className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clinic-teal">Transcript Card</p>
          <h2 className="text-xl font-semibold">Conversation transcript</h2>
        </div>
        <button className="btn-primary justify-center" type="button" onClick={onGenerateSummary} disabled={!canSummarize}>
          {loadingAction === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPlus className="h-4 w-4" />}
          Generate Summary
        </button>
      </div>
      <textarea
        className="min-h-64 w-full resize-y rounded-lg border border-clinic-line bg-clinic-surface p-4 text-sm leading-6 outline-none transition focus:border-clinic-teal focus:bg-white focus:ring-4 focus:ring-clinic-mint"
        value={transcript}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Transcript will appear here after transcription. You can also paste a transcript and generate a clinical summary."
        disabled={loadingAction === "transcribe" || loadingAction === "process" || loadingAction === "record"}
      />
    </section>
  );
}

export default TranscriptCard;
