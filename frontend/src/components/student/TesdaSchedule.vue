<template>
  <StudentLayoutTesda active-page="schedule">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search schedule..."
            class="search-input-modern"
          />
        </div>
        <button @click="fetchMyReservations" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="schedule-wrapper">
      <div class="page-top">
        <h2 class="page-title">My Training Schedule</h2>
        <p class="page-subtitle">View and manage your TESDA training sessions</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ stats.total }}</span>
              <span class="stat-label">Total Reservations</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ stats.thisWeek }}</span>
              <span class="stat-label">This Week</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-amber">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-amber">{{ stats.nextWeek }}</span>
              <span class="stat-label">Next Week</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-purple">{{ stats.confirmed }}</span>
              <span class="stat-label">Confirmed</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar & Schedule Grid -->
      <div class="calendar-grid">
        <div class="panel-card calendar-panel">
          <div class="calendar-header">
            <button @click="prevMonth" class="cal-nav-btn">&lt;</button>
            <h3 class="cal-title">{{ monthLabel }}</h3>
            <button @click="nextMonth" class="cal-nav-btn">&gt;</button>
          </div>
          <div class="cal-day-headers">
            <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="cal-day-header">{{ day.substring(0, 2) }}</div>
          </div>
          <div class="cal-days-grid">
            <div v-for="n in blankDays" :key="'blank-'+n" class="cal-day cal-day-empty"></div>
            <div
              v-for="day in daysInMonth"
              :key="'d'+day"
              :class="[
                'cal-day',
                isSundayDay(day) ? 'cal-day-sunday' : '',
                hasConfirmedOnDay(day) ? 'cal-day-active' : '',
                isSelectedDay(day) ? 'cal-day-selected' : ''
              ]"
              @click="selectDay(day)"
            >
              {{ day }}
            </div>
          </div>
          <div class="cal-legend">
            <div class="cal-legend-item">
              <div class="cal-legend-dot cal-legend-dot-active"></div>
              <span>Has reservation</span>
            </div>
            <div class="cal-legend-item">
              <div class="cal-legend-dot cal-legend-dot-selected"></div>
              <span>Selected day</span>
            </div>
            <div class="cal-legend-item">
              <div class="cal-legend-dot cal-legend-dot-sunday"></div>
              <span>Sunday (no training)</span>
            </div>
            <div class="cal-legend-item">
              <div class="cal-legend-dot cal-legend-dot-tba"></div>
              <span>TBA (no start date)</span>
            </div>
          </div>
        </div>

        <div class="panel-card schedule-list-panel">
          <div class="panel-header-bar">
            <h3 class="panel-title">Upcoming / Selected Day</h3>
            <span class="panel-tag">{{ selectedDateStr ? selectedDateStr : 'Select a date' }}</span>
          </div>
          <div v-if="selectedDateStr && selectedDayItems.length" class="schedule-items">
            <div v-for="r in selectedDayItems" :key="r.reservation_id" class="schedule-item">
              <div class="schedule-item-main">
                <div class="schedule-item-icon" :class="getCourseColorClass(r.course_name)">{{ getCourseInitial(r.course_name) }}</div>
                <div class="schedule-item-info">
                  <h4 class="schedule-item-title">{{ r.course_name }}</h4>
                  <div class="schedule-item-details">
                    <span>
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ isTBAReservation(r) ? 'TBA (Announced soon)' : displayDateRange(r) }}
                    </span>
                    <span>
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {{ r.trainer_name || '—' }}
                    </span>
                    <span>
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Batch {{ r.batch_no || '—' }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="schedule-item-actions">
                <span :class="getStatusPillClass(r.reservation_status)">{{ String(r.reservation_status || '').toUpperCase() }}</span>
                <button @click="openDetails(r)" class="action-view-sm">Details</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>{{ selectedDateStr ? 'No reservations on this date.' : 'Select a date to view reservations' }}</p>
          </div>
        </div>
      </div>

      <!-- Schedule Table -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">My Reserved Training Schedule</h3>
          <div class="panel-header-actions">
            <select v-model="filterCourseId" class="select-modern-sm">
              <option value="all">All Courses</option>
              <option v-for="c in courseOptions" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
            </select>
            <select v-model="filterStatus" class="select-modern-sm">
              <option value="all">All Status</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DONE">DONE</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-gray-500">Loading schedule...</p>
        </div>

        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Batch</th>
                <th>Training</th>
                <th>Trainer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in filteredRows" :key="r.reservation_id">
                <td>
                  <template v-if="isTBAReservation(r)">
                    <div class="font-medium text-gray-700">TBA</div>
                    <div class="text-xs text-gray-400">announced soon</div>
                  </template>
                  <template v-else>
                    <div class="font-medium">{{ displayDateRange(r) }}</div>
                  </template>
                </td>
                <td><span class="font-medium">{{ r.startTime }}-{{ r.endTime }}</span></td>
                <td><span class="font-medium">Batch {{ r.batch_no || '—' }}</span></td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="course-dot" :class="getCourseColorClass(r.course_name)">{{ getCourseInitial(r.course_name) }}</div>
                    <span>{{ r.course_name }}</span>
                  </div>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="avatar-sm">{{ getInitials(r.trainer_name || 'NA') }}</div>
                    <span>{{ r.trainer_name || '—' }}</span>
                  </div>
                </td>
                <td><span :class="getStatusPillClass(r.reservation_status)">{{ String(r.reservation_status || '').toUpperCase() }}</span></td>
                <td>
                  <button @click="openDetails(r)" class="action-view-sm">View</button>
                </td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td colspan="7" class="empty-cell">No schedule found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer-bar">
          <span>Showing {{ filteredRows.length }} of {{ rows.length }} reservations</span>
          <span class="text-xs text-gray-400">Calendar dot = CONFIRMED/APPROVED/ACTIVE only | Sundays disabled</span>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <transition name="modal-fade">
      <div v-if="detailsOpen" class="modal-overlay" @click.self="detailsOpen = false">
        <transition name="modal-scale">
          <div class="modal-card">
            <div class="modal-head modal-head-blue">
              <h3 class="modal-title">Schedule Details</h3>
              <button class="modal-close-btn" @click="detailsOpen = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Training</span>
                  <span class="detail-value">{{ details?.course_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">
                    {{ isTBAReservation(details) ? 'TBA (Announced soon)' : displayDateRange(details) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Time</span>
                  <span class="detail-value">{{ details?.startTime }}-{{ details?.endTime }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Batch</span>
                  <span class="detail-value">Batch {{ details?.batch_no || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Trainer</span>
                  <span class="detail-value">{{ details?.trainer_name || '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status</span>
                  <span :class="getStatusPillClass(details?.reservation_status)">{{ String(details?.reservation_status || '').toUpperCase() }}</span>
                </div>
                <div class="detail-item detail-item-full">
                  <span class="detail-label">Reserved at</span>
                  <span class="detail-value">{{ details?.reserved_at || details?.created_at || '—' }}</span>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="detailsOpen = false" class="btn-cancel">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </StudentLayoutTesda>
</template>

<script>
import StudentLayoutTesda from "./StudentLayoutTesda.vue";
import axios from "axios";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const CONFIRMED_LIKE = new Set(["CONFIRMED", "APPROVED", "ACTIVE"]);

function pad2(n) { return String(n).padStart(2, "0"); }
function toYMD(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function startOfWeek(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

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
    blankDays() { return new Date(this.calYear, this.calMonth, 1).getDay(); },
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
        const blob = [this.isTBAReservation(r) ? "tba" : this.displayDateRange(r), r.startTime, r.endTime, `batch ${r.batch_no || ""}`, r.course_name, r.trainer_name, r.reservation_status].join(" ").toLowerCase();
        return blob.includes(q);
      });
    },
    selectedDayItems() {
      if (!this.selectedDateStr) return [];
      const ymd = this.selectedDateStr;
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
      let thisWeek = 0, nextWeek = 0, confirmed = 0;
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
    isSundayDay(dayNum) { return new Date(this.calYear, this.calMonth, dayNum).getDay() === 0; },
    isSundayYMD(ymd) { if (!ymd) return false; const d = new Date(`${ymd}T00:00:00`); return Number.isNaN(d.getTime()) ? false : d.getDay() === 0; },
    isSelectedDay(dayNum) { return toYMD(new Date(this.calYear, this.calMonth, dayNum)) === this.selectedDateStr; },

    toLocalYMD(dateLike) { const d = new Date(dateLike); if (Number.isNaN(d.getTime())) return ""; return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; },
    parseDurationHours(duration) { const m = String(duration || "").match(/(\d+(?:\.\d+)?)/); const n = m ? Number(m[1]) : 0; return Number.isFinite(n) ? n : 0; },
    tesdaDaysFromDuration(duration) { const totalHours = this.parseDurationHours(duration); return totalHours > 0 ? Math.max(1, Math.ceil(totalHours / 9)) : 1; },
    isMonToSatYMD(ymd) { if (!ymd) return false; const d = new Date(`${ymd}T00:00:00`); return Number.isNaN(d.getTime()) ? false : d.getDay() >= 1 && d.getDay() <= 6; },
    addDaysSkipSundays(startYmd, addTrainingDays) {
      let d = new Date(`${startYmd}T00:00:00`); let added = 0;
      while (added < addTrainingDays) { d.setDate(d.getDate() + 1); if (this.isMonToSatYMD(this.toLocalYMD(d))) added++; }
      return this.toLocalYMD(d);
    },
    tesdaEndDateFromStart(startYmd, duration) { if (!startYmd || !this.isMonToSatYMD(startYmd)) return ""; const daysNeeded = this.tesdaDaysFromDuration(duration); return daysNeeded <= 1 ? startYmd : this.addDaysSkipSundays(startYmd, daysNeeded - 1); },

    ymdToTime(ymd) { const d = new Date(`${ymd}T00:00:00`); return Number.isNaN(d.getTime()) ? 0 : d.getTime(); },
    getStartEndYMD(r) { if (!r || this.isTBAReservation(r)) return { start: "", end: "" }; const start = String(r.schedule_date || "").trim(); const end = this.endDateForReservation(r) || start; return { start, end }; },
    isDateInReservation(ymd, r) { if (!ymd || !r || this.isTBAReservation(r) || this.isSundayYMD(ymd)) return false; const { start, end } = this.getStartEndYMD(r); if (!start) return false; const t = this.ymdToTime(ymd), a = this.ymdToTime(start), b = this.ymdToTime(end); return t >= a && t <= b; },

    isTBAReservation(r) { const raw = String(r?.schedule_date ?? "").trim().toUpperCase(); return !raw || raw === "TBA" || raw === "0000-00-00"; },
    endDateForReservation(r) { if (!r || this.isTBAReservation(r)) return ""; const start = String(r.schedule_date || "").trim(); const dur = r.course_duration || r.duration || ""; return this.tesdaEndDateFromStart(start, dur); },
    displayDateRange(r) { if (!r || this.isTBAReservation(r)) return "TBA"; const start = String(r.schedule_date || "").trim(); const end = this.endDateForReservation(r); return (!end || end === start) ? start : `${start} → ${end}`; },

    getStatusPillClass(st) {
      const s = String(st || "").toUpperCase();
      if (s === "PENDING") return "pill pill-amber";
      if (["APPROVED","CONFIRMED"].includes(s)) return "pill pill-green";
      if (s === "ACTIVE") return "pill pill-blue";
      if (s === "DONE") return "pill pill-gray";
      if (s === "CANCELLED") return "pill pill-red";
      return "pill pill-gray";
    },
    getCourseColorClass(name) {
      const colors = ["bg-blue-500","bg-indigo-500","bg-cyan-500","bg-sky-500","bg-violet-500","bg-teal-500"];
      let hash = 0;
      for (let i = 0; i < (name || "").length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
      return colors[Math.abs(hash) % colors.length];
    },
    getCourseInitial(name) { return (name || "TR").split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 2); },
    getInitials(name) { const s = String(name || '').trim(); if (!s || s === "—") return "NA"; return s.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2); },

    async fetchMyReservations() {
      this.loading = true;
      try {
        const res = await api.get("/tesda/training-schedule");
        this.rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const todayStr = toYMD(new Date());
        if (!this.selectedDateStr && this.rows.some((r) => this.isDateInReservation(todayStr, r))) this.selectedDateStr = todayStr;
        if (this.selectedDateStr && this.isSundayYMD(this.selectedDateStr)) this.selectedDateStr = "";
      } catch (e) { console.error("fetchMyReservations error:", e); this.rows = []; }
      finally { this.loading = false; }
    },

    prevMonth() { const d = new Date(this.calYear, this.calMonth, 1); d.setMonth(d.getMonth() - 1); this.calYear = d.getFullYear(); this.calMonth = d.getMonth(); },
    nextMonth() { const d = new Date(this.calYear, this.calMonth, 1); d.setMonth(d.getMonth() + 1); this.calYear = d.getFullYear(); this.calMonth = d.getMonth(); },
    selectDay(dayNum) { if (this.isSundayDay(dayNum)) return; this.selectedDateStr = toYMD(new Date(this.calYear, this.calMonth, dayNum)); },
    hasConfirmedOnDay(dayNum) { if (this.isSundayDay(dayNum)) return false; const ymd = toYMD(new Date(this.calYear, this.calMonth, dayNum)); return (this.rows || []).some((r) => { const st = String(r.reservation_status || "").toUpperCase(); if (!CONFIRMED_LIKE.has(st)) return false; return this.isDateInReservation(ymd, r); }); },
    openDetails(r) { this.details = r; this.detailsOpen = true; },
  },

  async mounted() { await this.fetchMyReservations(); },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.schedule-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }

/* ===== HEADER ===== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #3b82f6; }
.refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #3b82f6; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn:hover { background: #2563eb; transform: translateY(-1px); }
.refresh-icon { width: 16px; height: 16px; }
.spin-animation { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== PAGE TOP ===== */
.page-top { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

/* ===== STATS ROW ===== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }
.text-emerald { color: #059669; } .text-blue { color: #2563eb; } .text-amber { color: #d97706; } .text-purple { color: #7c3aed; }

/* ===== CALENDAR GRID ===== */
.calendar-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.calendar-panel { padding: 16px; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.cal-nav-btn { padding: 6px 12px; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; cursor: pointer; font-weight: 600; color: #374151; }
.cal-nav-btn:hover { background: #f3f4f6; }
.cal-title { font-size: 0.95rem; font-weight: 700; color: #111827; }
.cal-day-headers { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 4px; }
.cal-day-header { font-size: 0.7rem; font-weight: 700; color: #2563eb; padding: 6px 0; }
.cal-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-day { padding: 8px 4px; text-align: center; border-radius: 8px; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; color: #374151; }
.cal-day:hover:not(.cal-day-sunday):not(.cal-day-empty) { background: #f3f4f6; }
.cal-day-empty { cursor: default; }
.cal-day-sunday { background: #f9fafb; color: #d1d5db; cursor: not-allowed; }
.cal-day-active { background: #3b82f6; color: #fff; font-weight: 700; }
.cal-day-selected { background: #dbeafe; color: #2563eb; font-weight: 700; border: 2px solid #3b82f6; }

.cal-legend { display: flex; gap: 12px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5e7eb; flex-wrap: wrap; }
.cal-legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #6b7280; }
.cal-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.cal-legend-dot-active { background: #3b82f6; }
.cal-legend-dot-selected { background: #dbeafe; border: 2px solid #3b82f6; }
.cal-legend-dot-sunday { background: #f9fafb; border: 2px solid #d1d5db; }
.cal-legend-dot-tba { background: #e5e7eb; border: 2px solid #9ca3af; }

/* ===== SCHEDULE LIST ===== */
.schedule-list-panel { display: flex; flex-direction: column; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-tag { font-size: 0.72rem; padding: 4px 10px; background: #f3f4f6; border-radius: 8px; color: #6b7280; font-weight: 500; }
.panel-header-actions { display: flex; gap: 8px; }
.select-modern-sm { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.78rem; color: #374151; background: #fff; outline: none; cursor: pointer; }

.schedule-items { padding: 8px; }
.schedule-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #f3f4f6; border-radius: 12px; margin-bottom: 6px; transition: all 0.15s; }
.schedule-item:hover { background: #f9fafb; }
.schedule-item-main { display: flex; align-items: center; gap: 12px; }
.schedule-item-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; }
.schedule-item-title { font-size: 0.85rem; font-weight: 600; color: #111827; }
.schedule-item-details { display: flex; gap: 12px; margin-top: 4px; font-size: 0.72rem; color: #6b7280; }
.schedule-item-details span { display: flex; align-items: center; gap: 3px; }
.schedule-item-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }

/* ===== TABLE ===== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; color: #6b7280; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.table-footer-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; font-size: 0.75rem; color: #6b7280; }

.course-dot { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.7rem; flex-shrink: 0; }
.avatar-sm { width: 28px; height: 28px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: #374151; flex-shrink: 0; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ===== LOADING / EMPTY ===== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.empty-state { text-align: center; padding: 40px; color: #9ca3af; }

/* ===== MODAL ===== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; }
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-item { padding: 12px; background: #f9fafb; border-radius: 10px; display: flex; flex-direction: column; gap: 4px; }
.detail-item-full { grid-column: span 2; }
.detail-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
.detail-value { font-size: 0.85rem; font-weight: 500; color: #111827; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

@media (max-width: 768px) { .calendar-grid { grid-template-columns: 1fr; } }
</style>