import { X } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';

interface HelpPanelProps {
  open: boolean;
  onClose(): void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  if (!open) return null;
  return (
    <div className="absolute right-4.5 top-3 z-20 w-77.5 rounded-control border border-help-border bg-help p-4.25 text-[11px] text-help-text shadow-help backdrop-blur-[10px]">
      <div className="flex items-center justify-between">
        <strong>三步，开始创作</strong>
        <IconButton
          size="xs"
          className="text-close-icon"
          label="关闭指南"
          onClick={onClose}
        >
          <X size={16} />
        </IconButton>
      </div>
      <ol className="pl-4.25 text-[11px] leading-[1.9]">
        <li>从左侧添加图片、提示词和生成节点。</li>
        <li>将右侧输出端口拖到生成节点对应的输入端口。</li>
        <li>选择比例，点击生成。结果仍可连接到下一节点。</li>
      </ol>
      <p className="border-t border-help-rule pt-3.25 text-[9px] leading-[1.8] text-help-caption">
        拖动节点标题移动 · 点击连线后 Delete 删除
        <br />
        勾选“下次生成失败”可测试失败与重试。
      </p>
    </div>
  );
}
