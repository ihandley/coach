export type ExportFormat = "pdf" | "docx";

export type ExportDocumentType = "resume" | "cover-letter" | "application-packet";

export interface ExportRequest {
  documentType: ExportDocumentType;
  format: ExportFormat;
  resumeProfileId: string;
  resumeVersionId?: string;
  coverLetterDraftId?: string;
}

export interface ExportResult {
  fileName: string;
  mimeType: string;
  buffer: ArrayBuffer;
}
