// main.ts — Golden Crust Bakery entrypoint (Node 22, standard library only).
// Copies game/ and screenshots/ into the output directory and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(import.meta.dirname ?? '.');
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });

  const gameDir = join(repoRoot, 'game');
  const shotsDir = join(repoRoot, 'screenshots');

  if (!existsSync(gameDir)) throw new Error('game/ is missing from the repository');
  if (!existsSync(shotsDir)) throw new Error('screenshots/ is missing from the repository');

  cpSync(gameDir, join(outDir, 'game'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

  // buildDossier writes the dossier from the handed-in game and screenshots.
  // Awaiting it is safe whether it returns its bytes at once or as a promise.
  const dossier = await buildDossier(gameDir, shotsDir);
  const bytes = typeof dossier === 'string' ? Buffer.from(dossier, 'utf8') : dossier;
  writeFileSync(join(outDir, 'dossier.json'), bytes);
  console.log(`Wrote ${outDir}/dossier.json (${bytes.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
