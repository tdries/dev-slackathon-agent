import puppeteer, { type Browser } from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildCardHtml } from './cardTemplate.js';
import type { VerificationReport } from './types.js';

let cachedBrowser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) return cachedBrowser;
  cachedBrowser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  return cachedBrowser;
}

export async function shutdownRenderer(): Promise<void> {
  if (cachedBrowser) {
    await cachedBrowser.close();
    cachedBrowser = null;
  }
}

export interface RenderOptions {
  outputPath: string;
  width?: number;
  deviceScaleFactor?: number;
}

export async function renderCardPng(
  report: VerificationReport,
  opts: RenderOptions,
): Promise<string> {
  const html = buildCardHtml(report);
  const browser = await getBrowser();
  const page = await browser.newPage();
  const width = opts.width ?? 920;
  await page.setViewport({
    width,
    height: 1200,
    deviceScaleFactor: opts.deviceScaleFactor ?? 2,
  });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const card = await page.$('.card');
  if (!card) {
    await page.close();
    throw new Error('renderer: .card not found');
  }
  await mkdir(path.dirname(opts.outputPath), { recursive: true });
  await card.screenshot({ path: opts.outputPath, type: 'png', omitBackground: false });
  await page.close();
  return opts.outputPath;
}

export async function renderCardHtmlToFile(
  report: VerificationReport,
  outputPath: string,
): Promise<string> {
  const html = buildCardHtml(report);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf8');
  return outputPath;
}
