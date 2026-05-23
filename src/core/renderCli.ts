import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCardPng, shutdownRenderer } from './renderer.js';
import { sampleReport } from './sample.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const which = (process.argv[2] ?? 'mostly_true') as keyof typeof sampleReport;
  const report = sampleReport[which];
  if (!report) {
    console.error(`Unknown sample: ${which}. Try: ${Object.keys(sampleReport).join(', ')}`);
    process.exit(1);
  }
  const out = path.resolve(__dirname, `../../docs/screenshots/sample-${which}.png`);
  await renderCardPng(report, { outputPath: out });
  console.log(`wrote ${out}`);
  await shutdownRenderer();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
