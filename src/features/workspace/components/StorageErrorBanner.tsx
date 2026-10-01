import { useShallow } from 'zustand/react/shallow';
import { useCanvasStore } from '../../canvas/store/canvasStore';

export function StorageErrorBanner() {
  const { saveStatus, recoveryBlocked, saveError, startFresh, retrySave } =
    useCanvasStore(
      useShallow((state) => ({
        saveStatus: state.saveStatus,
        recoveryBlocked: state.recoveryBlocked,
        saveError: state.saveError,
        startFresh: state.startFresh,
        retrySave: state.retrySave,
      })),
    );
  if (saveStatus !== 'error') return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-100 flex items-center justify-center gap-3.75 border-t border-storage-error-border bg-storage-error px-5 py-3.25 text-[12px] text-storage-error-text"
      role="alert"
    >
      <span>
        <strong>{recoveryBlocked ? '恢复失败' : '保存失败'}</strong> ·{' '}
        {saveError}
      </span>
      <button
        className="rounded-badge bg-storage-error-text px-2.5 py-1.75 text-storage-error"
        onClick={recoveryBlocked ? startFresh : retrySave}
      >
        {recoveryBlocked ? '新建本地画布' : '重试保存'}
      </button>
    </div>
  );
}
