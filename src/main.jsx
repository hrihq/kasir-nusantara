import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initTema } from './lib/tema.js'
import { pulihkanDariCermin } from './lib/cermin.js'
import './index.css'

initTema()

document.addEventListener('contextmenu', (e) => {
  const t = e.target
  if (!(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement)) {
    e.preventDefault()
  }
})

// Sebelum render: kalau localStorage kosong tapi ada cermin data di Documents,
// pulihkan dulu lalu muat ulang agar data warung tidak hilang saat "clear data".
pulihkanDariCermin().then((dipulihkan) => {
  if (dipulihkan) {
    location.reload()
    return
  }
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
