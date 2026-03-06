<!-- frontend/src/components/admin/AdminStudents.vue -->
<template>
  <AdminLayout>
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        :placeholder="
          activeTab === 'driving'
            ? 'Search driving student...'
            : 'Search TESDA student...'
        "
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
        @input="debouncedFetch"
      />
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-lg font-bold text-green-800">👨‍🎓 Students Management</h2>
          <p class="text-xs text-gray-500 mt-1">
            Sections: Driving / TESDA • Source: Online + Walk-in
          </p>
        </div>

        <button
          @click="openAddModal"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          ➕ Add Student
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 mb-5">
        <button
          class="px-4 py-2 rounded-md font-medium text-sm"
          :class="
            activeTab === 'driving'
              ? 'bg-green-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          "
          @click="switchTab('driving')"
        >
          🚗 Driving
        </button>

        <button
          class="px-4 py-2 rounded-md font-medium text-sm"
          :class="
            activeTab === 'tesda'
              ? 'bg-blue-700 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          "
          @click="switchTab('tesda')"
        >
          🛠 TESDA
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="selectedStatus"
            class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            @change="fetchActiveTabStudents"
          >
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

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select
            v-model="selectedSource"
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none"
            @change="fetchActiveTabStudents"
          >
            <option value="all">Online + Walk-in</option>
            <option value="online">Online only</option>
            <option value="walkin">Walk-in only</option>
          </select>
        </div>

        <div class="ml-auto">
          <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            v-model="sortBy"
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none"
          >
            <option value="full_name">Full Name</option>
            <option v-if="activeTab === 'driving'" value="client_id">Client ID</option>
            <option value="course_start">Course Start</option>
            <option value="course_end">Course End</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <div v-if="loading" class="p-6 text-center text-gray-500">
          Loading students...
        </div>

        <!-- DRIVING -->
        <table v-else-if="activeTab === 'driving'" class="w-full text-xs md:text-sm">
          <thead class="bg-green-50">
            <tr class="text-left text-gray-700">
              <th class="p-3">#</th>
              <th class="p-3">Client ID</th>
              <th class="p-3">Full Name</th>
              <th class="p-3">Birthdate</th>
              <th class="p-3">Sex</th>
              <th class="p-3">DL Code</th>
              <th class="p-3">Course</th>
              <th class="p-3">Start</th>
              <th class="p-3">End</th>
              <th class="p-3">Instructor</th>
              <th class="p-3">Status</th>
              <th class="p-3">Source</th>
              <th class="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(s, idx) in paginatedDriving"
              :key="s.reservation_id"
              class="border-t border-gray-100 hover:bg-gray-50"
            >
              <td class="p-3">{{ (pageRange.start || 1) + idx }}</td>
              <td class="p-3">{{ s.client_id || "—" }}</td>
              <td class="p-3 font-medium">{{ s.full_name || "—" }}</td>
              <td class="p-3">{{ fmtBirth(s.birthdate) }}</td>
              <td class="p-3">{{ s.sex || "—" }}</td>
              <td class="p-3">{{ s.dl_code || "—" }}</td>
              <td class="p-3">{{ s.course_name || "—" }}</td>
              <td class="p-3">{{ fmtYMD(s.course_start) }}</td>
              <td class="p-3">{{ fmtYMD(s.course_end) }}</td>
              <td class="p-3">{{ s.instructor_name || "—" }}</td>
              <td class="p-3">
                <span
                  class="px-2 py-1 rounded-full text-xs font-semibold"
                  :class="statusPill(s.status)"
                >
                  {{ s.status || "—" }}
                </span>
              </td>
              <td class="p-3">{{ s.source || "—" }}</td>
              <td class="p-3">
                <button
                  class="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs mr-2"
                  @click="openEditModal(s, 'driving')"
                >
                  Edit
                </button>
                <button
                  class="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                  @click="openDeleteModal(s, 'driving')"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!filteredDriving.length">
              <td colspan="13" class="p-6 text-center text-gray-500">
                No driving students found.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- TESDA -->
        <table v-else class="w-full text-xs md:text-sm">
          <thead class="bg-blue-50">
            <tr class="text-left text-gray-700">
              <th class="p-3">#</th>
              <th class="p-3">Full Name</th>
              <th class="p-3">Birthdate</th>
              <th class="p-3">Sex</th>
              <th class="p-3">Course</th>
              <th class="p-3">Start</th>
              <th class="p-3">End</th>
              <th class="p-3">Trainer</th>
              <th class="p-3">Status</th>
              <th class="p-3">Source</th>
              <th class="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(s, idx) in paginatedTesda"
              :key="s.reservation_id"
              class="border-t border-gray-100 hover:bg-gray-50"
            >
              <td class="p-3">{{ (pageRange.start || 1) + idx }}</td>
              <td class="p-3 font-medium">{{ s.full_name || "—" }}</td>
              <td class="p-3">{{ fmtBirth(s.birthdate) }}</td>
              <td class="p-3">{{ s.sex || "—" }}</td>
              <td class="p-3">{{ s.course_name || "—" }}</td>
              <td class="p-3">{{ fmtYMD(s.course_start) }}</td>
              <td class="p-3">{{ fmtYMD(getTesdaEndDate(s)) }}</td>
              <td class="p-3">{{ s.instructor_name || "—" }}</td>
              <td class="p-3">
                <span
                  class="px-2 py-1 rounded-full text-xs font-semibold"
                  :class="statusPill(s.status)"
                >
                  {{ s.status || "—" }}
                </span>
              </td>
              <td class="p-3">{{ s.source || "—" }}</td>
              <td class="p-3">
                <button
                  class="px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs mr-2"
                  @click="openEditModal(s, 'tesda')"
                >
                  Edit
                </button>
                <button
                  class="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs"
                  @click="openDeleteModal(s, 'tesda')"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!filteredTesda.length">
              <td colspan="11" class="p-6 text-center text-gray-500">
                No TESDA students found.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-t bg-gray-50 text-sm"
        >
          <div class="text-gray-600">
            Showing
            <span class="font-semibold">{{ pageRange.start }}</span>
            –
            <span class="font-semibold">{{ pageRange.end }}</span>
            of
            <span class="font-semibold">{{ activeTotal }}</span>
          </div>

          <div class="flex items-center gap-2 justify-end">
            <button
              class="px-3 py-1.5 rounded-md border text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              :disabled="activePage <= 1"
              @click="goPrevPage"
            >
              ◀ Prev
            </button>

            <span class="text-gray-700">
              Page <span class="font-semibold">{{ activePage }}</span> /
              <span class="font-semibold">{{ activeTotalPages }}</span>
            </span>

            <button
              class="px-3 py-1.5 rounded-md border text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              :disabled="activePage >= activeTotalPages"
              @click="goNextPage"
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD/EDIT MODAL -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden">
        <div
          class="flex items-center justify-between px-5 py-4 border-b"
          :class="formData.track === 'tesda' ? 'bg-blue-50' : 'bg-green-50'"
        >
          <h3 class="font-bold text-gray-800">
            {{ isEditing ? "✏️ Edit Student" : "➕ Add Student" }}
            <span class="text-xs font-semibold ml-2 px-2 py-1 rounded"
              :class="formData.track === 'tesda' ? 'bg-blue-200 text-blue-900' : 'bg-green-200 text-green-900'">
              {{ formData.track.toUpperCase() }}
            </span>
          </h3>

          <button class="text-gray-500 hover:text-gray-700" @click="closeModal">
            ✖
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div v-if="formError" class="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {{ formError }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium text-gray-700">Full Name *</label>
              <input
                v-model="formData.full_name"
                class="w-full mt-1 p-2 border rounded-md"
                type="text"
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div v-if="formData.track === 'driving'">
              <label class="text-sm font-medium text-gray-700">Client ID</label>
              <input
                v-model="formData.client_id"
                class="w-full mt-1 p-2 border rounded-md"
                type="text"
                placeholder="LTO Client ID"
              />
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Birthdate</label>
              <input v-model="formData.birthdate" class="w-full mt-1 p-2 border rounded-md" type="date" />
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Sex</label>
              <select v-model="formData.sex" class="w-full mt-1 p-2 border rounded-md">
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Email</label>
              <input v-model="formData.email" class="w-full mt-1 p-2 border rounded-md" type="email" placeholder="email@example.com" />
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Source</label>
              <select v-model="formData.source" class="w-full mt-1 p-2 border rounded-md">
                <option value="online">walkin</option>
                <option value="walkin">online</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Status</label>
              <select v-model="formData.status" class="w-full mt-1 p-2 border rounded-md">
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

            <div>
              <label class="text-sm font-medium text-gray-700">Course *</label>
              <select
                v-model="formData.course_id"
                class="w-full mt-1 p-2 border rounded-md"
                @change="onCoursePick"
              >
                <option value="">— Select course —</option>
                <option
                  v-for="c in modalCourses"
                  :key="c.id"
                  :value="String(c.id)"
                >
                  {{ c.course_name }} <span v-if="c.course_code">({{ c.course_code }})</span>
                </option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Course Start</label>
              <input v-model="formData.course_start" class="w-full mt-1 p-2 border rounded-md" type="date" />
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700">Course End</label>
              <input
                v-model="formData.course_end"
                class="w-full mt-1 p-2 border rounded-md"
                type="date"
                :readonly="formData.track === 'tesda'"
              />
              <p v-if="formData.track === 'tesda'" class="text-xs text-gray-500 mt-1">
                Auto-computed (based on course duration) when start date is set.
              </p>
            </div>

            <div v-if="formData.track === 'driving'">
              <label class="text-sm font-medium text-gray-700">DL Code</label>
              <input v-model="formData.dl_code" class="w-full mt-1 p-2 border rounded-md" type="text" placeholder="A / B / AB" />
            </div>

            <div class="md:col-span-2">
              <label class="text-sm font-medium text-gray-700">Training Purpose</label>
              <input v-model="formData.training_purpose" class="w-full mt-1 p-2 border rounded-md" type="text" placeholder="e.g., Employment, Skill upgrade..." />
            </div>
          </div>
        </div>

        <div class="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button class="px-4 py-2 rounded-md border hover:bg-gray-50" @click="closeModal">
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-md text-white"
            :class="formData.track === 'tesda' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-green-700 hover:bg-green-800'"
            :disabled="saving"
            @click="submitStudent"
          >
            {{ saving ? "Saving..." : isEditing ? "Update" : "Create" }}
          </button>
        </div>
      </div>
    </div>

    <!-- DELETE MODAL -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div class="px-5 py-4 border-b bg-red-50 flex items-center justify-between">
          <h3 class="font-bold text-gray-800">🗑 Delete Student</h3>
          <button class="text-gray-500 hover:text-gray-700" @click="closeDeleteModal">
            ✖
          </button>
        </div>

        <div class="p-5 text-sm text-gray-700 space-y-2">
          <p>
            Are you sure you want to delete:
            <span class="font-semibold">{{ studentToDelete?.full_name }}</span>
            ?
          </p>
          <p class="text-xs text-gray-500">
            This will mark the reservation as <b>CANCELLED</b> (soft delete).
          </p>
        </div>

        <div class="px-5 py-4 border-t flex items-center justify-end gap-2">
          <button class="px-4 py-2 rounded-md border hover:bg-gray-50" @click="closeDeleteModal">
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
            :disabled="saving"
            @click="confirmDelete"
          >
            {{ saving ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from "vue";
import AdminLayout from "./AdminLayout.vue";

// fetch helper
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

    // filters
    const searchQuery = ref("");
    const selectedStatus = ref("all");
    const selectedSource = ref("all");
    const sortBy = ref("full_name");

    // courses
    const drivingCourses = ref([]);
    const tesdaCourses = ref([]);

    // modals
    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const isEditing = ref(false);
    const studentToDelete = ref(null);
    const formError = ref("");

    const formData = reactive({
      reservation_id: null,
      student_id: null,
      schedule_id: null,

      track: "driving",
      source: "online",
      status: "confirmed",

      client_id: "",
      full_name: "",
      birthdate: "",
      sex: "",
      instructor_name: "",
      course_start: "",
      course_end: "",
      training_purpose: "",

      course_id: "",
      dl_code: "",

      email: "",
      contact_no: "",
      address: "",
    });

    const fmtYMD = (d) => {
      if (!d) return "—";
      const s = String(d);
      return s.includes("T") ? s.split("T")[0] : s;
    };

    const toYMD = (d) => {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "";
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const fmtBirth = (d) => {
      if (!d) return "—";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "—";
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const yy = String(dt.getFullYear()).slice(-2);
      return `${mm}/${dd}/${yy}`;
    };

    function statusPill(status) {
      const s = String(status || "").toLowerCase();
      if (["active", "confirmed", "approved"].includes(s)) return "bg-green-100 text-green-800";
      if (["pending"].includes(s)) return "bg-yellow-100 text-yellow-800";
      if (["rejected", "cancelled", "canceled"].includes(s)) return "bg-red-100 text-red-800";
      return "bg-gray-100 text-gray-700";
    }

    // TESDA end date compute (exclude Sundays)
    const tesdaEndDateFromStart = (startYmd, durationText) => {
      if (!startYmd) return "";
      const start = new Date(startYmd);
      if (Number.isNaN(start.getTime())) return "";

      const s = String(durationText || "").toLowerCase();
      const m = s.match(/(\d+)\s*(hour|hours|day|days|week|weeks|month|months)/);
      if (!m) return toYMD(start);

      const n = Number(m[1]);
      const unit = m[2];

      let days = 0;
      if (unit.startsWith("hour")) days = Math.ceil(n / 8);
      else if (unit.startsWith("day")) days = n;
      else if (unit.startsWith("week")) days = n * 6;
      else if (unit.startsWith("month")) days = n * 26;

      if (!days || days <= 1) return toYMD(start);

      let remaining = days - 1;
      const cur = new Date(start);
      while (remaining > 0) {
        cur.setDate(cur.getDate() + 1);
        if (cur.getDay() === 0) continue;
        remaining--;
      }
      return toYMD(cur);
    };

    const getTesdaEndDate = (row) => {
      const start = row?.course_start || row?.schedule_date || "";
      const dur = row?.duration || row?.course_duration || row?.course_hours || "";
      const computed = tesdaEndDateFromStart(start, dur);
      return row?.course_end || computed || "";
    };

    // Load courses (if endpoint exists in your backend; if not, it will just fail silently)
    const fetchCourses = async () => {
      try {
        const d = await apiJson(`/api/admin/courses?track=driving`);
        const t = await apiJson(`/api/admin/courses?track=tesda`);
        drivingCourses.value = Array.isArray(d.data) ? d.data : [];
        tesdaCourses.value = Array.isArray(t.data) ? t.data : [];
      } catch (e) {
        drivingCourses.value = [];
        tesdaCourses.value = [];
        console.warn("fetchCourses failed:", e?.message || e);
      }
    };

    const modalCourses = computed(() => (formData.track === "tesda" ? tesdaCourses.value : drivingCourses.value));

    const findCourseById = (id) => {
      const all = formData.track === "tesda" ? tesdaCourses.value : drivingCourses.value;
      return all.find((c) => String(c.id) === String(id)) || null;
    };

    const deriveDlFromCourseCode = (course_code) => {
      const code = String(course_code || "").toUpperCase();
      if (code.startsWith("PDC-")) return code.split("-").pop() || "";
      return "";
    };

    const onCoursePick = () => {
      const c = findCourseById(formData.course_id);
      if (!c) return;

      if (formData.track === "driving") {
        const dl = deriveDlFromCourseCode(c.course_code);
        if (dl) formData.dl_code = dl;
      } else {
        if (formData.course_start) {
          formData.course_end = tesdaEndDateFromStart(formData.course_start, c.duration || "");
        }
      }
    };

    // -------------------
    // Fetch students
    // -------------------
    const fetchStudents = async (track) => {
      const params = new URLSearchParams({
        q: searchQuery.value || "",
        source: selectedSource.value || "all",
        status: selectedStatus.value || "all",
        sort: sortBy.value || "full_name",
        page: "1",
        limit: "200",
      });

      const url =
        track === "tesda"
          ? `/api/admin/tesda/students?${params.toString()}`
          : `/api/admin/students?${params.toString()}&track=driving`;

      const json = await apiJson(url);
      const rows = Array.isArray(json.data) ? json.data : [];

      if (track === "tesda") {
        return rows.map((r) => ({
          ...r,
          reservation_id: r.reservation_id,
          student_id: r.student_id || r.id,
          schedule_id: r.schedule_id,
          course_id: r.course_id,
          full_name: r.full_name ?? r.fullname ?? "",
          birthdate: r.birthdate ?? r.birthday ?? "",
          sex: r.sex ?? r.gender ?? "",
          instructor_name: r.instructor_name ?? r.trainer_name ?? "",
          course_name: r.course_name ?? "",
          course_code: r.course_code ?? "",
          course_start: r.course_start ?? r.schedule_date ?? "",
          course_end: r.course_end ?? "",
          status: (r.status || r.reservation_status || "").toLowerCase(),
          source: (r.source || r.reservation_source || "online").toLowerCase(),
        }));
      }

      return rows.map((r) => ({
        ...r,
        reservation_id: r.reservation_id,
        student_id: r.student_id,
        schedule_id: r.schedule_id,
        course_id: r.course_id,
        client_id: r.client_id ?? r.lto_client_id ?? "",
        full_name: r.full_name ?? r.fullname ?? "",
        birthdate: r.birthdate ?? r.birthday ?? "",
        sex: r.sex ?? r.gender ?? "",
        dl_code: r.dl_code ?? "",
        course_name: r.course_name ?? "",
        instructor_name: r.instructor_name ?? "",
        course_start: r.course_start ?? r.schedule_date ?? "",
        course_end: r.course_end ?? r.schedule_date ?? "",
        status: (r.status || r.reservation_status || "").toLowerCase(),
        source: (r.source || r.reservation_source || "online").toLowerCase(),
      }));
    };

    const fetchActiveTabStudents = async () => {
      loading.value = true;
      try {
        if (activeTab.value === "driving") drivingStudents.value = await fetchStudents("driving");
        else tesdaStudents.value = await fetchStudents("tesda");
      } finally {
        loading.value = false;
      }
    };

    const fetchAll = async () => {
      loading.value = true;
      try {
        const [d, t] = await Promise.all([fetchStudents("driving"), fetchStudents("tesda")]);
        drivingStudents.value = d;
        tesdaStudents.value = t;
      } finally {
        loading.value = false;
      }
    };

    // debounce search
    let tmr = null;
    const debouncedFetch = () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => fetchActiveTabStudents(), 250);
    };

    const switchTab = (tab) => {
      activeTab.value = tab;
      resetActivePage();
      fetchActiveTabStudents();
    };

    // local filter + sort
    const sortValue = (row, key) => {
      if (!row) return "";
      if (key === "full_name") return String(row.full_name || "");
      if (key === "client_id") return String(row.client_id || "");
      if (key === "course_start") return String(fmtYMD(row.course_start) || "");
      if (key === "course_end") return String(fmtYMD(row.course_end) || "");
      if (key === "status") return String(row.status || "");
      return String(row[key] || "");
    };

    const applyLocalFilters = (arr) => {
      let out = Array.isArray(arr) ? [...arr] : [];

      const q = (searchQuery.value || "").toLowerCase().trim();
      if (q) {
        out = out.filter((s) =>
          [
            s.client_id,
            s.full_name,
            s.email,
            s.course_name,
            s.instructor_name,
            s.dl_code,
            s.training_purpose || "",
            s.status,
            s.source,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }

      if (selectedSource.value !== "all") {
        out = out.filter((s) => (s.source || "online") === selectedSource.value);
      }

      if (selectedStatus.value !== "all") {
        out = out.filter((s) => String(s.status || "").toLowerCase() === selectedStatus.value);
      }

      const key = sortBy.value;
      out.sort((a, b) => sortValue(a, key).localeCompare(sortValue(b, key)));

      return out;
    };

    const filteredDriving = computed(() => applyLocalFilters(drivingStudents.value));
    const filteredTesda = computed(() => applyLocalFilters(tesdaStudents.value));

    // ------------------------
    // Pagination (client-side)
    // ------------------------
    const pageSize = ref(15);
    const drivingPage = ref(1);
    const tesdaPage = ref(1);

    const activePage = computed(() => (activeTab.value === "driving" ? drivingPage.value : tesdaPage.value));

    const setActivePage = (p) => {
      if (activeTab.value === "driving") drivingPage.value = p;
      else tesdaPage.value = p;
    };

    const activeTotal = computed(() =>
      activeTab.value === "driving" ? filteredDriving.value.length : filteredTesda.value.length
    );

    const activeTotalPages = computed(() => Math.max(1, Math.ceil(activeTotal.value / pageSize.value)));

    const paginatedDriving = computed(() => {
      const start = (drivingPage.value - 1) * pageSize.value;
      return filteredDriving.value.slice(start, start + pageSize.value);
    });

    const paginatedTesda = computed(() => {
      const start = (tesdaPage.value - 1) * pageSize.value;
      return filteredTesda.value.slice(start, start + pageSize.value);
    });

    const pageRange = computed(() => {
      const total = activeTotal.value;
      const page = activePage.value;
      const start = total === 0 ? 0 : (page - 1) * pageSize.value + 1;
      const end = Math.min(total, page * pageSize.value);
      return { start, end };
    });

    const goPrevPage = () => setActivePage(Math.max(1, activePage.value - 1));
    const goNextPage = () => setActivePage(Math.min(activeTotalPages.value, activePage.value + 1));
    const resetActivePage = () => setActivePage(1);

    watch([searchQuery, selectedStatus, selectedSource], () => resetActivePage());

    watch(activeTotalPages, () => {
      if (activePage.value > activeTotalPages.value) setActivePage(activeTotalPages.value);
    });

    // auto compute TESDA end date when start/course change
    watch(
      () => [formData.track, formData.course_start, formData.course_id],
      () => {
        if (formData.track !== "tesda") return;
        const c = findCourseById(formData.course_id);
        if (!c) return;
        if (!formData.course_start) return;
        formData.course_end = tesdaEndDateFromStart(formData.course_start, c.duration || "");
      }
    );

    // -------------------------
    // MODAL / ACTION HANDLERS ✅
    // -------------------------
    const resetForm = () => {
      formError.value = "";
      formData.reservation_id = null;
      formData.student_id = null;
      formData.schedule_id = null;

      formData.source = "online";
      formData.status = "confirmed";

      formData.client_id = "";
      formData.full_name = "";
      formData.birthdate = "";
      formData.sex = "";
      formData.instructor_name = "";
      formData.course_start = "";
      formData.course_end = "";
      formData.training_purpose = "";

      formData.course_id = "";
      formData.dl_code = "";

      formData.email = "";
      formData.contact_no = "";
      formData.address = "";
    };

    const openAddModal = () => {
      isEditing.value = false;
      resetForm();
      formData.track = activeTab.value;
      showModal.value = true;
    };

    const openEditModal = (row, track) => {
      isEditing.value = true;
      resetForm();

      formData.track = track;
      formData.reservation_id = row.reservation_id;
      formData.student_id = row.student_id;
      formData.schedule_id = row.schedule_id;

      formData.source = (row.source || "online").toLowerCase();
      formData.status = (row.status || "confirmed").toLowerCase();

      formData.client_id = row.client_id || "";
      formData.full_name = row.full_name || "";
      formData.birthdate = fmtYMD(row.birthdate) !== "—" ? fmtYMD(row.birthdate) : "";
      formData.sex = row.sex || "";

      formData.instructor_name = row.instructor_name || "";
      formData.course_start = fmtYMD(row.course_start) !== "—" ? fmtYMD(row.course_start) : "";
      formData.course_end = fmtYMD(row.course_end) !== "—" ? fmtYMD(row.course_end) : "";

      formData.training_purpose = row.training_purpose || "";
      formData.course_id = row.course_id ? String(row.course_id) : "";

      formData.dl_code = row.dl_code || "";

      formData.email = row.email || "";
      formData.contact_no = row.contact_no || "";
      formData.address = row.address || "";

      showModal.value = true;
      onCoursePick();
    };

    const closeModal = () => {
      showModal.value = false;
    };

    const openDeleteModal = (row, track) => {
      studentToDelete.value = { ...row, track };
      showDeleteModal.value = true;
    };

    const closeDeleteModal = () => {
      showDeleteModal.value = false;
      studentToDelete.value = null;
    };

    const submitStudent = async () => {
      saving.value = true;
      formError.value = "";
      try {
        const isTesda = formData.track === "tesda";
        const baseUrl = isTesda ? "/api/admin/tesda/students" : "/api/admin/students";

        const payload = {
          full_name: formData.full_name,
          birthdate: formData.birthdate || null,
          sex: formData.sex || null,
          email: formData.email || null,
          source: formData.source,
          status: formData.status,
          course_id: formData.course_id ? Number(formData.course_id) : null,
          course_start: formData.course_start || null,
          course_end: formData.course_end || null,
          training_purpose: formData.training_purpose || null,

          // driving-only (safe)
          client_id: formData.client_id || null,
          dl_code: formData.dl_code || null,
        };

        if (!payload.full_name) {
          formError.value = "Full name is required.";
          return;
        }
        if (!payload.course_id) {
          formError.value = "Course is required.";
          return;
        }

        if (isEditing.value && formData.reservation_id) {
          await apiJson(`${baseUrl}/${formData.reservation_id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else {
          await apiJson(baseUrl, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        closeModal();
        await fetchActiveTabStudents();
      } catch (e) {
        formError.value = e?.message || "Failed to save.";
      } finally {
        saving.value = false;
      }
    };

    const confirmDelete = async () => {
      if (!studentToDelete.value?.reservation_id) return;
      saving.value = true;
      try {
        const isTesda = studentToDelete.value.track === "tesda";
        const baseUrl = isTesda ? "/api/admin/tesda/students" : "/api/admin/students";

        await apiJson(`${baseUrl}/${studentToDelete.value.reservation_id}`, {
          method: "DELETE",
        });

        closeDeleteModal();
        await fetchActiveTabStudents();
      } catch (e) {
        console.error(e);
      } finally {
        saving.value = false;
      }
    };

    onMounted(async () => {
      await fetchCourses();
      await fetchAll();
    });

    return {
      // state
      activeTab,
      drivingStudents,
      tesdaStudents,
      loading,
      saving,

      // filters
      searchQuery,
      selectedStatus,
      selectedSource,
      sortBy,

      // computed rows
      filteredDriving,
      filteredTesda,
      paginatedDriving,
      paginatedTesda,

      // pagination
      pageSize,
      activePage,
      activeTotal,
      activeTotalPages,
      pageRange,
      goPrevPage,
      goNextPage,
      resetActivePage,

      // helpers
      fmtYMD,
      fmtBirth,
      statusPill,
      getTesdaEndDate,
      tesdaEndDateFromStart,

      // courses
      drivingCourses,
      tesdaCourses,
      modalCourses,
      onCoursePick,

      // actions
      debouncedFetch,
      switchTab,
      fetchActiveTabStudents,

      // modals
      showModal,
      showDeleteModal,
      isEditing,
      studentToDelete,
      formData,
      formError,

      openAddModal,
      openEditModal,
      closeModal,
      openDeleteModal,
      closeDeleteModal,
      submitStudent,
      confirmDelete,
    };
  },
};
</script>