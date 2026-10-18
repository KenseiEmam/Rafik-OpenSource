import { Pressable, StyleSheet, Text } from 'react-native'

export type Styles = ReturnType<typeof makeStyles>
export function Button({
  title,
  onPress,
  disabled = false,
  styles,
  primary = false,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  styles: Styles
  primary?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, primary && styles.primary, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, primary && styles.primaryText]}>{title}</Text>
    </Pressable>
  )
}

export const displayDate = (date: string) => new Date(date).toLocaleString()
export const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function makeStyles(light: boolean) {
  const text = light ? '#182c2a' : '#f2f7f4'
  const muted = light ? '#455e58' : '#b1c6be'
  const accent = light ? '#08674f' : '#a0dfc8'
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: light ? '#f2f7f4' : '#101b1d' },
    toolbar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    heading: { flexGrow: 1, flexShrink: 1 },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 800,
      alignSelf: 'center',
      padding: 18,
      gap: 16,
      paddingBottom: 40,
    },
    kicker: { color: accent, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
    title: { color: text, fontSize: 28, fontWeight: '700', flexShrink: 1 },
    cardTitle: { color: text, fontSize: 18, fontWeight: '600' },
    card: { backgroundColor: light ? '#fff' : '#1a292b', borderRadius: 16, padding: 18, gap: 10 },
    label: { color: text, fontSize: 15, fontWeight: '600' },
    hint: { color: muted, fontSize: 14, lineHeight: 21 },
    message: { color: accent, fontSize: 15, lineHeight: 22 },
    link: { color: accent, fontSize: 15, fontWeight: '600' },
    input: {
      borderWidth: 1,
      borderColor: light ? '#859b93' : '#54736b',
      borderRadius: 12,
      minHeight: 50,
      paddingHorizontal: 12,
      color: text,
      fontSize: 16,
    },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    button: {
      borderWidth: 1,
      borderColor: light ? '#6a8c80' : '#54736b',
      borderRadius: 12,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexShrink: 1,
    },
    buttonText: { color: accent, fontSize: 15, fontWeight: '600' },
    primary: { backgroundColor: '#116c54', borderColor: '#116c54' },
    primaryText: { color: '#fff' },
    disabled: { opacity: 0.5 },
  })
}
