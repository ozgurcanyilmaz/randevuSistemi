import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/plugins/fontawesome-free/css/all.min.css'
import './assets/dist/css/adminlte.min.css'
import './assets/plugins/select2/css/select2.min.css'
import './assets/plugins/jquery/jquery.min.js'
import './assets/plugins/bootstrap/js/bootstrap.bundle.min.js'
import './assets/plugins/select2/js/select2.full.min.js'
import './assets/dist/js/adminlte.min.js'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
