<template>
  <AdminLayout active-page="dashboard">
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
          <h2 class="text-lg font-bold text-green-800">📊 Admin Dashboard</h2>
          <p class="text-xs text-gray-500 mt-1">
            Real-time totals from your database (Driving + TESDA)
          </p>
        </div>

        <div v-if="loading" class="text-xs text-gray-500 mt-1">Loading…</div>
        <div v-else-if="error" class="text-xs text-red-600 mt-1">{{ error }}</div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-green-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-green-800">{{ stats.totalStudents }}</h3>
              <p class="text-green-700 font-medium mt-1">Total Students</p>
              <p class="text-xs text-green-700 mt-1">
                Users: {{ stats.totalUsers }} • Instructors: {{ stats.totalInstructors }} • Trainers: {{ stats.totalTrainers }}
              </p>
            </div>
            <div class="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">👨‍🎓</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-blue-800">{{ stats.activeCoursesTotal }}</h3>
              <p class="text-blue-700 font-medium mt-1">Active Courses</p>
              <p class="text-xs text-blue-700 mt-1">
                Driving: {{ stats.activeDrivingCourses }} • TESDA: {{ stats.activeTesdaCourses }}
              </p>
            </div>
            <div class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <div class="bg-yellow-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-yellow-800">{{ stats.pendingReservationsTotal }}</h3>
              <p class="text-yellow-700 font-medium mt-1">Pending Reservations</p>
              <p class="text-xs text-yellow-700 mt-1">
                Driving: {{ stats.pendingDriving }} • TESDA: {{ stats.pendingTesda }}
              </p>
            </div>
            <div class="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div class="bg-purple-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-3xl font-bold text-purple-800">{{ stats.paymentsForVerification }}</h3>
              <p class="text-purple-700 font-medium mt-1">Payments to Verify</p>
              <p class="text-xs text-purple-700 mt-1">
                Paid: {{ stats.paidCount }} • Total Paid: ₱{{ formatMoney(stats.paidAmountPeso) }}
              </p>
            </div>
            <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <span class="text-2xl">💳</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button @click="goReservations" class="text-left bg-white p-4 rounded-xl shadow-sm border hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-green-800">Reservations</div>
              <div class="text-xs text-gray-500">Approve / manage</div>
            </div>
            <div class="text-2xl">🧾</div>
          </div>
        </button>

        <button @click="goCourses" class="text-left bg-white p-4 rounded-xl shadow-sm border hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-green-800">Courses</div>
              <div class="text-xs text-gray-500">Driving + TESDA</div>
            </div>
            <div class="text-2xl">📚</div>
          </div>
        </button>

        <button @click="goUsers" class="text-left bg-white p-4 rounded-xl shadow-sm border hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-green-800">Users</div>
              <div class="text-xs text-gray-500">Manage accounts</div>
            </div>
            <div class="text-2xl">👥</div>
          </div>
        </button>

        <button @click="goReports" class="text-left bg-white p-4 rounded-xl shadow-sm border hover:shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-green-800">Reports</div>
              <div class="text-xs text-gray-500">Exports + analytics</div>
            </div>
            <div class="text-2xl">📈</div>
          </div>
        </button>
      </div>

      <!-- Upcoming schedules -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div class="bg-indigo-100 p-5 rounded-lg shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-3xl font-bold text-indigo-800">{{ upcomingSchedules.total }}</div>
              <div class="text-sm font-medium text-indigo-700 mt-1">Upcoming Schedules (Total)</div>
            </div>
            <div class="text-2xl">📅</div>
          </div>
        </div>

        <div class="bg-green-100 p-5 rounded-lg shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-3xl font-bold text-green-800">{{ upcomingSchedules.driving }}</div>
              <div class="text-sm font-medium text-green-700 mt-1">Upcoming Driving</div>
            </div>
            <div class="text-2xl">🚗</div>
          </div>
        </div>

        <div class="bg-blue-100 p-5 rounded-lg shadow-sm border">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-3xl font-bold text-blue-800">{{ upcomingSchedules.tesda }}</div>
              <div class="text-sm font-medium text-blue-700 mt-1">Upcoming TESDA</div>
            </div>
            <div class="text-2xl">🛠️</div>
          </div>
        </div>
      </div>

      <!-- Top Courses this month -->
      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 class="text-green-800 font-semibold">Top Courses this Month</h3>
            <p class="text-xs text-gray-500">
              Based on reservations from {{ topCourses.month_start }} to {{ topCourses.next_month_start }}
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="activeTopTab='driving'"
              class="px-3 py-2 rounded-md text-sm font-semibold border"
              :class="activeTopTab==='driving' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-green-800'"
            >
              🚗 Driving
            </button>
            <button
              @click="activeTopTab='tesda'"
              class="px-3 py-2 rounded-md text-sm font-semibold border"
              :class="activeTopTab==='tesda' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-800'"
            >
              🛠️ TESDA
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-3 px-4 text-left font-medium">#</th>
                <th class="py-3 px-4 text-left font-medium">Course</th>
                <th class="py-3 px-4 text-left font-medium">Reservations</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(c, idx) in topCoursesRows"
                :key="`${activeTopTab}-${c.course_id}`"
                class="border-b hover:bg-gray-50"
              >
                <td class="py-3 px-4">{{ idx + 1 }}</td>
                <td class="py-3 px-4">{{ c.course_name }}</td>
                <td class="py-3 px-4 font-semibold">{{ c.reservations }}</td>
              </tr>

              <tr v-if="!loading && topCoursesRows.length === 0">
                <td colspan="3" class="py-6 px-4 text-center text-gray-500">No data this month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Charts -->
      <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-green-800 font-semibold">Monthly Enrollments (last 12 months)</h3>
          </div>
          <div class="h-64">
            <canvas ref="barChartCanvas"></canvas>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-green-800 font-semibold">Reservation Status (combined)</h3>
          </div>
          <div class="h-64">
            <canvas ref="pieChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Activity Table (PAGINATED) -->
      <div class="overflow-x-auto mb-10 mt-10">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <h3 class="text-md font-semibold text-green-800">Recent Reservations</h3>
            <span class="text-xs text-gray-500">
              Showing {{ pageRangeText }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 text-xs text-gray-600">
              Rows:
              <select
                v-model.number="pageSize"
                class="border rounded-md px-2 py-1 text-sm"
              >
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
            </div>

            <button
              @click="goReservations"
              class="text-green-700 hover:text-green-800 font-medium text-sm"
            >
              Manage Reservations →
            </button>
          </div>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-green-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Track</th>
              <th class="py-3 px-4 text-left font-medium">Student</th>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Schedule</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in paginatedRecent"
              :key="`${row.track}-${row.id}`"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">
                <span
                  class="px-2 py-1 rounded-full text-xs font-semibold"
                  :class="row.track === 'TESDA' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'"
                >
                  {{ row.track }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                    {{ getInitials(row.student_name || '—') }}
                  </div>
                  <span class="truncate max-w-[220px]">{{ row.student_name || '—' }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <span class="truncate max-w-[280px] inline-block">{{ row.course_name || '—' }}</span>
              </td>
              <td class="py-3 px-4">
                <div class="text-xs text-gray-700">
                  <div>{{ row.schedule_date ? formatDate(row.schedule_date) : '—' }}</div>
                  <div class="text-gray-500" v-if="row.start_time && row.end_time">
                    {{ row.start_time }} - {{ row.end_time }}
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <span :class="statusPill(row.status)">{{ row.status || '—' }}</span>
              </td>
              <td class="py-3 px-4">{{ row.created_at ? formatDateTime(row.created_at) : '—' }}</td>
            </tr>

            <tr v-if="!loading && filteredRecent.length === 0">
              <td colspan="6" class="py-6 px-4 text-center text-gray-500">
                No recent reservations found.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination controls (same vibe) -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
          <div class="text-xs text-gray-500">
            Page {{ page }} of {{ pageCount }}
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="pagePrev"
              :disabled="page <= 1"
              class="px-3 py-1.5 rounded-md border text-sm font-semibold"
              :class="page <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'"
            >
              Prev
            </button>

            <button
              v-for="p in pageButtons"
              :key="p"
              @click="page = p"
              class="px-3 py-1.5 rounded-md border text-sm font-semibold"
              :class="p === page ? 'bg-green-700 text-white border-green-700' : 'bg-white hover:bg-gray-50'"
            >
              {{ p }}
            </button>

            <button
              @click="pageNext"
              :disabled="page >= pageCount"
              class="px-3 py-1.5 rounded-md border text-sm font-semibold"
              :class="page >= pageCount ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-50'"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import AdminLayout from "./AdminLayout.vue";
import Chart from "chart.js/auto";

export default {
  name: "AdminDashboard",
  components: { AdminLayout },
  data() {
    return {
      searchQuery: "",
      loading: false,
      error: "",

      // new
      activeTopTab: "driving",
      topCourses: { month_start: "", next_month_start: "", driving: [], tesda: [] },
      upcomingSchedules: { total: 0, driving: 0, tesda: 0 },

      // pagination
      page: 1,
      pageSize: 10,

      stats: {
        totalUsers: 0,
        totalStudents: 0,
        totalInstructors: 0,
        totalTrainers: 0,
        activeDrivingCourses: 0,
        activeTesdaCourses: 0,
        activeCoursesTotal: 0,
        pendingDriving: 0,
        pendingTesda: 0,
        pendingReservationsTotal: 0,
        paymentsForVerification: 0,
        paidCount: 0,
        paidAmountPeso: 0,
      },
      recent: [],
      trends: { labels: [], driving: [], tesda: [] },
      buckets: { ENROLLED: 0, PENDING: 0, REJECTED: 0, CANCELLED: 0, OTHER: 0 },
      barChart: null,
      pieChart: null,
    };
  },
  computed: {
    filteredRecent() {
      const base = Array.isArray(this.recent) ? this.recent : [];
      if (!this.searchQuery) return base;

      const q = this.searchQuery.toLowerCase();
      return base.filter((r) => {
        return (
          String(r.track || "").toLowerCase().includes(q) ||
          String(r.student_name || "").toLowerCase().includes(q) ||
          String(r.course_name || "").toLowerCase().includes(q) ||
          String(r.status || "").toLowerCase().includes(q)
        );
      });
    },

    // pagination derived
    pageCount() {
      const total = this.filteredRecent.length;
      return Math.max(1, Math.ceil(total / this.pageSize));
    },
    paginatedRecent() {
      const start = (this.page - 1) * this.pageSize;
      return this.filteredRecent.slice(start, start + this.pageSize);
    },
    pageRangeText() {
      const total = this.filteredRecent.length;
      if (total === 0) return "0 of 0";

      const start = (this.page - 1) * this.pageSize + 1;
      const end = Math.min(this.page * this.pageSize, total);
      return `${start}-${end} of ${total}`;
    },
    pageButtons() {
      // show up to 5 buttons, centered
      const total = this.pageCount;
      const cur = this.page;

      const maxBtns = 5;
      let start = Math.max(1, cur - 2);
      let end = Math.min(total, start + maxBtns - 1);
      start = Math.max(1, end - maxBtns + 1);

      const out = [];
      for (let i = start; i <= end; i++) out.push(i);
      return out;
    },

    // top courses
    topCoursesRows() {
      return this.activeTopTab === "tesda" ? (this.topCourses.tesda || []) : (this.topCourses.driving || []);
    },
  },
  watch: {
    // reset page when search/page size changes to avoid blank page
    searchQuery() {
      this.page = 1;
    },
    pageSize() {
      this.page = 1;
    },
    // clamp page if dataset shrinks
    pageCount() {
      if (this.page > this.pageCount) this.page = this.pageCount;
      if (this.page < 1) this.page = 1;
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
    pagePrev() {
      if (this.page > 1) this.page--;
    },
    pageNext() {
      if (this.page < this.pageCount) this.page++;
    },

    async checkAuth() {
      try {
        const response = await fetch("/api/auth/check", { credentials: "include" });
        const data = await response.json();
        if (data.status !== "success" || !data.authenticated) {
          window.location.href = "/login.html";
        } else if (String(data.user.role || "").toLowerCase() !== "admin") {
          window.location.href = "/student-dashboard.html";
        }
      } catch (e) {
        window.location.href = "/login.html";
      }
    },

    async fetchDashboard() {
      this.loading = true;
      this.error = "";
      try {
        const resp = await fetch("/api/admin/dashboard/summary", { credentials: "include" });
        const json = await resp.json();
        if (!resp.ok || json.status !== "success") {
          throw new Error(json.message || "Failed to load dashboard");
        }

        const d = json.data;

        this.stats.totalUsers = d.users?.total || 0;
        this.stats.totalStudents = d.users?.students || 0;
        this.stats.totalInstructors = d.users?.instructors || 0;
        this.stats.totalTrainers = d.users?.trainers || 0;

        this.stats.activeDrivingCourses = d.courses?.driving?.active || 0;
        this.stats.activeTesdaCourses = d.courses?.tesda?.active || 0;
        this.stats.activeCoursesTotal = this.stats.activeDrivingCourses + this.stats.activeTesdaCourses;

        this.stats.pendingDriving = d.reservations?.pending_driving || 0;
        this.stats.pendingTesda = d.reservations?.pending_tesda || 0;
        this.stats.pendingReservationsTotal = d.reservations?.pending_total || 0;

        this.stats.paymentsForVerification = d.payments?.for_verification || 0;
        this.stats.paidCount = d.payments?.paid_count || 0;
        this.stats.paidAmountPeso = d.payments?.paid_amount_peso || 0;

        this.recent = Array.isArray(d.recent) ? d.recent : [];
        this.trends = d.trends || { labels: [], driving: [], tesda: [] };
        this.buckets = d.reservations?.buckets || this.buckets;

        // new blocks
        this.upcomingSchedules = d.upcoming_schedules || { total: 0, driving: 0, tesda: 0 };
        this.topCourses = d.top_courses || { month_start: "", next_month_start: "", driving: [], tesda: [] };

        // reset page after fetch
        this.page = 1;

        this.renderCharts();
      } catch (err) {
        console.error(err);
        this.error = err.message || "Dashboard error";
      } finally {
        this.loading = false;
      }
    },

    renderCharts() {
      if (this.barChart) {
        this.barChart.destroy();
        this.barChart = null;
      }
      if (this.pieChart) {
        this.pieChart.destroy();
        this.pieChart = null;
      }

      const barCtx = this.$refs.barChartCanvas?.getContext("2d");
      if (barCtx) {
        this.barChart = new Chart(barCtx, {
          type: "bar",
          data: {
            labels: this.trends.labels || [],
            datasets: [
              { label: "Driving", data: this.trends.driving || [], backgroundColor: "#16a34a", borderRadius: 4 },
              { label: "TESDA", data: this.trends.tesda || [], backgroundColor: "#1d4ed8", borderRadius: 4 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 5 } },
              x: { grid: { display: false } },
            },
            plugins: { legend: { position: "bottom" }, tooltip: { mode: "index", intersect: false } },
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
            plugins: {
              legend: { position: "bottom" },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.label || "";
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const pct = total ? Math.round((value / total) * 100) : 0;
                    return `${label}: ${value} (${pct}%)`;
                  },
                },
              },
            },
          },
        });
      }
    },

    // routes (adjust if your paths differ)
    goReservations() {
      this.$router.push("/admin-reservations");
    },
    goUsers() {
      this.$router.push("/admin-users");
    },
    goCourses() {
      this.$router.push("/admin-courses");
    },
    goReports() {
      this.$router.push("/admin-reports");
    },

    getInitials(name) {
      const safe = String(name || "").trim();
      if (!safe) return "—";
      return safe
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase();
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

    formatMoney(n) {
      const v = Number(n) || 0;
      return v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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