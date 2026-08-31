<template>
  <InstructorLayout active-page="students">
    <!-- Header -->
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search student..."
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div>
      <!-- Page Header -->
      <div class="page-header-row mb-5">
        <div>
          <h2 class="page-title">My Students</h2>
          <p class="page-subtitle">View and manage students enrolled in your courses</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-panel mb-5">
        <div class="filter-field">
          <label class="filter-label">Course</label>
          <select v-model="selectedCourse" class="select-modern-sm" style="width: 220px;">
            <option value="">All Courses</option>
            <option v-for="c in instructorCourses" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <button @click="clearFilters" class="pg-btn">Clear</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-block">
        <div class="spinner-ring"></div>
        <p class="mt-3">Loading students...</p>
      </div>

      <!-- Table -->
      <div v-else class="panel-card">
        <div class="panel-header-bar">
          <div class="text-sm text-gray-600">
            Showing {{ filteredStudents.length }} of {{ students.length }} students
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Sort by:</span>
            <select v-model="sortBy" class="select-modern-sm">
              <option value="name">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
              <option value="date">Recently Added</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="student in filteredStudents" :key="student.id ?? student.student_id">
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ getInitials(student.name || '') }}</div>
                    <div>
                      <p class="font-medium">{{ student.name }}</p>
                      <p class="text-xs text-gray-400">{{ student.email }}</p>
                    </div>
                  </div>
                </td>

                <td>{{ student.course || student.course_name || '—' }}</td>

                <td>
                  <span class="pill" :class="getStatusClass(student.status)">
                    {{ formatStatus(student.status) }}
                  </span>
                </td>

                <td class="whitespace-nowrap">
                  <div class="action-btns">
                    <button @click="viewStudent(student)" class="action-view">View</button>
                    <button @click="editStudent(student)" class="action-edit">Edit</button>
                    <button @click="confirmDelete(student)" class="action-delete">Delete</button>
                  </div>
                </td>
              </tr>

              <tr v-if="filteredStudents.length === 0">
                <td colspan="4" class="empty-cell">No students found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination (static UI only) -->
        <div v-if="filteredStudents.length > 0" class="pagination-bar">
          <span class="page-info">Page 1 of 1 • {{ filteredStudents.length }} items</span>
          <div class="page-btns">
            <button class="pg-btn">← Previous</button>
            <button class="pg-btn pg-btn-accent">1</button>
            <button class="pg-btn">Next →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">{{ isEditing ? 'Edit Student' : 'Add New Student' }}</h3>
              <button class="modal-close-btn" @click="closeModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <form @submit.prevent="saveStudent">
                <div class="form-grid-single">
                  <div>
                    <label class="form-label">Full Name</label>
                    <input type="text" v-model="formData.name" required class="form-input" placeholder="Enter student name" />
                  </div>

                  <div>
                    <label class="form-label">Email</label>
                    <input type="email" v-model="formData.email" required class="form-input" placeholder="Enter student email" />
                  </div>
                </div>

                <div class="modal-foot" style="margin: 20px -20px -20px; border-radius: 0 0 16px 16px;">
                  <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
                  <button type="submit" class="btn-save btn-green">{{ isEditing ? 'Update' : 'Save' }}</button>
                </div>
              </form>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Delete Confirmation Modal -->
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
                  <h3 class="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                  <p class="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm leading-relaxed">
                Are you sure you want to delete
                <span class="font-semibold text-gray-900">{{ studentToDelete?.name }}</span>?
              </p>
              <div class="mt-6 flex justify-end gap-3">
                <button @click="cancelDelete" class="btn-cancel">Cancel</button>
                <button @click="deleteStudent" class="btn-save btn-red">Delete</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </InstructorLayout>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import InstructorLayout from './InstructorLayout.vue'
import { API_URL } from "../../config/api"

export default {
  name: 'InstructorStudents',
  components: { InstructorLayout },
  setup() {
    const students = ref([])
    const loading = ref(true)

    const searchQuery = ref('')
    const selectedCourse = ref('')
    const sortBy = ref('name')

    const showModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditing = ref(false)
    const studentToDelete = ref(null)

    const formData = reactive({
      id: null,
      name: '',
      email: '',
      course: '',
      status: 'active',
      enrollmentDate: null
    })

    const filteredStudents = computed(() => {
      let result = [...students.value]

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(s =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.course || s.course_name || '').toLowerCase().includes(q)
        )
      }

      if (selectedCourse.value) {
        result = result.filter(s => (s.course || s.course_name) === selectedCourse.value)
      }

      result.sort((a, b) => {
        switch (sortBy.value) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'nameDesc':
            return (b.name || '').localeCompare(a.name || '')
          case 'date':
            return new Date(b.enrollmentDate || 0) - new Date(a.enrollmentDate || 0)
          case 'status':
            return (a.status || '').localeCompare(b.status || '')
          default:
            return 0
        }
      })

      return result
    })

    const getInitials = (name) =>
      (name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)

    const getStatusClass = (status) => {
      switch (status) {
        case 'active': return 'text-green-600'
        case 'pending': return 'text-yellow-600'
        case 'inactive': return 'text-red-600'
        default: return 'text-gray-600'
      }
    }

    const formatStatus = (status) => {
      if (!status) return 'Unknown'
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const clearFilters = () => {
      searchQuery.value = ''
      selectedCourse.value = ''
    }

    const resetForm = () => {
      formData.id = null
      formData.name = ''
      formData.email = ''
      formData.course = ''
      formData.status = 'active'
      formData.enrollmentDate = null
    }


    const editStudent = (student) => {
      isEditing.value = true
      Object.assign(formData, {
        id: student.id ?? student.student_id ?? null,
        name: student.name ?? '',
        email: student.email ?? '',
        course: student.course ?? student.course_name ?? '',
        status: student.status ?? 'active',
        enrollmentDate: student.enrollmentDate ?? null
      })
      showModal.value = true
    }

    const viewStudent = (student) => {
      alert(`View student: ${student.name}`)
    }

    const closeModal = () => {
      showModal.value = false
      resetForm()
    }

    const instructorCourses = computed(() => {
        const set = new Set(
          students.value
            .map(s => s.course || s.course_name)
            .filter(Boolean)
        )

        return Array.from(set).sort((a, b) => a.localeCompare(b))
      })

    // NOTE: UI-only save (local), replace with POST/PUT later
    const saveStudent = () => {
      if (isEditing.value) {
        const index = students.value.findIndex(s => (s.id ?? s.student_id) === formData.id)
        if (index !== -1) {
          students.value[index] = {
            ...students.value[index],
            id: formData.id,
            name: formData.name,
            email: formData.email,
            course: formData.course,
            status: formData.status
          }
        }
      } else {
        const newStudent = {
          id: Date.now(),
          name: formData.name,
          email: formData.email,
          course: formData.course,
          status: formData.status,
          enrollmentDate: new Date().toISOString().split('T')[0]
        }
        students.value.unshift(newStudent)
      }
      closeModal()
    }

    const confirmDelete = (student) => {
      studentToDelete.value = student
      showDeleteModal.value = true
    }

    const cancelDelete = () => {
      studentToDelete.value = null
      showDeleteModal.value = false
    }

    // NOTE: UI-only delete (local), replace with DELETE later
    const deleteStudent = () => {
      if (studentToDelete.value) {
        const delId = studentToDelete.value.id ?? studentToDelete.value.student_id
        students.value = students.value.filter(s => (s.id ?? s.student_id) !== delId)
      }
      cancelDelete()
    }

    const fetchStudents = async () => {
      loading.value = true
      try {
        const url = `${API_URL}/instructor/students/list`
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        })

        if (res.status === 401) {
          console.error('Not authenticated (401). Check session/cookies/CORS.')
          students.value = []
          return
        }

        if (res.status === 404) {
          console.error('Route not found (404). Check backend route mounting.')
          students.value = []
          return
        }

      const json = await res.json()
      if (json.status === 'success') {
        students.value = (json.data || [])
          .filter(s => !/^mockstudent\d+@seedtest\.local$/i.test(s.email || ''))
          .map(s => ({
            id: s.id ?? s.student_id,
            name: s.name,
            email: s.email,
            status: s.status,
            course: s.course ?? s.course_name ?? '',
            enrollmentDate: s.enrollmentDate ?? null
          }))
      } else {
        console.error(json.message || 'Failed to load students')
        students.value = []
      }
      } catch (e) {
        console.error('fetchStudents error:', e)
        students.value = []
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchStudents()
    })

    return {
      students,
      loading,
      searchQuery,
      selectedCourse,
      sortBy,
      showModal,
      showDeleteModal,
      isEditing,
      studentToDelete,
      formData,

      filteredStudents,

      getInitials,
      getStatusClass,
      formatStatus,
      clearFilters,
      instructorCourses,
      editStudent,
      viewStudent,
      closeModal,
      saveStudent,
      confirmDelete,
      cancelDelete,
      deleteStudent,
      fetchStudents
    }
  }
}
</script>

<style scoped>
/* ========== PAGE HEADER ========== */
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* ========== FILTERS ========== */
.filters-panel { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; }
.filter-field { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }

/* ========== MODERN SELECT ========== */
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

.pg-btn { padding: 9px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-btn-accent { background: #10b981; color: #fff; border-color: #10b981; }
.pg-btn-accent:hover { background: #059669; color: #fff; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ========== LOADING ========== */
.loading-block { text-align: center; padding: 48px 0; color: #6b7280; }
.spinner-ring { width: 34px; height: 34px; border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #10b981; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; padding: 20px; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.modern-table th { text-align: left; padding: 12px 14px; font-size: 0.72rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; }
.modern-table td { padding: 11px 14px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== USER ========== */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-sm { width: 32px; height: 32px; background: #e5e7eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #374151; flex-shrink: 0; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.text-green-600 { color: #059669; background: #d1fae5; }
.text-yellow-600 { color: #d97706; background: #fef3c7; }
.text-red-600 { color: #dc2626; background: #fee2e2; }
.text-gray-600 { color: #4b5563; background: #f3f4f6; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #6366f1; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #4f46e5; }
.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #f59e0b; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-edit:hover { background: #d97706; }
.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-delete:hover { background: #dc2626; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.85rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ========== MODAL ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-sm { max-width: 420px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.modal-head-green { background: #f0fdf4; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; flex-shrink: 0; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }

/* ========== FORM ========== */
.form-grid-single { display: flex; flex-direction: column; gap: 16px; }
.form-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; box-sizing: border-box; }
.form-input:focus { border-color: #10b981; }

/* ========== BUTTONS ========== */
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-green { background: #10b981; }
.btn-green:hover { background: #059669; }
.btn-red { background: #ef4444; }
.btn-red:hover { background: #dc2626; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ========== MISC ========== */
.font-medium { font-weight: 500; } .font-semibold { font-weight: 600; }
.text-sm { font-size: 0.85rem; } .text-xs { font-size: 0.72rem; }
.text-gray-400 { color: #9ca3af; } .text-gray-500 { color: #6b7280; } .text-gray-900 { color: #111827; }
.w-4 { width: 16px; } .h-4 { height: 16px; } .w-5 { width: 20px; } .h-5 { height: 20px; }
.w-11 { width: 44px; } .h-11 { height: 44px; }
.flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; } .justify-end { justify-content: flex-end; }
.gap-2 { gap: 8px; } .gap-3 { gap: 12px; }
.mb-5 { margin-bottom: 20px; } .mt-3 { margin-top: 12px; } .mt-6 { margin-top: 24px; }
.leading-relaxed { line-height: 1.6; }
.whitespace-nowrap { white-space: nowrap; }
.bg-red-100 { background: #fee2e2; } .text-red-600 { color: #dc2626; }
.rounded-full { border-radius: 999px; }
.text-xl { font-size: 1.25rem; }

@media (max-width: 768px) {
  .search-box { max-width: 100%; }
}
</style>