import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

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
