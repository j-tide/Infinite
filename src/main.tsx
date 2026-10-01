import React from 'react';
import ReactDOM from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import App from './app/App';
import './app/styles/tailwind.css';
import './app/styles/base.css';
import './features/canvas/styles/react-flow.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
