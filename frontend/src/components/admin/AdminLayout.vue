<template>
  <div class="bg-gray-100 flex min-h-screen">
    <!-- Sidebar -->
    <AdminSidebar :active-page="activePage" />

    <!-- Main Content -->
    <main :class="[
      'flex-1 p-4 sm:p-6 overflow-y-auto min-h-screen bg-gray-100 transition-all duration-300',
      'lg:ml-64'
    ]">
      <!-- Page Header -->
      <header class="flex justify-between items-center bg-green-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-t-xl mb-4">
        <div class="flex items-center w-full gap-2 sm:gap-4">
          <slot name="header-left"></slot>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">

          <!-- ─── Notification Bell ─── -->
          <div class="relative" ref="bellWrapper">
            <button
              @click="toggleDropdown"
              class="relative p-1.5 sm:p-2 hover:bg-green-700 rounded-full transition-colors"
              title="Notifications"
            >
              <!-- Bell icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              <!-- Red dot — only visible when there's something to act on -->
              <span
                v-if="hasPendingReservations || hasUnreadMessages"
                class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-green-800 animate-pulse"
              ></span>
            </button>

            <!-- ─── Dropdown Panel ─── -->
            <transition name="notif-drop">
              <div
                v-if="dropdownOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              >
                <!-- Header -->
                <div class="px-4 py-3 bg-green-800 text-white flex items-center justify-between">
                  <span class="font-semibold text-sm tracking-wide">Notifications</span>
                  <button @click="dropdownOpen = false" class="text-green-200 hover:text-white text-lg leading-none">✕</button>
                </div>

                <!-- Loading state -->
                <div v-if="notifLoading" class="px-4 py-6 text-center text-sm text-gray-400">
                  Loading…
                </div>

                <template v-else>
                  <!-- ── Pending Reservations Section ── -->
                  <div class="border-b border-gray-100">
                    <div class="px-4 pt-3 pb-1 flex items-center gap-2">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Reservations</span>
                    </div>

                    <!-- Has pending -->
                    <button
                      v-if="hasPendingReservations"
                      @click="goReservations"
                      class="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors flex items-start gap-3"
                    >
                      <span class="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-base">⏳</span>
                      <div>
                        <p class="text-sm font-semibold text-gray-800">
                          {{ notifData.pendingTotal }} reservation<span v-if="notifData.pendingTotal !== 1">s</span> awaiting approval
                        </p>
                        <p class="text-xs text-gray-500 mt-0.5">
                          Driving: {{ notifData.pendingDriving }} &nbsp;•&nbsp; TESDA: {{ notifData.pendingTesda }}
                        </p>
                        <p class="text-xs text-yellow-600 font-medium mt-1">Tap to review →</p>
                      </div>
                    </button>

                    <!-- None pending -->
                    <div v-else class="px-4 py-3 flex items-center gap-3 text-gray-400">
                      <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">✅</span>
                      <span class="text-sm">No pending reservations</span>
                    </div>
                  </div>

                  <!-- ── Unread Messages Section ── -->
                  <div>
                    <div class="px-4 pt-3 pb-1 flex items-center gap-2">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unread Messages</span>
                    </div>

                    <!-- Has unread -->
                    <template v-if="hasUnreadMessages">
                      <button
                        v-for="msg in notifData.unreadMessages"
                        :key="msg.id"
                        @click="goMessages(msg.id)"
                        class="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-t border-gray-50"
                      >
                        <span class="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                          {{ getInitials(msg.name) }}
                        </span>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2">
                            <p class="text-sm font-semibold text-gray-800 truncate">{{ msg.name }}</p>
                            <span class="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                              {{ msg.unreadCount > 9 ? '9+' : msg.unreadCount }}
                            </span>
                          </div>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ msg.lastMessage || 'New message' }}</p>
                        </div>
                      </button>
                    </template>

                    <!-- None unread -->
                    <div v-else class="px-4 py-3 flex items-center gap-3 text-gray-400">
                      <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">💬</span>
                      <span class="text-sm">No unread messages</span>
                    </div>

                    <!-- Footer -->
                    <div class="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <button @click="goMessages()" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        View all messages →
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </transition>
          </div>
          <!-- ─── End Notification Bell ─── -->

          <!-- User Avatar -->
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white text-green-800 rounded-full flex items-center justify-center text-base sm:text-xl cursor-pointer hover:bg-gray-100 transition-colors">
            👤
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="bg-white rounded-b-xl shadow p-4 sm:p-6">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script>
import AdminSidebar from './AdminSidebar.vue';

export default {
  name: 'AdminLayout',
  components: { AdminSidebar },
  props: {
    activePage: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      dropdownOpen: false,
      notifLoading: false,

      notifData: {
        pendingTotal: 0,
        pendingDriving: 0,
        pendingTesda: 0,
        unreadMessages: [],   // [{ id, name, unreadCount, lastMessage }]
      },

      // poll interval handle
      _pollTimer: null,
    };
  },

  computed: {
    hasPendingReservations() {
      return this.notifData.pendingTotal > 0;
    },
    hasUnreadMessages() {
      return this.notifData.unreadMessages.length > 0;
    },
  },

  mounted() {
    this.fetchNotifications();
    // Refresh every 60 s so the dot stays current without full page reload
    this._pollTimer = setInterval(this.fetchNotifications, 60_000);
    // Close dropdown when clicking outside
    document.addEventListener('click', this.onOutsideClick);
  },

  beforeUnmount() {
    clearInterval(this._pollTimer);
    document.removeEventListener('click', this.onOutsideClick);
  },

  methods: {
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
      if (this.dropdownOpen) {
        // Refresh data each time the panel is opened
        this.fetchNotifications();
      }
    },

    onOutsideClick(e) {
      if (this.$refs.bellWrapper && !this.$refs.bellWrapper.contains(e.target)) {
        this.dropdownOpen = false;
      }
    },

    async fetchNotifications() {
      this.notifLoading = true;
      try {
        // Run both requests in parallel
        const [dashRes, inboxRes] = await Promise.all([
          fetch('/api/admin/dashboard/summary', { credentials: 'include' }),
          fetch('/api/messages/inbox', { credentials: 'include' }),
        ]);

        // ── Pending reservations ──
        if (dashRes.ok) {
          const dashJson = await dashRes.json();
          if (dashJson.status === 'success') {
            const r = dashJson.data?.reservations || {};
            this.notifData.pendingTotal   = r.pending_total   || 0;
            this.notifData.pendingDriving = r.pending_driving || 0;
            this.notifData.pendingTesda   = r.pending_tesda   || 0;
          }
        }

        // ── Unread messages ──
        if (inboxRes.ok) {
          const inbox = await inboxRes.json();
          if (Array.isArray(inbox)) {
            this.notifData.unreadMessages = inbox
              .filter(m => m.unreadCount > 0)
              .slice(0, 5)   // show max 5 senders in dropdown
              .map(m => ({
                id:          m.id,
                name:        m.name,
                unreadCount: m.unreadCount,
                lastMessage: m.lastMessage || '',
              }));
          }
        }
      } catch (err) {
        console.error('fetchNotifications error:', err);
      } finally {
        this.notifLoading = false;
      }
    },

    goReservations() {
      this.dropdownOpen = false;
      if (this.$router) this.$router.push('/admin-reservations');
      else window.location.href = '/admin-reservations';
    },

    goMessages(userId) {
      this.dropdownOpen = false;
      const path = userId ? `/admin-messages?user=${userId}` : '/admin-messages';
      if (this.$router) this.$router.push(path);
      else window.location.href = path;
    },

    getInitials(name) {
      return String(name || '')
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase() || '?';
    },
  },
};
</script>

<style scoped>
main {
  max-height: 100vh;
  overflow-y: auto;
  scrollbar-width: thin;
}
main::-webkit-scrollbar { width: 8px; }
main::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
main::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
main::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }

@media (max-width: 1023px) {
  main {
    margin-left: 0 !important;
    padding-top: 4rem;
  }
}

/* Dropdown slide-down animation */
.notif-drop-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.notif-drop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.notif-drop-enter-from  { opacity: 0; transform: translateY(-6px); }
.notif-drop-leave-to    { opacity: 0; transform: translateY(-6px); }
</style>