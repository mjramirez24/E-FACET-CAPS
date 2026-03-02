<!-- frontend/src/components/AdminReports.vue (FULL UPDATED: + Single Switch Button Driving/TESDA) -->
<template>
  <AdminLayout>
    <!-- Header-left: search + SWITCH -->
    <template #header-left>
      <div class="flex items-center gap-3 w-full">
        <input
          type="text"
          placeholder="Search in tables..."
          v-model="searchQuery"
          class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
        />

        <!-- ✅ SINGLE SWITCH BUTTON -->
        <button
          @click="toggleReportMode"
          class="px-4 py-2 rounded-md text-sm font-semibold shadow-sm border"
          :class="reportMode === 'driving'
            ? 'bg-green-700 text-white border-green-700 hover:bg-green-800'
            : 'bg-blue-700 text-white border-blue-700 hover:bg-blue-800'"
          :title="reportMode === 'driving' ? 'Switch to TESDA' : 'Switch to Driving'"
        >
          <span v-if="reportMode === 'driving'">🚗 Driving</span>
          <span v-else>🎓 TESDA</span>
          <span class="ml-2 opacity-90">⇄</span>
        </button>
      </div>
    </template>

    <div class="space-y-6">
      <!-- PAGE HEADER -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-green-800">
            📈 Analytics & Reports —
            <span class="font-extrabold" :class="reportMode==='driving' ? 'text-green-800' : 'text-blue-800'">
              {{ reportModeLabel }}
            </span>
          </h2>
          <p class="text-xs text-gray-500">
            Charts are descriptive + simple forecasting (trend-based). Exports are selectable (course + columns).
            <span v-if="reportMode==='tesda'"> • TESDA mode</span>
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            @click="openExport('all')"
            class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
          >
            📤 Export (All)
          </button>

          <button
            @click="openExport(activeTab)"
            class="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
          >
            📤 Export (This Tab)
          </button>
        </div>
      </div>

      <!-- TOP SUMMARY -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-green-50 p-4 rounded-lg border border-green-100">
          <p class="text-sm text-green-700 font-medium">Total Enrolled</p>
          <h3 class="text-2xl font-bold text-green-800 mt-1">{{ summary.totalEnrolled }}</h3>
          <p class="text-xs text-gray-500 mt-1">Descriptive</p>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p class="text-sm text-blue-700 font-medium">Most Popular Course</p>
          <h3 class="text-lg font-bold text-blue-800 mt-1">{{ summary.mostPopularCourse || "-" }}</h3>
          <p class="text-xs text-gray-500 mt-1">Descriptive</p>
        </div>

        <!-- ✅ DRIVING ONLY: REVENUE CARD -->
        <div v-if="reportMode === 'driving'" class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <p class="text-sm text-emerald-700 font-medium">💰 Verified Revenue</p>
          <h3 class="text-2xl font-bold text-emerald-800 mt-1">
            {{ formatCurrency(summary.totalRevenuePeso) }}
          </h3>
          <p class="text-xs text-gray-500 mt-1">Descriptive</p>
        </div>

        <!-- ✅ TESDA ONLY: Attendance placeholder/stat (optional) -->
        <div v-else class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <p class="text-sm text-emerald-700 font-medium">📌 TESDA KPI</p>
          <h3 class="text-2xl font-bold text-emerald-800 mt-1">
            {{ tesdaKpiLabel }}
          </h3>
          <p class="text-xs text-gray-500 mt-1">Descriptive</p>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p class="text-sm text-purple-700 font-medium">🔮 Forecast (Enrollments)</p>
          <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ forecast.nextForecast }}</h3>
          <p class="text-xs text-gray-500 mt-1">Predictive • Range: {{ forecast.low }}–{{ forecast.high }}</p>
        </div>
      </div>

      <!-- TABS -->
      <div class="flex flex-wrap gap-2">
        <button
          class="px-3 py-2 rounded-md text-sm font-medium border"
          :class="activeTab==='overview' ? tabActive : tabInactive"
          @click="activeTab='overview'"
        >
          Overview
        </button>

        <!-- ✅ DRIVING ONLY: Revenue -->
        <button
          v-if="reportMode === 'driving'"
          class="px-3 py-2 rounded-md text-sm font-medium border"
          :class="activeTab==='revenue' ? tabActive : tabInactive"
          @click="activeTab='revenue'"
        >
          Revenue
        </button>

        <button
          class="px-3 py-2 rounded-md text-sm font-medium border"
          :class="activeTab==='detailed' ? tabActive : tabInactive"
          @click="activeTab='detailed'"
        >
          Detailed Reports
        </button>

        <!-- ✅ DRIVING ONLY: Exams -->
        <button
          v-if="reportMode === 'driving'"
          class="px-3 py-2 rounded-md text-sm font-medium border"
          :class="activeTab==='exams' ? tabActive : tabInactive"
          @click="activeTab='exams'"
        >
          Exams
        </button>
      </div>

      <!-- ===================== OVERVIEW ===================== -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- OVERVIEW FILTERS -->
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div class="flex flex-wrap gap-4">
              <DateRangePicker
                v-model:range="overviewFilters.dateRange"
                v-model:from="overviewFilters.customFrom"
                v-model:to="overviewFilters.customTo"
              />

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Course (Trend)</label>
                <select v-model="overviewFilters.courseId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All courses</option>
                  <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                    {{ c.course_name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Trend Period</label>
                <div class="flex gap-1">
                  <button
                    @click="setTrendPeriod('day')"
                    :class="trendPeriod==='day' ? btnActive : btnInactive"
                    class="text-sm px-2 py-1 rounded"
                  >Day</button>

                  <button
                    @click="setTrendPeriod('week')"
                    :class="trendPeriod==='week' ? btnActive : btnInactive"
                    class="text-sm px-2 py-1 rounded"
                  >Week</button>

                  <button
                    @click="setTrendPeriod('month')"
                    :class="trendPeriod==='month' ? btnActive : btnInactive"
                    class="text-sm px-2 py-1 rounded"
                  >Month</button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Forecast Horizon</label>
                <select v-model="forecastHorizon" class="w-44 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="next">Next Period</option>
                  <option value="next2">Next 2 Periods</option>
                  <option value="next3">Next 3 Periods</option>
                </select>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 items-end">
              <button
                @click="reloadOverview()"
                class="px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium"
              >
                Apply
              </button>

              <button
                @click="openExport('overview')"
                class="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm font-medium"
              >
                📤 Export Overview
              </button>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <p class="text-xs text-gray-500">Last updated: {{ lastUpdated }}</p>
            <div class="flex gap-2">
              <button @click="downloadChartImage('trend')" class="text-xs px-3 py-2 border rounded hover:bg-gray-50">🖼️ Trend PNG</button>
              <button @click="downloadChartImage('topCourses')" class="text-xs px-3 py-2 border rounded hover:bg-gray-50">🖼️ Top Courses PNG</button>
              <button @click="downloadChartImage('gender')" class="text-xs px-3 py-2 border rounded hover:bg-gray-50">🖼️ Gender PNG</button>
            </div>
          </div>

          <div v-if="overviewError" class="mt-3 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {{ overviewError }}
          </div>
        </div>

        <!-- OVERVIEW CHARTS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Enrollment Trend -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-green-800 font-semibold">Enrollment Trend</h3>
                <p class="text-xs text-gray-500">
                  Course = {{ overviewFilters.courseId ? courseNameById(overviewFilters.courseId) : 'All' }}
                </p>
              </div>
              <button
                @click="openExport('overview')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export
              </button>
            </div>

            <div class="h-64">
              <VChart ref="trendChartRef" :option="trendOption" autoresize />
            </div>

            <div class="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p class="text-xs text-gray-600">
                Forecast = moving average + slope blend. Range band = recent error spread.
              </p>
              <p v-if="overviewLoading" class="text-xs text-gray-500 mt-2">Loading overview…</p>
            </div>
          </div>

          <!-- Top Courses -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-green-800 font-semibold">Top Courses</h3>
                <p class="text-xs text-gray-500">Distribution of enrollments</p>
              </div>
              <button
                @click="openExport('overview')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export
              </button>
            </div>

            <div class="h-64">
              <VChart ref="topCoursesChartRef" :option="topCoursesOption" autoresize />
            </div>
          </div>

          <!-- Gender Distribution -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-green-800 font-semibold">Students by Gender</h3>
                <p class="text-xs text-gray-500">Descriptive breakdown</p>
              </div>
              <button
                @click="openExport('overview')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export
              </button>
            </div>

            <div class="h-64">
              <VChart ref="genderChartRef" :option="genderOption" autoresize />
            </div>
          </div>

          <!-- Course Monthly Summary -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-green-800 font-semibold">Course Enrollments per Month</h3>
                <p class="text-xs text-gray-500">Preview table (export to get full)</p>
              </div>

              <button
                @click="openExport('overview')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-200 text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="py-2 px-3 text-left">Month</th>
                    <th class="py-2 px-3 text-left">Course</th>
                    <th class="py-2 px-3 text-left">Enrollments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(r, i) in courseMonthlyPreview"
                    :key="i"
                    class="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td class="py-2 px-3">{{ r.month_label || "-" }}</td>
                    <td class="py-2 px-3">{{ r.course_name || "-" }}</td>
                    <td class="py-2 px-3 font-semibold">{{ r.count ?? 0 }}</td>
                  </tr>

                  <tr v-if="!overviewLoading && courseMonthlyPreview.length === 0">
                    <td colspan="3" class="py-6 text-center text-gray-500">No data</td>
                  </tr>

                  <tr v-if="overviewLoading">
                    <td colspan="3" class="py-6 text-center text-gray-500">Loading…</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p class="text-xs text-gray-500 mt-3">
              Tip: export to Excel/PDF/CSV para full dataset.
            </p>
          </div>
        </div>
      </div>

      <!-- ===================== REVENUE (DRIVING ONLY) ===================== -->
      <div v-else-if="activeTab === 'revenue' && reportMode === 'driving'" class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h3 class="text-green-800 font-semibold">💰 Revenue Analytics</h3>
              <p class="text-xs text-gray-500">Filters here affect revenue only (no global filters).</p>
            </div>

            <div class="flex flex-wrap gap-3 items-end">
              <DateRangePicker
                v-model:range="revenueTabFilters.dateRange"
                v-model:from="revenueTabFilters.customFrom"
                v-model:to="revenueTabFilters.customTo"
              />

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Course</label>
                <select v-model="revenueTabFilters.courseId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All</option>
                  <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                    {{ c.course_name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                <select v-model="revenueTabFilters.payment_method" class="w-40 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All</option>
                  <option value="GCASH">GCASH</option>
                  <option value="CASH">CASH</option>
                </select>
              </div>

              <button @click="reloadRevenue()" class="text-sm px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800">
                Apply
              </button>

              <button @click="openExport('revenue')" class="text-sm px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                📤 Export Revenue
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <p class="text-sm text-emerald-700 font-medium">Verified Revenue</p>
              <h3 class="text-2xl font-bold text-emerald-800 mt-1">
                {{ formatCurrency(revenueStats.verifiedRevenuePeso) }}
              </h3>
            </div>
            <div class="bg-green-50 p-4 rounded-lg border border-green-100">
              <p class="text-sm text-green-700 font-medium">Verified Payments</p>
              <h3 class="text-2xl font-bold text-green-800 mt-1">{{ revenueStats.verifiedCount }}</h3>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p class="text-sm text-purple-700 font-medium">Forecast Revenue (Next)</p>
              <h3 class="text-2xl font-bold text-purple-800 mt-1">
                {{ formatCurrency(revenueStats.forecastRevenuePeso) }}
              </h3>
            </div>
          </div>

          <div v-if="revenueError" class="mt-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {{ revenueError }}
          </div>
        </div>

        <!-- Revenue Table -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
            <div>
              <h4 class="text-green-800 font-semibold">Payments (preview)</h4>
              <p class="text-xs text-gray-500">Search uses the header search (local filter only).</p>
            </div>

            <div class="flex flex-wrap gap-3 items-end">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Rows per page</label>
                <select v-model.number="revenuePageSize" class="w-28 p-2 border border-gray-300 rounded-md text-sm">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>

              <div class="text-xs text-gray-600">
                Showing {{ revenuePageStart }}–{{ revenuePageEnd }} of {{ revenueFiltered.length }}
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full border border-gray-200 text-sm">
              <thead class="bg-gray-200">
                <tr>
                  <th class="py-2 px-3 text-left">Student</th>
                  <th class="py-2 px-3 text-left">Course</th>
                  <th class="py-2 px-3 text-left">Method</th>
                  <th class="py-2 px-3 text-left">Amount</th>
                  <th class="py-2 px-3 text-left">Created</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="p in revenuePaginated"
                  :key="p.id || `${p.created_at}-${p.fullname}`"
                  class="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td class="py-2 px-3">{{ p.fullname || '-' }}</td>
                  <td class="py-2 px-3">{{ p.course_name || '-' }}</td>
                  <td class="py-2 px-3">{{ normalizePaymentMethod(p.payment_method) || '-' }}</td>
                  <td class="py-2 px-3">{{ formatCurrency(p.amount_peso || 0) }}</td>
                  <td class="py-2 px-3">{{ p.created_at ? formatDate(p.created_at) : '-' }}</td>
                </tr>

                <tr v-if="!revenueLoading && revenueFiltered.length === 0">
                  <td colspan="5" class="py-6 text-center text-gray-500">No payments loaded</td>
                </tr>

                <tr v-if="revenueLoading">
                  <td colspan="5" class="py-6 text-center text-gray-500">Loading payments…</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="revenueTotalPages > 1" class="mt-4 flex justify-between items-center">
            <button
              class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              :disabled="revenuePage === 1"
              @click="revenuePage--"
            >
              ← Prev
            </button>

            <div class="flex gap-1 flex-wrap justify-center">
              <button
                v-for="p in revenuePageButtons"
                :key="p"
                class="px-3 py-2 border rounded text-sm"
                :class="p === revenuePage ? 'bg-green-700 text-white border-green-700' : 'hover:bg-gray-50'"
                @click="revenuePage = p"
              >
                {{ p }}
              </button>
            </div>

            <button
              class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              :disabled="revenuePage === revenueTotalPages"
              @click="revenuePage++"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- ===================== DETAILED REPORTS ===================== -->
      <div v-else-if="activeTab === 'detailed'" class="space-y-6">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div class="flex flex-wrap gap-4">
              <DateRangePicker
                v-model:range="detailedTabFilters.dateRange"
                v-model:from="detailedTabFilters.customFrom"
                v-model:to="detailedTabFilters.customTo"
              />

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select v-model="detailedTabFilters.courseId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All</option>
                  <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                    {{ c.course_name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Group by</label>
                <select v-model="detailedTabFilters.groupBy" class="w-44 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="raw">Raw</option>
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select v-model="detailedTabFilters.source" class="w-36 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All</option>
                  <option value="ONLINE">ONLINE</option>
                  <option value="WALKIN">WALKIN</option>
                </select>
              </div>

              <!-- ✅ DRIVING ONLY: payment method filter (TESDA can keep it, pero usually wala) -->
              <div v-if="reportMode === 'driving'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select v-model="detailedTabFilters.payment_method" class="w-36 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">All</option>
                  <option value="GCASH">GCASH</option>
                  <option value="CASH">CASH</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Sort</label>
                <select v-model="detailedTabFilters.sort" class="w-44 p-2 border border-gray-300 rounded-md text-sm">
                  <option value="created_desc">Created (newest)</option>
                  <option value="created_asc">Created (oldest)</option>
                  <option value="name_asc">Name (A–Z)</option>
                  <option value="name_desc">Name (Z–A)</option>
                </select>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 items-end">
              <button @click="reloadDetailed()" class="text-sm px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800">
                Apply
              </button>

              <button @click="openExport('detailed')" class="text-sm px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                📤 Export Detailed
              </button>

              <button @click="columnsOpen = !columnsOpen" class="text-sm px-3 py-2 border rounded hover:bg-gray-50">
                {{ columnsOpen ? 'Hide' : 'Show' }} Columns
              </button>
            </div>
          </div>

          <div v-if="columnsOpen" class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs text-gray-600 font-semibold">Column visibility (table + export default)</p>
              <div class="flex gap-2">
                <button @click="applyColumnPreset('pdc')" class="text-xs px-3 py-2 border rounded hover:bg-white">
                  Preset: PDC list
                </button>
                <button @click="applyColumnPreset('minimal')" class="text-xs px-3 py-2 border rounded hover:bg-white">
                  Preset: Minimal
                </button>
                <button @click="applyColumnPreset('all')" class="text-xs px-3 py-2 border rounded hover:bg-white">
                  Preset: Show all
                </button>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-4 text-sm">
              <label v-for="col in columnOptions" :key="col.key" class="inline-flex items-center gap-2">
                <input type="checkbox" v-model="visibleColumns[col.key]" />
                <span>{{ col.label }}</span>
              </label>
            </div>
          </div>

          <div v-if="detailedError" class="mt-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {{ detailedError }}
          </div>
        </div>

        <!-- Detailed Table -->
        <div class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h3 class="text-lg font-bold text-green-800">📋 Detailed Reports</h3>
              <p class="text-xs text-gray-500">
                GroupBy controls backend aggregation. Search is local (header search).
              </p>
            </div>

            <div class="flex flex-wrap gap-3 items-end">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Rows per page</label>
                <select v-model.number="detailedPageSize" class="w-28 p-2 border border-gray-300 rounded-md text-sm">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>

              <div class="text-xs text-gray-600">
                Showing {{ detailedPageStart }}–{{ detailedPageEnd }} of {{ detailedFiltered.length }}
              </div>
            </div>
          </div>

          <table class="min-w-full border border-gray-200 text-sm">
            <thead class="bg-gray-200 text-gray-900">
              <tr>
                <th class="py-2 px-3 text-left">No.</th>
                <th v-if="visibleColumns.lto_client_id && reportMode==='driving'" class="py-2 px-3 text-left">LTO Client ID</th>
                <th v-if="visibleColumns.fullname" class="py-2 px-3 text-left">Full Name</th>
                <th v-if="visibleColumns.birthday" class="py-2 px-3 text-left">Birthdate</th>
                <th v-if="visibleColumns.gender" class="py-2 px-3 text-left">Sex</th>

                <th v-if="visibleColumns.instructor_name" class="py-2 px-3 text-left">{{ reportMode==='driving' ? 'Instructor' : 'Trainer' }}</th>
                <th v-if="visibleColumns.course_name" class="py-2 px-3 text-left">Course</th>
                <th v-if="visibleColumns.course_start" class="py-2 px-3 text-left">Course Start</th>
                <th v-if="visibleColumns.course_end" class="py-2 px-3 text-left">Course End</th>

                <th v-if="visibleColumns.dl_code && reportMode==='driving'" class="py-2 px-3 text-left">DL Code</th>
                <th v-if="visibleColumns.training_purpose" class="py-2 px-3 text-left">Training Purpose</th>
                <th v-if="visibleColumns.municipality" class="py-2 px-3 text-left">Municipality</th>

                <th v-if="visibleColumns.reservation_source" class="py-2 px-3 text-left">Source</th>

                <th v-if="visibleColumns.nationality" class="py-2 px-3 text-left">Nationality</th>
                <th v-if="visibleColumns.civil_status" class="py-2 px-3 text-left">Civil Status</th>
                <th v-if="visibleColumns.address" class="py-2 px-3 text-left">Address</th>

                <!-- ✅ DRIVING ONLY: payment column visibility -->
                <th v-if="visibleColumns.payment_method && reportMode==='driving'" class="py-2 px-3 text-left">Payment</th>

                <th v-if="visibleColumns.created_at" class="py-2 px-3 text-left">Created</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(row, idx) in detailedPaginated"
                :key="row.reservation_id || row.group_key || idx"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-2 px-3">{{ detailedPageStart + idx }}</td>

                <td v-if="visibleColumns.lto_client_id && reportMode==='driving'" class="py-2 px-3">{{ row.lto_client_id || '-' }}</td>
                <td v-if="visibleColumns.fullname" class="py-2 px-3">{{ row.fullname || row.group_label || '-' }}</td>
                <td v-if="visibleColumns.birthday" class="py-2 px-3">{{ row.birthday ? formatDateShort(row.birthday) : '-' }}</td>
                <td v-if="visibleColumns.gender" class="py-2 px-3">
                  {{ row.gender ? (String(row.gender).toLowerCase() === 'male' ? 'M' : 'F') : '-' }}
                </td>

                <td v-if="visibleColumns.instructor_name" class="py-2 px-3">{{ reportMode==='driving' ? (row.instructor_name || '-') : (row.trainer_name || '-') }}</td>
                <td v-if="visibleColumns.course_name" class="py-2 px-3">{{ row.course_name || '-' }}</td>
                <td v-if="visibleColumns.course_start" class="py-2 px-3">{{ (row.course_start || row.schedule_date) ? formatDate(row.course_start || row.schedule_date) : '-' }}</td>
                <td v-if="visibleColumns.course_end" class="py-2 px-3">{{ (row.course_end || row.schedule_date) ? formatDate(row.course_end || row.schedule_date) : '-' }}</td>

                <td v-if="visibleColumns.dl_code && reportMode==='driving'" class="py-2 px-3">{{ row.dl_code || '-' }}</td>
                <td v-if="visibleColumns.training_purpose" class="py-2 px-3">{{ row.training_purpose || '-' }}</td>
                <td v-if="visibleColumns.municipality" class="py-2 px-3">{{ row.municipality || '-' }}</td>

                <td v-if="visibleColumns.reservation_source" class="py-2 px-3">{{ row.reservation_source || '-' }}</td>

                <td v-if="visibleColumns.nationality" class="py-2 px-3">{{ row.nationality || '-' }}</td>
                <td v-if="visibleColumns.civil_status" class="py-2 px-3">{{ row.civil_status || '-' }}</td>
                <td v-if="visibleColumns.address" class="py-2 px-3">{{ row.address || '-' }}</td>

                <td v-if="visibleColumns.payment_method && reportMode==='driving'" class="py-2 px-3">{{ normalizePaymentMethod(row.payment_method) || '-' }}</td>

                <td v-if="visibleColumns.created_at" class="py-2 px-3">{{ row.created_at ? formatDate(row.created_at) : '-' }}</td>
              </tr>

              <tr v-if="!detailedLoading && detailedFiltered.length === 0">
                <td :colspan="detailedColspanComputed" class="py-8 text-center text-gray-500">No data for your filters</td>
              </tr>

              <tr v-if="detailedLoading">
                <td :colspan="detailedColspanComputed" class="py-8 text-center text-gray-500">Loading detailed reports…</td>
              </tr>
            </tbody>
          </table>

          <div v-if="detailedTotalPages > 1" class="p-4 flex justify-between items-center">
            <button
              class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              :disabled="detailedPage === 1"
              @click="detailedPage--"
            >
              ← Prev
            </button>

            <div class="flex gap-1 flex-wrap justify-center">
              <button
                v-for="p in detailedPageButtons"
                :key="p"
                class="px-3 py-2 border rounded text-sm"
                :class="p === detailedPage ? 'bg-green-700 text-white border-green-700' : 'hover:bg-gray-50'"
                @click="detailedPage = p"
              >
                {{ p }}
              </button>
            </div>

            <button
              class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              :disabled="detailedPage === detailedTotalPages"
              @click="detailedPage++"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- ===================== EXAMS (DRIVING ONLY) ===================== -->
      <div v-else class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-green-800 font-semibold">🧑‍🏫 Exam Analytics</h3>
              <p class="text-xs text-gray-500">Placeholder (backend later)</p>
            </div>
            <button @click="examOpen = !examOpen" class="text-sm px-3 py-1 border rounded hover:bg-gray-50">
              {{ examOpen ? 'Hide' : 'Show' }} Exam Section
            </button>
          </div>

          <div v-if="examOpen" class="mt-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-green-50 p-5 rounded-lg border border-green-100 text-center">
                <p class="text-sm text-green-700 font-medium">Passing Rate</p>
                <h3 class="text-3xl font-bold text-green-800 mt-1">{{ examStats.passingRate }}%</h3>
                <p class="text-xs text-gray-500 mt-2">Placeholder</p>
              </div>
              <div class="bg-blue-50 p-5 rounded-lg border border-blue-100 text-center">
                <p class="text-sm text-blue-700 font-medium">Highest Score</p>
                <h3 class="text-3xl font-bold text-blue-800 mt-1">{{ examStats.highestScore }}%</h3>
                <p class="text-xs text-gray-500 mt-2">Placeholder</p>
              </div>
              <div class="bg-red-50 p-5 rounded-lg border border-red-100 text-center">
                <p class="text-sm text-red-700 font-medium">Below Passing</p>
                <h3 class="text-3xl font-bold text-red-800 mt-1">{{ examStats.belowPassing }}%</h3>
                <p class="text-xs text-gray-500 mt-2">Placeholder</p>
              </div>
            </div>

            <div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p class="text-sm text-gray-700 font-semibold mb-1">Backend later</p>
              <p class="text-xs text-gray-600">
                We'll connect to exam_results: passing rate, distribution, instructor/course performance.
              </p>
            </div>
          </div>

          <div v-else class="mt-6 text-sm text-gray-500">
            Exam section hidden. Click “Show Exam Section”.
          </div>
        </div>
      </div>

      <!-- ===================== EXPORT MODAL ===================== -->
      <div v-if="exportOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div class="p-4 border-b flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-green-800">📤 Export Builder</h3>
              <p class="text-xs text-gray-500">
                Piliin ang course + columns + scope, then export as Excel/PDF/CSV.
              </p>
            </div>
            <button @click="exportOpen=false" class="px-3 py-2 border rounded hover:bg-gray-50">✖</button>
          </div>

          <div class="p-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <select v-model="exportTarget" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="all">All (Overview + Detailed{{ reportMode==='driving' ? ' + Revenue' : '' }})</option>
                  <option value="overview">Overview (trend/top/gender/monthly)</option>
                  <option v-if="reportMode==='driving'" value="revenue">Revenue table</option>
                  <option value="detailed">Detailed table</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select v-model="exportFormat" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                <select v-model="exportScope" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="all">All rows (filtered)</option>
                  <option value="page">Current page only</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Course (optional)</label>
                <select v-model="exportCourseId" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Use current tab filter</option>
                  <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                    {{ c.course_name }}
                  </option>
                </select>
                <p class="text-xs text-gray-500 mt-1">Blank = gamitin ang current filters mo.</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select v-model="exportTemplate" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="custom">Custom (selected columns)</option>
                  <option value="pdc">PDC-style list (like your picture)</option>
                  <option value="minimal">Minimal list</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">Template affects columns for Detailed export.</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">File name</label>
                <input v-model="exportFileName" class="w-full p-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-gray-700">Columns</p>
                <div class="flex gap-2">
                  <button @click="selectExportColumns('fromVisible')" class="text-xs px-3 py-2 border rounded hover:bg-white">
                    Use table columns
                  </button>
                  <button @click="selectExportColumns('all')" class="text-xs px-3 py-2 border rounded hover:bg-white">
                    Select all
                  </button>
                  <button @click="selectExportColumns('none')" class="text-xs px-3 py-2 border rounded hover:bg-white">
                    Clear
                  </button>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <label
                  v-for="col in exportColumnOptions"
                  :key="col.key"
                  class="inline-flex items-center gap-2 text-sm"
                >
                  <input type="checkbox" v-model="exportColumns[col.key]" />
                  <span>{{ col.label }}</span>
                </label>
              </div>

              <p class="text-xs text-gray-500 mt-2">
                Note: For Overview export, columns are predefined per dataset.
              </p>
            </div>

            <div class="flex flex-wrap gap-2 justify-end">
              <button @click="exportOpen=false" class="px-4 py-2 border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button @click="runExport()" class="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">
                Export Now
              </button>
            </div>

            <div v-if="exportError" class="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
              {{ exportError }}
            </div>
          </div>
        </div>
      </div>

      <!-- hidden canvases -->
      <div class="hidden">
        <canvas ref="tmpCanvas"></canvas>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import AdminLayout from "./AdminLayout.vue";
import DateRangePicker from "./DateRangePicker.vue";

// ECharts
import VChart from "vue-echarts";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from "echarts/components";

// Export libs
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

echarts.use([CanvasRenderer, LineChart, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent]);

export default {
  name: "AdminReports",
  components: { AdminLayout, DateRangePicker, VChart },
  setup() {
    // ✅ NEW: report mode switch
    const reportMode = ref("driving"); // 'driving' | 'tesda'
    const reportModeLabel = computed(() => (reportMode.value === "driving" ? "Driving" : "TESDA"));

    function toggleReportMode() {
      reportMode.value = reportMode.value === "driving" ? "tesda" : "driving";
    }

    // ✅ when switching mode, reload everything + refresh dropdown courses
    watch(reportMode, async (mode) => {
      // reset pages to avoid empty pagination after switch
      revenuePage.value = 1;
      detailedPage.value = 1;

      // clear mode-specific summaries
      summary.totalRevenuePeso = 0;
      revenuePayments.value = [];
      revenueStats.verifiedCount = 0;
      revenueStats.avgFeePeso = 0;
      revenueStats.verifiedRevenuePeso = 0;
      revenueStats.forecastRevenuePeso = 0;

      await loadCourses();
      await loadOverview();
      await loadDetailed();
      if (mode === "driving") await loadRevenue();

      await nextTick();
      resizeCharts();
    });

    // UI
    const activeTab = ref("overview");
    const examOpen = ref(false);
    const columnsOpen = ref(false);

    const tabActive = "bg-green-700 text-white border-green-700";
    const tabInactive = "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
    const btnActive = "bg-green-700 text-white";
    const btnInactive = "bg-gray-100 text-gray-700 hover:bg-green-200";

    // Search (local only)
    const searchQuery = ref("");
    const debouncedQuery = ref("");
    let t = null;
    watch(searchQuery, (v) => {
      clearTimeout(t);
      t = setTimeout(() => {
        debouncedQuery.value = String(v || "").trim().toLowerCase();
      }, 250);
    });

    // ✅ Overview default "allMonths"
    const overviewFilters = reactive({
      dateRange: "allMonths",
      customFrom: "",
      customTo: "",
      courseId: "",
    });

    const revenueTabFilters = reactive({
      dateRange: "thisMonth",
      customFrom: "",
      customTo: "",
      courseId: "",
      payment_method: "",
    });

    const detailedTabFilters = reactive({
      dateRange: "thisMonth",
      customFrom: "",
      customTo: "",
      courseId: "",
      groupBy: "raw",
      source: "",
      payment_method: "",
      sort: "created_desc",
    });

    // Config
    const trendPeriod = ref("month");
    const forecastHorizon = ref("next");

    // Data
    const courses = ref([]);
    const summary = reactive({
      totalEnrolled: 0,
      mostPopularCourse: "",
      totalRevenuePeso: 0, // driving only display
    });

    // TESDA KPI placeholder (optional)
    const tesdaKpiLabel = computed(() => {
      // you can replace this later with attendanceRate from backend
      return `${summary.totalEnrolled || 0}`;
    });

    const trend = reactive({ labels: [], values: [] });
    const topCourses = reactive({ labels: [], values: [] });
    const gender = reactive({ labels: ["Male", "Female"], values: [0, 0] });
    const courseMonthlyPreview = ref([]);

    const forecast = reactive({ nextForecast: 0, low: 0, high: 0 });

    const revenueStats = reactive({
      verifiedCount: 0,
      avgFeePeso: 0,
      verifiedRevenuePeso: 0,
      forecastRevenuePeso: 0,
    });

    const revenuePayments = ref([]);
    const detailedRows = ref([]);

    const overviewLoading = ref(false);
    const revenueLoading = ref(false);
    const detailedLoading = ref(false);

    const overviewError = ref("");
    const revenueError = ref("");
    const detailedError = ref("");

    // ECharts refs (for PNG exporting)
    const trendChartRef = ref(null);
    const topCoursesChartRef = ref(null);
    const genderChartRef = ref(null);

    // ✅ helper: get echarts instance safely (vue-echarts)
    function getChartInstance(chartRef) {
      try {
        return chartRef?.value?.getEchartsInstance?.() || null;
      } catch {
        return null;
      }
    }

    // Pagination
    const revenuePage = ref(1);
    const revenuePageSize = ref(25);
    const detailedPage = ref(1);
    const detailedPageSize = ref(25);

    // Columns
    const drivingColumnOptions = [
      { key: "lto_client_id", label: "LTO Client ID" },
      { key: "fullname", label: "Full Name" },
      { key: "birthday", label: "Birthdate" },
      { key: "gender", label: "Sex" },
      { key: "instructor_name", label: "Instructor" },
      { key: "course_name", label: "Course" },
      { key: "course_start", label: "Course Start" },
      { key: "course_end", label: "Course End" },
      { key: "dl_code", label: "DL Code" },
      { key: "training_purpose", label: "Training Purpose" },
      { key: "municipality", label: "Municipality" },
      { key: "reservation_source", label: "Source" },
      { key: "payment_method", label: "Payment" },
      { key: "created_at", label: "Created" },
      { key: "nationality", label: "Nationality", defaultVisible: false },
      { key: "civil_status", label: "Civil Status", defaultVisible: false },
      { key: "address", label: "Address", defaultVisible: false },
    ];

    // ✅ TESDA detailed columns (NO LTO Client ID, NO DL Code, NO Payment)
    // Instructor column is replaced by Trainer (trainer_code)
    const tesdaColumnOptions = [
      { key: "fullname", label: "Full Name" },
      { key: "birthday", label: "Birthdate" },
      { key: "gender", label: "Sex" },
      { key: "instructor_name", label: "Trainer" },
      { key: "course_name", label: "Course" },
      { key: "course_start", label: "Course Start" },
      { key: "course_end", label: "Course End" },
      { key: "reservation_source", label: "Source" },
      { key: "created_at", label: "Created" },
      { key: "nationality", label: "Nationality", defaultVisible: false },
      { key: "civil_status", label: "Civil Status", defaultVisible: false },
      { key: "address", label: "Address", defaultVisible: false },
    ];

    const columnOptions = computed(() =>
      reportMode.value === "driving" ? drivingColumnOptions : tesdaColumnOptions,
    );

    const visibleColumns = reactive({
      lto_client_id: true,
      fullname: true,
      birthday: true,
      gender: true,
      instructor_name: true,
      course_name: false,
      course_start: true,
      course_end: true,
      dl_code: true,
      training_purpose: true,
      municipality: false,
      reservation_source: false,
      payment_method: false,
      created_at: false,

      nationality: false,
      civil_status: false,
      address: false,
    });

    // ✅ TESDA: payment column hidden in UI rendering
    const detailedColspanComputed = computed(() => {
      const keys = Object.keys(visibleColumns);
      let count = 1; // No.
      for (const k of keys) {
        if (!visibleColumns[k]) continue;
        if (k === "payment_method" && reportMode.value !== "driving") continue;
        count++;
      }
      return count;
    });

    // Exams placeholder
    const examStats = reactive({ passingRate: 0, highestScore: 0, belowPassing: 0 });

    const lastUpdated = computed(() => {
      const now = new Date();
      return now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    // Helpers
    function formatCurrency(amount) {
      const n = Number(amount || 0);
      return "₱" + n.toLocaleString("en-PH");
    }

    function formatDate(dateString) {
      if (!dateString) return "-";
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function formatDateShort(dateString) {
      if (!dateString) return "-";
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" });
    }

    function normalizePaymentMethod(v) {
      const s = String(v || "").trim().toUpperCase();
      if (!s) return "";
      if (s.includes("G-CASH") || s.includes("GCASH")) return "GCASH";
      if (s.includes("CASH")) return "CASH";
      return s;
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
      if (range === "allMonths") return { from: "2000-01-01", to: toISODateLocal(today) };

      if (range === "thisMonth") return { from: toISODateLocal(new Date(yyyy, mm, 1)), to: toISODateLocal(today) };
      if (range === "lastMonth") {
        return {
          from: toISODateLocal(new Date(yyyy, mm - 1, 1)),
          to: toISODateLocal(new Date(yyyy, mm, 0)),
        };
      }
      if (range === "thisQuarter") {
        const qStart = Math.floor(mm / 3) * 3;
        return { from: toISODateLocal(new Date(yyyy, qStart, 1)), to: toISODateLocal(today) };
      }
      return { from: toISODateLocal(new Date(yyyy, 0, 1)), to: toISODateLocal(today) };
    }

    function courseNameById(id) {
      const c = (courses.value || []).find((x) => String(x.id) === String(id));
      return c?.course_name || "-";
    }

    // Forecast helpers
    function computeForecast(values) {
      const v = (values || []).map((x) => Number(x || 0)).filter((x) => Number.isFinite(x));
      if (v.length === 0) return 0;
      if (v.length === 1) return Math.max(0, Math.round(v[0]));

      const N = Math.min(6, v.length);
      const tail = v.slice(-N);

      const maN = Math.min(3, v.length);
      const ma = v.slice(-maN).reduce((a, b) => a + b, 0) / maN;

      const xs = Array.from({ length: tail.length }, (_, i) => i + 1);
      const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
      const yMean = tail.reduce((a, b) => a + b, 0) / tail.length;

      let num = 0;
      let den = 0;
      for (let i = 0; i < tail.length; i++) {
        num += (xs[i] - xMean) * (tail[i] - yMean);
        den += (xs[i] - xMean) * (xs[i] - xMean);
      }
      const slope = den === 0 ? 0 : num / den;
      const trendForecast = tail[tail.length - 1] + slope;

      const blended = 0.6 * ma + 0.4 * trendForecast;
      return Math.max(0, Math.round(blended));
    }

    function forecastBand(values, pointForecast) {
      const v = (values || []).map((x) => Number(x || 0)).filter((x) => Number.isFinite(x));
      if (v.length < 3) return { low: Math.max(0, pointForecast - 2), high: pointForecast + 2 };

      const residuals = [];
      for (let i = 2; i < v.length; i++) {
        const ma = (v[i] + v[i - 1] + v[i - 2]) / 3;
        residuals.push(v[i] - ma);
      }
      const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
      const varr = residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, residuals.length - 1);
      const std = Math.sqrt(varr);

      const delta = Math.max(2, Math.round(1.2 * std));
      return { low: Math.max(0, pointForecast - delta), high: pointForecast + delta };
    }

    function computeForecastAndRevenueModel() {
      const base = computeForecast(trend.values);
      let f = base;
      if (forecastHorizon.value === "next2") f = base * 2;
      if (forecastHorizon.value === "next3") f = base * 3;

      forecast.nextForecast = f;
      const band = forecastBand(trend.values, f);
      forecast.low = band.low;
      forecast.high = band.high;

      if (reportMode.value !== "driving") {
        revenueStats.forecastRevenuePeso = 0;
        return;
      }

      const avgFee = Number(revenueStats.avgFeePeso || 0);
      revenueStats.forecastRevenuePeso = avgFee > 0 ? Math.round(avgFee * forecast.nextForecast) : 0;
    }

    // API
    async function apiGet(url) {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }
      return res.json();
    }

    function buildParams(tab, extra = {}) {
      let range, from, to, course_id;

      if (tab === "overview") {
        const r = getRangeDates(overviewFilters.dateRange, overviewFilters.customFrom, overviewFilters.customTo);
        range = overviewFilters.dateRange;
        from = r.from;
        to = r.to;
        course_id = overviewFilters.courseId || "";
      } else if (tab === "revenue") {
        const r = getRangeDates(revenueTabFilters.dateRange, revenueTabFilters.customFrom, revenueTabFilters.customTo);
        range = revenueTabFilters.dateRange;
        from = r.from;
        to = r.to;
        course_id = revenueTabFilters.courseId || "";
      } else {
        const r = getRangeDates(detailedTabFilters.dateRange, detailedTabFilters.customFrom, detailedTabFilters.customTo);
        range = detailedTabFilters.dateRange;
        from = r.from;
        to = r.to;
        course_id = detailedTabFilters.courseId || "";
      }

      const params = new URLSearchParams({
        from: from || "",
        to: to || "",
        course_id,
        report_mode: reportMode.value,
        ...extra,
      });

      if (range) params.set("date_range", range);
      return params;
    }

    // Loaders
    async function loadCourses() {
      try {
        const json = await apiGet(`/api/admin/courses?track=${reportMode.value}`);
        courses.value = json.status === "success" ? json.data || [] : [];
      } catch {
        courses.value = [];
      }
    }

    async function loadOverview() {
      overviewLoading.value = true;
      overviewError.value = "";
      try {
        const qs = buildParams("overview", { period: trendPeriod.value });

        const [sum, tr, tc, g, monthly] = await Promise.all([
          apiGet(`/api/admin/reports/summary?${qs.toString()}`),
          apiGet(`/api/admin/reports/trend?${qs.toString()}`),
          apiGet(`/api/admin/reports/top-courses?${qs.toString()}`),
          apiGet(`/api/admin/reports/gender-breakdown?${qs.toString()}`),
          apiGet(`/api/admin/reports/course-monthly-preview?${qs.toString()}`),
        ]);

        if (sum.status === "success" && sum.data) {
          summary.totalEnrolled = Number(sum.data.totalEnrolled || 0);
          summary.mostPopularCourse = String(sum.data.mostPopularCourse || "");
          summary.totalRevenuePeso = reportMode.value === "driving" ? Number(sum.data.totalRevenuePeso || 0) : 0;
        }

        if (tr.status === "success" && tr.data) {
          trend.labels = Array.isArray(tr.data.labels) ? tr.data.labels : [];
          trend.values = Array.isArray(tr.data.values) ? tr.data.values : [];
        } else {
          trend.labels = [];
          trend.values = [];
        }

        if (tc.status === "success" && tc.data) {
          topCourses.labels = Array.isArray(tc.data.labels) ? tc.data.labels : [];
          topCourses.values = Array.isArray(tc.data.values) ? tc.data.values : [];
        } else {
          topCourses.labels = [];
          topCourses.values = [];
        }

        if (g.status === "success" && g.data) {
          gender.labels = Array.isArray(g.data.labels) ? g.data.labels : ["Male", "Female"];
          gender.values = Array.isArray(g.data.values) ? g.data.values : [0, 0];
        } else {
          gender.labels = ["Male", "Female"];
          gender.values = [0, 0];
        }

        courseMonthlyPreview.value = monthly.status === "success" && Array.isArray(monthly.data) ? monthly.data : [];
        computeForecastAndRevenueModel();
      } catch (e) {
        overviewError.value = e?.message || "Failed to load overview.";
        trend.labels = [];
        trend.values = [];
        topCourses.labels = [];
        topCourses.values = [];
        gender.labels = ["Male", "Female"];
        gender.values = [0, 0];
        courseMonthlyPreview.value = [];
        summary.totalRevenuePeso = 0;
        computeForecastAndRevenueModel();
      } finally {
        overviewLoading.value = false;
      }
    }

    async function loadRevenue() {
      if (reportMode.value !== "driving") {
        revenueStats.verifiedCount = 0;
        revenueStats.avgFeePeso = 0;
        revenueStats.verifiedRevenuePeso = 0;
        revenueStats.forecastRevenuePeso = 0;
        revenuePayments.value = [];
        return;
      }

      revenueLoading.value = true;
      revenueError.value = "";
      try {
        const qs = buildParams("revenue", {
          payment_method: revenueTabFilters.payment_method ? normalizePaymentMethod(revenueTabFilters.payment_method) : "",
        });

        const json = await apiGet(`/api/admin/reports/revenue-preview?${qs.toString()}`);

        if (json.status === "success" && json.data) {
          revenueStats.verifiedCount = Number(json.data.verifiedCount || 0);
          revenueStats.avgFeePeso = Number(json.data.avgFeePeso || 0);
          revenueStats.verifiedRevenuePeso = Number(json.data.verifiedRevenuePeso || 0);
          revenuePayments.value = Array.isArray(json.data.payments) ? json.data.payments : [];
        } else {
          revenueStats.verifiedCount = 0;
          revenueStats.avgFeePeso = 0;
          revenueStats.verifiedRevenuePeso = 0;
          revenuePayments.value = [];
        }

        computeForecastAndRevenueModel();
      } catch (e) {
        revenueError.value = e?.message || "Failed to load revenue.";
        revenueStats.verifiedCount = 0;
        revenueStats.avgFeePeso = 0;
        revenueStats.verifiedRevenuePeso = 0;
        revenuePayments.value = [];
        computeForecastAndRevenueModel();
      } finally {
        revenueLoading.value = false;
      }
    }

    async function loadDetailed() {
      detailedLoading.value = true;
      detailedError.value = "";

      // ✅ Adjust column visibility per mode
      if (reportMode.value === "tesda") {
        Object.assign(visibleColumns, {
          lto_client_id: false,
          dl_code: false,
          training_purpose: false,
          municipality: false,
          payment_method: false,
          instructor_name: true,
          course_name: true,
          course_start: true,
          course_end: true,
          reservation_source: true,
          created_at: true,
        });
      }
      try {
        // Driving = aggregated detailed (group_by etc.)
        if (reportMode.value === "driving") {
          const qs = buildParams("detailed", {
            group_by: detailedTabFilters.groupBy,
            source: detailedTabFilters.source || "",
            payment_method:
              detailedTabFilters.payment_method
                ? normalizePaymentMethod(detailedTabFilters.payment_method)
                : "",
          });

          const json = await apiGet(`/api/admin/reports/detailed?${qs.toString()}`);
          detailedRows.value =
            json.status === "success"
              ? Array.isArray(json.data)
                ? json.data
                : []
              : [];
          return;
        }

        // TESDA = raw reservations list (no payment_method, no group_by)
        const qs = buildParams("detailed", {
          source: detailedTabFilters.source || "",
        });

        const json = await apiGet(`/api/admin/reports/detailed?${qs.toString()}`);
        detailedRows.value =
          json.status === "success"
            ? Array.isArray(json.data)
              ? json.data
              : []
            : [];
      } catch (e) {
        detailedError.value =
          e?.response?.data?.message ||
          e?.response?.data?.debug ||
          e?.message ||
          "Failed to load detailed reports.";
        detailedRows.value = [];
      } finally {
        detailedLoading.value = false;
      }
    }

    async function reloadOverview() {
      revenuePage.value = 1;
      detailedPage.value = 1;
      await loadOverview();
      await nextTick();
      resizeCharts();
    }
    async function reloadRevenue() {
      if (reportMode.value !== "driving") return;
      revenuePage.value = 1;
      await loadRevenue();
    }
    async function reloadDetailed() {
      detailedPage.value = 1;
      await loadDetailed();
    }

    async function setTrendPeriod(p) {
      trendPeriod.value = p;
      await loadOverview();
      await nextTick();
      resizeCharts();
    }

    function resizeCharts() {
      const a = getChartInstance(trendChartRef);
      const b = getChartInstance(topCoursesChartRef);
      const c = getChartInstance(genderChartRef);
      try { a?.resize?.(); } catch {}
      try { b?.resize?.(); } catch {}
      try { c?.resize?.(); } catch {}
    }

    // ECharts options
    const trendOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: { type: "category", data: trend.labels || [], axisLabel: { rotate: 0 } },
      yAxis: { type: "value" },
      series: [{ name: "Enrollments", type: "line", smooth: true, data: trend.values || [], areaStyle: {} }],
    }));

    const topCoursesOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 20, bottom: 60 },
      xAxis: { type: "category", data: topCourses.labels || [], axisLabel: { rotate: 35 } },
      yAxis: { type: "value" },
      series: [{ name: "Enrollments", type: "bar", data: topCourses.values || [] }],
    }));

    const genderOption = computed(() => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          name: "Gender",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: true,
          data: (gender.labels || []).map((lbl, i) => ({ name: lbl, value: Number(gender.values?.[i] || 0) })),
        },
      ],
    }));

    // ✅ FIXED: PNG export uses getEchartsInstance()
    function downloadChartImage(which) {
      const refMap = {
        trend: trendChartRef,
        topCourses: topCoursesChartRef,
        gender: genderChartRef,
      };
      const targetRef = refMap[which];
      const instance = getChartInstance(targetRef);
      if (!instance) return;

      const dataUrl = instance.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `${which}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    }

    // Computed: detailed filtered + pagination
    const detailedFiltered = computed(() => {
      let arr = Array.isArray(detailedRows.value) ? [...detailedRows.value] : [];
      const q = debouncedQuery.value;

      if (q) {
        arr = arr.filter((r) => {
          const hay = [
            r.lto_client_id,
            r.fullname,
            r.group_label,
            r.course_name,
            r.instructor_name,
            r.municipality,
            r.reservation_source,
            r.payment_method,
            r.dl_code,
            r.training_purpose,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        });
      }

      const s = detailedTabFilters.sort;
      const safeStr = (x) => String(x || "").toLowerCase();

      if (s === "created_desc") arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      else if (s === "created_asc") arr.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      else if (s === "name_asc") arr.sort((a, b) => safeStr(a.fullname || a.group_label).localeCompare(safeStr(b.fullname || b.group_label)));
      else if (s === "name_desc") arr.sort((a, b) => safeStr(b.fullname || b.group_label).localeCompare(safeStr(a.fullname || a.group_label)));

      return arr;
    });

    const detailedTotalPages = computed(() => Math.max(1, Math.ceil(detailedFiltered.value.length / detailedPageSize.value)));
    const detailedPageStart = computed(() => (detailedFiltered.value.length ? (detailedPage.value - 1) * detailedPageSize.value + 1 : 0));
    const detailedPageEnd = computed(() => Math.min(detailedFiltered.value.length, detailedPage.value * detailedPageSize.value));
    const detailedPaginated = computed(() => {
      const start = (detailedPage.value - 1) * detailedPageSize.value;
      return detailedFiltered.value.slice(start, start + detailedPageSize.value);
    });

    // Revenue filtered + pagination
    const revenueFiltered = computed(() => {
      let arr = Array.isArray(revenuePayments.value) ? [...revenuePayments.value] : [];
      const q = debouncedQuery.value;
      if (q) {
        arr = arr.filter((p) => {
          const hay = [p.fullname, p.course_name, p.payment_method].filter(Boolean).join(" ").toLowerCase();
          return hay.includes(q);
        });
      }
      return arr;
    });

    const revenueTotalPages = computed(() => Math.max(1, Math.ceil(revenueFiltered.value.length / revenuePageSize.value)));
    const revenuePageStart = computed(() => (revenueFiltered.value.length ? (revenuePage.value - 1) * revenuePageSize.value + 1 : 0));
    const revenuePageEnd = computed(() => Math.min(revenueFiltered.value.length, revenuePage.value * revenuePageSize.value));
    const revenuePaginated = computed(() => {
      const start = (revenuePage.value - 1) * revenuePageSize.value;
      return revenueFiltered.value.slice(start, start + revenuePageSize.value);
    });

    function makePageButtons(current, total, maxButtons = 5) {
      if (total <= maxButtons) return Array.from({ length: total }, (_, i) => i + 1);
      const half = Math.floor(maxButtons / 2);
      let start = Math.max(1, current - half);
      let end = Math.min(total, start + maxButtons - 1);
      start = Math.max(1, end - maxButtons + 1);
      const pages = [];
      for (let i = start; i <= end; i++) pages.push(i);
      return pages;
    }

    const detailedPageButtons = computed(() => makePageButtons(detailedPage.value, detailedTotalPages.value, 5));
    const revenuePageButtons = computed(() => makePageButtons(revenuePage.value, revenueTotalPages.value, 5));

    watch(detailedTotalPages, (tp) => {
      const total = Number(tp || 1);
      if (detailedPage.value > total) detailedPage.value = total;
      if (detailedPage.value < 1) detailedPage.value = 1;
    });

    watch(revenueTotalPages, (tp) => {
      const total = Number(tp || 1);
      if (revenuePage.value > total) revenuePage.value = total;
      if (revenuePage.value < 1) revenuePage.value = 1;
    });

    watch(debouncedQuery, () => {
      revenuePage.value = 1;
      detailedPage.value = 1;
    });

    // ✅ When tab changes, load based on mode
    watch(activeTab, async (newTab) => {
      if (newTab === "overview") {
        await nextTick();
        resizeCharts();
      } else if (newTab === "revenue") {
        if (reportMode.value === "driving") loadRevenue();
        else activeTab.value = "overview";
      } else if (newTab === "detailed") {
        loadDetailed();
      } else if (newTab === "exams") {
        if (reportMode.value !== "driving") activeTab.value = "overview";
      }
    });

    // ✅ When switching mode:
    watch(reportMode, async () => {
      if (activeTab.value === "revenue" || activeTab.value === "exams") activeTab.value = "overview";

      overviewError.value = "";
      revenueError.value = "";
      detailedError.value = "";

      await loadOverview();
      await loadDetailed();
      await nextTick();
      resizeCharts();

      if (reportMode.value === "driving") await loadRevenue();
      else {
        revenueStats.verifiedCount = 0;
        revenueStats.avgFeePeso = 0;
        revenueStats.verifiedRevenuePeso = 0;
        revenueStats.forecastRevenuePeso = 0;
        revenuePayments.value = [];
        summary.totalRevenuePeso = 0;
      }
    });

    // Column presets
    function applyColumnPreset(preset) {
      if (preset === "pdc") {
        Object.assign(visibleColumns, {
          lto_client_id: true,
          fullname: true,
          birthday: true,
          gender: true,
          instructor_name: true,
          course_name: false,
          course_start: true,
          course_end: true,
          dl_code: true,
          training_purpose: true,
          municipality: false,
          reservation_source: false,
          payment_method: false,
          created_at: false,
        });
        return;
      }
      if (preset === "minimal") {
        Object.assign(visibleColumns, {
          lto_client_id: true,
          fullname: true,
          birthday: false,
          gender: false,
          instructor_name: false,
          course_name: true,
          course_start: true,
          course_end: false,
          dl_code: false,
          training_purpose: false,
          municipality: false,
          reservation_source: false,
          payment_method: false,
          created_at: false,
        });
        return;
      }
      if (preset === "all") {
        for (const k of Object.keys(visibleColumns)) visibleColumns[k] = true;
      }
    }

    // ===================== EXPORT BUILDER =====================
    const exportOpen = ref(false);
    const exportTarget = ref("all");
    const exportFormat = ref("xlsx");
    const exportScope = ref("all");
    const exportCourseId = ref("");
    const exportTemplate = ref("custom");
    const exportFileName = ref(`reports-${new Date().toISOString().slice(0, 10)}`);
    const exportError = ref("");

    const exportColumnOptions = computed(() => {
      if (exportTarget.value === "revenue") {
        return [
          { key: "fullname", label: "Student" },
          { key: "course_name", label: "Course" },
          { key: "payment_method", label: "Method" },
          { key: "amount_peso", label: "Amount" },
          { key: "created_at", label: "Created" },
        ];
      }
      // IMPORTANT: columnOptions is a computed ref; return the ARRAY value.
      // Returning the ref itself causes `forEach is not a function`.
      return columnOptions.value;
    });

    const exportColumns = reactive({});
    function initExportColumnsFromVisible() {
      exportColumnOptions.value.forEach((c) => {
        if (exportTarget.value === "detailed") exportColumns[c.key] = !!visibleColumns[c.key];
        else exportColumns[c.key] = true;
      });
    }

    function openExport(target) {
      exportError.value = "";
      exportOpen.value = true;

      let normalized = target === "all" ? "all" : (target || "all");
      if (reportMode.value !== "driving" && normalized === "revenue") normalized = "overview";
      exportTarget.value = normalized;

      exportFormat.value = "xlsx";
      exportScope.value = "all";
      exportCourseId.value = "";
      exportTemplate.value = exportTarget.value === "detailed" ? "pdc" : "custom";
      exportFileName.value = `${exportTarget.value}-export-${new Date().toISOString().slice(0, 10)}`;

      for (const k of Object.keys(exportColumns)) delete exportColumns[k];
      initExportColumnsFromVisible();

      if (exportTarget.value === "detailed" && exportTemplate.value !== "custom") {
        applyExportTemplate(exportTemplate.value);
      }
    }

    watch(exportTemplate, (v) => {
      if (exportTarget.value !== "detailed") return;
      if (v === "custom") return;
      applyExportTemplate(v);
    });

    function applyExportTemplate(tpl) {
      if (exportTarget.value !== "detailed") return;

      exportColumnOptions.value.forEach((c) => (exportColumns[c.key] = false));

      if (tpl === "pdc") {
        const keys = ["lto_client_id", "fullname", "birthday", "gender", "instructor_name", "course_start", "course_end", "dl_code", "training_purpose"];
        keys.forEach((k) => (exportColumns[k] = true));
      } else if (tpl === "minimal") {
        const keys = ["lto_client_id", "fullname", "course_name", "course_start"];
        keys.forEach((k) => (exportColumns[k] = true));
      }
    }

    function selectExportColumns(mode) {
      if (mode === "all") exportColumnOptions.value.forEach((c) => (exportColumns[c.key] = true));
      else if (mode === "none") exportColumnOptions.value.forEach((c) => (exportColumns[c.key] = false));
      else if (mode === "fromVisible") initExportColumnsFromVisible();
    }

    function pickRowsForExport(target) {
      const overrideCourse = String(exportCourseId.value || "").trim();

      if (target === "detailed") {
        let base = detailedFiltered.value;
        if (overrideCourse) base = base.filter((r) => String(r.course_id || r.courseId || "") === overrideCourse || String(r.course_id || "") === overrideCourse);
        const rows = exportScope.value === "page" ? detailedPaginated.value : base;
        return rows;
      }

      if (target === "revenue") {
        if (reportMode.value !== "driving") return [];
        let base = revenueFiltered.value;
        if (overrideCourse) base = base.filter((r) => String(r.course_id || r.courseId || "") === overrideCourse || String(r.course_id || "") === overrideCourse);
        const rows = exportScope.value === "page" ? revenuePaginated.value : base;
        return rows;
      }

      return [];
    }

    function selectedColumnDefs() {
      const defs = exportColumnOptions.value.filter((c) => !!exportColumns[c.key]);
      return defs.length ? defs : exportColumnOptions.value;
    }

    function valueForCell(row, key) {
      if (!row) return "";
      if (key === "birthday") return row.birthday ? formatDateShort(row.birthday) : "";
      if (key === "gender") return row.gender ? (String(row.gender).toLowerCase() === "male" ? "M" : "F") : "";
      if (key === "course_start") return row.course_start ? formatDate(row.course_start) : "";
      if (key === "course_end") return row.course_end ? formatDate(row.course_end) : "";
      if (key === "created_at") return row.created_at ? formatDate(row.created_at) : "";
      if (key === "payment_method") return normalizePaymentMethod(row.payment_method) || "";
      if (key === "amount_peso") return Number(row.amount_peso || 0);
      return row[key] ?? "";
    }

    function exportXlsx(tables, filename) {
      const wb = XLSX.utils.book_new();
      for (const t of tables) {
        const ws = XLSX.utils.aoa_to_sheet([t.headers, ...t.rows]);
        XLSX.utils.book_append_sheet(wb, ws, t.sheetName.slice(0, 31));
      }
      XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    function exportCsv(table, filename) {
      const esc = (v) => {
        const s = String(v ?? "");
        if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [table.headers.map(esc).join(",")];
      for (const r of table.rows) lines.push(r.map(esc).join(","));
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportPdf(table, filename) {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      doc.setFontSize(12);
      doc.text(filename, 40, 30);

      autoTable(doc, {
        startY: 50,
        head: [table.headers],
        body: table.rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [230, 230, 230] },
      });

      doc.save(`${filename}.pdf`);
    }

    function buildTableFromRows(rows, defs) {
      const headers = defs.map((d) => d.label);
      const mapped = rows.map((r) => defs.map((d) => valueForCell(r, d.key)));
      return { headers, rows: mapped };
    }

    function runExport() {
      exportError.value = "";
      try {
        const target = exportTarget.value;

        if (target === "overview" || target === "all") {
          const tables = [];

          tables.push({
            sheetName: "Trend",
            headers: ["Label", "Enrollments"],
            rows: (trend.labels || []).map((l, i) => [l, Number(trend.values?.[i] || 0)]),
          });

          tables.push({
            sheetName: "Top Courses",
            headers: ["Course", "Enrollments"],
            rows: (topCourses.labels || []).map((l, i) => [l, Number(topCourses.values?.[i] || 0)]),
          });

          tables.push({
            sheetName: "Gender",
            headers: ["Gender", "Count"],
            rows: (gender.labels || []).map((l, i) => [l, Number(gender.values?.[i] || 0)]),
          });

          tables.push({
            sheetName: "Course Monthly",
            headers: ["Month", "Course", "Enrollments"],
            rows: (courseMonthlyPreview.value || []).map((r) => [r.month_label || "", r.course_name || "", Number(r.count || 0)]),
          });

          if (target === "overview") {
            return exportMulti(tables, exportFileName.value);
          }
          exportMulti(tables, `${exportFileName.value}-overview`);
        }

        if ((target === "revenue" || target === "all") && reportMode.value === "driving") {
          const rows = pickRowsForExport("revenue");
          const defs = selectedColumnDefs();
          const table = buildTableFromRows(rows, defs);
          if (target === "revenue") return exportSingle(table, exportFileName.value);
          exportSingle(table, `${exportFileName.value}-revenue`);
        }

        if (target === "detailed" || target === "all") {
          const rows = pickRowsForExport("detailed");
          const defs = selectedColumnDefs();
          const table = buildTableFromRows(rows, defs);
          if (target === "detailed") return exportSingle(table, exportFileName.value);
          exportSingle(table, `${exportFileName.value}-detailed`);
        }

        exportOpen.value = false;
      } catch (e) {
        exportError.value = e?.message || "Export failed.";
      }
    }

    function exportSingle(table, filename) {
      if (exportFormat.value === "xlsx") return exportXlsx([{ sheetName: "Export", ...table }], filename);
      if (exportFormat.value === "csv") return exportCsv(table, filename);
      if (exportFormat.value === "pdf") return exportPdf(table, filename);
      throw new Error("Unsupported export format.");
    }

    function exportMulti(tables, filename) {
      if (exportFormat.value === "xlsx") return exportXlsx(tables, filename);
      if (exportFormat.value === "csv") return exportCsv({ headers: tables[0].headers, rows: tables[0].rows }, `${filename}-trend-only`);
      if (exportFormat.value === "pdf") return exportPdf({ headers: tables[0].headers, rows: tables[0].rows }, `${filename}-trend-only`);
      throw new Error("Unsupported export format.");
    }

    // Lifecycle
    onMounted(async () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      overviewFilters.customFrom = "2000-01-01";
      overviewFilters.customTo = toISODateLocal(today);

      revenueTabFilters.customFrom = toISODateLocal(lastMonth);
      revenueTabFilters.customTo = toISODateLocal(today);

      detailedTabFilters.customFrom = toISODateLocal(lastMonth);
      detailedTabFilters.customTo = toISODateLocal(today);

      await loadCourses();
      await loadOverview();
      await loadDetailed();
      if (reportMode.value === "driving") await loadRevenue();
      await nextTick();
      resizeCharts();
    });

    onUnmounted(() => {
      clearTimeout(t);
    });

    return {
      // mode
      reportMode,
      reportModeLabel,
      toggleReportMode,
      tesdaKpiLabel,

      // UI
      activeTab,
      examOpen,
      columnsOpen,
      tabActive,
      tabInactive,
      btnActive,
      btnInactive,

      // search
      searchQuery,

      // filters
      overviewFilters,
      revenueTabFilters,
      detailedTabFilters,

      // config
      trendPeriod,
      forecastHorizon,

      // data
      courses,
      summary,
      trend,
      topCourses,
      gender,
      courseMonthlyPreview,
      forecast,
      revenueStats,
      revenuePayments,
      detailedRows,

      // states
      overviewLoading,
      revenueLoading,
      detailedLoading,
      overviewError,
      revenueError,
      detailedError,

      // charts
      trendChartRef,
      topCoursesChartRef,
      genderChartRef,
      trendOption,
      topCoursesOption,
      genderOption,

      // helpers
      normalizePaymentMethod,
      formatCurrency,
      formatDate,
      formatDateShort,
      lastUpdated,
      courseNameById,

      // actions
      reloadOverview,
      reloadRevenue,
      reloadDetailed,
      setTrendPeriod,
      downloadChartImage,

      // detailed table
      columnOptions,
      visibleColumns,
      detailedColspanComputed,
      detailedFiltered,
      detailedPaginated,
      detailedPage,
      detailedPageSize,
      detailedTotalPages,
      detailedPageStart,
      detailedPageEnd,
      detailedPageButtons,

      // revenue table
      revenueFiltered,
      revenuePaginated,
      revenuePage,
      revenuePageSize,
      revenueTotalPages,
      revenuePageStart,
      revenuePageEnd,
      revenuePageButtons,

      // columns preset
      applyColumnPreset,

      // export modal
      exportOpen,
      exportTarget,
      exportFormat,
      exportScope,
      exportCourseId,
      exportTemplate,
      exportFileName,
      exportError,
      exportColumns,
      exportColumnOptions,
      openExport,
      runExport,
      selectExportColumns,

      // exams
      examStats,
    };
  },
};
</script>