/**
 * Extrai frames do MP4 da hero → frame_%05d.webp + manifest.json
 * Mesmo padrão usado pelo Hero em /images/video/
 *
 * Fonte: dist/images/Crystal_shards_assemble_202604030618.mp4
 * Saídas: public/images/video (dev Vite) + dist/images/video (espelho)
 *
 * Uso: npm run extract-frames
 * Override: HERO_INPUT ou HERO_OUT_PRIMARY
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");

const input =
  process.env.HERO_INPUT ??
  join(root, "dist", "images", "Crystal_shards_assemble_202604030618.mp4");

const outPrimary =
  process.env.HERO_OUT_PRIMARY ?? join(root, "public", "images", "video");
const outDist = join(root, "dist", "images", "video");

const outPattern = join(outPrimary, "frame_%05d.webp");

const vf = "scale=2560:-2:flags=lanczos+accurate_rnd";

async function purgeFrameWebp(dir) {
  await mkdir(dir, { recursive: true });
  let names;
  try {
    names = await readdir(dir);
  } catch {
    return;
  }
  for (const f of names) {
    if (/^frame_\d+\.webp$/.test(f)) {
      await unlink(join(dir, f));
    }
  }
}

async function mirrorVideoFolder(fromDir, toDir) {
  await mkdir(toDir, { recursive: true });
  const names = await readdir(fromDir);
  for (const f of names) {
    if (/^frame_\d+\.webp$/.test(f) || f === "manifest.json") {
      await copyFile(join(fromDir, f), join(toDir, f));
    }
  }
}

if (!existsSync(input)) {
  console.error(
    `Falha: vídeo não encontrado.\n  Esperado: ${input}\n  Coloque o MP4 nesse caminho ou defina HERO_INPUT.`,
  );
  process.exit(1);
}

await purgeFrameWebp(outPrimary);
await purgeFrameWebp(outDist);

execSync(
  [
    "ffmpeg -y",
    `-i "${input}"`,
    "-vsync 0",
    `-vf "${vf}"`,
    "-c:v libwebp",
    "-quality 93",
    "-compression_level 4",
    `"${outPattern}"`,
  ].join(" "),
  { stdio: "inherit", shell: true },
);

let frameCount = null;
try {
  const { stdout } = execSync(
    `ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "${input}"`,
    { encoding: "utf8", shell: true },
  );
  frameCount = Number.parseInt(stdout.trim(), 10);
  if (!Number.isFinite(frameCount)) frameCount = null;
} catch {
  /* fallback abaixo */
}

if (frameCount == null) {
  try {
    const { stdout: durOut } = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries format=duration -of csv=p=0 "${input}"`,
      { encoding: "utf8", shell: true },
    );
    const { stdout: fpsOut } = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "${input}"`,
      { encoding: "utf8", shell: true },
    );
    const dur = Number.parseFloat(durOut.trim());
    const [a, b] = fpsOut.trim().split("/").map(Number);
    const fps = b ? a / b : a;
    if (Number.isFinite(dur) && Number.isFinite(fps) && fps > 0) {
      frameCount = Math.round(dur * fps);
    }
  } catch {
    /* ignore */
  }
}

/** Fonte de verdade se ffprobe falhar: arquivos gerados */
if (frameCount == null || !Number.isFinite(frameCount)) {
  const names = await readdir(outPrimary);
  const n = names.filter((f) => /^frame_\d+\.webp$/.test(f)).length;
  if (n > 0) frameCount = n;
}

const manifest = {
  frameCount: frameCount ?? null,
  format: "webp",
  pattern: "frame_%05d.webp",
  source:
    "dist/images/Crystal_shards_assemble_202604030618.mp4 — scripts/extract-hero-frames.mjs",
  note:
    "frame_00001.webp, frame_00002.webp, … — mesmo contrato do Hero; manifest.frameCount = total de frames.",
};

await writeFile(
  join(outPrimary, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

await mirrorVideoFolder(outPrimary, outDist);

console.log(
  `OK: ${outPrimary} + espelho ${outDist} (${manifest.frameCount ?? "?"} frames)`,
);
