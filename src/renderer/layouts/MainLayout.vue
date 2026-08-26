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
      <div class="sidebar-header">
        <span v-if="!collapsed" class="sidebar-title">{{ $t('app.title') }}</span>
      </div>
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        :value="activeKey"
        @update:value="handleMenuSelect"
      />
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
  Users,
  Car,
  FileText,
  Wrench,
  Settings
} from 'lucide-vue-next'
import type { MenuOption } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const collapsed = ref(false)

const activeKey = computed(() => {
  const segment = route.path.split('/')[1]
  const map: Record<string, string> = {
    customers: 'CustomerList',
    vehicles: 'VehicleList',
    quotes: 'QuoteList',
    'work-orders': 'WorkOrderList',
    settings: 'Settings'
  }
  return map[segment] || 'CustomerList'
})

function handleMenuSelect(key: string): void {
  void router.push({ name: key })
}

function renderIcon(icon: typeof Users) {
  return () => h(icon, { size: 18 })
}

const menuOptions = computed<MenuOption[]>(() => [
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
  },
  {
    label: t('nav.settings'),
    key: 'Settings',
    icon: renderIcon(Settings)
  }
])
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  padding: 24px;
  min-height: 100vh;
}
</style>
