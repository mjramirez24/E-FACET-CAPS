<template>
  <TrainerLayout>
    <template #header-left>
      <input
        type="text"
        placeholder="Search students..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      />
    </template>

    <div>
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h2 class="text-lg font-bold text-blue-800">✅ Trainer Attendance</h2>

        <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Date:</span>
            <input
              type="date"
              v-model="selectedDate"
              class="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            @click="markAll('present')"
            class="px-4 py-2 rounded-md text-sm font-medium border border-green-600 text-green-700 hover:bg-green-50"
          >
            Mark All Present
          </button>

          <button
            @click="saveAttendance"
            class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
          >
            💾 Save Attendance
          </button>

          <button
            @click="exportExcel()"
            class="px-4 py-2 rounded-md text-sm font-medium border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            ⬇️ Export Excel
          </button>

          <button
            @click="exportPdf()"
            class="px-4 py-2 rounded-md text-sm font-medium border border-red-600 text-red-700 hover:bg-red-50"
          >
            ⬇️ Export PDF
          </button>
        </div>
      </div>

      <div
        v-if="errorMsg"
        class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm"
      >
        {{ errorMsg }}
      </div>

      <div
        v-if="successMsg"
        class="mb-4 p-3 rounded-md border border-green-200 bg-green-50 text-green-700 text-sm"
      >
        {{ successMsg }}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-48 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="unmarked">Unmarked</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
          <select
            v-model="selectedCourse"
            class="w-60 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            <option v-for="c in courses" :key="c.course_id" :value="String(c.course_id)">
              {{ c.course_name }}
            </option>
          </select>
        </div>

        <div class="flex items-end gap-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Clear
          </button>
          <button
            @click="fetchSheet"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        <div class="ml-auto flex flex-wrap items-end gap-2">
          <span class="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
            Present: {{ stats.present }}
          </span>
          <span class="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-medium">
            Late: {{ stats.late }}
          </span>
          <span class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
            Absent: {{ stats.absent }}
          </span>
          <span class="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium">
            Unmarked: {{ stats.unmarked }}
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
        <p class="mt-3 text-gray-600">Loading attendance...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Showing {{ filteredStudents.length }} of {{ students.length }} students
            <span class="ml-2 text-gray-400">•</span>
            <span class="ml-2">Date: <span class="font-medium">{{ prettyDate }}</span></span>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Sort by:</span>
            <select v-model="sortBy" class="text-sm border rounded px-2 py-1">
              <option value="name">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-blue-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Student</th>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Remarks</th>
              <th class="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="s in filteredStudents"
              :key="s.student_id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="flex flex-col">
                  <p class="font-medium">{{ s.fullname }}</p>
                  <p class="text-xs text-gray-500">{{ s.username || s.email || "—" }}</p>
                </div>
              </td>

              <td class="py-3 px-4">
                <div class="text-gray-700 font-medium">{{ s.course_name || "—" }}</div>
                <div class="text-xs text-gray-500">Code: {{ s.course_code || "—" }}</div>
              </td>

              <td class="py-3 px-4">
                <span
                  class="text-xs px-2 py-1 rounded font-medium"
                  :class="getStatusBadge(getRow(s.student_id).status)"
                >
                  {{ getRow(s.student_id).status }}
                </span>
              </td>

              <td class="py-3 px-4">
                <input
                  type="text"
                  v-model="getRow(s.student_id).remarks"
                  placeholder="e.g., traffic / sick"
                  class="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </td>

              <td class="py-3 px-4">
                <button
                  @click="setStatus(s.student_id, 'present')"
                  class="text-green-700 hover:text-green-900 text-sm font-medium mr-3"
                >
                  Present
                </button>
                <button
                  @click="setStatus(s.student_id, 'late')"
                  class="text-yellow-700 hover:text-yellow-900 text-sm font-medium mr-3"
                >
                  Late
                </button>
                <button
                  @click="setStatus(s.student_id, 'absent')"
                  class="text-red-700 hover:text-red-900 text-sm font-medium"
                >
                  Absent
                </button>
              </td>
            </tr>

            <tr v-if="filteredStudents.length === 0">
              <td colspan="5" class="py-8 text-center text-gray-500">No students found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ✅ INLINE HISTORY (same page) -->
      <div class="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-gray-800">📚 Attendance History</h3>
            <span class="text-xs text-gray-500">(saved days)</span>
          </div>

          <button
            @click="historyOpen = !historyOpen"
            class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
          >
            {{ historyOpen ? "Hide" : "Show" }}
          </button>
        </div>

        <div v-if="historyOpen" class="p-4">
          <div class="flex flex-wrap items-center gap-2 mb-3">
            <input
              v-model="historySearch"
              placeholder="Search date (YYYY-MM-DD)"
              class="w-64 p-2 border rounded text-sm"
            />
            <button @click="fetchHistory(1)" class="px-3 py-2 border rounded text-sm hover:bg-gray-50">
              Search
            </button>

            <div class="ml-auto flex gap-2">
              <button
                class="px-3 py-2 border rounded text-sm disabled:opacity-50"
                :disabled="historyMeta.page <= 1"
                @click="fetchHistory(historyMeta.page - 1)"
              >
                Prev
              </button>
              <button
                class="px-3 py-2 border rounded text-sm disabled:opacity-50"
                :disabled="historyMeta.page >= historyMeta.totalPages"
                @click="fetchHistory(historyMeta.page + 1)"
              >
                Next
              </button>
            </div>
          </div>

          <div v-if="historyLoading" class="py-6 text-center text-gray-600">Loading history...</div>

          <div v-else class="border rounded overflow-hidden">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left py-2 px-3">Date</th>
                  <th class="text-left py-2 px-3">Present</th>
                  <th class="text-left py-2 px-3">Late</th>
                  <th class="text-left py-2 px-3">Absent</th>
                  <th class="text-left py-2 px-3">Unmarked</th>
                  <th class="text-left py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in historyRows" :key="d.attendance_date" class="border-t">
                  <td class="py-2 px-3 font-medium">{{ d.attendance_date }}</td>
                  <td class="py-2 px-3">{{ d.present }}</td>
                  <td class="py-2 px-3">{{ d.late }}</td>
                  <td class="py-2 px-3">{{ d.absent }}</td>
                  <td class="py-2 px-3">{{ d.unmarked }}</td>
                  <td class="py-2 px-3">
                    <button
                      class="text-blue-700 hover:text-blue-900 text-sm font-medium"
                      @click="loadHistoryDate(d.attendance_date)"
                    >
                      View
                    </button>
                  </td>
                </tr>

                <tr v-if="historyRows.length === 0">
                  <td colspan="6" class="py-6 text-center text-gray-500">No history found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-3 text-xs text-gray-600">
            Page {{ historyMeta.page }} of {{ historyMeta.totalPages }} • Total {{ historyMeta.total }}
          </div>

          <!-- Details -->
          <div v-if="historyDetailsDate" class="mt-6">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-gray-800">Details: {{ historyDetailsDate }}</h4>

              <div class="flex gap-2">
                <button
                  @click="exportExcel(historyDetailsDate)"
                  class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Export Excel
                </button>
                <button
                  @click="exportPdf(historyDetailsDate)"
                  class="px-3 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div class="border rounded overflow-hidden">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="text-left py-2 px-3">Student</th>
                    <th class="text-left py-2 px-3">Course</th>
                    <th class="text-left py-2 px-3">Status</th>
                    <th class="text-left py-2 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in historyDetailsRows" :key="r.student_id" class="border-t">
                    <td class="py-2 px-3">
                      <div class="font-medium">{{ r.fullname }}</div>
                      <div class="text-xs text-gray-500">{{ r.username || r.email || "—" }}</div>
                    </td>
                    <td class="py-2 px-3">
                      <div>{{ r.course_name || "—" }}</div>
                      <div class="text-xs text-gray-500">{{ r.course_code || "" }}</div>
                    </td>
                    <td class="py-2 px-3">
                      <span class="text-xs px-2 py-1 rounded font-medium" :class="getStatusBadge(r.status)">
                        {{ r.status }}
                      </span>
                    </td>
                    <td class="py-2 px-3">{{ r.remarks || "—" }}</td>
                  </tr>

                  <tr v-if="historyDetailsRows.length === 0">
                    <td colspan="4" class="py-6 text-center text-gray-500">No rows for that date</td>
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

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

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

    // ✅ normalize any date to YYYY-MM-DD (fix timestamp like 2026-03-02T16:00:00.000Z)
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

    const getStatusBadge = (status) => {
      switch (String(status || "").toLowerCase()) {
        case "present":
          return "bg-green-100 text-green-700";
        case "late":
          return "bg-yellow-100 text-yellow-700";
        case "absent":
          return "bg-red-100 text-red-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
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
          case "name":
            return an.localeCompare(bn);
          case "nameDesc":
            return bn.localeCompare(an);
          case "status": {
            const sa = String(getRow(a.student_id).status || "unmarked");
            const sb = String(getRow(b.student_id).status || "unmarked");
            return sa.localeCompare(sb) || an.localeCompare(bn);
          }
          default:
            return 0;
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
          params: {
            date: toYMD(selectedDate.value),
            course_id: sheetCourseId.value,
            q: searchQuery.value || "",
          },
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
            students.value
              .filter((s) => s.course_id > 0)
              .map((s) => [String(s.course_id), { course_id: s.course_id, course_name: s.course_name }]),
          ).values(),
        ].sort((a, b) => String(a.course_name).localeCompare(String(b.course_name)));

        // reset attendanceMap for the date
        for (const k of Object.keys(attendanceMap)) delete attendanceMap[k];

        for (const s of students.value) {
          const key = String(s.student_id);
          const row = map[key] || {};
          attendanceMap[key] = {
            status: String(row.status || "unmarked").toLowerCase(),
            remarks: row.remarks || "",
          };
        }

        // always compute stats from current map
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

        const resp = await api.post("/trainer/tesda/attendance", {
          date: d,
          rows: payloadRows,
        });

        successMsg.value = `Attendance saved ✅ (saved: ${resp.data?.data?.saved || 0})`;
        setTimeout(() => (successMsg.value = ""), 2500);

        await fetchSheet();
        if (historyOpen.value) fetchHistory(1);
      } catch (err) {
        console.error("saveAttendance error:", err);
        errorMsg.value = err.response?.data?.message || "Failed to save attendance";
      }
    };

    // export (downloads)
    const exportExcel = (dateOverride) => {
      const d = toYMD(dateOverride || selectedDate.value);
      window.open(
        `http://localhost:3000/api/trainer/tesda/attendance/export/excel?date=${encodeURIComponent(d)}`,
        "_blank",
      );
    };
    const exportPdf = (dateOverride) => {
      const d = toYMD(dateOverride || selectedDate.value);
      window.open(
        `http://localhost:3000/api/trainer/tesda/attendance/export/pdf?date=${encodeURIComponent(d)}`,
        "_blank",
      );
    };

    // ---------------- history (inline) ----------------
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
        historyRows.value = rows.map((r) => ({
          ...r,
          attendance_date: toYMD(r.attendance_date),
        }));
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
        historyDetailsRows.value = (res.data?.data || []).map((r) => ({
          ...r,
          status: String(r.status || "unmarked").toLowerCase(),
        }));
      } catch (err) {
        console.error("loadHistoryDate error:", err);
        historyDetailsRows.value = [];
      }
    };

    watch(selectedDate, () => fetchSheet());
    watch(selectedCourse, () => fetchSheet());

    watch(historyOpen, (v) => {
      if (v) fetchHistory(1);
    });

    onMounted(fetchSheet);

    return {
      searchQuery,
      selectedStatus,
      selectedCourse,
      sortBy,
      selectedDate,
      prettyDate,

      loading,
      errorMsg,
      successMsg,

      students,
      courses,
      stats,
      attendanceMap,

      getRow,
      getStatusBadge,
      setStatus,
      markAll,
      clearFilters,
      fetchSheet,
      saveAttendance,

      filteredStudents,

      exportExcel,
      exportPdf,

      historyOpen,
      historyLoading,
      historySearch,
      historyRows,
      historyMeta,
      fetchHistory,
      loadHistoryDate,
      historyDetailsDate,
      historyDetailsRows,
    };
  },
};
</script>