import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  WorkOrder,
  WorkOrderCreate,
  WorkOrderFilter,
  WorkOrderItem,
  WorkOrderItemCreate,
  WorkOrderItemUpdate,
  WorkOrderUpdate
} from '../../shared/types'

export const useWorkOrderStore = defineStore('workOrders', () => {
  const workOrders = ref<WorkOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(filter?: WorkOrderFilter): Promise<void> {
    loading.value = true
    error.value = null
    try {
      workOrders.value = await window.wrenchifyAPI.workOrders.list(filter)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getById(id: number): Promise<WorkOrder | undefined> {
    return window.wrenchifyAPI.workOrders.getById(id)
  }

  async function create(data: WorkOrderCreate): Promise<WorkOrder> {
    const created = await window.wrenchifyAPI.workOrders.create(data)
    await load()
    return created
  }

  async function update(id: number, data: WorkOrderUpdate): Promise<WorkOrder> {
    const updated = await window.wrenchifyAPI.workOrders.update(id, data)
    await load()
    return updated
  }

  async function remove(id: number): Promise<void> {
    await window.wrenchifyAPI.workOrders.delete(id)
    await load()
  }

  async function getLineItems(workOrderId: number): Promise<WorkOrderItem[]> {
    return window.wrenchifyAPI.workOrders.getLineItems(workOrderId)
  }

  async function addLineItem(
    workOrderId: number,
    data: WorkOrderItemCreate
  ): Promise<WorkOrderItem> {
    const item = await window.wrenchifyAPI.workOrders.addLineItem(workOrderId, data)
    await load()
    return item
  }

  async function updateLineItem(
    itemId: number,
    data: WorkOrderItemUpdate
  ): Promise<WorkOrderItem> {
    const item = await window.wrenchifyAPI.workOrders.updateLineItem(itemId, data)
    await load()
    return item
  }

  async function deleteLineItem(itemId: number): Promise<void> {
    await window.wrenchifyAPI.workOrders.deleteLineItem(itemId)
    await load()
  }

  return {
    workOrders,
    loading,
    error,
    load,
    getById,
    create,
    update,
    remove,
    getLineItems,
    addLineItem,
    updateLineItem,
    deleteLineItem
  }
})
