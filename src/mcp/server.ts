import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { screen, verify, renderCardPng } from '../core/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARD_DIR = process.env.VERITYPE_CARD_CACHE_DIR
  ? path.resolve(process.env.VERITYPE_CARD_CACHE_DIR)
  : path.resolve(__dirname, '../../runs/cards');

const server = new Server(
  { name: 'veritype', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'screen_message',
      description:
        'Detect whether a free-text message contains a verifiable factual claim worth fact-checking. Returns a confidence score, a topic, and a normalized claim sentence.',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Raw message text to triage.' },
        },
        required: ['message'],
      },
    },
    {
      name: 'verify_claim',
      description:
        'Fact-check a single claim using web search + a careful research agent. Returns a verdict (true / mostly_true / mixed / misleading / false / unverified), confidence, a one-line summary, longer context, and weighted sources.',
      inputSchema: {
        type: 'object',
        properties: {
          claim: { type: 'string', description: 'The claim to verify, as a single declarative sentence.' },
        },
        required: ['claim'],
      },
    },
    {
      name: 'render_verdict_card',
      description:
        'Render a verification report into a Datatype-rich PNG card suitable for posting to Slack, email, or any image surface.',
      inputSchema: {
        type: 'object',
        properties: {
          report: {
            type: 'object',
            description: 'A VerificationReport object as returned by verify_claim.',
          },
          outputPath: {
            type: 'string',
            description: 'Absolute or repo-relative path to write the PNG to.',
          },
        },
        required: ['report'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const args = (req.params.arguments ?? {}) as Record<string, unknown>;

  if (req.params.name === 'screen_message') {
    const signal = await screen(String(args.message ?? ''));
    return { content: [{ type: 'text', text: JSON.stringify(signal, null, 2) }] };
  }

  if (req.params.name === 'verify_claim') {
    const report = await verify(String(args.claim ?? ''));
    return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
  }

  if (req.params.name === 'render_verdict_card') {
    const report = args.report as Parameters<typeof renderCardPng>[0];
    const outputPath = args.outputPath
      ? path.resolve(String(args.outputPath))
      : path.join(CARD_DIR, `${Date.now()}.png`);
    const written = await renderCardPng(report, { outputPath });
    return { content: [{ type: 'text', text: `Wrote ${written}` }] };
  }

  throw new Error(`Unknown tool: ${req.params.name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[veritype-mcp] ready on stdio');
