import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// CesiumJS は Workers などの静的アセットを実行時に CESIUM_BASE_URL から読み込むため、
// 配信ディレクトリへコピーしておく。CESIUM_BASE_URL は src/main.tsx で設定する。
const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: ["Workers", "ThirdParty", "Assets", "Widgets"].map((dir) => ({
        src: `${cesiumSource}/${dir}/**/*`,
        dest: cesiumBaseUrl,
        // node_modules/cesium/Build/Cesium の4階層を取り除き、cesiumStatic/<dir>/... に配置する
        rename: { stripBase: 4 },
      })),
    }),
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
