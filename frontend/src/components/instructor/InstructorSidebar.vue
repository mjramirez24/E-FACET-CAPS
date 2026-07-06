<template>
  <!-- Wrap everything in a single root div -->
  <div>
    <!-- Mobile Menu Button -->
    <button
      @click="toggleMobileMenu"
      class="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
      aria-label="Toggle menu"
    >
      <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Overlay -->
    <div
      v-if="isMobileMenuOpen"
      @click="isMobileMenuOpen = false"
      class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'w-64 bg-white shadow-md flex flex-col justify-between rounded-r-2xl h-screen overflow-y-auto fixed transition-transform duration-300 z-50',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <div>
        <!-- Logo -->
        <div class="flex items-center gap-2 p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div class="logo-icon-wrapper">
            <img src="/facet-logo.png" alt="FACET Logo" class="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          </div>
          <h1 class="font-bold text-green-900 text-base sm:text-lg">E-FACET Instructor</h1>
        </div>

        <!-- Navigation -->
        <nav class="mt-4 space-y-1">
          <router-link
            to="/instructor-dashboard"
            :class="navClass('InstructorDashboard')"
            @click="isMobileMenuOpen = false"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            <span>Dashboard</span>
          </router-link>

          <router-link
            to="/instructor-classes"
            :class="navClass('InstructorClasses')"
            @click="isMobileMenuOpen = false"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span>My Classes</span>
          </router-link>

          <router-link
            to="/instructor-students"
            :class="navClass('InstructorStudents')"
            @click="isMobileMenuOpen = false"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <span>My Students</span>
          </router-link>

          <!-- Certificates — red dot only (no count) -->
          <router-link
            to="/instructor-certificates"
            :class="navClass('InstructorCertificates')"
            @click="isMobileMenuOpen = false"
            class="relative"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
            <span>Certificates</span>
            <!-- Red dot indicator -->
            <span
              v-if="hasUnseenCerts"
              class="absolute top-1/2 -translate-y-1/2 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse"
            ></span>
          </router-link>

          <!-- Messages — red dot only (no count) -->
          <router-link
            to="/instructor-messages"
            :class="navClass('InstructorMessages')"
            @click="isMobileMenuOpen = false"
            class="relative"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
            <span>Messages</span>
            <!-- Red dot indicator -->
            <span
              v-if="totalUnread > 0"
              class="absolute top-1/2 -translate-y-1/2 right-3 w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse"
            ></span>
          </router-link>

          <router-link
            to="/instructor-settings"
            :class="navClass('InstructorSettings')"
            @click="isMobileMenuOpen = false"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span>Settings</span>
          </router-link>
        </nav>
      </div>

      <!-- Bottom User Info + Logout -->
      <div class="sticky bottom-0 bg-white">
        <!-- Sign Out Button -->
        <div class="border-t border-gray-200 p-4">
          <button
            @click="openLogoutModal"
            class="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium border-2 border-red-200 hover:border-red-300 group"
          >
            <svg class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>

        <div class="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white p-4 flex items-center rounded-br-2xl">
          <div class="flex items-center gap-3 w-full">
            <div class="w-10 h-10 bg-white/20 backdrop-blur-sm text-white flex items-center justify-center rounded-xl text-base font-bold border-2 border-white/30 flex-shrink-0 shadow-inner">
              {{ userInitial }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold truncate leading-tight">{{ user.fullname || 'Instructor' }}</p>
              <p class="text-xs truncate opacity-80 mt-0.5">{{ user.email || '' }}</p>
            </div>
            <!-- Online indicator dot -->
            <div class="flex-shrink-0 w-2.5 h-2.5 bg-green-300 rounded-full shadow-lg shadow-green-500/50 animate-pulse"></div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Logout Confirmation Modal -->
    <transition name="modal-fade">
      <div
        v-if="showLogoutModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        @click.self="closeLogoutModal"
      >
        <transition name="modal-scale">
          <div v-if="showLogoutModal" class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div class="p-5 border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>

                <div>
                  <h3 class="text-lg font-bold text-gray-900">Sign Out</h3>
                  <p class="text-sm text-gray-500">Instructor account session</p>
                </div>
              </div>
            </div>

            <div class="p-5">
              <p class="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to sign out from your instructor account? Any unsaved changes will be lost.
              </p>

              <div
                v-if="logoutError"
                class="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ logoutError }}
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  @click="closeLogoutModal"
                  :disabled="logoutLoading"
                  class="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 text-sm font-medium disabled:opacity-60 transition-all duration-200"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  @click="confirmLogout"
                  :disabled="logoutLoading"
                  class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
                >
                  <svg
                    v-if="logoutLoading"
                    class="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{{ logoutLoading ? "Signing out..." : "Sign Out" }}</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { API_URL } from "../../config/api";

export default {
  name: 'InstructorSidebar',

  // Prevent attribute inheritance warning
  inheritAttrs: false,

  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      user: { fullname: '', username: '', email: '' },
      isMobileMenuOpen: false,
      showLogoutModal: false,
      logoutLoading: false,
      logoutError: '',

      // mirrors what InstructorLayout tracks — populated via window events
      unseenCertCount: 0,
      totalUnread:     0,

      currentUserId: null,
      seenCertIds: new Set(),

      _pollTimer: null,
    };
  },

  computed: {
    userInitial() {
      return this.user.fullname ? this.user.fullname.charAt(0).toUpperCase() : 'I';
    },
    hasUnseenCerts() {
      return this.unseenCertCount > 0;
    },
  },

  methods: {
    navClass(routeName) {
      const isActive = this.$route?.name === routeName;
      return [
        'flex items-center gap-2 px-5 py-2 rounded-r-full text-sm sm:text-base transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 font-medium shadow-sm'
          : 'text-gray-600 hover:bg-gray-50',
      ];
    },

    // ── User data ─────────────────────────────────────────────────────────
    async fetchUserData() {
      try {
        const res = await fetch(`${API_URL}/settings/profile`, { credentials: 'include' });
        const json = await res.json();
        if (json?.status === 'success' && json?.profile) {
          this.user = {
            fullname: json.profile.fullname || '',
            username: json.profile.username || '',
            email:    json.profile.email    || '',
          };
        }
        // also get user id for localStorage scoping
        const authRes = await fetch(`${API_URL}/auth/check`, { credentials: 'include' });
        const authJson = await authRes.json();
        if (authJson?.authenticated && authJson?.user?.id) {
          this.currentUserId = authJson.user.id;
        }
      } catch (err) {
        console.error('fetchUserData:', err);
        if (err?.status === 401) this.router.push('/login');
      }
    },

    handleUserUpdate(e) {
      if (e.detail) Object.assign(this.user, e.detail);
    },

    // ── Badge counts ──────────────────────────────────────────────────────
    storageKey() {
      return `seen_certs_${this.currentUserId || 'guest'}`;
    },

    loadSeenFromStorage() {
      try {
        const raw = localStorage.getItem(this.storageKey());
        this.seenCertIds = new Set(raw ? JSON.parse(raw) : []);
      } catch {
        this.seenCertIds = new Set();
      }
    },

    async fetchBadgeCounts() {
      try {
        const [certsRes, inboxRes] = await Promise.all([
          fetch(`${API_URL}/instructor/certificates/driving/completions`, { credentials: 'include' }),
          fetch(`${API_URL}/messages/inbox`, { credentials: 'include' }),
        ]);

        if (certsRes.ok) {
          const json = await certsRes.json();
          const data = Array.isArray(json?.data) ? json.data : [];
          const readyIds = data
            .filter(r => (r.ui_status || (r.certificate_id ? 'issued' : 'ready')) === 'ready')
            .map(r => r.reservation_id);
          this.unseenCertCount = readyIds.filter(id => !this.seenCertIds.has(id)).length;
        }

        if (inboxRes.ok) {
          const inbox = await inboxRes.json();
          if (Array.isArray(inbox)) {
            this.totalUnread = inbox.reduce((sum, m) => sum + (Number(m.unreadCount) || 0), 0);
          }
        }
      } catch (err) {
        console.error('sidebar fetchBadgeCounts:', err);
      }
    },

    // Listen for the layout telling us a cert was seen
    handleCertSeen(e) {
      if (e.detail?.reservationId != null) {
        this.seenCertIds.add(e.detail.reservationId);
        // recalculate
        this.fetchBadgeCounts();
      }
    },

    // ── Logout ────────────────────────────────────────────────────────────
    openLogoutModal() {
      this.logoutError = '';
      this.showLogoutModal = true;
      this.isMobileMenuOpen = false;
    },

    closeLogoutModal() {
      if (this.logoutLoading) return;
      this.showLogoutModal = false;
      this.logoutError = '';
    },

    async confirmLogout() {
      this.logoutLoading = true;
      this.logoutError = '';

      try {
        await fetch(`${API_URL}/auth/logout`, { credentials: 'include' });
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');

        this.logoutLoading = false;
        this.showLogoutModal = false;
        this.router.push('/login');
      }
    },

    handleResize() {
      if (window.innerWidth >= 1024) this.isMobileMenuOpen = false;
    },

    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
  },

  async mounted() {
    await this.fetchUserData();
    this.loadSeenFromStorage();
    await this.fetchBadgeCounts();

    // Poll every 60s
    this._pollTimer = setInterval(this.fetchBadgeCounts, 60_000);

    window.addEventListener('user-updated',   this.handleUserUpdate);
    window.addEventListener('cert-seen',       this.handleCertSeen);
    window.addEventListener('resize',          this.handleResize);

    this.$router?.afterEach(() => {
      this.isMobileMenuOpen = false;
      // Refresh badge counts on every navigation
      this.loadSeenFromStorage();
      this.fetchBadgeCounts();
    });
  },

  beforeUnmount() {
    clearInterval(this._pollTimer);
    window.removeEventListener('user-updated', this.handleUserUpdate);
    window.removeEventListener('cert-seen',    this.handleCertSeen);
    window.removeEventListener('resize',       this.handleResize);
  },
};
</script>

<style scoped>
/* Custom scrollbar */
aside {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}
aside::-webkit-scrollbar { width: 6px; }
aside::-webkit-scrollbar-track { background: transparent; }
aside::-webkit-scrollbar-thumb { background-color: #cbd5e0; border-radius: 3px; }

/* Logo icon wrapper */
.logo-icon-wrapper {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
  transition: all 0.3s ease;
}

.logo-icon-wrapper:hover {
  transform: rotate(-5deg) scale(1.05);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

/* Navigation icons */
.nav-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  background: transparent;
}

.router-link-exact-active .nav-icon-wrapper {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.nav-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.router-link-exact-active .nav-icon {
  color: #047857;
}

/* Active state */
.router-link-exact-active {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%) !important;
  color: #047857 !important;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.router-link-active:hover:not(.router-link-exact-active) {
  background-color: #f3f4f6;
}

/* Modal transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* Truncate text */
.truncate { max-width: 120px; }
@media (max-width: 640px) { .truncate { max-width: 80px; } }
</style>