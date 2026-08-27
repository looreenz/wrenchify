// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import LineItemsEditor from '../../../src/renderer/components/LineItemsEditor.vue'
import { i18n } from '../../../src/i18n'
import type { Quote, QuoteItem, WorkOrder, WorkOrderItem } from '../../../src/shared/types'

const mockQuoteStore = {
  getById: vi.fn(),
  getLineItems: vi.fn(),
  addLineItem: vi.fn(),
  updateLineItem: vi.fn(),
  deleteLineItem: vi.fn()
}

const mockWorkOrderStore = {
  getById: vi.fn(),
  getLineItems: vi.fn(),
  addLineItem: vi.fn(),
  updateLineItem: vi.fn(),
  deleteLineItem: vi.fn()
}

vi.mock('../../../src/renderer/stores/quotes', () => ({
  useQuoteStore: () => mockQuoteStore
}))

vi.mock('../../../src/renderer/stores/workOrders', () => ({
  useWorkOrderStore: () => mockWorkOrderStore
}))

function setupPinia(): void {
  setActivePinia(createPinia())
}

function getTestI18n() {
  i18n.global.locale.value = 'es'
  return i18n
}

function createQuoteItem(overrides?: Partial<QuoteItem>): QuoteItem {
  return {
    id: 1,
    quote_id: 10,
    description: 'Brake pads',
    quantity: 2,
    customer_price: 45,
    workshop_price: 30,
    item_type: 'parts',
    created_at: '',
    updated_at: '',
    ...overrides
  }
}

function createWorkOrderItem(overrides?: Partial<WorkOrderItem>): WorkOrderItem {
  return {
    id: 1,
    work_order_id: 20,
    description: 'Brake pads',
    quantity: 2,
    customer_price: 45,
    workshop_price: 30,
    item_type: 'parts',
    created_at: '',
    updated_at: '',
    ...overrides
  }
}

function createQuote(overrides?: Partial<Quote>): Quote {
  return {
    id: 10,
    customer_id: 1,
    vehicle_id: 1,
    quote_number: 'Q-001',
    date: '2026-08-27',
    status: 'draft',
    description: null,
    labor_hours: 1,
    hourly_rate: 50,
    vat_rate: 0.21,
    customer_total: 0,
    workshop_total: 0,
    notes: null,
    created_at: '',
    updated_at: '',
    ...overrides
  }
}

function createWorkOrder(overrides?: Partial<WorkOrder>): WorkOrder {
  return {
    id: 20,
    customer_id: 1,
    vehicle_id: 1,
    quote_id: null,
    order_number: 'WO-001',
    date_in: '2026-08-27',
    date_out: null,
    mileage_in: null,
    mileage_out: null,
    description: null,
    labor_hours: 1,
    hourly_rate: 50,
    vat_rate: 0.21,
    customer_total: 0,
    workshop_total: 0,
    payment_status: 'pending',
    notes: null,
    created_at: '',
    updated_at: '',
    ...overrides
  }
}

describe('LineItemsEditor', () => {
  beforeEach(() => {
    setupPinia()
    vi.clearAllMocks()
  })

  it('renders quote variant title and line items', async () => {
    mockQuoteStore.getById.mockResolvedValue(createQuote())
    mockQuoteStore.getLineItems.mockResolvedValue([createQuoteItem()])

    const wrapper = mount(LineItemsEditor, {
      props: {
        variant: 'quote',
        documentId: 10,
        vatRate: 0.21,
        showWorkshopPrice: true
      },
      global: {
        plugins: [getTestI18n()]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Artículos')
    expect(wrapper.find('input').element.value).toBe('Brake pads')
  })

  it('renders work order variant title and line items', async () => {
    mockWorkOrderStore.getById.mockResolvedValue(createWorkOrder())
    mockWorkOrderStore.getLineItems.mockResolvedValue([createWorkOrderItem()])

    const wrapper = mount(LineItemsEditor, {
      props: {
        variant: 'workOrder',
        documentId: 20,
        vatRate: 0.21,
        showWorkshopPrice: true
      },
      global: {
        plugins: [getTestI18n()]
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Líneas de trabajo')
    expect(wrapper.find('input').element.value).toBe('Brake pads')
  })

  it('emits document totals for parts items with VAT', async () => {
    mockQuoteStore.getById.mockResolvedValue(createQuote({ labor_hours: 0, hourly_rate: 0 }))
    mockQuoteStore.getLineItems.mockResolvedValue([
      createQuoteItem({ customer_price: 100, workshop_price: 70, quantity: 1 })
    ])

    const wrapper = mount(LineItemsEditor, {
      props: {
        variant: 'quote',
        documentId: 10,
        vatRate: 0.21,
        showWorkshopPrice: true
      },
      global: {
        plugins: [getTestI18n()]
      }
    })

    await flushPromises()

    const emitted = wrapper.emitted('updated')
    expect(emitted).toBeDefined()
    const lastEvent = emitted![emitted!.length - 1] as [{ customer_total: number; workshop_total: number; net_profit: number }]
    expect(lastEvent[0].customer_total).toBe(121)
    expect(lastEvent[0].workshop_total).toBe(84.7)
    expect(lastEvent[0].net_profit).toBe(36.3)
  })

  it('hides workshop price columns when showWorkshopPrice is false', async () => {
    mockQuoteStore.getById.mockResolvedValue(createQuote())
    mockQuoteStore.getLineItems.mockResolvedValue([createQuoteItem()])

    const wrapper = mount(LineItemsEditor, {
      props: {
        variant: 'quote',
        documentId: 10,
        vatRate: 0.21,
        showWorkshopPrice: false
      },
      global: {
        plugins: [getTestI18n()]
      }
    })

    await flushPromises()

    expect(wrapper.text()).not.toContain('Total taller')
    expect(wrapper.text()).not.toContain('quote.netProfit')
  })

  it('hides add button when readOnly is true', async () => {
    mockQuoteStore.getById.mockResolvedValue(createQuote())
    mockQuoteStore.getLineItems.mockResolvedValue([createQuoteItem()])

    const wrapper = mount(LineItemsEditor, {
      props: {
        variant: 'quote',
        documentId: 10,
        vatRate: 0.21,
        showWorkshopPrice: true,
        readOnly: true
      },
      global: {
        plugins: [getTestI18n()]
      }
    })

    await flushPromises()

    expect(wrapper.text()).not.toContain('Nuevo')
    expect(wrapper.text()).not.toContain('Editar')
    expect(wrapper.text()).not.toContain('Eliminar')
  })
})
