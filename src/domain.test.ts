import { describe, expect, it } from 'vitest'
import type { CanvasDocument, Task } from './domain'
import {
  createEmptyDocument, getInputs, getLatestTask, isValidConnection,
  SAMPLE_ASSETS, screenToWorld,
} from './domain'

function fixture(): CanvasDocument {
  const doc = createEmptyDocument()
  doc.assets['asset-source'] = { ...SAMPLE_ASSETS[0], id: 'asset-source', createdAt: 10, origin: 'sample' }
  doc.nodes = [
    { id: 'image', type: 'image', position: { x: -240, y: 130 }, data: { label: '图片', assetId: 'asset-source' } },
    { id: 'prompt', type: 'prompt', position: { x: 10, y: 300 }, data: { label: '提示词', text: '温暖的日落' } },
    { id: 'generator', type: 'generator', position: { x: 440, y: 210 }, data: { label: '生成', ratio: '4:3', failNext: false } },
  ]
  doc.edges = [
    { id: 'edge-image', source: 'image', target: 'generator', sourceHandle: 'output', targetHandle: 'image' },
    { id: 'edge-prompt', source: 'prompt', target: 'generator', sourceHandle: 'output', targetHandle: 'prompt' },
  ]
  doc.viewport = { x: 131.5, y: -52, zoom: 0.65 }
  return doc
}
function task(status: Task['status'] = 'running'): Task {
  return {
    id: 'task-1', nodeId: 'generator', status, createdAt: 20, updatedAt: 21, fail: false,
    input: { imageAssetId: 'asset-source', imageNodeId: 'image', promptNodeId: 'prompt', prompt: '原始提示词' },
    parameters: { ratio: '4:3' },
  }
}

describe('canvas domain and references', () => {
  it('resolves current connected content and reads the latest independent task', () => {
    const doc = fixture()
    expect(getInputs(doc, 'generator')).toEqual({
      image: doc.assets['asset-source'], imageNodeId: 'image', prompt: '温暖的日落', promptNodeId: 'prompt',
    })
    doc.nodes[1].data.text = '修改后的提示词'
    expect(getInputs(doc, 'generator').prompt).toBe('修改后的提示词')
    doc.tasks = [task('failed'), { ...task('interrupted'), id: 'task-2' }]
    expect(getLatestTask(doc, 'generator')?.id).toBe('task-2')
    expect(getLatestTask(doc, 'other')).toBeUndefined()
  })

  it('accepts directed typed inputs and rejects wrong, self, duplicate or occupied handles', () => {
    const doc = fixture()
    const image = doc.edges[0]
    expect(isValidConnection(doc, image)).toBe(false)
    doc.edges = []
    expect(isValidConnection(doc, image)).toBe(true)
    expect(isValidConnection(doc, { ...image, targetHandle: 'prompt' })).toBe(false)
    expect(isValidConnection(doc, { ...image, sourceHandle: 'other' })).toBe(false)
    expect(isValidConnection(doc, { ...image, target: 'image' })).toBe(false)
    expect(isValidConnection(doc, { ...image, source: 'generator', target: 'image' })).toBe(false)
    expect(isValidConnection(doc, { ...image, source: 'missing' })).toBe(false)
    doc.edges = [image]
    expect(isValidConnection(doc, { ...image, id: 'other-edge' })).toBe(false)
    expect(isValidConnection(doc, fixture().edges[1])).toBe(true)
  })

  it('converts canvas positions to world coordinates at any scale', () => {
    expect(screenToWorld({ x: 300, y: 200 }, { x: 100, y: -50, zoom: 0.5 })).toEqual({ x: 400, y: 500 })
  })
})
