/** switch の網羅漏れを型で検出するため、到達しないはずの分岐で呼ぶ。 */
export function assertNever(value: never): never {
  throw new Error(`想定していない値です: ${JSON.stringify(value)}`);
}
