/**
 * 入力欄の文字列を検証した結果。失敗時の message はそのまま画面に表示する。
 */
export type ValidationResult = { ok: true; value: number } | { ok: false; message: string };

function parseNumber(input: string): number | undefined {
  const trimmed = input.trim();
  if (trimmed === "") {
    return undefined;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

function validate(
  input: string,
  isValid: (value: number) => boolean,
  rangeMessage: string,
): ValidationResult {
  const value = parseNumber(input);
  if (value === undefined) {
    return { ok: false, message: "数値を入力してください" };
  }
  return isValid(value) ? { ok: true, value } : { ok: false, message: rangeMessage };
}

export function validateHeightAboveGround(input: string): ValidationResult {
  return validate(input, (value) => value >= 0, "0m 以上で入力してください");
}

/** 開花高度・開花直径の検証。 */
export function validateBurstLength(input: string): ValidationResult {
  return validate(input, (value) => value > 0, "0m より大きい値で入力してください");
}

export function validateLatitude(input: string): ValidationResult {
  return validate(
    input,
    (value) => value >= -90 && value <= 90,
    "緯度は -90〜90 の範囲で入力してください",
  );
}

export function validateLongitude(input: string): ValidationResult {
  return validate(
    input,
    (value) => value >= -180 && value <= 180,
    "経度は -180〜180 の範囲で入力してください",
  );
}
