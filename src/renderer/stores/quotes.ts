import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Quote,
  QuoteCreate,
  QuoteFilter,
  QuoteUpdate,
  QuoteItem,
  QuoteItemCreate,
  QuoteItemUpdate,
  WorkOrder
} from '../../shared/types'

export const useQuoteStore = defineStore('quotes', () => {
  const quotes = ref<Quote[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(filter?: QuoteFilter): Promise<void> {
    loading.value = true
    error.value = null
    try {
      quotes.value = await window.wrenchifyAPI.quotes.list(filter)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getById(id: number): Promise<Quote | undefined> {
    return window.wrenchifyAPI.quotes.getById(id)
  }

  async function create(data: QuoteCreate): Promise<Quote> {
    const created = await window.wrenchifyAPI.quotes.create(data)
    await load()
    return created
  }

  async function update(id: number, data: QuoteUpdate): Promise<Quote> {
    const updated = await window.wrenchifyAPI.quotes.update(id, data)
    await load()
    return updated
  }

  async function remove(id: number): Promise<void> {
    await window.wrenchifyAPI.quotes.delete(id)
    await load()
  }

  async function convert(id: number): Promise<WorkOrder> {
    const workOrder = await window.wrenchifyAPI.quotes.convert(id)
    await load()
    return workOrder
  }

  async function getLineItems(quoteId: number): Promise<QuoteItem[]> {
    return window.wrenchifyAPI.quotes.getLineItems(quoteId)
  }

  async function addLineItem(quoteId: number, data: QuoteItemCreate): Promise<QuoteItem> {
    const item = await window.wrenchifyAPI.quotes.addLineItem(quoteId, data)
    await load()
    return item
  }

  async function updateLineItem(itemId: number, data: QuoteItemUpdate): Promise<QuoteItem> {
    const item = await window.wrenchifyAPI.quotes.updateLineItem(itemId, data)
    await load()
    return item
  }

  async function deleteLineItem(itemId: number): Promise<void> {
    await window.wrenchifyAPI.quotes.deleteLineItem(itemId)
    await load()
  }

  return {
    quotes,
    loading,
    error,
    load,
    getById,
    create,
    update,
    remove,
    convert,
    getLineItems,
    addLineItem,
    updateLineItem,
    deleteLineItem
  }
})
