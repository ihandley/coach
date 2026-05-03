export type ActionableInput = {
  matchScore: number;
  classificationConfidence?: number;
  currentStatus?: string;
  detectedStatus?: string;
};

const MATCH_THRESHOLD = 0.6;
const CLASSIFICATION_THRESHOLD = 0.6;

export function isActionableMatch(input: ActionableInput): boolean {
  const { matchScore, classificationConfidence, currentStatus, detectedStatus } = input;

  if (matchScore < MATCH_THRESHOLD) return false;

  if (
    classificationConfidence !== undefined &&
    classificationConfidence < CLASSIFICATION_THRESHOLD
  ) {
    return false;
  }

  if (!detectedStatus) return false;

  if (currentStatus && detectedStatus === currentStatus) return false;

  return true;
}
