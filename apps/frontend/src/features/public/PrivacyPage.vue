<script setup lang="ts">
import { language, t } from '../../lib/i18n'
</script>
<template>
  <div class="container page prose-page">
    <p class="overline">{{ t('privacy') }}</p>
    <h1>{{ language('Your data in this local preview.', 'بياناتك في المعاينة المحلية.') }}</h1>
    <p class="lead">
      {{
        language(
          'This describes the rebuilt product running locally. A hosted release needs its own published policy and operator contact details.',
          'هذا وصف للمنتج الجديد العامل محلياً. يحتاج الإصدار المنشور إلى سياسة خاصة وبيانات اتصال المشغّل.',
        )
      }}
    </p>
    <section>
      <h2>{{ language('What stays in the browser', 'ما يبقى في المتصفح') }}</h2>
      <p>
        {{
          language(
            'Guest workouts, recoverable drafts, language, appearance, and a small log of save events are stored on this device. Signing in stores a session token. Clearing browser data removes unsynced drafts.',
            'تُحفظ التمارين التجريبية والمسودات واللغة والمظهر وسجل صغير لأحداث الحفظ على الجهاز. يُحفظ رمز الجلسة عند الدخول. مسح بيانات المتصفح يزيل المسودات غير المتزامنة.',
          )
        }}
      </p>
    </section>
    <section>
      <h2>{{ language('What is saved to an account', 'ما يُحفظ في الحساب') }}</h2>
      <p>
        {{
          language(
            'Email, profile preferences, plans, assignments, recorded sets, and session notes are saved in the local Supabase backend. A connected coach can read their athlete sessions and leave feedback. Other athletes cannot read them.',
            'يُحفظ البريد وتفضيلات الملف والخطط والتعيينات والمجموعات المسجلة والملاحظات في Supabase المحلي. يمكن للمدرب المرتبط قراءة حصص متدربه وترك ملاحظات. لا يمكن للمتدربين الآخرين قراءتها.',
          )
        }}
      </p>
    </section>
    <section>
      <h2>{{ language('Your choices', 'خياراتك') }}</h2>
      <p>
        {{
          language(
            'Try the sample without signing up. Export your own training data or delete your account in Settings. If a coach deletes their account, athletes retain their own completed session snapshots. No advertising or external analytics service is connected in this build.',
            'جرّب الحصة بلا تسجيل. صدّر بيانات تدريبك أو احذف حسابك من الإعدادات. إذا حذف المدرب حسابه يحتفظ المتدربون بنسخ حصصهم المكتملة. لا توجد خدمات إعلان أو تحليلات خارجية مرتبطة بهذا الإصدار.',
          )
        }}
      </p>
    </section>
    <RouterLink class="button secondary" to="/help">{{ t('help') }}</RouterLink>
  </div>
</template>
