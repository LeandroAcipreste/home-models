/**
 * Extrai todos os frames do MP4 da hero para public/images/video/
 * Uso: node scripts/extract-hero-frames.mjs
 */
import { execSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const input = join(root, "video", "HOMEMODEL_logo_deconstructing_202604011146.mp4");
const outDir = join(root, "public", "images", "video");

await mkdir(outDir, { recursive: true });

const outPattern = join(outDir, "frame_%05d.webp");

execSync(
  `ffmpeg -y -i "${input}" -vsync 0 -c:v libwebp -quality 88 "${outPattern}"`,
  { stdio: "inherit", shell: true },
);

const { stdout } = execSync(
  `ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "${input}"`,
  { encoding: "utf8", shell: true },
);
const frameCount = Number.parseInt(stdout.trim(), 10);

const manifest = {
  frameCount: Number.isFinite(frameCount) ? frameCount : null,
  format: "webp",
  pattern: "frame_%05d.webp",
  note: "Gerado por scripts/extract-hero-frames.mjs",
};

await writeFile(
  join(outDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`OK: ${outDir} (${manifest.frameCount} frames)`);
