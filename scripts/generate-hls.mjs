import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const STREAMS = [
  {
    input: path.join(ROOT, "video", "entrance-mobile.mp4"),
    outDir: path.join(ROOT, "public", "streams", "intro-mobile"),
    hlsTime: 2,
  },
  {
    input: path.join(ROOT, "video", "video-de-entrada.mp4"),
    outDir: path.join(ROOT, "public", "streams", "intro-desktop"),
    hlsTime: 1,
  },
  {
    input: path.join(ROOT, "video", "video-home-page-mobile.mp4"),
    outDir: path.join(ROOT, "public", "streams", "home-mobile"),
    hlsTime: 2,
  },
  {
    input: path.join(ROOT, "video", "Crystal_shards_assemble_202604030618.mp4"),
    outDir: path.join(ROOT, "public", "streams", "hero-desktop"),
    hlsTime: 1,
  },
];

function ensureFfmpeg() {
  const check = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (check.error || check.status !== 0) {
    throw new Error(
      "ffmpeg não encontrado no PATH. Instale o ffmpeg para gerar os streams HLS.",
    );
  }
}

function runFfmpeg(input, outDir, hlsTime) {
  mkdirSync(outDir, { recursive: true });
  const playlist = path.join(outDir, "index.m3u8");
  const segments = path.join(outDir, "seg_%03d.ts");

  const args = [
    "-y",
    "-i",
    input,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-g",
    "48",
    "-keyint_min",
    "48",
    "-sc_threshold",
    "0",
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-b:a",
    "128k",
    "-hls_time",
    String(hlsTime ?? 4),
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    segments,
    playlist,
  ];

  const res = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (res.error || res.status !== 0) {
    throw new Error(`Falha ao gerar HLS para: ${input}`);
  }
}

function main() {
  ensureFfmpeg();
  for (const item of STREAMS) {
    runFfmpeg(item.input, item.outDir, item.hlsTime);
  }
  console.log("OK: HLS gerado em public/streams");
}

main();
