import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange, type Connection, type Viewport, type XYPosition } from '@xyflow/react';
import { RESULT_SRC, SAMPLE_ASSETS, STORAGE_KEY } from '../constants';
import { restoreDocument, serializeDocument } from '../services/documentPersistence';
import type { Asset, CanvasDocument, CanvasNode, NodeData, Task } from '../types';
import { createEmptyDocument, getInputs, getLatestTask, isActiveTask, isValidConnection } from '../utils/graph';

export interface CanvasStore {
  doc: CanvasDocument;
  saveStatus: 'saved' | 'saving' | 'error';
  saveError?: string;
  recoveryBlocked: boolean;
  notice?: string;
  addImage: (sampleId: string, position: XYPosition) => string;
  addPrompt: (position: XYPosition) => string;
  addGenerator: (position: XYPosition) => string;
  updateNode: (id: string, data: Partial<NodeData>) => void;
  onNodesChange: (changes: NodeChange<CanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  connect: (connection: Connection) => void;
  deleteSelection: () => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setViewport: (viewport: Viewport) => void;
  generate: (nodeId: string) => void;
  retry: (nodeId: string) => void;
  flushSave: () => void;
  retrySave: () => void;
  startFresh: () => void;
  clearNotice: () => void;
}

type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>;
interface StoreOptions { storage?: StorageAdapter; now?: () => number; id?: () => string; autoFlushEvents?: boolean }
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

export function createCanvasStore(options: StoreOptions = {}) {
  const now = options.now ?? Date.now;
  const newId = options.id ?? (() => crypto.randomUUID());
  let storage = options.storage;
  let doc = createEmptyDocument();
  let recoveryBlocked = false;
  let restoreError: string | undefined;
  try {
    if (!storage && typeof window !== 'undefined') storage = window.localStorage;
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      try { doc = restoreDocument(raw, now()); }
      catch (error) { recoveryBlocked = true; restoreError = errorMessage(error); }
    }
  } catch (error) { restoreError = '本地存储不可用：' + errorMessage(error); }

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const taskTimers = new Set<ReturnType<typeof setTimeout>>();
  const store = create<CanvasStore>()((set, get) => {
    function commit(next: CanvasDocument, immediate = false) {
      set({ doc: next, ...(get().recoveryBlocked ? {} : { saveStatus: 'saving' as const, saveError: undefined }) });
      if (get().recoveryBlocked) return;
      if (saveTimer) clearTimeout(saveTimer);
      if (immediate) get().flushSave();
      else saveTimer = setTimeout(() => get().flushSave(), 140);
    }

    function removeNodes(ids: Set<string>, nextNodes?: CanvasNode[]) {
      const current = get().doc;
      commit({ ...current,
        nodes: nextNodes ?? current.nodes.filter(node => !ids.has(node.id)),
        edges: current.edges.filter(edge => !ids.has(edge.source) && !ids.has(edge.target)),
        tasks: current.tasks.map(task => ids.has(task.nodeId) && isActiveTask(task)
          ? { ...task, status: 'interrupted', error: '生成节点已删除，任务已中断。', updatedAt: now() } : task),
      }, true);
    }

    function addNode(type: 'image' | 'prompt' | 'generator', data: NodeData, position: XYPosition, asset?: Asset) {
      const id = newId();
      const current = get().doc;
      commit({ ...current,
        nodes: [...current.nodes.map(node => ({ ...node, selected: false })), { id, type, position, data, dragHandle: '.node-heading', selected: true }],
        edges: current.edges.map(edge => ({ ...edge, selected: false })),
        assets: asset ? { ...current.assets, [asset.id]: asset } : current.assets,
      });
      return id;
    }

    function later(callback: () => void, delay: number) {
      const timer = setTimeout(() => { taskTimers.delete(timer); callback(); }, delay);
      taskTimers.add(timer);
    }

    function submit(nodeId: string, previous?: Task) {
      const current = get().doc;
      const generator = current.nodes.find(node => node.id === nodeId && node.type === 'generator');
      if (!generator) return;
      if (current.tasks.some(task => task.nodeId === nodeId && isActiveTask(task))) {
        set({ notice: '该节点已有任务运行中，请等待完成。' }); return;
      }
      const inputs = getInputs(current, nodeId);
      if (!previous && (!inputs.image || !inputs.imageNodeId || !inputs.promptNodeId || !inputs.prompt?.trim())) {
        set({ notice: '请连接一张图片和非空提示词后再生成。' }); return;
      }
      if (previous && !current.assets[previous.input.imageAssetId]) {
        set({ notice: '原任务的图片资产缺失，无法重试。' }); return;
      }
      const timestamp = now();
      const task: Task = {
        id: newId(), nodeId,
        input: previous ? { ...previous.input } : {
          imageAssetId: inputs.image!.id, imageNodeId: inputs.imageNodeId!, promptNodeId: inputs.promptNodeId!, prompt: inputs.prompt!,
        },
        parameters: previous ? { ...previous.parameters } : { ratio: generator.data.ratio ?? '4:3' },
        fail: previous ? false : !!generator.data.failNext,
        status: 'queued', createdAt: timestamp, updatedAt: timestamp,
      };
      commit({ ...current, tasks: [...current.tasks, task], nodes: current.nodes.map(node => node.id === nodeId ? { ...node, data: { ...node.data, failNext: false } } : node) }, true);
      set({ notice: undefined });
      later(() => {
        const queued = get().doc;
        const owned = queued.tasks.find(item => item.id === task.id);
        if (owned?.status !== 'queued' || !queued.nodes.some(node => node.id === nodeId)) return;
        commit({ ...queued, tasks: queued.tasks.map(item => item.id === task.id ? { ...item, status: 'running', updatedAt: now() } : item) }, true);
        later(() => finish(task.id), 1600);
      }, 600);
    }

    function finish(taskId: string) {
      const current = get().doc;
      const task = current.tasks.find(item => item.id === taskId);
      const generator = current.nodes.find(node => node.id === task?.nodeId && node.type === 'generator');
      if (!task || task.status !== 'running' || !generator) return;
      if (task.fail) {
        commit({ ...current, tasks: current.tasks.map(item => item.id === taskId ? { ...item, status: 'failed', error: '已触发测试失败：Mock 服务暂时不可用。输入与参数已保留，可以重试。', updatedAt: now() } : item) }, true);
        return;
      }
      const [width, height] = task.parameters.ratio === '16:9' ? [1280, 720] : task.parameters.ratio === '1:1' ? [960, 960] : [960, 720];
      const asset: Asset = { id: newId(), name: '暮色幻想', src: RESULT_SRC, width, height, createdAt: now(), origin: 'generated', taskId };
      const resultIndex = current.tasks.filter(item => item.nodeId === task.nodeId && item.status === 'succeeded').length;
      const node: CanvasNode = { id: newId(), type: 'image', position: { x: generator.position.x + 390, y: generator.position.y + resultIndex * 400 }, data: { label: '生成结果', assetId: asset.id }, dragHandle: '.node-heading' };
      commit({ ...current,
        assets: { ...current.assets, [asset.id]: asset }, nodes: [...current.nodes, node],
        tasks: current.tasks.map(item => item.id === taskId ? { ...item, status: 'succeeded', updatedAt: now(), resultAssetId: asset.id } : item),
      }, true);
    }

    return {
      doc, recoveryBlocked, saveStatus: restoreError ? 'error' : 'saved', saveError: restoreError,
      addImage(sampleId, position) {
        const sample = SAMPLE_ASSETS.find(item => item.id === sampleId);
        if (!sample) { set({ notice: '找不到该内置图片。' }); return ''; }
        const asset: Asset = { ...sample, id: newId(), createdAt: now(), origin: 'sample' };
        return addNode('image', { label: '参考图片', assetId: asset.id }, position, asset);
      },
      addPrompt: position => addNode('prompt', { label: '提示词', text: '' }, position),
      addGenerator: position => addNode('generator', { label: '图片生成', ratio: '4:3', failNext: false }, position),
      updateNode(id, data) { commit({ ...get().doc, nodes: get().doc.nodes.map(node => node.id === id ? { ...node, data: { ...node.data, ...data } } : node) }); },
      onNodesChange(changes) {
        const removed = new Set(changes.filter(change => change.type === 'remove').map(change => change.id));
        const nodes = applyNodeChanges(changes, get().doc.nodes);
        if (removed.size) removeNodes(removed, nodes);
        else commit({ ...get().doc, nodes });
      },
      onEdgesChange(changes) { commit({ ...get().doc, edges: applyEdgeChanges(changes, get().doc.edges) }); },
      connect(connection) {
        if (!isValidConnection(get().doc, connection)) { set({ notice: '连接无效：请连接对应输入端口，每种输入限一个。' }); return; }
        commit({ ...get().doc, edges: [...get().doc.edges, { ...connection, id: newId(), type: 'default' }] });
      },
      deleteNode: id => removeNodes(new Set([id])),
      deleteEdge(id) { commit({ ...get().doc, edges: get().doc.edges.filter(edge => edge.id !== id) }); },
      deleteSelection() {
        const current = get().doc;
        removeNodes(new Set(current.nodes.filter(node => node.selected).map(node => node.id)));
        commit({ ...get().doc, edges: get().doc.edges.filter(edge => !edge.selected) }, true);
      },
      setViewport(viewport) { commit({ ...get().doc, viewport }); },
      generate: nodeId => submit(nodeId),
      retry(nodeId) {
        const task = getLatestTask(get().doc, nodeId);
        if (task?.status === 'failed' || task?.status === 'interrupted') submit(nodeId, task);
      },
      flushSave() {
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = undefined; }
        if (get().recoveryBlocked) return;
        try {
          if (!storage) throw new Error('当前环境不支持本地存储');
          storage.setItem(STORAGE_KEY, serializeDocument(get().doc));
          set({ saveStatus: 'saved', saveError: undefined });
        } catch (error) { set({ saveStatus: 'error', saveError: '数据尚未保存：' + errorMessage(error) }); }
      },
      retrySave() { get().flushSave(); },
      startFresh() {
        taskTimers.forEach(clearTimeout); taskTimers.clear();
        set({ recoveryBlocked: false, notice: undefined });
        commit(createEmptyDocument(), true);
      },
      clearNotice() { set({ notice: undefined }); },
    };
  });
  if (!recoveryBlocked && storage && !restoreError) store.getState().flushSave();
  if (options.autoFlushEvents && typeof window !== 'undefined') {
    window.addEventListener('pagehide', store.getState().flushSave);
    window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.getState().flushSave(); });
  }
  return store;
}

export const useCanvasStore = createCanvasStore({ autoFlushEvents: true });
