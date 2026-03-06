<template>
  <StudentLayoutTesda active-page="dashboard">
    <template #header-left>
      <div class="flex items-center gap-3 w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search recent activity..."
          class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          @click="fetchDashboard"
          class="px-4 py-2 rounded-md text-sm font-semibold shadow-sm border bg-blue-700 text-white border-blue-700 hover:bg-blue-800"
          title="Refresh dashboard"
        >
          ↻ Refresh
        </button>
      </div>
    </template>

    <template #header-right>
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 bg-white text-blue-800 rounded-full flex items-center justify-center text-xl font-bold">
          {{ userInitial }}
        </div>
      </div>
    </template>

    <div>
      <h2 class="text-lg font-bold text-blue-800 mb-2">📊 TESDA Student Dashboard</h2>
      <p class="text-sm text-gray-500 mb-6">
        Welcome, <span class="font-semibold">{{ studentName }}</span>
      </p>

      <!-- Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-blue-100 p-4 rounded-lg border border-blue-200">
          <p class="text-sm text-gray-600">My Reservations</p>
          <h3 class="text-2xl font-bold text-blue-800">{{ stats.total }}</h3>
          <p class="text-xs text-gray-500 mt-1">Pending: {{ stats.pending }}</p>
        </div>

        <div class="bg-green-100 p-4 rounded-lg border border-green-200">
          <p class="text-sm text-gray-600">Enrolled / Active</p>
          <h3 class="text-2xl font-bold text-green-800">{{ stats.enrolled }}</h3>
          <p class="text-xs text-gray-500 mt-1">Upcoming: {{ upcomingCount }}</p>
        </div>

        <div class="bg-purple-100 p-4 rounded-lg border border-purple-200">
          <p class="text-sm text-gray-600">Certificates Issued</p>
          <h3 class="text-2xl font-bold text-purple-800">{{ certificates.issued }}</h3>
          <p class="text-xs text-gray-500 mt-1">TESDA track</p>
        </div>

        <div class="bg-gray-100 p-4 rounded-lg border border-gray-200">
          <p class="text-sm text-gray-600">Completed</p>
          <h3 class="text-2xl font-bold text-gray-800">{{ stats.done }}</h3>
          <p class="text-xs text-gray-500 mt-1">Cancelled: {{ stats.cancelled }}</p>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button class="bg-white p-4 rounded-lg border hover:bg-gray-50 text-left" @click="go('/tesda/schedule')">
          <p class="text-sm text-gray-500">Quick Link</p>
          <p class="font-semibold text-gray-800">📅 My Schedule</p>
        </button>

        <button class="bg-white p-4 rounded-lg border hover:bg-gray-50 text-left" @click="go('/tesda/my-reservations')">
          <p class="text-sm text-gray-500">Quick Link</p>
          <p class="font-semibold text-gray-800">🧾 My Reservations</p>
        </button>

        <button class="bg-white p-4 rounded-lg border hover:bg-gray-50 text-left" @click="go('/tesda/requirements')">
          <p class="text-sm text-gray-500">Quick Link</p>
          <p class="font-semibold text-gray-800">📎 Requirements</p>
        </button>

        <button class="bg-white p-4 rounded-lg border hover:bg-gray-50 text-left" @click="go('/settings/profile')">
          <p class="text-sm text-gray-500">Quick Link</p>
          <p class="font-semibold text-gray-800">👤 Profile</p>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Top Courses -->
        <div class="bg-white p-6 rounded-xl shadow border">
          <h3 class="font-bold text-gray-800 mb-4">🏆 Top Trainings this month</h3>
          <div v-if="topCourses.length === 0" class="text-sm text-gray-500">No data yet.</div>
          <ul v-else class="space-y-3">
            <li v-for="c in topCourses" :key="c.course_id" class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">{{ c.course_name }}</span>
              <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {{ c.reservations }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Upcoming Count -->
        <div class="bg-white p-6 rounded-xl shadow border">
          <h3 class="font-bold text-gray-800 mb-2">⏳ Upcoming sessions</h3>
          <p class="text-4xl font-extrabold text-blue-800">{{ upcomingCount }}</p>
          <p class="text-sm text-gray-500 mt-2">Based on your enrolled reservations.</p>
        </div>

        <!-- Status Summary -->
        <div class="bg-white p-6 rounded-xl shadow border">
          <h3 class="font-bold text-gray-800 mb-2">📌 Status Summary</h3>
          <div class="text-sm text-gray-600">
            <p>Pending: <span class="font-semibold">{{ stats.pending }}</span></p>
            <p class="mt-2">Enrolled: <span class="font-semibold">{{ stats.enrolled }}</span></p>
          </div>
        </div>
      </div>

      <!-- Upcoming Table -->
      <div class="bg-white p-6 rounded-xl shadow border mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-800">📅 Upcoming Sessions</h3>
          <button class="text-blue-700 hover:text-blue-800 text-sm font-semibold" @click="go('/tesda/schedule')">
            View All →
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead class="bg-blue-800 text-white">
              <tr>
                <th class="py-3 px-4 text-left font-medium">Course</th>
                <th class="py-3 px-4 text-left font-medium">Trainer</th>
                <th class="py-3 px-4 text-left font-medium">Date</th>
                <th class="py-3 px-4 text-left font-medium">Time</th>
                <th class="py-3 px-4 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="upcoming.length === 0" class="border-b">
                <td class="py-3 px-4 text-gray-500" colspan="5">No upcoming sessions.</td>
              </tr>

              <tr v-for="u in upcoming" :key="u.id" class="border-b hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">{{ u.course_name || '-' }}</td>
                <td class="py-3 px-4">{{ u.trainer_name || '-' }}</td>
                <td class="py-3 px-4">{{ fmtDate(u.schedule_date) }}</td>
                <td class="py-3 px-4">{{ fmtTime(u.start_time, u.end_time) }}</td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                    {{ u.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Activity + Pagination -->
      <div class="bg-white p-6 rounded-xl shadow border">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-800">🕒 Recent Activity</h3>
          <div class="text-sm text-gray-500">
            Showing {{ paginatedRecent.length }} of {{ filteredRecent.length }}
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead class="bg-gray-800 text-white">
              <tr>
                <th class="py-3 px-4 text-left font-medium">Course</th>
                <th class="py-3 px-4 text-left font-medium">Status</th>
                <th class="py-3 px-4 text-left font-medium">Schedule</th>
                <th class="py-3 px-4 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedRecent.length === 0" class="border-b">
                <td class="py-3 px-4 text-gray-500" colspan="4">No activity found.</td>
              </tr>

              <tr v-for="r in paginatedRecent" :key="r.id" class="border-b hover:bg-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">{{ r.course_name || '-' }}</td>
                <td class="py-3 px-4">
                  <span :class="statusPill(r.status)">
                    {{ r.status }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <div>{{ fmtDate(r.schedule_date) }}</div>
                  <div class="text-xs text-gray-500">{{ fmtTime(r.start_time, r.end_time) }}</div>
                </td>
                <td class="py-3 px-4">{{ fmtDateTime(r.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between mt-4">
          <div class="text-sm text-gray-600">
            Page {{ page }} / {{ totalPages }}
          </div>

          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              :disabled="page <= 1"
              @click="page--"
            >
              Prev
            </button>

            <button
              v-for="p in pagesToShow"
              :key="p"
              class="px-3 py-1 border rounded"
              :class="p === page ? 'bg-blue-700 text-white border-blue-700' : 'hover:bg-gray-50'"
              @click="page = p"
            >
              {{ p }}
            </button>

            <button
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              :disabled="page >= totalPages"
              @click="page++"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </StudentLayoutTesda>
</template>

<script>
import axios from "axios";
import StudentLayoutTesda from "./StudentLayoutTesda.vue";

export default {
  name: "TesdaStudentDashboard",
  components: { StudentLayoutTesda },
  data() {
    return {
      searchQuery: "",
      page: 1,
      pageSize: 8,

      studentName: "Student",
      userInitial: "S",

      stats: { total: 0, pending: 0, enrolled: 0, done: 0, cancelled: 0 },
      upcoming: [],
      topCourses: [],
      certificates: { issued: 0 },
      recent: [],
    };
  },
  computed: {
    upcomingCount() {
      return this.upcoming.length;
    },
    filteredRecent() {
      const q = (this.searchQuery || "").trim().toLowerCase();
      if (!q) return this.recent;

      return this.recent.filter((r) => {
        return (
          String(r.course_name || "").toLowerCase().includes(q) ||
          String(r.status || "").toLowerCase().includes(q)
        );
      });
    },
    totalPages() {
      const n = Math.ceil(this.filteredRecent.length / this.pageSize);
      return n <= 0 ? 1 : n;
    },
    paginatedRecent() {
      const start = (this.page - 1) * this.pageSize;
      return this.filteredRecent.slice(start, start + this.pageSize);
    },
    pagesToShow() {
      const total = this.totalPages;
      const cur = this.page;
      const out = [];
      const a = Math.max(1, cur - 2);
      const b = Math.min(total, cur + 2);
      for (let i = a; i <= b; i++) out.push(i);
      return out;
    },
  },
  watch: {
    searchQuery() {
      this.page = 1;
    },
    totalPages() {
      if (this.page > this.totalPages) this.page = this.totalPages;
    },
  },
  mounted() {
    this.loadLocalUser();
    this.fetchDashboard();
  },
  methods: {
    async fetchDashboard() {
      try {
        const res = await axios.get("/api/tesda/dashboard/summary", { withCredentials: true });
        if (res.data?.status !== "success") return;

        const d = res.data.data || {};
        const u = d.user || null;

        this.studentName = u?.fullname || u?.username || this.studentName;
        this.userInitial = (this.studentName || "S").charAt(0).toUpperCase();

        this.stats = d.stats || this.stats;
        this.upcoming = d.upcoming || [];
        this.topCourses = d.topCourses || [];
        this.certificates = d.certificates || this.certificates;
        this.recent = d.recent || [];
      } catch (e) {
        console.error("fetchTesdaDashboard error:", e);
      }
    },
    loadLocalUser() {
      const userData = localStorage.getItem("user");
      if (!userData) return;
      try {
        const u = JSON.parse(userData);
        this.studentName = u.fullname || u.name || u.username || this.studentName;
        this.userInitial = (this.studentName || "S").charAt(0).toUpperCase();
      } catch (e) {}
    },
    go(path) {
      if (this.$router) this.$router.push(path);
    },
    fmtDate(d) {
      if (!d) return "-";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
    },
    fmtDateTime(d) {
      if (!d) return "-";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleString("en-US", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    },
    fmtTime(start, end) {
      if (!start || !end) return "-";
      return `${String(start).slice(0,5)} - ${String(end).slice(0,5)}`;
    },
    statusPill(st) {
      const s = String(st || "").toUpperCase();
      if (s === "PENDING") return "px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800";
      if (s === "CANCELLED") return "px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800";
      if (s === "DONE") return "px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800";
      return "px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800";
    },
  },
};
</script>