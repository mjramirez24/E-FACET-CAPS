<!-- src/components/TrainerCoursesAndSchedule.vue -->
<template>
  <TrainerLayout :active-page="selectedCourseId ? 'schedule' : 'courses'">
    <!-- Header -->
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          :placeholder="headerPlaceholder"
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div>
      <!-- Page Header -->
      <div class="page-header-row mb-5">
        <div class="flex justify-between items-center w-full flex-wrap gap-3">
          <div>
            <h2 class="page-title">{{ selectedCourseId ? "Schedule" : " Assigned Courses" }}</h2>
            <p v-if="selectedCourseId" class="page-subtitle">
              Course: <span class="font-semibold">{{ selectedCourseName }}</span>
              <span v-if="selectedCourseRangeText" class="ml-2">
                • {{ selectedCourseRangeText }}
              </span>
            </p>
            <p v-else class="page-subtitle">Manage your assigned TESDA courses and view their schedules</p>
          </div>

          <div class="tab-group" v-if="selectedCourseId">
            <button @click="backToCourses" class="pg-btn" type="button">
              ← Back
            </button>
            <button @click="fetchSchedules()" class="pg-btn pg-btn-accent" type="button">
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMsg" class="info-note info-note-error mb-4">
        {{ errorMsg }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-block">
        <div class="cal-nav-btn spinner-ring"></div>
        <p class="mt-3">{{ selectedCourseId ? "Loading schedules..." : "Loading courses..." }}</p>
      </div>

      <!-- ===================== VIEW: MY COURSES ===================== -->
      <div v-else-if="!selectedCourseId">
        <!-- Floating Totals -->
        <div class="stats-row mb-5">
          <div class="stat-mini">
            <span class="stat-mini-value stat-blue">{{ courses.length }}</span>
            <span class="stat-mini-label">Total Courses</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value stat-green">{{ activeCount }}</span>
            <span class="stat-mini-label">Active</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value stat-amber">{{ upcomingCount }}</span>
            <span class="stat-mini-label">Upcoming</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value stat-purple">{{ totalStudents }}</span>
            <span class="stat-mini-label">Total Students</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-panel mb-5">
          <div class="filter-field">
            <label class="filter-label">Course</label>
            <select v-model="coursesSelectedCourse" class="select-modern-sm" style="width: 220px;">
              <option value="">All Courses</option>
              <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="filter-field">
            <label class="filter-label">Status</label>
            <select v-model="coursesSelectedStatus" class="select-modern-sm" style="width: 160px;">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div class="filter-field">
            <label class="filter-label">Sort by</label>
            <select v-model="coursesSortBy" class="select-modern-sm" style="width: 160px;">
              <option value="course">Course</option>
              <option value="status">Status</option>
              <option value="students">Students</option>
            </select>
          </div>

          <button @click="clearCoursesFilters" class="pg-btn">Clear</button>
          <button @click="fetchCourses()" class="pg-btn pg-btn-accent">↻ Refresh</button>
        </div>

        <!-- Courses Table -->
        <div class="panel-card">
          <div class="panel-header-bar">
            <h3 class="panel-title">🗂️ Assigned Courses</h3>
            <div class="text-sm text-gray-600">
              Showing {{ filteredCourses.length }} of {{ courses.length }} courses
            </div>
          </div>

          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-blue">
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="c in filteredCourses" :key="c.id">
                  <td>
                    <div class="font-medium">{{ c.course }}</div>
                    <div class="text-xs text-gray-400">{{ c.duration || "—" }} • Mon–Sat only (skip Sunday)</div>
                  </td>

                  <td class="text-gray-600">{{ c.courseCode || "—" }}</td>

                  <td class="text-gray-600">{{ formatDateOrTBA(c.startDate) }}</td>

                  <td class="text-gray-600">{{ formatDateOrTBA(c.endDate) }}</td>

                  <td class="font-medium">{{ c.students }}</td>

                  <td>
                    <span class="pill" :class="statusBadgeClass(c.status)">
                      {{ formatStatus(c.status) }}
                    </span>
                  </td>

                  <td class="whitespace-nowrap">
                    <div class="action-btns">
                      <button @click="selectCourse(c)" class="action-view" type="button">
                        View schedules
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredCourses.length === 0">
                  <td colspan="7" class="empty-cell">No assigned courses found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===================== VIEW: SCHEDULES FOR SELECTED COURSE ===================== -->
      <div v-else>
        <!-- Floating Totals -->
        <div class="stats-row mb-5">
          <div class="stat-mini">
            <span class="stat-mini-value stat-blue">{{ schedulesTotal }}</span>
            <span class="stat-mini-label">Total Schedules</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value stat-sky">{{ schedules.length }}</span>
            <span class="stat-mini-label">Loaded</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value stat-green">{{ hasSlotsDates }}</span>
            <span class="stat-mini-label">Has Slots Dates</span>
          </div>
          <div class="stat-mini">
            <span class="stat-mini-value stat-red">{{ fullDates }}</span>
            <span class="stat-mini-label">Full Dates</span>
          </div>
        </div>

        <!-- Summary -->
        <div class="info-note mb-4">
          <div class="flex flex-wrap gap-6">
            <div><span class="font-semibold">After filters:</span> {{ filteredSchedules.length }}</div>
            <div><span class="font-semibold">Selected Month:</span> {{ schedulesSelectedMonth || "(All)" }}</div>
            <div class="text-gray-500">* Sundays excluded • Range = course duration</div>
          </div>
        </div>

        <!-- Calendar -->
        <div class="panel-card mb-5">
          <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h3 class="panel-title">📅 Schedule Overview</h3>
            <div class="flex gap-4 text-sm flex-wrap">
              <span class="legend-item"><span class="dot dot-green"></span>Has slots dates: {{ hasSlotsDates }}</span>
              <span class="legend-item"><span class="dot dot-red"></span>Full dates: {{ fullDates }}</span>
            </div>
          </div>

          <!-- Filters -->
          <div class="filters-panel mb-5">
            <div class="filter-field">
              <label class="filter-label">Month</label>
              <select v-model="schedulesSelectedMonth" class="select-modern-sm" style="width: 160px;">
                <option value="">All Months</option>
                <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>

            <button @click="clearSchedulesFilters" class="pg-btn">Clear</button>
            <button @click="fetchSchedules()" class="pg-btn pg-btn-accent">↻ Refresh</button>
          </div>

          <!-- Calendar Navigation -->
          <div class="calendar-nav">
            <button @click="prevMonth" class="cal-nav-btn" title="Previous month" type="button">‹</button>
            <h3 class="cal-month-title">{{ currentMonthName }} {{ currentYear }}</h3>
            <button @click="nextMonth" class="cal-nav-btn" title="Next month" type="button">›</button>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-grid">
            <div class="cal-weekday">Sun</div>
            <div class="cal-weekday">Mon</div>
            <div class="cal-weekday">Tue</div>
            <div class="cal-weekday">Wed</div>
            <div class="cal-weekday">Thu</div>
            <div class="cal-weekday">Fri</div>
            <div class="cal-weekday">Sat</div>

            <div
              v-for="d in calendarDates"
              :key="d.key"
              :class="[
                'cal-cell',
                d.isCurrentMonth ? 'cal-cell-current' : 'cal-cell-outside',
                d.isToday ? 'cal-cell-today' : '',
                d.isSunday ? 'cal-cell-sunday' : '',
                d.inCourseRange ? 'cal-cell-range' : '',
                getDateClass(d.ymd)
              ]"
              @click="!d.isSunday && openDateModal(d.ymd)"
            >
              <div class="cal-day-num">{{ d.day }}</div>

              <div v-if="d.studentsSum !== null && !d.isSunday" class="cal-slot-info">
                <span :class="d.isFull ? 'text-red-600' : 'text-green-600'">
                  {{ d.isFull ? "Full" : `Students ${d.studentsSum}` }}
                </span>
              </div>

              <div v-else-if="d.inCourseRange && !d.isSunday" class="cal-slot-info cal-slot-muted">
                Training
              </div>

              <div v-else-if="d.isSunday" class="cal-slot-info cal-slot-muted">
                Sunday
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-swatch legend-swatch-blue"></span>Course range</span>
            <span class="legend-item"><span class="legend-swatch legend-swatch-green"></span>Has slots</span>
            <span class="legend-item"><span class="legend-swatch legend-swatch-red"></span>Full</span>
            <span class="legend-item"><span class="legend-swatch legend-swatch-today"></span>Today</span>
            <span class="legend-item"><span class="legend-swatch legend-swatch-sunday"></span>Sunday (excluded)</span>
          </div>
        </div>

        <!-- Schedule Table -->
        <div class="panel-card">
          <div class="panel-header-bar">
            <h3 class="panel-title">🗂️ Schedule List</h3>
            <div class="text-sm text-gray-600">
              Showing {{ schedulesPaged.length }} of {{ filteredSchedules.length }} schedules
            </div>
          </div>

          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-blue">
                <tr>
                  <th>Start</th>
                  <th>End</th>
                  <th>Time</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="s in schedulesPaged" :key="s.id">
                  <!-- Start -->
                  <td>
                    <div class="font-medium">{{ formatDateOrTBA(s.date) }}</div>
                    <div class="text-xs text-gray-400">{{ s.day || "" }}</div>
                  </td>

                  <!-- End -->
                  <td class="text-gray-600">{{ formatDateOrTBA(s.endDate) }}</td>

                  <td class="font-medium">{{ $formatTimeRange12(s.startTime, s.endTime) }}</td>

                  <td>
                    <div class="font-medium">{{ s.students }}</div>
                    <div class="text-xs text-gray-400" v-if="Number.isFinite(s.totalSlots)">Total: {{ s.totalSlots }}</div>
                  </td>

                  <td>
                    <span class="pill" :class="getStatusClassByBooked(s.students, s.totalSlots)">
                      {{ getStatusLabelByBooked(s.students, s.totalSlots) }}
                    </span>
                  </td>

                  <td class="whitespace-nowrap">
                    <div class="action-btns">
                      <button @click="openScheduleModal(s)" class="action-view" type="button">View</button>
                    </div>
                  </td>
                </tr>

                <tr v-if="filteredSchedules.length === 0">
                  <td colspan="6" class="empty-cell">No schedules found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredSchedules.length > 0" class="pagination-bar">
            <span class="page-info">Page {{ schedulesPage }} of {{ schedulesTotalPages }} • {{ filteredSchedules.length }} items</span>

            <div class="page-btns">
              <select v-model.number="schedulesPageSize" class="select-modern-sm" style="width: 90px;">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>

              <button
                class="pg-btn"
                :class="{ 'pg-disabled': schedulesPage <= 1 }"
                :disabled="schedulesPage <= 1"
                @click="schedulesPage--"
                type="button"
              >
                ← Prev
              </button>
              <button
                class="pg-btn"
                :class="{ 'pg-disabled': schedulesPage >= schedulesTotalPages }"
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

    <!-- ===================== DATE MODAL ===================== -->
    <transition name="modal-fade">
      <div v-if="showDateModal" class="modal-overlay" @click.self="closeDateModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg">
            <div class="modal-head modal-head-blue">
              <h3 class="modal-title">📌 Schedules for {{ formatDateOrTBA(selectedDateYMD) }}</h3>
              <button class="modal-close-btn" @click="closeDateModal" type="button">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body-scroll">
              <div v-if="dateSchedules.length === 0" class="empty-cell">
                No schedule rows for this date.
                <div v-if="isInSelectedCourseRange(selectedDateYMD)" class="mt-2 text-blue-700 text-xs">
                  This date is inside the course duration range (Mon–Sat only).
                </div>
              </div>

              <div v-else class="table-wrap">
                <table class="modern-table">
                  <thead class="thead-blue">
                    <tr>
                      <th>Course</th>
                      <th>Time</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in dateSchedules" :key="s.id + '-' + selectedDateYMD">
                      <td>
                        <div class="font-medium">{{ selectedCourseName }}</div>
                        <div class="text-xs text-gray-400">Batch: {{ s.date }} → {{ s.endDate || s.date }}</div>
                      </td>
                      <td class="font-medium">{{ $formatTimeRange12(s.startTime, s.endTime) }}</td>
                      <td>
                        {{ s.students }}
                        <span class="text-xs text-gray-400" v-if="Number.isFinite(s.totalSlots)">/ {{ s.totalSlots }}</span>
                      </td>
                      <td>
                        <span class="pill" :class="getStatusClassByBooked(s.students, s.totalSlots)">
                          {{ getStatusLabelByBooked(s.students, s.totalSlots) }}
                        </span>
                      </td>
                      <td class="whitespace-nowrap">
                        <div class="action-btns">
                          <button class="action-view" @click="openScheduleModal(s)" type="button">View</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-foot">
              <button @click="closeDateModal" class="btn-cancel" type="button">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- ===================== SCHEDULE DETAILS MODAL ===================== -->
    <transition name="modal-fade">
      <div v-if="showScheduleModal" class="modal-overlay" @click.self="closeScheduleModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head modal-head-blue">
              <h3 class="modal-title">Schedule Details</h3>
              <button class="modal-close-btn" @click="closeScheduleModal" type="button">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="detail-row"><span class="detail-label">Course:</span> {{ selectedCourseName }}</div>
              <div class="detail-row">
                <span class="detail-label">Start:</span>
                {{ formatDateOrTBA(selectedSchedule.date) }}
                <span class="text-gray-500">({{ selectedSchedule.day || "" }})</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End:</span>
                {{ formatDateOrTBA(selectedSchedule.endDate) }}
              </div>
              <div class="detail-row"><span class="detail-label">Time:</span> {{ $formatTimeRange12(selectedSchedule.startTime, selectedSchedule.endTime) }}</div>
              <div class="detail-row">
                <span class="detail-label">Students:</span>
                {{ selectedSchedule.students }}
                <span v-if="Number.isFinite(selectedSchedule.totalSlots)">/ {{ selectedSchedule.totalSlots }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="pill" :class="getStatusClassByBooked(selectedSchedule.students, selectedSchedule.totalSlots)">
                  {{ getStatusLabelByBooked(selectedSchedule.students, selectedSchedule.totalSlots) }}
                </span>
              </div>
            </div>

            <div class="modal-foot">
              <button @click="closeScheduleModal" class="btn-cancel" type="button">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </TrainerLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import TrainerLayout from "./TrainerLayout.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
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
        case "active": return "text-green-600";
        case "upcoming": return "text-amber-600";
        case "completed": return "text-gray-600";
        default: return "text-gray-600";
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

      if (allFull) return "cal-cell-full";
      if (hasAnySlots) return "cal-cell-slots";
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

<style scoped>
/* ========== PAGE HEADER ========== */
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.info-note { font-size: 0.8rem; color: #374151; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 14px; }
.info-note-error { color: #dc2626; background: #fef2f2; border-color: #fecaca; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #1d4ed8; }

/* ========== TAB / ACTION GROUP ========== */
.tab-group { display: flex; gap: 8px; flex-wrap: wrap; }

/* ========== STATS ========== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.stat-mini { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.stat-mini-value { font-size: 1.6rem; font-weight: 700; line-height: 1; }
.stat-mini-label { font-size: 0.78rem; color: #6b7280; font-weight: 500; }
.stat-blue { color: #1d4ed8; }
.stat-sky { color: #0284c7; }
.stat-green { color: #059669; }
.stat-amber { color: #d97706; }
.stat-purple { color: #7c3aed; }
.stat-red { color: #dc2626; }

/* ========== LOADING ========== */
.loading-block { text-align: center; padding: 48px 0; color: #6b7280; }
.spinner-ring { width: 34px; height: 34px; border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #1d4ed8; animation: spin 0.8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; padding: 20px; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }

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
.select-modern-sm:hover { border-color: #bfdbfe; }
.select-modern-sm:focus { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15); background-color: #eff6ff; }

.pg-btn { padding: 9px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #1d4ed8; color: #1d4ed8; }
.pg-btn-accent { background: #1d4ed8; color: #fff; border-color: #1d4ed8; }
.pg-btn-accent:hover { background: #1e40af; color: #fff; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ========== CALENDAR ========== */
.calendar-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.cal-nav-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #1d4ed8; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; }
.cal-nav-btn:hover { background: #eff6ff; border-color: #1d4ed8; }
.cal-month-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }

.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.cal-weekday { font-size: 0.7rem; font-weight: 700; color: #1d4ed8; padding: 8px 0; text-transform: uppercase; }
.cal-cell { padding: 8px 4px; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: all 0.15s; position: relative; min-height: 54px; }
.cal-cell-current { background: #fff; }
.cal-cell-outside { background: #f9fafb; color: #d1d5db; }
.cal-cell:hover { border-color: #bfdbfe; }
.cal-cell-today { border-color: #1d4ed8 !important; border-width: 2px; }
.cal-cell-sunday { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
.cal-cell-range { background: #eff6ff; }
.cal-cell-slots { background: #ecfdf5; border-color: #a7f3d0; }
.cal-cell-full { background: #fef2f2; border-color: #fecaca; }
.cal-day-num { font-weight: 600; font-size: 0.85rem; }
.cal-slot-info { font-size: 0.65rem; margin-top: 4px; font-weight: 600; }
.cal-slot-muted { color: #1d4ed8; font-weight: 500; }

.calendar-legend { margin-top: 16px; display: flex; gap: 18px; flex-wrap: wrap; font-size: 0.8rem; color: #6b7280; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
.dot-green { background: #10b981; }
.dot-red { background: #ef4444; }
.legend-swatch { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }
.legend-swatch-blue { background: #eff6ff; border: 1px solid #bfdbfe; }
.legend-swatch-green { background: #d1fae5; }
.legend-swatch-red { background: #fee2e2; }
.legend-swatch-today { background: #fff; border: 2px solid #1d4ed8; }
.legend-swatch-sunday { background: #e5e7eb; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #1d4ed8; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.text-red-600 { color: #dc2626; background: #fee2e2; }
.text-green-600 { color: #059669; background: #d1fae5; }
.text-amber-600 { color: #d97706; background: #fef3c7; }
.text-gray-600.pill { color: #4b5563; background: #f3f4f6; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #1d4ed8; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #1e40af; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ========== MODAL ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-sm { max-width: 420px; }
.modal-card-lg { max-width: 720px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-body-scroll { overflow-y: auto; flex: 1; padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; flex-shrink: 0; }
.detail-row { padding: 8px 0; font-size: 0.88rem; color: #374151; border-bottom: 1px solid #f9fafb; }
.detail-label { font-weight: 600; color: #111827; margin-right: 6px; }

.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }

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
.text-gray-400 { color: #9ca3af; } .text-gray-500 { color: #6b7280; } .text-gray-600 { color: #4b5563; }
.text-blue-700 { color: #1d4ed8; }
.w-5 { width: 20px; } .h-5 { height: 20px; }
.flex { display: flex; } .flex-wrap { flex-wrap: wrap; } .items-center { align-items: center; }
.justify-between { justify-content: space-between; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; }
.mb-4 { margin-bottom: 16px; } .mb-5 { margin-bottom: 20px; } .mt-2 { margin-top: 8px; } .mt-3 { margin-top: 12px; }
.ml-2 { margin-left: 8px; }
.whitespace-nowrap { white-space: nowrap; }

@media (max-width: 768px) {
  .search-box { max-width: 100%; }
  .calendar-grid { gap: 3px; }
  .cal-cell { padding: 5px; min-height: 44px; }
}
</style>