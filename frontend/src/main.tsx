import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.tsx'
import { TextSizeProvider } from './context/TextSizeContext'
import { LanguageProvider } from './context/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <TextSizeProvider>
        <App />
      </TextSizeProvider>
    </LanguageProvider>
  </StrictMode>,
)
