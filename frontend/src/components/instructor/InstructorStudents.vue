<template>
  <InstructorLayout active-page="students">
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        placeholder="Search student..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      >
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-green-800">👨‍🎓 My Students</h2>
        <button
          @click="openAddModal"
          class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          ➕ Add New Student
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
          <select
            v-model="selectedCourse"
            class="w-48 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Courses</option>
            <option value="Driving NC II">Driving NC II</option>
            <option value="ATDC NC I">ATDC NC I</option>
            <option value="Electrical Installation NC II">Electrical Installation NC II</option>
            <option value="Cookery NC II">Cookery NC II</option>
            <option value="Bread & Pastry">Bread & Pastry</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div class="flex items-end gap-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        <p class="mt-3 text-gray-600">Loading students...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Showing {{ filteredStudents.length }} of {{ students.length }} students
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Sort by:</span>
            <select v-model="sortBy" class="text-sm border rounded px-2 py-1">
              <option value="name">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
              <option value="date">Recently Added</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-green-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Student</th>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="student in filteredStudents"
              :key="student.id ?? student.student_id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4 flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                  {{ getInitials(student.name || '') }}
                </div>
                <div>
                  <p class="font-medium">{{ student.name }}</p>
                  <p class="text-xs text-gray-500">{{ student.email }}</p>
                </div>
              </td>

              <td class="py-3 px-4">
                {{ student.course || student.course_name || '—' }}
              </td>

              <td class="py-3 px-4">
                <span :class="getStatusClass(student.status)">
                  {{ formatStatus(student.status) }}
                </span>
              </td>

              <td class="py-3 px-4">
                <button
                  @click="viewStudent(student)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                >
                  View
                </button>
                <button
                  @click="editStudent(student)"
                  class="text-yellow-600 hover:text-yellow-800 text-sm font-medium mr-3"
                >
                  Edit
                </button>
                <button
                  @click="confirmDelete(student)"
                  class="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="filteredStudents.length === 0">
              <td colspan="4" class="py-8 text-center text-gray-500">
                No students found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination (static UI only) -->
      <div v-if="filteredStudents.length > 0" class="mt-6 flex justify-between items-center">
        <div class="text-sm text-gray-600">
          Page 1 of 1 • {{ filteredStudents.length }} items
        </div>
        <div class="flex gap-1">
          <button class="px-3 py-1 border rounded text-sm hover:bg-gray-50">← Previous</button>
          <button class="px-3 py-1 bg-green-700 text-white rounded text-sm">1</button>
          <button class="px-3 py-1 border rounded text-sm hover:bg-gray-50">Next →</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-md">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-green-800">
              {{ isEditing ? 'Edit Student' : 'Add New Student' }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <form @submit.prevent="saveStudent">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  v-model="formData.name"
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter student name"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  v-model="formData.email"
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter student email"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  v-model="formData.course"
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="" disabled>Select a course</option>
                  <option value="Driving NC II">Driving NC II</option>
                  <option value="ATDC NC I">ATDC NC I</option>
                  <option value="Electrical Installation NC II">Electrical Installation NC II</option>
                  <option value="Cookery NC II">Cookery NC II</option>
                  <option value="Bread & Pastry">Bread & Pastry</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  v-model="formData.status"
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium"
              >
                {{ isEditing ? 'Update' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-md p-6">
        <div class="mb-4">
          <h3 class="text-lg font-bold text-red-600 mb-2">Confirm Deletion</h3>
          <p class="text-gray-600">
            Are you sure you want to delete
            <span class="font-semibold">{{ studentToDelete?.name }}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div class="flex justify-end gap-2">
          <button
            @click="cancelDelete"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            @click="deleteStudent"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </InstructorLayout>
</template>

<script>
import { ref, computed, onMounted, reactive } from 'vue'
import InstructorLayout from './InstructorLayout.vue'

export default {
  name: 'InstructorStudents',
  components: { InstructorLayout },
  setup() {
    const students = ref([])
    const loading = ref(true)

    const searchQuery = ref('')
    const selectedCourse = ref('')
    const selectedStatus = ref('')
    const sortBy = ref('name')

    const showModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditing = ref(false)
    const studentToDelete = ref(null)

    // ✅ Change this if your backend is different port/host
    const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:3000'

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

      if (selectedStatus.value) {
        result = result.filter(s => s.status === selectedStatus.value)
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
        case 'active': return 'text-green-600 font-semibold'
        case 'pending': return 'text-yellow-600 font-semibold'
        case 'inactive': return 'text-red-600 font-semibold'
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
      selectedStatus.value = ''
    }

    const resetForm = () => {
      formData.id = null
      formData.name = ''
      formData.email = ''
      formData.course = ''
      formData.status = 'active'
      formData.enrollmentDate = null
    }

    const openAddModal = () => {
      isEditing.value = false
      resetForm()
      showModal.value = true
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
        const url = `${API_BASE}/api/instructor/students/list`
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
          // normalize shape
          students.value = (json.data || []).map(s => ({
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
      selectedStatus,
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
      openAddModal,
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