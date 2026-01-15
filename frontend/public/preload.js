/**
 * preload.js
 * 
 * Script de preload para Electron que expone APIs de forma segura
 * al contexto del renderer usando contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

// 🆕 Inyectar POS_ONLY_MODE ANTES de que se cargue React
window.POS_ONLY_MODE = true;
window.IS_ELECTRON = true;

console.log('✅ Variables globales inyectadas en preload:', {
    POS_ONLY_MODE: window.POS_ONLY_MODE,
    IS_ELECTRON: window.IS_ELECTRON
});

// Lista blanca de canales IPC permitidos
const validChannels = [
    'imprimir-raw',
    'imprimir-ticket-silencioso',
    'listar-impresoras'
];

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        invoke: (channel, ...args) => {
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, ...args);
            }
            throw new Error(`Canal IPC no permitido: ${channel}`);
        }
    }
});

console.log('✅ Preload script cargado');
