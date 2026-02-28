<template>
  <AdminLayout>
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        :placeholder="activeTab === 'driving' ? 'Search driving student...' : 'Search TESDA student...'"
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
        @input="debouncedFetch()"
      />
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-lg font-bold text-green-800">👨‍🎓 Students Management</h2>
          <p class="text-xs text-gray-500 mt-1">Sections: Driving / TESDA • Source: Online + Walk-in</p>
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
          :class="activeTab === 'driving' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
          @click="switchTab('driving')"
        >
          🚗 Driving
        </button>
        <button
          class="px-4 py-2 rounded-md font-medium text-sm"
          :class="activeTab === 'tesda' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
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
            class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            @change="fetchActiveTabStudents()"
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
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            @change="fetchActiveTabStudents()"
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
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="full_name">Full Name</option>
            <option value="client_id">Client ID</option>
            <option value="course_start">Course Start</option>
            <option value="course_end">Course End</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <div v-if="loading" class="p-6 text-center text-gray-500">Loading students...</div>

        <!-- DRIVING TABLE -->
        <table v-else-if="activeTab === 'driving'" class="w-full text-xs md:text-sm">
          <thead class="bg-green-50 text-green-900">
            <tr>
              <th class="text-left p-3 w-12">No.</th>
              <th class="text-left p-3">Client ID</th>
              <th class="text-left p-3">Full Name</th>
              <th class="text-left p-3">Birthdate <span class="text-[10px]">(MM/DD/YY)</span></th>
              <th class="text-left p-3">Sex <span class="text-[10px]">(M/F)</span></th>
              <th class="text-left p-3">Instructor Name</th>
              <th class="text-left p-3">Course Start</th>
              <th class="text-left p-3">Course End</th>
              <th class="text-left p-3">DL CODE</th>
              <th class="text-left p-3">Training Purpose</th>
              <th class="text-left p-3">Source</th>
              <th class="text-left p-3">Status</th>
              <th class="text-right p-3 w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(s, idx) in filteredDriving"
              :key="s.reservation_id"
              class="border-t border-gray-100 hover:bg-gray-50"
            >
              <td class="p-3">{{ idx + 1 }}</td>
              <td class="p-3 font-medium text-gray-800">{{ s.client_id || "—" }}</td>
              <td class="p-3 text-gray-900 font-medium">{{ s.full_name || "—" }}</td>
              <td class="p-3 text-gray-700">{{ fmtBirth(s.birthdate) }}</td>
              <td class="p-3 text-gray-700">{{ s.sex || "—" }}</td>
              <td class="p-3 text-gray-700">{{ s.instructor_name || "—" }}</td>
              <td class="p-3 text-gray-700">{{ fmtYMD(s.course_start) }}</td>
              <td class="p-3 text-gray-700">{{ fmtYMD(s.course_end) }}</td>
              <td class="p-3 text-gray-700">{{ s.dl_code || "—" }}</td>
              <td class="p-3 text-gray-700">{{ s.training_purpose || "—" }}</td>

              <td class="p-3">
                <span
                  class="px-2 py-1 rounded-full text-[11px] font-semibold"
                  :class="(s.source || 'online') === 'walkin'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-indigo-100 text-indigo-800'"
                >
                  {{ s.source || "online" }}
                </span>
              </td>

              <td class="p-3">
                <span
                  class="px-2 py-1 rounded-full text-[11px] font-semibold"
                  :class="statusPill(s.status)"
                >
                  {{ s.status || "—" }}
                </span>
              </td>

              <td class="p-3 text-right">
                <button
                  @click="openEditModal(s, 'driving')"
                  class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 mr-2"
                >
                  Edit
                </button>
                <button
                  @click="openDeleteModal(s)"
                  class="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!filteredDriving.length">
              <td colspan="13" class="p-6 text-center text-gray-500">No driving students found.</td>
            </tr>
          </tbody>
        </table>

        <!-- TESDA TABLE -->
        <table v-else class="w-full text-xs md:text-sm">
          <thead class="bg-blue-50 text-blue-900">
            <tr>
              <th class="text-left p-3 w-12">No.</th>
              <th class="text-left p-3">Client ID</th>
              <th class="text-left p-3">Full Name</th>
              <th class="text-left p-3">Birthdate <span class="text-[10px]">(MM/DD/YY)</span></th>
              <th class="text-left p-3">Sex <span class="text-[10px]">(M/F)</span></th>
              <th class="text-left p-3">Trainer / Instructor</th>
              <th class="text-left p-3">Course / Qualification</th>
              <th class="text-left p-3">Course Start</th>
              <th class="text-left p-3">Course End</th>
              <th class="text-left p-3">Training Purpose</th>
              <th class="text-left p-3">Source</th>
              <th class="text-left p-3">Status</th>
              <th class="text-right p-3 w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(s, idx) in filteredTesda"
              :key="s.reservation_id"
              class="border-t border-gray-100 hover:bg-gray-50"
            >
              <td class="p-3">{{ idx + 1 }}</td>
              <td class="p-3 font-medium text-gray-800">{{ s.client_id || "—" }}</td>
              <td class="p-3 text-gray-900 font-medium">{{ s.full_name || "—" }}</td>
              <td class="p-3 text-gray-700">{{ fmtBirth(s.birthdate) }}</td>
              <td class="p-3 text-gray-700">{{ s.sex || "—" }}</td>
              <td class="p-3 text-gray-700">{{ s.instructor_name || "—" }}</td>
              <td class="p-3 text-gray-700">{{ s.course_name || "—" }}</td>
              <td class="p-3 text-gray-700">{{ fmtYMD(s.course_start) }}</td>
              <td class="p-3 text-gray-700">{{ fmtYMD(s.course_end) }}</td>
              <td class="p-3 text-gray-700">{{ s.training_purpose || "—" }}</td>

              <td class="p-3">
                <span
                  class="px-2 py-1 rounded-full text-[11px] font-semibold"
                  :class="(s.source || 'online') === 'walkin'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-indigo-100 text-indigo-800'"
                >
                  {{ s.source || "online" }}
                </span>
              </td>

              <td class="p-3">
                <span
                  class="px-2 py-1 rounded-full text-[11px] font-semibold"
                  :class="statusPill(s.status)"
                >
                  {{ s.status || "—" }}
                </span>
              </td>

              <td class="p-3 text-right">
                <button
                  @click="openEditModal(s, 'tesda')"
                  class="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 mr-2"
                >
                  Edit
                </button>
                <button
                  @click="openDeleteModal(s)"
                  class="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!filteredTesda.length">
              <td colspan="13" class="p-6 text-center text-gray-500">No TESDA students found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-800">
              {{ isEditing ? "Edit Student" : "Add Student" }}
              <span
                class="text-sm font-semibold ml-2"
                :class="formData.track === 'tesda' ? 'text-blue-700' : 'text-green-700'"
              >
                ({{ formData.track.toUpperCase() }})
              </span>
            </h3>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-800">✖</button>
          </div>

          <div v-if="formError" class="mb-3 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {{ formError }}
          </div>

          <!-- Track selector -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Section</label>
              <select
                v-model="formData.track"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                @change="onTrackChange()"
              >
                <option value="driving">Driving</option>
                <option value="tesda">TESDA</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Source</label>
              <select
                v-model="formData.source"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="online">online</option>
                <option value="walkin">walkin</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Status</label>
              <select
                v-model="formData.status"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
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
          </div>

          <!-- Fields -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Client ID</label>
              <input
                v-model="formData.client_id"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="e.g. 12345"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm text-gray-700 mb-1">Full Name</label>
              <input
                v-model="formData.full_name"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Last, First Middle"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Birthdate</label>
              <input
                v-model="formData.birthdate"
                type="date"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Sex (M/F)</label>
              <select
                v-model="formData.sex"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">—</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">
                {{ formData.track === "tesda" ? "Trainer / Instructor" : "Instructor Name" }}
              </label>
              <input
                v-model="formData.instructor_name"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Instructor/Trainer"
              />
            </div>

            <!-- ✅ Course Picker (BOTH tracks) -->
            <div class="md:col-span-3">
              <label class="block text-sm text-gray-700 mb-1">
                {{ formData.track === "tesda" ? "Course / Qualification (Pick from Courses)" : "Driving Course (Pick DL Type)" }}
              </label>
              <select
                v-model="formData.course_id"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                @change="onCoursePick()"
              >
                <option value="">— Select Course —</option>
                <option
                  v-for="c in modalCourses"
                  :key="c.id"
                  :value="String(c.id)"
                >
                  {{ c.course_name }} <span v-if="c.course_code">({{ c.course_code }})</span>
                </option>
              </select>

              <p class="text-[11px] text-gray-500 mt-1">
                This will send <b>course_id</b> to backend (recommended). No more manual course typing.
              </p>
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Course Start</label>
              <input
                v-model="formData.course_start"
                type="date"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Course End</label>
              <input
                v-model="formData.course_end"
                type="date"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <!-- Driving-only: DL Code (auto derived from chosen course_code like PDC-A) -->
            <div v-if="formData.track === 'driving'">
              <label class="block text-sm text-gray-700 mb-1">DL Code</label>
              <input
                v-model="formData.dl_code"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="A / B / AB"
              />
              <p class="text-[11px] text-gray-500 mt-1">
                Auto-filled when you pick PDC course (PDC-A => A). You can override if needed.
              </p>
            </div>

            <!-- TESDA-only: Course Name (optional fallback) -->
            <div v-else class="md:col-span-2">
              <label class="block text-sm text-gray-700 mb-1">Course Name (optional fallback)</label>
              <input
                v-model="formData.course_name"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="(optional) only if you didn't pick course_id"
              />
            </div>

            <div class="md:col-span-3">
              <label class="block text-sm text-gray-700 mb-1">Training Purpose</label>
              <input
                v-model="formData.training_purpose"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Purpose"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Email (optional)</label>
              <input
                v-model="formData.email"
                type="email"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="email@domain.com"
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Contact No. (optional)</label>
              <input
                v-model="formData.contact_no"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="09xx..."
              />
            </div>

            <div>
              <label class="block text-sm text-gray-700 mb-1">Address (optional)</label>
              <input
                v-model="formData.address"
                type="text"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Address"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="closeModal"
              class="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>

            <button
              @click="submitStudent"
              class="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm"
              :disabled="saving"
            >
              {{ saving ? "Saving..." : (isEditing ? "Save Changes" : "Add Student") }}
            </button>
          </div>

          <p class="text-[11px] text-gray-500 mt-3">
            This page writes into <b>users</b> + <b>schedule_reservations</b> so updates reflect in Reports (Detailed).
          </p>
        </div>
      </div>

      <!-- Delete Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-2">Delete Student</h3>
          <p class="text-sm text-gray-600">
            Are you sure you want to delete <b>{{ studentToDelete?.full_name }}</b>?
          </p>

          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="closeDeleteModal"
              class="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>

            <button
              @click="confirmDelete"
              class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
              :disabled="saving"
            >
              {{ saving ? "Deleting..." : "Delete" }}
            </button>
          </div>

          <p class="text-[11px] text-gray-500 mt-3">
            This cancels the <b>schedule_reservations</b> row. User record remains.
          </p>
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
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
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
  name: "AdminStudentsDetailed",
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

    // ✅ courses
    const drivingCourses = ref([]); // [{id, course_name, course_code}]
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

      // ✅ course selection
      course_id: "",

      // fallbacks
      dl_code: "",
      course_name: "",

      email: "",
      contact_no: "",
      address: "",
    });

    const fmtYMD = (d) => {
      if (!d) return "—";
      const s = String(d);
      return s.includes("T") ? s.split("T")[0] : s;
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

    // ✅ load courses (needs backend endpoint)
    const fetchCourses = async () => {
      try {
        const d = await apiJson(`/api/admin/courses?track=driving`);
        const t = await apiJson(`/api/admin/courses?track=tesda`);
        drivingCourses.value = Array.isArray(d.data) ? d.data : [];
        tesdaCourses.value = Array.isArray(t.data) ? t.data : [];
      } catch (e) {
        // don’t block UI; just keep empty list
        drivingCourses.value = [];
        tesdaCourses.value = [];
        console.warn("fetchCourses failed:", e?.message || e);
      }
    };

    const modalCourses = computed(() => {
      return formData.track === "tesda" ? tesdaCourses.value : drivingCourses.value;
    });

    const findCourseById = (id) => {
      const all = formData.track === "tesda" ? tesdaCourses.value : drivingCourses.value;
      return all.find((c) => String(c.id) === String(id)) || null;
    };

    const deriveDlFromCourseCode = (course_code) => {
      const code = String(course_code || "").toUpperCase();
      // PDC-A / PDC-B / PDC-AB
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
        // TESDA: optional fallback mirror (not required)
        if (!formData.course_name) formData.course_name = c.course_name || "";
      }
    };

    const onTrackChange = () => {
      // reset course fields when switching track in modal
      formData.course_id = "";
      formData.dl_code = "";
      formData.course_name = "";
    };

    // -------- API
    const fetchStudents = async (track) => {
      const params = new URLSearchParams({
        track,
        q: searchQuery.value || "",
        source: selectedSource.value || "all",
        status: selectedStatus.value || "all",
        page: "1",
        limit: "200",
      });

      const json = await apiJson(`/api/admin/students?${params.toString()}`);
      const rows = Array.isArray(json.data) ? json.data : [];

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

    let tmr = null;
    const debouncedFetch = () => {
      clearTimeout(tmr);
      tmr = setTimeout(() => fetchActiveTabStudents(), 250);
    };

    const switchTab = (tab) => {
      activeTab.value = tab;
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
            s.training_purpose,
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

    watch(sortBy, () => {});

    // -------- modals
    const resetForm = () => {
      formError.value = "";
      formData.reservation_id = null;
      formData.student_id = null;
      formData.schedule_id = null;

      formData.track = activeTab.value;
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
      formData.course_name = "";

      formData.email = "";
      formData.contact_no = "";
      formData.address = "";
    };

    const openAddModal = () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
    };

    const openEditModal = (s, track) => {
      isEditing.value = true;
      formError.value = "";

      formData.reservation_id = s.reservation_id;
      formData.student_id = s.student_id;
      formData.schedule_id = s.schedule_id;

      formData.track = track || activeTab.value;
      formData.source = s.source || "online";
      formData.status = (s.status || "confirmed").toLowerCase();

      formData.client_id = s.client_id || "";
      formData.full_name = s.full_name || "";
      formData.birthdate = fmtYMD(s.birthdate);
      formData.sex = s.sex || "";
      formData.instructor_name = s.instructor_name || "";
      formData.course_start = fmtYMD(s.course_start);
      formData.course_end = fmtYMD(s.course_end);
      formData.training_purpose = s.training_purpose || "";

      formData.course_id = s.course_id ? String(s.course_id) : "";

      formData.dl_code = s.dl_code || "";
      formData.course_name = s.course_name || "";

      formData.email = s.email || "";
      formData.contact_no = s.contact_no || "";
      formData.address = s.address || "";

      showModal.value = true;
    };

    const closeModal = () => (showModal.value = false);

    const openDeleteModal = (s) => {
      studentToDelete.value = s;
      showDeleteModal.value = true;
    };

    const closeDeleteModal = () => {
      studentToDelete.value = null;
      showDeleteModal.value = false;
    };

    // -------- actions
    const submitStudent = async () => {
      formError.value = "";

      if (!String(formData.full_name || "").trim()) {
        formError.value = "Full Name is required.";
        return;
      }

      // ✅ course required now
      if (!String(formData.course_id || "").trim()) {
        formError.value = "Please select a Course.";
        return;
      }

      const payload = {
        track: formData.track,
        source: formData.source,
        status: formData.status,

        full_name: formData.full_name,
        email: formData.email || null,
        birthdate: formData.birthdate || null,
        sex: formData.sex || null,

        client_id: formData.client_id || null,
        training_purpose: formData.training_purpose || null,

        schedule_id: formData.schedule_id || null,

        // ✅ IMPORTANT: send course_id always
        course_id: Number(formData.course_id),

        instructor_name: formData.instructor_name || null,
        course_start: formData.course_start || null,
        course_end: formData.course_end || null,

        dl_code: formData.track === "driving" ? (formData.dl_code || null) : null,
        course_name: formData.track === "tesda" ? (formData.course_name || null) : null,
      };

      saving.value = true;
      try {
        if (isEditing.value && formData.reservation_id) {
          await apiJson(`/api/admin/students/${formData.reservation_id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        } else {
          await apiJson(`/api/admin/students`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        closeModal();
        await fetchAll();
      } catch (e) {
        formError.value = e?.message || "Save failed.";
      } finally {
        saving.value = false;
      }
    };

    const confirmDelete = async () => {
      if (!studentToDelete.value?.reservation_id) return;
      saving.value = true;
      try {
        await apiJson(`/api/admin/students/${studentToDelete.value.reservation_id}`, {
          method: "DELETE",
        });
        closeDeleteModal();
        await fetchAll();
      } catch (e) {
        alert(e?.message || "Delete failed.");
      } finally {
        saving.value = false;
      }
    };

    onMounted(async () => {
      await fetchCourses(); // ✅ load courses first
      await fetchAll();
    });

    return {
      activeTab,
      drivingStudents,
      tesdaStudents,
      loading,
      saving,

      searchQuery,
      selectedStatus,
      selectedSource,
      sortBy,

      filteredDriving,
      filteredTesda,

      fmtYMD,
      fmtBirth,
      statusPill,

      debouncedFetch,
      switchTab,
      fetchActiveTabStudents,

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

      // ✅ course picker helpers
      drivingCourses,
      tesdaCourses,
      modalCourses,
      onCoursePick,
      onTrackChange,
    };
  },
};
</script>