import { useId, useState } from "react";
import type { ValidationResult } from "../domain/validation";

type Props = {
  readonly label: string;
  readonly value: number;
  readonly format: (value: number) => string;
  readonly validate: (input: string) => ValidationResult;
  readonly onCommit: (value: number) => void;
};

/**
 * 数値の入力欄。入力中の文字列は確定（フォーカスを外すか Enter）するまで状態に反映せず、
 * 不正な値は受け付けずに理由を表示する。
 */
export function NumberField({ label, value, format, validate, onCommit }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  // 編集中でなければ null とし、状態の値を表示する。
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const commit = () => {
    if (draft === null) {
      return;
    }
    const result = validate(draft);
    if (result.ok) {
      onCommit(result.value);
      setDraft(null);
      setError(undefined);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        inputMode="decimal"
        value={draft ?? format(value)}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
          }
        }}
      />
      {error !== undefined && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
