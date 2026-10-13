import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { formatDuration } from "../../utils/format";

const PROCESSING_STAGES = ["Transcribing...", "Generating Clinical Summary..."];
const MIME_CANDIDATES = ["audio/webm", "audio/mp4", "audio/wav"];
const CHUNK_INTERVAL_MS = 1000;

function getSupportedMimeType() {
  if (typeof window === "undefined" || !window.MediaRecorder) return null;
  return (
    MIME_CANDIDATES.find((type) => window.MediaRecorder.isTypeSupported(type)) || ""
  );
}

function baseMimeType(mimeType) {
  return (mimeType || "").split(";")[0].trim().toLowerCase();
}

function extensionForMime(mimeType) {
  const base = baseMimeType(mimeType);
  if (base.includes("mp4")) return "m4a";
  if (base.includes("wav")) return "wav";
  if (base.includes("ogg")) return "ogg";
  return "webm";
}

function LiveRecorder({ onProcessRecording, onNotify, loadingAction, progress }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const isUnmountingRef = useRef(false);

  const isProcessing = loadingAction === "record";
  const isUploading = isProcessing && progress < 100;
  const processingStage = isUploading
    ? "Uploading..."
    : PROCESSING_STAGES[Math.min(stageIndex, PROCESSING_STAGES.length - 1)];

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof window === "undefined" ||
      !window.MediaRecorder
    ) {
      setIsUnsupported(true);
    }
  }, []);

  useEffect(() => {
    if (!isRecording) return undefined;
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isRecording]);

  useEffect(() => {
    if (!isProcessing) {
      setStageIndex(0);
      return undefined;
    }
    const interval = window.setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, PROCESSING_STAGES.length - 1));
    }, 3500);
    return () => window.clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleMicError = (error) => {
    const name = error?.name || "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      onNotify("error", "Microphone permission denied. Allow microphone access to record.");
    } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      onNotify("error", "No microphone found. Connect a microphone and try again.");
    } else if (name === "NotReadableError" || name === "TrackStartError") {
      onNotify("error", "Microphone is in use by another application.");
    } else {
      onNotify("error", "Unable to access the microphone. Check your device settings.");
    }
  };

  const startRecording = async () => {
    if (isRecording || isProcessing) return;

    if (isUnsupported) {
      onNotify("error", "Live recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new window.MediaRecorder(stream, { mimeType })
        : new window.MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = handleRecordingStop;
      recorder.start(CHUNK_INTERVAL_MS);

      mediaRecorderRef.current = recorder;
      setSeconds(0);
      setIsRecording(true);
    } catch (error) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      handleMicError(error);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const handleRecordingStop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);

    const recorder = mediaRecorderRef.current;
    const mimeType = recorder?.mimeType || getSupportedMimeType() || "audio/webm";
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
    mediaRecorderRef.current = null;
    streamRef.current = null;

    if (isUnmountingRef.current) return;

    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (blob.size === 0) {
      setSeconds(0);
      onNotify("error", "Empty recording. Nothing was captured, please try again.");
      return;
    }

    const base = baseMimeType(blob.type) || baseMimeType(mimeType) || "audio/webm";
    const extension = extensionForMime(base);
    const file = new File([blob], `live-recording-${Date.now()}.${extension}`, {
      type: base,
    });

    setSeconds(0);
    onProcessRecording(file);
  };

  return (
    <section id="record" className="rounded-lg border border-clinic-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-clinic-coral">🎤 Live Recording</p>
          <h2 className="text-xl font-semibold">Record conversation</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinic-coral/10 text-clinic-coral">
          <Mic className="h-5 w-5" />
        </div>
      </div>

      <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-clinic-line bg-clinic-surface px-5 py-8 text-center">
        {isRecording ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clinic-coral opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-clinic-coral" />
              </span>
              <span className="text-sm font-semibold text-clinic-ink">Recording...</span>
            </div>
            <div className="font-mono text-4xl font-semibold tabular-nums text-clinic-ink">
              {formatDuration(seconds)}
            </div>
            <p className="mt-2 text-sm text-clinic-muted">Speak clearly into your microphone.</p>
          </>
        ) : isProcessing ? (
          <>
            <Loader2 className="mb-3 h-9 w-9 animate-spin text-clinic-teal" />
            <p className="text-sm font-semibold text-clinic-ink">{processingStage}</p>
            <p className="mt-2 text-sm text-clinic-muted">
              Your recording is being processed on the backend.
            </p>
          </>
        ) : (
          <>
            <Mic className="mb-3 h-9 w-9 text-clinic-coral" />
            <p className="text-sm font-semibold text-clinic-ink">Ready to record</p>
            <p className="mt-2 text-sm text-clinic-muted">
              {isUnsupported
                ? "Live recording is not supported in this browser. Use the upload method instead."
                : "Start recording to capture a live doctor-patient conversation."}
            </p>
          </>
        )}
      </div>

      {isProcessing && progress > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs font-medium text-clinic-muted">
            <span>Upload</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-clinic-line">
            <div className="h-2 rounded-full bg-clinic-teal transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="btn-primary justify-center"
          type="button"
          onClick={startRecording}
          disabled={isRecording || isProcessing || isUnsupported}
        >
          <Mic className="h-4 w-4" />
          Start Recording
        </button>
        <button
          className="btn-dark justify-center"
          type="button"
          onClick={stopRecording}
          disabled={!isRecording}
        >
          <Square className="h-4 w-4" />
          Stop Recording
        </button>
      </div>
    </section>
  );
}

export default LiveRecorder;

