<template>
  <div class="bg-gray-100 flex min-h-screen">
    <TrainerSidebar :active-page="activePage" />

    <main :class="[
      'flex-1 p-4 sm:p-6 overflow-y-auto min-h-screen bg-gray-100 transition-all duration-300',
      'lg:ml-64'
    ]">
      <!-- Page Header -->
      <header class="flex justify-between items-center bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-t-xl mb-4">
        <div class="flex items-center w-full gap-2 sm:gap-4">
          <slot name="header-left"></slot>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">

          <!-- ─── Notification Bell ─── -->
          <div class="relative" ref="bellWrapper">
            <button
              @click="toggleDropdown"
              class="relative p-1.5 sm:p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              <!-- Red dot — unread messages OR unseen ready certs -->
              <span
                v-if="hasUnreadMessages || hasUnseenCerts"
                class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-blue-800 animate-pulse"
              ></span>
            </button>

            <!-- Dropdown Panel -->
            <transition name="notif-drop">
              <div
                v-if="dropdownOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              >
                <!-- Header -->
                <div class="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
                  <span class="font-semibold text-sm tracking-wide">Notifications</span>
                  <button @click="dropdownOpen = false" class="text-blue-200 hover:text-white text-lg leading-none">✕</button>
                </div>

                <div v-if="notifLoading" class="px-4 py-6 text-center text-sm text-gray-400">
                  Loading…
                </div>

                <template v-else>

                  <!-- ── Ready Certificates Section ── -->
                  <div class="border-b border-gray-100">
                    <div class="px-4 pt-3 pb-1">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ready Certificates</span>
                    </div>

                    <template v-if="unseenCerts.length > 0">
                      <button
                        v-for="cert in unseenCerts"
                        :key="cert.reservation_id"
                        @click="goCertificates()"
                        class="w-full text-left px-4 py-3 hover:bg-yellow-50 transition-colors flex items-start gap-3 border-t border-gray-50"
                      >
                        <span class="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-base">🎓</span>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-800 truncate">{{ cert.student_name }}</p>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ cert.course_name }}</p>
                          <p class="text-xs text-yellow-600 font-medium mt-1">Ready to generate →</p>
                        </div>
                      </button>
                    </template>

                    <div v-else class="px-4 py-3 flex items-center gap-3 text-gray-400">
                      <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">✅</span>
                      <span class="text-sm">No certificates pending</span>
                    </div>
                  </div>

                  <!-- ── Unread Messages Section ── -->
                  <div>
                    <div class="px-4 pt-3 pb-1">
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unread Messages</span>
                    </div>

                    <template v-if="unreadMessages.length > 0">
                      <button
                        v-for="msg in unreadMessages"
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

                    <div v-else class="px-4 py-3 flex items-center gap-3 text-gray-400">
                      <span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">💬</span>
                      <span class="text-sm">No unread messages</span>
                    </div>

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
          <!-- ─── End Bell ─── -->

          <!-- Trainer Avatar -->
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white text-blue-800 rounded-full flex items-center justify-center text-base sm:text-xl cursor-pointer hover:bg-gray-100 transition-colors">
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
import TrainerSidebar from './TrainerSidebar.vue';

export default {
  name: 'TrainerLayout',
  components: { TrainerSidebar },
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
  },

  async mounted() {
    await this.checkAuthTrainer();
    await this.init();
    document.addEventListener('click', this.onOutsideClick);
  },

  beforeUnmount() {
    clearInterval(this._pollTimer);
    document.removeEventListener('click', this.onOutsideClick);
  },

  methods: {
    // ── Auth check (preserved from original) ─────────────────────────────
    async checkAuthTrainer() {
      try {
        const res  = await fetch('/api/auth/check', { credentials: 'include' });
        const data = await res.json();

        if (data.status !== 'success' || !data.authenticated) {
          this.$router.push('/login'); return;
        }
        if (data.user.role !== 'trainer') {
          if (data.user.role === 'admin')      return this.$router.push('/admin-dashboard');
          if (data.user.role === 'instructor') return this.$router.push('/instructor-dashboard');
          const home = data.user.track === 'tesda' ? '/tesda-dashboard' : '/student-dashboard';
          return this.$router.push(home);
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        this.currentUserId = data.user.id;
      } catch (e) {
        console.error('TrainerLayout auth check failed:', e);
        this.$router.push('/login');
      }
    },

    async init() {
      if (!this.currentUserId) await this.fetchUserId();
      this.loadSeenFromStorage();
      await this.fetchNotifications();
      this._pollTimer = setInterval(this.fetchNotifications, 60_000);
    },

    async fetchUserId() {
      try {
        const res  = await fetch('/api/auth/check', { credentials: 'include' });
        const json = await res.json();
        if (json?.authenticated && json?.user?.id) this.currentUserId = json.user.id;
      } catch { /* non-fatal */ }
    },

    // ── localStorage helpers ──────────────────────────────────────────────
    storageKey() {
      return `seen_certs_trainer_${this.currentUserId || 'guest'}`;
    },
    loadSeenFromStorage() {
      try {
        const raw = localStorage.getItem(this.storageKey());
        this.seenCertIds = new Set(raw ? JSON.parse(raw) : []);
      } catch { this.seenCertIds = new Set(); }
    },
    markCertSeen(reservationId) {
      this.seenCertIds.add(reservationId);
      try {
        localStorage.setItem(this.storageKey(), JSON.stringify([...this.seenCertIds]));
      } catch { /* non-fatal */ }
    },

    // ── Fetch notifications ───────────────────────────────────────────────
    async fetchNotifications() {
      this.notifLoading = true;
      try {
        const [certsRes, inboxRes] = await Promise.all([
          fetch('/api/trainer/certificates/completions', { credentials: 'include' }),
          fetch('/api/messages/inbox', { credentials: 'include' }),
        ]);

        if (certsRes.ok) {
          const json = await certsRes.json();
          const data = Array.isArray(json?.data) ? json.data : [];
          this.readyCerts = data
            .filter(r => (r.ui_status || (r.certificate_id ? 'issued' : 'ready')) === 'ready')
            .map(r => ({
              reservation_id: r.reservation_id,
              student_name:   r.student_name || '—',
              course_name:    r.course_name  || '—',
            }));
        }

        if (inboxRes.ok) {
          const inbox = await inboxRes.json();
          if (Array.isArray(inbox)) {
            this.unreadMessages = inbox
              .filter(m => m.unreadCount > 0)
              .slice(0, 5)
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

    // ── Dropdown — opening = one-time view, marks all unseen certs seen ───
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
      if (this.dropdownOpen) {
        this.fetchNotifications().then(() => {
          this.unseenCerts.forEach(cert => {
            this.markCertSeen(cert.reservation_id);
            window.dispatchEvent(new CustomEvent('cert-seen-trainer', {
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

    // ── Navigation ────────────────────────────────────────────────────────
    goCertificates() {
      this.dropdownOpen = false;
      if (this.$router) this.$router.push('/trainer-certificates');
      else window.location.href = '/trainer-certificates';
    },
    goMessages(userId) {
      this.dropdownOpen = false;
      const path = userId ? `/trainer-messages?user=${userId}` : '/trainer-messages';
      if (this.$router) this.$router.push(path);
      else window.location.href = path;
    },
    getInitials(name) {
      return String(name || '').trim().split(' ').filter(Boolean)
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

.notif-drop-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.notif-drop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.notif-drop-enter-from   { opacity: 0; transform: translateY(-6px); }
.notif-drop-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>