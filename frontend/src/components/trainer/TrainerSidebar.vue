<template>
  <!-- Mobile Menu Button -->
  <button
    @click="toggleMobileMenu"
    class="lg:hidden fixed top-4 left-4 z-50 bg-blue-800 text-white p-2 rounded-lg shadow-lg"
    aria-label="Toggle menu"
  >
    <svg
      v-if="!localMobileMenuOpen"
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>

    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>

  <!-- Mobile Overlay -->
  <div
    v-if="localMobileMenuOpen"
    @click="closeMobileMenu"
    class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
  ></div>

  <!-- Sidebar -->
  <aside
    :class="[
      'w-64 bg-white shadow-md flex flex-col justify-between rounded-r-2xl fixed top-0 left-0 h-[100dvh] overflow-hidden transition-transform duration-300 z-50',
      localMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
  >
    <div class="flex-1 overflow-y-auto">
      <!-- Logo -->
      <div class="flex items-center gap-2 p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <img
          src="/facet-logo.png"
          alt="FACET Logo"
          class="w-8 h-8 sm:w-10 sm:h-10"
        />
        <h1 class="font-bold text-blue-900 text-base sm:text-lg">E-FACET Trainer</h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 space-y-1">
        <router-link
          to="/trainer-dashboard"
          :class="navClass('TrainerDashboard')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">📊 Dashboard</span>
        </router-link>

        <router-link
          to="/trainer-courses"
          :class="navClass('TrainerCourses')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">📚 My Courses</span>
        </router-link>

        <router-link
          to="/trainer-students"
          :class="navClass('TrainerStudents')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">👨‍🎓 My Students</span>
        </router-link>

        <router-link
          to="/trainer-attendance"
          :class="navClass('TrainerAttendance')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">✅ Attendance</span>
        </router-link>

        <router-link
          to="/trainer-certificates"
          :class="navClass('TrainerCertificates')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">🎓 Certificates</span>
        </router-link>

        <router-link
          to="/trainer-messages"
          :class="navClass('TrainerMessages')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">💬 Messages</span>
        </router-link>

        <router-link
          to="/trainer-settings"
          :class="navClass('TrainerSettings')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">⚙️ Settings</span>
        </router-link>
      </nav>
    </div>

    <!-- Bottom User Info + Logout -->
    <div class="shrink-0 bg-white">
      <div class="border-t border-gray-200 p-4">
        <button
          @click="openLogoutModal"
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
            <p class="text-xs sm:text-sm font-semibold truncate">
              {{ user.fullname || "Trainer" }}
            </p>
            <p class="text-xs truncate opacity-80">
              {{ user.email || "" }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Logout Confirmation Modal -->
  <div
    v-if="showLogoutModal"
    class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
    @click.self="closeLogoutModal"
  >
    <div class="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">
            🚪
          </div>

          <div>
            <h3 class="text-lg font-bold text-gray-900">Confirm Logout</h3>
            <p class="text-sm text-gray-500">Trainer account session</p>
          </div>
        </div>
      </div>

      <div class="p-5">
        <p class="text-sm text-gray-700 leading-relaxed">
          Are you sure you want to log out from your trainer account?
        </p>

        <div
          v-if="logoutError"
          class="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {{ logoutError }}
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            @click="closeLogoutModal"
            :disabled="logoutLoading"
            class="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            @click="confirmLogout"
            :disabled="logoutLoading"
            class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-60 flex items-center gap-2"
          >
            <span
              v-if="logoutLoading"
              class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></span>
            <span>{{ logoutLoading ? "Logging out..." : "Logout" }}</span>
          </button>
        </div>
      </div>
    </div>
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
  name: "TrainerSidebar",

  props: {
    activePage: { type: String, default: "" },
    isMobileMenuOpen: { type: Boolean, default: false },
  },

  emits: ["close-mobile-menu"],

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
      localMobileMenuOpen: false,
      showLogoutModal: false,
      logoutLoading: false,
      logoutError: "",
    };
  },

  computed: {
    userInitial() {
      return this.user.fullname
        ? this.user.fullname.charAt(0).toUpperCase()
        : "T";
    },
  },

  watch: {
    isMobileMenuOpen: {
      immediate: true,
      handler(value) {
        this.localMobileMenuOpen = value;
      },
    },
  },

  methods: {
    navClass(routeName) {
      return [
        "flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base",
        this.$route?.name === routeName
          ? "bg-blue-100 text-blue-700 font-medium"
          : "hover:bg-gray-200",
      ];
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
        console.error("fetchUserData:", err);

        if (err.response?.status === 401) {
          this.router.push("/login");
        }
      }
    },

    handleUserUpdate(e) {
      if (e.detail) Object.assign(this.user, e.detail);
    },

    toggleMobileMenu() {
      this.localMobileMenuOpen = !this.localMobileMenuOpen;

      if (!this.localMobileMenuOpen) {
        this.$emit("close-mobile-menu");
      }
    },

    closeMobileMenu() {
      this.localMobileMenuOpen = false;
      this.$emit("close-mobile-menu");
    },

    handleResize() {
      if (window.innerWidth >= 1024) {
        this.closeMobileMenu();
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
      } catch (err) {
        console.error("logout error:", err);
      } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");

        this.logoutLoading = false;
        this.showLogoutModal = false;
        this.router.push("/login");
      }
    },
  },

  async mounted() {
    await this.fetchUserData();
    window.addEventListener("user-updated", this.handleUserUpdate);
    window.addEventListener("resize", this.handleResize);
  },

  beforeUnmount() {
    window.removeEventListener("user-updated", this.handleUserUpdate);
    window.removeEventListener("resize", this.handleResize);
  },
};
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

.router-link-exact-active {
  background-color: #dbeafe;
  color: #1d4ed8;
  font-weight: 500;
}

.router-link-active:hover:not(.router-link-exact-active) {
  background-color: #f3f4f6;
}

.truncate {
  max-width: 120px;
}

@media (max-width: 640px) {
  .truncate {
    max-width: 80px;
  }
}
</style>
