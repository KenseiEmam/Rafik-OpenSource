import type { Database } from '@rafik/shared/database.types'
export type Slot = Database['public']['Tables']['appointment_slots']['Row']
export type Appointment = Database['public']['Tables']['appointments']['Row']
export function appointmentTime(value: string, zone: string, locale = 'en') {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}
