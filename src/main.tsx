import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import { App } from './App'

const queryParams = new URLSearchParams(window.location.search)
console.log('queryParams', queryParams.toString())

const hasExternalLaunchParams = queryParams.has('bid') && queryParams.has('cid')
document.title = hasExternalLaunchParams ? 'SM-Service' : 'Service'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found in document')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
