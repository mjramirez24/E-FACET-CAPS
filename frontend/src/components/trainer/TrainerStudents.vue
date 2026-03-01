<template>
  <TrainerLayout active-page="students">
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        placeholder="Search student..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      />
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-blue-800">👨‍🎓 My Students</h2>

        <!-- ✅ optional: keep button but disabled for now -->
        <button
          disabled
          title="Backend not implemented yet"
          class="bg-blue-300 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm cursor-not-allowed"
        >
          ➕ Add New Student
        </button>
      </div>

      <!-- Error Banner -->
      <div
        v-if="errorMsg"
        class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm"
      >
        {{ errorMsg }}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
          <select
            v-model="selectedCourse"
            class="w-56 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <button
            @click="fetchStudents"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
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
          <thead class="bg-blue-800 text-white">
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
              :key="`${student.id}-${student.course_id}`"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4 flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                  {{ getInitials(student.name) }}
                </div>
                <div>
                  <p class="font-medium">{{ student.name }}</p>
                  <p class="text-xs text-gray-500">{{ student.email }}</p>
                </div>
              </td>

              <td class="py-3 px-4">
                <div class="font-medium">{{ student.course }}</div>
                <div class="text-xs text-gray-500">Code: {{ student.course_code || "—" }}</div>
              </td>

              <td class="py-3 px-4">
                <span :class="getStatusClass(student.status)">
                  {{ formatStatus(student.status) }}
                </span>
                <div class="text-xs text-gray-500 mt-1">
                  Enrolled: {{ formatDate(student.enrollmentDate) }}
                </div>
              </td>

              <td class="py-3 px-4">
                <button
                  @click="viewStudent(student)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </button>

                <!-- ✅ hide edit/delete until you implement backend -->
                <span class="text-gray-300 mx-2">|</span>
                <span class="text-xs text-gray-400">Edit/Delete soon</span>
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
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-blue-800">Student Details</h3>
          <button @click="closeViewModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div class="space-y-2 text-sm">
          <div><span class="font-semibold">Name:</span> {{ selectedStudent.name }}</div>
          <div><span class="font-semibold">Email:</span> {{ selectedStudent.email }}</div>
          <div><span class="font-semibold">Course:</span> {{ selectedStudent.course }}</div>
          <div><span class="font-semibold">Course Code:</span> {{ selectedStudent.course_code || "—" }}</div>
          <div>
            <span class="font-semibold">Status:</span>
            <span :class="getStatusClass(selectedStudent.status)">{{ formatStatus(selectedStudent.status) }}</span>
          </div>
          <div><span class="font-semibold">Enrollment Date:</span> {{ formatDate(selectedStudent.enrollmentDate) }}</div>
        </div>

        <div class="flex justify-end mt-6">
          <button
            @click="closeViewModal"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>

  </TrainerLayout>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import TrainerLayout from "./TrainerLayout.vue";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export default {
  name: "TrainerStudents",
  components: { TrainerLayout },
  setup() {
    const students = ref([]);
    const loading = ref(true);
    const errorMsg = ref("");

    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");
    const sortBy = ref("name");

    // view modal
    const showViewModal = ref(false);
    const selectedStudent = ref({});

    const courseOptions = computed(() => {
      return [...new Set(students.value.map((s) => s.course).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      );
    });

    const filteredStudents = computed(() => {
      let result = [...students.value];

      const q = (searchQuery.value || "").toLowerCase().trim();
      if (q) {
        result = result.filter(
          (s) =>
            (s.name || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q) ||
            (s.course || "").toLowerCase().includes(q) ||
            (s.course_code || "").toLowerCase().includes(q),
        );
      }

      if (selectedCourse.value) result = result.filter((s) => s.course === selectedCourse.value);
      if (selectedStatus.value) result = result.filter((s) => s.status === selectedStatus.value);

      result.sort((a, b) => {
        switch (sortBy.value) {
          case "name":
            return (a.name || "").localeCompare(b.name || "");
          case "nameDesc":
            return (b.name || "").localeCompare(a.name || "");
          case "date":
            return new Date(b.enrollmentDate || 0) - new Date(a.enrollmentDate || 0);
          case "status":
            return (a.status || "").localeCompare(b.status || "");
          default:
            return 0;
        }
      });

      return result;
    });

    const getInitials = (name) => {
      const n = String(name || "").trim();
      if (!n) return "S";
      return n
        .split(" ")
        .filter(Boolean)
        .map((x) => x[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    const getStatusClass = (status) => {
      switch (status) {
        case "active":
          return "text-green-600 font-semibold";
        case "pending":
          return "text-yellow-600 font-semibold";
        case "inactive":
          return "text-red-600 font-semibold";
        default:
          return "text-gray-600";
      }
    };

    const formatStatus = (status) => {
      const s = String(status || "");
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Unknown";
    };

    const formatDate = (val) => {
      if (!val) return "—";
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedCourse.value = "";
      selectedStatus.value = "";
    };

    const viewStudent = (student) => {
      selectedStudent.value = { ...student };
      showViewModal.value = true;
    };

    const closeViewModal = () => {
      showViewModal.value = false;
      selectedStudent.value = {};
    };

    const fetchStudents = async () => {
      loading.value = true;
      errorMsg.value = "";
      try {
        const res = await api.get("/trainer/tesda/students");
        const rows = res.data?.data ?? [];
        students.value = rows.map((r) => ({
          id: Number(r.id),
          name: r.name || "Student",
          email: r.email || "",
          course_id: Number(r.course_id),
          course: r.course || r.course_name || "(unknown)",
          course_code: r.course_code || "",
          status: r.status || "pending",
          enrollmentDate: r.enrollmentDate || r.created_at || null,
        }));
      } catch (err) {
        console.error("fetchStudents error:", err);
        students.value = [];
        errorMsg.value = err.response?.data?.message || "Failed to load students";
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchStudents);

    return {
      students,
      loading,
      errorMsg,

      searchQuery,
      selectedCourse,
      selectedStatus,
      sortBy,

      courseOptions,
      filteredStudents,

      getInitials,
      getStatusClass,
      formatStatus,
      formatDate,
      clearFilters,

      viewStudent,
      showViewModal,
      selectedStudent,
      closeViewModal,

      fetchStudents,
    };
  },
};
</script>