import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TextSizeProvider } from './context/TextSizeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TextSizeProvider>
      <App />
    </TextSizeProvider>
  </StrictMode>,
)
