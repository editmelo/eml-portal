import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '10px',
            background: '#0d1f3c',
            color: '#f1f5f9',
            fontSize: '14px',
            border: '1px solid #193561',
          },
          success: { iconTheme: { primary: '#47C9F3', secondary: '#0d1f3c' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#0d1f3c' } },
        }}
      />
    </BrowserRouter>
  </StrictMode>
)
