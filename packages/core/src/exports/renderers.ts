import type { ExportFormat, ExportResult } from "./types";

export interface ResumeExportData {
  resumeProfileId: string;
  resumeVersionId: string;
}

export interface CoverLetterExportData {
  resumeProfileId: string;
  coverLetterDraftId: string;
}

export interface ApplicationPacketExportData {
  resumeProfileId: string;
  resumeVersionId: string;
  coverLetterDraftId: string;
}

export interface ExportRenderers {
  renderResume(input: { format: ExportFormat; data: ResumeExportData }): Promise<ExportResult>;

  renderCoverLetter(input: {
    format: ExportFormat;
    data: CoverLetterExportData;
  }): Promise<ExportResult>;

  renderApplicationPacket(input: {
    format: ExportFormat;
    data: ApplicationPacketExportData;
  }): Promise<ExportResult>;
}
