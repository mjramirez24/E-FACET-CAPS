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
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start" :class="reportMode === 'driving' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'">
        <div class="rounded-2xl border border-green-100 bg-green-50 p-4 min-h-[118px] flex flex-col justify-center">
          <p class="text-sm text-green-700 font-semibold">Total Enrolled</p>
          <h3 class="text-3xl font-extrabold text-green-800 mt-2 leading-none">{{ summary.totalEnrolled }}</h3>
        </div>

        <div class="rounded-2xl border border-blue-100 bg-blue-50 p-4 min-h-[118px] flex flex-col justify-center">
          <p class="text-sm text-blue-700 font-semibold">{{ reportMode === 'tesda' ? 'TESDA Active Courses' : 'Most Popular Course' }}</p>
          <h3 v-if="reportMode === 'tesda'" class="text-3xl font-extrabold text-blue-800 mt-2 leading-none">{{ tesdaActiveCourseCount }}</h3>
          <h3 v-else class="text-xl font-extrabold text-blue-800 mt-2 leading-snug line-clamp-2">{{ summary.mostPopularCourse || "-" }}</h3>
        </div>

        <!-- ✅ DRIVING ONLY: REVENUE CARD -->
        <div v-if="reportMode === 'driving'" class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 min-h-[118px] flex flex-col justify-center">
          <p class="text-sm text-emerald-700 font-semibold">💰 Verified Revenue</p>
          <h3 class="text-3xl font-extrabold text-emerald-800 mt-2 leading-none">
            {{ formatCurrency(summary.totalRevenuePeso) }}
          </h3>
        </div>

        <!-- ✅ TESDA ONLY: Attendance KPI -->
        <div v-else class="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 min-h-[118px] flex flex-col justify-center">
          <p class="text-sm text-emerald-700 font-semibold">📌 Attendance Rate</p>
          <h3 class="text-3xl font-extrabold text-emerald-800 mt-2 leading-none">
            {{ tesdaKpiLabel }}
          </h3>
        </div>

        <!-- ✅ DRIVING ONLY: compact clickable forecast card -->
        <button
          v-if="reportMode === 'driving'"
          type="button"
          @click="openForecastModal"
          class="relative overflow-hidden text-left rounded-2xl border border-violet-200 bg-violet-50 p-4 min-h-[118px] shadow-sm transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-md group"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-violet-700">🔮 Enrollment Forecast</p>
              <div class="mt-2 flex items-end gap-2">
                <h3 class="text-3xl font-extrabold text-violet-900 leading-none">{{ forecast.nextForecast }}</h3>
                <span class="pb-0.5 text-xs font-medium text-gray-500">students</span>
              </div>
              <p class="mt-2 text-xs text-gray-600">
                Prediction Range: <b class="text-violet-800">{{ forecast.low }}–{{ forecast.high }}</b>
              </p>
              <p class="mt-1 truncate text-xs text-gray-600">
                Highest Course: <b>{{ forecast.topCourse || '-' }}</b>
              </p>
            </div>
            <span class="shrink-0 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-bold text-violet-700 group-hover:bg-violet-700 group-hover:text-white">
              View
            </span>
          </div>
        </button>
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

        <!-- ✅ TESDA ONLY: Attendance -->
        <button
          v-if="reportMode === 'tesda'"
          class="px-3 py-2 rounded-md text-sm font-medium border"
          :class="activeTab==='attendance' ? tabActive : tabInactive"
          @click="activeTab='attendance'"
        >
          Attendance
        </button>

        <!-- ✅ Issued Certificates (Driving / TESDA) -->
        <button
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

              <div v-if="reportMode === 'driving'">
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
            <button
              type="button"
              @click="openForecastModal"
              class="text-left bg-violet-50 p-4 rounded-xl border border-violet-100 hover:border-violet-300 hover:bg-violet-100 transition"
            >
              <p class="text-sm text-violet-700 font-semibold">Forecast Revenue</p>
              <h3 class="text-2xl font-extrabold text-violet-900 mt-1">
                {{ formatCurrency(revenueStats.forecastRevenuePeso) }}
              </h3>
              <p class="text-xs text-gray-500 mt-1">Based on {{ revenueForecastCourseLabel }}</p>
              <p class="text-xs text-gray-600 mt-2">
                Revenue Range:
                <b class="text-violet-800">{{ formatCurrency(revenueForecastLowPeso) }}–{{ formatCurrency(revenueForecastHighPeso) }}</b>
              </p>
            </button>
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
                    <img src="/facet-logo.png" alt="FACET Logo" class="absolute left-6 top-0 w-20 h-20 object-contain" />
                    <img src="/lto-logo.png" alt="LTO Logo" class="absolute right-6 top-0 w-20 h-20 object-contain" />

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
                    <img src="/facet-logo.png" alt="FACET Logo" class="absolute left-6 top-0 w-20 h-20 object-contain" />
                    <img src="/lto-logo.png" alt="LTO Logo" class="absolute right-6 top-0 w-20 h-20 object-contain" />

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

      <!-- ===================== ATTENDANCE (TESDA ONLY) ===================== -->
      <div v-else-if="activeTab === 'attendance' && reportMode === 'tesda'" class="space-y-5">
        <!-- Clean Attendance Summary -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wide text-blue-700">Students</p>
            <h3 class="mt-1 text-2xl font-extrabold text-blue-900">{{ attendanceSummary.totalStudents }}</h3>
          </div>
          <div class="rounded-xl border border-green-100 bg-green-50 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wide text-green-700">Present</p>
            <h3 class="mt-1 text-2xl font-extrabold text-green-800">{{ attendanceSummary.present }}</h3>
          </div>
          <div class="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wide text-yellow-700">Late</p>
            <h3 class="mt-1 text-2xl font-extrabold text-yellow-700">{{ attendanceSummary.late }}</h3>
          </div>
          <div class="rounded-xl border border-red-100 bg-red-50 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wide text-red-700">Absent</p>
            <h3 class="mt-1 text-2xl font-extrabold text-red-700">{{ attendanceSummary.absent }}</h3>
          </div>
          <div class="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Rate</p>
            <h3 class="mt-1 text-2xl font-extrabold text-emerald-800">{{ attendanceRate }}%</h3>
          </div>
        </div>

        <!-- Course picker: per-course attendance -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 class="text-lg font-extrabold text-green-800">📚 Select Course</h3>
              <p class="text-xs text-gray-500">Select one course first. Attendance records, calendar, and follow-up list will be based on that course only.</p>
            </div>
            <button
              type="button"
              @click="openAttendanceCourseModal"
              class="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-bold hover:bg-green-800 transition"
            >
              Select Course
            </button>
          </div>

          <div class="mt-4 rounded-xl border border-green-100 bg-green-50 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wide text-green-700">Selected Course</p>
            <div class="mt-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h4 class="text-lg font-extrabold text-green-900">{{ selectedAttendanceCourseLabel }}</h4>
                <p class="mt-1 text-xs text-green-800">
                  Trainer(s):
                  <span v-if="selectedAttendanceCourseTrainers.length" class="font-bold">
                    {{ selectedAttendanceCourseTrainers.join(', ') }}
                  </span>
                  <span v-else class="font-semibold text-gray-500 italic">No trainer assigned</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Basic filters only -->
          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">From</label>
              <input
                v-model="attendanceFilters.from"
                type="date"
                @change="attendancePage = 1; loadAttendance()"
                class="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">To</label>
              <input
                v-model="attendanceFilters.to"
                type="date"
                @change="attendancePage = 1; loadAttendance()"
                class="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Status</label>
              <select
                v-model="attendanceFilters.status"
                @change="attendancePage = 1; loadAttendance()"
                class="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Rows</label>
              <select v-model.number="attendancePageSize" class="w-full p-2 border border-gray-300 rounded-lg text-sm">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <div class="flex items-end gap-2">
              <button @click="loadAttendance" class="w-full px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm font-bold">Apply</button>
            </div>
          </div>

          <!-- Separate action tabs / less crowded -->
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 border border-gray-200 p-3">
            <div class="flex flex-wrap gap-2">
              <button @click="toggleAttendancePanel('calendar')" class="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 text-xs font-bold">
                {{ attendanceShowCalendar ? 'Hide' : 'Show' }} Calendar
              </button>
              <button @click="toggleAttendancePanel('warnings')" class="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 text-xs font-bold">
                {{ attendanceShowWarnings ? 'Hide' : 'Show' }} Alerts
              </button>
              <button @click="toggleAttendancePanel('history')" class="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 text-xs font-bold">
                {{ attendanceShowHistory ? 'Hide' : 'Show' }} History
              </button>
              <button @click="toggleAttendancePanel('columns')" class="px-3 py-2 rounded-lg border bg-white hover:bg-gray-100 text-xs font-bold">
                {{ attendanceColumnsOpen ? 'Hide' : 'Show' }} Columns
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button @click="exportAttendance('xlsx')" class="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-bold">📤 Excel</button>
              <button @click="exportAttendance('pdf')" class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-bold">📄 PDF</button>
            </div>
          </div>

          <p class="mt-2 text-xs text-gray-500">Viewing course: <b class="text-green-700">{{ selectedAttendanceCourseLabel }}</b></p>

          <div v-if="attendanceColumnsOpen" ref="attendanceColumnsSectionRef" class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p class="mb-2 text-xs font-bold text-gray-600">Visible columns</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
              <label v-for="col in attendanceColumnOptions" :key="col.key" class="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-2">
                <input type="checkbox" v-model="attendanceVisibleColumns[col.key]" />
                <span>{{ col.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Course Modal -->
        <div
          v-if="attendanceCourseModalOpen"
          class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4"
          @click.self="attendanceCourseModalOpen = false"
        >
          <div class="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
            <div class="flex items-center justify-between gap-3 border-b border-gray-100 p-4">
              <div>
                <h3 class="text-lg font-extrabold text-green-800">📚 Select TESDA Course</h3>
                <p class="text-xs text-gray-500">Choose one course. Courses without assigned trainers are clearly marked.</p>
              </div>
              <button
                type="button"
                @click="attendanceCourseModalOpen = false"
                class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold hover:bg-gray-50"
              >
                ✕
              </button>
            </div>

            <div class="p-4 border-b border-gray-100">
              <input
                v-model="attendanceCourseSearch"
                type="text"
                placeholder="Search course or assigned trainer..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>

            <div class="max-h-[60vh] overflow-y-auto p-4">
              <div v-if="attendanceCourseTrainerLoading" class="py-8 text-center text-gray-500">Loading course assignments…</div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  v-for="course in attendanceCourseOptions"
                  :key="course.id"
                  type="button"
                  @click="selectAttendanceCourse(course)"
                  class="text-left rounded-xl border p-4 transition hover:bg-green-50 hover:border-green-300"
                  :class="String(attendanceFilters.courseId) === String(course.id) ? 'border-green-600 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 bg-white'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h4 class="font-extrabold text-gray-900 truncate">{{ course.course_name }}</h4>
                      <p class="mt-1 text-xs text-gray-500">{{ course.course_code || 'TESDA Course' }}</p>
                    </div>
                    <span class="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[11px] font-bold text-green-700">Select</span>
                  </div>

                  <div class="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
                    <p class="text-[11px] font-bold uppercase tracking-wide text-gray-500">Assigned Trainer(s)</p>
                    <div v-if="getCourseTrainerNames(course.id).length" class="mt-2 flex flex-wrap gap-2">
                      <span
                        v-for="trainerName in getCourseTrainerNames(course.id)"
                        :key="`${course.id}-${trainerName}`"
                        class="rounded-full bg-white border border-green-100 px-2 py-1 text-xs font-bold text-green-800"
                      >
                        {{ trainerName }}
                      </span>
                    </div>
                    <p v-else class="mt-2 text-xs font-semibold text-gray-500 italic">No trainer assigned</p>
                  </div>
                </button>

                <div v-if="!attendanceCourseOptions.length" class="md:col-span-2 py-8 text-center text-gray-500">No course found.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar + Follow-up -->
        <div v-if="attendanceShowCalendar || attendanceShowWarnings" ref="attendanceCalendarSectionRef" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div v-if="attendanceShowCalendar" class="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-bold text-green-800">📅 Attendance Calendar</h3>
                <p class="text-xs text-gray-500">Click a date to filter records.</p>
              </div>
              <button @click="attendanceFilters.from = ''; attendanceFilters.to = ''; attendancePage = 1; loadAttendance()" class="text-xs px-3 py-2 border rounded-lg hover:bg-gray-50">Clear Range</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
              <button
                v-for="day in attendanceCalendarDays"
                :key="day.date"
                @click="attendanceFilters.from = day.date; attendanceFilters.to = day.date; attendancePage = 1; loadAttendance()"
                class="text-left rounded-xl border p-3 hover:bg-gray-50 transition"
                :class="attendanceFilters.from === day.date && attendanceFilters.to === day.date ? 'ring-2 ring-green-500 border-green-300' : 'border-gray-200'"
              >
                <p class="text-xs text-gray-500">{{ formatDate(day.date) }}</p>
                <p class="mt-1 text-sm font-bold" :class="day.complete ? 'text-green-700' : day.total ? 'text-yellow-700' : 'text-red-700'">
                  <span v-if="day.complete">✅ Complete</span>
                  <span v-else-if="day.total">⚠️ Incomplete</span>
                  <span v-else>❌ No attendance</span>
                </p>
                <p class="text-xs text-gray-500 mt-1">{{ day.present }}/{{ day.total }} present</p>
              </button>
            </div>
          </div>

          <div v-if="attendanceShowWarnings" ref="attendanceWarningsSectionRef" class="bg-white rounded-xl border border-gray-200 shadow-sm p-4" :class="attendanceShowCalendar ? '' : 'lg:col-span-3'">
            <div class="flex items-center justify-between mb-3">
              <h3 class="font-bold text-amber-700">⚡ Attendance Alerts</h3>
              <span class="text-xs text-gray-500">{{ atRiskStudents.length }} alert(s)</span>
            </div>
            <div v-if="atRiskStudents.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
              <div v-for="s in atRiskStudents" :key="s.name" class="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div class="flex items-start justify-between gap-2">
                  <p class="font-semibold text-amber-900 truncate">{{ s.name }}</p>
                  <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold" :class="s.severityClass">
                    {{ s.severity }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-amber-700">
                  {{ s.absent }} absent • {{ s.late }} late • {{ s.rate }}% attendance
                </p>
                <p class="mt-1 text-[11px] text-gray-500">{{ s.reason }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500">No attendance alerts for this course and date range.</p>
          </div>
        </div>

        <!-- Attendance Records Table -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h3 class="text-lg font-bold text-green-800">🧑‍🎓 Student Attendance</h3>
              <p class="text-xs text-gray-500">Showing {{ attendancePageStart }}–{{ attendancePageEnd }} of {{ attendanceDisplayRows.length }} record(s)</p>
            </div>
            <div class="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-800 font-bold">
              {{ selectedAttendanceCourseLabel }}
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-100 text-gray-900">
                <tr>
                  <th v-if="attendanceVisibleColumns.student" class="py-3 px-3 text-left">Student</th>
                  <th v-if="attendanceVisibleColumns.course" class="py-3 px-3 text-left">Course</th>
                  <th v-if="attendanceVisibleColumns.trainer" class="py-3 px-3 text-left">Trainer</th>
                  <th v-if="attendanceVisibleColumns.date" class="py-3 px-3 text-left">Date</th>
                  <th v-if="attendanceVisibleColumns.session" class="py-3 px-3 text-left">Session</th>
                  <th v-if="attendanceVisibleColumns.remarks" class="py-3 px-3 text-left">Remarks</th>
                  <th v-if="attendanceVisibleColumns.status" class="py-3 px-3 text-left">Status</th>
                  <th v-if="attendanceVisibleColumns.rate" class="py-3 px-3 text-left">Rate</th>
                  <th v-if="attendanceVisibleColumns.eligibility" class="py-3 px-3 text-left">Eligibility</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in attendancePaginated" :key="row.key" class="border-b border-gray-100 hover:bg-gray-50">
                  <td v-if="attendanceVisibleColumns.student" class="py-3 px-3 font-semibold text-gray-800">{{ row.student }}</td>
                  <td v-if="attendanceVisibleColumns.course" class="py-3 px-3">{{ row.course }}</td>
                  <td v-if="attendanceVisibleColumns.trainer" class="py-3 px-3">{{ row.trainer }}</td>
                  <td v-if="attendanceVisibleColumns.date" class="py-3 px-3">{{ formatDate(row.date) }}</td>
                  <td v-if="attendanceVisibleColumns.session" class="py-3 px-3">{{ row.session }}</td>
                  <td v-if="attendanceVisibleColumns.remarks" class="py-3 px-3 text-gray-600">{{ row.raw?.remarks || '—' }}</td>
                  <td v-if="attendanceVisibleColumns.status" class="py-3 px-3"><span class="px-2 py-1 rounded-full text-xs font-semibold" :class="attendanceStatusClass(row.status)">{{ row.status }}</span></td>
                  <td v-if="attendanceVisibleColumns.rate" class="py-3 px-3 font-semibold">{{ row.studentRate }}%</td>
                  <td v-if="attendanceVisibleColumns.eligibility" class="py-3 px-3"><span class="px-2 py-1 rounded-full text-xs font-semibold" :class="row.eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">{{ row.eligible ? 'Eligible' : 'Not Eligible' }}</span></td>
                </tr>
                <tr v-if="!attendanceDisplayRows.length">
                  <td :colspan="attendanceVisibleColspan" class="py-8 text-center text-gray-500">No attendance records found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="attendanceTotalPages > 1" class="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50" :disabled="attendancePage === 1" @click="attendancePage--">← Prev</button>
            <div class="flex gap-1 flex-wrap justify-center">
              <button v-for="p in attendancePageButtons" :key="p" class="px-3 py-2 border rounded text-sm" :class="p === attendancePage ? 'bg-green-700 text-white border-green-700' : 'hover:bg-gray-50'" @click="attendancePage = p">{{ p }}</button>
            </div>
            <button class="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50" :disabled="attendancePage === attendanceTotalPages" @click="attendancePage++">Next →</button>
          </div>
        </div>

        <!-- Per Student Attendance History -->
        <div v-if="attendanceShowHistory" ref="attendanceHistorySectionRef" class="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h3 class="text-lg font-bold text-green-800 mb-3">📊 Per Student Attendance History</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div v-for="student in attendanceHistoryPaginated" :key="student.name" class="border border-gray-200 rounded-xl p-4">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-bold text-gray-800 truncate">{{ student.name }}</p>
                  <p class="text-xs text-gray-500">{{ student.present }} present / {{ student.total }} session(s)</p>
                </div>
                <span class="text-sm font-bold">{{ student.rate }}%</span>
              </div>
              <div class="mt-3 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div class="h-2 rounded-full" :class="student.rate >= 80 ? 'bg-green-600' : student.rate >= 60 ? 'bg-yellow-500' : 'bg-red-600'" :style="{ width: student.rate + '%' }"></div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="item in student.timeline.slice(0, 5)" :key="item.key" class="text-xs px-2 py-1 rounded-full" :class="attendanceStatusClass(item.status)">{{ formatDate(item.date) }} — {{ item.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== ISSUED CERTIFICATES (DRIVING / TESDA) ===================== -->
      <div v-else-if="activeTab === 'exams'" class="space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h3 class="text-green-800 font-bold text-lg">📄 Issued Certificates of Completion</h3>
              <p class="text-xs text-gray-500 mt-1">
                {{ reportMode === 'tesda' ? 'TESDA certificate summary by course.' : 'Driving certificate summary by TDC/PDC.' }}
              </p>
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

          <div class="max-w-5xl mx-auto bg-white border border-gray-300 rounded-lg p-6 overflow-x-auto">
            <div class="min-w-[760px]">
              <!-- Header -->
              <div class="relative text-center mb-5">
                <img src="/facet-logo.png" alt="FACET Logo" class="absolute left-0 top-0 w-14 h-14 object-contain" />
                <img
                  v-if="reportMode === 'tesda'"
                  src="/tesda-logo.png"
                  alt="TESDA Logo"
                  class="absolute right-0 top-0 w-14 h-14 object-contain"
                />
                <img
                  v-else
                  src="/lto-logo.png"
                  alt="LTO Logo"
                  class="absolute right-0 top-0 w-14 h-14 object-contain"
                />

                <p class="text-sm font-bold text-red-700">
                  First Asian Cognizance Executive Training Institute (FACET Institute) Corp.
                </p>
                <p class="text-xs font-semibold text-red-600">Holy Spirit, Barcenaga, Naujan, Oriental Mindoro</p>
                <h4 class="mt-4 text-sm font-extrabold text-black uppercase leading-tight">
                  Total No. of Issued Certificates of Completion<br />
                  <span v-if="reportMode === 'tesda'">for TESDA Training Courses</span>
                  <span v-else>for Theoretical and Practical Driving Course</span>
                </h4>
                <p v-if="reportMode === 'tesda'" class="text-xs font-semibold mt-1">TESDA Training Report</p>
                <p v-else class="text-xs font-semibold mt-1">LTO Regional Office No. 4B</p>
                <p class="text-xs">
                  For the Month of
                  <span class="font-bold uppercase">{{ certificateReport.monthLabel }}</span>
                </p>
              </div>

              <!-- TESDA CERTIFICATE REPORT -->
              <template v-if="reportMode === 'tesda'">
                <table class="w-full border border-black text-xs mb-7">
                  <thead>
                    <tr class="bg-[#c9c19a]">
                      <th class="border border-black px-2 py-1 text-left">Summary</th>
                      <th class="border border-black px-2 py-1 text-center w-36">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border border-black px-2 py-1 font-bold">A. TESDA Training Certificates Issued</td>
                      <td class="border border-black px-2 py-1 text-center font-bold">{{ certificateReport.tesdaTotal }}</td>
                    </tr>
                    <tr>
                      <td class="border border-black px-2 py-1 font-bold">B. Courses with Issued Certificates</td>
                      <td class="border border-black px-2 py-1 text-center">{{ certificateReport.tesdaCourseRows.length }}</td>
                    </tr>
                  </tbody>
                </table>

                <h4 class="text-center text-sm font-bold mb-1">TESDA Certificates by Course</h4>
                <table class="w-4/5 mx-auto border border-black text-xs mb-8">
                  <thead>
                    <tr class="bg-[#c9c19a]">
                      <th class="border border-black px-2 py-1">Course</th>
                      <th class="border border-black px-2 py-1 w-40">No. of Issued<br />Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="bg-blue-100"><td colspan="2" class="border border-black px-2 py-1 font-bold">By Course</td></tr>
                    <tr v-for="row in certificateReport.tesdaCourseRows" :key="row.label">
                      <td class="border border-black px-2 py-1">{{ row.label }}</td>
                      <td class="border border-black px-2 py-1 text-center">{{ row.count }}</td>
                    </tr>
                    <tr v-if="certificateReport.tesdaCourseRows.length === 0">
                      <td colspan="2" class="border border-black px-2 py-6 text-center text-gray-500">No issued TESDA certificates</td>
                    </tr>
                    <tr><td class="border border-black px-2 py-1 text-right font-bold">Total</td><td class="border border-black px-2 py-1 text-center font-bold">{{ certificateReport.tesdaTotal }}</td></tr>
                  </tbody>
                </table>

                <h4 class="text-center text-sm font-bold mb-1">TESDA Certificates by Trainer</h4>
                <table class="w-4/5 mx-auto border border-black text-xs">
                  <thead>
                    <tr class="bg-[#c9c19a]">
                      <th class="border border-black px-2 py-1">Trainer</th>
                      <th class="border border-black px-2 py-1 w-40">No. of Issued<br />Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="bg-blue-100"><td colspan="2" class="border border-black px-2 py-1 font-bold">By Trainer</td></tr>
                    <tr v-for="row in certificateReport.tesdaTrainerRows" :key="row.label">
                      <td class="border border-black px-2 py-1">{{ row.label }}</td>
                      <td class="border border-black px-2 py-1 text-center">{{ row.count }}</td>
                    </tr>
                    <tr v-if="certificateReport.tesdaTrainerRows.length === 0">
                      <td colspan="2" class="border border-black px-2 py-6 text-center text-gray-500">No trainer data</td>
                    </tr>
                    <tr><td class="border border-black px-2 py-1 text-right font-bold">Total</td><td class="border border-black px-2 py-1 text-center font-bold">{{ certificateReport.tesdaTotal }}</td></tr>
                  </tbody>
                </table>
              </template>

              <!-- DRIVING CERTIFICATE REPORT -->
              <template v-else>
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
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== FORECAST DETAILS MODAL (DRIVING ONLY) ===================== -->
      <div
        v-if="forecastModalOpen && reportMode === 'driving'"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="forecastModalOpen = false"
      >
        <div class="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
          <div class="p-5 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 class="text-xl font-extrabold text-gray-900">Enrollment Forecast</h3>
              <p class="text-sm text-gray-500 mt-1">Driving courses only • {{ forecastPeriodLabel }}</p>
            </div>
            <button
              @click="forecastModalOpen = false"
              class="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
            >
              ✖ Close
            </button>
          </div>

          <div class="overflow-y-auto p-5 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p class="text-xs font-semibold text-violet-700">Predicted Enrollment</p>
                <h4 class="text-3xl font-extrabold text-violet-900 mt-1">{{ forecast.nextForecast }}</h4>
                <p class="text-xs text-gray-500 mt-1">{{ forecastPeriodLabel }}</p>
              </div>
              <div class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p class="text-xs font-semibold text-slate-600">Prediction Range</p>
                <h4 class="text-2xl font-extrabold text-slate-900 mt-1">{{ forecast.low }}–{{ forecast.high }}</h4>
                <p class="text-xs text-gray-500 mt-1">Low and high possible output</p>
              </div>
              <div class="rounded-2xl border border-green-100 bg-green-50 p-4">
                <p class="text-xs font-semibold text-green-700">Highest Forecast Course</p>
                <h4 class="text-lg font-extrabold text-green-900 mt-1 leading-tight">{{ forecast.topCourse || '-' }}</h4>
                <p class="text-xs text-gray-500 mt-1">Most likely high demand</p>
              </div>
              <div class="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p class="text-xs font-semibold text-blue-700">Data Basis</p>
                <h4 class="text-2xl font-extrabold text-blue-900 mt-1">{{ forecast.dataPoints }}</h4>
                <p class="text-xs text-gray-500 mt-1">Historical records used</p>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div class="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-4">
                <div class="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 class="font-bold text-gray-900">Forecast vs Past Enrollment</h4>
                    <p class="text-xs text-gray-500">Line graph showing past enrollment and forecast point.</p>
                  </div>
                </div>
                <div class="h-72">
                  <VChart :option="forecastLineOption" autoresize />
                </div>
              </div>

              <div class="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                <h4 class="font-bold text-gray-900 mb-3">Past Enrollment Basis</h4>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-xs border border-gray-200 bg-white">
                    <thead class="bg-gray-100">
                      <tr>
                        <th class="py-2 px-2 border text-left">Course</th>
                        <th v-for="m in forecastHistoryLabels" :key="m" class="py-2 px-2 border text-center">{{ m }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in forecastHistoryMatrix" :key="row.course">
                        <td class="py-2 px-2 border font-semibold">{{ row.course }}</td>
                        <td v-for="m in forecastHistoryLabels" :key="m" class="py-2 px-2 border text-center">{{ row.values[m] || 0 }}</td>
                      </tr>
                      <tr v-if="forecastHistoryMatrix.length === 0">
                        <td :colspan="forecastHistoryLabels.length + 1" class="py-5 text-center text-gray-500 border">No historical data.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-white p-4">
              <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                <div>
                  <h4 class="font-bold text-gray-900">Course Forecast Breakdown</h4>
                  <p class="text-xs text-gray-500">Per-course prediction with past basis, forecast, prediction range, and trend.</p>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="min-w-full border border-gray-200 text-sm">
                  <thead class="bg-gray-100 text-gray-900">
                    <tr>
                      <th class="py-2 px-3 text-left border">Course</th>
                      <th class="py-2 px-3 text-center border">Past 3 Periods</th>
                      <th class="py-2 px-3 text-center border">Forecast</th>
                      <th class="py-2 px-3 text-center border">Low</th>
                      <th class="py-2 px-3 text-center border">High</th>
                      <th class="py-2 px-3 text-center border">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in courseForecastRows" :key="row.course" class="hover:bg-gray-50">
                      <td class="py-2 px-3 border font-semibold text-gray-900">{{ row.course }}</td>
                      <td class="py-2 px-3 border text-center font-mono">{{ row.historyLabel }}</td>
                      <td class="py-2 px-3 border text-center font-extrabold text-violet-800">{{ row.forecast }}</td>
                      <td class="py-2 px-3 border text-center">{{ row.low }}</td>
                      <td class="py-2 px-3 border text-center">{{ row.high }}</td>
                      <td class="py-2 px-3 border text-center">
                        <span class="px-2 py-1 rounded-full text-xs font-bold" :class="forecastTrendClass(row.trend)">
                          {{ row.trend }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="courseForecastRows.length === 0">
                      <td colspan="6" class="py-6 text-center text-gray-500 border">No forecast data available yet.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
                  <option v-if="reportMode==='tesda'" value="attendance">TESDA Attendance</option>
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
      attendancePage.value = 1;

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
      if (activeTab.value === "exams") await reloadCertificateReport();
      if (mode === "driving") await loadRevenue();
      if (mode === "tesda") {
        await loadAttendanceTrainers();
        await loadAttendance();
      }

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

    // TESDA KPI: Attendance Rate
    const tesdaKpiLabel = computed(() => `${attendanceRate.value || 0}%`);
    const tesdaActiveCourseCount = computed(() => {
      if (reportMode.value !== "tesda") return 0;
      const ids = new Set(courses.value.map((c) => String(c.id || c.course_id || c.course_name)).filter(Boolean));
      return ids.size || courses.value.length || 0;
    });

    const trend = reactive({ labels: [], values: [] });
    const topCourses = reactive({ labels: [], values: [] });
    const gender = reactive({ labels: ["Male", "Female"], values: [0, 0] });
    const courseMonthlyPreview = ref([]);

    const forecastModalOpen = ref(false);
    const forecast = reactive({
      nextForecast: 0,
      low: 0,
      high: 0,
      topCourse: "",
      confidence: "Low",
      dataPoints: 0,
      algorithmName: "Weighted Moving Average with Trend Adjustment",
      formulaLabel: "50% recent + 30% previous + 20% earlier + trend adjustment",
    });

    const revenueStats = reactive({
      verifiedCount: 0,
      avgFeePeso: 0,
      verifiedRevenuePeso: 0,
      forecastRevenuePeso: 0,
    });

    const revenuePayments = ref([]);
    const detailedRows = ref([]);
    const attendanceRows = ref([]);

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

    // TESDA Attendance local UI state
    const attendanceFilters = reactive({
      courseId: "",
      trainer: "",
      from: "",
      to: "",
      status: "",
    });
    const attendanceStatusMap = reactive({});
    const attendancePage = ref(1);
    const attendancePageSize = ref(10);
    const attendanceShowCalendar = ref(false);
    const attendanceShowWarnings = ref(false);
    const attendanceShowHistory = ref(false);
    const attendanceColumnsOpen = ref(false);
    const attendanceAllTrainers = ref([]);
    const attendanceCourseModalOpen = ref(false);
    const attendanceCourseSearch = ref("");
    const attendanceCourseTrainerMap = ref({});
    const attendanceCourseTrainerLoading = ref(false);
    const attendanceCalendarSectionRef = ref(null);
    const attendanceColumnsSectionRef = ref(null);
    const attendanceHistorySectionRef = ref(null);
    const attendanceVisibleColumns = reactive({
      student: true,
      course: true,
      trainer: true,
      date: true,
      session: false,
      remarks: false,
      status: true,
      rate: true,
      eligibility: true,
    });
    const attendanceColumnOptions = [
      { key: "student", label: "Student" },
      { key: "course", label: "Course" },
      { key: "trainer", label: "Trainer" },
      { key: "date", label: "Date" },
      { key: "session", label: "Session" },
      { key: "remarks", label: "Remarks" },
      { key: "status", label: "Status" },
      { key: "rate", label: "Rate" },
      { key: "eligibility", label: "Eligibility" },
    ];
    watch(() => [attendanceFilters.courseId, attendanceFilters.trainer, attendanceFilters.from, attendanceFilters.to, attendanceFilters.status, attendancePageSize.value], () => {
      attendancePage.value = 1;
    });

    watch(() => attendanceFilters.courseId, async () => {
      if (reportMode.value !== "tesda") return;
      attendanceFilters.trainer = "";
      await loadAttendanceTrainers();
    });

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

    // Forecast helpers: defense-ready Weighted Moving Average + Trend Adjustment
    function normalizeForecastRows() {
      const map = new Map();
      const rows = Array.isArray(courseMonthlyPreview.value) ? courseMonthlyPreview.value : [];

      for (const r of rows) {
        const course = String(r.course_name || r.course || r.name || "Unspecified Course").trim();
        const period = String(r.month_label || r.month || r.period || r.label || "-").trim();
        const count = Number(r.count ?? r.enrollments ?? r.total ?? 0) || 0;
        if (!map.has(course)) map.set(course, new Map());
        const current = map.get(course).get(period) || 0;
        map.get(course).set(period, current + count);
      }

      // Fallback kapag wala pang monthly endpoint data: use Top Courses as one-period basis.
      if (!map.size && Array.isArray(topCourses.labels)) {
        topCourses.labels.forEach((label, i) => {
          const course = String(label || "Unspecified Course").trim();
          const count = Number(topCourses.values?.[i] || 0);
          if (!map.has(course)) map.set(course, new Map());
          map.get(course).set("Current", count);
        });
      }

      return map;
    }

    const forecastHistoryLabels = computed(() => {
      const labels = new Set();
      normalizeForecastRows().forEach((periodMap) => {
        periodMap.forEach((_, period) => labels.add(period));
      });
      return Array.from(labels).slice(-6);
    });

    const forecastHistoryMatrix = computed(() => {
      const labels = forecastHistoryLabels.value;
      const map = normalizeForecastRows();
      return Array.from(map.entries()).map(([course, periodMap]) => {
        const values = {};
        labels.forEach((label) => {
          values[label] = Number(periodMap.get(label) || 0);
        });
        return { course, values };
      });
    });

    function weightedForecast(values) {
      const v = (values || []).map((x) => Number(x || 0)).filter((x) => Number.isFinite(x));
      if (!v.length) return { point: 0, low: 0, high: 0, trend: "No Data", confidence: "Low" };

      const last3 = v.slice(-3);
      let weighted = 0;
      if (last3.length === 1) weighted = last3[0];
      else if (last3.length === 2) weighted = last3[1] * 0.6 + last3[0] * 0.4;
      else weighted = last3[2] * 0.5 + last3[1] * 0.3 + last3[0] * 0.2;

      const first = last3[0] || 0;
      const latest = last3[last3.length - 1] || 0;
      const trendAdjustment = last3.length >= 2 ? (latest - first) / Math.max(1, last3.length - 1) : 0;
      const point = Math.max(0, Math.round(weighted + trendAdjustment));

      const spread = Math.max(1, Math.round(Math.abs(trendAdjustment) + Math.sqrt(Math.max(1, latest))));
      const trend = latest > first ? "Increasing" : latest < first ? "Decreasing" : "Stable";
      const confidence = v.length >= 6 ? "High" : v.length >= 3 ? "Medium" : "Low";

      return {
        point,
        low: Math.max(0, point - spread),
        high: point + spread,
        trend,
        confidence,
      };
    }

    const courseForecastRows = computed(() => {
      if (reportMode.value !== "driving") return [];

      const rows = forecastHistoryMatrix.value.map((row) => {
        const labels = forecastHistoryLabels.value;
        const values = labels.map((m) => Number(row.values[m] || 0));
        const result = weightedForecast(values);
        const multiplier = getForecastMultiplier();
        const point = result.point * multiplier;
        const low = result.low * multiplier;
        const high = result.high * multiplier;
        const history = values.slice(-3);
        const historyLabel = history.length ? history.join(" → ") : "0";
        const explanation =
          result.trend === "Increasing"
            ? `${row.course} is forecasted higher because recent enrollment is increasing based on the latest periods.`
            : result.trend === "Decreasing"
              ? `${row.course} is forecasted lower because recent enrollment is decreasing based on the latest periods.`
              : `${row.course} is expected to remain stable because recent enrollment has minimal movement.`;

        return {
          course: row.course,
          historyLabel,
          forecast: point,
          low,
          high,
          trend: result.trend,
          confidence: result.confidence,
          explanation,
          dataPoints: values.filter((x) => x > 0).length,
        };
      });

      return rows.sort((a, b) => b.forecast - a.forecast || a.course.localeCompare(b.course));
    });

    const forecastLineOption = computed(() => {
      const labels = [...forecastHistoryLabels.value, forecastPeriodLabel.value];
      const pastTotals = forecastHistoryLabels.value.map((label) =>
        forecastHistoryMatrix.value.reduce((sum, row) => sum + Number(row.values[label] || 0), 0)
      );
      const forecastPoint = Number(forecast.nextForecast || 0);
      const lowPoint = Number(forecast.low || 0);
      const highPoint = Number(forecast.high || 0);

      return {
        tooltip: { trigger: "axis" },
        legend: { top: 0 },
        grid: { left: 35, right: 20, top: 45, bottom: 35 },
        xAxis: { type: "category", data: labels },
        yAxis: { type: "value", minInterval: 1 },
        series: [
          {
            name: "Past Enrollment",
            type: "line",
            smooth: true,
            data: [...pastTotals, null],
          },
          {
            name: "Forecast",
            type: "line",
            smooth: true,
            data: [...Array(pastTotals.length).fill(null), forecastPoint],
          },
          {
            name: "Low Range",
            type: "line",
            smooth: true,
            data: [...Array(pastTotals.length).fill(null), lowPoint],
          },
          {
            name: "High Range",
            type: "line",
            smooth: true,
            data: [...Array(pastTotals.length).fill(null), highPoint],
          },
        ],
      };
    });

    const forecastAlgorithmSteps = computed(() => [
      {
        title: "1. Historical enrollment grouping",
        description: "The dashboard groups past driving enrollments by course and period so the forecast is course-specific, not just one total number.",
      },
      {
        title: "2. Weighted Moving Average",
        description: "The latest period receives 50% weight, the previous period 30%, and the earlier period 20%, so recent demand has stronger influence.",
      },
      {
        title: "3. Trend Adjustment",
        description: "The system adjusts the forecast upward or downward depending on whether the latest enrollment pattern is increasing, decreasing, or stable.",
      },
      {
        title: "4. Decision-support output",
        description: "The result shows forecasted courses, ranges, trend labels, and explanations that help the admin plan instructors, schedules, and resources.",
      },
    ]);

    function forecastTrendClass(trendName) {
      if (trendName === "Increasing") return "bg-green-100 text-green-700";
      if (trendName === "Decreasing") return "bg-red-100 text-red-700";
      if (trendName === "Stable") return "bg-blue-100 text-blue-700";
      return "bg-gray-100 text-gray-700";
    }

    function openForecastModal() {
      if (reportMode.value !== "driving") return;
      forecastModalOpen.value = true;
    }


    const revenueForecastCourseLabel = computed(() => {
      if (!revenueTabFilters.courseId) return "all driving courses";
      return courseNameById(revenueTabFilters.courseId);
    });

    const revenueForecastRows = computed(() => {
      const rows = courseForecastRows.value || [];
      if (!revenueTabFilters.courseId) return rows;
      const target = String(courseNameById(revenueTabFilters.courseId) || "").toLowerCase();
      return rows.filter((r) => String(r.course || "").toLowerCase() === target);
    });

    const revenueForecastEnrollment = computed(() =>
      revenueForecastRows.value.reduce((sum, r) => sum + Number(r.forecast || 0), 0),
    );

    const revenueForecastLowPeso = computed(() => {
      const avgFee = Number(revenueStats.avgFeePeso || 0);
      const lowEnrollments = revenueForecastRows.value.reduce((sum, r) => sum + Number(r.low || 0), 0);
      return avgFee > 0 ? Math.round(avgFee * lowEnrollments) : 0;
    });

    const revenueForecastHighPeso = computed(() => {
      const avgFee = Number(revenueStats.avgFeePeso || 0);
      const highEnrollments = revenueForecastRows.value.reduce((sum, r) => sum + Number(r.high || 0), 0);
      return avgFee > 0 ? Math.round(avgFee * highEnrollments) : 0;
    });

    function computeForecastAndRevenueModel() {
      if (reportMode.value !== "driving") {
        forecast.nextForecast = 0;
        forecast.low = 0;
        forecast.high = 0;
        forecast.topCourse = "";
        forecast.confidence = "Not Applicable";
        forecast.dataPoints = 0;
        revenueStats.forecastRevenuePeso = 0;
        return;
      }

      const rows = courseForecastRows.value;
      const predictedTotal = rows.reduce((sum, r) => sum + Number(r.forecast || 0), 0);
      const lowTotal = rows.reduce((sum, r) => sum + Number(r.low || 0), 0);
      const highTotal = rows.reduce((sum, r) => sum + Number(r.high || 0), 0);
      const dataPoints = rows.reduce((sum, r) => sum + Number(r.dataPoints || 0), 0);

      forecast.nextForecast = predictedTotal;
      forecast.low = lowTotal;
      forecast.high = highTotal;
      forecast.topCourse = rows[0]?.course || "-";
      forecast.dataPoints = dataPoints;
      forecast.confidence = dataPoints >= 12 ? "High" : dataPoints >= 6 ? "Medium" : "Low";

      const avgFee = Number(revenueStats.avgFeePeso || 0);
      revenueStats.forecastRevenuePeso = avgFee > 0 ? Math.round(avgFee * revenueForecastEnrollment.value) : 0;
    }

    watch(forecastHorizon, () => {
      computeForecastAndRevenueModel();
    });

    watch(() => revenueTabFilters.courseId, () => {
      computeForecastAndRevenueModel();
    });

    watch(courseMonthlyPreview, () => {
      computeForecastAndRevenueModel();
    }, { deep: true });

    watch(certificateMonth, () => {
      if (activeTab.value === "exams") {
        reloadCertificateReport();
      }
    });

    watch(detailedMonth, () => {
      if (reportMode.value === "driving") syncDetailedMonthToFilters();
    });

    watch(activeTab, async (tab) => {
      if (tab === "attendance" && reportMode.value === "tesda") {
        await loadAttendance();
      }
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

        // TESDA attendance must be per course only. Auto-select the first course if none is selected.
        if (reportMode.value === "tesda" && !attendanceFilters.courseId && courses.value.length) {
          const firstCourse = courses.value[0];
          attendanceFilters.courseId = String(firstCourse.id || firstCourse.course_id || "");
        }
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
        forecastModalOpen.value = false;
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


    async function loadAttendanceTrainers() {
      if (reportMode.value !== "tesda") return;

      try {
        const today = toISODateLocal(new Date());
        const params = new URLSearchParams({
          report_mode: "tesda",
          from: "2000-01-01",
          to: today,
          course_id: attendanceFilters.courseId || "",
          trainer_id: "",
          status: "",
          q: "",
        });

        const json = await apiGet(`/api/admin/reports/attendance?${params.toString()}`);
        const rows = Array.isArray(json.trainers)
          ? json.trainers
          : (json.status === "success" && Array.isArray(json.data) ? json.data : []);

        const map = new Map();
        for (const t of rows) {
          const id = String(t.id || t.trainer_id || "");
          const name = t.name || t.trainer_name || t.instructor_name || "Trainer";
          if (id) map.set(id, { id, name, raw: t });
        }

        attendanceAllTrainers.value = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
      } catch (e) {
        attendanceAllTrainers.value = [];
      }
    }

    async function loadAttendanceCourseTrainers(force = false) {
      if (reportMode.value !== "tesda") return;
      if (!force && Object.keys(attendanceCourseTrainerMap.value || {}).length) return;

      attendanceCourseTrainerLoading.value = true;
      try {
        const today = toISODateLocal(new Date());
        const result = {};

        await Promise.all((courses.value || []).map(async (course) => {
          const courseId = String(course.id || course.course_id || "");
          if (!courseId) return;

          const params = new URLSearchParams({
            report_mode: "tesda",
            from: "2000-01-01",
            to: today,
            course_id: courseId,
            trainer_id: "",
            status: "",
            q: "",
          });

          try {
            const json = await apiGet(`/api/admin/reports/attendance?${params.toString()}`);
            const trainerRows = Array.isArray(json.trainers)
              ? json.trainers
              : (json.status === "success" && Array.isArray(json.data) ? json.data : []);

            const trainerMap = new Map();
            for (const t of trainerRows) {
              const id = String(t.id || t.trainer_id || "");
              const name = t.name || t.trainer_name || t.instructor_name || "Trainer";
              if (id || name) trainerMap.set(id || name, { id, name });
            }
            result[courseId] = [...trainerMap.values()];
          } catch {
            result[courseId] = [];
          }
        }));

        attendanceCourseTrainerMap.value = result;
      } finally {
        attendanceCourseTrainerLoading.value = false;
      }
    }

    async function openAttendanceCourseModal() {
      attendanceCourseModalOpen.value = true;
      await nextTick();
      await loadAttendanceCourseTrainers(false);
    }

    async function selectAttendanceCourse(course) {
      attendanceFilters.courseId = String(course.id || course.course_id || "");
      attendanceFilters.trainer = "";
      attendancePage.value = 1;
      attendanceCourseModalOpen.value = false;
      await loadAttendanceTrainers();
      await loadAttendance();
    }

    async function clearAttendanceCourse() {
      // Keep attendance per-course only; fallback to first available course.
      const firstCourse = (courses.value || [])[0];
      attendanceFilters.courseId = firstCourse ? String(firstCourse.id || firstCourse.course_id || "") : "";
      attendanceFilters.trainer = "";
      attendancePage.value = 1;
      await loadAttendanceTrainers();
      await loadAttendance();
    }

    function getCourseTrainerNames(courseId) {
      const list = attendanceCourseTrainerMap.value?.[String(courseId)] || [];
      return list.map((t) => t.name || t.trainer_name || "Trainer").filter(Boolean);
    }

    async function toggleAttendancePanel(panel) {
      if (panel === "calendar") attendanceShowCalendar.value = !attendanceShowCalendar.value;
      if (panel === "warnings") attendanceShowWarnings.value = !attendanceShowWarnings.value;
      if (panel === "history") attendanceShowHistory.value = !attendanceShowHistory.value;
      if (panel === "columns") attendanceColumnsOpen.value = !attendanceColumnsOpen.value;

      await nextTick();

      const target =
        panel === "calendar"
          ? attendanceCalendarSectionRef.value
          : panel === "warnings"
            ? attendanceWarningsSectionRef.value || attendanceCalendarSectionRef.value
            : panel === "history"
              ? attendanceHistorySectionRef.value
              : attendanceColumnsSectionRef.value;

      target?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }

    async function loadAttendance() {
      if (reportMode.value !== "tesda") {
        attendanceRows.value = [];
        return;
      }

      // Force TESDA attendance to always be course-based.
      if (!attendanceFilters.courseId && (courses.value || []).length) {
        const firstCourse = courses.value[0];
        attendanceFilters.courseId = String(firstCourse.id || firstCourse.course_id || "");
      }

      try {
        const today = toISODateLocal(new Date());
        let from = "2000-01-01";
        let to = today;

        if (attendanceFilters.from || attendanceFilters.to) {
          from = attendanceFilters.from || "2000-01-01";
          to = attendanceFilters.to || today;
        } else {
          const r = getRangeDates(detailedTabFilters.dateRange, detailedTabFilters.customFrom, detailedTabFilters.customTo);
          from = r.from || "2000-01-01";
          to = r.to || today;
        }

        if (from && to && new Date(from) > new Date(to)) {
          const temp = from;
          from = to;
          to = temp;
          attendanceFilters.from = from;
          attendanceFilters.to = to;
        }

        const params = new URLSearchParams({
          report_mode: "tesda",
          from,
          to,
          course_id: attendanceFilters.courseId || "",
          trainer_id: attendanceFilters.trainer || "",
          status: attendanceFilters.status ? String(attendanceFilters.status).toLowerCase() : "",
          q: searchQuery.value || "",
        });

const json = await apiGet(`/api/admin/reports/attendance?${params.toString()}`);

attendanceRows.value =
  json.status === "success" && Array.isArray(json.data) ? json.data : [];

// ✅ ito ang magpapalabas ng lahat ng trainers galing backend
if (json.status === "success" && Array.isArray(json.trainers)) {
  attendanceAllTrainers.value = json.trainers
    .map((t) => ({
      id: String(t.id || t.trainer_id || ""),
      name: t.name || t.trainer_name || "Trainer",
      raw: t,
    }))
    .filter((t) => t.id);
}

attendancePage.value = 1;
      } catch (e) {
        console.error("loadAttendance error:", e);
        attendanceRows.value = [];
      }
    }

    async function reloadOverview() {
      revenuePage.value = 1;
      detailedPage.value = 1;
      attendancePage.value = 1;
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

    const baseAttendanceRows = computed(() => {
      const rows = reportMode.value === "tesda" ? attendanceRows.value : [];
      return rows.map((r, idx) => {
        const key = String(r.attendance_id || r.id || `${r.trainer_id || "t"}-${r.student_id || "s"}-${r.course_id || "c"}-${r.attendance_date || idx}`);
        const rawStatus = String(r.status || r.attendance_status || "unmarked").toLowerCase();
        const status = rawStatus === "present" ? "Present" : rawStatus === "late" ? "Late" : rawStatus === "absent" ? "Absent" : "Unmarked";
        if (!attendanceStatusMap[key]) attendanceStatusMap[key] = status;
        const date = r.attendance_date || r.schedule_date || r.course_start || r.created_at || Date.now();
        const safeDate = toISODateLocal(new Date(date));
        const trainerId = String(r.trainer_id || "");
        const studentId = String(r.student_id || "");
        const courseId = String(r.course_id || r.courseId || "");
        return {
          key,
          raw: r,
          studentId,
          trainerId,
          courseId,
          student: r.student_name || r.fullname || r.group_label || "-",
          course: r.course_name || "-",
          trainer: r.trainer_name || r.instructor_name || "Unassigned",
          date: safeDate,
          session: r.session_label || r.session_name || r.session_title || "Session",
          status: attendanceStatusMap[key] || status,
          backendRate: Number(r.attendance_rate || 0),
          backendEligibility: r.eligibility || "",
        };
      });
    });

    const attendanceTrainerOptions = computed(() => {
      const map = new Map();
      for (const t of attendanceAllTrainers.value) {
        if (t.id) map.set(String(t.id), t.name || "Trainer");
      }
      for (const r of baseAttendanceRows.value) {
        if (!r.trainerId) continue;
        if (!map.has(String(r.trainerId))) map.set(String(r.trainerId), r.trainer || "Trainer");
      }
      return [...map.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });

    const selectedAttendanceTrainerLabel = computed(() => {
      if (!attendanceFilters.trainer) return "All trainers";
      return attendanceTrainerOptions.value.find((t) => String(t.id) === String(attendanceFilters.trainer))?.name || "Selected trainer";
    });

    const selectedAttendanceCourse = computed(() => {
      const id = String(attendanceFilters.courseId || "");
      return (courses.value || []).find((c) => String(c.id || c.course_id || "") === id) || null;
    });

    const selectedAttendanceCourseLabel = computed(() => {
      if (!attendanceFilters.courseId) return "Choose a course";
      return selectedAttendanceCourse.value?.course_name || "Selected course";
    });

    const selectedAttendanceCourseTrainers = computed(() => {
      if (!attendanceFilters.courseId) return [];
      return getCourseTrainerNames(attendanceFilters.courseId);
    });

    const attendanceCourseOptions = computed(() => {
      const q = String(attendanceCourseSearch.value || "").trim().toLowerCase();
      let list = (courses.value || []).map((c) => ({
        ...c,
        id: String(c.id || c.course_id || ""),
      })).filter((c) => c.id);

      if (!q) return list;

      return list.filter((course) => {
        const trainers = getCourseTrainerNames(course.id).join(" ");
        const hay = [course.course_name, course.course_code, trainers].join(" ").toLowerCase();
        return hay.includes(q);
      });
    });

    const attendanceFiltered = computed(() => {
      let arr = [...baseAttendanceRows.value];
      const f = attendanceFilters;
      if (f.courseId) arr = arr.filter((r) => String(r.courseId) === String(f.courseId));
      if (f.trainer) arr = arr.filter((r) => String(r.trainerId) === String(f.trainer));
      if (f.from) arr = arr.filter((r) => new Date(r.date) >= new Date(f.from));
      if (f.to) arr = arr.filter((r) => new Date(r.date) <= new Date(f.to));
      if (f.status) arr = arr.filter((r) => r.status === f.status);
      return arr.map((r) => {
        const studentRows = baseAttendanceRows.value.filter((x) => x.studentId === r.studentId && x.courseId === r.courseId && x.trainerId === r.trainerId);
        const presentLike = studentRows.filter((x) => x.status === "Present" || x.status === "Late").length;
        const rate = r.backendRate || (studentRows.length ? Math.round((presentLike / studentRows.length) * 100) : 0);
        return { ...r, studentRate: rate, eligible: r.backendEligibility ? r.backendEligibility === "Eligible" : rate >= 80 };
      });
    });

    const attendanceDisplayRows = computed(() => attendanceFiltered.value);

    const attendanceTotalPages = computed(() => Math.max(1, Math.ceil(attendanceDisplayRows.value.length / attendancePageSize.value)));
    const attendancePageStart = computed(() => attendanceDisplayRows.value.length ? (attendancePage.value - 1) * attendancePageSize.value + 1 : 0);
    const attendancePageEnd = computed(() => Math.min(attendancePage.value * attendancePageSize.value, attendanceDisplayRows.value.length));
    const attendancePaginated = computed(() => {
      const start = (attendancePage.value - 1) * attendancePageSize.value;
      return attendanceDisplayRows.value.slice(start, start + attendancePageSize.value);
    });
    const attendancePageButtons = computed(() => {
      const total = attendanceTotalPages.value;
      const cur = attendancePage.value;
      const start = Math.max(1, cur - 2);
      const end = Math.min(total, cur + 2);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });
    const attendanceVisibleColspan = computed(() => Math.max(1, Object.values(attendanceVisibleColumns).filter(Boolean).length));

    const attendanceSummary = computed(() => {
      const rows = attendanceFiltered.value;
      return {
        totalStudents: new Set(rows.map((r) => r.student)).size,
        present: rows.filter((r) => r.status === "Present").length,
        late: rows.filter((r) => r.status === "Late").length,
        absent: rows.filter((r) => r.status === "Absent").length,
      };
    });

    const attendanceRate = computed(() => {
      const rows = attendanceFiltered.value;
      if (!rows.length) return 0;
      const presentLike = rows.filter((r) => r.status === "Present" || r.status === "Late").length;
      return Math.round((presentLike / rows.length) * 100);
    });

    const attendanceHistory = computed(() => {
      const map = new Map();
      for (const r of baseAttendanceRows.value) {
        const key = `${r.studentId}-${r.courseId}-${r.trainerId}`;
        if (!map.has(key)) map.set(key, { name: r.student, rows: [] });
        map.get(key).rows.push(r);
      }
      return [...map.values()].map(({ name, rows }) => {
        const present = rows.filter((r) => r.status === "Present" || r.status === "Late").length;
        const rate = rows.length ? Math.round((present / rows.length) * 100) : 0;
        return { name, total: rows.length, present, rate, timeline: rows };
      }).sort((a, b) => a.name.localeCompare(b.name));
    });

    const attendanceHistoryPaginated = computed(() => attendanceHistory.value.slice(0, 9));

    const atRiskStudents = computed(() => {
      const severityRank = { Critical: 3, Warning: 2, Notice: 1 };

      return attendanceHistory.value
        .map((s) => {
          const absent = s.timeline.filter((x) => x.status === "Absent").length;
          const late = s.timeline.filter((x) => x.status === "Late").length;
          const unmarked = s.timeline.filter((x) => x.status === "Unmarked").length;

          let severity = "Notice";
          let reason = "Minor attendance concern.";
          let severityClass = "bg-blue-100 text-blue-700";

          if (absent >= 3 || s.rate < 80) {
            severity = "Critical";
            reason = "Attendance is below the TESDA monitoring target or has repeated absences.";
            severityClass = "bg-red-100 text-red-700";
          } else if (absent >= 1 || late >= 3 || unmarked >= 1) {
            severity = "Warning";
            reason = "Has absence, repeated lateness, or incomplete attendance marking.";
            severityClass = "bg-amber-100 text-amber-700";
          } else if (late >= 1) {
            severity = "Notice";
            reason = "Has late attendance record that may need monitoring.";
            severityClass = "bg-blue-100 text-blue-700";
          }

          return { ...s, absent, late, unmarked, severity, reason, severityClass };
        })
        .filter((s) => s.absent > 0 || s.late > 0 || s.unmarked > 0 || s.rate < 80)
        .sort((a, b) => {
          const bySeverity = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
          if (bySeverity) return bySeverity;
          return (b.absent + b.late + b.unmarked) - (a.absent + a.late + a.unmarked);
        })
        .slice(0, 10);
    });

    const attendanceCalendarDays = computed(() => {
      const map = new Map();
      for (const r of baseAttendanceRows.value) {
        if (!map.has(r.date)) map.set(r.date, []);
        map.get(r.date).push(r);
      }
      return [...map.entries()]
        .map(([date, rows]) => {
          const present = rows.filter((r) => r.status === "Present" || r.status === "Late").length;
          return { date, total: rows.length, present, complete: rows.length > 0 && present === rows.length };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 12);
    });

    function attendanceStatusClass(status) {
      if (status === "Present") return "bg-green-100 text-green-700";
      if (status === "Late") return "bg-yellow-100 text-yellow-700";
      if (status === "Absent") return "bg-red-100 text-red-700";
      return "bg-gray-100 text-gray-700";
    }

    function buildAttendanceTable() {
      const rows = attendanceFiltered.value.map((r) => [
        r.student,
        r.course,
        r.trainer,
        formatDate(r.date),
        r.session,
        r.raw?.remarks || "",
        r.status,
        `${r.studentRate}%`,
        r.eligible ? "Eligible" : "Not Eligible",
      ]);
      return {
        sheetName: "TESDA Attendance",
        headers: ["Student Name", "Course", "Trainer", "Date", "Session", "Remarks", "Status", "Attendance Rate", "Completion Eligibility"],
        rows,
      };
    }

    function exportAttendance(format = "xlsx") {
      const table = buildAttendanceTable();
      const filename = `tesda-attendance-${new Date().toISOString().slice(0, 10)}`;
      if (format === "pdf") return exportPdf(table, filename, { title: "TESDA ATTENDANCE REPORT", target: "attendance" });
      return exportXlsx([table], filename);
    }


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
      attendancePage.value = 1;
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
      } else if (newTab === "attendance") {
        if (reportMode.value === "tesda") loadDetailed();
        else activeTab.value = "overview";
      } else if (newTab === "exams") {
        reloadCertificateReport();
      }
    });

    // ✅ When switching mode:
    watch(reportMode, async () => {
      if (activeTab.value === "revenue" || (activeTab.value === "attendance" && reportMode.value === "driving")) activeTab.value = "overview";

      overviewError.value = "";
      revenueError.value = "";
      detailedError.value = "";

      await loadOverview();
      await loadDetailed();
      if (activeTab.value === "exams") await reloadCertificateReport();
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

      const countBy = (items, getter, keys = []) => {
        const out = {};
        keys.forEach((k) => (out[k] = 0));
        items.forEach((item) => {
          const key = getter(item) || "-";
          out[key] = Number(out[key] || 0) + 1;
        });
        return out;
      };

      if (reportMode.value === "tesda") {
        const tesdaRows = rows;
        const courseCounts = countBy(tesdaRows, (r) => r.course_name || "Unspecified Course");
        const trainerCounts = countBy(tesdaRows, (r) => r.trainer_name || r.instructor_name || "No trainer assigned");
        const courseOrder = Object.keys(courseCounts).sort((a, b) => a.localeCompare(b));
        const trainerOrder = Object.keys(trainerCounts).sort((a, b) => a.localeCompare(b));

        return {
          monthLabel: certificateMonthLabel(certificateMonth.value),
          tesdaTotal: tesdaRows.length,
          tesdaCourseRows: courseOrder.map((label) => ({ label, count: Number(courseCounts[label] || 0) })),
          tesdaTrainerRows: trainerOrder.map((label) => ({ label, count: Number(trainerCounts[label] || 0) })),
          tdcTotal: 0,
          pdcTotal: 0,
          tdc: { sex: { Male: 0, Female: 0 } },
          pdc: { sex: { Male: 0, Female: 0 } },
          trainingPurposeRows: [],
          dlCodeRows: [],
          dlCodeTotal: 0,
        };
      }

      const tdcRows = rows.filter((r) => normalizeCourseType(r) === "tdc");
      const pdcRows = rows.filter((r) => normalizeCourseType(r) === "pdc");

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
        tesdaTotal: 0,
        tesdaCourseRows: [],
        tesdaTrainerRows: [],
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

      if (reportMode.value === "tesda") {
        return [
          {
            sheetName: "TESDA Certificate Summary",
            headers: ["Summary", "Total"],
            rows: [
              ["A. TESDA Training Certificates Issued", r.tesdaTotal],
              ["B. Courses with Issued Certificates", r.tesdaCourseRows.length],
            ],
          },
          {
            sheetName: "TESDA By Course",
            headers: ["Course", "No. of Issued Certificates"],
            rows: [...r.tesdaCourseRows.map((x) => [x.label, x.count]), ["Total", r.tesdaTotal]],
          },
          {
            sheetName: "TESDA By Trainer",
            headers: ["Trainer", "No. of Issued Certificates"],
            rows: [...r.tesdaTrainerRows.map((x) => [x.label, x.count]), ["Total", r.tesdaTotal]],
          },
        ];
      }

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
        return exportMulti(buildCertificateTables(), exportFileName.value, { title: reportMode.value === "tesda" ? "TOTAL NO. OF ISSUED TESDA CERTIFICATES OF COMPLETION" : "TOTAL NO. OF ISSUED CERTIFICATES OF COMPLETION", target: "certificates" });
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

        const isTesdaPdf = reportMode.value === "tesda" && ["detailed", "attendance", "certificates"].includes(String(options.target || ""));
        doc.setFont("helvetica", "bold");
        if (isTesdaPdf) {
          doc.text(options.title || "TESDA TRAINING REPORT", pageWidth / 2, 57, { align: "center" });
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

      const facetLogo = new Image();
      const ltoLogo = new Image();
      const drawSection = (section, pageIndex, facetLogoImg = null, ltoLogoImg = null) => {
        if (pageIndex > 0) doc.addPage(longLandscape, "landscape");

        try {
          if (facetLogoImg) doc.addImage(facetLogoImg, "PNG", margin + 8, 22, 54, 54);
          if (ltoLogoImg) doc.addImage(ltoLogoImg, "PNG", pageWidth - margin - 62, 22, 54, 54);
        } catch (_) {}

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
        doc.setFontSize(13);
        doc.text(monthLabel, pageWidth / 2, 100, { align: "center" });
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
          startY: 116,
          head: headers,
          body,
          margin: { top: 116, right: tableLeft, bottom: 30, left: tableLeft },
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

      const save = (facetLogoImg = null, ltoLogoImg = null) => {
        exportSections.forEach((section, index) => drawSection(section, index, facetLogoImg, ltoLogoImg));
        doc.save(`${filename}.pdf`);
      };

      const loadImg = (img, src) => new Promise((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

      Promise.all([
        loadImg(facetLogo, "/facet-logo.png"),
        loadImg(ltoLogo, "/lto-logo.png"),
      ]).then(([facetImg, ltoImg]) => save(facetImg, ltoImg));
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
          return exportMulti(buildCertificateTables(), exportFileName.value, { title: reportMode.value === "tesda" ? "TOTAL NO. OF ISSUED TESDA CERTIFICATES OF COMPLETION" : "TOTAL NO. OF ISSUED CERTIFICATES OF COMPLETION", target: "certificates" });
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
      tesdaActiveCourseCount,

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
      forecastModalOpen,
      openForecastModal,
      courseForecastRows,
      forecastHistoryLabels,
      forecastHistoryMatrix,
      forecastLineOption,
      forecastAlgorithmSteps,
      forecastTrendClass,

      // data
      courses,
      summary,
      trend,
      topCourses,
      gender,
      courseMonthlyPreview,
      forecast,
      revenueStats,
      revenueForecastCourseLabel,
      revenueForecastLowPeso,
      revenueForecastHighPeso,
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
      loadAttendance,
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

      // TESDA attendance
      attendanceFilters,
      attendanceRows,
      attendanceStatusMap,
      attendancePage,
      attendancePageSize,
      attendanceShowCalendar,
      attendanceShowWarnings,
      attendanceShowHistory,
      attendanceColumnsOpen,
      attendanceVisibleColumns,
      attendanceColumnOptions,
      attendanceVisibleColspan,
      attendanceTrainerOptions,
      selectedAttendanceTrainerLabel,
      attendanceCourseModalOpen,
      attendanceCourseSearch,
      attendanceCourseTrainerLoading,
      attendanceCourseOptions,
      selectedAttendanceCourseLabel,
      selectedAttendanceCourseTrainers,
      openAttendanceCourseModal,
      selectAttendanceCourse,
      clearAttendanceCourse,
      getCourseTrainerNames,
      toggleAttendancePanel,
      attendanceCalendarSectionRef,
      attendanceColumnsSectionRef,
      attendanceHistorySectionRef,
      attendanceFiltered,
      attendanceDisplayRows,
      attendancePaginated,
      attendanceTotalPages,
      attendancePageStart,
      attendancePageEnd,
      attendancePageButtons,
      attendanceSummary,
      attendanceRate,
      attendanceHistory,
      attendanceHistoryPaginated,
      atRiskStudents,
      attendanceCalendarDays,
      attendanceStatusClass,
      exportAttendance,

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