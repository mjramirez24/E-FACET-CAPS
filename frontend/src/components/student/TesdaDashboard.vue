<template>
  <StudentLayoutTesda active-page="dashboard">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search sessions..."
            class="search-input-modern"
          />
        </div>
        <button @click="fetchDashboard" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': false }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="dashboard-wrapper">
      <div class="page-top">
        <h2 class="page-title">TESDA Student Dashboard</h2>
        <p class="page-subtitle">Welcome, <span class="font-semibold">{{ studentName }}</span></p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-amber">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-amber">{{ stats.enrolled }}</span>
              <span class="stat-label">Enrolled / Active</span>
              <span class="stat-detail">{{
                currentEnrollment
                  ? currentEnrollment.course_name +
                    (currentEnrollment.course_code ? " (" + currentEnrollment.course_code + ")" : "")
                  : "No active enrollment"
              }}</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ stats.total }}</span>
              <span class="stat-label">My Reservations</span>
              <span class="stat-detail">Pending: {{ stats.pending }}</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ upcomingCount }}</span>
              <span class="stat-label">Upcoming Sessions</span>
              <span class="stat-detail">Scheduled ahead</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-purple">{{ stats.done }}</span>
              <span class="stat-label">Completed</span>
              <span class="stat-detail">Cancelled: {{ stats.cancelled }}</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="quick-links-row">
        <button @click="go('tesda-schedule')" class="quick-link-card">
          <div class="quick-link-icon quick-link-icon-blue">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="quick-link-info">
            <span class="quick-link-title">My Schedule</span>
            <span class="quick-link-desc">View upcoming sessions</span>
          </div>
        </button>

        <button @click="go('/tesda-enrollment')" class="quick-link-card">
          <div class="quick-link-icon quick-link-icon-green">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div class="quick-link-info">
            <span class="quick-link-title">Enroll in Courses</span>
            <span class="quick-link-desc">Browse available courses</span>
          </div>
        </button>

        <button @click="go('tesda-certificate')" class="quick-link-card">
          <div class="quick-link-icon quick-link-icon-purple">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div class="quick-link-info">
            <span class="quick-link-title">Certificates</span>
            <span class="quick-link-desc">View issued certificates</span>
          </div>
        </button>

        <button @click="go('tesda-attendance')" class="quick-link-card">
          <div class="quick-link-icon quick-link-icon-amber">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="quick-link-info">
            <span class="quick-link-title">Attendance</span>
            <span class="quick-link-desc">View your attendance records</span>
          </div>
        </button>
      </div>

      <!-- Attendance Section -->
      <div class="panel-card" @click="go('tesda-attendance')" style="cursor: pointer;">
        <div class="panel-header-bar">
          <h3 class="panel-title">Attendance</h3>
          <button @click.stop="go('tesda-attendance')" class="panel-action-link">
            View Details
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="attendance-grid">
          <div class="attendance-stat">
            <span class="attendance-stat-value">{{ attendance.totalSessions }}</span>
            <span class="attendance-stat-label">Total Sessions</span>
          </div>
          <div class="attendance-stat attendance-stat-green">
            <span class="attendance-stat-value text-emerald">{{ attendance.present + attendance.late + attendance.excused }}</span>
            <span class="attendance-stat-label">Attended</span>
          </div>
          <div class="attendance-stat attendance-stat-red">
            <span class="attendance-stat-value text-red-500">{{ attendance.absent }}</span>
            <span class="attendance-stat-label">Absent</span>
          </div>
          <div class="attendance-stat attendance-stat-blue">
            <span class="attendance-stat-value text-blue">{{ attendance.rate }}%</span>
            <span class="attendance-stat-label">Attendance Rate</span>
            <div class="attendance-bar">
              <div
                class="attendance-bar-fill"
                :class="attendance.rate >= 80 ? 'bg-green-500' : attendance.rate >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                :style="{ width: attendance.rate + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="attendance-details">
          <div class="attendance-detail">
            <span class="attendance-detail-label">Present</span>
            <span class="attendance-detail-value text-emerald">{{ attendance.present }}</span>
          </div>
          <div class="attendance-detail">
            <span class="attendance-detail-label">Late</span>
            <span class="attendance-detail-value text-amber">{{ attendance.late }}</span>
          </div>
          <div class="attendance-detail">
            <span class="attendance-detail-label">Excused</span>
            <span class="attendance-detail-value text-blue">{{ attendance.excused }}</span>
          </div>
          <div class="attendance-detail">
            <span class="attendance-detail-label">Unmarked</span>
            <span class="attendance-detail-value text-gray-500">{{ attendance.unmarked }}</span>
          </div>
        </div>
      </div>

      <!-- Upcoming Sessions Table -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Upcoming Sessions</h3>
          <button @click="go('tesda-schedule')" class="panel-action-link">
            View All
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Course</th>
                <th>Trainer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredUpcoming.length === 0">
                <td colspan="5" class="empty-cell">No upcoming sessions</td>
              </tr>
              <tr v-for="u in filteredUpcoming" :key="u.id">
                <td>
                  <div class="font-medium">{{ u.course_name || "—" }}</div>
                  <div v-if="u.course_code" class="text-xs text-gray-400">{{ u.course_code }}</div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="avatar-sm">{{ getInitials(u.trainer_name || 'NA') }}</div>
                    <span>{{ u.trainer_name || "—" }}</span>
                  </div>
                </td>
                <td><span class="font-medium">{{ fmtDate(u.schedule_date) }}</span></td>
                <td><span class="text-gray-500">{{ fmtTime(u.start_time, u.end_time) }}</span></td>
                <td><span :class="statusPill(u.status)">{{ u.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Recent Activity</h3>
          <span class="panel-tag">Showing {{ paginatedRecent.length }} of {{ filteredRecent.length }}</span>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paginatedRecent.length === 0">
                <td colspan="4" class="empty-cell">No activity found</td>
              </tr>
              <tr v-for="r in paginatedRecent" :key="r.id">
                <td>
                  <div class="font-medium">{{ r.course_name || "—" }}</div>
                </td>
                <td><span :class="statusPill(r.status)">{{ r.status }}</span></td>
                <td>
                  <div>{{ fmtDate(r.schedule_date) }}</div>
                  <div class="text-xs text-gray-400">{{ fmtTime(r.start_time, r.end_time) }}</div>
                </td>
                <td><span class="text-gray-500">{{ fmtDateTime(r.created_at) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredRecent.length > 0" class="pagination-bar">
          <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
          <div class="page-btns">
            <button @click="page--" :disabled="page <= 1" class="pg-btn" :class="{ 'pg-disabled': page <= 1 }">Prev</button>
            <button
              v-for="p in pagesToShow"
              :key="p"
              @click="page = p"
              class="pg-btn"
              :class="{ 'pg-active': p === page }"
            >
              {{ p }}
            </button>
            <button @click="page++" :disabled="page >= totalPages" class="pg-btn" :class="{ 'pg-disabled': page >= totalPages }">Next</button>
          </div>
        </div>
      </div>
    </div>
  </StudentLayoutTesda>
</template>

<script>
import axios from "axios";
import StudentLayoutTesda from "./StudentLayoutTesda.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

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
      currentEnrollment: null,
      upcoming: [],
      topCourses: [],
      certificates: { issued: 0 },
      attendance: {
        comingSoon: false,
        totalSessions: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        unmarked: 0,
        rate: 0,
      },
      recent: [],
    };
  },

  computed: {
    upcomingCount() {
      return this.upcoming.length;
    },

    filteredUpcoming() {
      if (!this.searchQuery) return this.upcoming;
      const q = this.searchQuery.toLowerCase();
      return this.upcoming.filter(
        (u) =>
          (u.course_name || "").toLowerCase().includes(q) ||
          (u.trainer_name || "").toLowerCase().includes(q) ||
          (u.status || "").toLowerCase().includes(q)
      );
    },

    filteredRecent() {
      const q = (this.searchQuery || "").trim().toLowerCase();
      if (!q) return this.recent;
      return this.recent.filter(
        (r) =>
          (r.course_name || "").toLowerCase().includes(q) ||
          (r.status || "").toLowerCase().includes(q)
      );
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

  async mounted() {
    this.loadLocalUser();
    await this.fetchDashboard();
    window.addEventListener("user-updated", this.handleUserUpdate);
  },

  beforeUnmount() {
    window.removeEventListener("user-updated", this.handleUserUpdate);
  },

  methods: {
    handleUserUpdate(event) {
      const u = event.detail || {};
      if (u.fullname || u.username) {
        this.studentName = u.fullname || u.username || this.studentName;
        this.userInitial = (this.studentName || "S").charAt(0).toUpperCase();
      }
    },

    loadLocalUser() {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        if (u.fullname || u.username) {
          this.studentName = u.fullname || u.username || this.studentName;
          this.userInitial = (this.studentName || "S").charAt(0).toUpperCase();
        }
      } catch (e) {
        //
      }
    },

    getInitials(name) {
      const s = String(name || '').trim();
      if (!s || s === "—") return "NA";
      return s.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    },

    async fetchDashboard() {
      try {
        const res = await api.get("/tesda/dashboard/summary");

        if (res.data?.status !== "success") return;

        const d = res.data.data || {};
        const u = d.user || null;

        if (u?.fullname || u?.username) {
          this.studentName = u.fullname || u.username || this.studentName;
          this.userInitial = (this.studentName || "S").charAt(0).toUpperCase();
        }

        this.stats = d.stats || this.stats;
        this.currentEnrollment = d.currentEnrollment || null;
        this.upcoming = d.upcoming || [];
        this.topCourses = d.topCourses || [];
        this.certificates = d.certificates || this.certificates;
        this.recent = d.recent || [];

        if (d.attendance) {
          this.attendance = {
            comingSoon: false,
            totalSessions: Number(d.attendance.totalSessions || 0),
            present: Number(d.attendance.present || 0),
            late: Number(d.attendance.late || 0),
            absent: Number(d.attendance.absent || 0),
            excused: Number(d.attendance.excused || 0),
            unmarked: Number(d.attendance.unmarked || 0),
            rate: Number(d.attendance.rate || 0),
          };
        }
      } catch (e) {
        console.error("fetchTesdaDashboard error:", e);
      }
    },

    go(path) {
      if (this.$router) this.$router.push(path);
    },

    fmtDate(d) {
      if (!d) return "—";
      const clean = String(d).substring(0, 10);
      const [y, m, day] = clean.split("-").map(Number);
      if (!y || !m || !day) return clean;
      const dt = new Date(y, m - 1, day);
      return dt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    },

    fmtDateTime(d) {
      if (!d) return "—";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return String(d);
      return dt.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    fmtTime(start, end) {
      if (!start && !end) return "—";
      const fmt = (t) => (t ? String(t).slice(0, 5) : "?");
      return `${fmt(start)} - ${fmt(end)}`;
    },

    statusPill(st) {
      const s = (st || "").toUpperCase();
      if (["CONFIRMED", "APPROVED", "ACTIVE", "ENROLLED"].includes(s))
        return "pill pill-green";
      if (s === "PENDING")
        return "pill pill-amber";
      if (["DONE", "COMPLETED", "FINISHED"].includes(s))
        return "pill pill-blue";
      if (s === "CANCELLED")
        return "pill pill-red";
      return "pill pill-gray";
    },
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.dashboard-wrapper {
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== HEADER ===== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 380px;
}

.search-icon-svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
}

.search-input-modern {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  color: #111827 !important;
  background: #fff !important;
}

.search-input-modern:focus {
  border-color: #3b82f6;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.refresh-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== PAGE TOP ===== */
.page-top {
  margin-bottom: 4px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.page-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 4px 0 0;
}

/* ===== STATS ROW ===== */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.stat-card-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-top: 6px;
}

.stat-detail {
  font-size: 0.68rem;
  color: #6b7280;
  margin-top: 4px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }

.text-emerald { color: #059669; }
.text-blue { color: #2563eb; }
.text-amber { color: #d97706; }
.text-purple { color: #7c3aed; }
.text-red-500 { color: #ef4444; }

/* ===== QUICK LINKS ===== */
.quick-links-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.quick-link-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
  border-color: #3b82f6;
}

.quick-link-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-link-icon-blue { background: #dbeafe; color: #2563eb; }
.quick-link-icon-green { background: #d1fae5; color: #059669; }
.quick-link-icon-purple { background: #ede9fe; color: #7c3aed; }
.quick-link-icon-amber { background: #fef3c7; color: #d97706; }

.quick-link-info {
  display: flex;
  flex-direction: column;
}

.quick-link-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
}

.quick-link-desc {
  font-size: 0.72rem;
  color: #6b7280;
  margin-top: 2px;
}

/* ===== PANEL CARD ===== */
.panel-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.panel-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.panel-action-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #3b82f6;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.panel-action-link:hover {
  color: #2563eb;
}

.panel-tag {
  font-size: 0.72rem;
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 500;
}

/* ===== ATTENDANCE ===== */
.attendance-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px 20px;
}

.attendance-stat {
  text-align: center;
  padding: 16px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.attendance-stat-green {
  border-color: #d1fae5;
  background: #f0fdf4;
}

.attendance-stat-red {
  border-color: #fecaca;
  background: #fef2f2;
}

.attendance-stat-blue {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.attendance-stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.attendance-stat-label {
  display: block;
  font-size: 0.72rem;
  color: #6b7280;
  margin-top: 4px;
}

.attendance-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
}

.attendance-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.7s ease;
}

.attendance-details {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 0 20px 16px;
}

.attendance-detail {
  text-align: center;
  padding: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.attendance-detail-label {
  display: block;
  font-size: 0.7rem;
  color: #6b7280;
}

.attendance-detail-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 2px;
}

/* ===== TABLE ===== */
.table-wrap {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.modern-table th {
  text-align: left;
  padding: 11px 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid #e5e7eb;
  color: #6b7280;
  white-space: nowrap;
}

.modern-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  white-space: nowrap;
}

.modern-table tbody tr:hover {
  background: #f9fafb;
}

.thead-blue th {
  background: #3b82f6;
  color: #fff;
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 30px !important;
}

/* ===== AVATAR ===== */
.avatar-sm {
  width: 28px;
  height: 28px;
  background: #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #374151;
  flex-shrink: 0;
}

/* ===== PILLS ===== */
.pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}

.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ===== PAGINATION ===== */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-wrap: wrap;
  gap: 10px;
}

.page-info {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.page-btns {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pg-btn {
  padding: 7px 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.pg-btn:hover:not(.pg-disabled):not(.pg-active) {
  border-color: #3b82f6;
  color: #2563eb;
}

.pg-active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.pg-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .attendance-grid,
  .attendance-details {
    grid-template-columns: repeat(2, 1fr);
  }

  .quick-links-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .quick-links-row {
    grid-template-columns: 1fr;
  }
}
</style>