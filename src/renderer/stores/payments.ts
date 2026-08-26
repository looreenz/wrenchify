import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Payment,
  PaymentCreate,
  PaymentUpdate
} from '../../shared/types'

export const usePaymentStore = defineStore('payments', () => {
  const payments = ref<Payment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadByWorkOrder(workOrderId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      payments.value = await window.wrenchifyAPI.payments.listByWorkOrder(workOrderId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function create(data: PaymentCreate): Promise<Payment> {
    const created = await window.wrenchifyAPI.payments.create(data)
    await loadByWorkOrder(data.work_order_id)
    return created
  }

  async function update(id: number, data: PaymentUpdate): Promise<Payment> {
    const updated = await window.wrenchifyAPI.payments.update(id, data)
    if (data.work_order_id !== undefined) {
      await loadByWorkOrder(data.work_order_id)
    }
    return updated
  }

  async function remove(id: number, workOrderId: number): Promise<void> {
    await window.wrenchifyAPI.payments.delete(id)
    await loadByWorkOrder(workOrderId)
  }

  return {
    payments,
    loading,
    error,
    loadByWorkOrder,
    create,
    update,
    remove
  }
})
