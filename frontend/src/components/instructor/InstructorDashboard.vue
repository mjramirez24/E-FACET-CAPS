<template>
  <InstructorLayout active-page="dashboard">
    <template #header-left>
      <div class="flex items-center gap-3 w-full">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search recent activity..."
          class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
        />
        <button
          @click="fetchDashboard"
          class="px-4 py-2 rounded-md text-sm font-semibold shadow-sm border bg-green-700 text-white border-green-700 hover:bg-green-800"
          title="Refresh dashboard"
        >
          ↻ Refresh
        </button>
      </div>
    </template>

    <div>
      <div class="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 class="text-lg font-bold text-green-800">📊 Instructor Dashboard</h2>
          <p class="text-xs text-gray-500 mt-1">Real-time totals from Driving schedules/reservations</p>
        </div>
        <div v-if="loading" class="text-xs text-gray-500 mt-1">Loading…</div>
        <div v-else-if="error" class="text-xs text-red-600 mt-1">{{ error }}</div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-green-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-green-800">{{ stats.assignedCourses }}</h3>
              <p class="text-green-700 font-medium mt-1">Assigned Courses</p>
              <p class="text-xs text-green-700 mt-1">Driving courses with schedules</p>
            </div>
            <div class="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-blue-800">{{ stats.studentsHandled }}</h3>
              <p class="text-blue-700 font-medium mt-1">Students Handled</p>
              <p class="text-xs text-blue-700 mt-1">Distinct enrolled students</p>
            </div>
            <div class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div class="bg-yellow-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-yellow-800">{{ stats.pendingReservations }}</h3>
              <p class="text-yellow-700 font-medium mt-1">Pending Reservations</p>
              <p class="text-xs text-yellow-700 mt-1">Waiting for approval</p>
            </div>
            <div class="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div class="bg-purple-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-purple-800">{{ stats.upcomingSchedules }}</h3>
              <p class="text-purple-700 font-medium mt-1">Upcoming Schedules</p>
              <p class="text-xs text-purple-700 mt-1">From today onward</p>
            </div>
            <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">📅</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <button
          @click="$router.push('/instructor-classes')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-green-800">📚 My Classes</div>
          <div class="text-xs text-gray-500 mt-1">View schedules you handle</div>
        </button>

        <button
          @click="$router.push('/instructor-students')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-green-800">👨‍🎓 Students</div>
          <div class="text-xs text-gray-500 mt-1">See your students list</div>
        </button>

        <button
          @click="$router.push('/instructor-certificates')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-green-800">🏆 Certificates</div>
          <div class="text-xs text-gray-500 mt-1">Issue / view certificates</div>
        </button>
      </div>

      <!-- Top Courses this Month -->
      <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-md font-semibold text-green-800">🔥 Top Courses This Month</h3>
          <span class="text-xs text-gray-500">based on reservations</span>
        </div>

        <div v-if="topCourses.length === 0" class="text-sm text-gray-500">
          No data yet.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div
            v-for="c in topCourses"
            :key="c.course_id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="text-sm font-semibold text-gray-800 truncate" :title="c.course_name">
              {{ c.course_name }}
            </div>
            <div class="text-2xl font-bold text-green-800 mt-2">
              {{ c.reservations }}
            </div>
            <div class="text-xs text-gray-500">reservations</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-green-800 font-semibold mb-4">Monthly Enrollments (last 12 months)</h3>
          <div class="h-64">
            <canvas ref="barChartCanvas"></canvas>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-green-800 font-semibold mb-4">Reservation Status (your schedules)</h3>
          <div class="h-64">
            <canvas ref="pieChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Upcoming Schedules Table (with Pagination) -->
      <div class="overflow-x-auto mb-10">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-md font-semibold text-green-800">Upcoming Schedules</h3>
          <button
            @click="$router.push('/instructor-classes')"
            class="text-green-700 hover:text-green-800 font-medium text-sm"
          >
            View All →</button
          >
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-green-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Date</th>
              <th class="py-3 px-4 text-left font-medium">Time</th>
              <th class="py-3 px-4 text-left font-medium">Slots</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in paginatedUpcoming"
              :key="row.schedule_id"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">{{ row.course_name || "—" }}</td>
              <td class="py-3 px-4">{{ row.schedule_date ? formatDate(row.schedule_date) : "—" }}</td>
              <td class="py-3 px-4">
                <span v-if="row.start_time && row.end_time">{{ row.start_time }} - {{ row.end_time }}</span>
                <span v-else>—</span>
              </td>
              <td class="py-3 px-4">
                {{ Number(row.reserved_count || 0) }} / {{ Number(row.total_slots || 0) }}
              </td>
              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {{ (row.status || "open").toString().toUpperCase() }}
                </span>
              </td>
            </tr>

            <tr v-if="!loading && filteredUpcoming.length === 0">
              <td colspan="5" class="py-6 px-4 text-center text-gray-500">No upcoming schedules.</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="filteredUpcoming.length > 0" class="mt-4 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Page {{ page }} of {{ totalPages }} • {{ filteredUpcoming.length }} items
          </div>

          <div class="flex gap-1">
            <button
              @click="page = Math.max(1, page - 1)"
              :disabled="page === 1"
              class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <button class="px-3 py-1 bg-green-700 text-white rounded text-sm">
              {{ page }}
            </button>

            <button
              @click="page = Math.min(totalPages, page + 1)"
              :disabled="page === totalPages"
              class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Activity (optional quick view) -->
      <div class="overflow-x-auto mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-md font-semibold text-green-800">Recent Reservations</h3>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-green-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Student</th>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Schedule</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in paginatedRecent"
              :key="r.id"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">{{ r.student_name || "—" }}</td>
              <td class="py-3 px-4">{{ r.course_name || "—" }}</td>
              <td class="py-3 px-4">
                <div class="text-xs text-gray-700">
                  <div>{{ r.schedule_date ? formatDate(r.schedule_date) : "—" }}</div>
                  <div class="text-gray-500" v-if="r.start_time && r.end_time">
                    {{ r.start_time }} - {{ r.end_time }}
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <span :class="statusPill(r.status)">{{ r.status || "—" }}</span>
              </td>
              <td class="py-3 px-4">{{ r.created_at ? formatDateTime(r.created_at) : "—" }}</td>
            </tr>

            <tr v-if="!loading && filteredRecent.length === 0">
              <td colspan="5" class="py-6 px-4 text-center text-gray-500">No recent reservations.</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination (recent) -->
        <div v-if="filteredRecent.length > 0" class="mt-4 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Page {{ recentPage }} of {{ recentTotalPages }} • {{ filteredRecent.length }} items
          </div>

          <div class="flex gap-1">
            <button
              @click="recentPage = Math.max(1, recentPage - 1)"
              :disabled="recentPage === 1"
              class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <button class="px-3 py-1 bg-green-700 text-white rounded text-sm">
              {{ recentPage }}
            </button>

            <button
              @click="recentPage = Math.min(recentTotalPages, recentPage + 1)"
              :disabled="recentPage === recentTotalPages"
              class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  </InstructorLayout>
</template>

<script>
import InstructorLayout from "./InstructorLayout.vue";
import Chart from "chart.js/auto";

export default {
  name: "InstructorDashboard",
  components: { InstructorLayout },
  data() {
    return {
      searchQuery: "",
      loading: false,
      error: "",

      stats: {
        assignedCourses: 0,
        studentsHandled: 0,
        pendingReservations: 0,
        upcomingSchedules: 0,
      },

      topCourses: [],
      upcoming: [],
      recent: [],

      trends: { labels: [], series: [] },
      buckets: { ENROLLED: 0, PENDING: 0, REJECTED: 0, CANCELLED: 0, OTHER: 0 },

      page: 1,
      perPage: 10,

      recentPage: 1,
      recentPerPage: 10,

      barChart: null,
      pieChart: null,
    };
  },
  computed: {
    filteredUpcoming() {
      if (!this.searchQuery) return this.upcoming;
      const q = this.searchQuery.toLowerCase();
      return this.upcoming.filter((r) => {
        return (
          String(r.course_name || "").toLowerCase().includes(q) ||
          String(r.schedule_date || "").toLowerCase().includes(q) ||
          String(r.status || "").toLowerCase().includes(q)
        );
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredUpcoming.length / this.perPage));
    },
    paginatedUpcoming() {
      const start = (this.page - 1) * this.perPage;
      return this.filteredUpcoming.slice(start, start + this.perPage);
    },

    filteredRecent() {
      if (!this.searchQuery) return this.recent;
      const q = this.searchQuery.toLowerCase();
      return this.recent.filter((r) => {
        return (
          String(r.student_name || "").toLowerCase().includes(q) ||
          String(r.course_name || "").toLowerCase().includes(q) ||
          String(r.status || "").toLowerCase().includes(q)
        );
      });
    },
    recentTotalPages() {
      return Math.max(1, Math.ceil(this.filteredRecent.length / this.recentPerPage));
    },
    paginatedRecent() {
      const start = (this.recentPage - 1) * this.recentPerPage;
      return this.filteredRecent.slice(start, start + this.recentPerPage);
    },
  },
  watch: {
    searchQuery() {
      this.page = 1;
      this.recentPage = 1;
    },
    totalPages() {
      if (this.page > this.totalPages) this.page = this.totalPages;
    },
    recentTotalPages() {
      if (this.recentPage > this.recentTotalPages) this.recentPage = this.recentTotalPages;
    },
  },
  mounted() {
    this.checkAuth();
    this.fetchDashboard();
  },
  beforeUnmount() {
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
  },
  methods: {
    async checkAuth() {
      try {
        const response = await fetch("/api/auth/check", { credentials: "include" });
        const data = await response.json();
        if (data.status !== "success" || !data.authenticated) {
          this.$router.push("/login");
          return;
        }
        if (String(data.user.role || "").toLowerCase() !== "instructor") {
          if (String(data.user.role || "").toLowerCase() === "admin") this.$router.push("/admin-dashboard");
          else if (String(data.user.role || "").toLowerCase() === "trainer") this.$router.push("/trainer-dashboard");
          else this.$router.push("/student-dashboard");
        }
      } catch (e) {
        this.$router.push("/login");
      }
    },

    async fetchDashboard() {
      this.loading = true;
      this.error = "";
      try {
        const resp = await fetch("/api/instructor/dashboard/summary", { credentials: "include" });
        const json = await resp.json();
        if (!resp.ok || json.status !== "success") throw new Error(json.message || "Failed to load dashboard");

        const d = json.data || {};
        this.stats = d.stats || this.stats;
        this.topCourses = Array.isArray(d.topCourses) ? d.topCourses : [];
        this.upcoming = Array.isArray(d.upcoming) ? d.upcoming : [];
        this.recent = Array.isArray(d.recent) ? d.recent : [];

        this.trends = d.trends || { labels: [], series: [] };
        this.buckets = d.buckets || this.buckets;

        this.page = 1;
        this.recentPage = 1;

        this.renderCharts();
      } catch (err) {
        console.error(err);
        this.error = err.message || "Dashboard error";
      } finally {
        this.loading = false;
      }
    },

    renderCharts() {
      if (this.barChart) this.barChart.destroy();
      if (this.pieChart) this.pieChart.destroy();

      const barCtx = this.$refs.barChartCanvas?.getContext("2d");
      if (barCtx) {
        this.barChart = new Chart(barCtx, {
          type: "bar",
          data: {
            labels: this.trends.labels || [],
            datasets: [
              {
                label: "Enrollments",
                data: this.trends.series || [],
                backgroundColor: "#16a34a",
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 5 } },
              x: { grid: { display: false } },
            },
            plugins: { legend: { position: "bottom" } },
          },
        });
      }

      const pieCtx = this.$refs.pieChartCanvas?.getContext("2d");
      if (pieCtx) {
        const labels = ["Enrolled", "Pending", "Rejected", "Cancelled", "Other"];
        const values = [
          this.buckets.ENROLLED || 0,
          this.buckets.PENDING || 0,
          this.buckets.REJECTED || 0,
          this.buckets.CANCELLED || 0,
          this.buckets.OTHER || 0,
        ];

        this.pieChart = new Chart(pieCtx, {
          type: "pie",
          data: {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: ["#22c55e", "#facc15", "#ef4444", "#64748b", "#a855f7"],
                borderWidth: 2,
                borderColor: "#ffffff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" } },
          },
        });
      }
    },

    formatDate(dateLike) {
      const d = new Date(dateLike);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },
    formatDateTime(dateLike) {
      const d = new Date(dateLike);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    statusPill(status) {
      const st = String(status || "").toUpperCase();
      if (["DONE", "COMPLETED", "FINISHED"].includes(st)) return "px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700";
      if (["CONFIRMED", "APPROVED", "ACTIVE"].includes(st)) return "px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700";
      if (st === "PENDING") return "px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800";
      if (st === "REJECTED") return "px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700";
      if (st === "CANCELLED" || st === "CANCELED") return "px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700";
      return "px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700";
    },
  },
};
</script>

<style scoped>
/* no extra */
</style>