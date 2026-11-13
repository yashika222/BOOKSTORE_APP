import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const url = process.env.LIGHTHOUSE_URL || 'http://localhost:3000';
mkdirSync('reports', { recursive: true });

const require = createRequire(import.meta.url);
const lighthouseCli = require.resolve('lighthouse/cli/index.js');
const child = spawn(process.execPath, [
  lighthouseCli,
  url,
  '--only-categories=performance,accessibility,best-practices,seo',
  '--output=html,json',
  '--output-path=reports/lighthouse',
  '--chrome-flags=--headless --no-sandbox',
], { stdio: 'inherit' });

child.on('error', (error) => {
  console.error('Failed to start Lighthouse:', error);
  process.exitCode = 1;
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
