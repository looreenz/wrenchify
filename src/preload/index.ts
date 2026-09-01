import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { DownloadProgress, UpdateInfo, WrenchifyAPI } from '../shared/types'

const api: WrenchifyAPI = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron
  },
  customers: {
    list: (search) => ipcRenderer.invoke('customers:list', search),
    getById: (id) => ipcRenderer.invoke('customers:getById', id),
    create: (data) => ipcRenderer.invoke('customers:create', data),
    update: (id, data) => ipcRenderer.invoke('customers:update', id, data),
    delete: (id) => ipcRenderer.invoke('customers:delete', id)
  },
  vehicles: {
    list: (filter) => ipcRenderer.invoke('vehicles:list', filter),
    getById: (id) => ipcRenderer.invoke('vehicles:getById', id),
    create: (data) => ipcRenderer.invoke('vehicles:create', data),
    update: (id, data) => ipcRenderer.invoke('vehicles:update', id, data),
    delete: (id) => ipcRenderer.invoke('vehicles:delete', id),
    getTimeline: (vehicleId) => ipcRenderer.invoke('vehicles:getTimeline', vehicleId)
  },
  quotes: {
    list: (filter) => ipcRenderer.invoke('quotes:list', filter),
    getById: (id) => ipcRenderer.invoke('quotes:getById', id),
    create: (data) => ipcRenderer.invoke('quotes:create', data),
    update: (id, data) => ipcRenderer.invoke('quotes:update', id, data),
    delete: (id) => ipcRenderer.invoke('quotes:delete', id),
    convert: (id) => ipcRenderer.invoke('quotes:convert', id),
    getLineItems: (quoteId) => ipcRenderer.invoke('quotes:getLineItems', quoteId),
    addLineItem: (quoteId, data) => ipcRenderer.invoke('quotes:addLineItem', quoteId, data),
    updateLineItem: (itemId, data) => ipcRenderer.invoke('quotes:updateLineItem', itemId, data),
    deleteLineItem: (itemId) => ipcRenderer.invoke('quotes:deleteLineItem', itemId)
  },
  workOrders: {
    list: (filter) => ipcRenderer.invoke('workOrders:list', filter),
    getById: (id) => ipcRenderer.invoke('workOrders:getById', id),
    create: (data) => ipcRenderer.invoke('workOrders:create', data),
    update: (id, data) => ipcRenderer.invoke('workOrders:update', id, data),
    delete: (id) => ipcRenderer.invoke('workOrders:delete', id),
    getLineItems: (workOrderId) => ipcRenderer.invoke('workOrders:getLineItems', workOrderId),
    addLineItem: (workOrderId, data) => ipcRenderer.invoke('workOrders:addLineItem', workOrderId, data),
    updateLineItem: (itemId, data) => ipcRenderer.invoke('workOrders:updateLineItem', itemId, data),
    deleteLineItem: (itemId) => ipcRenderer.invoke('workOrders:deleteLineItem', itemId)
  },
  payments: {
    listByWorkOrder: (workOrderId) => ipcRenderer.invoke('payments:listByWorkOrder', workOrderId),
    create: (data) => ipcRenderer.invoke('payments:create', data),
    update: (id, data) => ipcRenderer.invoke('payments:update', id, data),
    delete: (id) => ipcRenderer.invoke('payments:delete', id)
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    update: (key, value) => ipcRenderer.invoke('settings:update', key, value)
  },
  dashboard: {
    getKPIs: (dateRange) => ipcRenderer.invoke('dashboard:getKPIs', dateRange),
    getRevenueTrend: (endDate) => ipcRenderer.invoke('dashboard:getRevenueTrend', endDate)
  },
  backup: {
    exportManual: () => ipcRenderer.invoke('backup:exportManual'),
    restore: () => ipcRenderer.invoke('backup:restore')
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:downloadUpdate'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),
    onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
      const listener = (_event: IpcRendererEvent, info: UpdateInfo) => callback(info)
      ipcRenderer.on('updater:updateAvailable', listener)
      return () => ipcRenderer.removeListener('updater:updateAvailable', listener)
    },
    onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
      const listener = (_event: IpcRendererEvent, info: UpdateInfo) => callback(info)
      ipcRenderer.on('updater:updateDownloaded', listener)
      return () => ipcRenderer.removeListener('updater:updateDownloaded', listener)
    },
    onUpdateError: (callback: (error: string) => void) => {
      const listener = (_event: IpcRendererEvent, error: string) => callback(error)
      ipcRenderer.on('updater:error', listener)
      return () => ipcRenderer.removeListener('updater:error', listener)
    },
    onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
      const listener = (_event: IpcRendererEvent, progress: DownloadProgress) => callback(progress)
      ipcRenderer.on('updater:downloadProgress', listener)
      return () => ipcRenderer.removeListener('updater:downloadProgress', listener)
    }
  }
}

contextBridge.exposeInMainWorld('wrenchifyAPI', api)

declare global {
  interface Window {
    wrenchifyAPI: WrenchifyAPI
  }
}
