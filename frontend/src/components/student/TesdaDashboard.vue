<template>
  <StudentLayoutTesda active-page="dashboard">
    <template #header-left>
      <div class="flex items-center gap-3 w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search sessions..."
          class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
        />
        <button
          @click="fetchDashboard"
          class="px-4 py-2 rounded-md text-sm font-semibold shadow-sm border bg-blue-700 text-white border-blue-700 hover:bg-blue-800"
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
          <h2 class="text-lg font-bold text-blue-800">📊 TESDA Student Dashboard</h2>
          <p class="text-sm text-gray-500 mb-6">Welcome, <span class="font-semibold">{{ studentName }}</span></p>
        </div>
      </div>

      <!-- ── KPI Cards ── -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">

        <!-- Currently Enrolled -->
        <div
          class="bg-yellow-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center cursor-pointer"
        >
          <div class="flex items-center justify-between w-full">
            <div class="min-w-0 mr-3">
              <h3 class="text-3xl font-bold text-yellow-800">{{ stats.enrolled }}</h3>
              <p class="text-yellow-700 font-medium mt-1">Enrolled / Active</p>
              <p class="text-[10px] leading-tight text-yellow-700 mt-1">
                {{ currentEnrollment
                    ? currentEnrollment.course_name + (currentEnrollment.course_code ? ' (' + currentEnrollment.course_code + ')' : '')
                    : 'No active enrollment' }}
              </p>
            </div>
            <div class="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">📚</span>
            </div>
          </div>
        </div>

        <!-- Total Reservations -->
        <div class="bg-blue-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center">
          <div class="flex items-center justify-between w-full">
            <div>
              <h3 class="text-3xl font-bold text-blue-800">{{ stats.total }}</h3>
              <p class="text-blue-700 font-medium mt-1">My Reservations</p>
              <p class="text-xs text-blue-700 mt-1">Pending: {{ stats.pending }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">🧾</span>
            </div>
          </div>
        </div>

        <!-- Upcoming Sessions -->
        <div class="bg-green-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center">
          <div class="flex items-center justify-between w-full">
            <div>
              <h3 class="text-3xl font-bold text-green-800">{{ upcomingCount }}</h3>
              <p class="text-green-700 font-medium mt-1">Upcoming Sessions</p>
              <p class="text-xs text-green-700 mt-1">Scheduled ahead</p>
            </div>
            <div class="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">📅</span>
            </div>
          </div>
        </div>

        <!-- Completed -->
        <div class="bg-purple-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow h-32 flex items-center">
          <div class="flex items-center justify-between w-full">
            <div>
              <h3 class="text-3xl font-bold text-purple-800">{{ stats.done }}</h3>
              <p class="text-purple-700 font-medium mt-1">Completed</p>
              <p class="text-xs text-purple-700 mt-1">Cancelled: {{ stats.cancelled }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center shrink-0">
              <span class="text-2xl">🏁</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ── Quick Links ── -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          @click="go('tesda-schedule')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-blue-800">📅 My Schedule</div>
          <div class="text-xs text-gray-500 mt-1">View upcoming sessions</div>
        </button>

        <button
          @click="go('/tesda-enrollment')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-blue-800">📋 Enroll in Courses</div>
          <div class="text-xs text-gray-500 mt-1">Browse available courses</div>
        </button>

        <button
          @click="go('tesda-certificate')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-blue-800">🎓 Certificates</div>
          <div class="text-xs text-gray-500 mt-1">View issued certificates</div>
        </button>

        <button
          @click="go('tesda-settings')"
          class="bg-white border border-gray-200 rounded-xl p-5 text-left shadow-sm hover:shadow transition"
        >
          <div class="text-sm text-gray-500">Quick Link</div>
          <div class="mt-1 font-semibold text-blue-800">👤 Profile</div>
          <div class="text-xs text-gray-500 mt-1">Manage your account</div>
        </button>
      </div>

      <!-- ── Attendance Section ── -->
      <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-md font-semibold text-blue-800">🗓️ Attendance</h3>
          <span class="text-xs bg-yellow-100 text-yellow-700 font-semibold px-3 py-1 rounded-full">Coming Soon</span>
        </div>

        <!-- Coming Soon State -->
        <div v-if="attendance.comingSoon" class="flex flex-col items-center justify-center py-8 text-center">
          <div class="text-5xl mb-3">🚧</div>
          <p class="text-gray-600 font-semibold text-sm">Attendance tracking is coming soon</p>
          <p class="text-gray-400 text-xs mt-1">Your session attendance will be tracked and displayed here once this feature is live.</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 w-full opacity-40 pointer-events-none select-none">
            <div class="border border-gray-200 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-gray-400">—</div>
              <div class="text-xs text-gray-400 mt-1">Total Sessions</div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-green-300">—</div>
              <div class="text-xs text-gray-400 mt-1">Present</div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-red-300">—</div>
              <div class="text-xs text-gray-400 mt-1">Absent</div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-blue-300">—%</div>
              <div class="text-xs text-gray-400 mt-1">Attendance Rate</div>
            </div>
          </div>
        </div>

        <!-- Live attendance data -->
        <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="border border-gray-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-gray-800">{{ attendance.totalSessions }}</div>
            <div class="text-xs text-gray-500 mt-1">Total Sessions</div>
          </div>
          <div class="border border-green-200 rounded-lg p-4 text-center bg-green-50">
            <div class="text-2xl font-bold text-green-700">{{ attendance.present }}</div>
            <div class="text-xs text-gray-500 mt-1">Present</div>
          </div>
          <div class="border border-red-200 rounded-lg p-4 text-center bg-red-50">
            <div class="text-2xl font-bold text-red-600">{{ attendance.absent }}</div>
            <div class="text-xs text-gray-500 mt-1">Absent</div>
          </div>
          <div class="border border-blue-200 rounded-lg p-4 text-center bg-blue-50">
            <div class="text-2xl font-bold text-blue-700">{{ attendance.rate }}%</div>
            <div class="text-xs text-gray-500 mt-1">Attendance Rate</div>
            <div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="attendance.rate >= 80 ? 'bg-green-500' : attendance.rate >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                :style="{ width: attendance.rate + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Upcoming Sessions Table ── -->
      <div class="overflow-x-auto mb-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-md font-semibold text-blue-800">📅 Upcoming Sessions</h3>
          <button @click="go('tesda-schedule')" class="text-blue-700 hover:text-blue-800 font-medium text-sm">
            View All →
          </button>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-blue-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Trainer</th>
              <th class="py-3 px-4 text-left font-medium">Date</th>
              <th class="py-3 px-4 text-left font-medium">Time</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUpcoming.length === 0">
              <td colspan="5" class="py-6 px-4 text-center text-gray-500">No upcoming sessions.</td>
            </tr>
            <tr
              v-for="u in filteredUpcoming"
              :key="u.id"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4 font-medium text-gray-800">
                {{ u.course_name || '—' }}
                <span v-if="u.course_code" class="ml-1 text-xs text-gray-400">({{ u.course_code }})</span>
              </td>
              <td class="py-3 px-4 text-gray-600">{{ u.trainer_name || '—' }}</td>
              <td class="py-3 px-4">{{ fmtDate(u.schedule_date) }}</td>
              <td class="py-3 px-4 text-gray-500">{{ fmtTime(u.start_time, u.end_time) }}</td>
              <td class="py-3 px-4">
                <span :class="statusPill(u.status)">{{ u.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Recent Activity ── -->
      <div class="overflow-x-auto mb-10">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-md font-semibold text-blue-800">🕒 Recent Activity</h3>
          <span class="text-xs text-gray-500">Showing {{ paginatedRecent.length }} of {{ filteredRecent.length }}</span>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-blue-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Schedule</th>
              <th class="py-3 px-4 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginatedRecent.length === 0">
              <td colspan="4" class="py-6 px-4 text-center text-gray-500">No activity found.</td>
            </tr>
            <tr
              v-for="r in paginatedRecent"
              :key="r.id"
              class="border-b hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4 font-medium text-gray-800">{{ r.course_name || '—' }}</td>
              <td class="py-3 px-4">
                <span :class="statusPill(r.status)">{{ r.status }}</span>
              </td>
              <td class="py-3 px-4">
                <div>{{ fmtDate(r.schedule_date) }}</div>
                <div class="text-xs text-gray-500">{{ fmtTime(r.start_time, r.end_time) }}</div>
              </td>
              <td class="py-3 px-4 text-gray-500">{{ fmtDateTime(r.created_at) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4">
          <div class="text-sm text-gray-600">Page {{ page }} / {{ totalPages }}</div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
              :disabled="page <= 1"
              @click="page--"
            >Prev</button>
            <button
              v-for="p in pagesToShow"
              :key="p"
              class="px-3 py-1 border rounded text-sm"
              :class="p === page ? 'bg-blue-700 text-white border-blue-700' : 'hover:bg-gray-50'"
              @click="page = p"
            >{{ p }}</button>
            <button
              class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm"
              :disabled="page >= totalPages"
              @click="page++"
            >Next</button>
          </div>
        </div>
      </div>

    </div>
  </StudentLayoutTesda>
</template>

<script>
import axios from 'axios'
import StudentLayoutTesda from './StudentLayoutTesda.vue'

export default {
  name: 'TesdaStudentDashboard',
  components: { StudentLayoutTesda },

  data() {
    return {
      searchQuery: '',
      page:        1,
      pageSize:    8,

      studentName:       'Student',
      userInitial:       'S',

      stats:             { total: 0, pending: 0, enrolled: 0, done: 0, cancelled: 0 },
      currentEnrollment: null,
      upcoming:          [],
      topCourses:        [],
      certificates:      { issued: 0 },
      attendance: {
        comingSoon:    true,
        totalSessions: 0,
        present:       0,
        absent:        0,
        rate:          0,
      },
      recent: [],
    }
  },

  computed: {
    upcomingCount() {
      return this.upcoming.length
    },

    filteredUpcoming() {
      if (!this.searchQuery) return this.upcoming
      const q = this.searchQuery.toLowerCase()
      return this.upcoming.filter(u =>
        (u.course_name  || '').toLowerCase().includes(q) ||
        (u.trainer_name || '').toLowerCase().includes(q) ||
        (u.status       || '').toLowerCase().includes(q)
      )
    },

    filteredRecent() {
      const q = (this.searchQuery || '').trim().toLowerCase()
      if (!q) return this.recent
      return this.recent.filter(r =>
        (r.course_name || '').toLowerCase().includes(q) ||
        (r.status      || '').toLowerCase().includes(q)
      )
    },

    totalPages() {
      const n = Math.ceil(this.filteredRecent.length / this.pageSize)
      return n <= 0 ? 1 : n
    },

    paginatedRecent() {
      const start = (this.page - 1) * this.pageSize
      return this.filteredRecent.slice(start, start + this.pageSize)
    },

    pagesToShow() {
      const total = this.totalPages
      const cur   = this.page
      const out   = []
      const a = Math.max(1, cur - 2)
      const b = Math.min(total, cur + 2)
      for (let i = a; i <= b; i++) out.push(i)
      return out
    },
  },

  watch: {
    searchQuery() { this.page = 1 },
    totalPages()  { if (this.page > this.totalPages) this.page = this.totalPages },
  },

  async mounted() {
    this.loadLocalUser()
    await this.fetchDashboard()
    // ✅ Same pattern as sidebar — listen for settings save event
    window.addEventListener('user-updated', this.handleUserUpdate)
  },

  beforeUnmount() {
    window.removeEventListener('user-updated', this.handleUserUpdate)
  },

  methods: {
    // ✅ Exact same pattern as StudentSidebar.vue
    handleUserUpdate(event) {
      const u = event.detail || {}
      if (u.fullname || u.username) {
        this.studentName = u.fullname || u.username || this.studentName
        this.userInitial = (this.studentName || 'S').charAt(0).toUpperCase()
      }
    },

    loadLocalUser() {
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        if (u.fullname || u.username) {
          this.studentName = u.fullname || u.username || this.studentName
          this.userInitial = (this.studentName || 'S').charAt(0).toUpperCase()
        }
      } catch (e) { /* ignore */ }
    },

    async fetchDashboard() {
      try {
        const res = await axios.get('/api/tesda/dashboard/summary', { withCredentials: true })
        if (res.data?.status !== 'success') return

        const d = res.data.data || {}
        const u = d.user || null

        // Update name from API response (freshest source)
        if (u?.fullname || u?.username) {
          this.studentName = u.fullname || u.username || this.studentName
          this.userInitial = (this.studentName || 'S').charAt(0).toUpperCase()
        }

        this.stats             = d.stats             || this.stats
        this.currentEnrollment = d.currentEnrollment || null
        this.upcoming          = d.upcoming          || []
        this.topCourses        = d.topCourses        || []
        this.certificates      = d.certificates      || this.certificates
        this.recent            = d.recent            || []

        if (d.attendance) {
          this.attendance = d.attendance
        }
      } catch (e) {
        console.error('fetchTesdaDashboard error:', e)
      }
    },

    go(path) {
      if (this.$router) this.$router.push(path)
    },

    // ✅ Matches StudentDashboard.vue formatDate exactly
    fmtDate(d) {
      if (!d) return '—'
      // Handle "YYYY-MM-DD" string without timezone shift
      const clean = String(d).substring(0, 10)
      const [y, m, day] = clean.split('-').map(Number)
      if (!y || !m || !day) return clean
      const dt = new Date(y, m - 1, day)
      return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
    },

    fmtDateTime(d) {
      if (!d) return '—'
      const dt = new Date(d)
      if (Number.isNaN(dt.getTime())) return String(d)
      return dt.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    },

    // ✅ Matches StudentDashboard.vue time display — "08:00 - 17:00"
    fmtTime(start, end) {
      if (!start && !end) return '—'
      const fmt = t => t ? String(t).slice(0, 5) : '?'
      return `${fmt(start)} - ${fmt(end)}`
    },

    statusPill(st) {
      const s = (st || '').toUpperCase()
      if (['CONFIRMED', 'APPROVED', 'ACTIVE', 'ENROLLED'].includes(s))
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700'
      if (s === 'PENDING')
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800'
      if (['DONE', 'COMPLETED', 'FINISHED'].includes(s))
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