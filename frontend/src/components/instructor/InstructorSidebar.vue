<template>
  <!-- Mobile Menu Button -->
  <button
    @click="toggleMobileMenu"
    class="lg:hidden fixed top-4 left-4 z-50 bg-green-800 text-white p-2 rounded-lg shadow-lg"
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
        <img src="/facet-logo.png" alt="FACET Logo" class="w-8 h-8 sm:w-10 sm:h-10" />
        <h1 class="font-bold text-green-900 text-base sm:text-lg">E-FACET Instructor</h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 space-y-1">

        <router-link
          to="/instructor-dashboard"
          :class="navClass('InstructorDashboard')"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">📊 Dashboard</span>
        </router-link>

        <router-link
          to="/instructor-classes"
          :class="navClass('InstructorClasses')"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">📚 My Classes</span>
        </router-link>

        <router-link
          to="/instructor-students"
          :class="navClass('InstructorStudents')"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">👨‍🎓 My Students</span>
        </router-link>

        <!-- Certificates — red dot only (no count) -->
        <router-link
          to="/instructor-certificates"
          :class="navClass('InstructorCertificates')"
          @click="isMobileMenuOpen = false"
          class="relative"
        >
          <span class="ml-2">🎓 Certificates</span>
        </router-link>

        <!-- Messages — red dot only (no count) -->
        <router-link
          to="/instructor-messages"
          :class="navClass('InstructorMessages')"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">💬 Messages</span>
        </router-link>

        <router-link
          to="/instructor-settings"
          :class="navClass('InstructorSettings')"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">⚙️ Settings</span>
        </router-link>

      </nav>
    </div>

    <!-- Bottom User Info + Logout -->
    <div class="sticky bottom-0 bg-white">
      <div class="border-t border-gray-200 p-4">
        <button
          @click="logout"
          class="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition text-sm sm:text-base"
        >
          🚪 Logout
        </button>
      </div>

      <div class="bg-green-800 text-white p-3 sm:p-4 flex items-center rounded-br-2xl">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white text-green-800 flex items-center justify-center rounded-full text-base sm:text-lg font-bold">
            {{ userInitial }}
          </div>
          <div class="min-w-0">
            <p class="text-xs sm:text-sm font-semibold truncate">{{ user.fullname || 'Instructor' }}</p>
            <p class="text-xs truncate opacity-80">{{ user.email || '' }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'InstructorSidebar',

  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      user: { fullname: '', username: '', email: '' },
      isMobileMenuOpen: false,

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
      return [
        'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
        this.$route?.name === routeName
          ? 'bg-green-100 text-green-700 font-medium'
          : 'hover:bg-gray-200',
      ];
    },

    // ── User data ─────────────────────────────────────────────────────────
    async fetchUserData() {
      try {
        const res  = await fetch('/api/settings/profile', { credentials: 'include' });
        const json = await res.json();
        if (json?.status === 'success' && json?.profile) {
          this.user = {
            fullname: json.profile.fullname || '',
            username: json.profile.username || '',
            email:    json.profile.email    || '',
          };
        }
        // also get user id for localStorage scoping
        const authRes  = await fetch('/api/auth/check', { credentials: 'include' });
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
          fetch('/api/instructor/certificates/driving/completions', { credentials: 'include' }),
          fetch('/api/messages/inbox', { credentials: 'include' }),
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
    async logout() {
      try {
        const res  = await fetch('/api/auth/logout', { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') this.router.push('/login');
      } catch {
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
aside {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}
aside::-webkit-scrollbar { width: 6px; }
aside::-webkit-scrollbar-track { background: transparent; }
aside::-webkit-scrollbar-thumb { background-color: #cbd5e0; border-radius: 3px; }

.router-link-exact-active {
  background-color: #d1fae5;
  color: #047857;
  font-weight: 500;
}
.router-link-active:hover:not(.router-link-exact-active) {
  background-color: #f3f4f6;
}

.truncate { max-width: 120px; }
@media (max-width: 640px) { .truncate { max-width: 80px; } }
</style>