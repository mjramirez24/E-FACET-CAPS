<template>
  <StudentLayout active-page="schedule">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search schedule..." class="search-input-modern" v-model="searchQuery" @input="handleSearch" />
        </div>
        <button @click="fetchMySchedule" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="schedule-wrapper">
      <div class="page-top">
        <h2 class="page-title">My Schedule</h2>
        <p class="page-subtitle">View and manage your training sessions</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info"><span class="stat-value text-emerald">{{ scheduleStats.totalClasses }}</span><span class="stat-label">Total Reservations</span></div>
            <div class="stat-icon stat-icon-green"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
          </div>
        </div>
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info"><span class="stat-value text-blue">{{ scheduleStats.thisWeek }}</span><span class="stat-label">This Week</span></div>
            <div class="stat-icon stat-icon-blue"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
          </div>
        </div>
        <div class="stat-card stat-card-amber">
          <div class="stat-card-inner">
            <div class="stat-info"><span class="stat-value text-amber">{{ scheduleStats.nextWeek }}</span><span class="stat-label">Next Week</span></div>
            <div class="stat-icon stat-icon-amber"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
          </div>
        </div>
        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info"><span class="stat-value text-purple">{{ scheduleStats.completed }}</span><span class="stat-label">Confirmed</span></div>
            <div class="stat-icon stat-icon-purple"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          </div>
        </div>
      </div>

      <!-- Calendar & Schedule Grid -->
      <div class="calendar-grid">
        <div class="panel-card calendar-panel">
          <div class="calendar-header">
            <button @click="prevMonth" class="cal-nav-btn">&lt;</button>
            <h3 class="cal-title">{{ currentMonth }} {{ currentYear }}</h3>
            <button @click="nextMonth" class="cal-nav-btn">&gt;</button>
          </div>
          <div class="cal-day-headers">
            <div v-for="day in daysOfWeek" :key="day" class="cal-day-header">{{ day.substring(0, 2) }}</div>
          </div>
          <div class="cal-days-grid">
            <div v-for="n in blankDays" :key="`blank-${n}`" class="cal-day cal-day-empty"></div>
            <div v-for="day in daysInMonth" :key="day" :class="['cal-day', hasScheduleForDay(day) ? 'cal-day-active' : '', selectedDay === day ? 'cal-day-selected' : '']" @click="selectDay(day)">{{ day }}</div>
          </div>
          <div class="cal-legend">
            <div class="cal-legend-item"><div class="cal-legend-dot cal-legend-dot-active"></div><span>Has reservation</span></div>
            <div class="cal-legend-item"><div class="cal-legend-dot cal-legend-dot-selected"></div><span>Selected day</span></div>
          </div>
        </div>

        <div class="panel-card schedule-list-panel">
          <div class="panel-header-bar">
            <h3 class="panel-title">Upcoming / Selected Day</h3>
            <span class="panel-tag">{{ selectedDay ? `${selectedMonth} ${selectedDay}, ${currentYear}` : 'Select a date' }}</span>
          </div>
          <div v-if="loading" class="loading-state"><svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><p class="text-gray-500">Loading...</p></div>
          <div v-else-if="upcomingClasses.length > 0" class="schedule-items">
            <div v-for="classItem in upcomingClasses" :key="classItem.id" class="schedule-item">
              <div class="schedule-item-main">
                <div class="schedule-item-icon" :class="getCourseColorClass(classItem.course)">{{ getCourseInitial(classItem.course) }}</div>
                <div class="schedule-item-info">
                  <h4 class="schedule-item-title">{{ classItem.course }}</h4>
                  <p class="schedule-item-meta">{{ classItem.course_code || '—' }}</p>
                  <div class="schedule-item-details">
                    <span><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> {{ classItem.instructor || '—' }}</span>
                    <span><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> {{ classItem.time || '—' }}</span>
                  </div>
                </div>
              </div>
              <div class="schedule-item-actions">
                <span :class="getClassStatusClass(classItem.status)">{{ classItem.status }}</span>
                <button @click="openDetails(classItem)" class="action-view-sm">Details</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state"><svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><p>No reservation on this date</p></div>
        </div>
      </div>

      <!-- Schedule Table -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">My Reserved Schedule</h3>
          <div class="panel-header-actions">
            <select v-model="filterCourse" class="select-modern-sm"><option value="all">All Courses</option><option v-for="course in uniqueCourses" :key="course" :value="course">{{ course }}</option></select>
            <select v-model="filterStatus" class="select-modern-sm"><option value="all">All Status</option><option value="CONFIRMED">CONFIRMED</option><option value="DONE">DONE</option><option value="CANCELLED">CANCELLED</option></select>
          </div>
        </div>
        <div v-if="loading" class="loading-state"><svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><p class="text-gray-500">Loading...</p></div>
        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green"><tr><th>Date</th><th>Time</th><th>Course</th><th>Instructor</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="schedule in paginatedSchedules" :key="schedule.id">
                <td><div class="font-medium">{{ formatDate(schedule.date) }}</div><div class="text-xs text-gray-400">{{ getDayName(schedule.date) }}</div></td>
                <td><span class="font-medium">{{ schedule.time || '—' }}</span></td>
                <td><div class="flex items-center gap-2"><div class="course-dot" :class="getCourseColorClass(schedule.course)">{{ getCourseInitial(schedule.course) }}</div><div><div class="font-medium">{{ schedule.course || '—' }}</div><div class="text-xs text-gray-400">{{ schedule.course_code || '—' }}</div></div></div></td>
                <td><div class="flex items-center gap-2"><div class="avatar-sm">{{ getInitials(schedule.instructor || 'NA') }}</div><span>{{ schedule.instructor || '—' }}</span></div></td>
                <td><span :class="getStatusClass(schedule.status)">{{ schedule.status }}</span></td>
                <td><button @click="openDetails(schedule)" class="action-view-sm">View</button></td>
              </tr>
              <tr v-if="filteredSchedules.length === 0"><td colspan="6" class="empty-cell">No schedule found</td></tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredSchedules.length > 0" class="pagination-bar">
          <span class="page-info">Showing {{ paginatedSchedules.length }} of {{ filteredSchedules.length }}</span>
          <div class="page-btns">
            <button @click="prevPage" :disabled="currentPage === 1" class="pg-btn" :class="{ 'pg-disabled': currentPage === 1 }">← Prev</button>
            <span class="pg-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button @click="nextPage" :disabled="currentPage === totalPages" class="pg-btn" :class="{ 'pg-disabled': currentPage === totalPages }">Next →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <transition name="modal-fade"><div v-if="detailsOpen" class="modal-overlay" @click.self="closeDetails"><transition name="modal-scale"><div class="modal-card">
      <div class="modal-head modal-head-green"><h3 class="modal-title">Schedule Details</h3><button class="modal-close-btn" @click="closeDetails"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button></div>
      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item"><span class="detail-label">Date</span><span class="detail-value">{{ formatDate(detailsItem?.date) }} ({{ getDayName(detailsItem?.date) }})</span></div>
          <div class="detail-item"><span class="detail-label">Time</span><span class="detail-value">{{ detailsItem?.time || '—' }}</span></div>
          <div class="detail-item"><span class="detail-label">Course</span><span class="detail-value">{{ detailsItem?.course || '—' }} {{ detailsItem?.course_code ? `(${detailsItem.course_code})` : '' }}</span></div>
          <div class="detail-item"><span class="detail-label">Instructor</span><span class="detail-value">{{ detailsItem?.instructor || '—' }}</span></div>
          <div class="detail-item"><span class="detail-label">Status</span><span :class="getStatusClass(detailsItem?.status)">{{ detailsItem?.status || '—' }}</span></div>
          <div class="detail-item"><span class="detail-label">Room</span><span class="detail-value">{{ detailsItem?.room || '—' }}</span></div>
          <div class="detail-item"><span class="detail-label">Payment</span><span class="detail-value">{{ detailsItem?.payment_method || '—' }}</span></div>
          <div class="detail-item detail-item-full"><span class="detail-label">Created</span><span class="detail-value">{{ formatDateTime(detailsItem?.created_at) }}</span></div>
        </div>
      </div>
      <div class="modal-foot"><button @click="closeDetails" class="btn-cancel">Close</button></div>
    </div></transition></div></transition>
  </StudentLayout>
</template>

<script>
import StudentLayout from "./StudentLayout.vue";
import axios from "axios";
import { API_URL } from "../../config/api";

const api = axios.create({ baseURL: API_URL, withCredentials: true });

export default {
  name: "StudentSchedule",
  components: { StudentLayout },
  data() { return { searchQuery:"", filterCourse:"all", filterStatus:"all", loading:false, currentPage:1, itemsPerPage:10, currentDate:new Date(), selectedDay:null, scheduleStats:{totalClasses:0,thisWeek:0,nextWeek:0,completed:0}, schedules:[], detailsOpen:false, detailsItem:null, daysOfWeek:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], months:["January","February","March","April","May","June","July","August","September","October","November","December"] }; },
  computed: {
    filteredSchedules() { let r=[...this.schedules]; const q=this.searchQuery.toLowerCase(); if(q) r=r.filter(s=>(s.course||'').toLowerCase().includes(q)||(s.instructor||'').toLowerCase().includes(q)||(s.time||'').toLowerCase().includes(q)||(s.status||'').toLowerCase().includes(q)||(s.raw_status||'').toLowerCase().includes(q)); if(this.filterCourse!=="all") r=r.filter(s=>s.course===this.filterCourse); if(this.filterStatus!=="all") r=r.filter(s=>String(s.status||'').toUpperCase()===this.filterStatus); r.sort((a,b)=>{const da=a.date?new Date(a.date+"T00:00:00"):new Date(0);const db=b.date?new Date(b.date+"T00:00:00"):new Date(0);if(da-db!==0)return da-db;return String(a.time||'').localeCompare(String(b.time||''))}); return r; },
    paginatedSchedules() { const s=(this.currentPage-1)*this.itemsPerPage; return this.filteredSchedules.slice(s,s+this.itemsPerPage); },
    totalPages() { return Math.max(1,Math.ceil(this.filteredSchedules.length/this.itemsPerPage)); },
    studentConfirmedSchedules() { const ok=new Set(["CONFIRMED"]); return this.schedules.filter(s=>ok.has(String(s.status||'').toUpperCase())); },
    upcomingClasses() { if(!this.selectedDay) return []; const y=this.currentDate.getFullYear(); const m=String(this.currentDate.getMonth()+1).padStart(2,'0'); const d=String(this.selectedDay).padStart(2,'0'); const ds=`${y}-${m}-${d}`; return this.studentConfirmedSchedules.filter(s=>s.date===ds); },
    uniqueCourses() { return [...new Set(this.schedules.map(s=>s.course).filter(Boolean))]; },
    currentMonth() { return this.months[this.currentDate.getMonth()]; },
    currentYear() { return this.currentDate.getFullYear(); },
    selectedMonth() { return this.currentMonth.substring(0,3); },
    daysInMonth() { return new Date(this.currentDate.getFullYear(),this.currentDate.getMonth()+1,0).getDate(); },
    blankDays() { return new Date(this.currentDate.getFullYear(),this.currentDate.getMonth(),1).getDay(); },
  },
  methods: {
    toStudentStatus(r) { const s=String(r||'').toUpperCase(); if(s==="CANCELLED") return "CANCELLED"; if(s==="DONE"||s==="COMPLETED") return "DONE"; if(s==="PENDING") return "CONFIRMED"; if(s==="APPROVED") return "CONFIRMED"; if(["CONFIRMED","ACTIVE"].includes(s)) return s; return "CONFIRMED"; },
    async fetchMySchedule() { try { this.loading=true; this.currentPage=1; const res=await api.get("/student/my-schedule"); const list=res.data?.schedules||res.data?.data||[]; this.schedules=list.map(x=>{const raw=String(x.status||'').toUpperCase(); return {id:x.id,date:x.date||null,time:x.time||"—",course:x.course||(x.course_id?`Course #${x.course_id}`:"—"),course_code:x.course_code||"",instructor:x.instructor||"—",raw_status:raw,status:this.toStudentStatus(raw),payment_method:x.payment_method||null,room:x.room||x.room_name||null,created_at:x.created_at||null}; }); this.updateScheduleStats(); } catch(err) { console.error("fetchMySchedule error:",err.response?.data||err); this.schedules=[]; this.updateScheduleStats(); } finally { this.loading=false; } },
    handleSearch() { this.currentPage=1; },
    openDetails(item) { this.detailsItem=item||null; this.detailsOpen=true; },
    closeDetails() { this.detailsOpen=false; this.detailsItem=null; },
    getInitials(name) { const s=String(name||'').trim(); if(!s||s==="—") return "NA"; return s.split(" ").map(n=>n[0]).join("").toUpperCase().substring(0,2); },
    getStatusClass(status) { const s=String(status||'').toUpperCase(); if(s==="CONFIRMED") return "pill pill-green"; if(s==="DONE") return "pill pill-blue"; if(s==="CANCELLED") return "pill pill-red"; return "pill pill-gray"; },
    getClassStatusClass(status) { const s=String(status||'').toUpperCase(); if(s==="CONFIRMED") return "badge badge-green"; if(s==="DONE") return "badge badge-blue"; if(s==="CANCELLED") return "badge badge-red"; return "badge badge-gray"; },
    getCourseColorClass(c) { const m={"Basic Driving":"bg-emerald-500","Traffic Rules":"bg-blue-500",Simulation:"bg-purple-500","Safety Orientation":"bg-amber-500","Road Signs":"bg-indigo-500","Night Driving":"bg-gray-600","Parallel Parking":"bg-pink-500","Highway Driving":"bg-red-500"}; return m[c]||"bg-emerald-500"; },
    getCourseInitial(c) { const m={"Basic Driving":"BD","Traffic Rules":"TR",Simulation:"SM","Safety Orientation":"SO","Road Signs":"RS","Night Driving":"ND","Parallel Parking":"PP","Highway Driving":"HD"}; return m[c]||"DR"; },
    formatDate(d) { if(!d) return "—"; const dt=new Date(d+"T00:00:00"); if(Number.isNaN(dt.getTime())) return "—"; return `${this.months[dt.getMonth()].substring(0,3)} ${dt.getDate()}, ${dt.getFullYear()}`; },
    formatDateTime(dt) { if(!dt) return "—"; const d=new Date(dt); if(Number.isNaN(d.getTime())) return String(dt); const hh=String(d.getHours()).padStart(2,'0'); const mm=String(d.getMinutes()).padStart(2,'0'); return `${this.months[d.getMonth()].substring(0,3)} ${d.getDate()}, ${d.getFullYear()} ${hh}:${mm}`; },
    getDayName(d) { if(!d) return "—"; const dt=new Date(d+"T00:00:00"); if(Number.isNaN(dt.getTime())) return "—"; return this.daysOfWeek[dt.getDay()]; },
    prevMonth() { this.currentDate=new Date(this.currentDate.getFullYear(),this.currentDate.getMonth()-1,1); this.selectedDay=null; },
    nextMonth() { this.currentDate=new Date(this.currentDate.getFullYear(),this.currentDate.getMonth()+1,1); this.selectedDay=null; },
    selectDay(day) { this.selectedDay=this.selectedDay===day?null:day; },
    hasScheduleForDay(day) { const y=this.currentDate.getFullYear(); const m=String(this.currentDate.getMonth()+1).padStart(2,'0'); const d=String(day).padStart(2,'0'); const ds=`${y}-${m}-${d}`; return this.studentConfirmedSchedules.some(s=>s.date===ds); },
    prevPage() { if(this.currentPage>1) this.currentPage--; },
    nextPage() { if(this.currentPage<this.totalPages) this.currentPage++; },
    updateScheduleStats() { const today=new Date(); const sot=new Date(today.getFullYear(),today.getMonth(),today.getDate()); const ow=new Date(sot.getTime()+7*86400000); const tw=new Date(sot.getTime()+14*86400000); this.scheduleStats.totalClasses=this.schedules.length; this.scheduleStats.thisWeek=this.schedules.filter(s=>{if(!s.date) return false; const d=new Date(s.date+"T00:00:00"); return d>=sot&&d<=ow; }).length; this.scheduleStats.nextWeek=this.schedules.filter(s=>{if(!s.date) return false; const d=new Date(s.date+"T00:00:00"); return d>ow&&d<=tw; }).length; this.scheduleStats.completed=this.studentConfirmedSchedules.length; },
  },
  async mounted() { this.selectedDay=new Date().getDate(); await this.fetchMySchedule(); },
};
</script>

<style scoped>
.schedule-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }
.page-top { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }
.refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn:hover { background: #059669; transform: translateY(-1px); }
.refresh-icon { width: 16px; height: 16px; }
.spin-animation { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }
.text-emerald { color: #059669; } .text-blue { color: #2563eb; } .text-amber { color: #d97706; } .text-purple { color: #7c3aed; }
.calendar-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.calendar-panel { padding: 16px; }
.calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.cal-nav-btn { padding: 6px 12px; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; cursor: pointer; font-weight: 600; color: #374151; }
.cal-nav-btn:hover { background: #f3f4f6; }
.cal-title { font-size: 0.95rem; font-weight: 700; color: #111827; }
.cal-day-headers { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 4px; }
.cal-day-header { font-size: 0.7rem; font-weight: 700; color: #059669; padding: 6px 0; }
.cal-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.cal-day { padding: 8px 4px; text-align: center; border-radius: 8px; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; color: #374151; }
.cal-day:hover { background: #f3f4f6; }
.cal-day-empty { cursor: default; }
.cal-day-active { background: #10b981; color: #fff; font-weight: 700; }
.cal-day-selected { background: #d1fae5; color: #059669; font-weight: 700; border: 2px solid #10b981; }
.cal-legend { display: flex; gap: 16px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e5e7eb; }
.cal-legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.7rem; color: #6b7280; }
.cal-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.cal-legend-dot-active { background: #10b981; }
.cal-legend-dot-selected { background: #d1fae5; border: 2px solid #10b981; }
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
.schedule-item-meta { font-size: 0.72rem; color: #9ca3af; }
.schedule-item-details { display: flex; gap: 12px; margin-top: 4px; font-size: 0.72rem; color: #6b7280; }
.schedule-item-details span { display: flex; align-items: center; gap: 3px; }
.schedule-item-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.badge { padding: 3px 10px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; }
.badge-green { background: #d1fae5; color: #059669; }
.badge-blue { background: #dbeafe; color: #2563eb; }
.badge-red { background: #fee2e2; color: #dc2626; }
.badge-gray { background: #f3f4f6; color: #6b7280; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.empty-state { text-align: center; padding: 40px; color: #9ca3af; }
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; color: #6b7280; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.course-dot { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.7rem; flex-shrink: 0; }
.avatar-sm { width: 28px; height: 28px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: #374151; flex-shrink: 0; }
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 0.8rem; color: #6b7280; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
.modal-head-green { background: #f0fdf4; }
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