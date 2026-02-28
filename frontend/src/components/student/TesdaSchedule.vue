<!-- src/components/TesdaStudentSchedule.vue -->
<template>
  <StudentLayoutTesda active-page="schedule">
    <template #header-left>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search schedule..."
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </template>

    <div>
      <h2 class="text-lg font-bold text-blue-800 mb-6">📅 My Training Schedule</h2>

      <!-- Schedule Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-blue-100 p-4 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Reservations</p>
              <h3 class="text-2xl font-bold text-blue-800 mt-1">{{ stats.total }}</h3>
            </div>
            <div class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <span class="text-blue-700 text-xl">📅</span>
            </div>
          </div>
        </div>

        <div class="bg-green-100 p-4 rounded-lg border border-green-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">This Week</p>
              <h3 class="text-2xl font-bold text-green-800 mt-1">{{ stats.thisWeek }}</h3>
            </div>
            <div class="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
              <span class="text-green-700 text-xl">🗓️</span>
            </div>
          </div>
        </div>

        <div class="bg-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Next Week</p>
              <h3 class="text-2xl font-bold text-yellow-800 mt-1">{{ stats.nextWeek }}</h3>
            </div>
            <div class="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
              <span class="text-yellow-700 text-xl">⏭️</span>
            </div>
          </div>
        </div>

        <div class="bg-purple-100 p-4 rounded-lg border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Confirmed</p>
              <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ stats.confirmed }}</h3>
            </div>
            <div class="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
              <span class="text-purple-700 text-xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar & Upcoming -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Calendar -->
        <div class="lg:col-span-1 bg-white rounded-xl shadow border border-gray-200 p-4">
          <div class="flex justify-between items-center mb-4">
            <button
              class="p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
              title="Previous month"
              @click="prevMonth"
              type="button"
            >
              &lt;
            </button>

            <h3 class="font-semibold text-blue-800 text-center">
              {{ monthLabel }}
            </h3>

            <button
              class="p-2 text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-colors"
              title="Next month"
              @click="nextMonth"
              type="button"
            >
              &gt;
            </button>
          </div>

          <div class="grid grid-cols-7 text-center text-sm font-medium text-gray-700 gap-1">
            <div
              v-for="day in ['S', 'M', 'T', 'W', 'T', 'F', 'S']"
              :key="day"
              class="font-bold text-blue-800 py-2 text-xs"
            >
              {{ day }}
            </div>

            <div v-for="i in blankDays" :key="'b'+i" class="py-2"></div>

            <!-- ✅ Sundays disabled + gray + no hover -->
            <button
              v-for="d in daysInMonth"
              :key="'d'+d"
              type="button"
              class="py-2 rounded-lg text-sm relative transition-colors"
              :class="dayBtnClass(d)"
              :disabled="isSundayDay(d)"
              @click="selectDay(d)"
            >
              {{ d }}

              <!-- dot (hidden on Sundays) -->
              <span
                v-if="!isSundayDay(d) && hasConfirmedOnDay(d)"
                class="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full"
              ></span>
            </button>
          </div>

          <!-- Legend -->
          <div class="mt-6 pt-4 border-t border-gray-200">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span class="text-xs text-gray-600">Has reservation (CONFIRMED/APPROVED/ACTIVE)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full"></div>
              <span class="text-xs text-gray-600">Selected day</span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <div class="w-3 h-3 bg-gray-200 border border-gray-300 rounded-full"></div>
              <span class="text-xs text-gray-600">TBA (no start date yet)</span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <div class="w-3 h-3 bg-gray-100 border border-gray-300 rounded-full"></div>
              <span class="text-xs text-gray-600">Sunday (no training)</span>
            </div>
          </div>
        </div>

        <!-- Upcoming / Selected -->
        <div class="lg:col-span-2 bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-md font-semibold text-blue-800">Upcoming / Selected Day</h3>
            <p class="text-sm text-gray-600 mt-1">
              <span v-if="selectedDateStr">Showing reservations for <b>{{ selectedDateStr }}</b></span>
              <span v-else>Select a date to view reservations</span>
            </p>
          </div>

          <div v-if="selectedDateStr && selectedDayItems.length" class="p-4 space-y-3">
            <div
              v-for="r in selectedDayItems"
              :key="r.reservation_id"
              class="p-4 rounded border bg-gray-50 flex items-start justify-between gap-4"
            >
              <div class="text-sm">
                <div class="font-semibold text-gray-800">{{ r.course_name }}</div>

                <div class="text-gray-700 mt-1">
                  <template v-if="isTBAReservation(r)">
                    <span class="font-medium">TBA</span>
                    <span class="text-xs text-gray-500"> • (Announced soon)</span>
                  </template>
                  <template v-else>
                    <span class="font-medium">
                      {{ displayDateRange(r) }}
                    </span>
                  </template>

                  <span class="mx-1">•</span>
                  {{ r.startTime }}-{{ r.endTime }}

                  <span class="mx-1">•</span>
                  <span class="font-medium">Batch {{ r.batch_no || "—" }}</span>
                </div>

                <div class="text-xs text-gray-500 mt-1">
                  Trainer: {{ r.trainer_name || "—" }}
                </div>
              </div>

              <span class="text-xs px-2 py-1 rounded font-medium" :class="statusPill(r.reservation_status)">
                {{ String(r.reservation_status || "").toUpperCase() }}
              </span>
            </div>
          </div>

          <div v-else class="p-8 text-center">
            <div class="text-gray-400 mb-3">
              <span class="text-4xl">📅</span>
            </div>
            <p class="text-gray-500">
              {{ selectedDateStr ? "No reservations on this date." : "Select a date to view reservations" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Schedule Table -->
      <div class="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-md font-semibold text-blue-800">My Reserved Training Schedule</h3>

          <div class="flex items-center gap-2">
            <select
              v-model="filterCourseId"
              class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              <option v-for="c in courseOptions" :key="c.id" :value="String(c.id)">
                {{ c.name }}
              </option>
            </select>

            <select
              v-model="filterStatus"
              class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DONE">DONE</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            <button
              class="p-1 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="Refresh schedule"
              @click="fetchMyReservations"
              type="button"
              :disabled="loading"
            >
              ↻
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200 text-sm">
            <thead class="bg-blue-800 text-white">
              <tr>
                <th class="py-3 px-4 text-left font-medium">Date</th>
                <th class="py-3 px-4 text-left font-medium">Time</th>
                <th class="py-3 px-4 text-left font-medium">Batch</th>
                <th class="py-3 px-4 text-left font-medium">Training</th>
                <th class="py-3 px-4 text-left font-medium">Trainer</th>
                <th class="py-3 px-4 text-left font-medium">Reservation Status</th>
                <th class="py-3 px-4 text-left font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="py-8 text-center text-gray-500">
                  Loading schedule...
                </td>
              </tr>

              <tr v-else-if="!filteredRows.length">
                <td colspan="7" class="py-8 text-center text-gray-500">
                  <div class="text-gray-400">
                    <span class="text-3xl mb-2 block">📅</span>
                    <p class="text-gray-500">No schedule found</p>
                    <p class="text-sm text-gray-400 mt-1">Try adjusting your filters or search</p>
                  </div>
                </td>
              </tr>

              <tr
                v-else
                v-for="r in filteredRows"
                :key="r.reservation_id"
                class="border-t"
              >
                <td class="py-3 px-4">
                  <template v-if="isTBAReservation(r)">
                    <span class="font-medium text-gray-700">TBA</span>
                    <span class="text-xs text-gray-500 ml-1">(announced soon)</span>
                  </template>
                  <template v-else>
                    {{ displayDateRange(r) }}
                  </template>
                </td>

                <td class="py-3 px-4">{{ r.startTime }}-{{ r.endTime }}</td>

                <td class="py-3 px-4">
                  <span class="font-medium">Batch {{ r.batch_no || "—" }}</span>
                </td>

                <td class="py-3 px-4">{{ r.course_name }}</td>
                <td class="py-3 px-4">{{ r.trainer_name || "—" }}</td>
                <td class="py-3 px-4">
                  <span class="text-xs px-2 py-1 rounded font-medium" :class="statusPill(r.reservation_status)">
                    {{ String(r.reservation_status || "").toUpperCase() }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <button
                    type="button"
                    class="text-blue-700 hover:text-blue-900 font-medium"
                    @click="openDetails(r)"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
          <div>Showing {{ filteredRows.length }} of {{ rows.length }} reservations</div>
          <div class="text-xs text-gray-500">
            *Calendar dot = CONFIRMED/APPROVED/ACTIVE only • Sundays disabled
          </div>
        </div>
      </div>

      <!-- Simple details modal -->
      <div v-if="detailsOpen" class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div class="bg-white w-full max-w-md rounded-xl shadow border p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-lg font-bold text-blue-800">{{ details?.course_name }}</div>

              <div class="text-sm text-gray-700 mt-1">
                <template v-if="isTBAReservation(details)">
                  <b>TBA</b> • (start date not announced yet)
                </template>
                <template v-else>
                  <b>{{ displayDateRange(details) }}</b>
                </template>

                <span class="mx-1">•</span>
                {{ details?.startTime }}-{{ details?.endTime }}

                <span class="mx-1">•</span>
                <b>Batch {{ details?.batch_no || "—" }}</b>
              </div>

              <div class="text-xs text-gray-500 mt-1">Trainer: {{ details?.trainer_name || "—" }}</div>
            </div>
            <button class="text-gray-500 hover:text-gray-800" @click="detailsOpen=false" type="button">✕</button>
          </div>

          <div class="mt-4">
            <span class="text-xs px-2 py-1 rounded font-medium" :class="statusPill(details?.reservation_status)">
              {{ String(details?.reservation_status || "").toUpperCase() }}
            </span>
            <div class="text-xs text-gray-500 mt-2">Reserved at: {{ details?.reserved_at || details?.created_at || "—" }}</div>
          </div>

          <div class="mt-5 flex justify-end">
            <button class="px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800" @click="detailsOpen=false" type="button">
              Close
            </button>
          </div>
        </div>
      </div>

    </div>
  </StudentLayoutTesda>
</template>

<script>
import StudentLayoutTesda from "./StudentLayoutTesda.vue";

const CONFIRMED_LIKE = new Set(["CONFIRMED", "APPROVED", "ACTIVE"]);

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYMD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfWeek(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default {
  name: "TesdaStudentSchedule",
  components: { StudentLayoutTesda },

  data() {
    const today = new Date();
    return {
      loading: false,
      rows: [],

      searchQuery: "",
      filterCourseId: "all",
      filterStatus: "all",

      calYear: today.getFullYear(),
      calMonth: today.getMonth(),
      selectedDateStr: "",

      detailsOpen: false,
      details: null,
    };
  },

  computed: {
    monthLabel() {
      const d = new Date(this.calYear, this.calMonth, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    },

    blankDays() {
      const first = new Date(this.calYear, this.calMonth, 1);
      return first.getDay();
    },

    daysInMonth() {
      const last = new Date(this.calYear, this.calMonth + 1, 0);
      return Array.from({ length: last.getDate() }, (_, i) => i + 1);
    },

    courseOptions() {
      const map = new Map();
      for (const r of this.rows) {
        const id = Number(r.course_id);
        if (!id) continue;
        if (!map.has(id)) map.set(id, r.course_name || `Course ${id}`);
      }
      return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    },

    filteredRows() {
      const q = (this.searchQuery || "").trim().toLowerCase();
      const fc = this.filterCourseId;
      const fs = this.filterStatus;

      return (this.rows || []).filter((r) => {
        if (fc !== "all" && String(r.course_id) !== String(fc)) return false;
        if (fs !== "all" && String(r.reservation_status || "").toUpperCase() !== String(fs).toUpperCase()) return false;

        if (!q) return true;
        const blob = [
          this.isTBAReservation(r) ? "tba" : this.displayDateRange(r),
          r.startTime,
          r.endTime,
          `batch ${r.batch_no || ""}`,
          r.course_name,
          r.trainer_name,
          r.reservation_status,
        ].join(" ").toLowerCase();
        return blob.includes(q);
      });
    },

    selectedDayItems() {
      if (!this.selectedDateStr) return [];
      const ymd = this.selectedDateStr;

      // ✅ if selected is Sunday, show nothing (disabled anyway, but safe)
      if (this.isSundayYMD(ymd)) return [];

      return (this.filteredRows || []).filter((r) => {
        if (this.isTBAReservation(r)) return false;
        return this.isDateInReservation(ymd, r) || String(r.schedule_date) === ymd;
      });
    },

    stats() {
      const total = this.rows.length;

      const now = new Date();
      const wkStart = startOfWeek(now);
      const wkEnd = addDays(wkStart, 7);

      const nextWkStart = wkEnd;
      const nextWkEnd = addDays(nextWkStart, 7);

      let thisWeek = 0;
      let nextWeek = 0;
      let confirmed = 0;

      for (const r of this.rows) {
        const st = String(r.reservation_status || "").toUpperCase();
        if (CONFIRMED_LIKE.has(st)) confirmed++;

        if (this.isTBAReservation(r)) continue;

        const d = new Date(String(r.schedule_date) + "T00:00:00");
        if (!Number.isNaN(d.getTime())) {
          if (d >= wkStart && d < wkEnd) thisWeek++;
          if (d >= nextWkStart && d < nextWkEnd) nextWeek++;
        }
      }

      return { total, thisWeek, nextWeek, confirmed };
    },
  },

  methods: {
    // =========================
    // Sunday helpers (disable Sundays)
    // =========================
    isSundayDay(dayNum) {
      const d = new Date(this.calYear, this.calMonth, dayNum);
      return d.getDay() === 0; // 0 = Sunday
    },

    isSundayYMD(ymd) {
      if (!ymd) return false;
      const d = new Date(`${ymd}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      return d.getDay() === 0;
    },

    // =========================
    // TESDA end-date helpers (Mon-Sat only)
    // =========================
    toLocalYMD(dateLike) {
      const d = new Date(dateLike);
      if (Number.isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    },

    parseDurationHours(duration) {
      const m = String(duration || "").match(/(\d+(?:\.\d+)?)/);
      const n = m ? Number(m[1]) : 0;
      return Number.isFinite(n) ? n : 0;
    },

    tesdaDaysFromDuration(duration) {
      const TESDA_HOURS_PER_DAY = 9;
      const totalHours = this.parseDurationHours(duration);
      return totalHours > 0 ? Math.max(1, Math.ceil(totalHours / TESDA_HOURS_PER_DAY)) : 1;
    },

    isMonToSatYMD(ymd) {
      if (!ymd) return false;
      const d = new Date(`${ymd}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      const day = d.getDay(); // 0 Sun
      return day >= 1 && day <= 6;
    },

    addDaysSkipSundays(startYmd, addTrainingDays) {
      let d = new Date(`${startYmd}T00:00:00`);
      let added = 0;

      while (added < addTrainingDays) {
        d.setDate(d.getDate() + 1);
        const ymd = this.toLocalYMD(d);
        if (this.isMonToSatYMD(ymd)) added++;
      }
      return this.toLocalYMD(d);
    },

    tesdaEndDateFromStart(startYmd, duration) {
      if (!startYmd) return "";
      if (!this.isMonToSatYMD(startYmd)) return "";
      const daysNeeded = this.tesdaDaysFromDuration(duration);
      if (daysNeeded <= 1) return startYmd;
      return this.addDaysSkipSundays(startYmd, daysNeeded - 1);
    },

    // =========================
    // Range helpers (for calendar dots + selected day)
    // =========================
    ymdToTime(ymd) {
      const d = new Date(`${ymd}T00:00:00`);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    },

    getStartEndYMD(r) {
      if (!r || this.isTBAReservation(r)) return { start: "", end: "" };
      const start = String(r.schedule_date || "").trim();
      const end = this.endDateForReservation(r) || start;
      return { start, end };
    },

    isDateInReservation(ymd, r) {
      if (!ymd || !r || this.isTBAReservation(r)) return false;

      // ✅ never mark Sundays (no training)
      if (this.isSundayYMD(ymd)) return false;

      const { start, end } = this.getStartEndYMD(r);
      if (!start) return false;

      const t = this.ymdToTime(ymd);
      const a = this.ymdToTime(start);
      const b = this.ymdToTime(end);

      return t >= a && t <= b;
    },

    // =========================
    // Display helpers
    // =========================
    isTBAReservation(r) {
      const raw = String(r?.schedule_date ?? "").trim().toUpperCase();
      return !raw || raw === "TBA" || raw === "0000-00-00";
    },

    endDateForReservation(r) {
      if (!r || this.isTBAReservation(r)) return "";
      const start = String(r.schedule_date || "").trim();

      // NOTE: to compute end date you need duration from backend.
      // If backend doesn't send course_duration, it will fallback to start date only.
      const dur = r.course_duration || r.duration || "";

      return this.tesdaEndDateFromStart(start, dur);
    },

    displayDateRange(r) {
      if (!r || this.isTBAReservation(r)) return "TBA";
      const start = String(r.schedule_date || "").trim();
      const end = this.endDateForReservation(r);
      if (!end || end === start) return start;
      return `${start} → ${end}`;
    },

    statusPill(st) {
      const s = String(st || "").toUpperCase();
      if (s === "PENDING") return "bg-yellow-100 text-yellow-800";
      if (s === "APPROVED") return "bg-green-100 text-green-800";
      if (s === "CONFIRMED") return "bg-green-100 text-green-800";
      if (s === "ACTIVE") return "bg-blue-100 text-blue-800";
      if (s === "DONE") return "bg-gray-200 text-gray-700";
      if (s === "CANCELLED") return "bg-red-100 text-red-800";
      return "bg-gray-100 text-gray-700";
    },

    // =========================
    // API
    // =========================
    async fetchMyReservations() {
      this.loading = true;
      try {
        const res = await fetch("http://localhost:3000/api/tesda/training-schedule", {
          credentials: "include",
        });
        const json = await res.json();
        this.rows = Array.isArray(json?.data) ? json.data : [];

        const todayStr = toYMD(new Date());
        if (!this.selectedDateStr) {
          const hasToday = this.rows.some((r) => this.isDateInReservation(todayStr, r));
          if (hasToday) this.selectedDateStr = todayStr;
        }

        // ✅ if selected day became Sunday (rare), clear it
        if (this.selectedDateStr && this.isSundayYMD(this.selectedDateStr)) {
          this.selectedDateStr = "";
        }
      } catch (e) {
        console.error("fetchMyReservations error:", e);
        this.rows = [];
      } finally {
        this.loading = false;
      }
    },

    // =========================
    // Calendar controls
    // =========================
    prevMonth() {
      const d = new Date(this.calYear, this.calMonth, 1);
      d.setMonth(d.getMonth() - 1);
      this.calYear = d.getFullYear();
      this.calMonth = d.getMonth();
    },

    nextMonth() {
      const d = new Date(this.calYear, this.calMonth, 1);
      d.setMonth(d.getMonth() + 1);
      this.calYear = d.getFullYear();
      this.calMonth = d.getMonth();
    },

    selectDay(dayNum) {
      // ✅ ignore Sundays (button is disabled anyway)
      if (this.isSundayDay(dayNum)) return;
      const d = new Date(this.calYear, this.calMonth, dayNum);
      this.selectedDateStr = toYMD(d);
    },

    dayBtnClass(dayNum) {
      const ymd = toYMD(new Date(this.calYear, this.calMonth, dayNum));
      const isSelected = ymd === this.selectedDateStr;

      if (this.isSundayDay(dayNum)) {
        return "bg-gray-100 text-gray-400 cursor-not-allowed";
      }

      return isSelected
        ? "bg-blue-100 border border-blue-300"
        : "bg-white hover:bg-blue-50";
    },

    hasConfirmedOnDay(dayNum) {
      // ✅ no dots on Sundays
      if (this.isSundayDay(dayNum)) return false;

      const ymd = toYMD(new Date(this.calYear, this.calMonth, dayNum));

      return (this.rows || []).some((r) => {
        const st = String(r.reservation_status || "").toUpperCase();
        if (!CONFIRMED_LIKE.has(st)) return false;
        return this.isDateInReservation(ymd, r);
      });
    },

    // modal
    openDetails(r) {
      this.details = r;
      this.detailsOpen = true;
    },
  },

  async mounted() {
    await this.fetchMyReservations();
  },
};
</script>

<style scoped>
.transition-colors {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>