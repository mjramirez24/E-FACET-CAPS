<template>
  <InstructorLayout active-page="schedule">
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        placeholder="Search..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      >
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-bold text-green-800">📅 Schedule</h2>

        <!-- Tabs -->
        <div class="flex gap-2">
          <button
            @click="activeTab = 'schedules'"
            :class="tabBtnClass(activeTab === 'schedules')"
          >
            Schedules
          </button>
          <button
            @click="activeTab = 'history'"
            :class="tabBtnClass(activeTab === 'history')"
          >
            History
          </button>
        </div>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMsg" class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {{ errorMsg }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        <p class="mt-3 text-gray-600">Loading...</p>
      </div>

      <!-- ===================== TAB: SCHEDULES ===================== -->
      <div v-else-if="activeTab === 'schedules'">
        <!-- Summary -->
        <div class="mb-4 p-3 rounded border border-gray-200 bg-gray-50 text-gray-700 text-sm">
          <div class="flex flex-wrap gap-6">
            <div><span class="font-semibold">Schedules:</span> {{ schedulesTotal }}</div>
            <div><span class="font-semibold">Loaded:</span> {{ schedules.length }}</div>
            <div><span class="font-semibold">After filters:</span> {{ filteredSchedules.length }}</div>
            <div><span class="font-semibold">Selected Month:</span> {{ selectedMonth || '(All)' }}</div>
            <div><span class="font-semibold">Selected Course:</span> {{ selectedCourse || '(All)' }}</div>
          </div>
        </div>

        <!-- Calendar -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-green-800">📅 Schedule Overview</h3>
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

          <!-- Filters -->
          <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
              <select
                v-model="selectedCourse"
                class="w-64 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">All Courses</option>
                <option v-for="c in uniqueCourses" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
              <select
                v-model="selectedMonth"
                class="w-40 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">All Months</option>
                <option v-for="month in months" :key="month" :value="month">
                  {{ month }}
                </option>
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
                @click="fetchSchedules()"
                class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          <!-- Calendar Navigation -->
          <div class="flex justify-between items-center mb-4">
            <button
              @click="prevMonth"
              class="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
            >
              ◀ Prev
            </button>
            <h3 class="text-lg font-semibold text-green-800">{{ currentMonthName }} {{ currentYear }}</h3>
            <button
              @click="nextMonth"
              class="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-medium"
            >
              Next ▶
            </button>
          </div>

          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600 mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="date in calendarDates"
              :key="date.key"
              :class="[
                'p-3 border rounded text-center cursor-pointer transition-colors',
                date.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
                date.isToday ? 'border-green-500' : 'border-gray-200',
                getDateClass(date.ymd)
              ]"
              @click="openDateModal(date.ymd)"
            >
              <div class="font-medium">{{ date.day }}</div>

              <div v-if="date.bookedSum !== null" class="text-xs mt-1">
                <span :class="date.isFull ? 'text-red-600' : 'text-green-700'">
                  {{ date.isFull ? 'Full' : `Booked ${date.bookedSum}` }}
                </span>
              </div>
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-4 flex gap-4 text-sm text-gray-600">
            <span class="flex items-center gap-2"><div class="w-3 h-3 bg-green-100 rounded"></div>Has slots</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 bg-red-100 rounded"></div>Full</span>
            <span class="flex items-center gap-2"><div class="w-3 h-3 border-2 border-green-500 rounded"></div>Today</span>
          </div>
        </div>

        <!-- Schedule Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-bold text-green-800">🗂️ Schedule List</h3>
            <div class="text-sm text-gray-600">
              Showing {{ pagedSchedules.length }} of {{ filteredSchedules.length }} schedules
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
              <thead class="bg-green-800 text-white">
                <tr>
                  <th class="py-3 px-4 text-left font-medium">Course</th>
                  <th class="py-3 px-4 text-left font-medium">Date</th>
                  <th class="py-3 px-4 text-left font-medium">Time</th>
                  <th class="py-3 px-4 text-left font-medium">Booked</th>
                  <th class="py-3 px-4 text-left font-medium">Status</th>
                  <th class="py-3 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="schedule in pagedSchedules"
                  :key="schedule.id"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="py-3 px-4">
                    <div class="font-medium">{{ schedule.course }}</div>
                    <div v-if="schedule.course_code" class="text-xs text-gray-500">{{ schedule.course_code }}</div>
                  </td>

                  <td class="py-3 px-4">
                    {{ formatDate(schedule.date) }}
                    <div class="text-xs text-gray-500">{{ schedule.day || '' }}</div>
                  </td>

                  <td class="py-3 px-4">
                    <div class="font-medium">{{ schedule.startTime }} - {{ schedule.endTime }}</div>
                  </td>

                  <td class="py-3 px-4">
                    <div class="font-medium">{{ schedule.booked }}</div>
                    <div class="text-xs text-gray-500" v-if="Number.isFinite(schedule.totalSlots)">
                      Total: {{ schedule.totalSlots }}
                    </div>
                  </td>

                  <td class="py-3 px-4">
                    <span :class="getStatusClassByBooked(schedule.booked, schedule.totalSlots)">
                      {{ getStatusLabelByBooked(schedule.booked, schedule.totalSlots) }}
                    </span>
                  </td>

                  <td class="py-3 px-4">
                    <button
                      @click="openScheduleModal(schedule)"
                      class="text-blue-600 hover:text-blue-800 text-sm font-semibold"
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

          <!-- Pagination -->
          <div v-if="filteredSchedules.length > 0" class="p-4 flex justify-between items-center border-t border-gray-200">
            <div class="text-sm text-gray-600">
              Page {{ page }} of {{ totalPages }} • {{ filteredSchedules.length }} items
            </div>

            <div class="flex items-center gap-2">
              <select v-model.number="pageSize" class="text-sm border rounded px-2 py-1">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>

              <button
                class="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                :disabled="page <= 1"
                @click="page--"
              >
                ← Prev
              </button>

              <button
                class="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                :disabled="page >= totalPages"
                @click="page++"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== TAB: HISTORY ===================== -->
      <div v-else>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-lg font-bold text-green-800">🕘 History</h3>

            <button
              @click="fetchHistory()"
              class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          <div class="p-4">
            <div class="text-sm text-gray-600 mb-3">
              Showing {{ history.length }} of {{ historyTotal }} history items
            </div>

            <div v-if="history.length === 0" class="py-10 text-center text-gray-500">
              No history yet.
            </div>

            <div v-else class="overflow-x-auto">
              <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
                <thead class="bg-gray-800 text-white">
                  <tr>
                    <th class="py-3 px-4 text-left font-medium">Course</th>
                    <th class="py-3 px-4 text-left font-medium">Date</th>
                    <th class="py-3 px-4 text-left font-medium">Time</th>
                    <th class="py-3 px-4 text-left font-medium">Booked</th>
                    <th class="py-3 px-4 text-left font-medium">Status</th>
                    <th class="py-3 px-4 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in history" :key="h.id" class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-4">
                      <div class="font-medium">{{ h.course }}</div>
                      <div v-if="h.course_code" class="text-xs text-gray-500">{{ h.course_code }}</div>
                    </td>
                    <td class="py-3 px-4">{{ formatDate(h.date) }}</td>
                    <td class="py-3 px-4">{{ h.startTime }} - {{ h.endTime }}</td>
                    <td class="py-3 px-4">{{ h.booked }} <span class="text-xs text-gray-500" v-if="Number.isFinite(h.totalSlots)">/ {{ h.totalSlots }}</span></td>
                    <td class="py-3 px-4">
                      <span class="text-green-700 font-semibold">DONE</span>
                    </td>
                    <td class="py-3 px-4">
                      <button
                        @click="openScheduleModal(h)"
                        class="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- History Pagination (server side) -->
            <div v-if="historyTotal > 0" class="mt-4 flex justify-between items-center">
              <div class="text-sm text-gray-600">
                Page {{ historyPage }} of {{ historyTotalPages }} • {{ historyTotal }} items
              </div>

              <div class="flex items-center gap-2">
                <select v-model.number="historyPageSize" class="text-sm border rounded px-2 py-1">
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                </select>

                <button
                  class="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  :disabled="historyPage <= 1"
                  @click="historyPage--"
                >
                  ← Prev
                </button>

                <button
                  class="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                  :disabled="historyPage >= historyTotalPages"
                  @click="historyPage++"
                >
                  Next →
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- ===================== DATE MODAL ===================== -->
    <div v-if="showDateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-green-800">Schedules for {{ formatDate(selectedDateYMD) }}</h3>
            <button @click="closeDateModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div v-if="dateSchedules.length === 0" class="text-gray-500 text-sm">
            No schedules for this date.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="s in dateSchedules"
              :key="s.id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex justify-between items-start gap-3">
                <div>
                  <div class="font-semibold text-gray-800">{{ s.course }}</div>
                  <div v-if="s.course_code" class="text-xs text-gray-500">{{ s.course_code }}</div>
                  <div class="text-sm text-gray-600 mt-1">{{ s.startTime }} - {{ s.endTime }}</div>
                  <div class="text-sm text-gray-600">Booked: {{ s.booked }} <span v-if="Number.isFinite(s.totalSlots)">/ {{ s.totalSlots }}</span></div>
                </div>

                <div class="text-right text-sm">
                  <div :class="getStatusClassByBooked(s.booked, s.totalSlots)">
                    {{ getStatusLabelByBooked(s.booked, s.totalSlots) }}
                  </div>

                  <button
                    class="mt-2 text-blue-600 hover:text-blue-800 font-semibold"
                    @click="openScheduleModal(s)"
                  >
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
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== SCHEDULE DETAILS MODAL ===================== -->
    <div v-if="showScheduleModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-green-800">Schedule Details</h3>
            <button @click="closeScheduleModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div class="space-y-2">
            <div><span class="font-semibold">Course:</span> {{ selectedSchedule.course }}</div>
            <div v-if="selectedSchedule.course_code">
              <span class="font-semibold">Code:</span> {{ selectedSchedule.course_code }}
            </div>
            <div><span class="font-semibold">Date:</span> {{ formatDate(selectedSchedule.date) }} <span class="text-gray-500">({{ selectedSchedule.day || '' }})</span></div>
            <div><span class="font-semibold">Time:</span> {{ selectedSchedule.startTime }} - {{ selectedSchedule.endTime }}</div>
            <div><span class="font-semibold">Booked:</span> {{ selectedSchedule.booked }} <span v-if="Number.isFinite(selectedSchedule.totalSlots)">/ {{ selectedSchedule.totalSlots }}</span></div>
            <div>
              <span class="font-semibold">Status:</span>
              <span :class="getStatusClassByBooked(selectedSchedule.booked, selectedSchedule.totalSlots)">
                {{ getStatusLabelByBooked(selectedSchedule.booked, selectedSchedule.totalSlots) }}
              </span>
            </div>
          </div>

          <div class="flex justify-end mt-6">
            <button
              @click="closeScheduleModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

  </InstructorLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import InstructorLayout from './InstructorLayout.vue'

export default {
  name: 'InstructorSchedule',
  components: { InstructorLayout },
  setup() {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const activeTab = ref('schedules')

    const schedules = ref([])
    const schedulesTotal = ref(0)

    const loading = ref(true)
    const errorMsg = ref('')

    const searchQuery = ref('')
    const selectedCourse = ref('')
    const selectedMonth = ref(months[new Date().getMonth()])
    const currentYear = ref(new Date().getFullYear())
    const currentMonth = ref(new Date().getMonth())

    // client pagination (for filtered list)
    const page = ref(1)
    const pageSize = ref(10)

    // history (server pagination)
    const history = ref([])
    const historyTotal = ref(0)
    const historyPage = ref(1)
    const historyPageSize = ref(10)

    // modals
    const showDateModal = ref(false)
    const selectedDateYMD = ref('')
    const dateSchedules = ref([])

    const showScheduleModal = ref(false)
    const selectedSchedule = ref({})

    // ---------- helpers: strict YYYY-MM-DD ----------
    const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))

    const safeDate = (val) => {
      if (!val) return null
      const s = String(val).trim()
      if (!s) return null

      // if already YYYY-MM-DD => build as local date safely
      if (isYMD(s)) {
        const [y, m, d] = s.split('-').map(Number)
        const dt = new Date(y, m - 1, d)
        return Number.isNaN(dt.getTime()) ? null : dt
      }

      // if "YYYY-MM-DD HH:mm:ss" => "YYYY-MM-DDTHH:mm:ss"
      const normalized = s.includes(' ') && !s.includes('T') ? s.replace(' ', 'T') : s
      const d = new Date(normalized)
      if (Number.isNaN(d.getTime())) return null
      return d
    }

    const toYMD = (val) => {
      if (!val) return ''
      const s = String(val).trim()
      if (isYMD(s)) return s

      // handle datetime strings
      if (s.includes('T')) return s.split('T')[0]
      if (s.includes(' ')) return s.split(' ')[0]

      const d = safeDate(s)
      if (!d) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }

    const formatDate = (val) => {
      const d = safeDate(val)
      if (!d) return '(No date)'
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const tabBtnClass = (active) => ([
      'px-3 py-2 rounded-md text-sm font-semibold border',
      active ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    ])

    const uniqueCourses = computed(() => {
      const set = new Set(schedules.value.map(s => s.course).filter(Boolean))
      return Array.from(set).sort((a, b) => a.localeCompare(b))
    })

    // filters (IMPORTANT: include DATE search too)
    const filteredSchedules = computed(() => {
      let result = [...schedules.value]

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase().trim()
        result = result.filter(s => {
          const ymd = String(s.date || '').toLowerCase()
          return (
            (s.course || '').toLowerCase().includes(q) ||
            (s.course_code || '').toLowerCase().includes(q) ||
            (s.day || '').toLowerCase().includes(q) ||
            ymd.includes(q)
          )
        })
      }

      if (selectedCourse.value) {
        result = result.filter(s => s.course === selectedCourse.value)
      }

      if (selectedMonth.value) {
        result = result.filter(s => {
          const d = safeDate(s.date)
          if (!d) return false
          return months[d.getMonth()] === selectedMonth.value
        })
      }

      // sort by date asc (closest upcoming first)
      result.sort((a, b) => {
        const da = safeDate(a.date)?.getTime() ?? 0
        const db = safeDate(b.date)?.getTime() ?? 0
        return da - db
      })

      return result
    })

    // pagination computed
    const totalPages = computed(() => Math.max(1, Math.ceil(filteredSchedules.value.length / pageSize.value)))
    const pagedSchedules = computed(() => {
      const start = (page.value - 1) * pageSize.value
      return filteredSchedules.value.slice(start, start + pageSize.value)
    })

    // status based on booked/total
    const getStatusLabelByBooked = (booked, total) => {
      const b = Number(booked) || 0
      const t = Number(total)
      if (!Number.isFinite(t) || t <= 0) return 'Open'
      return b >= t ? 'Full' : 'Open'
    }

    const getStatusClassByBooked = (booked, total) => {
      const label = getStatusLabelByBooked(booked, total)
      return label === 'Full' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'
    }

    // calendar stats
    const fullDates = computed(() => {
      const byDate = new Map()
      for (const s of schedules.value) {
        const ymd = toYMD(s.date)
        if (!ymd) continue
        const t = Number(s.totalSlots)
        const b = Number(s.booked) || 0
        const isFull = Number.isFinite(t) && t > 0 ? b >= t : false
        const arr = byDate.get(ymd) || []
        arr.push(isFull)
        byDate.set(ymd, arr)
      }
      let count = 0
      for (const arr of byDate.values()) {
        if (arr.length && arr.every(Boolean)) count++
      }
      return count
    })

    const hasSlotsDates = computed(() => {
      const byDate = new Map()
      for (const s of schedules.value) {
        const ymd = toYMD(s.date)
        if (!ymd) continue
        const t = Number(s.totalSlots)
        const b = Number(s.booked) || 0
        const hasSlots = Number.isFinite(t) && t > 0 ? b < t : true
        const arr = byDate.get(ymd) || []
        arr.push(hasSlots)
        byDate.set(ymd, arr)
      }
      let count = 0
      for (const arr of byDate.values()) {
        if (arr.length && arr.some(Boolean)) count++
      }
      return count
    })

    // calendar
    const calendarDates = computed(() => {
      const year = currentYear.value
      const month = currentMonth.value

      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const firstDayIndex = firstDay.getDay()

      const pad = (n) => String(n).padStart(2, '0')
      const makeYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

      const dates = []

      // previous month fillers
      const prevMonthLastDay = new Date(year, month, 0).getDate()
      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonthLastDay - i)
        dates.push({
          key: `prev-${i}`,
          day: prevMonthLastDay - i,
          ymd: makeYMD(d),
          isCurrentMonth: false,
          isToday: false,
          bookedSum: null,
          isFull: false
        })
      }

      // map schedules by date
      const byDate = new Map()
      for (const s of schedules.value) {
        const ymd = toYMD(s.date)
        if (!ymd) continue
        const arr = byDate.get(ymd) || []
        arr.push(s)
        byDate.set(ymd, arr)
      }

      const today = new Date()
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i)
        const ymd = makeYMD(d)
        const daySchedules = byDate.get(ymd) || []

        const bookedSum = daySchedules.length
          ? daySchedules.reduce((sum, s) => sum + (Number(s.booked) || 0), 0)
          : null

        const isFull = daySchedules.length
          ? daySchedules.every(s => {
              const t = Number(s.totalSlots)
              const b = Number(s.booked) || 0
              return Number.isFinite(t) && t > 0 ? b >= t : false
            })
          : false

        dates.push({
          key: `cur-${i}`,
          day: i,
          ymd,
          isCurrentMonth: true,
          isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
          bookedSum,
          isFull
        })
      }

      // next month fillers
      const totalCells = 42
      const nextMonthDays = totalCells - dates.length
      for (let i = 1; i <= nextMonthDays; i++) {
        const d = new Date(year, month + 1, i)
        dates.push({
          key: `next-${i}`,
          day: i,
          ymd: makeYMD(d),
          isCurrentMonth: false,
          isToday: false,
          bookedSum: null,
          isFull: false
        })
      }

      return dates
    })

    const currentMonthName = computed(() => months[currentMonth.value])

    const getDateClass = (ymd) => {
      if (!ymd) return ''
      const daySchedules = schedules.value.filter(s => toYMD(s.date) === ymd)
      if (!daySchedules.length) return ''

      const hasAnySlots = daySchedules.some(s => {
        const t = Number(s.totalSlots)
        const b = Number(s.booked) || 0
        return Number.isFinite(t) && t > 0 ? b < t : true
      })

      const allFull = daySchedules.every(s => {
        const t = Number(s.totalSlots)
        const b = Number(s.booked) || 0
        return Number.isFinite(t) && t > 0 ? b >= t : false
      })

      if (allFull) return 'bg-red-50'
      if (hasAnySlots) return 'bg-green-50'
      return ''
    }

    const clearFilters = () => {
      searchQuery.value = ''
      selectedCourse.value = ''
      selectedMonth.value = ''
      currentMonth.value = new Date().getMonth()
      currentYear.value = new Date().getFullYear()
      page.value = 1
    }

    const prevMonth = () => {
      if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
      else currentMonth.value--
    }

    const nextMonth = () => {
      if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
      else currentMonth.value++
    }

    // ✅ Calendar click should VIEW schedules via modal
    const openDateModal = (ymd) => {
      selectedDateYMD.value = ymd || ''
      dateSchedules.value = schedules.value
        .filter(s => toYMD(s.date) === ymd)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
      showDateModal.value = true
    }

    const closeDateModal = () => {
      showDateModal.value = false
      selectedDateYMD.value = ''
      dateSchedules.value = []
    }

    const openScheduleModal = (s) => {
      if (!s) return
      selectedSchedule.value = { ...s }
      showScheduleModal.value = true
    }

    const closeScheduleModal = () => {
      showScheduleModal.value = false
      selectedSchedule.value = {}
    }

    const fetchSchedules = async () => {
      loading.value = true
      errorMsg.value = ''
      try {
        // server paginated, but we can request a big limit to build calendar
        const res = await fetch(`/api/instructor/schedules/list?page=1&limit=200`, { credentials: 'include' })
        const json = await res.json().catch(() => ({}))

        if (!res.ok) {
          errorMsg.value = json?.debug || json?.message || `Request failed (${res.status})`
          schedules.value = []
          schedulesTotal.value = 0
          return
        }

        if (json.status === 'success') {
          schedulesTotal.value = Number(json.total || json.count || 0)

          schedules.value = (json.data || []).map(s => {
            const ymd = toYMD(s.date)
            const d = safeDate(ymd)
            const day = d ? d.toLocaleDateString('en-US', { weekday: 'short' }) : ''
            return {
              ...s,
              date: ymd || '',
              day,
              booked: Number(s.booked) || 0,
              totalSlots: Number.isFinite(Number(s.totalSlots)) ? Number(s.totalSlots) : Number(s.total_slots) || 0
            }
          })

          // If no schedule exists in current month, set month filter to All
          const curMonthName = months[new Date().getMonth()]
          const hasThisMonth = schedules.value.some(s => {
            const d = safeDate(s.date)
            return d ? months[d.getMonth()] === curMonthName : false
          })
          if (!hasThisMonth) selectedMonth.value = ''

          page.value = 1
        } else {
          errorMsg.value = json?.message || 'Server returned error'
          schedules.value = []
          schedulesTotal.value = 0
        }
      } catch (e) {
        errorMsg.value = e?.message || 'Network error'
        schedules.value = []
        schedulesTotal.value = 0
      } finally {
        loading.value = false
      }
    }

    const fetchHistory = async () => {
      errorMsg.value = ''
      try {
        const res = await fetch(`/api/instructor/schedules/history?page=${historyPage.value}&limit=${historyPageSize.value}`, {
          credentials: 'include'
        })
        const json = await res.json().catch(() => ({}))

        if (!res.ok) {
          history.value = []
          historyTotal.value = 0
          return
        }

        if (json.status === 'success') {
          historyTotal.value = Number(json.total || json.count || 0)
          history.value = (json.data || []).map(x => {
            const ymd = toYMD(x.date || x.schedule_date)
            const d = safeDate(ymd)
            const day = d ? d.toLocaleDateString('en-US', { weekday: 'short' }) : ''
            return {
              id: Number(x.id || x.schedule_id),
              course: x.course || x.course_name || '(unknown)',
              course_code: x.course_code || '',
              date: ymd || '',
              day,
              startTime: x.startTime || x.start_time || '',
              endTime: x.endTime || x.end_time || '',
              booked: Number(x.booked) || 0,
              totalSlots: Number(x.totalSlots || x.total_slots || 0),
              status: x.status || 'done'
            }
          })
        } else {
          history.value = []
          historyTotal.value = 0
        }
      } catch (e) {
        history.value = []
        historyTotal.value = 0
      }
    }

    const historyTotalPages = computed(() => Math.max(1, Math.ceil(historyTotal.value / historyPageSize.value)))

    watch([selectedCourse, selectedMonth, searchQuery, pageSize], () => { page.value = 1 })
    watch([historyPage, historyPageSize], () => { if (activeTab.value === 'history') fetchHistory() })
    watch(activeTab, (t) => { if (t === 'history') fetchHistory() })

    onMounted(async () => {
      await fetchSchedules()
      await fetchHistory()
    })

    return {
      months,
      activeTab,

      schedules,
      schedulesTotal,
      loading,
      errorMsg,

      searchQuery,
      selectedCourse,
      selectedMonth,
      currentYear,
      currentMonth,

      uniqueCourses,
      filteredSchedules,

      fullDates,
      hasSlotsDates,

      calendarDates,
      currentMonthName,
      getDateClass,
      openDateModal,
      closeDateModal,
      prevMonth,
      nextMonth,

      page,
      pageSize,
      totalPages,
      pagedSchedules,

      getStatusClassByBooked,
      getStatusLabelByBooked,

      fetchSchedules,
      clearFilters,

      history,
      historyTotal,
      historyPage,
      historyPageSize,
      historyTotalPages,
      fetchHistory,

      formatDate,
      tabBtnClass,

      // modals
      showDateModal,
      selectedDateYMD,
      dateSchedules,
      showScheduleModal,
      selectedSchedule,
      openScheduleModal,
      closeScheduleModal
    }
  }
}
</script>