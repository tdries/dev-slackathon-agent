import type { Plugin, ViteDevServer } from 'vite';
import { config as loadEnv } from 'dotenv';
import { sampleReport } from './src/core/sample.js';

loadEnv();

const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY);

interface StreamChunk {
  type: 'screen' | 'partial' | 'final' | 'error';
  data: unknown;
}

async function readJson(req: import('http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function send(res: import('http').ServerResponse, code: number, body: unknown) {
  res.statusCode = code;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function classifyFixture(text: string): keyof typeof sampleReport | null {
  const t = text.toLowerCase();
  if (t.includes('iceland') || t.includes('renewable')) return 'mostly_true';
  if (t.includes('great wall') || t.includes('moon') || t.includes('nobel') || t.includes('cold fusion')) return 'false';
  if (t.includes('5g') || t.includes('cancer') || t.includes('argentina') || t.includes('coffee')) return 'misleading';
  return null;
}

function fakeScreen(text: string) {
  const t = text.trim();
  if (t.length < 12) return { isClaim: false, confidence: 0, claim: null, topic: null, reason: 'too-short' };
  const fixture = classifyFixture(t);
  if (fixture) {
    return {
      isClaim: true,
      confidence: 0.88,
      claim: sampleReport[fixture]!.claim,
      topic: 'demo',
      reason: 'fixture match',
    };
  }
  // simple heuristic for "looks like a claim"
  const hasNumberOrStat = /\d+%|\d{4}|\d+\s?(million|billion|times|percent)/i.test(t);
  const hasNamedEntity = /\b(NASA|WHO|UN|EU|US|Apple|Google|Tesla|Russia|China|Brazil|India)\b/.test(t);
  if (hasNumberOrStat || hasNamedEntity) {
    return { isClaim: true, confidence: 0.72, claim: t, topic: 'general', reason: 'heuristic match' };
  }
  return { isClaim: false, confidence: 0.2, claim: null, topic: null, reason: 'no signal' };
}

function fakeVerify(claim: string) {
  const fixture = classifyFixture(claim);
  if (fixture) {
    return { ...sampleReport[fixture]!, claim };
  }
  return {
    ...sampleReport.misleading!,
    claim,
    oneLiner: 'Live API key not configured; this is a fixture response so the demo can run offline.',
  };
}

export function veritypeApi(): Plugin {
  return {
    name: 'veritype-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/screen', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const body = (await readJson(req)) as { message?: string };
          const message = String(body.message ?? '');
          if (!HAS_KEY) {
            return send(res, 200, { mode: 'fixture', signal: fakeScreen(message) });
          }
          const { screen } = await import('./src/core/index.js');
          const signal = await screen(message);
          send(res, 200, { mode: 'live', signal });
        } catch (e) {
          send(res, 500, { error: (e as Error).message });
        }
      });

      server.middlewares.use('/api/verify', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        try {
          const body = (await readJson(req)) as { claim?: string };
          const claim = String(body.claim ?? '');
          if (!HAS_KEY) {
            // fake latency so the loader shows
            await new Promise((r) => setTimeout(r, 1800));
            return send(res, 200, { mode: 'fixture', report: fakeVerify(claim) });
          }
          const { verify } = await import('./src/core/index.js');
          const report = await verify(claim);
          send(res, 200, { mode: 'live', report });
        } catch (e) {
          send(res, 500, { error: (e as Error).message });
        }
      });

      server.middlewares.use('/api/status', (_req, res) => {
        send(res, 200, { hasKey: HAS_KEY, samples: Object.keys(sampleReport) });
      });
    },
  };
}
