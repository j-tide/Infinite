import type { NodeProps } from '@xyflow/react';
import { LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useGeneratorNode } from '../../hooks/useGeneratorNode';
import type { CanvasNode } from '../../types';
import { GenerationFeedback } from './GenerationFeedback';
import { GeneratorInputs } from './GeneratorInputs';
import { GeneratorSettings } from './GeneratorSettings';
import { NodeCard } from './NodeCard';
import { NodeHeading } from './NodeHeading';

export function GeneratorNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const generator = useGeneratorNode(id);
  const { active, retryable, ready, task } = generator;
  const note = !task
    ? ready
      ? '已准备好 · 约 2 秒完成 mock 生成'
      : '连接图片与提示词后，即可开始生成'
    : task.status === 'succeeded'
      ? '结果已添加到画布右侧，内容为固定示例图片'
      : undefined;

  return (
    <NodeCard kind="generator" selected={selected} generating={active}>
      <NodeHeading id={id} label={data.label} kind="generator" />
      <div className="px-4 pt-3.5 pb-3.25">
        <div className="mb-3 flex items-center justify-between text-[8px] tracking-[1px] text-node-generator-caption">
          <span>IMAGE GENERATOR</span>
          <span className="rounded-[3px] border border-node-mock-border px-1 py-0.5 text-[7px] tracking-[.5px]">
            MOCK
          </span>
        </div>
        <GeneratorInputs inputs={generator.inputs} />
        <GeneratorSettings
          id={id}
          ratio={data.ratio ?? '4:3'}
          failNext={data.failNext ?? false}
          active={active}
          onRatioChange={generator.setRatio}
          onFailNextChange={generator.setFailNext}
        />
        {task && (
          <GenerationFeedback task={task} active={active} retryable={retryable} />
        )}
        <Button
          className="nodrag nopan flex! w-full text-node-generation-ink! enabled:hover:bg-node-generation-hover!"
          aria-label={retryable ? '重试生成' : '生成图片'}
          disabled={generator.generateDisabled}
          onClick={generator.submit}
        >
          {active ? (
            <LoaderCircle size={15} className="animate-spinning" />
          ) : retryable ? (
            <RotateCcw size={15} />
          ) : (
            <Sparkles size={15} />
          )}
          {generator.generateLabel}
          {!active && !retryable && <span className="ml-auto">↗</span>}
        </Button>
        {retryable && ready && (
          <button
            type="button"
            className="nodrag nopan mt-0.75 w-full bg-transparent p-1.5 text-[8px] text-node-current-input hover:text-node-current-input-hover"
            onClick={generator.generateFromCurrent}
          >
            使用当前输入重新生成
          </button>
        )}
        {note && (
          <p className="m-0 mt-2.25 text-center text-[8px] leading-[1.6] text-node-generation-note">
            {note}
          </p>
        )}
      </div>
    </NodeCard>
  );
}
