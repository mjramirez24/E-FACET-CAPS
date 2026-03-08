<template>
  <StudentLayoutTesda active-page="attendance">
    <template #header-left>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search attendance..."
        class="w-full md:w-1/3 p-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
        <h2 class="text-lg font-bold text-blue-800">✅ Training Attendance</h2>
        <div class="text-sm text-gray-600">
          Last updated: {{ formattedLastUpdated }}
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p class="text-sm text-gray-600">Total Trainings</p>
          <h3 class="text-2xl font-bold text-blue-800 mt-1">
            {{ attendanceStats.totalTrainings }}
          </h3>
        </div>

        <div class="bg-green-50 p-4 rounded-lg border border-green-100">
          <p class="text-sm text-gray-600">Present</p>
          <h3 class="text-2xl font-bold text-green-800 mt-1">
            {{ attendanceStats.present }}
          </h3>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <p class="text-sm text-gray-600">Absent</p>
          <h3 class="text-2xl font-bold text-yellow-800 mt-1">
            {{ attendanceStats.absent }}
          </h3>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p class="text-sm text-gray-600">Attendance Rate</p>
          <h3 class="text-2xl font-bold text-purple-800 mt-1">
            {{ attendanceStats.attendanceRate }}%
          </h3>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Training</label>
          <select
            v-model="selectedTraining"
            class="w-48 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Trainings</option>
            <option
              v-for="training in trainings"
              :key="training"
              :value="training"
            >
              {{ training }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
            <option value="unmarked">Unmarked</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <input
            v-model="selectedMonth"
            type="month"
            class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div class="flex items-end gap-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Clear
          </button>
          <button
            @click="exportAttendance"
            class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Export
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
        <p class="mt-3 text-gray-600">Loading attendance records...</p>
      </div>

      <!-- Error -->
      <div
        v-else-if="errorMessage"
        class="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg mb-6"
      >
        {{ errorMessage }}
      </div>

      <!-- Table -->
      <div
        v-else
        class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div class="p-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <h3 class="text-lg font-bold text-blue-800">Attendance Records</h3>
          <div class="text-sm text-gray-600">
            Showing {{ paginatedAttendance.length }} of {{ filteredAttendance.length }} records
          </div>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-blue-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Date</th>
              <th class="py-3 px-4 text-left font-medium">Training</th>
              <th class="py-3 px-4 text-left font-medium">Time</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Remarks</th>
              <th class="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="record in paginatedAttendance"
              :key="record.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="font-medium">{{ formatDate(record.date) }}</div>
                <div class="text-xs text-gray-500">{{ formatDay(record.date) }}</div>
              </td>

              <td class="py-3 px-4">
                <div class="font-medium">{{ record.training }}</div>
                <div class="text-xs text-gray-500">
                  {{ record.course_code || record.trainer }}
                </div>
              </td>

              <td class="py-3 px-4 text-gray-600">
                {{ record.time }}
              </td>

              <td class="py-3 px-4">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="getStatusClass(record.status)"
                >
                  {{ formatStatus(record.status) }}
                </span>
              </td>

              <td class="py-3 px-4">
                <div class="text-sm text-gray-700">{{ record.remarks }}</div>
              </td>

              <td class="py-3 px-4">
                <button
                  @click="openDetails(record)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded"
                >
                  Details
                </button>
              </td>
            </tr>

            <tr v-if="paginatedAttendance.length === 0">
              <td colspan="6" class="py-8 text-center text-gray-500">
                <div class="text-gray-400">
                  <span class="text-3xl mb-2 block">📊</span>
                  <p class="text-gray-500">No attendance records found</p>
                  <p class="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Attendance Summary -->
      <div class="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-blue-800">📈 Attendance Summary</h3>
          <button
            @click="fetchAttendance"
            class="text-blue-700 hover:text-blue-800 text-sm font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="text-md font-medium text-gray-800 mb-3">Monthly Overview</h4>
            <div class="space-y-3">
              <div
                v-for="month in monthlySummary"
                :key="month.monthKey"
                class="flex items-center justify-between"
              >
                <span class="text-sm text-gray-700">{{ month.month }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ month.rate }}%</span>
                  <div class="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      class="h-2 rounded-full"
                      :class="month.rate >= 90 ? 'bg-green-500' : month.rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'"
                      :style="{ width: `${month.rate}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <div v-if="monthlySummary.length === 0" class="text-sm text-gray-400">
                No monthly summary available yet.
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-md font-medium text-gray-800 mb-3">Status Distribution</h4>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class="text-sm text-gray-700">Present</span>
                </div>
                <span class="text-sm font-medium">{{ attendanceStats.present }} records</span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span class="text-sm text-gray-700">Late</span>
                </div>
                <span class="text-sm font-medium">{{ attendanceStats.late }} records</span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span class="text-sm text-gray-700">Absent</span>
                </div>
                <span class="text-sm font-medium">{{ attendanceStats.absent }} records</span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class="text-sm text-gray-700">Excused</span>
                </div>
                <span class="text-sm font-medium">{{ attendanceStats.excused }} records</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-6 flex flex-col md:flex-row justify-between items-center gap-3">
        <div class="text-sm text-gray-600">
          Page {{ currentPage }} of {{ totalPages }} • {{ filteredAttendance.length }} records
        </div>

        <div class="flex gap-1 flex-wrap">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            class="px-3 py-1 rounded text-sm border"
            :class="page === currentPage ? 'bg-blue-700 text-white border-blue-700' : 'hover:bg-gray-50 border-gray-300'"
          >
            {{ page }}
          </button>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages || totalPages === 0"
            class="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div
      v-if="selectedRecord"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-bold text-blue-800">Attendance Details</h3>
          <button
            @click="selectedRecord = null"
            class="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <div class="p-6 space-y-4 text-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-gray-500 mb-1">Date</p>
              <p class="font-medium text-gray-800">{{ formatDate(selectedRecord.date) }}</p>
            </div>

            <div>
              <p class="text-gray-500 mb-1">Day</p>
              <p class="font-medium text-gray-800">{{ formatDay(selectedRecord.date) }}</p>
            </div>

            <div>
              <p class="text-gray-500 mb-1">Training</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.training }}</p>
            </div>

            <div>
              <p class="text-gray-500 mb-1">Course Code</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.course_code || '—' }}</p>
            </div>

            <div>
              <p class="text-gray-500 mb-1">Time</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.time }}</p>
            </div>

            <div>
              <p class="text-gray-500 mb-1">Status</p>
              <span
                class="inline-block px-2 py-1 rounded-full text-xs font-medium"
                :class="getStatusClass(selectedRecord.status)"
              >
                {{ formatStatus(selectedRecord.status) }}
              </span>
            </div>

            <div class="md:col-span-2">
              <p class="text-gray-500 mb-1">Trainer</p>
              <p class="font-medium text-gray-800">{{ selectedRecord.trainer }}</p>
            </div>

            <div class="md:col-span-2">
              <p class="text-gray-500 mb-1">Remarks</p>
              <p class="font-medium text-gray-800 whitespace-pre-line">
                {{ selectedRecord.remarks || '—' }}
              </p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            @click="selectedRecord = null"
            class="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </StudentLayoutTesda>
</template>

<script>
import axios from "axios";
import { computed, onMounted, ref, watch } from "vue";
import StudentLayoutTesda from "./StudentLayoutTesda.vue";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
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
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    });

    const filteredAttendance = computed(() => {
      let rows = [...attendanceRecords.value];

      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim();
        rows = rows.filter((r) =>
          [
            r.training,
            r.course_code,
            r.time,
            r.status,
            r.remarks,
            r.trainer,
            r.date,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
      }

      if (selectedTraining.value) {
        rows = rows.filter((r) => r.training === selectedTraining.value);
      }

      if (selectedStatus.value) {
        rows = rows.filter((r) => r.status === selectedStatus.value);
      }

      if (selectedMonth.value) {
        rows = rows.filter((r) => String(r.date).slice(0, 7) === selectedMonth.value);
      }

      return rows;
    });

    const totalPages = computed(() => {
      const total = Math.ceil(filteredAttendance.value.length / perPage.value);
      return total > 0 ? total : 1;
    });

    const paginatedAttendance = computed(() => {
      const start = (currentPage.value - 1) * perPage.value;
      const end = start + perPage.value;
      return filteredAttendance.value.slice(start, end);
    });

    const visiblePages = computed(() => {
      const pages = [];
      const total = totalPages.value;
      let start = Math.max(1, currentPage.value - 2);
      let end = Math.min(total, currentPage.value + 2);

      if (currentPage.value <= 3) end = Math.min(total, 5);
      if (currentPage.value >= total - 2) start = Math.max(1, total - 4);

      for (let i = start; i <= end; i += 1) {
        pages.push(i);
      }

      return pages;
    });

    watch([searchQuery, selectedTraining, selectedStatus, selectedMonth], () => {
      currentPage.value = 1;
    });

    watch(filteredAttendance, () => {
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
      }
    });

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
          totalTrainings: 0,
          present: 0,
          late: 0,
          absent: 0,
          excused: 0,
          unmarked: 0,
          attendanceRate: 0,
        };
        lastUpdated.value = payload.lastUpdated || new Date().toISOString();
      } catch (err) {
        console.error("fetchAttendance error:", err);
        errorMessage.value =
          err?.response?.data?.message || "Failed to load attendance records.";
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
          [
            r.date,
            r.training,
            r.course_code || "",
            r.time || "",
            formatStatus(r.status),
            r.remarks || "",
            r.trainer || "",
          ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });

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

    const openDetails = (record) => {
      selectedRecord.value = record;
    };

    const goToPage = (page) => {
      if (page < 1 || page > totalPages.value) return;
      currentPage.value = page;
    };

    const formatDate = (date) => {
      if (!date) return "—";
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return date;

      return d.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    const formatDay = (date) => {
      if (!date) return "—";
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return "—";

      return d.toLocaleDateString("en-PH", {
        weekday: "long",
      });
    };

    const formatStatus = (status) => {
      const s = String(status || "").toLowerCase();
      if (!s) return "Unknown";
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const getStatusClass = (status) => {
      const s = String(status || "").toLowerCase();

      if (s === "present") {
        return "bg-green-100 text-green-800";
      }
      if (s === "late") {
        return "bg-yellow-100 text-yellow-800";
      }
      if (s === "absent") {
        return "bg-red-100 text-red-800";
      }
      if (s === "excused") {
        return "bg-blue-100 text-blue-800";
      }
      return "bg-gray-100 text-gray-700";
    };

    onMounted(() => {
      fetchAttendance();
    });

    return {
      loading,
      errorMessage,
      searchQuery,
      selectedTraining,
      selectedStatus,
      selectedMonth,
      lastUpdated,
      formattedLastUpdated,
      attendanceRecords,
      trainings,
      attendanceStats,
      monthlySummary,
      filteredAttendance,
      paginatedAttendance,
      currentPage,
      totalPages,
      visiblePages,
      selectedRecord,
      fetchAttendance,
      clearFilters,
      exportAttendance,
      openDetails,
      goToPage,
      formatDate,
      formatDay,
      formatStatus,
      getStatusClass,
    };
  },
};
</script>

<style scoped>
.transition-colors {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}
</style>