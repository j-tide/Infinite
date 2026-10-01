import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertCircle, Check, Image as ImageIcon, LoaderCircle, RotateCcw, Sparkles, Trash2, Type, ArrowUpRight } from 'lucide-react';
import { getInputs, getLatestTask } from '../features/canvas/utils/graph';
import type { CanvasNode } from '../features/canvas/types';
import { useCanvasStore } from '../features/canvas/store/canvasStore';
import './nodes.css';

function Heading({ id, label, kind }: { id: string; label: string; kind: 'image' | 'prompt' | 'generator' }) {
  const deleteNode = useCanvasStore(s => s.deleteNode);
  const Icon = kind === 'image' ? ImageIcon : kind === 'prompt' ? Type : Sparkles;
  return <header className="node-heading"><span className={'heading-icon ' + kind}><Icon size={15} /></span><strong>{label}</strong><button className="node-delete nodrag nopan" title="删除节点" aria-label={'删除' + label} onClick={() => deleteNode(id)}><Trash2 size={13} /></button></header>;
}

function ImageNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const asset = useCanvasStore(s => s.doc.assets[data.assetId ?? '']);
  const generated = asset?.origin === 'generated';
  return <article className={'canvas-node image-card ' + (selected ? 'is-selected' : '')} data-testid="image-node">
    <Heading id={id} label={data.label} kind="image" />
    <div className="image-card-body">{asset ? <><div className="node-image-wrap" style={{ aspectRatio: `${asset.width}/${asset.height}` }}><img src={asset.src} alt={asset.name} draggable={false} /><span className={'image-origin ' + (generated ? 'generated' : '')}>{generated ? <Sparkles size={10} /> : <ImageIcon size={10} />}{generated ? 'Mock 生成结果' : '内置示例'}</span></div><div className="image-metadata"><span>{asset.name}</span><span>{asset.width} × {asset.height}</span></div>{generated && <div className="asset-reference">资产 {asset.id.slice(0, 8)}<span>可继续作为输入</span></div>}</> : <div className="missing-image"><ImageIcon size={24} /><span>图片资源缺失</span></div>}</div>
    <footer className="node-footer"><span><span className="port-dot image-port" />图片输出</span><ArrowUpRight size={12} /></footer>
    <Handle id="output" type="source" position={Position.Right} className="image-handle" />
  </article>;
}

function PromptNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const updateNode = useCanvasStore(s => s.updateNode);
  return <article className={'canvas-node prompt-card ' + (selected ? 'is-selected' : '')} data-testid="prompt-node">
    <Heading id={id} label={data.label} kind="prompt" />
    <div className="prompt-card-body"><label className="field-caption" htmlFor={'prompt-' + id}>描述你的想象</label><textarea id={'prompt-' + id} aria-label="提示词内容" className="nodrag nopan nowheel" placeholder="例如：紫色暮光下的山谷，柔和的光线，梦幻的氛围……" value={data.text ?? ''} onChange={e => updateNode(id, { text: e.target.value })} /><div className="prompt-meta"><span>连接到生成节点，赋予画面新意</span><span>{(data.text ?? '').length}</span></div></div>
    <footer className="node-footer"><span><span className="port-dot prompt-port" />提示词输出</span><ArrowUpRight size={12} /></footer>
    <Handle id="output" type="source" position={Position.Right} className="prompt-handle" />
  </article>;
}

const taskLabels = { queued: '排队中', running: '生成中', succeeded: '已完成', failed: '生成失败', interrupted: '已中断' };

function GeneratorNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const store = useCanvasStore();
  const inputs = getInputs(store.doc, id);
  const task = getLatestTask(store.doc, id);
  const active = task?.status === 'queued' || task?.status === 'running';
  const retryable = task?.status === 'failed' || task?.status === 'interrupted';
  const ready = !!inputs.image && !!inputs.prompt?.trim();
  return <article className={'canvas-node generator-card ' + (selected ? 'is-selected' : '') + (active ? ' is-generating' : '')} data-testid="generator-node">
    <Heading id={id} label={data.label} kind="generator" />
    <div className="generator-card-body">
      <div className="generator-intro"><span>IMAGE GENERATOR</span><span>MOCK</span></div>
      <div className="input-section">
        <div className={'input-slot image-slot ' + (inputs.image ? 'connected' : '')}><Handle id="image" type="target" position={Position.Left} className="image-handle" /><div className="input-label"><ImageIcon size={12} />参考图片<span>{inputs.image ? '已连接' : '未连接'}</span></div>{inputs.image ? <div className="connected-image"><img src={inputs.image.src} alt={'输入 ' + inputs.image.name} /><span>{inputs.image.name}</span><Check size={12} /></div> : <div className="input-placeholder">连接一个图片节点</div>}</div>
        <div className={'input-slot prompt-slot ' + (inputs.prompt !== undefined ? 'connected' : '')}><Handle id="prompt" type="target" position={Position.Left} className="prompt-handle" /><div className="input-label"><Type size={12} />提示词<span>{inputs.prompt !== undefined ? '已连接' : '未连接'}</span></div><p className="connected-prompt nowheel nodrag nopan">{inputs.prompt || (inputs.prompt !== undefined ? '请输入提示词内容' : '连接一个提示词节点')}</p></div>
      </div>
      <div className="ratio-field"><label htmlFor={'ratio-' + id}>画面比例</label><select id={'ratio-' + id} className="nodrag nopan" aria-label="生成比例" disabled={active} value={data.ratio ?? '4:3'} onChange={e => store.updateNode(id, { ratio: e.target.value as '1:1' | '4:3' | '16:9' })}><option value="1:1">1:1　方形</option><option value="4:3">4:3　横向</option><option value="16:9">16:9　宽屏</option></select></div>
      <label className="failure-option nodrag nopan"><input type="checkbox" aria-label="下次生成失败" checked={data.failNext ?? false} disabled={active} onChange={e => store.updateNode(id, { failNext: e.target.checked })} /><span>下次生成失败</span><span className="failure-hint">测试开关 · 单次生效</span></label>
      {task && <div className={'task-feedback task-' + task.status}>
        <div className="task-status" role="status">{active ? <LoaderCircle size={14} className="animate-spinning" /> : task.status === 'succeeded' ? <Check size={14} /> : <AlertCircle size={14} />}<strong>{taskLabels[task.status]}</strong><span>{task.parameters.ratio}</span></div>
        {task.error && <p className="task-error">{task.error}</p>}<div className="task-reference">任务 {task.id.slice(0, 8)}</div>
        {retryable && <div className="retry-note">重试使用该任务保存的输入与参数</div>}
      </div>}
      <button className="generate-button nodrag nopan" aria-label={retryable ? '重试生成' : '生成图片'} disabled={active || (!retryable && !ready)} onClick={() => retryable ? store.retry(id) : store.generate(id)}>{active ? <LoaderCircle size={15} className="animate-spinning" /> : retryable ? <RotateCcw size={15} /> : <Sparkles size={15} />}{active ? (task?.status === 'queued' ? '正在排队' : '正在生成') : retryable ? '重试生成' : '生成图片'}{!active && !retryable && <span>↗</span>}</button>
      {retryable && ready && <button className="current-input-button nodrag nopan" onClick={() => store.generate(id)}>使用当前输入重新生成</button>}
      {!task && <p className="generation-note">{ready ? '已准备好 · 约 2 秒完成 mock 生成' : '连接图片与提示词后，即可开始生成'}</p>}
      {task?.status === 'succeeded' && <p className="generation-note">结果已添加到画布右侧，内容为固定示例图片</p>}
    </div>
  </article>;
}

export const nodeTypes = { image: ImageNode, prompt: PromptNode, generator: GeneratorNode };
