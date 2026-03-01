<!-- src/components/TrainerCoursesAndSchedule.vue -->
<template>
  <TrainerLayout :active-page="selectedCourseId ? 'schedule' : 'courses'">
    <template #header-left>
      <input
        type="text"
        :placeholder="headerPlaceholder"
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      />
    </template>

    <div>
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-lg font-bold text-blue-800">
            {{ selectedCourseId ? "📅 Schedule" : "📚 My Assigned Courses" }}
          </h2>
          <p v-if="selectedCourseId" class="text-sm text-gray-500 mt-1">
            Course: <span class="font-semibold">{{ selectedCourseName }}</span>
            <span v-if="selectedCourseRangeText" class="ml-2 text-gray-600">
              • {{ selectedCourseRangeText }}
            </span>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="selectedCourseId"
            @click="backToCourses"
            class="px-3 py-2 rounded-md text-sm font-semibold border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            type="button"
          >
            ← Back
          </button>

          <button
            v-if="selectedCourseId"
            @click="fetchSchedules()"
            class="px-3 py-2 rounded-md text-sm font-semibold border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            type="button"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div
        v-if="errorMsg"
        class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm"
      >
        {{ errorMsg }}
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
        <p class="mt-3 text-gray-600">
          {{ selectedCourseId ? "Loading schedules..." : "Loading courses..." }}
        </p>
      </div>

      <!-- ===================== VIEW: MY COURSES ===================== -->
      <div v-else-if="!selectedCourseId">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p class="text-sm text-gray-600">Total Courses</p>
            <h3 class="text-2xl font-bold text-blue-800 mt-1">{{ courses.length }}</h3>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <p class="text-sm text-gray-600">Active</p>
            <h3 class="text-2xl font-bold text-green-800 mt-1">{{ activeCount }}</h3>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <p class="text-sm text-gray-600">Upcoming</p>
            <h3 class="text-2xl font-bold text-yellow-800 mt-1">{{ upcomingCount }}</h3>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p class="text-sm text-gray-600">Total Students</p>
            <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ totalStudents }}</h3>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
            <select
              v-model="coursesSelectedCourse"
              class="w-52 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Courses</option>
              <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              v-model="coursesSelectedStatus"
              class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div class="flex items-end gap-2">
            <button
              @click="clearCoursesFilters"
              class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              type="button"
            >
              Clear
            </button>
            <button
              @click="fetchCourses()"
              class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        <div class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <div class="text-sm text-gray-600">
              Showing {{ filteredCourses.length }} of {{ courses.length }} courses
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Sort by:</span>
              <select v-model="coursesSortBy" class="text-sm border rounded px-2 py-1">
                <option value="course">Course</option>
                <option value="status">Status</option>
                <option value="students">Students</option>
              </select>
            </div>
          </div>

          <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead class="bg-blue-800 text-white">
              <tr>
                <th class="py-3 px-4 text-left font-medium">Course</th>
                <th class="py-3 px-4 text-left font-medium">Code</th>
                <th class="py-3 px-4 text-left font-medium">Start</th>
                <th class="py-3 px-4 text-left font-medium">End</th>
                <th class="py-3 px-4 text-left font-medium">Students</th>
                <th class="py-3 px-4 text-left font-medium">Status</th>
                <th class="py-3 px-4 text-left font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="c in filteredCourses"
                :key="c.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td class="py-3 px-4">
                  <div class="font-medium">{{ c.course }}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ c.duration || "—" }} • Mon–Sat only (skip Sunday)
                  </div>
                </td>

                <td class="py-3 px-4">
                  <span class="text-gray-700">{{ c.courseCode || "—" }}</span>
                </td>

                <td class="py-3 px-4">
                  <span class="text-gray-700">{{ formatDateOrTBA(c.startDate) }}</span>
                </td>

                <td class="py-3 px-4">
                  <span class="text-gray-700">{{ formatDateOrTBA(c.endDate) }}</span>
                </td>

                <td class="py-3 px-4">
                  <span class="font-medium">{{ c.students }}</span>
                </td>

                <td class="py-3 px-4">
                  <span class="px-2 py-1 rounded-full text-xs font-medium" :class="statusBadgeClass(c.status)">
                    {{ formatStatus(c.status) }}
                  </span>
                </td>

                <td class="py-3 px-4">
                  <button
                    @click="selectCourse(c)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    type="button"
                  >
                    View schedules
                  </button>
                </td>
              </tr>

              <tr v-if="filteredCourses.length === 0">
                <td colspan="7" class="py-8 text-center text-gray-500">
                  No assigned courses found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ===================== VIEW: SCHEDULES FOR SELECTED COURSE ===================== -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p class="text-sm text-gray-600">Total Schedules</p>
            <h3 class="text-2xl font-bold text-blue-800 mt-1">{{ schedulesTotal }}</h3>
          </div>
          <div class="bg-sky-50 p-4 rounded-lg border border-sky-100">
            <p class="text-sm text-gray-600">Loaded</p>
            <h3 class="text-2xl font-bold text-sky-800 mt-1">{{ schedules.length }}</h3>
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <p class="text-sm text-gray-600">Has Slots Dates</p>
            <h3 class="text-2xl font-bold text-green-800 mt-1">{{ hasSlotsDates }}</h3>
          </div>
          <div class="bg-red-50 p-4 rounded-lg border border-red-100">
            <p class="text-sm text-gray-600">Full Dates</p>
            <h3 class="text-2xl font-bold text-red-800 mt-1">{{ fullDates }}</h3>
          </div>
        </div>

        <div class="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-gray-700 text-sm">
          <div class="flex flex-wrap gap-6">
            <div><span class="font-semibold">After filters:</span> {{ filteredSchedules.length }}</div>
            <div><span class="font-semibold">Selected Month:</span> {{ schedulesSelectedMonth || "(All)" }}</div>
            <div class="text-gray-500">* Sundays excluded • Range = course duration</div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-blue-800">📅 Schedule Overview</h3>
            <div class="flex gap-3 text-sm">
              <span class="flex items-center gap-1">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                Has slots dates: {{ hasSlotsDates }}
              </span>
              <span class="flex items-center gap-1">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                Full dates: {{ fullDates }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
              <select
                v-model="schedulesSelectedMonth"
                class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Months</option>
                <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <div class="flex items-end gap-2">
              <button
                @click="clearSchedulesFilters"
                class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                type="button"
              >
                Clear
              </button>
              <button
                @click="fetchSchedules()"
                class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>

          <div class="flex justify-between items-center mb-4">
            <button
              @click="prevMonth"
              class="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
              type="button"
            >
              ◀ Prev
            </button>
            <h3 class="text-lg font-semibold text-blue-800">{{ currentMonthName }} {{ currentYear }}</h3>
            <button
              @click="nextMonth"
              class="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
              type="button"
            >
              Next ▶
            </button>
          </div>

          <div class="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="d in calendarDates"
              :key="d.key"
              :class="[
                'p-3 border rounded text-center transition-colors relative',
                d.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
                d.isToday ? 'border-blue-500' : 'border-gray-200',
                d.isSunday ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer',
                d.inCourseRange ? 'bg-blue-50' : '',
                getDateClass(d.ymd)
              ]"
              @click="!d.isSunday && openDateModal(d.ymd)"
            >
              <div class="font-medium">{{ d.day }}</div>

              <div v-if="d.studentsSum !== null && !d.isSunday" class="text-xs mt-1">
                <span :class="d.isFull ? 'text-red-600' : 'text-green-700'">
                  {{ d.isFull ? "Full" : `Students ${d.studentsSum}` }}
                </span>
              </div>

              <div v-else-if="d.inCourseRange && !d.isSunday" class="text-[10px] mt-1 text-blue-700">
                Training
              </div>

              <div v-else-if="d.isSunday" class="text-[10px] mt-1 text-gray-400">
                Sunday
              </div>
            </div>
          </div>

          <div class="mt-4 flex gap-4 text-sm text-gray-600 flex-wrap">
            <span class="flex items-center gap-2"><div class="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>Course range</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 bg-green-100 rounded"></div>Has slots</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 bg-red-100 rounded"></div>Full</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 border-2 border-blue-500 rounded"></div>Today</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 bg-gray-200 rounded"></div>Sunday (excluded)</span>
          </div>
        </div>

        <!-- ✅ Schedule Table (UPDATED: may End column na) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-bold text-blue-800">🗂️ Schedule List</h3>
            <div class="text-sm text-gray-600">
              Showing {{ schedulesPaged.length }} of {{ filteredSchedules.length }} schedules
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
              <thead class="bg-blue-800 text-white">
                <tr>
                  <th class="py-3 px-4 text-left font-medium">Start</th>
                  <th class="py-3 px-4 text-left font-medium">End</th>
                  <th class="py-3 px-4 text-left font-medium">Time</th>
                  <th class="py-3 px-4 text-left font-medium">Students</th>
                  <th class="py-3 px-4 text-left font-medium">Status</th>
                  <th class="py-3 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="s in schedulesPaged"
                  :key="s.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <!-- Start -->
                  <td class="py-3 px-4">
                    {{ formatDateOrTBA(s.date) }}
                    <div class="text-xs text-gray-500">{{ s.day || "" }}</div>
                  </td>

                  <!-- ✅ End (ITO ANG IDINAGDAG) -->
                  <td class="py-3 px-4">
                    {{ formatDateOrTBA(s.endDate) }}
                  </td>

                  <td class="py-3 px-4">
                    <div class="font-medium">{{ s.startTime }} - {{ s.endTime }}</div>
                  </td>

                  <td class="py-3 px-4">
                    <div class="font-medium">{{ s.students }}</div>
                    <div class="text-xs text-gray-500" v-if="Number.isFinite(s.totalSlots)">Total: {{ s.totalSlots }}</div>
                  </td>

                  <td class="py-3 px-4">
                    <span :class="getStatusClassByBooked(s.students, s.totalSlots)">
                      {{ getStatusLabelByBooked(s.students, s.totalSlots) }}
                    </span>
                  </td>

                  <td class="py-3 px-4">
                    <button
                      @click="openScheduleModal(s)"
                      class="text-blue-600 hover:text-blue-800 text-sm font-semibold mr-3"
                      type="button"
                    >
                      View
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredSchedules.length === 0">
                  <td colspan="6" class="py-8 text-center text-gray-500">
                    No schedules found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="filteredSchedules.length > 0" class="p-4 flex justify-between items-center border-t border-gray-200">
            <div class="text-sm text-gray-600">
              Page {{ schedulesPage }} of {{ schedulesTotalPages }} • {{ filteredSchedules.length }} items
            </div>

            <div class="flex items-center gap-2">
              <select v-model.number="schedulesPageSize" class="text-sm border rounded px-2 py-1">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>

              <button
                class="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                :disabled="schedulesPage <= 1"
                @click="schedulesPage--"
                type="button"
              >
                ← Prev
              </button>
              <button
                class="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                :disabled="schedulesPage >= schedulesTotalPages"
                @click="schedulesPage++"
                type="button"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DATE MODAL -->
    <div v-if="showDateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-blue-800">Schedules for {{ formatDateOrTBA(selectedDateYMD) }}</h3>
            <button @click="closeDateModal" class="text-gray-400 hover:text-gray-600 text-xl" type="button">✕</button>
          </div>

          <div v-if="dateSchedules.length === 0" class="text-gray-600 text-sm">
            No schedule rows for this date.
            <div v-if="isInSelectedCourseRange(selectedDateYMD)" class="mt-2 text-blue-700 text-xs">
              This date is inside the course duration range (Mon–Sat only).
            </div>
          </div>

          <div v-else class="space-y-3">
            <div v-for="s in dateSchedules" :key="s.id + '-' + selectedDateYMD" class="border border-gray-200 rounded-lg p-4">
              <div class="flex justify-between items-start gap-3">
                <div>
                  <div class="font-semibold text-gray-800">{{ selectedCourseName }}</div>
                  <div class="text-sm text-gray-600 mt-1">{{ s.startTime }} - {{ s.endTime }}</div>
                  <div class="text-sm text-gray-600">
                    Students: {{ s.students }} <span v-if="Number.isFinite(s.totalSlots)">/ {{ s.totalSlots }}</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    Batch covers: {{ s.date }} → {{ s.endDate || s.date }}
                  </div>
                </div>

                <div class="text-right text-sm">
                  <div :class="getStatusClassByBooked(s.students, s.totalSlots)">
                    {{ getStatusLabelByBooked(s.students, s.totalSlots) }}
                  </div>

                  <button class="mt-2 text-blue-600 hover:text-blue-800 font-semibold" @click="openScheduleModal(s)" type="button">
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <button
              @click="closeDateModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SCHEDULE DETAILS MODAL -->
    <div v-if="showScheduleModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-blue-800">Schedule Details</h3>
            <button @click="closeScheduleModal" class="text-gray-400 hover:text-gray-600 text-xl" type="button">✕</button>
          </div>

          <div class="space-y-2">
            <div><span class="font-semibold">Course:</span> {{ selectedCourseName }}</div>
            <div>
              <span class="font-semibold">Start:</span>
              {{ formatDateOrTBA(selectedSchedule.date) }}
              <span class="text-gray-500">({{ selectedSchedule.day || "" }})</span>
            </div>
            <div>
              <span class="font-semibold">End:</span>
              {{ formatDateOrTBA(selectedSchedule.endDate) }}
            </div>
            <div><span class="font-semibold">Time:</span> {{ selectedSchedule.startTime }} - {{ selectedSchedule.endTime }}</div>
            <div>
              <span class="font-semibold">Students:</span>
              {{ selectedSchedule.students }}
              <span v-if="Number.isFinite(selectedSchedule.totalSlots)">/ {{ selectedSchedule.totalSlots }}</span>
            </div>
            <div>
              <span class="font-semibold">Status:</span>
              <span :class="getStatusClassByBooked(selectedSchedule.students, selectedSchedule.totalSlots)">
                {{ getStatusLabelByBooked(selectedSchedule.students, selectedSchedule.totalSlots) }}
              </span>
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <button
              @click="closeScheduleModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

  </TrainerLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import TrainerLayout from "./TrainerLayout.vue";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export default {
  name: "TrainerCoursesAndSchedule",
  components: { TrainerLayout },
  setup() {
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];

    const loading = ref(true);
    const errorMsg = ref("");
    const searchQuery = ref("");

    // ---------- date helpers ----------
    const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
    const pad2 = (n) => String(n).padStart(2, "0");

    const safeDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val;

      const s = String(val).trim();
      if (!s) return null;
      if (s.toUpperCase() === "TBA") return null;
      if (s === "0000-00-00") return null;

      if (isYMD(s)) {
        const [y, m, d] = s.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        return Number.isNaN(dt.getTime()) ? null : dt;
      }

      const normalized = s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s;
      const d = new Date(normalized);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const toYMD = (val) => {
      if (!val) return "";
      if (val instanceof Date) {
        if (Number.isNaN(val.getTime())) return "";
        return `${val.getFullYear()}-${pad2(val.getMonth() + 1)}-${pad2(val.getDate())}`;
      }

      const s = String(val).trim();
      if (!s) return "";
      if (s.toUpperCase() === "TBA") return "";
      if (s === "0000-00-00") return "";

      if (isYMD(s)) return s;
      if (s.includes("T")) return s.split("T")[0];
      if (s.includes(" ")) return s.split(" ")[0];

      const d = safeDate(s);
      if (!d) return "";
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    };

    const isSundayYMD = (ymd) => {
      const d = safeDate(ymd);
      return !!d && d.getDay() === 0;
    };

    const isMonToSatYMD = (ymd) => {
      const d = safeDate(ymd);
      if (!d) return false;
      const day = d.getDay();
      return day >= 1 && day <= 6;
    };

    const formatDateOrTBA = (val) => {
      const d = safeDate(val);
      if (!d) return "TBA";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // ========== TESDA range computation ==========
    const TESDA_HOURS_PER_DAY = 9;

    const parseDurationHours = (duration) => {
      const m = String(duration || "").match(/(\d+(?:\.\d+)?)/);
      const n = m ? Number(m[1]) : 0;
      return Number.isFinite(n) ? n : 0;
    };

    const tesdaDaysFromDuration = (duration) => {
      const hours = parseDurationHours(duration);
      return hours > 0 ? Math.max(1, Math.ceil(hours / TESDA_HOURS_PER_DAY)) : 1;
    };

    const addDaysSkipSundays = (startYmd, addTrainingDays) => {
      if (!isYMD(startYmd)) return "";
      let d = new Date(`${startYmd}T00:00:00`);
      let added = 0;

      while (added < addTrainingDays) {
        d.setDate(d.getDate() + 1);
        if (d.getDay() !== 0) added++;
      }
      return toYMD(d);
    };

    const listTesdaTrainingDays = (startYmd, duration) => {
      if (!startYmd) return [];
      if (!isMonToSatYMD(startYmd)) return [];
      const daysNeeded = tesdaDaysFromDuration(duration);
      const out = [startYmd];
      let cur = startYmd;

      while (out.length < daysNeeded) {
        cur = addDaysSkipSundays(cur, 1);
        if (!cur) break;
        out.push(cur);
      }
      return out;
    };

    const tesdaEndDateFromStart = (startYmd, duration) => {
      const days = listTesdaTrainingDays(startYmd, duration);
      return days.length ? days[days.length - 1] : "";
    };

    // ===================== COURSES =====================
    const courses = ref([]);
    const coursesSelectedCourse = ref("");
    const coursesSelectedStatus = ref("");
    const coursesSortBy = ref("course");

    const courseOptions = computed(() =>
      [...new Set(courses.value.map((c) => c.course).filter(Boolean))].sort()
    );

    const deriveStatusByRange = (startLike, endLike) => {
      const now = new Date();
      const start = safeDate(startLike);
      const end = safeDate(endLike);

      if (!start && !end) return "upcoming";
      if (start && now < start) return "upcoming";
      if (start && end && now >= start && now <= end) return "active";
      if (end && now > end) return "completed";
      if (start && !end) return now >= start ? "active" : "upcoming";
      return "upcoming";
    };

    const formatStatus = (s) =>
      String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);

    const statusBadgeClass = (status) => {
      switch (status) {
        case "active": return "bg-green-100 text-green-800";
        case "upcoming": return "bg-yellow-100 text-yellow-800";
        case "completed": return "bg-gray-100 text-gray-800";
        default: return "bg-gray-100 text-gray-800";
      }
    };

    const clearCoursesFilters = () => {
      searchQuery.value = "";
      coursesSelectedCourse.value = "";
      coursesSelectedStatus.value = "";
    };

    const fetchCourses = async () => {
      loading.value = true;
      errorMsg.value = "";
      try {
        const res = await api.get("/trainer/tesda/courses");
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];

        courses.value = rows.map((row) => {
          const id = Number(row.course_id || row.id);
          const course = row.course_name || row.course || "(unknown)";
          const courseCode = row.course_code || row.courseCode || "";
          const duration = row.duration || row.course_duration || "";

          const startDate = toYMD(row.start_date);
          const endFromBackend = toYMD(row.end_date);
          const endDate = endFromBackend || (startDate ? tesdaEndDateFromStart(startDate, duration) : "");

          const students = Number(row.students_count ?? 0) || 0;
          const status = deriveStatusByRange(startDate, endDate);

          return { id, course, courseCode, duration, startDate, endDate, students, status };
        });
      } catch (err) {
        console.error("fetchCourses error:", err);
        courses.value = [];
        errorMsg.value = err.response?.data?.message || "Failed to load assigned courses";
      } finally {
        loading.value = false;
      }
    };

    const filteredCourses = computed(() => {
      let result = [...courses.value];
      const q = (searchQuery.value || "").toLowerCase().trim();

      if (q) {
        result = result.filter(
          (c) =>
            (c.course || "").toLowerCase().includes(q) ||
            (c.courseCode || "").toLowerCase().includes(q) ||
            (c.status || "").toLowerCase().includes(q) ||
            (c.duration || "").toLowerCase().includes(q)
        );
      }

      if (coursesSelectedCourse.value) result = result.filter((c) => c.course === coursesSelectedCourse.value);
      if (coursesSelectedStatus.value) result = result.filter((c) => c.status === coursesSelectedStatus.value);

      result.sort((a, b) => {
        switch (coursesSortBy.value) {
          case "students": return (b.students || 0) - (a.students || 0);
          case "status": return (a.status || "").localeCompare(b.status || "");
          case "course":
          default: return (a.course || "").localeCompare(b.course || "");
        }
      });

      return result;
    });

    const activeCount = computed(() => courses.value.filter((c) => c.status === "active").length);
    const upcomingCount = computed(() => courses.value.filter((c) => c.status === "upcoming").length);
    const totalStudents = computed(() => courses.value.reduce((sum, c) => sum + (Number(c.students) || 0), 0));

    // ===================== SELECTED COURSE + SCHEDULES =====================
    const selectedCourseId = ref(null);
    const selectedCourseObj = computed(() => courses.value.find((x) => Number(x.id) === Number(selectedCourseId.value)) || null);
    const selectedCourseName = computed(() => selectedCourseObj.value?.course || "");
    const selectedCourseStart = computed(() => selectedCourseObj.value?.startDate || "");
    const selectedCourseEnd = computed(() => selectedCourseObj.value?.endDate || "");
    const selectedCourseDuration = computed(() => selectedCourseObj.value?.duration || "");

    const selectedCourseRangeText = computed(() => {
      if (!selectedCourseStart.value || !selectedCourseEnd.value) return "";
      return `${selectedCourseStart.value} → ${selectedCourseEnd.value}`;
    });

    const isInSelectedCourseRange = (ymd) => {
      const a = safeDate(selectedCourseStart.value);
      const b = safeDate(selectedCourseEnd.value);
      const x = safeDate(ymd);
      if (!a || !b || !x) return false;
      if (x.getDay() === 0) return false;
      const ta = a.getTime();
      const tb = b.getTime();
      const tx = x.getTime();
      return tx >= ta && tx <= tb;
    };

    const schedules = ref([]);
    const schedulesTotal = ref(0);

    const schedulesSelectedMonth = ref(months[new Date().getMonth()]);
    const currentYear = ref(new Date().getFullYear());
    const currentMonth = ref(new Date().getMonth());

    const schedulesPage = ref(1);
    const schedulesPageSize = ref(10);

    const showDateModal = ref(false);
    const selectedDateYMD = ref("");
    const dateSchedules = ref([]);

    const showScheduleModal = ref(false);
    const selectedSchedule = ref({});

    const getStatusLabelByBooked = (students, total) => {
      const b = Number(students) || 0;
      const t = Number(total);
      if (!Number.isFinite(t) || t <= 0) return "Open";
      return b >= t ? "Full" : "Open";
    };

    const getStatusClassByBooked = (students, total) => {
      const label = getStatusLabelByBooked(students, total);
      return label === "Full" ? "text-red-600 font-semibold" : "text-green-600 font-semibold";
    };

    const scheduleCoversDate = (s, ymd) => {
      const start = toYMD(s?.date || s?.schedule_date);
      if (!start) return false;
      if (!isMonToSatYMD(ymd)) return false;

      const dur = s?.duration || selectedCourseDuration.value || "";
      const days = listTesdaTrainingDays(start, dur);
      return days.includes(String(ymd));
    };

    const fetchSchedules = async () => {
      if (!selectedCourseId.value) return;

      loading.value = true;
      errorMsg.value = "";
      try {
        const res = await api.get("/trainer/tesda/schedules", {
          params: { course_id: selectedCourseId.value },
        });

        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        schedulesTotal.value = Number(res.data?.total || rows.length || 0);

        schedules.value = rows
          .map((s) => {
            const id = Number(s.id || s.schedule_id);
            const ymd = toYMD(s.date || s.schedule_date);
            const d = safeDate(ymd);
            const day = d ? d.toLocaleDateString("en-US", { weekday: "short" }) : "";

            const startTime = String(s.startTime || s.start_time || "08:00").slice(0, 5);
            const endTime = String(s.endTime || s.end_time || "17:00").slice(0, 5);

            const totalSlots = Number.isFinite(Number(s.totalSlots))
              ? Number(s.totalSlots)
              : Number(s.total_slots) || 0;

            const students = Number(s.reservedCount ?? s.reserved_count ?? s.students ?? s.booked ?? 0) || 0;

            const duration = s.duration || selectedCourseDuration.value || "";
            const endDate = ymd ? tesdaEndDateFromStart(ymd, duration) : "";

            return { ...s, id, date: ymd || "", day, startTime, endTime, totalSlots, students, duration, endDate };
          })
          .filter((s) => !s.date || !isSundayYMD(s.date));
      } catch (err) {
        console.error("fetchSchedules error:", err);
        schedules.value = [];
        schedulesTotal.value = 0;
        errorMsg.value = err.response?.data?.message || "Failed to load schedules";
      } finally {
        loading.value = false;
      }
    };

    const filteredSchedules = computed(() => {
      let result = [...schedules.value];
      const q = (searchQuery.value || "").toLowerCase().trim();

      if (q) {
        result = result.filter((s) =>
          (selectedCourseName.value || "").toLowerCase().includes(q) ||
          (s.day || "").toLowerCase().includes(q) ||
          String(s.date || "").toLowerCase().includes(q) ||
          String(s.endDate || "").toLowerCase().includes(q)
        );
      }

      if (schedulesSelectedMonth.value) {
        result = result.filter((s) => {
          const d = safeDate(s.date);
          if (!d) return false;
          return months[d.getMonth()] === schedulesSelectedMonth.value;
        });
      }

      result.sort((a, b) => (safeDate(a.date)?.getTime() ?? 0) - (safeDate(b.date)?.getTime() ?? 0));
      return result;
    });

    const schedulesTotalPages = computed(() =>
      Math.max(1, Math.ceil(filteredSchedules.value.length / schedulesPageSize.value))
    );

    const schedulesPaged = computed(() => {
      const start = (schedulesPage.value - 1) * schedulesPageSize.value;
      return filteredSchedules.value.slice(start, start + schedulesPageSize.value);
    });

    const fullDates = computed(() => {
      const byDate = new Map();
      for (const s of schedules.value) {
        const start = toYMD(s.date);
        if (!start) continue;

        const days = listTesdaTrainingDays(start, s.duration || selectedCourseDuration.value || "");
        for (const ymd of days) {
          const arr = byDate.get(ymd) || [];
          const t = Number(s.totalSlots);
          const b = Number(s.students) || 0;
          const isFull = Number.isFinite(t) && t > 0 ? b >= t : false;
          arr.push(isFull);
          byDate.set(ymd, arr);
        }
      }
      let count = 0;
      for (const arr of byDate.values()) if (arr.length && arr.every(Boolean)) count++;
      return count;
    });

    const hasSlotsDates = computed(() => {
      const byDate = new Map();
      for (const s of schedules.value) {
        const start = toYMD(s.date);
        if (!start) continue;

        const days = listTesdaTrainingDays(start, s.duration || selectedCourseDuration.value || "");
        for (const ymd of days) {
          const arr = byDate.get(ymd) || [];
          const t = Number(s.totalSlots);
          const b = Number(s.students) || 0;
          const hasSlots = Number.isFinite(t) && t > 0 ? b < t : true;
          arr.push(hasSlots);
          byDate.set(ymd, arr);
        }
      }
      let count = 0;
      for (const arr of byDate.values()) if (arr.length && arr.some(Boolean)) count++;
      return count;
    });

    const calendarDates = computed(() => {
      const year = currentYear.value;
      const month = currentMonth.value;

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const firstDayIndex = firstDay.getDay();

      const pad = (n) => String(n).padStart(2, "0");
      const makeYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      const dates = [];
      const prevMonthLastDay = new Date(year, month, 0).getDate();

      const byDate = new Map();
      for (const s of schedules.value) {
        const start = toYMD(s.date);
        if (!start) continue;
        const days = listTesdaTrainingDays(start, s.duration || selectedCourseDuration.value || "");
        for (const ymd of days) {
          const arr = byDate.get(ymd) || [];
          arr.push(s);
          byDate.set(ymd, arr);
        }
      }

      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonthLastDay - i);
        const ymd = makeYMD(d);
        dates.push({
          key: `prev-${i}`,
          day: prevMonthLastDay - i,
          ymd,
          isCurrentMonth: false,
          isToday: false,
          isSunday: d.getDay() === 0,
          inCourseRange: isInSelectedCourseRange(ymd),
          studentsSum: null,
          isFull: false,
        });
      }

      const today = new Date();

      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const ymd = makeYMD(d);
        const isSunday = d.getDay() === 0;

        const coveredSchedules = isSunday ? [] : (byDate.get(ymd) || []);
        const studentsSum = coveredSchedules.length
          ? coveredSchedules.reduce((sum, s) => sum + (Number(s.students) || 0), 0)
          : null;

        const isFull = coveredSchedules.length
          ? coveredSchedules.every((s) => {
              const t = Number(s.totalSlots);
              const b = Number(s.students) || 0;
              return Number.isFinite(t) && t > 0 ? b >= t : false;
            })
          : false;

        dates.push({
          key: `cur-${i}`,
          day: i,
          ymd,
          isCurrentMonth: true,
          isToday:
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear(),
          isSunday,
          inCourseRange: isInSelectedCourseRange(ymd),
          studentsSum: isSunday ? null : studentsSum,
          isFull: isSunday ? false : isFull,
        });
      }

      const totalCells = 42;
      const nextMonthDays = totalCells - dates.length;
      for (let i = 1; i <= nextMonthDays; i++) {
        const d = new Date(year, month + 1, i);
        const ymd = makeYMD(d);
        dates.push({
          key: `next-${i}`,
          day: i,
          ymd,
          isCurrentMonth: false,
          isToday: false,
          isSunday: d.getDay() === 0,
          inCourseRange: isInSelectedCourseRange(ymd),
          studentsSum: null,
          isFull: false,
        });
      }

      return dates;
    });

    const currentMonthName = computed(() => months[currentMonth.value]);

    const getDateClass = (ymd) => {
      if (!ymd) return "";
      if (isSundayYMD(ymd)) return "";

      const matched = schedules.value.filter((s) => scheduleCoversDate(s, ymd));
      if (!matched.length) return "";

      const hasAnySlots = matched.some((s) => {
        const t = Number(s.totalSlots);
        const b = Number(s.students) || 0;
        return Number.isFinite(t) && t > 0 ? b < t : true;
      });

      const allFull = matched.every((s) => {
        const t = Number(s.totalSlots);
        const b = Number(s.students) || 0;
        return Number.isFinite(t) && t > 0 ? b >= t : false;
      });

      if (allFull) return "bg-red-50";
      if (hasAnySlots) return "bg-green-50";
      return "";
    };

    const clearSchedulesFilters = () => {
      searchQuery.value = "";
      schedulesSelectedMonth.value = "";
      schedulesPage.value = 1;
    };

    const prevMonth = () => {
      if (currentMonth.value === 0) {
        currentMonth.value = 11;
        currentYear.value--;
      } else currentMonth.value--;
    };

    const nextMonth = () => {
      if (currentMonth.value === 11) {
        currentMonth.value = 0;
        currentYear.value++;
      } else currentMonth.value++;
    };

    const openDateModal = (ymd) => {
      if (!ymd) return;
      if (isSundayYMD(ymd)) return;

      selectedDateYMD.value = ymd;

      dateSchedules.value = schedules.value
        .filter((s) => scheduleCoversDate(s, ymd) || toYMD(s.date) === ymd)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

      showDateModal.value = true;
    };

    const closeDateModal = () => {
      showDateModal.value = false;
      selectedDateYMD.value = "";
      dateSchedules.value = [];
    };

    const openScheduleModal = (s) => {
      selectedSchedule.value = { ...s };
      showScheduleModal.value = true;
    };

    const closeScheduleModal = () => {
      showScheduleModal.value = false;
      selectedSchedule.value = {};
    };

    const selectCourse = async (c) => {
      selectedCourseId.value = Number(c.id);
      currentMonth.value = new Date().getMonth();
      currentYear.value = new Date().getFullYear();
      schedulesSelectedMonth.value = months[new Date().getMonth()];
      schedulesPage.value = 1;
      await fetchSchedules();
    };

    const backToCourses = () => {
      selectedCourseId.value = null;
      schedules.value = [];
      schedulesTotal.value = 0;
      searchQuery.value = "";
      errorMsg.value = "";
      closeDateModal();
      closeScheduleModal();
    };

    const headerPlaceholder = computed(() => {
      return selectedCourseId.value ? "Search schedules..." : "Search courses...";
    });

    watch([schedulesSelectedMonth, schedulesPageSize, searchQuery], () => {
      if (selectedCourseId.value) schedulesPage.value = 1;
    });

    onMounted(async () => {
      await fetchCourses();
    });

    return {
      months,
      loading,
      errorMsg,
      searchQuery,
      headerPlaceholder,
      formatDateOrTBA,

      courses,
      filteredCourses,
      courseOptions,
      coursesSelectedCourse,
      coursesSelectedStatus,
      coursesSortBy,
      clearCoursesFilters,
      activeCount,
      upcomingCount,
      totalStudents,
      statusBadgeClass,
      formatStatus,
      selectCourse,
      fetchCourses,

      selectedCourseId,
      selectedCourseName,
      selectedCourseRangeText,
      isInSelectedCourseRange,
      backToCourses,

      schedules,
      schedulesTotal,
      schedulesSelectedMonth,
      filteredSchedules,
      schedulesPage,
      schedulesPageSize,
      schedulesTotalPages,
      schedulesPaged,
      currentYear,
      currentMonth,
      currentMonthName,
      calendarDates,
      getDateClass,
      prevMonth,
      nextMonth,
      fetchSchedules,
      clearSchedulesFilters,
      getStatusLabelByBooked,
      getStatusClassByBooked,
      fullDates,
      hasSlotsDates,

      showDateModal,
      selectedDateYMD,
      dateSchedules,
      openDateModal,
      closeDateModal,

      showScheduleModal,
      selectedSchedule,
      openScheduleModal,
      closeScheduleModal,
    };
  },
};
</script>