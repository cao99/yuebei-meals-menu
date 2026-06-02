import { createRouter, createWebHashHistory } from 'vue-router'
import WeekView from '../views/WeekView.vue'
import DayDetail from '../views/DayDetail.vue'

const routes = [
  {
    path: '/',
    name: 'WeekView',
    component: WeekView
  },
  {
    path: '/day/:day',
    name: 'DayDetail',
    component: DayDetail
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
