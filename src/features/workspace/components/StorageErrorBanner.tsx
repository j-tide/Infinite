import { useShallow } from 'zustand/react/shallow';
import { useCanvasStore } from '../../canvas/store/canvasStore';

export function StorageErrorBanner() {
  const { saveStatus, recoveryBlocked, saveError, startFresh, retrySave } = useCanvasStore(useShallow(state => ({
    saveStatus: state.saveStatus,
    recoveryBlocked: state.recoveryBlocked,
    saveError: state.saveError,
    startFresh: state.startFresh,
    retrySave: state.retrySave,
  })));
  if (saveStatus !== 'error') return null;
  return (
    <div className="storage-banner" role="alert"><span><strong>{recoveryBlocked ? '恢复失败' : '保存失败'}</strong> · {saveError}</span><button onClick={recoveryBlocked ? startFresh : retrySave}>{recoveryBlocked ? '新建本地画布' : '重试保存'}</button></div>
  );
}
