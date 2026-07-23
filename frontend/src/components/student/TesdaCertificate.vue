<template>
  <StudentLayoutTesda active-page="certificate">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search certificates..."
            class="search-input-modern"
            v-model="searchQuery"
          />
        </div>
      </div>
    </template>

    <div class="certificate-wrapper">
      <div class="page-top">
        <h2 class="page-title">TESDA Certificates</h2>
        <p class="page-subtitle">View and download your training certificates</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ stats.total }}</span>
              <span class="stat-label">Total Certificates</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ stats.completed }}</span>
              <span class="stat-label">Issued</span>
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
              <span class="stat-value text-amber">{{ stats.pending }}</span>
              <span class="stat-label">Processing</span>
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
              <span class="stat-value text-purple">{{ stats.available }}</span>
              <span class="stat-label">Available</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Certificate Table -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Certificate List</h3>
          <div class="panel-header-actions">
            <select v-model="filterStatus" class="select-modern-sm">
              <option value="all">All Status</option>
              <option value="completed">Issued</option>
              <option value="pending">Processing</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-gray-500">Loading certificates...</p>
        </div>

        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Course</th>
                <th>Type</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filtered" :key="c.id">
                <td>
                  <div class="font-medium">{{ c.course }}</div>
                  <div class="text-xs text-gray-400">{{ c.certificate_code || "—" }}</div>
                </td>
                <td>
                  <span class="font-medium">{{ c.type || "—" }}</span>
                </td>
                <td>
                  <span :class="c.issueDate ? 'font-medium' : 'text-gray-400'">
                    {{ c.issueDate ? formatDate(c.issueDate) : "Not yet issued" }}
                  </span>
                </td>
                <td>
                  <span :class="getStatusPillClass(c.status)">
                    {{ c.status === "completed" ? "Issued" : "Processing" }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button v-if="c.certificate_id" @click="viewCertificate(c)" class="action-view-sm">View</button>
                    <button v-if="c.certificate_id" @click="downloadCertificate(c)" class="action-download-sm">Download</button>
                    <span v-if="!c.certificate_id" class="text-xs text-gray-400">Waiting for admin</span>
                  </div>
                </td>
              </tr>
              <tr v-if="filtered.length === 0">
                <td colspan="5" class="empty-cell">No certificates found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-banner">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>
  </StudentLayoutTesda>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import StudentLayoutTesda from "./StudentLayoutTesda.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "TesdaCertificate",
  components: { StudentLayoutTesda },
  setup() {
    const API_BASE = API_URL.replace("/api", "");

    const loading = ref(false);
    const error = ref("");
    const certificates = ref([]);

    const searchQuery = ref("");
    const filterStatus = ref("all");

    const fetchCertificates = async () => {
      loading.value = true;
      error.value = "";
      try {
        const res = await api.get("/tesda/certificates");
        certificates.value = res?.data?.data || [];
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to load TESDA certificates.";
      } finally {
        loading.value = false;
      }
    };

    const filtered = computed(() => {
      let list = [...certificates.value];
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((c) => {
          const course = (c.course || "").toLowerCase();
          const code = (c.certificate_code || "").toLowerCase();
          const type = (c.type || "").toLowerCase();
          return course.includes(q) || code.includes(q) || type.includes(q);
        });
      }
      if (filterStatus.value !== "all") {
        list = list.filter((c) => c.status === filterStatus.value);
      }
      return list;
    });

    const stats = computed(() => {
      const total = certificates.value.length;
      const completed = certificates.value.filter((c) => c.status === "completed").length;
      const pending = certificates.value.filter((c) => c.status === "pending").length;
      const available = completed;
      return { total, completed, pending, available };
    });

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    };

    const getStatusPillClass = (status) => {
      if (status === "completed") return "pill pill-green";
      return "pill pill-amber";
    };

    const viewCertificate = (c) => {
      if (!c?.certificate_id) return;
      window.open(`${API_URL}/tesda/certificates/${c.certificate_id}/view`, "_blank");
    };

    const downloadCertificate = (c) => {
      if (!c?.certificate_id) return;
      window.open(`${API_URL}/tesda/certificates/${c.certificate_id}/download`, "_blank");
    };

    onMounted(fetchCertificates);

    return {
      loading, error, certificates, searchQuery, filterStatus,
      filtered, stats, fetchCertificates, formatDate, getStatusPillClass,
      viewCertificate, downloadCertificate,
    };
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.certificate-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }

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
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }
.text-emerald { color: #059669; } .text-blue { color: #2563eb; } .text-amber { color: #d97706; } .text-purple { color: #7c3aed; }

/* ===== PANEL CARD ===== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-header-actions { display: flex; gap: 8px; }
.select-modern-sm { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.78rem; color: #374151; background: #fff; outline: none; cursor: pointer; }
.select-modern-sm:focus { border-color: #3b82f6; }

/* ===== TABLE ===== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; color: #6b7280; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-amber { background: #fef3c7; color: #d97706; }

/* ===== ACTION BUTTONS ===== */
.action-buttons { display: flex; gap: 6px; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }
.action-download-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #10b981; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-download-sm:hover { background: #059669; }

/* ===== LOADING / ERROR ===== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>