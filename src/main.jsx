import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initTema } from './lib/tema.js'
import './index.css'

initTema()

document.addEventListener('contextmenu', (e) => {
  const t = e.target
  if (!(t instanceof HTMLInputElement) && !(t instanceof HTMLTextAreaElement)) {
    e.preventDefault()
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
