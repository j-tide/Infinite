import type { Ratio } from '../../types';

interface GeneratorSettingsProps {
  id: string;
  ratio: Ratio;
  failNext: boolean;
  active: boolean;
  onRatioChange(ratio: Ratio): void;
  onFailNextChange(failNext: boolean): void;
}

export function GeneratorSettings({
  id,
  ratio,
  failNext,
  active,
  onRatioChange,
  onFailNextChange,
}: GeneratorSettingsProps) {
  return (
    <>
      <div className="mt-3.5 flex items-center justify-between text-[10px] text-node-connected-prompt">
        <label htmlFor={`ratio-${id}`}>画面比例</label>
        <select
          id={`ratio-${id}`}
          className="nodrag nopan w-32.5 rounded-[5px] border border-node-ratio-border bg-node-ratio px-2 py-1.5 font-[family-name:inherit] text-[9px] text-node-ratio-text"
          aria-label="生成比例"
          disabled={active}
          value={ratio}
          onChange={(event) => onRatioChange(event.target.value as Ratio)}
        >
          <option value="1:1">1:1　方形</option>
          <option value="4:3">4:3　横向</option>
          <option value="16:9">16:9　宽屏</option>
        </select>
      </div>
      <label className="nodrag nopan my-3.25 flex cursor-pointer items-center gap-1.5 text-[9px] text-node-failure-option">
        <input
          type="checkbox"
          aria-label="下次生成失败"
          className="m-0 size-3 accent-node-failure-check"
          checked={failNext}
          disabled={active}
          onChange={(event) => onFailNextChange(event.target.checked)}
        />
        <span>下次生成失败</span>
        <span className="ml-auto text-[7px] text-node-failure-hint">
          测试开关 · 单次生效
        </span>
      </label>
    </>
  );
}
