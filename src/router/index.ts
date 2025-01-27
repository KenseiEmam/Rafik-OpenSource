import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeVue.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutVue.vue'),
    },
    {
      path: '/team',
      name: 'team',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/TeamVue.vue'),
    },
    {
      path: '/register',
      name: 'register',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/RegisterVue.vue'),
    },
    {
      path: '/login',
      name: 'login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/LoginVue.vue'),
    },
    {
      path: '/dashboard',
      component: () => import('../views/DashboardVues/ParentVue.vue'),
      meta: { requiresAuth: true }, // Ensure all children inherit this meta
      children: [
        {
          path: '', // Default child route for /dashboard
          name: 'dashboard-home',
          component: () => import('../views/DashboardVues/HomeVue.vue'),
        },
        {
          path: 'programs', // Child route for /dashboard/programs

          children: [
            {
              path: '', // Default child route for /dashboard/programs
              name: 'programs-list',
              component: () => import('../views/DashboardVues/Programs/ListingVue.vue'),
            },
            {
              path: ':id', // Dynamic route for program details
              name: 'program-details',
              component: () => import('../views/DashboardVues/Programs/ProgramDetails.vue'),
            },
          ],
        },
      ],
    },
    {
      path: '/register-as-a-trainer',
      component: () => import('../views/TrainerSignUp.vue'),
    },
    {
      path: '/setup-user-profile',
      component: () => import('../views/ProfileSetUp.vue'),
    },
  ],
})
router.beforeEach((to) => {
  // instead of having to check every route record with
  // to.matched.some(record => record.meta.requiresAuth)
  if (to.meta.requiresAuth && !localStorage.getItem('LoggedInUser')) {
    // this route requires auth, check if logged in
    // if not, redirect to login page.
    return {
      path: '/login',
      // save the location we were at to come back later
      query: { redirect: to.fullPath },
    }
  }
  else if (to.meta.requiresAuth && localStorage.getItem('LoggedInUser') && !localStorage.getItem('UserID')) {

    return {
      path: '/setup-user-profile',
      query: { redirect: to.fullPath },
    }
  }
  else if (to.meta.requiresAuth && localStorage.getItem('LoggedInUser') && localStorage.getItem('UserID') && localStorage.getItem('LoggedInTrainer') == 'false') {

    return {
      path: '/register-as-a-trainer',
      query: { redirect: to.fullPath },
    }
  }
})
export default router
