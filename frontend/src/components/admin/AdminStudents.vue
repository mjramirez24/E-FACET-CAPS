<!-- frontend/src/components/admin/AdminStudents.vue -->

<template>

  <AdminLayout>

<!-- Header -->

    <template #header-left>

      <div class="search-box">

        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">

          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

        </svg>

        <input

          type="text"

           :placeholder="activeTab === 'driving' ? 'Search driving student...' : 'Search TESDA student...'"

          v-model="searchQuery"

          class="search-input-modern"

          @input="debouncedFetch"

        />

      </div>

    </template>

    <div class="students-wrapper">

<!-- Page Header -->

      <div class="page-top">

        <div>

          <h2 class="page-title">Students Management</h2>

          <p class="page-subtitle">Sections: Driving / TESDA • Source: Online + Walk-in</p>

        </div>

        <button @click="openAddModal" class="add-btn">

          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">

            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />

          </svg>

          Add Student

        </button>

      </div>

<!-- Tabs -->

      <div class="tab-group mb-5">

        <button

          class="tab-btn"

           :class="activeTab === 'driving' ? 'tab-active-green' : 'tab-inactive'"

          @click="switchTab('driving')"

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

          class="tab-btn"

           :class="activeTab === 'tesda' ? 'tab-active-blue' : 'tab-inactive'"

          @click="switchTab('tesda')"

        >

          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">

            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />

          </svg>

          TESDA

        </button>

      </div>

<!-- Filters -->

      <div class="filters-row">

        <div class="filter-item">

          <label class="filter-label">Status</label>

          <select v-model="selectedStatus" class="select-modern" @change="fetchActiveTabStudents">

            <option value="all">All</option>

            <option value="pending">pending</option>

            <option value="confirmed">confirmed</option>

            <option value="approved">approved</option>

            <option value="active">active</option>

            <option value="done">done</option>

            <option value="completed">completed</option>

            <option value="cancelled">cancelled</option>

            <option value="rejected">rejected</option>

          </select>

        </div>

        <div class="filter-item">

          <label class="filter-label">Source</label>

          <select v-model="selectedSource" class="select-modern" @change="fetchActiveTabStudents">

            <option value="all">Online + Walk-in</option>

            <option value="online">Online only</option>

            <option value="walkin">Walk-in only</option>

          </select>

        </div>

        <div class="filter-item ml-auto">

          <label class="filter-label">Sort By</label>

          <select v-model="sortBy" class="select-modern">

            <option value="full_name">Full Name</option>

            <option v-if="activeTab === 'driving'" value="client_id">Client ID</option>

            <option value="course_start">Course Start</option>

            <option value="course_end">Course End</option>

            <option value="status">Status</option>

          </select>

        </div>

      </div>

<!-- Table -->

      <div class="panel-card">

        <div v-if="loading" class="p-8 text-center text-gray-400">

          <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>

            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>

          </svg>

          Loading students...

        </div>

<!-- DRIVING -->

        <div v-else-if="activeTab === 'driving'" class="table-wrap">

          <table class="modern-table">

            <thead class="thead-green">

              <tr>

                <th>#</th>

                <th>Client ID</th>

                <th>Full Name</th>

                <th>Birthdate</th>

                <th>Sex</th>

                <th>DL Code</th>

                <th>Course</th>

                <th>Start</th>

                <th>End</th>

                <th>Instructor</th>

                <th>Status</th>

                <th>Source</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              <tr v-for="(s, idx) in paginatedDriving"  :key="s.reservation_id">

                <td>{{ (pageRange.start || 1) + idx }}</td>

                <td>{{ s.client_id || "—" }}</td>

                <td class="font-medium">{{ s.full_name || "—" }}</td>

                <td>{{ fmtBirth(s.birthdate) }}</td>

                <td>{{ s.sex || "—" }}</td>

                <td>{{ s.dl_code || "—" }}</td>

                <td>{{ s.course_name || "—" }}</td>

                <td>{{ fmtYMD(s.course_start) }}</td>

                <td>{{ fmtYMD(s.course_end) }}</td>

                <td>{{ s.instructor_name || "—" }}</td>

                <td><span :class="statusPill(s.status)">{{ s.status || "—" }}</span></td>

                <td>{{ s.source || "—" }}</td>

                <td>

                  <div class="action-btns">

                    <button class="action-edit" @click="openEditModal(s, 'driving')">Edit</button>

                    <button class="action-delete" @click="openDeleteModal(s, 'driving')">Delete</button>

                  </div>

                </td>

              </tr>

              <tr v-if="!filteredDriving.length">

                <td colspan="13" class="empty-cell">No driving students found.</td>

              </tr>

            </tbody>

          </table>

        </div>

<!-- TESDA -->

        <div v-else class="table-wrap">

          <table class="modern-table">

            <thead class="thead-blue">

              <tr>

                <th>#</th>

                <th>Full Name</th>

                <th>Birthdate</th>

                <th>Sex</th>

                <th>Course</th>

                <th>Start</th>

                <th>End</th>

                <th>Trainer</th>

                <th>Status</th>

                <th>Source</th>

                <th>Actions</th>

              </tr>

            </thead>

            <tbody>

              <tr v-for="(s, idx) in paginatedTesda"  :key="s.reservation_id">

                <td>{{ (pageRange.start || 1) + idx }}</td>

                <td class="font-medium">{{ s.full_name || "—" }}</td>

                <td>{{ fmtBirth(s.birthdate) }}</td>

                <td>{{ s.sex || "—" }}</td>

                <td>{{ s.course_name || "—" }}</td>

                <td>{{ fmtYMD(s.course_start) }}</td>

                <td>{{ fmtYMD(getTesdaEndDate(s)) }}</td>

                <td>{{ s.instructor_name || "—" }}</td>

                <td><span :class="statusPill(s.status)">{{ s.status || "—" }}</span></td>

                <td>{{ s.source || "—" }}</td>

                <td>

                  <div class="action-btns">

                    <button class="action-edit" @click="openEditModal(s, 'tesda')">Edit</button>

                    <button class="action-delete" @click="openDeleteModal(s, 'tesda')">Delete</button>

                  </div>

                </td>

              </tr>

              <tr v-if="!filteredTesda.length">

                <td colspan="11" class="empty-cell">No TESDA students found.</td>

              </tr>

            </tbody>

          </table>

        </div>

<!-- Pagination with page number buttons -->

        <div class="pagination-bar">

          <span class="page-info">Page {{ activePage }} of {{ activeTotalPages }}</span>

          <div class="page-btns">

            <button class="pg-btn"  :class="{ 'pg-disabled': activePage <= 1 }"  :disabled="activePage <= 1" @click="goPrevPage">← Prev</button>

            <button v-for="p in pageButtons"  :key="p" @click="setActivePage(p)" class="pg-num"  :class="{ 'pg-active': p === activePage }">{{ p }}</button>

            <button class="pg-btn"  :class="{ 'pg-disabled': activePage >= activeTotalPages }"  :disabled="activePage >= activeTotalPages" @click="goNextPage">Next →</button>

          </div>

        </div>

      </div>

    </div>

<!-- ADD/EDIT MODAL -->

    <transition name="modal-fade">

      <div
          v-if="showModal"
          class="modal-overlay"
          @mousedown="onOverlayPointerDown"
          @mouseup="onOverlayPointerUp"
          @touchstart="onOverlayPointerDown"
          @touchend="onOverlayPointerUp"
        >

        <transition name="modal-scale">

          <div class="modal-card">

            <div class="modal-head"  :class="formData.track === 'tesda' ? 'modal-head-blue' : 'modal-head-green'">

              <div class="flex items-center gap-3">

                <h3 class="modal-title">{{ isEditing ? "Edit Student" : "Add Student" }}</h3>

                <span class="track-badge-sm"  :class="formData.track === 'tesda' ? 'track-blue' : 'track-green'">

                  {{ formData.track.toUpperCase() }}

                </span>

              </div>

              <button class="modal-close-btn" @click="closeModal">

                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />

                </svg>

              </button>

            </div>

            <div class="modal-body">

              <div v-if="formError" class="error-box">

                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

                </svg>

                {{ formError }}

              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input v-model="formData.first_name" class="form-input" type="text" placeholder="Juan" />
                </div>

                <div class="form-group">
                  <label class="form-label">Last Name *</label>
                  <input v-model="formData.last_name" class="form-input" type="text" placeholder="Dela Cruz" />
                </div>

                <div class="form-group">
                  <label class="form-label">Username {{ isEditing ? "" : "*" }}</label>
                  <input v-model="formData.username" class="form-input" type="text" autocomplete="off" />
                </div>

                <div class="form-group">
                  <label class="form-label">Password {{ isEditing ? "(optional – leave blank to keep)" : "*" }}</label>
                  <input v-model="formData.password" class="form-input" type="password" autocomplete="new-password" />
                </div>

                <div v-if="formData.track === 'driving'" class="form-group">

                  <label class="form-label">Client ID</label>

                  <input v-model="formData.client_id" class="form-input" type="text" placeholder="LTO Client ID" />

                </div>

                <div class="form-group">
                  <label class="form-label">Birthdate {{ isEditing ? "" : "*" }}</label>
                  <input v-model="formData.birthdate" class="form-input" type="date" :max="maxBirthdate" />
                  <p class="text-xs text-gray-400 mt-1">Must be at least {{ minAge }} years old.</p>
                </div>

                <div class="form-group">

                  <label class="form-label">Sex</label>

                  <select v-model="formData.sex" class="form-input">

                    <option value="">—</option>

                    <option value="Male">Male</option>

                    <option value="Female">Female</option>

                  </select>

                </div>

                <div class="form-group">
                  <label class="form-label">Civil Status</label>
                  <select v-model="formData.civil_status" class="form-input">
                    <option value="">Select Civil Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                <div class="form-group">

                  <label class="form-label">Email {{ isEditing ? "" : "*" }}</label>

                  <input v-model="formData.email" class="form-input" type="email" placeholder="email@example.com" />

                </div>

                <div class="form-group">
                  <label class="form-label">Contact Number {{ isEditing ? "" : "*" }}</label>
                  <input v-model="formData.contact_no" @input="onContactInput" class="form-input" type="text" inputmode="numeric" maxlength="11" placeholder="09XXXXXXXXX" />
                </div>

                <div class="form-group nationality-wrap" ref="natWrapRef">
                  <label class="form-label">Nationality {{ isEditing ? "" : "*" }}</label>
                  <input
                    v-model="nationalityQuery"
                    type="text"
                    class="form-input"
                    autocomplete="off"
                    placeholder="Search nationality (e.g., Filipino)"
                    @focus="openNationality"
                    @input="onNationalityInput"
                    @keydown.down.prevent="moveNationality(1)"
                    @keydown.up.prevent="moveNationality(-1)"
                    @keydown.enter.prevent="selectHighlightedNationality"
                    @keydown.esc.prevent="isNationalityOpen = false"
                  />
                  <div v-if="isNationalityOpen && filteredNationalities.length" class="nationality-dropdown">
                    <button
                      v-for="(n, idx) in filteredNationalities"
                      :key="n"
                      type="button"
                      class="nationality-option"
                      :class="{ 'nationality-option-active': idx === nationalityHighlight }"
                      @mousedown.prevent="pickNationality(n)"
                    >{{ n }}</button>
                  </div>
                </div>

                <div class="form-group md-col-span-2">
                  <label class="form-label">Address {{ isEditing ? "" : "*" }}</label>
                  <div class="address-grid">
                    <input v-model="addressParts.street" class="form-input" placeholder="Street / Sitio / House No." />
                    <input v-model="addressParts.barangay" class="form-input" placeholder="Barangay" />
                    <input v-model="addressParts.city" class="form-input" placeholder="City / Municipality" />
                    <input v-model="addressParts.province" class="form-input" placeholder="Province" />
                  </div>
                  <p class="address-preview">Preview: <span>{{ composedAddressPreview }}</span></p>
                </div>

                <div class="form-group">

                  <label class="form-label">Source</label>

                  <select v-model="formData.source" class="form-input">

                    <option value="walkin">Walk-in</option>

                    <option value="online">Online</option>

                  </select>

                </div>

                <div class="form-group">

                  <label class="form-label">Status</label>

                  <select v-model="formData.status" class="form-input">

                    <option value="pending">pending</option>

                    <option value="confirmed">confirmed</option>

                    <option value="approved">approved</option>

                    <option value="active">active</option>

                    <option value="done">done</option>

                    <option value="completed">completed</option>

                    <option value="cancelled">cancelled</option>

                    <option value="rejected">rejected</option>

                  </select>

                </div>

                <div class="form-group">

                  <label class="form-label">Course *</label>

                  <select

                    v-model="formData.course_id"

                    class="form-input"

                    @change="onCoursePick"

                    :disabled="isEditing"

                  >

                    <option value="">— Select course —</option>

                    <option v-for="c in modalCourses" :key="c.id" :value="String(c.id)">

                      {{ c.course_name }}{{ c.course_code ? ` (${c.course_code})` : "" }}

                    </option>

                  </select>

                </div>

                <!-- ADD MODE: schedule must come from Schedule Management -->

                <div v-if="!isEditing" class="form-group md-col-span-2">

                  <label class="form-label">

                    Available Schedule <span class="text-red-500">*</span>

                  </label>

                  <select

                    v-model="formData.schedule_id"

                    class="form-input"

                    :disabled="!formData.course_id || scheduleLoading"

                    @change="onSchedulePick"

                  >

                    <option value="">

                      {{ scheduleLoading ? "Loading schedules..." : "— Select available schedule —" }}

                    </option>

                    <option

                      v-for="s in availableSchedules"

                      :key="s.id"

                      :value="String(s.id)"

                    >

                      {{ scheduleOptionLabel(s) }}

                    </option>

                  </select>

                  <p

                    v-if="formData.course_id && !scheduleLoading && availableSchedules.length === 0"

                    class="text-xs text-red-500 mt-1"

                  >

                    {{ formData.track === "tesda" ? "No available TESDA batch/schedule for this course. Create one first in Schedule Management." : "No available schedule for this course. Create one first in Schedule Management." }}

                  </p>

                </div>

                <div class="form-group">

                  <label class="form-label">Course Start</label>

                  <input v-model="formData.course_start" class="form-input" type="date" readonly />

                </div>

                <div class="form-group">

                  <label class="form-label">Course End</label>

                  <input v-model="formData.course_end" class="form-input" type="date" readonly />

                </div>

                <div class="form-group">

                  <label class="form-label">

                    {{ formData.track === "tesda" ? "Trainer" : "Instructor" }}

                  </label>

                  <input

                    v-model="formData.instructor_name"

                    class="form-input"

                    type="text"

                    readonly

                    placeholder="Auto from selected schedule"

                  />

                </div>

                <div v-if="formData.track === 'driving'" class="form-group">

                  <label class="form-label">DL Code</label>

                  <input

                    v-model="formData.dl_code"

                    class="form-input"

                    type="text"

                    readonly

                    placeholder="Auto from selected course"

                  />

                  <p class="text-xs text-gray-400 mt-1">

                    Automatically based on the course configured in Manage Courses.

                  </p>

                </div>

                <div v-if="formData.track === 'driving'" class="form-group">

                  <label class="form-label">Course Fee</label>

                  <input

                    :value="selectedCourseFee > 0 ? formatPeso(selectedCourseFee) : '—'"

                    class="form-input"

                    type="text"

                    readonly

                  />

                  <p class="text-xs text-gray-400 mt-1">

                    Based on the fee configured in Manage Courses for accurate revenue reporting.

                  </p>

                </div>

                <div v-if="formData.track === 'driving' && !isEditing" class="form-group">

                  <label class="form-label">

                    Payment Method <span class="text-red-500">*</span>

                  </label>

                  <select v-model="formData.payment_method" class="form-input">

                    <option value="CASH">Cash</option>

                    <option value="GCASH">GCash</option>

                  </select>

                </div>

                <div

                  v-if="formData.track === 'driving' && isSelectedDrivingPdc"

                  class="form-group md-col-span-2"

                >

                  <label class="form-label">

                    Training Purpose <span class="text-red-500">*</span>

                  </label>

                  <select v-model="formData.training_purpose" class="form-input">

                    <option value="">— Select training purpose —</option>

                    <option value="Application for new Driver's License">

                      Application for new Driver's License

                    </option>

                    <option value="Application for Additional DL Code">

                      Application for Additional DL Code

                    </option>

                  </select>

                  <p class="text-xs text-gray-400 mt-1">

                    Required for Practical Driving Course (PDC).

                  </p>

                </div>

              </div>

            </div>

            <div class="modal-foot">

              <button class="btn-cancel" @click="closeModal">Cancel</button>

              <button class="btn-save"  :class="formData.track === 'tesda' ? 'btn-blue' : 'btn-green'"  :disabled="saving" @click="submitStudent">

                {{ saving ? "Saving..." : isEditing ? "Update" : "Create" }}

              </button>

            </div>

          </div>

        </transition>

      </div>

    </transition>

<!-- DELETE MODAL -->

    <transition name="modal-fade">

      <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">

        <transition name="modal-scale">

          <div class="modal-card modal-card-sm">

            <div class="modal-head modal-head-red">

              <div class="flex items-center gap-3">

                <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">

                  <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />

                  </svg>

                </div>

                <h3 class="modal-title">Delete Student</h3>

              </div>

              <button class="modal-close-btn" @click="closeDeleteModal">

                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />

                </svg>

              </button>

            </div>

            <div class="modal-body">

              <p class="text-sm text-gray-700">

                Are you sure you want to delete:

                <span class="font-semibold">{{ studentToDelete?.full_name }}</span>

                ?

              </p>

              <p class="text-xs text-gray-400 mt-2">This will mark the reservation as <b>CANCELLED</b> (soft delete).</p>

            </div>

            <div class="modal-foot">

              <button class="btn-cancel" @click="closeDeleteModal">Cancel</button>

              <button class="btn-save btn-red"  :disabled="saving" @click="confirmDelete">

                {{ saving ? "Deleting..." : "Delete" }}

              </button>

            </div>

          </div>

        </transition>

      </div>

    </transition>

  </AdminLayout>

</template>

<script>

import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from "vue";

import AdminLayout from "./AdminLayout.vue";

async function apiJson(url, opts = {}) {

  const res = await fetch(url, {

    credentials: "include",

    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },

    ...opts,

  });

  if (!res.ok) {

    const text = await res.text().catch(() => "");

    throw new Error(text || `Request failed: ${res.status}`);

  }

  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) return res.json();

  return { status: "success", data: null };

}

export default {

  name: "AdminStudents",

  components: { AdminLayout },

  setup() {

    const activeTab = ref("driving");

    const drivingStudents = ref([]);

    const tesdaStudents = ref([]);

    const loading = ref(false);

    const saving = ref(false);

    const searchQuery = ref("");

    const selectedStatus = ref("all");

    const selectedSource = ref("all");

    const sortBy = ref("full_name");

    const drivingCourses = ref([]);

    const tesdaCourses = ref([]);

    const availableSchedules = ref([]);

    const scheduleLoading = ref(false);

    const showModal = ref(false);

    const showDeleteModal = ref(false);

    const isEditing = ref(false);

    const studentToDelete = ref(null);

    const formError = ref("");

    const formData = reactive({

      reservation_id: null, student_id: null, schedule_id: null,

      track: "driving", source: "walkin", status: "confirmed",

      client_id: "", full_name: "", first_name: "", last_name: "",
      username: "", password: "", birthdate: "", sex: "",

      instructor_name: "", course_start: "", course_end: "", training_purpose: "",

      course_id: "", dl_code: "", payment_method: "CASH", email: "", contact_no: "", address: "", nationality: "",

    });

    const fmtYMD = (d) => { if (!d) return "—"; const s = String(d); return s.includes("T") ? s.split("T")[0] : s; };

    const toYMD = (d) => { const dt = new Date(d); if (Number.isNaN(dt.getTime())) return ""; const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, "0"); const day = String(dt.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`; };

    const fmtBirth = (d) => { if (!d) return "—"; const dt = new Date(d); if (Number.isNaN(dt.getTime())) return "—"; const mm = String(dt.getMonth() + 1).padStart(2, "0"); const dd = String(dt.getDate()).padStart(2, "0"); const yy = String(dt.getFullYear()).slice(-2); return `${mm}/${dd}/${yy}`; };

    const MIN_AGE = { driving: 17, tesda: 15 };
      const minAge = computed(() => MIN_AGE[formData.track] || 17);

      const maxBirthdate = computed(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - minAge.value);
        return toYMD(d);
      });

      const isAtLeastMinAge = (ymd) => {
        const b = new Date(`${ymd}T00:00:00`);
        if (Number.isNaN(b.getTime())) return false;
        const t = new Date();
        let age = t.getFullYear() - b.getFullYear();
        const m = t.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
        return age >= minAge.value;
      };

      const splitFullName = (full) => {
        const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
        return { first: parts[0] || "", last: parts.slice(1).join(" ") };
      };
    function statusPill(status) {

      const s = String(status || "").toLowerCase();

      if (["active", "confirmed", "approved"].includes(s)) return "pill pill-green";

      if (["pending"].includes(s)) return "pill pill-amber";

      if (["rejected", "cancelled", "canceled"].includes(s)) return "pill pill-red";

      return "pill pill-gray";

    }

    const tesdaEndDateFromStart = (startYmd, durationText) => {

      if (!startYmd) return "";

      const start = new Date(startYmd);

      if (Number.isNaN(start.getTime())) return "";

      const s = String(durationText || "").toLowerCase();

      const m = s.match(/(\d+)\s*(hour|hours|day|days|week|weeks|month|months)/);

      if (!m) return toYMD(start);

      const n = Number(m[1]); const unit = m[2];

      let days = 0;

      if (unit.startsWith("hour")) days = Math.ceil(n / 8);

      else if (unit.startsWith("day")) days = n;

      else if (unit.startsWith("week")) days = n * 6;

      else if (unit.startsWith("month")) days = n * 26;

      if (!days || days <= 1) return toYMD(start);

      let remaining = days - 1; const cur = new Date(start);

      while (remaining > 0) { cur.setDate(cur.getDate() + 1); if (cur.getDay() === 0) continue; remaining--; }

      return toYMD(cur);

    };

    const getTesdaEndDate = (row) => { const start = row?.course_start || row?.schedule_date || ""; const dur = row?.duration || row?.course_duration || row?.course_hours || ""; const computed = tesdaEndDateFromStart(start, dur); return row?.course_end || computed || ""; };

    const fetchCourses = async () => { try { const d = await apiJson(`/api/admin/courses?track=driving`); const t = await apiJson(`/api/admin/courses?track=tesda`); drivingCourses.value = Array.isArray(d.data) ? d.data : []; tesdaCourses.value = Array.isArray(t.data) ? t.data : []; } catch (e) { drivingCourses.value = []; tesdaCourses.value = []; } };

    const modalCourses = computed(() => (formData.track === "tesda" ? tesdaCourses.value : drivingCourses.value));

    const findCourseById = (id) => {

      const all = formData.track === "tesda" ? tesdaCourses.value : drivingCourses.value;

      return all.find((c) => String(c.id) === String(id)) || null;

    };

    const isDrivingPdcCourse = (course) => {

      if (!course) return false;

      const code = String(course.course_code || "").toUpperCase();

      const name = String(course.course_name || "").toUpperCase();

      return code.includes("PDC") || name.includes("PRACTICAL DRIVING COURSE");

    };

    const isSelectedDrivingPdc = computed(() => {

      if (formData.track !== "driving") return false;

      return isDrivingPdcCourse(findCourseById(formData.course_id));

    });

    const selectedCourse = computed(() => findCourseById(formData.course_id));

    const selectedCourseFee = computed(() => Number(selectedCourse.value?.course_fee || 0));

    const formatPeso = (value) => {

      return `₱${Number(value || 0).toLocaleString("en-PH", {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2,

      })}`;

    };

    const deriveDlFromCourseCode = (course_code) => {

      const code = String(course_code || "").toUpperCase();

      if (code.startsWith("PDC-")) return code.split("-").pop() || "";

      return "";

    };

    const formatTime12Local = (value) => {

      if (!value) return "";

      const [hRaw, mRaw] = String(value).split(":");

      let h = Number(hRaw);

      const m = String(mRaw || "00").padStart(2, "0");

      const suffix = h >= 12 ? "PM" : "AM";

      h = h % 12;

      if (h === 0) h = 12;

      return `${h}:${m} ${suffix}`;

    };

    const ADMIN_LATE_ADD_GRACE_HOURS = 8;

    const getScheduleEndMsPH = (dateYmd, timeValue) => {
      if (!dateYmd) return NaN;

      let time = String(timeValue || "23:59:59").trim();

      // Normalize HH:mm to HH:mm:ss
      if (/^\d{1,2}:\d{2}$/.test(time)) {
        time = `${time}:00`;
      }

      if (!/^\d{1,2}:\d{2}:\d{2}$/.test(time)) {
        time = "23:59:59";
      }

      const ms = new Date(`${dateYmd}T${time}+08:00`).getTime();
      return Number.isFinite(ms) ? ms : NaN;
    };

    const getAdminLateAddState = (endDate, endTime) => {
      const endMs = getScheduleEndMsPH(endDate, endTime);

      if (!Number.isFinite(endMs)) {
        return {
          allowed: false,
          isLate: false,
        };
      }

      const nowMs = Date.now();
      const graceMs =
        ADMIN_LATE_ADD_GRACE_HOURS * 60 * 60 * 1000;

      return {
        allowed: nowMs <= endMs + graceMs,
        isLate: nowMs > endMs,
      };
    };

    const scheduleOptionLabel = (s) => {
      const dateText =
        s.startDate === s.endDate
          ? s.startDate
          : `${s.startDate} → ${s.endDate}`;

      const parts = [
        dateText,
        `${formatTime12Local(s.startTime)} - ${formatTime12Local(s.endTime)}`,
        s.instructor || "TBA",
        `${s.availableSlots} slot(s) left`,
      ];

      if (s.lateAdd) {
        parts.push(
          `Late add allowed (${ADMIN_LATE_ADD_GRACE_HOURS}h grace)`,
        );
      }

      return parts.join(" | ");
    };

    const loadAvailableSchedules = async () => {
      availableSchedules.value = [];

      if (!formData.course_id) return;

      scheduleLoading.value = true;

      try {
        const courseId = Number(formData.course_id);

        // =================================================
        // TESDA
        //
        // TBA is NOT allowed here.
        // Admin may still add to a recently-ended scheduled
        // batch while it is inside the late-add grace window.
        // Logical TESDA end uses the course duration.
        // =================================================
        if (formData.track === "tesda") {
          const json = await apiJson(
            `/api/admin/tesda/schedules?course_id=${courseId}`,
          );

          const rows = Array.isArray(json.data)
            ? json.data
            : [];

          const course =
            findCourseById(formData.course_id);

          availableSchedules.value = rows
            .filter((r) => {
              const rawStatus = String(
                r.scheduleStatus ||
                  r.status ||
                  "",
              ).toLowerCase();

              const availableSlots =
                Number(r.availableSlots || 0);

              // TBA/pooling is intentionally excluded.
              if (!r.date) return false;

              // Explicitly closed/TBA/full schedules are blocked.
              if (
                ["closed", "tba", "full"].includes(
                  rawStatus,
                )
              ) {
                return false;
              }

              if (availableSlots <= 0) {
                return false;
              }

              const logicalEndDate =
                tesdaEndDateFromStart(
                  r.date,
                  course?.duration ||
                    r.duration ||
                    "",
                );

              const lateState =
                getAdminLateAddState(
                  logicalEndDate || r.date,
                  r.endTime ||
                    r.end_time ||
                    "17:00",
                );

              return lateState.allowed;
            })
            .map((r) => {
              const logicalEndDate =
                tesdaEndDateFromStart(
                  r.date,
                  course?.duration ||
                    r.duration ||
                    "",
                );

              const lateState =
                getAdminLateAddState(
                  logicalEndDate || r.date,
                  r.endTime ||
                    r.end_time ||
                    "17:00",
                );

              return {
                id: Number(
                  r.id ?? r.schedule_id,
                ),

                courseId: Number(
                  r.course_id,
                ),

                startDate: r.date,

                endDate:
                  logicalEndDate ||
                  r.date,

                startTime:
                  r.startTime ||
                  r.start_time ||
                  "08:00",

                endTime:
                  r.endTime ||
                  r.end_time ||
                  "17:00",

                instructor:
                  r.instructor ||
                  r.instructor_name ||
                  r.trainer_name ||
                  "TBA",

                availableSlots:
                  Number(
                    r.availableSlots || 0,
                  ),

                lateAdd:
                  lateState.isLate,
              };
            })
            .sort((a, b) =>
              String(a.startDate).localeCompare(
                String(b.startDate),
              ),
            );

          return;
        }

        // =================================================
        // DRIVING
        //
        // Schedule Management may already display a session
        // as Closed/Done because its end time passed.
        // Students Management uses the RAW stored status plus
        // an 8-hour admin grace window.
        //
        // For grouped TDC/PDC-AB, the grace window is based
        // on the FINAL session of the package.
        // =================================================
        const json = await apiJson(
          `/api/admin/schedules?course_id=${courseId}`,
        );

        const rows = Array.isArray(json.data)
          ? json.data
          : [];

        const groups = new Map();

        for (const row of rows) {
          const key =
            row.scheduleGroupId ||
            `single-${row.id}`;

          if (!groups.has(key)) {
            groups.set(key, []);
          }

          groups.get(key).push(row);
        }

        const options = [];

        for (const members of groups.values()) {
          members.sort((a, b) => {
            const dateCompare =
              String(a.date || "").localeCompare(
                String(b.date || ""),
              );

            if (dateCompare !== 0) {
              return dateCompare;
            }

            return (
              Number(a.sessionNo || 1) -
              Number(b.sessionNo || 1)
            );
          });

          const structurallyAvailable =
            members.every((m) => {
              const rawStatus = String(
                m.scheduleStatus ||
                  m.status ||
                  "",
              ).toLowerCase();

              return (
                Boolean(m.date) &&
                ![
                  "closed",
                  "cancelled",
                  "canceled",
                  "full",
                ].includes(rawStatus) &&
                Number(
                  m.availableSlots || 0,
                ) > 0
              );
            });

          if (!structurallyAvailable) {
            continue;
          }

          const leader =
            members.find(
              (m) =>
                Number(m.sessionNo || 1) ===
                1,
            ) || members[0];

          const finalSession =
            members[members.length - 1];

          const lateState =
            getAdminLateAddState(
              finalSession.date,
              finalSession.endTime ||
                finalSession.end_time ||
                "23:59",
            );

          // Too old = no longer shown to admin.
          if (!lateState.allowed) {
            continue;
          }

          const dates = members
            .map((m) => m.date)
            .filter(Boolean)
            .sort();

          const availableSlots =
            Math.min(
              ...members.map((m) =>
                Number(
                  m.availableSlots || 0,
                ),
              ),
            );

          options.push({
            id: Number(
              leader.id ??
                leader.schedule_id,
            ),

            startDate:
              dates[0],

            endDate:
              dates[
                dates.length - 1
              ],

            startTime:
              leader.startTime ||
              leader.start_time,

            // Label uses the final session end time so
            // grouped schedule end is clearer.
            endTime:
              finalSession.endTime ||
              finalSession.end_time ||
              leader.endTime ||
              leader.end_time,

            instructor:
              leader.instructor ||
              leader.instructor_name ||
              "TBA",

            availableSlots,

            lateAdd:
              lateState.isLate,
          });
        }

        availableSchedules.value =
          options.sort((a, b) =>
            String(a.startDate).localeCompare(
              String(b.startDate),
            ),
          );
      } catch (e) {
        console.error(
          "loadAvailableSchedules error:",
          e,
        );

        availableSchedules.value =
          [];
      } finally {
        scheduleLoading.value =
          false;
      }
    };

    const onSchedulePick = () => {
      const selected =
        availableSchedules.value.find(
          (s) =>
            String(s.id) ===
            String(
              formData.schedule_id,
            ),
        );

      if (!selected) {
        formData.course_start = "";
        formData.course_end = "";
        formData.instructor_name =
          "";
        return;
      }

      formData.course_start =
        selected.startDate || "";

      formData.course_end =
        selected.endDate ||
        selected.startDate ||
        "";

      formData.instructor_name =
        selected.instructor || "";
    };

    const onCoursePick = async () => {

      const c = findCourseById(formData.course_id);

      if (!c) {

        if (!isEditing.value) {

          formData.schedule_id = "";

          formData.course_start = "";

          formData.course_end = "";

          formData.instructor_name = "";

        }

        formData.dl_code = "";

        formData.training_purpose = "";

        availableSchedules.value = [];

        return;

      }

      if (formData.track === "driving") {

        formData.dl_code = deriveDlFromCourseCode(c.course_code);

        if (!isDrivingPdcCourse(c)) formData.training_purpose = "";

      } else {

        formData.dl_code = "";

        formData.training_purpose = "";

      }

      // Existing records keep their current schedule during Edit.

      if (isEditing.value) return;

      formData.schedule_id = "";

      formData.course_start = "";

      formData.course_end = "";

      formData.instructor_name = "";

      await loadAvailableSchedules();

    };

    const fetchStudents = async (track) => {

      const params = new URLSearchParams({ q: searchQuery.value || "", source: selectedSource.value || "all", status: selectedStatus.value || "all", sort: sortBy.value || "full_name", page: "1", limit: "200" });

      const url = track === "tesda" ? `/api/admin/tesda/students?${params.toString()}` : `/api/admin/students?${params.toString()}&track=driving`;

      const json = await apiJson(url);

      const rows = Array.isArray(json.data) ? json.data : [];

      if (track === "tesda") {

        return rows.map((r) => ({ ...r, reservation_id: r.reservation_id, student_id: r.student_id || r.id, schedule_id: r.schedule_id, course_id: r.course_id, full_name: r.full_name ?? r.fullname ?? "", birthdate: r.birthdate ?? r.birthday ?? "", sex: r.sex ?? r.gender ?? "", instructor_name: r.instructor_name ?? r.trainer_name ?? "", course_name: r.course_name ?? "", course_code: r.course_code ?? "", course_start: r.course_start ?? r.schedule_date ?? "", course_end: r.course_end ?? "", status: (r.status || r.reservation_status || "").toLowerCase(), source: (r.source || r.reservation_source || "online").toLowerCase() }));

      }

      return rows.map((r) => ({ ...r, reservation_id: r.reservation_id, student_id: r.student_id, schedule_id: r.schedule_id, course_id: r.course_id, client_id: r.client_id ?? r.lto_client_id ?? "", full_name: r.full_name ?? r.fullname ?? "", birthdate: r.birthdate ?? r.birthday ?? "", sex: r.sex ?? r.gender ?? "", dl_code: r.dl_code ?? "", course_name: r.course_name ?? "", instructor_name: r.instructor_name ?? "", course_start: r.course_start ?? r.schedule_date ?? "", course_end: r.course_end ?? r.schedule_date ?? "", status: (r.status || r.reservation_status || "").toLowerCase(), source: (r.source || r.reservation_source || "online").toLowerCase() }));

    };

    const fetchActiveTabStudents = async () => { loading.value = true; try { if (activeTab.value === "driving") drivingStudents.value = await fetchStudents("driving"); else tesdaStudents.value = await fetchStudents("tesda"); } finally { loading.value = false; } };

    const fetchAll = async () => { loading.value = true; try { const [d, t] = await Promise.all([fetchStudents("driving"), fetchStudents("tesda")]); drivingStudents.value = d; tesdaStudents.value = t; } finally { loading.value = false; } };

    let tmr = null;

    const debouncedFetch = () => { clearTimeout(tmr); tmr = setTimeout(() => fetchActiveTabStudents(), 250); };

    const switchTab = (tab) => { activeTab.value = tab; resetActivePage(); fetchActiveTabStudents(); };

    const sortValue = (row, key) => { if (!row) return ""; if (key === "full_name") return String(row.full_name || ""); if (key === "client_id") return String(row.client_id || ""); if (key === "course_start") return String(fmtYMD(row.course_start) || ""); if (key === "course_end") return String(fmtYMD(row.course_end) || ""); if (key === "status") return String(row.status || ""); return String(row[key] || ""); };

    const applyLocalFilters = (arr) => {

      let out = Array.isArray(arr) ? [...arr] : [];

      const q = (searchQuery.value || "").toLowerCase().trim();

      if (q) { out = out.filter((s) => [s.client_id, s.full_name, s.email, s.course_name, s.instructor_name, s.dl_code, s.training_purpose || "", s.status, s.source].filter(Boolean).join(" ").toLowerCase().includes(q)); }

      if (selectedSource.value !== "all") { out = out.filter((s) => (s.source || "online") === selectedSource.value); }

      if (selectedStatus.value !== "all") { out = out.filter((s) => String(s.status || "").toLowerCase() === selectedStatus.value); }

      const key = sortBy.value;

      out.sort((a, b) => sortValue(a, key).localeCompare(sortValue(b, key)));

      return out;

    };

    const filteredDriving = computed(() => applyLocalFilters(drivingStudents.value));

    const filteredTesda = computed(() => applyLocalFilters(tesdaStudents.value));

    const pageSize = ref(15);

    const drivingPage = ref(1);

    const tesdaPage = ref(1);

    const activePage = computed(() => (activeTab.value === "driving" ? drivingPage.value : tesdaPage.value));

    const setActivePage = (p) => { if (activeTab.value === "driving") drivingPage.value = p; else tesdaPage.value = p; };

    const activeTotal = computed(() => activeTab.value === "driving" ? filteredDriving.value.length : filteredTesda.value.length);

    const activeTotalPages = computed(() => Math.max(1, Math.ceil(activeTotal.value / pageSize.value)));

    const paginatedDriving = computed(() => { const start = (drivingPage.value - 1) * pageSize.value; return filteredDriving.value.slice(start, start + pageSize.value); });

    const paginatedTesda = computed(() => { const start = (tesdaPage.value - 1) * pageSize.value; return filteredTesda.value.slice(start, start + pageSize.value); });

    const pageRange = computed(() => { const total = activeTotal.value; const page = activePage.value; const start = total === 0 ? 0 : (page - 1) * pageSize.value + 1; const end = Math.min(total, page * pageSize.value); return { start, end }; });

// Page buttons (like dashboard)

    const pageButtons = computed(() => {

      const total = activeTotalPages.value;

      const cur = activePage.value;

      const maxBtns = 5;

      let start = Math.max(1, cur - 2);

      let end = Math.min(total, start + maxBtns - 1);

      start = Math.max(1, end - maxBtns + 1);

      const out = [];

      for (let i = start; i <= end; i++) out.push(i);

      return out;

    });

    const goPrevPage = () => setActivePage(Math.max(1, activePage.value - 1));

    const goNextPage = () => setActivePage(Math.min(activeTotalPages.value, activePage.value + 1));

    const resetActivePage = () => setActivePage(1);

    watch([searchQuery, selectedStatus, selectedSource], () => resetActivePage());

    watch(activeTotalPages, () => { if (activePage.value > activeTotalPages.value) setActivePage(activeTotalPages.value); });

        const addressParts = ref({ street: "", barangay: "", city: "", province: "" });

        const buildAddressString = () =>
          [addressParts.value.street, addressParts.value.barangay, addressParts.value.city, addressParts.value.province]
            .map((x) => x?.trim()).filter(Boolean).join(", ");

        const composedAddressPreview = computed(() => buildAddressString() || "—");

        const fillAddressPartsFromString = (addr) => {
          const c = String(addr || "").split(",").map((x) => x.trim()).filter(Boolean);
          addressParts.value = { street: c[0] || "", barangay: c[1] || "", city: c[2] || "", province: c[3] || "" };
        };

        const onContactInput = () => {
          formData.contact_no = String(formData.contact_no || "").replace(/\D/g, "").slice(0, 11);
        };

        const nationalities = [
          "Filipino","American","British","Canadian","Australian","Chinese","Japanese","Korean",
          "Indian","Malaysian","Singaporean","Indonesian","Thai","Vietnamese","Cambodian","Laotian",
          "Myanmar","Pakistani","Bangladeshi","Sri Lankan","Nepalese","Bhutanese","Afghan","Iranian",
          "Iraqi","Saudi","Emirati","Qatari","Kuwaiti","Omani","Yemeni","Jordanian","Lebanese","Syrian",
          "Turkish","Russian","Ukrainian","Polish","German","French","Spanish","Italian","Portuguese",
          "Dutch","Belgian","Swiss","Austrian","Swedish","Norwegian","Danish","Finnish","Irish","Greek",
          "Romanian","Bulgarian","Hungarian","Czech","Slovak","Croatian","Serbian","Slovenian","Bosnian",
          "Albanian","Macedonian","Brazilian","Argentinian","Chilean","Peruvian","Colombian","Venezuelan",
          "Mexican","Cuban","Dominican","Jamaican","Haitian","South African","Nigerian","Kenyan","Egyptian","Moroccan",
        ];
        const nationalityQuery = ref("");
        const isNationalityOpen = ref(false);
        const nationalityHighlight = ref(0);
        const natWrapRef = ref(null);

        const filteredNationalities = computed(() => {
          const q = nationalityQuery.value.trim().toLowerCase();
          return (q ? nationalities.filter((n) => n.toLowerCase().includes(q)) : nationalities).slice(0, 12);
        });
        const openNationality = () => { isNationalityOpen.value = true; nationalityHighlight.value = 0; };
        const onNationalityInput = () => { openNationality(); formData.nationality = nationalityQuery.value; };
        const pickNationality = (n) => { nationalityQuery.value = n; formData.nationality = n; isNationalityOpen.value = false; };
        const moveNationality = (dir) => {
          isNationalityOpen.value = true;
          const max = filteredNationalities.value.length - 1;
          if (max < 0) return;
          nationalityHighlight.value = Math.max(0, Math.min(max, nationalityHighlight.value + dir));
        };
        const selectHighlightedNationality = () => {
          const n = filteredNationalities.value[nationalityHighlight.value];
          if (n) pickNationality(n);
        };
        const onDocMouseDown = (e) => {
          if (isNationalityOpen.value && natWrapRef.value && !natWrapRef.value.contains(e.target)) isNationalityOpen.value = false;
        };

    const resetForm = () => {

      formError.value = "";

      availableSchedules.value = [];

      Object.assign(formData, {

        reservation_id: null,

        student_id: null,

        schedule_id: null,

        source: "walkin",

        status: "confirmed",

        client_id: "",

          full_name: "",
        first_name: "",
        last_name: "",
        username: "",
        password: "",

      birthdate: "",
      sex: "",
      civil_status: "",
      email: "",
      track: "",
        instructor_name: "",

        course_start: "",

        course_end: "",

        training_purpose: "",

        course_id: "",

        dl_code: "",

        payment_method: "CASH",

        email: "",

        contact_no: "",

        address: "",
        nationality: "",
      });
      addressParts.value = { street: "", barangay: "", city: "", province: "" };
      nationalityQuery.value = "";
      isNationalityOpen.value = false;

    };

    const openAddModal = () => { isEditing.value = false; resetForm(); formData.track = activeTab.value; showModal.value = true; };

    const openEditModal = (row, track) => {

      isEditing.value = true; resetForm();

      formData.track = track; formData.reservation_id = row.reservation_id; formData.student_id = row.student_id; formData.schedule_id = row.schedule_id;

      formData.source = (row.source || "online").toLowerCase(); formData.status = (row.status || "confirmed").toLowerCase();

      formData.client_id = row.client_id || ""; formData.full_name = row.full_name || ""; 
      formData.birthdate = fmtYMD(row.birthdate) !== "—" ? fmtYMD(row.birthdate) : "";
      formData.sex = row.sex || "";
      formData.civil_status = row.civil_status || "";
      formData.email = row.email || "";

      formData.sex = row.sex || ""; formData.instructor_name = row.instructor_name || ""; formData.course_start = fmtYMD(row.course_start) !== "—" ? fmtYMD(row.course_start) : "";

      formData.course_end = fmtYMD(row.course_end) !== "—" ? fmtYMD(row.course_end) : ""; formData.training_purpose = row.training_purpose || "";

      formData.course_id = row.course_id ? String(row.course_id) : ""; formData.dl_code = row.dl_code || "";

     formData.email = row.email || "";
      formData.contact_no = row.contact_no || row.contact || "";
      formData.address = row.address || "";
      formData.nationality = row.nationality || "";
      fillAddressPartsFromString(formData.address);
      nationalityQuery.value = formData.nationality;
      const nm = splitFullName(row.full_name);
      formData.first_name = nm.first;
      formData.last_name = nm.last;
      formData.username = row.username || "";
      formData.password = "";
      showModal.value = true; onCoursePick();

    };

    const closeModal = () => { showModal.value = false; };

      // Close only if mousedown AND mouseup both happen on the overlay itself
      const overlayDownOnSelf = ref(false);
      const onOverlayPointerDown = (e) => { overlayDownOnSelf.value = e.target === e.currentTarget; };
      const onOverlayPointerUp = (e) => {
        if (overlayDownOnSelf.value && e.target === e.currentTarget) closeModal();
        overlayDownOnSelf.value = false;
      };

    const openDeleteModal = (row, track) => { studentToDelete.value = { ...row, track }; showDeleteModal.value = true; };

    const closeDeleteModal = () => { showDeleteModal.value = false; studentToDelete.value = null; };

      const submitStudent = async () => {
        saving.value = true;
        formError.value = "";

        try {
          const isTesda = formData.track === "tesda";
          const baseUrl = isTesda ? "/api/admin/tesda/students" : "/api/admin/students";

          const first = formData.first_name.trim();
          const last = formData.last_name.trim();
          const fullName = [first, last].filter(Boolean).join(" ");

          const payload = {
            first_name: first,
            last_name: last,
            full_name: fullName,
            username: formData.username.trim() || null,
            password: formData.password || null,
            birthdate: formData.birthdate || null,
            sex: formData.sex || null,
            civil_status: formData.civil_status || null,
            email: formData.email || null,
            track: formData.track,
            contact_no: formData.contact_no || null,
            contact: formData.contact_no || null, // temporary; aalisin ang isa kapag nakita ko ang backend
            address: buildAddressString() || null,
            nationality: formData.nationality?.trim() || null,
            source: formData.source,
            status: formData.status,
            course_id: formData.course_id ? Number(formData.course_id) : null,
            schedule_id: formData.schedule_id ? Number(formData.schedule_id) : null,
            course_start: formData.course_start || null,
            course_end: formData.course_end || null,
            training_purpose: !isTesda && isSelectedDrivingPdc.value ? formData.training_purpose || null : null,
            client_id: formData.client_id || null,
            dl_code: formData.dl_code || null,
            payment_method: !isTesda ? formData.payment_method : null,
          };

          if (!first || !last) {
            formError.value = "First name and last name are required.";
            return;
          }

          if (!isEditing.value) {
            if (!formData.username.trim()) { formError.value = "Username is required."; return; }
            if (!formData.password) { formError.value = "Password is required."; return; }
            if (!formData.email) { formError.value = "Email is required."; return; }
            if (!formData.birthdate) { formError.value = "Birthdate is required."; return; }
            if (!/^09\d{9}$/.test(formData.contact_no || "")) { formError.value = "Enter a valid contact number (09XXXXXXXXX)."; return; }
            if (!buildAddressString() || Object.values(addressParts.value).some((x) => !x.trim())) { formError.value = "Complete address is required."; return; }
            if (!formData.nationality?.trim()) { formError.value = "Nationality is required."; return; }
          }

          if (formData.password && formData.password.length < 8) {
            formError.value = "Password must be at least 8 characters.";
            return;
          }

          if (formData.birthdate && !isAtLeastMinAge(formData.birthdate)) {
            formError.value = `Student must be at least ${minAge.value} years old for ${formData.track.toUpperCase()}.`;
            return;
          }

          if (!payload.course_id) {
            formError.value = "Course is required.";
            return;
          }

          if (!isEditing.value && !payload.schedule_id) {
            formError.value = "Please select an available schedule.";
            return;
          }

          if (!isTesda && !isEditing.value && !payload.payment_method) {
            formError.value = "Payment method is required.";
            return;
          }

          if (!isTesda && isSelectedDrivingPdc.value && !payload.training_purpose) {
            formError.value = "Training purpose is required for PDC.";
            return;
          }

          if (isEditing.value && formData.reservation_id) {
            await apiJson(`${baseUrl}/${formData.reservation_id}`, { method: "PUT", body: JSON.stringify(payload) });
          } else {
            await apiJson(baseUrl, { method: "POST", body: JSON.stringify(payload) });
          }

          closeModal();
          await fetchActiveTabStudents();
        } catch (e) {
          formError.value = e?.message || "Failed to save.";
        } finally {
          saving.value = false;
        }
      };

    const confirmDelete = async () => { if (!studentToDelete.value?.reservation_id) return; saving.value = true; try { const isTesda = studentToDelete.value.track === "tesda"; const baseUrl = isTesda ? "/api/admin/tesda/students" : "/api/admin/students"; await apiJson(`${baseUrl}/${studentToDelete.value.reservation_id}`, { method: "DELETE" }); closeDeleteModal(); await fetchActiveTabStudents(); } catch (e) { console.error(e); } finally { saving.value = false; } };

    onMounted(async () => {
      document.addEventListener("mousedown", onDocMouseDown, true);
      await fetchCourses(); await fetchAll();
    });
    onBeforeUnmount(() => document.removeEventListener("mousedown", onDocMouseDown, true));

    return {

      activeTab, drivingStudents, tesdaStudents, loading, saving,

      searchQuery, selectedStatus, selectedSource, sortBy,

      filteredDriving, filteredTesda, paginatedDriving, paginatedTesda,

      pageSize, activePage, activeTotal, activeTotalPages, pageRange, pageButtons,

      goPrevPage, goNextPage, resetActivePage, setActivePage,

      fmtYMD, fmtBirth, statusPill, getTesdaEndDate, tesdaEndDateFromStart,

      drivingCourses, tesdaCourses, modalCourses, onCoursePick, isSelectedDrivingPdc,

      availableSchedules, scheduleLoading, selectedCourseFee, formatPeso, scheduleOptionLabel, onSchedulePick,

      debouncedFetch, switchTab, fetchActiveTabStudents,

      showModal, showDeleteModal, isEditing, studentToDelete, formData, formError,

      openAddModal, openEditModal, closeModal, openDeleteModal, closeDeleteModal,

      submitStudent, confirmDelete,
      minAge, maxBirthdate, onOverlayPointerDown, onOverlayPointerUp,

      addressParts, composedAddressPreview, onContactInput,
      natWrapRef, nationalityQuery, isNationalityOpen, nationalityHighlight, filteredNationalities,
      openNationality, onNationalityInput, pickNationality, moveNationality, selectHighlightedNationality,

    };

  },

};

</script>

<style scoped>

/* ========== WRAPPER ========== */

.students-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 16px; }

.page-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }

.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }

.page-subtitle { font-size: 0.8rem; color: #6b7280; margin: 2px 0 0; }

/* ========== ADD BUTTON ========== */

.add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }

.add-btn:hover { background: #059669; transform: translateY(-1px); }

/* ========== SEARCH ========== */

.search-box { position: relative; flex: 1; max-width: 380px; }

.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }

.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }

.search-input-modern:focus { border-color: #10b981; }

/* ========== TABS ========== */

.tab-group { display: flex; gap: 8px; }

.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.2s; background: #fff; color: #6b7280; }

.tab-inactive:hover { border-color: #d1d5db; color: #374151; }

.tab-active-green { background: #10b981; color: #fff; border-color: #10b981; }

.tab-active-blue { background: #3b82f6; color: #fff; border-color: #3b82f6; }

/* ========== FILTERS ========== */

.filters-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }

.filter-item { display: flex; flex-direction: column; gap: 4px; }

.filter-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }

.select-modern { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.8rem; color: #374151; background: #fff; outline: none; cursor: pointer; min-width: 140px; }

.select-modern:focus { border-color: #10b981; }

.ml-auto { margin-left: auto; }

/* ========== PANEL / TABLE ========== */

.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }

.table-wrap { overflow-x: auto; }

.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }

.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }

.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }

.modern-table tbody tr:hover { background: #f9fafb; }

.thead-green th { background: #10b981; color: #fff; border-bottom: none; }

.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }

.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== PILLS ========== */

.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }

.pill-green { background: #d1fae5; color: #059669; }

.pill-blue { background: #dbeafe; color: #2563eb; }

.pill-amber { background: #fef3c7; color: #d97706; }

.pill-red { background: #fee2e2; color: #dc2626; }

.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ========== ACTION BUTTONS ========== */

.action-btns { display: flex; gap: 6px; }

.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }

.action-edit:hover { background: #2563eb; }

.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }

.action-delete:hover { background: #dc2626; }

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

.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }

.modal-card-sm { max-width: 420px; }

.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }

.modal-head-green { background: #f0fdf4; border-bottom: 1px solid #d1fae5; }

.modal-head-blue { background: #eff6ff; border-bottom: 1px solid #dbeafe; }

.modal-head-red { background: #fef2f2; border-bottom: 1px solid #fee2e2; }

.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }

.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }

.modal-close-btn:hover { background: #f3f4f6; color: #111827; }

.track-badge-sm { padding: 3px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; }

.track-green { background: #d1fae5; color: #059669; }

.track-blue { background: #dbeafe; color: #2563eb; }

.modal-body { padding: 20px; }

.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; }

.error-box { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; color: #dc2626; font-size: 0.85rem; margin-bottom: 16px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.form-group { display: flex; flex-direction: column; gap: 4px; }

.md-col-span-2 { grid-column: span 2; }

.form-label { font-size: 0.75rem; font-weight: 600; color: #374151; }

.form-input { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; }

.form-input:focus { border-color: #10b981; }

.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }

.btn-cancel:hover { background: #f3f4f6; }

.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }

.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-green { background: #10b981; }

.btn-green:hover:not(:disabled) { background: #059669; }

.btn-blue { background: #3b82f6; }

.btn-blue:hover:not(:disabled) { background: #2563eb; }

.btn-red { background: #ef4444; }

.btn-red:hover:not(:disabled) { background: #dc2626; }

.form-group { position: relative; }
.address-grid { margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.address-preview { margin-top: 8px; font-size: 0.75rem; color: #6b7280; }
.address-preview span { color: #111827; font-weight: 600; }
.nationality-dropdown { position: absolute; z-index: 20; top: 100%; margin-top: 4px; width: 100%; max-height: 190px; overflow-y: auto; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
.nationality-option { display: block; width: 100%; text-align: left; padding: 8px 12px; font-size: 0.85rem; background: transparent; border: none; color: #374151; cursor: pointer; }
.nationality-option:hover, .nationality-option-active { background: #f0fdf4; color: #059669; }
@media (max-width: 640px) { .address-grid { grid-template-columns: 1fr; } }

/* ========== ANIMATIONS ========== */

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }

.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.modal-scale-enter-active { transition: all 0.25s ease; }

.modal-scale-leave-active { transition: all 0.15s ease; }

.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }

.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ========== MISC ========== */

.flex { display: flex; } .items-center { align-items: center; } .gap-3 { gap: 12px; }

@media (max-width: 640px) {

  .form-grid { grid-template-columns: 1fr; }

  .md-col-span-2 { grid-column: span 1; }

}

</style>