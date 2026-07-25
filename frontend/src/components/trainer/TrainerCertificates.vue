<template>
  <TrainerLayout active-page="certificates">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search students/certificates..."
            v-model="searchQuery"
            class="search-input-modern"
          />
        </div>
        <button @click="fetchRows" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="certificates-wrapper">
      <div class="page-top">
        <div class="flex items-center gap-3">
          <div>
            <h2 class="page-title">TESDA Certificate Management</h2>
            <p class="page-subtitle">Generate and manage student certificates</p>
          </div>
          <img v-if="logoUrl" :src="logoUrl" alt="Logo" class="h-10 w-auto object-contain" @error="onLogoError" />
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-banner">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Success -->
      <div v-if="successMsg" class="success-banner">
        <svg class="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ successMsg }}</span>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ issuedCount }}</span>
              <span class="stat-label">Issued</span>
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
              <span class="stat-value text-amber">{{ readyCount }}</span>
              <span class="stat-label">Ready</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ rowsFiltered.length }}</span>
              <span class="stat-label">Shown</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-red">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-red-500">{{ revokedCount }}</span>
              <span class="stat-label">Revoked</span>
            </div>
            <div class="stat-icon stat-icon-red">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Course</label>
          <select v-model="selectedCourse" class="select-modern">
            <option value="">All Courses</option>
            <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="selectedStatus" class="select-modern">
            <option value="">All</option>
            <option value="issued">Issued</option>
            <option value="ready">Ready</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Done Date</label>
          <input type="date" v-model="selectedDate" class="select-modern" />
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
        <p class="text-gray-500">Loading...</p>
      </div>

      <!-- Table -->
      <div v-else class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Certificate List</h3>
          <div class="panel-header-actions">
            <span class="text-sm text-gray-500 mr-2">Sort by:</span>
            <select v-model="sortBy" class="select-modern-sm">
              <option value="dateDesc">Most Recent</option>
              <option value="dateAsc">Oldest First</option>
              <option value="name">Student A-Z</option>
              <option value="course">Course</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Done Date</th>
                <th>TESDA Cert Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rowsFiltered" :key="row.reservation_id">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="avatar-sm bg-blue-100 text-blue-700">{{ getInitials(row.student_name) }}</div>
                    <div>
                      <div class="font-medium">{{ row.student_name }}</div>
                      <div class="text-xs text-gray-400">{{ row.student_email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="font-medium">{{ row.course_name }}</div>
                  <div class="text-xs text-gray-400">code: <span class="font-mono">{{ row.course_code || "—" }}</span></div>
                </td>
                <td>
                  <span class="text-gray-600">{{ row.done_at ? formatDate(row.done_at) : "—" }}</span>
                </td>
                <td>
                  <code class="cert-code">{{ row.certificate_code || "—" }}</code>
                </td>
                <td>
                  <span :class="getStatusPillClass(row.ui_status)">{{ formatStatus(row.ui_status) }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button v-if="row.ui_status === 'ready'" @click="openGenerateModal(row)" class="action-generate-sm">Generate</button>
                    <button v-if="row.certificate_id" @click="viewCertificate(row)" class="action-view-sm">View</button>
                  </div>
                </td>
              </tr>
              <tr v-if="rowsFiltered.length === 0">
                <td colspan="6" class="empty-cell">No results</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer-bar">
          <span>Showing {{ rowsFiltered.length }} of {{ rowsBase.length }} (TESDA)</span>
        </div>
      </div>
    </div>

    <!-- Generate Confirmation Modal -->
    <transition name="modal-fade">
      <div v-if="showGenerateModal" class="modal-overlay" @click.self="closeGenerateModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head modal-head-blue">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 class="modal-title">Generate Certificate</h3>
              </div>
              <button class="modal-close-btn" @click="closeGenerateModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to generate a TESDA certificate for 
                <span class="font-semibold text-gray-900">{{ generateTarget?.student_name }}</span> 
                (<span class="text-gray-600">{{ generateTarget?.course_name }}</span>)?
              </p>
              <p class="text-xs text-gray-400 mt-2">
                This will create a unique certificate code that the student can view and download.
              </p>
            </div>
            <div class="modal-foot">
              <button @click="closeGenerateModal" class="btn-cancel">Cancel</button>
              <button @click="confirmGenerate" :disabled="generating" class="btn-save btn-blue">
                {{ generating ? 'Generating...' : 'Generate Certificate' }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Success Notification Modal -->
    <transition name="modal-fade">
      <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head modal-head-green">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 class="modal-title">Certificate Generated</h3>
              </div>
              <button class="modal-close-btn" @click="closeSuccessModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <p class="text-sm text-gray-700 leading-relaxed">
                TESDA certificate for <span class="font-semibold">{{ successStudentName }}</span> 
                has been generated successfully.
              </p>
              <p class="text-xs text-gray-400 mt-2">
                Certificate Code: <code class="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{{ successCertCode }}</code>
              </p>
            </div>
            <div class="modal-foot">
              <button @click="closeSuccessModal" class="btn-save btn-green">OK</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- TESDA View Modal -->
    <transition name="modal-fade">
      <div v-if="tesdaModalOpen" class="modal-overlay" @click.self="closeTesdaPreview">
        <transition name="modal-scale">
          <div class="modal-card modal-card-full">
            <div class="modal-head modal-head-blue">
              <div>
                <h3 class="modal-title">TESDA Certificate View</h3>
                <p class="text-sm text-gray-600">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="downloadVisibleCertificate('png')" class="btn-outline-sm">PNG</button>
                <button @click="downloadVisibleCertificate('pdf')" class="btn-outline-sm">PDF</button>
                <button @click="printPreview" class="btn-outline-sm">Print</button>
                <button @click="closeTesdaPreview" class="modal-close-btn">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="modal-body preview-body">
              <div class="preview-wrapper">
                <div id="tesda-preview" class="tesda-certificate">
                  <img src="/tesda-logo.png" alt="TESDA Watermark" class="tesda-watermark" />
                  <div class="tesda-logo-container">
                    <img src="/tesda-logo.png" alt="TESDA Logo" class="tesda-logo-img" />
                  </div>
                  <div class="tesda-header">
                    <div class="tesda-title">TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY</div>
                    <div class="tesda-subtitle">NATIONAL INSTITUTE FOR TECHNICAL EDUCATION AND SKILLS DEVELOPMENT (NITESD)</div>
                    <div class="tesda-address">EAST SERVICE ROAD, SOUTH LUZON EXPRESSWAY (SLEX), FORT BONIFACIO, TAGUIG CITY</div>
                    <div class="tesda-divider"></div>
                  </div>
                  <div class="tesda-body">
                    <div class="tesda-label-main">CERTIFICATE OF COMPLETION</div>
                    <div class="tesda-label-sub">THIS IS TO CERTIFY THAT</div>
                    <div class="tesda-student-name">{{ modalRow?.student_name || '—' }}</div>
                    <div class="tesda-label-sub">HAS COMPLETED THE COURSE</div>
                    <div class="tesda-course-name">{{ modalRow?.course_name || '—' }}</div>
                    <div class="tesda-date"><b>ON</b> {{ modalRow?.done_at ? formatDate(modalRow.done_at) : '—' }}</div>
                  </div>
                  <div class="tesda-footer-left">
                    <div>This is a computer generated certificate,</div>
                    <div>it is valid even without a signature.</div>
                    <br />
                    <div>For verification purposes, contact:</div>
                    <div>eTESDA Division</div>
                    <div>tesdaonlineprogram@tesda.gov.ph (02) 8893 - 8297</div>
                  </div>
                  <div class="tesda-footer-right">
                    <div class="tesda-badge">TESDA<br />Online<br />PROGRAM</div>
                    <div class="tesda-cert-code">{{ modalRow?.certificate_code || 'TESDA-CODE' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </TrainerLayout>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import TrainerLayout from "./TrainerLayout.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const API_BASE = API_URL.replace("/api", "");

export default {
  name: "TrainerCertificates",
  components: { TrainerLayout },
  setup() {
    const logoUrl = ref("/tesda-logo.png");
    const onLogoError = () => (logoUrl.value = "");

    const rows = ref([]);
    const loading = ref(true);
    const error = ref("");
    const successMsg = ref("");

    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");
    const selectedDate = ref("");
    const sortBy = ref("dateDesc");
    const tesdaModalOpen = ref(false);
    const modalRow = ref(null);

    // Generate modal
    const showGenerateModal = ref(false);
    const generateTarget = ref(null);
    const generating = ref(false);

    // Success modal
    const showSuccessModal = ref(false);
    const successStudentName = ref("");
    const successCertCode = ref("");

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
          case "dateDesc": return new Date(b.done_at || 0) - new Date(a.done_at || 0);
          case "dateAsc": return new Date(a.done_at || 0) - new Date(b.done_at || 0);
          case "name": return (a.student_name || "").localeCompare(b.student_name || "");
          case "course": return (a.course_name || "").localeCompare(b.course_name || "");
          case "status": return (a.ui_status || "").localeCompare(b.ui_status || "");
          default: return 0;
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

    const getStatusPillClass = (status) => {
      switch (status) {
        case "issued": return "pill pill-blue";
        case "ready": return "pill pill-amber";
        case "revoked": return "pill pill-red";
        default: return "pill pill-gray";
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
        const res = await api.get("/trainer/certificates/tesda/completions");
        const data = res?.data?.data || [];
        rows.value = data.map((r) => ({ ...r, ui_status: r.ui_status || (r.certificate_id ? "issued" : "ready") }));
      } catch (e) {
        console.log("CERT ERR:", e?.response?.status, e?.response?.data);
        error.value = (e?.response?.data && JSON.stringify(e.response.data)) || e.message || "Failed to load.";
      } finally {
        loading.value = false;
      }
    };

    // Generate modal flow
    const openGenerateModal = (row) => {
      generateTarget.value = row;
      showGenerateModal.value = true;
    };

    const closeGenerateModal = () => {
      showGenerateModal.value = false;
      generateTarget.value = null;
    };

    const confirmGenerate = async () => {
      if (!generateTarget.value) return;
      generating.value = true;
      error.value = "";
      try {
        const row = generateTarget.value;
        const res = await api.post("/trainer/certificates/tesda/generate", {
          reservation_id: row.reservation_id,
        });
        closeGenerateModal();
        await fetchRows();
        
        // Show success modal
        const updatedRow = rows.value.find(r => r.reservation_id === row.reservation_id);
        successStudentName.value = row.student_name;
        successCertCode.value = updatedRow?.certificate_code || res?.data?.certificate_code || "Generated";
        showSuccessModal.value = true;
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to generate TESDA certificate.";
        closeGenerateModal();
      } finally {
        generating.value = false;
      }
    };

    const closeSuccessModal = () => {
      showSuccessModal.value = false;
      successStudentName.value = "";
      successCertCode.value = "";
    };

    const viewCertificate = (row) => { openTesdaPreview(row); };

    const getDownloadFileName = (format) => {
      const code = modalRow.value?.certificate_code || "TESDA-certificate";
      return `${String(code).replace(/[^a-z0-9_-]/gi, "_")}.${format}`;
    };

    const downloadVisibleCertificate = async (format = "png") => {
      error.value = "";
      await nextTick();
      const target = document.getElementById("tesda-preview");
      if (!target) { error.value = "No certificate is currently visible."; return; }
      try {
        const canvas = await html2canvas(target, { backgroundColor: "#ffffff", scale: 3, useCORS: true, allowTaint: true, logging: false });
        const imgData = canvas.toDataURL("image/png");
        if (format === "png") {
          const a = document.createElement("a"); a.href = imgData; a.download = getDownloadFileName("png");
          document.body.appendChild(a); a.click(); a.remove(); return;
        }
        const pdf = new jsPDF({ orientation: "landscape", unit: "in", format: [11, 8.5] });
        pdf.addImage(imgData, "PNG", 0, 0, 11, 8.5); pdf.save(getDownloadFileName("pdf"));
      } catch (e) { console.error("downloadVisibleCertificate error:", e); error.value = e?.message || "Failed to download visible certificate."; }
    };

    const openTesdaPreview = (row) => { modalRow.value = row; tesdaModalOpen.value = true; };
    const closeTesdaPreview = () => { tesdaModalOpen.value = false; modalRow.value = null; };

    const getHeadStylesHtml = () => {
      const nodes = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
      return nodes.map((n) => n.outerHTML).join("\n");
    };

    const printPreview = () => {
      const target = document.getElementById("tesda-preview");
      if (!target) return;
      const cloned = target.cloneNode(true);
      cloned.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.startsWith("/")) img.setAttribute("src", `${window.location.origin}${src}`);
      });
      const w = window.open("", "_blank", "width=1300,height=850");
      if (!w) return;
      const styles = getHeadStylesHtml();
      w.document.open();
      w.document.write(`<!DOCTYPE html><html><head><title>Print TESDA Certificate</title>${styles}<style> * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } html, body { width: 11in; height: 8.5in; margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; overflow: hidden; } @page { size: letter landscape; margin: 0; } .wrap { width: 11in; height: 8.5in; margin: 0; padding: 0; overflow: hidden; background: #fff; } #tesda-preview { width: 11in !important; height: 8.5in !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; transform: none !important; } img { max-width: none !important; } @media print { html, body { width: 11in; height: 8.5in; margin: 0 !important; padding: 0 !important; overflow: hidden !important; } .wrap { width: 11in !important; height: 8.5in !important; } }</style></head><body><div class="wrap">${cloned.outerHTML}</div></body></html>`);
      w.document.close();
      const waitForImagesThenPrint = () => {
        const imgs = Array.from(w.document.images || []);
        if (!imgs.length) { w.focus(); w.print(); return; }
        let loaded = 0;
        const done = () => { loaded += 1; if (loaded >= imgs.length) { setTimeout(() => { w.focus(); w.print(); }, 350); } };
        imgs.forEach((img) => { if (img.complete) done(); else { img.onload = done; img.onerror = done; } });
      };
      w.onload = waitForImagesThenPrint;
      w.onafterprint = () => w.close();
    };

    onMounted(fetchRows);

    return {
      logoUrl, onLogoError, rows, loading, error, successMsg,
      searchQuery, selectedCourse, selectedStatus, selectedDate, sortBy,
      rowsBase, rowsFiltered, courseOptions,
      issuedCount, readyCount, revokedCount,
      getInitials, formatDate, getStatusPillClass, formatStatus,
      clearFilters, fetchRows,
      showGenerateModal, generateTarget, generating,
      openGenerateModal, closeGenerateModal, confirmGenerate,
      showSuccessModal, successStudentName, successCertCode, closeSuccessModal,
      viewCertificate, downloadVisibleCertificate,
      tesdaModalOpen, modalRow, openTesdaPreview, closeTesdaPreview, printPreview,
    };
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.certificates-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }

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

/* ===== ERROR / SUCCESS ===== */
.error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; }
.success-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 12px; color: #059669; font-size: 0.85rem; }

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
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-red { background: #fee2e2; color: #dc2626; }
.text-emerald { color: #059669; } .text-blue { color: #2563eb; } .text-amber { color: #d97706; } .text-red-500 { color: #ef4444; }

/* ===== FILTERS BAR ===== */
.filters-bar { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 20px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }
.select-modern { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; background: #fff; color: #111827; min-width: 140px; }
.select-modern:focus { border-color: #3b82f6; }
.filter-actions { display: flex; gap: 8px; align-items: flex-end; }
.btn-outline-sm { padding: 9px 16px; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-outline-sm:hover { background: #f3f4f6; }

/* ===== PANEL CARD ===== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-header-actions { display: flex; align-items: center; gap: 8px; }
.select-modern-sm { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.78rem; color: #374151; background: #fff; outline: none; cursor: pointer; }

/* ===== TABLE ===== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.table-footer-bar { padding: 12px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; font-size: 0.75rem; color: #6b7280; }

.avatar-sm { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
.cert-code { font-size: 0.75rem; background: #f3f4f6; padding: 3px 8px; border-radius: 6px; font-family: monospace; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ===== ACTION BUTTONS ===== */
.action-buttons { display: flex; gap: 6px; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }
.action-generate-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #10b981; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-generate-sm:hover { background: #059669; }

/* ===== MODAL ===== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-card-sm { max-width: 420px; }
.modal-card-full { max-width: 95vw; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
.modal-head-blue { background: #eff6ff; }
.modal-head-green { background: #f0fdf4; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; }
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-blue { background: #3b82f6; }
.btn-blue:hover:not(:disabled) { background: #2563eb; }
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.preview-body { padding: 16px; background: #e5e7eb; }
.preview-wrapper { display: flex; justify-content: center; }

/* ===== TESDA CERTIFICATE ===== */
.tesda-certificate {
  position: relative; background: #fff; overflow: hidden; color: #111827; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 11in; height: 8.5in; font-family: Arial, Helvetica, sans-serif;
}
.tesda-watermark { position: absolute; left: 1.15in; top: 1.55in; width: 5.2in; height: 5.2in; object-fit: contain; opacity: 0.055; pointer-events: none; user-select: none; }
.tesda-logo-container { position: absolute; left: 0.32in; top: 0.20in; width: 1.05in; height: 1.05in; }
.tesda-logo-img { width: 100%; height: 100%; object-fit: contain; }
.tesda-header { position: absolute; left: 1.55in; top: 0.22in; width: 8.9in; }
.tesda-title { font-size: 22px; font-weight: 500; letter-spacing: 0.2px; }
.tesda-subtitle { font-size: 13.5px; margin-top: 4px; font-weight: 500; }
.tesda-address { font-size: 13.5px; margin-top: 2px; font-weight: 500; }
.tesda-divider { height: 9px; background: #003cff; width: 7.9in; margin-top: 8px; }
.tesda-body { position: absolute; left: 1.55in; top: 1.55in; width: 8.7in; }
.tesda-label-main { font-size: 41px; line-height: 1; font-weight: 900; letter-spacing: 2px; }
.tesda-label-sub { margin-top: 23px; font-size: 17px; font-weight: 700; letter-spacing: 0.5px; }
.tesda-student-name { margin-top: 23px; font-size: 38px; line-height: 1.05; font-weight: 400; }
.tesda-course-name { margin-top: 18px; font-size: 34px; line-height: 1.12; font-weight: 400; max-width: 8.8in; }
.tesda-date { margin-top: 46px; font-size: 17px; font-weight: 500; }
.tesda-footer-left { position: absolute; left: 0.47in; bottom: 0.48in; font-size: 17px; line-height: 1.25; font-weight: 600; }
.tesda-footer-right { position: absolute; right: 0.47in; bottom: 0.46in; text-align: right; font-size: 13px; line-height: 1.1; }
.tesda-badge { width: 0.95in; height: 0.95in; border-radius: 50%; background: #1aa0e8; color: #fff; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 900; font-size: 14px; line-height: 1.05; margin-left: auto; margin-bottom: 8px; transform: rotate(-7deg); }
.tesda-cert-code { margin-top: 4px; }

/* ===== LOADING ===== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }

/* ===== ANIMATIONS ===== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>