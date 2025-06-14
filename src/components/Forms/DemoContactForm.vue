<script setup lang="ts">
import { ref } from 'vue';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabaseClient';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ selectedTier: string | null }>();

const { t } = useI18n();

// Re-usable SweetAlert helpers (same palette)
function toastSuccess(msg: string) {
  Swal.fire({
    title: t('general.success'),
    text: msg,
    icon: 'success',
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    background: '#081411',
    color: '#E8F3ED'
  });
}
function modalError(msg: string) {
  Swal.fire({
    title: t('general.error'),
    text: msg,
    icon: 'error',
    confirmButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Reactive form-state
const form = ref({
  organization: '',
  email: '',
  users: '',
  sports: [] as string[],
  address: '',
  phone: '',
  message: ''
});
const loading = ref(false);

// Submit handler – sends to the same Supabase Edge Function
async function send() {
  loading.value = true;
  try {
    const payload = { ...form.value, selectedTier: props.selectedTier };
    const { data, error } = await supabase.functions.invoke('smtp', { body: payload });
    if (error) throw error;
    toastSuccess(data?.message ?? 'We received your request!');

    // Reset on success
    form.value = {
      organization: '',
      email: '',
      users: '',
      sports: [],
      address: '',
      phone: '',
      message: ''
    };
  } catch (err: any) {
    modalError(err.message ?? 'Something went wrong.');
  } finally {
    loading.value = false;
  }
}

const sportsOpts = ['Football', 'Basketball', 'Volleyball', 'Other'];
</script>

<template>
  <section class="flex-1 mb-24 w-full">
    <div class="w-full">
      <!-- Left – pitch / context -->
      <div>
        <h2 class="title-small font-black text-rafik">Let’s Talk</h2>
        <p class="text-body">
          Ready to unlock data-driven performance? Fill in the details below and our team will
          schedule your personalised demo.
        </p>

        <div v-if="props.selectedTier" class="card p-4 flex items-center gap-3 w-max mt-3 mb-6">
          <span class="text-sm opacity-80">Chosen Plan:</span>
          <span class="font-semibold">{{ props.selectedTier }}</span>
        </div>
      </div>

      <!-- Right – form -->
      <form
        class="card p-6 space-y-4 border-rafik-sectext dark:border-rafik-darksectext w-full"
        @submit.prevent="send"
      >
        <!-- Organisation -->
        <div class="form-control">
          <label>Organization legal name</label>
          <input v-model="form.organization" class="rafik-text-input" required />
        </div>

        <!-- Contact Email -->
        <div class="form-control">
          <label>Contact Email</label>
          <input
            v-model="form.email"
            class="rafik-text-input"
            type="email"
            placeholder="info@school.edu"
            required
          />
        </div>

        <!-- Estimated users -->
        <div class="form-control">
          <label>Estimated number of users</label>
          <input
            v-model="form.users"
            class="rafik-text-input"
            type="number"
            min="1"
            placeholder="e.g. 120"
            required
          />
        </div>

        <!-- Sports checkboxes -->
        <div class="form-control">
          <label>Organization sports (optional)</label>
          <div class="flex flex-wrap gap-4">
            <label v-for="s in sportsOpts" :key="s" class="flex items-center gap-2 text-sm">
              <input type="checkbox" :value="s" v-model="form.sports" class="accent-rafik" />
              {{ s }}
            </label>
          </div>
        </div>

        <!-- Address -->
        <div class="form-control">
          <label>Address (optional)</label>
          <input
            v-model="form.address"
            class="rafik-text-input"
            placeholder="City / State / Country"
          />
        </div>

        <!-- Phone -->
        <div class="form-control">
          <label>Phone number (optional)</label>
          <input
            v-model="form.phone"
            class="rafik-text-input"
            type="tel"
            placeholder="+971 5X XXX XXXX"
          />
        </div>

        <!-- Message -->
        <div class="form-control">
          <label>Message (optional)</label>
          <textarea v-model="form.message" rows="5" class="rafik-text-input" />
        </div>

        <button type="submit" class="btn-lg w-full" :disabled="loading">
          {{ loading ? 'Sending…' : 'Request Demo' }}
        </button>
      </form>
    </div>
  </section>
</template>
