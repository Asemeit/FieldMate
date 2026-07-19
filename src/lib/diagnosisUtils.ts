import { Diagnosis } from '../types';

/** Ensure confidence is a valid 1–99 integer for display and storage. */
export function normalizeConfidence(value: unknown, fallback = 75): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(99, Math.max(1, Math.round(n)));
}

/** Resolve confidence from diagnosis or nested recommendation (handles legacy null/NaN records). */
export function getDisplayConfidence(diagnosis: Diagnosis): number {
  const top = normalizeConfidence(diagnosis.confidence, 0);
  if (top > 0) return top;

  const fromRec = normalizeConfidence(diagnosis.recommendation?.confidence, 0);
  if (fromRec > 0) return fromRec;

  if (diagnosis.analysisMode === 'ml') return 50;
  if (diagnosis.analysisMode === 'live-ai') return 85;
  return 85;
}

/** Patch broken confidence values on records loaded from IndexedDB. */
export function repairDiagnosisConfidence(diagnosis: Diagnosis): Diagnosis {
  const confidence = getDisplayConfidence(diagnosis);
  if (confidence === diagnosis.confidence && diagnosis.recommendation.confidence === confidence) {
    return diagnosis;
  }
  return {
    ...diagnosis,
    confidence,
    recommendation: { ...diagnosis.recommendation, confidence },
  };
}
