// WEEKLY//UNI — build the Next.js app as a static export for Telegram Serverless.
//
// Why move src/app/api aside: `output: "export"` refuses route handlers
// (force-dynamic). The Railway serverful build is untouched — this script only
// relocates the API folder for the duration of the export build.
//
// Output: static site copied to out/ (the folder tgcloud.jsonc points at).

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const apiDir = path.join(root, 'src', 'app', 'api');
const keepDir = path.join(root, '.api-keep-tgcloud');
const outDir = path.join(root, 'out');

const moved = !fs.existsSync(keepDir) && fs.existsSync(apiDir);
try {
  if (moved) {
    fs.renameSync(apiDir, keepDir);
    console.log('• src/app/api temporarily moved aside for export build');
  }
  execSync('npx next build', { stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_TGCLOUD: '1' } });
} finally {
  if (moved && fs.existsSync(keepDir)) {
    fs.renameSync(keepDir, apiDir);
    console.log('• src/app/api restored');
  }
}

// Locate the export output (Next 16 with a custom distDir exports INTO the distDir)
const candidates = ['out', '.next-tgcloud/out', '.next-tgcloud'];
const found = candidates.find((c) => {
  const p = path.join(root, c);
  return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'));
});
if (!found) throw new Error('static export not found (no index.html)');

if (found !== 'out') {
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.cpSync(path.join(root, found), outDir, { recursive: true });
}
console.log(`• static export ready at out/ (from ${found})`);
