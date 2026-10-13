import { useEffect, useMemo, useRef, useState } from "react";
import { generateSummary, processAudio, transcribeAudio } from "../services/api";
import { getErrorMessage } from "../utils/errors";

export function useMedicalAssistant() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState(null);
  const [loadingAction, setLoadingAction] = useState("");
  const [toast, setToast] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const canTranscribe = Boolean(file) && !loadingAction;
  const canSummarize = Boolean(transcript.trim()) && !loadingAction;

  const currentStep = useMemo(() => {
    if (loadingAction === "process" || loadingAction === "record") return 4;
    if (loadingAction === "transcribe") return 3;
    if (loadingAction === "summary") return 4;
    if (summary) return 5;
    if (transcript) return 3;
    if (file) return 1;
    return 0;
  }, [file, loadingAction, summary, transcript]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const dismissToast = () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  const showToast = (type, message) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  };

  const updateProgress = (event) => {
    if (!event.total) return;
    setProgress(Math.round((event.loaded * 100) / event.total));
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setTranscript("");
    setSummary(null);
    setProgress(0);
    showToast("success", "Audio file ready for processing.");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const runTranscription = async () => {
    if (!file) {
      showToast("error", "Please upload an audio file first.");
      return;
    }

    setLoadingAction("transcribe");
    setProgress(0);
    setSummary(null);

    try {
      const data = await transcribeAudio(file, updateProgress);
      setTranscript(data.transcript);
      showToast("success", "Transcript generated.");
    } catch (error) {
      showToast("error", getErrorMessage(error));
    } finally {
      setLoadingAction("");
      setProgress(0);
    }
  };

  const runSummary = async () => {
    if (!transcript.trim()) {
      showToast("error", "Transcript is required before generating a summary.");
      return;
    }

    setLoadingAction("summary");

    try {
      const data = await generateSummary(transcript.trim());
      setSummary(data.summary);
      showToast("success", "Clinical summary generated.");
    } catch (error) {
      showToast("error", getErrorMessage(error));
    } finally {
      setLoadingAction("");
    }
  };

  const runFullPipeline = async () => {
    if (!file) {
      showToast("error", "Please upload an audio file first.");
      return;
    }

    setLoadingAction("process");
    setProgress(0);
    setTranscript("");
    setSummary(null);

    try {
      const data = await processAudio(file, updateProgress);
      setTranscript(data.transcript);
      setSummary(data.summary);
      showToast("success", "Audio processed successfully.");
    } catch (error) {
      showToast("error", getErrorMessage(error));
    } finally {
      setLoadingAction("");
      setProgress(0);
    }
  };

  const resetWorkspace = () => {
    setFile(null);
    setTranscript("");
    setSummary(null);
    setLoadingAction("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateTranscript = (value) => {
    setTranscript(value);
    setSummary(null);
  };

  const runRecordingPipeline = async (recordedFile) => {
    if (!recordedFile) {
      showToast("error", "No recording available. Please record again.");
      return;
    }

    setLoadingAction("record");
    setProgress(0);
    setTranscript("");
    setSummary(null);

    try {
      const data = await processAudio(recordedFile, updateProgress);
      setTranscript(data.transcript);
      setSummary(data.summary);
      showToast("success", "✅ Recording Processed Successfully");
    } catch (error) {
      showToast("error", getErrorMessage(error));
    } finally {
      setLoadingAction("");
      setProgress(0);
    }
  };

  const notify = showToast;

  return {
    file,
    fileInputRef,
    transcript,
    setTranscript: updateTranscript,
    summary,
    loadingAction,
    toast,
    progress,
    currentStep,
    canTranscribe,
    canSummarize,
    dismissToast,
    handleDrop,
    handleFileSelect,
    resetWorkspace,
    runFullPipeline,
    runRecordingPipeline,
    runSummary,
    runTranscription,
    notify
  };
}
