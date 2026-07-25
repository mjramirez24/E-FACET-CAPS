<template>
  <TrainerLayout>
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search students..."
            v-model="searchQuery"
            class="search-input-modern"
          />
        </div>
        <button @click="fetchSheet" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="attendance-wrapper">
      <div class="page-top">
        <div>
          <h2 class="page-title">Trainer Attendance</h2>
          <p class="page-subtitle">Mark and manage student attendance records</p>
        </div>
        <div class="page-actions">
          <div class="date-picker-group">
            <label class="filter-label-sm">Date</label>
            <input type="date" v-model="selectedDate" class="select-modern-sm" />
          </div>
          <button @click="markAll('present')" class="btn-outline-sm btn-outline-green">Mark All Present</button>
          <button @click="saveAttendance" class="btn-primary-sm">Save Attendance</button>
          <button @click="exportExcel()" class="btn-outline-sm">Export Excel</button>
          <button @click="exportPdf()" class="btn-outline-sm btn-outline-red">Export PDF</button>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="errorMsg" class="error-banner">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errorMsg }}</span>
      </div>
      <div v-if="successMsg" class="success-banner">
        <svg class="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ successMsg }}</span>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ stats.present }}</span>
              <span class="stat-label">Present</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-amber">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-amber">{{ stats.late }}</span>
              <span class="stat-label">Late</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-red">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-red-500">{{ stats.absent }}</span>
              <span class="stat-label">Absent</span>
            </div>
            <div class="stat-icon stat-icon-red">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-gray">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-gray-500">{{ stats.unmarked }}</span>
              <span class="stat-label">Unmarked</span>
            </div>
            <div class="stat-icon stat-icon-gray">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="selectedStatus" class="select-modern">
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="unmarked">Unmarked</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Course</label>
          <select v-model="selectedCourse" class="select-modern">
            <option value="">All Courses</option>
            <option v-for="c in courses" :key="c.course_id" :value="String(c.course_id)">{{ c.course_name }}</option>
          </select>
        </div>
        <div class="filter-group ml-auto">
          <label class="filter-label">Sort By</label>
          <select v-model="sortBy" class="select-modern">
            <option value="name">Name A-Z</option>
            <option value="nameDesc">Name Z-A</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div class="filter-actions">
          <button @click="clearFilters" class="btn-outline-sm">Clear</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-gray-500">Loading attendance...</p>
      </div>

      <!-- Table -->
      <div v-else class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Attendance Sheet</h3>
          <span class="panel-tag">Date: {{ prettyDate }}</span>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in filteredStudents" :key="s.student_id">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="avatar-sm bg-blue-100 text-blue-700">{{ getInitials(s.fullname) }}</div>
                    <div>
                      <div class="font-medium">{{ s.fullname }}</div>
                      <div class="text-xs text-gray-400">{{ s.username || s.email || "—" }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="font-medium">{{ s.course_name || "—" }}</div>
                  <div class="text-xs text-gray-400">Code: {{ s.course_code || "—" }}</div>
                </td>
                <td>
                  <span :class="getStatusPillClass(getRow(s.student_id).status)">{{ getRow(s.student_id).status }}</span>
                </td>
                <td>
                  <input
                    type="text"
                    v-model="getRow(s.student_id).remarks"
                    placeholder="e.g., traffic / sick"
                    class="remarks-input"
                  />
                </td>
                <td>
                  <div class="action-btns">
                    <button @click="setStatus(s.student_id, 'present')" class="action-present">Present</button>
                    <button @click="setStatus(s.student_id, 'late')" class="action-late">Late</button>
                    <button @click="setStatus(s.student_id, 'absent')" class="action-absent">Absent</button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredStudents.length === 0">
                <td colspan="5" class="empty-cell">No students found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer-bar">
          <span>Showing {{ filteredStudents.length }} of {{ students.length }} students</span>
        </div>
      </div>

      <!-- Attendance History -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <div class="flex items-center gap-2">
            <h3 class="panel-title">Attendance History</h3>
            <span class="panel-tag">saved days</span>
          </div>
          <button @click="historyOpen = !historyOpen" class="btn-outline-sm">
            {{ historyOpen ? "Hide" : "Show" }}
          </button>
        </div>

        <div v-if="historyOpen" class="panel-body">
          <!-- History Search -->
          <div class="history-search-row">
            <input v-model="historySearch" placeholder="Search date (YYYY-MM-DD)" class="select-modern" style="max-width: 240px;" />
            <button @click="fetchHistory(1)" class="btn-outline-sm">Search</button>
            <div class="ml-auto flex gap-2">
              <button class="pg-btn" :class="{ 'pg-disabled': historyMeta.page <= 1 }" :disabled="historyMeta.page <= 1" @click="fetchHistory(historyMeta.page - 1)">Prev</button>
              <button class="pg-btn" :class="{ 'pg-disabled': historyMeta.page >= historyMeta.totalPages }" :disabled="historyMeta.page >= historyMeta.totalPages" @click="fetchHistory(historyMeta.page + 1)">Next</button>
            </div>
          </div>

          <!-- History Loading -->
          <div v-if="historyLoading" class="loading-state-sm">Loading history...</div>

          <!-- History Table -->
          <div v-else class="table-wrap">
            <table class="modern-table">
              <thead class="thead-blue">
                <tr>
                  <th>Date</th>
                  <th>Present</th>
                  <th>Late</th>
                  <th>Absent</th>
                  <th>Unmarked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in historyRows" :key="d.attendance_date">
                  <td><span class="font-medium">{{ d.attendance_date }}</span></td>
                  <td><span class="text-emerald font-semibold">{{ d.present }}</span></td>
                  <td><span class="text-amber font-semibold">{{ d.late }}</span></td>
                  <td><span class="text-red-500 font-semibold">{{ d.absent }}</span></td>
                  <td><span class="text-gray-500">{{ d.unmarked }}</span></td>
                  <td>
                    <button @click="loadHistoryDate(d.attendance_date)" class="action-view-sm">View</button>
                  </td>
                </tr>
                <tr v-if="historyRows.length === 0">
                  <td colspan="6" class="empty-cell">No history found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="history-meta">
            Page {{ historyMeta.page }} of {{ historyMeta.totalPages }} | Total {{ historyMeta.total }}
          </div>

          <!-- History Details -->
          <div v-if="historyDetailsDate" class="history-details">
            <div class="history-details-header">
              <h4 class="text-sm font-bold text-gray-800">Details: {{ historyDetailsDate }}</h4>
              <div class="flex gap-2">
                <button @click="exportExcel(historyDetailsDate)" class="btn-outline-sm">Export Excel</button>
                <button @click="exportPdf(historyDetailsDate)" class="btn-outline-sm">Export PDF</button>
              </div>
            </div>

            <div class="table-wrap">
              <table class="modern-table">
                <thead class="thead-gray">
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in historyDetailsRows" :key="r.student_id">
                    <td>
                      <div class="font-medium">{{ r.fullname }}</div>
                      <div class="text-xs text-gray-400">{{ r.username || r.email || "—" }}</div>
                    </td>
                    <td>
                      <div>{{ r.course_name || "—" }}</div>
                      <div class="text-xs text-gray-400">{{ r.course_code || "" }}</div>
                    </td>
                    <td><span :class="getStatusPillClass(r.status)">{{ r.status }}</span></td>
                    <td><span class="text-gray-600">{{ r.remarks || "—" }}</span></td>
                  </tr>
                  <tr v-if="historyDetailsRows.length === 0">
                    <td colspan="4" class="empty-cell">No rows for that date</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TrainerLayout>
</template>

<script>
import { ref, computed, reactive, watch, onMounted } from "vue";
import axios from "axios";
import TrainerLayout from "./TrainerLayout.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const API_BASE = API_URL.replace("/api", "");

export default {
  name: "TrainerAttendance",
  components: { TrainerLayout },
  setup() {
    const searchQuery = ref("");
    const selectedStatus = ref("");
    const selectedCourse = ref("");
    const sortBy = ref("name");
    const selectedDate = ref(new Date().toISOString().slice(0, 10));

    const loading = ref(true);
    const errorMsg = ref("");
    const successMsg = ref("");

    const students = ref([]);
    const courses = ref([]);

    const attendanceMap = reactive({});
    const stats = ref({ present: 0, late: 0, absent: 0, unmarked: 0 });

    const toYMD = (v) => {
      if (!v) return "";
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
      return d.toISOString().slice(0, 10);
    };

    const sheetCourseId = computed(() => {
      const v = Number(selectedCourse.value);
      return Number.isFinite(v) && v > 0 ? v : "";
    });

    const getRow = (id) => {
      const key = String(id);
      if (!attendanceMap[key]) attendanceMap[key] = { status: "unmarked", remarks: "" };
      return attendanceMap[key];
    };

    const prettyDate = computed(() => {
      try {
        const d = new Date(selectedDate.value);
        return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
      } catch {
        return selectedDate.value;
      }
    });

    const getInitials = (name) => {
      const n = String(name || "").trim();
      if (!n) return "S";
      return n.split(" ").filter(Boolean).map((x) => x[0]).join("").toUpperCase().slice(0, 2);
    };

    const getStatusPillClass = (status) => {
      const s = String(status || "").toLowerCase();
      if (s === "present") return "pill pill-green";
      if (s === "late") return "pill pill-amber";
      if (s === "absent") return "pill pill-red";
      return "pill pill-gray";
    };

    const recomputeStats = () => {
      const counts = { present: 0, late: 0, absent: 0, unmarked: 0 };
      for (const s of students.value) {
        const st = String(getRow(s.student_id).status || "unmarked").toLowerCase();
        if (counts[st] !== undefined) counts[st] += 1;
        else counts.unmarked += 1;
      }
      stats.value = counts;
    };

    const setStatus = (studentId, status) => {
      getRow(studentId).status = status;
      recomputeStats();
    };

    const markAll = (status) => {
      for (const s of students.value) getRow(s.student_id).status = status;
      recomputeStats();
    };

    const filteredStudents = computed(() => {
      let result = [...students.value];
      const q = (searchQuery.value || "").toLowerCase().trim();
      if (q) {
        result = result.filter(
          (s) =>
            String(s.fullname || "").toLowerCase().includes(q) ||
            String(s.username || "").toLowerCase().includes(q) ||
            String(s.course_name || "").toLowerCase().includes(q) ||
            String(s.course_code || "").toLowerCase().includes(q),
        );
      }
      if (selectedCourse.value) {
        result = result.filter((s) => String(s.course_id) === String(selectedCourse.value));
      }
      if (selectedStatus.value) {
        result = result.filter((s) => getRow(s.student_id).status === selectedStatus.value);
      }
      result.sort((a, b) => {
        const an = String(a.fullname || "");
        const bn = String(b.fullname || "");
        switch (sortBy.value) {
          case "name": return an.localeCompare(bn);
          case "nameDesc": return bn.localeCompare(an);
          case "status": {
            const sa = String(getRow(a.student_id).status || "unmarked");
            const sb = String(getRow(b.student_id).status || "unmarked");
            return sa.localeCompare(sb) || an.localeCompare(bn);
          }
          default: return 0;
        }
      });
      return result;
    });

    const clearFilters = () => {
      searchQuery.value = "";
      selectedStatus.value = "";
      selectedCourse.value = "";
    };

    const fetchSheet = async () => {
      loading.value = true;
      errorMsg.value = "";
      try {
        const res = await api.get("/trainer/tesda/attendance", {
          params: { date: toYMD(selectedDate.value), course_id: sheetCourseId.value, q: searchQuery.value || "" },
        });
        const data = res.data?.data || {};
        const rows = Array.isArray(data.students) ? data.students : [];
        const map = data.attendanceMap || {};
        students.value = rows.map((r) => ({
          student_id: Number(r.student_id),
          fullname: r.fullname || "Student",
          username: r.username || "",
          email: r.email || "",
          course_id: Number(r.course_id || 0),
          course_name: r.course_name || "—",
          course_code: r.course_code || "",
        }));
        courses.value = [
          ...new Map(
            students.value.filter((s) => s.course_id > 0).map((s) => [String(s.course_id), { course_id: s.course_id, course_name: s.course_name }]),
          ).values(),
        ].sort((a, b) => String(a.course_name).localeCompare(String(b.course_name)));
        for (const k of Object.keys(attendanceMap)) delete attendanceMap[k];
        for (const s of students.value) {
          const key = String(s.student_id);
          const row = map[key] || {};
          attendanceMap[key] = { status: String(row.status || "unmarked").toLowerCase(), remarks: row.remarks || "" };
        }
        recomputeStats();
      } catch (err) {
        console.error("fetchSheet error:", err);
        students.value = [];
        courses.value = [];
        for (const k of Object.keys(attendanceMap)) delete attendanceMap[k];
        stats.value = { present: 0, late: 0, absent: 0, unmarked: 0 };
        errorMsg.value = err.response?.data?.message || "Failed to load attendance";
      } finally {
        loading.value = false;
      }
    };

    const saveAttendance = async () => {
      errorMsg.value = "";
      successMsg.value = "";
      try {
        const payloadRows = students.value.map((s) => {
          const row = getRow(s.student_id);
          const st = String(row.status || "unmarked").toLowerCase();
          return {
            student_id: s.student_id,
            status: ["present", "late", "absent", "unmarked"].includes(st) ? st : "unmarked",
            remarks: String(row.remarks || "").slice(0, 255),
            course_id: s.course_id || null,
            course_name: s.course_name || null,
            course_code: s.course_code || null,
          };
        });
        const d = toYMD(selectedDate.value);
        const resp = await api.post("/trainer/tesda/attendance", { date: d, rows: payloadRows });
        successMsg.value = `Attendance saved (saved: ${resp.data?.data?.saved || 0})`;
        setTimeout(() => (successMsg.value = ""), 2500);
        await fetchSheet();
        if (historyOpen.value) fetchHistory(1);
      } catch (err) {
        console.error("saveAttendance error:", err);
        errorMsg.value = err.response?.data?.message || "Failed to save attendance";
      }
    };

    const exportExcel = (dateOverride) => {
      const d = toYMD(dateOverride || selectedDate.value);
      window.open(`${API_BASE}/api/trainer/tesda/attendance/export/excel?date=${encodeURIComponent(d)}`, "_blank");
    };
    const exportPdf = (dateOverride) => {
      const d = toYMD(dateOverride || selectedDate.value);
      window.open(`${API_BASE}/api/trainer/tesda/attendance/export/pdf?date=${encodeURIComponent(d)}`, "_blank");
    };

    const historyOpen = ref(false);
    const historyLoading = ref(false);
    const historySearch = ref("");
    const historyRows = ref([]);
    const historyMeta = ref({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const historyDetailsDate = ref("");
    const historyDetailsRows = ref([]);

    const fetchHistory = async (page = 1) => {
      historyLoading.value = true;
      try {
        const res = await api.get("/trainer/tesda/attendance/history", {
          params: { page, limit: historyMeta.value.limit, q: historySearch.value || "" },
        });
        const rows = res.data?.data || [];
        historyRows.value = rows.map((r) => ({ ...r, attendance_date: toYMD(r.attendance_date) }));
        historyMeta.value = res.data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 };
      } catch (err) {
        console.error("fetchHistory error:", err);
        historyRows.value = [];
      } finally {
        historyLoading.value = false;
      }
    };

    const loadHistoryDate = async (date) => {
      const d = toYMD(date);
      historyDetailsDate.value = d;
      historyDetailsRows.value = [];
      try {
        const res = await api.get(`/trainer/tesda/attendance/history/${encodeURIComponent(d)}`);
        historyDetailsRows.value = (res.data?.data || []).map((r) => ({ ...r, status: String(r.status || "unmarked").toLowerCase() }));
      } catch (err) {
        console.error("loadHistoryDate error:", err);
        historyDetailsRows.value = [];
      }
    };

    watch(selectedDate, () => fetchSheet());
    watch(selectedCourse, () => fetchSheet());
    watch(historyOpen, (v) => { if (v) fetchHistory(1); });

    onMounted(fetchSheet);

    return {
      searchQuery, selectedStatus, selectedCourse, sortBy, selectedDate, prettyDate,
      loading, errorMsg, successMsg,
      students, courses, stats, attendanceMap,
      getRow, getInitials, getStatusPillClass, setStatus, markAll, clearFilters,
      fetchSheet, saveAttendance, filteredStudents,
      exportExcel, exportPdf,
      historyOpen, historyLoading, historySearch, historyRows, historyMeta,
      fetchHistory, loadHistoryDate, historyDetailsDate, historyDetailsRows,
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
.page-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.page-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; }
.date-picker-group { display: flex; flex-direction: column; gap: 4px; }
.filter-label-sm { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
.select-modern-sm { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.78rem; color: #374151; background: #fff; outline: none; }
.select-modern-sm:focus { border-color: #3b82f6; }

/* ===== MESSAGES ===== */
.error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; }
.success-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 12px; color: #059669; font-size: 0.85rem; }

/* ===== STATS ROW ===== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-red { background: #fee2e2; color: #dc2626; }
.stat-icon-gray { background: #f3f4f6; color: #6b7280; }
.text-emerald { color: #059669; } .text-amber { color: #d97706; } .text-red-500 { color: #ef4444; } .text-gray-500 { color: #6b7280; }

/* ===== FILTERS BAR ===== */
.filters-bar { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
.select-modern { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; background: #fff; color: #111827; min-width: 140px; }
.select-modern:focus { border-color: #3b82f6; }
.ml-auto { margin-left: auto; }
.filter-actions { display: flex; gap: 8px; align-items: flex-end; }

/* ===== BUTTONS ===== */
.btn-primary-sm { padding: 9px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-primary-sm:hover { background: #2563eb; }
.btn-outline-sm { padding: 9px 16px; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-outline-sm:hover { background: #f3f4f6; }
.btn-outline-green { border-color: #d1fae5; color: #059669; }
.btn-outline-green:hover { background: #f0fdf4; }
.btn-outline-red { border-color: #fecaca; color: #dc2626; }
.btn-outline-red:hover { background: #fef2f2; }

/* ===== PANEL CARD ===== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-tag { font-size: 0.72rem; padding: 4px 10px; background: #f3f4f6; border-radius: 8px; color: #6b7280; font-weight: 500; }
.panel-body { padding: 20px; }

/* ===== TABLE ===== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.thead-gray th { background: #6b7280; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.table-footer-bar { padding: 12px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; font-size: 0.75rem; color: #6b7280; }

.avatar-sm { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
.remarks-input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.8rem; outline: none; }
.remarks-input:focus { border-color: #3b82f6; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ===== ACTION BUTTONS ===== */
.action-btns { display: flex; gap: 4px; }
.action-present { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; background: #d1fae5; color: #059669; border: 1px solid #a7f3d0; cursor: pointer; transition: all 0.15s; }
.action-present:hover { background: #a7f3d0; }
.action-late { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; background: #fef3c7; color: #d97706; border: 1px solid #fde68a; cursor: pointer; transition: all 0.15s; }
.action-late:hover { background: #fde68a; }
.action-absent { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; cursor: pointer; transition: all 0.15s; }
.action-absent:hover { background: #fecaca; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }

/* ===== HISTORY ===== */
.history-search-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 16px; }
.history-meta { font-size: 0.75rem; color: #6b7280; margin-top: 12px; }
.history-details { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
.history-details-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }

/* ===== PAGINATION ===== */
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #3b82f6; color: #2563eb; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ===== LOADING ===== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.loading-state-sm { text-align: center; padding: 20px; color: #9ca3af; font-size: 0.85rem; }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>