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
      path: '/application',
      name: 'application',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/ApplicationVue.vue'),
    },
    {
      path: '/contact',
      name: 'contact',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/ContactVue.vue'),
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
        {
          path: 'clients', // Child route for /dashboard/clients

          children: [
            {
              path: '', // Dynamic route for client listing
              name: 'client-list',
              component: () => import('../views/DashboardVues/Clients/ListingVue.vue'),
            },
            {
              path: ':id', // Dynamic route for client details
              name: 'client-details',
              component: () => import('../views/DashboardVues/Clients/ClientDetails.vue'),
            },
            {
              path: '/workout/:id', // Dynamic route for workout-sheets
              name: 'workout-sheet',
              component: () => import('../views/DashboardVues/WorkoutSheet.vue'),
            },
            {
              path: '/diet/:id', // Dynamic route for diet-sheets
              name: 'diet-sheet',
              component: () => import('../views/DashboardVues/DietSheet.vue'),
            },
          ],
        },
        {
          path: 'trainer-profile', // Child route for /dashboard/clients

          name: 'trainer-profile',
          component: () => import('../views/DashboardVues/Profile/EditVue.vue'),
        },
        {
          path: 'entitlements', // Child route for /dashboard/entitlements

          children: [
            {
              path: '', // Dynamic route for entitlement listing
              name: 'entitlement-list',
              component: () => import('../views/DashboardVues/Entitlements/ListingView.vue'),
            },
            {
              path: '/buy', // Dynamic route for entitlement purchase
              name: 'purchase-entitlements',
              component: () => import('../views/DashboardVues/Entitlements/PurchaseVue.vue'),
            },
          ],
        },
        {
          path: 'exercises', // Child route for /dashboard/exercise

          children: [
            {
              path: 'public/:id', // Default child route for /dashboard/exercise
              name: 'public-details',
              component: () => import('../views/DashboardVues/Exercises/PublicDetail.vue'),
            },
            {
              path: 'personal/:id', // Dynamic route for exercise details
              name: 'personal-details',
              component: () => import('../views/DashboardVues/Exercises/PersonalDetail.vue'),
            },
            {
              path: 'public/:id', // Dynamic route for exercise details
              name: 'public-details',
              component: () => import('../views/DashboardVues/Exercises/PublicDetail.vue'),
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
  } else if (
    to.meta.requiresAuth &&
    localStorage.getItem('LoggedInUser') &&
    !localStorage.getItem('UserID')
  ) {
    return {
      path: '/setup-user-profile',
      query: { redirect: to.fullPath },
    }
  } else if (
    to.meta.requiresAuth &&
    localStorage.getItem('LoggedInUser') &&
    localStorage.getItem('UserID') &&
    localStorage.getItem('LoggedInTrainer') == 'false'
  ) {
    return {
      path: '/register-as-a-trainer',
      query: { redirect: to.fullPath },
    }
  }
})
export default router
