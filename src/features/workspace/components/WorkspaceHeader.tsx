import { Check, ChevronRight, CircleHelp, Infinity as InfinityIcon, LoaderCircle } from 'lucide-react';
import { useCanvasStore } from '../../canvas/store/canvasStore';

interface WorkspaceHeaderProps {
  helpOpen: boolean;
  onToggleHelp(): void;
}

export function WorkspaceHeader({ helpOpen, onToggleHelp }: WorkspaceHeaderProps) {
  const saveStatus = useCanvasStore(state => state.saveStatus);
  return (
    <header className="app-header">
      <a className="brand" href="/" aria-label="Infinite 首页"><span className="brand-symbol"><InfinityIcon size={27} strokeWidth={2.4} /></span><span>infinite<span className="brand-dot">.</span></span></a>
      <div className="header-divider" />
      <div className="project-title"><span>灵感实验室</span><ChevronRight size={14} /><span className="muted">创作画布</span></div>
      <span className="local-badge">本地项目</span>
      <div className="header-actions">
        <span className={'save-indicator ' + saveStatus} role="status">
          {saveStatus === 'saved' ? <Check size={14} /> : saveStatus === 'saving' ? <LoaderCircle size={14} className="spinning" /> : <span className="error-dot" />}
          {saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中' : '保存失败'}
        </span>
        <button className={'guide-button ' + (helpOpen ? 'active' : '')} onClick={onToggleHelp} aria-label="操作指南"><CircleHelp size={16} /><span>操作指南</span></button>
        <span className="user-avatar">I</span>
      </div>
    </header>
  );
}
