<template>
  <StudentLayout active-page="dashboard">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" v-model="searchQuery" placeholder="Search sessions..." class="search-input-modern" />
        </div>
        <button @click="loadAll" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': examLoading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="dashboard-wrapper">
      <!-- Welcome Header -->
      <div class="dashboard-top">
        <div>
          <h2 class="dashboard-title">Student Dashboard</h2>
          <p class="dashboard-subtitle">Welcome back, <span class="font-semibold text-emerald-600">{{ studentName }}</span></p>
        </div>
        <div v-if="examLoading" class="status-badge status-loading">
          <div class="spinner-dot"></div>
          <span>Loading...</span>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-amber" @click="$router.push('/student-schedule')">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-amber">{{ activeReservation ? '1' : '0' }}</span>
              <span class="stat-label">Active Reservation</span>
              <span class="stat-meta">{{ activeReservation ? activeReservation.course : 'No active reservation' }}</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ examProgress.length }}</span>
              <span class="stat-label">Quizzes Taken</span>
              <span class="stat-meta">Mock exam attempts</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ overallAvg }}%</span>
              <span class="stat-label">Average Score</span>
              <span class="stat-meta">Across all quizzes</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-purple">{{ passedCount }}</span>
              <span class="stat-label">Quizzes Passed</span>
              <span class="stat-meta">Score of 70% or above</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="quick-actions">
        <button @click="$router.push('/student-quiz')" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Mock Exams</span>
        </button>
        <button @click="$router.push('/student-enroll')" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253"/></svg>
          <span>Enroll in Course</span>
        </button>
        <button @click="$router.push('/student-schedule')" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>My Schedule</span>
        </button>
        <button @click="$router.push('/student-certificates')" class="action-btn">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
          <span>Certificates</span>
        </button>
      </div>

      <!-- Mock Exam Progress -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Mock Exam Progress</h3>
            <p class="panel-meta">Cumulative score per quiz</p>
          </div>
        </div>
        <div v-if="examLoading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
          <p class="text-gray-500">Loading progress...</p>
        </div>
        <div v-else-if="examProgress.length === 0" class="empty-state">
          <p class="text-gray-500">No quizzes taken yet.</p>
          <button @click="$router.push('/student-quiz')" class="link-text mt-2">Start a quiz →</button>
        </div>
        <div v-else class="progress-grid">
          <div v-for="item in examProgress" :key="item.exam_id" class="progress-card">
            <div class="text-sm font-semibold text-gray-800 truncate" :title="item.title">{{ item.title }}</div>
            <div class="progress-score" :class="item.score >= 80 ? 'text-emerald-600' : item.score >= 60 ? 'text-amber-600' : 'text-red-500'">{{ item.score }}%</div>
            <div class="text-xs text-gray-500">{{ item.attempts }} attempt{{ item.attempts !== 1 ? 's' : '' }}</div>
            <div class="progress-bar">
              <div class="progress-fill" :class="item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-400' : 'bg-red-400'" :style="{ width: item.score + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Available Courses -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Available Courses</h3>
            <p class="panel-meta">Browse and enroll in driving courses</p>
          </div>
          <button @click="$router.push('/student-enroll')" class="link-text">View All →</button>
        </div>
        <div class="courses-grid">
          <div v-for="course in courses" :key="course.id" @click="$router.push('/student-enroll')" class="course-card">
            <div class="flex items-center gap-2 mb-2">
              <span class="course-code">{{ course.code }}</span>
              <span class="course-status">Active</span>
            </div>
            <div class="text-sm font-semibold text-gray-800 leading-snug">{{ course.name }}</div>
            <div v-if="course.subtitle" class="text-xs text-gray-500 mt-0.5">{{ course.subtitle }}</div>
            <div class="mt-3 space-y-1 text-xs text-gray-500">
              <div v-if="course.duration" class="flex items-center gap-1"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {{ course.duration }}</div>
              <div class="font-bold text-emerald-600 text-sm">{{ course.fee > 0 ? '₱' + course.fee.toLocaleString() : 'See requirements' }}</div>
            </div>
            <div class="mt-3 text-xs text-emerald-600 font-semibold course-link">View Requirements →</div>
          </div>
        </div>
      </div>

      <!-- My Sessions Table -->
      <div class="panel-card">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">My Sessions</h3>
            <p class="panel-meta">Upcoming and past training sessions</p>
          </div>
          <button @click="$router.push('/student-schedule')" class="link-text">View All →</button>
        </div>
        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr><th>Course</th><th>Instructor</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr v-for="session in filteredSessions" :key="session.id">
                <td class="font-medium">{{ session.course }}</td>
                <td>{{ session.instructor || '—' }}</td>
                <td>{{ formatDate(session.date) }}</td>
                <td class="text-gray-500">{{ session.time }}</td>
                <td><span :class="statusPill(session.status)">{{ session.status }}</span></td>
                <td><button @click="$router.push('/student-schedule')" class="action-view">View Details</button></td>
              </tr>
              <tr v-if="filteredSessions.length === 0"><td colspan="6" class="empty-cell">No sessions found.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script>
import StudentLayout from './StudentLayout.vue'
import axios from 'axios'
import { API_URL } from "../../config/api"

const api = axios.create({ baseURL: API_URL, withCredentials: true })

const QUIZ_TITLES = {
  'quiz-0':'Comprehensive','quiz-1':'Traffic Rules & Signs','quiz-2':'Safe Driving',
  'quiz-3':'Licensing & Docs','quiz-4':'Violations & Penalties','quiz-5':'Vehicle Operations',
  'quiz-6':'Emergency & Accidents','quiz-7':'Special Vehicles','quiz-8':'Driver Wellness',
  'quiz-9':'Child Safety','quiz-10':'Vehicle Maintenance','quiz-11':'Weather & Conditions',
  'quiz-12':'Right of Way','quiz-13':'Other Topics',
}

export default {
  name: 'StudentDashboard',
  components: { StudentLayout },
  data() { return { searchQuery:'', studentName:'Student', examLoading:false, examProgress:[], activeReservation:null, mySchedules:[], courses:[] } },
  computed: {
    filteredSessions() { if(!this.searchQuery) return this.mySchedules; const q=this.searchQuery.toLowerCase(); return this.mySessions.filter(s=>(s.course||'').toLowerCase().includes(q)||(s.instructor||'').toLowerCase().includes(q)||(s.status||'').toLowerCase().includes(q)) },
    overallAvg() { if(!this.examProgress.length) return 0; return Math.round(this.examProgress.reduce((s,r)=>s+r.score,0)/this.examProgress.length) },
    passedCount() { return this.examProgress.filter(r=>r.score>=70).length },
  },
  async mounted() { await this.fetchStudentName(); await this.loadAll(); window.addEventListener('user-updated',this.handleUserUpdate) },
  beforeUnmount() { window.removeEventListener('user-updated',this.handleUserUpdate) },
  methods: {
    async fetchStudentName() { try { const res=await api.get('/settings/profile'); if(res.data?.status==='success'&&res.data?.profile){ this.studentName=res.data.profile.fullname||res.data.profile.username||'Student' } } catch { try { const u=JSON.parse(localStorage.getItem('user')||'{}'); this.studentName=u.fullname||u.name||u.username||'Student' } catch {} } },
    handleUserUpdate(event) { const u=event.detail||{}; this.studentName=u.fullname||u.username||this.studentName },
    async loadAll() { await Promise.all([this.fetchExamProgress(),this.fetchActiveReservation(),this.fetchMySchedule(),this.fetchCourses()]) },
    async fetchCourses() { try { const res=await api.get('/student/courses'); const raw=Array.isArray(res.data?.data)?res.data.data:[]; this.courses=raw.map(c=>({id:c.id,code:c.course_code,name:c.course_name,subtitle:null,duration:c.duration||null,fee:Number(c.course_fee||0)})) } catch(err) { console.error('fetchCourses error:',err); this.courses=[] } },
    async fetchMySchedule() { try { const res=await api.get('/student/my-schedule'); this.mySchedules=res.data?.schedules||[] } catch(err) { console.error('fetchMySchedule error:',err); this.mySchedules=[] } },
    async fetchActiveReservation() { try { const res=await api.get('/student/reservations/active'); this.activeReservation=res.data?.data||null } catch { this.activeReservation=null } },
    async fetchExamProgress() { this.examLoading=true; try { const res=await api.get('/student/mock-exam/attempts'); const {attempts=[],mastery={}}=res.data?.data||{}; if(!attempts.length){ this.examProgress=[]; return }; const getParentQuizId=(examId)=>String(examId||'').includes('||')?String(examId).split('||')[0]:String(examId); const parentQuizIds=[...new Set(attempts.map(a=>getParentQuizId(a.exam_id)))]; const progress=[]; parentQuizIds.forEach(parentId=>{ const relatedAttempts=attempts.filter(a=>getParentQuizId(a.exam_id)===parentId); const mainAttempts=relatedAttempts.filter(a=>!String(a.exam_id).includes('||')); const quizMastery=mastery[parentId]||{}; const totalCorrect=Object.values(quizMastery).filter(v=>v.correct).length; const totalQ=relatedAttempts.find(a=>Number(a.total_questions)>0)?.total_questions||0; const score=totalQ>0?Math.round((totalCorrect/totalQ)*100):0; const mainTitle=QUIZ_TITLES[parentId]||relatedAttempts[0]?.exam_title?.split('||')[0]||parentId; progress.push({exam_id:parentId,title:mainTitle,score,attempts:mainAttempts.length||relatedAttempts.length}) }); this.examProgress=progress.sort((a,b)=>a.score-b.score) } catch(err) { console.error('fetchExamProgress error:',err); this.examProgress=[] } finally { this.examLoading=false } },
    formatDate(dt) { if(!dt) return '—'; return new Date(dt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) },
    statusPill(status) { const s=(status||'').toUpperCase(); if(['CONFIRMED','APPROVED','ACTIVE'].includes(s)) return 'pill pill-green'; if(s==='PENDING') return 'pill pill-amber'; if(s==='DONE') return 'pill pill-blue'; if(s==='CANCELLED') return 'pill pill-red'; return 'pill pill-gray' },
  },
}
</script>

<style scoped>
/* ========== LAYOUT ========== */
.dashboard-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }
.dashboard-top { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.dashboard-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.dashboard-subtitle { font-size: 0.9rem; color: #6b7280; margin: 4px 0 0; }
.status-badge { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
.status-loading { background: #f3f4f6; color: #6b7280; }
.spinner-dot { width: 14px; height: 14px; border: 2px solid #d1d5db; border-top-color: #6b7280; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== HEADER ACTIONS ========== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }
.refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn:hover { background: #059669; transform: translateY(-1px); }
.refresh-icon { width: 16px; height: 16px; }
.spin-animation { animation: spin 1s linear infinite; }

/* ========== STATS ========== */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-meta { font-size: 0.72rem; color: #9ca3af; margin-top: 2px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }
.text-amber { color: #d97706; } .text-emerald { color: #059669; } .text-blue { color: #2563eb; } .text-purple { color: #7c3aed; }

/* ========== QUICK ACTIONS ========== */
.quick-actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.action-btn { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; font-size: 0.85rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.action-btn:hover { border-color: #10b981; color: #059669; background: #f9fafb; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; }
.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-meta { font-size: 0.78rem; color: #9ca3af; margin: 2px 0 0; }

/* ========== PROGRESS ========== */
.progress-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.progress-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
.progress-score { font-size: 1.75rem; font-weight: 700; margin-top: 8px; }
.progress-bar { margin-top: 8px; height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; transition: width 0.7s; }

/* ========== COURSES ========== */
.courses-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.course-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; cursor: pointer; transition: all 0.2s; }
.course-card:hover { border-color: #10b981; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.course-code { font-size: 0.7rem; font-weight: 700; color: #fff; background: #10b981; padding: 2px 8px; border-radius: 6px; }
.course-status { font-size: 0.65rem; font-weight: 600; color: #059669; }
.course-link { transition: all 0.2s; } .course-card:hover .course-link { text-decoration: underline; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; color: #6b7280; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.loading-state { text-align: center; padding: 30px; color: #9ca3af; }
.empty-state { text-align: center; padding: 30px; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ========== MISC ========== */
.link-text { font-size: 0.85rem; font-weight: 600; color: #059669; background: none; border: none; cursor: pointer; }
.link-text:hover { color: #047857; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #2563eb; }
</style>