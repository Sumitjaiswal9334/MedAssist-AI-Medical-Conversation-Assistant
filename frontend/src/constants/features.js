import { Activity, FileAudio, ShieldCheck } from "lucide-react";

export const features = [
  {
    icon: FileAudio,
    title: "Audio Intake",
    text: "Upload common clinical audio formats and send them directly to the transcription pipeline."
  },
  {
    icon: Activity,
    title: "Speech-Aware Pipeline",
    text: "Backend processing includes voice activity detection before faster-whisper transcription."
  },
  {
    icon: ShieldCheck,
    title: "Fact-Only Summaries",
    text: "Gemini is prompted to extract only explicit medical facts and mark missing fields clearly."
  }
];
