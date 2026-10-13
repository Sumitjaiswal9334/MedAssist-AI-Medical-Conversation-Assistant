from pydantic import BaseModel, ConfigDict, Field


class ClinicalSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patient_name: str = Field(..., description="Patient name or Not Mentioned")
    age: str = Field(..., description="Patient age or Not Mentioned")
    gender: str = Field(..., description="Patient gender or Not Mentioned")
    chief_complaint: str = Field(..., description="Chief complaint or Not Mentioned")
    symptoms: str = Field(..., description="Symptoms or Not Mentioned")
    medical_history: str = Field(..., description="Medical history or Not Mentioned")
    medications: str = Field(..., description="Medications or Not Mentioned")
    clinical_observations: str = Field(..., description="Clinical observations or Not Mentioned")
    diagnosis: str = Field(..., description="Diagnosis only if explicitly mentioned, otherwise Not Mentioned")
    treatment_plan: str = Field(..., description="Treatment plan or Not Mentioned")
    follow_up: str = Field(..., description="Follow-up instructions or Not Mentioned")
    final_summary: str = Field(..., description="Concise final clinical summary or Not Mentioned")


class TranscriptionResponse(BaseModel):
    transcript: str


class GenerateSummaryRequest(BaseModel):
    transcript: str = Field(..., min_length=1)


class GenerateSummaryResponse(BaseModel):
    summary: ClinicalSummary


class ProcessAudioResponse(BaseModel):
    transcript: str
    summary: ClinicalSummary
