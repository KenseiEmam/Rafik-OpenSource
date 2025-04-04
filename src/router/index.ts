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
      path: '/privacy_policy',
      name: 'privacy',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/PrivacyPolicy.vue'),
    },

    {
      path: '/delete-account',
      name: 'delete',
      component: () => import('../views/DataDeletion.vue'),
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
          path: 'users',
          meta:{requiresAdmin:true},

          children: [
            {
              path: '', // Default child route for /dashboard/users
              name: 'users-list',
              component: () => import('../views/DashboardVues/All Users/UserListing.vue'),

            },
            {
              path: ':id', // Dynamic route for user details
              name: 'single-user',
              component: () => import('../views/DashboardVues/All Users/UserDetails.vue'),
            },
          ],
        },
        {
          path: 'organization',
          meta:{requiresOrgAdmin:true},

          children: [
            {
              path: 'users', // Default child route for /dashboard/organization/users
              name: 'org-users-list',
              component: () => import('../views/DashboardVues/Organizational/UsersList.vue'),

            },
            {
              path: 'programs', // Default child route for /dashboard/organization/users
              name: 'org-programs-list',
              component: () => import('../views/DashboardVues/Organizational/ProgramsList.vue'),

            },
            // {
            //   path: ':id', // Dynamic route for program details
            //   name: 'org-single-user',
            //   component: () => import('../views/DashboardVues/All Users/UserDetails.vue'),
            // },
          ],
        },
        {
          path: 'audit-programs', // Default child route for /dashboard
          meta:{requiresAdmin:true},

          children: [
            {
              path: '', // Default child route for /dashboard/programs
              name: 'audit-list',
              component: () => import('../views/DashboardVues/AuditPrograms/ProgramListing.vue'),

            },
            {
              path: ':id', // Dynamic route for program details
              name: 'audit-program',
              component: () => import('../views/DashboardVues/AuditPrograms/ProgramDetails.vue'),
            },
          ],
        },
        {
          path: 'programs', // Child route for /dashboard/programs
          meta: {requiresTrainer: true},
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
          meta: {requiresTrainer: true},
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
          meta: {requiresTrainer: true},
          name: 'trainer-profile',
          component: () => import('../views/DashboardVues/Profile/EditVue.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/DashboardVues/SettingsVue.vue'),
        },
        {
          path: 'entitlements', // Child route for /dashboard/entitlements
          meta: {requiresTrainer: true},
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
          path: 'support', // Child route for /dashboard/support
          meta: { requiresTrainer: true }, // Ensure all children inherit this meta
          children: [
            {
              path: '', // Dynamic route for listing tickets
              name: 'ticket-list',
              component: () => import('../views/DashboardVues/Support/ListingView.vue'),
            },
            {
              path: ':id', // Dynamic route for viewing a ticket
              name: 'ticket-view',
              component: () => import('../views/DashboardVues/Support/TicketView.vue'),
            },
          ],
        },
        {
          path: 'exercises', // Child route for /dashboard/exercise
          meta: {requiresTrainer: true},
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

  const isMobile = window.innerWidth <= 768; // Adjust as needed
  // Requires Auth Handles

  if (to.meta.requiresAuth && isMobile) {
    return {
      path: '/application',
      query: { redirect: to.fullPath },
    }
  } else if (to.meta.requiresAuth && !localStorage.getItem('LoggedInUser')) {
    return {
      path: '/login',
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
    localStorage.getItem('LoggedInTrainer') === 'false'
  ) {
    return {
      path: '/register-as-a-trainer',
      query: { redirect: to.fullPath },
    }
  }

  // Requires Trainer Handle
  // Check userStore.userPRofile is fetched
  if(to.meta.requiresTrainer && !localStorage.getItem('Roles')?.includes("Trainer"))
  {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    };
  }
  // Requires Admin Handle
  // Check userStore.userPRofile is fetched
  if(to.meta.requiresAdmin && !localStorage.getItem('Roles')?.includes("Administrator"))
  {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    };
  }

  // Requires Org Admin Role
  // Check userStore.userPRofile is fetched
  if(to.meta.requiresOrgAdmin && !localStorage.getItem('Roles')?.includes("Organization Admin"))
    {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      };
    }

});

export default router
