import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import Swal from 'sweetalert2';
import { supabase } from '@/lib/supabaseClient';
import { useUserStore } from './user';
import { useGroupStore } from './groupstores';

// Success and Error Alerts
function showSuccess(message: string) {
  Swal.fire({
    title: 'Success!',
    showConfirmButton: false,
    timerProgressBar: true,
    timer: 1500,
    text: message,
    toast: true,
    position: 'top-right',
    icon: 'success',
    background: '#081411',
    color: '#E8F3ED'
  });
}

// Function to show error alerts
function showError(message: string) {
  Swal.fire({
    title: 'Error!',
    text: message,
    icon: 'error',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#d33',
    background: '#081411',
    color: '#E8F3ED'
  });
}

export const useChatsStore = defineStore('Chats', () => {
  const active = ref(false);
  const activeGroup = ref(false);
  const client = ref<any>(null);
  const group = ref<any>(null);
  const messageId = ref<number | undefined>(undefined);
  const latestMessages = ref<
    Record<
      string,
      {
        content: string;
        created_at: string;
        seen_at: string | null;
        sent_by: number;
        form: number | null;
        group:number|null,
      }
    >
  >({});
   const latestGroupMessages = ref<
    Record<
      string,
      {
        content: string;
        created_at: string;
        seen_at: string | null;
        sent_by: number;
        form: number | null;
        group:number|null,
      }
    >
  >({});
  const clientStore = useUserStore();
  const groupStore = useGroupStore();
  const sortedChatClients = computed(() => {
    console.log('SORTED CHAT CLIENTS GOT CALLED');
    return [...clientStore.ChatClients]
      .map((client) => {
        const messageKey = client.program_details?.id || `direct_${client.id}`;
        const msg = latestMessages.value[messageKey] || null;

        return {
          ...client,
          latestMessage: msg?.content || null,
          lastMessageTime: msg?.created_at || '1970-01-01',
          sent_by: msg?.sent_by || '1',
          seen_at: msg?.seen_at || null
        };
      })
      .sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
  });
 const sortedChatGroups = computed(() => {

  return [...groupStore.AllGroups]
    .map((group) => {

      const msg = latestGroupMessages.value[group.id] || null;
      return {
        ...group,
        latestGroupMessage: msg?.content ?? null,
        latestGroupMessageTime: msg?.created_at ?? '1970-01-01T00:00:00Z',
        sent_by: msg?.sent_by ?? null,
        seen_at: msg?.seen_at ?? null
      };
    })
    .sort(
      (a, b) =>
        new Date(b.latestGroupMessageTime).getTime() -
        new Date(a.latestGroupMessageTime).getTime()
    );
});

// Add a fetch latest messages but for groups
async function fetchLatestGroupMessages() {
  try {
    const groupIDs = groupStore.AllGroups.flatMap((group) => group.id || []);
    if (groupIDs.length === 0) return;

    const { data, error } = await supabase.rpc('get_latest_group_messages', {
      group_ids: groupIDs
    });

    if (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }

    const tempMessages: any = {};

    for (const msg of data) {
      tempMessages[msg.group_id] = {
        content: msg.content,
        created_at: msg.created_at,
        seen_at: msg.seen_at,
        sent_by: msg.sent_by,
        form: msg.form,
        group: msg.group_id
      };
    }

    latestGroupMessages.value = tempMessages;
  } catch (error: any) {
    console.error(error);
  }
}
  // Fetch the latest messages + associated forms
  async function fetchLatestMessages() {
    try {
      const userProgramIds = clientStore.ChatClients.flatMap(
        (client) => client.program_details?.id || []
      ).filter(id => id !== null);
      
      const clientIds = clientStore.ChatClients.flatMap(
        (client) => (client.program_details?.id === null || client.program_details?.id === undefined) ? client.id : []
      );

      let allMessages: any[] = [];

      // Fetch messages for clients with programs
      if (userProgramIds.length > 0) {
        const { data: programMessages, error: programError } = await supabase.rpc('get_latest_messages2', {
          program_ids: userProgramIds
        });

        if (programError) {
          throw new Error(`Error fetching program messages: ${programError.message}`);
        }

        if (programMessages) {
          allMessages = allMessages.concat(programMessages);
        }
      }

      // Fetch messages for clients assigned directly to coaches
      if (clientIds.length > 0) {
        const { data: directMessages, error: directError } = await supabase
          .from('chat_messages')
          .select('*')
          .in('sent_to', clientIds)
          .is('user_program', null)
          .order('created_at', { ascending: false });

        if (directError) {
          throw new Error(`Error fetching direct messages: ${directError.message}`);
        }

        if (directMessages) {
          // Group by sent_to and get the latest message for each client
          const latestDirectMessages = directMessages.reduce((acc: any, msg: any) => {
            if (!acc[msg.sent_to] || new Date(msg.created_at) > new Date(acc[msg.sent_to].created_at)) {
              acc[msg.sent_to] = msg;
            }
            return acc;
          }, {});

          // Convert to the same format as program messages
          const formattedDirectMessages = Object.values(latestDirectMessages).map((msg: any) => ({
            user_program: null,
            sent_to: msg.sent_to,
            content: msg.content,
            created_at: msg.created_at,
            seen_at: msg.seen_at,
            sent_by: msg.sent_by,
            form: msg.form
          }));

          allMessages = allMessages.concat(formattedDirectMessages);
        }
      }

      // Build an array of form IDs to fetch
      const formIds: number[] = [];
      const tempMessages: any = {};

      for (const msg of allMessages) {
        const key = msg.user_program || `direct_${msg.sent_to}`;
        tempMessages[key] = {
          content: msg.content,
          created_at: msg.created_at,
          seen_at: msg.seen_at,
          sent_by: msg.sent_by,
          form: msg.form
        };
        if (msg.form) {
          formIds.push(msg.form);
        }
      }

      latestMessages.value = tempMessages;

      // If we have any form IDs, fetch them all at once
      if (formIds.length > 0) {
        const { data: formsData, error: formsError } = await supabase
          .from('forms')
          .select('*')
          .in('id', formIds);

        if (formsError) {
          console.error('Error fetching forms:', formsError);
        }
      }
    } catch (error: any) {
      console.error(error);
    }
  }

  const close = function () {
    active.value = false;
    client.value = null;
    group.value = null;
    activeGroup.value = false;
    messageId.value = undefined;
  };

  const open = ($client: any) => {
    client.value = $client;
    active.value = true;
  };
  const openGroup = ($group: any) => {
    group.value = $group;
    activeGroup.value = true;
  };
  const openById = (id: number, m_id?: number) => {
    const client = sortedChatClients.value.find((client) => client.id === id);
    if (!client) {
      showError('Client not found');
      return;
    }
    if (m_id) {
      messageId.value = m_id;
    }
    open(client);
  };

  return {
    active,
    activeGroup,
    client,
    group,
    messageId,
    sortedChatGroups,
    latestGroupMessages,
    latestMessages,
    sortedChatClients,
    fetchLatestMessages,
    fetchLatestGroupMessages,
    open,
    openGroup,
    openById,
    close
  };
});
