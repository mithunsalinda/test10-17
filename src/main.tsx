import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import EditableTree from './EditableTree.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
    <EditableTree />
    <App />
    </>
  </StrictMode>,
)
