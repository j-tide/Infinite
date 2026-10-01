import type { Connection, Edge, Node, Viewport, XYPosition } from '@xyflow/react'

export type NodeKind = 'image' | 'prompt' | 'generator'
export type Ratio = '1:1' | '4:3' | '16:9'
export interface NodeData extends Record<string, unknown> {
  label: string
  assetId?: string
  text?: string
  ratio?: Ratio
  failNext?: boolean
}
export type CanvasNode = Node<NodeData, NodeKind>
export interface Asset {
  id: string
  name: string
  src: string
  width: number
  height: number
  createdAt: number
  origin: 'sample' | 'generated'
  taskId?: string
}
export type TaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'interrupted'
export interface Task {
  id: string
  nodeId: string
  input: { imageAssetId: string; imageNodeId: string; promptNodeId: string; prompt: string }
  parameters: { ratio: Ratio }
  status: TaskStatus
  createdAt: number
  updatedAt: number
  error?: string
  resultAssetId?: string
  fail: boolean
}
export interface CanvasDocument {
  version: 1
  nodes: CanvasNode[]
  edges: Edge[]
  assets: Record<string, Asset>
  tasks: Task[]
  viewport: Viewport
}

export const STORAGE_KEY = 'infinite-canvas:v1'
export const SAMPLE_ASSETS = [
  { id: 'dune', name: '沙丘光影', src: '/samples/dune.svg', width: 960, height: 720 },
  { id: 'alpine', name: '山间晨雾', src: '/samples/alpine.svg', width: 960, height: 720 },
  { id: 'bloom', name: '花境色彩', src: '/samples/bloom.svg', width: 960, height: 720 },
]
export const RESULT_SRC = '/samples/result.svg'
export const isActiveTask = (task: Task) => task.status === 'queued' || task.status === 'running'

export function createEmptyDocument(): CanvasDocument {
  return { version: 1, nodes: [], edges: [], assets: {}, tasks: [], viewport: { x: 0, y: 0, zoom: 1 } }
}

export function getLatestTask(doc: CanvasDocument, nodeId: string): Task | undefined {
  for (let index = doc.tasks.length - 1; index >= 0; index -= 1) {
    if (doc.tasks[index].nodeId === nodeId) return doc.tasks[index]
  }
  return undefined
}

export function getInputs(doc: CanvasDocument, nodeId: string): {
  image?: Asset; prompt?: string; imageNodeId?: string; promptNodeId?: string
} {
  const input: ReturnType<typeof getInputs> = {}
  for (const edge of doc.edges.filter((edge) => edge.target === nodeId)) {
    const source = doc.nodes.find((node) => node.id === edge.source)
    if (source?.type === 'image' && edge.targetHandle === 'image' && source.data.assetId) {
      input.image = doc.assets[source.data.assetId]
      input.imageNodeId = source.id
    }
    if (source?.type === 'prompt' && edge.targetHandle === 'prompt') {
      input.prompt = source.data.text ?? ''
      input.promptNodeId = source.id
    }
  }
  return input
}

export function isValidConnection(doc: CanvasDocument, connection: Connection | Edge): boolean {
  const source = doc.nodes.find((node) => node.id === connection.source)
  const target = doc.nodes.find((node) => node.id === connection.target)
  if (!source || !target || source.id === target.id || target.type !== 'generator') return false
  if (connection.sourceHandle !== 'output') return false
  if (source.type !== 'image' && source.type !== 'prompt') return false
  if (connection.targetHandle !== source.type) return false
  return !doc.edges.some((edge) => edge.target === target.id && edge.targetHandle === source.type)
}

export function screenToWorld(position: XYPosition, viewport: Viewport): XYPosition {
  return { x: (position.x - viewport.x) / viewport.zoom, y: (position.y - viewport.y) / viewport.zoom }
}

/** Persist domain fields only. React Flow selection and measurements are session state. */
export function serializeDocument(doc: CanvasDocument): string {
  return JSON.stringify({
    version: doc.version,
    nodes: doc.nodes.map(({ id, type, position, data }) => ({
      id, type, position: { x: position.x, y: position.y }, data, dragHandle: '.node-heading',
    })),
    edges: doc.edges.map(({ id, source, target, sourceHandle, targetHandle, type }) => ({
      id, source, target, sourceHandle, targetHandle, type,
    })),
    assets: doc.assets,
    tasks: doc.tasks,
    viewport: doc.viewport,
  })
}

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`保存数据无效：${message}`)
}
function record(value: unknown, name: string): Record<string, unknown> {
  ensure(value !== null && typeof value === 'object' && !Array.isArray(value), `${name} 格式不正确`)
  return value as Record<string, unknown>
}
function textField(value: unknown, name: string, allowEmpty = false): string {
  ensure(typeof value === 'string' && (allowEmpty || value.trim().length > 0), `${name} 格式不正确`)
  return value
}
function idField(value: unknown, name: string): string {
  const id = textField(value, name)
  ensure(!['__proto__', 'constructor', 'prototype'].includes(id), `${name} 不可使用保留字段`)
  return id
}
function finite(value: unknown, name: string): number {
  ensure(typeof value === 'number' && Number.isFinite(value), `${name} 必须是有限数值`)
  return value
}
function ratioField(value: unknown): Ratio {
  ensure(value === '1:1' || value === '4:3' || value === '16:9', '图片比例不支持')
  return value
}

function restoreNode(value: unknown): CanvasNode {
  const node = record(value, '节点')
  const id = idField(node.id, '节点 ID')
  ensure(node.type === 'image' || node.type === 'prompt' || node.type === 'generator', '节点类型不支持')
  const position = record(node.position, '节点位置')
  const originalData = record(node.data, '节点内容')
  const data: NodeData = { label: textField(originalData.label, '节点名称') }
  if (node.type === 'image') data.assetId = idField(originalData.assetId, '图片资产引用')
  if (node.type === 'prompt') data.text = textField(originalData.text, '提示词', true)
  if (node.type === 'generator') {
    data.ratio = ratioField(originalData.ratio ?? '1:1')
    ensure(originalData.failNext === undefined || typeof originalData.failNext === 'boolean', '失败控制格式不正确')
    data.failNext = originalData.failNext ?? false
  }
  return {
    id, type: node.type, position: { x: finite(position.x, '节点 X'), y: finite(position.y, '节点 Y') },
    data, dragHandle: '.node-heading',
  }
}

function restoreAsset(value: unknown, key: string): Asset {
  const asset = record(value, '资产')
  const id = idField(asset.id, '资产 ID')
  ensure(id === key, '资产索引与 ID 不一致')
  const src = textField(asset.src, '图片路径')
  ensure(SAMPLE_ASSETS.some((sample) => sample.src === src) || src === RESULT_SRC, '图片不是内置资源')
  ensure(asset.origin === 'sample' || asset.origin === 'generated', '资产来源不支持')
  const width = finite(asset.width, '资产宽度')
  const height = finite(asset.height, '资产高度')
  ensure(width > 0 && height > 0, '资产尺寸必须大于零')
  return {
    id, name: textField(asset.name, '资产名称'), src, width, height,
    createdAt: finite(asset.createdAt, '资产创建时间'), origin: asset.origin,
    ...(asset.taskId === undefined ? {} : { taskId: idField(asset.taskId, '资产任务引用') }),
  }
}

function restoreTask(value: unknown): Task {
  const task = record(value, '任务')
  const input = record(task.input, '任务输入')
  const parameters = record(task.parameters, '任务参数')
  ensure(['queued', 'running', 'succeeded', 'failed', 'interrupted'].includes(String(task.status)), '任务状态不支持')
  ensure(typeof task.fail === 'boolean', '任务失败控制格式不正确')
  return {
    id: idField(task.id, '任务 ID'), nodeId: idField(task.nodeId, '生成节点引用'),
    input: {
      imageAssetId: idField(input.imageAssetId, '任务图片资产引用'),
      imageNodeId: idField(input.imageNodeId, '任务图片节点引用'),
      promptNodeId: idField(input.promptNodeId, '任务提示词节点引用'),
      prompt: textField(input.prompt, '任务提示词'),
    },
    parameters: { ratio: ratioField(parameters.ratio) }, status: task.status as TaskStatus,
    createdAt: finite(task.createdAt, '任务创建时间'), updatedAt: finite(task.updatedAt, '任务更新时间'),
    fail: task.fail,
    ...(task.error === undefined ? {} : { error: textField(task.error, '任务错误原因') }),
    ...(task.resultAssetId === undefined ? {} : { resultAssetId: idField(task.resultAssetId, '任务结果引用') }),
  }
}

/** Validate before exposing a saved graph; task snapshots may reference deleted visual nodes. */
export function restoreDocument(raw: string, now = Date.now()): CanvasDocument {
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { throw new Error('保存数据不是有效 JSON，请先保留原数据再重新开始。') }
  const saved = record(parsed, '画布')
  ensure(saved.version === 1, '版本不支持，原数据已保留')
  ensure(Array.isArray(saved.nodes) && Array.isArray(saved.edges) && Array.isArray(saved.tasks), '画布集合格式不正确')
  const viewport = record(saved.viewport, '视口')
  const zoom = finite(viewport.zoom, '缩放')
  ensure(zoom > 0, '缩放必须大于零')
  const assets = record(saved.assets, '资产集合')
  const doc: CanvasDocument = {
    version: 1, nodes: saved.nodes.map(restoreNode), edges: [],
    assets: Object.fromEntries(Object.entries(assets).map(([key, value]) => [key, restoreAsset(value, key)])),
    tasks: saved.tasks.map(restoreTask),
    viewport: { x: finite(viewport.x, '视口 X'), y: finite(viewport.y, '视口 Y'), zoom },
  }
  ensure(new Set(doc.nodes.map((node) => node.id)).size === doc.nodes.length, '节点 ID 重复')
  ensure(new Set(doc.tasks.map((task) => task.id)).size === doc.tasks.length, '任务 ID 重复')
  for (const node of doc.nodes) {
    if (node.type === 'image') ensure(node.data.assetId && doc.assets[node.data.assetId], '图片资产引用不存在')
  }
  const edgeIds = new Set<string>()
  for (const value of saved.edges) {
    const original = record(value, '连接')
    const edge: Edge = {
      id: idField(original.id, '连接 ID'), source: idField(original.source, '连接源节点'),
      target: idField(original.target, '连接目标节点'),
      sourceHandle: textField(original.sourceHandle, '输出接口'), targetHandle: textField(original.targetHandle, '输入接口'),
      ...(typeof original.type === 'string' ? { type: original.type } : {}),
    }
    ensure(!edgeIds.has(edge.id), '连接 ID 重复')
    ensure(isValidConnection(doc, edge), '连接无效或输入重复')
    edgeIds.add(edge.id)
    doc.edges.push(edge)
  }
  const activeOwners = new Set<string>()
  for (const task of doc.tasks) {
    ensure(doc.assets[task.input.imageAssetId], '任务输入资产不存在')
    const owner = doc.nodes.find((node) => node.id === task.nodeId)
    ensure(!owner || owner.type === 'generator', '任务所属节点类型不正确')
    const imageNode = doc.nodes.find((node) => node.id === task.input.imageNodeId)
    const promptNode = doc.nodes.find((node) => node.id === task.input.promptNodeId)
    ensure(!imageNode || imageNode.type === 'image', '任务图片节点类型不正确')
    ensure(!promptNode || promptNode.type === 'prompt', '任务提示词节点类型不正确')
    if (task.resultAssetId) ensure(doc.assets[task.resultAssetId], '任务结果资产不存在')
    if (task.status === 'succeeded') ensure(task.resultAssetId, '成功任务缺少结果资产')
    if (isActiveTask(task)) {
      ensure(owner && !activeOwners.has(task.nodeId), '运行中的生成节点不存在或任务重复')
      activeOwners.add(task.nodeId)
    }
  }
  for (const asset of Object.values(doc.assets)) {
    if (asset.taskId) {
      const task = doc.tasks.find((task) => task.id === asset.taskId)
      ensure(task && task.status === 'succeeded' && task.resultAssetId === asset.id, '生成资产任务引用不正确')
    }
  }
  doc.tasks = doc.tasks.map((task) => isActiveTask(task) ? {
    ...task, status: 'interrupted', updatedAt: now,
    error: '页面已刷新，任务已中断。可使用原输入重试。',
  } : task)
  return doc
}
