import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getInputs, serializeDocument, STORAGE_KEY } from './domain'
import { createCanvasStore } from './store'

class MemoryStorage {
  values = new Map<string, string>()
  failRead = false
  failWrite = false
  writes = 0
  getItem(key: string): string | null {
    if (this.failRead) throw new Error('storage denied')
    return this.values.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    if (this.failWrite) throw new Error('quota exceeded')
    this.writes += 1
    this.values.set(key, value)
  }
}

let factoryNumber = 0
function factory(storage = new MemoryStorage()) {
  let nextId = 0
  const prefix = `store-${++factoryNumber}`
  const store = createCanvasStore({ storage, now: () => Date.now(), id: () => `${prefix}-${++nextId}` })
  return { store, storage }
}

function connected() {
  const result = factory()
  const { store } = result
  const image = store.getState().addImage('dune', { x: -100, y: 20 })
  const prompt = store.getState().addPrompt({ x: 100, y: 300 })
  const generator = store.getState().addGenerator({ x: 500, y: 100 })
  store.getState().updateNode(prompt, { text: '清晨的沙丘，柔和光线' })
  store.getState().connect({ source: image, target: generator, sourceHandle: 'output', targetHandle: 'image' })
  store.getState().connect({ source: prompt, target: generator, sourceHandle: 'output', targetHandle: 'prompt' })
  return { ...result, image, prompt, generator }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(5000)
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('asynchronous generation store', () => {
  it('shows queued for 600ms and running for 1600ms before creating independent results', () => {
    const { store, image, generator } = connected()
    const originalAsset = getInputs(store.getState().doc, generator).image!
    store.getState().generate(generator)
    expect(store.getState().doc.tasks[0].status).toBe('queued')
    vi.advanceTimersByTime(599)
    expect(store.getState().doc.tasks[0].status).toBe('queued')
    vi.advanceTimersByTime(1)
    expect(store.getState().doc.tasks[0].status).toBe('running')
    vi.advanceTimersByTime(1599)
    expect(store.getState().doc.nodes).toHaveLength(3)
    vi.advanceTimersByTime(1)
    const doc = store.getState().doc
    expect(doc.tasks[0].status).toBe('succeeded')
    expect(doc.nodes).toHaveLength(4)
    const result = doc.assets[doc.tasks[0].resultAssetId!]
    expect(result).toMatchObject({ origin: 'generated', taskId: doc.tasks[0].id, src: '/samples/result.svg' })
    expect(result.id).not.toBe(originalAsset.id)
    expect(doc.assets[originalAsset.id]).toEqual(originalAsset)
    expect(doc.nodes.find((node) => node.id === image)?.data.assetId).toBe(originalAsset.id)
    const resultNode = doc.nodes.find((node) => node.data.assetId === result.id)!
    expect(resultNode.position).toEqual({ x: 890, y: 100 })
    store.getState().generate(generator)
    vi.advanceTimersByTime(2200)
    const next = store.getState().doc
    expect(next.tasks).toHaveLength(2)
    expect(new Set(next.tasks.map((task) => task.id)).size).toBe(2)
    expect(new Set(next.tasks.map((task) => task.resultAssetId)).size).toBe(2)
    expect(next.nodes).toHaveLength(5)
    const secondGenerator = store.getState().addGenerator({ x: 1300, y: 100 })
    store.getState().connect({ source: resultNode.id, target: secondGenerator, sourceHandle: 'output', targetHandle: 'image' })
    expect(getInputs(store.getState().doc, secondGenerator).image?.id).toBe(result.id)
  })

  it('rejects missing inputs and prevents duplicate submission in queued and running states', () => {
    const blank = factory().store
    const blankGenerator = blank.getState().addGenerator({ x: 0, y: 0 })
    blank.getState().generate(blankGenerator)
    expect(blank.getState().doc.tasks).toHaveLength(0)
    expect(blank.getState().notice).toContain('非空提示词')
    const { store, generator } = connected()
    store.getState().generate(generator)
    store.getState().generate(generator)
    expect(store.getState().doc.tasks).toHaveLength(1)
    expect(store.getState().notice).toContain('运行中')
    vi.advanceTimersByTime(600)
    store.getState().generate(generator)
    expect(store.getState().doc.tasks).toHaveLength(1)
  })

  it('snapshots inputs and parameters before live prompt and ratio changes', () => {
    const { store, prompt, generator } = connected()
    store.getState().generate(generator)
    const snapshot = { ...store.getState().doc.tasks[0].input }
    store.getState().updateNode(prompt, { text: '后来修改的提示词' })
    store.getState().updateNode(generator, { ratio: '16:9' })
    expect(getInputs(store.getState().doc, generator).prompt).toBe('后来修改的提示词')
    expect(store.getState().doc.tasks[0].input).toEqual(snapshot)
    expect(store.getState().doc.tasks[0].parameters.ratio).toBe('4:3')
    vi.advanceTimersByTime(2200)
    expect(store.getState().doc.tasks[0].input).toEqual(snapshot)
  })

  it('consumes one-shot failure and retries the original snapshot even after source edits and deletion', () => {
    const { store, image, prompt, generator } = connected()
    store.getState().updateNode(generator, { failNext: true, ratio: '1:1' })
    store.getState().generate(generator)
    expect(store.getState().doc.nodes.find((node) => node.id === generator)?.data.failNext).toBe(false)
    vi.advanceTimersByTime(2200)
    const failed = store.getState().doc.tasks[0]
    expect(failed.status).toBe('failed')
    expect(failed.error).toContain('测试失败')
    store.getState().updateNode(prompt, { text: '新的内容' })
    store.getState().updateNode(generator, { ratio: '16:9' })
    store.getState().deleteNode(image)
    store.getState().deleteNode(prompt)
    store.getState().retry(generator)
    const retry = store.getState().doc.tasks[1]
    expect(retry.id).not.toBe(failed.id)
    expect(retry.input).toEqual(failed.input)
    expect(retry.parameters).toEqual({ ratio: '1:1' })
    expect(retry.fail).toBe(false)
    vi.advanceTimersByTime(2200)
    expect(store.getState().doc.tasks.map((task) => task.status)).toEqual(['failed', 'succeeded'])
    expect(store.getState().doc.assets[store.getState().doc.tasks[1].resultAssetId!]).toMatchObject({ width: 960, height: 960 })
  })

  it.each([0, 600])('interrupts generator deletion at %ims and prevents stale result callbacks', (elapsed) => {
    const { store, generator } = connected()
    store.getState().generate(generator)
    vi.advanceTimersByTime(elapsed)
    store.getState().deleteNode(generator)
    expect(store.getState().doc.tasks[0]).toMatchObject({ status: 'interrupted' })
    expect(store.getState().doc.edges).toHaveLength(0)
    vi.advanceTimersByTime(10000)
    expect(store.getState().doc.nodes).toHaveLength(2)
    expect(Object.values(store.getState().doc.assets)).toHaveLength(1)
    expect(store.getState().doc.tasks[0].resultAssetId).toBeUndefined()
  })

  it('cleans deleted source edges while retaining task history and its input asset', () => {
    const { store, image, generator } = connected()
    store.getState().generate(generator)
    vi.advanceTimersByTime(2200)
    const history = store.getState().doc.tasks[0]
    store.getState().deleteNode(image)
    expect(store.getState().doc.edges.some((edge) => edge.source === image || edge.target === image)).toBe(false)
    expect(getInputs(store.getState().doc, generator).image).toBeUndefined()
    expect(store.getState().doc.tasks[0]).toEqual(history)
    expect(store.getState().doc.assets[history.input.imageAssetId]).toBeDefined()
  })
})

describe('graph editing and versioned persistence', () => {
  it('rejects invalid connections, removes selected edges and cleans selection-deleted nodes', () => {
    const { store, image, prompt, generator } = connected()
    const count = store.getState().doc.edges.length
    store.getState().connect({ source: image, target: generator, sourceHandle: 'output', targetHandle: 'image' })
    expect(store.getState().doc.edges).toHaveLength(count)
    expect(store.getState().notice).toContain('连接无效')
    const imageEdge = store.getState().doc.edges.find((edge) => edge.source === image)!
    store.getState().onNodesChange([{ type: 'select', id: generator, selected: false }])
    store.getState().onEdgesChange([{ type: 'select', id: imageEdge.id, selected: true }])
    store.getState().deleteSelection()
    expect(store.getState().doc.nodes).toHaveLength(3)
    expect(store.getState().doc.edges).toHaveLength(1)
    expect(getInputs(store.getState().doc, generator).image).toBeUndefined()
    store.getState().onNodesChange([{ type: 'select', id: prompt, selected: true }])
    store.getState().deleteSelection()
    expect(store.getState().doc.nodes).toHaveLength(2)
    expect(store.getState().doc.edges).toHaveLength(0)
    store.getState().clearNotice()
    expect(store.getState().notice).toBeUndefined()
  })

  it('debounces editing saves and restores positions, viewport and terminal task results', () => {
    const { store, storage, image, generator } = connected()
    const writes = storage.writes
    store.getState().setViewport({ x: -170, y: 81, zoom: 0.4 })
    store.getState().onNodesChange([{ type: 'position', id: image, position: { x: 240, y: -90 }, dragging: true }])
    expect(store.getState().saveStatus).toBe('saving')
    vi.advanceTimersByTime(139)
    expect(storage.writes).toBe(writes)
    vi.advanceTimersByTime(1)
    expect(storage.writes).toBe(writes + 1)
    expect(store.getState().saveStatus).toBe('saved')
    store.getState().generate(generator)
    vi.advanceTimersByTime(2200)
    const expected = serializeDocument(store.getState().doc)
    const restored = factory(storage).store
    expect(JSON.parse(serializeDocument(restored.getState().doc))).toEqual(JSON.parse(expected))
    expect(restored.getState().doc.viewport).toEqual({ x: -170, y: 81, zoom: 0.4 })
    expect(restored.getState().doc.tasks[0].status).toBe('succeeded')
    expect(restored.getState().doc.nodes.find((node) => node.id === image)?.position).toEqual({ x: 240, y: -90 })
    expect(restored.getState().doc.nodes.every((node) => !node.selected && !node.dragging)).toBe(true)
  })

  it.each([0, 600])('refreshes unfinished work at %ims into a preserved retryable interruption', (elapsed) => {
    const { store, storage, generator } = connected()
    store.getState().generate(generator)
    vi.advanceTimersByTime(elapsed)
    const oldTask = store.getState().doc.tasks[0]
    // Reload discards the old JavaScript context and therefore its timers.
    vi.clearAllTimers()
    const restored = factory(storage).store
    expect(restored.getState().doc.tasks[0]).toMatchObject({
      id: oldTask.id, status: 'interrupted', input: oldTask.input, parameters: oldTask.parameters,
    })
    expect(restored.getState().doc.tasks[0].error).toContain('刷新')
    expect(JSON.parse(storage.values.get(STORAGE_KEY)!).tasks[0].status).toBe('interrupted')
    restored.getState().retry(generator)
    expect(restored.getState().doc.tasks).toHaveLength(2)
    vi.advanceTimersByTime(2200)
    expect(restored.getState().doc.tasks.map((task) => task.status)).toEqual(['interrupted', 'succeeded'])
    expect(new Set(restored.getState().doc.nodes.map((node) => node.id)).size).toBe(4)
  })

  it('shows a storage write failure and retries without losing the working canvas', () => {
    const storage = new MemoryStorage()
    storage.failWrite = true
    const store = factory(storage).store
    expect(store.getState().saveStatus).toBe('error')
    const prompt = store.getState().addPrompt({ x: 10, y: 20 })
    store.getState().updateNode(prompt, { text: '未保存的编辑' })
    vi.advanceTimersByTime(140)
    expect(store.getState().saveStatus).toBe('error')
    expect(store.getState().saveError).toContain('quota exceeded')
    expect(storage.values.has(STORAGE_KEY)).toBe(false)
    storage.failWrite = false
    store.getState().retrySave()
    expect(store.getState().saveStatus).toBe('saved')
    expect(store.getState().saveError).toBeUndefined()
    expect(factory(storage).store.getState().doc.nodes[0].data.text).toBe('未保存的编辑')
  })

  it('reports unavailable storage reads without falsely claiming restoration succeeded', () => {
    const storage = new MemoryStorage()
    storage.failRead = true
    const store = factory(storage).store
    expect(store.getState().saveStatus).toBe('error')
    expect(store.getState().saveError).toContain('storage denied')
    expect(storage.writes).toBe(0)
    expect(store.getState().doc.nodes).toHaveLength(0)
  })

  it.each(['{broken-json', '{"version":2}'])('preserves invalid saved data until an explicit fresh start: %s', (raw) => {
    const storage = new MemoryStorage()
    storage.values.set(STORAGE_KEY, raw)
    const store = factory(storage).store
    expect(store.getState().recoveryBlocked).toBe(true)
    expect(store.getState().saveStatus).toBe('error')
    store.getState().addPrompt({ x: 0, y: 0 })
    vi.advanceTimersByTime(1000)
    store.getState().flushSave()
    expect(storage.values.get(STORAGE_KEY)).toBe(raw)
    expect(storage.writes).toBe(0)
    store.getState().startFresh()
    expect(store.getState().recoveryBlocked).toBe(false)
    expect(store.getState().saveStatus).toBe('saved')
    expect(store.getState().doc.nodes).toHaveLength(0)
    expect(JSON.parse(storage.values.get(STORAGE_KEY)!)).toMatchObject({ version: 1, nodes: [], tasks: [] })
  })

  it('clears pending generation timers when explicitly starting a fresh canvas', () => {
    const { store, generator } = connected()
    store.getState().generate(generator)
    vi.advanceTimersByTime(600)
    store.getState().startFresh()
    vi.advanceTimersByTime(10000)
    expect(store.getState().doc.nodes).toHaveLength(0)
    expect(store.getState().doc.tasks).toHaveLength(0)
    expect(Object.values(store.getState().doc.assets)).toHaveLength(0)
  })
})
