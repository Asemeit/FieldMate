import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { clearStaleLocalhostPwa } from './lib/pwaCleanup.ts'
import { mlClassifierService } from './services/mlClassifier'
import './index.css'
import App from './App.tsx'

async function bootstrap() {
  await clearStaleLocalhostPwa()

  try {
    const savedTheme = localStorage.getItem('fieldmate_theme')
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  } catch {
    // ignore
  }

  void mlClassifierService.ensureLoaded()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
