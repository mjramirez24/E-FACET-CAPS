<template>
  <StudentLayout active-page="messages">
    <!-- Header -->
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search messages..."
            v-model="searchQuery"
            class="search-input-modern"
          />
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Page Header -->
      <div class="page-top">
        <div>
          <h2 class="page-title">Messages</h2>
          <p class="page-subtitle">Chat with Admins and Instructors</p>
        </div>
        <button
          @click="startNewMessage"
          class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-200 transition-colors text-sm font-semibold"
        >
          <span class="text-base leading-none">+</span> New Message
        </button>
      </div>

      <!-- App Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="flex h-[calc(100vh-13rem)] min-h-[520px] max-h-[720px]">
          <!-- Sidebar -->
          <div
            class="w-full md:w-[350px] md:shrink-0 border-r border-gray-100 flex flex-col bg-white"
            :class="selectedConversation ? 'hidden md:flex' : 'flex'">

            <!-- Sidebar top: title + overflow menu -->
            <div class="px-4 pt-4 pb-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-gray-900 text-[15px]">Chats</h3>

                <details class="relative">
                  <summary class="list-none cursor-pointer w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 text-lg select-none">&vellip;</summary>

                  <div class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20 space-y-3">
                    <div class="grid grid-cols-2 gap-2 text-center">
                      <div class="bg-gray-50 rounded-lg py-2">
                        <p class="text-sm font-bold text-gray-900">{{ messageStats.unreadMessages }}</p>
                        <p class="text-[10px] text-gray-500">Unread</p>
                      </div>
                      <div class="bg-gray-50 rounded-lg py-2">
                        <p class="text-sm font-bold text-gray-900">{{ messageStats.totalMessages }}</p>
                        <p class="text-[10px] text-gray-500">Total</p>
                      </div>
                      <div class="bg-gray-50 rounded-lg py-2">
                        <p class="text-sm font-bold text-gray-900">{{ messageStats.instructorMessages }}</p>
                        <p class="text-[10px] text-gray-500">Instructors</p>
                      </div>
                      <div class="bg-gray-50 rounded-lg py-2">
                        <p class="text-sm font-bold text-gray-900">{{ messageStats.adminMessages }}</p>
                        <p class="text-[10px] text-gray-500">Admin</p>
                      </div>
                    </div>

                    <div>
                      <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Type</label>
                      <select v-model="selectedType" class="w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">All Types</option>
                        <option value="instructor">Instructors</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div>
                      <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                      <select v-model="selectedStatus" class="w-full mt-1 p-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500">
                        <option value="">All Status</option>
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                      </select>
                    </div>

                    <div class="flex gap-2 pt-1">
                      <button @click="clearFilters" class="flex-1 px-2 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-[11px] font-semibold transition-colors">Clear</button>
                      <button @click="markAllAsRead" class="flex-1 px-2 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-[11px] font-semibold transition-colors">Mark All Read</button>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <!-- Quick-start contacts -->
            <div v-if="recentContacts.length > 0" class="px-4 pb-3">
              <div class="flex gap-3 overflow-x-auto pb-1">
                <div
                  v-for="contact in recentContacts"
                  :key="contact.id"
                  @click="startConversation(contact)"
                  class="min-w-[60px] max-w-[60px] text-center cursor-pointer group shrink-0"
                >
                  <div
                    class="w-12 h-12 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-sm font-semibold shadow-sm ring-2 ring-white group-hover:ring-emerald-300 transition-all"
                    :class="getUserBadgeClass(contact.role)"
                  >
                    {{ getInitials(contact.name) }}
                  </div>
                  <p class="text-[10px] font-medium text-gray-700 truncate group-hover:text-emerald-700">{{ contact.name.split(' ')[0] }}</p>
                </div>
              </div>
            </div>

            <div class="border-t border-gray-100"></div>

            <!-- Conversation list -->
            <div class="flex-1 overflow-y-auto">
              <div
                v-for="conversation in filteredConversations"
                :key="conversation.id"
                @click="selectConversation(conversation)"
                :class="[
                  'flex items-start gap-3 px-4 py-3 cursor-pointer border-l-4 transition-colors hover:bg-gray-50',
                  selectedConversation?.id === conversation.id
                    ? 'bg-emerald-50 border-l-emerald-500'
                    : 'border-l-transparent',
                ]"
              >
                <div class="relative shrink-0">
                  <div
                    class="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    :class="getUserBadgeClass(conversation.role)"
                  >
                    {{ getInitials(conversation.name) }}
                  </div>
                  <span
                    v-if="conversation.unreadCount > 0"
                    class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"
                  ></span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline gap-2">
                    <p class="truncate text-sm" :class="conversation.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'">
                      {{ conversation.name }}
                    </p>
                    <span class="text-[10px] text-gray-400 shrink-0">{{ formatTime(conversation.lastMessageTime) }}</span>
                  </div>
                  <p class="text-[11px] text-gray-400 capitalize mb-0.5">{{ roleLabel(conversation.role) }}</p>
                  <div class="flex items-center justify-between gap-2">
                    <p class="truncate text-xs" :class="conversation.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'">
                      {{ conversation.lastMessage || 'No messages yet' }}
                    </p>
                    <span
                      v-if="conversation.unreadCount > 0"
                      class="text-[10px] font-bold bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    >
                      {{ conversation.unreadCount }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="filteredConversations.length === 0" class="p-10 text-center text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-sm font-medium text-gray-500">No conversations found</p>
                <p class="text-xs mt-1">Start a new conversation</p>
              </div>
            </div>
          </div>

          <!-- Chat pane -->
          <div
            class="w-full flex flex-col min-w-0 bg-[#f7f8fa]"
            :class="selectedConversation ? 'flex' : 'hidden md:flex'">

            <!-- Chat header -->
            <div
              v-if="selectedConversation"
              class="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white shrink-0"
            >
              <div class="flex items-center gap-3 min-w-0">
                <button
                  @click="backToInbox"
                  class="md:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                >
                  &larr;
                </button>
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  :class="getUserBadgeClass(selectedConversation.role)"
                >
                  {{ getInitials(selectedConversation.name) }}
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 text-sm truncate">{{ selectedConversation.name }}</p>
                  <p class="text-[11px] text-gray-500 capitalize">{{ roleLabel(selectedConversation.role) }}</p>
                </div>
              </div>
              <button
                @click="confirmDeleteConversation(selectedConversation)"
                class="w-8 h-8 shrink-0 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Delete conversation"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <!-- Messages -->
            <div
              v-if="selectedConversation"
              ref="messagesContainer"
              class="flex-1 overflow-y-auto px-4 py-4"
            >
              <div v-if="messages.length === 0" class="text-center text-gray-400 mt-10">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-sm">No messages yet. Say hello!</p>
              </div>
              <div class="space-y-2.5">
                <div
                  v-for="message in messages"
                  :key="message.id"
                  :class="['flex group', message.sender_id === myId ? 'justify-end' : 'justify-start']"
                >
                  <div
                    :class="[
                      'px-3.5 py-2 max-w-[70vw] sm:max-w-md shadow-sm',
                      message.sender_id === myId
                        ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-sm',
                    ]"
                  >
                    <p class="text-sm leading-snug break-words">{{ message.text }}</p>
                    <p class="text-[10px] mt-1 text-right" :class="message.sender_id === myId ? 'text-emerald-100' : 'text-gray-400'">
                      {{ formatTime(message.timestamp) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- No conversation selected -->
            <div v-else class="flex-1 flex items-center justify-center">
              <div class="text-center text-gray-400 px-6">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p class="text-base font-semibold text-gray-600">Select a conversation</p>
                <p class="text-sm mt-1">Choose a conversation from the list to start messaging</p>
              </div>
            </div>

            <!-- Composer -->
            <div v-if="selectedConversation" class="border-t border-gray-200 p-3 bg-white shrink-0">
              <div class="flex gap-2 items-center">
                <input
                  type="text"
                  ref="messageInputRef"
                  v-model="newMessage"
                  @keyup.enter="sendMessage"
                  placeholder="Type your message..."
                  class="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors"
                />
                <button
                  @click="sendMessage"
                  :disabled="!newMessage.trim() || sending"
                  class="w-10 h-10 shrink-0 flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Send"
                >
                  <span v-if="!sending" class="text-sm">&raquo;</span>
                  <span v-else class="text-xs">&hellip;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Message Modal -->
    <transition name="modal-fade">
      <div
        v-if="showNewMessageModal"
        class="modal-overlay"
        @click.self="closeNewMessageModal"
      >
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">New Message</h3>
              <button @click="closeNewMessageModal" class="modal-close-btn">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1.5">To</label>
                  <select
                    v-model="newMessageRecipient"
                    class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="" disabled>Select recipient</option>
                    <optgroup label="Admins">
                      <option v-for="contact in allContacts.filter(c => c.role === 'admin')" :key="contact.id" :value="contact.id">{{ contact.name }}</option>
                    </optgroup>
                    <optgroup label="Instructors">
                      <option v-for="contact in allContacts.filter(c => c.role === 'instructor')" :key="contact.id" :value="contact.id">{{ contact.name }}</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
                  <textarea
                    v-model="newMessageContent"
                    rows="4"
                    class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                    placeholder="Type your message here..."
                  ></textarea>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button
                type="button"
                @click="closeNewMessageModal"
                class="btn-cancel"
              >
                Cancel
              </button>
              <button
                @click="sendNewMessage"
                :disabled="!newMessageRecipient || !newMessageContent.trim() || sending"
                class="btn-save btn-green"
              >
                {{ sending ? 'Sending...' : 'Send Message' }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Delete Confirmation Modal -->
    <transition name="modal-fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head-delete">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Delete Conversation</h3>
                  <p class="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to delete your conversation with {{ deleteTarget?.name }}? This cannot be undone.
              </p>
              <div v-if="deleteErrorMsg" class="error-box mt-3">{{ deleteErrorMsg }}</div>
              <div class="mt-6 flex justify-end gap-3">
                <button type="button" @click="cancelDelete" class="btn-cancel">Cancel</button>
                <button type="button" @click="performDelete" :disabled="deleting" class="btn-save btn-red flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Success Notification -->
    <transition name="modal-fade">
      <div v-if="messageOpen" class="modal-overlay" @click.self="closeMessage">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head-delete">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">{{ messageTitle }}</h3>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm text-gray-700 leading-relaxed">{{ messageText }}</p>
              <div class="mt-6 flex justify-end">
                <button type="button" @click="closeMessage" class="btn-save btn-green">OK</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </StudentLayout>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";
import StudentLayout from "./StudentLayout.vue";
import { API_URL } from "../../config/api";

export default {
  name: "StudentMessages",
  components: { StudentLayout },

  setup() {
    const api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });

    // State
    const searchQuery = ref("");
    const selectedType = ref("");
    const selectedStatus = ref("");
    const selectedConversation = ref(null);
    const newMessage = ref("");
    const sending = ref(false);
    const showNewMessageModal = ref(false);
    const newMessageRecipient = ref("");
    const newMessageContent = ref("");
    const messagesContainer = ref(null);
    const messageInputRef = ref(null);

    const inbox = ref([]);
    const messages = ref([]);
    const myId = ref(null);
    const allContacts = ref([]);

    // Delete modal
    const showDeleteModal = ref(false);
    const deleteTarget = ref(null);
    const deleting = ref(false);
    const deleteErrorMsg = ref("");
    const messageOpen = ref(false);
    const messageTitle = ref("");
    const messageText = ref("");

    const showMessage = (title, text) => {
      messageTitle.value = title;
      messageText.value = text;
      messageOpen.value = true;
    };

    const closeMessage = () => {
      messageOpen.value = false;
    };

    const messageStats = ref({
      totalMessages: 0,
      unreadMessages: 0,
      instructorMessages: 0,
      adminMessages: 0,
    });

    // API calls
    const fetchMe = async () => {
      const res = await api.get("/auth/me");
      myId.value = res.data.user.id;
    };

    const fetchInbox = async () => {
      const res = await api.get("/messages/inbox");
      inbox.value = res.data;

      messageStats.value.totalMessages = inbox.value.length;
      messageStats.value.unreadMessages = inbox.value.filter((c) => c.unreadCount > 0).length;
      messageStats.value.instructorMessages = inbox.value.filter(
        (c) => c.role === "instructor"
      ).length;
      messageStats.value.adminMessages = inbox.value.filter((c) => c.role === "admin").length;
    };

    const fetchContacts = async () => {
      try {
        const res = await api.get("/messages/contacts");
        allContacts.value = res.data;
      } catch (err) {
        console.error("fetchContacts error:", err);
      }
    };

    const loadThread = async (user) => {
      selectedConversation.value = user;
      const res = await api.get(`/messages/thread/${user.id}`);
      messages.value = res.data;

      const found = inbox.value.find((c) => c.id === user.id);
      if (found) found.unreadCount = 0;

      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !selectedConversation.value || sending.value) return;
      sending.value = true;
      try {
        await api.post("/messages/send", {
          receiver_id: selectedConversation.value.id,
          message: newMessage.value,
        });
        newMessage.value = "";
        await loadThread(selectedConversation.value);
        await fetchInbox();
      } finally {
        sending.value = false;
      }
    };

    const sendNewMessage = async () => {
      if (!newMessageRecipient.value || !newMessageContent.value.trim() || sending.value) return;
      sending.value = true;
      try {
        await api.post("/messages/send", {
          receiver_id: newMessageRecipient.value,
          message: newMessageContent.value,
        });
        closeNewMessageModal();
        await fetchInbox();

        const contact = allContacts.value.find((c) => c.id === newMessageRecipient.value);
        if (contact) await loadThread(contact);
      } finally {
        sending.value = false;
      }
    };

    // Delete modal
    const confirmDeleteConversation = (conv) => {
      deleteTarget.value = conv;
      deleteErrorMsg.value = "";
      showDeleteModal.value = true;
    };

    const cancelDelete = () => {
      showDeleteModal.value = false;
      deleteTarget.value = null;
      deleteErrorMsg.value = "";
    };

    const performDelete = async () => {
      if (!deleteTarget.value) return;
      deleting.value = true;
      deleteErrorMsg.value = "";

      try {
        await api.delete(`/messages/conversation/${deleteTarget.value.id}`);

        inbox.value = inbox.value.filter(c => c.id !== deleteTarget.value.id);

        if (selectedConversation.value?.id === deleteTarget.value.id) {
          selectedConversation.value = null;
          messages.value = [];
        }

        messageStats.value.totalMessages = inbox.value.length;
        messageStats.value.unreadMessages = inbox.value.filter(c => c.unreadCount > 0).length;

        showDeleteModal.value = false;
        deleteTarget.value = null;
        showMessage("Conversation Deleted", "The conversation was removed successfully.");
      } catch (err) {
        console.error("Delete failed:", err);
        deleteErrorMsg.value = err.response?.data?.message || "Failed to delete";
      } finally {
        deleting.value = false;
      }
    };

    // Computed
    const filteredConversations = computed(() => {
      let result = [...inbox.value];

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q) ||
            (c.lastMessage || "").toLowerCase().includes(q)
        );
      }

      if (selectedType.value) {
        result = result.filter((c) => c.role === selectedType.value);
      }

      if (selectedStatus.value) {
        result = result.filter((c) => c.status === selectedStatus.value);
      }

      return result.sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );
    });

    const recentContacts = computed(() =>
      allContacts.value
        .filter(
          (c) =>
            ["admin", "instructor"].includes(c.role) &&
            !inbox.value.some((conv) => conv.id === c.id)
        )
        .slice(0, 12)
    );

    // Helpers
    const roleLabel = (role) => {
      if (role === "user") return "Student";
      if (role === "admin") return "Admin";
      if (role === "instructor") return "Instructor";
      return role;
    };

    const getInitials = (name) =>
      (name || "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const formatTime = (timestamp) => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now - date) / 86400000);
      if (diffDays === 0)
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const getUserBadgeClass = (role) => {
      if (role === "instructor") return "bg-purple-600";
      if (role === "admin") return "bg-green-600";
      return "bg-blue-600";
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedType.value = "";
      selectedStatus.value = "";
    };

    const markAllAsRead = () => {
      inbox.value.forEach((c) => {
        c.unreadCount = 0;
        c.status = "read";
      });
      messageStats.value.unreadMessages = 0;
    };

    const selectConversation = (conv) => loadThread(conv);
    const backToInbox = () => {
      selectedConversation.value = null;
      messages.value = [];
    };

    const startNewMessage = () => {
      showNewMessageModal.value = true;
    };

    const closeNewMessageModal = () => {
      showNewMessageModal.value = false;
      newMessageRecipient.value = "";
      newMessageContent.value = "";
    };

    const startConversation = async (contact) => {
      await loadThread(contact);
    };

    // Lifecycle
    onMounted(async () => {
      await fetchMe();
      await Promise.all([fetchInbox(), fetchContacts()]);
    });

    return {
      searchQuery,
      selectedType,
      selectedStatus,
      selectedConversation,
      newMessage,
      sending,
      showNewMessageModal,
      newMessageRecipient,
      newMessageContent,
      messagesContainer,
      messageInputRef,
      messageStats,
      inbox,
      recentContacts,
      allContacts,
      filteredConversations,
      messages,
      myId,

      // Delete modal
      showDeleteModal,
      deleteTarget,
      deleting,
      deleteErrorMsg,
      confirmDeleteConversation,
      cancelDelete,
      performDelete,
      messageOpen,
      messageTitle,
      messageText,
      closeMessage,

      roleLabel,
      getInitials,
      formatTime,
      getUserBadgeClass,
      clearFilters,
      markAllAsRead,
      selectConversation,
      backToInbox,
      sendMessage,
      startNewMessage,
      closeNewMessageModal,
      sendNewMessage,
      startConversation,
    };
  },
};
</script>

<style scoped>
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

details > summary::-webkit-details-marker { display: none; }

/* Header */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; flex-wrap: wrap; }
.search-box { position: relative; flex: 1; min-width: 200px; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* Page Header */
.page-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.8rem; color: #6b7280; margin: 2px 0 0; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-card-sm { max-width: 420px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
.modal-head-green { background: #f0fdf4; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-body-delete { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; }
.error-box { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; color: #dc2626; font-size: 0.85rem; }

.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.btn-red { background: #ef4444; }
.btn-red:hover:not(:disabled) { background: #dc2626; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
</style>