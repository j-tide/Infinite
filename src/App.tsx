import { useRef, useState } from 'react';
import { Background, BackgroundVariant, ReactFlow, ReactFlowProvider, useReactFlow, type Edge, type XYPosition } from '@xyflow/react';
import { ArrowDownRight, ArrowRight, Check, ChevronRight, CircleHelp, Command, ImagePlus, Infinity as InfinityIcon, Layers3, LoaderCircle, Minus, MousePointer2, Plus, Scan, Sparkles, Trash2, Type, X } from 'lucide-react';
import { SAMPLE_ASSETS, isValidConnection, type CanvasNode } from './domain';
import { useCanvasStore } from './store';
import { nodeTypes } from './components/CanvasNodes';

function Workspace() {
  const store = useCanvasStore();
  const { doc } = store;
  const flow = useReactFlow<CanvasNode, Edge>();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const selected = doc.nodes.some(n => n.selected) || doc.edges.some(e => e.selected);
  const activeTasks = doc.tasks.filter(t => t.status === 'queued' || t.status === 'running').length;

  function placement(type: 'image' | 'prompt' | 'generator'): XYPosition {
    const rect = canvasRef.current!.getBoundingClientRect();
    const position = flow.screenToFlowPosition({
      x: rect.left + (type === 'generator' ? Math.min(430, rect.width * .49) : 60),
      y: rect.top + (type === 'prompt' ? Math.min(420, rect.height * .55) : 110),
    });
    const width = type === 'generator' ? 320 : 280;
    const height = type === 'generator' ? 490 : type === 'prompt' ? 250 : 340;
    // Find free space in world coordinates; repeated additions remain individually operable.
    for (let attempt = 0; attempt < 100; attempt++) {
      const occupied = doc.nodes.some(node => {
        const otherWidth = node.measured?.width ?? (node.type === 'generator' ? 320 : 280);
        const otherHeight = node.measured?.height ?? (node.type === 'generator' ? 490 : 340);
        return position.x < node.position.x + otherWidth + 28 && position.x + width + 28 > node.position.x
          && position.y < node.position.y + otherHeight + 28 && position.y + height + 28 > node.position.y;
      });
      if (!occupied) return position;
      position.y += 80;
    }
    return position;
  }

  function addImage(sampleId = SAMPLE_ASSETS[0].id) { store.addImage(sampleId, placement('image')); }
  function addPrompt() { store.addPrompt(placement('prompt')); }
  function addGenerator() { store.addGenerator(placement('generator')); }
  const fit = () => void flow.fitView({ padding: .16, maxZoom: 1, duration: 250 });

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href="/" aria-label="Infinite 首页"><span className="brand-symbol"><InfinityIcon size={27} strokeWidth={2.4} /></span><span>infinite<span className="brand-dot">.</span></span></a>
      <div className="header-divider" />
      <div className="project-title"><span>灵感实验室</span><ChevronRight size={14} /><span className="muted">创作画布</span></div>
      <span className="local-badge">本地项目</span>
      <div className="header-actions">
        <span className={'save-indicator ' + store.saveStatus} role="status">
          {store.saveStatus === 'saved' ? <Check size={14} /> : store.saveStatus === 'saving' ? <LoaderCircle size={14} className="spinning" /> : <span className="error-dot" />}
          {store.saveStatus === 'saved' ? '已保存' : store.saveStatus === 'saving' ? '保存中' : '保存失败'}
        </span>
        <button className={'guide-button ' + (helpOpen ? 'active' : '')} onClick={() => setHelpOpen(!helpOpen)} aria-label="操作指南"><CircleHelp size={16} /><span>操作指南</span></button>
        <span className="user-avatar">I</span>
      </div>
    </header>

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

    <main className="canvas-workspace">
      <div className="canvas-toolbar"><div className="canvas-crumb"><span className="live-dot" />自由创作<span className="canvas-count">{doc.nodes.length} 个节点<span>·</span>{doc.edges.length} 条连接</span></div><div className="toolbar-right">{activeTasks > 0 && <span className="active-task"><LoaderCircle size={13} className="spinning" />{activeTasks} 个任务运行中</span>}{selected && <button className="selection-delete" aria-label="删除所选" onClick={store.deleteSelection}><Trash2 size={14} />删除所选</button>}<span className="toolbar-mock">Mock 模式</span></div></div>
      <div ref={canvasRef} className="canvas-surface" data-testid="canvas-surface">
        <ReactFlow<CanvasNode, Edge>
          nodes={doc.nodes} edges={doc.edges} nodeTypes={nodeTypes}
          onNodesChange={store.onNodesChange} onEdgesChange={store.onEdgesChange}
          onConnect={store.connect} isValidConnection={c => isValidConnection(doc, c)}
          viewport={doc.viewport} onViewportChange={store.setViewport}
          minZoom={.25} maxZoom={2} panOnDrag={[0, 1, 2]} zoomOnScroll panOnScroll={false}
          zoomOnDoubleClick={false} nodeDragThreshold={0} selectionOnDrag={false} selectionKeyCode={null}
          deleteKeyCode={['Backspace', 'Delete']} multiSelectionKeyCode={null}
          defaultEdgeOptions={{ type: 'default', style: { stroke: '#8e81b6', strokeWidth: 2 }, interactionWidth: 22 }}
          onPaneClick={() => {
            store.onNodesChange(doc.nodes.filter(n => n.selected).map(n => ({ id: n.id, type: 'select' as const, selected: false })));
            store.onEdgesChange(doc.edges.filter(e => e.selected).map(e => ({ id: e.id, type: 'select' as const, selected: false })));
          }}
          colorMode="dark" aria-label="无限创作画布"
        ><Background variant={BackgroundVariant.Dots} color="#35343e" gap={24} size={1} /></ReactFlow>

        {doc.nodes.length === 0 && <div className="empty-canvas">
          <div className="empty-illustration" aria-hidden="true"><div className="illustration-orbit" /><div className="mini-card mini-image"><img src={SAMPLE_ASSETS[0].src} alt="" /><div><span /><span /></div></div><div className="mini-connector" /><div className="mini-card mini-prompt"><Type size={16} /><span /><span /><span /></div><div className="mini-spark"><Sparkles size={27} /></div><span className="orbit-point one" /><span className="orbit-point two" /></div>
          <span className="empty-eyebrow">A SPACE FOR YOUR NEXT IDEA</span><h1>让想象，<span>无限延伸</span></h1><p>放入图片，写下灵感。<br />连接它们，让下一次创作在这里发生。</p><button className="empty-action" onClick={addPrompt}><Plus size={17} />添加第一条提示词<ArrowRight size={16} /></button><div className="empty-flow"><span>添加节点</span><ChevronRight size={12} /><span>连接输入</span><ChevronRight size={12} /><span>开始创作</span></div>
        </div>}

        <div className="canvas-controls"><span className="cursor-mode" title="拖动空白平移"><MousePointer2 size={18} /></span><span className="control-divider" /><button aria-label="缩小画布" title="缩小" onClick={() => void flow.zoomOut({ duration: 150 })}><Minus size={17} /></button><span className="zoom-value">{Math.round(doc.viewport.zoom * 100)}%</span><button aria-label="放大画布" title="放大" onClick={() => void flow.zoomIn({ duration: 150 })}><Plus size={17} /></button><span className="control-divider" /><button aria-label="适配画布" title="适配画布" disabled={!doc.nodes.length} onClick={fit}><Scan size={18} /></button></div>
        <div className="canvas-instruction"><Command size={12} /><span>拖动空白平移</span><span>·</span><span>滚轮缩放</span><span>·</span><span>拖动端口连接</span></div>

        {helpOpen && <div className="help-panel"><div><strong>三步，开始创作</strong><button aria-label="关闭指南" onClick={() => setHelpOpen(false)}><X size={16} /></button></div><ol><li>从左侧添加图片、提示词和生成节点。</li><li>将右侧输出端口拖到生成节点对应的输入端口。</li><li>选择比例，点击生成。结果仍可连接到下一节点。</li></ol><p>拖动节点标题移动 · 点击连线后 Delete 删除<br />勾选“下次生成失败”可测试失败与重试。</p></div>}
        {store.notice && <div className="notice-toast" role="alert"><CircleHelp size={16} /><span>{store.notice}</span><button aria-label="关闭提示" onClick={store.clearNotice}><X size={14} /></button></div>}
      </div>
      <footer className="canvas-footer"><span><span className="live-dot" /> 所有图片资源均保存在项目内</span><span>连接你的灵感<ArrowDownRight size={12} /></span></footer>
    </main>

    {store.saveStatus === 'error' && <div className="storage-banner" role="alert"><span><strong>{store.recoveryBlocked ? '恢复失败' : '保存失败'}</strong> · {store.saveError}</span><button onClick={store.recoveryBlocked ? store.startFresh : store.retrySave}>{store.recoveryBlocked ? '新建本地画布' : '重试保存'}</button></div>}
  </div>;
}

export default function App() { return <ReactFlowProvider><Workspace /></ReactFlowProvider>; }
