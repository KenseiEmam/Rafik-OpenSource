<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { request } from '../lib/backend'
import { getDraft, storeDraft, removeDraft } from '../lib/storage'
import { user } from '../app/auth'
import { language as l, errorMessage } from '../lib/i18n'
export type UploadedAsset = { id: string; filename: string; media_type: string; bytes?: number }
const props = defineProps<{
  workspace: string
  view: string
  purpose: 'exercise' | 'message'
  channel?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ uploaded: [asset: UploadedAsset]; busy: [value: boolean] }>()
const busy = ref(false),
  error = ref(''),
  filename = ref('')
let disposed = false
onUnmounted(() => {
  disposed = true
})
async function upload(event: Event) {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0]
  if (!file) return
  error.value = ''
  filename.value = ''
  if (!file.size || file.size > 26214400) {
    error.value = l('Choose a file up to 25 MB.', 'اختر ملفاً حتى 25 ميغابايت.')
    input.value = ''
    return
  }
  busy.value = true
  emit('busy', true)
  try {
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())),
    )
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const key = `org-upload:${user.value!.id}:${props.workspace}:${props.purpose}:${props.channel || ''}:${digest}:${file.name}`
    let id = await getDraft<string>(key)
    if (!id) {
      id = crypto.randomUUID()
      await storeDraft(key, id)
    }
    const query = new URLSearchParams({
      workspace: props.workspace,
      view: props.view,
      purpose: props.purpose,
      filename: file.name,
      ...(props.channel ? { channel: props.channel } : {}),
    })
    const asset = await request<UploadedAsset>(`/v1/organization-assets/${id}?${query}`, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    await removeDraft(key)
    if (!disposed) {
      filename.value = asset.filename
      emit('uploaded', asset)
    }
  } catch (e) {
    if (!disposed) error.value = errorMessage(e)
  } finally {
    if (!disposed) {
      busy.value = false
      emit('busy', false)
      input.value = ''
    }
  }
}
</script>
<template>
  <div class="organization-upload">
    <label
      >{{
        purpose === 'exercise'
          ? l('Upload demonstration', 'رفع شرح التمرين')
          : l('Attach a file', 'إرفاق ملف')
      }}
      <input
        type="file"
        :disabled="disabled || busy"
        :accept="
          purpose === 'exercise'
            ? 'image/png,image/jpeg,image/webp,image/gif,video/mp4'
            : 'image/png,image/jpeg,image/webp,image/gif,video/mp4,application/pdf'
        "
        @change="upload"
      />
    </label>
    <small
      >{{ l('Image, GIF or MP4 · up to 25 MB', 'صورة أو GIF أو MP4 · حتى 25 ميغابايت')
      }}{{ purpose === 'message' ? l(' · PDF also supported', ' · يدعم PDF أيضاً') : '' }}</small
    >
    <p v-if="busy" role="status">
      {{ l('Uploading… Keep this page open.', 'جارٍ الرفع… أبقِ الصفحة مفتوحة.') }}
    </p>
    <p v-else-if="filename" role="status">{{ l('Uploaded: ', 'تم الرفع: ') + filename }}</p>
    <p v-if="error" class="notice error" role="alert">
      {{ error }}
      {{ l('Choose the same file to retry safely.', 'اختر الملف نفسه للمحاولة مجدداً بأمان.') }}
    </p>
  </div>
</template>
<style scoped>
.organization-upload {
  min-width: 0;
  display: grid;
  gap: 0.4rem;
}
input {
  max-width: 100%;
  min-width: 0;
}
small {
  color: var(--muted);
}
p {
  overflow-wrap: anywhere;
}
</style>
