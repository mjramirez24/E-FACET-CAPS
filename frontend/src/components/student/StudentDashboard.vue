v<template>
  <StudentLayout active-page="dashboard">

    <template #header-left>
      <div class="flex items-center gap-3 w-full">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search sessions..."
          class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
        />
        <button
          @click="loadAll"
          class="px-4 py-2 rounded-md text-sm font-semibold shadow-sm border bg-green-700 text-white border-green-700 hover:bg-green-800"
          title="Refresh"
        >
          ↻ Refresh
        </button>
      </div>
    </template>

    <div>

      <!-- Title row -->
      <div class="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 class="text-lg font-bold text-green-800">📊 Student Dashboard</h2>
          <p class="text-sm text-gray-500 mb-6">Welcome, <span class="font-semibold">{{ studentName }}</span></p>
        </div>
        <div v-if="examLoading" class="text-xs text-gray-500 mt-1">Loading…</div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

        <div class="bg-yellow-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center cursor-pointer" @click="$router.push('/student-schedule')">
          <div class="flex items-center justify-between w-full">
            <div class="min-w-0 mr-3">
              <h3 class="text-3xl font-bold text-yellow-800">{{ activeReservation ? '1' : '0' }}</h3>
              <p class="text-yellow-700 font-medium mt-1">Active Reservation</p>
              <p class="text-[10px] leading-tight text-yellow-700 mt-1">{{ activeReservation ? activeReservation.course : 'No active reservation' }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <div class="bg-green-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center">
          <div class="flex items-center justify-between w-full">
            <div>
              <h3 class="text-3xl font-bold text-green-800">{{ examProgress.length }}</h3>
              <p class="text-green-700 font-medium mt-1">Quizzes Taken</p>
              <p class="text-xs text-green-700 mt-1">Mock exam attempts</p>
            </div>
            <div class="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center">
          <div class="flex items-center justify-between w-full">
            <div>
              <h3 class="text-3xl font-bold text-blue-800">{{ overallAvg }}%</h3>
              <p class="text-blue-700 font-medium mt-1">Average Score</p>
              <p class="text-xs text-blue-700 mt-1">Across all quizzes</p>
            </div>
            <div class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div class="bg-purple-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center">
          <div class="flex items-center justify-between w-full">
            <div>
              <h3 class="text-3xl font-bold text-purple-800">{{ passedCount }}</h3>
              <p class="text-purple-700 font-medium mt-1">Quizzes Passed</p>
              <p class="text-xs text-purple-700 mt-1">Score of 70% or above</p>
            </div>
            <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">🏆</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Quick Links ── -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          @click="$router.push('/student-quiz')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-green-800">📝 Mock Exams</div>
          <div class="text-xs text-gray-500 mt-1">Practice theory questions</div>
        </button>

        <button
          @click="$router.push('/student-enroll')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-green-800">📚 Enroll in Course</div>
          <div class="text-xs text-gray-500 mt-1">PDC-A, PDC-B, PDC-AB, TDC</div>
        </button>

        <button
          @click="$router.push('/student-schedule')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-green-800">📅 My Schedule</div>
          <div class="text-xs text-gray-500 mt-1">View upcoming sessions</div>
        </button>

        <button
          @click="$router.push('/student-certificates')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-green-800">🏆 Certificates</div>
          <div class="text-xs text-gray-500 mt-1">View earned certificates</div>
        </button>
      </div>

      <!-- ── Mock Exam Progress ── -->
      <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-md font-semibold text-green-800">📈 Mock Exam Progress</h3>
          <span class="text-xs text-gray-500">cumulative score per quiz</span>
        </div>

        <div v-if="examLoading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>

        <div v-else-if="examProgress.length === 0" class="text-sm text-gray-500 py-4 text-center">
          No quizzes taken yet.
          <button @click="$router.push('/student-quiz')" class="ml-2 text-green-700 underline font-medium">Start a quiz →</button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div
            v-for="item in examProgress"
            :key="item.exam_id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="text-sm font-semibold text-gray-800 truncate" :title="item.title">
              {{ item.title }}
            </div>
            <div
              class="text-2xl font-bold mt-2"
              :class="item.score >= 80 ? 'text-green-700' : item.score >= 60 ? 'text-yellow-600' : 'text-red-500'"
            >
              {{ item.score }}%
            </div>
            <div class="text-xs text-gray-500">{{ item.attempts }} attempt{{ item.attempts !== 1 ? 's' : '' }}</div>
            <div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                :style="{ width: item.score + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Available Courses ── -->
      <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-md font-semibold text-green-800">🚗 Available Courses</h3>
          <button @click="$router.push('/student-enroll')" class="text-green-700 hover:text-green-800 font-medium text-sm">
            View All →
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div
            v-for="course in courses"
            :key="course.id"
            @click="$router.push('/student-enroll')"
            class="border border-gray-200 rounded-lg p-4 hover:border-green-400 hover:shadow-sm transition cursor-pointer group"
          >
            <div class="flex items-center gap-1.5 mb-2">
              <span class="text-xs font-bold text-white bg-green-700 px-2 py-0.5 rounded">{{ course.code }}</span>
              <span class="text-[10px] text-green-600 font-semibold">● Active</span>
            </div>
            <div class="text-sm font-semibold text-gray-800 leading-snug">{{ course.name }}</div>
            <div v-if="course.subtitle" class="text-xs text-gray-500 mt-0.5">{{ course.subtitle }}</div>
            <div class="mt-3 space-y-1 text-xs text-gray-500">
              <div v-if="course.duration">⏱ {{ course.duration }}</div>
              <div class="font-bold text-green-700 text-sm">
                {{ course.fee > 0 ? '₱' + course.fee.toLocaleString() : 'See requirements' }}
              </div>
            </div>
            <div class="mt-3 text-xs text-green-700 font-semibold group-hover:underline">
              📋 View Requirements →
            </div>
          </div>
        </div>
      </div>

      <!-- ── My Sessions Table ── -->
      <div class="overflow-x-auto mb-10">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-md font-semibold text-green-800">My Sessions</h3>
          <button
            @click="$router.push('/student-schedule')"
            class="text-green-700 hover:text-green-800 font-medium text-sm"
          >
            View All →
          </button>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-green-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Instructor</th>
              <th class="py-3 px-4 text-left font-medium">Date</th>
              <th class="py-3 px-4 text-left font-medium">Time</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="session in filteredSessions"
              :key="session.id"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4 font-medium text-gray-800">{{ session.course }}</td>
              <td class="py-3 px-4 text-gray-600">{{ session.instructor || '—' }}</td>
              <td class="py-3 px-4">{{ formatDate(session.date) }}</td>
              <td class="py-3 px-4 text-gray-500">{{ session.time }}</td>
              <td class="py-3 px-4">
                <span :class="statusPill(session.status)">{{ session.status }}</span>
              </td>
              <td class="py-3 px-4">
                <button
                  @click="$router.push('/student-schedule')"
                  class="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                >
                  View Details
                </button>
              </td>
            </tr>
            <tr v-if="filteredSessions.length === 0">
              <td colspan="6" class="py-6 px-4 text-center text-gray-500">No sessions found.</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </StudentLayout>
</template>

<script>
import StudentLayout from './StudentLayout.vue'
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
})

const QUIZ_TITLES = {
  'quiz-0':  'Comprehensive',
  'quiz-1':  'Traffic Rules & Signs',
  'quiz-2':  'Safe Driving',
  'quiz-3':  'Licensing & Docs',
  'quiz-4':  'Violations & Penalties',
  'quiz-5':  'Vehicle Operations',
  'quiz-6':  'Emergency & Accidents',
  'quiz-7':  'Special Vehicles',
  'quiz-8':  'Driver Wellness',
  'quiz-9':  'Child Safety',
  'quiz-10': 'Vehicle Maintenance',
  'quiz-11': 'Weather & Conditions',
  'quiz-12': 'Right of Way',
  'quiz-13': 'Other Topics',
}

export default {
  name: 'StudentDashboard',
  components: { StudentLayout },

  data() {
    return {
      searchQuery:       '',
      studentName:       'Student',
      examLoading:       false,
      examProgress:      [],
      activeReservation: null,
      mySchedules:       [],

      courses:           [],
    }
  },

  computed: {
    filteredSessions() {
      if (!this.searchQuery) return this.mySchedules
      const q = this.searchQuery.toLowerCase()
      return this.mySchedules.filter(s =>
        (s.course || '').toLowerCase().includes(q) ||
        (s.instructor || '').toLowerCase().includes(q) ||
        (s.status || '').toLowerCase().includes(q)
      )
    },
    overallAvg() {
      if (!this.examProgress.length) return 0
      return Math.round(this.examProgress.reduce((s, r) => s + r.score, 0) / this.examProgress.length)
    },
    passedCount() {
      return this.examProgress.filter(r => r.score >= 70).length
    },
  },

  async mounted() {
    await this.fetchStudentName()
    await this.loadAll()
    window.addEventListener('user-updated', this.handleUserUpdate)
  },

  beforeUnmount() {
    window.removeEventListener('user-updated', this.handleUserUpdate)
  },

  methods: {
    // Fetch from server (same endpoint as sidebar) so name is always current
    async fetchStudentName() {
      try {
        const res = await api.get('/settings/profile')
        if (res.data?.status === 'success' && res.data?.profile) {
          this.studentName = res.data.profile.fullname || res.data.profile.username || 'Student'
        }
      } catch {
        try {
          const u = JSON.parse(localStorage.getItem('user') || '{}')
          this.studentName = u.fullname || u.name || u.username || 'Student'
        } catch { /* ignore */ }
      }
    },

    // Called when settings saves and dispatches 'user-updated' event
    handleUserUpdate(event) {
      const u = event.detail || {}
      this.studentName = u.fullname || u.username || this.studentName
    },

    async loadAll() {
      await Promise.all([
        this.fetchExamProgress(),
        this.fetchActiveReservation(),
        this.fetchMySchedule(),
        this.fetchCourses(),
      ])
    },

    async fetchCourses() {
      try {
        const res = await api.get('/student/courses')
        const raw = Array.isArray(res.data?.data) ? res.data.data : []
        // normalize fields to match what the template uses
        this.courses = raw.map(c => ({
          id:       c.id,
          code:     c.course_code,
          name:     c.course_name,
          subtitle: null,
          duration: c.duration || null,
          fee:      Number(c.course_fee || 0),
        }))
      } catch (err) {
        console.error('fetchCourses error:', err)
        this.courses = []
      }
    },

    async fetchMySchedule() {
      try {
        const res = await api.get('/student/my-schedule')
        this.mySchedules = res.data?.schedules || []
      } catch (err) {
        console.error('fetchMySchedule error:', err)
        this.mySchedules = []
      }
    },

    async fetchActiveReservation() {
      try {
        const res = await api.get('/student/reservations/active')
        this.activeReservation = res.data?.data || null
      } catch {
        this.activeReservation = null
      }
    },

    async fetchExamProgress() {
      this.examLoading = true
      try {
        const res = await api.get('/student/mock-exam/attempts')
        const { attempts = [], mastery = {} } = res.data?.data || {}
        if (!attempts.length) return

        const quizIds  = [...new Set(attempts.map(a => a.exam_id))]
        const progress = []

        quizIds.forEach(qid => {
          const quizAttempts = attempts.filter(a => a.exam_id === qid)
          const quizMastery  = mastery[qid] || {}
          const totalCorrect = Object.values(quizMastery).filter(v => v.correct).length
          const totalQ       = quizAttempts[0].total_questions || 0
          const score        = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0

          progress.push({
            exam_id:  qid,
            title:    QUIZ_TITLES[qid] || quizAttempts[0].exam_title || qid,
            score,
            attempts: quizAttempts.length,
          })
        })

        this.examProgress = progress.sort((a, b) => a.score - b.score)
      } catch (err) {
        console.error('fetchExamProgress error:', err)
      } finally {
        this.examLoading = false
      }
    },

    formatDate(dt) {
      if (!dt) return '—'
      return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    },

    statusPill(status) {
      const s = (status || '').toUpperCase()
      if (['CONFIRMED', 'APPROVED', 'ACTIVE'].includes(s))
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700'
      if (s === 'PENDING')
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800'
      if (s === 'DONE')
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700'
      if (s === 'CANCELLED')
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600'
      return 'px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600'
    },
  },
}
</script>

<style scoped>
button, input { transition: all 0.2s ease; }
</style>