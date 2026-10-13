import { AlertCircle, CheckCircle2, X } from "lucide-react";

function Toast({ toast, onClose }) {
  const isSuccess = toast.type === "success";

  return (
    <div className="fixed right-4 top-20 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-lg border border-clinic-line bg-white p-4 shadow-soft">
      <div className="flex gap-3">
        {isSuccess ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-clinic-teal" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-clinic-coral" />}
        <div className="flex-1">
          <p className="text-sm font-semibold">{isSuccess ? "Success" : "Error"}</p>
          <p className="mt-1 text-sm text-clinic-muted">{toast.message}</p>
        </div>
        <button className="icon-button h-8 w-8" type="button" onClick={onClose} aria-label="Dismiss notification">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
