import Swal from 'sweetalert2'
import { locale } from './i18n'

const toast = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  showCloseButton: true,
  timer: 5000,
  timerProgressBar: true,
  customClass: { popup: 'rafik-toast' },
})
const notifiedErrors = new WeakSet<object>()

export function notifySuccess(message: string) {
  const rtl = locale.value === 'ar'
  void toast.fire({
    icon: 'success',
    title: message,
    position: rtl ? 'top-start' : 'top-end',
    customClass: { popup: rtl ? 'rafik-toast rafik-toast--rtl' : 'rafik-toast' },
  })
}

export function notifyError(message: string) {
  const rtl = locale.value === 'ar'
  void toast.fire({
    icon: 'error',
    title: message,
    position: rtl ? 'top-start' : 'top-end',
    customClass: { popup: rtl ? 'rafik-toast rafik-toast--rtl' : 'rafik-toast' },
  })
}

export function notifyErrorOnce(error: unknown, message: string) {
  if (error && (typeof error === 'object' || typeof error === 'function')) {
    if (notifiedErrors.has(error)) return
    notifiedErrors.add(error)
  }
  notifyError(message)
}
