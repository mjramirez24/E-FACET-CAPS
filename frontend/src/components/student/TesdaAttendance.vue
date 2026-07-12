<template>
  <StudentLayoutTesda active-page="attendance">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search attendance..."
            class="search-input-modern"
          />
        </div>
        <button @click="fetchAttendance" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="attendance-wrapper">
      <div class="page-top">
        <h2 class="page-title">Training Attendance</h2>
        <p class="page-subtitle">View your attendance records and track your progress</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ attendanceStats.totalTrainings }}</span>
              <span class="stat-label">Total Trainings</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ attendanceStats.present }}</span>
              <span class="stat-label">Present</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-red">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-red-500">{{ attendanceStats.absent }}</span>
              <span class="stat-label">Absent</span>
            </div>
            <div class="stat-icon stat-icon-red">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-purple">{{ attendanceStats.attendanceRate }}%</span>
              <span class="stat-label">Attendance Rate</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Training</label>
          <select v-model="selectedTraining" class="select-modern">
            <option value="">All Trainings</option>
            <option v-for="training in trainings" :key="training" :value="training">{{ training }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="selectedStatus" class="select-modern">
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
            <option value="unmarked">Unmarked</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Month</label>
          <input v-model="selectedMonth" type="month" class="select-modern" />
        </div>
        <div class="filter-actions">
          <button @click="clearFilters" class="btn-outline-sm">Clear</button>
          <button @click="exportAttendance" class="btn-primary-sm">Export</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-gray-500">Loading attendance records...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="error-banner">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Attendance Table -->
      <div v-else class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Attendance Records</h3>
          <span class="panel-tag">Showing {{ paginatedAttendance.length }} of {{ filteredAttendance.length }} records</span>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Date</th>
                <th>Training</th>
                <th>Time</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in paginatedAttendance" :key="record.id">
                <td>
                  <div class="font-medium">{{ formatDate(record.date) }}</div>
                  <div class="text-xs text-gray-400">{{ formatDay(record.date) }}</div>
                </td>
                <td>
                  <div class="font-medium">{{ record.training }}</div>
                  <div class="text-xs text-gray-400">{{ record.course_code || record.trainer }}</div>
                </td>
                <td><span class="text-gray-600">{{ record.time }}</span></td>
                <td><span :class="getStatusPillClass(record.status)">{{ formatStatus(record.status) }}</span></td>
                <td><span class="text-sm text-gray-700">{{ record.remarks || '—' }}</span></td>
                <td>
                  <button @click="openDetails(record)" class="action-view-sm">Details</button>
                </td>
              </tr>
              <tr v-if="paginatedAttendance.length === 0">
                <td colspan="6" class="empty-cell">No attendance records found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="filteredAttendance.length > 0" class="pagination-bar">
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }} | {{ filteredAttendance.length }} records</span>
          <div class="page-btns">
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="pg-btn" :class="{ 'pg-disabled': currentPage === 1 }">Prev</button>
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              class="pg-btn"
              :class="{ 'pg-active': page === currentPage }"
            >
              {{ page }}
            </button>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages || totalPages === 0" class="pg-btn" :class="{ 'pg-disabled': currentPage === totalPages || totalPages === 0 }">Next</button>
          </div>
        </div>
      </div>

      <!-- Attendance Summary -->
      <div class="summary-grid">
        <div class="panel-card">
          <div class="panel-header-bar">
            <h3 class="panel-title">Monthly Overview</h3>
          </div>
          <div class="panel-body">
            <div v-if="monthlySummary.length === 0" class="text-sm text-gray-400 py-4 text-center">No monthly summary available yet.</div>
            <div v-else class="summary-list">
              <div v-for="month in monthlySummary" :key="month.monthKey" class="summary-item">
                <span class="summary-month">{{ month.month }}</span>
                <div class="summary-bar-wrapper">
                  <div class="summary-bar">
                    <div
                      class="summary-bar-fill"
                      :class="month.rate >= 90 ? 'bg-green-500' : month.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'"
                      :style="{ width: `${month.rate}%` }"
                    ></div>
                  </div>
                  <span class="summary-rate">{{ month.rate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-header-bar">
            <h3 class="panel-title">Status Distribution</h3>
          </div>
          <div class="panel-body">
            <div class="distribution-list">
              <div class="distribution-item">
                <div class="flex items-center gap-2">
                  <div class="distribution-dot bg-green-500"></div>
                  <span class="text-sm text-gray-700">Present</span>
                </div>
                <span class="text-sm font-semibold">{{ attendanceStats.present }} records</span>
              </div>
              <div class="distribution-item">
                <div class="flex items-center gap-2">
                  <div class="distribution-dot bg-yellow-500"></div>
                  <span class="text-sm text-gray-700">Late</span>
                </div>
                <span class="text-sm font-semibold">{{ attendanceStats.late }} records</span>
              </div>
              <div class="distribution-item">
                <div class="flex items-center gap-2">
                  <div class="distribution-dot bg-red-500"></div>
                  <span class="text-sm text-gray-700">Absent</span>
                </div>
                <span class="text-sm font-semibold">{{ attendanceStats.absent }} records</span>
              </div>
              <div class="distribution-item">
                <div class="flex items-center gap-2">
                  <div class="distribution-dot bg-blue-500"></div>
                  <span class="text-sm text-gray-700">Excused</span>
                </div>
                <span class="text-sm font-semibold">{{ attendanceStats.excused }} records</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <transition name="modal-fade">
      <div v-if="selectedRecord" class="modal-overlay" @click.self="selectedRecord = null">
        <transition name="modal-scale">
          <div class="modal-card">
            <div class="modal-head modal-head-blue">
              <h3 class="modal-title">Attendance Details</h3>
              <button class="modal-close-btn" @click="selectedRecord = null">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">{{ formatDate(selectedRecord.date) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Day</span>
                  <span class="detail-value">{{ formatDay(selectedRecord.date) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Training</span>
                  <span class="detail-value">{{ selectedRecord.training }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Course Code</span>
                  <span class="detail-value">{{ selectedRecord.course_code || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Time</span>
                  <span class="detail-value">{{ selectedRecord.time }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status</span>
                  <span :class="getStatusPillClass(selectedRecord.status)">{{ formatStatus(selectedRecord.status) }}</span>
                </div>
                <div class="detail-item detail-item-full">
                  <span class="detail-label">Trainer</span>
                  <span class="detail-value">{{ selectedRecord.trainer }}</span>
                </div>
                <div class="detail-item detail-item-full">
                  <span class="detail-label">Remarks</span>
                  <span class="detail-value whitespace-pre-line">{{ selectedRecord.remarks || '—' }}</span>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="selectedRecord = null" class="btn-cancel">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </StudentLayoutTesda>
</template>

<script>
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";
import StudentLayoutTesda from "./StudentLayoutTesda.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "TesdaStudentAttendance",
  components: { StudentLayoutTesda },

  setup() {
    const loading = ref(true);
    const errorMessage = ref("");
    const searchQuery = ref("");
    const selectedTraining = ref("");
    const selectedStatus = ref("");
    const selectedMonth = ref("");
    const lastUpdated = ref("");
    const selectedRecord = ref(null);

    const currentPage = ref(1);
    const perPage = ref(10);

    const attendanceRecords = ref([]);
    const trainings = ref([]);
    const monthlySummary = ref([]);

    const attendanceStats = ref({
      totalTrainings: 0,
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      unmarked: 0,
      attendanceRate: 0,
    });

    const formattedLastUpdated = computed(() => {
      if (!lastUpdated.value) return "—";
      const d = new Date(lastUpdated.value);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleString("en-PH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      });
    });

    const filteredAttendance = computed(() => {
      let rows = [...attendanceRecords.value];
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim();
        rows = rows.filter((r) =>
          [r.training, r.course_code, r.time, r.status, r.remarks, r.trainer, r.date]
            .join(" ").toLowerCase().includes(q)
        );
      }
      if (selectedTraining.value) rows = rows.filter((r) => r.training === selectedTraining.value);
      if (selectedStatus.value) rows = rows.filter((r) => r.status === selectedStatus.value);
      if (selectedMonth.value) rows = rows.filter((r) => String(r.date).slice(0, 7) === selectedMonth.value);
      return rows;
    });

    const totalPages = computed(() => {
      const total = Math.ceil(filteredAttendance.value.length / perPage.value);
      return total > 0 ? total : 1;
    });

    const paginatedAttendance = computed(() => {
      const start = (currentPage.value - 1) * perPage.value;
      return filteredAttendance.value.slice(start, start + perPage.value);
    });

    const visiblePages = computed(() => {
      const pages = [];
      const total = totalPages.value;
      let start = Math.max(1, currentPage.value - 2);
      let end = Math.min(total, currentPage.value + 2);
      if (currentPage.value <= 3) end = Math.min(total, 5);
      if (currentPage.value >= total - 2) start = Math.max(1, total - 4);
      for (let i = start; i <= end; i += 1) pages.push(i);
      return pages;
    });

    watch([searchQuery, selectedTraining, selectedStatus, selectedMonth], () => { currentPage.value = 1; });
    watch(filteredAttendance, () => { if (currentPage.value > totalPages.value) currentPage.value = totalPages.value; });

    const fetchAttendance = async () => {
      loading.value = true;
      errorMessage.value = "";
      try {
        const res = await api.get("/tesda/attendance");
        const payload = res?.data?.data || {};
        attendanceRecords.value = Array.isArray(payload.records) ? payload.records : [];
        trainings.value = Array.isArray(payload.trainings) ? payload.trainings : [];
        monthlySummary.value = Array.isArray(payload.monthlySummary) ? payload.monthlySummary : [];
        attendanceStats.value = payload.stats || {
          totalTrainings: 0, present: 0, late: 0, absent: 0, excused: 0, unmarked: 0, attendanceRate: 0,
        };
        lastUpdated.value = payload.lastUpdated || new Date().toISOString();
      } catch (err) {
        console.error("fetchAttendance error:", err);
        errorMessage.value = err?.response?.data?.message || "Failed to load attendance records.";
      } finally {
        loading.value = false;
      }
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedTraining.value = "";
      selectedStatus.value = "";
      selectedMonth.value = "";
      currentPage.value = 1;
    };

    const exportAttendance = () => {
      const rows = filteredAttendance.value;
      const headers = ["Date", "Training", "Course Code", "Time", "Status", "Remarks", "Trainer"];
      const csvRows = [
        headers.join(","),
        ...rows.map((r) =>
          [r.date, r.training, r.course_code || "", r.time || "", formatStatus(r.status), r.remarks || "", r.trainer || ""]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute("download", `tesda-attendance-${stamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    const openDetails = (record) => { selectedRecord.value = record; };
    const goToPage = (page) => { if (page < 1 || page > totalPages.value) return; currentPage.value = page; };

    const formatDate = (date) => {
      if (!date) return "—";
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return date;
      return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
    };

    const formatDay = (date) => {
      if (!date) return "—";
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-PH", { weekday: "long" });
    };

    const formatStatus = (status) => {
      const s = String(status || "").toLowerCase();
      if (!s) return "Unknown";
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const getStatusPillClass = (status) => {
      const s = String(status || "").toLowerCase();
      if (s === "present") return "pill pill-green";
      if (s === "late") return "pill pill-amber";
      if (s === "absent") return "pill pill-red";
      if (s === "excused") return "pill pill-blue";
      return "pill pill-gray";
    };

    onMounted(() => { fetchAttendance(); });

    return {
      loading, errorMessage, searchQuery, selectedTraining, selectedStatus, selectedMonth,
      lastUpdated, formattedLastUpdated, attendanceRecords, trainings, attendanceStats,
      monthlySummary, filteredAttendance, paginatedAttendance, currentPage, totalPages,
      visiblePages, selectedRecord, fetchAttendance, clearFilters, exportAttendance,
      openDetails, goToPage, formatDate, formatDay, formatStatus, getStatusPillClass,
    };
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.attendance-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }

/* ===== HEADER ===== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #3b82f6; }
.refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #3b82f6; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn:hover { background: #2563eb; transform: translateY(-1px); }
.refresh-icon { width: 16px; height: 16px; }
.spin-animation { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== PAGE TOP ===== */
.page-top { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

/* ===== STATS ROW ===== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-red { background: #fee2e2; color: #dc2626; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }
.text-emerald { color: #059669; } .text-blue { color: #2563eb; } .text-red-500 { color: #ef4444; } .text-purple { color: #7c3aed; }

/* ===== FILTERS BAR ===== */
.filters-bar { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
.select-modern { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; background: #fff; color: #111827; min-width: 140px; }
.select-modern:focus { border-color: #3b82f6; }
.filter-actions { display: flex; gap: 8px; align-items: flex-end; margin-left: auto; }
.btn-outline-sm { padding: 9px 16px; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-outline-sm:hover { background: #f3f4f6; }
.btn-primary-sm { padding: 9px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-primary-sm:hover { background: #2563eb; }

/* ===== PANEL CARD ===== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-tag { font-size: 0.72rem; padding: 4px 10px; background: #f3f4f6; border-radius: 8px; color: #6b7280; font-weight: 500; }
.panel-body { padding: 20px; }

/* ===== TABLE ===== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; color: #6b7280; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ===== PAGINATION ===== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled):not(.pg-active) { border-color: #3b82f6; color: #2563eb; }
.pg-active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ===== LOADING / ERROR ===== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; }

/* ===== SUMMARY ===== */
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.summary-list { display: flex; flex-direction: column; gap: 12px; }
.summary-item { display: flex; align-items: center; gap: 12px; }
.summary-month { font-size: 0.85rem; color: #374151; font-weight: 500; width: 80px; flex-shrink: 0; }
.summary-bar-wrapper { flex: 1; display: flex; align-items: center; gap: 10px; }
.summary-bar { flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.summary-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.summary-rate { font-size: 0.8rem; font-weight: 600; color: #374151; width: 40px; text-align: right; }

.distribution-list { display: flex; flex-direction: column; gap: 12px; }
.distribution-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f9fafb; border-radius: 10px; }
.distribution-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

/* ===== MODAL ===== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; }
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { padding: 12px; background: #f9fafb; border-radius: 10px; display: flex; flex-direction: column; gap: 4px; }
.detail-item-full { grid-column: span 2; }
.detail-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: #111827; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

@media (max-width: 768px) {
  .summary-grid { grid-template-columns: 1fr; }
  .filter-actions { margin-left: 0; }
}
</style>