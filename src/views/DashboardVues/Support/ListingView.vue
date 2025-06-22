<template>
  <div class="flex h-screen overflow-auto">
    <div class="flex-1 px-8 py-12 flex flex-col w-full 2xl:px-12 2xl:py-24 gap-6">
      <!-- Page Title + Button to show Create Ticket section -->
      <div class="w-full flex justify-between">
        <div class="flex-1">
          <PageTitle
            :header="t('dashboard.support.list.supportTickets')"
            :subheader="t('dashboard.support.list.yourTickets')"
          />
        </div>
        <button @click="showCreateModal = !showCreateModal" class="btn-lg">
          {{ t('dashboard.support.list.createNewTicket') }}
        </button>
      </div>

      <!-- Create Ticket Section -->
      <div v-if="showCreateModal" class="mt-6">
        <CreateTicketModal @close="showCreateModal = false" @submit="onTicketSubmit" />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center 2xl:my-auto subheader-small uppercase animate-pulse">
        {{ t('dashboard.support.list.loadingTickets') }}
      </div>

      <!-- Tickets Table -->
      <div v-if="!loading && ticketStore.tickets.length" class="overflow-auto">
        <table class="w-full text-center">
          <thead class="contentH-small mb-24">
            <tr>
              <th>{{ t('dashboard.support.list.ticketID') }}</th>
              <th>{{ t('dashboard.support.list.subject') }}</th>
              <th>{{ t('dashboard.support.list.status') }}</th>
              <th>{{ t('dashboard.support.list.createdOn') }}</th>
              <th>{{ t('dashboard.support.list.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ticket in ticketStore.tickets"
              :key="ticket.id"
              class="rounded-xl p-4 border-b border-topsets-sectext"
            >
              <td class="py-4">{{ ticket.id }}</td>
              <td class="py-4">{{ ticket.subject }}</td>
              <td class="py-4 uppercase">{{ ticket.status }}</td>
              <td class="py-4">
                {{
                  new Date(ticket.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }}
              </td>
              <td class="py-4">
                <!-- Navigate to the ticket detail view -->
                <router-link
                  :to="{ name: 'ticket-view', params: { id: ticket.id } }"
                  class="btn-md-outline transition-all"
                >
                  {{ t('dashboard.support.list.view') }}
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- No Tickets Found -->
      <p v-if="!loading && ticketStore.tickets.length === 0" class="text-center my-auto">
        :/ <br />
        {{ t('dashboard.support.list.noTicketsFound') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSupportStore } from '@/stores/supportStore';
import PageTitle from '@/components/Navigation/PageTitle.vue';
import CreateTicketModal from './CreateTicketModal.vue';
import { supabase } from '@/lib/supabaseClient';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';

const { t , locale } = useI18n();

const ticketStore = useSupportStore();
const loading = ref<Boolean>(false);
const showCreateModal = ref<Boolean>(false);

async function onTicketSubmit(ticketData: {
  subject: string;
  message: string;
  related_to?: string;
  media?: File[];
}) {
  try {
    const currentUserId = localStorage.getItem('UserID');
    let uploadedFileUrls: string[] = [];

    // Upload media if attached
    if (ticketData.media && ticketData.media.length > 0) {
      for (const file of ticketData.media) {
        const { data, error } = await supabase.storage
          .from('storage')
          .upload(`tickets/${currentUserId}/${file.name}`, file, { upsert: true });

        if (error) throw error;

        uploadedFileUrls.push(
          `https://pexviywnztvqomfosvho.supabase.co/storage/v1/object/public/storage/${data.path}`
        );
      }
    }

    // Adjust related_to URL based on subject
    if (ticketData.subject === 'Related to a Client' && ticketData.related_to) {
      ticketData.related_to = `http://localhost:5173/dashboard/clients/${ticketData.related_to}`;
    } else if (ticketData.subject === 'Related to a Program' && ticketData.related_to) {
      ticketData.related_to = `http://localhost:5173/dashboard/programs/${ticketData.related_to}`;
    }

    // Create the ticket with the uploaded media URLs
    await ticketStore.createTicket({
      created_by: Number(currentUserId),
      subject: ticketData.subject,
      message: ticketData.message,
      related_to: ticketData.related_to,
      media: uploadedFileUrls,
      last_updated_by: Number(currentUserId)
    });
    showCreateModal.value = false;
  } catch (error: any) {
    Swal.fire({
      title: t('dashboard.support.list.errorTitle'),
      text: error.message || t('dashboard.support.list.uploadCreateFail'),
      icon: 'error',
      confirmButtonColor: '#d33',
      background: '#132e3d',
      color: '#ececec'
    });
  }
}

// On mount, fetch tickets for the current user
onMounted(() => {
  loading.value = true;
  const currentUserId = Number(localStorage.getItem('UserID'));
  ticketStore.getTickets(currentUserId).finally(() => {
    loading.value = false;
  });
});
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 1rem;
}

tbody > tr {
  border-radius: 0.375rem;
  outline: 1px solid rgba(0, 0, 0, 0.175);
}
</style>
