import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(async () => {
  const { generateEfeitoTrailManifest, EFEITO_TRAIL_DIR } = await import(
    "./scripts/generate-efeito-trail-manifest.mjs"
  );

  function efeitoTrailManifestPlugin(): import("vite").Plugin {
    return {
      name: "efeito-trail-manifest",
      async buildStart() {
        await generateEfeitoTrailManifest();
      },
      configureServer(server) {
        const regen = () => {
          void generateEfeitoTrailManifest();
        };
        server.watcher.add(EFEITO_TRAIL_DIR);
        server.watcher.on("add", (file) => {
          if (file.endsWith("manifest.json")) return;
          if (file.includes("img-efeito-backgroung")) regen();
        });
        server.watcher.on("unlink", (file) => {
          if (file.includes("img-efeito-backgroung")) regen();
        });
      },
    };
  }

  return {
    plugins: [react(), tailwindcss(), efeitoTrailManifestPlugin()],
  };
});
