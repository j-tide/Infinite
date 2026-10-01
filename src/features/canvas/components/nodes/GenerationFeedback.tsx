import { AlertCircle, Check, LoaderCircle } from 'lucide-react';
import { cn } from '../../../../lib/cn';
import type { Task, TaskStatus } from '../../types';

const taskLabels: Record<TaskStatus, string> = {
  queued: '排队中',
  running: '生成中',
  succeeded: '已完成',
  failed: '生成失败',
  interrupted: '已中断',
};

interface GenerationFeedbackProps {
  task: Task;
  active: boolean;
  retryable: boolean;
}

export function GenerationFeedback({
  task,
  active,
  retryable,
}: GenerationFeedbackProps) {
  const succeeded = task.status === 'succeeded';
  return (
    <div
      className={cn(
        'mb-2.75 rounded-field border p-2.25',
        succeeded
          ? 'border-node-task-success-border bg-node-task-success'
          : retryable
            ? 'border-node-task-failure-border bg-node-task-failure'
            : 'border-node-task-border bg-node-task',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 text-[9px]',
          succeeded
            ? 'text-node-task-success-text'
            : retryable
              ? 'text-node-task-failure-text'
              : 'text-node-task-text',
        )}
        role="status"
      >
        {active ? (
          <LoaderCircle size={14} className="animate-spinning" />
        ) : succeeded ? (
          <Check size={14} />
        ) : (
          <AlertCircle size={14} />
        )}
        <strong className="font-medium">{taskLabels[task.status]}</strong>
        <span className="ml-auto text-[8px] text-node-task-ratio">
          {task.parameters.ratio}
        </span>
      </div>
      {task.error && (
        <p className="mt-1.75 mb-1.25 text-[8px] leading-[1.65] text-node-task-error">
          {task.error}
        </p>
      )}
      <div className="mt-1.5 text-[7px] text-node-task-reference">
        任务 {task.id.slice(0, 8)}
      </div>
      {retryable && (
        <div className="mt-1.25 text-[7px] text-node-task-retry">
          重试使用该任务保存的输入与参数
        </div>
      )}
    </div>
  );
}
