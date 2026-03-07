<template>
  <!-- Mobile Menu Button (visible only on mobile) -->
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

  <!-- Overlay for mobile -->
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
        <img src="/facet-logo.png" alt="FACET Logo" class="w-8 h-8 sm:w-10 sm:h-10">
        <h1 class="font-bold text-green-900 text-base sm:text-lg">E-FACET Admin</h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 space-y-1">
        <router-link
          to="/admin-dashboard"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminDashboard'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">📊 Dashboard</span>
        </router-link>

        <router-link
          to="/admin-students"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminStudents'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">👨‍🎓 Students</span>
        </router-link>

        <!-- Reservations -->
        <router-link
          to="/admin-reservations"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminReservations'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">📌 Manage Reservations</span>
        </router-link>

        <router-link
          to="/admin-courses"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminCourses'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">📚 Manage Courses</span>
        </router-link>

        <!-- Instructors -->
        <router-link
          to="/admin-instructors"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminInstructors'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">👨‍🏫 Manage Instructors</span>
        </router-link>

        <router-link
          to="/admin-schedule"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminSchedule'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">🗓️ Schedule Management</span>
        </router-link>

        <router-link
          to="/admin-reports"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminReports'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">📈 Analytics & Reports</span>
        </router-link>

        <router-link
          to="/admin-certificates"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminCertificates'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">🎓 Certificates</span>
        </router-link>

        <router-link
          to="/admin-mockexam"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminMockExam'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">🧠 Mock Exam Management</span>
        </router-link>

        <!-- User Management -->
        <router-link
          to="/admin-users"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminUsers'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">👥 User Management</span>
        </router-link>

        <router-link
          to="/admin-messages"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminMessages'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
          @click="isMobileMenuOpen = false"
        >
          <span class="ml-2">💬 Messages</span>
        </router-link>

        <router-link
          to="/admin-settings"
          :class="[
            'flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base',
            $route.name === 'AdminSettings'
              ? 'bg-green-100 text-green-700 font-medium'
              : 'hover:bg-gray-200'
          ]"
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
            <p class="text-xs sm:text-sm font-semibold truncate">{{ user.fullname || 'Admin' }}</p>
            <p class="text-xs truncate">{{ user.email || 'admin@gmail.com' }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import { useRouter } from 'vue-router'
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export default {
  name: 'AdminSidebar',
  setup() {
    const router = useRouter()
    return { router }
  },
  data() {
    return {
      user: {
        fullname: '',
        username: '',
        email: ''
      },
      isMobileMenuOpen: false
    }
  },
  computed: {
    userInitial() {
      if (this.user.fullname) return this.user.fullname.charAt(0).toUpperCase()
      return 'A'
    }
  },
  methods: {
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen
    },

    async fetchUserData() {
      try {
        const response = await api.get("/settings/profile");
        if (response.data?.status === "success" && response.data?.profile) {
          this.user = {
            fullname: response.data.profile.fullname || '',
            username: response.data.profile.username || '',
            email: response.data.profile.email || ''
          };
        }
      } catch (err) {
        console.error("Fetch user data error:", err);
        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          this.router.push("/login");
        }
      }
    },

    handleUserUpdate(event) {
      this.user = event.detail;
    },

    async logout() {
      try {
        const response = await fetch('/api/auth/logout', { 
          credentials: 'include' 
        });
        const data = await response.json();

        if (data.status === 'success') {
          this.router.push('/login');
        }
      } catch (error) {
        console.error('Logout error:', error);
        this.router.push('/login');
      }
    },

    handleResize() {
      if (window.innerWidth >= 1024) {
        this.isMobileMenuOpen = false;
      }
    }
  },
  async mounted() {
    await this.fetchUserData();
    window.addEventListener('user-updated', this.handleUserUpdate);
    window.addEventListener('resize', this.handleResize);
    
    // Close mobile menu when route changes
    this.$router.afterEach(() => {
      this.isMobileMenuOpen = false;
    });
  },
  beforeUnmount() {
    window.removeEventListener('user-updated', this.handleUserUpdate);
    window.removeEventListener('resize', this.handleResize);
  }
}
</script>

<style scoped>
aside {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 transparent;
}
aside::-webkit-scrollbar {
  width: 6px;
}
aside::-webkit-scrollbar-track {
  background: transparent;
}
aside::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}

/* Router link active styles */
.router-link-exact-active {
  background-color: #d1fae5;
  color: #047857;
  font-weight: 500;
}

.router-link-active:hover:not(.router-link-exact-active) {
  background-color: #f3f4f6;
}

/* Mobile menu button animation */
.fixed.top-4.left-4 {
  transition: all 0.3s ease;
}

/* Prevent body scroll when mobile menu is open */
:global(body.menu-open) {
  overflow: hidden;
}

/* Responsive text truncation */
.truncate {
  max-width: 120px;
}

@media (max-width: 640px) {
  .truncate {
    max-width: 80px;
  }
}
</style>