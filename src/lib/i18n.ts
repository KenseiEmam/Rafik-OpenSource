import { ref, watch } from 'vue'
import { formatDate } from './dates'
export const locale = ref<'en' | 'ar'>(localStorage.getItem('rafik.locale') === 'ar' ? 'ar' : 'en')
export const language = (en: string, ar: string) => (locale.value === 'ar' ? ar : en)
export const words = {
  home: ['Home', 'الرئيسية'],
  today: ['Today', 'اليوم'],
  history: ['History', 'السجل'],
  coach: ['Coach', 'المدرب'],
  coaching: ['Coaching', 'التدريب'],
  training: ['My training', 'تدريبي'],
  clients: ['Clients', 'المتدربون'],
  plans: ['Plans', 'الخطط'],
  settings: ['Settings', 'الإعدادات'],
  help: ['Help', 'المساعدة'],
  signIn: ['Sign in', 'تسجيل الدخول'],
  signOut: ['Sign out', 'تسجيل الخروج'],
  back: ['Back', 'رجوع'],
  save: ['Save changes', 'حفظ التغييرات'],
  saving: ['Saving…', 'جارٍ الحفظ…'],
  saved: ['Saved', 'تم الحفظ'],
  cancel: ['Cancel', 'إلغاء'],
  retry: ['Try again', 'حاول مجدداً'],
  close: ['Close', 'إغلاق'],
  loading: ['Loading…', 'جارٍ التحميل…'],
  email: ['Email address', 'البريد الإلكتروني'],
  name: ['Your name', 'اسمك'],
  sample: ['Sample workout', 'تمرين تجريبي'],
  sampleAccount: ['Sample account', 'حساب تجريبي'],
  preview: ['Preview', 'معاينة'],
  start: ['Start workout', 'ابدأ التمرين'],
  resume: ['Resume workout', 'تابع التمرين'],
  finish: ['Finish session', 'إنهاء الحصة'],
  minutes: ['min', 'دقيقة'],
  exercises: ['exercises', 'تمارين'],
  sets: ['sets', 'مجموعات'],
  reps: ['Reps', 'التكرارات'],
  load: ['Load', 'الوزن'],
  rest: ['Rest', 'راحة'],
  done: ['Done', 'تم'],
  completed: ['Completed', 'مكتمل'],
  inProgress: ['In progress', 'قيد التنفيذ'],
  view: ['View session', 'عرض الحصة'],
  nextExercise: ['Next exercise', 'التمرين التالي'],
  previous: ['Previous result', 'النتيجة السابقة'],
  localSave: ['Saved on this device', 'محفوظ على هذا الجهاز'],
  synced: ['Synced with your account', 'تمت المزامنة مع حسابك'],
  syncing: ['Syncing…', 'جارٍ المزامنة…'],
  waiting: ['Saved here. Waiting to sync.', 'محفوظ هنا. بانتظار المزامنة.'],
  syncFailed: ['Saved here. Sync needs attention.', 'محفوظ هنا. تحتاج المزامنة إلى مراجعة.'],
  note: ['Note for your coach', 'ملاحظة لمدربك'],
  feedback: ['Coach feedback', 'ملاحظات المدرب'],
  review: ['Review session', 'مراجعة الحصة'],
  sendFeedback: ['Save feedback', 'حفظ الملاحظات'],
  reviewed: ['Reviewed', 'تمت المراجعة'],
  draft: ['Draft', 'مسودة'],
  published: ['Published', 'منشور'],
  editPlan: ['Edit plan', 'تعديل الخطة'],
  newPlan: ['New plan', 'خطة جديدة'],
  publish: ['Publish plan', 'نشر الخطة'],
  invite: ['Invite a client', 'دعوة متدرب'],
  createLink: ['Create invitation link', 'إنشاء رابط الدعوة'],
  copyLink: ['Copy link', 'نسخ الرابط'],
  copied: ['Copied', 'تم النسخ'],
  pending: ['Pending', 'معلق'],
  active: ['Active', 'نشط'],
  revoked: ['Revoked', 'ملغى'],
  expires: ['Expires', 'تنتهي في'],
  remove: ['Remove', 'إزالة'],
  addExercise: ['Add exercise', 'إضافة تمرين'],
  addDay: ['Add day', 'إضافة يوم'],
  units: ['Weight units', 'وحدة الوزن'],
  timezone: ['Timezone', 'المنطقة الزمنية'],
  language: ['Language', 'اللغة'],
  privacy: ['Privacy', 'الخصوصية'],
  export: ['Export my data', 'تصدير بياناتي'],
  noHistory: ['Your first session starts here.', 'حصتك الأولى تبدأ هنا.'],
  bodyweight: ['Bodyweight', 'وزن الجسم'],
  localPreview: ['Explore sample accounts', 'استكشف الحسابات التجريبية'],
  plan: ['Plan', 'الخطة'],
  days: ['days', 'أيام'],
  accepted: ['Accepted', 'مقبول'],
  expired: ['Expired', 'منتهي'],
  instruction: ['How to do it', 'طريقة الأداء'],
  optional: ['Optional', 'اختياري'],
  kg: ['kg', 'كغ'],
  lb: ['lb', 'رطل'],
  exercise: ['Exercise', 'تمرين'],
  skipRest: ['Skip rest', 'تجاوز الراحة'],
  clear: ['Clear', 'مسح'],
  publishedVersion: ['Published version', 'نسخة منشورة'],
  openPlan: ['Open plan', 'افتح الخطة'],
  noName: ['Your name', 'اسمك'],
  acknowledge: ['Mark reviewed', 'تمت المراجعة'],
  allCaughtUp: ['You’re all caught up.', 'تمت مراجعة كل شيء.'],
  choosePlan: ['Choose a published plan', 'اختر خطة منشورة'],
  nextWorkout: ['Your next workout', 'تمرينك القادم'],
  saveDraft: ['Save draft', 'حفظ المسودة'],
  deleteAccount: ['Delete my account', 'حذف حسابي'],
  contentTitle: ['Build your base', 'ابنِ أساسك'],
  newSession: ['Start a new session', 'ابدأ حصة جديدة'],
} as const
export type Word = keyof typeof words
export const t = (key: Word) => words[key][locale.value === 'ar' ? 1 : 0]
watch(
  locale,
  (value) => {
    localStorage.setItem('rafik.locale', value)
    document.documentElement.lang = value
    document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr'
  },
  { immediate: true },
)
export const dateLabel = (value: string) => formatDate(value, locale.value)
export function errorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : String(error)
  if (raw.includes('required_answer'))
    return language(
      'Complete the required questions before submitting.',
      'أكمل الأسئلة المطلوبة قبل الإرسال.',
    )
  if (raw.includes('invalid_window'))
    return language('Choose a date range of one year or less.', 'اختر فترة لا تتجاوز سنة واحدة.')
  if (raw.includes('relationship_archived') || raw.includes('request_unavailable'))
    return language(
      'This coaching relationship or request is no longer active. Your history is still available.',
      'علاقة التدريب أو الطلب لم يعد نشطاً. يبقى سجلك متاحاً.',
    )
  if (raw.includes('already_submitted'))
    return language(
      'Your client has already submitted this response. Refresh to review it.',
      'أرسل المتدرب هذه الإجابة بالفعل. حدّث الصفحة لمراجعتها.',
    )
  if (raw.includes('wrong_email'))
    return language(
      'This invitation belongs to a different email. Sign in with the address your coach invited.',
      'هذه الدعوة لبريد آخر. سجّل الدخول بالبريد الذي استخدمه مدربك للدعوة.',
    )
  if (raw.includes('conflict'))
    return language(
      'This changed on another device. Your draft is safe here. Reload the latest version before saving.',
      'تم التعديل على جهاز آخر. مسودتك محفوظة هنا. حمّل أحدث نسخة قبل الحفظ.',
    )
  if (raw.includes('plan_changed'))
    return language(
      'Your coach updated this plan. Return to Today to open the latest version.',
      'حدّث مدربك الخطة. عد إلى اليوم لفتح أحدث نسخة.',
    )
  if (raw.includes('assignment_unavailable'))
    return language(
      'This workout is not available today. Return to Today to check the current schedule or contact your coach.',
      'هذا التمرين غير متاح اليوم. عد إلى اليوم للتحقق من الجدول أو تواصل مع مدربك.',
    )
  if (raw.includes('session_started'))
    return language(
      'This workout has already started. Its scheduled occurrence cannot be moved.',
      'بدأ هذا التمرين بالفعل ولا يمكن نقل موعده.',
    )
  if (raw.includes('expired') || raw.includes('invitation_unavailable'))
    return language(
      'This link has expired or was canceled. Ask your coach for a new invitation.',
      'انتهى هذا الرابط أو أُلغي. اطلب دعوة جديدة من مدربك.',
    )
  if (raw.includes('no_completed_sets'))
    return language(
      'Record at least one set before finishing.',
      'سجّل مجموعة واحدة على الأقل قبل الإنهاء.',
    )
  if (raw.includes('Token has expired') || raw.includes('otp') || raw.includes('token is invalid'))
    return language(
      'That code is invalid or expired. Check the latest email or request a new code.',
      'هذا الرمز غير صالح أو منتهٍ. تحقق من أحدث رسالة أو اطلب رمزاً جديداً.',
    )
  if (raw.includes('invalid') || raw.includes('check constraint'))
    return language(
      'Check the values and try again. Use the supported ranges for sets, results and schedule dates.',
      'تحقق من القيم وحاول مجدداً. استخدم النطاقات المسموحة للمجموعات والنتائج والتواريخ.',
    )
  if (raw.includes('rate') || raw.includes('too many'))
    return language(
      'Please wait a moment before requesting another code.',
      'انتظر قليلاً قبل طلب رمز آخر.',
    )
  if (raw.includes('forbidden') || raw.includes('unauthenticated') || raw.includes('JWT'))
    return language(
      'Please sign in again to continue. Your work on this device is still here.',
      'سجّل الدخول مجدداً للمتابعة. عملك على هذا الجهاز ما زال محفوظاً.',
    )
  return language(
    'We couldn’t complete this. Your edits are still here. Check your connection and try again.',
    'تعذر إكمال الطلب. تعديلاتك ما زالت محفوظة. تحقق من الاتصال وحاول مجدداً.',
  )
}
