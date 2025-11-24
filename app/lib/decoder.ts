export const LABELS =
  ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']


export interface DecodedOutput {
  label: string;
  score: number;
}

export function decodeOutput(scores: Float32Array): DecodedOutput {
  let maxIdx = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] > scores[maxIdx]) maxIdx = i;
  }
  return { label: LABELS[maxIdx], score: scores[maxIdx] };
}
