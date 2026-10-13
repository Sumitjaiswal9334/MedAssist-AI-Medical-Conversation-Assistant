import { FileAudio, HeartPulse, Mic, Sparkles, Stethoscope } from "lucide-react";
import Metric from "../ui/Metric";

function HomeSection() {
  return (
    <section id="home" className="border-b border-clinic-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-14">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-clinic-line bg-clinic-mint px-3 py-1 text-sm font-medium text-clinic-tealDark">
            <Sparkles className="h-4 w-4" />
            AI clinical conversation workspace
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-clinic-ink sm:text-5xl lg:text-6xl">
            AI Medical Conversation Assistant
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-clinic-muted sm:text-lg">
            Upload a doctor-patient audio file or record a live conversation, then transcribe it with Whisper and generate a structured clinical summary through Gemini.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a className="btn-primary justify-center" href="#upload">
              <FileAudio className="h-4 w-4" />
              Upload Audio
            </a>
            <a className="btn-secondary justify-center" href="#record">
              <Mic className="h-4 w-4" />
              Record Live Conversation
            </a>
          </div>
        </div>

        <div className="relative min-h-[340px] overflow-hidden rounded-lg border border-clinic-line bg-[linear-gradient(150deg,#dff5ee_0%,#ffffff_45%,#e7efff_100%)] p-6 shadow-soft">
          <div className="absolute right-6 top-6 rounded-full bg-white p-3 shadow-field">
            <HeartPulse className="h-8 w-8 text-clinic-coral" />
          </div>
          <div className="mt-16 space-y-4">
            <Metric label="Pipeline" value="Audio to summary" />
            <Metric label="Missing details" value="Not Mentioned" />
            <Metric label="Extraction mode" value="Fact-only" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 border-t border-clinic-line bg-white/80 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-clinic-teal text-white">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Clinical notes, structured fast</p>
                <p className="text-sm text-clinic-muted">Connected to your FastAPI backend.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeSection;
