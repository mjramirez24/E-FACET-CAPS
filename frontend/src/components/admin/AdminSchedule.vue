<template>
  <AdminLayout>
    <!-- Header -->
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
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
            <h2 class="page-title">Schedule Management</h2>
            <p class="page-subtitle">Manage driving and TESDA class schedules</p>
            <div v-if="activeTrack === 'tesda'" class="info-note mt-2">
              TESDA is <b>batch-based</b>. System auto-assigns students to batches with capacity <b>25</b>.
              Admin does <b>not</b> set slots manually. You may create a batch even if start date is <b>TBA</b>.
            </div>
          </div>

          <button @click="openAddModal" class="add-btn">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Schedule
          </button>
        </div>
      </div>

      <!-- Driving / TESDA Switch -->
      <div class="tab-group mb-5">
        <button
          @click="switchTrack('driving')"
          :class="['tab-btn', activeTrack === 'driving' ? 'tab-active-green' : 'tab-inactive']"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 11l2-4h10l2 4M3 16v-3a1 1 0 011-1h16a1 1 0 011 1v3" />
            <path d="M7 12h10l1 4H6l1-4z" />
            <circle cx="6" cy="17" r="2" fill="currentColor" />
            <circle cx="18" cy="17" r="2" fill="currentColor" />
          </svg>
          Driving
        </button>

        <button
          @click="switchTrack('tesda')"
          :class="['tab-btn', activeTrack === 'tesda' ? 'tab-active-blue' : 'tab-inactive']"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          TESDA
        </button>
      </div>

      <!-- ========================= -->
      <!-- Schedule Calendar -->
      <!-- ========================= -->
      <div class="panel-card mb-5" style="padding: 20px;">
        <div class="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h3 class="panel-title">📅 Schedule Overview</h3>

          <div class="flex gap-4 text-sm flex-wrap">
            <template v-if="activeTrack !== 'tesda'">
              <span class="legend-item">
                <span class="dot dot-green"></span>
                Available: {{ availableSlots }}
              </span>
              <span class="legend-item">
                <span class="dot dot-red"></span>
                Full: {{ fullDates }}
              </span>
            </template>

            <template v-else>
              <span class="legend-item">
                <span class="dot dot-green"></span>
                Scheduled batches: {{ tesdaScheduledCount }}
              </span>
              <span class="legend-item">
                <span class="dot dot-gray"></span>
                TBA batches: {{ tesdaTbaCount }}
              </span>
            </template>
          </div>
        </div>

        <!-- TOP FILTERS (AFFECTS CALENDAR + LIST) -->
        <div class="filters-panel mb-5">
          <div class="filter-field">
            <label class="filter-label">Course</label>
            <select v-model.number="selectedCourseId" class="select-modern-sm" style="width: 220px;">
              <option :value="0">All Courses</option>
              <option v-for="c in topCourses" :key="c.id" :value="c.id">{{ c.course }}</option>
            </select>
          </div>

          <div class="filter-field">
            <label class="filter-label">
              Month <span v-if="activeTrack==='tesda'" class="filter-note">(scheduled only)</span>
            </label>
            <select v-model="selectedMonth" class="select-modern-sm" style="width: 160px;">
              <option value="">All Months</option>
              <option v-for="month in months" :key="month" :value="month">{{ month }}</option>
            </select>
          </div>

          <button @click="clearFilters" class="pg-btn">Clear</button>
          <button @click="fetchSchedules" class="pg-btn pg-btn-accent">↻ Refresh</button>

          <div v-if="activeTrack==='tesda'" class="w-full info-note">
            Calendar shows <b>scheduled batches only</b>. TBA batches are visible in the list below.
          </div>
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
              getDateClass(date),
            ]"
            @click="openDayModal(date.date)"
          >
            <div class="cal-day-num">{{ date.day }}</div>

            <div v-if="activeTrack !== 'tesda' && date.slotCount !== null" class="cal-slot-info">
              <span :class="date.slotCount === 0 ? 'text-red-600' : 'text-green-700'">
                {{ date.slotCount === 0 ? 'Full' : `${date.slotCount}` }}
              </span>
            </div>

            <div v-if="activeTrack === 'tesda' && date.hasTesdaRange" class="cal-dot-wrap">
              <span
                :class="[
                  'cal-dot',
                  date.isTesdaStart ? 'cal-dot-start' : date.isTesdaEnd ? 'cal-dot-end' : 'cal-dot-mid'
                ]"
              ></span>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="calendar-legend">
          <span class="legend-item"><span class="legend-swatch legend-swatch-green"></span> Has schedule</span>
          <span class="legend-item"><span class="legend-swatch legend-swatch-today"></span> Today</span>
          <span v-if="activeTrack==='tesda'" class="legend-item"><span class="dot dot-green"></span> Range day (dot)</span>
          <span v-if="activeTrack==='tesda'" class="legend-item"><span class="legend-swatch legend-swatch-start"></span> Start day</span>
          <span v-if="activeTrack==='tesda'" class="legend-item"><span class="legend-swatch legend-swatch-end"></span> End day</span>
        </div>
      </div>

      <!-- ========================= -->
      <!-- Schedule List -->
      <!-- ========================= -->
      <div class="panel-card">
        <div class="panel-header-bar" style="align-items: flex-start; flex-direction: column; gap: 16px;">
          <div class="flex justify-between items-start w-full flex-wrap gap-4">
            <div>
              <h3 class="panel-title">🗂️ Schedule List</h3>
              <div class="text-sm text-gray-600 mt-1">
                Showing {{ pagedSchedules.length }} of {{ filteredSchedules.length }} (Total Loaded: {{ schedules.length }})
              </div>
              <div class="filter-note mt-1">*Top filters (Course/Month/Search) affects both Calendar + List.</div>
              <div v-if="activeTrack==='tesda'" class="info-note mt-1">
                TESDA is batch-based: <b>25 trainees per batch</b>. TBA batches are listed here.
              </div>
            </div>

            <div class="filters-panel" style="padding: 0; background: transparent; border: none;">
              <div class="filter-field">
                <label class="filter-label">Course (List)</label>
                <select v-model.number="listCourseFilter" class="select-modern-sm" style="width: 200px;">
                  <option :value="0">All</option>
                  <option v-for="c in listCourses" :key="c.id" :value="c.id">{{ c.course }}</option>
                </select>
              </div>

              <div class="filter-field">
                <label class="filter-label">Status</label>
                <select v-model="listStatusFilter" class="select-modern-sm">
                  <option value="">All</option>
                  <option value="Open">Open</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                  <option value="TBA" v-if="activeTrack==='tesda'">TBA</option>
                </select>
              </div>

              <div class="filter-field">
                <label class="filter-label">{{ activeTrack === "tesda" ? "Trainer" : "Instructor" }}</label>
                <input v-model="listPersonFilter" type="text" placeholder="Name..." class="date-input-modern" style="width: 180px;" />
              </div>

              <div class="filter-field">
                <label class="filter-label">Rows</label>
                <select v-model.number="pageSize" class="select-modern-sm" style="width: 90px;">
                  <option :value="5">5</option>
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                </select>
              </div>

              <button @click="resetListFilters" class="pg-btn" style="align-self: flex-end;">Reset</button>
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Course</th>
                <th>{{ activeTrack==='tesda' ? 'Batch Range' : 'Date' }}</th>
                <th>Time</th>
                <th>{{ activeTrack === "tesda" ? "Trainer" : "Instructor" }}</th>
                <th v-if="activeTrack !== 'tesda'">Slots</th>
                <th v-else>Batch</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="schedule in pagedSchedules"
                :key="schedule.groupKey || schedule.id"
              >
                <td>
                  <div class="font-medium">{{ schedule.course }}</div>
                  <div v-if="activeTrack==='tesda'" class="text-xs text-gray-400">
                    Duration: {{ getCourseDurationLabel(schedule) }}
                  </div>
                </td>

                <td>
                  <div class="font-medium">
                    <template v-if="activeTrack !== 'tesda'">
                      <template
                        v-if="Number(schedule.groupSessionCount || 1) > 1"
                      >
                        {{ formatDate(schedule.groupStartDate) }}
                        →
                        {{ formatDate(schedule.groupEndDate) }}

                        <div class="text-xs text-gray-400 mt-0.5">
                          {{ schedule.groupSessionCount }} Days
                        </div>
                      </template>

                      <template v-else>
                        {{ formatDate(schedule.date) }}
                      </template>
                    </template>
                    <template v-else>
                      <template v-if="isTesdaScheduled(schedule)">
                        {{ formatDate(schedule.date) }} → {{ formatDate(getTesdaEndDate(schedule)) }}
                      </template>
                      <template v-else>
                        <span class="font-semibold text-gray-700">TBA</span>
                        <span class="text-xs text-gray-400 ml-2">(pooling batch)</span>
                      </template>
                    </template>
                  </div>
                  <div v-if="activeTrack !== 'tesda'" class="text-xs text-gray-400">{{ schedule.day }}</div>
                  <div v-else class="text-xs text-gray-400">
                    {{ isTesdaScheduled(schedule) ? 'Batch scheduled' : 'Waiting for start date' }}
                  </div>
                </td>

                <td class="font-medium">{{ formatTime12(schedule.startTime) }} - {{ formatTime12(schedule.endTime) }}</td>
                <td>{{ schedule.instructor || (activeTrack==='tesda' ? '—' : '') }}</td>

                <td v-if="activeTrack !== 'tesda'">{{ schedule.availableSlots }} / {{ schedule.totalSlots }}</td>
                <td v-else>
                  <div class="font-semibold text-gray-800">Batch {{ getTesdaBatchNo(schedule) }}</div>
                  <div class="text-xs text-gray-500">
                    Enrollees: {{ getTesdaEnrolled(schedule) }}/25 • Remaining: {{ getTesdaRemaining(schedule) }}/25
                  </div>
                </td>

                <td>
                  <span class="pill" :class="getStatusClass(schedule)">
                    {{ schedule.computedStatus || (schedule.availableSlots === 0 ? "Full" : "Open") }}
                  </span>
                </td>

                <td class="whitespace-nowrap">
                  <div class="action-btns">
                    <button @click="viewSchedule(schedule)" class="action-view">View</button>
                    <button @click="editSchedule(schedule)" class="action-edit">Edit</button>
                    <button @click="confirmDelete(schedule)" class="action-delete">Delete</button>
                  </div>
                </td>
              </tr>

              <tr v-if="pagedSchedules.length === 0">
                <td colspan="7" class="empty-cell">No schedules found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-bar">
          <span class="page-info">Page {{ page }} of {{ totalPages }} ({{ filteredSchedules.length }} results)</span>

          <div class="page-btns">
            <button class="pg-btn" :class="{ 'pg-disabled': page <= 1 }" :disabled="page <= 1" @click="page = 1">⏮ First</button>
            <button class="pg-btn" :class="{ 'pg-disabled': page <= 1 }" :disabled="page <= 1" @click="page = page - 1">◀ Prev</button>

            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500">Go to</span>
              <input
                type="number"
                :min="1"
                :max="totalPages"
                v-model.number="pageJump"
                class="date-input-modern"
                style="width: 70px; padding: 7px 10px;"
              />
              <button
                class="pg-btn pg-btn-accent"
                :disabled="!pageJump || pageJump < 1 || pageJump > totalPages"
                @click="page = pageJump"
              >
                Go
              </button>
            </div>

            <button class="pg-btn" :class="{ 'pg-disabled': page >= totalPages }" :disabled="page >= totalPages" @click="page = page + 1">Next ▶</button>
            <button class="pg-btn" :class="{ 'pg-disabled': page >= totalPages }" :disabled="page >= totalPages" @click="page = totalPages">Last ⏭</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================= -->
    <!-- Day Details Modal -->
    <!-- ========================= -->
    <transition name="modal-fade">
      <div v-if="showDayModal" class="modal-overlay" @click.self="closeDayModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-xl">
            <div class="modal-head modal-head-green">
              <div>
                <h3 class="modal-title">📌 Schedules for {{ formatDate(dayModalDate) }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ dayModalSchedules.length }} schedule(s) found
                  <span v-if="selectedCourseId > 0" class="ml-1">(Top Course Filter applied)</span>
                </p>
                <p v-if="activeTrack==='tesda'" class="text-xs text-gray-400 mt-0.5">
                  TESDA calendar shows scheduled batches only.
                </p>
              </div>
              <button class="modal-close-btn" @click="closeDayModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body-scroll">
              <div v-if="dayModalSchedules.length === 0" class="empty-cell" style="padding: 40px;">
                Walang schedule sa date na ito (base sa current filters).
              </div>

              <div v-else class="table-wrap" style="padding: 0 4px;">
                <table class="modern-table">
                  <thead class="thead-green">
                    <tr>
                      <th>Course</th>
                      <th>Time</th>
                      <th>{{ activeTrack === "tesda" ? "Trainer" : "Instructor" }}</th>
                      <th>{{ activeTrack === 'tesda' ? 'Batch' : 'Slots' }}</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in dayModalSchedules" :key="s.id || (s.date + '-' + s.startTime)">
                      <td>
                        <div class="font-medium">{{ s.course }}</div>
                        <div v-if="activeTrack==='tesda'" class="text-xs text-gray-400">
                          {{ formatDate(s.date) }} → {{ formatDate(getTesdaEndDate(s)) }}
                        </div>
                      </td>
                      <td class="font-medium">{{ $formatTimeRange12(s.startTime, s.endTime) }}</td>
                      <td>{{ s.instructor || (activeTrack==='tesda' ? '—' : '') }}</td>

                      <td>
                        <template v-if="activeTrack !== 'tesda'">{{ s.availableSlots }} / {{ s.totalSlots }}</template>
                        <template v-else>
                          <div class="font-semibold">Batch {{ getTesdaBatchNo(s) }}</div>
                          <div class="text-xs text-gray-500">
                            Enrollees: {{ getTesdaEnrolled(s) }}/25 • Remaining: {{ getTesdaRemaining(s) }}/25
                          </div>
                        </template>
                      </td>

                      <td>
                        <span class="pill" :class="getStatusClass(s)">
                          {{ s.computedStatus || (s.availableSlots === 0 ? "Full" : "Open") }}
                        </span>
                      </td>
                      <td class="whitespace-nowrap">
                        <div class="action-btns">
                          <button @click="viewSchedule(s)" class="action-view">View</button>
                          <button @click="editSchedule(s); closeDayModal()" class="action-edit">Edit</button>
                          <button @click="confirmDelete(s); closeDayModal()" class="action-delete">Delete</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-foot">
              <button @click="closeDayModal" class="btn-cancel">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- ========================= -->
    <!-- Add/Edit Modal -->
    <!-- ========================= -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg">
            <div class="modal-head modal-head-blue">
              <h3 class="modal-title">
                {{ isEditing ? (activeTrack==='tesda' ? "Edit TESDA Batch" : "Edit Schedule") : (activeTrack==='tesda' ? "Add TESDA Batch" : "Add New Schedule") }}
              </h3>
              <button class="modal-close-btn" @click="closeModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="modal-body modal-body-scroll">
              <!-- BULK MODE (Driving only, create only) -->
              <div v-if="!isEditing && activeTrack === 'driving'" class="mb-5">
                <label class="form-label" style="margin-bottom: 8px;">Create Mode</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    @click="setCreateMode('single')"
                    class="toggle-btn"
                    :class="createMode === 'single' ? 'toggle-btn-active-green' : ''"
                  >
                    Single
                  </button>

                  <button
                    type="button"
                    @click="setCreateMode('weekly')"
                    class="toggle-btn"
                    :class="createMode === 'weekly' ? 'toggle-btn-active-green' : ''"
                  >
                    Weekly
                  </button>

                  <button
                    type="button"
                    @click="setCreateMode('monthly')"
                    class="toggle-btn"
                    :class="createMode === 'monthly' ? 'toggle-btn-active-green' : ''"
                  >
                    Monthly
                  </button>
                </div>
                <div class="text-xs text-gray-400 mt-2">Weekly/Monthly generates many dates and will create schedules automatically.</div>
              </div>

              <form @submit.prevent="saveSchedule">
                <div class="form-grid">
                  <div class="form-col-2">
                    <label class="form-label">Course</label>
                    <select
                      v-model.number="formData.course_id"
                      @change="syncAssignedInstructor"
                      required
                      class="form-input"
                    >
                      <option value="" disabled>Select a course</option>
                      <option v-for="c in coursesRaw" :key="c.id" :value="c.id">{{ c.course_name }}</option>
                    </select>
                    <p v-if="activeTrack==='tesda'" class="text-xs text-gray-500 mt-1">
                      TESDA batch capacity is fixed: <b>25 trainees per batch</b> (system-managed).
                    </p>
                  </div>

                  <!-- DATE -->
                  <div v-if="activeTrack !== 'tesda' && (isEditing || createMode === 'single')">
                    <label class="form-label">Date</label>
                    <input type="date" v-model="formData.schedule_date" required class="form-input" />
                  </div>

                  <!-- TESDA: Start Date optional -->
                  <div v-if="activeTrack === 'tesda'" class="form-col-2">
                    <label class="form-label">Start Date <span class="text-gray-400 font-normal normal-case">(optional / TBA)</span></label>
                    <input type="date" v-model="formData.schedule_date" class="form-input" />
                    <div class="text-xs text-gray-500 mt-1">
                      Leave blank = batch is <b>TBA</b> (pooling). When date is set, it shows on calendar.
                      <span class="block mt-1 text-red-500">*TESDA training days are Monday–Saturday only (no Sundays).</span>
                    </div>
                  </div>

                  <!-- BULK range (Driving only) -->
                  <template
                    v-if="
                      !isEditing &&
                      activeTrack === 'driving' &&
                      createMode !== 'single'
                    "
                  >
                    <div>
                      <label class="form-label">Start Date</label>

                      <input
                        type="date"
                        v-model="range.start"
                        @change="syncBulkRange"
                        required
                        class="form-input"
                      />
                    </div>

                    <div>
                      <label class="form-label">End Date</label>

                      <input
                        type="date"
                        v-model="range.end"
                        readonly
                        class="form-input bg-gray-50"
                      />

                      <div class="text-xs text-gray-500 mt-1">
                        {{
                          createMode === "weekly"
                            ? "Automatically set to a 7-day range."
                            : "Automatically set to a 1-month range."
                        }}
                      </div>
                    </div>
                  </template>

                  <!-- Instructor (Driving only) -->
                  <div v-if="activeTrack !== 'tesda'">
                    <label class="form-label">Instructor</label>
                    <select v-model.number="formData.instructor_id" required class="form-input" :disabled="!formData.course_id">
                      <option :value="0" disabled>
                        {{ !formData.course_id ? 'Select a course first' : (availableInstructors.length === 0 ? 'No instructor assigned to this course' : 'Select instructor') }}
                      </option>
                      <option v-for="p in availableInstructors" :key="p.instructor_id" :value="p.instructor_id">
                        {{ p.firstname }} {{ p.lastname }}
                      </option>
                    </select>
                    <p v-if="formData.course_id && availableInstructors.length === 0" class="text-xs text-red-500 mt-1">
                      Assign an instructor to this course first (Courses Management → Instructor Assignment).
                    </p>
                  </div>

                  <!-- TESDA note -->
                  <div v-else class="form-col-2">
                    <div class="info-box">
                      <b>Trainer:</b> automatically comes from the TESDA Course Trainer Assignment (per course).
                    </div>
                  </div>

                  <!-- Time -->
                  <div>
                    <label class="form-label">Start Time</label>
                    <input type="time" v-model="formData.start_time" required :readonly="activeTrack === 'tesda'" class="form-input" />
                    <p class="text-xs text-gray-400 mt-1">FACET hours: 08:00 - 17:00</p>
                  </div>

                  <div>
                    <label class="form-label">End Time</label>
                    <input type="time" v-model="formData.end_time" required :readonly="activeTrack === 'tesda'" class="form-input" />
                  </div>

                  <!-- Total Slots: DRIVING only -->
                  <div v-if="activeTrack !== 'tesda'" class="form-col-2">
                    <label class="form-label">Total Slots</label>
                    <input type="number" v-model.number="formData.total_slots" required min="1" class="form-input" placeholder="Enter total slots" />
                  </div>

                  <!-- TESDA: fixed capacity display -->
                  <div v-else class="form-col-2">
                    <div class="info-box"><b>TESDA batch capacity:</b> 25 trainees per batch (system-managed).</div>
                  </div>

                  <!-- TESDA computed range preview -->
                  <div v-if="activeTrack==='tesda'" class="form-col-2">
                    <div class="info-box">
                      <div>
                        <b>TESDA Batch Range:</b>
                        <template v-if="formData.schedule_date">
                          {{ formatDate(formData.schedule_date) }} →
                          {{ formatDate(tesdaEndDateFromStart(formData.schedule_date, activeCourse?.duration)) }}
                        </template>
                        <template v-else><span class="font-semibold">TBA</span></template>
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        Duration: {{ activeCourse?.duration || '—' }} hours (auto). Sundays are skipped.
                      </div>
                    </div>
                  </div>
                </div>

                <div class="modal-foot" style="margin: 20px -20px -20px; border-radius: 0 0 16px 16px;">
                  <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
                  <button type="submit" :disabled="saving" class="btn-save btn-green">
                    {{ saving ? "Saving..." : isEditing ? "Update" : "Save" }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Delete Confirmation Modal -->
    <transition name="modal-fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head-delete">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                  <p class="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm leading-relaxed">
                Are you sure you want to delete schedule for
                <span class="font-semibold text-gray-900">{{ scheduleToDelete?.course }}</span>
                <template v-if="activeTrack !== 'tesda'">
                  <template
                    v-if="Number(scheduleToDelete?.groupSessionCount || 1) > 1"
                  >
                    from
                    <span class="font-semibold text-gray-900">
                      {{ formatDate(scheduleToDelete?.groupStartDate) }}
                    </span>
                    to
                    <span class="font-semibold text-gray-900">
                      {{ formatDate(scheduleToDelete?.groupEndDate) }}
                    </span>
                    ({{ scheduleToDelete?.groupSessionCount }} days)
                  </template>

                  <template v-else>
                    on
                    <span class="font-semibold text-gray-900">
                      {{
                        scheduleToDelete
                          ? formatDate(scheduleToDelete.date)
                          : ""
                      }}
                    </span>
                  </template>
                </template>
                <template v-else>
                  <span class="font-semibold text-gray-900">
                    ({{ scheduleToDelete?.date ? `Start ${formatDate(scheduleToDelete.date)}` : 'TBA batch' }})
                  </span>
                </template>
                ?
              </p>
              <div class="mt-6 flex justify-end gap-3">
                <button @click="cancelDelete" class="btn-cancel">Cancel</button>
                <button @click="deleteSchedule" :disabled="deleting" class="btn-save btn-red">
                  {{ deleting ? "Deleting..." : "Delete" }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
    <!-- Success/Error Notification Modal (copied from AdminSettings.vue) -->
      <transition name="modal-fade">
        <div v-if="messageOpen" class="modal-overlay" @click.self="closeMessage">
          <transition name="modal-scale">
            <div class="modal-card modal-card-sm">
              <div class="modal-head-delete">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-full flex items-center justify-center text-xl" :class="notifIconClass">
                    <svg v-if="messageIcon === '✅'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else-if="messageIcon === '❌'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376C1.83 17.615 2.865 19.5 4.559 19.5h14.882c1.694 0 2.73-1.885 1.862-3.374L13.882 4.5c-.847-1.457-2.917-1.457-3.764 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">{{ messageTitle }}</h3>
                  </div>
                </div>
              </div>
              <div class="modal-body-delete">
                <p class="text-sm leading-relaxed msg-text">{{ messageText }}</p>
                <div class="mt-6 flex justify-end">
                  <button class="btn-save" :class="messageIcon === '❌' ? 'btn-red' : 'btn-green'" @click="closeMessage">
                    OK
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from "vue";
import AdminLayout from "./AdminLayout.vue";
import axios from "axios";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const formatTime12 = (time) => {
  if (!time) return "—";

  const parts = String(time).split(":");
  let hour = Number(parts[0]);
  const minute = String(parts[1] ?? "00").padStart(2, "0");

  if (!Number.isFinite(hour)) return String(time);

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
};

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

  const daysNeeded = tesdaDaysFromDuration(duration);
  const out = [startYmd];

  let cur = startYmd;
  while (out.length < daysNeeded) {
    cur = addDaysSkipSundays(cur, 1);
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
    const instructors = ref([]); // only for driving dropdown
    const courseInstructorMap = ref({}); // { [course_id]: { instructor_id, name, code } }

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

    const messageOpen = ref(false);
    const messageTitle = ref("");
    const messageText = ref("");
    const messageIcon = ref(""); // '✅' | '❌' | '⚠️' | 'ℹ️'

    const showMessage = (title, text, icon = "ℹ️") => {
      messageTitle.value = title;
      messageText.value = text;
      messageIcon.value = icon;
      messageOpen.value = true;
    };

    const closeMessage = () => {
      messageOpen.value = false;
    };

    const notifIconClass = computed(() => {
      if (messageIcon.value === "✅") return "bg-emerald-100 text-emerald-600";
      if (messageIcon.value === "❌") return "bg-red-100 text-red-600";
      return "bg-amber-100 text-amber-600";
    });

    const getScheduleId = (s) => {
      const raw = s?.id;
      const id = Number(String(raw ?? "").trim());
      return Number.isInteger(id) && id > 0 ? id : null;
    };

    const formData = reactive({
      id: null,
      course_id: "",
      instructor_id: 0, // ✅ driving only
      schedule_date: "",
      start_time: OPEN_TIME,
      end_time: "12:00",
      total_slots: 10,
      status: "open",
    });

    // BULK MODE (Driving only)
    const createMode = ref("single");
    const range = reactive({
      start: toLocalYMD(new Date()),
      end: toLocalYMD(new Date()),
    });

    // =========================================
    // DRIVING CREATE MODE HELPERS
    // =========================================

    const addCalendarDays = (ymd, days) => {
      if (!ymd) return "";

      const d = new Date(`${ymd}T00:00:00`);

      if (Number.isNaN(d.getTime())) {
        return "";
      }

      d.setDate(d.getDate() + Number(days || 0));

      return toLocalYMD(d);
    };

    const addOneMonthMinusOneDay = (ymd) => {
      if (!ymd) return "";

      const [year, month, day] = String(ymd)
        .split("-")
        .map(Number);

      if (!year || !month || !day) {
        return "";
      }

      // Target = same date next month
      // then minus 1 day = one complete monthly range
      const targetMonthIndex = month; // JS month is 0-based

      const targetYear =
        year + Math.floor(targetMonthIndex / 12);

      const targetMonth =
        targetMonthIndex % 12;

      const lastDayOfTargetMonth =
        new Date(
          targetYear,
          targetMonth + 1,
          0
        ).getDate();

      const safeDay = Math.min(
        day,
        lastDayOfTargetMonth
      );

      const target = new Date(
        targetYear,
        targetMonth,
        safeDay
      );

      target.setDate(target.getDate() - 1);

      return toLocalYMD(target);
    };

    const syncBulkRange = () => {
      if (!range.start) {
        range.end = "";
        return;
      }

      if (createMode.value === "weekly") {
        // 7 calendar days inclusive
        range.end = addCalendarDays(
          range.start,
          6
        );
        return;
      }

      if (createMode.value === "monthly") {
        // Example:
        // Sep 5 -> Oct 4
        range.end =
          addOneMonthMinusOneDay(
            range.start
          );
        return;
      }

      range.end = range.start;
    };

    const setCreateMode = (mode) => {
      createMode.value = mode;

      if (!range.start) {
        range.start =
          toLocalYMD(new Date());
      }

      syncBulkRange();
    };

    // Automatically use the instructor assigned
    // to the selected Driving course.
    const syncAssignedInstructor = () => {
      if (activeTrack.value !== "driving") {
        formData.instructor_id = 0;
        return;
      }

      const courseId =
        Number(formData.course_id || 0);

      if (!courseId) {
        formData.instructor_id = 0;
        return;
      }

      const assigned =
        courseInstructorMap.value?.[
          courseId
        ];

      formData.instructor_id =
        Number(
          assigned?.instructor_id || 0
        );
    };

    // Build all dates between start/end.
    // Used by Weekly and Monthly modes.
    const buildBulkDates = (startYmd, endYmd, stepDays = 1) => {
      if (!startYmd || !endYmd) return [];

      const start = new Date(`${startYmd}T00:00:00`);
      const end = new Date(`${endYmd}T00:00:00`);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end
      ) {
        return [];
      }

      const dates = [];
      const cursor = new Date(start);

      while (cursor <= end) {
        // Make sure the whole multi-day batch fits inside the range
        const lastSessionDay = new Date(cursor);
        lastSessionDay.setDate(
          lastSessionDay.getDate() + stepDays - 1
        );

        if (lastSessionDay > end) break;

        dates.push(toLocalYMD(cursor));

        cursor.setDate(
          cursor.getDate() + stepDays
        );
      }

      return dates;
    };

    const getDrivingCourseSpanDays = () => {
    const courseId = Number(formData.course_id || 0);

    const course = coursesRaw.value.find(
      (c) => Number(c.id) === courseId
    );

    if (!course) return 1;

    const name = String(
      course.course_name || ""
    ).toUpperCase();

    const code = String(
      course.course_code || ""
    ).toUpperCase();

    // TDC = 2 days
    if (
      /\bTDC\b/.test(code) ||
      /THEORETICAL.*DRIVING.*COURSE/.test(name)
    ) {
      return 2;
    }

    // PDC AB = 2 days
    if (
      /PDC[\s_-]*(AB|A&B)/.test(code) ||
      /PRACTICAL.*DRIVING.*COURSE.*\(AB\)/.test(name) ||
      /PRACTICAL.*A\s*(&|AND)?\s*B/.test(name)
    ) {
      return 2;
    }

    // PDC A / PDC B = 1 day
    return 1;
  };

    const listCourseFilter = ref(0);
    const listStatusFilter = ref("");
    const listPersonFilter = ref("");
    const page = ref(1);
    const pageJump = ref(1);
    const pageSize = ref(10);

    // endpoints
    const scheduleUrl = () => (activeTrack.value === "tesda" ? "/admin/tesda/schedules" : "/admin/schedules");
    const coursesUrl = () => {
      // ✅ always pass track so backend won't return BOTH
      return activeTrack.value === "tesda"
        ? "/admin/tesda/courses"
        : "/admin/courses?track=driving";
    };
    const peopleUrl = () => "/admin/instructors"; // ✅ driving only (tesda = no dropdown)

    const courseById = computed(() => {
      const m = new Map();
      for (const c of coursesRaw.value) m.set(Number(c.id), c);
      return m;
    });

    const activeCourse = computed(
      () => coursesRaw.value.find((c) => Number(c.id) === Number(formData.course_id)) || null
    );

    const assignedInstructorForCourse = computed(() => {
      const cid = Number(formData.course_id);
      return courseInstructorMap.value[cid] || null;
    });

    const availableInstructors = computed(() => {
      const assigned = assignedInstructorForCourse.value;
      if (!assigned) return [];
      return instructors.value.filter((p) => Number(p.instructor_id) === assigned.instructor_id);
    });

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
        result = result.filter(
          (s) =>
            Number(s.course_id) ===
            Number(listCourseFilter.value)
        );
      }

      if (listStatusFilter.value) {
        const want = String(
          listStatusFilter.value
        ).toLowerCase();

        result = result.filter(
          (s) =>
            String(
              s.computedStatus || ""
            ).toLowerCase() === want
        );
      }

      if (listPersonFilter.value) {
        const q = String(
          listPersonFilter.value
        )
          .toLowerCase()
          .trim();

        result = result.filter((s) =>
          String(s.instructor || "")
            .toLowerCase()
            .includes(q)
        );
      }

      // TESDA stays as-is
      if (activeTrack.value === "tesda") {
        result.sort((a, b) => {
          const aSched = isTesdaScheduled(a)
            ? 1
            : 0;
          const bSched = isTesdaScheduled(b)
            ? 1
            : 0;

          if (aSched !== bSched) {
            return bSched - aSched;
          }

          const ad = String(a.date || "");
          const bd = String(b.date || "");

          if (ad !== bd) {
            return bd.localeCompare(ad);
          }

          return Number(a.id) - Number(b.id);
        });

        return result;
      }

      // =====================================
      // DRIVING: GROUP MULTI-DAY SCHEDULES
      // =====================================
      const grouped = [];
      const seenGroups = new Set();

      for (const schedule of result) {
        const groupId = String(
          schedule.scheduleGroupId ??
          schedule.schedule_group_id ??
          ""
        ).trim();

        // Legacy schedule: no group ID
        if (!groupId) {
          grouped.push({
            ...schedule,
            groupKey: `legacy-${schedule.id}`,
            groupStartDate:
              schedule.date || "",
            groupEndDate:
              schedule.date || "",
            groupSessionCount: 1,
            groupScheduleIds: [
              Number(schedule.id),
            ],
          });

          continue;
        }

        if (seenGroups.has(groupId)) {
          continue;
        }

        seenGroups.add(groupId);

        // Get ALL sessions in this group,
        // even if one session was filtered out.
        const members = schedules.value
          .filter((item) => {
            const itemGroupId = String(
              item.scheduleGroupId ??
              item.schedule_group_id ??
              ""
            ).trim();

            return itemGroupId === groupId;
          })
          .sort((a, b) => {
            const aSession = Number(
              a.sessionNo ??
              a.session_no ??
              999
            );

            const bSession = Number(
              b.sessionNo ??
              b.session_no ??
              999
            );

            if (aSession !== bSession) {
              return aSession - bSession;
            }

            return String(
              a.date || ""
            ).localeCompare(
              String(b.date || "")
            );
          });

        const first =
          members[0] || schedule;

        const last =
          members[members.length - 1] ||
          first;

        grouped.push({
          ...first,

          scheduleGroupId: groupId,
          groupKey: `group-${groupId}`,

          groupStartDate:
            first.date || "",

          groupEndDate:
            last.date ||
            first.date ||
            "",

          groupSessionCount:
            members.length,

          groupScheduleIds: members
            .map((item) =>
              Number(item.id)
            )
            .filter(
              (id) =>
                Number.isInteger(id) &&
                id > 0
            ),
        });
      }

      grouped.sort((a, b) => {
        const ad = String(
          a.groupStartDate ||
          a.date ||
          ""
        );

        const bd = String(
          b.groupStartDate ||
          b.date ||
          ""
        );

        if (ad !== bd) {
          return bd.localeCompare(ad);
        }

        return Number(a.id) - Number(b.id);
      });

      return grouped;
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

      const skipInstructorReset = ref(false);

      watch(
        () => formData.course_id,
        () => {
          if (skipInstructorReset.value) {
            skipInstructorReset.value = false;
            return;
          }
          if (activeTrack.value !== "tesda") formData.instructor_id = 0;
        }
      );

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
            isToday:
              d.getDate() === today.getDate() &&
              d.getMonth() === today.getMonth() &&
              d.getFullYear() === today.getFullYear(),
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
          isToday:
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear(),
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
        const dateStr = toLocalYMD(dateCell.date)

        const matched = baseFilteredSchedules.value.filter((s) =>
          scheduleCoversDate(s, dateStr)
        )

        if (matched.length === 0) return ""

        // DRIVING: same as before
        if (activeTrack.value !== "tesda") {
          return "bg-green-100 border-green-400 font-semibold"
        }

        // TESDA: no full background, bullet/dot lang
        if (dateCell.isTesdaStart) {
          return "bg-white border-2 border-green-600 font-semibold"
        }

        if (dateCell.isTesdaEnd) {
          return "bg-white border-2 border-gray-500 font-semibold"
        }

        return "bg-white border-gray-200"
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

    // ✅ Only fetch instructors for driving (TESDA = no picking)
    const fetchInstructors = async () => {
      if (activeTrack.value === "tesda") {
        instructors.value = [];
        return;
      }
      const res = await api.get(peopleUrl());
      instructors.value = Array.isArray(res.data?.data) ? res.data.data : [];
    };

    const fetchCourseInstructorMap = async () => {
      if (activeTrack.value === "tesda") {
        courseInstructorMap.value = {};
        return;
      }
      const res = await api.get("/admin/driving-course-instructors");
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      const map = {};
      for (const r of rows) {
        if (r.status === "active" && r.instructor_id) {
          map[Number(r.course_id)] = {
            instructor_id: Number(r.instructor_id),
            name: r.instructor_name || "",
            code: r.instructor_code || "",
          };
        }
      }
      courseInstructorMap.value = map;
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
              // NOTE: backend might still return instructor_id field; we keep it for driving edit only
              instructor_id: Number(s.instructor_id || 0),
              date: normalizedDate || "",
              // TESDA trainer name should be in `instructor` (same display field)
              instructor: instructorName || (activeTrack.value === "tesda" ? "" : instructorName),
              startTime: s.startTime || OPEN_TIME,
              endTime: s.endTime || CLOSE_TIME,
              totalSlots: Number(
                s.totalSlots ?? s.total_slots ?? (activeTrack.value === "tesda" ? TESDA_BATCH_CAP : 0)
              ),
              availableSlots: Number(s.availableSlots ?? 0),
              computedStatus: s.computedStatus || s.scheduleStatus || "",
              batch_no: s.batch_no || null,
            };
          })
          .filter((s) => s.id);
          } catch (err) {
            console.error("fetchSchedules error:", err?.response?.data || err);
            showMessage("Error", err?.response?.data?.message || err.message || "Failed to fetch schedules", "❌");
          }
    };

    // MODAL ACTIONS
    const resetForm = () => {
      formData.id = null;
      formData.course_id = "";
      formData.instructor_id = 0; // ✅ only driving uses it
      formData.schedule_date = "";
      formData.start_time = OPEN_TIME;
      formData.end_time = activeTrack.value === "tesda" ? CLOSE_TIME : "12:00";
      formData.total_slots = activeTrack.value === "tesda" ? TESDA_BATCH_CAP : 10;
      formData.status = activeTrack.value === "tesda" ? "tba" : "open";
      createMode.value = "single";
      range.start = toLocalYMD(new Date());
      range.end = toLocalYMD(new Date());
    };

    const openAddModal = async () => {
      isEditing.value = false;
      resetForm();
      try {
        await fetchInstructors();
        await fetchCourseInstructorMap();
      } catch (e) {
        console.error("refresh assignment error:", e);
      }
      showModal.value = true;
    };

    const editSchedule = async (schedule) => {
      let targetSchedule = schedule;

      // =====================================
      // DRIVING GROUP:
      // Always edit Day 1 / group leader
      // =====================================
      if (activeTrack.value !== "tesda") {
        const groupId = String(
          schedule.scheduleGroupId ??
          schedule.schedule_group_id ??
          ""
        ).trim();

        if (groupId) {
          const members = schedules.value
            .filter((item) => {
              const itemGroupId = String(
                item.scheduleGroupId ??
                item.schedule_group_id ??
                ""
              ).trim();

              return itemGroupId === groupId;
            })
            .sort((a, b) => {
              const aSession = Number(
                a.sessionNo ??
                a.session_no ??
                999
              );

              const bSession = Number(
                b.sessionNo ??
                b.session_no ??
                999
              );

              if (aSession !== bSession) {
                return aSession - bSession;
              }

              return Number(a.id) - Number(b.id);
            });

          if (members.length) {
            targetSchedule = members[0];
          }
        }
      }

      const id = getScheduleId(targetSchedule);

      if (!id) {
        showMessage(
          "Invalid Schedule",
          "Invalid schedule id. Please refresh.",
          "⚠️"
        );
        return;
      }

      isEditing.value = true;

      try {
        await fetchInstructors();
        await fetchCourseInstructorMap();
      } catch (e) {
        console.error(
          "refresh assignment error:",
          e
        );
      }

      formData.id = id;

      skipInstructorReset.value = true;

      formData.course_id =
        Number(targetSchedule.course_id);

      formData.instructor_id =
        activeTrack.value === "tesda"
          ? 0
          : (
              Number(
                targetSchedule.instructor_id || 0
              ) || 0
            );

      formData.schedule_date =
        String(targetSchedule.date || "");

      formData.start_time =
        activeTrack.value === "tesda"
          ? OPEN_TIME
          : String(
              targetSchedule.startTime ||
              OPEN_TIME
            );

      formData.end_time =
        activeTrack.value === "tesda"
          ? CLOSE_TIME
          : String(
              targetSchedule.endTime ||
              ""
            );

      formData.total_slots =
        activeTrack.value === "tesda"
          ? TESDA_BATCH_CAP
          : Number(
              targetSchedule.totalSlots || 0
            );

      formData.status =
        targetSchedule.scheduleStatus ||
        targetSchedule.computedStatus ||
        (
          activeTrack.value === "tesda"
            ? (
                targetSchedule.date
                  ? "open"
                  : "tba"
              )
            : "open"
        );

      showModal.value = true;
    };

      const viewSchedule = (schedule) => {
        if (activeTrack.value === "tesda") {
          const start = isTesdaScheduled(schedule)
            ? formatDate(schedule.date)
            : "TBA";

          const end = isTesdaScheduled(schedule)
            ? formatDate(getTesdaEndDate(schedule))
            : "—";

          showMessage(
            "TESDA Batch Details",
            `Course: ${schedule.course}
      Batch: ${getTesdaBatchNo(schedule)}
      Start: ${start}
      End: ${end}
      Enrollees: ${getTesdaEnrolled(schedule)}/25`,
            "ℹ️"
          );

          return;
        }

        // =====================================
        // DRIVING GROUP DETAILS
        // =====================================
        const groupId = String(
          schedule.scheduleGroupId ??
          schedule.schedule_group_id ??
          ""
        ).trim();

        let members = [];

        if (groupId) {
          members = schedules.value
            .filter((item) => {
              const itemGroupId = String(
                item.scheduleGroupId ??
                item.schedule_group_id ??
                ""
              ).trim();

              return itemGroupId === groupId;
            })
            .sort((a, b) => {
              const aSession = Number(
                a.sessionNo ??
                a.session_no ??
                999
              );

              const bSession = Number(
                b.sessionNo ??
                b.session_no ??
                999
              );

              if (aSession !== bSession) {
                return aSession - bSession;
              }

              return String(a.date || "")
                .localeCompare(
                  String(b.date || "")
                );
            });
        }

        // Legacy/single schedule fallback
        if (!members.length) {
          members = [schedule];
        }

        const sessionLines = members
          .map((item, index) => {
            const sessionNo = Number(
              item.sessionNo ??
              item.session_no ??
              index + 1
            );

            return `Day ${sessionNo}: ${formatDate(
              item.date
            )} — ${formatTime12(item.startTime)} - ${formatTime12(item.endTime)}`;
          })
          .join("\n");

        const instructor =
          schedule.instructor || "Unassigned";

        const status =
          schedule.computedStatus ||
          schedule.scheduleStatus ||
          "Open";

        const totalSlots = Number(
          schedule.totalSlots ??
          schedule.total_slots ??
          0
        );

        const title =
          members.length > 1
            ? "Schedule Group Details"
            : "Schedule Details";

        showMessage(
          title,
          `Course: ${schedule.course}
      Instructor: ${instructor}
      Status: ${status}
      Slots: ${totalSlots || "—"}
      Sessions: ${members.length}

      ${sessionLines}`,
          "ℹ️"
        );
      };

    const closeModal = () => {
      showModal.value = false;
      resetForm();
    };

    const confirmDelete = (schedule) => {
      const id = getScheduleId(schedule);
      if (!id) {
        showMessage("Invalid Schedule", "Invalid schedule id. Please refresh.", "⚠️");
        return;
      }
      scheduleToDelete.value = { ...schedule, id };
      showDeleteModal.value = true;
    };

    const cancelDelete = () => {
      scheduleToDelete.value = null;
      showDeleteModal.value = false;
    };

    // ✅ SAVE (REMOVED trainer_id completely)
    const saveSchedule = async () => {
      if (saving.value) return;

      const courseId =
        Number(formData.course_id || 0);

      if (!courseId) {
        return showMessage(
          "Validation Error",
          "Course is required.",
          "⚠️"
        );
      }

      // =====================================
      // RESOLVE ASSIGNED DRIVING INSTRUCTOR
      // =====================================
      let instructorId = 0;

      if (
        activeTrack.value === "driving"
      ) {
        const assigned =
          courseInstructorMap.value?.[
            courseId
          ];

        instructorId = Number(
          formData.instructor_id ||
            assigned?.instructor_id ||
            0
        );

        // update UI dropdown too
        formData.instructor_id =
          instructorId;

        if (!instructorId) {
          return showMessage(
            "No Assigned Instructor",
            "This course has no assigned instructor. Assign an instructor first in Manage Courses.",
            "⚠️"
          );
        }
      }

      // =====================================
      // TESDA DATE VALIDATION
      // =====================================
      if (
        activeTrack.value === "tesda" &&
        formData.schedule_date
      ) {
        const ymd = String(
          formData.schedule_date
        );

        if (!isMonToSatYMD(ymd)) {
          return showMessage(
            "Invalid Date",
            "Bawal ang Sunday sa TESDA. Piliin ang Monday–Saturday.",
            "⚠️"
          );
        }
      }

      // =====================================
      // DRIVING DATE VALIDATION
      // =====================================
      if (
        activeTrack.value === "driving"
      ) {
        if (
          isEditing.value ||
          createMode.value === "single"
        ) {
          if (!formData.schedule_date) {
            return showMessage(
              "Validation Error",
              "Schedule date is required.",
              "⚠️"
            );
          }
        } else {
          if (
            !range.start ||
            !range.end
          ) {
            return showMessage(
              "Validation Error",
              "Start date and end date are required.",
              "⚠️"
            );
          }

          if (
            new Date(
              `${range.start}T00:00:00`
            ) >
            new Date(
              `${range.end}T00:00:00`
            )
          ) {
            return showMessage(
              "Invalid Date Range",
              "End date cannot be earlier than start date.",
              "⚠️"
            );
          }
        }
      }

      // =====================================
      // SLOT VALIDATION
      // =====================================
      const totalSlotsToSend =
        activeTrack.value === "tesda"
          ? TESDA_BATCH_CAP
          : Number(
              formData.total_slots
            );

      if (
        !Number.isFinite(
          totalSlotsToSend
        ) ||
        totalSlotsToSend < 1
      ) {
        return showMessage(
          "Validation Error",
          "Total slots must be >= 1.",
          "⚠️"
        );
      }

      // =====================================
      // TIME VALIDATION
      // =====================================
      if (
        !withinFacetHours(
          formData.start_time,
          formData.end_time
        )
      ) {
        return showMessage(
          "Invalid Time",
          `FACET hours only: ${OPEN_TIME} - ${CLOSE_TIME}.`,
          "⚠️"
        );
      }

      saving.value = true;

      try {
        const base = {
          course_id: courseId,

          total_slots:
            totalSlotsToSend,

          status:
            activeTrack.value ===
            "tesda"
              ? formData.schedule_date
                ? "open"
                : "tba"
              : formData.status ||
                "open",
        };

        // Driving always sends the
        // resolved assigned instructor
        if (
          activeTrack.value ===
          "driving"
        ) {
          base.instructor_id =
            instructorId;
        }

        const makePayload = (
          scheduleDate
        ) => ({
          ...base,

          schedule_date:
            activeTrack.value ===
            "tesda"
              ? scheduleDate
                ? String(scheduleDate)
                : null
              : String(scheduleDate),

          start_time:
            activeTrack.value ===
            "tesda"
              ? OPEN_TIME
              : String(
                  formData.start_time
                ),

          end_time:
            activeTrack.value ===
            "tesda"
              ? CLOSE_TIME
              : String(
                  formData.end_time
                ),
        });

        const wasEditing =
          isEditing.value;

        // =====================================
        // EDIT EXISTING
        // =====================================
        if (isEditing.value) {
          const id = parseInt(
            formData.id,
            10
          );

          if (
            !Number.isInteger(id) ||
            id < 1
          ) {
            showMessage(
              "Invalid Schedule",
              "Invalid schedule id (client). Please refresh and try again.",
              "⚠️"
            );

            return;
          }

          const payload =
            makePayload(
              formData.schedule_date
            );

          await api.put(
            `${scheduleUrl()}/${id}`,
            payload
          );
        }

        // =====================================
        // WEEKLY / MONTHLY BULK CREATE
        // =====================================
        else if (
          activeTrack.value ===
            "driving" &&
          createMode.value !==
            "single"
        ) {
          const spanDays =
            getDrivingCourseSpanDays();

          const dates = buildBulkDates(
            range.start,
            range.end,
            spanDays
          );

          if (!dates.length) {
            throw new Error(
              "No valid dates generated."
            );
          }

          let created = 0;

          for (const date of dates) {
            const payload =
              makePayload(date);

            await api.post(
              scheduleUrl(),
              payload
            );

            created++;
          }

          await fetchSchedules();

          closeModal();

          showMessage(
            "Success",
            `${created} schedule date(s) created successfully for the ${createMode.value} range.`,
            "✅"
          );

          return;
        }

        // =====================================
        // SINGLE / TESDA CREATE
        // =====================================
        else {
          const payload =
            makePayload(
              formData.schedule_date
            );

          await api.post(
            scheduleUrl(),
            payload
          );
        }

        await fetchSchedules();

        closeModal();

        showMessage(
          "Success",
          wasEditing
            ? "Schedule updated successfully."
            : "New schedule added successfully.",
          "✅"
        );
      } catch (err) {
        console.error(
          "saveSchedule error:",
          err
        );

        showMessage(
          "Error",
          err?.response?.data
            ?.message ||
            err?.message ||
            "Failed to save schedule.",
          "❌"
        );
      } finally {
        saving.value = false;
      }
    };

      const deleteSchedule = async () => {
        if (!scheduleToDelete.value || deleting.value) return;

        const id = getScheduleId(scheduleToDelete.value);
        if (!id) return showMessage("Invalid Schedule", "Invalid schedule id. Refresh and try again.", "⚠️");

        deleting.value = true;
        try {
          await api.delete(`${scheduleUrl()}/${id}`);
          await fetchSchedules();
          cancelDelete();
          showMessage("Deleted", "Schedule deleted successfully.", "✅");
        } catch (err) {
          console.error("deleteSchedule error:", err?.response?.data || err);
          showMessage("Error", err?.response?.data?.message || err.message || "Failed to delete schedule", "❌");
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
        // ✅ always fetch courses; instructors only when driving
        await fetchCourses();
        await fetchInstructors();
        await fetchCourseInstructorMap();
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
      saving,
      deleting,
      courseInstructorMap,
      assignedInstructorForCourse,
      availableInstructors,

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

      messageOpen, messageTitle, messageText, messageIcon,
      showMessage, closeMessage, notifIconClass,

      formatDate,
      formatTime12,
      getStatusClass,

      confirmDelete,
      cancelDelete,
      deleteSchedule,

      fetchSchedules,

      createMode,
      range,
      setCreateMode,
      syncBulkRange,
      syncAssignedInstructor,

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
/* ========== PAGE HEADER ========== */
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.info-note { font-size: 0.75rem; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; }
.filter-note { font-size: 0.7rem; color: #9ca3af; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* ========== ADD BUTTON ========== */
.add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.add-btn:hover { background: #059669; transform: translateY(-1px); }

/* ========== TABS ========== */
.tab-group { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.2s; background: #fff; color: #6b7280; }
.tab-inactive:hover { border-color: #d1d5db; color: #374151; }
.tab-active-green { background: #10b981; color: #fff; border-color: #10b981; }
.tab-active-blue { background: #3b82f6; color: #fff; border-color: #3b82f6; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }

/* ========== FILTERS ========== */
.filters-panel { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px; }
.filter-field { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }

/* ========== MODERN SELECT / INPUT ========== */
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

.date-input-modern { padding: 9px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 0.82rem; font-weight: 600; color: #374151; outline: none; transition: border-color 0.2s; background: #fff; }
.date-input-modern:focus { border-color: #10b981; }

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
.cal-dot-wrap { display: flex; justify-content: center; margin-top: 4px; }
.cal-dot { width: 8px; height: 8px; border-radius: 999px; display: block; }
.cal-dot-start { background: #059669; }
.cal-dot-end { background: #6b7280; }
.cal-dot-mid { background: #10b981; }

.calendar-legend { margin-top: 16px; display: flex; gap: 18px; flex-wrap: wrap; font-size: 0.8rem; color: #6b7280; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; }
.dot-green { background: #10b981; }
.dot-red { background: #ef4444; }
.dot-gray { background: #6b7280; }
.legend-swatch { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }
.legend-swatch-green { background: #d1fae5; }
.legend-swatch-today { background: #fff; border: 2px solid #10b981; }
.legend-swatch-start { background: #fff; border: 2px solid #059669; }
.legend-swatch-end { background: #f3f4f6; border: 2px solid #9ca3af; }

/* ========== NOTIFICATION MODAL ========== */
.modal-card-sm { max-width: 420px; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }
.msg-text { white-space: pre-line; } /* preserves \n line breaks from viewSchedule details */
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-green { background: #10b981; }
.btn-green:hover { background: #059669; }
.btn-red { background: #ef4444; }
.btn-red:hover { background: #dc2626; }

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
.text-gray-600 { color: #4b5563; background: #f3f4f6; }
.text-gray-700 { color: #374151; background: #f3f4f6; }
.text-green-600 { color: #059669; background: #d1fae5; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #6366f1; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #4f46e5; }
.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #f59e0b; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-edit:hover { background: #d97706; }
.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-delete:hover { background: #dc2626; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ========== MODAL ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-sm { max-width: 420px; }
.modal-card-lg { max-width: 720px; }
.modal-card-xl { max-width: 1000px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.modal-head-green { background: #f0fdf4; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-body-scroll { overflow-y: auto; flex: 1; padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; flex-shrink: 0; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }

/* ========== FORM ========== */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-col-2 { grid-column: span 2; }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .form-col-2 { grid-column: span 1; } }
.form-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; }
.form-input:focus { border-color: #10b981; }
.info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; font-size: 0.85rem; color: #374151; }

.toggle-btn { padding: 9px 16px; border-radius: 10px; border: 2px solid #e5e7eb; font-size: 0.85rem; font-weight: 600; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.toggle-btn:hover { border-color: #10b981; }
.toggle-btn-active-green { background: #10b981; border-color: #10b981; color: #fff; }

/* ========== BUTTONS (footer) ========== */
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.btn-red { background: #ef4444; }
.btn-red:hover:not(:disabled) { background: #dc2626; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

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
.tesda-dot-green::after { background: #16a34a; }
</style>