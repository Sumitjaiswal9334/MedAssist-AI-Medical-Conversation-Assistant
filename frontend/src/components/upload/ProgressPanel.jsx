import { CheckCircle2, Loader2 } from "lucide-react";
import { pipelineSteps } from "../../constants/pipeline";

function ProgressPanel({ currentStep, loadingAction, progress }) {
  return (
    <section className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Progress</h2>
        {loadingAction && <Loader2 className="h-5 w-5 animate-spin text-clinic-teal" />}
      </div>
      {progress > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex justify-between text-xs font-medium text-clinic-muted">
            <span>Upload</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-clinic-line">
            <div className="h-2 rounded-full bg-clinic-teal transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {pipelineSteps.map((step, index) => {
          const number = index + 1;
          const done = currentStep >= number;
          return (
            <div key={step} className="flex items-center gap-3">
              <div className={`step-dot ${done ? "step-dot-active" : ""}`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : number}
              </div>
              <span className={done ? "text-sm font-medium text-clinic-ink" : "text-sm text-clinic-muted"}>{step}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ProgressPanel;
