/**
 * Gera `manifest.json` listando imagens em `public/images/models/img-efeito-backgroung`.
 * Rode manualmente: `node scripts/generate-efeito-trail-manifest.mjs`
 * O Vite também executa isso em dev/build (plugin).
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const EFEITO_TRAIL_DIR = path.resolve(
  __dirname,
  "../public/images/models/img-efeito-backgroung",
);

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)$/i;

export async function generateEfeitoTrailManifest() {
  if (!existsSync(EFEITO_TRAIL_DIR)) {
    await mkdir(EFEITO_TRAIL_DIR, { recursive: true });
  }

  const names = await readdir(EFEITO_TRAIL_DIR).catch(() => []);
  const files = names.filter(
    (n) => IMAGE_EXT.test(n) && n !== "manifest.json",
  );
  files.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const outPath = path.join(EFEITO_TRAIL_DIR, "manifest.json");
  const payload = {
    files,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");

  const rel = path.relative(process.cwd(), outPath);
  console.log(`[efeito-trail] ${files.length} imagens → ${rel}`);
}

const isMain = process.argv[1]?.includes("generate-efeito-trail-manifest");
if (isMain) {
  await generateEfeitoTrailManifest();
}
