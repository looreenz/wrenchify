import { contextBridge, ipcRenderer } from 'electron'

// Minimal preload bridge. Full entity APIs will be exposed in Batch 2.
const api = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron
  },
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
}

contextBridge.exposeInMainWorld('wrenchifyAPI', api)

export type WrenchifyAPI = typeof api

declare global {
  interface Window {
    wrenchifyAPI: WrenchifyAPI
  }
}
