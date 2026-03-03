<template>
  <TrainerLayout active-page="certificates">
    <template #header-left>
      <input
        type="text"
        placeholder="Search students/certificates..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      />
    </template>

    <div>
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-bold text-green-800">🎓 TESDA Certificate Management</h2>

          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Logo"
            class="h-10 w-auto object-contain"
            @error="onLogoError"
          />
        </div>

        <button
          @click="fetchRows"
          class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          🔄 Refresh
        </button>
      </div>

      <div v-if="error" class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {{ error }}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
          <select
            v-model="selectedCourse"
            class="w-56 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Courses</option>
            <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All</option>
            <option value="issued">Issued</option>
            <option value="ready">Ready</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Done Date</label>
          <input
            type="date"
            v-model="selectedDate"
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        <div class="flex items-end gap-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-green-50 p-5 rounded-lg border border-green-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-green-800">{{ issuedCount }}</h3>
              <p class="text-green-700 font-medium mt-1">Issued</p>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-xl">✅</span>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-5 rounded-lg border border-yellow-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-yellow-800">{{ readyCount }}</h3>
              <p class="text-yellow-700 font-medium mt-1">Ready</p>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span class="text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-blue-800">{{ rowsFiltered.length }}</h3>
              <p class="text-blue-700 font-medium mt-1">Shown</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-xl">📄</span>
            </div>
          </div>
        </div>

        <div class="bg-red-50 p-5 rounded-lg border border-red-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-red-800">{{ revokedCount }}</h3>
              <p class="text-red-700 font-medium mt-1">Revoked</p>
            </div>
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        <p class="mt-3 text-gray-600">Loading...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Showing {{ rowsFiltered.length }} of {{ rowsBase.length }} (TESDA)
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Sort by:</span>
            <select v-model="sortBy" class="text-sm border rounded px-2 py-1">
              <option value="dateDesc">Most Recent</option>
              <option value="dateAsc">Oldest First</option>
              <option value="name">Student A-Z</option>
              <option value="course">Course</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-green-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Student</th>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Done Date</th>
              <th class="py-3 px-4 text-left font-medium">TESDA Cert Code</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in rowsFiltered"
              :key="row.reservation_id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                    {{ getInitials(row.student_name) }}
                  </div>
                  <div>
                    <p class="font-medium">{{ row.student_name }}</p>
                    <p class="text-xs text-gray-500">{{ row.student_email }}</p>
                  </div>
                </div>
              </td>

              <td class="py-3 px-4">
                <span class="font-medium">{{ row.course_name }}</span>
                <p class="text-xs text-gray-500 mt-0.5">
                  code: <span class="font-mono">{{ row.course_code || "—" }}</span>
                </p>
              </td>

              <td class="py-3 px-4 text-gray-600">
                {{ row.done_at ? formatDate(row.done_at) : "—" }}
              </td>

              <td class="py-3 px-4">
                <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {{ row.certificate_code || "—" }}
                </code>
              </td>

              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getStatusClass(row.ui_status)">
                  {{ formatStatus(row.ui_status) }}
                </span>
              </td>

              <td class="py-3 px-4">
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-if="row.ui_status === 'ready'"
                    @click="generateTesda(row)"
                    class="text-green-700 hover:text-green-900 text-sm font-medium px-2 py-1 hover:bg-green-50 rounded"
                  >
                    ➕ Generate
                  </button>

                  <button
                    v-if="row.certificate_id"
                    @click="viewCertificate(row)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    View
                  </button>

                  <button
                    v-if="row.certificate_id"
                    @click="downloadCertificate(row)"
                    class="text-purple-600 hover:text-purple-800 text-sm font-medium px-2 py-1 hover:bg-purple-50 rounded"
                  >
                    Download
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="rowsFiltered.length === 0">
              <td colspan="6" class="py-8 text-center text-gray-500">
                <div class="text-gray-400">
                  <span class="text-3xl mb-2 block">🎓</span>
                  <p class="text-gray-500">No results</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </TrainerLayout>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import TrainerLayout from "./TrainerLayout.vue";

export default {
  name: "TrainerCertificates",
  components: { TrainerLayout },
  setup() {
    const API_BASE = "http://localhost:3000";

    const logoUrl = ref(`${API_BASE}/assets/logo.png`);
    const onLogoError = () => (logoUrl.value = "");

    const ENDPOINTS = {
      list: `${API_BASE}/api/trainer/certificates/tesda/completions`,
      generate: `${API_BASE}/api/trainer/certificates/tesda/generate`,
      view: (id) => `${API_BASE}/api/trainer/certificates/tesda/${id}/view`,
      download: (id) => `${API_BASE}/api/trainer/certificates/tesda/${id}/download`,
    };

    const rows = ref([]);
    const loading = ref(true);
    const error = ref("");

    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");
    const selectedDate = ref("");
    const sortBy = ref("dateDesc");

    const rowsBase = computed(() => rows.value);

    const courseOptions = computed(() => {
      const set = new Set(rowsBase.value.map((r) => r.course_name).filter(Boolean));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });

    const rowsFiltered = computed(() => {
      let result = [...rowsBase.value];

      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter((r) => {
          const name = (r.student_name || "").toLowerCase();
          const email = (r.student_email || "").toLowerCase();
          const course = (r.course_name || "").toLowerCase();
          const code = (r.certificate_code || "").toLowerCase();
          const courseCode = (r.course_code || "").toLowerCase();
          return name.includes(q) || email.includes(q) || course.includes(q) || code.includes(q) || courseCode.includes(q);
        });
      }

      if (selectedCourse.value) result = result.filter((r) => r.course_name === selectedCourse.value);
      if (selectedStatus.value) result = result.filter((r) => (r.ui_status || "") === selectedStatus.value);
      if (selectedDate.value) result = result.filter((r) => (r.done_at || "").slice(0, 10) === selectedDate.value);

      result.sort((a, b) => {
        switch (sortBy.value) {
          case "dateDesc":
            return new Date(b.done_at || 0) - new Date(a.done_at || 0);
          case "dateAsc":
            return new Date(a.done_at || 0) - new Date(b.done_at || 0);
          case "name":
            return (a.student_name || "").localeCompare(b.student_name || "");
          case "course":
            return (a.course_name || "").localeCompare(b.course_name || "");
          case "status":
            return (a.ui_status || "").localeCompare(b.ui_status || "");
          default:
            return 0;
        }
      });

      return result;
    });

    const issuedCount = computed(() => rowsBase.value.filter((r) => r.ui_status === "issued").length);
    const revokedCount = computed(() => rowsBase.value.filter((r) => r.ui_status === "revoked").length);
    const readyCount = computed(() => rowsBase.value.filter((r) => r.ui_status === "ready").length);

    const getInitials = (name) => {
      const safe = String(name || "").trim();
      if (!safe) return "??";
      const parts = safe.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || "";
      const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
      return (first + last).toUpperCase() || "??";
    };

    const formatDate = (dateString) => {
      if (!dateString) return "—";
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getStatusClass = (status) => {
      switch (status) {
        case "issued":
          return "bg-green-100 text-green-800";
        case "ready":
          return "bg-yellow-100 text-yellow-800";
        case "revoked":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const formatStatus = (status) => {
      if (status === "ready") return "Ready";
      return String(status || "").charAt(0).toUpperCase() + String(status || "").slice(1);
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedCourse.value = "";
      selectedStatus.value = "";
      selectedDate.value = "";
    };

    const fetchRows = async () => {
      loading.value = true;
      error.value = "";
      try {
        const res = await axios.get(ENDPOINTS.list, { withCredentials: true });
        const data = res?.data?.data || [];
        rows.value = data.map((r) => ({
          ...r,
          ui_status: r.ui_status || (r.certificate_id ? "issued" : "ready"),
        }));
} catch (e) {
  console.log("CERT ERR:", e?.response?.status, e?.response?.data);
  error.value =
    (e?.response?.data && JSON.stringify(e.response.data)) ||
    e.message ||
    "Failed to load.";
} finally {
        loading.value = false;
      }
    };

    const generateTesda = async (row) => {
      error.value = "";
      try {
        const ok = confirm(`Generate TESDA certificate for ${row.student_name} (${row.course_name})?`);
        if (!ok) return;

        await axios.post(ENDPOINTS.generate, { reservation_id: row.reservation_id }, { withCredentials: true });
        await fetchRows();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to generate TESDA certificate.";
      }
    };

    const viewCertificate = (row) => {
      if (!row?.certificate_id) return;
      window.open(ENDPOINTS.view(row.certificate_id), "_blank");
    };

    const downloadCertificate = (row) => {
      if (!row?.certificate_id) return;
      window.open(ENDPOINTS.download(row.certificate_id), "_blank");
    };

    onMounted(fetchRows);

    return {
      logoUrl,
      onLogoError,

      rows,
      loading,
      error,

      searchQuery,
      selectedCourse,
      selectedStatus,
      selectedDate,
      sortBy,

      rowsBase,
      rowsFiltered,
      courseOptions,

      issuedCount,
      readyCount,
      revokedCount,

      getInitials,
      formatDate,
      getStatusClass,
      formatStatus,

      clearFilters,
      fetchRows,
      generateTesda,
      viewCertificate,
      downloadCertificate,
    };
  },
};
</script>