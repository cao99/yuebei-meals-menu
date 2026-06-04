import { createRouter, createWebHistory } from 'vue-router'
import WeekView from '../views/WeekView.vue'
import DayDetail from '../views/DayDetail.vue'

const routes = [
  {
    path: '/',
    name: 'WeekView',
    component: WeekView
  },
  {
    path: '/day/:day/:meal?',
    name: 'DayDetail',
    component: DayDetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
