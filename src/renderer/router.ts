import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: MainLayout,
      redirect: '/customers',
      children: [
        {
          path: 'customers',
          name: 'CustomerList',
          component: () => import('./views/customers/CustomerList.vue')
        },
        {
          path: 'customers/new',
          name: 'CustomerCreate',
          component: () => import('./views/customers/CustomerForm.vue')
        },
        {
          path: 'customers/:id',
          name: 'CustomerDetail',
          component: () => import('./views/customers/CustomerForm.vue')
        },
        {
          path: 'customers/:id/edit',
          name: 'CustomerEdit',
          component: () => import('./views/customers/CustomerForm.vue')
        },
        {
          path: 'vehicles',
          name: 'VehicleList',
          component: () => import('./views/vehicles/VehicleList.vue')
        },
        {
          path: 'vehicles/new',
          name: 'VehicleCreate',
          component: () => import('./views/vehicles/VehicleForm.vue')
        },
        {
          path: 'vehicles/:id',
          name: 'VehicleDetail',
          component: () => import('./views/vehicles/VehicleForm.vue')
        },
        {
          path: 'vehicles/:id/edit',
          name: 'VehicleEdit',
          component: () => import('./views/vehicles/VehicleForm.vue')
        },
        {
          path: 'vehicles/:id/timeline',
          name: 'VehicleTimeline',
          component: () => import('./views/vehicles/VehicleTimeline.vue')
        },
        {
          path: 'quotes',
          name: 'QuoteList',
          component: () => import('./views/quotes/QuoteList.vue')
        },
        {
          path: 'quotes/new',
          name: 'QuoteCreate',
          component: () => import('./views/quotes/QuoteForm.vue')
        },
        {
          path: 'quotes/:id',
          name: 'QuoteDetail',
          component: () => import('./views/quotes/QuoteForm.vue')
        },
        {
          path: 'quotes/:id/edit',
          name: 'QuoteEdit',
          component: () => import('./views/quotes/QuoteForm.vue')
        },
        {
          path: 'work-orders',
          name: 'WorkOrderList',
          component: () => import('./views/work-orders/WorkOrderList.vue')
        },
        {
          path: 'work-orders/new',
          name: 'WorkOrderCreate',
          component: () => import('./views/work-orders/WorkOrderForm.vue')
        },
        {
          path: 'work-orders/:id',
          name: 'WorkOrderDetail',
          component: () => import('./views/work-orders/WorkOrderForm.vue')
        },
        {
          path: 'work-orders/:id/edit',
          name: 'WorkOrderEdit',
          component: () => import('./views/work-orders/WorkOrderForm.vue')
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('./views/settings/SettingsView.vue')
        }
      ]
    }
  ]
})

export default router
