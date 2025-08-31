#!/usr/bin/env node
const { existsSync } = require('fs');
const { spawnSync } = require('child_process');
const { join } = require('path');

// Try common locations relative to the current working directory
const candidates = [
  'prisma/schema.prisma',
  './prisma/schema.prisma',
  '../prisma/schema.prisma',
  '../../prisma/schema.prisma',
];

const found = candidates
  .map(p => join(process.cwd(), p))
  .find(full => existsSync(full));

if (!found) {
  console.error('[prisma-generate] Could not find prisma/schema.prisma.');
  console.error('[prisma-generate] Checked:', candidates.join(', '));
  process.exit(1);
}

console.log('[prisma-generate] Using schema at:', found);

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['prisma', 'generate', '--schema', found],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 0);

