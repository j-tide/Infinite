import { X } from 'lucide-react';

interface HelpPanelProps {
  open: boolean;
  onClose(): void;
}

export function HelpPanel({ open, onClose }: HelpPanelProps) {
  if (!open) return null;
  return (
        <div className="help-panel"><div><strong>三步，开始创作</strong><button aria-label="关闭指南" onClick={onClose}><X size={16} /></button></div><ol><li>从左侧添加图片、提示词和生成节点。</li><li>将右侧输出端口拖到生成节点对应的输入端口。</li><li>选择比例，点击生成。结果仍可连接到下一节点。</li></ol><p>拖动节点标题移动 · 点击连线后 Delete 删除<br />勾选“下次生成失败”可测试失败与重试。</p></div>
  );
}
