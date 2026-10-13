import { ClipboardPlus, Loader2 } from "lucide-react";
import { summaryRows } from "../../constants/summary";

function ClinicalSummaryCard({ summary, loadingAction }) {
  return (
    <section className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-clinic-teal">Clinical Summary Card</p>
          <h2 className="text-xl font-semibold">Structured summary</h2>
        </div>
        {loadingAction === "summary" || loadingAction === "process" || loadingAction === "record" ? <Loader2 className="h-5 w-5 animate-spin text-clinic-teal" /> : null}
      </div>

      {summary ? (
        <div className="overflow-hidden rounded-lg border border-clinic-line">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              {summaryRows.map(([label, key]) => (
                <tr key={key} className="border-b border-clinic-line last:border-b-0">
                  <th className="w-40 bg-clinic-surface px-4 py-3 align-top font-semibold text-clinic-ink sm:w-56">{label}</th>
                  <td className="px-4 py-3 leading-6 text-clinic-muted">{summary[key] || "Not Mentioned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-clinic-line bg-clinic-surface p-6 text-center">
          <div>
            <ClipboardPlus className="mx-auto mb-3 h-9 w-9 text-clinic-teal" />
            <p className="font-semibold">No summary generated yet</p>
            <p className="mt-2 text-sm text-clinic-muted">Generate a summary after transcription or process the audio in one step.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default ClinicalSummaryCard;
