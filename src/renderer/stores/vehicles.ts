import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Vehicle,
  VehicleCreate,
  VehicleFilter,
  VehicleTimelineEntry,
  VehicleUpdate
} from '../../shared/types'

export const useVehicleStore = defineStore('vehicles', () => {
  const vehicles = ref<Vehicle[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(filter?: VehicleFilter): Promise<void> {
    loading.value = true
    error.value = null
    try {
      vehicles.value = await window.wrenchifyAPI.vehicles.list(filter)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getById(id: number): Promise<Vehicle | undefined> {
    return window.wrenchifyAPI.vehicles.getById(id)
  }

  async function getTimeline(vehicleId: number): Promise<VehicleTimelineEntry[]> {
    return window.wrenchifyAPI.vehicles.getTimeline(vehicleId)
  }

  async function create(data: VehicleCreate): Promise<Vehicle> {
    const created = await window.wrenchifyAPI.vehicles.create(data)
    await load()
    return created
  }

  async function update(id: number, data: VehicleUpdate): Promise<Vehicle> {
    const updated = await window.wrenchifyAPI.vehicles.update(id, data)
    await load()
    return updated
  }

  async function remove(id: number): Promise<void> {
    await window.wrenchifyAPI.vehicles.delete(id)
    await load()
  }

  return {
    vehicles,
    loading,
    error,
    load,
    getById,
    getTimeline,
    create,
    update,
    remove
  }
})
