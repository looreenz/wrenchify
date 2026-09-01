import { BrowserWindow, ipcMain } from 'electron'
import { exportManualBackup, restoreFromBackup } from '../backup'
import {
  checkForUpdates,
  downloadUpdate,
  getUpdaterStatus,
  initAutoUpdater,
  quitAndInstall
} from '../autoUpdater'
import * as customerRepository from '../../db/repositories/customerRepository'
import * as vehicleRepository from '../../db/repositories/vehicleRepository'
import * as quoteRepository from '../../db/repositories/quoteRepository'
import * as workOrderRepository from '../../db/repositories/workOrderRepository'
import * as paymentRepository from '../../db/repositories/paymentRepository'
import * as settingsRepository from '../../db/repositories/settingsRepository'
import * as dashboardRepository from '../../db/repositories/dashboardRepository'
import type {
  CustomerCreate,
  CustomerUpdate,
  VehicleCreate,
  VehicleUpdate,
  VehicleFilter,
  QuoteCreate,
  QuoteUpdate,
  QuoteFilter,
  QuoteItemCreate,
  QuoteItemUpdate,
  WorkOrderCreate,
  WorkOrderUpdate,
  WorkOrderFilter,
  WorkOrderItemCreate,
  WorkOrderItemUpdate,
  PaymentCreate,
  PaymentUpdate,
  SettingKey,
  DateRange
} from '../../shared/types'

export function registerAllHandlers(mainWindow: BrowserWindow): void {
  initAutoUpdater(mainWindow)

  ipcMain.handle('customers:list', async (_event, search?: string) => {
    return customerRepository.list(search)
  })

  ipcMain.handle('customers:getById', async (_event, id: number) => {
    return customerRepository.getById(id)
  })

  ipcMain.handle('customers:create', async (_event, data: CustomerCreate) => {
    return customerRepository.create(data)
  })

  ipcMain.handle('customers:update', async (_event, id: number, data: CustomerUpdate) => {
    return customerRepository.update(id, data)
  })

  ipcMain.handle('customers:delete', async (_event, id: number) => {
    return customerRepository.remove(id)
  })

  ipcMain.handle('vehicles:list', async (_event, filter?: VehicleFilter) => {
    return vehicleRepository.list(filter)
  })

  ipcMain.handle('vehicles:getById', async (_event, id: number) => {
    return vehicleRepository.getById(id)
  })

  ipcMain.handle('vehicles:create', async (_event, data: VehicleCreate) => {
    return vehicleRepository.create(data)
  })

  ipcMain.handle('vehicles:update', async (_event, id: number, data: VehicleUpdate) => {
    return vehicleRepository.update(id, data)
  })

  ipcMain.handle('vehicles:delete', async (_event, id: number) => {
    return vehicleRepository.remove(id)
  })

  ipcMain.handle('vehicles:getTimeline', async (_event, vehicleId: number) => {
    return vehicleRepository.getTimeline(vehicleId)
  })

  ipcMain.handle('quotes:list', async (_event, filter?: QuoteFilter) => {
    return quoteRepository.list(filter)
  })

  ipcMain.handle('quotes:getById', async (_event, id: number) => {
    return quoteRepository.getById(id)
  })

  ipcMain.handle('quotes:create', async (_event, data: QuoteCreate) => {
    return quoteRepository.create(data)
  })

  ipcMain.handle('quotes:update', async (_event, id: number, data: QuoteUpdate) => {
    return quoteRepository.update(id, data)
  })

  ipcMain.handle('quotes:delete', async (_event, id: number) => {
    return quoteRepository.remove(id)
  })

  ipcMain.handle('quotes:convert', async (_event, id: number) => {
    return quoteRepository.convert(id)
  })

  ipcMain.handle('quotes:getLineItems', async (_event, quoteId: number) => {
    return quoteRepository.getLineItems(quoteId)
  })

  ipcMain.handle('quotes:addLineItem', async (_event, quoteId: number, data: QuoteItemCreate) => {
    return quoteRepository.addLineItem(quoteId, data)
  })

  ipcMain.handle('quotes:updateLineItem', async (_event, itemId: number, data: QuoteItemUpdate) => {
    return quoteRepository.updateLineItem(itemId, data)
  })

  ipcMain.handle('quotes:deleteLineItem', async (_event, itemId: number) => {
    return quoteRepository.deleteLineItem(itemId)
  })

  ipcMain.handle('workOrders:list', async (_event, filter?: WorkOrderFilter) => {
    return workOrderRepository.list(filter)
  })

  ipcMain.handle('workOrders:getById', async (_event, id: number) => {
    return workOrderRepository.getById(id)
  })

  ipcMain.handle('workOrders:create', async (_event, data: WorkOrderCreate) => {
    return workOrderRepository.create(data)
  })

  ipcMain.handle('workOrders:update', async (_event, id: number, data: WorkOrderUpdate) => {
    return workOrderRepository.update(id, data)
  })

  ipcMain.handle('workOrders:delete', async (_event, id: number) => {
    return workOrderRepository.remove(id)
  })

  ipcMain.handle('workOrders:getLineItems', async (_event, workOrderId: number) => {
    return workOrderRepository.getLineItems(workOrderId)
  })

  ipcMain.handle('workOrders:addLineItem', async (_event, workOrderId: number, data: WorkOrderItemCreate) => {
    return workOrderRepository.addLineItem(workOrderId, data)
  })

  ipcMain.handle('workOrders:updateLineItem', async (_event, itemId: number, data: WorkOrderItemUpdate) => {
    return workOrderRepository.updateLineItem(itemId, data)
  })

  ipcMain.handle('workOrders:deleteLineItem', async (_event, itemId: number) => {
    return workOrderRepository.deleteLineItem(itemId)
  })

  ipcMain.handle('payments:listByWorkOrder', async (_event, workOrderId: number) => {
    return paymentRepository.listByWorkOrder(workOrderId)
  })

  ipcMain.handle('payments:create', async (_event, data: PaymentCreate) => {
    return paymentRepository.create(data)
  })

  ipcMain.handle('payments:update', async (_event, id: number, data: PaymentUpdate) => {
    return paymentRepository.update(id, data)
  })

  ipcMain.handle('payments:delete', async (_event, id: number) => {
    return paymentRepository.remove(id)
  })

  ipcMain.handle('settings:getAll', async () => {
    return settingsRepository.getAll()
  })

  ipcMain.handle('settings:update', async (_event, key: SettingKey, value: string) => {
    return settingsRepository.update(key, value)
  })

  ipcMain.handle('backup:exportManual', async () => {
    return exportManualBackup()
  })

  ipcMain.handle('backup:restore', async () => {
    return restoreFromBackup()
  })

  ipcMain.handle('updater:checkForUpdates', async () => {
    await checkForUpdates()
    return getUpdaterStatus()
  })

  ipcMain.handle('updater:downloadUpdate', async () => {
    await downloadUpdate()
  })

  ipcMain.handle('updater:quitAndInstall', () => {
    quitAndInstall()
  })

  ipcMain.handle('dashboard:getKPIs', async (_event, dateRange: DateRange) => {
    return dashboardRepository.getKPIs(dateRange.start, dateRange.end)
  })

  ipcMain.handle('dashboard:getRevenueTrend', async (_event, endDate: string) => {
    return dashboardRepository.getRevenueTrend(endDate)
  })
}
