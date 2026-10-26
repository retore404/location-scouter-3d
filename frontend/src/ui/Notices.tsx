import type { AppState } from "../state/appState";

const TERRAIN_HEIGHT_WARNING = "配置する地点の高さが実際と異なる場合があります。";

type Props = {
  readonly loadErrors: AppState["loadErrors"];
};

/** データ取得の失敗と、3Dデータに含まれない遮蔽物についての注記。どちらのモードでも常に表示する。 */
export function Notices({ loadErrors }: Props) {
  return (
    <div className="notices">
      {loadErrors.buildings !== undefined && (
        <p className="notice-error" role="alert">
          {loadErrors.buildings}
        </p>
      )}
      {loadErrors.terrain !== undefined && (
        <p className="notice-error" role="alert">
          {loadErrors.terrain}
          {TERRAIN_HEIGHT_WARNING}
        </p>
      )}
      <p className="notice">
        樹木、東京23区・横浜市の外の建物、データ化されていない構造物は表示されません。実際にはそれらに遮られる場合があります。
      </p>
    </div>
  );
}
