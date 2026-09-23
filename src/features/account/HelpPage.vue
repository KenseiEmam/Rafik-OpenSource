<script setup lang="ts">
import AppUpdates from '../../components/AppUpdates.vue'
import { language, t } from '../../lib/i18n'
</script>
<template>
  <div class="container page prose-page">
    <p class="overline">{{ t('help') }}</p>
    <h1>{{ language('Help', 'المساعدة') }}</h1>
    <section class="help-workspaces">
      <h2>{{ language('Start in the right workspace', 'ابدأ في مساحة العمل المناسبة') }}</h2>
      <p>
        {{
          language(
            'Use the workspace selector at the top to choose independent coaching or a specific organization and role. Each organization keeps its own people, programs and history.',
            'اختر التدريب المستقل أو مؤسسة ودوراً محددين من قائمة مساحة العمل بالأعلى. تحتفظ كل مؤسسة بأشخاصها وبرامجها وسجلها.',
          )
        }}
      </p>
      <RouterLink class="text-link" to="/workspaces">{{
        language('Choose your workspace', 'اختر مساحة عملك')
      }}</RouterLink>
      <details>
        <summary>{{ language('I administer an organization', 'أنا مسؤول مؤسسة') }}</summary>
        <p>
          {{
            language(
              'Start in People: invite administrators, trainers or trainees and assign a responsible trainer. In Programs, publish a plan and review who will receive it. Calendar schedules training and assessor-led assessments; the Library section contains reusable groups and assessment templates.',
              'ابدأ في الأشخاص: ادعُ المسؤولين والمدربين والمتدربين وعيّن المدرب المسؤول. انشر خطة في البرامج وراجع المستلمين. استخدم التقويم لجدولة التدريب والتقييمات؛ ويحتوي قسم المكتبة على المجموعات وقوالب التقييم القابلة لإعادة الاستخدام.',
            )
          }}
        </p>
        <p>
          {{
            language(
              'Analytics shows organization workload, participation and gaps. Its totals and definitions describe recorded activity. They do not rate trainer quality. Reassigning a trainer preserves the organization’s training history.',
              'تعرض التحليلات أعباء العمل والمشاركة والنواقص في المؤسسة. تصف الأرقام النشاط المسجّل ولا تقيّم جودة المدرب. يبقى سجل المؤسسة محفوظاً عند تغيير المدرب المسؤول.',
            )
          }}
        </p>
      </details>
      <details>
        <summary>{{ language('I train people in an organization', 'أنا مدرب في مؤسسة') }}</summary>
        <p>
          {{
            language(
              'Choose the organization’s Coaching role. People and Training show your assigned trainees; Calendar includes events where you are designated staff. Review a completed session, leave feedback or adapt the next prescription. Analytics describes your current responsibility, and conversations have their own visible participant lists.',
              'اختر دور التدريب في المؤسسة. يعرض الأشخاص والتدريب متدربيك المعيّنين، ويعرض التقويم المواعيد المسندة إليك. راجع الحصة المكتملة وقدّم ملاحظاتك أو عدّل التدريب القادم. تخص التحليلات مسؤوليتك الحالية، ولكل محادثة قائمة مشاركين واضحة.',
            )
          }}
        </p>
      </details>
      <details>
        <summary>{{ language('I coach independently', 'أنا مدرب مستقل') }}</summary>
        <p>
          {{
            language(
              'Today brings together sessions and check-ins awaiting review. Plans is where you prepare and publish training; Clients is where you invite people and manage each relationship. Appointments, Resources and other tools have their own navigation links. Independent coach teams do not merge your private client records.',
              'يجمع اليوم الحصص والمتابعات بانتظار المراجعة. جهّز التدريب وانشره في الخطط، وادعُ المتدربين وأدر كل علاقة في المتدربين. تتوفر الجدولة والملفات والأدوات الاختيارية في قائمة التنقل. لا تدمج فرق المدربين المستقلين سجلات متدربيك الخاصة.',
            )
          }}
        </p>
      </details>
    </section>
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
    <section>
      <h2>{{ language('Know who receives a message', 'اعرف من يستقبل الرسالة') }}</h2>
      <p>
        {{
          language(
            'A conversation lists the people who can read its history and send messages. Organization administrators join visibly. The notification bell keeps updates from different workspaces separate. In this local preview, optional email is intercepted for testing; no real email or push is sent.',
            'توضح المحادثة من يستطيع قراءة سجلها وإرسال الرسائل، ويظهر انضمام مسؤول المؤسسة. يفصل جرس الإشعارات تحديثات مساحات العمل. في هذه المعاينة المحلية تُعترض الرسائل الاختيارية للاختبار ولا يُرسل بريد أو إشعار دفع فعلي.',
          )
        }}
      </p>
    </section>
    <section>
      <h2>{{ language('Make nutrition actionable', 'حوّل التغذية إلى خطوات عملية') }}</h2>
      <p>
        {{
          language(
            'Independent coaches: open Nutrition, choose a client, enter agreed calorie/macronutrient targets and build an example day. The calculator only converts your chosen budget into grams. Save the plan to share it. Trainees: choose who can see the record, select a food or suggested meal, adjust the amount actually eaten and save. Suggested meals never count as logged food automatically. Unknown values stay blank.',
            'للمدرب المستقل: افتح التغذية واختر متدرباً وحدد الأهداف المتفق عليها للسعرات والمغذيات وأضف يوماً مقترحاً. تحوّل الحاسبة السعرات التي اخترتها إلى غرامات فقط. احفظ الخطة لمشاركتها. للمتدرب: حدد من يرى السجل واختر طعاماً أو وجبة مقترحة وعدّل الكمية التي تناولتها ثم احفظ. لا تُسجل المقترحات كطعام متناول تلقائياً. تبقى القيم المجهولة فارغة.',
          )
        }}
      </p>
      <p>
        {{
          language(
            'The food library starts with 15 sourced USDA staples. Use a label or a saved food for other choices; check the nutrient basis before changing portions. Organization admins and assigned trainers can publish scoped plans in Nutrition. Trainees decide whether to share their organization diary; personal records remain separate.',
            'تبدأ مكتبة الطعام بخمسة عشر طعاماً موثقاً من وزارة الزراعة الأمريكية. استخدم الملصق أو طعاماً محفوظاً للخيارات الأخرى وراجع أساس القيم قبل تعديل الكميات. يمكن لمسؤولي المؤسسة والمدربين المسند إليهم المتدربون نشر خطط في التغذية. يقرر المتدرب مشاركة سجل المؤسسة، وتبقى السجلات الشخصية منفصلة.',
          )
        }}
      </p>
    </section>
    <section>
      <h2>
        {{ language('Find exercises and see the movement', 'ابحث عن التمارين وشاهد الحركة') }}
      </h2>
      <p>
        {{
          language(
            'Filter Exercises by body area, equipment, recording type or video availability, then select a result to see the instructions and preview. Available videos play silently when visible; use Pause at any time. Reduced-motion settings prevent automatic playback. Exercises without video show written guidance or static reference positions. The plan editor searches the full library and keeps up to three approved alternatives.',
            'رشّح التمارين حسب منطقة الجسم والمعدات ونوع التسجيل وتوفر الفيديو، ثم اختر تمريناً لعرض التعليمات والشرح. تُشغّل الفيديوهات بصمت عند ظهورها ويمكن إيقافها في أي وقت. تمنع إعدادات تقليل الحركة التشغيل التلقائي. تعرض التمارين الأخرى تعليمات مكتوبة أو وضعيات ثابتة. يبحث محرر الخطة في المكتبة الكاملة ويحفظ حتى ثلاثة بدائل معتمدة.',
          )
        }}
      </p>
      <a class="text-link" href="/exercise-media/CREDITS.txt" target="_blank" rel="noopener">{{
        language('Exercise illustration credits and license', 'مصادر الرسوم التوضيحية وترخيصها')
      }}</a>
    </section>
    <AppUpdates />
  </div>
</template>

<style scoped>
.help-workspaces details {
  margin-top: 20px;
}
.help-workspaces summary {
  font-weight: 600;
}
.help-workspaces details p {
  margin-top: 16px;
}
</style>
