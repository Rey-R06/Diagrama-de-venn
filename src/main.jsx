import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Diagrama from './principal/Diagrama'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Diagrama />
  </StrictMode>,
)
