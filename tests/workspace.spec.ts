import { expect, test } from '@playwright/test';
import type { CanvasDocument } from '../src/features/canvas/types';

const STORAGE_KEY = 'infinite-canvas:v1';

test('空状态入口、指南开关和缩放控件在工作区拆分后仍可协同操作', async ({
  page,
}) => {
  await page.goto('/');
  const fit = page.getByRole('button', { name: '适配画布', exact: true });
  await expect(fit).toBeDisabled();

  const readZoom = () =>
    page.evaluate((key) => {
      const doc: CanvasDocument = JSON.parse(localStorage.getItem(key)!);
      return doc.viewport.zoom;
    }, STORAGE_KEY);
  await page.getByRole('button', { name: '缩小画布', exact: true }).click();
  await expect.poll(readZoom).toBeLessThan(1);
  await expect(page.getByTestId('save-status')).toHaveText('已保存');
  const zoom = await readZoom();
  await page.getByRole('button', { name: '放大画布', exact: true }).click();
  await expect.poll(readZoom).toBeGreaterThan(zoom);

  await page
    .getByRole('button', { name: '添加第一条提示词', exact: true })
    .click();
  await expect(page.getByTestId('prompt-node')).toHaveCount(1);
  await expect(fit).toBeEnabled();
  await expect(
    page.getByRole('button', { name: '添加第一条提示词', exact: true }),
  ).toHaveCount(0);

  const guide = page.getByRole('button', { name: '操作指南', exact: true });
  const title = page.getByText('三步，开始创作', { exact: true });
  await guide.click();
  await expect(title).toBeVisible();
  await page.getByRole('button', { name: '关闭指南', exact: true }).click();
  await expect(title).toHaveCount(0);
  await guide.click();
  await expect(title).toBeVisible();
  await guide.click();
  await expect(title).toHaveCount(0);
});

test('存储写入失败显示提示，恢复存储后重试保存保留未落盘的编辑', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('save-status')).toHaveText('已保存');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('测试存储写入失败');
    };
    const testWindow = window as typeof window & { restoreStorage(): void };
    testWindow.restoreStorage = () => {
      Storage.prototype.setItem = original;
    };
  });

  await page
    .getByRole('button', { name: '添加提示词节点', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: '提示词内容' })
    .fill('保留尚未保存的灵感');
  await expect(page.getByRole('alert')).toContainText('测试存储写入失败');
  await expect(page.getByTestId('save-status')).toHaveText('保存失败');
  const storedCount = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).nodes.length,
    STORAGE_KEY,
  );
  expect(storedCount).toBe(0);

  await page.evaluate(() => {
    const testWindow = window as typeof window & { restoreStorage(): void };
    testWindow.restoreStorage();
  });
  await page.getByRole('button', { name: '重试保存', exact: true }).click();
  await expect(page.getByTestId('save-status')).toHaveText('已保存');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('textbox', { name: '提示词内容' })).toHaveValue(
    '保留尚未保存的灵感',
  );
});
