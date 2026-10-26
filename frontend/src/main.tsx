import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./App.css";

// CesiumJS は Workers などの静的アセットの場所をグローバル変数 CESIUM_BASE_URL から読む。
// vite.config.ts の define による置換は開発サーバーが事前バンドルした Cesium には適用されないため、
// 実行時に設定する。Cesium がアセットを読むのは Viewer の生成時なので、描画前に設定すれば足りる。
// パスは vite.config.ts でアセットをコピーする先（cesiumStatic）と一致させる。
globalThis.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}cesiumStatic/`;

const rootElement = document.querySelector("#root");
if (!rootElement) {
  throw new Error("#root 要素が見つかりません");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
