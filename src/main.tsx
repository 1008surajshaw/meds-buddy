import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { StrictMode } from 'react';
import { AuthContextProvider } from './context/AuthContext.tsx';

createRoot(document.getElementById("root")!).render(
    <StrictMode>

      <AuthContextProvider>
         <App/>
      </AuthContextProvider>
  
  </StrictMode>
);
