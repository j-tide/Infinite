import { expect, type Locator, type Page } from '@playwright/test';
import type { CanvasDocument } from '../../src/features/canvas/types';

export const STORAGE_KEY = 'infinite-canvas:v1';
export type SavedDocument = CanvasDocument;

export async function document(page: Page): Promise<SavedDocument> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), STORAGE_KEY);
}

export async function saved(page: Page, predicate: (doc: SavedDocument) => boolean) {
  await expect.poll(async () => {
    const value = await document(page);
    return Boolean(value && predicate(value));
  }).toBe(true);
  await expect(page.getByTestId('save-status')).toHaveText('已保存');
  return document(page);
}

export function node(page: Page, id: string) {
  return page.locator(`.react-flow__node[data-id="${id}"]`);
}

export async function idOf(card: Locator): Promise<string> {
  return card.locator('xpath=ancestor::*[contains(@class,"react-flow__node")][1]').getAttribute('data-id') as Promise<string>;
}

export async function connect(page: Page, source: string, target: string, input: 'image' | 'prompt') {
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

export async function createGraph(page: Page) {
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

export async function runSuccess(page: Page, generator: string) {
  const card = node(page, generator);
  await card.getByRole('button', { name: '生成图片', exact: true }).click();
  await expect(card).toContainText('排队');
  await expect(card.getByRole('button', { name: '生成图片', exact: true })).toBeDisabled();
  await expect(card).toContainText('生成中');
  return saved(page, d => d.tasks.some(t => t.nodeId === generator && t.status === 'succeeded'));
}
