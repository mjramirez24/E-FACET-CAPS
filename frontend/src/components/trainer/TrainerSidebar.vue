<template>
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
        <h1 class="font-bold text-blue-900 text-base sm:text-lg">E-FACET Trainer</h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 space-y-1">

        <router-link
          to="/trainer-dashboard"
          :class="navClass('TrainerDashboard')"
          @click="$emit('close-mobile-menu')"
        >
          <span class="ml-2">📊 Dashboard</span>
        </router-link>

        <router-link
          to="/trainer-courses"
          :class="navClass('TrainerCourses')"
          @click="$emit('close-mobile-menu')"
        >
          <span class="ml-2">📚 My Courses</span>
        </router-link>

        <router-link
          to="/trainer-students"
          :class="navClass('TrainerStudents')"
          @click="$emit('close-mobile-menu')"
        >
          <span class="ml-2">👨‍🎓 My Students</span>
        </router-link>

        <router-link
          to="/trainer-attendance"
          :class="navClass('TrainerAttendance')"
          @click="$emit('close-mobile-menu')"
        >
          <span class="ml-2">✅ Attendance</span>
        </router-link>

        <router-link
          to="/trainer-certificates"
          :class="navClass('TrainerCertificates')"
          @click="$emit('close-mobile-menu')"
        >
          <span class="ml-2">🎓 Certificates</span>
        </router-link>

        <router-link
          to="/trainer-messages"
          :class="navClass('TrainerMessages')"
          @click="$emit('close-mobile-menu')"
        >
          <span class="ml-2">💬 Messages</span>
        </router-link>

        <router-link
          to="/trainer-settings"
          :class="navClass('TrainerSettings')"
          @click="$emit('close-mobile-menu')"
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

      <div class="bg-blue-800 text-white p-3 sm:p-4 flex items-center rounded-br-2xl">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white text-blue-800 flex items-center justify-center rounded-full text-base sm:text-lg font-bold">
            {{ userInitial }}
          </div>
          <div class="min-w-0">
            <p class="text-xs sm:text-sm font-semibold truncate">{{ user.fullname || 'Trainer' }}</p>
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
  name: 'TrainerSidebar',
  props: {
    activePage: { type: String, default: '' },
    isMobileMenuOpen: { type: Boolean, default: false }
  },
  emits: ['close-mobile-menu'],

  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      user: { fullname: '', username: '', email: '' },
    };
  },

  computed: {
    userInitial() {
      return this.user.fullname ? this.user.fullname.charAt(0).toUpperCase() : 'T';
    },
  },

  methods: {
    navClass(routeName) {
      return [
        'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
        this.$route?.name === routeName
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'hover:bg-gray-200',
      ];
    },

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
      } catch (err) {
        console.error('fetchUserData:', err);
        if (err?.status === 401) this.router.push('/login');
      }
    },

    handleUserUpdate(e) {
      if (e.detail) Object.assign(this.user, e.detail);
    },

    async logout() {
      try {
        const res  = await fetch('/api/auth/logout', { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'success') this.router.push('/login');
      } catch {
        this.router.push('/login');
      }
    },
  },

  async mounted() {
    await this.fetchUserData();
    window.addEventListener('user-updated', this.handleUserUpdate);
  },

  beforeUnmount() {
    window.removeEventListener('user-updated', this.handleUserUpdate);
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
  background-color: #dbeafe;
  color: #1d4ed8;
  font-weight: 500;
}
.router-link-active:hover:not(.router-link-exact-active) {
  background-color: #f3f4f6;
}

.truncate { max-width: 120px; }
@media (max-width: 640px) { .truncate { max-width: 80px; } }
</style>