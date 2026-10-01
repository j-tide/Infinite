import { describe, expect, it } from 'vitest'
import type { CanvasDocument, Task } from './domain'
import {
  createEmptyDocument, getInputs, getLatestTask, isValidConnection, restoreDocument,
  SAMPLE_ASSETS, screenToWorld, serializeDocument,
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

describe('versioned serialization and restoration', () => {
  it('roundtrips world positions, viewport and references without transient selection or measurement', () => {
    const doc = fixture()
    doc.nodes[0] = { ...doc.nodes[0], selected: true, dragging: true, measured: { width: 200, height: 100 }, width: 200 }
    doc.edges[0].selected = true
    const restored = restoreDocument(serializeDocument(doc))
    expect(restored.viewport).toEqual(doc.viewport)
    expect(restored.nodes.map((node) => node.position)).toEqual(doc.nodes.map((node) => node.position))
    expect(restored.nodes[0]).not.toHaveProperty('selected')
    expect(restored.nodes[0]).not.toHaveProperty('measured')
    expect(restored.nodes[0]).not.toHaveProperty('width')
    expect(restored.nodes[0].dragHandle).toBe('.node-heading')
    expect(restored.edges[0]).not.toHaveProperty('selected')
    expect(getInputs(restored, 'generator').image?.id).toBe('asset-source')
  })

  it.each(['queued', 'running'] as const)('restores a %s task as interrupted while preserving its snapshot', (status) => {
    const doc = fixture()
    doc.tasks = [task(status)]
    const raw = serializeDocument(doc)
    const restored = restoreDocument(raw, 500)
    expect(restored.tasks[0]).toMatchObject({ status: 'interrupted', updatedAt: 500, input: task().input, parameters: task().parameters })
    expect(restored.tasks[0].error).toContain('刷新')
    expect(JSON.parse(raw).tasks[0].status).toBe(status)
  })

  it('retains terminal tasks and assets when their visual nodes were deleted', () => {
    const doc = fixture()
    doc.nodes = []
    doc.edges = []
    doc.tasks = [{ ...task('succeeded'), resultAssetId: 'result' }]
    doc.assets.result = { id: 'result', name: 'mock result', src: '/samples/result.svg', width: 960, height: 720, createdAt: 30, origin: 'generated', taskId: 'task-1' }
    expect(restoreDocument(serializeDocument(doc)).tasks[0]).toEqual(doc.tasks[0])
    expect(restoreDocument(serializeDocument(doc)).assets.result).toEqual(doc.assets.result)
  })

  it('rejects corrupt JSON, unknown versions and nonfinite coordinates', () => {
    expect(() => restoreDocument('{invalid')).toThrow('JSON')
    expect(() => restoreDocument(JSON.stringify({ ...fixture(), version: 2 }))).toThrow('版本')
    const doc = fixture()
    doc.nodes[0].position.x = Infinity
    expect(() => restoreDocument(serializeDocument(doc))).toThrow('有限数值')
  })

  it('rejects missing assets, dangling or duplicate edges and invalid historical results', () => {
    const missingAsset = fixture()
    delete missingAsset.assets['asset-source']
    expect(() => restoreDocument(serializeDocument(missingAsset))).toThrow('资产引用不存在')
    const dangling = fixture()
    dangling.edges[0].source = 'missing'
    expect(() => restoreDocument(serializeDocument(dangling))).toThrow('连接无效')
    const duplicate = fixture()
    duplicate.edges.push({ ...duplicate.edges[0], id: 'duplicate' })
    expect(() => restoreDocument(serializeDocument(duplicate))).toThrow('输入重复')
    const result = fixture()
    result.tasks = [{ ...task('succeeded'), resultAssetId: 'missing-result' }]
    expect(() => restoreDocument(serializeDocument(result))).toThrow('结果资产不存在')
  })

  it('rejects external asset paths and active tasks with no owning generator', () => {
    const external = fixture()
    external.assets['asset-source'].src = 'https://example.com/image.png'
    expect(() => restoreDocument(serializeDocument(external))).toThrow('内置资源')
    const noOwner = fixture()
    noOwner.nodes = noOwner.nodes.filter((node) => node.id !== 'generator')
    noOwner.edges = []
    noOwner.tasks = [task()]
    expect(() => restoreDocument(serializeDocument(noOwner))).toThrow('运行中的生成节点不存在')
  })
})
