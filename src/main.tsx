import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Kit design tokens + globals first, then the app's own styles.
import '../ui-kit/src/styles/tokens.scss'
import '../ui-kit/src/styles/globals.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
