<!-- frontend/src/components/admin/AdminUsers.vue -->
<template>
  <AdminLayout>
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        placeholder="Search users (any field)..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
        @input="handleSearch"
      />

      <select
        v-model="roleFilter"
        class="p-2 rounded-md text-gray-800 border border-gray-300 focus:outline-none"
        @change="onFilterChange"
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="instructor">Instructor</option>
        <option value="trainer">Trainer</option>
        <option value="user">User</option>
      </select>

      <select
        v-model="trackFilter"
        class="p-2 rounded-md text-gray-800 border border-gray-300 focus:outline-none"
        @change="onFilterChange"
      >
        <option value="">All Tracks</option>
        <option value="driving">Driving</option>
        <option value="tesda">TESDA</option>
      </select>
    </template>

    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-green-800">👥 User Management</h2>

        <div class="flex gap-2">
          <button
            @click="toggleColumnsPanel"
            class="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
          >
            {{ showColumnsPanel ? "Hide Columns" : "Show Columns" }}
          </button>

          <button
            @click="openAddModal"
            class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ➕ Add User
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-gray-600">Loading users...</div>

      <div v-else>
        <!-- Column visibility -->
        <div
          v-if="showColumnsPanel"
          class="bg-white border border-gray-200 rounded-xl p-4 mb-4"
        >
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-800">Column visibility</p>
              <p class="text-xs text-gray-500">Toggle columns (table only)</p>
            </div>

            <div class="flex gap-2 flex-wrap">
              <button
                class="px-3 py-1 border rounded-md hover:bg-gray-50 text-xs"
                @click="applyPreset('minimal')"
              >
                Preset: Minimal
              </button>

              <button
                class="px-3 py-1 border rounded-md hover:bg-gray-50 text-xs"
                @click="applyPreset('all')"
              >
                Preset: Show all
              </button>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-4">
            <label
              v-for="c in allColumns"
              :key="c.key"
              class="inline-flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                v-model="visibleCols[c.key]"
                :disabled="c.key === 'actions'"
              />
              <span>{{ c.label }}</span>
            </label>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm border border-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  v-for="c in displayedColumns"
                  :key="c.key"
                  class="p-3 text-left border-b"
                >
                  {{ c.label }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
                <td
                  v-for="c in displayedColumns"
                  :key="c.key"
                  class="p-3 border-b"
                >
                  <!-- Actions column -->
                  <template v-if="c.key === 'actions'">
                    <div class="flex gap-2 flex-wrap">
                      <button
                        v-if="canToggleDisable(u)"
                        @click="toggleDisable(u)"
                        class="px-3 py-1 rounded-md text-white text-xs"
                        :class="Number(u?.is_disabled || 0) === 1 ? 'bg-green-700 hover:bg-green-800' : 'bg-gray-700 hover:bg-gray-800'"
                      >
                        {{ Number(u?.is_disabled || 0) === 1 ? "✅ Enable" : "🚫 Disable" }}
                      </button>

                      <button
                        @click="openEditModal(u)"
                        class="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        @click="confirmDelete(u)"
                        class="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </template>

                  <!-- Role badge -->
                  <template v-else-if="c.key === 'role'">
                    <span
                      class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="roleBadge(u.role)"
                    >
                      {{ u.role }}
                    </span>
                  </template>

                  <!-- Status badge -->
                  <template v-else-if="c.key === 'status'">
                    <span
                      class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="statusBadge(u)"
                    >
                      {{ statusLabel(u) }}
                    </span>
                  </template>

                  <!-- Birthday formatted -->
                  <template v-else-if="c.key === 'birthday'">
                    {{ formatBirthday(u.birthday) }}
                  </template>

                  <!-- Track field from API -->
                  <template v-else-if="c.key === 'track'">
                    {{ u.track_code || "-" }}
                  </template>

                  <!-- Normal fields -->
                  <template v-else>
                    {{ u?.[c.key] ?? "-" }}
                  </template>
                </td>
              </tr>

              <tr v-if="users.length === 0">
                <td :colspan="displayedColumns.length" class="p-5 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4 text-sm text-gray-700">
          <div>
            Total: <span class="font-semibold">{{ meta.total }}</span>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50"
              :disabled="meta.page <= 1"
              @click="goPage(meta.page - 1)"
            >
              Prev
            </button>

            <span>Page {{ meta.page }} / {{ meta.totalPages }}</span>

            <button
              class="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50"
              :disabled="meta.page >= meta.totalPages"
              @click="goPage(meta.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD/EDIT MODAL -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white w-full max-w-xl rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-green-800 mb-4">
          {{ isEditing ? "Edit User" : "Add User" }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-gray-600">Full Name *</label>
            <input v-model="form.fullname" class="w-full p-2 border rounded-md" />
          </div>

          <div>
            <label class="text-xs text-gray-600">Username *</label>
            <input v-model="form.username" class="w-full p-2 border rounded-md" />
          </div>

          <div>
            <label class="text-xs text-gray-600">Email *</label>
            <input v-model="form.email" type="email" class="w-full p-2 border rounded-md" />
          </div>

          <div>
            <label class="text-xs text-gray-600">Contact</label>
            <input v-model="form.contact" class="w-full p-2 border rounded-md" />
          </div>

          <!-- Address parts (PH implied) -->
          <div class="md:col-span-2">
            <label class="text-xs text-gray-600">Address (PH implied)</label>

            <div class="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                v-model="addressParts.street"
                class="w-full p-2 border rounded-md"
                placeholder="Street / Sitio / House No."
              />
              <input
                v-model="addressParts.barangay"
                class="w-full p-2 border rounded-md"
                placeholder="Barangay"
              />
              <input
                v-model="addressParts.city"
                class="w-full p-2 border rounded-md"
                placeholder="City / Municipality"
              />
              <input
                v-model="addressParts.province"
                class="w-full p-2 border rounded-md"
                placeholder="Province"
              />
            </div>

            <p class="mt-2 text-xs text-gray-500">
              Preview: <span class="text-gray-800 font-medium">{{ composedAddressPreview }}</span>
            </p>
          </div>

          <div>
            <label class="text-xs text-gray-600">Civil Status</label>
            <select v-model="form.civil_status" class="w-full p-2 border rounded-md bg-white text-gray-900">
              <option value="">(none)</option>
              <option value="single">single</option>
              <option value="married">married</option>
              <option value="widowed">widowed</option>
              <option value="separated">separated</option>
            </select>
          </div>

          <!-- Nationality searchable dropdown -->
          <div class="relative" ref="natWrapRef">
            <label class="text-xs text-gray-600">Nationality</label>

            <input
              v-model="nationalityQuery"
              type="text"
              class="w-full p-2 border rounded-md"
              placeholder="Search nationality (e.g., Filipino)"
              @focus="openNationality()"
              @input="onNationalityInput"
              @keydown.down.prevent="moveNationality(1)"
              @keydown.up.prevent="moveNationality(-1)"
              @keydown.enter.prevent="selectHighlightedNationality()"
              @keydown.esc.prevent="isNationalityOpen = false"
            />

            <div
              v-if="isNationalityOpen && filteredNationalities.length > 0"
              class="absolute z-[9999] mt-2 w-full max-h-48 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
            >
              <button
                v-for="(n, idx) in filteredNationalities"
                :key="n"
                type="button"
                class="w-full text-left px-3 py-2 text-sm"
                :class="idx === nationalityHighlight ? 'bg-gray-100 text-gray-900' : 'text-gray-800 hover:bg-gray-50'"
                @mousedown.prevent="pickNationality(n)"
              >
                {{ n }}
              </button>
            </div>

            <p class="mt-1 text-[11px] text-gray-500">
              Tip: type to filter, Enter to select.
            </p>
          </div>

          <div>
            <label class="text-xs text-gray-600">Role *</label>
            <select
              v-model="form.role"
              class="w-full p-2 border rounded-md bg-white text-gray-900"
              @change="handleRoleChange"
            >
              <option value="admin">admin</option>
              <option value="instructor">instructor</option>
              <option value="trainer">trainer</option>
              <option value="user">user</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-gray-600">Track</label>
            <select
              v-model="form.track"
              class="w-full p-2 border rounded-md bg-white text-gray-900"
              :disabled="!needsTrack"
            >
              <option value="">(none)</option>
              <option value="driving">driving</option>
              <option value="tesda">tesda</option>
            </select>
            <p v-if="!needsTrack" class="text-xs text-gray-400 mt-1">
              Track is only required for user/student.
            </p>
          </div>

          <div>
            <label class="text-xs text-gray-600">Gender</label>
            <select v-model="form.gender" class="w-full p-2 border rounded-md bg-white text-gray-900">
              <option value="">(leave as is)</option>
              <option value="male">male</option>
              <option value="female">female</option>
            </select>
            <p class="text-xs text-gray-400 mt-1">Leave blank to keep current gender.</p>
          </div>

          <div>
            <label class="text-xs text-gray-600">Birthday</label>
            <input v-model="form.birthday" type="date" class="w-full p-2 border rounded-md" />
            <p class="text-xs text-gray-400 mt-1">Leave blank to keep current birthday.</p>
          </div>

          <div class="md:col-span-2">
            <label class="text-xs text-gray-600">
              Password {{ isEditing ? "(optional – leave blank to keep)" : "*" }}
            </label>
            <input v-model="form.password" type="password" class="w-full p-2 border rounded-md" />
          </div>
        </div>

        <div v-if="errorMsg" class="mt-3 text-sm text-red-600">{{ errorMsg }}</div>

        <div class="flex justify-end gap-2 mt-6">
          <button @click="closeModal" class="px-4 py-2 rounded-md border hover:bg-gray-50">
            Cancel
          </button>
          <button
            @click="saveUser"
            :disabled="saving"
            class="px-4 py-2 rounded-md bg-green-700 hover:bg-green-800 text-white disabled:opacity-50"
          >
            {{ saving ? "Saving..." : isEditing ? "Update" : "Create" }}
          </button>
        </div>
      </div>
    </div>

    <!-- DELETE MODAL -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white w-full max-w-md rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-bold text-red-700 mb-2">Delete Account</h3>
        <p class="text-sm text-gray-700">
          Are you sure you want to delete <b>{{ toDelete?.fullname }}</b> ({{ toDelete?.email }})?
        </p>

        <div v-if="deleteErrorMsg" class="mt-3 text-sm text-red-600">{{ deleteErrorMsg }}</div>

        <div class="flex justify-end gap-2 mt-6">
          <button @click="cancelDelete" class="px-4 py-2 rounded-md border hover:bg-gray-50">
            Cancel
          </button>
          <button
            @click="deleteUser"
            :disabled="deleting"
            class="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {{ deleting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import axios from "axios";
import AdminLayout from "./AdminLayout.vue";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default {
  name: "AdminUsers",
  components: { AdminLayout },
  setup() {
    const users = ref([]);
    const loading = ref(false);

    const searchQuery = ref("");
    const roleFilter = ref("");
    const trackFilter = ref("");

    const meta = ref({ total: 0, page: 1, limit: 20, totalPages: 1 });

    // ✅ default: columns panel hidden
    const showColumnsPanel = ref(false);
    const toggleColumnsPanel = () => (showColumnsPanel.value = !showColumnsPanel.value);

    const allColumns = ref([
      { key: "id", label: "ID" },
      { key: "fullname", label: "Full Name" },
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      { key: "contact", label: "Contact" },
      { key: "gender", label: "Gender" },
      { key: "birthday", label: "Birthday" },
      { key: "address", label: "Address" },
      { key: "civil_status", label: "Civil Status" },
      { key: "nationality", label: "Nationality" },
      { key: "track", label: "Track" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions" },
    ]);

    const visibleCols = ref(
      allColumns.value.reduce((acc, c) => {
        acc[c.key] = true;
        return acc;
      }, {})
    );

    const applyPreset = (name) => {
      for (const c of allColumns.value) visibleCols.value[c.key] = false;

      if (name === "minimal") {
        ["id", "fullname", "email", "role", "status", "actions"].forEach((k) => {
          visibleCols.value[k] = true;
        });
      } else {
        for (const c of allColumns.value) visibleCols.value[c.key] = true;
      }

      visibleCols.value.actions = true;
    };

    // ✅ default preset: minimal
    applyPreset("minimal");

    const displayedColumns = computed(() => {
      return allColumns.value.filter((c) => !!visibleCols.value[c.key]);
    });

    // Modals
    const showModal = ref(false);
    const isEditing = ref(false);
    const saving = ref(false);
    const errorMsg = ref("");

    const showDeleteModal = ref(false);
    const toDelete = ref(null);
    const deleting = ref(false);
    const deleteErrorMsg = ref("");

    // Address parts (modal)
    const addressParts = ref({ street: "", barangay: "", city: "", province: "" });

    const composedAddressPreview = computed(() => {
      const parts = [
        addressParts.value.street?.trim(),
        addressParts.value.barangay?.trim(),
        addressParts.value.city?.trim(),
        addressParts.value.province?.trim(),
      ].filter(Boolean);
      return parts.length ? parts.join(", ") : "—";
    });

    const buildAddressString = () => {
      const parts = [
        addressParts.value.street?.trim(),
        addressParts.value.barangay?.trim(),
        addressParts.value.city?.trim(),
        addressParts.value.province?.trim(),
      ].filter(Boolean);
      return parts.join(", ");
    };

    const fillAddressPartsFromString = (addr) => {
      const s = (addr || "").trim();
      if (!s) {
        addressParts.value = { street: "", barangay: "", city: "", province: "" };
        return;
      }
      const chunks = s.split(",").map((x) => x.trim()).filter(Boolean);
      addressParts.value = {
        street: chunks[0] || "",
        barangay: chunks[1] || "",
        city: chunks[2] || "",
        province: chunks[3] || "",
      };
    };

    // Nationality dropdown
    const nationalities = ref([
      "Filipino","American","British","Canadian","Australian","Chinese","Japanese","Korean",
      "Indian","Malaysian","Singaporean","Indonesian","Thai","Vietnamese","Cambodian","Laotian",
      "Myanmar","Pakistani","Bangladeshi","Sri Lankan","Nepalese","Bhutanese","Afghan","Iranian",
      "Iraqi","Saudi","Emirati","Qatari","Kuwaiti","Omani","Yemeni","Jordanian","Lebanese","Syrian",
      "Turkish","Russian","Ukrainian","Polish","German","French","Spanish",
      "Italian","Portuguese","Dutch","Belgian","Swiss","Austrian","Swedish","Norwegian","Danish",
      "Finnish","Irish","Greek","Romanian","Bulgarian","Hungarian","Czech",
      "Slovak","Croatian","Serbian","Slovenian","Bosnian","Albanian","Macedonian",
      "Brazilian","Argentinian","Chilean","Peruvian","Colombian","Venezuelan","Mexican","Cuban",
      "Dominican","Jamaican","Haitian","South African","Nigerian","Kenyan","Egyptian","Moroccan",
    ]);
    const nationalityQuery = ref("");
    const isNationalityOpen = ref(false);
    const nationalityHighlight = ref(0);
    const natWrapRef = ref(null);

    const filteredNationalities = computed(() => {
      const q = (nationalityQuery.value || "").trim().toLowerCase();
      const list = nationalities.value || [];
      if (!q) return list.slice(0, 12);
      return list.filter((n) => n.toLowerCase().includes(q)).slice(0, 12);
    });

    const openNationality = () => {
      isNationalityOpen.value = true;
      nationalityHighlight.value = 0;
    };
    const onNationalityInput = () => {
      openNationality();
      form.value.nationality = nationalityQuery.value;
    };
    const pickNationality = (n) => {
      nationalityQuery.value = n;
      form.value.nationality = n;
      isNationalityOpen.value = false;
    };
    const moveNationality = (dir) => {
      if (!isNationalityOpen.value) isNationalityOpen.value = true;
      const max = filteredNationalities.value.length - 1;
      if (max < 0) return;
      nationalityHighlight.value = Math.max(
        0,
        Math.min(max, nationalityHighlight.value + dir)
      );
    };
    const selectHighlightedNationality = () => {
      if (!filteredNationalities.value.length) return;
      pickNationality(filteredNationalities.value[nationalityHighlight.value]);
    };

    const onDocMouseDown = (e) => {
      if (!isNationalityOpen.value) return;
      const el = natWrapRef.value;
      if (!el) return;
      if (!el.contains(e.target)) isNationalityOpen.value = false;
    };

    const form = ref({
      id: null,
      fullname: "",
      username: "",
      email: "",
      contact: "",
      address: "",
      civil_status: "",
      nationality: "",
      role: "user",
      track: "driving",
      gender: "",
      birthday: "",
      password: "",
    });

    const needsTrack = computed(() => {
      return form.value.role === "user" || form.value.role === "student";
    });

    const roleBadge = (role) => {
      if (role === "admin") return "bg-purple-100 text-purple-700";
      if (role === "instructor") return "bg-blue-100 text-blue-700";
      if (role === "trainer") return "bg-orange-100 text-orange-700";
      return "bg-green-100 text-green-700";
    };

    const statusLabel = (u) => (Number(u?.is_disabled || 0) === 1 ? "disabled" : "active");

    const statusBadge = (u) =>
      Number(u?.is_disabled || 0) === 1
        ? "bg-red-100 text-red-700"
        : "bg-emerald-100 text-emerald-700";

    const canToggleDisable = (u) => u?.role === "user" || u?.role === "student";

    const formatBirthday = (val) => {
      if (!val) return "-";
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
    };

    const fetchUsers = async () => {
      try {
        loading.value = true;
        const { data } = await api.get("/admin/users", {
          params: {
            search: searchQuery.value, // ✅ backend will search across all fields
            role: roleFilter.value,
            track: trackFilter.value,
            page: meta.value.page,
            limit: meta.value.limit,
          },
        });

        users.value = data?.data || [];
        meta.value = data?.meta || meta.value;
      } catch (err) {
        const data = err?.response?.data;
        const msg =
          (typeof data === "string" ? data : null) ||
          data?.error?.sqlMessage ||
          data?.error?.code ||
          data?.message ||
          err?.message ||
          "Failed to load users";
        alert(msg);
      } finally {
        loading.value = false;
      }
    };

    let searchTimer = null;
    const handleSearch = () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        meta.value.page = 1;
        fetchUsers();
      }, 250);
    };

    const onFilterChange = () => {
      meta.value.page = 1;
      fetchUsers();
    };

    const goPage = (p) => {
      meta.value.page = p;
      fetchUsers();
    };

    const resetForm = () => {
      form.value = {
        id: null,
        fullname: "",
        username: "",
        email: "",
        contact: "",
        address: "",
        civil_status: "",
        nationality: "",
        role: "user",
        track: "driving",
        gender: "",
        birthday: "",
        password: "",
      };
      addressParts.value = { street: "", barangay: "", city: "", province: "" };
      nationalityQuery.value = "";
      isNationalityOpen.value = false;
      nationalityHighlight.value = 0;
      errorMsg.value = "";
    };

    const openAddModal = async () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
      await nextTick();
    };

    const openEditModal = async (u) => {
      try {
        isEditing.value = true;
        errorMsg.value = "";
        form.value.password = "";

        const { data } = await api.get(`/admin/users/${u.id}`);
        const x = data?.data;

        form.value = {
          id: x.id,
          fullname: x.fullname || "",
          username: x.username || "",
          email: x.email || "",
          contact: x.contact || "",
          address: x.address || "",
          civil_status: x.civil_status || "",
          nationality: x.nationality || "",
          role: x.role || "user",
          track: x.track_code || "",
          gender: x.gender || "",
          birthday: x.birthday ? String(x.birthday).slice(0, 10) : "",
          password: "",
        };

        fillAddressPartsFromString(form.value.address);
        nationalityQuery.value = form.value.nationality || "";

        if (!needsTrack.value) form.value.track = "";

        showModal.value = true;
        await nextTick();
      } catch (err) {
        alert(err?.response?.data?.message || err.message || "Failed to load user");
      }
    };

    const closeModal = () => {
      showModal.value = false;
      isNationalityOpen.value = false;
    };

    const handleRoleChange = () => {
      if (!needsTrack.value) form.value.track = "";
      if (needsTrack.value && !form.value.track) form.value.track = "driving";
    };

    const saveUser = async () => {
      try {
        errorMsg.value = "";

        if (!form.value.fullname || !form.value.username || !form.value.email) {
          errorMsg.value = "Fullname, username, and email are required.";
          return;
        }
        if (!isEditing.value && !form.value.password) {
          errorMsg.value = "Password is required when creating a user.";
          return;
        }
        if (needsTrack.value && (form.value.track !== "driving" && form.value.track !== "tesda")) {
          errorMsg.value = "Track is required for user/student (driving or tesda).";
          return;
        }

        saving.value = true;

        const composedAddress = buildAddressString();

        const payload = {
          fullname: form.value.fullname,
          username: form.value.username,
          email: form.value.email,
          contact: form.value.contact,
          address: composedAddress,
          civil_status: form.value.civil_status,
          nationality: form.value.nationality,
          role: form.value.role,
          track: needsTrack.value ? form.value.track : "",
          gender: form.value.gender,
          birthday: form.value.birthday,
          password: form.value.password,
        };

        if (isEditing.value) {
          await api.put(`/admin/users/${form.value.id}`, payload);
        } else {
          await api.post("/admin/users", payload);
        }

        showModal.value = false;
        await fetchUsers();
      } catch (err) {
        errorMsg.value = err?.response?.data?.message || err.message || "Failed to save user";
      } finally {
        saving.value = false;
      }
    };

    const confirmDelete = (u) => {
      toDelete.value = u;
      deleteErrorMsg.value = "";
      showDeleteModal.value = true;
    };

    const cancelDelete = () => {
      showDeleteModal.value = false;
      toDelete.value = null;
      deleteErrorMsg.value = "";
    };

    const deleteUser = async () => {
      try {
        deleting.value = true;
        deleteErrorMsg.value = "";
        await api.delete(`/admin/users/${toDelete.value.id}`);
        showDeleteModal.value = false;
        toDelete.value = null;
        await fetchUsers();
      } catch (err) {
        deleteErrorMsg.value = err?.response?.data?.message || err.message || "Failed to delete user";
      } finally {
        deleting.value = false;
      }
    };

    const toggleDisable = async (u) => {
      try {
        const currentlyDisabled = Number(u?.is_disabled || 0) === 1;

        const ok = confirm(
          currentlyDisabled
            ? `Enable ${u.fullname}? They will be able to login again.`
            : `Disable ${u.fullname}? They will NOT be able to login.`
        );
        if (!ok) return;

        if (currentlyDisabled) await api.put(`/admin/users/${u.id}/enable`);
        else await api.put(`/admin/users/${u.id}/disable`);

        await fetchUsers();
      } catch (err) {
        alert(err?.response?.data?.message || err.message || "Failed to update status");
      }
    };

    onMounted(() => {
      fetchUsers();
      document.addEventListener("mousedown", onDocMouseDown, true);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("mousedown", onDocMouseDown, true);
    });

    return {
      users,
      loading,
      searchQuery,
      roleFilter,
      trackFilter,
      meta,
      goPage,
      handleSearch,
      onFilterChange,

      // columns
      showColumnsPanel,
      toggleColumnsPanel,
      allColumns,
      visibleCols,
      displayedColumns,
      applyPreset,

      // modal
      showModal,
      isEditing,
      saving,
      errorMsg,
      form,
      needsTrack,
      roleBadge,
      statusLabel,
      statusBadge,
      canToggleDisable,
      toggleDisable,
      formatBirthday,
      openAddModal,
      openEditModal,
      closeModal,
      handleRoleChange,
      saveUser,

      // delete modal
      showDeleteModal,
      toDelete,
      deleting,
      deleteErrorMsg,
      confirmDelete,
      cancelDelete,
      deleteUser,

      // address + nationality
      addressParts,
      composedAddressPreview,
      natWrapRef,
      nationalityQuery,
      isNationalityOpen,
      nationalityHighlight,
      filteredNationalities,
      openNationality,
      onNationalityInput,
      pickNationality,
      moveNationality,
      selectHighlightedNationality,
    };
  },
};
</script>