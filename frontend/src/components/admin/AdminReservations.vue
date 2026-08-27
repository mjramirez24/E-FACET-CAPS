<template>
  <AdminLayout>
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search reservation (student, email, course, id)..."
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div class="reservations-wrapper">
      <div class="page-top">
        <h2 class="page-title">Reservations Management</h2>
      </div>

      <!-- Track Switch -->
      <div class="tab-group mb-5">
        <button
          @click="switchTrack('driving')"
          class="tab-btn"
          :class="activeTrack === 'driving' ? 'tab-active-green' : 'tab-inactive'"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 11l2-4h10l2 4M3 16v-3a1 1 0 011-1h16a1 1 0 011 1v3" />
            <path d="M7 12h10l1 4H6l1-4z" />
            <circle cx="6" cy="17" r="2" fill="currentColor" />
            <circle cx="18" cy="17" r="2" fill="currentColor" />
          </svg>
          Driving
        </button>

        <button
          @click="switchTrack('tesda')"
          class="tab-btn"
          :class="activeTrack === 'tesda' ? 'tab-active-blue' : 'tab-inactive'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          TESDA
        </button>
      </div>

      <!-- Status Tabs -->
      <div class="tab-group mb-5">
        <button
          class="tab-btn"
          :class="activeTab === 'verification' ? 'tab-active-green' : 'tab-inactive'"
          @click="activeTab = 'verification'"
        >
          For Verification
        </button>

        <button
          class="tab-btn"
          :class="activeTab === 'ongoing' ? 'tab-active-green' : 'tab-inactive'"
          @click="activeTab = 'ongoing'"
        >
          Confirmed Reservations
        </button>

        <button
          class="tab-btn"
          :class="activeTab === 'history' ? 'tab-active-green' : 'tab-inactive'"
          @click="activeTab = 'history'"
        >
          Completed / History
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-item">
          <label class="filter-label">Filter by Course</label>
          <select v-model="selectedCourse" class="select-modern">
            <option value="">All Courses</option>
            <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Filter by Status</label>
          <select v-if="activeTab === 'verification'" v-model="selectedStatus" class="select-modern">
            <option value="">All</option>
            <option value="PENDING">PENDING (Verification)</option>
          </select>
          <select v-else-if="activeTab === 'ongoing'" v-model="selectedStatus" class="select-modern">
            <option value="">All</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="ACTIVE">ACTIVE</option>
          </select>
          <select v-else v-model="selectedStatus" class="select-modern">
            <option value="">All</option>
            <option value="DONE">DONE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div class="filter-actions">
          <button @click="clearFilters" class="btn-outline-sm">Clear</button>
          <button @click="fetchReservations" class="btn-outline-sm">Refresh</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <p class="text-gray-500">Loading reservations...</p>
      </div>

      <!-- TESDA Batch View WITH PAGINATION -->
      <div v-else-if="activeTrack === 'tesda'" class="space-y-4">
        <div class="panel-card">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Showing {{ pageRangeText }}</span>
            <span class="text-xs text-gray-500">Track: <b class="uppercase">{{ activeTrack }}</b> • Batch size: <b>25</b></span>
          </div>

          <div v-if="tesdaBatches.length === 0" class="empty-state">No records found</div>

          <div v-else class="p-4 space-y-3">
            <div v-for="b in tesdaBatches" :key="b.key" class="batch-card">
              <button class="batch-header" @click="toggleBatch(b.key)" type="button">
                <div class="text-left">
                  <div class="font-semibold text-gray-800">
                    {{ b.course_name }} • Batch {{ b.batch_no }}
                    <span v-if="b.is_placeholder" class="batch-placeholder-tag">Next batch</span>
                  </div>
                  <div class="text-xs text-gray-600 mt-1">
                    {{ b.count }}/25 learners •
                    <span :class="b.is_full ? 'badge-full' : 'badge-open'">
                      {{ b.is_full ? "FULL" : "OPEN" }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ expandedBatchMap[b.key] ? "Hide" : "View" }}</span>
                  <svg class="w-4 h-4 transition-transform duration-200" :class="expandedBatchMap[b.key] ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              <div v-if="expandedBatchMap[b.key]" class="p-4">
                <div v-if="b.is_placeholder" class="empty-state text-sm">This is an empty batch placeholder. It will fill automatically when new reservations come in.</div>
                <div v-else class="table-wrap">
                  <table class="modern-table">
                    <thead class="thead-green">
                      <tr>
                        <th>Reservation ID</th>
                        <th>Student</th>
                        <th>Schedule</th>
                        <th>Status</th>
                        <th>Requirements</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in b.rows" :key="r.reservation_id">
                        <td class="font-mono text-xs">{{ r.reservation_id }}</td>
                        <td>
                          <div class="font-medium">{{ r.student_name }}</div>
                          <div class="text-xs text-gray-500">{{ r.email }}</div>
                        </td>
                        <td>
                          <div class="text-xs">{{ formatManilaDateOnly(r.schedule_date) }}<br />{{ r.startTime }} - {{ r.endTime }}</div>
                        </td>
                        <td><span :class="getStatusPill(displayStatus(r))">{{ String(displayStatus(r) || "").toUpperCase() }}</span></td>
                        <td>
                          <button class="link-text-sm" @click="openDetails(r, 'requirements')">View Requirements</button>
                        </td>
                        <td>
                          <div class="action-btns">
                            <button v-if="activeTab !== 'history'" class="action-edit" @click="openUpdateStatus(r)">Update Status</button>
                            <button class="action-view" @click="openDetails(r)">View Full</button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="b.rows.length === 0">
                        <td colspan="6" class="empty-cell">No records found in this batch</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="mt-3 text-xs text-gray-400">*Auto-grouping: reservations are ordered by created_at (oldest → newest) then chunked by 25 per course.</div>
              </div>
            </div>
          </div>

          <!-- PAGINATION FOR TESDA -->
          <div class="pagination-bar">
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <div class="page-btns">
              <button @click="goPrevPage" :disabled="currentPage <= 1" class="pg-btn" :class="{ 'pg-disabled': currentPage <= 1 }">← Prev</button>
              <button v-for="p in pageButtons" :key="p" @click="currentPage = p" class="pg-num" :class="{ 'pg-active': p === currentPage }">{{ p }}</button>
              <button @click="goNextPage" :disabled="currentPage >= totalPages" class="pg-btn" :class="{ 'pg-disabled': currentPage >= totalPages }">Next →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Default Table (Driving) WITH PAGINATION -->
      <div v-else class="panel-card">
        <div class="panel-header-bar">
          <span class="text-sm text-gray-600">Showing {{ pageRangeText }}</span>
          <span class="text-xs text-gray-500">Track: <b class="uppercase">{{ activeTrack }}</b></span>
        </div>
        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Reservation ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Requirements</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in paginatedRows" :key="r.reservation_id">
                <td class="font-mono text-xs">{{ r.reservation_id }}</td>
                <td>
                  <div class="font-medium">{{ r.student_name }}</div>
                  <div class="text-xs text-gray-500">{{ r.email }}</div>
                </td>
                <td>{{ r.course_name }}</td>
                <td>
                  <div class="text-xs">{{ formatManilaDateOnly(r.schedule_date) }}<br />{{ r.startTime }} - {{ r.endTime }}</div>
                </td>
                <td><span :class="getStatusPill(displayStatus(r))">{{ String(displayStatus(r) || "").toUpperCase() }}</span></td>
                <td>
                  <span v-if="!isGcash(r)" class="text-xs text-gray-400">Cash (no proof)</span>
                  <button v-else class="link-text-sm" @click="openDetails(r, 'payment')">View Payment</button>
                </td>
                <td>
                  <span v-if="isRequirementsWalkIn(r)" class="text-xs text-gray-400">Walk-in submission</span>
                  <button v-else class="link-text-sm" @click="openDetails(r, 'requirements')">View Requirements</button>
                </td>
                <td>
                  <div class="action-btns">
                    <button v-if="activeTab !== 'history'" class="action-edit" @click="openUpdateStatus(r)">Update Status</button>
                    <button class="action-view" @click="openDetails(r)">View Full</button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td colspan="8" class="empty-cell">No records found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION FOR DRIVING -->
        <div class="pagination-bar">
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <div class="page-btns">
            <button @click="goPrevPage" :disabled="currentPage <= 1" class="pg-btn" :class="{ 'pg-disabled': currentPage <= 1 }">← Prev</button>
            <button v-for="p in pageButtons" :key="p" @click="currentPage = p" class="pg-num" :class="{ 'pg-active': p === currentPage }">{{ p }}</button>
            <button @click="goNextPage" :disabled="currentPage >= totalPages" class="pg-btn" :class="{ 'pg-disabled': currentPage >= totalPages }">Next →</button>
          </div>
        </div>
      </div>

      <!-- Update Status Modal -->
      <transition name="modal-fade">
        <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
          <transition name="modal-scale">
            <div class="modal-card modal-card-sm">
              <div class="modal-head modal-head-green">
                <h3 class="modal-title">Update Reservation Status</h3>
                <button class="modal-close-btn" @click="closeStatusModal">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="modal-body">
                <div class="detail-block">
                  <div><b>Reservation:</b> {{ selectedReservation?.reservation_id }}</div>
                  <div><b>Student:</b> {{ selectedReservation?.student_name }}</div>
                  <div><b>Course:</b> {{ selectedReservation?.course_name }}</div>
                  <div><b>Schedule:</b> {{ selectedReservation ? formatManilaDateOnly(selectedReservation.schedule_date) : "" }} {{ selectedReservation?.startTime }}-{{ selectedReservation?.endTime }}</div>
                  <div class="text-xs text-gray-500 mt-2">Track: <b class="uppercase">{{ activeTrack }}</b></div>
                  <div v-if="String(selectedReservation?.admin_status || '').toUpperCase() === 'PENDING'" class="text-xs text-amber-600 mt-2">
                    <span v-if="activeTrack !== 'tesda'">*This is PENDING in admin because payment proof is still for verification.</span>
                    <span v-else>*This is PENDING for TESDA requirements verification (no payment).</span>
                  </div>
                </div>
                <select v-model="newStatus" class="form-input mt-4">
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED" disabled>CONFIRMED (Auto)</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="DONE">DONE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div class="modal-foot">
                <button class="btn-cancel" @click="closeStatusModal">Cancel</button>
                <button class="btn-save btn-green" :disabled="saving" @click="saveStatus">{{ saving ? "Saving..." : "Save" }}</button>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- View Full Details Modal -->
      <transition name="modal-fade">
        <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
          <transition name="modal-scale">
            <div class="modal-card modal-card-lg">
              <div class="modal-head modal-head-green">
                <h3 class="modal-title">Reservation Full Details</h3>
                <button class="modal-close-btn" @click="closeDetailsModal">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="modal-body">
                <div v-if="detailsLoading" class="loading-state">Loading details...</div>
                <div v-else>
                  <div class="detail-card">
                    <div class="detail-grid">
                      <div><b>ID:</b> {{ details?.reservation?.reservation_id }}</div>
                      <div><b>Status:</b> {{ details?.reservation?.reservation_status }}</div>
                      <div><b>Student:</b> {{ details?.reservation?.student_name }} ({{ details?.reservation?.email }})</div>
                      <div><b>Course:</b> {{ details?.reservation?.course_name }}</div>
                      <div><b>Schedule:</b> {{ formatManilaDateOnly(details?.reservation?.schedule_date) }} {{ details?.reservation?.startTime }}-{{ details?.reservation?.endTime }}</div>
                      <div><b>Payment Method:</b> <span v-if="activeTrack === 'tesda'">No payment (TESDA)</span><span v-else>{{ details?.reservation?.payment_method || "—" }}</span></div>
                      <div><b>Requirements Mode:</b> {{ details?.reservation?.requirements_mode || "—" }}</div>
                      <div><b>Notes:</b> {{ details?.reservation?.notes || "—" }}</div>
                    </div>
                  </div>

                  <div v-if="activeTrack !== 'tesda'" ref="paymentSectionRef" class="detail-section">
                    <h4 class="detail-section-title">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Payment
                    </h4>
                    <div class="detail-card">
                      <div v-if="!details?.payment" class="text-sm text-gray-500">No payment submission.</div>
                      <div v-else class="text-sm space-y-1">
                        <div><b>Payment Ref:</b> <span class="font-mono">{{ details.payment.payment_ref }}</span></div>
                        <div><b>Status:</b> {{ details.payment.status }}</div>
                        <div><b>Amount:</b> ₱{{ (Number(details.payment.amount_centavos || 0) / 100).toLocaleString() }}</div>
                        <div><b>Proof:</b> <button v-if="details.payment.proof_url" class="link-text-sm" @click="openProof(details.payment.proof_url)">View Proof</button><span v-else class="text-gray-400">No proof</span></div>
                        <div><b>Verified At:</b> {{ details.payment.verified_at || "—" }}</div>
                        <div><b>Admin Note:</b> {{ details.payment.admin_note || "—" }}</div>
                      </div>
                    </div>
                  </div>

                  <div ref="requirementsSectionRef" class="detail-section">
                    <h4 class="detail-section-title">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Requirements
                    </h4>
                    <div class="detail-card">
                      <div v-if="!(details?.requirements || []).length" class="text-sm text-gray-500">No uploaded requirements.</div>
                      <div v-else class="space-y-3">
                        <div v-for="req in details.requirements" :key="req.requirement_id || req.id" class="req-item">
                          <div class="font-medium text-gray-800">{{ req.requirement_text || req.name || "Requirement" }}</div>
                          <div class="text-xs text-gray-600 mt-1">File: <button v-if="req.file_url" class="link-text-sm" @click="openProof(req.file_url)">View File</button><span v-else class="text-gray-400">No file</span></div>
                          <div class="text-xs text-gray-500 mt-1">Uploaded: {{ req.created_at || "—" }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-foot">
                <button class="btn-cancel" @click="closeDetailsModal">Close</button>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- Proof Modal -->
      <transition name="modal-fade">
        <div v-if="showProofModal" class="modal-overlay" @click.self="closeProofModal" style="z-index: 60;">
          <transition name="modal-scale">
            <div class="modal-card modal-card-xl">
              <div class="modal-head">
                <h3 class="modal-title">Proof Viewer</h3>
                <button class="modal-close-btn" @click="closeProofModal">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="proof-content">
                <div v-if="proofType === 'image'" class="proof-image-wrap">
                  <img :src="proofFullUrl" class="proof-image" />
                </div>
                <div v-else class="proof-pdf-wrap">
                  <iframe :src="proofFullUrl" class="proof-pdf"></iframe>
                </div>
              </div>
              <div class="modal-foot">
                <a :href="proofFullUrl" target="_blank" rel="noopener" class="link-text">Open in new tab</a>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from "vue";
import AdminLayout from "./AdminLayout.vue";
import axios from "axios";

import { API_URL, API_BASE } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "AdminReservations",
  components: { AdminLayout },
  setup() {
    const activeTrack = ref("driving");
    const activeTab = ref("verification");

    const reservations = ref([]);
    const loading = ref(true);

    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");

    // Pagination state (shared for both tracks)
    const currentPage = ref(1);
    const pageSize = ref(10);

    const showStatusModal = ref(false);
    const selectedReservation = ref(null);
    const newStatus = ref("PENDING");
    const saving = ref(false);

    const showDetailsModal = ref(false);
    const detailsLoading = ref(false);
    const details = ref(null);

    const paymentSectionRef = ref(null);
    const requirementsSectionRef = ref(null);

    const showProofModal = ref(false);
    const proofUrl = ref("");
    const proofType = ref("image");

    const expandedBatchMap = ref({});

    const proofFullUrl = computed(() => {
      const url = String(proofUrl.value || "");
      if (!url) return "";
      return url.startsWith("http") ? url : `${API_BASE}${url}`;
    });

    const formatManilaDateOnly = (value) => {
      if (!value) return "—";
      const s = String(value).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return s;
      return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    };

    const getStatusPill = (status) => {
      const s = String(status || "").toUpperCase();
      if (s === "CONFIRMED") return "pill pill-green";
      if (s === "APPROVED") return "pill pill-green";
      if (s === "ACTIVE") return "pill pill-blue";
      if (s === "PENDING") return "pill pill-amber";
      if (s === "CANCELLED") return "pill pill-red";
      if (s === "DONE") return "pill pill-gray";
      return "pill pill-gray";
    };

    const isGcash = (r) => String(r?.payment_method || "").toUpperCase() === "GCASH";
    const isRequirementsWalkIn = (r) => String(r?.requirements_mode || "").toLowerCase() !== "online";

    const displayStatus = (r) => {
      if (activeTab.value === "verification") return r.admin_status || r.reservation_status;
      return r.reservation_status;
    };

    const reservationsVerification = computed(() =>
      reservations.value.filter((r) => String(r.admin_status || "").toUpperCase() === "PENDING")
    );

    const reservationsOngoing = computed(() =>
      reservations.value.filter((r) =>
        ["CONFIRMED", "APPROVED", "ACTIVE"].includes(String(r.reservation_status || "").toUpperCase())
      )
    );

    const reservationsHistory = computed(() =>
      reservations.value.filter((r) => {
        const status = String(
          r.reservation_status || ""
        ).toUpperCase();

        const isHistory = ["DONE", "CANCELLED"].includes(status);

        // Driving historical/mock records are hidden from History.
        const isHistorical =
          activeTrack.value === "driving" &&
          Number(r.is_historical || 0) === 1;

        return isHistory && !isHistorical;
      })
    );

    const currentRows = computed(() => {
      if (activeTab.value === "verification") return reservationsVerification.value;
      if (activeTab.value === "ongoing") return reservationsOngoing.value;
      return reservationsHistory.value;
    });

    const courseOptions = computed(() => {
      const set = new Set(reservations.value.map((r) => r.course_name).filter(Boolean));
      return Array.from(set).sort();
    });

    const filteredRows = computed(() => {
      let result = [...currentRows.value];
      const q = String(searchQuery.value || "").toLowerCase().trim();
      if (q) {
        result = result.filter((r) => {
          const hay = [r.student_name, r.email, r.course_name, r.reservation_id]
            .map((x) => String(x || "").toLowerCase())
            .join(" ");
          return hay.includes(q);
        });
      }
      if (selectedCourse.value) {
        result = result.filter((r) => r.course_name === selectedCourse.value);
      }
      if (selectedStatus.value) {
        result = result.filter((r) => {
          const st = String(displayStatus(r) || "").toUpperCase();
          return st === String(selectedStatus.value).toUpperCase();
        });
      }
      return result;
    });

    // Pagination computed (shared for both tracks)
    const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));

    const paginatedRows = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      return filteredRows.value.slice(start, start + pageSize.value);
    });

    const pageRangeText = computed(() => {
      const total = filteredRows.value.length;
      if (total === 0) return "0 of 0";
      const start = (currentPage.value - 1) * pageSize.value + 1;
      const end = Math.min(currentPage.value * pageSize.value, total);
      return `${start}-${end} of ${total}`;
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

    const goPrevPage = () => { if (currentPage.value > 1) currentPage.value--; };
    const goNextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

    // Reset page on filter/search/tab/track changes
    watch([searchQuery, selectedCourse, selectedStatus, activeTab, activeTrack], () => {
      currentPage.value = 1;
    });

    watch(totalPages, () => {
      if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
    });

    const clearFilters = () => {
      searchQuery.value = "";
      selectedCourse.value = "";
      selectedStatus.value = "";
    };

    watch(activeTab, () => {
      selectedStatus.value = "";
      expandedBatchMap.value = {};
    });

    const BATCH_SIZE = 25;

    const safeTime = (v) => {
      const s = String(v || "");
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };

    const batchKey = (courseName, batchNo) => `${String(courseName || "Unknown")}__B${batchNo}`;

    const tesdaBatches = computed(() => {
      if (activeTrack.value !== "tesda") return [];
      const byCourse = new Map();
      // Use paginatedRows for TESDA batches (paginated)
      for (const r of paginatedRows.value) {
        const c = String(r?.course_name || "Unknown");
        if (!byCourse.has(c)) byCourse.set(c, []);
        byCourse.get(c).push(r);
      }
      const out = [];
      for (const [courseName, rows] of byCourse.entries()) {
        rows.sort((a, b) => safeTime(a.created_at) - safeTime(b.created_at));
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batchNo = Math.floor(i / BATCH_SIZE) + 1;
          const chunk = rows.slice(i, i + BATCH_SIZE);
          const key = batchKey(courseName, batchNo);
          out.push({ key, course_name: courseName, batch_no: batchNo, count: chunk.length, is_full: chunk.length >= BATCH_SIZE, rows: chunk, is_placeholder: false });
        }
        if (rows.length > 0 && rows.length % BATCH_SIZE === 0) {
          const nextBatchNo = Math.floor(rows.length / BATCH_SIZE) + 1;
          const key = batchKey(courseName, nextBatchNo);
          out.push({ key, course_name: courseName, batch_no: nextBatchNo, count: 0, is_full: false, rows: [], is_placeholder: true });
        }
      }
      out.sort((a, b) => { const c = String(a.course_name).localeCompare(String(b.course_name)); if (c !== 0) return c; return Number(a.batch_no) - Number(b.batch_no); });
      return out;
    });

    const toggleBatch = (key) => { expandedBatchMap.value[key] = !expandedBatchMap.value[key]; };

    const fetchReservations = async () => {
      loading.value = true;
      try {
        const res = await api.get("/admin/reservations", { params: { track: activeTrack.value } });
        reservations.value = res.data?.data || [];
      } catch (err) {
        console.error("fetchReservations error:", err);
        reservations.value = [];
      } finally {
        loading.value = false;
      }
    };

    const switchTrack = async (track) => {
      if (activeTrack.value === track) return;
      activeTrack.value = track;
      activeTab.value = "verification";
      clearFilters();
      expandedBatchMap.value = {};
      await fetchReservations();
    };

    const openUpdateStatus = (r) => { selectedReservation.value = r; newStatus.value = String(r.reservation_status || "PENDING").toUpperCase(); showStatusModal.value = true; };
    const closeStatusModal = () => { showStatusModal.value = false; selectedReservation.value = null; };

    const saveStatus = async () => {
      if (!selectedReservation.value) return;
      saving.value = true;
      try {
        await api.put(`/admin/reservations/${selectedReservation.value.reservation_id}/status`, { status: newStatus.value }, { params: { track: activeTrack.value } });
        await fetchReservations();
        closeStatusModal();
      } catch (err) {
        console.error("saveStatus error:", err);
        alert(err.response?.data?.message || "Failed to update status");
      } finally {
        saving.value = false;
      }
    };

    const openDetails = async (r, focus = null) => {
      showDetailsModal.value = true;
      detailsLoading.value = true;
      details.value = null;
      try {
        const res = await api.get(`/admin/reservations/${r.reservation_id}/details`, { params: { track: activeTrack.value } });
        details.value = res.data?.data || null;
        await nextTick();
        if (focus === "payment" && activeTrack.value !== "tesda" && paymentSectionRef.value) {
          paymentSectionRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (focus === "requirements" && requirementsSectionRef.value) {
          requirementsSectionRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch (err) {
        console.error("openDetails error:", err);
        alert(err.response?.data?.message || "Failed to load details");
        showDetailsModal.value = false;
      } finally {
        detailsLoading.value = false;
      }
    };

    const closeDetailsModal = () => { showDetailsModal.value = false; details.value = null; detailsLoading.value = false; };

    const openProof = (url) => {
      if (!url) return;
      proofUrl.value = url;
      const lower = String(url).toLowerCase();
      proofType.value = (lower.endsWith(".pdf") || lower.includes(".pdf?")) ? "pdf" : "image";
      showProofModal.value = true;
    };

    const closeProofModal = () => { showProofModal.value = false; proofUrl.value = ""; proofType.value = "image"; };

    onMounted(async () => { await fetchReservations(); });

    return {
      activeTrack, switchTrack,
      activeTab, reservations, loading,
      searchQuery, selectedCourse, selectedStatus, courseOptions, clearFilters,
      currentRows, filteredRows, displayStatus, getStatusPill,
      isGcash, isRequirementsWalkIn, formatManilaDateOnly, fetchReservations,
      tesdaBatches, expandedBatchMap, toggleBatch,
      showStatusModal, selectedReservation, newStatus, saving, openUpdateStatus, closeStatusModal, saveStatus,
      showDetailsModal, detailsLoading, details, openDetails, closeDetailsModal, paymentSectionRef, requirementsSectionRef,
      showProofModal, proofType, proofFullUrl, openProof, closeProofModal,
      currentPage, pageSize, totalPages, paginatedRows, pageRangeText, pageButtons, goPrevPage, goNextPage,
    };
  },
};
</script>

<style scoped>
/* ========== WRAPPER ========== */
.reservations-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 16px; }
.page-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* ========== TABS ========== */
.tab-group { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.2s; background: #fff; color: #6b7280; }
.tab-inactive:hover { border-color: #d1d5db; color: #374151; }
.tab-active-green { background: #10b981; color: #fff; border-color: #10b981; }
.tab-active-blue { background: #3b82f6; color: #fff; border-color: #3b82f6; }

/* ========== FILTERS ========== */
.filters-card { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; align-items: flex-end; }
.filter-item { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
.select-modern { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.8rem; color: #374151; background: #fff; outline: none; cursor: pointer; min-width: 180px; }
.select-modern:focus { border-color: #10b981; }
.filter-actions { display: flex; gap: 8px; align-items: flex-end; margin-left: auto; }
.btn-outline-sm { padding: 8px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-outline-sm:hover { background: #f3f4f6; border-color: #d1d5db; }

/* ========== LOADING & EMPTY ========== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.empty-state { text-align: center; padding: 40px; color: #9ca3af; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ========== BATCH ========== */
.batch-card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
.batch-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f9fafb; border: none; cursor: pointer; transition: background 0.2s; }
.batch-header:hover { background: #f3f4f6; }
.batch-placeholder-tag { font-size: 0.7rem; padding: 2px 8px; background: #e5e7eb; border-radius: 6px; color: #6b7280; margin-left: 8px; }
.badge-full { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; background: #fee2e2; color: #dc2626; }
.badge-open { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; background: #d1fae5; color: #059669; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; }
.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-edit:hover { background: #2563eb; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #6b7280; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #4b5563; }
.link-text-sm { font-size: 0.8rem; font-weight: 600; color: #3b82f6; background: none; border: none; cursor: pointer; }
.link-text-sm:hover { color: #2563eb; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }
.pg-num { width: 34px; height: 34px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-num:hover { border-color: #10b981; }
.pg-active { background: #10b981; color: #fff; border-color: #10b981; }

/* ========== MODALS ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-card-sm { max-width: 460px; }
.modal-card-lg { max-width: 720px; }
.modal-card-xl { max-width: 960px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
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
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.form-input { width: 100%; padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; }
.form-input:focus { border-color: #10b981; }

/* ========== DETAILS ========== */
.detail-block { padding: 12px; background: #f9fafb; border-radius: 10px; font-size: 0.85rem; line-height: 1.6; }
.detail-card { padding: 14px; background: #f9fafb; border-radius: 10px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.85rem; }
.detail-section { margin-top: 20px; }
.detail-section-title { font-size: 0.95rem; font-weight: 700; color: #111827; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.req-item { padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }

/* ========== PROOF ========== */
.proof-content { padding: 0; }
.proof-image-wrap { max-height: 70vh; overflow: auto; display: flex; align-items: center; justify-content: center; background: #f3f4f6; }
.proof-image { max-width: 100%; height: auto; }
.proof-pdf-wrap { height: 70vh; }
.proof-pdf { width: 100%; height: 100%; border: none; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ========== SCROLLBAR ========== */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
::-webkit-scrollbar-thumb { background: #888; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #555; }

@media (max-width: 640px) {
  .detail-grid { grid-template-columns: 1fr; }
}
</style>