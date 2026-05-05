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
        </div>
      </div>

      <!-- TOP SUMMARY -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-green-50 p-4 rounded-lg border border-green-100">
          <p class="text-sm text-green-700 font-medium">Total Enrolled</p>
          <h3 class="text-2xl font-bold text-green-800 mt-1">{{ summary.totalEnrolled }}</h3>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p class="text-sm text-blue-700 font-medium">Most Popular Course</p>
          <h3 class="text-lg font-bold text-blue-800 mt-1">{{ summary.mostPopularCourse || "-" }}</h3>
        </div>

        <!-- ✅ DRIVING ONLY: REVENUE CARD -->
        <div v-if="reportMode === 'driving'" class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <p class="text-sm text-emerald-700 font-medium">💰 Verified Revenue</p>
          <h3 class="text-2xl font-bold text-emerald-800 mt-1">
            {{ formatCurrency(summary.totalRevenuePeso) }}
          </h3>
        </div>

        <!-- ✅ TESDA ONLY: Attendance placeholder/stat (optional) -->
        <div v-else class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <p class="text-sm text-emerald-700 font-medium">📌 TESDA KPI</p>
          <h3 class="text-2xl font-bold text-emerald-800 mt-1">
            {{ tesdaKpiLabel }}
          </h3>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p class="text-sm text-purple-700 font-medium">🔮 {{ forecastTitle }}</p>
          <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ forecast.nextForecast }}</h3>
          <p class="text-xs text-gray-500 mt-1">Range: {{ forecast.low }}–{{ forecast.high }}</p>
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

        <!-- ✅ DRIVING ONLY: Issued Certificates -->
        <button
          v-if="reportMode === 'driving'"
          class="px-3 py-2 rounded-md text-sm font-medium border"
          :class="activeTab==='exams' ? tabActive : tabInactive"
          @click="activeTab='exams'"
        >
          Issued Certificates
        </button>
      </div>

      <!-- ===================== OVERVIEW ===================== -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <!-- OVERVIEW FILTERS -->
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
              <div class="w-56">
                <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select v-model="overviewFilters.dateRange" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="allMonths">All Months</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom</option>
                </select>
                <div v-if="overviewFilters.dateRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
                  <input v-model="overviewFilters.customFrom" type="date" class="p-2 border border-gray-300 rounded-md text-xs" />
                  <input v-model="overviewFilters.customTo" type="date" class="p-2 border border-gray-300 rounded-md text-xs" />
                </div>
              </div>

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
                  <option
                    v-for="option in forecastHorizonOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
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
              </div>
              <button
                @click="openExport('overview-trend')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export Trend
              </button>
            </div>

            <div class="h-64">
              <VChart ref="trendChartRef" :option="trendOption" autoresize />
            </div>

            <div class="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p v-if="overviewLoading" class="text-xs text-gray-500 mt-2">Loading overview…</p>
            </div>
          </div>

          <!-- Top Courses -->
          <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 class="text-green-800 font-semibold">Top Courses</h3>
              </div>
              <button
                @click="openExport('overview-top-courses')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export Courses
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
              </div>
              <button
                @click="openExport('overview-gender')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export Gender
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
              </div>

              <button
                @click="openExport('overview-monthly')"
                class="text-xs px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                📤 Export Monthly
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

          </div>
        </div>
      </div>

      <!-- ===================== REVENUE (DRIVING ONLY) ===================== -->
      <div v-else-if="activeTab === 'revenue' && reportMode === 'driving'" class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h3 class="text-green-800 font-semibold">💰 Revenue Analytics</h3>
            </div>

            <div class="flex flex-wrap gap-3 items-end">
              <div class="w-52">
                <label class="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <select v-model="revenueTabFilters.dateRange" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="allMonths">All Months</option>
                  <option value="custom">Custom</option>
                </select>
                <div v-if="revenueTabFilters.dateRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
                  <input v-model="revenueTabFilters.customFrom" type="date" class="p-2 border border-gray-300 rounded-md text-xs" />
                  <input v-model="revenueTabFilters.customTo" type="date" class="p-2 border border-gray-300 rounded-md text-xs" />
                </div>
              </div>

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
              <p class="text-sm text-purple-700 font-medium">Forecast Revenue ({{ forecastPeriodLabel }})</p>
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
        <!-- DRIVING: month-only detailed certificate-style report -->
        <template v-if="reportMode === 'driving'">
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div class="flex flex-wrap gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Report Month</label>
                  <input
                    v-model="detailedMonth"
                    type="month"
                    class="w-48 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select v-model="detailedTabFilters.courseId" class="w-64 p-2 border border-gray-300 rounded-md text-sm">
                    <option value="">All courses</option>
                    <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                      {{ c.course_name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 items-end">
                <button @click="reloadDetailed()" class="text-sm px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">
                  Apply
                </button>

                <button @click="openExport('detailed')" class="text-sm px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                  📤 Export Detailed
                </button>
              </div>
            </div>

            <div v-if="detailedError" class="mt-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
              {{ detailedError }}
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-green-800">📋 Detailed Reports</h3>
                <p class="text-xs text-gray-500">
                  Showing {{ detailedFiltered.length }} record{{ detailedFiltered.length === 1 ? '' : 's' }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2 items-end">
                <button @click="openExport('detailed')" class="text-sm px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                  📤 Export Detailed
                </button>
              </div>
            </div>

            <div v-if="detailedLoading" class="mb-4 py-3 text-center text-gray-500 border rounded-lg bg-gray-50">
              Loading detailed reports…
            </div>

            <div v-if="!detailedLoading && detailedFiltered.length === 0" class="mb-4 py-3 text-center text-gray-500 border rounded-lg bg-gray-50">
              No data for your filters
            </div>

            <div class="space-y-6">
              <!-- TDC Preview -->
              <div class="mx-auto bg-white border border-gray-300 rounded-lg p-4 overflow-x-auto">
                <div class="min-w-[980px]">
                  <div class="relative text-center mb-3">
                    <img src="/facet-logo.png" alt="FACET Logo" class="absolute left-6 top-0 w-16 h-16 object-contain" />
                    <img src="/lto-logo.png" alt="LTO Logo" class="absolute right-6 top-0 w-16 h-16 object-contain" />

                    <p class="text-[11px] font-bold text-black">First Asian Cognizance Executive Training Institute (FACET Institute) Corp.</p>
                    <p class="text-[10px] font-semibold text-black">Holy Spirit, Barcenaga, Naujan, Oriental Mindoro</p>
                    <p class="text-[10px] font-semibold text-black">LTO ACCREDITATION NUMBER : DS-2022-00002-04</p>
                    <h4 class="mt-1 text-xs font-extrabold text-black uppercase">THEORETICAL DRIVING COURSE (TDC)</h4>
                    <p class="text-xs font-extrabold text-red-700 uppercase mt-2">{{ detailedReportMonthLabel }}</p>
                  </div>

                  <table class="w-full border border-black text-[10px]">
                    <thead>
                      <tr class="bg-blue-100">
                        <th class="border border-black px-1 py-1 w-10">No.</th>
                        <th class="border border-black px-1 py-1 w-28">Client ID</th>
                        <th class="border border-black px-1 py-1">Full Name</th>
                        <th class="border border-black px-1 py-1 w-24">Birthdate<br />(MM/DD/YY)</th>
                        <th class="border border-black px-1 py-1 w-12">Sex<br />(M/F)</th>
                        <th class="border border-black px-1 py-1 w-40">Instructor Name</th>
                        <th class="border border-black px-1 py-1 w-20">Course<br />Start</th>
                        <th class="border border-black px-1 py-1 w-20">Course<br />End</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, idx) in detailedTdcRows" :key="`tdc-${row.reservation_id || idx}`">
                        <td class="border border-black px-1 py-1 text-center">{{ idx + 1 }}</td>
                        <td class="border border-black px-1 py-1">{{ row.lto_client_id || '-' }}</td>
                        <td class="border border-black px-1 py-1 font-semibold">{{ row.fullname || row.group_label || '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ row.birthday ? formatDateShort(row.birthday) : '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ row.gender ? (String(row.gender).toLowerCase().startsWith('m') ? 'M' : 'F') : '-' }}</td>
                        <td class="border border-black px-1 py-1">{{ row.instructor_name || row.trainer_name || '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ (row.course_start || row.schedule_date) ? formatDateShort(row.course_start || row.schedule_date) : '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ (row.course_end || row.schedule_date) ? formatDateShort(row.course_end || row.schedule_date) : '-' }}</td>
                      </tr>

                      <tr v-if="detailedTdcRows.length === 0">
                        <td colspan="8" class="border border-black px-2 py-6 text-center text-gray-500">No TDC records</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- PDC Preview -->
              <div class="mx-auto bg-white border border-gray-300 rounded-lg p-4 overflow-x-auto">
                <div class="min-w-[1080px]">
                  <div class="relative text-center mb-3">
                    <img src="/facet-logo.png" alt="FACET Logo" class="absolute left-6 top-0 w-16 h-16 object-contain" />
                    <img src="/lto-logo.png" alt="LTO Logo" class="absolute right-6 top-0 w-16 h-16 object-contain" />

                    <p class="text-[11px] font-bold text-black">First Asian Cognizance Executive Training Institute (FACET Institute) Corp.</p>
                    <p class="text-[10px] font-semibold text-black">Holy Spirit, Barcenaga, Naujan, Oriental Mindoro</p>
                    <p class="text-[10px] font-semibold text-black">LTO ACCREDITATION NUMBER : DS-2022-00002-04</p>
                    <h4 class="mt-1 text-xs font-extrabold text-black uppercase">PRACTICAL DRIVING COURSE (PDC)</h4>
                    <p class="text-xs font-extrabold text-red-700 uppercase mt-2">{{ detailedReportMonthLabel }}</p>
                  </div>

                  <table class="w-full border border-black text-[10px]">
                    <thead>
                      <tr class="bg-blue-100">
                        <th class="border border-black px-1 py-1 w-9">No.</th>
                        <th class="border border-black px-1 py-1 w-28">Client ID</th>
                        <th class="border border-black px-1 py-1">Full Name</th>
                        <th class="border border-black px-1 py-1 w-24">Birthdate<br />(MM/DD/YY)</th>
                        <th class="border border-black px-1 py-1 w-10">Sex<br />(M/F)</th>
                        <th class="border border-black px-1 py-1 w-40">Instructor Name</th>
                        <th class="border border-black px-1 py-1 w-20">Course<br />Start</th>
                        <th class="border border-black px-1 py-1 w-20">Course<br />End</th>
                        <th class="border border-black px-1 py-1 w-14">DL<br />Code</th>
                        <th class="border border-black px-1 py-1 w-24">Training<br />Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, idx) in detailedPdcRows" :key="`pdc-${row.reservation_id || idx}`">
                        <td class="border border-black px-1 py-1 text-center">{{ idx + 1 }}</td>
                        <td class="border border-black px-1 py-1">{{ row.lto_client_id || '-' }}</td>
                        <td class="border border-black px-1 py-1 font-semibold">{{ row.fullname || row.group_label || '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ row.birthday ? formatDateShort(row.birthday) : '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ row.gender ? (String(row.gender).toLowerCase().startsWith('m') ? 'M' : 'F') : '-' }}</td>
                        <td class="border border-black px-1 py-1">{{ row.instructor_name || row.trainer_name || '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ (row.course_start || row.schedule_date) ? formatDateShort(row.course_start || row.schedule_date) : '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ (row.course_end || row.schedule_date) ? formatDateShort(row.course_end || row.schedule_date) : '-' }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ normalizeDLCode(row.dl_code) }}</td>
                        <td class="border border-black px-1 py-1 text-center">{{ shortTrainingPurpose(row.training_purpose) }}</td>
                      </tr>

                      <tr v-if="detailedPdcRows.length === 0">
                        <td colspan="10" class="border border-black px-2 py-6 text-center text-gray-500">No PDC records</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- TESDA: original detailed table behavior -->
        <template v-else>
          <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div class="flex flex-wrap gap-4">
                <div class="w-52">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <select v-model="detailedTabFilters.dateRange" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="thisYear">This Year</option>
                    <option value="allMonths">All Months</option>
                    <option value="custom">Custom</option>
                  </select>
                  <div v-if="detailedTabFilters.dateRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
                    <input v-model="detailedTabFilters.customFrom" type="date" class="p-2 border border-gray-300 rounded-md text-xs" />
                    <input v-model="detailedTabFilters.customTo" type="date" class="p-2 border border-gray-300 rounded-md text-xs" />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select v-model="detailedTabFilters.courseId" class="w-56 p-2 border border-gray-300 rounded-md text-sm">
                    <option value="">All</option>
                    <option v-for="c in courses" :key="c.id" :value="String(c.id)">{{ c.course_name }}</option>
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
                <button @click="reloadDetailed()" class="text-sm px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800">Apply</button>
                <button @click="openExport('detailed')" class="text-sm px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">📤 Export Detailed</button>
                <button @click="columnsOpen = !columnsOpen" class="text-sm px-3 py-2 border rounded hover:bg-gray-50">{{ columnsOpen ? 'Hide' : 'Show' }} Columns</button>
              </div>
            </div>

            <div v-if="columnsOpen" class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs text-gray-600 font-semibold">Column visibility</p>
                <div class="flex gap-2">
                  <button @click="applyColumnPreset('minimal')" class="text-xs px-3 py-2 border rounded hover:bg-white">Minimal</button>
                  <button @click="applyColumnPreset('all')" class="text-xs px-3 py-2 border rounded hover:bg-white">Show all</button>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-4 text-sm">
                <label v-for="col in columnOptions" :key="col.key" class="inline-flex items-center gap-2">
                  <input type="checkbox" v-model="visibleColumns[col.key]" />
                  <span>{{ col.label }}</span>
                </label>
              </div>
            </div>

            <div v-if="detailedError" class="mt-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{{ detailedError }}</div>
          </div>

          <div class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <div class="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-green-800">📋 Detailed Reports</h3>
                <p class="text-xs text-gray-500">Showing {{ detailedPageStart }}–{{ detailedPageEnd }} of {{ detailedFiltered.length }}</p>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Rows per page</label>
                <select v-model.number="detailedPageSize" class="w-28 p-2 border border-gray-300 rounded-md text-sm">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
            </div>

            <table class="min-w-full border border-gray-200 text-sm">
              <thead class="bg-gray-200 text-gray-900">
                <tr>
                  <th class="py-2 px-3 text-left">No.</th>
                  <th v-if="visibleColumns.fullname" class="py-2 px-3 text-left">Full Name</th>
                  <th v-if="visibleColumns.birthday" class="py-2 px-3 text-left">Birthdate</th>
                  <th v-if="visibleColumns.gender" class="py-2 px-3 text-left">Sex</th>
                  <th v-if="visibleColumns.instructor_name" class="py-2 px-3 text-left">Trainer</th>
                  <th v-if="visibleColumns.course_name" class="py-2 px-3 text-left">Course</th>
                  <th v-if="visibleColumns.course_start" class="py-2 px-3 text-left">Course Start</th>
                  <th v-if="visibleColumns.course_end" class="py-2 px-3 text-left">Course End</th>
                  <th v-if="visibleColumns.reservation_source" class="py-2 px-3 text-left">Source</th>
                  <th v-if="visibleColumns.created_at" class="py-2 px-3 text-left">Created</th>
                  <th v-if="visibleColumns.nationality" class="py-2 px-3 text-left">Nationality</th>
                  <th v-if="visibleColumns.civil_status" class="py-2 px-3 text-left">Civil Status</th>
                  <th v-if="visibleColumns.address" class="py-2 px-3 text-left">Address</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(row, idx) in detailedPaginated" :key="row.reservation_id || row.group_key || idx" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-2 px-3">{{ detailedPageStart + idx }}</td>
                  <td v-if="visibleColumns.fullname" class="py-2 px-3">{{ row.fullname || row.group_label || '-' }}</td>
                  <td v-if="visibleColumns.birthday" class="py-2 px-3">{{ row.birthday ? formatDateShort(row.birthday) : '-' }}</td>
                  <td v-if="visibleColumns.gender" class="py-2 px-3">{{ row.gender ? (String(row.gender).toLowerCase() === 'male' ? 'M' : 'F') : '-' }}</td>
                  <td v-if="visibleColumns.instructor_name" class="py-2 px-3">{{ row.trainer_name || row.instructor_name || '-' }}</td>
                  <td v-if="visibleColumns.course_name" class="py-2 px-3">{{ row.course_name || '-' }}</td>
                  <td v-if="visibleColumns.course_start" class="py-2 px-3">{{ (row.course_start || row.schedule_date) ? formatDate(row.course_start || row.schedule_date) : '-' }}</td>
                  <td v-if="visibleColumns.course_end" class="py-2 px-3">{{ (row.course_end || row.schedule_date) ? formatDate(row.course_end || row.schedule_date) : '-' }}</td>
                  <td v-if="visibleColumns.reservation_source" class="py-2 px-3">{{ row.reservation_source || '-' }}</td>
                  <td v-if="visibleColumns.created_at" class="py-2 px-3">{{ row.created_at ? formatDate(row.created_at) : '-' }}</td>
                  <td v-if="visibleColumns.nationality" class="py-2 px-3">{{ row.nationality || '-' }}</td>
                  <td v-if="visibleColumns.civil_status" class="py-2 px-3">{{ row.civil_status || '-' }}</td>
                  <td v-if="visibleColumns.address" class="py-2 px-3">{{ row.address || '-' }}</td>
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
              <button class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50" :disabled="detailedPage === 1" @click="detailedPage--">← Prev</button>
              <div class="flex gap-1 flex-wrap justify-center">
                <button v-for="p in detailedPageButtons" :key="p" class="px-3 py-2 border rounded text-sm" :class="p === detailedPage ? 'bg-green-700 text-white border-green-700' : 'hover:bg-gray-50'" @click="detailedPage = p">{{ p }}</button>
              </div>
              <button class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50" :disabled="detailedPage === detailedTotalPages" @click="detailedPage++">Next →</button>
            </div>
          </div>
        </template>
      </div>

      <!-- ===================== ISSUED CERTIFICATES (DRIVING ONLY) ===================== -->
      <div v-else class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h3 class="text-green-800 font-bold text-lg">📄 Issued Certificates of Completion</h3>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-end gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Report Month</label>
                <input
                  v-model="certificateMonth"
                  type="month"
                  class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <button
                @click="reloadCertificateReport()"
                class="text-sm px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
              >
                Apply
              </button>
              <button
                @click="exportCertificateReport()"
                class="text-sm px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                📤 Export
              </button>
            </div>
          </div>

          <div class="max-w-4xl mx-auto bg-white border border-gray-300 rounded-lg p-6 overflow-x-auto">
            <div class="min-w-[720px]">
              <!-- Header -->
              <div class="relative text-center mb-5">
                <img src="/facet-logo.png" alt="FACET Logo" class="absolute left-0 top-0 w-14 h-14 object-contain" />
                <p class="text-sm font-bold text-red-700">
                  First Asian Cognizance Executive Training Institute (FACET Institute) Corp.
                </p>
                <p class="text-xs font-semibold text-red-600">Holy Spirit, Barcenaga, Naujan, Oriental Mindoro</p>
                <h4 class="mt-4 text-sm font-extrabold text-black uppercase leading-tight">
                  Total No. of Issued Certificates of Completion<br />
                  for Theoretical and Practical Driving Course
                </h4>
                <p class="text-xs font-semibold mt-1">LTO Regional Office No. 4B</p>
                <p class="text-xs">
                  For the Month of
                  <span class="font-bold uppercase">{{ certificateReport.monthLabel }}</span>
                </p>
              </div>

              <!-- Summary -->
              <table class="w-full border border-black text-xs mb-7">
                <thead>
                  <tr class="bg-[#c9c19a]">
                    <th class="border border-black px-2 py-1 text-left"></th>
                    <th class="border border-black px-2 py-1 text-center w-36">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="border border-black px-2 py-1 font-bold">A. Theoretical Driving Course (TDC)</td>
                    <td class="border border-black px-2 py-1 text-center">{{ certificateReport.tdcTotal }}</td>
                  </tr>
                  <tr>
                    <td class="border border-black px-2 py-1 font-bold">B. Practical Driving Course(PDC)</td>
                    <td class="border border-black px-2 py-1 text-center">{{ certificateReport.pdcTotal }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- TDC -->
              <h4 class="text-center text-sm font-bold mb-1">Theoretical Driving Course (TDC)</h4>
              <table class="w-3/4 mx-auto border border-black text-xs mb-8">
                <thead>
                  <tr class="bg-[#c9c19a]">
                    <th class="border border-black px-2 py-1">Categories</th>
                    <th class="border border-black px-2 py-1 w-40">No. of Issued<br />Certificates</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="bg-blue-100"><td colspan="2" class="border border-black px-2 py-1 font-bold">By Sex</td></tr>
                  <tr><td class="border border-black px-2 py-1">Male</td><td class="border border-black px-2 py-1 text-center">{{ certificateReport.tdc.sex.Male }}</td></tr>
                  <tr><td class="border border-black px-2 py-1">Female</td><td class="border border-black px-2 py-1 text-center">{{ certificateReport.tdc.sex.Female }}</td></tr>
                  <tr><td class="border border-black px-2 py-1 text-right font-bold">Total</td><td class="border border-black px-2 py-1 text-center font-bold">{{ certificateReport.tdcTotal }}</td></tr>
                </tbody>
              </table>

              <!-- PDC -->
              <h4 class="text-center text-sm font-bold mb-1">Practical Driving Course (PDC)</h4>
              <table class="w-3/4 mx-auto border border-black text-xs mb-7">
                <thead>
                  <tr class="bg-[#c9c19a]">
                    <th class="border border-black px-2 py-1">Categories</th>
                    <th class="border border-black px-2 py-1 w-40">No. of Issued<br />Certificates</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="bg-blue-100"><td colspan="2" class="border border-black px-2 py-1 font-bold">By Sex</td></tr>
                  <tr><td class="border border-black px-2 py-1">Male</td><td class="border border-black px-2 py-1 text-center">{{ certificateReport.pdc.sex.Male }}</td></tr>
                  <tr><td class="border border-black px-2 py-1">Female</td><td class="border border-black px-2 py-1 text-center">{{ certificateReport.pdc.sex.Female }}</td></tr>
                  <tr><td class="border border-black px-2 py-1 text-right font-bold">Total</td><td class="border border-black px-2 py-1 text-center font-bold">{{ certificateReport.pdcTotal }}</td></tr>

                  <tr class="bg-blue-100"><td colspan="2" class="border border-black px-2 py-1 font-bold">By Training Purpose</td></tr>
                  <tr v-for="row in certificateReport.trainingPurposeRows" :key="row.label">
                    <td class="border border-black px-2 py-1">{{ row.label }}</td>
                    <td class="border border-black px-2 py-1 text-center">{{ row.count }}</td>
                  </tr>
                  <tr><td class="border border-black px-2 py-1 text-right font-bold">Total</td><td class="border border-black px-2 py-1 text-center font-bold">{{ certificateReport.pdcTotal }}</td></tr>
                </tbody>
              </table>

              <!-- DL Code -->
              <table class="w-3/4 mx-auto border border-black text-xs">
                <thead>
                  <tr class="bg-blue-100">
                    <th class="border border-black px-2 py-1">By DL Code</th>
                    <th class="border border-black px-2 py-1 w-40">No. of Issued<br />Certificates</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in certificateReport.dlCodeRows" :key="row.label">
                    <td class="border border-black px-2 py-1 text-center">{{ row.label }}</td>
                    <td class="border border-black px-2 py-1 text-center">{{ row.count }}</td>
                  </tr>
                  <tr><td class="border border-black px-2 py-1 text-right font-bold">Total</td><td class="border border-black px-2 py-1 text-center font-bold">{{ certificateReport.dlCodeTotal }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== EXPORT MODAL ===================== -->
      <div v-if="exportOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div class="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div class="p-4 border-b flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-green-800">📤 Export Builder</h3>
            </div>
            <button @click="exportOpen=false" class="px-3 py-2 border rounded hover:bg-gray-50">✖</button>
          </div>

          <div class="p-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <select v-model="exportTarget" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="all">All (Overview + Detailed{{ reportMode==='driving' ? ' + Revenue' : '' }})</option>
                  <option value="overview">Overview (all overview datasets)</option>
                  <option value="overview-trend">Overview - Enrollment Trend</option>
                  <option value="overview-top-courses">Overview - Top Courses</option>
                  <option value="overview-gender">Overview - Gender</option>
                  <option value="overview-monthly">Overview - Course Enrollments per Month</option>
                  <option v-if="reportMode==='driving'" value="certificates">Issued Certificates Report</option>
                  <option v-if="reportMode==='driving'" value="revenue">Revenue table</option>
                  <option value="detailed">Detailed report</option>
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

              <div v-if="!(exportTarget === 'detailed' && reportMode === 'driving' && exportFormat === 'pdf')">
                <label class="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                <select v-model="exportScope" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="all">All rows (filtered)</option>
                  <option value="page">Current page only</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-if="exportTarget === 'detailed' && reportMode === 'driving'">
                <label class="block text-sm font-medium text-gray-700 mb-1">Report Month</label>
                <input
                  v-model="detailedMonth"
                  type="month"
                  class="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select v-model="exportCourseId" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="">Use current tab filter / All</option>
                  <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                    {{ c.course_name }}
                  </option>
                </select>
              </div>

              <div v-if="!(exportTarget === 'detailed' && reportMode === 'driving' && exportFormat === 'pdf')">
                <label class="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select v-model="exportTemplate" class="w-full p-2 border border-gray-300 rounded-md text-sm">
                  <option value="custom">Custom (selected columns)</option>
                  <option value="pdc">PDC-style list (like your picture)</option>
                  <option value="minimal">Minimal list</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">File name</label>
                <input v-model="exportFileName" class="w-full p-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>

            <div
              v-if="(exportTarget === 'detailed' && !(reportMode === 'driving' && exportFormat === 'pdf')) || exportTarget === 'revenue'"
              class="bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
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
  components: { AdminLayout, VChart },
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
      dateRange: "custom",
      customFrom: "",
      customTo: "",
      courseId: "",
      groupBy: "raw",
      source: "",
      payment_method: "",
      sort: "created_desc",
    });

    const detailedMonth = ref(toISODateLocal(new Date()).slice(0, 7));
    const certificateMonth = ref(toISODateLocal(new Date()).slice(0, 7));

    // Config
    const trendPeriod = ref("month");
    const forecastHorizon = ref("next");

    const forecastHorizonOptions = computed(() => {
      const unit = trendPeriod.value;
      const plural = `${unit}s`;
      return [
        { value: "next", label: `Next ${capitalize(unit)}` },
        { value: "next2", label: `Next 2 ${capitalize(plural)}` },
        { value: "next3", label: `Next 3 ${capitalize(plural)}` },
      ];
    });

    const forecastPeriodLabel = computed(() => {
      const count = forecastHorizon.value === "next3" ? 3 : forecastHorizon.value === "next2" ? 2 : 1;
      const unit = trendPeriod.value;
      const label = count === 1 ? unit : `${unit}s`;
      return count === 1 ? `Next ${capitalize(label)}` : `Next ${count} ${capitalize(label)}`;
    });

    const forecastTitle = computed(() => `${forecastPeriodLabel.value} Enrollment Forecast`);

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
    function capitalize(value) {
      const s = String(value || "");
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    }

    function getForecastMultiplier() {
      if (forecastHorizon.value === "next2") return 2;
      if (forecastHorizon.value === "next3") return 3;
      return 1;
    }

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

    function getMonthRange(monthValue) {
      const fallback = toISODateLocal(new Date()).slice(0, 7);
      const raw = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(monthValue || ""))
        ? String(monthValue)
        : fallback;
      const [year, month] = raw.split("-").map(Number);
      const first = new Date(year, month - 1, 1);
      const last = new Date(year, month, 0);
      return {
        month: raw,
        from: toISODateLocal(first),
        to: toISODateLocal(last),
      };
    }

    function getMonthLabel(monthValue) {
      const { month } = getMonthRange(monthValue);
      const [year, m] = month.split("-").map(Number);
      return new Date(year, m - 1, 1)
        .toLocaleDateString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();
    }

    function syncDetailedMonthToFilters() {
      const r = getMonthRange(detailedMonth.value);
      detailedMonth.value = r.month;
      detailedTabFilters.dateRange = "custom";
      detailedTabFilters.customFrom = r.from;
      detailedTabFilters.customTo = r.to;
      detailedTabFilters.groupBy = "raw";
      detailedTabFilters.source = "";
      detailedTabFilters.payment_method = "";
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
      const multiplier = getForecastMultiplier();
      const predictedTotal = base * multiplier;

      forecast.nextForecast = predictedTotal;
      const band = forecastBand(trend.values, predictedTotal);
      forecast.low = band.low;
      forecast.high = band.high;

      if (reportMode.value !== "driving") {
        revenueStats.forecastRevenuePeso = 0;
        return;
      }

      const avgFee = Number(revenueStats.avgFeePeso || 0);
      revenueStats.forecastRevenuePeso = avgFee > 0 ? Math.round(avgFee * forecast.nextForecast) : 0;
    }

    watch(forecastHorizon, () => {
      computeForecastAndRevenueModel();
    });

    watch(certificateMonth, () => {
      if (activeTab.value === "exams" && reportMode.value === "driving") {
        reloadCertificateReport();
      }
    });

    watch(detailedMonth, () => {
      if (reportMode.value === "driving") syncDetailedMonthToFilters();
    });

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
        if (reportMode.value === "driving") {
          syncDetailedMonthToFilters();
          const r = getMonthRange(detailedMonth.value);
          range = "custom";
          from = r.from;
          to = r.to;
          course_id = detailedTabFilters.courseId || "";
        } else {
          const r = getRangeDates(detailedTabFilters.dateRange, detailedTabFilters.customFrom, detailedTabFilters.customTo);
          range = detailedTabFilters.dateRange;
          from = r.from;
          to = r.to;
          course_id = detailedTabFilters.courseId || "";
        }
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
            group_by: "raw",
            source: "",
            payment_method: "",
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
          source: "",
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

    async function setTrendPeriod(period) {
      trendPeriod.value = period;
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

    const detailedTdcRows = computed(() =>
      detailedFiltered.value.filter((row) => normalizeCourseType(row) === "tdc"),
    );

    const detailedPdcRows = computed(() =>
      detailedFiltered.value.filter((row) => normalizeCourseType(row) === "pdc"),
    );

    const detailedReportMonthLabel = computed(() => getMonthLabel(detailedMonth.value));

    function shortTrainingPurpose(value) {
      const s = String(value || "").trim().toUpperCase();
      if (!s) return "NEW DL";
      if (s.includes("ADDITIONAL")) return "ADD DL";
      if (s.includes("NEW")) return "NEW DL";
      return String(value || "-");
    }

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
      if (reportMode.value === "tesda") {
        const tesdaKeys = [
          "fullname",
          "birthday",
          "gender",
          "instructor_name",
          "course_name",
          "course_start",
          "course_end",
          "reservation_source",
          "created_at",
          "nationality",
          "civil_status",
          "address",
        ];

        Object.keys(visibleColumns).forEach((k) => {
          visibleColumns[k] = false;
        });

        if (preset === "minimal") {
          ["fullname", "course_name", "course_start", "course_end"].forEach((k) => {
            visibleColumns[k] = true;
          });
          return;
        }

        tesdaKeys.forEach((k) => {
          visibleColumns[k] = true;
        });
        return;
      }

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
          nationality: false,
          civil_status: false,
          address: false,
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
          nationality: false,
          civil_status: false,
          address: false,
        });
        return;
      }
      if (preset === "all") {
        for (const k of Object.keys(visibleColumns)) visibleColumns[k] = true;
      }
    }


    // ===================== CERTIFICATE REPORT =====================
    function normalizeCourseType(row) {
      const text = `${row.course_name || ""} ${row.course_code || ""} ${row.course_type || ""}`.toUpperCase();
      if (text.includes("TDC") || text.includes("THEORETICAL")) return "tdc";
      return "pdc";
    }

    function normalizeSex(value) {
      const s = String(value || "").trim().toLowerCase();
      if (s.startsWith("f")) return "Female";
      return "Male";
    }

    function normalizePurpose(value) {
      const s = String(value || "").trim();
      if (!s) return "Application for new Driver's License";
      const u = s.toUpperCase();
      if (u.includes("ADDITIONAL")) return "Application for Additional DL code";
      if (u.includes("NEW")) return "Application for new Driver's License";
      return s;
    }

    function normalizeDLCode(value) {
      const s = String(value || "").trim().toUpperCase();
      return s || "A";
    }

    function rowDateForCertificate(row) {
      return row.certificate_created_at || row.generated_at || row.issued_at || row.completed_at || row.created_at || row.course_end || row.schedule_date || row.course_start || "";
    }

    function certificateMonthLabel(value) {
      const [y, m] = String(value || "").split("-");
      const d = new Date(Number(y || new Date().getFullYear()), Number(m || 1) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    }

    function rowsForSelectedCertificateMonth() {
      const monthKey = String(certificateMonth.value || "");
      return (detailedRows.value || []).filter((row) => {
        const raw = rowDateForCertificate(row);
        if (!raw || !monthKey) return true;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return true;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthKey;
      });
    }

    const certificateReport = computed(() => {
      const rows = rowsForSelectedCertificateMonth();
      const tdcRows = rows.filter((r) => normalizeCourseType(r) === "tdc");
      const pdcRows = rows.filter((r) => normalizeCourseType(r) === "pdc");

      const countBy = (items, getter, keys = []) => {
        const out = {};
        keys.forEach((k) => (out[k] = 0));
        items.forEach((item) => {
          const key = getter(item);
          out[key] = Number(out[key] || 0) + 1;
        });
        return out;
      };

      const purposeOrder = ["Application for new Driver's License", "Application for Additional DL code"];
      const dlOrder = ["A", "A1", "B", "B1", "B2", "BE", "C", "D", "CE"];
      const purposeCounts = countBy(pdcRows, (r) => normalizePurpose(r.training_purpose), purposeOrder);
      const dlCounts = countBy(pdcRows, (r) => normalizeDLCode(r.dl_code), dlOrder);

      Object.keys(purposeCounts).forEach((k) => {
        if (!purposeOrder.includes(k)) purposeOrder.push(k);
      });
      Object.keys(dlCounts).forEach((k) => {
        if (!dlOrder.includes(k)) dlOrder.push(k);
      });

      return {
        monthLabel: certificateMonthLabel(certificateMonth.value),
        tdcTotal: tdcRows.length,
        pdcTotal: pdcRows.length,
        tdc: { sex: countBy(tdcRows, (r) => normalizeSex(r.gender), ["Male", "Female"]) },
        pdc: { sex: countBy(pdcRows, (r) => normalizeSex(r.gender), ["Male", "Female"]) },
        trainingPurposeRows: purposeOrder.map((label) => ({ label, count: Number(purposeCounts[label] || 0) })),
        dlCodeRows: dlOrder.map((label) => ({ label, count: Number(dlCounts[label] || 0) })),
        dlCodeTotal: dlOrder.reduce((sum, key) => sum + Number(dlCounts[key] || 0), 0),
      };
    });

    function buildCertificateTables() {
      const r = certificateReport.value;
      return [
        {
          sheetName: "Certificate Summary",
          headers: ["Course", "Total"],
          rows: [
            ["A. Theoretical Driving Course (TDC)", r.tdcTotal],
            ["B. Practical Driving Course(PDC)", r.pdcTotal],
          ],
        },
        {
          sheetName: "TDC By Sex",
          headers: ["Categories", "No. of Issued Certificates"],
          rows: [["Male", r.tdc.sex.Male], ["Female", r.tdc.sex.Female], ["Total", r.tdcTotal]],
        },
        {
          sheetName: "PDC By Sex Purpose",
          headers: ["Categories", "No. of Issued Certificates"],
          rows: [
            ["By Sex", ""],
            ["Male", r.pdc.sex.Male],
            ["Female", r.pdc.sex.Female],
            ["Total", r.pdcTotal],
            ["By Training Purpose", ""],
            ...r.trainingPurposeRows.map((x) => [x.label, x.count]),
            ["Total", r.pdcTotal],
          ],
        },
        {
          sheetName: "PDC By DL Code",
          headers: ["By DL Code", "No. of Issued Certificates"],
          rows: [...r.dlCodeRows.map((x) => [x.label, x.count]), ["Total", r.dlCodeTotal]],
        },
      ];
    }

    async function reloadCertificateReport() {
      const r = getMonthRange(certificateMonth.value);
      certificateMonth.value = r.month;
      // Certificate summary uses the already loaded detailed records when possible.
      // Loading detailed here keeps the certificate preview updated without changing the detailed month filter.
      await loadDetailed();
    }

    function exportCertificateReport() {
      const oldTarget = exportTarget.value;
      const oldFormat = exportFormat.value;
      const oldName = exportFileName.value;
      try {
        exportTarget.value = "certificates";
        exportFormat.value = "pdf";
        exportFileName.value = `issued-certificates-${certificateMonth.value || new Date().toISOString().slice(0, 7)}`;
        return exportMulti(buildCertificateTables(), exportFileName.value, { title: "TOTAL NO. OF ISSUED CERTIFICATES OF COMPLETION" });
      } finally {
        exportTarget.value = oldTarget;
        exportFormat.value = oldFormat;
        exportFileName.value = oldName;
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

    const overviewExportTargets = ["overview", "overview-trend", "overview-top-courses", "overview-gender", "overview-monthly"];

    function isOverviewExportTarget(target) {
      return overviewExportTargets.includes(String(target || ""));
    }

    function getExportColumnOptionsFor(target) {
      if (target === "revenue") {
        return [
          { key: "fullname", label: "Student" },
          { key: "course_name", label: "Course" },
          { key: "payment_method", label: "Method" },
          { key: "amount_peso", label: "Amount" },
          { key: "created_at", label: "Created" },
        ];
      }

      if (target === "detailed") return columnOptions.value;

      return [];
    }

    const exportColumnOptions = computed(() => getExportColumnOptionsFor(exportTarget.value));

    const exportColumns = reactive({});
    function initExportColumnsFromVisible() {
      const cols = getExportColumnOptionsFor(exportTarget.value);

      cols.forEach((c) => {
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
      exportCourseId.value = exportTarget.value === "detailed" ? (detailedTabFilters.courseId || "") : "";
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

      getExportColumnOptionsFor("detailed").forEach((c) => (exportColumns[c.key] = false));

      if (reportMode.value === "tesda") {
        if (tpl === "minimal") {
          const keys = ["fullname", "course_name", "course_start", "course_end"];
          keys.forEach((k) => (exportColumns[k] = true));
        } else {
          const keys = ["fullname", "birthday", "gender", "instructor_name", "course_name", "course_start", "course_end", "reservation_source", "created_at", "nationality", "civil_status", "address"];
          keys.forEach((k) => (exportColumns[k] = true));
        }
        return;
      }

      if (tpl === "pdc") {
        const keys = ["lto_client_id", "fullname", "birthday", "gender", "instructor_name", "course_start", "course_end", "dl_code", "training_purpose"];
        keys.forEach((k) => (exportColumns[k] = true));
      } else if (tpl === "minimal") {
        const keys = ["lto_client_id", "fullname", "course_name", "course_start"];
        keys.forEach((k) => (exportColumns[k] = true));
      }
    }

    function selectExportColumns(mode) {
      const cols = getExportColumnOptionsFor(exportTarget.value);
      if (mode === "all") cols.forEach((c) => (exportColumns[c.key] = true));
      else if (mode === "none") cols.forEach((c) => (exportColumns[c.key] = false));
      else if (mode === "fromVisible") initExportColumnsFromVisible();
    }

    function pickRowsForExport(target) {
      const overrideCourse = String(exportCourseId.value || "").trim();

      if (target === "detailed") {
        let base = detailedFiltered.value;
        if (overrideCourse) base = base.filter((r) => String(r.course_id || r.courseId || "") === overrideCourse);
        const rows = exportScope.value === "page" ? base.slice((detailedPage.value - 1) * detailedPageSize.value, detailedPage.value * detailedPageSize.value) : base;
        return rows;
      }

      if (target === "revenue") {
        if (reportMode.value !== "driving") return [];
        let base = revenueFiltered.value;
        if (overrideCourse) base = base.filter((r) => String(r.course_id || r.courseId || "") === overrideCourse);
        const rows = exportScope.value === "page" ? revenuePaginated.value : base;
        return rows;
      }

      return [];
    }

    function selectedColumnDefs(targetOverride = null) {
      const target = targetOverride || exportTarget.value;
      const options = getExportColumnOptionsFor(target);
      const chosen = options.filter((c) => !!exportColumns[c.key]);
      return chosen.length ? chosen : options;
    }

    function valueForCell(row, key) {
      if (!row) return "";

      if (key === "birthday") return row.birthday ? formatDateShort(row.birthday) : "";
      if (key === "gender") return row.gender ? (String(row.gender).toLowerCase() === "male" ? "M" : "F") : "";
      if (key === "course_start") return (row.course_start || row.schedule_date) ? formatDate(row.course_start || row.schedule_date) : "";
      if (key === "course_end") return (row.course_end || row.schedule_date) ? formatDate(row.course_end || row.schedule_date) : "";
      if (key === "created_at") return row.created_at ? formatDate(row.created_at) : "";
      if (key === "verified_at") return row.verified_at ? formatDate(row.verified_at) : "";
      if (key === "done_at") return row.done_at ? formatDate(row.done_at) : "";
      if (key === "payment_method") return normalizePaymentMethod(row.payment_method) || "";
      if (key === "amount_peso") {
        const n = Number(row.amount_peso || 0);
        return Number.isFinite(n) ? n.toFixed(2) : "0.00";
      }
      if (key === "address") return row.address || row.full_address || row.complete_address || "";
      if (key === "civil_status") return row.civil_status || row.civilStatus || "";
      if (key === "nationality") return row.nationality || "";

      return row[key] ?? "";
    }

    function buildTableFromRows(rows, defs, options = {}) {
      const headers = defs.map((d) => d.label);
      const mapped = rows.map((r) =>
        defs.map((d) => {
          const v = valueForCell(r, d.key);
          return String(v ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
        }),
      );

      if (options.totalRevenue && defs.some((d) => d.key === "amount_peso")) {
        const total = rows.reduce((sum, r) => sum + Number(r.amount_peso || 0), 0);
        const totalRow = defs.map((d, i) => {
          if (i === 0) return "TOTAL";
          if (d.key === "amount_peso") return total.toFixed(2);
          return "";
        });
        mapped.push(totalRow);
      }

      return { headers, rows: mapped };
    }

    function withTotalRow(table, totalLabel = "TOTAL") {
      const rows = [...(table.rows || [])];
      if (!rows.length) return table;

      const totalRow = table.headers.map((_, index) => (index === 0 ? totalLabel : ""));
      const numericIndexes = [];

      table.headers.forEach((h, index) => {
        const label = String(h || "").toLowerCase();
        if (label.includes("enrollment") || label.includes("count") || label.includes("amount") || label.includes("revenue")) {
          numericIndexes.push(index);
        }
      });

      numericIndexes.forEach((idx) => {
        const total = rows.reduce((sum, row) => sum + Number(row[idx] || 0), 0);
        totalRow[idx] = Number.isFinite(total) ? total : 0;
      });

      rows.push(totalRow);
      return { ...table, rows };
    }

    function buildOverviewTables() {
      const trendTable = withTotalRow({
        sheetName: "Trend",
        headers: ["Label", "Enrollments"],
        rows: (trend.labels || []).map((l, i) => [l, Number(trend.values?.[i] || 0)]),
      });

      const topCoursesTable = withTotalRow({
        sheetName: "Top Courses",
        headers: ["Course", "Enrollments"],
        rows: (topCourses.labels || []).map((l, i) => [l, Number(topCourses.values?.[i] || 0)]),
      });

      const genderTable = withTotalRow({
        sheetName: "Gender",
        headers: ["Gender", "Count"],
        rows: (gender.labels || []).map((l, i) => [l, Number(gender.values?.[i] || 0)]),
      });

      const monthlyTable = withTotalRow({
        sheetName: "Course Monthly",
        headers: ["Month", "Course", "Enrollments"],
        rows: (courseMonthlyPreview.value || []).map((r) => [r.month_label || "", r.course_name || "", Number(r.count || 0)]),
      });

      return {
        overview: [trendTable, topCoursesTable, genderTable, monthlyTable],
        "overview-trend": [trendTable],
        "overview-top-courses": [topCoursesTable],
        "overview-gender": [genderTable],
        "overview-monthly": [monthlyTable],
      };
    }

    function exportXlsx(tables, filename) {
      const wb = XLSX.utils.book_new();

      for (const t of tables) {
        const ws = XLSX.utils.aoa_to_sheet([t.headers, ...t.rows]);
        XLSX.utils.book_append_sheet(wb, ws, (t.sheetName || "Export").slice(0, 31));
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

    function choosePdfLayout(table) {
      const colCount = table.headers.length;
      if (colCount <= 5) return { orientation: "portrait", fontSize: 8, cellPadding: 5 };
      if (colCount <= 8) return { orientation: "landscape", fontSize: 7, cellPadding: 4 };
      return { orientation: "landscape", fontSize: 6, cellPadding: 3 };
    }

    function exportPdf(table, filename, options = {}) {
      const layout = choosePdfLayout(table);
      const orientation = options.orientation || layout.orientation;

      const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 28;
      const headerBottomY = 92;

      const drawHeader = (withLogo = false, img = null) => {
        if (withLogo && img) doc.addImage(img, "PNG", margin, 18, 48, 48);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(
          "First Asian Cognizance Executive Training Institute (FACET Institute) Corp.",
          pageWidth / 2,
          26,
          { align: "center", maxWidth: pageWidth - 190 },
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Holy Spirit, Barcenaga, Naujan, Oriental Mindoro", pageWidth / 2, 43, { align: "center" });

        const isTesdaDetailedPdf = options.target === "detailed" && reportMode.value === "tesda";
        doc.setFont("helvetica", "bold");
        if (isTesdaDetailedPdf) {
          doc.text("TESDA TRAINING DETAILED REPORT", pageWidth / 2, 57, { align: "center" });
        } else {
          doc.text("LTO ACCREDITATION NUMBER: DS-2022-00002-04", pageWidth / 2, 57, { align: "center" });
        }

        // Nilagay sa lower-right para hindi matabunan sa portrait.
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 74, {
          align: "right",
          maxWidth: 150,
        });

        doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY);
      };

      const savePdf = (withLogo = false, img = null) => {
        autoTable(doc, {
          startY: headerBottomY + 14,
          head: [table.headers],
          body: table.rows,
          margin: { top: headerBottomY + 14, right: margin, bottom: 32, left: margin },
          theme: "grid",
          styles: {
            font: "helvetica",
            fontSize: layout.fontSize,
            cellPadding: layout.cellPadding,
            lineColor: [0, 0, 0],
            lineWidth: 0.25,
            textColor: [0, 0, 0],
            overflow: "linebreak",
            valign: "middle",
            fillColor: [255, 255, 255],
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.25,
            fontStyle: "bold",
          },
          bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          didDrawPage: () => {
            drawHeader(withLogo, img);
            const currentPage = doc.internal.getNumberOfPages();
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 12, { align: "right" });
          },
        });

        doc.save(`${filename}.pdf`);
      };

      const img = new Image();
      img.onload = () => savePdf(true, img);
      img.onerror = () => savePdf(false, null);
      img.src = "/facet-logo.png";
    }

    function exportDetailedDrivingPdf(rows, filename) {
      const selectedRows = Array.isArray(rows) ? rows : [];
      const tdcRows = selectedRows.filter((row) => normalizeCourseType(row) === "tdc");
      const pdcRows = selectedRows.filter((row) => normalizeCourseType(row) === "pdc");
      const hasTdc = tdcRows.length > 0;
      const hasPdc = pdcRows.length > 0;
      const exportSections = [];

      if (exportCourseId.value) {
        if (hasTdc) exportSections.push({ type: "tdc", title: "THEORETICAL DRIVING COURSE (TDC)", rows: tdcRows });
        if (hasPdc) exportSections.push({ type: "pdc", title: "PRACTICAL DRIVING COURSE (PDC)", rows: pdcRows });
      } else {
        exportSections.push({ type: "tdc", title: "THEORETICAL DRIVING COURSE (TDC)", rows: tdcRows });
        exportSections.push({ type: "pdc", title: "PRACTICAL DRIVING COURSE (PDC)", rows: pdcRows });
      }

      if (!exportSections.length) {
        exportSections.push({ type: "pdc", title: "PRACTICAL DRIVING COURSE (PDC)", rows: [] });
      }

      // Long legal landscape size para hindi putol ang PDC table.
      // 350mm x 216mm converted to points.
      const longLandscape = [992, 612];
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: longLandscape });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 28;
      const monthLabel = getMonthLabel(detailedMonth.value);

      const logo = new Image();
      const drawSection = (section, pageIndex, logoImg = null) => {
        if (pageIndex > 0) doc.addPage(longLandscape, "landscape");

        if (logoImg) {
          try {
            doc.addImage(logoImg, "PNG", margin + 8, 22, 46, 46);
            doc.addImage(logoImg, "PNG", pageWidth - margin - 54, 22, 46, 46);
          } catch (_) {}
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text("First Asian Cognizance Executive Training Institute (FACET Institute) Corp.", pageWidth / 2, 30, {
          align: "center",
          maxWidth: pageWidth - 190,
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text("Holy Spirit, Barcenaga, Naujan, Oriental Mindoro", pageWidth / 2, 46, { align: "center" });
        doc.text("LTO ACCREDITATION NUMBER : DS-2022-00002-04", pageWidth / 2, 60, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(section.title, pageWidth / 2, 78, { align: "center" });
        doc.setTextColor(190, 0, 0);
        doc.setFontSize(12);
        doc.text(monthLabel, pageWidth / 2, 104, { align: "center" });
        doc.setTextColor(0, 0, 0);

        const isPdc = section.type === "pdc";
        const headers = isPdc
          ? [["No.", "Client ID", "Full Name", "Birthdate\n(MM/DD/YY)", "Sex\n(M/F)", "Instructor Name", "Course\nStart", "Course\nEnd", "DL\nCode", "Training\nPurpose"]]
          : [["No.", "Client ID", "Full Name", "Birthdate\n(MM/DD/YY)", "Sex\n(M/F)", "Instructor Name", "Course\nStart", "Course\nEnd"]];

        const body = section.rows.length
          ? section.rows.map((row, idx) => {
              const base = [
                String(idx + 1),
                row.lto_client_id || "-",
                row.fullname || row.group_label || "-",
                row.birthday ? formatDateShort(row.birthday) : "-",
                row.gender ? (String(row.gender).toLowerCase().startsWith("m") ? "M" : "F") : "-",
                row.instructor_name || row.trainer_name || "-",
                (row.course_start || row.schedule_date) ? formatDateShort(row.course_start || row.schedule_date) : "-",
                (row.course_end || row.schedule_date) ? formatDateShort(row.course_end || row.schedule_date) : "-",
              ];
              if (isPdc) base.push(normalizeDLCode(row.dl_code), shortTrainingPurpose(row.training_purpose));
              return base;
            })
          : [[{ content: isPdc ? "No PDC records" : "No TDC records", colSpan: isPdc ? 10 : 8, styles: { halign: "center", textColor: [90, 90, 90] } }]];

        // Centered fixed table width.
        // Huwag gawing full page width para hindi na magmukhang putol o nakadikit sa gilid.
        const tableWidth = isPdc ? 870 : 840;
        const tableLeft = (pageWidth - tableWidth) / 2;

        const columnStyles = isPdc
          ? {
              0: { cellWidth: 30, halign: "center" },  // No.
              1: { cellWidth: 85 },                    // Client ID
              2: { cellWidth: 250 },                   // Full Name
              3: { cellWidth: 70, halign: "center" },  // Birthdate
              4: { cellWidth: 34, halign: "center" },  // Sex
              5: { cellWidth: 135 },                   // Instructor
              6: { cellWidth: 60, halign: "center" },  // Course Start
              7: { cellWidth: 60, halign: "center" },  // Course End
              8: { cellWidth: 45, halign: "center" },  // DL Code
              9: { cellWidth: 101, halign: "center" }, // Training Purpose
            }
          : {
              0: { cellWidth: 34, halign: "center" },  // No.
              1: { cellWidth: 90 },                    // Client ID
              2: { cellWidth: 300 },                   // Full Name
              3: { cellWidth: 75, halign: "center" },  // Birthdate
              4: { cellWidth: 38, halign: "center" },  // Sex
              5: { cellWidth: 163 },                   // Instructor
              6: { cellWidth: 70, halign: "center" },  // Course Start
              7: { cellWidth: 70, halign: "center" },  // Course End
            };

        autoTable(doc, {
          startY: 126,
          head: headers,
          body,
          margin: { top: 126, right: tableLeft, bottom: 30, left: tableLeft },
          theme: "grid",
          tableWidth,
          styles: {
            font: "helvetica",
            fontSize: 6.5,
            cellPadding: 1.4,
            lineColor: [0, 0, 0],
            lineWidth: 0.35,
            textColor: [0, 0, 0],
            overflow: "linebreak",
            valign: "middle",
            fillColor: [255, 255, 255],
          },
          headStyles: {
            fillColor: [219, 233, 252],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
            lineColor: [0, 0, 0],
            lineWidth: 0.35,
          },
          bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          columnStyles,
          didDrawPage: () => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, pageHeight - 12, { align: "right" });
          },
        });
      };

      const save = (logoImg = null) => {
        exportSections.forEach((section, index) => drawSection(section, index, logoImg));
        doc.save(`${filename}.pdf`);
      };

      logo.onload = () => save(logo);
      logo.onerror = () => save(null);
      logo.src = "/facet-logo.png";
    }

    function exportSingle(table, filename, target = null) {
      if (exportFormat.value === "xlsx") return exportXlsx([{ sheetName: "Export", ...table }], filename);
      if (exportFormat.value === "csv") return exportCsv(table, filename);
      if (exportFormat.value === "pdf") return exportPdf(table, filename, { target });
      throw new Error("Unsupported export format.");
    }

    function exportCombinedCsv(tables, filename) {
      const esc = (v) => {
        const st = String(v ?? "");
        if (st.includes('"') || st.includes(",") || st.includes("\n")) return `"${st.replace(/"/g, '""')}"`;
        return st;
      };
      const lines = [];
      tables.forEach((table, idx) => {
        if (idx > 0) lines.push("");
        lines.push(table.sheetName || `Table ${idx + 1}`);
        lines.push(table.headers.map(esc).join(","));
        for (const row of table.rows) lines.push(row.map(esc).join(","));
      });
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportPdfTables(tables, filename, options = {}) {
      const widest = tables.reduce((max, t) => Math.max(max, t.headers.length), 0);
      const orientation = options.orientation || (widest <= 5 ? "portrait" : "landscape");
      const layout = widest <= 5 ? { fontSize: 8, cellPadding: 5 } : widest <= 8 ? { fontSize: 7, cellPadding: 4 } : { fontSize: 6, cellPadding: 3 };

      const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 28;
      const headerBottomY = 98;

      const drawHeader = (withLogo = false, img = null) => {
        if (withLogo && img) doc.addImage(img, "PNG", margin, 16, 46, 46);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(180, 0, 0);
        doc.text("First Asian Cognizance Executive Training Institute (FACET Institute) Corp.", pageWidth / 2, 26, {
          align: "center",
          maxWidth: pageWidth - 150,
        });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Holy Spirit, Barcenaga, Naujan, Oriental Mindoro", pageWidth / 2, 42, { align: "center" });

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(options.title || "Analytics & Reports", pageWidth / 2, 62, { align: "center", maxWidth: pageWidth - 80 });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 84, {
          align: "right",
          maxWidth: pageWidth / 2 - margin,
        });

        doc.line(margin, headerBottomY, pageWidth - margin, headerBottomY);
      };

      const savePdf = (withLogo = false, img = null) => {
        let y = headerBottomY + 18;

        tables.forEach((table, index) => {
          if (index > 0 && y > pageHeight - 170) {
            doc.addPage();
            y = headerBottomY + 18;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(table.sheetName || `Table ${index + 1}`, margin, y);
          y += 8;

          autoTable(doc, {
            startY: y + 6,
            head: [table.headers],
            body: table.rows,
            margin: { top: headerBottomY + 14, right: margin, bottom: 32, left: margin },
            theme: "grid",
            styles: {
              font: "helvetica",
              fontSize: layout.fontSize,
              cellPadding: layout.cellPadding,
              lineColor: [0, 0, 0],
              lineWidth: 0.25,
              textColor: [0, 0, 0],
              overflow: "linebreak",
              valign: "middle",
              fillColor: [255, 255, 255],
            },
            headStyles: {
              fillColor: [201, 193, 154],
              textColor: [0, 0, 0],
              lineColor: [0, 0, 0],
              lineWidth: 0.25,
              fontStyle: "bold",
            },
            bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [255, 255, 255] },
            didDrawPage: () => {
              drawHeader(withLogo, img);
              const currentPage = doc.internal.getNumberOfPages();
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 12, { align: "right" });
            },
          });

          y = doc.lastAutoTable.finalY + 24;
        });

        doc.save(`${filename}.pdf`);
      };

      const img = new Image();
      img.onload = () => savePdf(true, img);
      img.onerror = () => savePdf(false, null);
      img.src = "/facet-logo.png";
    }

    function exportMulti(tables, filename, options = {}) {
      if (!tables || !tables.length) throw new Error("No data to export.");
      if (exportFormat.value === "xlsx") return exportXlsx(tables, filename);
      if (exportFormat.value === "csv") return exportCombinedCsv(tables, filename);
      if (exportFormat.value === "pdf") return exportPdfTables(tables, filename, options);
      throw new Error("Unsupported export format.");
    }

    function runExport() {
      exportError.value = "";

      try {
        const target = exportTarget.value;
        const overviewTablesByTarget = buildOverviewTables();

        if (isOverviewExportTarget(target)) {
          exportOpen.value = false;
          return exportMulti(overviewTablesByTarget[target], exportFileName.value, { title: target === "overview" ? "OVERVIEW REPORT" : "OVERVIEW REPORT" });
        }

        if (target === "certificates") {
          exportOpen.value = false;
          return exportMulti(buildCertificateTables(), exportFileName.value, { title: "TOTAL NO. OF ISSUED CERTIFICATES OF COMPLETION" });
        }

        if (target === "all") {
          if (exportFormat.value === "xlsx") {
            const tables = [...overviewTablesByTarget.overview];

            if (reportMode.value === "driving") {
              const revenueRows = pickRowsForExport("revenue");
              const revenueDefs = getExportColumnOptionsFor("revenue");
              tables.push({ sheetName: "Revenue", ...buildTableFromRows(revenueRows, revenueDefs, { totalRevenue: true }) });
            }

            const detailedRowsForExport = pickRowsForExport("detailed");
            const detailedDefs = getExportColumnOptionsFor("detailed");
            tables.push({ sheetName: "Detailed", ...buildTableFromRows(detailedRowsForExport, detailedDefs) });

            exportOpen.value = false;
            return exportXlsx(tables, exportFileName.value);
          }

          exportOpen.value = false;
          return exportMulti(overviewTablesByTarget.overview, `${exportFileName.value}-overview`);
        }

        if (target === "revenue" && reportMode.value === "driving") {
          const rows = pickRowsForExport("revenue");
          const defs = selectedColumnDefs("revenue");
          const table = buildTableFromRows(rows, defs, { totalRevenue: true });
          exportOpen.value = false;
          return exportSingle(table, exportFileName.value, "revenue");
        }

        if (target === "detailed") {
          const rows = pickRowsForExport("detailed");
          exportOpen.value = false;

          if (reportMode.value === "driving" && exportFormat.value === "pdf") {
            return exportDetailedDrivingPdf(rows, exportFileName.value);
          }

          const defs = selectedColumnDefs("detailed");
          const table = buildTableFromRows(rows, defs);
          return exportSingle(table, exportFileName.value, "detailed");
        }

        exportOpen.value = false;
      } catch (e) {
        exportError.value = e?.message || "Export failed.";
      }
    }

    // Lifecycle
    onMounted(async () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      overviewFilters.customFrom = "2000-01-01";
      overviewFilters.customTo = toISODateLocal(today);

      revenueTabFilters.customFrom = toISODateLocal(lastMonth);
      revenueTabFilters.customTo = toISODateLocal(today);

      syncDetailedMonthToFilters();

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
      detailedMonth,

      // config
      trendPeriod,
      forecastHorizon,
      forecastHorizonOptions,
      forecastPeriodLabel,
      forecastTitle,

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
      detailedTdcRows,
      detailedPdcRows,
      detailedReportMonthLabel,
      shortTrainingPurpose,
      normalizeDLCode,
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

      // certificates
      certificateMonth,
      certificateReport,
      reloadCertificateReport,
      exportCertificateReport,

      // exams
      examStats,
    };
  },
};
</script>