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
