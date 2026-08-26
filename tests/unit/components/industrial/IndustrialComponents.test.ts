// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusLamp from '../../../../src/renderer/components/industrial/StatusLamp.vue'
import IndustrialCard from '../../../../src/renderer/components/industrial/IndustrialCard.vue'
import HazardButton from '../../../../src/renderer/components/industrial/HazardButton.vue'

describe('StatusLamp', () => {
  it('renders a glowing indicator with the provided color', () => {
    const wrapper = mount(StatusLamp, {
      props: {
        color: 'var(--bi-success)',
        label: 'Active'
      }
    })

    expect(wrapper.find('.status-lamp__indicator').exists()).toBe(true)
    expect(wrapper.find('.status-lamp__label').text()).toBe('Active')

    const lamp = wrapper.find('.status-lamp')
    expect(lamp.attributes('style')).toContain('--status-lamp-color: var(--bi-success)')
  })

  it('supports sm, md and lg sizes', () => {
    const sm = mount(StatusLamp, { props: { color: 'var(--bi-error)', size: 'sm' } })
    const md = mount(StatusLamp, { props: { color: 'var(--bi-error)', size: 'md' } })
    const lg = mount(StatusLamp, { props: { color: 'var(--bi-error)', size: 'lg' } })

    expect(sm.find('.status-lamp--sm').exists()).toBe(true)
    expect(md.find('.status-lamp--md').exists()).toBe(true)
    expect(lg.find('.status-lamp--lg').exists()).toBe(true)
  })

  it('adds a pulse class when pulse is true', () => {
    const wrapper = mount(StatusLamp, {
      props: {
        color: 'var(--bi-primary-container)',
        pulse: true
      }
    })

    expect(wrapper.find('.status-lamp--pulse').exists()).toBe(true)
  })

  it('renders without a label when label is omitted', () => {
    const wrapper = mount(StatusLamp, {
      props: { color: 'var(--bi-warning)' }
    })

    expect(wrapper.find('.status-lamp__label').exists()).toBe(false)
  })
})

describe('IndustrialCard', () => {
  it('renders a title in uppercase mono style', () => {
    const wrapper = mount(IndustrialCard, {
      props: { title: 'Vehicle' },
      slots: { default: '<p>Body content</p>' }
    })

    const title = wrapper.find('.industrial-card__title')
    expect(title.text()).toBe('Vehicle')
    expect(title.classes()).toContain('industrial-card__title')
  })

  it('renders the default slot in the card body', () => {
    const wrapper = mount(IndustrialCard, {
      props: { title: 'Card' },
      slots: { default: '<p data-testid="body">Body content</p>' }
    })

    expect(wrapper.find('[data-testid="body"]').exists()).toBe(true)
    expect(wrapper.find('.industrial-card__body').exists()).toBe(true)
  })

  it('renders header actions when the slot is provided', () => {
    const wrapper = mount(IndustrialCard, {
      slots: {
        'header-actions': '<button data-testid="action">Action</button>',
        default: '<p>Body</p>'
      }
    })

    expect(wrapper.find('[data-testid="action"]').exists()).toBe(true)
    expect(wrapper.find('.industrial-card__header').exists()).toBe(true)
  })

  it('skips the header when no title or header-actions slot is provided', () => {
    const wrapper = mount(IndustrialCard, {
      slots: { default: '<p>Body only</p>' }
    })

    expect(wrapper.find('.industrial-card__header').exists()).toBe(false)
  })

  it('removes the border when noBorder is true', () => {
    const wrapper = mount(IndustrialCard, {
      props: { title: 'Card', noBorder: true }
    })

    expect(wrapper.find('.industrial-card--no-border').exists()).toBe(true)
  })
})

describe('HazardButton', () => {
  it('renders a button with the default medium size', () => {
    const wrapper = mount(HazardButton, {
      slots: { default: 'Delete' }
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('.hazard-button--medium').exists()).toBe(true)
    expect(wrapper.text()).toBe('Delete')
  })

  it('supports small and large sizes', () => {
    const small = mount(HazardButton, { props: { size: 'small' } })
    const large = mount(HazardButton, { props: { size: 'large' } })

    expect(small.find('.hazard-button--small').exists()).toBe(true)
    expect(large.find('.hazard-button--large').exists()).toBe(true)
  })

  it('emits a click event when clicked', async () => {
    const wrapper = mount(HazardButton, {
      slots: { default: 'Delete' }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(HazardButton, {
      props: { disabled: true },
      slots: { default: 'Delete' }
    })

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.hazard-button--disabled').exists()).toBe(true)

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
