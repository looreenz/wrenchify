import { contextBridge, ipcRenderer } from 'electron'
import type { WrenchifyAPI } from '../shared/types'

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
    convert: (id) => ipcRenderer.invoke('quotes:convert', id)
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
  backup: {
    exportManual: () => ipcRenderer.invoke('backup:exportManual'),
    restore: () => ipcRenderer.invoke('backup:restore')
  }
}

contextBridge.exposeInMainWorld('wrenchifyAPI', api)

declare global {
  interface Window {
    wrenchifyAPI: WrenchifyAPI
  }
}
