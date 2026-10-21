<script setup lang="ts">
import PageHeading from '../../components/PageHeading.vue'
import { useRoute } from 'vue-router'
import { language as l } from '../../lib/i18n'
const coach = useRoute().path.startsWith('/coach'),
  base = coach ? '/coach' : ''
</script>
<template>
  <div class="container page more-page">
    <PageHeading class="page-heading"
      ><div>
        <p class="overline">{{ l('Alongside your training', 'إلى جانب تدريبك') }}</p>
        <h1>{{ l('Your tools', 'أدواتك') }}</h1>
        <p>
          {{ l('Everything you need, when you need it.', 'كل ما تحتاجه، حين تحتاجه.') }}
        </p>
      </div></PageHeading
    >
    <nav class="tool-shortcuts" :aria-label="l('Daily tools', 'الأدوات اليومية')">
      <template v-if="coach"
        ><RouterLink to="/coach/plans">{{ l('Plans', 'الخطط') }} ↗</RouterLink
        ><RouterLink to="/coach/exercises"
          >{{ l('Exercise library', 'مكتبة التمارين') }} ↗</RouterLink
        ></template
      ><RouterLink v-else to="/history">{{ l('Training history', 'سجل التدريب') }} ↗</RouterLink
      ><RouterLink :to="base + '/checkins'"
        >{{ l('Check-ins & assessments', 'المتابعات والتقييمات') }} ↗</RouterLink
      >
    </nav>
    <RouterLink v-if="coach" class="button secondary" to="/coach/analytics"
      >{{ l('Coaching analytics', 'تحليلات التدريب') }} ↗</RouterLink
    >
    <nav class="service-links" :aria-label="l('Optional tools', 'أدوات اختيارية')">
      <RouterLink :to="base + '/nutrition'"
        ><span
          ><strong>{{ l('Nutrition', 'التغذية') }}</strong
          ><span>{{
            coach
              ? l('Share practical guidance and review meals.', 'شارك إرشادات عملية وراجع الوجبات.')
              : l(
                  'Keep a simple food diary and see your coach’s guidance.',
                  'سجّل وجباتك ببساطة واطّلع على إرشادات مدربك.',
                )
          }}</span></span
        ><span aria-hidden="true">↗</span></RouterLink
      >
      <RouterLink :to="base + '/appointments'"
        ><span
          ><strong>{{ l('Appointments', 'المواعيد') }}</strong
          ><span>{{
            coach
              ? l(
                  'Offer times, manage bookings, and record attendance.',
                  'أتح أوقاتاً للحجز وأدر المواعيد وسجّل الحضور.',
                )
              : l(
                  'Find a time with your coach and manage your bookings.',
                  'اختر وقتاً مع مدربك وأدر حجوزاتك.',
                )
          }}</span></span
        ><span aria-hidden="true">↗</span></RouterLink
      >
      <RouterLink :to="base + '/resources'"
        ><span
          ><strong>{{ l('Resources', 'الملفات') }}</strong
          ><span>{{
            l(
              'Keep useful files together and choose who can see them.',
              'اجمع الملفات المفيدة وحدّد من يمكنه رؤيتها.',
            )
          }}</span></span
        ><span aria-hidden="true">↗</span></RouterLink
      >
      <RouterLink :to="coach ? '/coach/teams' : '/teams'"
        ><span
          ><strong>{{ l('Teams', 'الفرق') }}</strong
          ><span>{{
            coach
              ? l(
                  'Coordinate staff, athletes and shared material.',
                  'نسّق الموظفين والرياضيين والمواد المشتركة.',
                )
              : l(
                  'Review team invitations and proposed coach changes.',
                  'راجع دعوات الفرق وتغييرات المدرب المقترحة.',
                )
          }}</span></span
        ><span aria-hidden="true">↗</span></RouterLink
      >
      <RouterLink v-if="coach" to="/coach/business"
        ><span
          ><strong>{{ l('Business account', 'حساب العمل') }}</strong
          ><span>{{
            l('Account status and subscription operations.', 'حالة الحساب وعمليات الاشتراك.')
          }}</span></span
        ><span aria-hidden="true">↗</span></RouterLink
      >
      <RouterLink :to="coach ? '/coach/support' : '/support'"
        ><span
          ><strong>{{ l('Support', 'الدعم') }}</strong
          ><span>{{
            l('Keep requests and responses in one place.', 'احتفظ بالطلبات والردود في مكان واحد.')
          }}</span></span
        ><span aria-hidden="true">↗</span></RouterLink
      >
    </nav>
  </div>
</template>
