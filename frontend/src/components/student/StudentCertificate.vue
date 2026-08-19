<template>
  <StudentLayout active-page="certificate">
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
        <button @click="fetchCertificates" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="certificate-wrapper">
      <div class="page-top">
        <h2 class="page-title">My Certificates</h2>
        <p class="page-subtitle">View and download your training certificates</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ stats.total }}</span>
              <span class="stat-label">Total Certificates</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ stats.completed }}</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="stat-icon stat-icon-blue">
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
              <span class="stat-label">Pending</span>
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
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-gray-500">Loading certificates...</p>
        </div>

        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
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
                  <span :class="getStatusClass(c.status)">
                    {{ c.status === "completed" ? "Completed" : "Pending" }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      v-if="c.certificate_id"
                      @click="openViewModal(c)"
                      class="action-view-sm"
                    >
                      View
                    </button>

                    <span v-if="!c.certificate_id" class="text-xs text-gray-400 py-1">
                      Waiting for admin
                    </span>
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

    <!-- CERTIFICATE VIEW MODAL -->
    <transition name="modal-fade">
      <div v-if="viewModalOpen" class="modal-overlay" @click.self="closeViewModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-xl modal-card-tall">
            <div class="modal-head modal-head-green">
              <div>
                <h3 class="modal-title">Certificate — {{ modalCert?.type || "" }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ modalCert?.course }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="downloadCertificate(modalCert)" class="pg-btn pg-btn-accent-blue">Download PDF</button>
                <button class="modal-close-btn" @click="closeViewModal">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="modal-body-scroll modal-body-flush" style="background: #525659;">
              <iframe
                v-if="viewUrl"
                id="certificate-view-iframe"
                :src="viewUrl"
                class="certificate-view-frame"
                title="Certificate"
              ></iframe>
              <div v-else class="empty-cell" style="color:#e5e7eb;">
                No certificate found to display.
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </StudentLayout>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import StudentLayout from "./StudentLayout.vue";
import { API_URL } from "../../config/api";

export default {
  name: "StudentCertificate",
  components: { StudentLayout },
  setup() {
    const api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });

    const loading = ref(false);
    const error = ref("");
    const certificates = ref([]);
    const searchQuery = ref("");
    const filterStatus = ref("all");

    // View modal state
    const viewModalOpen = ref(false);
    const modalCert = ref(null);
    const viewUrl = computed(() =>
      modalCert.value?.certificate_id
        ? `${API_URL}/student/certificates/${modalCert.value.certificate_id}/view`
        : ""
    );

    const openViewModal = (c) => {
      modalCert.value = c;
      viewModalOpen.value = true;
    };

    const closeViewModal = () => {
      viewModalOpen.value = false;
      modalCert.value = null;
    };

    const printCertificate = () => {
      const frame = document.getElementById("certificate-view-iframe");
      if (!frame) return;
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (e) {
        // cross-origin or blocked — fall back to opening the certificate in a new tab
        if (viewUrl.value) window.open(viewUrl.value, "_blank");
      }
    };

    const fetchCertificates = async () => {
      loading.value = true;
      error.value = "";
      try {
        const res = await api.get("/student/certificates");
        certificates.value = res.data.data || [];
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to load.";
      } finally {
        loading.value = false;
      }
    };

    const filtered = computed(() => {
      let list = [...certificates.value];

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(
          (c) =>
            (c.course || "").toLowerCase().includes(q) ||
            (c.type || "").toLowerCase().includes(q) ||
            (c.certificate_code || "").toLowerCase().includes(q)
        );
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
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const getStatusClass = (status) => {
      if (status === "completed") return "pill pill-green";
      return "pill pill-gray";
    };

    const downloadCertificate = (c) => {
      if (!c?.certificate_id) return;
      window.open(`${API_URL}/student/certificates/${c.certificate_id}/download`, "_blank");
    };

    onMounted(fetchCertificates);

    return {
      loading,
      error,
      certificates,
      searchQuery,
      filterStatus,
      filtered,
      stats,
      fetchCertificates,
      downloadCertificate,
      formatDate,
      getStatusClass,

      viewModalOpen,
      modalCert,
      viewUrl,
      openViewModal,
      closeViewModal,
      printCertificate,
    };
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.certificate-wrapper {
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
  border-color: #10b981;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #10b981;
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
  background: #059669;
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
  to {
    transform: rotate(360deg);
  }
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

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-green {
  background: #d1fae5;
  color: #059669;
}

.stat-icon-blue {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon-amber {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon-purple {
  background: #ede9fe;
  color: #7c3aed;
}

.text-emerald {
  color: #059669;
}

.text-blue {
  color: #2563eb;
}

.text-amber {
  color: #d97706;
}

.text-purple {
  color: #7c3aed;
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
  padding: 14px 16px;
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

.panel-header-actions {
  display: flex;
  gap: 8px;
}

.select-modern-sm {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.78rem;
  color: #374151;
  background: #fff;
  outline: none;
  cursor: pointer;
}

.select-modern-sm:focus {
  border-color: #10b981;
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

.thead-green th {
  background: #10b981;
  color: #fff;
  border-bottom: none;
}

.empty-cell {
  text-align: center;
  color: #9ca3af;
  padding: 30px !important;
}

/* ===== PILLS ===== */
.pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}

.pill-green {
  background: #d1fae5;
  color: #059669;
}

.pill-gray {
  background: #f3f4f6;
  color: #6b7280;
}

/* ===== ACTION BUTTONS ===== */
.action-buttons {
  display: flex;
  gap: 6px;
}

.action-view-sm {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #3b82f6;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-view-sm:hover {
  background: #2563eb;
}

.action-download-sm {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #10b981;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.action-download-sm:hover {
  background: #059669;
}

/* ===== LOADING / EMPTY STATES ===== */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

/* ===== ERROR BANNER ===== */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 0.85rem;
}

/* ===== MODAL (same pattern as admin) ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-card {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 92vh;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}
.modal-card-xl { max-width: 1100px; }
.modal-card-tall { height: 92vh; }
.modal-head {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 10px;
}
.modal-head-green { background: #f0fdf4; }
.modal-title { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn {
  padding: 6px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body-scroll { overflow-y: auto; flex: 1; }
.modal-body-flush { padding: 0; display: flex; }
.certificate-view-frame {
  width: 100%;
  height: 100%;
  min-height: 70vh;
  border: none;
  display: block;
  background: #525659;
}

.pg-btn {
  padding: 9px 16px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}
.pg-btn-accent-blue { background: #2563eb; color: #fff; border-color: #2563eb; }
.pg-btn-accent-blue:hover { background: #1d4ed8; color: #fff; }
.pg-btn-dark { background: #1f2937; color: #fff; border-color: #1f2937; }
.pg-btn-dark:hover { background: #111827; color: #fff; }

/* ===== ANIMATIONS ===== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>