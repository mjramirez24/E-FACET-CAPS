<template>
  <AdminLayout active-page="dashboard">
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
      </div>
    </template>

    <div class="dashboard-wrapper">
      <!-- Header with Status -->
      <div class="dashboard-top">
        <div>
          <h2 class="dashboard-title">Dashboard Overview</h2>
          <p class="dashboard-subtitle">Real-time metrics from your Driving & TESDA programs</p>
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
        <div class="stat-card stat-card-green" @click="goUsers">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalStudents }}</span>
              <span class="stat-label">Total Students</span>
              <span class="stat-meta">Users: {{ stats.totalUsers }} • Instructors: {{ stats.totalInstructors }} • Trainers: {{ stats.totalTrainers }}</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-blue" @click="goCourses">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.activeCoursesTotal }}</span>
              <span class="stat-label">Active Courses</span>
              <span class="stat-meta">Driving: {{ stats.activeDrivingCourses }} • TESDA: {{ stats.activeTesdaCourses }}</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-amber" @click="goReservations">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.pendingReservationsTotal }}</span>
              <span class="stat-label">Pending</span>
              <span class="stat-meta">Driving: {{ stats.pendingDriving }} • TESDA: {{ stats.pendingTesda }}</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value">{{ stats.paymentsForVerification }}</span>
              <span class="stat-label">Payments</span>
              <span class="stat-meta">Paid: {{ stats.paidCount }} • Total: ₱{{ formatMoney(stats.paidAmountPeso) }}</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button @click="goReservations" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>Reservations</span>
        </button>

        <button @click="goCourses" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Courses</span>
        </button>

        <button @click="goUsers" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Users</span>
        </button>

        <button @click="goReports" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Reports</span>
        </button>
      </div>

      <!-- Upcoming Schedules -->
      <div class="schedules-row">
        <div class="schedule-card schedule-indigo">
          <div>
            <span class="schedule-num">{{ upcomingSchedules.total }}</span>
            <span class="schedule-text">Upcoming Total</span>
          </div>
          <svg class="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <div class="schedule-card schedule-green">
          <div>
            <span class="schedule-num">{{ upcomingSchedules.driving }}</span>
            <span class="schedule-text">Driving</span>
          </div>
          <!-- Sport Car SVG -->
          <svg class="w-10 h-10 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M5 11l2-4h10l2 4M3 16v-3a1 1 0 011-1h16a1 1 0 011 1v3" />
            <path d="M7 12h10l1 4H6l1-4z" />
            <circle cx="6" cy="17" r="2" fill="currentColor" />
            <circle cx="18" cy="17" r="2" fill="currentColor" />
          </svg>
        </div>

        <div class="schedule-card schedule-blue">
          <div>
            <span class="schedule-num">{{ upcomingSchedules.tesda }}</span>
            <span class="schedule-text">TESDA</span>
          </div>
          <svg class="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      </div>

      <!-- Top Courses -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Top Courses This Month</h3>
            <p class="panel-meta">{{ topCourses.month_start }} — {{ topCourses.next_month_start }}</p>
          </div>
          <div class="tab-group">
            <button @click="activeTopTab='driving'" :class="['tab-btn', activeTopTab==='driving' ? 'tab-active-green' : 'tab-inactive']">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 11l2-4h10l2 4M3 16v-3a1 1 0 011-1h16a1 1 0 011 1v3" />
                <path d="M7 12h10l1 4H6l1-4z" />
                <circle cx="6" cy="17" r="2" fill="currentColor" />
                <circle cx="18" cy="17" r="2" fill="currentColor" />
              </svg>
              Driving
            </button>
            <button @click="activeTopTab='tesda'" :class="['tab-btn', activeTopTab==='tesda' ? 'tab-active-blue' : 'tab-inactive']">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              TESDA
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Course</th>
                <th>Reservations</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, idx) in topCoursesRows" :key="`${activeTopTab}-${c.course_id}`">
                <td class="font-semibold">{{ idx + 1 }}</td>
                <td>{{ c.course_name }}</td>
                <td><span class="count-badge">{{ c.reservations }}</span></td>
              </tr>
              <tr v-if="!loading && topCoursesRows.length === 0">
                <td colspan="3" class="empty-cell">No data this month.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-row">
        <div class="panel-card chart-card">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">Monthly Enrollments</h3>
              <p class="panel-meta">Last 12 months comparison</p>
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
              <p class="panel-meta">Combined distribution</p>
            </div>
            <span class="panel-tag">All time</span>
          </div>
          <div class="chart-wrap">
            <canvas ref="pieChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="panel-card">
        <div class="panel-header">
          <div class="flex items-center gap-3">
            <h3 class="panel-title">Recent Reservations</h3>
            <span class="panel-tag">{{ pageRangeText }}</span>
          </div>
          <div class="flex items-center gap-3">
            <select v-model.number="pageSize" class="select-modern">
              <option :value="5">5 rows</option>
              <option :value="10">10 rows</option>
              <option :value="20">20 rows</option>
            </select>
            <button @click="goReservations" class="link-text">Manage All →</button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Track</th>
                <th>Student</th>
                <th>Course</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paginatedRecent" :key="`${row.track}-${row.id}`">
                <td>
                  <span :class="['track-tag', row.track === 'TESDA' ? 'track-blue' : 'track-green']">
                    {{ row.track }}
                  </span>
                </td>
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ getInitials(row.student_name || '—') }}</div>
                    <span class="truncate-text">{{ row.student_name || '—' }}</span>
                  </div>
                </td>
                <td class="truncate-text max-w-[200px]">{{ row.course_name || '—' }}</td>
                <td>
                  <div class="text-sm">{{ row.schedule_date ? formatDate(row.schedule_date) : '—' }}</div>
                  <div class="text-xs text-gray-400" v-if="row.start_time">{{ $formatTimeRange12(row.start_time, row.end_time) }}</div>
                </td>
                <td><span :class="statusPill(row.status)">{{ row.status || '—' }}</span></td>
                <td class="text-sm text-gray-500">{{ row.created_at ? formatDateTime(row.created_at) : '—' }}</td>
              </tr>
              <tr v-if="!loading && filteredRecent.length === 0">
                <td colspan="6" class="empty-cell">No recent reservations found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span class="page-info">Page {{ page }} of {{ pageCount }}</span>
          <div class="page-btns">
            <button @click="pagePrev" :disabled="page <= 1" class="pg-btn" :class="{ 'pg-disabled': page <= 1 }">← Prev</button>
            <button v-for="p in pageButtons" :key="p" @click="page = p" class="pg-num" :class="{ 'pg-active': p === page }">{{ p }}</button>
            <button @click="pageNext" :disabled="page >= pageCount" class="pg-btn" :class="{ 'pg-disabled': page >= pageCount }">Next →</button>
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
      activeTopTab: "driving",
      topCourses: { month_start: "", next_month_start: "", driving: [], tesda: [] },
      upcomingSchedules: { total: 0, driving: 0, tesda: 0 },
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
    pageCount() { return Math.max(1, Math.ceil(this.filteredRecent.length / this.pageSize)); },
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
    topCoursesRows() {
      return this.activeTopTab === "tesda" ? (this.topCourses.tesda || []) : (this.topCourses.driving || []);
    },
  },
  watch: {
    searchQuery() { this.page = 1; },
    pageSize() { this.page = 1; },
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
    pagePrev() { if (this.page > 1) this.page--; },
    pageNext() { if (this.page < this.pageCount) this.page++; },
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
      if (this.barChart) { this.barChart.destroy(); this.barChart = null; }
      if (this.pieChart) { this.pieChart.destroy(); this.pieChart = null; }
      try {
        const resp = await fetch("/api/admin/dashboard/summary", { credentials: "include" });
        const json = await resp.json();
        if (!resp.ok || json.status !== "success") throw new Error(json.message || "Failed to load dashboard");
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
        this.upcomingSchedules = d.upcoming_schedules || { total: 0, driving: 0, tesda: 0 };
        this.topCourses = d.top_courses || { month_start: "", next_month_start: "", driving: [], tesda: [] };
        this.page = 1;
        this.$nextTick(() => {
          setTimeout(() => this.renderCharts(), 200);
        });
      } catch (err) {
        console.error(err);
        this.error = err.message || "Dashboard error";
      } finally {
        this.loading = false;
      }
    },
    renderCharts() {
      if (this.barChart) { this.barChart.destroy(); this.barChart = null; }
      if (this.pieChart) { this.pieChart.destroy(); this.pieChart = null; }
      
      const barCanvas = this.$refs.barChartCanvas;
      if (barCanvas) {
        const barCtx = barCanvas.getContext("2d");
        const labels = this.trends.labels && this.trends.labels.length > 0 ? this.trends.labels : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const drivingData = this.trends.driving && this.trends.driving.length > 0 ? this.trends.driving : new Array(12).fill(0);
        const tesdaData = this.trends.tesda && this.trends.tesda.length > 0 ? this.trends.tesda : new Array(12).fill(0);
        this.barChart = new Chart(barCtx, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              { label: "Driving", data: drivingData, backgroundColor: "#10b981", borderRadius: 6, barPercentage: 0.7, categoryPercentage: 0.8 },
              { label: "TESDA", data: tesdaData, backgroundColor: "#3b82f6", borderRadius: 6, barPercentage: 0.7, categoryPercentage: 0.8 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { stepSize: 1, font: { size: 11 } } },
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            },
            plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 20, font: { size: 12 } } } },
          },
        });
      }
      
      const pieCanvas = this.$refs.pieChartCanvas;
      if (pieCanvas) {
        const pieCtx = pieCanvas.getContext("2d");
        const values = [this.buckets.ENROLLED||0, this.buckets.PENDING||0, this.buckets.REJECTED||0, this.buckets.CANCELLED||0, this.buckets.OTHER||0];
        this.pieChart = new Chart(pieCtx, {
          type: "doughnut",
          data: {
            labels: ["Enrolled", "Pending", "Rejected", "Cancelled", "Other"],
            datasets: [{ data: values, backgroundColor: ["#10b981","#f59e0b","#ef4444","#6b7280","#8b5cf6"], borderWidth: 2, borderColor: "#fff" }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16, font: { size: 12 } } } },
          },
        });
      }
    },
    goReservations() { this.$router.push("/admin-reservations"); },
    goUsers() { this.$router.push("/admin-users"); },
    goCourses() { this.$router.push("/admin-courses"); },
    goReports() { this.$router.push("/admin-reports"); },
    getInitials(name) {
      const safe = String(name || "").trim();
      if (!safe) return "—";
      return safe.split(" ").filter(Boolean).slice(0,2).map(n=>n[0]).join("").toUpperCase();
    },
    formatDate(d) { const dt = new Date(d); return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); },
    formatDateTime(d) { const dt = new Date(d); return isNaN(dt.getTime()) ? "—" : dt.toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}); },
    formatMoney(n) { return (Number(n)||0).toLocaleString("en-PH",{minimumFractionDigits:2}); },
    statusPill(s) {
      const st = String(s||"").toUpperCase();
      if (["DONE","COMPLETED","FINISHED"].includes(st)) return "pill pill-green";
      if (["CONFIRMED","APPROVED","ACTIVE"].includes(st)) return "pill pill-blue";
      if (st==="PENDING") return "pill pill-amber";
      if (st==="REJECTED") return "pill pill-red";
      if (st==="CANCELLED"||st==="CANCELED") return "pill pill-gray";
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
.status-live { background: #d1fae5; color: #059669; }
.spinner-dot { width: 14px; height: 14px; border: 2px solid #d1d5db; border-top-color: #6b7280; border-radius: 50%; animation: spin 0.8s linear infinite; }
.live-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ========== HEADER ACTIONS ========== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s;   color: #111827 !important;}
.search-input-modern:focus { border-color: #10b981; }
.refresh-btn-modern { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn-modern:hover { background: #059669; transform: translateY(-1px); }
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
.action-btn:hover { border-color: #10b981; color: #059669; background: #f9fafb; }

/* ========== SCHEDULES ========== */
.schedules-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.schedule-card { padding: 16px 20px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; }
.schedule-indigo { background: #eef2ff; color: #4338ca; }
.schedule-green { background: #d1fae5; color: #059669; }
.schedule-blue { background: #dbeafe; color: #2563eb; }
.schedule-num { font-size: 1.75rem; font-weight: 700; display: block; line-height: 1; }
.schedule-text { font-size: 0.78rem; font-weight: 600; opacity: 0.8; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-meta { font-size: 0.78rem; color: #9ca3af; margin: 2px 0 0; }
.panel-tag { font-size: 0.72rem; padding: 4px 10px; background: #f3f4f6; border-radius: 8px; color: #6b7280; font-weight: 500; }

/* ========== TABS ========== */
.tab-group { display: flex; gap: 4px; background: #f3f4f6; padding: 4px; border-radius: 10px; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
.tab-inactive { background: transparent; color: #6b7280; }
.tab-active-green { background: #10b981; color: #fff; }
.tab-active-blue { background: #3b82f6; color: #fff; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.modern-table th { text-align: left; padding: 12px 14px; font-size: 0.72rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; }
.modern-table td { padding: 11px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.count-badge { display: inline-block; padding: 3px 12px; background: #d1fae5; color: #059669; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== TRACK & PILLS ========== */
.track-tag { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
.track-green { background: #d1fae5; color: #059669; }
.track-blue { background: #dbeafe; color: #2563eb; }
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
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }
.pg-num { width: 34px; height: 34px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-num:hover { border-color: #10b981; }
.pg-active { background: #10b981; color: #fff; border-color: #10b981; }

/* ========== MISC ========== */
.select-modern { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.8rem; color: #374151; background: #fff; outline: none; cursor: pointer; }
.link-text { font-size: 0.85rem; font-weight: 600; color: #059669; background: none; border: none; cursor: pointer; }
.flex { display: flex; } .items-center { align-items: center; } .gap-3 { gap: 12px; }
.max-w-\[200px\] { max-width: 200px; }

@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
  .header-actions { flex-direction: column; }
  .search-box { max-width: 100%; }
}
</style>