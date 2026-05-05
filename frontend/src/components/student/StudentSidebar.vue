<template>
  <!-- Sidebar -->
  <aside
    :class="[
      'w-64 bg-white shadow-md flex flex-col justify-between rounded-r-2xl fixed top-0 left-0 h-[100dvh] overflow-hidden transition-transform duration-300 z-50',
      isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
        <h1 class="font-bold text-green-900 text-base sm:text-lg">
          E-FACET Student
        </h1>
      </div>

      <!-- Navigation -->
      <nav class="mt-4 space-y-1">
        <router-link
          to="/student-dashboard"
          :class="navClass('StudentDashboard')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">📊 Dashboard</span>
        </router-link>

        <router-link
          to="/student-enroll"
          :class="navClass('StudentEnroll')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">📝 Enrollment</span>
        </router-link>

        <router-link
          to="/student-schedule"
          :class="navClass('StudentSchedule')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">🗓️ Schedule</span>
        </router-link>

        <router-link
          to="/student-quiz"
          :class="navClass('StudentQuiz')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">🧠 Mock Exam</span>
        </router-link>

        <router-link
          to="/student-certificate"
          :class="navClass('StudentCertificate')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">🎓 Certificate</span>
        </router-link>

        <router-link
          to="/student-messages"
          :class="navClass('StudentMessages')"
          @click="closeMobileMenu"
        >
          <span class="ml-2">💬 Messages</span>
        </router-link>

        <router-link
          to="/student-settings"
          :class="navClass('StudentSettings')"
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

      <div class="bg-green-800 text-white p-3 sm:p-4 flex items-center rounded-br-2xl">
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white text-green-800 flex items-center justify-center rounded-full text-base sm:text-lg font-bold">
            {{ userInitial }}
          </div>

          <div class="min-w-0">
            <p class="text-xs sm:text-sm font-semibold truncate">
              {{ user.fullname || user.username || "Student" }}
            </p>
            <p class="text-xs truncate opacity-90">
              {{ user.email || "student@gmail.com" }}
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
            <p class="text-sm text-gray-500">Student account session</p>
          </div>
        </div>
      </div>

      <div class="p-5">
        <p class="text-sm text-gray-700 leading-relaxed">
          Are you sure you want to log out from your student account?
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
  name: "StudentSidebar",

  props: {
    activePage: {
      type: String,
      default: "",
    },
    isMobileMenuOpen: {
      type: Boolean,
      default: false,
    },
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
      showLogoutModal: false,
      logoutLoading: false,
      logoutError: "",
    };
  },

  computed: {
    userInitial() {
      if (this.user.fullname) {
        return this.user.fullname.charAt(0).toUpperCase();
      }

      if (this.user.username) {
        return this.user.username.charAt(0).toUpperCase();
      }

      return "S";
    },
  },

  methods: {
    navClass(routeName) {
      return [
        "flex items-center px-5 py-2 rounded-r-full text-sm sm:text-base",
        this.$route?.name === routeName
          ? "bg-green-100 text-green-700 font-medium"
          : "hover:bg-gray-200",
      ];
    },

    closeMobileMenu() {
      this.$emit("close-mobile-menu");
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
  },

  async mounted() {
    await this.fetchUserData();
    window.addEventListener("user-updated", this.handleUserUpdate);
  },

  beforeUnmount() {
    window.removeEventListener("user-updated", this.handleUserUpdate);
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
  background-color: #d1fae5;
  color: #047857;
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
