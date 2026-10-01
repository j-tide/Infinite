import { ImagePlus, Layers3, Plus, Sparkles, Type } from 'lucide-react';
import { SAMPLE_ASSETS } from '../../canvas/constants';
import type { CanvasCreationActions } from '../../canvas/hooks/useCanvasCreation';

export function WorkspaceSidebar({ creation }: { creation: CanvasCreationActions }) {
  const { addImage, addPrompt, addGenerator } = creation;
  return (
    <aside className="sidebar">
      <div className="sidebar-caption"><span>WORKSPACE</span><span className="version-pill">P0</span></div>
      <div className="workspace-link"><Layers3 size={17} /><span>无限画布</span><span className="workspace-dot" /></div>
      <div className="section-title"><span>创作工具</span><span>添加到画布</span></div>
      <div className="creation-tools">
        <button className="tool-button" aria-label="添加图片节点" onClick={() => addImage()}><span className="tool-icon mint"><ImagePlus size={20} /></span><span><strong>图片</strong><small>从一张参考图开始</small></span><Plus size={15} className="tool-plus" /></button>
        <button className="tool-button" aria-label="添加提示词节点" onClick={addPrompt}><span className="tool-icon peach"><Type size={20} /></span><span><strong>提示词</strong><small>写下你的创作灵感</small></span><Plus size={15} className="tool-plus" /></button>
        <button className="tool-button generator-tool" aria-label="添加生成节点" onClick={addGenerator}><span className="tool-icon lavender"><Sparkles size={20} /></span><span><strong>图片生成</strong><small>连接输入，探索新可能</small></span><Plus size={15} className="tool-plus" /></button>
      </div>
      <div className="sidebar-rule" />
      <div className="section-title"><span>灵感素材</span><span>内置示例</span></div>
      <div className="sample-grid">
        {SAMPLE_ASSETS.map((asset, i) => <button key={asset.id} className={'sample-button sample-' + i} onClick={() => addImage(asset.id)} aria-label={'添加素材 ' + asset.name}>
          <div className="sample-image"><img src={asset.src} alt={asset.name} /><span><Plus size={16} /></span></div><strong>{asset.name}</strong><small>{['光影 · 沙丘', '自然 · 山峦', '色彩 · 花境'][i]}</small>
        </button>)}
      </div>
      <div className="sidebar-spacer" />
      <div className="local-note"><span className="note-spark"><Sparkles size={16} /></span><strong>让灵感，自由生长。</strong><p>图片、文字与想象力，<br />都能在这里找到连接。</p><span className="mock-tag"><span />MOCK 创作演示</span></div>
      <div className="sidebar-footer"><span>INFINITE CANVAS</span><span>v0.1</span></div>
    </aside>
  );
}
