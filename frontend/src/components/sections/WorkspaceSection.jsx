import LiveRecorder from "../recorder/LiveRecorder";
import ClinicalSummaryCard from "../summary/ClinicalSummaryCard";
import ProgressPanel from "../upload/ProgressPanel";
import TranscriptCard from "../transcript/TranscriptCard";
import UploadPanel from "../upload/UploadPanel";

function WorkspaceSection({ assistant }) {
  return (
    <section id="upload" className="mx-auto grid max-w-7xl gap-6 px-5 pb-14 lg:grid-cols-[410px_1fr] lg:px-8">
      <div className="space-y-6">
        <UploadPanel
          file={assistant.file}
          fileInputRef={assistant.fileInputRef}
          loadingAction={assistant.loadingAction}
          onDrop={assistant.handleDrop}
          onFileSelect={assistant.handleFileSelect}
          onReset={assistant.resetWorkspace}
          onTranscribe={assistant.runTranscription}
          onProcess={assistant.runFullPipeline}
          canTranscribe={assistant.canTranscribe}
        />
        <LiveRecorder
          loadingAction={assistant.loadingAction}
          progress={assistant.progress}
          onProcessRecording={assistant.runRecordingPipeline}
          onNotify={assistant.notify}
        />
        <ProgressPanel currentStep={assistant.currentStep} loadingAction={assistant.loadingAction} progress={assistant.progress} />
      </div>

      <div className="space-y-6">
        <TranscriptCard
          transcript={assistant.transcript}
          loadingAction={assistant.loadingAction}
          onChange={assistant.setTranscript}
          onGenerateSummary={assistant.runSummary}
          canSummarize={assistant.canSummarize}
        />
        <ClinicalSummaryCard summary={assistant.summary} loadingAction={assistant.loadingAction} />
      </div>
    </section>
  );
}

export default WorkspaceSection;
