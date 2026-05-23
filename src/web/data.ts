import { sampleReport } from '../core/sample.js';
import type { VerificationReport } from '../core/types.js';

export const reports: Record<string, VerificationReport> = sampleReport;

export interface LibraryEntry {
  id: string;
  report: VerificationReport;
  channel: string;
  askedBy: string;
  askedAt: string;
}

export const library: LibraryEntry[] = [
  {
    id: 'r-001',
    report: sampleReport.mostly_true!,
    channel: 'general',
    askedBy: 'priya.k',
    askedAt: '12 min ago',
  },
  {
    id: 'r-002',
    report: sampleReport.false!,
    channel: 'random',
    askedBy: 'alex.t',
    askedAt: '38 min ago',
  },
  {
    id: 'r-003',
    report: sampleReport.misleading!,
    channel: 'science-club',
    askedBy: 'jordan.r',
    askedAt: '2 hr ago',
  },
  {
    id: 'r-004',
    report: {
      ...sampleReport.mostly_true!,
      claim: 'Coffee production in Brazil dropped 12% year over year due to drought.',
      verdict: 'mostly_true',
      confidence: 0.86,
      oneLiner: 'USDA and CONAB both put the 2025/26 Brazilian arabica harvest down ~11.5%, attributed mostly to drought in Minas Gerais.',
      sources: sampleReport.mostly_true!.sources.slice(0, 4),
    },
    channel: 'markets',
    askedBy: 'priya.k',
    askedAt: '5 hr ago',
  },
  {
    id: 'r-005',
    report: {
      ...sampleReport.misleading!,
      claim: 'Generative AI uses more electricity than the entire country of Argentina.',
      verdict: 'mixed',
      confidence: 0.71,
      oneLiner: 'Projected 2027 demand could approach that level; today, data-center power is closer to ~2% of global supply, below Argentina.',
      sources: sampleReport.misleading!.sources.slice(0, 4),
    },
    channel: 'ai-curious',
    askedBy: 'alex.t',
    askedAt: '1 d ago',
  },
  {
    id: 'r-006',
    report: {
      ...sampleReport.false!,
      claim: 'The 2024 Nobel Prize in Physics went to a researcher in cold fusion.',
      verdict: 'false',
      confidence: 0.99,
      oneLiner: 'The 2024 Nobel Prize in Physics went to Hopfield and Hinton for foundational work on machine learning, not cold fusion.',
      sources: sampleReport.false!.sources.slice(0, 4),
    },
    channel: 'science-club',
    askedBy: 'jordan.r',
    askedAt: '1 d ago',
  },
];

export const kpis = {
  total: 1284,
  trueShare: 41,
  falseShare: 27,
  mixedShare: 32,
  latencyP50: 5.4,
  channelsWatched: 11,
  weeklyTrend: [38, 42, 51, 49, 62, 58, 71, 84],
  verdictDist: [41, 18, 14, 13, 10, 4],
};
