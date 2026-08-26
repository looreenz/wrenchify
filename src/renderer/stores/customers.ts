import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerWithVehicleCount
} from '../../shared/types'

export const useCustomerStore = defineStore('customers', () => {
  const customers = ref<CustomerWithVehicleCount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(search?: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      customers.value = await window.wrenchifyAPI.customers.list(search)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getById(id: number): Promise<Customer | undefined> {
    return window.wrenchifyAPI.customers.getById(id)
  }

  async function create(data: CustomerCreate): Promise<Customer> {
    const created = await window.wrenchifyAPI.customers.create(data)
    await load()
    return created
  }

  async function update(id: number, data: CustomerUpdate): Promise<Customer> {
    const updated = await window.wrenchifyAPI.customers.update(id, data)
    await load()
    return updated
  }

  async function remove(id: number): Promise<void> {
    await window.wrenchifyAPI.customers.delete(id)
    await load()
  }

  return {
    customers,
    loading,
    error,
    load,
    getById,
    create,
    update,
    remove
  }
})
