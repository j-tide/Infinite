import { expect, test, type Page } from '@playwright/test';
import { STORAGE_KEY, createGraph, document, idOf, node, saved } from './helpers/canvas';

async function selectEdge(page: Page, id: string) {
  const edge = page.locator(`.react-flow__edge[data-id="${id}"]`);
  const point = await edge.locator('.react-flow__edge-interaction').evaluate((element: SVGPathElement) => {
    const midpoint = element.getPointAtLength(element.getTotalLength() / 2);
    const matrix = element.getScreenCTM();
    if (!matrix) throw new Error('Connection has no screen transform');
    const transformed = new DOMPoint(midpoint.x, midpoint.y).matrixTransform(matrix);
    return { x: transformed.x, y: transformed.y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(edge).toHaveClass(/selected/);
  return edge;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '添加图片节点', exact: true })).toBeVisible();
});

test('canvas-editing：空白取消连线选择、键盘删除连线和节点、标题删除清理引用', async ({ page }) => {
  const { image, prompt, generator } = await createGraph(page);
  const before = await document(page);
  const promptEdge = before.edges.find(edge => edge.source === prompt);
  if (!promptEdge) throw new Error('Prompt input connection is missing');
  const edge = await selectEdge(page, promptEdge.id);
  const pane = await page.locator('.react-flow').boundingBox();
  if (!pane) throw new Error('Canvas has no bounds');
  await page.mouse.click(pane.x + pane.width - 120, pane.y + pane.height - 120);
  await expect(edge).not.toHaveClass(/selected/);
  await expect(page.getByRole('button', { name: '删除所选', exact: true })).toHaveCount(0);
  expect((await document(page)).edges).toEqual(before.edges);

  await selectEdge(page, promptEdge.id);
  await page.keyboard.press('Delete');
  const disconnected = await saved(page, doc => doc.edges.length === 1);
  expect(disconnected.nodes.map(item => item.id)).toEqual(before.nodes.map(item => item.id));
  await expect(node(page, generator)).toContainText('连接一个提示词节点');
  await expect(node(page, prompt)).toBeVisible();

  await node(page, image).getByRole('button', { name: '删除参考图片', exact: true }).click();
  const deletedImage = await saved(page, doc => doc.nodes.length === 2 && doc.edges.length === 0);
  expect(deletedImage.assets).toEqual(before.assets);
  await expect(node(page, generator)).toContainText('连接一个图片节点');
  await node(page, prompt).locator('.node-heading').click();
  await page.keyboard.press('Backspace');
  const deletedPrompt = await saved(page, doc => doc.nodes.length === 1);
  expect(deletedPrompt.nodes[0].id).toBe(generator);
  expect(deletedPrompt.assets).toEqual(before.assets);
});

test('canvas-persistence：排队时刷新保留原快照并允许 UI 重试', async ({ page }) => {
  // Freeze task timers only after the real graph is ready, before submission.
  await page.clock.install();
  await page.reload();
  const { prompt, generator } = await createGraph(page);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1_000));
  const card = node(page, generator);
  await card.getByRole('button', { name: '生成图片', exact: true }).click();
  await expect(card).toContainText('排队中');
  // Flush the 140 ms resize/save debounce while staying inside the 600 ms queue.
  await page.clock.runFor(200);
  const queuedDoc = await saved(page, doc => doc.tasks.length === 1 && doc.tasks[0].status === 'queued');
  const queued = queuedDoc.tasks[0];
  await page.reload();
  await page.clock.resume();
  await expect(card).toContainText('页面已刷新，任务已中断');
  const interrupted = await saved(page, doc => doc.tasks[0]?.status === 'interrupted');
  expect(interrupted.tasks[0].input).toEqual(queued.input);
  expect(interrupted.tasks[0].parameters).toEqual(queued.parameters);
  await node(page, prompt).getByRole('textbox', { name: '提示词内容' }).fill('刷新后的其他创意');
  await card.getByRole('combobox', { name: '生成比例' }).selectOption('1:1');
  await card.getByRole('button', { name: '重试生成', exact: true }).click();
  const retriedDoc = await saved(page, doc => doc.tasks.some(task => task.status === 'succeeded'));
  const retried = retriedDoc.tasks.find(task => task.status === 'succeeded');
  expect(retried?.id).not.toBe(queued.id);
  expect(retried?.input).toEqual(queued.input);
  expect(retried?.parameters).toEqual(queued.parameters);
  expect(retriedDoc.tasks.find(task => task.id === queued.id)?.status).toBe('interrupted');
});

test('generation-tasks：删除输入节点并刷新后，历史快照与资产仍可重试成功', async ({ page }) => {
  const { image, prompt, generator } = await createGraph(page);
  const card = node(page, generator);
  await card.getByRole('checkbox', { name: '下次生成失败' }).check();
  await card.getByRole('button', { name: '生成图片', exact: true }).click();
  const failedDoc = await saved(page, doc => doc.tasks.some(task => task.status === 'failed'));
  const failed = failedDoc.tasks[0];
  await node(page, image).getByRole('button', { name: '删除参考图片', exact: true }).click();
  await node(page, prompt).getByRole('button', { name: '删除提示词', exact: true }).click();
  await saved(page, doc => doc.nodes.length === 1 && doc.edges.length === 0);
  await page.reload();
  await expect(page.getByRole('alert')).toHaveCount(0);
  const restored = await saved(page, doc => doc.nodes.length === 1 && doc.tasks[0]?.status === 'failed');
  expect(restored.assets[failed.input.imageAssetId]).toEqual(failedDoc.assets[failed.input.imageAssetId]);
  expect(restored.tasks[0].input).toEqual(failed.input);
  await expect(card).toContainText('连接一个图片节点');
  await expect(card).toContainText('连接一个提示词节点');
  await expect(card.getByRole('button', { name: '使用当前输入重新生成', exact: true })).toHaveCount(0);
  await card.getByRole('button', { name: '重试生成', exact: true }).click();
  const success = await saved(page, doc => doc.tasks.some(task => task.status === 'succeeded'));
  const retried = success.tasks.find(task => task.status === 'succeeded');
  expect(retried?.input).toEqual(failed.input);
  expect(retried?.parameters).toEqual(failed.parameters);
  expect(success.tasks.find(task => task.id === failed.id)?.status).toBe('failed');
  expect(success.assets[failed.input.imageAssetId]).toEqual(failedDoc.assets[failed.input.imageAssetId]);
  expect(success.nodes.filter(item => item.type === 'image')).toHaveLength(1);
  expect(success.edges).toHaveLength(0);
});

test('canvas-persistence：不支持的版本保持原值，明确新建后才替换', async ({ page }) => {
  const unsupported = JSON.stringify({ ...(await document(page)), version: 999 });
  await page.addInitScript(({ key, raw }) => {
    // Seed once so the second reload verifies retention rather than reseeding it.
    if (sessionStorage.getItem('acceptance-version-seeded')) return;
    localStorage.setItem(key, raw);
    sessionStorage.setItem('acceptance-version-seeded', 'true');
  }, { key: STORAGE_KEY, raw: unsupported });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('版本不支持，原数据已保留');
  await expect(page.getByTestId('save-status')).toHaveText('保存失败');
  await page.getByRole('button', { name: '添加提示词节点', exact: true }).click();
  await expect(page.getByTestId('prompt-node')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('恢复失败');
  await expect(page.getByTestId('prompt-node')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe(unsupported);
  await page.getByRole('button', { name: '新建本地画布', exact: true }).click();
  const fresh = await saved(page, doc => doc.version === 1 && doc.nodes.length === 0);
  expect(fresh.edges).toHaveLength(0);
  expect(fresh.tasks).toHaveLength(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('canvas-persistence：本地存储读取失败可见，恢复读取后显式重试保存', async ({ page }) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.getItem;
    const testWindow = window as typeof window & { restoreStorageRead(): void };
    testWindow.restoreStorageRead = () => { Storage.prototype.getItem = original; };
    Storage.prototype.getItem = function (itemKey: string) {
      if (itemKey === key) throw new Error('验收测试：本地存储读取不可用');
      return original.call(this, itemKey);
    };
  }, STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('本地存储不可用');
  await expect(page.getByRole('alert')).toContainText('本地存储读取不可用');
  await expect(page.getByTestId('save-status')).toHaveText('保存失败');
  await expect(page.locator('.react-flow__node')).toHaveCount(0);
  await page.evaluate(() => {
    const testWindow = window as typeof window & { restoreStorageRead(): void };
    testWindow.restoreStorageRead();
  });
  await page.getByRole('button', { name: '重试保存', exact: true }).click();
  await saved(page, doc => doc.version === 1 && doc.nodes.length === 0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: '添加提示词节点', exact: true }).click();
  await saved(page, doc => doc.nodes.length === 1);
});

test('generation-tasks：使用当前输入重新生成创建新快照，不复用失败快照', async ({ page }) => {
  const { prompt, generator } = await createGraph(page);
  const card = node(page, generator);
  await card.getByRole('combobox', { name: '生成比例' }).selectOption('16:9');
  await card.getByRole('checkbox', { name: '下次生成失败' }).check();
  await card.getByRole('button', { name: '生成图片', exact: true }).click();
  const failedDoc = await saved(page, doc => doc.tasks.some(task => task.status === 'failed'));
  const failed = failedDoc.tasks[0];
  const updatedPrompt = '沿海灯塔，雨后蓝色晨光';
  await node(page, prompt).getByRole('textbox', { name: '提示词内容' }).fill(updatedPrompt);
  await card.getByRole('combobox', { name: '生成比例' }).selectOption('1:1');
  await card.getByRole('button', { name: '使用当前输入重新生成', exact: true }).click();
  const regenerated = await saved(page, doc => doc.tasks.some(task => task.status === 'succeeded'));
  const succeeded = regenerated.tasks.find(task => task.status === 'succeeded');
  expect(regenerated.tasks).toHaveLength(2);
  expect(succeeded?.id).not.toBe(failed.id);
  expect(succeeded?.input).toEqual({ ...failed.input, prompt: updatedPrompt });
  expect(succeeded?.parameters).toEqual({ ratio: '1:1' });
  expect(regenerated.tasks.find(task => task.id === failed.id)).toEqual(failed);
  expect(succeeded?.resultAssetId).toBeTruthy();
  const asset = regenerated.assets[succeeded!.resultAssetId!];
  expect(asset.width).toBe(asset.height);
});

test('canvas-editing：多节点缩放与拖动只改变目标节点的世界位置', async ({ page }) => {
  await page.getByRole('button', { name: '添加图片节点', exact: true }).click();
  await page.getByRole('button', { name: '添加提示词节点', exact: true }).click();
  const image = await idOf(page.getByTestId('image-node'));
  const prompt = await idOf(page.getByTestId('prompt-node'));
  const beforeZoom = await saved(page, doc => doc.nodes.length === 2);
  const pane = await page.locator('.react-flow').boundingBox();
  if (!pane) throw new Error('Canvas has no bounds');
  const anchor = { x: pane.x + pane.width / 2, y: pane.y + pane.height / 2 };
  const world = {
    x: (anchor.x - pane.x - beforeZoom.viewport.x) / beforeZoom.viewport.zoom,
    y: (anchor.y - pane.y - beforeZoom.viewport.y) / beforeZoom.viewport.zoom,
  };
  await page.mouse.move(anchor.x, anchor.y);
  await page.mouse.wheel(0, 300);
  const zoomed = await saved(page, doc => doc.viewport.zoom < beforeZoom.viewport.zoom - .1);
  expect(zoomed.nodes.map(item => item.position)).toEqual(beforeZoom.nodes.map(item => item.position));
  expect(Math.abs(zoomed.viewport.x + world.x * zoomed.viewport.zoom - (anchor.x - pane.x))).toBeLessThan(2);
  expect(Math.abs(zoomed.viewport.y + world.y * zoomed.viewport.zoom - (anchor.y - pane.y))).toBeLessThan(2);
  const heading = await node(page, image).locator('.node-heading').boundingBox();
  if (!heading) throw new Error('Image header has no bounds');
  const original = zoomed.nodes.find(item => item.id === image);
  if (!original) throw new Error('Image node is missing');
  const x = heading.x + heading.width * .4;
  const y = heading.y + heading.height / 2;
  const delta = { x: 65, y: 35 };
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + delta.x, y + delta.y, { steps: 15 });
  await page.mouse.up();
  const dragged = await saved(page, doc => Math.abs((doc.nodes.find(item => item.id === image)?.position.x ?? original.position.x) - original.position.x) > 5);
  const moved = dragged.nodes.find(item => item.id === image)!;
  expect(moved.position.x - original.position.x).toBeCloseTo(delta.x / zoomed.viewport.zoom, 0);
  expect(moved.position.y - original.position.y).toBeCloseTo(delta.y / zoomed.viewport.zoom, 0);
  expect(dragged.nodes.find(item => item.id === prompt)?.position).toEqual(zoomed.nodes.find(item => item.id === prompt)?.position);
});
