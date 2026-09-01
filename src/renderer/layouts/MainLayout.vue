<template>
  <n-layout has-sider class="main-layout">
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      show-trigger
      :collapsed="collapsed"
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="sidebar-content">
        <div class="sidebar-header">
          <img
            v-if="collapsed"
            :src="isotipoImg"
            alt="Wrenchify"
            class="sidebar-logo-isotipo"
          />
          <img
            v-else
            :src="logotipoImg"
            alt="Wrenchify"
            class="sidebar-logo"
          />
        </div>
        <n-menu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="mainMenuOptions"
          :value="activeKey"
          @update:value="handleMenuSelect"
        />
        <div class="sidebar-footer">
          <n-menu
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            :options="footerMenuOptions"
            :value="activeKey"
            @update:value="handleMenuSelect"
          />
        </div>
      </div>
    </n-layout-sider>
    <n-layout>
      <n-layout-content class="main-content">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NLayout,
  NLayoutContent,
  NLayoutSider,
  NMenu
} from 'naive-ui'
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  Wrench,
  Settings
} from 'lucide-vue-next'
import type { MenuOption } from 'naive-ui'
import logotipoImg from '../assets/wrenchify-dark-theme-transparent.png'
import isotipoImg from '../assets/logo-dark-theme-transparent.png'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const collapsed = ref(false)

const activeKey = computed(() => {
  const segment = route.path.split('/')[1]
  const map: Record<string, string> = {
    dashboard: 'Dashboard',
    customers: 'CustomerList',
    vehicles: 'VehicleList',
    quotes: 'QuoteList',
    'work-orders': 'WorkOrderList',
    settings: 'Settings'
  }
  return map[segment] || 'Dashboard'
})

function handleMenuSelect(key: string): void {
  void router.push({ name: key })
}

function renderIcon(icon: typeof Users) {
  return () => h(icon, { size: 18 })
}

const mainMenuOptions = computed<MenuOption[]>(() => [
  {
    label: t('nav.dashboard'),
    key: 'Dashboard',
    icon: renderIcon(LayoutDashboard)
  },
  {
    label: t('nav.customers'),
    key: 'CustomerList',
    icon: renderIcon(Users)
  },
  {
    label: t('nav.vehicles'),
    key: 'VehicleList',
    icon: renderIcon(Car)
  },
  {
    label: t('nav.quotes'),
    key: 'QuoteList',
    icon: renderIcon(FileText)
  },
  {
    label: t('nav.workOrders'),
    key: 'WorkOrderList',
    icon: renderIcon(Wrench)
  }
])

const footerMenuOptions = computed<MenuOption[]>(() => [
  {
    label: t('nav.settings'),
    key: 'Settings',
    icon: renderIcon(Settings)
  }
])
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.main-layout :deep(.n-layout-sider) {
  background-color: var(--bi-surface-container);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.main-layout :deep(.n-layout) {
  overflow-y: auto;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  padding: 0 var(--bi-space-2);
  border-bottom: var(--bi-border-thin);
  flex-shrink: 0;
}

.sidebar-footer {
  margin-top: auto;
  border-top: var(--bi-border-thin);
}

.sidebar-logo {
  width: 180px;
  height: auto;
  object-fit: contain;
}

.sidebar-logo-isotipo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.main-content {
  padding: var(--bi-space-3);
  background-color: var(--bi-bg);
}
</style>
