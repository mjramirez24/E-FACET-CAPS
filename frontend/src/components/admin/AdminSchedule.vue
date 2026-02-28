<template>
  <AdminLayout>
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        placeholder="Search..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      />
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h2 class="text-lg font-bold text-green-800">📅 Schedule Management</h2>

          <div v-if="activeTrack === 'tesda'" class="text-xs text-gray-600 mt-1">
            TESDA is <b>batch-based</b>. System auto-assigns students to batches with capacity <b>25</b>.
            Admin does <b>not</b> set slots manually. You may create a batch even if start date is <b>TBA</b>.
          </div>
        </div>

        <button
          @click="openAddModal"
          class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          ➕ Add New Schedule
        </button>
      </div>

      <!-- ✅ Driving / TESDA Switch -->
      <div class="flex gap-2 mb-6">
        <button
          @click="switchTrack('driving')"
          class="px-4 py-2 rounded-md text-sm font-medium border"
          :class="
            activeTrack === 'driving'
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          "
        >
          🚗 Driving
        </button>

        <button
          @click="switchTrack('tesda')"
          class="px-4 py-2 rounded-md text-sm font-medium border"
          :class="
            activeTrack === 'tesda'
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          "
        >
          🧰 TESDA
        </button>
      </div>

      <!-- ========================= -->
      <!-- Schedule Calendar -->
      <!-- ========================= -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-green-800">📅 Schedule Overview</h3>

          <div class="flex gap-3 text-sm">
            <template v-if="activeTrack !== 'tesda'">
              <span class="flex items-center gap-1">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                Available: {{ availableSlots }}
              </span>
              <span class="flex items-center gap-1">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                Full: {{ fullDates }}
              </span>
            </template>

            <template v-else>
              <span class="flex items-center gap-1">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                Scheduled batches: {{ tesdaScheduledCount }}
              </span>
              <span class="flex items-center gap-1">
                <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
                TBA batches: {{ tesdaTbaCount }}
              </span>
            </template>
          </div>
        </div>

        <!-- ✅ TOP FILTERS (AFFECTS CALENDAR + LIST) -->
        <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
            <select
              v-model.number="selectedCourseId"
              class="w-56 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option :value="0">All Courses</option>
              <option v-for="c in topCourses" :key="c.id" :value="c.id">
                {{ c.course }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Filter by Month
              <span v-if="activeTrack==='tesda'" class="text-xs text-gray-500">(scheduled only)</span>
            </label>
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
              @click="fetchSchedules"
              class="px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          <div v-if="activeTrack==='tesda'" class="w-full text-xs text-gray-600">
            Calendar shows <b>scheduled batches only</b>. TBA batches are visible in the list below.
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
              'p-3 border rounded text-center cursor-pointer transition-colors relative',
              date.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
              date.isToday ? 'border-green-500' : 'border-gray-200',
              getDateClass(date),
            ]"
            @click="openDayModal(date.date)"
          >
            <div class="font-medium">{{ date.day }}</div>

            <!-- ✅ DRIVING: show slots like before -->
            <div v-if="activeTrack !== 'tesda' && date.slotCount !== null" class="text-xs mt-1">
              <span :class="date.slotCount === 0 ? 'text-red-600' : 'text-green-700'">
                {{ date.slotCount === 0 ? 'Full' : `${date.slotCount} Slots` }}
              </span>
            </div>

            <!-- ✅ TESDA: show batch start marker (not slots) -->
            <div
              v-if="activeTrack === 'tesda' && date.isTesdaStart"
              class="text-xs mt-1"
            >
              <span class="text-green-700 font-semibold">Batch Start</span>
            </div>

            <div v-if="activeTrack === 'tesda' && !date.isTesdaStart && date.isTesdaEnd" class="text-xs mt-1">
              <span class="text-gray-700 font-semibold">END</span>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="mt-4 flex gap-4 text-sm text-gray-600">
          <span class="flex items-center gap-2">
            <div class="w-3 h-3 bg-green-100 rounded"></div> Has schedule
          </span>
          <span class="flex items-center gap-2">
            <div class="w-3 h-3 border-2 border-green-500 rounded"></div> Today
          </span>

          <span v-if="activeTrack==='tesda'" class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-green-600"></div> Range day (dot)
          </span>
          <span v-if="activeTrack==='tesda'" class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-green-100 border-2 border-green-600"></div> Start day
          </span>
          <span v-if="activeTrack==='tesda'" class="flex items-center gap-2">
            <div class="w-3 h-3 rounded bg-gray-100 border-2 border-gray-400"></div> End day
          </span>
        </div>
      </div>

      <!-- ========================= -->
      <!-- Schedule List Filters + Pagination -->
      <!-- ========================= -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div class="p-4 border-b border-gray-200">
          <div class="flex flex-wrap gap-4 items-end justify-between">
            <div>
              <h3 class="text-lg font-bold text-green-800">🗂️ Schedule List</h3>
              <div class="text-sm text-gray-600">
                Showing {{ pagedSchedules.length }} of {{ filteredSchedules.length }} (Total Loaded: {{ schedules.length }})
              </div>
              <div class="text-xs text-gray-500 mt-1">
                *Top filters (Course/Month/Search) affects both Calendar + List.
              </div>

              <div v-if="activeTrack==='tesda'" class="text-xs text-gray-600 mt-1">
                TESDA is batch-based: <b>25 trainees per batch</b>. TBA batches are listed here.
              </div>
            </div>

            <div class="flex flex-wrap gap-3 items-end">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Course (List)</label>
                <select
                  v-model.number="listCourseFilter"
                  class="w-56 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option :value="0">All</option>
                  <option v-for="c in listCourses" :key="c.id" :value="c.id">
                    {{ c.course }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  v-model="listStatusFilter"
                  class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">All</option>
                  <option value="Open">Open</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                  <option value="TBA" v-if="activeTrack==='tesda'">TBA</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">
                  {{ activeTrack === "tesda" ? "Trainer" : "Instructor" }}
                </label>
                <input
                  v-model="listPersonFilter"
                  type="text"
                  placeholder="Name..."
                  class="w-56 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Rows</label>
                <select
                  v-model.number="pageSize"
                  class="w-24 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
              </div>

              <button
                @click="resetListFilters"
                class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead class="bg-green-800 text-white">
              <tr>
                <th class="py-3 px-4 text-left font-medium">Course</th>
                <th class="py-3 px-4 text-left font-medium">
                  {{ activeTrack==='tesda' ? 'Batch Range' : 'Date' }}
                </th>
                <th class="py-3 px-4 text-left font-medium">Time</th>
                <th class="py-3 px-4 text-left font-medium">
                  {{ activeTrack === "tesda" ? "Trainer" : "Instructor" }}
                </th>

                <th v-if="activeTrack !== 'tesda'" class="py-3 px-4 text-left font-medium">Slots</th>
                <th v-else class="py-3 px-4 text-left font-medium">Batch</th>

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
                  <div v-if="activeTrack==='tesda'" class="text-xs text-gray-500">
                    Duration: {{ getCourseDurationLabel(schedule) }}
                  </div>
                </td>

                <td class="py-3 px-4">
                  <div class="font-medium">
                    <template v-if="activeTrack!=='tesda'">
                      {{ formatDate(schedule.date) }}
                    </template>

                    <template v-else>
                      <template v-if="isTesdaScheduled(schedule)">
                        {{ formatDate(schedule.date) }} → {{ formatDate(getTesdaEndDate(schedule)) }}
                      </template>
                      <template v-else>
                        <span class="text-gray-700 font-semibold">TBA</span>
                        <span class="text-xs text-gray-500 ml-2">(pooling batch)</span>
                      </template>
                    </template>
                  </div>

                  <div v-if="activeTrack !== 'tesda'" class="text-xs text-gray-500">{{ schedule.day }}</div>
                  <div v-else class="text-xs text-gray-500">
                    {{ isTesdaScheduled(schedule) ? 'Batch scheduled' : 'Waiting for start date' }}
                  </div>
                </td>

                <td class="py-3 px-4">
                  <div class="font-medium">{{ schedule.startTime }} - {{ schedule.endTime }}</div>
                </td>

                <td class="py-3 px-4">
                  {{ schedule.instructor || (activeTrack==='tesda' ? '—' : '') }}
                </td>

                <td v-if="activeTrack !== 'tesda'" class="py-3 px-4">
                  <div>{{ schedule.availableSlots }} / {{ schedule.totalSlots }}</div>
                </td>

                <td v-else class="py-3 px-4">
                  <div class="font-semibold text-gray-800">
                    Batch {{ getTesdaBatchNo(schedule) }}
                  </div>
                  <div class="text-xs text-gray-600">
                    Enrollees: {{ getTesdaEnrolled(schedule) }}/25 • Remaining: {{ getTesdaRemaining(schedule) }}/25
                  </div>
                </td>

                <td class="py-3 px-4">
                  <span :class="getStatusClass(schedule)">
                    {{ schedule.computedStatus || (schedule.availableSlots === 0 ? "Full" : "Open") }}
                  </span>
                </td>

                <td class="py-3 px-4">
                  <button
                    @click="viewSchedule(schedule)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                  >
                    View
                  </button>
                  <button
                    @click="editSchedule(schedule)"
                    class="text-yellow-600 hover:text-yellow-800 text-sm font-medium mr-3"
                  >
                    Edit
                  </button>
                  <button
                    @click="confirmDelete(schedule)"
                    class="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>

              <tr v-if="pagedSchedules.length === 0">
                <td colspan="7" class="py-8 text-center text-gray-500">No schedules found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="p-4 border-t border-gray-200 flex flex-wrap gap-3 items-center justify-between">
          <div class="text-sm text-gray-600">
            Page {{ page }} of {{ totalPages }} ({{ filteredSchedules.length }} results)
          </div>

          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              :disabled="page <= 1"
              @click="page = 1"
            >
              ⏮ First
            </button>
            <button
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              :disabled="page <= 1"
              @click="page = page - 1"
            >
              ◀ Prev
            </button>

            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Go to</span>
              <input
                type="number"
                :min="1"
                :max="totalPages"
                v-model.number="pageJump"
                class="w-20 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                class="px-3 py-2 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50"
                :disabled="!pageJump || pageJump < 1 || pageJump > totalPages"
                @click="page = pageJump"
              >
                Go
              </button>
            </div>

            <button
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              :disabled="page >= totalPages"
              @click="page = page + 1"
            >
              Next ▶
            </button>
            <button
              class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              :disabled="page >= totalPages"
              @click="page = totalPages"
            >
              Last ⏭
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================= -->
    <!-- Day Details Modal (Calendar Click) -->
    <!-- ========================= -->
    <div v-if="showDayModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-lg font-bold text-green-800">📌 Schedules for {{ formatDate(dayModalDate) }}</h3>
              <div class="text-sm text-gray-600">
                {{ dayModalSchedules.length }} schedule(s) found
                <span v-if="selectedCourseId > 0" class="ml-2 text-xs text-gray-500">
                  (Top Course Filter applied)
                </span>
              </div>

              <div v-if="activeTrack==='tesda'" class="text-xs text-gray-500 mt-1">
                TESDA calendar shows scheduled batches only.
              </div>
            </div>
            <button @click="closeDayModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div v-if="dayModalSchedules.length === 0" class="py-10 text-center text-gray-500">
            Walang schedule sa date na ito (base sa current filters).
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
              <thead class="bg-green-800 text-white">
                <tr>
                  <th class="py-3 px-4 text-left font-medium">Course</th>
                  <th class="py-3 px-4 text-left font-medium">Time</th>
                  <th class="py-3 px-4 text-left font-medium">
                    {{ activeTrack === "tesda" ? "Trainer" : "Instructor" }}
                  </th>
                  <th class="py-3 px-4 text-left font-medium">
                    {{ activeTrack === 'tesda' ? 'Batch' : 'Slots' }}
                  </th>
                  <th class="py-3 px-4 text-left font-medium">Status</th>
                  <th class="py-3 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="s in dayModalSchedules"
                  :key="s.id || (s.date + '-' + s.startTime)"
                  class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td class="py-3 px-4">
                    <div class="font-medium">{{ s.course }}</div>
                    <div v-if="activeTrack==='tesda'" class="text-xs text-gray-500">
                      {{ formatDate(s.date) }} → {{ formatDate(getTesdaEndDate(s)) }}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-medium">{{ s.startTime }} - {{ s.endTime }}</div>
                  </td>
                  <td class="py-3 px-4">{{ s.instructor || (activeTrack==='tesda' ? '—' : '') }}</td>

                  <td class="py-3 px-4">
                    <template v-if="activeTrack !== 'tesda'">
                      {{ s.availableSlots }} / {{ s.totalSlots }}
                    </template>
                    <template v-else>
                      <div class="font-semibold">Batch {{ getTesdaBatchNo(s) }}</div>
                      <div class="text-xs text-gray-600">
                        Enrollees: {{ getTesdaEnrolled(s) }}/25 • Remaining: {{ getTesdaRemaining(s) }}/25
                      </div>
                    </template>
                  </td>

                  <td class="py-3 px-4">
                    <span :class="getStatusClass(s)">
                      {{ s.computedStatus || (s.availableSlots === 0 ? "Full" : "Open") }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <button
                      @click="viewSchedule(s)"
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                    >
                      View
                    </button>
                    <button
                      @click="editSchedule(s); closeDayModal()"
                      class="text-yellow-600 hover:text-yellow-800 text-sm font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(s); closeDayModal()"
                      class="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end mt-5">
            <button
              @click="closeDayModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================= -->
    <!-- Add/Edit Modal -->
    <!-- ========================= -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-green-800">
              {{ isEditing ? (activeTrack==='tesda' ? "Edit TESDA Batch" : "Edit Schedule") : (activeTrack==='tesda' ? "Add TESDA Batch" : "Add New Schedule") }}
            </h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <!-- ✅ BULK MODE (Driving only, create only) -->
          <div v-if="!isEditing && activeTrack === 'driving'" class="mb-5">
            <label class="block text-sm font-medium text-gray-700 mb-2">Create Mode</label>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                @click="createMode = 'single'"
                class="px-3 py-2 rounded-md border text-sm font-medium"
                :class="createMode === 'single'
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              >
                Single
              </button>
              <button
                type="button"
                @click="createMode = 'weekly'"
                class="px-3 py-2 rounded-md border text-sm font-medium"
                :class="createMode === 'weekly'
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              >
                Weekly
              </button>
              <button
                type="button"
                @click="createMode = 'monthly'"
                class="px-3 py-2 rounded-md border text-sm font-medium"
                :class="createMode === 'monthly'
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
              >
                Monthly
              </button>
            </div>
            <div class="mt-2 text-xs text-gray-500">
              Weekly/Monthly generates many dates and will create schedules automatically.
            </div>
          </div>

          <form @submit.prevent="saveSchedule">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  v-model.number="formData.course_id"
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="" disabled>Select a course</option>
                  <option v-for="c in coursesRaw" :key="c.id" :value="c.id">
                    {{ c.course_name }}
                  </option>
                </select>

                <p v-if="activeTrack==='tesda'" class="text-xs text-gray-600 mt-1">
                  TESDA batch capacity is fixed: <b>25 trainees per batch</b> (system-managed).
                </p>
              </div>

              <!-- ✅ DATE -->
              <div v-if="activeTrack !== 'tesda' && (isEditing || createMode === 'single')">
                <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  v-model="formData.schedule_date"
                  required
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <!-- ✅ TESDA: Start Date optional -->
              <div v-if="activeTrack === 'tesda'">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span class="text-xs text-gray-500">(optional / TBA)</span>
                </label>
                <input
                  type="date"
                  v-model="formData.schedule_date"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <div class="text-xs text-gray-500 mt-1">
                  Leave blank = batch is <b>TBA</b> (pooling). When date is set, it shows on calendar.
                  <span class="block mt-1 text-red-600">*TESDA training days are Monday–Saturday only (no Sundays).</span>
                </div>
              </div>

              <!-- BULK range (Driving only) -->
              <template v-if="!isEditing && activeTrack === 'driving' && createMode !== 'single'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    v-model="range.start"
                    required
                    class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    v-model="range.end"
                    required
                    class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </template>

              <!-- Instructor/Trainer -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ activeTrack === 'tesda' ? 'Trainer' : 'Instructor' }}
                  <span v-if="activeTrack==='tesda'" class="text-xs text-gray-500">(optional)</span>
                </label>

                <select
                  v-model.number="personId"
                  :required="activeTrack !== 'tesda'"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option :value="0">
                    {{ activeTrack === 'tesda' ? '— (none yet)' : 'Select instructor' }}
                  </option>
                  <option
                    v-for="p in instructors"
                    :key="activeTrack === 'tesda' ? p.trainer_id : p.instructor_id"
                    :value="activeTrack === 'tesda' ? p.trainer_id : p.instructor_id"
                  >
                    {{ p.firstname }} {{ p.lastname }}
                  </option>
                </select>
              </div>

              <!-- Time -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  v-model="formData.start_time"
                  required
                  :readonly="activeTrack === 'tesda'"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <p class="text-xs text-gray-500 mt-1">FACET hours: 08:00 - 17:00</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  v-model="formData.end_time"
                  required
                  :readonly="activeTrack === 'tesda'"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <!-- ✅ Total Slots: DRIVING only -->
              <div v-if="activeTrack !== 'tesda'" class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Total Slots</label>
                <input
                  type="number"
                  v-model.number="formData.total_slots"
                  required
                  min="1"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter total slots"
                />
              </div>

              <!-- ✅ TESDA: fixed capacity display -->
              <div v-else class="md:col-span-2">
                <div class="p-3 rounded-md border bg-gray-50 text-sm text-gray-700">
                  <b>TESDA batch capacity:</b> 25 trainees per batch (system-managed).
                </div>
              </div>

              <!-- ✅ TESDA computed range preview -->
              <div v-if="activeTrack==='tesda'" class="md:col-span-2">
                <div class="p-3 rounded-md border bg-gray-50 text-sm">
                  <div class="text-gray-700">
                    <b>TESDA Batch Range:</b>
                    <template v-if="formData.schedule_date">
                      {{ formatDate(formData.schedule_date) }} →
                      {{ formatDate(tesdaEndDateFromStart(formData.schedule_date, activeCourse?.duration)) }}
                    </template>
                    <template v-else>
                      <span class="font-semibold text-gray-700">TBA</span>
                    </template>
                  </div>
                  <div class="text-xs text-gray-600 mt-1">
                    Duration: {{ activeCourse?.duration || '—' }} hours (auto). Sundays are skipped.
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium disabled:opacity-60"
              >
                {{ saving ? "Saving..." : isEditing ? "Update" : "Save" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-md p-6">
        <div class="mb-4">
          <h3 class="text-lg font-bold text-red-600 mb-2">Confirm Deletion</h3>
          <p class="text-gray-600">
            Are you sure you want to delete schedule for
            <span class="font-semibold">{{ scheduleToDelete?.course }}</span>
            <template v-if="activeTrack !== 'tesda'">
              on <span class="font-semibold">{{ scheduleToDelete ? formatDate(scheduleToDelete.date) : "" }}</span>
            </template>
            <template v-else>
              <span class="font-semibold">
                ({{ scheduleToDelete?.date ? `Start ${formatDate(scheduleToDelete.date)}` : 'TBA batch' }})
              </span>
            </template>
            ?
          </p>
        </div>
        <div class="flex justify-end gap-2">
          <button
            @click="cancelDelete"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            @click="deleteSchedule"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-60"
          >
            {{ deleting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from "vue";
import AdminLayout from "./AdminLayout.vue";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

const toLocalYMD = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike || "");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const OPEN_TIME = "08:00";
const CLOSE_TIME = "17:00";

const timeToMins = (t) => {
  const [h, m] = String(t || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const addDaysYMD = (ymd, addDays) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + addDays);
  return toLocalYMD(d);
};

const withinFacetHours = (start, end) => {
  return (
    timeToMins(start) >= timeToMins(OPEN_TIME) &&
    timeToMins(end) <= timeToMins(CLOSE_TIME) &&
    timeToMins(end) > timeToMins(start)
  );
};

// TESDA batch constants
const TESDA_BATCH_CAP = 25;

// ===============================
// ✅ TESDA: duration -> training days (Mon–Sat), skipping Sundays
// IMPORTANT: order matters (avoid hoisting issues)
// ===============================
const TESDA_HOURS_PER_DAY = 9;

const parseDurationHours = (duration) => {
  const m = String(duration || "").match(/(\d+(?:\.\d+)?)/);
  const n = m ? Number(m[1]) : 0;
  return Number.isFinite(n) ? n : 0;
};

const tesdaDaysFromDuration = (duration) => {
  const totalHours = parseDurationHours(duration);
  return totalHours > 0 ? Math.max(1, Math.ceil(totalHours / TESDA_HOURS_PER_DAY)) : 1;
};

const isSundayYMD = (ymd) => {
  if (!ymd) return false;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getDay() === 0;
};

const isMonToSatYMD = (ymd) => {
  if (!ymd) return false;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay(); // 0..6
  return day >= 1 && day <= 6;
};

const addDaysSkipSundays = (startYmd, addTrainingDays) => {
  let d = new Date(`${startYmd}T00:00:00`);
  let added = 0;

  while (added < addTrainingDays) {
    d.setDate(d.getDate() + 1);
    const ymd = toLocalYMD(d);
    if (isMonToSatYMD(ymd)) added++;
  }
  return toLocalYMD(d);
};

const listTesdaTrainingDays = (startYmd, duration) => {
  if (!startYmd) return [];
  if (!isMonToSatYMD(startYmd)) return []; // start date must be Mon-Sat

  const daysNeeded = tesdaDaysFromDuration(duration); // ex: 3 days
  const out = [startYmd];

  let cur = startYmd;
  while (out.length < daysNeeded) {
    cur = addDaysSkipSundays(cur, 1); // next training day
    out.push(cur);
  }
  return out;
};

const tesdaEndDateFromStart = (startYmd, duration) => {
  if (!startYmd) return "";
  const days = listTesdaTrainingDays(startYmd, duration);
  return days.length ? days[days.length - 1] : "";
};

export default {
  name: "AdminSchedule",
  components: { AdminLayout },
  setup() {
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];

    const activeTrack = ref("driving"); // driving | tesda

    const schedules = ref([]);
    const coursesRaw = ref([]);
    const instructors = ref([]);

    const searchQuery = ref("");
    const selectedCourseId = ref(0);
    const selectedMonth = ref("");
    const currentYear = ref(new Date().getFullYear());
    const currentMonth = ref(new Date().getMonth());

    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const isEditing = ref(false);
    const scheduleToDelete = ref(null);

    const saving = ref(false);
    const deleting = ref(false);

    const showDayModal = ref(false);
    const dayModalDate = ref("");
    const dayModalSchedules = ref([]);

    const getScheduleId = (s) => {
      const raw = s?.id;
      const id = Number(String(raw ?? "").trim());
      return Number.isInteger(id) && id > 0 ? id : null;
    };

    const formData = reactive({
      id: null,
      course_id: "",
      instructor_id: "",
      trainer_id: "",
      schedule_date: "",
      start_time: OPEN_TIME,
      end_time: "12:00",
      total_slots: 10,
      status: "open",
    });

    const personId = computed({
      get() {
        return activeTrack.value === "tesda" ? formData.trainer_id : formData.instructor_id;
      },
      set(val) {
        if (activeTrack.value === "tesda") formData.trainer_id = val;
        else formData.instructor_id = val;
      },
    });

    // BULK MODE (Driving only)
    const createMode = ref("single");
    const range = reactive({
      start: toLocalYMD(new Date()),
      end: toLocalYMD(new Date()),
    });

    const listCourseFilter = ref(0);
    const listStatusFilter = ref("");
    const listPersonFilter = ref("");
    const page = ref(1);
    const pageJump = ref(1);
    const pageSize = ref(10);

    // endpoints
    const scheduleUrl = () => (activeTrack.value === "tesda" ? "/admin/tesda/schedules" : "/admin/schedules");
    const coursesUrl = () => (activeTrack.value === "tesda" ? "/admin/tesda/courses" : "/admin/courses");
    const peopleUrl = () => (activeTrack.value === "tesda" ? "/admin/tesda/trainers" : "/admin/instructors");

    const courseById = computed(() => {
      const m = new Map();
      for (const c of coursesRaw.value) m.set(Number(c.id), c);
      return m;
    });

    const activeCourse = computed(
      () => coursesRaw.value.find((c) => Number(c.id) === Number(formData.course_id)) || null
    );

    // TESDA scheduled check
    const isTesdaScheduled = (s) => {
      const d = String(s?.date || "").trim();
      return Boolean(d) && /^\d{4}-\d{2}-\d{2}$/.test(d);
    };

    const getCourseDurationLabel = (s) => {
      const c = courseById.value.get(Number(s.course_id));
      const dur = c?.duration;
      if (!dur) return "—";
      const n = parseDurationHours(dur);
      return n ? `${n} Hours` : String(dur);
    };

    const getTesdaEndDate = (s) => {
      if (!isTesdaScheduled(s)) return "";
      const c = courseById.value.get(Number(s.course_id));
      const start = String(s.date || "");
      return tesdaEndDateFromStart(start, c?.duration);
    };

    const scheduleCoversDate = (s, ymd) => {
      if (activeTrack.value !== "tesda") return String(s.date) === String(ymd);
      if (!isTesdaScheduled(s)) return false;

      // ✅ exclude Sundays from TESDA range display
      if (!isMonToSatYMD(ymd)) return false;

      const c = courseById.value.get(Number(s.course_id));
      const start = String(s.date || "");
      if (!start) return false;

      const days = listTesdaTrainingDays(start, c?.duration);
      return days.includes(String(ymd));
    };

    // TOP FILTERS (calendar + list)
    const baseFilteredSchedules = computed(() => {
      let result = [...schedules.value];

      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase().trim();
        result = result.filter((s) => {
          const dateText = isTesdaScheduled(s) ? String(s.date || "") : "TBA";
          return (
            String(s.course || "").toLowerCase().includes(q) ||
            String(s.instructor || "").toLowerCase().includes(q) ||
            String(s.day || "").toLowerCase().includes(q) ||
            dateText.toLowerCase().includes(q)
          );
        });
      }

      if (Number(selectedCourseId.value) > 0) {
        result = result.filter((s) => Number(s.course_id) === Number(selectedCourseId.value));
      }

      if (selectedMonth.value) {
        result = result.filter((s) => {
          if (activeTrack.value === "tesda" && !isTesdaScheduled(s)) return false;
          const d = new Date(String(s.date) + "T00:00:00");
          if (Number.isNaN(d.getTime())) return false;
          return months[d.getMonth()] === selectedMonth.value;
        });
      }

      return result;
    });

    const topCourses = computed(() => {
      const map = new Map();
      for (const s of schedules.value) {
        const cid = Number(s.course_id);
        if (!map.has(cid)) map.set(cid, { id: cid, course: s.course });
      }
      return Array.from(map.values()).sort((a, b) => a.course.localeCompare(b.course));
    });

    const listCourses = computed(() => {
      const map = new Map();
      for (const s of baseFilteredSchedules.value) {
        const cid = Number(s.course_id);
        if (!map.has(cid)) map.set(cid, { id: cid, course: s.course });
      }
      return Array.from(map.values()).sort((a, b) => a.course.localeCompare(b.course));
    });

    const filteredSchedules = computed(() => {
      let result = [...baseFilteredSchedules.value];

      if (Number(listCourseFilter.value) > 0) {
        result = result.filter((s) => Number(s.course_id) === Number(listCourseFilter.value));
      }

      if (listStatusFilter.value) {
        const want = String(listStatusFilter.value).toLowerCase();
        result = result.filter((s) => String(s.computedStatus || "").toLowerCase() === want);
      }

      if (listPersonFilter.value) {
        const q = listPersonFilter.value.toLowerCase().trim();
        result = result.filter((s) => String(s.instructor || "").toLowerCase().includes(q));
      }

      // sort: scheduled first, TBA last
      result.sort((a, b) => {
        const aSched = isTesdaScheduled(a) ? 1 : 0;
        const bSched = isTesdaScheduled(b) ? 1 : 0;
        if (aSched !== bSched) return bSched - aSched;
        const ad = String(a.date || "");
        const bd = String(b.date || "");
        if (ad !== bd) return bd.localeCompare(ad);
        return Number(a.id) - Number(b.id);
      });

      return result;
    });

    const totalPages = computed(() =>
      Math.max(1, Math.ceil(filteredSchedules.value.length / Number(pageSize.value || 10)))
    );

    watch([filteredSchedules, pageSize], () => {
      page.value = 1;
      pageJump.value = 1;
    });

    watch(totalPages, () => {
      if (page.value > totalPages.value) page.value = totalPages.value;
      if (pageJump.value > totalPages.value) pageJump.value = totalPages.value;
    });

    const pagedSchedules = computed(() => {
      const size = Number(pageSize.value || 10);
      const p = Number(page.value || 1);
      const start = (p - 1) * size;
      return filteredSchedules.value.slice(start, start + size);
    });

    const resetListFilters = () => {
      listCourseFilter.value = 0;
      listStatusFilter.value = "";
      listPersonFilter.value = "";
      page.value = 1;
      pageJump.value = 1;
      pageSize.value = 10;
    };

    // DRIVING counters
    const availableSlots = computed(() =>
      baseFilteredSchedules.value.filter((s) => Number(s.availableSlots) > 0).length
    );
    const fullDates = computed(() =>
      baseFilteredSchedules.value.filter((s) => Number(s.availableSlots) === 0).length
    );

    // TESDA counters
    const tesdaScheduledCount = computed(() =>
      schedules.value.filter((s) => isTesdaScheduled(s)).length
    );
    const tesdaTbaCount = computed(() =>
      schedules.value.filter((s) => !isTesdaScheduled(s)).length
    );

    // ✅ TESDA batch number (frontend fallback)
    const tesdaBatchNoByScheduleId = computed(() => {
      if (activeTrack.value !== "tesda") return new Map();

      const byCourse = new Map();
      for (const s of schedules.value) {
        const cid = Number(s.course_id);
        if (!byCourse.has(cid)) byCourse.set(cid, []);
        byCourse.get(cid).push(s);
      }

      const map = new Map();
      for (const [, arr] of byCourse.entries()) {
        const sorted = [...arr].sort((a, b) => Number(a.id) - Number(b.id));
        let idx = 1;
        for (const s of sorted) {
          map.set(Number(s.id), idx);
          idx++;
        }
      }
      return map;
    });

    const getTesdaBatchNo = (s) => {
      const b = Number(s?.batch_no || 0);
      if (b > 0) return b;
      const id = Number(s?.id || 0);
      return tesdaBatchNoByScheduleId.value.get(id) || 1;
    };

    const getTesdaEnrolled = (s) => {
      const total = Number(s.totalSlots || TESDA_BATCH_CAP) || TESDA_BATCH_CAP;
      const avail = Number(s.availableSlots ?? 0);
      const enrolled = Math.max(0, total - avail);
      return Math.min(TESDA_BATCH_CAP, enrolled);
    };

    const getTesdaRemaining = (s) => {
      const enrolled = getTesdaEnrolled(s);
      return Math.max(0, TESDA_BATCH_CAP - enrolled);
    };

    // CALENDAR
    const calendarDates = computed(() => {
      const year = currentYear.value;
      const month = currentMonth.value;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const firstDayIndex = firstDay.getDay();

      const dates = [];
      const prevMonthLastDay = new Date(year, month, 0).getDate();

      for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonthLastDay - i);
        dates.push({
          key: `prev-${i}`,
          day: prevMonthLastDay - i,
          date: d,
          isCurrentMonth: false,
          isToday: false,
          slotCount: null,
          isTesdaStart: false,
          isTesdaEnd: false,
          hasTesdaRange: false,
        });
      }

      const today = new Date();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const dStr = toLocalYMD(d);

        if (activeTrack.value !== "tesda") {
          const daySchedules = baseFilteredSchedules.value.filter((s) => String(s.date) === String(dStr));
          const uniq = new Map();
          for (const r of daySchedules) if (r?.id) uniq.set(r.id, r);
          const slotCount = Array.from(uniq.values()).reduce((sum, s) => sum + Number(s.availableSlots || 0), 0);

          dates.push({
            key: `current-${i}`,
            day: i,
            date: d,
            isCurrentMonth: true,
            isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
            slotCount: daySchedules.length > 0 ? slotCount : null,
            isTesdaStart: false,
            isTesdaEnd: false,
            hasTesdaRange: false,
          });
          continue;
        }

        // TESDA calendar: scheduled batches only
        const scheduled = baseFilteredSchedules.value.filter((s) => isTesdaScheduled(s));
        const inRange = scheduled.filter((s) => scheduleCoversDate(s, dStr));
        const startBatches = scheduled.filter((s) => String(s.date) === String(dStr));
        const endBatches = scheduled.filter((s) => {
          const end = getTesdaEndDate(s);
          return end === dStr && String(s.date) !== String(dStr);
        });

        dates.push({
          key: `current-${i}`,
          day: i,
          date: d,
          isCurrentMonth: true,
          isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
          slotCount: null,
          isTesdaStart: startBatches.length > 0,
          isTesdaEnd: endBatches.length > 0,
          hasTesdaRange: inRange.length > 0,
        });
      }

      const totalCells = 42;
      const nextMonthDays = totalCells - dates.length;
      for (let i = 1; i <= nextMonthDays; i++) {
        const d = new Date(year, month + 1, i);
        dates.push({
          key: `next-${i}`,
          day: i,
          date: d,
          isCurrentMonth: false,
          isToday: false,
          slotCount: null,
          isTesdaStart: false,
          isTesdaEnd: false,
          hasTesdaRange: false,
        });
      }

      return dates;
    });

    const currentMonthName = computed(() => months[currentMonth.value]);

    const formatDate = (ymd) => {
      if (!ymd) return "—";
      const d = new Date(String(ymd) + "T00:00:00");
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getDateClass = (dateCell) => {
      const dateStr = toLocalYMD(dateCell.date);
      const matched = baseFilteredSchedules.value.filter((s) => scheduleCoversDate(s, dateStr));
      if (matched.length === 0) return "";

      if (activeTrack.value !== "tesda") {
        const uniq = new Map();
        for (const r of matched) if (r?.id) uniq.set(r.id, r);
        const totalAvailable = Array.from(uniq.values()).reduce((sum, s) => sum + Number(s.availableSlots || 0), 0);
        return totalAvailable === 0 ? "bg-red-50" : "bg-green-50";
      }

      if (dateCell.isTesdaStart) return "bg-green-100 border-2 border-green-600";
      if (dateCell.isTesdaEnd) return "bg-gray-100 border-2 border-gray-400";
      return "tesda-dot tesda-dot-green";
    };

    const getStatusClass = (schedule) => {
      const status = schedule.computedStatus || (Number(schedule.availableSlots) === 0 ? "Full" : "Open");
      if (status === "Full") return "text-red-600 font-semibold";
      if (status === "Closed") return "text-gray-600 font-semibold";
      if (status === "TBA") return "text-gray-700 font-semibold";
      return "text-green-600 font-semibold";
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedCourseId.value = 0;
      selectedMonth.value = "";
      currentMonth.value = new Date().getMonth();
      currentYear.value = new Date().getFullYear();
      resetListFilters();
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

    const openDayModal = (dateObj) => {
      const dateStr = toLocalYMD(dateObj);
      dayModalDate.value = dateStr;

      const raw = baseFilteredSchedules.value.filter((s) => scheduleCoversDate(s, dateStr));
      const uniq = new Map();
      for (const r of raw) if (r?.id) uniq.set(r.id, r);

      const rows = Array.from(uniq.values()).sort((a, b) =>
        String(a.startTime || "").localeCompare(String(b.startTime || ""))
      );

      dayModalSchedules.value = rows;
      showDayModal.value = true;
    };

    const closeDayModal = () => {
      showDayModal.value = false;
      dayModalDate.value = "";
      dayModalSchedules.value = [];
    };

    // API CALLS
    const fetchCourses = async () => {
      const res = await api.get(coursesUrl());
      coursesRaw.value = Array.isArray(res.data?.data) ? res.data.data : [];
    };

    const fetchInstructors = async () => {
      const res = await api.get(peopleUrl());
      instructors.value = Array.isArray(res.data?.data) ? res.data.data : [];
    };

    const fetchSchedules = async () => {
      try {
        const res = await api.get(scheduleUrl());
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];

        schedules.value = rows
          .map((s) => {
            const idNum = Number(s.id);
            const fixedId = Number.isFinite(idNum) ? idNum : Number(String(s.id).trim());

            const rawDate = s.date ?? s.schedule_date ?? "";
            const dateStr = String(rawDate || "");
            const normalizedDate = dateStr && dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;

            const instructorName = String(s.instructor || "").trim();

            return {
              ...s,
              id: Number.isFinite(fixedId) && fixedId > 0 ? fixedId : null,
              course_id: Number(s.course_id),
              instructor_id: Number(s.instructor_id || 0),
              date: normalizedDate || "",
              instructor: instructorName || (activeTrack.value === "tesda" ? "" : instructorName),
              startTime: s.startTime || OPEN_TIME,
              endTime: s.endTime || CLOSE_TIME,
              totalSlots: Number(s.totalSlots ?? s.total_slots ?? (activeTrack.value === "tesda" ? TESDA_BATCH_CAP : 0)),
              availableSlots: Number(s.availableSlots ?? 0),
              computedStatus: s.computedStatus || s.scheduleStatus || "",
              batch_no: s.batch_no || null,
            };
          })
          .filter((s) => s.id);
      } catch (err) {
        console.error("fetchSchedules error:", err?.response?.data || err);
        alert(err?.response?.data?.message || err.message || "Failed to fetch schedules");
      }
    };

    // MODAL ACTIONS
    const resetForm = () => {
      formData.id = null;
      formData.course_id = "";
      formData.instructor_id = "";
      formData.trainer_id = "";
      formData.schedule_date = "";
      formData.start_time = OPEN_TIME;
      formData.end_time = activeTrack.value === "tesda" ? CLOSE_TIME : "12:00";
      formData.total_slots = activeTrack.value === "tesda" ? TESDA_BATCH_CAP : 10;
      formData.status = activeTrack.value === "tesda" ? "tba" : "open";
      createMode.value = "single";
      range.start = toLocalYMD(new Date());
      range.end = toLocalYMD(new Date());
    };

    const openAddModal = () => {
      isEditing.value = false;
      resetForm();
      showModal.value = true;
    };

    const editSchedule = (schedule) => {
      const id = getScheduleId(schedule);
      if (!id) {
        alert("Invalid schedule id. Please refresh.");
        return;
      }

      isEditing.value = true;

      formData.id = id;
      formData.course_id = Number(schedule.course_id);

      if (activeTrack.value === "tesda") {
        formData.trainer_id = Number(schedule.instructor_id || 0) || 0;
        formData.instructor_id = "";
      } else {
        formData.instructor_id = Number(schedule.instructor_id || 0);
        formData.trainer_id = "";
      }

      formData.schedule_date = String(schedule.date || "");
      formData.start_time = activeTrack.value === "tesda" ? OPEN_TIME : String(schedule.startTime);
      formData.end_time = activeTrack.value === "tesda" ? CLOSE_TIME : String(schedule.endTime);

      formData.total_slots = activeTrack.value === "tesda" ? TESDA_BATCH_CAP : Number(schedule.totalSlots);

      formData.status =
        schedule.scheduleStatus ||
        schedule.computedStatus ||
        (activeTrack.value === "tesda" ? (schedule.date ? "open" : "tba") : "open");

      showModal.value = true;
    };

    const viewSchedule = (schedule) => {
      if (activeTrack.value === "tesda") {
        const start = isTesdaScheduled(schedule) ? formatDate(schedule.date) : "TBA";
        const end = isTesdaScheduled(schedule) ? formatDate(getTesdaEndDate(schedule)) : "—";
        alert(
          `TESDA Batch\nCourse: ${schedule.course}\nBatch: ${getTesdaBatchNo(schedule)}\nStart: ${start}\nEnd: ${end}\nEnrollees: ${getTesdaEnrolled(schedule)}/25`
        );
        return;
      }
      alert(`View schedule: ${schedule.course} on ${formatDate(schedule.date)} (${schedule.startTime}-${schedule.endTime})`);
    };

    const closeModal = () => {
      showModal.value = false;
      resetForm();
    };

    const confirmDelete = (schedule) => {
      const id = getScheduleId(schedule);
      if (!id) {
        alert("Invalid schedule id from UI. Please refresh.");
        return;
      }
      scheduleToDelete.value = { ...schedule, id };
      showDeleteModal.value = true;
    };

    const cancelDelete = () => {
      scheduleToDelete.value = null;
      showDeleteModal.value = false;
    };

    // SAVE
    const saveSchedule = async () => {
      if (saving.value) return;

      const courseId = Number(formData.course_id);
      const selectedPersonId = Number(personId.value || 0);

      if (!courseId) return alert("Course is required");
      if (activeTrack.value !== "tesda" && !selectedPersonId) return alert("Instructor is required");

      // ✅ TESDA: block Sunday BEFORE API call
      if (activeTrack.value === "tesda" && formData.schedule_date) {
        const ymd = String(formData.schedule_date);
        if (!isMonToSatYMD(ymd)) {
          return alert("Bawal ang Sunday sa TESDA. Piliin ang Monday–Saturday.");
        }
      }

      const totalSlotsToSend = activeTrack.value === "tesda" ? TESDA_BATCH_CAP : Number(formData.total_slots);
      if (!Number.isFinite(totalSlotsToSend) || totalSlotsToSend < 1) {
        return alert("Total slots must be >= 1");
      }

      if (!withinFacetHours(formData.start_time, formData.end_time)) {
        return alert(`Invalid time. FACET hours only: ${OPEN_TIME} - ${CLOSE_TIME}.`);
      }

      saving.value = true;
      try {
        const base = {
          course_id: courseId,
          total_slots: totalSlotsToSend,
          status:
            activeTrack.value === "tesda"
              ? (formData.schedule_date ? "open" : "tba")
              : (formData.status || "open"),
        };

        if (activeTrack.value === "tesda") base.trainer_id = selectedPersonId || null;
        else base.instructor_id = selectedPersonId;

        const payload = {
          ...base,
          schedule_date:
            activeTrack.value === "tesda"
              ? (formData.schedule_date ? String(formData.schedule_date) : null)
              : String(formData.schedule_date),
          start_time: activeTrack.value === "tesda" ? OPEN_TIME : String(formData.start_time),
          end_time: activeTrack.value === "tesda" ? CLOSE_TIME : String(formData.end_time),
        };

        if (isEditing.value) {
          const id = parseInt(formData.id, 10);
          if (!Number.isInteger(id) || id < 1) {
            alert("Invalid schedule id (client). Please refresh and try again.");
            return;
          }
          await api.put(`${scheduleUrl()}/${id}`, payload);
        } else {
          await api.post(scheduleUrl(), payload);
        }

        await fetchSchedules();
        closeModal();
      } catch (err) {
        console.error("saveSchedule error:", err?.response?.data || err);
        alert(err?.response?.data?.message || err.message || "Failed to save schedule");
      } finally {
        saving.value = false;
      }
    };

    // DELETE
    const deleteSchedule = async () => {
      if (!scheduleToDelete.value || deleting.value) return;

      const id = getScheduleId(scheduleToDelete.value);
      if (!id) return alert("Invalid schedule id. Refresh and try again.");

      deleting.value = true;
      try {
        await api.delete(`${scheduleUrl()}/${id}`);
        await fetchSchedules();
        cancelDelete();
      } catch (err) {
        console.error("deleteSchedule error:", err?.response?.data || err);
        alert(err?.response?.data?.message || err.message || "Failed to delete schedule");
      } finally {
        deleting.value = false;
      }
    };

    const initForActiveTrack = async () => {
      selectedCourseId.value = 0;
      selectedMonth.value = "";
      listCourseFilter.value = 0;
      resetForm();
      resetListFilters();
      try {
        await Promise.all([fetchCourses(), fetchInstructors()]);
      } catch (e) {
        console.error("dropdown fetch error:", e);
      }
      await fetchSchedules();
    };

    const switchTrack = async (track) => {
      if (activeTrack.value === track) return;
      activeTrack.value = track;
      await initForActiveTrack();
    };

    onMounted(async () => {
      await initForActiveTrack();
    });

    return {
      months,
      activeTrack,
      switchTrack,

      schedules,
      coursesRaw,
      instructors,

      searchQuery,
      selectedCourseId,
      selectedMonth,
      topCourses,

      currentYear,
      currentMonth,

      showModal,
      showDeleteModal,
      isEditing,
      scheduleToDelete,

      showDayModal,
      dayModalDate,
      dayModalSchedules,
      openDayModal,
      closeDayModal,

      formData,
      personId,
      saving,
      deleting,

      filteredSchedules,
      pagedSchedules,
      availableSlots,
      fullDates,
      tesdaScheduledCount,
      tesdaTbaCount,
      calendarDates,
      currentMonthName,

      formatDate,
      getStatusClass,
      getDateClass,
      clearFilters,
      prevMonth,
      nextMonth,

      openAddModal,
      editSchedule,
      viewSchedule,
      closeModal,
      saveSchedule,

      confirmDelete,
      cancelDelete,
      deleteSchedule,

      fetchSchedules,

      createMode,
      range,

      listCourseFilter,
      listCourses,
      listStatusFilter,
      listPersonFilter,
      resetListFilters,
      page,
      pageJump,
      pageSize,
      totalPages,

      // TESDA helpers
      getTesdaEndDate,
      tesdaEndDateFromStart,
      activeCourse,
      isTesdaScheduled,
      getCourseDurationLabel,

      // TESDA batch UI helpers
      getTesdaBatchNo,
      getTesdaEnrolled,
      getTesdaRemaining,
    };
  },
};
</script>

<style scoped>
.tesda-dot::after {
  content: "";
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  border-radius: 999px;
}
.tesda-dot-green::after {
  background: #16a34a;
}
</style>