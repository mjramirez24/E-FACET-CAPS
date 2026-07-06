<template>
  <AdminLayout>
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          :placeholder="activeTab === 'instructors' ? 'Search instructors...' : 'Search trainers...'"
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div>
      <!-- Page Header -->
      <div class="page-header-row">
        <div>
          <h2 class="page-title">Instructors Management</h2>
          <p class="page-subtitle">Manage driving course instructors and TESDA trainers</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-group mb-5">
        <button @click="activeTab = 'instructors'" :class="['tab-btn', activeTab === 'instructors' ? 'tab-active-green' : 'tab-inactive']">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Instructor Management
        </button>
        <button @click="activeTab = 'trainers'" :class="['tab-btn', activeTab === 'trainers' ? 'tab-active-blue' : 'tab-inactive']">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Trainer Management
        </button>
      </div>

      <!-- INSTRUCTORS TAB -->
      <div v-if="activeTab === 'instructors'">
        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          <p class="text-gray-500">Loading instructors...</p>
        </div>

        <div v-else class="panel-card">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Showing {{ filteredInstructors.length }} of {{ instructors.length }} instructors</span>
            <select v-model="statusFilter" class="select-modern-sm">
              <option value="">All Status</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green"><tr><th>Code</th><th>Name</th><th>Email</th><th>Contact</th><th>Specialization</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="i in filteredInstructors" :key="i.instructor_id">
                  <td class="font-medium">{{ i.instructor_code }}</td>
                  <td><div class="font-medium">{{ i.fullname || (i.firstname + ' ' + i.lastname) }}</div></td>
                  <td>{{ i.email || '—' }}</td>
                  <td>{{ i.contact_number || '—' }}</td>
                  <td>{{ i.specialization || '—' }}</td>
                  <td><span :class="i.status === 'active' ? 'pill pill-green' : 'pill pill-gray'">{{ i.status }}</span></td>
                  <td><div class="action-btns"><button class="action-edit" @click="editInstructor(i)">Edit</button><button class="action-delete" @click="confirmDelete(i)">Delete</button></div></td>
                </tr>
                <tr v-if="filteredInstructors.length === 0"><td colspan="7" class="empty-cell">No instructors found</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add/Edit Instructor Modal -->
        <transition name="modal-fade"><div v-if="showModal" class="modal-overlay" @click.self="closeModal"><transition name="modal-scale"><div class="modal-card"><div class="modal-head modal-head-green"><h3 class="modal-title">{{ isEditing ? 'Edit Instructor' : 'Add New Instructor' }}</h3><button class="modal-close-btn" @click="closeModal"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
          <div class="modal-body"><form @submit.prevent="saveInstructor"><div class="form-grid">
            <div class="form-group"><label class="form-label">Instructor Code *</label><input v-model="form.instructor_code" required class="form-input" /></div>
            <div class="form-group"><label class="form-label">Status</label><select v-model="form.status" class="form-input"><option value="active">active</option><option value="inactive">inactive</option></select></div>
            <div class="form-group"><label class="form-label">First Name *</label><input v-model="form.firstname" required class="form-input" /></div>
            <div class="form-group"><label class="form-label">Last Name *</label><input v-model="form.lastname" required class="form-input" /></div>
            <div class="form-group md-col-span-2"><label class="form-label">Email (optional)</label><input type="email" v-model="form.email" class="form-input" /></div>
            <div class="form-group md-col-span-2"><label class="form-label">Contact Number (optional)</label><input v-model="form.contact_number" class="form-input" /></div>
            <div class="form-group md-col-span-2"><label class="form-label">Specialization (optional)</label><input v-model="form.specialization" class="form-input" /></div>
          </div>
          <div class="modal-foot"><button type="button" @click="closeModal" class="btn-cancel">Cancel</button><button type="submit" :disabled="saving" class="btn-save btn-green">{{ saving ? 'Saving...' : (isEditing ? 'Update' : 'Save Instructor') }}</button></div></form></div></div></transition></div></transition>

        <!-- Delete Instructor Modal -->
        <transition name="modal-fade"><div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete"><transition name="modal-scale"><div class="modal-card modal-card-sm">
          <div class="modal-head-delete"><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div><div><h3 class="text-lg font-bold text-gray-900">Delete Instructor</h3><p class="text-sm text-gray-500">This action cannot be undone</p></div></div></div>
          <div class="modal-body-delete"><p class="text-sm text-gray-700 leading-relaxed">Are you sure you want to delete <span class="font-semibold text-gray-900">{{ toDelete?.fullname || (toDelete?.firstname + ' ' + toDelete?.lastname) }}</span>? All data will be permanently removed.</p>
          <div class="mt-6 flex justify-end gap-3"><button type="button" @click="cancelDelete" class="btn-cancel">Cancel</button><button type="button" @click="deleteInstructor" :disabled="deleting" class="btn-save btn-red flex items-center gap-2"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>{{ deleting ? 'Deleting...' : 'Delete' }}</button></div></div>
        </div></transition></div></transition>
      </div>

      <!-- TRAINERS TAB -->
      <div v-else-if="activeTab === 'trainers'">
        <div v-if="loadingTrainers" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          <p class="text-gray-500">Loading trainers...</p>
        </div>

        <div v-else class="panel-card">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Showing {{ filteredTrainers.length }} of {{ trainers.length }} trainers</span>
            <select v-model="trainerStatusFilter" class="select-modern-sm">
              <option value="">All Status</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-blue"><tr><th>Code</th><th>Name</th><th>Email</th><th>Contact</th><th>Specialization</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="t in filteredTrainers" :key="t.trainer_id">
                  <td class="font-medium">{{ t.trainer_code }}</td>
                  <td><div class="font-medium">{{ t.fullname || (t.firstname + ' ' + t.lastname) }}</div></td>
                  <td>{{ t.email || '—' }}</td>
                  <td>{{ t.contact_number || '—' }}</td>
                  <td>{{ t.specialization || '—' }}</td>
                  <td><span :class="t.status === 'active' ? 'pill pill-green' : 'pill pill-gray'">{{ t.status }}</span></td>
                  <td><div class="action-btns"><button class="action-edit" @click="editTrainer(t)">Edit</button><button class="action-delete" @click="confirmDeleteTrainer(t)">Delete</button></div></td>
                </tr>
                <tr v-if="filteredTrainers.length === 0"><td colspan="7" class="empty-cell">No trainers found</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add/Edit Trainer Modal -->
        <transition name="modal-fade"><div v-if="showTrainerModal" class="modal-overlay" @click.self="closeTrainerModal"><transition name="modal-scale"><div class="modal-card"><div class="modal-head modal-head-blue"><h3 class="modal-title">{{ isEditingTrainer ? 'Edit Trainer' : 'Add New Trainer' }}</h3><button class="modal-close-btn" @click="closeTrainerModal"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div>
          <div class="modal-body"><form @submit.prevent="saveTrainer"><div class="form-grid">
            <div class="form-group"><label class="form-label">Trainer Code *</label><input v-model="trainerForm.trainer_code" required class="form-input" /></div>
            <div class="form-group"><label class="form-label">Status</label><select v-model="trainerForm.status" class="form-input"><option value="active">active</option><option value="inactive">inactive</option></select></div>
            <div class="form-group"><label class="form-label">First Name *</label><input v-model="trainerForm.firstname" required class="form-input" /></div>
            <div class="form-group"><label class="form-label">Last Name *</label><input v-model="trainerForm.lastname" required class="form-input" /></div>
            <div class="form-group md-col-span-2"><label class="form-label">Email (optional)</label><input type="email" v-model="trainerForm.email" class="form-input" /></div>
            <div class="form-group md-col-span-2"><label class="form-label">Contact Number (optional)</label><input v-model="trainerForm.contact_number" class="form-input" /></div>
            <div class="form-group md-col-span-2"><label class="form-label">Specialization (optional)</label><input v-model="trainerForm.specialization" class="form-input" /></div>
          </div>
          <div class="modal-foot"><button type="button" @click="closeTrainerModal" class="btn-cancel">Cancel</button><button type="submit" :disabled="savingTrainer" class="btn-save btn-blue">{{ savingTrainer ? 'Saving...' : (isEditingTrainer ? 'Update' : 'Save Trainer') }}</button></div></form></div></div></transition></div></transition>

        <!-- Delete Trainer Modal -->
        <transition name="modal-fade"><div v-if="showTrainerDeleteModal" class="modal-overlay" @click.self="cancelDeleteTrainer"><transition name="modal-scale"><div class="modal-card modal-card-sm">
          <div class="modal-head-delete"><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div><div><h3 class="text-lg font-bold text-gray-900">Delete Trainer</h3><p class="text-sm text-gray-500">This action cannot be undone</p></div></div></div>
          <div class="modal-body-delete"><p class="text-sm text-gray-700 leading-relaxed">Are you sure you want to delete <span class="font-semibold text-gray-900">{{ trainerToDelete?.fullname || (trainerToDelete?.firstname + ' ' + trainerToDelete?.lastname) }}</span>? All data will be permanently removed.</p>
          <div class="mt-6 flex justify-end gap-3"><button type="button" @click="cancelDeleteTrainer" class="btn-cancel">Cancel</button><button type="button" @click="deleteTrainer" :disabled="deletingTrainer" class="btn-save btn-red flex items-center gap-2"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>{{ deletingTrainer ? 'Deleting...' : 'Delete' }}</button></div></div>
        </div></transition></div></transition>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, reactive, onMounted } from "vue";
import axios from "axios";
import AdminLayout from "./AdminLayout.vue";
import { API_URL } from "../../config/api";

const api = axios.create({ baseURL: API_URL, withCredentials: true });

export default {
  name: "AdminInstructorTrainer",
  components: { AdminLayout },
  setup() {
    const activeTab = ref("instructors");
    const searchQuery = ref("");

    // INSTRUCTORS
    const instructors = ref([]);
    const loading = ref(true);
    const statusFilter = ref("");
    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const isEditing = ref(false);
    const toDelete = ref(null);
    const saving = ref(false);
    const deleting = ref(false);
    const form = reactive({ instructor_id: null, instructor_code: "", firstname: "", lastname: "", email: "", contact_number: "", specialization: "", status: "active" });

    const fetchInstructors = async () => { loading.value = true; try { const res = await api.get("/admin/instructors"); instructors.value = Array.isArray(res.data?.data) ? res.data.data : []; } catch (err) { console.error("fetchInstructors error:", err); alert(err?.response?.data?.message || err.message || "Failed to fetch instructors"); instructors.value = []; } finally { loading.value = false; } };
    const filteredInstructors = computed(() => { let r = [...instructors.value]; if (searchQuery.value.trim()) { const q = searchQuery.value.toLowerCase(); r = r.filter((i) => String(i.instructor_code || "").toLowerCase().includes(q) || String(i.firstname || "").toLowerCase().includes(q) || String(i.lastname || "").toLowerCase().includes(q) || String(i.fullname || "").toLowerCase().includes(q) || String(i.email || "").toLowerCase().includes(q) || String(i.specialization || "").toLowerCase().includes(q)); } if (statusFilter.value) { r = r.filter((i) => (i.status || "") === statusFilter.value); } return r; });
    const resetForm = () => { form.instructor_id = null; form.instructor_code = ""; form.firstname = ""; form.lastname = ""; form.email = ""; form.contact_number = ""; form.specialization = ""; form.status = "active"; };
    const editInstructor = (i) => { isEditing.value = true; form.instructor_id = i.instructor_id; form.instructor_code = i.instructor_code || ""; form.firstname = i.firstname || ""; form.lastname = i.lastname || ""; form.email = i.email || ""; form.contact_number = i.contact_number || ""; form.specialization = i.specialization || ""; form.status = i.status || "active"; showModal.value = true; };
    const closeModal = () => { showModal.value = false; resetForm(); };
    const saveInstructor = async () => { if (saving.value) return; saving.value = true; try { const payload = { instructor_code: form.instructor_code, firstname: form.firstname, lastname: form.lastname, email: form.email || null, contact_number: form.contact_number || null, specialization: form.specialization || null, status: form.status }; if (isEditing.value && form.instructor_id) { await api.put(`/admin/instructors/${form.instructor_id}`, payload); } else { await api.post(`/admin/instructors`, payload); } await fetchInstructors(); closeModal(); } catch (err) { console.error("saveInstructor error:", err); alert(err?.response?.data?.message || err.message || "Failed to save instructor"); } finally { saving.value = false; } };
    const confirmDelete = (i) => { toDelete.value = i; showDeleteModal.value = true; };
    const cancelDelete = () => { toDelete.value = null; showDeleteModal.value = false; };
    const deleteInstructor = async () => { if (!toDelete.value || deleting.value) return; deleting.value = true; try { await api.delete(`/admin/instructors/${toDelete.value.instructor_id}`); await fetchInstructors(); cancelDelete(); } catch (err) { console.error("deleteInstructor error:", err); alert(err?.response?.data?.message || err.message || "Failed to delete instructor"); } finally { deleting.value = false; } };

    // TRAINERS
    const trainers = ref([]);
    const loadingTrainers = ref(false);
    const trainerStatusFilter = ref("");
    const showTrainerModal = ref(false);
    const showTrainerDeleteModal = ref(false);
    const isEditingTrainer = ref(false);
    const trainerToDelete = ref(null);
    const savingTrainer = ref(false);
    const deletingTrainer = ref(false);
    const trainerForm = reactive({ trainer_id: null, trainer_code: "", firstname: "", lastname: "", email: "", contact_number: "", specialization: "", status: "active" });

    const fetchTrainers = async () => { loadingTrainers.value = true; try { const res = await api.get("/admin/tesda/trainers"); trainers.value = Array.isArray(res.data?.data) ? res.data.data : []; } catch (err) { console.error("fetchTrainers error:", err); alert(err?.response?.data?.message || err.message || "Failed to fetch trainers"); trainers.value = []; } finally { loadingTrainers.value = false; } };
    const filteredTrainers = computed(() => { let r = [...trainers.value]; if (searchQuery.value.trim()) { const q = searchQuery.value.toLowerCase(); r = r.filter((t) => String(t.trainer_code || "").toLowerCase().includes(q) || String(t.firstname || "").toLowerCase().includes(q) || String(t.lastname || "").toLowerCase().includes(q) || String(t.fullname || "").toLowerCase().includes(q) || String(t.email || "").toLowerCase().includes(q) || String(t.specialization || "").toLowerCase().includes(q)); } if (trainerStatusFilter.value) { r = r.filter((t) => (t.status || "") === trainerStatusFilter.value); } return r; });
    const resetTrainerForm = () => { trainerForm.trainer_id = null; trainerForm.trainer_code = ""; trainerForm.firstname = ""; trainerForm.lastname = ""; trainerForm.email = ""; trainerForm.contact_number = ""; trainerForm.specialization = ""; trainerForm.status = "active"; };
    const editTrainer = (t) => { isEditingTrainer.value = true; trainerForm.trainer_id = t.trainer_id; trainerForm.trainer_code = t.trainer_code || ""; trainerForm.firstname = t.firstname || ""; trainerForm.lastname = t.lastname || ""; trainerForm.email = t.email || ""; trainerForm.contact_number = t.contact_number || ""; trainerForm.specialization = t.specialization || ""; trainerForm.status = t.status || "active"; showTrainerModal.value = true; };
    const closeTrainerModal = () => { showTrainerModal.value = false; resetTrainerForm(); };
    const saveTrainer = async () => { if (savingTrainer.value) return; savingTrainer.value = true; try { const payload = { trainer_code: trainerForm.trainer_code, firstname: trainerForm.firstname, lastname: trainerForm.lastname, email: trainerForm.email || null, contact_number: trainerForm.contact_number || null, specialization: trainerForm.specialization || null, status: trainerForm.status, user_id: null }; if (isEditingTrainer.value && trainerForm.trainer_id) { await api.put(`/admin/tesda/trainers/${trainerForm.trainer_id}`, payload); } else { await api.post(`/admin/tesda/trainers`, payload); } await fetchTrainers(); closeTrainerModal(); } catch (err) { console.error("saveTrainer error:", err); alert(err?.response?.data?.message || err.message || "Failed to save trainer"); } finally { savingTrainer.value = false; } };
    const confirmDeleteTrainer = (t) => { trainerToDelete.value = t; showTrainerDeleteModal.value = true; };
    const cancelDeleteTrainer = () => { trainerToDelete.value = null; showTrainerDeleteModal.value = false; };
    const deleteTrainer = async () => { if (!trainerToDelete.value || deletingTrainer.value) return; deletingTrainer.value = true; try { await api.delete(`/admin/tesda/trainers/${trainerToDelete.value.trainer_id}`); await fetchTrainers(); cancelDeleteTrainer(); } catch (err) { console.error("deleteTrainer error:", err); alert(err?.response?.data?.message || err.message || "Failed to delete trainer"); } finally { deletingTrainer.value = false; } };

    onMounted(async () => { await fetchInstructors(); await fetchTrainers(); });

    return {
      activeTab, searchQuery,
      instructors, loading, statusFilter, filteredInstructors, showModal, showDeleteModal, isEditing, toDelete, form, saving, deleting, editInstructor, closeModal, saveInstructor, confirmDelete, cancelDelete, deleteInstructor,
      trainers, loadingTrainers, trainerStatusFilter, filteredTrainers, showTrainerModal, showTrainerDeleteModal, isEditingTrainer, trainerToDelete, trainerForm, savingTrainer, deletingTrainer, editTrainer, closeTrainerModal, saveTrainer, confirmDeleteTrainer, cancelDeleteTrainer, deleteTrainer,
    };
  },
};
</script>

<style scoped>
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }
.tab-group { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.2s; background: #fff; color: #6b7280; }
.tab-inactive:hover { border-color: #d1d5db; color: #374151; }
.tab-active-green { background: #10b981; color: #fff; border-color: #10b981; }
.tab-active-blue { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; border-bottom: 2px solid #e5e7eb; color: #6b7280; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-gray { background: #f3f4f6; color: #6b7280; }
.action-btns { display: flex; gap: 6px; }
.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-edit:hover { background: #2563eb; }
.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-delete:hover { background: #dc2626; }
.select-modern-sm { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.78rem; color: #374151; background: #fff; outline: none; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-card-sm { max-width: 420px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
.modal-head-green { background: #f0fdf4; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; margin: 16px -20px -20px -20px; }
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
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.md-col-span-2 { grid-column: span 2; }
.form-label { font-size: 0.75rem; font-weight: 600; color: #374151; }
.form-input { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; }
.form-input:focus { border-color: #10b981; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .md-col-span-2 { grid-column: span 1; } }
</style>