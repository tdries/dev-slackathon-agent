export type Verdict =
  | 'true'
  | 'mostly_true'
  | 'mixed'
  | 'misleading'
  | 'false'
  | 'unverified';

export interface ClaimSignal {
  isClaim: boolean;
  confidence: number;
  claim: string | null;
  topic: string | null;
  reason: string;
}

export interface Source {
  title: string;
  url: string;
  publisher: string;
  stance: 'supports' | 'refutes' | 'contextual';
  weight: number;
  excerpt: string;
}

export interface VerificationReport {
  claim: string;
  verdict: Verdict;
  confidence: number;
  oneLiner: string;
  context: string;
  sources: Source[];
  supportPct: number;
  refutePct: number;
  contextPct: number;
  sourceWeights: number[];
  recencyTrend: number[];
  generatedAt: string;
  model: string;
  latencyMs: number;
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  true: 'TRUE',
  mostly_true: 'MOSTLY TRUE',
  mixed: 'MIXED',
  misleading: 'MISLEADING',
  false: 'FALSE',
  unverified: 'UNVERIFIED',
};

export const VERDICT_COLOR: Record<Verdict, string> = {
  true: '#2EB67D',
  mostly_true: '#2EB67D',
  mixed: '#ECB22E',
  misleading: '#ECB22E',
  false: '#E01E5A',
  unverified: '#616061',
};
