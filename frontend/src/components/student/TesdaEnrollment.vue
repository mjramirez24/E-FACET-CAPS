<template>
  <StudentLayoutTesda active-page="enrollment">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search trainings..."
            class="search-input-modern"
            v-model="searchQuery"
          />
        </div>
      </div>
    </template>

    <div class="enrollment-wrapper">
      <div class="page-top">
        <h2 class="page-title">Training Enrollment</h2>
        <p class="page-subtitle">Browse available TESDA trainings and manage your reservations</p>
      </div>

      <!-- Active Reservation Banner -->
      <div v-if="activeReservation" class="alert-banner">
        <div class="alert-banner-content">
          <svg class="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <div class="font-semibold text-amber-900">You have an ongoing reservation</div>
            <div class="text-sm text-amber-800 mt-1">
              <span class="font-medium">Latest:</span>
              <span class="ml-1">{{ reservationPreview(activeReservation) }}</span>
            </div>
            <div class="text-xs text-amber-700 mt-2">
              Note: You can continue uploading requirements anytime. Your progress won't reset.
            </div>
            <div class="mt-3 flex gap-2">
              <button class="btn-primary-sm" @click="goToUploadFromActiveReservation()">
                Continue Upload
              </button>
              <button class="btn-outline-sm" @click="activeTab = 'my'">
                View My Reservations
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-row">
        <button @click="activeTab = 'trainings'" :class="tabClass('trainings')">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Available Trainings
        </button>
        <button @click="openUploadTab()" :class="tabClass('upload')">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Requirements Upload
        </button>
        <button @click="activeTab = 'my'" :class="tabClass('my')">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          My Reservations
        </button>
      </div>

      <!-- TRAININGS LIST -->
      <div v-if="activeTab === 'trainings'" class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Available Trainings</h3>
          <span class="panel-tag">{{ filteredCourses.length }} training{{ filteredCourses.length !== 1 ? 's' : '' }}</span>
        </div>
        <div v-if="loadingCourses" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-gray-500">Loading trainings...</p>
        </div>
        <div v-else class="courses-grid">
          <div v-for="course in filteredCourses" :key="course.id" class="course-card">
            <div class="course-card-top">
              <div>
                <h4 class="course-card-title">{{ course.course_name }}</h4>
                <p class="course-card-code">{{ course.course_code }}</p>
              </div>
              <span v-if="courseOngoingReservation(course.id)" class="badge badge-amber">
                Enrolled ({{ String(courseOngoingReservation(course.id)?.reservation_status || "PENDING").toUpperCase() }})
              </span>
              <span v-else-if="courseCompletedReservation(course.id)" class="badge badge-purple">
                Completed
              </span>
              <span v-else class="badge badge-blue">Active</span>
            </div>
            <p class="course-card-desc">{{ course.description || "—" }}</p>

            <button @click="toggleRequirements(course.id)" class="req-toggle-btn">
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
                <ul v-if="Array.isArray(course.requirements) && course.requirements.length" class="req-list">
                  <li v-for="(req, idx) in course.requirements" :key="idx" class="req-item">
                    <div class="req-dot"></div>
                    {{ req }}
                  </li>
                </ul>
                <p v-else class="text-sm text-gray-500">— No requirements found</p>
              </div>
            </div>

            <div class="course-card-stats">
              <div class="course-stat">
                <span class="course-stat-label">Duration</span>
                <span class="course-stat-value">{{ course.duration || "—" }}</span>
              </div>
              <div class="course-stat">
                <span class="course-stat-label">Training Fee</span>
                <span class="course-stat-value text-blue">₱{{ Number(course.course_fee || 0).toLocaleString() }}</span>
              </div>
            </div>

            <button @click="toggleSchedules(course)" class="btn-view-slots" :disabled="loadingSchedules && selectedCourse?.id === course.id">
              {{ schedulesOpenFor(course.id) ? "Hide Batches/Slots" : "View Batches/Slots" }}
            </button>

            <div v-if="schedulesOpenFor(course.id)" class="slots-container">
              <div v-if="loadingSchedules && selectedCourse?.id === course.id" class="text-sm text-gray-500 p-3">
                Loading batches...
              </div>
              <div v-else-if="!schedules.length" class="text-sm text-gray-500 p-3">
                No batches available for this training yet.
              </div>
              <div v-else class="slots-list">
                <div v-for="s in schedules" :key="String(s.id) + '-' + String(s.date || 'TBA')" class="slot-card">
                  <div class="slot-info">
                    <div class="slot-schedule">
                      <template v-if="isScheduled(s)">
                        {{ formatDateNice(s.date) }} → {{ formatDateNice(tesdaEndDateFromStart(s.date, selectedCourse?.duration)) }}
                        <span class="slot-tag slot-tag-blue">Scheduled</span>
                      </template>
                      <template v-else>
                        To Be Announced
                        <span class="slot-tag slot-tag-gray">TBA</span>
                      </template>
                    </div>
                    <div class="slot-meta">
                      <span><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {{ s.startTime || "08:00" }}-{{ s.endTime || "17:00" }}</span>
                      <span><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> {{ s.instructor || "—" }}</span>
                    </div>
                    <div class="slot-availability">
                      <span class="font-medium">Slots:</span>
                      <span>{{ Number(s.availableSlots || 0) }} / {{ Number(s.totalSlots || 0) }} available</span>
                      <span class="badge ml-2" :class="badgeClass(displayStatus(s))">{{ displayStatus(s) }}</span>
                    </div>
                    <div v-if="courseOngoingReservation(course.id)" class="slot-notice slot-notice-amber">
                      You already enrolled in this training. Continue upload in "Requirements Upload".
                    </div>
                    <div v-else-if="anyOngoingReservation()" class="slot-notice slot-notice-amber">
                      You still have an ongoing enrollment in {{ anyOngoingReservation()?.course_name || 'another training' }}.
                    </div>
                    <div v-else-if="isPastSchedule(s)" class="slot-notice slot-notice-red">
                      This batch is already closed (schedule date has passed).
                    </div>
                    <div v-else-if="courseCompletedReservation(course.id)" class="slot-notice slot-notice-purple">
                      You already completed this training. You can enroll again as retake.
                    </div>
                    <div v-else class="slot-notice slot-notice-gray">
                      Enroll will assign you to the batch and bring you to Upload Requirements.
                    </div>
                  </div>
                  <button
                    class="btn-enroll"
                    :class="canReserveSchedule(course, s) ? 'btn-enroll-active' : 'btn-enroll-disabled'"
                    :disabled="!canReserveSchedule(course, s) || reserving"
                    @click="reserveSchedule(course, s)"
                    type="button"
                  >
                    {{ enrollButtonText(course, s) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!filteredCourses.length" class="empty-state col-span-full">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p>No trainings found</p>
          </div>
        </div>
      </div>

      <!-- REQUIREMENTS UPLOAD -->
      <div v-if="activeTab === 'upload'" class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Requirements Upload</h3>
          <span class="panel-tag">Upload</span>
        </div>

        <div class="upload-info-banner">
          <div class="font-semibold text-blue-900">
            <template v-if="selectedCourse">
              Selected Training: {{ selectedCourse.course_name }} ({{ selectedCourse.course_code }})
            </template>
            <template v-else>No training selected yet.</template>
          </div>
          <div class="text-sm text-blue-800 mt-1">
            <template v-if="selectedReservationId">
              Reservation: <b>{{ selectedReservationPreview }}</b>
              <span class="badge badge-amber ml-2">ongoing</span>
            </template>
            <template v-else>Enroll first before uploading.</template>
          </div>
          <div v-if="selectedReservationId && !isUploadEditable" class="lock-banner">
            Uploads are locked because reservation is <b>{{ String(selectedReservationRow?.reservation_status || "").toUpperCase() }}</b>.
            (Only <b>PENDING</b> can Replace/Delete/Upload.)
          </div>
          <div v-if="selectedCourse" class="text-xs text-blue-800 mt-2">
            Requirements complete:
            <b :class="requirementsComplete ? 'text-emerald' : 'text-red-500'">
              {{ requirementsComplete ? 'YES' : 'NO' }}
            </b>
            <span class="ml-2">({{ uploadedCount }}/{{ requiredCount }})</span>
          </div>
        </div>

        <div class="upload-grid">
          <div class="upload-left">
            <h4 class="section-title">Required Documents</h4>
            <div v-if="!selectedCourse" class="text-gray-500 py-4">Select a training first.</div>
            <div v-else class="req-upload-list">
              <div v-for="(req, idx) in normalizedSelectedRequirements" :key="idx" class="req-upload-item" :class="reqIsUploaded(req) ? 'req-done' : 'req-missing'">
                <div class="req-upload-header">
                  <div>
                    <span class="req-upload-name">{{ reqLabel(req) }}</span>
                    <span v-if="reqIsUploaded(req)" class="pill pill-green ml-2">Uploaded</span>
                    <span v-else class="pill pill-red ml-2">Missing</span>
                  </div>
                  <span class="pill" :class="reqIsUploaded(req) ? 'pill-green' : 'pill-amber'">
                    {{ reqIsUploaded(req) ? "Completed" : "Required" }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">File types: PDF, JPG, PNG, WEBP | Max size: 8MB</p>
                <div v-if="reqIsUploaded(req)" class="text-xs text-gray-600 mt-1">
                  File: <b>{{ reqUploadedFileName(req) }}</b>
                </div>
              </div>
              <p v-if="!normalizedSelectedRequirements.length" class="text-sm text-gray-500 py-3">
                — No requirements listed for this training.
              </p>
            </div>

            <div v-if="selectedCourse" class="my-uploads-section">
              <div class="flex items-center justify-between mb-3">
                <h4 class="section-title">My Uploaded Files</h4>
                <button class="btn-text" @click="fetchMyUploads" :disabled="uploadsLoading">
                  {{ uploadsLoading ? "Refreshing..." : "Refresh" }}
                </button>
              </div>
              <div v-if="uploadsLoading" class="text-sm text-gray-500 py-3">Loading uploads...</div>
              <div v-else-if="!myUploads.length" class="text-sm text-gray-500 py-3">No uploads yet for this training.</div>
              <div v-else class="uploads-list">
                <div v-for="u in myUploads" :key="u.submission_id || (u.file_path + '-' + u.created_at)" class="upload-file-item">
                  <div class="upload-file-info">
                    <div class="font-medium text-gray-800 text-sm">{{ u.original_name || "Uploaded file" }}</div>
                    <div class="text-xs text-gray-500">
                      {{ u.requirement_label ? '• ' + u.requirement_label : '' }}
                      {{ u.created_at || "" }}
                    </div>
                  </div>
                  <div class="upload-file-actions">
                    <a class="action-link" :href="fullFileUrl(u.file_path)" target="_blank" rel="noopener">View</a>
                    <label class="action-link" :class="(!selectedReservationId || !isUploadEditable) ? 'action-link-disabled' : ''">
                      Replace
                      <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" @change="onReplaceUpload(u, $event)" :disabled="!selectedReservationId || !isUploadEditable" />
                    </label>
                    <button class="action-link action-link-danger" :disabled="deletingUploadId === (u.submission_id || '') || !selectedReservationId || !isUploadEditable" :class="(!selectedReservationId || !isUploadEditable) ? 'action-link-disabled' : ''" @click="deleteUpload(u)" type="button">
                      {{ deletingUploadId === (u.submission_id || '') ? "Deleting..." : "Delete" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="upload-right">
            <h4 class="section-title">Upload Documents</h4>
            <div v-if="!selectedReservationId" class="upload-lock-notice">
              Enroll first before uploading.
            </div>
            <label class="drop-zone" :class="(!selectedReservationId || !isUploadEditable) ? 'drop-zone-disabled' : ''">
              <input type="file" class="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" @change="onFilesPicked" :disabled="!selectedReservationId || !isUploadEditable" />
              <svg class="w-10 h-10 mx-auto mb-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="font-semibold text-gray-700 mb-1">Drop files here</p>
              <p class="text-sm text-gray-500 mb-1">or click to browse</p>
              <p class="text-xs text-gray-400">Supports: PDF, JPG, PNG, WEBP (Max 8MB each)</p>
            </label>

            <div v-if="selectedFiles.length" class="selected-files">
              <h5 class="text-sm font-semibold text-gray-700 mb-2">Selected Files ({{ selectedFiles.length }})</h5>
              <div v-for="(f, idx) in selectedFiles" :key="idx" class="selected-file-item">
                <div class="selected-file-info">
                  <div class="font-medium text-sm">{{ f.name }}</div>
                  <div class="text-xs text-gray-500">({{ formatBytes(f.size) }})</div>
                </div>
                <button type="button" class="btn-remove" @click="removeFile(idx)" :disabled="!isUploadEditable">Remove</button>
                <div class="mt-2">
                  <label class="text-xs font-semibold text-gray-700 mb-1 block">Assign to requirement:</label>
                  <select class="form-input-sm" v-model="fileReqMap[idx]" @change="onAssignRequirement(idx)" :disabled="!isUploadEditable">
                    <option value="">— (Optional / Extra file)</option>
                    <option v-for="r in availableRequirementsForFile(idx)" :key="reqKey(r)" :value="reqKey(r)">{{ reqLabel(r) }}</option>
                  </select>
                  <div v-if="fileReqMap[idx]" class="text-xs mt-1">
                    <span class="text-gray-500">Selected:</span>
                    <b class="text-gray-700 ml-1">{{ labelByKey(fileReqMap[idx]) }}</b>
                    <span v-if="uploadsByKey[fileReqMap[idx]]" class="text-emerald ml-2">(Already uploaded — this will REPLACE it)</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedCourse && selectedReservationId" class="text-xs mt-4">
              <div class="font-semibold text-gray-700 mb-1">Before you submit:</div>
              <div :class="requirementsComplete ? 'text-emerald' : 'text-red-500'">
                {{ requirementsComplete ? 'All required documents are uploaded.' : 'Missing required documents. Upload the missing ones first.' }}
              </div>
            </div>

            <button
              class="btn-submit-upload"
              :disabled="!canSubmitUploads || !requirementsComplete || !isUploadEditable"
              @click="submitDocuments"
              type="button"
            >
              {{ submitting ? "Submitting..." : "Submit Documents" }}
            </button>
            <p v-if="uploadMsg" class="text-xs mt-2" :class="uploadMsg.includes('✅') ? 'text-emerald' : 'text-red-500'">{{ uploadMsg }}</p>
          </div>
        </div>
      </div>

      <!-- MY RESERVATIONS -->
      <div v-if="activeTab === 'my'" class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">My Reservations</h3>
          <button class="btn-outline-sm" @click="fetchMyReservations" :disabled="loadingMyReservations">
            {{ loadingMyReservations ? "Refreshing..." : "Refresh" }}
          </button>
        </div>
        <div v-if="loadingMyReservations" class="loading-state">
          <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-gray-500">Loading...</p>
        </div>
        <div v-else-if="!myReservations.length" class="empty-state">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No reservations yet</p>
        </div>
        <div v-else class="reservations-list">
          <div v-for="r in myReservations" :key="r.reservation_id" class="reservation-item">
            <div class="reservation-info">
              <div class="font-semibold text-gray-800">{{ r.course_name }}</div>
              <div class="text-sm text-gray-600 mt-1">
                Batch: <span class="font-medium">{{ displayScheduleForStudent(r) }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-1">Reserved at: {{ r.created_at || "—" }}</div>
            </div>
            <div class="reservation-actions">
              <span class="pill" :class="statusPill(r.reservation_status)">{{ String(r.reservation_status || "").toUpperCase() }}</span>
              <button
                class="btn-primary-sm mt-2"
                @click="openUploadFromReservation(r)"
                :disabled="!isOngoingStatus(r.reservation_status)"
              >
                Continue Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudentLayoutTesda>
</template>

<script>
import axios from "axios";
import StudentLayoutTesda from "./StudentLayoutTesda.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "TesdaStudentEnroll",
  components: { StudentLayoutTesda },

  data() {
    return {
      searchQuery: "",
      activeTab: "trainings",
      studentName: "Student",

      courses: [],
      loadingCourses: false,
      showReqMap: {},

      selectedCourse: null,
      schedules: [],
      schedulesOpenId: null,
      loadingSchedules: false,
      reserving: false,

      selectedReservationId: null,
      selectedScheduleId: null,

      selectedFiles: [],
      fileReqMap: {},
      submitting: false,
      myUploads: [],
      uploadsLoading: false,
      uploadMsg: "",
      uploadsByKey: {},

      myReservations: [],
      loadingMyReservations: false,

      deletingUploadId: "",

      ONGOING_STATUSES: ["PENDING", "APPROVED", "CONFIRMED", "ACTIVE"],
      COMPLETED_STATUSES: ["DONE", "COMPLETED", "FINISHED", "CERTIFICATE_ISSUED"],
    };
  },

  computed: {
    filteredCourses() {
      const q = (this.searchQuery || "").trim().toLowerCase();
      if (!q) return this.courses;
      return this.courses.filter((c) => {
        return (
          (c.course_name || "").toLowerCase().includes(q) ||
          (c.course_code || "").toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q) ||
          (c.duration || "").toLowerCase().includes(q)
        );
      });
    },

    normalizedSelectedRequirements() {
      const reqs = this.selectedCourse?.requirements;
      if (!Array.isArray(reqs)) return [];
      return reqs.filter(Boolean).map((x) => String(x).trim()).filter(Boolean).map((label) => ({ key: this.slugify(label), label }));
    },

    requiredCount() { return this.normalizedSelectedRequirements.length; },
    uploadedCount() { return this.normalizedSelectedRequirements.filter((r) => this.reqIsUploaded(r)).length; },
    requirementsComplete() { if (!this.selectedCourse) return false; if (this.requiredCount === 0) return true; return this.uploadedCount >= this.requiredCount; },
    canSubmitUploads() { return !!this.selectedCourse && !!this.selectedReservationId && !this.submitting; },

    selectedReservationPreview() {
      if (!this.selectedReservationId) return "—";
      const rid = Number(this.selectedReservationId);
      const r = (this.myReservations || []).find((x) => Number(x?.reservation_id) === rid);
      return r ? this.reservationPreview(r) : `Reservation #${rid}`;
    },

    activeReservation() {
      const rows = (this.myReservations || []).filter(r => this.isOngoingStatus(r?.reservation_status)).sort((a, b) => Number(b?.reservation_id || 0) - Number(a?.reservation_id || 0));
      return rows[0] || null;
    },

    selectedReservationRow() {
      const rid = Number(this.selectedReservationId || 0);
      if (!rid) return null;
      return (this.myReservations || []).find(r => Number(r?.reservation_id) === rid) || null;
    },

    isUploadEditable() {
      const st = String(this.selectedReservationRow?.reservation_status || "").toUpperCase();
      return st === "PENDING";
    },
  },

  watch: {
    activeTab(newTab) { if (newTab === "upload") this.syncUploadSelectionFromDb(); },
    myReservations() { if (this.activeTab === "upload") this.syncUploadSelectionFromDb(); },
  },

  methods: {
    async openUploadTab() { this.activeTab = "upload"; await this.syncUploadSelectionFromDb(); },
    async goToUploadFromActiveReservation() { await this.openUploadFromReservation(this.activeReservation); },

    async syncUploadSelectionFromDb() {
      if (this.selectedReservationId) {
        const exists = (this.myReservations || []).some(r => Number(r?.reservation_id) === Number(this.selectedReservationId));
        if (exists) {
          const rr = (this.myReservations || []).find(r => Number(r?.reservation_id) === Number(this.selectedReservationId));
          if (rr && !this.selectedCourse) { const c = (this.courses || []).find(x => Number(x?.id) === Number(rr?.course_id)); if (c) this.selectedCourse = c; }
          await this.fetchMyUploads(); return;
        }
      }
      if (!this.activeReservation) { this.selectedReservationId = null; this.selectedCourse = null; this.myUploads = []; this.uploadsByKey = {}; return; }
      await this.openUploadFromReservation(this.activeReservation);
    },

    isOngoingStatus(st) { return this.ONGOING_STATUSES.includes(String(st || "").toUpperCase()); },
    hasAnyOngoingReservation() { return (this.myReservations || []).some(r => this.isOngoingStatus(r?.reservation_status)); },
    anyOngoingReservation() { return (this.myReservations || []).filter(r => this.isOngoingStatus(r?.reservation_status)).sort((a, b) => Number(b?.reservation_id || 0) - Number(a?.reservation_id || 0))[0] || null; },
    isCompletedStatus(st) { return this.COMPLETED_STATUSES.includes(String(st || "").toUpperCase()); },
    courseOngoingReservation(courseId) { const rows = (this.myReservations || []).filter(r => Number(r?.course_id) === Number(courseId) && this.isOngoingStatus(r?.reservation_status)).sort((a, b) => Number(b?.reservation_id || 0) - Number(a?.reservation_id || 0)); return rows[0] || null; },
    courseCompletedReservation(courseId) { const rows = (this.myReservations || []).filter(r => Number(r?.course_id) === Number(courseId) && this.isCompletedStatus(r?.reservation_status)).sort((a, b) => Number(b?.reservation_id || 0) - Number(a?.reservation_id || 0)); return rows[0] || null; },

    isPastSchedule(s) { if (!this.isScheduled(s)) return false; const today = new Date(); today.setHours(0,0,0,0); const schedDate = new Date(`${s.date}T00:00:00`); schedDate.setHours(0,0,0,0); return schedDate < today; },

    enrollButtonText(course, s) { const ongoing = this.anyOngoingReservation(); if (ongoing) { if (Number(ongoing.course_id) === Number(course?.id)) return "Enrolled"; return "Locked"; } if (this.isScheduled(s) && this.isPastSchedule(s)) return "Closed"; if (this.courseCompletedReservation(course?.id)) return this.reserving ? "..." : "Retake"; return this.reserving ? "..." : "Enroll"; },

    reservationPreview(r) { const d = String(r?.schedule_date || "").trim(); const a = r?.startTime || "08:00"; const b = r?.endTime || "17:00"; const batchNo = r?.batch_no ? `Batch ${r.batch_no}` : "Batch"; const st = String(r?.reservation_status || "").toUpperCase(); const name = r?.course_name || "Training"; const batchText = (!d || d === "TBA") ? `${batchNo} • TBA (Pooling) ${a}-${b}` : `${batchNo} • ${d} ${a}-${b}`; return `${name} • ${batchText} • ${st}${r?.is_retake ? " • RETAKE" : ""}`; },

    async openUploadFromReservation(r) { if (!r) return; const courseId = Number(r?.course_id || 0); const rid = r?.reservation_id || null; const c = (this.courses || []).find(x => Number(x?.id) === courseId) || null; if (c) this.selectedCourse = c; this.selectedReservationId = rid; this.activeTab = "upload"; await this.fetchMyUploads(); },

    slugify(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120); },
    reqKey(req) { return typeof req === "string" ? this.slugify(req) : String(req?.key || ""); },
    reqLabel(req) { return typeof req === "string" ? String(req) : String(req?.label || ""); },
    labelByKey(k) { const hit = (this.normalizedSelectedRequirements || []).find(r => r.key === k); return hit?.label || k; },

    availableRequirementsForFile(idx) { const currentKey = String(this.fileReqMap[idx] || ""); return (this.normalizedSelectedRequirements || []).filter((r) => { const key = this.reqKey(r); if (currentKey && key === currentKey) return true; return !this.uploadsByKey[key]; }); },

    buildUploadsByKey() { const m = {}; for (const u of (this.myUploads || [])) { const k = String(u?.requirement_key || "").trim(); if (k) m[k] = u; } this.uploadsByKey = m; },
    normalizeReqName(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); },

    reqIsUploaded(req) { const key = this.reqKey(req); if (key && this.uploadsByKey[key]) return true; const label = this.reqLabel(req); const reqText = this.normalizeReqName(label); if (!reqText) return false; return (this.myUploads || []).some((u) => { const name = this.normalizeReqName(u?.original_name || u?.file_name || u?.file_path || ""); return name.includes(reqText); }); },
    reqUploadedFileName(req) { const key = this.reqKey(req); const byKey = key ? this.uploadsByKey[key] : null; if (byKey) return byKey?.original_name || "Uploaded"; const label = this.reqLabel(req); const reqText = this.normalizeReqName(label); const hit = (this.myUploads || []).find((u) => { const name = this.normalizeReqName(u?.original_name || u?.file_name || u?.file_path || ""); return name.includes(reqText); }); return hit?.original_name || hit?.file_name || "Uploaded"; },

    toLocalYMD(d) { const dt = new Date(d); if (Number.isNaN(dt.getTime())) return ""; const y = dt.getFullYear(); const m = String(dt.getMonth() + 1).padStart(2, "0"); const day = String(dt.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`; },
    parseDurationHours(duration) { const m = String(duration || "").match(/(\d+(?:\.\d+)?)/); const n = m ? Number(m[1]) : 0; return Number.isFinite(n) ? n : 0; },
    tesdaDaysFromDuration(duration) { const TESDA_HOURS_PER_DAY = 9; const totalHours = this.parseDurationHours(duration); return totalHours > 0 ? Math.max(1, Math.ceil(totalHours / TESDA_HOURS_PER_DAY)) : 1; },
    isMonToSatYMD(ymd) { if (!ymd) return false; const d = new Date(`${ymd}T00:00:00`); if (Number.isNaN(d.getTime())) return false; const day = d.getDay(); return day >= 1 && day <= 6; },
    addDaysSkipSundays(startYmd, addTrainingDays) { let d = new Date(`${startYmd}T00:00:00`); let added = 0; while (added < addTrainingDays) { d.setDate(d.getDate() + 1); const ymd = this.toLocalYMD(d); if (this.isMonToSatYMD(ymd)) added++; } return this.toLocalYMD(d); },
    tesdaEndDateFromStart(startYmd, duration) { if (!startYmd) return ""; if (!this.isMonToSatYMD(startYmd)) return ""; const daysNeeded = this.tesdaDaysFromDuration(duration); if (daysNeeded <= 1) return startYmd; return this.addDaysSkipSundays(startYmd, daysNeeded - 1); },
    formatDateNice(ymd) { if (!ymd) return "TBA"; const d = new Date(`${ymd}T00:00:00`); if (Number.isNaN(d.getTime())) return "TBA"; return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); },
    isScheduled(s) { const d = String(s?.date || "").trim(); return Boolean(d) && /^\d{4}-\d{2}-\d{2}$/.test(d); },
    displayStatus(s) { const st = String(s?.computedStatus || s?.status || "").trim(); if (st) return st; const avail = Number(s?.availableSlots || 0); return avail === 0 ? "Full" : "Open"; },
    schedulesOpenFor(courseId) { return this.schedulesOpenId === courseId; },

    badgeClass(status) { const s = String(status || "").toLowerCase(); if (s === "open") return "badge-green"; if (s === "full") return "badge-red"; if (s === "closed") return "badge-gray"; return "badge-gray"; },
    statusPill(st) { const s = String(st || "").toUpperCase(); if (s === "PENDING") return "pill-amber"; if (["APPROVED","CONFIRMED"].includes(s)) return "pill-green"; if (s === "ACTIVE") return "pill-blue"; if (s === "DONE") return "pill-gray"; if (s === "CANCELLED") return "pill-red"; return "pill-gray"; },

    canReserveSchedule(course, s) { if (this.hasAnyOngoingReservation()) return false; const st = String(this.displayStatus(s) || "").toLowerCase(); const avail = Number(s?.availableSlots || 0); if (!this.isScheduled(s)) return st === "open" && avail > 0 && !this.reserving; if (this.isPastSchedule(s)) return false; return st === "open" && avail > 0 && !this.reserving; },

    displayScheduleForStudent(r) { const st = String(r?.reservation_status || "").toUpperCase(); const d = String(r?.schedule_date || "").trim(); const a = r?.startTime || "08:00"; const b = r?.endTime || "17:00"; const batchNo = r?.batch_no ? `Batch ${r.batch_no}` : "Batch"; if (st === "PENDING") return (!d || d === "TBA") ? `${batchNo} • TBA (Pooling) ${a}-${b} (Pending verification)` : `${batchNo} • ${d} ${a}-${b} (Pending verification)`; return (!d || d === "TBA") ? `${batchNo} • TBA (Pooling) ${a}-${b}` : `${batchNo} • ${d} ${a}-${b}`; },

    fullFileUrl(path) { const p = String(path || ""); if (!p) return ""; return p.startsWith("http") ? p : `${API_URL.replace(/\/api\/?$/, "")}${p.startsWith("/") ? p : "/" + p}`; },

    tabClass(tab) { const base = "tab-btn"; return this.activeTab === tab ? `${base} tab-active` : `${base} tab-inactive`; },

    async fetchCourses() { this.loadingCourses = true; try { const res = await api.get("/tesda/courses"); this.courses = Array.isArray(res.data?.data) ? res.data.data : []; } catch (err) { console.error("fetchCourses error:", err); this.courses = []; } finally { this.loadingCourses = false; } },
    toggleRequirements(courseId) { this.showReqMap[courseId] = !this.showReqMap[courseId]; },

    async toggleSchedules(course) { const courseId = course?.id; if (!courseId) return; if (this.schedulesOpenId === courseId) { this.schedulesOpenId = null; this.schedules = []; return; } this.selectedCourse = course; this.schedulesOpenId = courseId; this.loadingSchedules = true; this.schedules = []; try { const res = await api.get(`/tesda/schedules?course_id=${encodeURIComponent(courseId)}`); const rows = Array.isArray(res.data?.data) ? res.data.data : []; this.schedules = rows.map((s) => { const rawDate = s?.date ?? s?.schedule_date ?? ""; const dateStr = String(rawDate || ""); const normalizedDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr; const sid = s?.id ?? s?.schedule_id; return { ...s, id: sid, date: normalizedDate || "", computedStatus: s?.computedStatus || s?.status || "", startTime: s?.startTime || s?.start_time || "08:00", endTime: s?.endTime || s?.end_time || "17:00", totalSlots: Number(s?.totalSlots ?? s?.total_slots ?? 0), availableSlots: Number(s?.availableSlots ?? s?.available_slots ?? 0) }; }); this.schedules.sort((a, b) => { const aSched = this.isScheduled(a) ? 1 : 0; const bSched = this.isScheduled(b) ? 1 : 0; if (aSched !== bSched) return bSched - aSched; if (a.date !== b.date) return String(a.date).localeCompare(String(b.date)); return Number(b.availableSlots || 0) - Number(a.availableSlots || 0); }); } catch (err) { console.error("fetchSchedules error:", err); this.schedules = []; } finally { this.loadingSchedules = false; } },

    async reserveSchedule(course, sched) { const ongoing = this.anyOngoingReservation(); if (ongoing) { alert(`May ongoing enrollment ka pa sa ${ongoing.course_name || "another training"}. Tapusin or i-cancel muna bago mag-enroll ulit.`); await this.openUploadFromReservation(ongoing); return; } if (!this.canReserveSchedule(course, sched)) return; const courseId = Number(course?.id || 0); const scheduleId = Number(sched?.id || 0); this.reserving = true; this.uploadMsg = ""; try { await api.post("/tesda/reservations", { schedule_id: scheduleId, course_id: courseId }); await this.fetchMyReservations(); await this.openUploadFromReservation(this.courseOngoingReservation(courseId) || this.activeReservation); this.uploadMsg = "Enrolled. Upload your requirements now."; } catch (err) { console.error(err); alert(err.response?.data?.message || err.message || "Failed to enroll"); } finally { this.reserving = false; } },

    onFilesPicked(e) { if (!this.isUploadEditable) { this.uploadMsg = "Uploads are locked (reservation is not PENDING)."; e.target.value = ""; return; } const files = Array.from(e.target.files || []); const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]); const filtered = files.filter((f) => { if (!allowed.has(f.type)) return false; if (f.size > 8 * 1024 * 1024) return false; return true; }); this.selectedFiles = [...this.selectedFiles, ...filtered]; const startIdx = this.selectedFiles.length - filtered.length; for (let i = 0; i < filtered.length; i++) { const idx = startIdx + i; if (this.fileReqMap[idx] === undefined) this.fileReqMap[idx] = ""; } e.target.value = ""; },
    removeFile(idx) { if (!this.isUploadEditable) { this.uploadMsg = "Uploads are locked (reservation is not PENDING)."; return; } this.selectedFiles.splice(idx, 1); const newMap = {}; this.selectedFiles.forEach((_, i) => { newMap[i] = this.fileReqMap[i >= idx ? i + 1 : i] || ""; }); this.fileReqMap = newMap; },
    formatBytes(bytes) { const b = Number(bytes || 0); if (b < 1024) return `${b} B`; const kb = b / 1024; if (kb < 1024) return `${kb.toFixed(1)} KB`; const mb = kb / 1024; return `${mb.toFixed(1)} MB`; },

    async fetchMyUploads() { if (!this.selectedCourse?.id || !this.selectedReservationId) return; this.uploadsLoading = true; try { const res = await api.get(`/tesda/requirements?course_id=${encodeURIComponent(this.selectedCourse.id)}&reservation_id=${encodeURIComponent(this.selectedReservationId)}`); this.myUploads = Array.isArray(res.data?.data) ? res.data.data : []; this.buildUploadsByKey(); } catch (err) { console.error("fetchMyUploads error:", err); this.myUploads = []; this.uploadsByKey = {}; } finally { this.uploadsLoading = false; } },

    async onAssignRequirement(idx) { if (!this.isUploadEditable) { this.uploadMsg = "Uploads are locked (reservation is not PENDING)."; this.fileReqMap[idx] = ""; return; } if (!this.selectedCourse?.id || !this.selectedReservationId) { alert("Enroll muna bago mag-assign ng requirements."); this.fileReqMap[idx] = ""; return; } const reqKey = String(this.fileReqMap[idx] || ""); if (!reqKey) return; const file = this.selectedFiles[idx]; if (!file) return; this.uploadMsg = ""; try { const fd = new FormData(); fd.append("course_id", String(this.selectedCourse.id)); fd.append("reservation_id", String(this.selectedReservationId)); fd.append("requirement_key", reqKey); fd.append("requirement_label", this.labelByKey(reqKey)); fd.append("file", file); await api.post("/tesda/requirements/upload-one", fd, { headers: { "Content-Type": "multipart/form-data" } }); await this.fetchMyUploads(); this.uploadMsg = `Uploaded: ${this.labelByKey(reqKey)}`; this.selectedFiles.splice(idx, 1); const newMap = {}; this.selectedFiles.forEach((_, i) => { newMap[i] = this.fileReqMap[i >= idx ? i + 1 : i] || ""; }); this.fileReqMap = newMap; } catch (err) { console.error(err); this.uploadMsg = `Upload failed: ${err.message || "Try again"}`; } },

    async onReplaceUpload(u, e) { if (!this.isUploadEditable) { this.uploadMsg = "Uploads are locked (reservation is not PENDING)."; e.target.value = ""; return; } const file = (e.target.files && e.target.files[0]) ? e.target.files[0] : null; e.target.value = ""; if (!file) return; if (!this.selectedCourse?.id || !this.selectedReservationId) { alert("Enroll muna bago mag-replace."); return; } const reqKey = String(u?.requirement_key || "").trim(); if (!reqKey) { alert("Missing requirement_key on this upload row."); return; } const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]); if (!allowed.has(file.type) || file.size > 8 * 1024 * 1024) { alert("Invalid file type/size. PDF/JPG/PNG/WEBP up to 8MB."); return; } this.uploadMsg = ""; try { const fd = new FormData(); fd.append("course_id", String(this.selectedCourse.id)); fd.append("reservation_id", String(this.selectedReservationId)); fd.append("requirement_key", reqKey); fd.append("requirement_label", String(u?.requirement_label || this.labelByKey(reqKey))); fd.append("file", file); await api.post("/tesda/requirements/upload-one", fd, { headers: { "Content-Type": "multipart/form-data" } }); await this.fetchMyUploads(); this.uploadMsg = `Replaced: ${String(u?.requirement_label || this.labelByKey(reqKey))}`; } catch (err) { console.error(err); this.uploadMsg = `Replace failed: ${err.message || "Try again"}`; } },

    async deleteUpload(u) { if (!this.isUploadEditable) { this.uploadMsg = "Uploads are locked (reservation is not PENDING)."; return; } if (!this.selectedReservationId) return; const sid = u?.submission_id; if (!sid) { alert("Missing submission_id."); return; } if (!confirm("Delete this uploaded file?")) return; this.deletingUploadId = sid; this.uploadMsg = ""; try { await api.delete(`/tesda/requirements/${encodeURIComponent(sid)}`); await this.fetchMyUploads(); this.uploadMsg = "Deleted upload."; } catch (err) { console.error(err); this.uploadMsg = `Delete failed: ${err.message || "Try again"}`; } finally { this.deletingUploadId = ""; } },

    async submitDocuments() { if (!this.isUploadEditable) { this.uploadMsg = "Uploads are locked (reservation is not PENDING)."; return; } if (!this.canSubmitUploads) return; if (!this.requirementsComplete) { alert("Kulang pa ang requirements. I-upload muna ang missing documents."); return; } this.submitting = true; this.uploadMsg = ""; try { const requiredKeys = this.normalizedSelectedRequirements.map(r => r.key); await api.post("/tesda/requirements/submit", { course_id: this.selectedCourse.id, reservation_id: this.selectedReservationId, required_keys: requiredKeys }); this.uploadMsg = "All requirements complete. Submitted for verification."; await this.fetchMyUploads(); await this.fetchMyReservations(); } catch (err) { console.error(err); this.uploadMsg = `Submit failed: ${err.message || "Try again"}`; } finally { this.submitting = false; } },

    async fetchMyReservations() { this.loadingMyReservations = true; try { const res = await api.get("/tesda/my-reservations"); this.myReservations = Array.isArray(res.data?.data) ? res.data.data : []; } catch (err) { console.error("fetchMyReservations error:", err); this.myReservations = []; } finally { this.loadingMyReservations = false; } },

    loadUserData() { const userData = localStorage.getItem("user"); if (userData) { try { const user = JSON.parse(userData); this.studentName = user.name || user.username || "Student"; } catch (e) { console.error("Error parsing user data:", e); } } },
    getUserInitial() { return String(this.studentName || "S").charAt(0).toUpperCase(); },
  },

  async mounted() {
    this.loadUserData();
    await this.fetchCourses();
    await this.fetchMyReservations();
    if (this.activeReservation && this.activeTab === "upload") await this.openUploadFromReservation(this.activeReservation);
  },
};
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.enrollment-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }

/* ===== HEADER ===== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #3b82f6; }
.refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #3b82f6; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn:hover { background: #2563eb; transform: translateY(-1px); }
.refresh-icon { width: 16px; height: 16px; }

/* ===== PAGE TOP ===== */
.page-top { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

/* ===== ALERT BANNER ===== */
.alert-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 16px 20px; }
.alert-banner-content { display: flex; gap: 12px; align-items: flex-start; }

/* ===== TABS ===== */
.tabs-row { display: flex; flex-wrap: wrap; gap: 8px; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 12px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
.tab-active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.tab-inactive { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
.tab-inactive:hover { background: #e5e7eb; }

/* ===== PANEL CARD ===== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-tag { font-size: 0.72rem; padding: 4px 10px; background: #f3f4f6; border-radius: 8px; color: #6b7280; font-weight: 500; }

/* ===== LOADING / EMPTY STATES ===== */
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.empty-state { text-align: center; padding: 40px; color: #9ca3af; }
.col-span-full { grid-column: 1 / -1; }

/* ===== COURSES GRID - 2 columns ===== */
.courses-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; padding: 20px; }
.course-card { border: 2px solid #e5e7eb; border-radius: 16px; padding: 24px; transition: all 0.2s; display: flex; flex-direction: column; gap: 14px; }
.course-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); border-color: #3b82f6; }
.course-card-top { display: flex; justify-content: space-between; align-items: flex-start; }
.course-card-title { font-size: 1.2rem; font-weight: 700; color: #2563eb; margin: 0; }
.course-card-code { font-size: 0.85rem; color: #6b7280; font-weight: 500; }
.course-card-desc { font-size: 0.9rem; color: #374151; margin: 0; line-height: 1.5; }
.course-card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.course-stat { background: #f9fafb; border-radius: 12px; padding: 14px; }
.course-stat-label { display: block; font-size: 0.78rem; color: #6b7280; font-weight: 500; }
.course-stat-value { display: block; font-weight: 700; color: #111827; font-size: 0.95rem; margin-top: 2px; }

.req-toggle-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; color: #2563eb; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.req-toggle-btn:hover { background: #dbeafe; }
.req-content { max-height: 0; overflow: hidden; transition: all 0.3s ease-in-out; border-top: 0 solid transparent; }
.req-content-open { max-height: 300px; padding-top: 14px; border-top: 1px solid #e5e7eb; }
.req-title { font-weight: 600; color: #374151; font-size: 0.9rem; margin-bottom: 8px; }
.req-list { list-style: none; padding: 0; margin: 0; }
.req-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; color: #374151; padding: 5px 0; }
.req-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }

.btn-view-slots { width: 100%; padding: 12px; background: #fff; border: 2px solid #bfdbfe; border-radius: 12px; color: #2563eb; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.btn-view-slots:hover:not(:disabled) { background: #eff6ff; }
.btn-view-slots:disabled { opacity: 0.6; cursor: not-allowed; }

.slots-container { margin-top: 8px; }
.slots-list { display: flex; flex-direction: column; gap: 10px; }
.slot-card { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
.slot-info { flex: 1; min-width: 0; }
.slot-schedule { font-weight: 600; color: #111827; font-size: 0.88rem; }
.slot-tag { font-size: 0.68rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; margin-left: 6px; }
.slot-tag-blue { background: #dbeafe; color: #2563eb; }
.slot-tag-gray { background: #f3f4f6; color: #6b7280; }
.slot-meta { display: flex; gap: 14px; margin-top: 6px; font-size: 0.78rem; color: #6b7280; }
.slot-meta span { display: flex; align-items: center; gap: 4px; }
.slot-availability { font-size: 0.78rem; color: #374151; margin-top: 6px; }
.slot-notice { font-size: 0.72rem; margin-top: 6px; padding: 6px 10px; border-radius: 8px; }
.slot-notice-amber { background: #fef3c7; color: #92400e; }
.slot-notice-red { background: #fee2e2; color: #991b1b; }
.slot-notice-purple { background: #ede9fe; color: #6b21a8; }
.slot-notice-gray { background: #f3f4f6; color: #6b7280; }

.btn-enroll { padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 0.82rem; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
.btn-enroll-active { background: #2563eb; color: #fff; }
.btn-enroll-active:hover { background: #1d4ed8; }
.btn-enroll-disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }

/* ===== BADGES ===== */
.badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.badge-blue { background: #dbeafe; color: #2563eb; }
.badge-amber { background: #fef3c7; color: #d97706; }
.badge-purple { background: #ede9fe; color: #7c3aed; }
.badge-green { background: #d1fae5; color: #059669; }
.badge-red { background: #fee2e2; color: #dc2626; }
.badge-gray { background: #f3f4f6; color: #6b7280; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-red { background: #fee2e2; color: #dc2626; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ===== BUTTONS ===== */
.btn-primary-sm { padding: 8px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-primary-sm:hover { background: #2563eb; }
.btn-outline-sm { padding: 8px 16px; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
.btn-outline-sm:hover { background: #f3f4f6; }
.btn-text { font-size: 0.8rem; color: #2563eb; background: none; border: none; cursor: pointer; font-weight: 600; }
.btn-text:hover { color: #1d4ed8; text-decoration: underline; }
.btn-text:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== UPLOAD SECTION ===== */
.upload-info-banner { margin: 16px; padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; }
.lock-banner { margin-top: 12px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; color: #374151; }
.upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 16px 16px; }
.upload-left, .upload-right { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 0.95rem; font-weight: 700; color: #111827; margin-bottom: 4px; }

.req-upload-list { display: flex; flex-direction: column; gap: 8px; }
.req-upload-item { padding: 14px; border-radius: 12px; border: 2px solid; }
.req-done { border-color: #d1fae5; background: #f0fdf4; }
.req-missing { border-color: #bfdbfe; background: #eff6ff; }
.req-upload-header { display: flex; align-items: center; justify-content: space-between; }
.req-upload-name { font-weight: 600; color: #111827; font-size: 0.9rem; }

.my-uploads-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
.uploads-list { display: flex; flex-direction: column; gap: 6px; }
.upload-file-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }
.upload-file-info { flex: 1; min-width: 0; }
.upload-file-actions { display: flex; gap: 10px; flex-shrink: 0; }
.action-link { font-size: 0.78rem; font-weight: 600; color: #2563eb; background: none; border: none; cursor: pointer; }
.action-link:hover { text-decoration: underline; }
.action-link-danger { color: #ef4444; }
.action-link-disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

.upload-lock-notice { padding: 12px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; font-size: 0.85rem; color: #92400e; }

.drop-zone { display: block; padding: 32px 16px; border: 2px dashed #bfdbfe; border-radius: 16px; text-align: center; background: #eff6ff; cursor: pointer; transition: all 0.2s; }
.drop-zone:hover { background: #dbeafe; border-color: #93c5fd; }
.drop-zone-disabled { opacity: 0.6; pointer-events: none; cursor: not-allowed; }

.selected-files { margin-top: 16px; }
.selected-file-item { padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; margin-bottom: 8px; }
.selected-file-info { margin-bottom: 4px; }
.btn-remove { font-size: 0.75rem; color: #ef4444; background: none; border: none; cursor: pointer; font-weight: 600; }
.btn-remove:disabled { opacity: 0.5; cursor: not-allowed; }
.form-input-sm { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.8rem; outline: none; }
.form-input-sm:focus { border-color: #3b82f6; }

.btn-submit-upload { width: 100%; margin-top: 12px; padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.btn-submit-upload:hover:not(:disabled) { background: #1d4ed8; }
.btn-submit-upload:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }

/* ===== RESERVATIONS ===== */
.reservations-list { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.reservation-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; }
.reservation-info { flex: 1; min-width: 0; }
.reservation-actions { text-align: right; flex-shrink: 0; }

/* ===== UTILITY ===== */
.text-emerald { color: #059669; }
.text-blue { color: #2563eb; }
.text-red-500 { color: #ef4444; }

@media (max-width: 768px) {
  .courses-grid { grid-template-columns: 1fr; }
  .upload-grid { grid-template-columns: 1fr; }
}
</style>