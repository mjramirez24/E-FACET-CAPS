<template>
  <InstructorLayout active-page="schedule">
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
            <h2 class="page-title">Schedule</h2>
            <p class="page-subtitle">Manage your Driving schedules and view history</p>
          </div>

          <!-- Schedules / History Switch (same button style as Admin's Driving/TESDA switch) -->
          <div class="tab-group">
            <button
              @click="activeTab = 'schedules'"
              :class="tabBtnClass(activeTab === 'schedules')"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedules
            </button>
            <button
              @click="activeTab = 'history'"
              :class="tabBtnClass(activeTab === 'history')"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
          </div>
        </div>
      </div>

      <!-- Floating Totals -->
      <div class="stats-row mb-5">
        <div class="stat-mini">
          <span class="stat-mini-value stat-green">{{ activeTab === 'schedules' ? schedulesTotal : historyTotal }}</span>
          <span class="stat-mini-label">{{ activeTab === 'schedules' ? 'Total Active Schedules' : 'Total Schedules' }}</span>
        </div>
        <div class="stat-mini">
          <span class="stat-mini-value stat-blue">{{ activeTab === 'schedules' ? schedules.length : history.length }}</span>
          <span class="stat-mini-label">Loaded</span>
        </div>
        <div class="stat-mini">
          <span class="stat-mini-value stat-amber">{{ activeTab === 'schedules' ? hasSlotsDates : historyDates }}</span>
          <span class="stat-mini-label">{{ activeTab === 'schedules' ? 'Has Slots Dates' : 'History Dates' }}</span>
        </div>
        <div class="stat-mini">
          <span class="stat-mini-value stat-purple">{{ fullDates }}</span>
          <span class="stat-mini-label">Full Dates</span>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMsg" class="info-note info-note-error mb-4">
        {{ errorMsg }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-block">
        <div class="cal-nav-btn spinner-ring"></div>
        <p class="mt-3">Loading...</p>
      </div>

      <!-- ===================== TAB: SCHEDULES ===================== -->
      <div v-else-if="activeTab === 'schedules'">
        <!-- Summary -->
        <div class="info-note mb-4">
          <div class="flex flex-wrap gap-6">
            <div><span class="font-semibold">After filters:</span> {{ filteredSchedules.length }}</div>
            <div><span class="font-semibold">Selected Month:</span> {{ schedulesSelectedMonth || '(All)' }}</div>
            <div><span class="font-semibold">Selected Course:</span> {{ schedulesSelectedCourse || '(All)' }}</div>
          </div>
        </div>

        <!-- Calendar -->
        <div class="panel-card mb-5" style="padding: 20px;">
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
              <label class="filter-label">Course</label>
              <select v-model="schedulesSelectedCourse" class="select-modern-sm" style="width: 220px;">
                <option value="">All Courses</option>
                <option v-for="c in schedulesUniqueCourses" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div class="filter-field">
              <label class="filter-label">Month</label>
              <select v-model="schedulesSelectedMonth" class="select-modern-sm" style="width: 160px;">
                <option value="">All Months</option>
                <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
              </select>
            </div>

            <button @click="clearSchedulesFilters" class="pg-btn">Clear</button>
            <button @click="fetchSchedules()" class="pg-btn pg-btn-accent">↻ Refresh</button>
          </div>

          <!-- Calendar Navigation -->
          <div class="calendar-nav">
            <button @click="prevMonth" class="cal-nav-btn" title="Previous month">‹</button>
            <h3 class="cal-month-title">{{ currentMonthName }} {{ currentYear }}</h3>
            <button @click="nextMonth" class="cal-nav-btn" title="Next month">›</button>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-grid">
            <div class="cal-weekday">Su</div>
            <div class="cal-weekday">Mo</div>
            <div class="cal-weekday">Tu</div>
            <div class="cal-weekday">We</div>
            <div class="cal-weekday">Th</div>
            <div class="cal-weekday">Fr</div>
            <div class="cal-weekday">Sa</div>

            <div
              v-for="date in calendarDates"
              :key="date.key"
              :class="[
                'cal-cell',
                date.isCurrentMonth ? 'cal-cell-current' : 'cal-cell-outside',
                date.isToday ? 'cal-cell-today' : '',
                getDateClass(date.ymd)
              ]"
              @click="openDateModal(date.ymd)"
            >
              <div class="cal-day-num">{{ date.day }}</div>

              <div v-if="date.studentsSum !== null" class="cal-slot-info">
                <span :class="date.isFull ? 'text-red-600' : 'text-green-600'">
                  {{ date.isFull ? 'Full' : `Students ${date.studentsSum}` }}
                </span>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="calendar-legend">
            <span class="legend-item"><span class="legend-swatch legend-swatch-green"></span>Has slots</span>
            <span class="legend-item"><span class="legend-swatch legend-swatch-red"></span>Full</span>
            <span class="legend-item"><span class="legend-swatch legend-swatch-today"></span>Today</span>
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
              <thead class="thead-green">
                <tr>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in schedulesPaged" :key="s.id">
                  <td>
                    <div class="font-medium">{{ s.course }}</div>
                    <div v-if="s.course_code" class="text-xs text-gray-400">{{ s.course_code }}</div>
                  </td>

                  <td>
                    <div class="font-medium">{{ formatDate(s.date) }}</div>
                    <div class="text-xs text-gray-400">{{ s.day || '' }}</div>
                  </td>

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
                      <button @click="openScheduleModal(s)" class="action-view">View</button>
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

              <button class="pg-btn" :class="{ 'pg-disabled': schedulesPage <= 1 }" :disabled="schedulesPage <= 1" @click="schedulesPage--">← Prev</button>
              <button class="pg-btn" :class="{ 'pg-disabled': schedulesPage >= schedulesTotalPages }" :disabled="schedulesPage >= schedulesTotalPages" @click="schedulesPage++">Next →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== TAB: HISTORY ===================== -->
      <div v-else>
        <div class="panel-card">
          <div class="panel-header-bar">
            <h3 class="panel-title">🕘 History</h3>
            <button @click="fetchHistory()" class="pg-btn pg-btn-accent">↻ Refresh</button>
          </div>

          <div class="p-4">
            <div class="text-sm text-gray-600 mb-3">
              Showing {{ history.length }} of {{ historyTotal }} history items
            </div>

            <div v-if="history.length === 0" class="empty-cell">No history yet.</div>

            <div v-else class="table-wrap">
              <table class="modern-table">
                <thead class="thead-green">
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in history" :key="h.id">
                    <td>
                      <div class="font-medium">{{ h.course }}</div>
                      <div v-if="h.course_code" class="text-xs text-gray-400">{{ h.course_code }}</div>
                    </td>
                    <td>{{ formatDate(h.date) }}</td>
                    <td>{{ $formatTimeRange12(h.startTime, h.endTime) }}</td>
                    <td>
                      {{ h.students }}
                      <span class="text-xs text-gray-400" v-if="Number.isFinite(h.totalSlots)">/ {{ h.totalSlots }}</span>
                    </td>
                    <td><span class="pill text-green-600">DONE</span></td>
                    <td>
                      <div class="action-btns">
                        <button @click="openScheduleModal(h)" class="action-view">View</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- History Pagination (server side) -->
            <div v-if="historyTotal > 0" class="pagination-bar">
              <span class="page-info">Page {{ historyPage }} of {{ historyTotalPages }} • {{ historyTotal }} items</span>

              <div class="page-btns">
                <select v-model.number="historyPageSize" class="select-modern-sm" style="width: 90px;">
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                </select>

                <button class="pg-btn" :class="{ 'pg-disabled': historyPage <= 1 }" :disabled="historyPage <= 1" @click="historyPage--">← Prev</button>
                <button class="pg-btn" :class="{ 'pg-disabled': historyPage >= historyTotalPages }" :disabled="historyPage >= historyTotalPages" @click="historyPage++">Next →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== DATE MODAL (Schedules) ===================== -->
    <transition name="modal-fade">
      <div v-if="showDateModal" class="modal-overlay" @click.self="closeDateModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg">
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">📌 Schedules for {{ formatDate(selectedDateYMD) }}</h3>
              <button class="modal-close-btn" @click="closeDateModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body-scroll">
              <div v-if="dateSchedules.length === 0" class="empty-cell">No schedules for this date.</div>

              <div v-else class="table-wrap">
                <table class="modern-table">
                  <thead class="thead-green">
                    <tr>
                      <th>Course</th>
                      <th>Time</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in dateSchedules" :key="s.id">
                      <td>
                        <div class="font-medium">{{ s.course }}</div>
                        <div v-if="s.course_code" class="text-xs text-gray-400">{{ s.course_code }}</div>
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
                          <button @click="openScheduleModal(s)" class="action-view">View</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-foot">
              <button @click="closeDateModal" class="btn-cancel">Close</button>
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
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">Schedule Details</h3>
              <button class="modal-close-btn" @click="closeScheduleModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="detail-row"><span class="detail-label">Course:</span> {{ selectedSchedule.course }}</div>
              <div class="detail-row" v-if="selectedSchedule.course_code">
                <span class="detail-label">Code:</span> {{ selectedSchedule.course_code }}
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                {{ formatDate(selectedSchedule.date) }}
                <span class="text-gray-500">({{ selectedSchedule.day || '' }})</span>
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
              <button @click="closeScheduleModal" class="btn-cancel">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </InstructorLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import InstructorLayout from "./InstructorLayout.vue";
import { API_URL } from "../../config/api";

export default {
  name: "InstructorScheduleOnly",
  components: { InstructorLayout },
  setup() {
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];

    const activeTab = ref("schedules");
    const loading = ref(true);
    const errorMsg = ref("");

    const searchQuery = ref("");

    // ---------- strict date helpers (fix invalid date) ----------
    const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));
    const safeDate = (val) => {
      if (!val) return null;
      const s = String(val).trim();
      if (!s) return null;

      if (isYMD(s)) {
        const [y, m, d] = s.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        return Number.isNaN(dt.getTime()) ? null : dt;
      }

      const normalized = s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s;
      const d = new Date(normalized);
      if (Number.isNaN(d.getTime())) return null;
      return d;
    };

    const toYMD = (val) => {
      if (!val) return "";
      const s = String(val).trim();
      if (isYMD(s)) return s;
      if (s.includes("T")) return s.split("T")[0];
      if (s.includes(" ")) return s.split(" ")[0];

      const d = safeDate(s);
      if (!d) return "";
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

    const formatDate = (val) => {
      const d = safeDate(val);
      if (!d) return "(No date)";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // ===================== SCHEDULES =====================
    const schedules = ref([]);
    const schedulesTotal = ref(0);

    const schedulesSelectedCourse = ref("");
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

    const schedulesUniqueCourses = computed(() => {
      const set = new Set(schedules.value.map((s) => s.course).filter(Boolean));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });

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

    const fetchSchedules = async () => {
      try {
        const res = await fetch(`${API_URL}/instructor/schedules/list?page=1&limit=200`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          schedules.value = [];
          schedulesTotal.value = 0;
          errorMsg.value = json?.debug || json?.message || `Request failed (${res.status})`;
          return;
        }

        if (json.status === "success") {
          schedulesTotal.value = Number(json.total || json.count || 0);

          schedules.value = (json.data || []).map((s) => {
            const ymd = toYMD(s.date);
            const d = safeDate(ymd);
            const day = d ? d.toLocaleDateString("en-US", { weekday: "short" }) : "";

            const booked = Number(s.booked) || 0;
            const totalSlots = Number.isFinite(Number(s.totalSlots)) ? Number(s.totalSlots) : Number(s.total_slots) || 0;

            return {
              ...s,
              date: ymd || "",
              day,
              // ✅ rename booked -> students for UI
              students: booked,
              totalSlots,
            };
          });

          // default month filter to all if current month not present
          const curMonthName = months[new Date().getMonth()];
          const hasThisMonth = schedules.value.some((s) => {
            const d = safeDate(s.date);
            return d ? months[d.getMonth()] === curMonthName : false;
          });
          if (!hasThisMonth) schedulesSelectedMonth.value = "";

          schedulesPage.value = 1;
        } else {
          schedules.value = [];
          schedulesTotal.value = 0;
          errorMsg.value = json?.message || "Server returned error";
        }
      } catch (e) {
        schedules.value = [];
        schedulesTotal.value = 0;
        errorMsg.value = e?.message || "Network error";
      }
    };

    const filteredSchedules = computed(() => {
      let result = [...schedules.value];
      const q = (searchQuery.value || "").toLowerCase().trim();

      if (q) {
        result = result.filter((s) =>
          (s.course || "").toLowerCase().includes(q) ||
          (s.course_code || "").toLowerCase().includes(q) ||
          (s.day || "").toLowerCase().includes(q) ||
          String(s.date || "").toLowerCase().includes(q)
        );
      }

      if (schedulesSelectedCourse.value) result = result.filter((s) => s.course === schedulesSelectedCourse.value);

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

    const schedulesTotalPages = computed(() => Math.max(1, Math.ceil(filteredSchedules.value.length / schedulesPageSize.value)));
    const schedulesPaged = computed(() => {
      const start = (schedulesPage.value - 1) * schedulesPageSize.value;
      return filteredSchedules.value.slice(start, start + schedulesPageSize.value);
    });

    const fullDates = computed(() => {
      const byDate = new Map();
      for (const s of schedules.value) {
        const ymd = toYMD(s.date);
        if (!ymd) continue;
        const t = Number(s.totalSlots);
        const b = Number(s.students) || 0;
        const isFull = Number.isFinite(t) && t > 0 ? b >= t : false;
        const arr = byDate.get(ymd) || [];
        arr.push(isFull);
        byDate.set(ymd, arr);
      }
      let count = 0;
      for (const arr of byDate.values()) if (arr.length && arr.every(Boolean)) count++;
      return count;
    });

    const hasSlotsDates = computed(() => {
      const byDate = new Map();
      for (const s of schedules.value) {
        const ymd = toYMD(s.date);
        if (!ymd) continue;
        const t = Number(s.totalSlots);
        const b = Number(s.students) || 0;
        const hasSlots = Number.isFinite(t) && t > 0 ? b < t : true;
        const arr = byDate.get(ymd) || [];
        arr.push(hasSlots);
        byDate.set(ymd, arr);
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
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonthLastDay - i);
        dates.push({ key: `prev-${i}`, day: prevMonthLastDay - i, ymd: makeYMD(d), isCurrentMonth: false, isToday: false, studentsSum: null, isFull: false });
      }

      const byDate = new Map();
      for (const s of schedules.value) {
        const ymd = toYMD(s.date);
        if (!ymd) continue;
        const arr = byDate.get(ymd) || [];
        arr.push(s);
        byDate.set(ymd, arr);
      }

      const today = new Date();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const ymd = makeYMD(d);
        const daySchedules = byDate.get(ymd) || [];

        const studentsSum = daySchedules.length
          ? daySchedules.reduce((sum, s) => sum + (Number(s.students) || 0), 0)
          : null;

        const isFull = daySchedules.length
          ? daySchedules.every((s) => {
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
          isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
          studentsSum,
          isFull,
        });
      }

      const totalCells = 42;
      const nextMonthDays = totalCells - dates.length;
      for (let i = 1; i <= nextMonthDays; i++) {
        const d = new Date(year, month + 1, i);
        dates.push({ key: `next-${i}`, day: i, ymd: makeYMD(d), isCurrentMonth: false, isToday: false, studentsSum: null, isFull: false });
      }

      return dates;
    });

    const currentMonthName = computed(() => months[currentMonth.value]);

    const getDateClass = (ymd) => {
      if (!ymd) return "";
      const daySchedules = schedules.value.filter((s) => toYMD(s.date) === ymd);
      if (!daySchedules.length) return "";

      const hasAnySlots = daySchedules.some((s) => {
        const t = Number(s.totalSlots);
        const b = Number(s.students) || 0;
        return Number.isFinite(t) && t > 0 ? b < t : true;
      });

      const allFull = daySchedules.every((s) => {
        const t = Number(s.totalSlots);
        const b = Number(s.students) || 0;
        return Number.isFinite(t) && t > 0 ? b >= t : false;
      });

      if (allFull) return "bg-red-50 border-red-300 font-semibold";
      if (hasAnySlots) return "bg-green-100 border-green-400 font-semibold";
      return "";
    };

    const clearSchedulesFilters = () => {
      searchQuery.value = "";
      schedulesSelectedCourse.value = "";
      schedulesSelectedMonth.value = "";
      schedulesPage.value = 1;
    };

    const prevMonth = () => {
      if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; }
      else currentMonth.value--;
    };

    const nextMonth = () => {
      if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; }
      else currentMonth.value++;
    };

    const openDateModal = (ymd) => {
      selectedDateYMD.value = ymd || "";
      dateSchedules.value = schedules.value
        .filter((s) => toYMD(s.date) === ymd)
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

    // ===================== HISTORY =====================
    const history = ref([]);
    const historyTotal = ref(0);
    const historyPage = ref(1);
    const historyPageSize = ref(10);

    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${API_URL}/instructor/schedules/history?page=${historyPage.value}&limit=${historyPageSize.value}`,
          { credentials: "include" }
        );
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          history.value = [];
          historyTotal.value = 0;
          return;
        }

        if (json.status === "success") {
          historyTotal.value = Number(json.total || json.count || 0);
          history.value = (json.data || []).map((x) => {
            const ymd = toYMD(x.date || x.schedule_date);
            const students = Number(x.booked || x.students) || 0;

            return {
              id: Number(x.id || x.schedule_id),
              course: x.course || x.course_name || "(unknown)",
              course_code: x.course_code || "",
              date: ymd || "",
              startTime: x.startTime || x.start_time || "",
              endTime: x.endTime || x.end_time || "",
              students,
              totalSlots: Number(x.totalSlots || x.total_slots || 0),
              status: x.status || "done",
            };
          });
        } else {
          history.value = [];
          historyTotal.value = 0;
        }
      } catch (e) {
        history.value = [];
        historyTotal.value = 0;
      }
    };

    const historyTotalPages = computed(() => Math.max(1, Math.ceil(historyTotal.value / historyPageSize.value)));

    const historyDates = computed(() => {
      const set = new Set(
        history.value
          .map((h) => toYMD(h.date))
          .filter(Boolean)
      );
      return set.size;
    });

    // ===================== header placeholder per tab =====================
    const headerPlaceholder = computed(() => {
      if (activeTab.value === "schedules") return "Search schedules...";
      return "Search history...";
    });

    // ===================== TAB BUTTON CLASS =====================
    const tabBtnClass = (active) => ([
      "tab-btn",
      active ? "tab-active-green" : "tab-inactive",
    ]);

    // watchers
    watch([schedulesSelectedCourse, schedulesSelectedMonth, schedulesPageSize, searchQuery], () => {
      if (activeTab.value === "schedules") schedulesPage.value = 1;
    });

    watch([historyPage, historyPageSize], () => {
      if (activeTab.value === "history") fetchHistory();
    });

    watch(activeTab, (t) => {
      if (t === "history") fetchHistory();
      if (t === "schedules") fetchSchedules();
    });

    onMounted(async () => {
      loading.value = true;
      errorMsg.value = "";

      await fetchSchedules();
      await fetchHistory();

      loading.value = false;
    });

    return {
      months,

      activeTab,
      tabBtnClass,
      headerPlaceholder,

      loading,
      errorMsg,
      searchQuery,

      // schedules
      schedules,
      schedulesTotal,
      schedulesSelectedCourse,
      schedulesSelectedMonth,
      schedulesUniqueCourses,
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

      // modals
      showDateModal,
      selectedDateYMD,
      dateSchedules,
      openDateModal,
      closeDateModal,
      showScheduleModal,
      selectedSchedule,
      openScheduleModal,
      closeScheduleModal,

      // history
      history,
      historyTotal,
      historyPage,
      historyPageSize,
      historyTotalPages,
      historyDates,
      fetchHistory,

      // formatting
      formatDate,
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
.search-input-modern:focus { border-color: #10b981; }

/* ========== TABS ========== */
.tab-group { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.2s; background: #fff; color: #6b7280; }
.tab-inactive:hover { border-color: #d1d5db; color: #374151; }
.tab-active-green { background: #10b981; color: #fff; border-color: #10b981; }

/* ========== STATS ========== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; }
.stat-mini { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.stat-mini-value { font-size: 1.6rem; font-weight: 700; line-height: 1; }
.stat-mini-label { font-size: 0.78rem; color: #6b7280; font-weight: 500; }
.stat-green { color: #059669; }
.stat-blue { color: #2563eb; }
.stat-amber { color: #d97706; }
.stat-purple { color: #7c3aed; }

/* ========== LOADING ========== */
.loading-block { text-align: center; padding: 48px 0; color: #6b7280; }
.spinner-ring { width: 34px; height: 34px; border-radius: 50%; border: 3px solid #e5e7eb; border-top-color: #10b981; animation: spin 0.8s linear infinite; margin: 0 auto; }
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
.select-modern-sm:hover { border-color: #a7f3d0; }
.select-modern-sm:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); background-color: #f0fdf4; }

.pg-btn { padding: 9px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-btn-accent { background: #10b981; color: #fff; border-color: #10b981; }
.pg-btn-accent:hover { background: #059669; color: #fff; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ========== CALENDAR ========== */
.calendar-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.cal-nav-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; color: #059669; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; }
.cal-nav-btn:hover { background: #f0fdf4; border-color: #10b981; }
.cal-month-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }

.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.cal-weekday { font-size: 0.7rem; font-weight: 700; color: #059669; padding: 8px 0; text-transform: uppercase; }
.cal-cell { padding: 8px 4px; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: all 0.15s; position: relative; min-height: 54px; }
.cal-cell-current { background: #fff; }
.cal-cell-outside { background: #f9fafb; color: #d1d5db; }
.cal-cell:hover { border-color: #a7f3d0; }
.cal-cell-today { border-color: #10b981 !important; border-width: 2px; }
.cal-day-num { font-weight: 600; font-size: 0.85rem; }
.cal-slot-info { font-size: 0.65rem; margin-top: 4px; font-weight: 600; }

.calendar-legend { margin-top: 16px; display: flex; gap: 18px; flex-wrap: wrap; font-size: 0.8rem; color: #6b7280; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
.dot-green { background: #10b981; }
.dot-red { background: #ef4444; }
.legend-swatch { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }
.legend-swatch-green { background: #d1fae5; }
.legend-swatch-red { background: #fee2e2; }
.legend-swatch-today { background: #fff; border: 2px solid #10b981; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.text-red-600 { color: #dc2626; background: #fee2e2; }
.text-green-600 { color: #059669; background: #d1fae5; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #6366f1; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #4f46e5; }

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
.modal-head-green { background: #f0fdf4; }
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
.w-4 { width: 16px; } .h-4 { height: 16px; } .w-5 { width: 20px; } .h-5 { height: 20px; }
.flex { display: flex; } .flex-wrap { flex-wrap: wrap; } .items-center { align-items: center; }
.justify-between { justify-content: space-between; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; } .gap-6 { gap: 24px; }
.mb-3 { margin-bottom: 12px; } .mb-4 { margin-bottom: 16px; } .mb-5 { margin-bottom: 20px; } .mt-3 { margin-top: 12px; }
.p-4 { padding: 16px; }
.whitespace-nowrap { white-space: nowrap; }

@media (max-width: 768px) {
  .search-box { max-width: 100%; }
  .calendar-grid { gap: 3px; }
  .cal-cell { padding: 5px; min-height: 44px; }
}
</style>