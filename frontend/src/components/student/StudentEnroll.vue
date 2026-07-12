<template>
  <StudentLayout active-page="enrollment">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search courses..."
            class="search-input-modern"
            v-model="searchQuery"
          />
        </div>
        <button @click="fetchActiveReservation" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loadingActiveReservation }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="enrollment-wrapper">
      <div class="page-top">
        <h2 class="page-title">Enrollment</h2>
        <p class="page-subtitle">Browse courses, pick a slot, and reserve your training</p>
      </div>

      <!-- Active Reservation Banner -->
      <div v-if="activeReservation" class="alert-banner">
        <div class="alert-banner-content">
          <svg class="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div class="font-semibold text-amber-900">You already have an active reservation</div>
            <div class="text-sm text-amber-800 mt-1">
              Course: <span class="font-semibold">{{ activeReservation.course }}</span>
            </div>
            <div class="text-sm text-amber-800">
              Date: <span class="font-semibold">{{ formatDateYMD(activeReservation.date) }}</span>
              • Time: <span class="font-semibold">{{ activeReservation.startTime }} - {{ activeReservation.endTime }}</span>
            </div>
            <div class="text-sm text-amber-800">
              Schedule #<span class="font-semibold">{{ activeReservation.schedule_id }}</span>
              • Status: <span class="font-semibold">{{ mapStudentStatus(activeReservation.reservation_status) }}</span>
            </div>
            <div v-if="activeReservation.isPackage && activeReservation.sibling" class="text-sm text-amber-800 mt-2">
              Package Day 2:
              <span class="font-semibold">
                {{ formatDateYMD(activeReservation.sibling.date) }}
                • {{ activeReservation.sibling.startTime }} - {{ activeReservation.sibling.endTime }}
                • Schedule #{{ activeReservation.sibling.schedule_id }}
              </span>
            </div>
            <div class="text-xs text-amber-700 mt-2">
              You can reserve again after this reservation is marked DONE.
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-row">
        <button @click="activeTab = 'courses'" :class="tabClass('courses')">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Course
        </button>
        <button @click="activeTab = 'slot'" :disabled="!selectedCourse || hasActiveReservation" :class="tabClass('slot', !selectedCourse || hasActiveReservation)" :title="hasActiveReservation ? 'You already have an active reservation' : 'Select a course first'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Slot
        </button>
        <button @click="activeTab = 'upload'" :disabled="!canGoUpload || hasActiveReservation" :class="tabClass('upload', !canGoUpload || hasActiveReservation)" :title="hasActiveReservation ? 'You already have an active reservation' : 'Pick a slot first'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload
        </button>
        <button @click="activeTab = 'payment'" :disabled="!canGoPayment || hasActiveReservation" :class="tabClass('payment', !canGoPayment || hasActiveReservation)" :title="hasActiveReservation ? 'You already have an active reservation' : 'Complete upload step first'">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Payment
        </button>
      </div>

      <!-- ===================== -->
      <!-- 1) COURSES -->
      <!-- ===================== -->
      <div v-if="activeTab === 'courses'">
        <!-- Theoretical Courses Section -->
        <div class="panel-card mb-4">
          <div class="panel-header-bar">
            <h3 class="panel-title">Theoretical Driving Courses (TDC)</h3>
            <span class="panel-tag">{{ theoreticalCourses.length }} course{{ theoreticalCourses.length !== 1 ? 's' : '' }}</span>
          </div>
          <div v-if="loadingCourses" class="loading-state">
            <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p class="text-gray-500">Loading courses...</p>
          </div>
          <div v-else class="courses-grid">
            <div v-for="course in theoreticalCourses" :key="course.id" class="course-card">
              <div class="course-card-top">
                <div>
                  <h4 class="course-card-title">{{ course.course_name }}</h4>
                  <p class="course-card-code">{{ course.course_code }}</p>
                </div>
                <span class="badge badge-blue">TDC</span>
              </div>
              <p class="course-card-desc">{{ course.description || "—" }}</p>

              <!-- Requirements toggle -->
              <button @click="toggleRequirements(course)" class="req-toggle-btn">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {{ showReqMap[course.id] ? "Hide Requirements" : "View Requirements" }}
                </span>
                <svg class="w-4 h-4 transform transition-transform duration-300" :class="{ 'rotate-180': showReqMap[course.id] }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div class="req-content" :class="{ 'req-content-open': showReqMap[course.id] }">
                <div v-if="showReqMap[course.id]">
                  <h5 class="req-title">Requirements:</h5>
                  <div v-if="loadingReqMap[course.id]" class="text-sm text-gray-500">Loading requirements...</div>
                  <ul v-else-if="(requirementsMap[course.id] || []).length" class="req-list">
                    <li class="req-item">
                      <div class="req-dot"></div>
                      2x2 Picture (For Certification) <span class="text-red-500">*</span>
                    </li>
                    <li v-for="r in requirementsMap[course.id]" :key="r.requirement_id" class="req-item">
                      <div class="req-dot"></div>
                      {{ r.requirement_text }}
                    </li>
                  </ul>
                  <p v-else class="text-sm text-gray-500">
                    • 2x2 Picture (For Certification) <span class="text-red-500">*</span>
                  </p>
                </div>
              </div>

              <div class="course-card-stats">
                <div class="course-stat">
                  <span class="course-stat-label">Duration</span>
                  <span class="course-stat-value">{{ course.duration || "—" }}</span>
                </div>
                <div class="course-stat">
                  <span class="course-stat-label">Course Fee</span>
                  <span class="course-stat-value text-emerald">₱{{ Number(course.course_fee || 0).toLocaleString() }}</span>
                </div>
              </div>

              <button @click="selectCourse(course)" class="btn-select-course" :disabled="hasActiveReservation" :title="hasActiveReservation ? 'You already have an active reservation' : ''">
                Choose & Pick Slot
              </button>
            </div>
            <div v-if="!theoreticalCourses.length" class="empty-state col-span-full">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p>No TDC courses found</p>
            </div>
          </div>
        </div>

        <!-- Practical Driving Courses Section -->
        <div class="panel-card">
          <div class="panel-header-bar">
            <h3 class="panel-title">Practical Driving Courses (PDC)</h3>
            <span class="panel-tag">{{ practicalCourses.length }} course{{ practicalCourses.length !== 1 ? 's' : '' }}</span>
          </div>
          <div v-if="loadingCourses" class="loading-state">
            <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p class="text-gray-500">Loading courses...</p>
          </div>
          <div v-else class="courses-grid">
            <div v-for="course in practicalCourses" :key="course.id" class="course-card course-card-pdc">
              <div class="course-card-top">
                <div>
                  <h4 class="course-card-title">{{ course.course_name }}</h4>
                  <p class="course-card-code">{{ course.course_code }}</p>
                </div>
                <span class="badge badge-green">PDC</span>
              </div>
              <p class="course-card-desc">{{ course.description || "—" }}</p>

              <!-- Requirements toggle -->
              <button @click="toggleRequirements(course)" class="req-toggle-btn">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {{ showReqMap[course.id] ? "Hide Requirements" : "View Requirements" }}
                </span>
                <svg class="w-4 h-4 transform transition-transform duration-300" :class="{ 'rotate-180': showReqMap[course.id] }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div class="req-content" :class="{ 'req-content-open': showReqMap[course.id] }">
                <div v-if="showReqMap[course.id]">
                  <h5 class="req-title">Requirements:</h5>
                  <div v-if="loadingReqMap[course.id]" class="text-sm text-gray-500">Loading requirements...</div>
                  <ul v-else-if="(requirementsMap[course.id] || []).length" class="req-list">
                    <li class="req-item">
                      <div class="req-dot"></div>
                      2x2 Picture (For Certification) <span class="text-red-500">*</span>
                    </li>
                    <li v-for="r in requirementsMap[course.id]" :key="r.requirement_id" class="req-item">
                      <div class="req-dot"></div>
                      {{ r.requirement_text }}
                    </li>
                  </ul>
                  <p v-else class="text-sm text-gray-500">
                    • 2x2 Picture (For Certification) <span class="text-red-500">*</span>
                  </p>
                </div>
              </div>

              <div class="course-card-stats">
                <div class="course-stat">
                  <span class="course-stat-label">Duration</span>
                  <span class="course-stat-value">{{ course.duration || "—" }}</span>
                </div>
                <div class="course-stat">
                  <span class="course-stat-label">Course Fee</span>
                  <span class="course-stat-value text-emerald">₱{{ Number(course.course_fee || 0).toLocaleString() }}</span>
                </div>
              </div>

              <button @click="selectCourse(course)" class="btn-select-course btn-select-pdc" :disabled="hasActiveReservation" :title="hasActiveReservation ? 'You already have an active reservation' : ''">
                Choose & Pick Slot
              </button>
            </div>
            <div v-if="!practicalCourses.length" class="empty-state col-span-full">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No PDC courses found</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== -->
      <!-- 2) SLOT -->
      <!-- ===================== -->
      <div v-if="activeTab === 'slot'" class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Pick a Slot</h3>
          <span class="panel-tag">Schedule</span>
        </div>

        <div class="slot-info-banner" :class="{ 'slot-info-pdc': isPDCCourse }">
          <div class="font-semibold text-green-800">
            <span v-if="isPDCCourse">🚗 PDC</span>
            <span v-else>📚 TDC</span>
            Selected Course:
            <span class="font-bold">{{ selectedCourse?.course_name }} ({{ selectedCourse?.course_code }})</span>
          </div>
          <div v-if="reservationForm.schedule_id" class="text-sm text-green-800 mt-2">
            ✅ Selected Schedule:
            <span class="font-semibold">#{{ reservationForm.schedule_id }}</span>
            <span v-if="selectedPickedPackage" class="badge badge-green ml-2">2-day package</span>
          </div>
          <div v-else class="text-sm text-gray-600 mt-2">Select a date then pick a time slot.</div>
        </div>

        <!-- Calendar -->
        <div class="calendar-wrapper">
          <div class="calendar-header">
            <button @click="previousMonth" class="cal-nav-btn">&lt;</button>
            <h3 class="cal-title">{{ currentMonth }} {{ currentYear }}</h3>
            <button @click="nextMonth" class="cal-nav-btn">&gt;</button>
          </div>
          <div class="cal-day-headers">
            <div v-for="day in daysOfWeek" :key="day" class="cal-day-header">{{ day }}</div>
          </div>
          <div class="cal-days-grid">
            <div
              v-for="day in calendarDays"
              :key="day.key"
              :class="[
                'cal-day',
                !day.isCurrentMonth ? 'cal-day-other' : '',
                isPastDate(day.date) && day.isCurrentMonth ? 'cal-day-past' : '',
                day.isCurrentMonth && day.available === true ? 'cal-day-available' : '',
                day.isCurrentMonth && day.available === false ? 'cal-day-full' : '',
                day.isSelected ? 'cal-day-selected' : '',
                isDayDisabled(day) ? 'cal-day-disabled' : ''
              ]"
              @click="selectDate(day)"
            >
              {{ day.day }}
            </div>
          </div>
          <div class="cal-legend">
            <div class="cal-legend-item"><div class="cal-legend-dot cal-legend-dot-available"></div><span>Available</span></div>
            <div class="cal-legend-item"><div class="cal-legend-dot cal-legend-dot-full"></div><span>Full</span></div>
            <div class="cal-legend-item"><div class="cal-legend-dot cal-legend-dot-selected"></div><span>Selected</span></div>
            <div class="cal-legend-item"><div class="cal-legend-dot cal-legend-dot-past"></div><span>Past</span></div>
          </div>
        </div>

        <!-- Time Slots -->
        <div v-if="selectedDate && selectedDate.isCurrentMonth" class="time-slots-section">
          <h4 class="time-slots-title">Available Time Slots for {{ formatSelectedDate(selectedDate) }}</h4>

          <div v-if="loadingAvailability" class="loading-state">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p class="text-gray-500">Loading time slots...</p>
          </div>
          <div v-else-if="availableSchedules.length === 0" class="empty-state">
            <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No available schedules for this date</p>
          </div>
          <div v-else class="slots-grid">
            <button
              v-for="s in availableSchedules"
              :key="scheduleKey(s)"
              type="button"
              @click="pickSchedule(s)"
              :class="['slot-card', isPicked(s) ? 'slot-card-picked' : '']"
            >
              <div class="slot-card-top">
                <div class="slot-time">{{ s.startTime }} - {{ s.endTime }}</div>
                <span v-if="s.isPackage" class="badge badge-green text-xs">2-Day Package</span>
              </div>
              <div class="slot-instructor">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {{ s.instructor }}
              </div>
              <div v-if="s.isPackage" class="slot-package-dates">
                Day 1: {{ formatDateYMD(s.day1_date) }} • Day 2: {{ formatDateYMD(s.day2_date) }}
              </div>
              <div class="slot-availability" :class="Number(s.availableSlots) > 0 ? 'text-emerald' : 'text-red-500'">
                {{ s.availableSlots }} slot{{ Number(s.availableSlots) !== 1 ? 's' : '' }} available
              </div>
              <div v-if="s.isPackage" class="text-xs text-gray-500 mt-1">Selecting reserves BOTH days</div>
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div class="notes-section">
          <label class="notes-label">Notes (Optional)</label>
          <textarea v-model="reservationForm.notes" rows="3" placeholder="Any special requests or notes..." class="notes-textarea"></textarea>
        </div>

        <div class="step-actions">
          <button class="btn-back" @click="activeTab = 'courses'">Back</button>
          <button class="btn-next" :disabled="!canGoUpload" @click="goToUpload">Continue to Upload</button>
        </div>
      </div>

      <!-- ===================== -->
      <!-- 3) UPLOAD REQUIREMENTS -->
      <!-- ===================== -->
      <div v-if="activeTab === 'upload'" class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Requirements</h3>
          <span class="panel-tag">Upload</span>
        </div>

        <div class="slot-info-banner" :class="{ 'slot-info-pdc': isPDCCourse }">
          <div class="font-semibold text-green-800">
            <span v-if="isPDCCourse">🚗 PDC</span>
            <span v-else>📚 TDC</span>
            Course: <span class="font-bold">{{ selectedCourse?.course_name }} ({{ selectedCourse?.course_code }})</span>
          </div>
          <div class="text-sm text-green-800 mt-1">
            Slot: <span class="font-semibold">Schedule #{{ reservationForm.schedule_id || "—" }}</span>
            <span v-if="selectedPickedPackage" class="badge badge-green ml-2">2-day package</span>
          </div>

          <div class="mt-4 p-3 bg-white rounded-lg border border-green-200">
            <div class="text-sm font-semibold text-gray-700 mb-2">Requirements Submission</div>
            <label class="radio-label">
              <input type="radio" value="online" v-model="requirementsMode" class="radio-input" />
              Online upload now
            </label>
            <label class="radio-label mt-2">
              <input type="radio" value="walkin" v-model="requirementsMode" @change="onRequirementsModeChange" class="radio-input" />
              Walk-in (on-site submission)
            </label>
            <p class="text-xs text-gray-500 mt-2">
              Note: <span class="font-semibold">2x2 Picture</span> is still required even for walk-in.
            </p>
          </div>
        </div>

        <div v-if="uploadLoading" class="loading-state">
          <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-gray-500">Loading requirements...</p>
        </div>

        <div v-else class="requirements-list">
          <!-- 2x2 Picture (Always Required) -->
          <div class="req-upload-card req-upload-card-required">
            <div class="req-upload-header">
              <span class="req-upload-title">2x2 Picture <span class="text-red-500">*</span></span>
              <span class="badge badge-red text-xs">Required</span>
            </div>
            <div class="req-upload-desc">
              <ul class="list-disc pl-4 text-sm text-gray-600 space-y-1">
                <li>2x2 identification photo</li>
                <li>Plain white background</li>
                <li>Well-lit environment (no shadows)</li>
                <li>Facing the camera directly</li>
                <li>Neutral facial expression</li>
                <li>No hats, caps, or sunglasses</li>
              </ul>
            </div>
            <div class="file-upload-row">
              <input type="file" @change="onTwoByTwoChange" class="file-input" accept="image/*" />
              <span v-if="twoByTwoFile" class="file-selected">Selected: {{ twoByTwoFile.name }}</span>
              <span v-else class="file-not-selected">No file selected</span>
            </div>
            <div v-if="!twoByTwoFile" class="text-xs text-red-500 mt-1">Required before continuing.</div>
          </div>

          <!-- PDC field -->
          <div v-if="isPDCCourse" class="req-upload-card req-upload-card-pdc">
            <div class="req-upload-header">
              <span class="req-upload-title">LTO Client ID <span class="text-red-500">*</span></span>
              <span class="badge badge-green text-xs">PDC Required</span>
            </div>
            <p class="text-xs text-gray-500 mb-2">Required for PDC enrollment. Found on your Student Permit or Driver's License.</p>
            <input type="text" v-model="ltoClientId" placeholder="e.g. N02-12-345678" maxlength="50" class="text-input" />
          </div>

          <!-- Other requirements -->
          <div v-if="selectedRequirements.length === 0 && !isPDCCourse" class="text-center py-4 text-gray-500 text-sm">
            No additional requirements for this course.
          </div>

          <div v-for="req in selectedRequirements" :key="req.requirement_id" class="req-upload-card">
            <div class="req-upload-header">
              <span class="req-upload-title">{{ req.requirement_text }}</span>
            </div>
            <div class="file-upload-row">
              <input type="file" :disabled="requirementsMode === 'walkin'" @change="onFileChange(req.requirement_id, $event)" class="file-input" accept="image/*,.pdf" />
              <span v-if="requirementsMode === 'walkin'" class="file-selected">Will submit on-site</span>
              <span v-else-if="uploads[req.requirement_id]" class="file-selected">Selected: {{ uploads[req.requirement_id].name }}</span>
              <span v-else class="file-not-selected">No file selected</span>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn-back" @click="activeTab = 'slot'">Back</button>
          <button class="btn-next" :disabled="!canGoPayment" @click="activeTab = 'payment'">Continue to Payment</button>
        </div>
      </div>

      <!-- ===================== -->
      <!-- 4) PAYMENT -->
      <!-- ===================== -->
      <div v-if="activeTab === 'payment'" class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Payment</h3>
          <span class="panel-tag">Checkout</span>
        </div>

        <div class="payment-summary">
          <div class="payment-summary-row">
            <span class="payment-summary-label">Course Type</span>
            <span class="payment-summary-value">
              <span v-if="isPDCCourse" class="badge badge-green">PDC</span>
              <span v-else class="badge badge-blue">TDC</span>
            </span>
          </div>
          <div class="payment-summary-row">
            <span class="payment-summary-label">Course Fee</span>
            <span class="payment-summary-value text-emerald font-bold">₱{{ Number(selectedCourse?.course_fee || 0).toLocaleString() }}</span>
          </div>
          <div class="payment-summary-row">
            <span class="payment-summary-label">Course</span>
            <span class="payment-summary-value">{{ selectedCourse?.course_name }} ({{ selectedCourse?.course_code }})</span>
          </div>
          <div class="payment-summary-row">
            <span class="payment-summary-label">Slot</span>
            <span class="payment-summary-value">
              Schedule #{{ reservationForm.schedule_id }}
              <span v-if="selectedPickedPackage" class="badge badge-green ml-2">2-day package</span>
            </span>
          </div>
          <div class="payment-summary-row">
            <span class="payment-summary-label">Requirements</span>
            <span class="payment-summary-value">{{ requirementsMode === "walkin" ? "Walk-in" : "Online upload" }}</span>
          </div>
          <div class="payment-summary-row">
            <span class="payment-summary-label">Payment Ref</span>
            <span class="payment-summary-value font-mono">{{ paymentRef || "— (not generated yet)" }}</span>
          </div>
          <div v-if="qrphSubmitted" class="text-sm text-emerald font-medium mt-2 p-2 bg-green-50 rounded-lg">
            ✅ Proof submitted! Now click 'Reserve Slot' to finalize.
          </div>
        </div>

        <!-- Payment mode -->
        <div class="payment-mode-section">
          <div class="section-label">Payment Mode</div>
          <label class="radio-label">
            <input type="radio" value="online" v-model="paymentMode" @change="onPaymentModeChange" class="radio-input" />
            Online payment
          </label>
          <label class="radio-label mt-2">
            <input type="radio" value="cash" v-model="paymentMode" @change="onPaymentModeChange" class="radio-input" />
            Cash on-site
          </label>
        </div>

        <!-- Payment method (online) -->
        <div v-if="paymentMode === 'online'" class="payment-method-section">
          <label class="section-label">Payment Method</label>
          <select v-model="payment.paymentMethod" class="select-modern" required>
            <option value="" disabled>Select payment method</option>
            <option value="GCASH">GCash (QRPH)</option>
          </select>

          <div v-if="payment.paymentMethod === 'GCASH'" class="mt-3">
            <button class="btn-gcash" :disabled="isSubmitting || !reservationForm.schedule_id" @click="openGcashModal" type="button" :title="!reservationForm.schedule_id ? 'Pick a schedule first' : ''">
              Open GCash Payment (QRPH)
            </button>
          </div>
        </div>

        <div class="step-actions">
          <button class="btn-back" @click="activeTab = 'upload'">Back</button>
          <button class="btn-submit" :disabled="!canSubmitFinal" @click="onConfirmClick">
            {{ isSubmitting ? "Processing..." : confirmButtonText }}
          </button>
        </div>

        <div class="payment-note">
          <p>✅ Reservation locks your slot immediately.</p>
          <p>✅ Online proof (optional): upload proof so admin can check.</p>
          <p>✅ Cash/On-site: pay personally on your schedule date.</p>
        </div>
      </div>
    </div>

    <!-- ===================== -->
    <!-- GCash QRPH Modal -->
    <!-- ===================== -->
    <transition name="modal-fade">
      <div v-if="showGcashModal" class="modal-overlay" @click.self="closeGcashModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg">
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">Pay with GCash (QRPH)</h3>
              <button class="modal-close-btn" @click="closeGcashModal" :disabled="gcashLoading">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="gcash-info">
                <div>Course: <span class="font-medium">{{ selectedCourse?.course_name }}</span></div>
                <div>Amount: <span class="font-semibold text-emerald">₱{{ Number(selectedCourse?.course_fee || 0).toLocaleString() }}</span></div>
                <div class="text-xs text-gray-500">Payment Ref: <span class="font-mono">{{ paymentRef || "—" }}</span></div>
              </div>

              <div v-if="gcashError" class="alert-error">{{ gcashError }}</div>

              <!-- If no paymentRef yet -->
              <div v-if="!paymentRef" class="gcash-generate">
                <p class="text-sm text-gray-600 mb-4">Generate a Payment Ref first to match your proof.</p>
                <button class="btn-gcash w-full" @click="createQrphPaymentRef" :disabled="gcashLoading || !reservationForm.schedule_id">
                  {{ gcashLoading ? "Preparing..." : "Generate Payment Ref" }}
                </button>
              </div>

              <!-- Once paymentRef exists -->
              <div v-else class="gcash-grid">
                <div class="gcash-qr-panel">
                  <div class="text-sm font-semibold text-gray-800 mb-3">Scan this QRPH in your GCash app</div>
                  <div class="qr-image-wrapper">
                    <img src="/adminqrph.png" alt="QRPH" class="qr-image" />
                  </div>
                  <ol class="qr-steps">
                    <li>Open GCash → Scan QR</li>
                    <li>Pay the exact amount</li>
                    <li>Screenshot/receipt</li>
                    <li>Upload proof on the right</li>
                  </ol>
                </div>

                <div class="gcash-proof-panel">
                  <div class="text-sm font-semibold text-gray-800 mb-3">Submit Proof of Payment</div>
                  <div class="proof-upload-area">
                    <label class="text-xs font-medium text-gray-700 mb-2 block">Upload proof (image/PDF)</label>
                    <input type="file" accept="image/*,.pdf" @change="onQrphProofChange" class="file-input" />
                    <div class="mt-2 text-xs">
                      <span v-if="qrphProofFile" class="file-selected">Selected: {{ qrphProofFile.name }}</span>
                      <span v-else class="file-not-selected">No file selected</span>
                    </div>
                    <button class="btn-submit-sm mt-3" @click="uploadQrphProof" :disabled="gcashLoading || !qrphProofFile">
                      {{ gcashLoading ? "Uploading..." : "Submit Proof" }}
                    </button>
                    <div v-if="qrphSubmitted" class="proof-submitted-msg">
                      ✅ Submitted! Waiting for admin verification.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-cancel" @click="closeGcashModal" :disabled="gcashLoading">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Toast Notification -->
    <transition name="modal-fade">
      <div v-if="toast.show" class="toast-container">
        <div class="toast-card" :class="toastClass">
          <div class="toast-icon">
            {{ toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌' }}
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div v-if="toast.message" class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" @click="toast.show = false">✕</button>
        </div>
      </div>
    </transition>
  </StudentLayout>
</template>

<script>
import StudentLayout from "./StudentLayout.vue";
import axios from "axios";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// avoid UTC shift
const toLocalYMD = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default {
  name: "StudentEnroll",
  components: { StudentLayout },

  data() {
    return {
      searchQuery: "",
      activeTab: "courses",

      courses: [],
      loadingCourses: false,

      requirementsMap: {},
      showReqMap: {},
      loadingReqMap: {},

      selectedCourse: null,

      uploadLoading: false,

      requirementsMode: "online",
      paymentMode: "online",

      uploads: {},

      // ALWAYS REQUIRED: 2x2 file
      twoByTwoFile: null,

      currentDate: new Date(),
      selectedDate: null,
      scheduleMap: {},
      loadingMonth: false,

      availableSchedules: [],
      loadingAvailability: false,

      payment: {
        paymentMethod: "",
        proofFile: null,
      },

      isSubmitting: false,

      // QRPH payment
      paymentRef: "",
      qrphProofFile: null,
      qrphSubmitted: false,

      // Modal state
      showGcashModal: false,
      gcashLoading: false,
      gcashError: "",

      reservationForm: {
        course: "",
        schedule_id: "",
        notes: "",
      },

      // Active reservation state
      activeReservation: null,
      loadingActiveReservation: false,

      daysOfWeek: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],

      // Toast notification
      toast: {
        show: false,
        type: "success",
        title: "",
        message: "",
        _timer: null,
      },
      ltoClientId: "",
    };
  },

  computed: {
    hasActiveReservation() {
      return Boolean(this.activeReservation);
    },

    selectedPickedPackage() {
      const sid = String(this.reservationForm.schedule_id || "");
      if (!sid) return false;
      return this.availableSchedules.some((s) => {
        if (s?.isPackage) return String(s.day1_schedule_id) === sid;
        return false;
      });
    },

    // Separate TDC and PDC courses
    theoreticalCourses() {
      const q = (this.searchQuery || "").trim().toLowerCase();
      let filtered = this.courses.filter((c) => {
        const code = (c.course_code || "").toUpperCase();
        return !code.includes("PDC");
      });
      if (q) {
        filtered = filtered.filter((c) => {
          return (
            (c.course_name || "").toLowerCase().includes(q) ||
            (c.course_code || "").toLowerCase().includes(q) ||
            (c.description || "").toLowerCase().includes(q) ||
            (c.duration || "").toLowerCase().includes(q)
          );
        });
      }
      return filtered;
    },

    practicalCourses() {
      const q = (this.searchQuery || "").trim().toLowerCase();
      let filtered = this.courses.filter((c) => {
        const code = (c.course_code || "").toUpperCase();
        return code.includes("PDC");
      });
      if (q) {
        filtered = filtered.filter((c) => {
          return (
            (c.course_name || "").toLowerCase().includes(q) ||
            (c.course_code || "").toLowerCase().includes(q) ||
            (c.description || "").toLowerCase().includes(q) ||
            (c.duration || "").toLowerCase().includes(q)
          );
        });
      }
      return filtered;
    },

    filteredCourses() {
      return [...this.theoreticalCourses, ...this.practicalCourses];
    },

    isPDCCourse() {
      if (!this.selectedCourse) return false;
      const code = (this.selectedCourse.course_code || "").toUpperCase();
      return code.includes("PDC");
    },

    selectedRequirements() {
      const id = this.selectedCourse?.id;
      return id ? (this.requirementsMap[id] || []) : [];
    },

    currentMonth() {
      return this.currentDate.toLocaleString("default", { month: "long" });
    },
    currentYear() {
      return this.currentDate.getFullYear();
    },

    calendarDays() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDay = firstDay.getDay();

      const days = [];

      for (let i = startDay - 1; i >= 0; i--) {
        const d = new Date(year, month, -i);
        const dateString = toLocalYMD(d);
        days.push({
          key: `prev-${dateString}`,
          date: dateString,
          day: d.getDate(),
          isCurrentMonth: false,
          available: false,
          slots: 0,
          isSelected: this.selectedDate?.date === dateString,
        });
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateString = toLocalYMD(d);
        const info = this.scheduleMap[dateString];
        const slots = info ? Number(info.availableSlots || 0) : 0;
        const available = info ? slots > 0 : null;

        days.push({
          key: `cur-${dateString}`,
          date: dateString,
          day,
          isCurrentMonth: true,
          available,
          slots,
          isSelected: this.selectedDate?.date === dateString,
        });
      }

      const totalCells = 42;
      const remainingCells = totalCells - days.length;

      for (let i = 1; i <= remainingCells; i++) {
        const d = new Date(year, month + 1, i);
        const dateString = toLocalYMD(d);
        days.push({
          key: `next-${dateString}`,
          date: dateString,
          day: d.getDate(),
          isCurrentMonth: false,
          available: false,
          slots: 0,
          isSelected: this.selectedDate?.date === dateString,
        });
      }

      return days;
    },

    canGoUpload() {
      return Boolean(!this.hasActiveReservation && this.selectedCourse && this.reservationForm.schedule_id);
    },

    canProceedUploadStep() {
      if (!this.canGoUpload) return false;
      if (!this.twoByTwoFile) return false;
      if (this.isPDCCourse && !this.ltoClientId.trim()) return false;
      if (this.requirementsMode === "walkin") return true;
      const reqs = this.selectedRequirements;
      if (!reqs.length) return true;
      return reqs.every((r) => Boolean(this.uploads[r.requirement_id]));
    },

    canGoPayment() {
      return this.canProceedUploadStep;
    },

    canSubmitFinal() {
      if (this.hasActiveReservation) return false;
      if (!this.selectedCourse) return false;
      if (!this.reservationForm.schedule_id) return false;
      if (!this.canProceedUploadStep) return false;
      if (this.isSubmitting) return false;
      if (this.paymentMode === "cash") return true;
      if (!this.payment.paymentMethod) return false;
      return true;
    },

    confirmButtonText() {
      return "Reserve Slot (Confirmed)";
    },

    toastClass() {
      const base = "toast-card";
      if (this.toast.type === "success") return `${base} toast-success`;
      if (this.toast.type === "warning") return `${base} toast-warning`;
      return `${base} toast-error`;
    },
  },

  methods: {
    showToast(title, message = "", type = "success", ms = 3500) {
      try { if (this.toast._timer) clearTimeout(this.toast._timer); } catch (e) {}
      this.toast.type = type;
      this.toast.title = String(title || "");
      this.toast.message = String(message || "");
      this.toast.show = true;
      this.toast._timer = setTimeout(() => {
        this.toast.show = false;
        this.toast._timer = null;
      }, Number(ms) || 3500);
    },

    mapStudentStatus(status) {
      const s = String(status || "").toUpperCase();
      if (s === "PENDING" || s === "APPROVED") return "CONFIRMED";
      return s || "—";
    },

    scheduleKey(s) {
      if (s?.isPackage) return `pkg-${s.day1_schedule_id}-${s.day2_schedule_id}`;
      return `sch-${s.schedule_id}`;
    },

    isPicked(s) {
      const sid = String(this.reservationForm.schedule_id || "");
      if (!sid) return false;
      if (s?.isPackage) return String(s.day1_schedule_id) === sid;
      return String(s.schedule_id) === sid;
    },

    isPastDate(ymd) {
      const today = toLocalYMD(new Date());
      return String(ymd || "") < today;
    },

    isDayDisabled(day) {
      if (!day.isCurrentMonth) return true;
      if (this.isPastDate(day.date)) return true;
      if (day.available === false || Number(day.slots || 0) <= 0) return true;
      if (day.available === null) return true;
      return false;
    },

    tabClass(tab, disabled = false) {
      const base = "tab-btn";
      if (disabled) return `${base} tab-disabled`;
      return this.activeTab === tab ? `${base} tab-active` : `${base} tab-inactive`;
    },

    formatDateYMD(ymd) {
      if (!ymd) return "—";
      const d = new Date(String(ymd) + "T00:00:00");
      if (Number.isNaN(d.getTime())) return String(ymd);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },

    onTwoByTwoChange(e) {
      this.twoByTwoFile = e.target.files?.[0] || null;
    },

    async fetchActiveReservation() {
      this.loadingActiveReservation = true;
      try {
        const res = await api.get("/student/reservations/active");
        this.activeReservation = res.data?.data || null;
        if (this.activeReservation) {
          this.activeTab = "courses";
          this.selectedCourse = null;
          this.selectedDate = null;
          this.availableSchedules = [];
          this.reservationForm.course = "";
          this.reservationForm.schedule_id = "";
          this.reservationForm.notes = "";
        }
      } catch (err) {
        console.error("fetchActiveReservation error:", err);
        this.activeReservation = null;
      } finally {
        this.loadingActiveReservation = false;
      }
    },

    async fetchCourses() {
      this.loadingCourses = true;
      try {
        const res = await api.get("/student/courses");
        this.courses = Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (err) {
        console.error("fetchCourses error:", err);
        this.courses = [];
        this.showToast("Failed to load courses", err.response?.data?.message || "Please try again.", "error");
      } finally {
        this.loadingCourses = false;
      }
    },

    async toggleRequirements(course) {
      const courseId = course.id;
      this.showReqMap[courseId] = !this.showReqMap[courseId];
      if (this.showReqMap[courseId] && !this.requirementsMap[courseId]) {
        this.loadingReqMap[courseId] = true;
        try {
          const res = await api.get(`/student/courses/${courseId}/requirements`);
          this.requirementsMap[courseId] = Array.isArray(res.data?.data) ? res.data.data : [];
        } catch (err) {
          console.error("toggleRequirements error:", err);
          this.requirementsMap[courseId] = [];
          this.showToast("Failed to load requirements", err.response?.data?.message || "Please try again.", "error");
        } finally {
          this.loadingReqMap[courseId] = false;
        }
      }
    },

    async fetchMonthSchedules() {
      if (!this.reservationForm.course) { this.scheduleMap = {}; return; }
      const y = this.currentDate.getFullYear();
      const m = String(this.currentDate.getMonth() + 1).padStart(2, "0");
      const month = `${y}-${m}`;
      this.loadingMonth = true;
      try {
        const params = { month, course_id: Number(this.reservationForm.course) };
        const res = await api.get("/student/schedules", { params });
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const map = {};
        for (const r of rows) map[r.date] = r;
        this.scheduleMap = map;
      } catch (err) {
        console.error("fetchMonthSchedules error:", err);
        this.scheduleMap = {};
        this.showToast("Failed to load month schedules", err.response?.data?.message || "Please try again.", "error");
      } finally {
        this.loadingMonth = false;
      }
    },

    async fetchAvailabilityForSelectedDate() {
      if (!this.selectedDate?.date) return;
      if (!this.reservationForm.course) return;
      this.loadingAvailability = true;
      try {
        const res = await api.get("/student/availability", {
          params: { date: this.selectedDate.date, course_id: Number(this.reservationForm.course) },
        });
        this.availableSchedules = Array.isArray(res.data?.data) ? res.data.data : [];
      } catch (err) {
        console.error("fetchAvailability error:", err);
        this.availableSchedules = [];
        this.showToast("Failed to load availability", err.response?.data?.message || "Please try again.", "error");
      } finally {
        this.loadingAvailability = false;
      }
    },

    async selectCourse(course) {
      if (this.hasActiveReservation) {
        this.showToast("You already have an active reservation", "You can reserve again once it's marked DONE.", "warning");
        return;
      }
      this.selectedCourse = course;
      this.reservationForm.course = String(course.id);
      this.selectedDate = null;
      this.availableSchedules = [];
      this.reservationForm.schedule_id = "";
      this.reservationForm.notes = "";
      this.requirementsMode = "online";
      this.paymentMode = "online";
      this.uploads = {};
      this.payment.paymentMethod = "";
      this.payment.proofFile = null;
      this.twoByTwoFile = null;
      this.paymentRef = "";
      this.qrphProofFile = null;
      this.qrphSubmitted = false;
      this.showGcashModal = false;
      this.gcashLoading = false;
      this.gcashError = "";

      if (!this.requirementsMap[course.id]) {
        this.uploadLoading = true;
        try {
          const res = await api.get(`/student/courses/${course.id}/requirements`);
          this.requirementsMap[course.id] = Array.isArray(res.data?.data) ? res.data.data : [];
        } catch (err) {
          console.error("selectCourse requirements error:", err);
          this.requirementsMap[course.id] = [];
          this.showToast("Failed to load requirements", err.response?.data?.message || "Please try again.", "error");
        } finally {
          this.uploadLoading = false;
        }
      }
      await this.fetchMonthSchedules();
      this.activeTab = "slot";
    },

    async selectDate(day) {
      if (this.isDayDisabled(day)) return;
      if (!this.reservationForm.course) return;
      this.selectedDate = day;
      this.availableSchedules = [];
      this.reservationForm.schedule_id = "";
      await this.fetchAvailabilityForSelectedDate();
    },

    pickSchedule(s) {
      if (s?.isPackage) {
        this.reservationForm.schedule_id = String(s.day1_schedule_id);
      } else {
        this.reservationForm.schedule_id = String(s.schedule_id);
      }
    },

    goToUpload() {
      if (!this.canGoUpload) {
        this.showToast("Pick a slot first", "Select a date and time slot to continue.", "warning");
        return;
      }
      this.activeTab = "upload";
    },

    onFileChange(requirementId, event) {
      const file = event.target.files?.[0];
      if (!file) return;
      this.uploads = { ...this.uploads, [requirementId]: file };
    },

    onRequirementsModeChange() {
      if (this.requirementsMode === "walkin") {
        this.uploads = {};
        this.showToast("Walk-in selected", "Other files not required here, but 2x2 Picture is still required.", "success");
      }
    },

    onPaymentModeChange() {
      if (this.paymentMode === "cash") {
        this.payment.paymentMethod = "";
        this.payment.proofFile = null;
        this.showToast("Cash on-site selected", "You can reserve without uploading payment proof.", "success");
      }
    },

    previousMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
      this.selectedDate = null;
      this.availableSchedules = [];
      this.reservationForm.schedule_id = "";
      this.fetchMonthSchedules();
    },

    nextMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
      this.selectedDate = null;
      this.availableSchedules = [];
      this.reservationForm.schedule_id = "";
      this.fetchMonthSchedules();
    },

    formatSelectedDate(dateObj) {
      const d = new Date(dateObj.date + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    openGcashModal() {
      if (!this.reservationForm.schedule_id) {
        this.showToast("Pick a schedule first", "Select a slot before opening QR payment.", "warning");
        return;
      }
      this.gcashError = "";
      this.showGcashModal = true;
    },

    closeGcashModal() {
      this.showGcashModal = false;
      this.gcashLoading = false;
      this.gcashError = "";
    },

    onQrphProofChange(e) {
      this.qrphProofFile = e.target.files?.[0] || null;
    },

    async createQrphPaymentRef() {
      try {
        this.gcashLoading = true;
        this.gcashError = "";
        if (!this.reservationForm.schedule_id) {
          this.gcashError = "Pick a schedule first.";
          this.showToast("Pick a schedule first", "Select a slot before generating payment ref.", "warning");
          return;
        }
        const res = await api.post("/student/payments/qrph/create", {
          course_id: Number(this.selectedCourse.id),
          schedule_id: Number(this.reservationForm.schedule_id),
          notes: this.reservationForm.notes || null,
        });
        this.paymentRef = res.data?.data?.payment_ref || "";
        if (!this.paymentRef) throw new Error("No payment_ref returned.");
        this.showToast("Payment Ref created", this.paymentRef, "success");
      } catch (err) {
        console.error("createQrphPaymentRef error:", err.response?.data || err);
        this.gcashError = err.response?.data?.message || err.message || "Failed to create payment ref.";
        this.showToast("Failed to create payment ref", this.gcashError, "error");
      } finally {
        this.gcashLoading = false;
      }
    },

    async uploadQrphProof() {
      try {
        this.gcashLoading = true;
        this.gcashError = "";
        if (!this.paymentRef) {
          this.gcashError = "Generate Payment Ref first.";
          this.showToast("Generate Payment Ref first", "Create payment ref before uploading proof.", "warning");
          return;
        }
        if (!this.qrphProofFile) {
          this.gcashError = "Select a proof file first.";
          this.showToast("Select a proof file", "Choose an image/PDF to upload.", "warning");
          return;
        }
        const fd = new FormData();
        fd.append("proof", this.qrphProofFile);
        await api.post(`/student/payments/qrph/${encodeURIComponent(this.paymentRef)}/proof`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.qrphSubmitted = true;
        this.showToast("Proof submitted", "Admin can now verify your payment.", "success");
      } catch (err) {
        console.error("uploadQrphProof error:", err.response?.data || err);
        this.gcashError = err.response?.data?.message || err.message || "Failed to upload proof.";
        this.showToast("Failed to upload proof", this.gcashError, "error");
      } finally {
        this.gcashLoading = false;
      }
    },

    async onConfirmClick() {
      if (!this.canSubmitFinal) return;
      return this.submitReservationAndUploads();
    },

    async submitReservationAndUploads() {
      this.isSubmitting = true;
      try {
        const payment_method =
          this.paymentMode === "cash" ? "CASH" : String(this.payment.paymentMethod || "").trim().toUpperCase();

        const reservationPayload = {
          schedule_id: Number(this.reservationForm.schedule_id),
          course_id: Number(this.selectedCourse.id),
          notes: this.reservationForm.notes || null,
          payment_method,
          requirements_mode: this.requirementsMode,
          fee_option_code: null,
          lto_client_id: this.ltoClientId?.trim() || null,
        };

        if (payment_method === "GCASH") {
          reservationPayload.payment_ref = this.paymentRef || null;
        }

        const resCreate = await api.post("/student/reservations", reservationPayload);
        const reservationId =
          resCreate.data?.data?.reservation_id ||
          resCreate.data?.reservation_id ||
          resCreate.data?.data?.id;

        if (!reservationId) {
          throw new Error("Reservation created but reservation_id not returned by backend.");
        }

        const fd = new FormData();
        if (this.twoByTwoFile) {
          fd.append("picture_2x2", this.twoByTwoFile);
        }

        if (this.requirementsMode === "online") {
          for (const [rid, file] of Object.entries(this.uploads)) {
            fd.append("requirement_ids", String(rid));
            fd.append("files", file);
          }
          if (this.isPDCCourse && this.ltoClientId.trim()) {
            fd.append("lto_client_id", this.ltoClientId.trim());
          }
        }

        await api.post(`/student/reservations/${reservationId}/requirements`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        this.showToast("Reservation confirmed!", "Your slot is locked.", "success");
        await this.fetchActiveReservation();
        this.resetAll();
      } catch (err) {
        console.error("submitReservationAndUploads error:", err.response?.data || err);
        this.showToast("Reservation failed", err.response?.data?.message || err.message || "Please try again.", "error");
      } finally {
        this.isSubmitting = false;
      }
    },

    resetAll() {
      this.activeTab = "courses";
      this.selectedCourse = null;
      this.selectedDate = null;
      this.availableSchedules = [];
      this.scheduleMap = {};
      this.reservationForm.course = "";
      this.reservationForm.schedule_id = "";
      this.reservationForm.notes = "";
      this.requirementsMode = "online";
      this.paymentMode = "online";
      this.uploads = {};
      this.payment.paymentMethod = "";
      this.payment.proofFile = null;
      this.paymentRef = "";
      this.qrphProofFile = null;
      this.qrphSubmitted = false;
      this.showGcashModal = false;
      this.gcashLoading = false;
      this.gcashError = "";
      this.twoByTwoFile = null;
      this.fetchCourses();
    },
  },

  async mounted() {
    await this.fetchActiveReservation();
    await this.fetchCourses();
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.enrollment-wrapper {
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== HEADER ===== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 380px;
}

.search-icon-svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9ca3af;
}

.search-input-modern {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  color: #111827 !important;
  background: #fff !important;
}

.search-input-modern:focus {
  border-color: #10b981;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.refresh-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== PAGE TOP ===== */
.page-top {
  margin-bottom: 4px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.page-subtitle {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 4px 0 0;
}

/* ===== ALERT BANNER ===== */
.alert-banner {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 16px;
  padding: 16px 20px;
}

.alert-banner-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* ===== TABS ===== */
.tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.tab-active {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}

.tab-inactive {
  background: #f3f4f6;
  color: #374151;
  border-color: #e5e7eb;
}

.tab-inactive:hover:not(.tab-disabled) {
  background: #e5e7eb;
}

.tab-disabled {
  background: #f3f4f6;
  color: #d1d5db;
  cursor: not-allowed;
  border-color: #e5e7eb;
}

/* ===== PANEL CARD ===== */
.panel-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
}

.panel-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.panel-tag {
  font-size: 0.72rem;
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 500;
}

/* ===== LOADING / EMPTY STATES ===== */
.loading-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}

.col-span-full {
  grid-column: 1 / -1;
}

/* ===== COURSES GRID ===== */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px;
}

.course-card {
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transform: translateY(-2px);
  border-color: #3b82f6;
}

.course-card-pdc:hover {
  border-color: #10b981;
}

.course-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.course-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #059669;
  margin: 0;
}

.course-card-code {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.course-card-desc {
  font-size: 0.85rem;
  color: #374151;
  margin: 0;
}

.req-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  background: #f0fdf4;
  border: 1px solid #d1fae5;
  border-radius: 10px;
  color: #059669;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.req-toggle-btn:hover {
  background: #d1fae5;
}

.req-content {
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  border-top: 0 solid transparent;
}

.req-content-open {
  max-height: 300px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.req-title {
  font-weight: 600;
  color: #374151;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.req-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.req-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.82rem;
  color: #374151;
  padding: 4px 0;
}

.req-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.course-card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.course-stat {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px;
}

.course-stat-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.course-stat-value {
  display: block;
  font-weight: 700;
  color: #111827;
  font-size: 0.9rem;
  margin-top: 2px;
}

.btn-select-course {
  width: 100%;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-select-course:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-select-pdc {
  background: #10b981;
}

.btn-select-pdc:hover:not(:disabled) {
  background: #059669;
}

.btn-select-course:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

/* ===== BADGES ===== */
.badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.badge-green {
  background: #d1fae5;
  color: #059669;
}

.badge-blue {
  background: #dbeafe;
  color: #2563eb;
}

.badge-red {
  background: #fee2e2;
  color: #dc2626;
}

/* ===== SLOT INFO BANNER ===== */
.slot-info-banner {
  margin: 16px;
  padding: 16px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
}

.slot-info-pdc {
  background: #f0fdf4;
  border-color: #d1fae5;
}

/* ===== CALENDAR ===== */
.calendar-wrapper {
  padding: 0 16px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cal-nav-btn {
  padding: 8px 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  color: #374151;
  transition: all 0.15s;
}

.cal-nav-btn:hover {
  background: #f3f4f6;
  border-color: #10b981;
}

.cal-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.cal-day-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 4px;
}

.cal-day-header {
  font-size: 0.7rem;
  font-weight: 700;
  color: #059669;
  padding: 6px 0;
}

.cal-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-day {
  padding: 10px 4px;
  text-align: center;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  color: #374151;
  border: 2px solid transparent;
}

.cal-day:hover:not(.cal-day-disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.cal-day-other {
  color: #d1d5db;
  cursor: default;
}

.cal-day-past {
  color: #ef4444;
  background: #fef2f2;
  border-color: #fecaca;
}

.cal-day-available {
  background: #10b981;
  color: #fff;
  font-weight: 700;
  border-color: #059669;
}

.cal-day-available:hover {
  background: #059669;
}

.cal-day-full {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

.cal-day-selected {
  background: #d1fae5;
  color: #059669;
  font-weight: 700;
  border-color: #10b981;
  box-shadow: 0 0 0 2px #10b981;
}

.cal-day-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cal-legend {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.cal-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: #6b7280;
}

.cal-legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.cal-legend-dot-available {
  background: #10b981;
}

.cal-legend-dot-full {
  background: #ef4444;
}

.cal-legend-dot-selected {
  background: #d1fae5;
  border: 2px solid #10b981;
}

.cal-legend-dot-past {
  background: #fecaca;
}

/* ===== TIME SLOTS ===== */
.time-slots-section {
  padding: 16px;
}

.time-slots-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}

.slot-card {
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  text-align: left;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
}

.slot-card:hover {
  border-color: #10b981;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.slot-card-picked {
  border-color: #10b981;
  background: #f0fdf4;
}

.slot-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.slot-time {
  font-weight: 700;
  color: #111827;
  font-size: 0.95rem;
}

.slot-instructor {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.slot-package-dates {
  font-size: 0.72rem;
  color: #6b7280;
  margin-top: 4px;
}

.slot-availability {
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 4px;
}

/* ===== NOTES ===== */
.notes-section {
  padding: 16px;
}

.notes-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.notes-textarea {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  font-size: 0.875rem;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;
  resize: vertical;
}

.notes-textarea:focus {
  border-color: #10b981;
}

/* ===== STEP ACTIONS ===== */
.step-actions {
  display: flex;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-back {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f3f4f6;
}

.btn-next {
  padding: 10px 20px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-next:hover:not(:disabled) {
  background: #059669;
}

.btn-next:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-submit {
  padding: 10px 24px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

/* ===== REQUIREMENTS UPLOAD ===== */
.requirements-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.req-upload-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
}

.req-upload-card-required {
  border-color: #d1fae5;
  background: #f0fdf4;
}

.req-upload-card-pdc {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.req-upload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.req-upload-title {
  font-weight: 700;
  color: #111827;
  font-size: 0.9rem;
}

.req-upload-desc {
  margin-bottom: 10px;
}

.file-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.file-input {
  font-size: 0.85rem;
}

.file-selected {
  font-size: 0.8rem;
  color: #059669;
  font-weight: 500;
}

.file-not-selected {
  font-size: 0.8rem;
  color: #9ca3af;
}

.text-input {
  width: 100%;
  max-width: 400px;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #111827;
  outline: none;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: #3b82f6;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #374151;
  cursor: pointer;
}

.radio-input {
  accent-color: #10b981;
}

/* ===== PAYMENT ===== */
.payment-summary {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.payment-summary-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.payment-summary-value {
  font-size: 0.85rem;
  color: #111827;
  font-weight: 500;
}

.payment-mode-section,
.payment-method-section {
  padding: 0 16px 16px;
}

.section-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 8px;
}

.select-modern {
  width: 100%;
  max-width: 400px;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #111827;
  outline: none;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s;
}

.select-modern:focus {
  border-color: #10b981;
}

.btn-gcash {
  padding: 10px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-gcash:hover:not(:disabled) {
  background: #2563eb;
}

.btn-gcash:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.payment-note {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2);
}

.modal-card-lg {
  max-width: 800px;
}

.modal-head {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
}

.modal-head-green {
  background: #f0fdf4;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.modal-close-btn {
  padding: 6px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 20px;
}

.modal-foot {
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.btn-cancel {
  padding: 9px 18px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

/* ===== GCASH MODAL ===== */
.gcash-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #374151;
}

.gcash-generate {
  text-align: center;
  padding: 20px 0;
}

.gcash-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.gcash-qr-panel,
.gcash-proof-panel {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.qr-image-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
  margin-bottom: 10px;
}

.qr-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.qr-steps {
  font-size: 0.72rem;
  color: #6b7280;
  padding-left: 16px;
  margin: 0;
}

.qr-steps li {
  padding: 2px 0;
}

.proof-upload-area {
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.btn-submit-sm {
  width: 100%;
  padding: 10px;
  background: #059669;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit-sm:hover:not(:disabled) {
  background: #047857;
}

.btn-submit-sm:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.proof-submitted-msg {
  margin-top: 10px;
  padding: 10px;
  background: #f0fdf4;
  border: 1px solid #d1fae5;
  border-radius: 10px;
  font-size: 0.82rem;
  color: #059669;
  font-weight: 500;
}

.alert-error {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.82rem;
}

/* ===== MODAL TRANSITIONS ===== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active {
  transition: all 0.25s ease;
}

.modal-scale-leave-active {
  transition: all 0.15s ease;
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

/* ===== TOAST ===== */
.toast-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  width: 92vw;
  max-width: 400px;
}

.toast-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border: 1px solid transparent;
}

.toast-success {
  background: #059669;
  color: #fff;
  border-color: #047857;
}

.toast-warning {
  background: #d97706;
  color: #fff;
  border-color: #b45309;
}

.toast-error {
  background: #dc2626;
  color: #fff;
  border-color: #b91c1c;
}

.toast-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.3;
}

.toast-message {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-top: 2px;
}

.toast-close {
  padding: 4px 8px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.15);
  color: #fff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
}

.toast-close:hover {
  background: rgba(255,255,255,0.25);
}

/* ===== UTILITY ===== */
.text-emerald {
  color: #059669;
}

.text-red-500 {
  color: #ef4444;
}

.mb-4 {
  margin-bottom: 16px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .gcash-grid {
    grid-template-columns: 1fr;
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .slots-grid {
    grid-template-columns: 1fr;
  }
}
</style>