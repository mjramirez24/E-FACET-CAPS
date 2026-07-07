<!-- frontend/src/components/admin/AdminUsers.vue -->
<template>
  <AdminLayout>
    <!-- Header -->
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search users (any field)..."
            v-model="searchQuery"
            class="search-input-modern"
            @input="handleSearch"
          />
        </div>
      </div>
    </template>

    <div class="users-wrapper">
      <!-- Page Header -->
      <div class="page-top">
        <div>
          <h2 class="page-title">User Management</h2>
          <p class="page-subtitle">Admins, Instructors, Trainers &amp; Students</p>
        </div>

        <div class="header-btn-group">
          <select
            v-model="roleFilter"
            class="select-modern"
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
            class="select-modern"
            @change="onFilterChange"
          >
            <option value="">All Tracks</option>
            <option value="driving">Driving</option>
            <option value="tesda">TESDA</option>
          </select>

          <button @click="toggleColumnsPanel" class="btn-outline">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            {{ showColumnsPanel ? "Hide Columns" : "Show Columns" }}
          </button>

          <button @click="openAddModal" class="add-btn">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-box">
        <svg class="animate-spin h-6 w-6 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Loading users...
      </div>

      <div v-else class="users-body">
        <!-- Column visibility -->
        <div v-if="showColumnsPanel" class="panel-card columns-panel">
          <div class="panel-header">
            <div>
              <h3 class="panel-title">Column visibility</h3>
              <p class="panel-meta">Toggle columns (table only)</p>
            </div>

            <div class="preset-btns">
              <button class="pg-btn" @click="applyPreset('minimal')">Preset: Minimal</button>
              <button class="pg-btn" @click="applyPreset('all')">Preset: Show all</button>
            </div>
          </div>

          <div class="columns-grid">
            <label v-for="c in allColumns" :key="c.key" class="column-check">
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
        <div class="panel-card">
          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green">
                <tr>
                  <th v-for="c in displayedColumns" :key="c.key">{{ c.label }}</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="u in users" :key="u.id">
                  <td v-for="c in displayedColumns" :key="c.key">
                    <!-- Actions column -->
                    <template v-if="c.key === 'actions'">
                      <div class="action-btns">
                        <button
                          v-if="canToggleDisable(u)"
                          @click="toggleDisable(u)"
                          class="action-toggle"
                          :class="Number(u?.is_disabled || 0) === 1 ? 'action-toggle-enable' : 'action-toggle-disable'"
                        >
                          {{ Number(u?.is_disabled || 0) === 1 ? "Enable" : "Disable" }}
                        </button>

                        <button @click="openEditModal(u)" class="action-edit">Edit</button>
                        <button @click="confirmDelete(u)" class="action-delete">Delete</button>
                      </div>
                    </template>

                    <!-- Role badge -->
                    <template v-else-if="c.key === 'role'">
                      <span class="pill" :class="roleBadge(u.role)">{{ u.role }}</span>
                    </template>

                    <!-- Status badge -->
                    <template v-else-if="c.key === 'status'">
                      <span class="pill" :class="statusBadge(u)">{{ statusLabel(u) }}</span>
                    </template>

                    <!-- Birthday formatted -->
                    <template v-else-if="c.key === 'birthday'">
                      {{ formatBirthday(u.birthday) }}
                    </template>

                    <!-- Track field from API -->
                    <template v-else-if="c.key === 'track'">
                      {{ u.track_code || "—" }}
                    </template>

                    <!-- Normal fields -->
                    <template v-else>
                      {{ u?.[c.key] ?? "—" }}
                    </template>
                  </td>
                </tr>

                <tr v-if="users.length === 0">
                  <td :colspan="displayedColumns.length" class="empty-cell">No users found.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination-bar">
            <span class="page-info">Total: {{ meta.total }} • Page {{ meta.page }} of {{ meta.totalPages }}</span>
            <div class="page-btns">
              <button
                class="pg-btn"
                :class="{ 'pg-disabled': meta.page <= 1 }"
                :disabled="meta.page <= 1"
                @click="goPage(meta.page - 1)"
              >
                ← Prev
              </button>
              <button
                class="pg-btn"
                :class="{ 'pg-disabled': meta.page >= meta.totalPages }"
                :disabled="meta.page >= meta.totalPages"
                @click="goPage(meta.page + 1)"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD/EDIT MODAL -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <transition name="modal-scale">
          <div class="modal-card">
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">{{ isEditing ? "Edit User" : "Add User" }}</h3>
              <button class="modal-close-btn" @click="closeModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div v-if="errorMsg" class="error-box">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ errorMsg }}
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input v-model="form.fullname" class="form-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">Username *</label>
                  <input v-model="form.username" class="form-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input v-model="form.email" type="email" class="form-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">Contact</label>
                  <input v-model="form.contact" class="form-input" />
                </div>

                <!-- Address parts (PH implied) -->
                <div class="form-group md-col-span-2">
                  <label class="form-label">Address (PH implied)</label>

                  <div class="address-grid">
                    <input v-model="addressParts.street" class="form-input" placeholder="Street / Sitio / House No." />
                    <input v-model="addressParts.barangay" class="form-input" placeholder="Barangay" />
                    <input v-model="addressParts.city" class="form-input" placeholder="City / Municipality" />
                    <input v-model="addressParts.province" class="form-input" placeholder="Province" />
                  </div>

                  <p class="address-preview">Preview: <span>{{ composedAddressPreview }}</span></p>
                </div>

                <div class="form-group">
                  <label class="form-label">Civil Status</label>
                  <select v-model="form.civil_status" class="form-input">
                    <option value="">(none)</option>
                    <option value="single">single</option>
                    <option value="married">married</option>
                    <option value="widowed">widowed</option>
                    <option value="separated">separated</option>
                  </select>
                </div>

                <!-- Nationality searchable dropdown -->
                <div class="form-group nationality-wrap" ref="natWrapRef">
                  <label class="form-label">Nationality</label>

                  <input
                    v-model="nationalityQuery"
                    type="text"
                    class="form-input"
                    placeholder="Search nationality (e.g., Filipino)"
                    @focus="openNationality()"
                    @input="onNationalityInput"
                    @keydown.down.prevent="moveNationality(1)"
                    @keydown.up.prevent="moveNationality(-1)"
                    @keydown.enter.prevent="selectHighlightedNationality()"
                    @keydown.esc.prevent="isNationalityOpen = false"
                  />

                  <div v-if="isNationalityOpen && filteredNationalities.length > 0" class="nationality-dropdown">
                    <button
                      v-for="(n, idx) in filteredNationalities"
                      :key="n"
                      type="button"
                      class="nationality-option"
                      :class="{ 'nationality-option-active': idx === nationalityHighlight }"
                      @mousedown.prevent="pickNationality(n)"
                    >
                      {{ n }}
                    </button>
                  </div>

                  <p class="field-hint">Tip: type to filter, Enter to select.</p>
                </div>

                <div class="form-group">
                  <label class="form-label">Role *</label>
                  <select v-model="form.role" class="form-input" @change="handleRoleChange">
                    <option value="admin">admin</option>
                    <option value="instructor">instructor</option>
                    <option value="trainer">trainer</option>
                    <option value="user">user</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Track</label>
                  <select v-model="form.track" class="form-input" :disabled="!needsTrack">
                    <option value="">(none)</option>
                    <option value="driving">driving</option>
                    <option value="tesda">tesda</option>
                  </select>
                  <p v-if="!needsTrack" class="field-hint">Track is only required for user/student.</p>
                </div>

                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <select v-model="form.gender" class="form-input">
                    <option value="">(leave as is)</option>
                    <option value="male">male</option>
                    <option value="female">female</option>
                  </select>
                  <p class="field-hint">Leave blank to keep current gender.</p>
                </div>

                <div class="form-group">
                  <label class="form-label">Birthday</label>
                  <input v-model="form.birthday" type="date" class="form-input" />
                  <p class="field-hint">Leave blank to keep current birthday.</p>
                </div>

                <div class="form-group md-col-span-2">
                  <label class="form-label">Password {{ isEditing ? "(optional – leave blank to keep)" : "*" }}</label>
                  <input v-model="form.password" type="password" class="form-input" />
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn-cancel" @click="closeModal">Cancel</button>
              <button class="btn-save btn-green" :disabled="saving" @click="saveUser">
                {{ saving ? "Saving..." : isEditing ? "Update" : "Create" }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- DELETE MODAL -->
    <transition name="modal-fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head-delete">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Delete Account</h3>
                  <p class="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to delete <span class="font-semibold text-gray-900">{{ toDelete?.fullname }}</span>
                ({{ toDelete?.email }})? All data will be permanently removed.
              </p>
              <div v-if="deleteErrorMsg" class="error-box mt-3">{{ deleteErrorMsg }}</div>
              <div class="mt-6 flex justify-end gap-3">
                <button type="button" @click="cancelDelete" class="btn-cancel">Cancel</button>
                <button type="button" @click="deleteUser" :disabled="deleting" class="btn-save btn-red flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {{ deleting ? "Deleting..." : "Delete" }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- SUCCESS/ERROR NOTIFICATION MODAL -->
      <transition name="modal-fade">
        <div v-if="messageOpen" class="modal-overlay" @click.self="closeMessage">
          <transition name="modal-scale">
            <div class="modal-card modal-card-sm">
              <div class="modal-head-delete">
                <div class="flex items-center gap-3">
                  <div
                    class="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                    :class="messageType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'"
                  >
                    <svg v-if="messageType === 'success'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">{{ messageTitle }}</h3>
                  </div>
                </div>
              </div>
              <div class="modal-body-delete">
                <p class="text-sm text-gray-700 leading-relaxed">{{ messageText }}</p>
                <div class="mt-6 flex justify-end">
                  <button
                    type="button"
                    @click="closeMessage"
                    class="btn-save"
                    :class="messageType === 'success' ? 'btn-green' : 'btn-red'"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import axios from "axios";
import { API_URL } from "../../config/api";
import AdminLayout from "./AdminLayout.vue";

const api = axios.create({
  baseURL: API_URL,
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
    // Success/Error notification modal
    const messageOpen = ref(false);
    const messageTitle = ref("");
    const messageText = ref("");
    const messageType = ref("success"); // 'success' | 'error'

    const showMessage = (title, text, type = "success") => {
      messageTitle.value = title;
      messageText.value = text;
      messageType.value = type;
      messageOpen.value = true;
    };

    const closeMessage = () => {
      messageOpen.value = false;
    };

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
      if (role === "admin") return "pill-purple";
      if (role === "instructor") return "pill-blue";
      if (role === "trainer") return "pill-amber";
      return "pill-green";
    };

    const statusLabel = (u) => (Number(u?.is_disabled || 0) === 1 ? "disabled" : "active");

    const statusBadge = (u) =>
      Number(u?.is_disabled || 0) === 1 ? "pill-red" : "pill-green";

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
          showMessage("Error", msg, "error");
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
          showMessage("Error", err?.response?.data?.message || err.message || "Failed to load user", "error");
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
        showMessage("Changes Saved!", isEditing.value ? "User updated successfully." : "User created successfully.", "success");
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
        const deletedName = toDelete.value?.fullname;
        await api.delete(`/admin/users/${toDelete.value.id}`);
        showDeleteModal.value = false;
        toDelete.value = null;
        await fetchUsers();
        showMessage("User Deleted", `${deletedName} was removed successfully.`, "success");
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
          showMessage("Error", err?.response?.data?.message || err.message || "Failed to update status", "error");
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
      messageOpen, 
      messageTitle, 
      messageText, 
      messageType, 
      showMessage, 
      closeMessage,

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

<style scoped>
/* ========== WRAPPER ========== */
.users-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 16px; }
.page-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.8rem; color: #6b7280; margin: 2px 0 0; }
.users-body { display: flex; flex-direction: column; gap: 16px; }

/* ========== HEADER BUTTONS ========== */
.header-btn-group { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.btn-outline { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 12px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { border-color: #10b981; color: #059669; background: #f9fafb; }
.add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
.add-btn:hover { background: #059669; transform: translateY(-1px); }

/* ========== HEADER SEARCH / FILTERS ========== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; flex-wrap: wrap; }
.search-box { position: relative; flex: 1; min-width: 200px; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }
.select-modern { padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 0.85rem; color: #374151; background: #fff; outline: none; cursor: pointer; }
.select-modern:focus { border-color: #10b981; }

/* ========== LOADING ========== */
.loading-box { padding: 40px; text-align: center; color: #9ca3af; font-size: 0.9rem; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.columns-panel { padding: 20px; overflow: visible; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-meta { font-size: 0.78rem; color: #9ca3af; margin: 2px 0 0; }
.preset-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.columns-grid { display: flex; flex-wrap: wrap; gap: 16px; }
.column-check { display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #374151; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; white-space: normal !important; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }
.pill-purple { background: #ede9fe; color: #7c3aed; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-edit:hover { background: #2563eb; }
.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-delete:hover { background: #dc2626; }
.action-toggle { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-toggle-disable { background: #6b7280; }
.action-toggle-disable:hover { background: #4b5563; }
.action-toggle-enable { background: #10b981; }
.action-toggle-enable:hover { background: #059669; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ========== MODALS ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-card-sm { max-width: 420px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
.modal-head-green { background: #f0fdf4; border-bottom: 1px solid #d1fae5; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; }
.error-box { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; color: #dc2626; font-size: 0.85rem; margin-bottom: 16px; }

/* ========== FORM ========== */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; position: relative; }
.md-col-span-2 { grid-column: span 2; }
.form-label { font-size: 0.75rem; font-weight: 600; color: #374151; }
.form-input { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; color: #111827; }
.form-input:focus { border-color: #10b981; }
.field-hint { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }

/* ========== ADDRESS ========== */
.address-grid { margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.address-preview { margin-top: 8px; font-size: 0.75rem; color: #6b7280; }
.address-preview span { color: #111827; font-weight: 600; }

/* ========== NATIONALITY DROPDOWN ========== */
.nationality-wrap { position: relative; }
.nationality-dropdown { position: absolute; z-index: 20; margin-top: 4px; width: 100%; max-height: 190px; overflow-y: auto; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); top: 100%; }
.nationality-option { display: block; width: 100%; text-align: left; padding: 8px 12px; font-size: 0.85rem; background: transparent; border: none; color: #374151; cursor: pointer; }
.nationality-option:hover, .nationality-option-active { background: #f0fdf4; color: #059669; }

/* ========== BUTTONS (modal footer) ========== */
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.btn-red { background: #ef4444; }
.btn-red:hover:not(:disabled) { background: #dc2626; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ========== MISC ========== */
.flex { display: flex; } .items-center { align-items: center; } .gap-3 { gap: 12px; }
.text-sm { font-size: 0.875rem; } .text-gray-700 { color: #374151; } .font-semibold { font-weight: 600; }
.mt-3 { margin-top: 12px; }

@media (max-width: 640px) {
  .form-grid, .address-grid { grid-template-columns: 1fr; }
  .md-col-span-2 { grid-column: span 1; }
}
</style>