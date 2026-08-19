<!-- src/components/InstructorCertificates.vue -->
<template>
  <InstructorLayout active-page="certificates">
    <!-- Header -->
    <template #header-left>
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
    </template>

    <div>
      <!-- Page Header -->
      <div class="page-header-row mb-5">
        <div class="flex justify-between items-center w-full flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div>
              <h2 class="page-title">Driving Certificate Management</h2>
              <p class="page-subtitle">Generate, preview, and manage your students' driving certificates</p>
            </div>
            <img
              v-if="logoUrl"
              :src="logoUrl"
              alt="Logo"
              class="header-logo-img"
              @error="onLogoError"
            />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="panel-card mb-5">
        <div class="panel-header-bar filters-bar">
          <div class="filter-field">
            <label class="filter-label">Course</label>
            <select v-model="selectedCourse" class="select-modern-sm" style="width: 220px;">
              <option value="">All Courses</option>
              <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="filter-field">
            <label class="filter-label">Status</label>
            <select v-model="selectedStatus" class="select-modern-sm">
              <option value="">All</option>
              <option value="issued">Issued</option>
              <option value="ready">Ready</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div class="filter-field">
            <label class="filter-label">Done Date</label>
            <input type="date" v-model="selectedDate" class="date-input-modern" />
          </div>

          <button @click="clearFilters" class="pg-btn">Clear</button>
          <button @click="exportCsv" class="pg-btn pg-btn-accent">Export CSV</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stat-grid mb-5">
        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-green">{{ issuedCount }}</span>
              <p class="stat-label">Issued</p>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-amber">{{ readyCount }}</span>
              <p class="stat-label">Ready</p>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-blue">{{ rowsFiltered.length }}</span>
              <p class="stat-label">Shown</p>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-red">{{ revokedCount }}</span>
              <p class="stat-label">Revoked</p>
            </div>
            <div class="stat-icon stat-icon-red">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <span class="text-sm text-gray-600">
            Showing {{ rowsFiltered.length }} of {{ rowsBase.length }} <span class="font-semibold text-gray-700">(Driving)</span>
          </span>

          <div class="filter-field" style="flex-direction: row; align-items: center; gap: 8px;">
            <label class="filter-label" style="margin: 0;">Sort by</label>
            <select v-model="sortBy" class="select-modern-sm">
              <option value="dateDesc">Most Recent</option>
              <option value="dateAsc">Oldest First</option>
              <option value="name">Student A-Z</option>
              <option value="course">Course</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p class="text-gray-500">Loading...</p>
        </div>

        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Done Date</th>
                <th>Driving Cert Code</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in rowsFiltered" :key="row.reservation_id">
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ getInitials(row.student_name) }}</div>
                    <div>
                      <p class="font-medium">{{ row.student_name }}</p>
                      <p class="text-xs text-gray-400">{{ row.student_email }}</p>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="font-medium">{{ row.course_name }}</span>
                  <p class="text-xs text-gray-400 mt-0.5">code: <span class="font-mono">{{ row.course_code || "—" }}</span></p>
                </td>

                <td class="text-gray-500 text-sm">{{ row.done_at ? formatDate(row.done_at) : "—" }}</td>

                <td>
                  <code class="cert-code-badge">{{ row.certificate_code || "—" }}</code>
                </td>

                <td>
                  <span class="pill" :class="getStatusClass(row.ui_status)">{{ formatStatus(row.ui_status) }}</span>
                </td>

                <td class="whitespace-nowrap">
                  <div class="action-btns">
                    <button v-if="row.ui_status === 'ready'" @click="generateDriving(row)" class="action-generate">
                      + Generate
                    </button>

                    <button @click="openDrivingPreview(row)" class="action-edit" style="display:none;">Preview/Edit</button>

                    <button v-if="row.certificate_id" @click="viewCertificate(row)" class="action-view">View</button>

                    <button v-if="row.certificate_id" @click="downloadCertificate(row)" class="action-download">Download</button>
                  </div>
                </td>
              </tr>

              <tr v-if="rowsFiltered.length === 0">
                <td colspan="6" class="empty-cell">
                  <span class="text-3xl mb-2 block">🎓</span>
                  No results — try adjusting your filters
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <!-- DRIVING Modal (Preview/Edit) — hidden trigger button; kept intact for future use -->
      <transition name="modal-fade">
        <div v-if="drivingModalOpen" class="modal-overlay" @click.self="closeModals">
          <transition name="modal-scale">
            <div class="modal-card modal-card-xl">
              <div class="modal-head modal-head-green">
                <div>
                  <h3 class="modal-title">Driving Certificate Preview — {{ isPDC(modalRow) ? "PDC" : "TDC" }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    v-if="modalRow && modalRow.ui_status === 'ready'"
                    @click="generateDriving(modalRow, draftToOverrides())"
                    class="pg-btn pg-btn-accent"
                  >
                    ✅ Generate from Preview
                  </button>
                  <button @click="printPreview()" class="pg-btn pg-btn-dark">🖨️ Print</button>
                  <button class="modal-close-btn" @click="closeModals">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="modal-body-scroll">
                <!-- EDIT PANEL -->
                <div class="edit-panel">
                  <div class="flex flex-wrap items-start gap-6">
                    <div v-if="isPDC(modalRow)">
                      <div class="form-label" style="margin-bottom: 8px;">Mode (MT / AT)</div>
                      <div class="flex items-center gap-3">
                        <label class="radio-label">
                          <input type="radio" value="MT" v-model="draft.mode" @change="applyModeToDl()" />
                          MT
                        </label>
                        <label class="radio-label">
                          <input type="radio" value="AT" v-model="draft.mode" @change="applyModeToDl()" />
                          AT
                        </label>
                      </div>
                      <div class="text-xs text-gray-400 mt-1">* This DOES NOT print as text. It moves the checkmarks to MT/AT columns.</div>
                    </div>

                    <div v-if="isPDC(modalRow)" class="flex-1" style="min-width: 320px;">
                      <div class="form-label" style="margin-bottom: 8px;">DL Codes Checklist</div>
                      <div class="dl-grid">
                        <div class="dl-box">
                          <div class="dl-box-title">Left</div>
                          <div v-for="item in leftDlCodes" :key="'L-'+item.code" class="dl-row">
                            <div class="text-xs"><b>{{ item.code }}</b> <span class="text-gray-500">{{ item.desc }}</span></div>
                            <div class="flex items-center gap-4 text-xs">
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].mt" @change="syncModeFromDl()" />
                                MT
                              </label>
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].at" @change="syncModeFromDl()" />
                                AT
                              </label>
                            </div>
                          </div>
                        </div>

                        <div class="dl-box">
                          <div class="dl-box-title">Right</div>
                          <div v-for="item in rightDlCodes" :key="'R-'+item.code" class="dl-row">
                            <div class="text-xs"><b>{{ item.code }}</b> <span class="text-gray-500">{{ item.desc }}</span></div>
                            <div class="flex items-center gap-4 text-xs">
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].mt" @change="syncModeFromDl()" />
                                MT
                              </label>
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].at" @change="syncModeFromDl()" />
                                AT
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="text-xs text-gray-400 mt-2">* Kung AT ang mode, ililipat automatically yung checks to AT column (A/B based on course_code).</div>
                    </div>
                  </div>
                </div>

                <!-- PREVIEW -->
                <div class="p-4">
                  <div
                    id="driving-preview"
                    class="relative w-full border border-gray-200 rounded-xl overflow-hidden bg-white"
                    style="aspect-ratio: 8.5 / 11"
                  >
                    <div class="absolute inset-0 p-8">
                      <!-- Header -->
                      <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-14 h-14 rounded-full border border-gray-300 overflow-hidden bg-white flex items-center justify-center">
                            <img v-if="logoUrl" :src="logoUrl" class="w-full h-full object-contain" />
                            <div v-else class="text-[10px] text-gray-500">LOGO</div>
                          </div>

                          <div class="leading-tight">
                            <div class="text-xs text-gray-700">Republic of the Philippines</div>
                            <div class="text-sm font-extrabold text-gray-900">DEPARTMENT OF TRANSPORTATION</div>
                            <div class="text-sm font-extrabold text-gray-900">LAND TRANSPORTATION OFFICE</div>
                            <div class="text-xs text-gray-600">East Avenue, Quezon City</div>
                          </div>
                        </div>

                        <!-- 2x2 -->
                        <div class="w-28">
                          <div class="w-28 h-28 border border-gray-400 bg-gray-50 overflow-hidden rounded-md flex items-center justify-center">
                            <img
                              v-if="modalRow?.picture_2x2"
                              :src="toFileUrl(modalRow.picture_2x2)"
                              alt="2x2"
                              class="w-full h-full object-cover"
                            />
                            <div v-else class="text-[10px] text-gray-500 text-center px-2">
                              2x2 Photo<br />missing
                            </div>
                          </div>
                          <div class="mt-1 text-[10px] text-gray-500 text-center">2x2</div>
                        </div>
                      </div>

                      <!-- Title -->
                      <div class="mt-6 text-center">
                        <div class="text-xl font-extrabold text-gray-900">CERTIFICATE OF COMPLETION</div>
                        <div class="text-sm font-bold text-gray-800">
                          {{ isPDC(modalRow) ? "PRACTICAL DRIVING COURSE" : "THEORETICAL DRIVING COURSE" }}
                        </div>
                      </div>

                      <!-- PDC DL Codes preview -->
                      <div v-if="isPDC(modalRow)" class="mt-6">
                        <div class="grid grid-cols-2 gap-6 text-[11px]">
                          <div class="border border-gray-300 rounded">
                            <div class="px-2 py-1 font-bold bg-gray-50 border-b border-gray-300">
                              DL Code (Vehicle Category)
                            </div>
                            <div class="p-2">
                              <div class="grid grid-cols-12 font-bold text-gray-700 mb-1">
                                <div class="col-span-8">DL Code</div>
                                <div class="col-span-2 text-center">MT</div>
                                <div class="col-span-2 text-center">AT</div>
                              </div>

                              <div
                                v-for="item in leftDlCodes"
                                :key="item.code"
                                class="grid grid-cols-12 items-center border-t border-gray-200 py-1"
                              >
                                <div class="col-span-8">
                                  <span class="font-semibold">{{ item.code }}</span>
                                  <span class="text-gray-600 ml-2">{{ item.desc }}</span>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.mt ? "✓" : "" }}
                                  </div>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.at ? "✓" : "" }}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="border border-gray-300 rounded">
                            <div class="px-2 py-1 font-bold bg-gray-50 border-b border-gray-300">
                              DL Code (Vehicle Category)
                            </div>
                            <div class="p-2">
                              <div class="grid grid-cols-12 font-bold text-gray-700 mb-1">
                                <div class="col-span-8">DL Code</div>
                                <div class="col-span-2 text-center">MT</div>
                                <div class="col-span-2 text-center">AT</div>
                              </div>

                              <div
                                v-for="item in rightDlCodes"
                                :key="item.code"
                                class="grid grid-cols-12 items-center border-t border-gray-200 py-1"
                              >
                                <div class="col-span-8">
                                  <span class="font-semibold">{{ item.code }}</span>
                                  <span class="text-gray-600 ml-2">{{ item.desc }}</span>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.mt ? "✓" : "" }}
                                  </div>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.at ? "✓" : "" }}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="mt-3 text-[10px] text-gray-600">
                          * Preview DL checklist only.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 text-sm text-gray-500">
                    <b>Note:</b> MT/AT is via checkbox column only (no Transmission text).
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- DRIVING View Modal (embeds the actual generated certificate from the backend, like a PDF viewer) -->
      <transition name="modal-fade">
        <div v-if="drivingViewModalOpen" class="modal-overlay" @click.self="closeModals">
          <transition name="modal-scale">
            <div class="modal-card modal-card-xl modal-card-tall">
              <div class="modal-head modal-head-green">
                <div>
                  <h3 class="modal-title">Driving Certificate — {{ isPDC(modalRow) ? "PDC" : "TDC" }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="downloadCertificate(modalRow)" class="pg-btn pg-btn-accent-blue">Download PDF</button>
                  <button class="modal-close-btn" @click="closeModals">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="modal-body-scroll modal-body-flush" style="background: #525659;">
                <iframe
                  v-if="drivingViewUrl"
                  :src="drivingViewUrl"
                  class="driving-view-frame"
                  title="Driving Certificate"
                ></iframe>
                <div v-else class="empty-cell" style="color:#e5e7eb;">
                  No generated certificate found to display.
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </div>
  </InstructorLayout>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import InstructorLayout from "./InstructorLayout.vue";
import { API_URL } from "../../config/api";

export default {
  name: "InstructorCertificates",
  components: { InstructorLayout },
  setup() {
    const API_BASE = API_URL;

    const api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });

    const logoUrl = ref(`${API_BASE}/assets/logo.png`);
    const onLogoError = () => (logoUrl.value = "");

    // ✅ Instructor endpoints (DRIVING only) — matches backend routes
    const ENDPOINTS = {
      list: `/instructor/certificates/driving/completions`,
      generate: `/instructor/certificates/driving/generate`,
      view: (id) => `${API_BASE}/instructor/certificates/driving/${id}/view`,
      download: (id) => `${API_BASE}/instructor/certificates/driving/${id}/download`,
    };

    // ✅ convert relative paths like "uploads/xxx.jpg" or "/uploads/xxx.jpg" to full URL
    const toFileUrl = (p) => {
      const v = String(p || "").trim();
      if (!v) return "";
      if (/^https?:\/\//i.test(v)) return v;
      const cleaned = v.replace(/\\/g, "/").replace(/^\/+/, "");
      return `${API_BASE}/${cleaned}`;
    };

    const rows = ref([]);
    const loading = ref(true);
    const error = ref("");

    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");
    const selectedDate = ref("");
    const sortBy = ref("dateDesc");

    const drivingModalOpen = ref(false);
    const drivingViewModalOpen = ref(false);
    const modalRow = ref(null);

    const leftDlCodes = ref([
      { code: "A", desc: "(L1,L2,L3)" },
      { code: "A1", desc: "(L4,L5,L6,L7)" },
      { code: "B", desc: "(M1)" },
      { code: "B1", desc: "(M2)" },
      { code: "B2", desc: "(N1)" },
    ]);
    const rightDlCodes = ref([
      { code: "BE", desc: "(O1,O2)" },
      { code: "C", desc: "(N2,N3)" },
      { code: "CE", desc: "(O3,O4)" },
      { code: "D", desc: "(M3)" },
    ]);

    const allDlCodes = computed(() => [...leftDlCodes.value, ...rightDlCodes.value].map((x) => x.code));

    const draft = ref({
      mode: "MT",
      dl: {},
    });

    const normalizeCourseCode = (v) => String(v || "").trim().toUpperCase();

    // ✅ same logic as backend isPDC()
    const isPDC = (row) => {
      const cc = normalizeCourseCode(row?.course_code);
      if (cc.includes("PDC")) return true;
      const name = String(row?.course_name || "").toUpperCase();
      return name.includes("PRACTICAL") || name.includes("PDC");
    };

    const parsePdcAB = (course_code = "", course_name = "") => {
      const s = String(course_code || "").toUpperCase();
      if (/\bAB\b/.test(s) || /PDC\s*[-(]?\s*AB/.test(s)) return "AB";
      if (/\bA\b/.test(s) || /PDC\s*[-(]?\s*A\b/.test(s)) return "A";
      if (/\bB\b/.test(s) || /PDC\s*[-(]?\s*B\b/.test(s)) return "B";
      const n = String(course_name || "").toUpperCase();
      if (n.includes("(AB)")) return "AB";
      if (n.includes("(A)")) return "A";
      if (n.includes("(B)")) return "B";
      return "";
    };

    const initDraftForRow = (row) => {
      draft.value = { mode: "MT", dl: {} };
      for (const code of allDlCodes.value) {
        draft.value.dl[code] = { mt: false, at: false };
      }

      // default tick based on course_code for A/B only
      if (isPDC(row)) {
        const parsed = parsePdcAB(row?.course_code, row?.course_name);
        const shouldA = parsed === "A" || parsed === "AB";
        const shouldB = parsed === "B" || parsed === "AB";
        if (shouldA) draft.value.dl["A"].mt = true;
        if (shouldB) draft.value.dl["B"].mt = true;
      }
    };

    const applyModeToDl = () => {
      if (!modalRow.value || !isPDC(modalRow.value)) return;
      const parsed = parsePdcAB(modalRow.value?.course_code, modalRow.value?.course_name);
      const shouldA = parsed === "A" || parsed === "AB";
      const shouldB = parsed === "B" || parsed === "AB";

      if (shouldA) {
        draft.value.dl["A"].mt = false;
        draft.value.dl["A"].at = false;
        draft.value.dl["A"][draft.value.mode === "AT" ? "at" : "mt"] = true;
      }
      if (shouldB) {
        draft.value.dl["B"].mt = false;
        draft.value.dl["B"].at = false;
        draft.value.dl["B"][draft.value.mode === "AT" ? "at" : "mt"] = true;
      }
    };

    const syncModeFromDl = () => {
      if (!modalRow.value || !isPDC(modalRow.value)) return;
      const aAt = !!draft.value.dl["A"]?.at;
      const bAt = !!draft.value.dl["B"]?.at;
      const aMt = !!draft.value.dl["A"]?.mt;
      const bMt = !!draft.value.dl["B"]?.mt;

      if ((aAt || bAt) && !(aMt || bMt)) draft.value.mode = "AT";
      if ((aMt || bMt) && !(aAt || bAt)) draft.value.mode = "MT";
    };

    // ✅ matches backend sanitizeOverrides(): { mode, dl }
    const draftToOverrides = () => {
      const dl = {};
      for (const code of Object.keys(draft.value.dl || {})) {
        const v = draft.value.dl[code];
        if (v?.mt || v?.at) dl[code] = { mt: !!v.mt, at: !!v.at };
      }
      return { mode: draft.value.mode, dl };
    };

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

    // ✅ aligned fetch to backend response
    const fetchRows = async () => {
      loading.value = true;
      error.value = "";
      try {
        const res = await api.get(ENDPOINTS.list);
        const data = res?.data?.data || [];

        // normalize/safety defaults
        rows.value = data.map((r) => ({
          ...r,
          ui_status: r.ui_status || (r.certificate_id ? "issued" : "ready"),
        }));
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to load.";
      } finally {
        loading.value = false;
      }
    };

    const generateDriving = async (row, overrides = null) => {
      error.value = "";
      try {
        const ok = confirm(`Generate DRIVING certificate for ${row.student_name} (${row.course_name})?`);
        if (!ok) return;

        const payload = { reservation_id: row.reservation_id };
        if (overrides) payload.overrides = overrides;

        await api.post(ENDPOINTS.generate, payload);
        await fetchRows();
        closeModals();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to generate DRIVING certificate.";
      }
    };

    const drivingViewUrl = computed(() => {
      const id = modalRow.value?.certificate_id;
      return id ? ENDPOINTS.view(id) : "";
    });

    const openDrivingView = (row) => {
      modalRow.value = row;
      drivingViewModalOpen.value = true;
      drivingModalOpen.value = false;
    };

    const viewCertificate = (row) => {
      if (!row?.certificate_id) return;
      openDrivingView(row);
    };

    const downloadCertificate = (row) => {
      if (!row?.certificate_id) return;
      window.open(ENDPOINTS.download(row.certificate_id), "_blank");
    };

    const openDrivingPreview = (row) => {
      modalRow.value = row;
      initDraftForRow(row);
      drivingModalOpen.value = true;
      drivingViewModalOpen.value = false;
    };

    const closeModals = () => {
      drivingModalOpen.value = false;
      drivingViewModalOpen.value = false;
      modalRow.value = null;
      draft.value = { mode: "MT", dl: {} };
    };

    const getHeadStylesHtml = () => {
      const nodes = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
      return nodes.map((n) => n.outerHTML).join("\n");
    };

    const printPreview = () => {
      const target = document.getElementById("driving-preview");
      if (!target) return;

      const w = window.open("", "_blank", "width=1200,height=800");
      if (!w) return;

      const styles = getHeadStylesHtml();

      w.document.open();
      w.document.write(`
        <html>
          <head>
            <title>Print Certificate</title>
            ${styles}
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #fff; }
              .wrap { width: 100%; }
              @media print { body { padding: 0; } }
              img { max-width: 100%; }
            </style>
          </head>
          <body>
            <div class="wrap">${target.outerHTML}</div>
          </body>
        </html>
      `);
      w.document.close();

      w.onload = () => {
        w.focus();
        w.print();
        w.onafterprint = () => w.close();
      };
    };

    const exportCsv = () => {
      const headers = ["Student", "Email", "Course", "Course Code", "Done At", "Certificate Code", "Status"];
      const lines = rowsFiltered.value.map((r) => {
        const arr = [
          r.student_name,
          r.student_email,
          r.course_name,
          r.course_code || "",
          (r.done_at || "").slice(0, 10),
          r.certificate_code || "",
          r.ui_status || "",
        ];
        return arr.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
      });

      const csv = [headers.join(","), ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `instructor-driving-certificates.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    onMounted(fetchRows);

    return {
      API_BASE,
      logoUrl,
      onLogoError,
      toFileUrl,

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

      leftDlCodes,
      rightDlCodes,
      draft,
      isPDC,
      applyModeToDl,
      syncModeFromDl,
      draftToOverrides,

      fetchRows,
      generateDriving,
      viewCertificate,
      downloadCertificate,

      drivingModalOpen,
      drivingViewModalOpen,
      drivingViewUrl,
      modalRow,
      openDrivingPreview,
      openDrivingView,
      closeModals,
      printPreview,

      exportCsv,
    };
  },
};
</script>

<style scoped>
/* ========== PAGE HEADER ========== */
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.header-logo-img { height: 40px; width: auto; object-fit: contain; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* ========== REFRESH BUTTON ========== */
.refresh-btn-modern { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn-modern:hover { background: #059669; transform: translateY(-1px); }

/* ========== PANEL / FILTERS ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.filters-bar { align-items: flex-end; gap: 14px; }
.filter-field { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }

/* ========== MODERN SELECT / INPUT ========== */
.select-modern-sm {
  appearance: none; -webkit-appearance: none; -moz-appearance: none;
  padding: 9px 36px 9px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px;
  background-color: #fff;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat; background-position: right 10px center; background-size: 16px;
  font-size: 0.82rem; font-weight: 600; color: #374151; cursor: pointer; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.select-modern-sm:hover { border-color: #a7f3d0; }
.select-modern-sm:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); background-color: #f0fdf4; }

.date-input-modern { padding: 9px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 0.82rem; font-weight: 600; color: #374151; outline: none; transition: border-color 0.2s; background: #fff; }
.date-input-modern:focus { border-color: #10b981; }

.pg-btn { padding: 9px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover { border-color: #10b981; color: #059669; }
.pg-btn-accent { background: #10b981; color: #fff; border-color: #10b981; }
.pg-btn-accent:hover { background: #059669; color: #fff; }
.pg-btn-accent-blue { background: #2563eb; color: #fff; border-color: #2563eb; }
.pg-btn-accent-blue:hover { background: #1d4ed8; color: #fff; }
.pg-btn-dark { background: #1f2937; color: #fff; border-color: #1f2937; }
.pg-btn-dark:hover { background: #111827; color: #fff; }

/* ========== STATS ========== */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-value { font-size: 1.75rem; font-weight: 700; line-height: 1; display: block; }
.stat-value-green { color: #059669; }
.stat-value-amber { color: #d97706; }
.stat-value-blue { color: #2563eb; }
.stat-value-red { color: #dc2626; }
.stat-label { font-size: 0.82rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-red { background: #fee2e2; color: #dc2626; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 40px !important; }
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }

/* ========== USER CELL ========== */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: #d1fae5; color: #047857; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }

/* ========== PILLS / CODES ========== */
.pill { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.bg-green-100 { background: #d1fae5; } .text-green-800 { color: #065f46; }
.bg-yellow-100 { background: #fef3c7; } .text-yellow-800 { color: #92400e; }
.bg-red-100 { background: #fee2e2; } .text-red-800 { color: #991b1b; }
.bg-gray-100 { background: #f3f4f6; } .text-gray-800 { color: #1f2937; }
.cert-code-badge { font-size: 0.72rem; background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-family: monospace; color: #374151; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.action-generate, .action-edit, .action-view, .action-download {
  padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; color: #fff;
}
.action-generate { background: #059669; }
.action-generate:hover { background: #047857; }
.action-edit { background: #3b82f6; }
.action-edit:hover { background: #2563eb; }
.action-view { background: #6366f1; }
.action-view:hover { background: #4f46e5; }
.action-download { background: #7c3aed; }
.action-download:hover { background: #6d28d9; }

/* ========== ERROR TEXT ========== */
.error-text { margin-top: 16px; font-size: 0.85rem; color: #dc2626; }

/* ========== MODAL ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 720px; max-height: 92vh; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-xl { max-width: 1100px; }
.modal-card-tall { height: 92vh; }
.modal-body-flush { padding: 0; display: flex; }
.driving-view-frame { width: 100%; height: 100%; min-height: 70vh; border: none; display: block; background: #525659; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; flex-wrap: wrap; gap: 10px; }
.modal-head-green { background: #f0fdf4; }
.modal-title { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body-scroll { overflow-y: auto; flex: 1; }

/* ========== EDIT PANEL ========== */
.edit-panel { padding: 16px 20px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
.form-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; }
.radio-label, .check-label { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #374151; cursor: pointer; }
.radio-label input, .check-label input { accent-color: #10b981; width: 15px; height: 15px; }

.dl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 640px) { .dl-grid { grid-template-columns: 1fr; } }
.dl-box { border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; padding: 12px; }
.dl-box-title { font-size: 0.7rem; font-weight: 700; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; }
.dl-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
.dl-row:last-child { border-bottom: none; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ========== MISC ========== */
.font-medium { font-weight: 500; } .font-semibold { font-weight: 600; } .font-mono { font-family: monospace; }
.text-sm { font-size: 0.85rem; } .text-xs { font-size: 0.72rem; } .text-xl { font-size: 1.25rem; }
.text-gray-400 { color: #9ca3af; } .text-gray-500 { color: #6b7280; } .text-gray-600 { color: #4b5563; } .text-gray-700 { color: #374151; } .text-gray-900 { color: #111827; }
.text-emerald-600 { color: #059669; }
.w-4 { width: 16px; } .h-4 { height: 16px; } .w-5 { width: 20px; } .h-5 { height: 20px; }
.w-14 { width: 56px; } .h-14 { height: 56px; } .w-28 { width: 112px; } .h-28 { height: 112px; }
.flex { display: flex; } .flex-wrap { flex-wrap: wrap; } .flex-1 { flex: 1 1 0%; }
.items-center { align-items: center; } .items-start { align-items: flex-start; }
.justify-between { justify-content: space-between; } .justify-center { justify-content: center; }
.gap-2 { gap: 8px; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; }
.mb-5 { margin-bottom: 20px; } .mt-1 { margin-top: 4px; } .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; }
.mt-0\.5 { margin-top: 2px; } .ml-2 { margin-left: 8px; }
.p-2 { padding: 8px; } .p-4 { padding: 16px; } .p-8 { padding: 32px; } .px-2 { padding-left: 8px; padding-right: 8px; } .py-1 { padding-top: 4px; padding-bottom: 4px; }
.leading-tight { line-height: 1.25; }
.whitespace-nowrap { white-space: nowrap; }
.relative { position: relative; } .absolute { position: absolute; } .inset-0 { inset: 0; }
.overflow-hidden { overflow: hidden; } .rounded-full { border-radius: 999px; } .rounded-md { border-radius: 8px; } .rounded-xl { border-radius: 12px; } .rounded { border-radius: 6px; }
.border { border-width: 1px; border-style: solid; } .border-t { border-top-width: 1px; border-top-style: solid; } .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
.border-gray-200 { border-color: #e5e7eb; } .border-gray-300 { border-color: #d1d5db; } .border-gray-400 { border-color: #9ca3af; }
.bg-white { background: #fff; } .bg-gray-50 { background: #f9fafb; }
.object-contain { object-fit: contain; } .object-cover { object-fit: cover; }
.w-full { width: 100%; } .h-full { height: 100%; }
.grid { display: grid; } .grid-cols-2 { grid-template-columns: repeat(2, minmax(0,1fr)); } .grid-cols-12 { grid-template-columns: repeat(12, minmax(0,1fr)); }
.col-span-8 { grid-column: span 8 / span 8; } .col-span-2 { grid-column: span 2 / span 2; }
.text-center { text-align: center; } .text-right { text-align: right; }
.font-extrabold { font-weight: 800; } .font-bold { font-weight: 700; }
.mx-auto { margin-left: auto; margin-right: auto; } .mb-3 { margin-bottom: 12px; }
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.opacity-25 { opacity: 0.25; } .opacity-75 { opacity: 0.75; }

@media (max-width: 1024px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .stat-grid { grid-template-columns: 1fr; }
  .search-box { max-width: 100%; }
}
</style>