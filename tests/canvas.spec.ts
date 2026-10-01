import { expect, test, type Locator, type Page } from '@playwright/test';

const STORAGE_KEY = 'infinite-canvas:v1';
type Point = { x: number; y: number };
type SavedNode = { id: string; type: string; position: Point; data: { assetId?: string; text?: string; ratio?: string } };
type SavedTask = { id: string; nodeId: string; status: string; input: Record<string, unknown>; parameters: Record<string, unknown>; resultAssetId?: string };
type SavedDocument = { version: number; nodes: SavedNode[]; edges: { id: string; source: string; target: string }[]; assets: Record<string, unknown>; tasks: SavedTask[]; viewport: Point & { zoom: number } };

async function document(page: Page): Promise<SavedDocument> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STORAGE_KEY);
}

async function saved(page: Page, predicate: (doc: SavedDocument) => boolean) {
  await expect.poll(async () => {
    const value = await document(page);
    return Boolean(value && predicate(value));
  }).toBe(true);
  await expect(page.getByTestId('save-status')).toHaveText('已保存');
  return document(page);
}

function node(page: Page, id: string) {
  return page.locator(`.react-flow__node[data-id="${id}"]`);
}

async function idOf(card: Locator): Promise<string> {
  return card.locator('xpath=ancestor::*[contains(@class,"react-flow__node")][1]').getAttribute('data-id') as Promise<string>;
}

async function connect(page: Page, source: string, target: string, input: 'image' | 'prompt') {
  const from = node(page, source).locator('.react-flow__handle[data-handleid="output"]');
  const to = node(page, target).locator(`.react-flow__handle[data-handleid="${input}"]`);
  await expect(from).toBeVisible();
  await expect(to).toBeVisible();
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error('Connection handle has no visible bounds');
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 15 });
  await page.mouse.up();
}

async function createGraph(page: Page) {
  await page.getByRole('button', { name: '添加图片节点', exact: true }).click();
  await page.getByRole('button', { name: '添加提示词节点', exact: true }).click();
  await page.getByRole('button', { name: '添加生成节点', exact: true }).click();
  const image = await idOf(page.getByTestId('image-node').first());
  const prompt = await idOf(page.getByTestId('prompt-node').first());
  const generator = await idOf(page.getByTestId('generator-node').first());
  await node(page, prompt).getByRole('textbox', { name: '提示词内容' }).fill('清晨的金色沙丘，柔和光线');
  await connect(page, image, generator, 'image');
  await connect(page, prompt, generator, 'prompt');
  await saved(page, d => d.nodes.length === 3 && d.edges.length === 2);
  return { image, prompt, generator };
}

async function runSuccess(page: Page, generator: string) {
  const card = node(page, generator);
  await card.getByRole('button', { name: '生成图片', exact: true }).click();
  await expect(card).toContainText('排队');
  await expect(card.getByRole('button', { name: '生成图片', exact: true })).toBeDisabled();
  await expect(card).toContainText('生成中');
  return saved(page, d => d.tasks.some(t => t.nodeId === generator && t.status === 'succeeded'));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '添加图片节点', exact: true })).toBeVisible();
});

test('从空画布创建三类节点，编辑提示词和比例，缺少输入不能提交', async ({ page }) => {
  await expect(page.locator('.react-flow__node')).toHaveCount(0);
  await page.getByRole('button', { name: '添加生成节点', exact: true }).click();
  const generator = page.getByTestId('generator-node');
  await expect(generator.getByRole('button', { name: '生成图片', exact: true })).toBeDisabled();
  await expect(generator).toContainText('连接图片与提示词后');
  await page.getByRole('button', { name: '添加图片节点', exact: true }).click();
  await page.getByRole('button', { name: '添加提示词节点', exact: true }).click();
  await page.getByRole('textbox', { name: '提示词内容' }).fill('日落与海岸');
  await generator.getByRole('combobox', { name: '生成比例' }).selectOption('16:9');
  const doc = await saved(page, d => d.nodes.length === 3 && d.nodes.some(n => n.data.text === '日落与海岸') && d.nodes.some(n => n.data.ratio === '16:9'));
  expect(new Set(doc.nodes.map(n => n.id)).size).toBe(3);
  expect(doc.nodes.map(n => n.type).sort()).toEqual(['generator', 'image', 'prompt']);
  expect(doc.tasks).toHaveLength(0);
  expect(doc.edges).toHaveLength(0);
  await expect(page.getByTestId('image-node').locator('img')).toBeVisible();
});

test('真实端口连线读取实时输入，拒绝错误类型，删除连接和节点清理引用', async ({ page }) => {
  const { image, prompt, generator } = await createGraph(page);
  await node(page, prompt).getByRole('textbox', { name: '提示词内容' }).fill('更新后的提示词');
  await expect(node(page, generator)).toContainText('更新后的提示词');
  await connect(page, prompt, generator, 'image');
  expect((await document(page)).edges).toHaveLength(2);
  const doc = await saved(page, d => d.nodes.some(n => n.data.text === '更新后的提示词'));
  const edge = doc.edges.find(e => e.source === prompt)!;
  const point = await page.locator(`.react-flow__edge[data-id="${edge.id}"] .react-flow__edge-interaction`).evaluate((element: SVGPathElement) => {
    const p = element.getPointAtLength(element.getTotalLength() * .5);
    const transformed = new DOMPoint(p.x, p.y).matrixTransform(element.getScreenCTM()!);
    return { x: transformed.x, y: transformed.y };
  });
  await page.mouse.click(point.x, point.y);
  await page.getByRole('button', { name: '删除所选', exact: true }).click();
  await saved(page, d => d.edges.length === 1);
  await node(page, image).locator('.node-heading').click();
  await page.getByRole('button', { name: '删除所选', exact: true }).click();
  const after = await saved(page, d => d.nodes.length === 2 && d.edges.length === 0);
  expect(after.nodes.some(n => n.id === image)).toBe(false);
  expect(after.nodes.some(n => n.id === prompt)).toBe(true);
});

test('异步成功创建独立资产和结果，结果可真实连接下一生成节点', async ({ page }, testInfo) => {
  const { image, generator } = await createGraph(page);
  const original = (await document(page)).nodes.find(n => n.id === image)!;
  const doc = await runSuccess(page, generator);
  const task = doc.tasks.find(t => t.nodeId === generator && t.status === 'succeeded')!;
  expect(task.resultAssetId).toBeTruthy();
  expect(task.resultAssetId).not.toBe(original.data.assetId);
  const result = doc.nodes.find(n => n.type === 'image' && n.data.assetId === task.resultAssetId)!;
  expect(result.id).not.toBe(image);
  expect(doc.assets[task.resultAssetId!]).toBeTruthy();
  expect(doc.nodes.find(n => n.id === image)?.data.assetId).toBe(original.data.assetId);
  await page.getByRole('button', { name: '添加生成节点', exact: true }).click();
  const next = await idOf(page.getByTestId('generator-node').last());
  await page.getByRole('button', { name: '适配画布', exact: true }).click();
  await page.waitForTimeout(350);
  await connect(page, result.id, next, 'image');
  const reused = await saved(page, d => d.edges.some(e => e.source === result.id && e.target === next));
  expect(reused.tasks).toHaveLength(1);
  await expect(node(page, next).locator('img')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('canvas-success-and-reuse.png'), fullPage: true });
});

test('一次性失败保留快照，编辑画布后重试仍使用原输入及参数', async ({ page }) => {
  const { prompt, generator } = await createGraph(page);
  const card = node(page, generator);
  await card.getByRole('combobox', { name: '生成比例' }).selectOption('16:9');
  await card.getByRole('checkbox', { name: '下次生成失败' }).check();
  await card.getByRole('button', { name: '生成图片', exact: true }).click();
  await expect(card).toContainText('排队');
  await expect(card).toContainText('生成中');
  const failedDoc = await saved(page, d => d.tasks.some(t => t.status === 'failed'));
  const failed = failedDoc.tasks.find(t => t.status === 'failed')!;
  await expect(card).toContainText(/失败/);
  await expect(card.getByRole('checkbox', { name: '下次生成失败' })).not.toBeChecked();
  await node(page, prompt).getByRole('textbox', { name: '提示词内容' }).fill('修改后的新提示词');
  await card.getByRole('combobox', { name: '生成比例' }).selectOption('1:1');
  await card.getByRole('button', { name: '重试生成', exact: true }).click();
  const retryDoc = await saved(page, d => d.tasks.some(t => t.status === 'succeeded'));
  expect(retryDoc.tasks).toHaveLength(2);
  const retried = retryDoc.tasks.find(t => t.status === 'succeeded')!;
  expect(retried.id).not.toBe(failed.id);
  expect(retried.input).toEqual(failed.input);
  expect(retried.parameters).toEqual(failed.parameters);
  expect(retryDoc.tasks.find(t => t.id === failed.id)?.status).toBe('failed');
});

test('终态、节点、资源和连线在刷新后保持，结果图片可加载', async ({ page }) => {
  const { generator } = await createGraph(page);
  const before = await runSuccess(page, generator);
  await page.reload();
  await expect(page.getByTestId('image-node')).toHaveCount(2);
  const after = await saved(page, d => d.tasks.some(t => t.status === 'succeeded'));
  expect(after.nodes).toEqual(before.nodes);
  expect(after.edges).toEqual(before.edges);
  expect(after.assets).toEqual(before.assets);
  expect(after.tasks).toEqual(before.tasks);
  const imageLoaded = await page.getByTestId('image-node').locator('img').last().evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
  expect(imageLoaded).toBe(true);
});

test('鼠标锚定缩放、按比例拖动、平移、空白取消选择及视口恢复', async ({ page }) => {
  await page.getByRole('button', { name: '添加图片节点', exact: true }).click();
  const id = await idOf(page.getByTestId('image-node'));
  await saved(page, d => d.nodes.length === 1);
  const pane = await page.locator('.react-flow').boundingBox();
  if (!pane) throw new Error('Canvas has no bounds');
  const drag = async (dx: number, dy: number) => {
    const before = await document(page);
    const header = await node(page, id).locator('.node-heading').boundingBox();
    if (!header) throw new Error('Node header has no bounds');
    const x = header.x + header.width * .4;
    const y = header.y + header.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 15 });
    await page.mouse.up();
    const oldPosition = before.nodes[0].position;
    const after = await saved(page, d => Math.abs(d.nodes[0].position.x - oldPosition.x) > 5);
    expect(after.nodes[0].position.x - oldPosition.x).toBeCloseTo(dx / before.viewport.zoom, 0);
    expect(after.nodes[0].position.y - oldPosition.y).toBeCloseTo(dy / before.viewport.zoom, 0);
  };
  await drag(80, 45);
  const header = await node(page, id).locator('.node-heading').boundingBox();
  if (!header) throw new Error('Node header has no bounds');
  const anchor = { x: header.x + header.width * .4, y: header.y + header.height / 2 };
  const beforeZoom = await document(page);
  const local = { x: anchor.x - pane.x, y: anchor.y - pane.y };
  const world = { x: (local.x - beforeZoom.viewport.x) / beforeZoom.viewport.zoom, y: (local.y - beforeZoom.viewport.y) / beforeZoom.viewport.zoom };
  await page.mouse.move(anchor.x, anchor.y);
  await page.mouse.wheel(0, -350);
  const afterZoom = await saved(page, d => d.viewport.zoom > beforeZoom.viewport.zoom + .1);
  expect(Math.abs(afterZoom.viewport.x + world.x * afterZoom.viewport.zoom - local.x)).toBeLessThan(2);
  expect(Math.abs(afterZoom.viewport.y + world.y * afterZoom.viewport.zoom - local.y)).toBeLessThan(2);
  expect(afterZoom.nodes[0].position).toEqual(beforeZoom.nodes[0].position);
  await drag(60, 30);
  const beforePan = await document(page);
  const blank = { x: pane.x + pane.width - 180, y: pane.y + pane.height - 180 };
  await page.mouse.move(blank.x, blank.y);
  await page.mouse.down({ button: 'middle' });
  await page.mouse.move(blank.x - 100, blank.y - 60, { steps: 10 });
  await page.mouse.up({ button: 'middle' });
  const afterPan = await saved(page, d => Math.abs(d.viewport.x - beforePan.viewport.x) > 50);
  expect(afterPan.nodes[0].position).toEqual(beforePan.nodes[0].position);
  await node(page, id).locator('.node-heading').click();
  await expect(node(page, id)).toHaveClass(/selected/);
  await page.mouse.click(blank.x, blank.y);
  await expect(node(page, id)).not.toHaveClass(/selected/);
  const beforeReload = await document(page);
  await page.reload();
  const afterReload = await saved(page, d => d.nodes.length === 1);
  expect(afterReload.viewport).toEqual(beforeReload.viewport);
  expect(afterReload.nodes[0].position).toEqual(beforeReload.nodes[0].position);
});

test('生成中刷新变为可重试中断，运行中删除生成节点不会出现孤立结果', async ({ page }) => {
  const { generator } = await createGraph(page);
  await node(page, generator).getByRole('button', { name: '生成图片', exact: true }).click();
  await expect(node(page, generator)).toContainText('生成中');
  await saved(page, d => d.tasks.some(t => t.status === 'running'));
  await page.reload();
  await expect(node(page, generator)).toContainText('中断');
  const interrupted = await saved(page, d => d.tasks.some(t => t.status === 'interrupted'));
  expect(interrupted.tasks.filter(t => ['queued', 'running'].includes(t.status))).toHaveLength(0);
  await node(page, generator).getByRole('button', { name: '重试生成', exact: true }).click();
  await expect(node(page, generator)).toContainText('生成中');
  await node(page, generator).locator('.node-heading').click();
  await page.getByRole('button', { name: '删除所选', exact: true }).click();
  await saved(page, d => d.nodes.length === 2 && d.edges.length === 0 && d.tasks.every(t => t.status === 'interrupted'));
  await page.waitForTimeout(2_000);
  expect((await document(page)).nodes).toHaveLength(2);
  expect((await document(page)).tasks.some(t => t.resultAssetId)).toBe(false);
  await expect(page.getByTestId('generator-node')).toHaveCount(0);
  await expect(page.getByTestId('image-node')).toHaveCount(1);
});

test('损坏存储有可见警告并保留原值，明确新建后才能替换', async ({ page }) => {
  const corrupt = '{broken-canvas';
  // Seed on the next document, after the departing page has flushed its valid state.
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: corrupt });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('恢复失败');
  await expect(page.locator('.react-flow__node')).toHaveCount(0);
  await page.getByRole('button', { name: '添加提示词节点', exact: true }).click();
  await expect(page.getByTestId('prompt-node')).toHaveCount(1);
  await page.waitForTimeout(400);
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(corrupt);
  await page.getByRole('button', { name: '新建本地画布', exact: true }).click();
  const fresh = await saved(page, d => d.version === 1 && d.nodes.length === 0);
  expect(fresh.edges).toHaveLength(0);
  expect(fresh.tasks).toHaveLength(0);
});
