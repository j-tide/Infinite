import { WorkspacePage } from '../pages/workspace/WorkspacePage';
import { AppProviders } from './providers/AppProviders';

export default function App() {
  return <AppProviders><WorkspacePage /></AppProviders>;
}
