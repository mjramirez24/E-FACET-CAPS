<template>
  <AdminLayout>
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        placeholder="Search messages..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-green-800">💬 Messages</h2>
        <button
          @click="startNewMessage"
          class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition-colors"
        >
          + New Message
        </button>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-green-50 p-4 rounded-lg border border-green-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Conversations</p>
              <h3 class="text-2xl font-bold text-green-800 mt-1">{{ messageStats.totalMessages }}</h3>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-green-700 text-xl">💬</span>
            </div>
          </div>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Unread</p>
              <h3 class="text-2xl font-bold text-blue-800 mt-1">{{ messageStats.unreadMessages }}</h3>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-700 text-xl">📩</span>
            </div>
          </div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Students</p>
              <h3 class="text-2xl font-bold text-yellow-800 mt-1">{{ messageStats.studentMessages }}</h3>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span class="text-yellow-700 text-xl">🎓</span>
            </div>
          </div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Instructors</p>
              <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ messageStats.instructorMessages }}</h3>
            </div>
            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span class="text-purple-700 text-xl">👨‍🏫</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
          <select
            v-model="selectedType"
            class="w-48 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Types</option>
            <option value="user">Students</option>
            <option value="instructor">Instructors</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Clear
          </button>
          <button
            @click="markAllAsRead"
            class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Mark All Read
          </button>
        </div>
      </div>

      <!-- Messages Container -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="flex h-[600px]">
          <!-- Left: Conversations List -->
          <div class="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div class="p-4 bg-green-800 text-white">
              <div class="flex justify-between items-center">
                <span class="font-semibold">Inbox</span>
                <span class="text-xs bg-green-600 px-2 py-1 rounded-full">
                  {{ filteredConversations.length }} conversations
                </span>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div
                v-for="conversation in filteredConversations"
                :key="conversation.id"
                @click="selectConversation(conversation)"
                :class="[
                  'p-4 cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-100',
                  selectedConversation?.id === conversation.id
                    ? 'bg-green-50 border-l-4 border-l-green-500'
                    : '',
                ]"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                    :class="getUserBadgeClass(conversation.role)"
                  >
                    {{ getInitials(conversation.name) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start">
                      <div class="truncate">
                        <p class="font-medium text-gray-900 truncate">{{ conversation.name }}</p>
                        <p class="text-xs text-gray-500 truncate capitalize">{{ roleLabel(conversation.role) }}</p>
                      </div>
                      <div class="text-xs text-gray-500 shrink-0 ml-2">
                        {{ formatTime(conversation.lastMessageTime) }}
                      </div>
                    </div>
                    <p class="text-sm text-gray-600 mt-1 truncate">
                      {{ conversation.lastMessage || 'No messages yet' }}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                      <span
                        v-if="conversation.unreadCount > 0"
                        class="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full shrink-0"
                      >
                        {{ conversation.unreadCount }} new
                      </span>
                      <span
                        class="text-xs px-2 py-0.5 rounded-full shrink-0"
                        :class="getStatusBadgeClass(conversation.status)"
                      >
                        {{ conversation.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="filteredConversations.length === 0" class="p-8 text-center text-gray-500">
                <span class="text-3xl mb-2 block">📭</span>
                <p>No conversations found</p>
                <p class="text-sm mt-1">Start a new conversation</p>
              </div>
            </div>
          </div>

          <!-- Right: Chat Window -->
          <div class="w-2/3 flex flex-col">
            <!-- Chat Header -->
            <div
              v-if="selectedConversation"
              class="p-4 bg-green-800 text-white flex justify-between items-center"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 bg-white text-green-800 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                >
                  {{ getInitials(selectedConversation.name) }}
                </div>
                <div>
                  <p class="font-medium">{{ selectedConversation.name }}</p>
                  <p class="text-xs opacity-90 capitalize">{{ roleLabel(selectedConversation.role) }}</p>
                </div>
              </div>
               <button
                @click="deleteConversation(selectedConversation)"
                class="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
              >
                Delete
              </button>
            </div>

            <!-- Chat Messages -->
            <div
              v-if="selectedConversation"
              ref="messagesContainer"
              class="flex-1 overflow-y-auto p-4 bg-gray-50"
            >
              <div v-if="messages.length === 0" class="text-center text-gray-400 mt-10">
                <p>No messages yet. Say hello! 👋</p>
              </div>
              <div class="space-y-4">
                <div
                  v-for="message in messages"
                  :key="message.id"
                  :class="['flex', message.sender_id === myId ? 'justify-end' : 'justify-start']"
                >
                  <div
                    :class="[
                      'rounded-lg p-3 max-w-md',
                      message.sender_id === myId
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none',
                    ]"
                  >
                    <p class="text-sm">{{ message.text }}</p>
                    <p class="text-xs mt-1 opacity-75">{{ formatTime(message.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Conversation Selected -->
            <div v-else class="flex-1 flex items-center justify-center bg-gray-50">
              <div class="text-center text-gray-500">
                <span class="text-4xl mb-4 block">💬</span>
                <p class="text-lg font-medium">Select a conversation</p>
                <p class="text-sm mt-1">Choose a conversation from the list to start messaging</p>
              </div>
            </div>

            <!-- Message Input -->
            <div v-if="selectedConversation" class="border-t border-gray-200 p-4">
              <div class="flex gap-2">
                <input
                  type="text"
                  v-model="newMessage"
                  @keyup.enter="sendMessage"
                  placeholder="Type your message..."
                  class="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
                />
                <button
                  @click="sendMessage"
                  :disabled="!newMessage.trim() || sending"
                  class="px-4 py-3 bg-green-700 text-white rounded-md hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {{ sending ? '...' : 'Send' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Contacts -->
      <div v-if="recentContacts.length > 0" class="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-green-800">Contacts</h3>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div
            v-for="contact in recentContacts"
            :key="contact.id"
            @click="startConversation(contact)"
            class="text-center cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <div
              class="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-medium"
              :class="getUserBadgeClass(contact.role)"
            >
              {{ getInitials(contact.name) }}
            </div>
            <p class="text-xs font-medium text-gray-900 truncate">{{ contact.name }}</p>
            <p class="text-xs text-gray-500 truncate capitalize">{{ roleLabel(contact.role) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- New Message Modal -->
    <div
      v-if="showNewMessageModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeNewMessageModal"
    >
      <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-green-800">New Message</h3>
            <button @click="closeNewMessageModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
              <select
                v-model="newMessageRecipient"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                  <option value="" disabled>Select recipient</option>
                  <optgroup label="Admins">
                    <option v-for="contact in allContacts.filter(c => c.role === 'admin')" :key="contact.id" :value="contact.id">{{ contact.name }}</option>
                  </optgroup>
                  <optgroup label="Instructors">
                    <option v-for="contact in allContacts.filter(c => c.role === 'instructor')" :key="contact.id" :value="contact.id">{{ contact.name }}</option>
                  </optgroup>
                  <optgroup label="Trainers">
                    <option v-for="contact in allContacts.filter(c => c.role === 'trainer')" :key="contact.id" :value="contact.id">{{ contact.name }}</option>
                  </optgroup>
                  <optgroup label="Students">
                    <option v-for="contact in allContacts.filter(c => c.role === 'user')" :key="contact.id" :value="contact.id">{{ contact.name }}</option>
                  </optgroup>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                v-model="newMessageContent"
                rows="4"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Type your message here..."
              ></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button
              type="button"
              @click="closeNewMessageModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              @click="sendNewMessage"
              :disabled="!newMessageRecipient || !newMessageContent.trim() || sending"
              class="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ sending ? 'Sending...' : 'Send Message' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import AdminLayout from './AdminLayout.vue'

export default {
  name: 'AdminMessages',
  components: { AdminLayout },

  setup() {
    const api = axios.create({
      baseURL: 'http://localhost:3000',
      withCredentials: true,
    })

    // ── State ──────────────────────────────────────────────────────────────────
    const searchQuery = ref('')
    const selectedType = ref('')
    const selectedStatus = ref('')
    const selectedConversation = ref(null)
    const newMessage = ref('')
    const sending = ref(false)
    const showNewMessageModal = ref(false)
    const newMessageRecipient = ref('')
    const newMessageContent = ref('')
    const messagesContainer = ref(null)

    const inbox = ref([])
    const messages = ref([])
    const myId = ref(null)
    const allContacts = ref([])

    const messageStats = ref({
      totalMessages: 0,
      unreadMessages: 0,
      studentMessages: 0,
      instructorMessages: 0,
    })

    // ── API ────────────────────────────────────────────────────────────────────
    const fetchMe = async () => {
      const res = await api.get('/api/auth/me')
      myId.value = res.data.user.id
    }

    const fetchInbox = async () => {
      const res = await api.get('/api/messages/inbox')
      inbox.value = res.data

      messageStats.value.totalMessages = inbox.value.length
      messageStats.value.unreadMessages = inbox.value.filter(c => c.unreadCount > 0).length
      messageStats.value.studentMessages = inbox.value.filter(c => c.role === 'user').length
      messageStats.value.instructorMessages = inbox.value.filter(c => c.role === 'instructor').length
    }

    const fetchContacts = async () => {
      try {
        const res = await api.get('/api/messages/contacts')
        allContacts.value = res.data
      } catch (err) {
        console.error('fetchContacts error:', err)
      }
    }

    const loadThread = async (user) => {
      selectedConversation.value = user
      const res = await api.get(`/api/messages/thread/${user.id}`)
      messages.value = res.data

      // Reset unread locally
      const found = inbox.value.find(c => c.id === user.id)
      if (found) {
        found.unreadCount = 0
        found.status = 'read'
      }
      messageStats.value.unreadMessages = inbox.value.filter(c => c.unreadCount > 0).length

      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !selectedConversation.value || sending.value) return
      sending.value = true
      try {
        await api.post('/api/messages/send', {
          receiver_id: selectedConversation.value.id,
          message: newMessage.value,
        })
        newMessage.value = ''
        await loadThread(selectedConversation.value)
        await fetchInbox()
      } finally {
        sending.value = false
      }
    }

    const sendNewMessage = async () => {
      if (!newMessageRecipient.value || !newMessageContent.value.trim() || sending.value) return
      sending.value = true
      try {
        await api.post('/api/messages/send', {
          receiver_id: newMessageRecipient.value,
          message: newMessageContent.value,
        })
        closeNewMessageModal()
        await fetchInbox()

        // Open the thread
        const contact = allContacts.value.find(c => c.id === newMessageRecipient.value)
        if (contact) await loadThread(contact)
      } finally {
        sending.value = false
      }
    }
            const deleteConversation = (conv) => {
          if (confirm(`Delete conversation with ${conv.name}?`)) {
            inbox.value = inbox.value.filter(c => c.id !== conv.id);
            if (selectedConversation.value?.id === conv.id) {
              selectedConversation.value = null;
              messages.value = [];
            }
            messageStats.value.totalMessages = inbox.value.length;
            messageStats.value.unreadMessages = inbox.value.filter(c => c.unreadCount > 0).length;
          }
        };

    // ── Computed ───────────────────────────────────────────────────────────────
    const filteredConversations = computed(() => {
      let result = [...inbox.value]

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(
          c =>
            c.name.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q) ||
            (c.lastMessage || '').toLowerCase().includes(q)
        )
      }

      if (selectedType.value) {
        result = result.filter(c => c.role === selectedType.value)
      }

      if (selectedStatus.value) {
        result = result.filter(c => c.status === selectedStatus.value)
      }

      return result.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    })

    // Contacts not yet in inbox
    const recentContacts = computed(() =>
      allContacts.value
        .filter(c => !inbox.value.some(conv => conv.id === c.id))
        .slice(0, 12)
    )

    // ── Helpers ────────────────────────────────────────────────────────────────
    const roleLabel = (role) => {
      if (role === 'user') return 'Student'
      if (role === 'admin') return 'Admin'
      if (role === 'instructor') return 'Instructor'
      if (role === 'trainer') return 'Trainer'
      return role
    }

    const getInitials = (name) =>
      (name || '?')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diffDays = Math.floor((now - date) / 86400000)
      if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' })
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const getUserBadgeClass = (role) => {
      if (role === 'instructor') return 'bg-purple-600'
      if (role === 'admin') return 'bg-green-600'
      if (role === 'trainer') return 'bg-yellow-600'
      if (role === 'user') return 'bg-blue-600'
      return 'bg-gray-500'
    }

    const getStatusBadgeClass = (status) => {
      if (status === 'unread') return 'bg-blue-100 text-blue-800'
      return 'bg-gray-100 text-gray-600'
    }

    const clearFilters = () => {
      searchQuery.value = ''
      selectedType.value = ''
      selectedStatus.value = ''
    }

    const markAllAsRead = () => {
      inbox.value.forEach(c => {
        c.unreadCount = 0
        c.status = 'read'
      })
      messageStats.value.unreadMessages = 0
    }

    const selectConversation = (conv) => loadThread(conv)

    const startNewMessage = () => {
      showNewMessageModal.value = true
    }

    const closeNewMessageModal = () => {
      showNewMessageModal.value = false
      newMessageRecipient.value = ''
      newMessageContent.value = ''
    }

    const startConversation = async (contact) => {
      await loadThread(contact)
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    onMounted(async () => {
      await fetchMe()
      await Promise.all([fetchInbox(), fetchContacts()])
    })

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
      messageStats,
      inbox,
      recentContacts,
      allContacts,
      filteredConversations,
      messages,
      myId,

      roleLabel,
      getInitials,
      formatTime,
      getUserBadgeClass,
      getStatusBadgeClass,
      clearFilters,
      markAllAsRead,
      selectConversation,
      sendMessage,
      startNewMessage,
      closeNewMessageModal,
      sendNewMessage,
      startConversation,
      deleteConversation,
    }
  },
}
</script>

<style scoped>
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
::-webkit-scrollbar-thumb { background: #888; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #555; }
.fixed.inset-0 { animation: fadeIn 0.2s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>