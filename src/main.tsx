import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// One-time migration: clean up old 'unikops-*' localStorage keys from before the rename to UniklifeOps.
try {
  const old = localStorage.getItem('unikops-auth')
  if (old) localStorage.removeItem('unikops-auth')
  const oldUi = localStorage.getItem('unikops-ui')
  if (oldUi) localStorage.removeItem('unikops-ui')
  const oldSb = localStorage.getItem('unikops-sb-session')
  if (oldSb) localStorage.removeItem('unikops-sb-session')
} catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
