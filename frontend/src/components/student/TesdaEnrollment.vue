<template>
  <StudentLayoutTesda active-page="enrollment">
    <template #header-left>
      <input
        type="text"
        placeholder="Search trainings..."
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        v-model="searchQuery"
      />
    </template>

    <template #header-right>
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-blue-700 rounded-full transition-colors">
          <span class="text-xl">🔔</span>
        </button>
        <div
          class="w-10 h-10 bg-white text-blue-800 rounded-full flex items-center justify-center text-xl font-bold"
        >
          {{ getUserInitial() }}
        </div>
      </div>
    </template>

    <div>
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Training Enrollment</h1>

      <!-- ✅ Global banner: DB-based ongoing reservation -->
      <div
        v-if="activeReservation"
        class="mb-5 p-4 rounded-xl border border-yellow-200 bg-yellow-50"
      >
        <div class="font-semibold text-yellow-900">
          ⚠️ You have an ongoing reservation.
        </div>
        <div class="text-sm text-yellow-900 mt-1">
          <span class="font-medium">Latest:</span>
          <span class="ml-1">{{ reservationPreview(activeReservation) }}</span>
        </div>
        <div class="text-xs text-yellow-800 mt-2">
          Note: You can continue uploading requirements anytime. Your progress won’t reset.
        </div>
        <div class="mt-3 flex gap-2">
          <button
            class="px-4 py-2 rounded-md bg-blue-700 text-white hover:bg-blue-800 text-sm font-medium"
            @click="goToUploadFromActiveReservation()"
          >
            Continue Upload
          </button>
          <button
            class="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm font-medium"
            @click="activeTab = 'my'"
          >
            View My Reservations
          </button>
        </div>
      </div>

      <div class="flex space-x-2 mb-6">
        <button
          @click="activeTab = 'trainings'"
          :class="[
            'px-4 py-2 rounded-md font-medium transition-colors',
            activeTab === 'trainings' ? 'bg-blue-700 text-white' : 'bg-gray-300 hover:bg-gray-400'
          ]"
        >
          📋 Available Trainings
        </button>

        <button
          @click="openUploadTab()"
          :class="[
            'px-4 py-2 rounded-md font-medium transition-colors',
            activeTab === 'upload' ? 'bg-blue-700 text-white' : 'bg-gray-300 hover:bg-gray-400'
          ]"
        >
          📎 Requirements Upload
        </button>

        <button
          @click="activeTab = 'my'"
          :class="[
            'px-4 py-2 rounded-md font-medium transition-colors',
            activeTab === 'my' ? 'bg-blue-700 text-white' : 'bg-gray-300 hover:bg-gray-400'
          ]"
        >
          🧾 My Reservations
        </button>
      </div>

      <!-- ✅ TRAININGS LIST -->
      <section
        v-if="activeTab === 'trainings'"
        class="bg-white p-6 rounded-xl shadow border border-gray-200"
      >
        <h2 class="bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg mb-6 inline-block">
          Available Trainings
        </h2>

        <div v-if="loadingCourses" class="text-center py-10 text-gray-600">
          Loading trainings...
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="border-2 border-blue-700 rounded-xl p-6 hover:shadow-lg transition-shadow self-start"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold text-blue-800 mb-2">
                  {{ course.course_name }} ({{ course.course_code }})
                </h3>
                <p class="text-gray-700">{{ course.description || "—" }}</p>
              </div>

              <span
                v-if="courseOngoingReservation(course.id)"
                class="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
              >
                Enrolled ({{ String(courseOngoingReservation(course.id)?.reservation_status || "PENDING").toUpperCase() }})
              </span>
              <span
                v-else
                class="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                Active
              </span>
            </div>

            <button
              @click="toggleRequirements(course.id)"
              class="w-full flex items-center justify-between text-blue-700 font-medium hover:text-blue-800 transition-colors mb-3 px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <div class="flex items-center gap-2">
                <span>📋</span>
                <span>{{ showReqMap[course.id] ? "Hide Requirements" : "View Requirements" }}</span>
              </div>

              <span
                class="text-lg transform transition-transform duration-300"
                :class="{ 'rotate-180': showReqMap[course.id] }"
              >
                ▼
              </span>
            </button>

            <div
              class="overflow-hidden transition-all duration-300 ease-in-out border-gray-200"
              :style="{
                maxHeight: showReqMap[course.id] ? '260px' : '0px',
                marginTop: showReqMap[course.id] ? '0.75rem' : '0',
                paddingTop: showReqMap[course.id] ? '0.75rem' : '0',
                borderTopWidth: showReqMap[course.id] ? '1px' : '0'
              }"
            >
              <div v-if="showReqMap[course.id]">
                <h4 class="font-semibold text-gray-800 mb-2">Requirements:</h4>

                <ul
                  v-if="Array.isArray(course.requirements) && course.requirements.length"
                  class="space-y-1.5 text-sm text-gray-700"
                >
                  <li
                    v-for="(req, idx) in course.requirements"
                    :key="idx"
                    class="flex items-start gap-2"
                  >
                    <div class="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    {{ req }}
                  </li>
                </ul>

                <p v-else class="text-sm text-gray-500">— No requirements found</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Duration</p>
                <p class="font-semibold text-gray-800">{{ course.duration || "—" }}</p>
              </div>

              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-sm text-gray-600">Training Fee</p>
                <p class="font-semibold text-blue-700">
                  ₱{{ Number(course.course_fee || 0).toLocaleString() }}
                </p>
              </div>
            </div>

            <!-- ✅ TESDA BATCHES -->
            <div class="mt-5">
              <button
                @click="toggleSchedules(course)"
                class="w-full bg-white border border-blue-200 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                :disabled="loadingSchedules && selectedCourse?.id === course.id"
              >
                {{ schedulesOpenFor(course.id) ? "Hide Batches/Slots" : "View Batches/Slots" }}
              </button>

              <div v-if="schedulesOpenFor(course.id)" class="mt-3 border rounded-lg p-3 bg-gray-50">
                <div v-if="loadingSchedules && selectedCourse?.id === course.id" class="text-sm text-gray-600">
                  Loading batches...
                </div>

                <div v-else-if="!schedules.length" class="text-sm text-gray-500">
                  No batches available for this training yet.
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="s in schedules"
                    :key="String(s.id) + '-' + String(s.date || 'TBA')"
                    class="p-3 bg-white rounded border flex items-center justify-between gap-3"
                  >
                    <div class="text-sm">
                      <div class="font-semibold text-gray-800">
                        <template v-if="isScheduled(s)">
                          {{ formatDateNice(s.date) }} →
                          {{ formatDateNice(tesdaEndDateFromStart(s.date, selectedCourse?.duration)) }}
                          <span class="text-xs text-gray-500"> • (Scheduled batch)</span>
                        </template>
                        <template v-else>
                          To Be Announced
                          <span class="text-xs text-gray-500"> • (No start date yet)</span>
                        </template>
                      </div>

                      <div class="text-xs text-gray-500 mt-0.5">
                        Time: {{ s.startTime || "08:00" }}-{{ s.endTime || "17:00" }}
                      </div>

                      <div class="text-xs text-gray-500">
                        Trainer: {{ s.instructor || "—" }}
                      </div>

                      <div class="text-xs mt-1">
                        <span class="font-medium text-gray-700">Slots:</span>
                        <span class="ml-1 text-gray-700">
                          {{ Number(s.availableSlots || 0) }} available / {{ Number(s.totalSlots || 0) }}
                        </span>
                        <span
                          class="ml-2 text-xs px-2 py-0.5 rounded"
                          :class="badgeClass(displayStatus(s))"
                        >
                          {{ displayStatus(s) }}
                        </span>
                      </div>

                      <div v-if="courseOngoingReservation(course.id)" class="text-[11px] text-yellow-700 mt-1">
                        ⚠️ You already enrolled in this training. Continue upload in “Requirements Upload”.
                      </div>
                      <div v-else class="text-[11px] text-gray-500 mt-1">
                        *Enroll will assign you to the batch and bring you to Upload Requirements.
                      </div>
                    </div>

                    <button
                      class="px-3 py-2 rounded-md text-sm font-medium"
                      :class="canReserveSchedule(course, s)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'"
                      :disabled="!canReserveSchedule(course, s) || reserving"
                      @click="reserveSchedule(course, s)"
                      type="button"
                    >
                      <template v-if="courseOngoingReservation(course.id)">
                        Enrolled
                      </template>
                      <template v-else>
                        {{ reserving ? "..." : "Enroll" }}
                      </template>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div v-if="!filteredCourses.length" class="text-center text-gray-500 py-10 md:col-span-2">
            No trainings found.
          </div>
        </div>
      </section>

      <!-- ✅ REQUIREMENTS UPLOAD -->
      <section
        v-if="activeTab === 'upload'"
        class="bg-white p-6 rounded-xl shadow border border-gray-200"
      >
        <h2 class="bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg mb-6 inline-block">
          Requirements Upload
        </h2>

        <div class="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50">
          <div class="font-semibold text-blue-900">
            <template v-if="selectedCourse">
              Selected Training: {{ selectedCourse.course_name }} ({{ selectedCourse.course_code }})
            </template>
            <template v-else>
              No training selected yet.
            </template>
          </div>

          <div class="text-sm text-blue-800 mt-1">
            <template v-if="selectedReservationId">
              Reservation:
              <b>{{ selectedReservationPreview }}</b>
              <span class="ml-1 text-xs">(ongoing)</span>
            </template>
            <template v-else>
              ⚠️ Wala pang ongoing reservation. Mag-enroll muna.
            </template>
          </div>

          <!-- ✅ lock banner -->
          <div
            v-if="selectedReservationId && !isUploadEditable"
            class="mt-3 p-3 rounded border border-gray-200 bg-gray-50 text-sm text-gray-700"
          >
            🔒 Uploads are locked because reservation is
            <b>{{ String(selectedReservationRow?.reservation_status || "").toUpperCase() }}</b>.
            (Only <b>PENDING</b> can Replace/Delete/Upload.)
          </div>

          <div v-if="selectedCourse" class="text-xs text-blue-800 mt-2">
            Requirements complete:
            <b :class="requirementsComplete ? 'text-green-700' : 'text-red-700'">
              {{ requirementsComplete ? 'YES' : 'NO' }}
            </b>
            <span class="ml-2">
              ({{ uploadedCount }}/{{ requiredCount }})
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Requirements list -->
          <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="text-blue-600">📋</span>
              Required Documents
            </h3>

            <div v-if="!selectedCourse" class="text-gray-600">
              Select a training first.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(req, idx) in normalizedSelectedRequirements"
                :key="idx"
                class="border-2 rounded-lg p-4 transition-colors"
                :class="reqIsUploaded(req) ? 'border-green-300 bg-green-50' : 'border-blue-200 bg-blue-50 hover:bg-blue-100'"
              >
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h4 class="font-semibold text-gray-800">
                      {{ reqLabel(req) }}
                      <span v-if="reqIsUploaded(req)" class="ml-2 text-xs font-semibold text-green-700">
                        ✅ Uploaded
                      </span>
                      <span v-else class="ml-2 text-xs font-semibold text-red-700">
                        ❌ Missing
                      </span>
                    </h4>
                    <p class="text-xs text-gray-500 mt-1">File types: PDF, JPG, PNG, WEBP | Max size: 8MB</p>
                  </div>
                  <span
                    class="text-xs font-medium px-2 py-1 rounded"
                    :class="reqIsUploaded(req) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                  >
                    {{ reqIsUploaded(req) ? "Completed" : "Required" }}
                  </span>
                </div>

                <div v-if="reqIsUploaded(req)" class="text-xs text-gray-600">
                  File: <b>{{ reqUploadedFileName(req) }}</b>
                </div>
              </div>

              <p v-if="!normalizedSelectedRequirements.length" class="text-sm text-gray-500">
                — No requirements listed for this training.
              </p>
            </div>

            <!-- uploads list -->
            <div v-if="selectedCourse" class="mt-6 border-t pt-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-gray-800">📁 My Uploaded Files</h4>
                <button
                  class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  @click="fetchMyUploads"
                  :disabled="uploadsLoading"
                >
                  {{ uploadsLoading ? "Refreshing..." : "Refresh" }}
                </button>
              </div>

              <div v-if="uploadsLoading" class="text-sm text-gray-500 py-3">Loading uploads...</div>

              <div v-else-if="!myUploads.length" class="text-sm text-gray-500 py-3">
                No uploads yet for this training.
              </div>

              <ul v-else class="space-y-2">
                <li
                  v-for="u in myUploads"
                  :key="u.submission_id || (u.file_path + '-' + u.created_at)"
                  class="p-3 rounded border bg-white"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="text-sm">
                      <div class="font-medium text-gray-800">
                        {{ u.original_name || "Uploaded file" }}
                        <span v-if="u.requirement_label" class="text-[11px] text-gray-500 ml-2">
                          • {{ u.requirement_label }}
                        </span>
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ u.created_at || "" }}
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <a
                        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        :href="fullFileUrl(u.file_path)"
                        target="_blank"
                        rel="noopener"
                      >
                        View
                      </a>

                      <label
                        class="text-sm text-green-700 hover:text-green-900 font-medium cursor-pointer"
                        :class="(!selectedReservationId || !isUploadEditable) ? 'opacity-60 pointer-events-none' : ''"
                      >
                        Replace
                        <input
                          type="file"
                          class="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          @change="onReplaceUpload(u, $event)"
                          :disabled="!selectedReservationId || !isUploadEditable"
                        />
                      </label>

                      <button
                        class="text-sm text-red-600 hover:text-red-800 font-medium"
                        :disabled="deletingUploadId === (u.submission_id || '') || !selectedReservationId || !isUploadEditable"
                        :class="(!selectedReservationId || !isUploadEditable) ? 'opacity-60 cursor-not-allowed' : ''"
                        @click="deleteUpload(u)"
                        type="button"
                      >
                        {{ deletingUploadId === (u.submission_id || '') ? "Deleting..." : "Delete" }}
                      </button>
                    </div>
                  </div>
                </li>
              </ul>

              <div class="text-[11px] text-gray-500 mt-2">
                ✅ Replace will overwrite the same requirement. Delete removes it (you can upload again).
              </div>
            </div>
          </div>

          <!-- upload panel -->
          <div class="bg-white p-6 rounded-xl border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="text-blue-600">📎</span>
              Upload Documents
            </h3>

            <div
              v-if="!selectedReservationId"
              class="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-sm text-yellow-900"
            >
              ⚠️ Kailangan muna mag-enroll (ongoing reservation) bago makapag-upload.
            </div>

            <label
              class="block border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
              :class="(!selectedReservationId || !isUploadEditable) ? 'opacity-60 pointer-events-none' : ''"
            >
              <input
                type="file"
                class="hidden"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                @change="onFilesPicked"
                :disabled="!selectedReservationId || !isUploadEditable"
              />
              <div class="text-blue-600 text-4xl mb-4">📎</div>
              <h4 class="font-semibold text-gray-800 mb-2">Drop files here</h4>
              <p class="text-sm text-gray-600 mb-2">or click to browse</p>
              <p class="text-xs text-gray-500">Supports: PDF, JPG, PNG, WEBP (Max 8MB each)</p>
            </label>

            <div class="mt-6">
              <h4 class="font-semibold text-gray-700 mb-3">
                Selected Files ({{ selectedFiles.length }})
              </h4>

              <div v-if="!selectedFiles.length" class="text-center text-gray-500 py-4 border border-dashed border-gray-300 rounded-lg">
                No files selected
              </div>

              <ul v-else class="space-y-2">
                <li
                  v-for="(f, idx) in selectedFiles"
                  :key="idx"
                  class="p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="text-sm text-gray-800">
                      <div class="font-medium">{{ f.name }}</div>
                      <div class="text-xs text-gray-500">({{ formatBytes(f.size) }})</div>
                    </div>

                    <button
                      type="button"
                      class="text-red-600 hover:text-red-800 text-sm font-medium"
                      @click="removeFile(idx)"
                      :disabled="!isUploadEditable"
                      :class="(!isUploadEditable) ? 'opacity-60 cursor-not-allowed' : ''"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="mt-3">
                    <label class="block text-xs font-semibold text-gray-700 mb-1">
                      Assign this file to a requirement:
                    </label>
                    <select
                      class="w-full p-2 border rounded-md text-sm"
                      v-model="fileReqMap[idx]"
                      @change="onAssignRequirement(idx)"
                      :disabled="!isUploadEditable"
                    >
                      <option value="">— (Optional / Extra file)</option>
                      <option
                        v-for="r in normalizedSelectedRequirements"
                        :key="reqKey(r)"
                        :value="reqKey(r)"
                      >
                        {{ reqLabel(r) }}
                      </option>
                    </select>

                    <div v-if="fileReqMap[idx]" class="text-[11px] mt-1">
                      <span class="text-gray-500">Selected:</span>
                      <b class="text-gray-700 ml-1">
                        {{ labelByKey(fileReqMap[idx]) }}
                      </b>
                      <span v-if="uploadsByKey[fileReqMap[idx]]" class="text-green-700 ml-2">
                        (Already uploaded — this will REPLACE it)
                      </span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div v-if="selectedCourse && selectedReservationId" class="mt-4 text-xs">
              <div class="font-semibold text-gray-700 mb-1">Before you submit:</div>
              <div :class="requirementsComplete ? 'text-green-700' : 'text-red-700'">
                {{ requirementsComplete
                  ? '✅ All required documents are uploaded.'
                  : '❌ Missing required documents. Upload the missing ones first.' }}
              </div>
            </div>

            <button
              class="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              :disabled="!canSubmitUploads || !requirementsComplete || !isUploadEditable"
              :class="(!canSubmitUploads || !requirementsComplete || !isUploadEditable) ? 'opacity-60 cursor-not-allowed' : ''"
              @click="submitDocuments"
              type="button"
            >
              {{ submitting ? "Submitting..." : "Submit Documents" }}
            </button>

            <p class="text-xs text-gray-500 mt-3" v-if="uploadMsg">
              {{ uploadMsg }}
            </p>
          </div>
        </div>
      </section>

      <!-- ✅ MY RESERVATIONS -->
      <section
        v-if="activeTab === 'my'"
        class="bg-white p-6 rounded-xl shadow border border-gray-200"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg inline-block">
            My Reservations
          </h2>
          <button
            class="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            @click="fetchMyReservations"
            :disabled="loadingMyReservations"
          >
            {{ loadingMyReservations ? "Refreshing..." : "Refresh" }}
          </button>
        </div>

        <div v-if="loadingMyReservations" class="text-center py-10 text-gray-600">
          Loading...
        </div>

        <div v-else-if="!myReservations.length" class="text-gray-600">
          No reservations yet.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="r in myReservations"
            :key="r.reservation_id"
            class="p-4 rounded border bg-gray-50"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="font-semibold text-gray-800">
                  {{ r.course_name }}
                </div>
                <div class="text-sm text-gray-700 mt-1">
                  Batch:
                  <span class="font-medium">
                    {{ displayScheduleForStudent(r) }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Reserved at: {{ r.created_at || "—" }}
                </div>
              </div>
              <div>
                <span
                  class="text-xs px-2 py-1 rounded font-medium"
                  :class="statusPill(r.reservation_status)"
                >
                  {{ String(r.reservation_status || "").toUpperCase() }}
                </span>
              </div>
            </div>

            <div class="mt-3">
              <button
                class="px-3 py-2 rounded-md bg-blue-700 text-white hover:bg-blue-800 text-sm font-medium"
                @click="openUploadFromReservation(r)"
                :disabled="!isOngoingStatus(r.reservation_status)"
                :class="!isOngoingStatus(r.reservation_status) ? 'opacity-60 cursor-not-allowed' : ''"
              >
                Continue Upload
              </button>
              <div v-if="!isOngoingStatus(r.reservation_status)" class="text-[11px] text-gray-500 mt-1">
                (This reservation is not ongoing.)
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </StudentLayoutTesda>
</template>

<script>
import StudentLayoutTesda from "./StudentLayoutTesda.vue";

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
      return reqs
        .filter(Boolean)
        .map((x) => String(x).trim())
        .filter(Boolean)
        .map((label) => ({ key: this.slugify(label), label }));
    },

    requiredCount() {
      return this.normalizedSelectedRequirements.length;
    },

    uploadedCount() {
      return this.normalizedSelectedRequirements.filter((r) => this.reqIsUploaded(r)).length;
    },

    requirementsComplete() {
      if (!this.selectedCourse) return false;
      if (this.requiredCount === 0) return true;
      return this.uploadedCount >= this.requiredCount;
    },

    canSubmitUploads() {
      return !!this.selectedCourse && !!this.selectedReservationId && !this.submitting;
    },

    selectedReservationPreview() {
      if (!this.selectedReservationId) return "—";
      const rid = Number(this.selectedReservationId);
      const r = (this.myReservations || []).find((x) => Number(x?.reservation_id) === rid);
      return r ? this.reservationPreview(r) : `Reservation #${rid}`;
    },

    // ✅ DB-based active reservation
    activeReservation() {
      const rows = (this.myReservations || [])
        .filter(r => this.isOngoingStatus(r?.reservation_status))
        .sort((a, b) => Number(b?.reservation_id || 0) - Number(a?.reservation_id || 0));
      return rows[0] || null;
    },

    // ✅ selected reservation row + lock logic
    selectedReservationRow() {
      const rid = Number(this.selectedReservationId || 0);
      if (!rid) return null;
      return (this.myReservations || []).find(r => Number(r?.reservation_id) === rid) || null;
    },

    // ✅ ONLY PENDING can edit uploads
    isUploadEditable() {
      const st = String(this.selectedReservationRow?.reservation_status || "").toUpperCase();
      return st === "PENDING";
    },
  },

  watch: {
    activeTab(newTab) {
      if (newTab === "upload") {
        this.syncUploadSelectionFromDb();
      }
    },

    myReservations() {
      if (this.activeTab === "upload") {
        this.syncUploadSelectionFromDb();
      }
    },
  },

  methods: {
    // =========================
    // Upload tab logic (DB-based)
    // =========================
    async openUploadTab() {
      this.activeTab = "upload";
      await this.syncUploadSelectionFromDb();
    },

    async goToUploadFromActiveReservation() {
      await this.openUploadFromReservation(this.activeReservation);
    },

    async syncUploadSelectionFromDb() {
      if (this.selectedReservationId) {
        const exists = (this.myReservations || []).some(r => Number(r?.reservation_id) === Number(this.selectedReservationId));
        if (exists) {
          const rr = (this.myReservations || []).find(r => Number(r?.reservation_id) === Number(this.selectedReservationId));
          if (rr && !this.selectedCourse) {
            const c = (this.courses || []).find(x => Number(x?.id) === Number(rr?.course_id));
            if (c) this.selectedCourse = c;
          }
          await this.fetchMyUploads();
          return;
        }
      }

      if (!this.activeReservation) {
        this.selectedReservationId = null;
        this.selectedCourse = null;
        this.myUploads = [];
        this.uploadsByKey = {};
        return;
      }

      await this.openUploadFromReservation(this.activeReservation);
    },

    // =========================
    // ongoing helpers
    // =========================
    isOngoingStatus(st) {
      const s = String(st || "").toUpperCase();
      return this.ONGOING_STATUSES.includes(s);
    },

    courseOngoingReservation(courseId) {
      const rows = (this.myReservations || [])
        .filter(r =>
          Number(r?.course_id) === Number(courseId) &&
          this.isOngoingStatus(r?.reservation_status)
        )
        .sort((a, b) => Number(b?.reservation_id || 0) - Number(a?.reservation_id || 0));
      return rows[0] || null;
    },

    reservationPreview(r) {
      const d = String(r?.schedule_date || "").trim();
      const a = r?.startTime || "08:00";
      const b = r?.endTime || "17:00";
      const batchNo = r?.batch_no ? `Batch ${r.batch_no}` : "Batch";
      const st = String(r?.reservation_status || "").toUpperCase();
      const name = r?.course_name || "Training";

      const batchText = (!d || d === "TBA")
        ? `${batchNo} • TBA (Pooling) ${a}-${b}`
        : `${batchNo} • ${d} ${a}-${b}`;

      return `${name} • ${batchText} • ${st}`;
    },

    async openUploadFromReservation(r) {
      if (!r) return;

      const courseId = Number(r?.course_id || 0);
      const rid = r?.reservation_id || null;

      const c = (this.courses || []).find(x => Number(x?.id) === courseId) || null;
      if (c) this.selectedCourse = c;

      this.selectedReservationId = rid;
      this.activeTab = "upload";

      await this.fetchMyUploads();
    },

    // =========================
    // KEY helpers
    // =========================
    slugify(s) {
      return String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 120);
    },

    reqKey(req) {
      return typeof req === "string" ? this.slugify(req) : String(req?.key || "");
    },

    reqLabel(req) {
      return typeof req === "string" ? String(req) : String(req?.label || "");
    },

    labelByKey(k) {
      const hit = (this.normalizedSelectedRequirements || []).find(r => r.key === k);
      return hit?.label || k;
    },

    buildUploadsByKey() {
      const m = {};
      for (const u of (this.myUploads || [])) {
        const k = String(u?.requirement_key || "").trim();
        if (k) m[k] = u;
      }
      this.uploadsByKey = m;
    },

    normalizeReqName(s) {
      return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
    },

    reqIsUploaded(req) {
      const key = this.reqKey(req);
      if (key && this.uploadsByKey[key]) return true;

      const label = this.reqLabel(req);
      const reqText = this.normalizeReqName(label);
      if (!reqText) return false;

      return (this.myUploads || []).some((u) => {
        const name = this.normalizeReqName(u?.original_name || u?.file_name || u?.file_path || "");
        return name.includes(reqText);
      });
    },

    reqUploadedFileName(req) {
      const key = this.reqKey(req);
      const byKey = key ? this.uploadsByKey[key] : null;
      if (byKey) return byKey?.original_name || "Uploaded";

      const label = this.reqLabel(req);
      const reqText = this.normalizeReqName(label);
      const hit = (this.myUploads || []).find((u) => {
        const name = this.normalizeReqName(u?.original_name || u?.file_name || u?.file_path || "");
        return name.includes(reqText);
      });
      return hit?.original_name || hit?.file_name || "Uploaded";
    },

    // =========================
    // TESDA date helpers
    // =========================
    toLocalYMD(dateLike) {
      const d = new Date(dateLike);
      if (Number.isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    },

    parseDurationHours(duration) {
      const m = String(duration || "").match(/(\d+(?:\.\d+)?)/);
      const n = m ? Number(m[1]) : 0;
      return Number.isFinite(n) ? n : 0;
    },

    tesdaDaysFromDuration(duration) {
      const TESDA_HOURS_PER_DAY = 9;
      const totalHours = this.parseDurationHours(duration);
      return totalHours > 0 ? Math.max(1, Math.ceil(totalHours / TESDA_HOURS_PER_DAY)) : 1;
    },

    isMonToSatYMD(ymd) {
      if (!ymd) return false;
      const d = new Date(`${ymd}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      const day = d.getDay();
      return day >= 1 && day <= 6;
    },

    addDaysSkipSundays(startYmd, addTrainingDays) {
      let d = new Date(`${startYmd}T00:00:00`);
      let added = 0;

      while (added < addTrainingDays) {
        d.setDate(d.getDate() + 1);
        const ymd = this.toLocalYMD(d);
        if (this.isMonToSatYMD(ymd)) added++;
      }
      return this.toLocalYMD(d);
    },

    tesdaEndDateFromStart(startYmd, duration) {
      if (!startYmd) return "";
      if (!this.isMonToSatYMD(startYmd)) return "";
      const daysNeeded = this.tesdaDaysFromDuration(duration);
      if (daysNeeded <= 1) return startYmd;
      return this.addDaysSkipSundays(startYmd, daysNeeded - 1);
    },

    formatDateNice(ymd) {
      if (!ymd) return "TBA";
      const d = new Date(`${ymd}T00:00:00`);
      if (Number.isNaN(d.getTime())) return "TBA";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },

    isScheduled(s) {
      const d = String(s?.date || "").trim();
      return Boolean(d) && /^\d{4}-\d{2}-\d{2}$/.test(d);
    },

    displayStatus(s) {
      const st = String(s?.computedStatus || s?.status || "").trim();
      if (st) return st;
      const avail = Number(s?.availableSlots || 0);
      return avail === 0 ? "Full" : "Open";
    },

    schedulesOpenFor(courseId) {
      return this.schedulesOpenId === courseId;
    },

    badgeClass(status) {
      const s = String(status || "").toLowerCase();
      if (s === "open") return "bg-green-100 text-green-800";
      if (s === "full") return "bg-red-100 text-red-800";
      if (s === "closed") return "bg-gray-200 text-gray-700";
      if (s === "tba") return "bg-gray-100 text-gray-700";
      return "bg-gray-100 text-gray-700";
    },

    statusPill(st) {
      const s = String(st || "").toUpperCase();
      if (s === "PENDING") return "bg-yellow-100 text-yellow-800";
      if (s === "APPROVED") return "bg-green-100 text-green-800";
      if (s === "CONFIRMED") return "bg-green-100 text-green-800";
      if (s === "ACTIVE") return "bg-blue-100 text-blue-800";
      if (s === "DONE") return "bg-gray-200 text-gray-700";
      if (s === "CANCELLED") return "bg-red-100 text-red-800";
      return "bg-gray-100 text-gray-700";
    },

    canReserveSchedule(course, s) {
      if (this.courseOngoingReservation(course?.id)) return false;
      const st = String(this.displayStatus(s) || "").toLowerCase();
      const avail = Number(s?.availableSlots || 0);
      return st === "open" && avail > 0 && !this.reserving;
    },

    displayScheduleForStudent(r) {
      const st = String(r?.reservation_status || "").toUpperCase();
      const d = String(r?.schedule_date || "").trim();
      const a = r?.startTime || "08:00";
      const b = r?.endTime || "17:00";
      const batchNo = r?.batch_no ? `Batch ${r.batch_no}` : "Batch";

      if (st === "PENDING") {
        return (!d || d === "TBA")
          ? `${batchNo} • TBA (Pooling) ${a}-${b} (Pending verification)`
          : `${batchNo} • ${d} ${a}-${b} (Pending verification)`;
      }

      return (!d || d === "TBA")
        ? `${batchNo} • TBA (Pooling) ${a}-${b}`
        : `${batchNo} • ${d} ${a}-${b}`;
    },

    fullFileUrl(path) {
      const p = String(path || "");
      if (!p) return "";
      return p.startsWith("http") ? p : `http://localhost:3000${p}`;
    },

    // =========================
    // API
    // =========================
    async fetchCourses() {
      this.loadingCourses = true;
      try {
        const res = await fetch("http://localhost:3000/api/tesda/courses", { credentials: "include" });
        const json = await res.json();
        this.courses = Array.isArray(json?.data) ? json.data : [];
      } catch (err) {
        console.error("fetchCourses error:", err);
        this.courses = [];
      } finally {
        this.loadingCourses = false;
      }
    },

    toggleRequirements(courseId) {
      this.showReqMap[courseId] = !this.showReqMap[courseId];
    },

    async toggleSchedules(course) {
      const courseId = course?.id;
      if (!courseId) return;

      if (this.schedulesOpenId === courseId) {
        this.schedulesOpenId = null;
        this.schedules = [];
        return;
      }

      this.selectedCourse = course;
      this.schedulesOpenId = courseId;
      this.loadingSchedules = true;
      this.schedules = [];

      try {
        const url = `http://localhost:3000/api/tesda/schedules?course_id=${encodeURIComponent(courseId)}`;
        const res = await fetch(url, { credentials: "include" });
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];

        this.schedules = rows.map((s) => {
          const rawDate = s?.date ?? s?.schedule_date ?? "";
          const dateStr = String(rawDate || "");
          const normalizedDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
          const sid = s?.id ?? s?.schedule_id;

          return {
            ...s,
            id: sid,
            date: normalizedDate || "",
            computedStatus: s?.computedStatus || s?.status || "",
            startTime: s?.startTime || s?.start_time || "08:00",
            endTime: s?.endTime || s?.end_time || "17:00",
            totalSlots: Number(s?.totalSlots ?? s?.total_slots ?? 0),
            availableSlots: Number(s?.availableSlots ?? s?.available_slots ?? 0),
          };
        });

        this.schedules.sort((a, b) => {
          const aSched = this.isScheduled(a) ? 1 : 0;
          const bSched = this.isScheduled(b) ? 1 : 0;
          if (aSched !== bSched) return bSched - aSched;
          if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
          return Number(b.availableSlots || 0) - Number(a.availableSlots || 0);
        });
      } catch (err) {
        console.error("fetchSchedules error:", err);
        this.schedules = [];
      } finally {
        this.loadingSchedules = false;
      }
    },

    async reserveSchedule(course, sched) {
      if (this.courseOngoingReservation(course?.id)) {
        alert("May existing reservation ka na sa training na ito. Continue upload na lang.");
        await this.openUploadFromReservation(this.courseOngoingReservation(course?.id));
        return;
      }

      if (!this.canReserveSchedule(course, sched)) return;

      const courseId = Number(course?.id || 0);
      const scheduleId = Number(sched?.id || 0);

      this.reserving = true;
      this.uploadMsg = "";

      try {
        const res = await fetch("http://localhost:3000/api/tesda/reservations", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schedule_id: scheduleId, course_id: courseId }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Reservation failed");

        await this.fetchMyReservations();

        await this.openUploadFromReservation(this.courseOngoingReservation(courseId) || this.activeReservation);
        this.uploadMsg = "✅ Enrolled. Upload your requirements now.";
      } catch (err) {
        console.error(err);
        alert(err.message || "Failed to enroll");
      } finally {
        this.reserving = false;
      }
    },

    onFilesPicked(e) {
      if (!this.isUploadEditable) {
        this.uploadMsg = "🔒 Uploads are locked (reservation is not PENDING).";
        e.target.value = "";
        return;
      }

      const files = Array.from(e.target.files || []);
      const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

      const filtered = files.filter((f) => {
        if (!allowed.has(f.type)) return false;
        if (f.size > 8 * 1024 * 1024) return false;
        return true;
      });

      this.selectedFiles = [...this.selectedFiles, ...filtered];

      const startIdx = this.selectedFiles.length - filtered.length;
      for (let i = 0; i < filtered.length; i++) {
        const idx = startIdx + i;
        if (this.fileReqMap[idx] === undefined) this.$set
          ? this.$set(this.fileReqMap, idx, "")
          : (this.fileReqMap[idx] = "");
      }

      e.target.value = "";
    },

    removeFile(idx) {
      if (!this.isUploadEditable) {
        this.uploadMsg = "🔒 Uploads are locked (reservation is not PENDING).";
        return;
      }
      this.selectedFiles.splice(idx, 1);
      const newMap = {};
      this.selectedFiles.forEach((_, i) => {
        newMap[i] = this.fileReqMap[i >= idx ? i + 1 : i] || "";
      });
      this.fileReqMap = newMap;
    },

    formatBytes(bytes) {
      const b = Number(bytes || 0);
      if (b < 1024) return `${b} B`;
      const kb = b / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      const mb = kb / 1024;
      return `${mb.toFixed(1)} MB`;
    },

    async fetchMyUploads() {
      if (!this.selectedCourse?.id || !this.selectedReservationId) return;
      this.uploadsLoading = true;
      try {
        const url = `http://localhost:3000/api/tesda/requirements?course_id=${encodeURIComponent(this.selectedCourse.id)}&reservation_id=${encodeURIComponent(this.selectedReservationId)}`;
        const res = await fetch(url, { credentials: "include" });
        const json = await res.json();
        this.myUploads = Array.isArray(json?.data) ? json.data : [];
        this.buildUploadsByKey();
      } catch (err) {
        console.error("fetchMyUploads error:", err);
        this.myUploads = [];
        this.uploadsByKey = {};
      } finally {
        this.uploadsLoading = false;
      }
    },

    async onAssignRequirement(idx) {
      if (!this.isUploadEditable) {
        this.uploadMsg = "🔒 Uploads are locked (reservation is not PENDING).";
        this.fileReqMap[idx] = "";
        return;
      }

      if (!this.selectedCourse?.id || !this.selectedReservationId) {
        alert("Enroll muna bago mag-assign ng requirements.");
        this.fileReqMap[idx] = "";
        return;
      }

      const reqKey = String(this.fileReqMap[idx] || "");
      if (!reqKey) return;

      const file = this.selectedFiles[idx];
      if (!file) return;

      this.uploadMsg = "";

      try {
        const fd = new FormData();
        fd.append("course_id", String(this.selectedCourse.id));
        fd.append("reservation_id", String(this.selectedReservationId));
        fd.append("requirement_key", reqKey);
        fd.append("requirement_label", this.labelByKey(reqKey));
        fd.append("file", file);

        const res = await fetch("http://localhost:3000/api/tesda/requirements/upload-one", {
          method: "POST",
          body: fd,
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Upload failed");

        await this.fetchMyUploads();
        this.uploadMsg = `✅ Uploaded: ${this.labelByKey(reqKey)}`;

        this.selectedFiles.splice(idx, 1);
        const newMap = {};
        this.selectedFiles.forEach((_, i) => {
          newMap[i] = this.fileReqMap[i >= idx ? i + 1 : i] || "";
        });
        this.fileReqMap = newMap;

      } catch (err) {
        console.error(err);
        this.uploadMsg = `❌ Upload failed: ${err.message || "Try again"}`;
      }
    },

    async onReplaceUpload(u, e) {
      if (!this.isUploadEditable) {
        this.uploadMsg = "🔒 Uploads are locked (reservation is not PENDING).";
        e.target.value = "";
        return;
      }

      const file = (e.target.files && e.target.files[0]) ? e.target.files[0] : null;
      e.target.value = "";
      if (!file) return;

      if (!this.selectedCourse?.id || !this.selectedReservationId) {
        alert("Enroll muna bago mag-replace.");
        return;
      }

      const reqKey = String(u?.requirement_key || "").trim();
      if (!reqKey) {
        alert("Missing requirement_key on this upload row.");
        return;
      }

      const allowed = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
      if (!allowed.has(file.type) || file.size > 8 * 1024 * 1024) {
        alert("Invalid file type/size. PDF/JPG/PNG/WEBP up to 8MB.");
        return;
      }

      this.uploadMsg = "";
      try {
        const fd = new FormData();
        fd.append("course_id", String(this.selectedCourse.id));
        fd.append("reservation_id", String(this.selectedReservationId));
        fd.append("requirement_key", reqKey);
        fd.append("requirement_label", String(u?.requirement_label || this.labelByKey(reqKey)));
        fd.append("file", file);

        const res = await fetch("http://localhost:3000/api/tesda/requirements/upload-one", {
          method: "POST",
          body: fd,
          credentials: "include",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Replace failed");

        await this.fetchMyUploads();
        this.uploadMsg = `✅ Replaced: ${String(u?.requirement_label || this.labelByKey(reqKey))}`;
      } catch (err) {
        console.error(err);
        this.uploadMsg = `❌ Replace failed: ${err.message || "Try again"}`;
      }
    },

    async deleteUpload(u) {
      if (!this.isUploadEditable) {
        this.uploadMsg = "🔒 Uploads are locked (reservation is not PENDING).";
        return;
      }

      if (!this.selectedReservationId) return;

      const sid = u?.submission_id;
      if (!sid) {
        alert("Missing submission_id. (Backend should return it.)");
        return;
      }

      if (!confirm("Delete this uploaded file?")) return;

      this.deletingUploadId = sid;
      this.uploadMsg = "";

      try {
        const res = await fetch(`http://localhost:3000/api/tesda/requirements/${encodeURIComponent(sid)}`, {
          method: "DELETE",
          credentials: "include",
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Delete failed");

        await this.fetchMyUploads();
        this.uploadMsg = "✅ Deleted upload.";
      } catch (err) {
        console.error(err);
        this.uploadMsg = `❌ Delete failed: ${err.message || "Try again"}`;
      } finally {
        this.deletingUploadId = "";
      }
    },

    async submitDocuments() {
      if (!this.isUploadEditable) {
        this.uploadMsg = "🔒 Uploads are locked (reservation is not PENDING).";
        return;
      }

      if (!this.canSubmitUploads) return;

      if (!this.requirementsComplete) {
        alert("Kulang pa ang requirements. I-upload muna ang missing documents.");
        return;
      }

      this.submitting = true;
      this.uploadMsg = "";

      try {
        const requiredKeys = this.normalizedSelectedRequirements.map(r => r.key);

        const res = await fetch("http://localhost:3000/api/tesda/requirements/submit", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: this.selectedCourse.id,
            reservation_id: this.selectedReservationId,
            required_keys: requiredKeys,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Submit failed");

        this.uploadMsg = "✅ All requirements complete. Submitted for verification.";
        await this.fetchMyUploads();
        await this.fetchMyReservations();
      } catch (err) {
        console.error(err);
        this.uploadMsg = `❌ Submit failed: ${err.message || "Try again"}`;
      } finally {
        this.submitting = false;
      }
    },

    async fetchMyReservations() {
      this.loadingMyReservations = true;
      try {
        const res = await fetch("http://localhost:3000/api/tesda/my-reservations", { credentials: "include" });
        const json = await res.json();
        this.myReservations = Array.isArray(json?.data) ? json.data : [];
      } catch (err) {
        console.error("fetchMyReservations error:", err);
        this.myReservations = [];
      } finally {
        this.loadingMyReservations = false;
      }
    },

    loadUserData() {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.studentName = user.name || user.username || "Student";
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    },

    getUserInitial() {
      return String(this.studentName || "S").charAt(0).toUpperCase();
    },
  },

  async mounted() {
    this.loadUserData();
    await this.fetchCourses();
    await this.fetchMyReservations();

    if (this.activeReservation && this.activeTab === "upload") {
      await this.openUploadFromReservation(this.activeReservation);
    }
  },
};
</script>

<style scoped>
.transition-colors {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.transition-shadow {
  transition: box-shadow 0.3s ease;
}
.transition-all {
  transition: all 0.3s ease-in-out;
}
.transition-transform {
  transition: transform 0.3s ease;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>