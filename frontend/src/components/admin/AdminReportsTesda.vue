<!-- frontend/src/components/AdminReportsTesda.vue -->
<!-- TESDA REPORTS PANEL - COMPLETELY SEPARATE FROM LTO -->
<template>
  <AdminLayout>
    <!-- Header with LTO tab button -->
    <template #header-left>
      <div class="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search TESDA tables..."
          v-model="searchQuery"
          class="w-80 p-2 rounded-md text-gray-800 focus:outline-none"
        />
        
        <!-- LTO TAB BUTTON -->
        <button
          @click="$emit('switch-to-lto')"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium"
        >
          <span>🚗 LTO Reports</span>
          <span class="text-xs bg-white text-green-600 px-2 py-0.5 rounded-full">Click to switch</span>
        </button>
      </div>
    </template>

    <div class="space-y-6">
      <!-- TESDA PAGE HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-blue-800">📊 TESDA Reports Panel</h2>
          <p class="text-xs text-gray-500">
            Overview, Detailed Reports, at Attendance Report para sa TESDA scholars/trainees
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="openExportModal('all')"
            class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
          >
            📤 Export All
          </button>

          <button
            @click="openExportModal(activeTab)"
            class="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
          >
            📤 Export This Tab
          </button>
        </div>
      </div>

      <!-- TESDA TABS: Overview | Detailed Reports | Attendance -->
      <div class="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          class="px-4 py-2 rounded-t-md text-sm font-medium transition-colors"
          :class="activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="activeTab = 'overview'"
        >
          📈 Overview
        </button>

        <button
          class="px-4 py-2 rounded-t-md text-sm font-medium transition-colors"
          :class="activeTab === 'detailed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="activeTab = 'detailed'"
        >
          📋 Detailed Reports
        </button>

        <button
          class="px-4 py-2 rounded-t-md text-sm font-medium transition-colors"
          :class="activeTab === 'attendance' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="activeTab = 'attendance'"
        >
          📅 Attendance Report
        </button>
      </div>

      <!-- ===================== TESDA OVERVIEW TAB ===================== -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- Filters -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div class="flex flex-wrap gap-4">
              <DateRangePicker
                v-model:range="overviewFilters.dateRange"
                v-model:from="overviewFilters.customFrom"
                v-model:to="overviewFilters.customTo"
              />

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Program/Training</label>
                <select v-model="overviewFilters.programId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Programs</option>
                  <option v-for="p in tesdaPrograms" :key="p.id" :value="String(p.id)">
                    {{ p.program_name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="overviewFilters.status" class="w-44 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="graduated">Graduated</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>
            </div>

            <button
              @click="loadOverviewData"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>

          <div v-if="overviewError" class="mt-3 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {{ overviewError }}
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p class="text-sm text-blue-700 font-medium">Total TESDA Scholars</p>
            <h3 class="text-2xl font-bold text-blue-800 mt-1">{{ summary.totalScholars }}</h3>
          </div>

          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <p class="text-sm text-green-700 font-medium">Currently Enrolled</p>
            <h3 class="text-2xl font-bold text-green-800 mt-1">{{ summary.currentEnrolled }}</h3>
          </div>

          <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p class="text-sm text-purple-700 font-medium">Graduates</p>
            <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ summary.graduates }}</h3>
          </div>

          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <p class="text-sm text-yellow-700 font-medium">Dropped Out</p>
            <h3 class="text-2xl font-bold text-yellow-800 mt-1">{{ summary.dropped }}</h3>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Enrollment Trend -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-blue-800 font-semibold mb-3">Enrollment Trend (TESDA)</h3>
            <div class="h-64">
              <VChart ref="trendChartRef" :option="trendOption" autoresize />
            </div>
          </div>

          <!-- Programs Distribution -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-blue-800 font-semibold mb-3">Top Programs</h3>
            <div class="h-64">
              <VChart ref="programsChartRef" :option="programsOption" autoresize />
            </div>
          </div>

          <!-- Gender Distribution -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-blue-800 font-semibold mb-3">Scholars by Gender</h3>
            <div class="h-64">
              <VChart ref="genderChartRef" :option="genderOption" autoresize />
            </div>
          </div>

          <!-- Age Distribution -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-blue-800 font-semibold mb-3">Age Distribution</h3>
            <div class="h-64">
              <VChart ref="ageChartRef" :option="ageOption" autoresize />
            </div>
          </div>
        </div>

        <!-- Recent Scholars Table -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-blue-800 font-semibold">Recent TESDA Scholars</h3>
            <button @click="activeTab = 'detailed'" class="text-sm text-blue-600 hover:underline">
              View All →
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="py-2 px-3 text-left">Name</th>
                  <th class="py-2 px-3 text-left">Program</th>
                  <th class="py-2 px-3 text-left">Status</th>
                  <th class="py-2 px-3 text-left">Enrolled Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in recentScholars" :key="s.id" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-2 px-3">{{ s.fullname }}</td>
                  <td class="py-2 px-3">{{ s.program_name }}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-1 rounded-full text-xs" 
                      :class="{
                        'bg-green-100 text-green-800': s.status === 'enrolled',
                        'bg-blue-100 text-blue-800': s.status === 'graduated',
                        'bg-red-100 text-red-800': s.status === 'dropped'
                      }"
                    >
                      {{ s.status }}
                    </span>
                  </td>
                  <td class="py-2 px-3">{{ formatDate(s.enrolled_date) }}</td>
                </tr>
                <tr v-if="recentScholars.length === 0">
                  <td colspan="4" class="py-6 text-center text-gray-500">No recent scholars</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ===================== TESDA DETAILED REPORTS TAB ===================== -->
      <div v-else-if="activeTab === 'detailed'" class="space-y-6">
        <!-- Detailed Filters -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div class="flex flex-wrap gap-4">
              <DateRangePicker
                v-model:range="detailedFilters.dateRange"
                v-model:from="detailedFilters.customFrom"
                v-model:to="detailedFilters.customTo"
              />

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select v-model="detailedFilters.programId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Programs</option>
                  <option v-for="p in tesdaPrograms" :key="p.id" :value="String(p.id)">
                    {{ p.program_name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="detailedFilters.status" class="w-40 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="graduated">Graduated</option>
                  <option value="dropped">Dropped</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select v-model="detailedFilters.sort" class="w-44 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="enrolled_desc">Enrolled Date (Newest)</option>
                  <option value="enrolled_asc">Enrolled Date (Oldest)</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>
              </div>
            </div>

            <div class="flex gap-2">
              <button @click="loadDetailedData" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Apply
              </button>
              <button @click="showColumnSelector = !showColumnSelector" class="px-4 py-2 border rounded-md hover:bg-gray-50">
                {{ showColumnSelector ? 'Hide' : 'Show' }} Columns
              </button>
            </div>
          </div>

          <!-- Column Selector -->
          <div v-if="showColumnSelector" class="mt-4 p-3 bg-gray-50 rounded-lg">
            <div class="flex flex-wrap gap-4">
              <label v-for="col in columnOptions" :key="col.key" class="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" v-model="visibleColumns[col.key]" />
                <span>{{ col.label }}</span>
              </label>
            </div>
          </div>

          <div v-if="detailedError" class="mt-3 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {{ detailedError }}
          </div>
        </div>

        <!-- Detailed Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-4 border-b flex justify-between items-center">
            <div>
              <h3 class="text-lg font-bold text-blue-800">📋 TESDA Scholars List</h3>
              <p class="text-xs text-gray-500">Total: {{ detailedFiltered.length }} scholars</p>
            </div>
            
            <div class="flex items-center gap-3">
              <select v-model.number="detailedPageSize" class="w-24 p-2 border rounded-md text-sm">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
              <span class="text-sm text-gray-600">
                {{ detailedPageStart }}-{{ detailedPageEnd }} of {{ detailedFiltered.length }}
              </span>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="py-2 px-3 text-left">#</th>
                  <th v-if="visibleColumns.scholar_id" class="py-2 px-3 text-left">Scholar ID</th>
                  <th v-if="visibleColumns.fullname" class="py-2 px-3 text-left">Full Name</th>
                  <th v-if="visibleColumns.birthdate" class="py-2 px-3 text-left">Birthdate</th>
                  <th v-if="visibleColumns.gender" class="py-2 px-3 text-left">Gender</th>
                  <th v-if="visibleColumns.program" class="py-2 px-3 text-left">Program</th>
                  <th v-if="visibleColumns.instructor" class="py-2 px-3 text-left">Instructor</th>
                  <th v-if="visibleColumns.enrolled_date" class="py-2 px-3 text-left">Enrolled Date</th>
                  <th v-if="visibleColumns.graduation_date" class="py-2 px-3 text-left">Graduation Date</th>
                  <th v-if="visibleColumns.status" class="py-2 px-3 text-left">Status</th>
                  <th v-if="visibleColumns.contact" class="py-2 px-3 text-left">Contact</th>
                  <th v-if="visibleColumns.address" class="py-2 px-3 text-left">Address</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, idx) in detailedPaginated" :key="s.id" class="border-b hover:bg-gray-50">
                  <td class="py-2 px-3">{{ detailedPageStart + idx }}</td>
                  <td v-if="visibleColumns.scholar_id" class="py-2 px-3">{{ s.scholar_id || '-' }}</td>
                  <td v-if="visibleColumns.fullname" class="py-2 px-3">{{ s.fullname }}</td>
                  <td v-if="visibleColumns.birthdate" class="py-2 px-3">{{ formatDateShort(s.birthdate) }}</td>
                  <td v-if="visibleColumns.gender" class="py-2 px-3">{{ s.gender === 'Male' ? 'M' : 'F' }}</td>
                  <td v-if="visibleColumns.program" class="py-2 px-3">{{ s.program_name }}</td>
                  <td v-if="visibleColumns.instructor" class="py-2 px-3">{{ s.instructor_name || '-' }}</td>
                  <td v-if="visibleColumns.enrolled_date" class="py-2 px-3">{{ formatDate(s.enrolled_date) }}</td>
                  <td v-if="visibleColumns.graduation_date" class="py-2 px-3">{{ formatDate(s.graduation_date) || '-' }}</td>
                  <td v-if="visibleColumns.status" class="py-2 px-3">
                    <span class="px-2 py-1 rounded-full text-xs"
                      :class="{
                        'bg-green-100 text-green-800': s.status === 'enrolled',
                        'bg-blue-100 text-blue-800': s.status === 'graduated',
                        'bg-red-100 text-red-800': s.status === 'dropped'
                      }"
                    >
                      {{ s.status }}
                    </span>
                  </td>
                  <td v-if="visibleColumns.contact" class="py-2 px-3">{{ s.contact_number || '-' }}</td>
                  <td v-if="visibleColumns.address" class="py-2 px-3">{{ s.address || '-' }}</td>
                </tr>
                <tr v-if="detailedLoading">
                  <td :colspan="detailedColspan" class="py-8 text-center text-gray-500">Loading...</td>
                </tr>
                <tr v-if="!detailedLoading && detailedFiltered.length === 0">
                  <td :colspan="detailedColspan" class="py-8 text-center text-gray-500">No scholars found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="detailedTotalPages > 1" class="p-4 flex justify-between items-center border-t">
            <button
              class="px-3 py-2 border rounded text-sm disabled:opacity-50"
              :disabled="detailedPage === 1"
              @click="detailedPage--"
            >
              ← Prev
            </button>
            <div class="flex gap-1">
              <button
                v-for="p in detailedPageButtons"
                :key="p"
                class="px-3 py-2 border rounded text-sm"
                :class="p === detailedPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'"
                @click="detailedPage = p"
              >
                {{ p }}
              </button>
            </div>
            <button
              class="px-3 py-2 border rounded text-sm disabled:opacity-50"
              :disabled="detailedPage === detailedTotalPages"
              @click="detailedPage++"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- ===================== TESDA ATTENDANCE REPORT TAB ===================== -->
      <div v-else-if="activeTab === 'attendance'" class="space-y-6">
        <!-- Attendance Filters -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div class="flex flex-wrap gap-4">
              <DateRangePicker
                v-model:range="attendanceFilters.dateRange"
                v-model:from="attendanceFilters.customFrom"
                v-model:to="attendanceFilters.customTo"
              />

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select v-model="attendanceFilters.programId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Programs</option>
                  <option v-for="p in tesdaPrograms" :key="p.id" :value="String(p.id)">
                    {{ p.program_name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                <select v-model="attendanceFilters.instructorId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All Instructors</option>
                  <option v-for="i in instructors" :key="i.id" :value="String(i.id)">
                    {{ i.fullname }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">View Type</label>
                <select v-model="attendanceFilters.viewType" class="w-40 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <button @click="loadAttendanceData" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Generate Report
            </button>
          </div>

          <div v-if="attendanceError" class="mt-3 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {{ attendanceError }}
          </div>
        </div>

        <!-- Attendance Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <p class="text-sm text-green-700 font-medium">Total Sessions</p>
            <h3 class="text-2xl font-bold text-green-800 mt-1">{{ attendanceStats.totalSessions }}</h3>
          </div>
          <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p class="text-sm text-blue-700 font-medium">Total Attendance</p>
            <h3 class="text-2xl font-bold text-blue-800 mt-1">{{ attendanceStats.totalAttendance }}</h3>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p class="text-sm text-purple-700 font-medium">Attendance Rate</p>
            <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ attendanceStats.attendanceRate }}%</h3>
          </div>
          <div class="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <p class="text-sm text-orange-700 font-medium">Avg Daily Attendance</p>
            <h3 class="text-2xl font-bold text-orange-800 mt-1">{{ attendanceStats.avgDaily }}</h3>
          </div>
        </div>

        <!-- Attendance Chart -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-blue-800 font-semibold mb-3">Attendance Trend</h3>
          <div class="h-80">
            <VChart ref="attendanceChartRef" :option="attendanceOption" autoresize />
          </div>
        </div>

        <!-- Attendance Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="p-4 border-b">
            <h3 class="text-lg font-bold text-blue-800">📅 Daily Attendance Records</h3>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="py-2 px-3 text-left">Date</th>
                  <th class="py-2 px-3 text-left">Program</th>
                  <th class="py-2 px-3 text-left">Instructor</th>
                  <th class="py-2 px-3 text-left">Present</th>
                  <th class="py-2 px-3 text-left">Absent</th>
                  <th class="py-2 px-3 text-left">Late</th>
                  <th class="py-2 px-3 text-left">Total Scholars</th>
                  <th class="py-2 px-3 text-left">Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(a, idx) in attendanceRecords" :key="idx" class="border-b hover:bg-gray-50">
                  <td class="py-2 px-3">{{ formatDate(a.date) }}</td>
                  <td class="py-2 px-3">{{ a.program_name }}</td>
                  <td class="py-2 px-3">{{ a.instructor_name }}</td>
                  <td class="py-2 px-3 font-medium text-green-600">{{ a.present }}</td>
                  <td class="py-2 px-3 text-red-600">{{ a.absent }}</td>
                  <td class="py-2 px-3 text-orange-600">{{ a.late }}</td>
                  <td class="py-2 px-3">{{ a.total }}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-1 rounded-full text-xs"
                      :class="{
                        'bg-green-100 text-green-800': a.rate >= 80,
                        'bg-yellow-100 text-yellow-800': a.rate >= 60 && a.rate < 80,
                        'bg-red-100 text-red-800': a.rate < 60
                      }"
                    >
                      {{ a.rate }}%
                    </span>
                  </td>
                </tr>
                <tr v-if="attendanceRecords.length === 0">
                  <td colspan="8" class="py-6 text-center text-gray-500">No attendance records found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Export Buttons for Attendance -->
        <div class="flex justify-end gap-2">
          <button @click="exportAttendance('excel')" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            📊 Export to Excel
          </button>
          <button @click="exportAttendance('pdf')" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            📄 Export to PDF
          </button>
        </div>
      </div>

      <!-- ===================== EXPORT MODAL ===================== -->
      <div v-if="exportModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-2xl bg-white rounded-xl shadow-xl">
          <div class="p-4 border-b flex justify-between items-center">
            <h3 class="text-lg font-bold text-blue-800">📤 Export TESDA Reports</h3>
            <button @click="exportModalOpen = false" class="px-3 py-1 border rounded hover:bg-gray-50">✖</button>
          </div>

          <div class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Export Format</label>
                <select v-model="exportFormat" class="w-full p-2 border rounded-md">
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Scope</label>
                <select v-model="exportScope" class="w-full p-2 border rounded-md">
                  <option value="all">All Data</option>
                  <option value="filtered">Filtered Data</option>
                  <option value="page">Current Page Only</option>
                </select>
              </div>
            </div>

            <div v-if="exportTarget === 'detailed'">
              <label class="block text-sm font-medium mb-2">Select Columns to Export</label>
              <div class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                <label v-for="col in columnOptions" :key="col.key" class="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" v-model="exportColumns[col.key]" />
                  <span>{{ col.label }}</span>
                </label>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button @click="exportModalOpen = false" class="px-4 py-2 border rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button @click="runExport" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Export Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import AdminLayout from "./AdminLayout.vue";
import DateRangePicker from "./DateRangePicker.vue";

// ECharts
import VChart from "vue-echarts";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from "echarts/components";

// Export libs
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
]);

export default {
  name: "AdminReportsTesda",
  components: { AdminLayout, DateRangePicker, VChart },
  emits: ['switch-to-lto'],

  setup(props, { emit }) {
    // State
    const activeTab = ref("overview");
    const searchQuery = ref("");
    const debouncedQuery = ref("");
    const showColumnSelector = ref(false);
    const exportModalOpen = ref(false);
    const exportTarget = ref("");
    const exportFormat = ref("xlsx");
    const exportScope = ref("filtered");
    const exportColumns = ref({});

    // Data
    const tesdaPrograms = ref([]);
    const instructors = ref([]);
    
    // Overview data
    const summary = reactive({
      totalScholars: 0,
      currentEnrolled: 0,
      graduates: 0,
      dropped: 0,
    });

    const recentScholars = ref([]);
    
    // Detailed data
    const detailedRows = ref([]);
    
    // Attendance data
    const attendanceRecords = ref([]);
    const attendanceStats = reactive({
      totalSessions: 0,
      totalAttendance: 0,
      attendanceRate: 0,
      avgDaily: 0,
    });

    // Charts data
    const trendData = reactive({ labels: [], values: [] });
    const programsData = reactive({ labels: [], values: [] });
    const genderData = reactive({ labels: ['Male', 'Female'], values: [0, 0] });
    const ageData = reactive({ labels: [], values: [] });
    const attendanceChartData = reactive({ labels: [], present: [], absent: [], late: [] });

    // Loading states
    const overviewLoading = ref(false);
    const detailedLoading = ref(false);
    const attendanceLoading = ref(false);

    // Errors
    const overviewError = ref("");
    const detailedError = ref("");
    const attendanceError = ref("");

    // Filters
    const overviewFilters = reactive({
      dateRange: "thisMonth",
      customFrom: "",
      customTo: "",
      programId: "",
      status: "",
    });

    const detailedFilters = reactive({
      dateRange: "thisMonth",
      customFrom: "",
      customTo: "",
      programId: "",
      status: "",
      sort: "enrolled_desc",
    });

    const attendanceFilters = reactive({
      dateRange: "thisMonth",
      customFrom: "",
      customTo: "",
      programId: "",
      instructorId: "",
      viewType: "daily",
    });

    // Column options for detailed table
    const columnOptions = [
      { key: "scholar_id", label: "Scholar ID" },
      { key: "fullname", label: "Full Name" },
      { key: "birthdate", label: "Birthdate" },
      { key: "gender", label: "Gender" },
      { key: "program", label: "Program" },
      { key: "instructor", label: "Instructor" },
      { key: "enrolled_date", label: "Enrolled Date" },
      { key: "graduation_date", label: "Graduation Date" },
      { key: "status", label: "Status" },
      { key: "contact", label: "Contact" },
      { key: "address", label: "Address" },
    ];

    // Visible columns
    const visibleColumns = reactive({
      scholar_id: true,
      fullname: true,
      birthdate: true,
      gender: true,
      program: true,
      instructor: true,
      enrolled_date: true,
      graduation_date: false,
      status: true,
      contact: false,
      address: false,
    });

    // Pagination
    const detailedPage = ref(1);
    const detailedPageSize = ref(25);

    // Computed properties
    const detailedColspan = computed(() => 2 + Object.values(visibleColumns).filter(Boolean).length);

    const detailedFiltered = computed(() => {
      let arr = [...detailedRows.value];
      const q = debouncedQuery.value.toLowerCase();

      if (q) {
        arr = arr.filter(r => 
          [r.fullname, r.scholar_id, r.program_name, r.instructor_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }

      // Apply sorting
      if (detailedFilters.sort === "enrolled_desc") {
        arr.sort((a, b) => new Date(b.enrolled_date) - new Date(a.enrolled_date));
      } else if (detailedFilters.sort === "enrolled_asc") {
        arr.sort((a, b) => new Date(a.enrolled_date) - new Date(b.enrolled_date));
      } else if (detailedFilters.sort === "name_asc") {
        arr.sort((a, b) => a.fullname.localeCompare(b.fullname));
      } else if (detailedFilters.sort === "name_desc") {
        arr.sort((a, b) => b.fullname.localeCompare(a.fullname));
      }

      return arr;
    });

    const detailedTotalPages = computed(() => 
      Math.max(1, Math.ceil(detailedFiltered.value.length / detailedPageSize.value))
    );

    const detailedPageStart = computed(() => 
      detailedFiltered.value.length ? (detailedPage.value - 1) * detailedPageSize.value + 1 : 0
    );

    const detailedPageEnd = computed(() => 
      Math.min(detailedFiltered.value.length, detailedPage.value * detailedPageSize.value)
    );

    const detailedPaginated = computed(() => {
      const start = (detailedPage.value - 1) * detailedPageSize.value;
      return detailedFiltered.value.slice(start, start + detailedPageSize.value);
    });

    const detailedPageButtons = computed(() => {
      const total = detailedTotalPages.value;
      const current = detailedPage.value;
      const max = 5;
      
      if (total <= max) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      
      let start = Math.max(1, current - 2);
      let end = Math.min(total, start + max - 1);
      start = Math.max(1, end - max + 1);
      
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    // Chart options
    const trendOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: { type: "category", data: trendData.labels },
      yAxis: { type: "value" },
      series: [{
        name: "Enrollments",
        type: "line",
        smooth: true,
        data: trendData.values,
        lineStyle: { color: "#2563eb" },
        areaStyle: { color: "rgba(37, 99, 235, 0.1)" }
      }]
    }));

    const programsOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 20, bottom: 60 },
      xAxis: {
        type: "category",
        data: programsData.labels,
        axisLabel: { rotate: 35 }
      },
      yAxis: { type: "value" },
      series: [{
        name: "Scholars",
        type: "bar",
        data: programsData.values,
        itemStyle: { color: "#2563eb" }
      }]
    }));

    const genderOption = computed(() => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [{
        name: "Gender",
        type: "pie",
        radius: ["40%", "70%"],
        data: genderData.labels.map((l, i) => ({
          name: l,
          value: genderData.values[i]
        })),
        color: ["#2563eb", "#dc2626"]
      }]
    }));

    const ageOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: { type: "category", data: ageData.labels },
      yAxis: { type: "value" },
      series: [{
        name: "Scholars",
        type: "bar",
        data: ageData.values,
        itemStyle: { color: "#8b5cf6" }
      }]
    }));

    const attendanceOption = computed(() => ({
      tooltip: { trigger: "axis" },
      legend: { bottom: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 40 },
      xAxis: { type: "category", data: attendanceChartData.labels },
      yAxis: { type: "value" },
      series: [
        {
          name: "Present",
          type: "line",
          data: attendanceChartData.present,
          color: "#16a34a"
        },
        {
          name: "Absent",
          type: "line",
          data: attendanceChartData.absent,
          color: "#dc2626"
        },
        {
          name: "Late",
          type: "line",
          data: attendanceChartData.late,
          color: "#ea580c"
        }
      ]
    }));

    // Chart refs
    const trendChartRef = ref(null);
    const programsChartRef = ref(null);
    const genderChartRef = ref(null);
    const ageChartRef = ref(null);
    const attendanceChartRef = ref(null);

    // Helper functions
    function formatDate(dateString) {
      if (!dateString) return "-";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function formatDateShort(dateString) {
      if (!dateString) return "-";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
    }

    function toISODateLocal(dt) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    function getRangeDates(range, customFrom, customTo) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = today.getMonth();

      if (range === "custom") return { from: customFrom, to: customTo };
      if (range === "thisMonth") return {
        from: toISODateLocal(new Date(yyyy, mm, 1)),
        to: toISODateLocal(today)
      };
      if (range === "lastMonth") return {
        from: toISODateLocal(new Date(yyyy, mm - 1, 1)),
        to: toISODateLocal(new Date(yyyy, mm, 0))
      };
      if (range === "thisQuarter") {
        const qStart = Math.floor(mm / 3) * 3;
        return {
          from: toISODateLocal(new Date(yyyy, qStart, 1)),
          to: toISODateLocal(today)
        };
      }
      return {
        from: toISODateLocal(new Date(yyyy, 0, 1)),
        to: toISODateLocal(today)
      };
    }

    // API calls
    async function apiGet(url) {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    }

    async function apiPost(url, data) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    }

    // Load TESDA programs
    async function loadTesdaPrograms() {
      try {
        const json = await apiGet("/api/tesda/programs");
        tesdaPrograms.value = json.status === "success" ? json.data || [] : [];
      } catch (e) {
        console.error("Failed to load TESDA programs:", e);
        tesdaPrograms.value = [];
      }
    }

    // Load instructors
    async function loadInstructors() {
      try {
        const json = await apiGet("/api/tesda/instructors");
        instructors.value = json.status === "success" ? json.data || [] : [];
      } catch (e) {
        console.error("Failed to load instructors:", e);
        instructors.value = [];
      }
    }

    // Load overview data
    async function loadOverviewData() {
      overviewLoading.value = true;
      overviewError.value = "";

      try {
        const range = getRangeDates(
          overviewFilters.dateRange,
          overviewFilters.customFrom,
          overviewFilters.customTo
        );

        const params = new URLSearchParams({
          from: range.from,
          to: range.to,
          program_id: overviewFilters.programId || "",
          status: overviewFilters.status || ""
        });

        const json = await apiGet(`/api/tesda/reports/overview?${params}`);

        if (json.status === "success") {
          // Summary
          summary.totalScholars = json.data.summary.total || 0;
          summary.currentEnrolled = json.data.summary.enrolled || 0;
          summary.graduates = json.data.summary.graduated || 0;
          summary.dropped = json.data.summary.dropped || 0;

          // Recent scholars
          recentScholars.value = json.data.recent || [];

          // Chart data
          trendData.labels = json.data.trend?.labels || [];
          trendData.values = json.data.trend?.values || [];

          programsData.labels = json.data.programs?.labels || [];
          programsData.values = json.data.programs?.values || [];

          genderData.values = [
            json.data.gender?.male || 0,
            json.data.gender?.female || 0
          ];

          ageData.labels = json.data.age?.labels || [];
          ageData.values = json.data.age?.values || [];
        }
      } catch (e) {
        overviewError.value = e.message || "Failed to load overview data";
        console.error(e);
      } finally {
        overviewLoading.value = false;
        await nextTick();
        resizeCharts();
      }
    }

    // Load detailed data
    async function loadDetailedData() {
      detailedLoading.value = true;
      detailedError.value = "";

      try {
        const range = getRangeDates(
          detailedFilters.dateRange,
          detailedFilters.customFrom,
          detailedFilters.customTo
        );

        const params = new URLSearchParams({
          from: range.from,
          to: range.to,
          program_id: detailedFilters.programId || "",
          status: detailedFilters.status || ""
        });

        const json = await apiGet(`/api/tesda/reports/detailed?${params}`);

        if (json.status === "success") {
          detailedRows.value = json.data || [];
        } else {
          detailedRows.value = [];
        }
      } catch (e) {
        detailedError.value = e.message || "Failed to load detailed data";
        console.error(e);
      } finally {
        detailedLoading.value = false;
      }
    }

    // Load attendance data
    async function loadAttendanceData() {
      attendanceLoading.value = true;
      attendanceError.value = "";

      try {
        const range = getRangeDates(
          attendanceFilters.dateRange,
          attendanceFilters.customFrom,
          attendanceFilters.customTo
        );

        const params = new URLSearchParams({
          from: range.from,
          to: range.to,
          program_id: attendanceFilters.programId || "",
          instructor_id: attendanceFilters.instructorId || "",
          view_type: attendanceFilters.viewType
        });

        const json = await apiGet(`/api/tesda/reports/attendance?${params}`);

        if (json.status === "success") {
          // Stats
          attendanceStats.totalSessions = json.data.stats?.total_sessions || 0;
          attendanceStats.totalAttendance = json.data.stats?.total_attendance || 0;
          attendanceStats.attendanceRate = json.data.stats?.attendance_rate || 0;
          attendanceStats.avgDaily = json.data.stats?.avg_daily || 0;

          // Records
          attendanceRecords.value = json.data.records || [];

          // Chart data
          attendanceChartData.labels = json.data.chart?.labels || [];
          attendanceChartData.present = json.data.chart?.present || [];
          attendanceChartData.absent = json.data.chart?.absent || [];
          attendanceChartData.late = json.data.chart?.late || [];
        }
      } catch (e) {
        attendanceError.value = e.message || "Failed to load attendance data";
        console.error(e);
      } finally {
        attendanceLoading.value = false;
        await nextTick();
        resizeCharts();
      }
    }

    // Export functions
    function openExportModal(target) {
      exportTarget.value = target;
      exportModalOpen.value = true;

      // Initialize export columns
      if (target === "detailed") {
        columnOptions.forEach(col => {
          exportColumns.value[col.key] = visibleColumns[col.key];
        });
      }
    }

    async function runExport() {
      try {
        if (exportTarget.value === "overview") {
          await exportOverview();
        } else if (exportTarget.value === "detailed") {
          await exportDetailed();
        } else if (exportTarget.value === "attendance") {
          await exportAttendance(exportFormat.value);
        }
        exportModalOpen.value = false;
      } catch (e) {
        alert(`Export failed: ${e.message}`);
      }
    }

    async function exportOverview() {
      const data = {
        summary: summary,
        recent: recentScholars.value,
        trend: trendData,
        programs: programsData,
        gender: genderData,
        age: ageData
      };

      const json = await apiPost("/api/tesda/reports/export/overview", {
        format: exportFormat.value,
        data: data
      });

      if (json.status === "success") {
        downloadFile(json.data.url);
      }
    }

    async function exportDetailed() {
      const rows = exportScope.value === "page" ? detailedPaginated.value : detailedFiltered.value;

      // Filter columns
      const selectedCols = columnOptions.filter(col => exportColumns.value[col.key]);

      const json = await apiPost("/api/tesda/reports/export/detailed", {
        format: exportFormat.value,
        rows: rows,
        columns: selectedCols.map(c => ({
          key: c.key,
          label: c.label
        }))
      });

      if (json.status === "success") {
        downloadFile(json.data.url);
      }
    }

    async function exportAttendance(format) {
      const json = await apiPost("/api/tesda/reports/export/attendance", {
        format: format,
        filters: {
          from: attendanceFilters.customFrom,
          to: attendanceFilters.customTo,
          program_id: attendanceFilters.programId,
          instructor_id: attendanceFilters.instructorId,
          view_type: attendanceFilters.viewType
        },
        records: attendanceRecords.value,
        stats: attendanceStats
      });

      if (json.status === "success") {
        downloadFile(json.data.url);
      }
    }

    function downloadFile(url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      a.click();
    }

    function resizeCharts() {
      try { trendChartRef.value?.resize?.(); } catch {}
      try { programsChartRef.value?.resize?.(); } catch {}
      try { genderChartRef.value?.resize?.(); } catch {}
      try { ageChartRef.value?.resize?.(); } catch {}
      try { attendanceChartRef.value?.resize?.(); } catch {}
    }

    // Watch for search debounce
    watch(searchQuery, (val) => {
      const timer = setTimeout(() => {
        debouncedQuery.value = val;
      }, 300);
      return () => clearTimeout(timer);
    });

    // Watch for filter changes
    watch(() => detailedFilters.sort, () => {
      detailedPage.value = 1;
    });

    watch(detailedTotalPages, (tp) => {
      if (detailedPage.value > tp) detailedPage.value = tp;
    });

    // Initialize
    onMounted(async () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      overviewFilters.customFrom = toISODateLocal(lastMonth);
      overviewFilters.customTo = toISODateLocal(today);

      detailedFilters.customFrom = toISODateLocal(lastMonth);
      detailedFilters.customTo = toISODateLocal(today);

      attendanceFilters.customFrom = toISODateLocal(lastMonth);
      attendanceFilters.customTo = toISODateLocal(today);

      await loadTesdaPrograms();
      await loadInstructors();
      await loadOverviewData();
      await loadDetailedData();
      await loadAttendanceData();
    });

    return {
      // UI
      activeTab,
      searchQuery,
      showColumnSelector,
      exportModalOpen,
      exportTarget,
      exportFormat,
      exportScope,
      exportColumns,
      
      // Data
      tesdaPrograms,
      instructors,
      summary,
      recentScholars,
      detailedRows,
      attendanceRecords,
      attendanceStats,
      
      // Chart data
      trendData,
      programsData,
      genderData,
      ageData,
      attendanceChartData,
      
      // Chart refs
      trendChartRef,
      programsChartRef,
      genderChartRef,
      ageChartRef,
      attendanceChartRef,
      
      // Chart options
      trendOption,
      programsOption,
      genderOption,
      ageOption,
      attendanceOption,
      
      // Loading states
      overviewLoading,
      detailedLoading,
      attendanceLoading,
      
      // Errors
      overviewError,
      detailedError,
      attendanceError,
      
      // Filters
      overviewFilters,
      detailedFilters,
      attendanceFilters,
      
      // Columns
      columnOptions,
      visibleColumns,
      detailedColspan,
      
      // Pagination
      detailedPage,
      detailedPageSize,
      detailedFiltered,
      detailedPaginated,
      detailedTotalPages,
      detailedPageStart,
      detailedPageEnd,
      detailedPageButtons,
      
      // Methods
      loadOverviewData,
      loadDetailedData,
      loadAttendanceData,
      openExportModal,
      runExport,
      exportAttendance,
      formatDate,
      formatDateShort,
      resizeCharts,
    };
  }
};
</script>