import type { Edge, Node, Viewport } from '@xyflow/react'

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

export interface CanvasInputs {
  image?: Asset
  prompt?: string
  imageNodeId?: string
  promptNodeId?: string
}
