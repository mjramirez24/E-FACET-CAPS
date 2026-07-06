<template>
  <div class="bg-gray-50 flex min-h-screen">
    <InstructorSidebar :active-page="activePage" />

    <main :class="[
      'flex-1 p-4 sm:p-6 overflow-y-auto min-h-screen bg-gray-50 transition-all duration-300',
      'lg:ml-64'
    ]">
      <!-- Page Header -->
      <header class="flex justify-between items-center bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-5 sm:px-6 py-3 rounded-2xl mb-4 shadow-lg shadow-emerald-500/20">
        <div class="flex items-center w-full gap-2 sm:gap-4">
          <slot name="header-left"></slot>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Notification Bell -->
          <div class="relative" ref="bellWrapper">
            <button
              @click="toggleDropdown"
              class="relative p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              <!-- Red dot indicator -->
              <span
                v-if="hasUnreadMessages || hasUnseenCerts"
                class="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-emerald-700 animate-pulse"
              ></span>
            </button>

            <!-- Dropdown Panel -->
            <transition name="notif-drop">
              <div
                v-if="dropdownOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              >
                <!-- Header -->
                <div class="px-5 py-3.5 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span class="font-semibold text-sm">Notifications</span>
                  </div>
                  <button @click="dropdownOpen = false" class="text-emerald-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Loading state -->
                <div v-if="notifLoading" class="px-4 py-8 text-center">
                  <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-sm text-gray-400">Loading notifications...</span>
                </div>

                <template v-else>
                  <!-- Ready Certificates Section -->
                  <div class="border-b border-gray-100">
                    <div class="px-5 pt-4 pb-1 flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ready Certificates</span>
                    </div>

                    <template v-if="unseenCerts.length > 0">
                      <button
                        v-for="cert in unseenCerts"
                        :key="cert.reservation_id"
                        @click="goCertificates()"
                        class="w-full text-left px-5 py-3.5 hover:bg-amber-50 transition-colors flex items-start gap-3 border-t border-gray-50"
                      >
                        <div class="mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                          <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-800 truncate">{{ cert.student_name }}</p>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ cert.course_name }}</p>
                          <p class="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                            Ready to generate
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </p>
                        </div>
                      </button>
                    </template>

                    <div v-else class="px-5 py-3.5 flex items-center gap-3 text-gray-400 border-t border-gray-50">
                      <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span class="text-sm">No certificates pending</span>
                    </div>
                  </div>

                  <!-- Unread Messages Section -->
                  <div>
                    <div class="px-5 pt-4 pb-1 flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unread Messages</span>
                    </div>

                    <template v-if="unreadMessages.length > 0">
                      <button
                        v-for="msg in unreadMessages"
                        :key="msg.id"
                        @click="goMessages(msg.id)"
                        class="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-t border-gray-50"
                      >
                        <div class="mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 shadow-inner">
                          {{ getInitials(msg.name) }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2">
                            <p class="text-sm font-semibold text-gray-800 truncate">{{ msg.name }}</p>
                            <span class="flex-shrink-0 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                              {{ msg.unreadCount > 99 ? '99+' : msg.unreadCount }}
                            </span>
                          </div>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ msg.lastMessage || 'New message' }}</p>
                        </div>
                      </button>
                    </template>

                    <div v-else class="px-5 py-3.5 flex items-center gap-3 text-gray-400 border-t border-gray-50">
                      <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <span class="text-sm">No unread messages</span>
                    </div>

                    <!-- Footer -->
                    <div class="px-5 py-3 border-t border-gray-100 bg-gray-50">
                      <button @click="goMessages()" class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors flex items-center gap-1">
                        View all messages
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </transition>
          </div>
          <!-- End Bell -->

          <!-- Instructor Avatar - Shows first letter of fullname -->
          <div 
            class="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center text-sm sm:text-base font-bold cursor-pointer hover:bg-white/30 transition-all duration-200 border-2 border-white/20 shadow-inner" 
            :title="userData.fullname || 'Instructor'"
          >
            {{ userInitial }}
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-4 sm:p-6">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script>
import InstructorSidebar from './InstructorSidebar.vue';

export default {
  name: 'InstructorLayout',
  components: { InstructorSidebar },
  props: {
    activePage: { type: String, default: '' }
  },

  data() {
    return {
      dropdownOpen: false,
      notifLoading: false,
      readyCerts: [],
      unreadMessages: [],
      seenCertIds: new Set(),
      currentUserId: null,
      userData: {
        fullname: '',
        email: ''
      },
      _pollTimer: null,
    };
  },

  computed: {
    unseenCerts() {
      return this.readyCerts.filter(c => !this.seenCertIds.has(c.reservation_id));
    },
    hasUnseenCerts() {
      return this.unseenCerts.length > 0;
    },
    hasUnreadMessages() {
      return this.unreadMessages.length > 0;
    },
    userInitial() {
      if (this.userData.fullname && this.userData.fullname.trim()) {
        return this.userData.fullname.trim().charAt(0).toUpperCase();
      }
      return 'I';
    },
  },

  mounted() {
    this.init();
    document.addEventListener('click', this.onOutsideClick);
  },

  beforeUnmount() {
    clearInterval(this._pollTimer);
    document.removeEventListener('click', this.onOutsideClick);
  },

  methods: {
    async init() {
      await this.fetchUserData();
      this.loadSeenFromStorage();
      await this.fetchNotifications();
      this._pollTimer = setInterval(this.fetchNotifications, 60_000);
    },

    async fetchUserData() {
      try {
        const profileRes = await fetch('/api/settings/profile', { credentials: 'include' });
        const profileJson = await profileRes.json();
        
        if (profileJson?.status === 'success' && profileJson?.profile) {
          this.userData = {
            fullname: profileJson.profile.fullname || '',
            email: profileJson.profile.email || ''
          };
        }

        const authRes = await fetch('/api/auth/check', { credentials: 'include' });
        const authJson = await authRes.json();
        if (authJson?.authenticated && authJson?.user?.id) {
          this.currentUserId = authJson.user.id;
        }
      } catch (e) {
        // Silent fail
      }
    },

    storageKey() {
      return `seen_certs_${this.currentUserId || 'guest'}`;
    },

    loadSeenFromStorage() {
      try {
        const raw = localStorage.getItem(this.storageKey());
        const arr = raw ? JSON.parse(raw) : [];
        this.seenCertIds = new Set(arr);
      } catch {
        this.seenCertIds = new Set();
      }
    },

    markCertSeen(reservationId) {
      this.seenCertIds.add(reservationId);
      try {
        localStorage.setItem(this.storageKey(), JSON.stringify([...this.seenCertIds]));
      } catch { /* non-fatal */ }
    },

    async fetchNotifications() {
      this.notifLoading = true;
      try {
        const [certsRes, inboxRes] = await Promise.all([
          fetch('/api/instructor/certificates/driving/completions', { credentials: 'include' }),
          fetch('/api/messages/inbox', { credentials: 'include' }),
        ]);

        if (certsRes.ok) {
          const certsJson = await certsRes.json();
          const data = Array.isArray(certsJson?.data) ? certsJson.data : [];
          this.readyCerts = data
            .filter(r => (r.ui_status || (r.certificate_id ? 'issued' : 'ready')) === 'ready')
            .map(r => ({
              reservation_id: r.reservation_id,
              student_name: r.student_name || '—',
              course_name: r.course_name || '—',
            }));
        }

        if (inboxRes.ok) {
          const inbox = await inboxRes.json();
          if (Array.isArray(inbox)) {
            this.unreadMessages = inbox
              .filter(m => m.unreadCount > 0)
              .slice(0, 5)
              .map(m => ({
                id: m.id,
                name: m.name,
                unreadCount: m.unreadCount,
                lastMessage: m.lastMessage || '',
              }));
          }
        }
      } catch (err) {
        // Silent fail
      } finally {
        this.notifLoading = false;
      }
    },

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
      if (this.dropdownOpen) {
        this.fetchNotifications().then(() => {
          this.unseenCerts.forEach(cert => {
            this.markCertSeen(cert.reservation_id);
            window.dispatchEvent(new CustomEvent('cert-seen', {
              detail: { reservationId: cert.reservation_id }
            }));
          });
        });
      }
    },

    onOutsideClick(e) {
      if (this.$refs.bellWrapper && !this.$refs.bellWrapper.contains(e.target)) {
        this.dropdownOpen = false;
      }
    },

    goCertificates() {
      this.dropdownOpen = false;
      const path = '/instructor-certificates';
      if (this.$router) this.$router.push(path);
      else window.location.href = path;
    },

    goMessages(userId) {
      this.dropdownOpen = false;
      const path = userId ? `/instructor-messages?user=${userId}` : '/instructor-messages';
      if (this.$router) this.$router.push(path);
      else window.location.href = path;
    },

    getInitials(name) {
      return String(name || '')
        .trim().split(' ').filter(Boolean)
        .slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
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
  main { margin-left: 0 !important; padding-top: 4rem; }
}

.notif-drop-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.notif-drop-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.notif-drop-enter-from { opacity: 0; transform: translateY(-8px); }
.notif-drop-leave-to { opacity: 0; transform: translateY(-8px); }
</style>