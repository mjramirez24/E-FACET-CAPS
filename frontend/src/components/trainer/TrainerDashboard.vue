<template>
  <TrainerLayout active-page="dashboard">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search recent activity..."
            class="search-input-modern"
          />
        </div>
        <button @click="fetchDashboard" class="refresh-btn-modern" title="Refresh dashboard">
          <svg class="refresh-icon-modern" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="dashboard-wrapper">
      <!-- Header with Status -->
      <div class="dashboard-top">
        <div>
          <h2 class="dashboard-title">Trainer Dashboard</h2>
          <p class="dashboard-subtitle">Real-time totals from your TESDA schedules & reservations</p>
        </div>

        <div class="status-group">
          <div v-if="loading" class="status-badge status-loading">
            <div class="spinner-dot"></div>
            <span>Syncing data...</span>
          </div>
          <div v-else-if="error" class="status-badge status-error">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ error }}</span>
          </div>
          <div v-else class="status-badge status-live">
            <span class="live-dot"></span>
            <span>Live data</span>
          </div>
        </div>
      </div>

      <!-- Stats Cards Row -->
      <div class="stats-row">
        <div class="stat-card stat-card-green" @click="$router.push('/trainer-courses')">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.assignedCourses }}</span>
              <span class="stat-label">Assigned Courses</span>
              <span class="stat-meta">TESDA courses with schedules</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-blue" @click="$router.push('/trainer-students')">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalTrainees }}</span>
              <span class="stat-label">Total Trainees</span>
              <span class="stat-meta">Distinct enrolled students</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-amber" @click="$router.push('/trainer-attendance')">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.pendingAttendance }}</span>
              <span class="stat-label">Pending Attendance</span>
              <span class="stat-meta">Today (unmarked)</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.upcomingSchedules }}</span>
              <span class="stat-label">Upcoming Schedules</span>
              <span class="stat-meta">From today onward</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button @click="$router.push('/trainer-courses')" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>My Courses</span>
        </button>

        <button @click="$router.push('/trainer-students')" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Students</span>
        </button>

        <button @click="$router.push('/trainer-attendance')" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Attendance</span>
        </button>
      </div>

      <!-- Top Courses -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Top Courses This Month</h3>
            <p class="panel-meta">Based on reservations</p>
          </div>
          <span class="panel-tag">TESDA</span>
        </div>

        <div v-if="topCourses.length === 0" class="empty-cell">No data yet.</div>

        <div v-else class="course-grid">
          <div v-for="c in topCourses" :key="c.course_id" class="course-mini-card">
            <div class="course-mini-name truncate-text" :title="c.course_name">{{ c.course_name }}</div>
            <div class="course-mini-count">{{ c.reservations }}</div>
            <div class="course-mini-label">reservations</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-row">
        <div class="panel-card chart-card">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">Monthly Enrollments</h3>
              <p class="panel-meta">Last 12 months</p>
            </div>
            <span class="panel-tag">12 months</span>
          </div>
          <div class="chart-wrap">
            <canvas ref="barChartCanvas"></canvas>
          </div>
        </div>

        <div class="panel-card chart-card">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">Reservation Status</h3>
              <p class="panel-meta">Your schedules</p>
            </div>
            <span class="panel-tag">All time</span>
          </div>
          <div class="chart-wrap">
            <canvas ref="pieChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Upcoming Schedules -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="flex items-center gap-3">
            <h3 class="panel-title">Upcoming Schedules</h3>
            <span class="panel-tag">{{ filteredUpcoming.length }} items</span>
          </div>
          <button @click="$router.push('/trainer-courses')" class="link-text">View All →</button>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Course</th>
                <th>Date</th>
                <th>Time</th>
                <th>Slots</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedUpcoming" :key="row.schedule_id">
                <td>{{ row.course_name || "—" }}</td>
                <td>{{ row.schedule_date ? formatDate(row.schedule_date) : "—" }}</td>
                <td>
                  <span v-if="row.start_time && row.end_time">{{ $formatTimeRange12(row.start_time, row.end_time) }}</span>
                  <span v-else>—</span>
                </td>
                <td>{{ Number(row.reserved_count || 0) }} / {{ Number(row.total_slots || 0) }}</td>
                <td><span class="pill pill-blue">{{ (row.status || "open").toString().toUpperCase() }}</span></td>
              </tr>
              <tr v-if="!loading && filteredUpcoming.length === 0">
                <td colspan="5" class="empty-cell">No upcoming schedules.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="filteredUpcoming.length > 0" class="pagination-bar">
          <span class="page-info">Page {{ page }} of {{ totalPages }} • {{ filteredUpcoming.length }} items</span>
          <div class="page-btns">
            <button
              @click="page = Math.max(1, page - 1)"
              :disabled="page === 1"
              class="pg-btn"
              :class="{ 'pg-disabled': page === 1 }"
            >← Previous</button>
            <button class="pg-num pg-active">{{ page }}</button>
            <button
              @click="page = Math.min(totalPages, page + 1)"
              :disabled="page === totalPages"
              class="pg-btn"
              :class="{ 'pg-disabled': page === totalPages }"
            >Next →</button>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="flex items-center gap-3">
            <h3 class="panel-title">Recent Reservations</h3>
            <span class="panel-tag">{{ filteredRecent.length }} items</span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in paginatedRecent" :key="r.id">
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ getInitials(r.student_name || '—') }}</div>
                    <span class="truncate-text">{{ r.student_name || "—" }}</span>
                  </div>
                </td>
                <td class="truncate-text max-w-[200px]">{{ r.course_name || "—" }}</td>
                <td>
                  <div class="text-sm">{{ r.schedule_date ? formatDate(r.schedule_date) : "—" }}</div>
                  <div class="text-xs text-gray-400" v-if="r.start_time && r.end_time">{{ $formatTimeRange12(r.start_time, r.end_time) }}</div>
                </td>
                <td><span :class="statusPill(r.status)">{{ r.status || "—" }}</span></td>
                <td class="text-sm text-gray-500">{{ r.created_at ? formatDateTime(r.created_at) : "—" }}</td>
              </tr>
              <tr v-if="!loading && filteredRecent.length === 0">
                <td colspan="5" class="empty-cell">No recent reservations.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination (recent) -->
        <div v-if="filteredRecent.length > 0" class="pagination-bar">
          <span class="page-info">Page {{ recentPage }} of {{ recentTotalPages }} • {{ filteredRecent.length }} items</span>
          <div class="page-btns">
            <button
              @click="recentPage = Math.max(1, recentPage - 1)"
              :disabled="recentPage === 1"
              class="pg-btn"
              :class="{ 'pg-disabled': recentPage === 1 }"
            >← Previous</button>
            <button class="pg-num pg-active">{{ recentPage }}</button>
            <button
              @click="recentPage = Math.min(recentTotalPages, recentPage + 1)"
              :disabled="recentPage === recentTotalPages"
              class="pg-btn"
              :class="{ 'pg-disabled': recentPage === recentTotalPages }"
            >Next →</button>
          </div>
        </div>
      </div>
    </div>
  </TrainerLayout>
</template>

<script>
import TrainerLayout from "./TrainerLayout.vue";
import Chart from "chart.js/auto";
import axios from "axios";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "TrainerDashboard",
  components: { TrainerLayout },
  data() {
    return {
      searchQuery: "",
      loading: false,
      error: "",

      stats: {
        assignedCourses: 0,
        totalTrainees: 0,
        pendingAttendance: 0,
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
        const response = await api.get("/auth/check");
        const data = response.data;
        if (data.status !== "success" || !data.authenticated) {
          this.$router.push("/login");
          return;
        }
        if (String(data.user.role || "").toLowerCase() !== "trainer") {
          if (String(data.user.role || "").toLowerCase() === "admin") this.$router.push("/admin-dashboard");
          else if (String(data.user.role || "").toLowerCase() === "instructor") this.$router.push("/instructor-dashboard");
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
        const resp = await api.get("/trainer/dashboard/summary");
        const json = resp.data;

        if (json.status !== "success") {
          throw new Error(json.message || "Failed to load dashboard");
        }

        const d = json.data || {};

        this.stats = d.stats || this.stats;

        // ✅ same count from My Courses
        const coursesResp = await api.get("/trainer/tesda/courses");
        const coursesRows = Array.isArray(coursesResp.data?.data)
          ? coursesResp.data.data
          : [];

        this.stats.assignedCourses = coursesRows.length;

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
        this.error = err.response?.data?.message || err.message || "Dashboard error";
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
                backgroundColor: "#2563eb",
                borderRadius: 6,
                barPercentage: 0.7,
                categoryPercentage: 0.8,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { color: "#f3f4f6" }, ticks: { stepSize: 5, font: { size: 11 } } },
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            },
            plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 20, font: { size: 12 } } } },
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
          type: "doughnut",
          data: {
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: ["#2563eb", "#f59e0b", "#ef4444", "#6b7280", "#8b5cf6"],
                borderWidth: 2,
                borderColor: "#fff",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16, font: { size: 12 } } } },
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
    getInitials(name) {
      const safe = String(name || "").trim();
      if (!safe) return "—";
      return safe.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
    },
    statusPill(status) {
      const st = String(status || "").toUpperCase();
      if (["DONE", "COMPLETED", "FINISHED"].includes(st)) return "pill pill-green";
      if (["CONFIRMED", "APPROVED", "ACTIVE"].includes(st)) return "pill pill-blue";
      if (st === "PENDING") return "pill pill-amber";
      if (st === "REJECTED") return "pill pill-red";
      if (st === "CANCELLED" || st === "CANCELED") return "pill pill-gray";
      return "pill pill-purple";
    },
  },
};
</script>

<style scoped>
/* ========== LAYOUT ========== */
.dashboard-wrapper { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.dashboard-top { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.dashboard-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.dashboard-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

/* ========== STATUS ========== */
.status-group { display: flex; align-items: center; gap: 10px; }
.status-badge { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.status-loading { background: #f3f4f6; color: #6b7280; }
.status-error { background: #fef2f2; color: #dc2626; }
.status-live { background: #dbeafe; color: #1d4ed8; }
.spinner-dot { width: 14px; height: 14px; border: 2px solid #d1d5db; border-top-color: #6b7280; border-radius: 50%; animation: spin 0.8s linear infinite; }
.live-dot { width: 8px; height: 8px; background: #2563eb; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ========== HEADER ACTIONS ========== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; }
.search-input-modern:focus { border-color: #2563eb; }
.refresh-btn-modern { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #2563eb; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn-modern:hover { background: #1d4ed8; transform: translateY(-1px); }
.refresh-icon-modern { width: 16px; height: 16px; }
.spin-animation { animation: spin 1s linear infinite; }

/* ========== STATS ========== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-card-green .stat-value { color: #059669; }
.stat-card-blue .stat-value { color: #2563eb; }
.stat-card-amber .stat-value { color: #d97706; }
.stat-card-purple .stat-value { color: #7c3aed; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-meta { font-size: 0.72rem; color: #9ca3af; margin-top: 2px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }

/* ========== QUICK ACTIONS ========== */
.quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
.action-btn { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; font-size: 0.85rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: #2563eb; color: #1d4ed8; background: #f9fafb; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-meta { font-size: 0.78rem; color: #9ca3af; margin: 2px 0 0; }
.panel-tag { font-size: 0.72rem; padding: 4px 10px; background: #eff6ff; border-radius: 8px; color: #2563eb; font-weight: 500; }

/* ========== TOP COURSES GRID ========== */
.course-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.course-mini-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; transition: all 0.2s; }
.course-mini-card:hover { border-color: #2563eb; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.course-mini-name { font-size: 0.85rem; font-weight: 600; color: #374151; }
.course-mini-count { font-size: 1.5rem; font-weight: 700; color: #2563eb; margin-top: 8px; }
.course-mini-label { font-size: 0.72rem; color: #9ca3af; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.modern-table th { text-align: left; padding: 12px 14px; font-size: 0.72rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; }
.modern-table td { padding: 11px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #2563eb; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }
.pill-purple { background: #ede9fe; color: #7c3aed; }

/* ========== USER ========== */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-sm { width: 30px; height: 30px; background: #e5e7eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #374151; flex-shrink: 0; }
.truncate-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ========== CHARTS ========== */
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card { min-height: 380px; }
.chart-wrap { position: relative; height: 300px; width: 100%; }
.chart-wrap canvas { width: 100% !important; height: 100% !important; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.85rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #2563eb; color: #1d4ed8; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }
.pg-num { width: 34px; height: 34px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-active { background: #2563eb; color: #fff; border-color: #2563eb; }

/* ========== MISC ========== */
.link-text { font-size: 0.85rem; font-weight: 600; color: #2563eb; background: none; border: none; cursor: pointer; }
.flex { display: flex; } .items-center { align-items: center; } .gap-3 { gap: 12px; }
.max-w-\[200px\] { max-width: 200px; }
.text-sm { font-size: 0.85rem; } .text-xs { font-size: 0.72rem; } .text-gray-400 { color: #9ca3af; } .text-gray-500 { color: #6b7280; }
.w-4 { width: 16px; } .h-4 { height: 16px; } .w-5 { width: 20px; } .h-5 { height: 20px; } .w-6 { width: 24px; } .h-6 { height: 24px; }

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
  .header-actions { flex-direction: column; }
  .search-box { max-width: 100%; }
}
</style>