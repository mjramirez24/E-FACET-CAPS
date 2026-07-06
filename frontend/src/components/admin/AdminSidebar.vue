<template>
  <!-- Wrap everything in a single div to avoid fragment warning -->
  <div>
    <!-- Mobile Menu Button (visible only on mobile) -->
    <button
      @click="toggleMobileMenu"
      class="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
      aria-label="Toggle menu"
    >
      <svg
        v-if="!isMobileMenuOpen"
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>

      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
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
        'w-64 bg-white shadow-md flex flex-col justify-between rounded-r-2xl fixed top-0 left-0 h-[100dvh] overflow-y-auto transition-transform duration-300 z-50',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <div class="flex-1 overflow-y-auto">
        <!-- Logo -->
        <div class="flex items-center gap-2 p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div class="logo-icon-wrapper">
            <img
              src="/facet-logo.png"
              alt="FACET Logo"
              class="w-8 h-8 sm:w-10 sm:h-10 object-contain"
            />
          </div>
          <h1 class="font-bold text-green-900 text-base sm:text-lg">
            E-FACET Admin
          </h1>
        </div>

        <!-- Navigation -->
        <nav class="mt-4 space-y-1">
          <router-link
            to="/admin-dashboard"
            :class="navClass('AdminDashboard')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
            <span>Dashboard</span>
          </router-link>

          <router-link
            to="/admin-students"
            :class="navClass('AdminStudents')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <span>Students</span>
          </router-link>

          <router-link
            to="/admin-reservations"
            :class="navClass('AdminReservations')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </span>
            <span>Manage Reservations</span>
          </router-link>

          <router-link
            to="/admin-courses"
            :class="navClass('AdminCourses')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span>Manage Courses</span>
          </router-link>

          <router-link
            to="/admin-instructors"
            :class="navClass('AdminInstructors')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <span>Manage Instructors</span>
          </router-link>

          <router-link
            to="/admin-schedule"
            :class="navClass('AdminSchedule')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            <span>Schedule Management</span>
          </router-link>

          <router-link
            to="/admin-reports"
            :class="navClass('AdminReports')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <span>Analytics & Reports</span>
          </router-link>

          <router-link
            to="/admin-certificates"
            :class="navClass('AdminCertificates')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
            <span>Certificates</span>
          </router-link>

          <router-link
            to="/admin-mockexam"
            :class="navClass('AdminMockExam')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            <span>Mock Exam Management</span>
          </router-link>

          <router-link
            to="/admin-users"
            :class="navClass('AdminUsers')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <span>User Management</span>
          </router-link>

          <router-link
            to="/admin-messages"
            :class="navClass('AdminMessages')"
            @click="closeMobileMenu"
          >
            <span class="nav-icon-wrapper">
              <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
            <span>Messages</span>
          </router-link>

          <router-link
            to="/admin-settings"
            :class="navClass('AdminSettings')"
            @click="closeMobileMenu"
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
      <div class="shrink-0 bg-white">
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

        <!-- User Info -->
        <div class="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white p-4 flex items-center rounded-br-2xl">
          <div class="flex items-center gap-3 w-full">
            <div class="w-10 h-10 bg-white/20 backdrop-blur-sm text-white flex items-center justify-center rounded-xl text-base font-bold border-2 border-white/30 flex-shrink-0 shadow-inner">
              {{ userInitial }}
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold truncate leading-tight">
                {{ user.fullname || "Admin" }}
              </p>
              <p class="text-xs truncate opacity-80 mt-0.5">
                {{ user.email || "admin@gmail.com" }}
              </p>
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
                  <p class="text-sm text-gray-500">You'll be redirected to login</p>
                </div>
              </div>
            </div>

            <div class="p-5">
              <p class="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to sign out from your admin account? Any unsaved changes will be lost.
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
import { useRouter } from "vue-router";
import axios from "axios";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "AdminSidebar",

  // Add inheritAttrs: false to prevent warning
  inheritAttrs: false,

  // Accept the active-page prop
  props: {
    activePage: {
      type: String,
      default: "",
    },
  },

  setup() {
    const router = useRouter();
    return { router };
  },

  data() {
    return {
      user: {
        fullname: "",
        username: "",
        email: "",
      },
      isMobileMenuOpen: false,
      showLogoutModal: false,
      logoutLoading: false,
      logoutError: "",
      removeRouteHook: null,
    };
  },

  computed: {
    userInitial() {
      if (this.user.fullname) return this.user.fullname.charAt(0).toUpperCase();
      if (this.user.username) return this.user.username.charAt(0).toUpperCase();
      return "A";
    },
  },

  methods: {
    navClass(routeName) {
      const isActive = this.$route?.name === routeName;
      return [
        "flex items-center gap-2 px-5 py-2 rounded-r-full text-sm sm:text-base transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 font-medium shadow-sm"
          : "text-gray-600 hover:bg-gray-50",
      ];
    },

    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
      if (this.isMobileMenuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    },

    closeMobileMenu() {
      this.isMobileMenuOpen = false;
      document.body.style.overflow = "";
    },

    async fetchUserData() {
      try {
        const response = await api.get("/settings/profile");

        if (response.data?.status === "success" && response.data?.profile) {
          this.user = {
            fullname: response.data.profile.fullname || "",
            username: response.data.profile.username || "",
            email: response.data.profile.email || "",
          };
        }
      } catch (err) {
        console.error("Fetch user data error:", err);

        if (err.response?.status === 401) {
          this.router.push("/login");
        }
      }
    },

    handleUserUpdate(event) {
      if (event.detail) {
        this.user = {
          fullname: event.detail.fullname || "",
          username: event.detail.username || "",
          email: event.detail.email || "",
        };
      }
    },

    openLogoutModal() {
      this.logoutError = "";
      this.showLogoutModal = true;
      this.closeMobileMenu();
    },

    closeLogoutModal() {
      if (this.logoutLoading) return;
      this.showLogoutModal = false;
      this.logoutError = "";
    },

    async confirmLogout() {
      this.logoutLoading = true;
      this.logoutError = "";

      try {
        await api.get("/auth/logout");
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        this.logoutLoading = false;
        this.showLogoutModal = false;
        this.router.push("/login");
      }
    },

    handleResize() {
      if (window.innerWidth >= 1024) {
        this.isMobileMenuOpen = false;
        document.body.style.overflow = "";
      }
    },
  },

  async mounted() {
    await this.fetchUserData();

    window.addEventListener("user-updated", this.handleUserUpdate);
    window.addEventListener("resize", this.handleResize);

    this.removeRouteHook = this.$router.afterEach(() => {
      this.isMobileMenuOpen = false;
      document.body.style.overflow = "";
    });
  },

  beforeUnmount() {
    window.removeEventListener("user-updated", this.handleUserUpdate);
    window.removeEventListener("resize", this.handleResize);

    if (typeof this.removeRouteHook === "function") {
      this.removeRouteHook();
    }
  },
};
</script>

<style scoped>
/* Custom scrollbar */
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

/* Mobile menu button */
.fixed.top-4.left-4 {
  transition: all 0.3s ease;
}

/* Truncate text */
.truncate {
  max-width: 120px;
}

@media (max-width: 640px) {
  .truncate {
    max-width: 80px;
  }
}
</style>