/*
=========================================================
SETOR 1 — PONTO DE ENTRADA DA APLICAÇÃO
Esse arquivo inicia o React e renderiza o App principal.
Também importa o Bootstrap e o CSS personalizado.
=========================================================
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);