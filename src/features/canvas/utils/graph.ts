import type { Connection, Edge } from '@xyflow/react'
import type { CanvasDocument, CanvasInputs, Task } from '../types'

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

export function getInputs(doc: CanvasDocument, nodeId: string): CanvasInputs {
  const input: CanvasInputs = {}
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
