import { defineProject } from "vitest/config";

// テスト対象は描画を伴わない純粋な関数に限るため、ブラウザ環境は用意せず Node で実行する。
export default defineProject({
  test: {
    name: "frontend",
    environment: "node",
  },
});
