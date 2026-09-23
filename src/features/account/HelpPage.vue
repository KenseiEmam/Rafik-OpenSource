<script setup lang="ts">
import AppUpdates from '../../components/AppUpdates.vue'
import { language, t } from '../../lib/i18n'
</script>
<template>
  <div class="container page prose-page">
    <p class="overline">{{ t('help') }}</p>
    <h1>{{ language('Keep moving, with a little clarity.', 'تابع بوضوح أكثر.') }}</h1>
    <section>
      <h2>{{ language('Start without an account', 'ابدأ بلا حساب') }}</h2>
      <p>
        {{
          language(
            'Open the sample, choose a session, and record a set. Progress stays in this browser. After finishing, you can save it to an account. Clearing browser data removes work that has not synced.',
            'افتح التمرين التجريبي، واختر حصة، وسجّل مجموعة. يبقى تقدمك في هذا المتصفح. بعد الانتهاء يمكنك حفظه بحساب. مسح بيانات المتصفح يحذف العمل الذي لم تتم مزامنته.',
          )
        }}
      </p>
      <RouterLink class="text-link" to="/routine">{{ t('sample') }}</RouterLink>
    </section>
    <section>
      <h2>{{ language('Use a coach’s invitation', 'استخدم دعوة المدرب') }}</h2>
      <p>
        {{
          language(
            'Open the link your coach shared. Sign in using the exact email they invited, then accept the plan. If the invitation expired, ask the coach to create a new one.',
            'افتح الرابط الذي شاركه مدربك. ادخل بالبريد الذي دعاه، ثم اقبل الخطة. إذا انتهت الدعوة اطلب رابطاً جديداً.',
          )
        }}
      </p>
    </section>
    <section>
      <h2>{{ language('Understand save status', 'افهم حالة الحفظ') }}</h2>
      <p>
        {{
          language(
            '“Saved on this device” means the browser has your work. “Synced with your account” means the server has acknowledged it. Keep the workout open while reconnecting, or reopen it from History to retry.',
            '«محفوظ على هذا الجهاز» يعني أن المتصفح يحتفظ بعملك. «تمت المزامنة مع حسابك» يعني أن الخادم أكد استلامه. أبقِ الحصة مفتوحة عند الاتصال أو افتحها من السجل لإعادة المحاولة.',
          )
        }}
      </p>
      <p>
        {{
          language(
            'If another device saved a newer version, download your local draft before loading the latest server version. Nothing is silently overwritten.',
            'إذا حفظ جهاز آخر نسخة أحدث، نزّل مسودتك المحلية قبل تحميل نسخة الخادم. لن تتم الكتابة فوق عملك بصمت.',
          )
        }}
      </p>
    </section>
    <section>
      <h2>{{ language('Prepare and share a plan', 'جهّز خطة وشاركها') }}</h2>
      <p>
        {{
          language(
            'Open Coaching → Plans. Start from the populated plan, adjust the exercises, and preview the session. Save and publish it, then create an invitation in Clients. Share the link using your usual messaging channel.',
            'افتح التدريب ← الخطط. ابدأ بالخطة الجاهزة، وعدّل التمارين، وعاين الحصة. احفظها وانشرها، ثم أنشئ دعوة ضمن المتدربين. شارك الرابط عبر وسيلة التواصل المعتادة.',
          )
        }}
      </p>
    </section>
    <section>
      <h2>{{ language('Get help with a failed save', 'المساعدة عند فشل الحفظ') }}</h2>
      <p>
        {{
          language(
            'Account settings shows sessions waiting to sync and downloadable support details. Include those details when reporting a problem to the person running your preview. Keep private workout notes out of public bug reports.',
            'تعرض الإعدادات الحصص التي تنتظر المزامنة وتفاصيل دعم قابلة للتنزيل. أرفقها عند إبلاغ مسؤول المعاينة بالمشكلة. لا تضع ملاحظات التمرين الخاصة في البلاغات العامة.',
          )
        }}
      </p>
    </section>
    <AppUpdates />
  </div>
</template>
