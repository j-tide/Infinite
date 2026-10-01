import { useCanvasStore } from '../store/canvasStore';
import type { Ratio } from '../types';
import { getInputs, getLatestTask } from '../utils/graph';

export function useGeneratorNode(id: string) {
  const doc = useCanvasStore((state) => state.doc);
  const updateNode = useCanvasStore((state) => state.updateNode);
  const generate = useCanvasStore((state) => state.generate);
  const retry = useCanvasStore((state) => state.retry);
  const inputs = getInputs(doc, id);
  const task = getLatestTask(doc, id);
  const active = task?.status === 'queued' || task?.status === 'running';
  const retryable = task?.status === 'failed' || task?.status === 'interrupted';
  const ready = !!inputs.image && !!inputs.prompt?.trim();

  return {
    inputs,
    task,
    active,
    retryable,
    ready,
    generateDisabled: active || (!retryable && !ready),
    generateLabel: active
      ? task?.status === 'queued'
        ? '正在排队'
        : '正在生成'
      : retryable
        ? '重试生成'
        : '生成图片',
    submit: () => (retryable ? retry(id) : generate(id)),
    generateFromCurrent: () => generate(id),
    setRatio: (ratio: Ratio) => updateNode(id, { ratio }),
    setFailNext: (failNext: boolean) => updateNode(id, { failNext }),
  };
}
