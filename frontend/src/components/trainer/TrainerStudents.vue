<template>
  <TrainerLayout active-page="students">
    <!-- Header -->
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search student..."
            v-model="searchQuery"
            class="search-input-modern"
            @input="debouncedFetch"
          />
        </div>
        <button @click="fetchStudents(1)" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="students-wrapper">
      <div class="page-top">
        <h2 class="page-title">My Students</h2>
        <p class="page-subtitle">View and manage your enrolled students</p>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMsg" class="error-banner">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errorMsg }}</span>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="filter-item">
          <label class="filter-label">Course</label>
          <select v-model="selectedCourse" class="select-modern" @change="fetchStudents(1)">
            <option value="">All Courses</option>
            <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">Status</label>
          <select v-model="selectedStatus" class="select-modern" @change="fetchStudents(1)">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="done">Done</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="canceled">Canceled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div class="filter-item ml-auto">
          <label class="filter-label">Sort By</label>
          <select v-model="sortBy" class="select-modern" @change="fetchStudents(1)">
            <option value="name">Name A-Z</option>
            <option value="nameDesc">Name Z-A</option>
            <option value="date">Recently Enrolled</option>
            <option value="activity">Last Activity</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div class="filter-item">
          <button @click="clearFilters" class="btn-outline-sm">Clear</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-gray-500">Loading students...</p>
      </div>

      <!-- Table Panel -->
      <div v-else class="panel-card">
        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, idx) in paginatedStudents" :key="s.student_id">
                <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="avatar-sm bg-blue-100 text-blue-700">{{ getInitials(s.fullname) }}</div>
                    <div>
                      <div class="font-medium">{{ s.fullname }}</div>
                      <div class="text-xs text-gray-400">{{ s.email }}</div>
                      <div class="text-xs text-gray-400 mt-0.5">
                        Reservations: <span class="font-semibold text-gray-600">{{ s.reservations_count }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="font-medium">{{ s.course_name || "—" }}</div>
                  <div class="text-xs text-gray-400">Code: {{ s.course_code || "—" }}</div>
                </td>
                <td>
                  <span :class="getStatusPillClass(s.status)">{{ formatStatus(s.status) }}</span>
                  <div class="text-xs text-gray-400 mt-1">Enrolled: {{ formatDate(s.enrollmentDate) }}</div>
                </td>
                <td>
                  <span class="text-gray-600">{{ formatDate(s.last_activity) }}</span>
                </td>
                <td>
                  <button @click="viewStudent(s)" class="action-view-sm">View</button>
                </td>
              </tr>
              <tr v-if="filteredStudents.length === 0">
                <td colspan="6" class="empty-cell">No students found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <div class="page-btns">
            <button class="pg-btn" :class="{ 'pg-disabled': currentPage <= 1 }" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">← Prev</button>
            <button v-for="p in pageButtons" :key="p" @click="goToPage(p)" class="pg-num" :class="{ 'pg-active': p === currentPage }">{{ p }}</button>
            <button class="pg-btn" :class="{ 'pg-disabled': currentPage >= totalPages }" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <transition name="modal-fade">
      <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
        <transition name="modal-scale">
          <div class="modal-card">
            <div class="modal-head modal-head-blue">
              <h3 class="modal-title">Student Details</h3>
              <button class="modal-close-btn" @click="closeViewModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Name</span>
                  <span class="detail-value">{{ selectedStudent.fullname }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ selectedStudent.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Course</span>
                  <span class="detail-value">{{ selectedStudent.course_name || "—" }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Course Code</span>
                  <span class="detail-value">{{ selectedStudent.course_code || "—" }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status</span>
                  <span :class="getStatusPillClass(selectedStudent.status)">{{ formatStatus(selectedStudent.status) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Enrollment Date</span>
                  <span class="detail-value">{{ formatDate(selectedStudent.enrollmentDate) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Last Activity</span>
                  <span class="detail-value">{{ formatDate(selectedStudent.last_activity) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Reservations</span>
                  <span class="detail-value">{{ selectedStudent.reservations_count }}</span>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="closeViewModal" class="btn-cancel">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </TrainerLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import TrainerLayout from "./TrainerLayout.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "TrainerStudents",
  components: { TrainerLayout },
  setup() {
    const students = ref([]);
    const loading = ref(true);
    const errorMsg = ref("");

    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");
    const sortBy = ref("name");

    const currentPage = ref(1);
    const pageSize = ref(10);

    const showViewModal = ref(false);
    const selectedStudent = ref({});

    const courseOptions = computed(() => {
      return [
        ...new Set(students.value.map((s) => s.course_name).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b));
    });

    const filteredStudents = computed(() => {
      let result = [...students.value];

      const q = (searchQuery.value || "").toLowerCase().trim();
      if (q) {
        result = result.filter(
          (s) =>
            (s.fullname || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q) ||
            (s.course_name || "").toLowerCase().includes(q) ||
            (s.course_code || "").toLowerCase().includes(q) ||
            String(s.student_id || "").includes(q),
        );
      }

      if (selectedCourse.value) {
        result = result.filter((s) => s.course_name === selectedCourse.value);
      }
      if (selectedStatus.value) {
        result = result.filter((s) => (s.status || "") === selectedStatus.value);
      }

      result.sort((a, b) => {
        switch (sortBy.value) {
          case "name":
            return (a.fullname || "").localeCompare(b.fullname || "");
          case "nameDesc":
            return (b.fullname || "").localeCompare(a.fullname || "");
          case "date":
            return new Date(b.enrollmentDate || 0) - new Date(a.enrollmentDate || 0);
          case "activity":
            return new Date(b.last_activity || 0) - new Date(a.last_activity || 0);
          case "status":
            return (a.status || "").localeCompare(b.status || "");
          default:
            return 0;
        }
      });

      return result;
    });

    const totalPages = computed(() => {
      return Math.max(1, Math.ceil(filteredStudents.value.length / pageSize.value));
    });

    const paginatedStudents = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      return filteredStudents.value.slice(start, start + pageSize.value);
    });

    const pageButtons = computed(() => {
      const total = totalPages.value;
      const cur = currentPage.value;
      const maxBtns = 5;
      let start = Math.max(1, cur - 2);
      let end = Math.min(total, start + maxBtns - 1);
      start = Math.max(1, end - maxBtns + 1);
      const out = [];
      for (let i = start; i <= end; i++) out.push(i);
      return out;
    });

    let tmr = null;
    const debouncedFetch = () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => {
        currentPage.value = 1;
        fetchStudents();
      }, 250);
    };

    watch([selectedCourse, selectedStatus, sortBy], () => {
      currentPage.value = 1;
      fetchStudents();
    });

    watch(totalPages, () => {
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
      }
    });

    const getInitials = (name) => {
      const n = String(name || "").trim();
      if (!n) return "S";
      return n.split(" ").filter(Boolean).map((x) => x[0]).join("").toUpperCase().slice(0, 2);
    };

    const getStatusPillClass = (status) => {
      const s = String(status || "").toLowerCase();
      if (["done", "completed"].includes(s)) return "pill pill-green";
      if (["active", "approved", "confirmed"].includes(s)) return "pill pill-blue";
      if (s === "pending") return "pill pill-amber";
      if (["rejected", "cancelled", "canceled"].includes(s)) return "pill pill-red";
      return "pill pill-gray";
    };

    const formatStatus = (status) => {
      const s = String(status || "").toLowerCase();
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";
    };

    const formatDate = (val) => {
      if (!val) return "—";
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedCourse.value = "";
      selectedStatus.value = "";
      currentPage.value = 1;
      fetchStudents();
    };

    const viewStudent = (student) => {
      selectedStudent.value = { ...student };
      showViewModal.value = true;
    };

    const closeViewModal = () => {
      showViewModal.value = false;
      selectedStudent.value = {};
    };

    const fetchStudents = async () => {
      loading.value = true;
      errorMsg.value = "";
      try {
        const res = await api.get("/trainer/tesda/students", {
          params: {
            page: 1,
            limit: 500,
            q: searchQuery.value || "",
            course: selectedCourse.value || "",
            status: selectedStatus.value || "",
            sort: sortBy.value || "name",
          },
        });

        const rows = res.data?.data ?? [];

        students.value = rows.map((r) => ({
          student_id: Number(r.student_id),
          fullname: r.fullname || "Student",
          email: r.email || "",
          reservations_count: Number(r.reservations_count || 0),
          last_activity: r.last_activity || null,
          course_id: Number(r.course_id || 0),
          course_name: r.course_name || "",
          course_code: r.course_code || "",
          status: (r.status || "").toLowerCase(),
          enrollmentDate: r.enrollmentDate || null,
        }));
      } catch (err) {
        console.error("fetchStudents error:", err);
        students.value = [];
        errorMsg.value = err.response?.data?.message || "Failed to load students";
      } finally {
        loading.value = false;
      }
    };

    const goToPage = (p) => {
      const next = Math.max(1, Math.min(p, totalPages.value || 1));
      if (next === currentPage.value) return;
      currentPage.value = next;
    };

    onMounted(() => fetchStudents());

    return {
      students, loading, errorMsg,
      searchQuery, selectedCourse, selectedStatus, sortBy,
      currentPage, pageSize, totalPages, pageButtons,
      courseOptions, filteredStudents, paginatedStudents,
      getInitials, getStatusPillClass, formatStatus, formatDate,
      clearFilters, viewStudent, showViewModal, selectedStudent, closeViewModal,
      fetchStudents, goToPage, debouncedFetch,
    };
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.students-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }

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

/* ===== ERROR BANNER ===== */
.error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; }

/* ===== FILTERS ROW ===== */
.filters-row { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; align-items: flex-end; }
.filter-item { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
.select-modern { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; background: #fff; color: #111827; min-width: 140px; }
.select-modern:focus { border-color: #3b82f6; }
.ml-auto { margin-left: auto; }
.btn-outline-sm { padding: 9px 16px; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-outline-sm:hover { background: #f3f4f6; }

/* ===== PANEL CARD ===== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.table-wrap { overflow-x: auto; }

/* ===== TABLE ===== */
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

.avatar-sm { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ===== PAGINATION (Admin Students style) ===== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #3b82f6; color: #2563eb; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }
.pg-num { width: 34px; height: 34px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-num:hover { border-color: #3b82f6; }
.pg-active { background: #3b82f6; color: #fff; border-color: #3b82f6; }

/* ===== LOADING STATE ===== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }

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
.detail-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: #111827; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: 1fr; }
}
</style>