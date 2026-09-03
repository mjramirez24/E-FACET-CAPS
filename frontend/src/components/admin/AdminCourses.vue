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
          placeholder="Search courses..."
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div class="courses-wrapper">
      <!-- Toast Notification -->
      <transition name="toast-fade">
        <div v-if="toast.show" class="toast-notification" :class="toast.type === 'success' ? 'toast-success' : 'toast-error'">
          <svg v-if="toast.type === 'success'" class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm font-medium">{{ toast.message }}</span>
          <button @click="toast.show = false" class="ml-auto flex-shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </transition>

      <!-- Page Header with Add Button -->
      <div class="page-header-section">
        <div class="page-header-row">
          <div>
            <h2 class="page-title">Courses Management</h2>
            <p class="page-subtitle">Manage Driving and TESDA courses, assign instructors and trainers</p>
          </div>
          <button v-if="activeTab === 'driving'" @click="openAddModal" class="add-btn">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Driving Course
          </button>
          <button v-if="activeTab === 'tesda'" @click="openTesdaAddModal" class="add-btn add-btn-blue">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add TESDA Course
          </button>
        </div>
      </div>

      <!-- Course Tabs -->
      <div class="tab-group mb-4">
        <button
          @click="activeTab = 'driving'"
          class="tab-btn"
          :class="activeTab === 'driving' ? 'tab-active-green' : 'tab-inactive'"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 11l2-4h10l2 4M3 16v-3a1 1 0 011-1h16a1 1 0 011 1v3" />
            <path d="M7 12h10l1 4H6l1-4z" />
            <circle cx="6" cy="17" r="2" fill="currentColor" />
            <circle cx="18" cy="17" r="2" fill="currentColor" />
          </svg>
          Driving Courses
        </button>

        <button
          @click="activeTab = 'tesda'"
          class="tab-btn"
          :class="activeTab === 'tesda' ? 'tab-active-blue' : 'tab-inactive'"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          TESDA Courses
        </button>
      </div>

      <!-- DRIVING TAB -->
      <div v-if="activeTab === 'driving'">
        <!-- Driving Instructor Assignment Panel -->
        <div class="panel-card mb-5">
          <div class="panel-header-bar">
            <div>
              <h3 class="text-md font-bold text-gray-800">Instructor Assignment</h3>
              <p class="text-xs text-gray-500 mt-1">Assign instructors to driving courses here.</p>
            </div>
            <button @click="refreshAssignments" class="btn-outline-sm">Refresh</button>
          </div>
          <div class="table-wrap p-4">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Current Instructor</th>
                  <th>Assign New</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in courses" :key="c.id">
                  <td>
                    <div class="font-medium">{{ c.course_name }}</div>
                    <div class="text-xs text-gray-500">{{ c.course_code }}</div>
                  </td>
                  <td><span class="text-gray-700">{{ assignmentLabel(c.id) }}</span></td>
                  <td>
                    <select v-model="pendingAssign[c.id]" class="select-modern w-full">
                      <option value="">-- Select Instructor --</option>
                      <option v-for="ins in instructors" :key="ins.instructor_id" :value="ins.instructor_id">
                        {{ ins.fullname }} ({{ ins.instructor_code }})
                      </option>
                    </select>
                  </td>
                  <td>
                    <button class="action-edit" :disabled="!pendingAssign[c.id]" @click="saveAssignment(c.id)">Save</button>
                  </td>
                </tr>
                <tr v-if="courses.length === 0">
                  <td colspan="4" class="empty-cell">No courses loaded</td>
                </tr>
              </tbody>
            </table>
            <p class="text-xs text-gray-400 mt-3">Tip: Pag nag-Save ka, automatic yan mag-o-overwrite kung may dati nang assigned instructor.</p>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p class="text-gray-500">Loading courses...</p>
        </div>

        <!-- Table -->
        <div v-else class="panel-card">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Showing {{ filteredCourses.length }} of {{ courses.length }} courses</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Sort by:</span>
              <select v-model="sortBy" class="select-modern-sm">
                <option value="name">Name A-Z</option>
                <option value="nameDesc">Name Z-A</option>
                <option value="feeAsc">Fee Low-High</option>
                <option value="feeDesc">Fee High-Low</option>
                <option value="duration">Duration</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green">
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Duration</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in filteredCourses" :key="course.id">
                  <td class="font-medium">{{ course.course_code }}</td>
                  <td>
                    <div>
                      <p class="font-medium">{{ course.course_name }}</p>
                      <p class="text-xs text-gray-500 mt-1 truncate max-w-xs">{{ course.description || "—" }}</p>
                      <p class="text-xs text-gray-500 mt-1 truncate max-w-xs"><span class="font-semibold">Req:</span> {{ formatRequirementsInline(course.requirements) }}</p>
                    </div>
                  </td>
                  <td>{{ course.duration || "—" }}</td>
                  <td>₱{{ Number(course.course_fee || 0).toLocaleString() }}</td>
                  <td><span :class="course.status === 'active' ? 'pill pill-green' : 'pill pill-gray'">{{ course.status }}</span></td>
                  <td>
                    <div class="action-btns">
                      <button class="action-view" @click="viewCourse(course)">View</button>
                      <button class="action-edit" @click="editCourse(course)">Edit</button>
                      <button class="action-delete" @click="confirmDelete(course)">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredCourses.length === 0">
                  <td colspan="6" class="empty-cell">No courses found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add/Edit Modal -->
        <transition name="modal-fade">
          <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <transition name="modal-scale">
              <div class="modal-card">
                <div class="modal-head modal-head-green">
                  <h3 class="modal-title">{{ isEditing ? 'Edit Course' : 'Add New Driving Course' }}</h3>
                  <button class="modal-close-btn" @click="closeModal">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div class="modal-body">
                  <form @submit.prevent="saveCourse">
                    <div class="form-grid">
                      <div class="form-group">
                        <label class="form-label">Course Code *</label>
                        <input type="text" v-model="formData.course_code" required class="form-input" placeholder="e.g. DRV101" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Duration *</label>
                        <select v-model="formData.duration" required class="form-input">
                          <option value="" disabled>Select duration</option>
                          <option value="8 hours">8 hours</option>
                          <option value="15 hours">15 hours</option>
                          <option value="4 hours for 2 days">4 hours for 2 days</option>
                        </select>
                      </div>
                      <div class="form-group md-col-span-2">
                        <label class="form-label">Course Name *</label>
                        <input type="text" v-model="formData.course_name" required class="form-input" placeholder="Enter course name" />
                      </div>
                      <div class="form-group md-col-span-2">
                        <label class="form-label">Description (Optional)</label>
                        <textarea v-model="formData.description" rows="3" class="form-input" placeholder="Enter course description"></textarea>
                      </div>
                      <div class="form-group md-col-span-2">
                        <label class="form-label">Course Requirements</label>
                        <textarea v-model="formData.requirementsText" rows="4" class="form-input" placeholder="One requirement per line (e.g. Valid ID, 2x2 Photo, Medical Certificate)"></textarea>
                        <p class="text-xs text-gray-400 mt-1">Tip: isang requirement bawat line.</p>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Course Fee</label>
                        <input type="number" v-model.number="formData.course_fee" min="0" class="form-input" placeholder="0" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Status</label>
                        <select v-model="formData.status" class="form-input">
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                        </select>
                      </div>
                    </div>
                    <div class="modal-foot">
                      <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
                      <button type="submit" class="btn-save btn-green">{{ isEditing ? 'Update' : 'Save Course' }}</button>
                    </div>
                  </form>
                </div>
              </div>
            </transition>
          </div>
        </transition>

        <!-- Delete Confirmation Modal - Logout Style -->
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
                      <h3 class="text-lg font-bold text-gray-900">Delete Course</h3>
                      <p class="text-sm text-gray-500">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                <div class="modal-body-delete">
                  <p class="text-sm text-gray-700 leading-relaxed">
                    Are you sure you want to delete
                    <span class="font-semibold text-gray-900">{{ courseToDelete?.course_name }}</span>?
                    All data associated with this course will be permanently removed.
                  </p>

                  <div class="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      @click="cancelDelete"
                      class="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 text-sm font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      @click="deleteCourse"
                      class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Course
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </transition>
      </div>

      <!-- TESDA TAB -->
      <div v-else-if="activeTab === 'tesda'">
        <!-- TESDA Trainer Assignment Panel -->
        <div class="panel-card mb-5">
          <div class="panel-header-bar">
            <div>
              <h3 class="text-md font-bold text-gray-800">
                Trainer Assignment
              </h3>

              <p class="text-xs text-gray-500 mt-1">
                Assign multiple trainers to the same TESDA course.
              </p>
            </div>

            <button
              @click="refreshTesdaAssignments"
              class="btn-outline-sm"
            >
              Refresh
            </button>
          </div>

          <div class="table-wrap p-4">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Assigned Trainers</th>
                  <th>Select Trainers</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="c in tesdaCourses"
                  :key="c.id"
                >
                  <!-- COURSE -->
                  <td>
                    <div class="font-medium">
                      {{ c.course_name }}
                    </div>

                    <div class="text-xs text-gray-500">
                      {{ c.course_code }}
                    </div>
                  </td>

                  <!-- CURRENT ASSIGNED TRAINERS -->
                  <td>
                    <div
                      v-if="
                        tesdaAssignmentsMap[c.id] &&
                        tesdaAssignmentsMap[c.id].length
                      "
                      class="flex flex-col gap-1"
                    >
                      <div
                        v-for="a in tesdaAssignmentsMap[c.id]"
                        :key="a.trainer_id"
                        class="text-sm text-gray-700"
                      >
                        {{ a.trainer_name }}
                        <span v-if="a.trainer_code" class="text-gray-500">
                          ({{ a.trainer_code }})
                        </span>
                      </div>
                    </div>

                  <span
                    v-else
                    class="text-gray-400 text-sm"
                  >
                    Assign Trainer
                  </span>
                  </td>

                  <!-- TRAINER DROPDOWN WITH CHECKBOXES -->
                  <td>
                    <details class="relative w-full">
                      <summary
                        class="select-modern w-full cursor-pointer list-none flex items-center justify-between"
                      >
                        <span>
                          {{
                            Array.isArray(tesdaPendingAssign[c.id]) &&
                            tesdaPendingAssign[c.id].length
                              ? `${tesdaPendingAssign[c.id].length} trainer(s) selected`
                              : "-- Select Trainers --"
                          }}
                        </span>

                        <span class="text-gray-400 text-xs">
                          ▼
                        </span>
                      </summary>

                      <div
                        class="absolute z-50 mt-1 w-full min-w-[230px] max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white shadow-lg"
                      >
                        <label
                          v-for="t in tesdaTrainers"
                          :key="t.trainer_id"
                          class="flex items-center gap-2 cursor-pointer text-sm text-gray-700 px-2 py-2 rounded-md hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            :value="Number(t.trainer_id)"
                            v-model="tesdaPendingAssign[c.id]"
                            class="w-4 h-4"
                          />

                          <span>
                            {{ t.fullname }}
                            <span class="text-gray-400">
                              ({{ t.trainer_code }})
                            </span>
                          </span>
                        </label>

                        <div
                          v-if="tesdaTrainers.length === 0"
                          class="text-xs text-gray-400 px-2 py-2"
                        >
                          No active trainers available
                        </div>
                      </div>
                    </details>
                  </td>

                  <!-- SAVE -->
                  <td>
                    <button
                      class="action-edit"
                      :disabled="
                        !Array.isArray(
                          tesdaPendingAssign[c.id]
                        ) ||
                        tesdaPendingAssign[c.id].length === 0
                      "
                      @click="saveTesdaAssignment(c.id)"
                    >
                      Save Trainers
                    </button>
                  </td>
                </tr>

                <tr v-if="tesdaCourses.length === 0">
                  <td
                    colspan="4"
                    class="empty-cell"
                  >
                    No TESDA courses loaded
                  </td>
                </tr>
              </tbody>
            </table>

            <p class="text-xs text-gray-400 mt-3">
              You may select multiple trainers for one TESDA course.
              All assigned trainers will share the same course,
              schedule, students, and attendance.
            </p>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="tesdaLoading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p class="text-gray-500">Loading TESDA courses...</p>
        </div>

        <!-- Table -->
        <div v-else class="panel-card">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Showing {{ filteredTesdaCourses.length }} of {{ tesdaCourses.length }} courses</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Sort by:</span>
              <select v-model="tesdaSortBy" class="select-modern-sm">
                <option value="name">Name A-Z</option>
                <option value="nameDesc">Name Z-A</option>
                <option value="duration">Duration</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-blue">
                <tr>
                  <th>Code</th>
                  <th>Course Name</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="course in filteredTesdaCourses" :key="course.id">
                  <td class="font-medium">{{ course.course_code }}</td>
                  <td>
                    <div>
                      <p class="font-medium">{{ course.course_name }}</p>
                      <p class="text-xs text-gray-500 mt-1 truncate max-w-xs">{{ course.description || "—" }}</p>
                      <p class="text-xs text-gray-500 mt-1 truncate max-w-xs"><span class="font-semibold">Req:</span> {{ formatRequirementsInline(course.requirements) }}</p>
                    </div>
                  </td>
                  <td>{{ course.duration || "—" }}</td>
                  <td><span :class="course.status === 'active' ? 'pill pill-green' : 'pill pill-gray'">{{ course.status }}</span></td>
                  <td>
                    <div class="action-btns">
                      <button class="action-view" @click="viewTesdaCourse(course)">View</button>
                      <button class="action-edit" @click="editTesdaCourse(course)">Edit</button>
                      <button class="action-delete" @click="confirmTesdaDelete(course)">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredTesdaCourses.length === 0">
                  <td colspan="5" class="empty-cell">No TESDA courses found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TESDA Add/Edit Modal -->
        <transition name="modal-fade">
          <div v-if="showTesdaModal" class="modal-overlay" @click.self="closeTesdaModal">
            <transition name="modal-scale">
              <div class="modal-card">
                <div class="modal-head modal-head-blue">
                  <h3 class="modal-title">{{ tesdaIsEditing ? 'Edit TESDA Course' : 'Add New TESDA Course' }}</h3>
                  <button class="modal-close-btn" @click="closeTesdaModal">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div class="modal-body">
                  <form @submit.prevent="saveTesdaCourse">
                    <div class="form-grid">
                      <div class="form-group">
                        <label class="form-label">Course Code *</label>
                        <input type="text" v-model="tesdaFormData.course_code" required class="form-input" placeholder="e.g. TESDA101" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Duration *</label>
                        <input type="text" v-model="tesdaFormData.duration" required class="form-input" placeholder="e.g. 160 hours" />
                      </div>
                      <div class="form-group md-col-span-2">
                        <label class="form-label">Course Name *</label>
                        <input type="text" v-model="tesdaFormData.course_name" required class="form-input" placeholder="Enter course name" />
                      </div>
                      <div class="form-group md-col-span-2">
                        <label class="form-label">Description (Optional)</label>
                        <textarea v-model="tesdaFormData.description" rows="3" class="form-input" placeholder="Enter course description"></textarea>
                      </div>
                      <div class="form-group md-col-span-2">
                        <label class="form-label">Course Requirements</label>
                        <textarea v-model="tesdaFormData.requirementsText" rows="4" class="form-input" placeholder="One requirement per line"></textarea>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Status</label>
                        <select v-model="tesdaFormData.status" class="form-input">
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                        </select>
                      </div>
                    </div>
                    <div class="modal-foot">
                      <button type="button" @click="closeTesdaModal" class="btn-cancel">Cancel</button>
                      <button type="submit" class="btn-save btn-blue">{{ tesdaIsEditing ? 'Update' : 'Save Course' }}</button>
                    </div>
                  </form>
                </div>
              </div>
            </transition>
          </div>
        </transition>

        <!-- TESDA Delete Confirmation Modal - Logout Style -->
        <transition name="modal-fade">
          <div v-if="showTesdaDeleteModal" class="modal-overlay" @click.self="cancelTesdaDelete">
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
                      <h3 class="text-lg font-bold text-gray-900">Delete TESDA Course</h3>
                      <p class="text-sm text-gray-500">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                <div class="modal-body-delete">
                  <p class="text-sm text-gray-700 leading-relaxed">
                    Are you sure you want to delete
                    <span class="font-semibold text-gray-900">{{ tesdaCourseToDelete?.course_name }}</span>?
                    All data associated with this course will be permanently removed.
                  </p>

                  <div class="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      @click="cancelTesdaDelete"
                      class="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 text-sm font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      @click="deleteTesdaCourse"
                      class="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Course
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </transition>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, reactive } from "vue";
import axios from "axios";
import AdminLayout from "./AdminLayout.vue";
import { API_URL } from "../../config/api";

const api = axios.create({ baseURL: API_URL, withCredentials: true });

export default {
  name: "AdminCourses",
  components: { AdminLayout },
  setup() {
    const activeTab = ref("driving");
    const courses = ref([]);
    const loading = ref(true);
    const searchQuery = ref("");
    const selectedDuration = ref("");
    const sortBy = ref("name");
    const showModal = ref(false);
    const showDeleteModal = ref(false);
    const isEditing = ref(false);
    const courseToDelete = ref(null);
    const instructors = ref([]);
    const assignmentsMap = ref({});
    const pendingAssign = reactive({});
    const formData = reactive({ id: null, course_code: "", course_name: "", description: "", duration: "", requirementsText: "", course_fee: 0, status: "active" });

    const toast = reactive({ show: false, message: "", type: "success" });
    let toastTimer = null;
    const showToast = (message, type = "success") => {
      toast.message = message; toast.type = type; toast.show = true;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.show = false; }, 4000);
    };

    const tesdaCourses = ref([]);
    const tesdaLoading = ref(true);
    const tesdaSortBy = ref("name");
    const tesdaTrainers = ref([]);
    const tesdaAssignmentsMap = ref({});
    const tesdaPendingAssign = reactive({});
    const showTesdaModal = ref(false);
    const showTesdaDeleteModal = ref(false);
    const tesdaIsEditing = ref(false);
    const tesdaCourseToDelete = ref(null);
    const tesdaFormData = reactive({ id: null, course_code: "", course_name: "", description: "", duration: "", requirementsText: "", status: "active" });

    const parseRequirements = (reqValue) => { if (Array.isArray(reqValue)) return reqValue; if (typeof reqValue === "string") { const s = reqValue.trim(); if (!s) return []; try { const parsed = JSON.parse(s); return Array.isArray(parsed) ? parsed : [String(parsed)]; } catch { return [s]; } } return []; };
    const requirementsToText = (requirements) => { const arr = parseRequirements(requirements); return arr.join("\n"); };
    const textToRequirementsArray = (text) => { return String(text || "").split("\n").map((x) => x.trim()).filter(Boolean); };
    const formatRequirementsInline = (requirements) => { const arr = parseRequirements(requirements); if (!arr.length) return "—"; return arr.slice(0, 2).join(", ") + (arr.length > 2 ? ` (+${arr.length - 2} more)` : ""); };

    const filteredCourses = computed(() => {
      let result = [...courses.value];
      if (searchQuery.value.trim()) { const q = searchQuery.value.toLowerCase(); result = result.filter((c) => { const reqText = parseRequirements(c.requirements).join(" ").toLowerCase(); return (c.course_name || "").toLowerCase().includes(q) || (c.course_code || "").toLowerCase().includes(q) || (c.duration || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q) || reqText.includes(q); }); }
      if (selectedDuration.value) { result = result.filter((c) => (c.duration || "") === selectedDuration.value); }
      result.sort((a, b) => { if (sortBy.value === "name") return (a.course_name || "").localeCompare(b.course_name || ""); if (sortBy.value === "nameDesc") return (b.course_name || "").localeCompare(a.course_name || ""); if (sortBy.value === "feeAsc") return Number(a.course_fee || 0) - Number(b.course_fee || 0); if (sortBy.value === "feeDesc") return Number(b.course_fee || 0) - Number(a.course_fee || 0); if (sortBy.value === "duration") return (a.duration || "").localeCompare(b.duration || ""); if (sortBy.value === "status") return (a.status || "").localeCompare(b.status || ""); return 0; });
      return result;
    });

    const fetchCourses = async () => { loading.value = true; try { const res = await api.get("/admin/courses?track=driving"); const maybe = res.data?.data; courses.value = Array.isArray(maybe) ? maybe : (maybe?.data ?? []); } catch (err) { courses.value = []; showToast("Failed to load courses", "error"); } finally { loading.value = false; } };
    const fetchDrivingInstructors = async () => { const res = await api.get("/admin/instructors?active=true"); instructors.value = res.data?.data ?? []; };
    const fetchDrivingAssignments = async () => { const res = await api.get("/admin/driving-course-instructors"); const rows = res.data?.data ?? []; const map = {}; for (const r of rows) { map[r.course_id] = { instructor_id: r.instructor_id, instructor_name: r.instructor_name || "—", instructor_code: r.instructor_code || "", status: r.status || "" }; } assignmentsMap.value = map; };
    const refreshAssignments = async () => { try { await fetchDrivingInstructors(); await fetchDrivingAssignments(); Object.keys(pendingAssign).forEach((k) => delete pendingAssign[k]); } catch (err) { showToast("Failed to load assignment data", "error"); } };
    const assignmentLabel = (courseId) => {
      const a = assignmentsMap.value[courseId];

      if (!a || !a.instructor_id || a.status !== "active") {
        return "Assign Instructor";
      }

      return `${a.instructor_name}${
        a.instructor_code ? ` (${a.instructor_code})` : ""
      }`;
    };
    const saveAssignment = async (courseId) => { const instructorId = Number(pendingAssign[courseId]); if (!instructorId) return; try { await api.post("/admin/driving-course-instructors", { course_id: courseId, instructor_id: instructorId }); await fetchDrivingAssignments(); showToast("Instructor assigned successfully!"); } catch (err) { showToast("Failed to assign", "error"); } };

    const createCourse = async () => { await api.post("/admin/courses", { course_code: formData.course_code, course_name: formData.course_name, description: formData.description, duration: formData.duration, requirements: JSON.stringify(textToRequirementsArray(formData.requirementsText)), course_fee: formData.course_fee, status: formData.status }); };
    const updateCourse = async () => { await api.put(`/admin/courses/${formData.id}`, { course_code: formData.course_code, course_name: formData.course_name, description: formData.description, duration: formData.duration, requirements: JSON.stringify(textToRequirementsArray(formData.requirementsText)), course_fee: formData.course_fee, status: formData.status }); };
    const removeCourse = async (id) => { await api.delete(`/admin/courses/${id}`); };
    const openAddModal = () => { isEditing.value = false; resetForm(); showModal.value = true; };
    const editCourse = (course) => { isEditing.value = true; Object.assign(formData, { id: course.id, course_code: course.course_code ?? "", course_name: course.course_name ?? "", description: course.description ?? "", duration: course.duration ?? "", requirementsText: requirementsToText(course.requirements), course_fee: Number(course.course_fee ?? 0), status: course.status ?? "active" }); showModal.value = true; };
    const viewCourse = (course) => { const reqs = parseRequirements(course.requirements); showToast(`Course: ${course.course_name} | Code: ${course.course_code} | Duration: ${course.duration || "—"} | Fee: ₱${Number(course.course_fee || 0).toLocaleString()} | Requirements: ${reqs.length ? reqs.join(", ") : "—"}`); };
    const closeModal = () => { showModal.value = false; resetForm(); };
    const resetForm = () => { formData.id = null; formData.course_code = ""; formData.course_name = ""; formData.description = ""; formData.duration = ""; formData.requirementsText = ""; formData.course_fee = 0; formData.status = "active"; };
    const saveCourse = async () => { try { if (isEditing.value) await updateCourse(); else await createCourse(); await fetchCourses(); closeModal(); showToast(isEditing.value ? "Course updated successfully!" : "Course created successfully!"); } catch (err) { showToast("Failed to save course", "error"); } };
    const confirmDelete = (course) => { courseToDelete.value = course; showDeleteModal.value = true; };
    const cancelDelete = () => { courseToDelete.value = null; showDeleteModal.value = false; };
    const deleteCourse = async () => { try { await removeCourse(courseToDelete.value.id); await fetchCourses(); cancelDelete(); showToast("Course deleted successfully!"); } catch (err) { showToast("Failed to delete course", "error"); } };

    const fetchTesdaTrainers = async () => {
      const res = await api.get(
        "/admin/tesda/trainers?active=true",
      );

      tesdaTrainers.value =
        res.data?.data ?? [];
    };


    const fetchTesdaCourses = async () => {
      tesdaLoading.value = true;

      try {
        const res = await api.get(
          "/admin/tesda/courses",
        );

        const rows =
          res.data?.data ?? [];

        tesdaCourses.value =
          rows.map((r) => ({
            id: r.id,

            course_code:
              r.course_code,

            course_name:
              r.course_name,

            description:
              r.description,

            duration:
              r.duration,

            requirements:
              r.requirements,

            status:
              r.status,
          }));

        // Important:
        // bawat course dapat ARRAY ang
        // selected trainers.
        for (
          const c of tesdaCourses.value
        ) {
          if (
            !Array.isArray(
              tesdaPendingAssign[c.id],
            )
          ) {
            tesdaPendingAssign[c.id] =
              [];
          }
        }
      } catch (err) {
        console.error(
          "fetchTesdaCourses error:",
          err,
        );

        tesdaCourses.value = [];

        showToast(
          "Failed to load TESDA courses",
          "error",
        );
      } finally {
        tesdaLoading.value = false;
      }
    };


    const fetchTesdaAssignments =
      async () => {
        const res = await api.get(
          "/admin/tesda/course-trainers",
        );

        const rows =
          res.data?.data ?? [];

        const map = {};

        // IMPORTANT:
        // dati:
        //
        // map[r.course_id] = {...}
        //
        // kaya nao-overwrite bawat trainer.
        //
        // ngayon array na bawat course.
        for (const r of rows) {
          const courseId =
            Number(r.course_id);

          if (!map[courseId]) {
            map[courseId] = [];
          }

          map[courseId].push({
            trainer_id:
              Number(r.trainer_id),

            trainer_name:
              r.trainer_name ||
              tesdaTrainers.value.find(
                (t) => Number(t.trainer_id) === Number(r.trainer_id)
              )?.fullname ||
              "Assign Trainer",

            trainer_code:
              r.trainer_code ||
              tesdaTrainers.value.find(
                (t) => Number(t.trainer_id) === Number(r.trainer_id)
              )?.trainer_code ||
              "",

            status:
              r.status ||
              "",
          });
        }

        tesdaAssignmentsMap.value =
          map;

        // Automatically check currently
        // assigned trainers.
        for (
          const c of tesdaCourses.value
        ) {
          const assigned =
            map[c.id] || [];

          tesdaPendingAssign[c.id] =
            assigned
              .filter(
                (a) =>
                  !a.status ||
                  String(
                    a.status,
                  ).toLowerCase() ===
                    "active",
              )
              .map((a) =>
                Number(
                  a.trainer_id,
                ),
              );
        }
      };


    const tesdaAssignmentLabel = (
      courseId,
    ) => {
      const assigned =
        tesdaAssignmentsMap.value[
          courseId
        ] || [];

      if (!assigned.length) {
        return "—";
      }

      return assigned
        .map((a) => {
          const name =
            a.trainer_name ||
            "Trainer";

          return a.trainer_code
            ? `${name} (${a.trainer_code})`
            : name;
        })
        .join(", ");
    };


    const refreshTesdaAssignments =
      async () => {
        try {
          await fetchTesdaTrainers();

          await fetchTesdaAssignments();
        } catch (err) {
          console.error(
            "refreshTesdaAssignments error:",
            err,
          );

          showToast(
            "Failed to load TESDA assignment data",
            "error",
          );
        }
      };


    const saveTesdaAssignment =
      async (courseId) => {
        const selected =
          Array.isArray(
            tesdaPendingAssign[
              courseId
            ],
          )
            ? [
                ...new Set(
                  tesdaPendingAssign[
                    courseId
                  ]
                    .map(Number)
                    .filter(
                      (id) =>
                        Number.isFinite(
                          id,
                        ) &&
                        id > 0,
                    ),
                ),
              ]
            : [];

        if (!selected.length) {
          showToast(
            "Select at least one trainer.",
            "error",
          );

          return;
        }

        try {
          const current =
            (
              tesdaAssignmentsMap
                .value[courseId] ||
              []
            )
              .map((a) =>
                Number(
                  a.trainer_id,
                ),
              )
              .filter(
                (id) =>
                  Number.isFinite(id) &&
                  id > 0,
              );

          // Trainers newly checked.
          const toAdd =
            selected.filter(
              (trainerId) =>
                !current.includes(
                  trainerId,
                ),
            );

          // Trainers unchecked by admin.
          const toRemove =
            current.filter(
              (trainerId) =>
                !selected.includes(
                  trainerId,
                ),
            );

          // ADD new assignments
          for (
            const trainerId of toAdd
          ) {
            await api.post(
              "/admin/tesda/course-trainers",
              {
                course_id:
                  Number(courseId),

                trainer_id:
                  trainerId,
              },
            );
          }

          // REMOVE unchecked assignments
          for (
            const trainerId of
            toRemove
          ) {
          await api.delete(
            `/admin/tesda/course-trainers/${Number(courseId)}/${trainerId}`,
          );
          }

          await fetchTesdaAssignments();

          showToast(
            "TESDA trainers updated successfully!",
          );
        } catch (err) {
          console.error(
            "saveTesdaAssignment error:",
            err,
          );

          showToast(
            err.response?.data
              ?.message ||
              "Failed to update trainers",
            "error",
          );
        }
      };
    const createTesdaCourse = async () => { await api.post("/admin/tesda/courses", { course_code: tesdaFormData.course_code, course_name: tesdaFormData.course_name, description: tesdaFormData.description, duration: tesdaFormData.duration, requirements: JSON.stringify(textToRequirementsArray(tesdaFormData.requirementsText)), status: tesdaFormData.status }); };
    const updateTesdaCourse = async () => { await api.put(`/admin/tesda/courses/${tesdaFormData.id}`, { course_code: tesdaFormData.course_code, course_name: tesdaFormData.course_name, description: tesdaFormData.description, duration: tesdaFormData.duration, requirements: JSON.stringify(textToRequirementsArray(tesdaFormData.requirementsText)), status: tesdaFormData.status }); };
    const removeTesdaCourse = async (id) => { await api.delete(`/admin/tesda/courses/${id}`); };
    const openTesdaAddModal = () => { tesdaIsEditing.value = false; resetTesdaForm(); showTesdaModal.value = true; };
    const editTesdaCourse = (course) => { tesdaIsEditing.value = true; Object.assign(tesdaFormData, { id: course.id, course_code: course.course_code ?? "", course_name: course.course_name ?? "", description: course.description ?? "", duration: course.duration ?? "", requirementsText: requirementsToText(course.requirements), status: course.status ?? "active" }); showTesdaModal.value = true; };
    const viewTesdaCourse = (course) => { const reqs = parseRequirements(course.requirements); showToast(`TESDA Course: ${course.course_name} | Code: ${course.course_code} | Duration: ${course.duration || "—"} | Requirements: ${reqs.length ? reqs.join(", ") : "—"}`); };
    const closeTesdaModal = () => { showTesdaModal.value = false; resetTesdaForm(); };
    const resetTesdaForm = () => { tesdaFormData.id = null; tesdaFormData.course_code = ""; tesdaFormData.course_name = ""; tesdaFormData.description = ""; tesdaFormData.duration = ""; tesdaFormData.requirementsText = ""; tesdaFormData.status = "active"; };
    const saveTesdaCourse = async () => { try { if (tesdaIsEditing.value) await updateTesdaCourse(); else await createTesdaCourse(); await fetchTesdaCourses(); closeTesdaModal(); showToast(tesdaIsEditing.value ? "TESDA course updated successfully!" : "TESDA course created successfully!"); } catch (err) { showToast("Failed to save TESDA course", "error"); } };
    const confirmTesdaDelete = (course) => { tesdaCourseToDelete.value = course; showTesdaDeleteModal.value = true; };
    const cancelTesdaDelete = () => { tesdaCourseToDelete.value = null; showTesdaDeleteModal.value = false; };
    const deleteTesdaCourse = async () => { try { await removeTesdaCourse(tesdaCourseToDelete.value.id); await fetchTesdaCourses(); cancelTesdaDelete(); showToast("TESDA course deleted successfully!"); } catch (err) { showToast("Failed to delete TESDA course", "error"); } };

    const filteredTesdaCourses = computed(() => {
      let result = [...tesdaCourses.value];
      if (searchQuery.value.trim()) { const q = searchQuery.value.toLowerCase(); result = result.filter((c) => { const reqText = parseRequirements(c.requirements).join(" ").toLowerCase(); return (c.course_name || "").toLowerCase().includes(q) || (c.course_code || "").toLowerCase().includes(q) || (c.duration || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q) || reqText.includes(q); }); }
      result.sort((a, b) => { if (tesdaSortBy.value === "name") return (a.course_name || "").localeCompare(b.course_name || ""); if (tesdaSortBy.value === "nameDesc") return (b.course_name || "").localeCompare(a.course_name || ""); if (tesdaSortBy.value === "duration") return (a.duration || "").localeCompare(b.duration || ""); if (tesdaSortBy.value === "status") return (a.status || "").localeCompare(b.status || ""); return 0; });
      return result;
    });

    onMounted(async () => { await fetchCourses(); await refreshAssignments(); await fetchTesdaCourses(); await refreshTesdaAssignments(); });

    return {
      activeTab, toast, courses, loading, searchQuery, selectedDuration, sortBy, instructors, assignmentsMap, pendingAssign, assignmentLabel, saveAssignment, refreshAssignments,
      showModal, showDeleteModal, isEditing, courseToDelete, formData, filteredCourses, formatRequirementsInline,
      openAddModal, editCourse, viewCourse, closeModal, saveCourse, confirmDelete, cancelDelete, deleteCourse,
      tesdaCourses, tesdaLoading, tesdaSortBy, filteredTesdaCourses, tesdaTrainers, tesdaAssignmentsMap, tesdaPendingAssign, tesdaAssignmentLabel, refreshTesdaAssignments, saveTesdaAssignment,
      showTesdaModal, showTesdaDeleteModal, tesdaIsEditing, tesdaCourseToDelete, tesdaFormData,
      openTesdaAddModal, editTesdaCourse, viewTesdaCourse, closeTesdaModal, saveTesdaCourse, confirmTesdaDelete, cancelTesdaDelete, deleteTesdaCourse,
    };
  },
};
</script>

<style scoped>
/* ========== WRAPPER ========== */
.courses-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 16px; }

/* ========== PAGE HEADER ========== */
.page-header-section { margin-bottom: 4px; }
.page-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.add-btn:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
.add-btn-blue { background: #3b82f6; }
.add-btn-blue:hover { background: #2563eb; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }

/* ========== TOAST ========== */
.toast-notification { position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); min-width: 320px; max-width: 480px; }
.toast-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.toast-error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateX(20px); }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* ========== TABS ========== */
.tab-group { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.2s; background: #fff; color: #6b7280; }
.tab-inactive:hover { border-color: #d1d5db; color: #374151; }
.tab-active-green { background: #10b981; color: #fff; border-color: #10b981; }
.tab-active-blue { background: #3b82f6; color: #fff; border-color: #3b82f6; }

/* ========== PANEL / TABLE ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; border-bottom: 2px solid #e5e7eb; color: #6b7280; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; }
.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-edit:hover { background: #2563eb; }
.action-edit:disabled { opacity: 0.5; cursor: not-allowed; }
.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-delete:hover { background: #dc2626; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #6b7280; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #4b5563; }

/* ========== SELECTS ========== */
.select-modern { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.8rem; color: #374151; background: #fff; outline: none; cursor: pointer; }
.select-modern:focus { border-color: #10b981; }
.select-modern-sm { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.78rem; color: #374151; background: #fff; outline: none; cursor: pointer; }
.btn-outline-sm { padding: 8px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-outline-sm:hover { background: #f3f4f6; }

/* ========== ADD/EDIT MODAL ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
.modal-head-green { background: #f0fdf4; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; border-radius: 0 0 16px 16px; margin: 16px -20px -20px -20px; }
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-green { background: #10b981; }
.btn-green:hover { background: #059669; }
.btn-blue { background: #3b82f6; }
.btn-blue:hover { background: #2563eb; }

/* ========== DELETE MODAL (Logout Style) ========== */
.modal-card-sm { max-width: 420px; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }

/* ========== FORM ========== */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.md-col-span-2 { grid-column: span 2; }
.form-label { font-size: 0.75rem; font-weight: 600; color: #374151; }
.form-input { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; }
.form-input:focus { border-color: #10b981; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.max-w-xs { max-width: 280px; }
.w-full { width: 100%; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .md-col-span-2 { grid-column: span 1; }
  .toast-notification { left: 16px; right: 16px; min-width: auto; }
  .page-header-row { flex-direction: column; }
}
</style>