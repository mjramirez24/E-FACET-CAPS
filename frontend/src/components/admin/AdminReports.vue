<!-- frontend/src/components/AdminReports.vue (FULL UPDATED: + Single Switch Button Driving/TESDA) -->
<template>
  <AdminLayout>
    <!-- Header-left: search + SWITCH -->
    <template #header-left>
        <div class="flex items-center gap-3 w-full">
          <div class="search-box" style="max-width: 320px;">
            <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search in tables..."
              v-model="searchQuery"
              class="search-input-modern"
            />
          </div>
        </div>
      </template>

    <!-- PAGE HEADER -->
        <div class="page-header-row mb-5">
          <div class="flex justify-between items-center w-full flex-wrap gap-3">
            <div>
              <h2 class="page-title">
                📈 Analytics &amp; Reports
                <span class="page-title-accent" :class="reportMode==='driving' ? 'accent-green' : 'accent-blue'">
                  — {{ reportModeLabel }}
                </span>
              </h2>
              <p class="page-subtitle">Enrollment, revenue, attendance and certificate insights.</p>
            </div>

            <!-- ✅ SINGLE SWITCH BUTTON -->
            <button
              @click="toggleReportMode"
              class="tab-btn"
              :class="reportMode === 'driving' ? 'tab-active-green' : 'tab-active-blue'"
              :title="reportMode === 'driving' ? 'Switch to TESDA' : 'Switch to Driving'"
            >
              <span v-if="reportMode === 'driving'">🚗 Driving</span>
              <span v-else>🎓 TESDA</span>
              <span class="ml-1 opacity-90">⇄</span>
            </button>
          </div>

      <!-- TOP SUMMARY -->
      <div class="kpi-grid mb-5" :class="reportMode === 'driving' ? 'kpi-grid-4' : 'kpi-grid-3'">
        <div class="kpi-card kpi-green">
          <p class="kpi-label">
            Total Enrolled
            <span v-if="reportMode === 'driving'" style="font-weight: normal; opacity: 0.8;">
              (Starting January 2024)
            </span>
          </p>
          <h3 class="kpi-value">{{ summary.totalEnrolled }}</h3>
        </div>

        <div class="kpi-card kpi-blue">
          <p class="kpi-label">{{ reportMode === 'tesda' ? 'TESDA Active Courses' : 'Most Popular Course' }}</p>
          <h3 v-if="reportMode === 'tesda'" class="kpi-value">{{ tesdaActiveCourseCount }}</h3>
          <h3 v-else class="kpi-value kpi-value-text">{{ summary.mostPopularCourse || "-" }}</h3>
        </div>

        <!-- ✅ DRIVING ONLY: REVENUE CARD -->
        <div v-if="reportMode === 'driving'" class="kpi-card kpi-emerald">
          <p class="kpi-label">💰 Verified Revenue</p>
          <h3 class="kpi-value">{{ formatCurrency(summary.totalRevenuePeso) }}</h3>
        </div>

        <!-- ✅ TESDA ONLY: Attendance KPI -->
        <div v-else class="kpi-card kpi-emerald">
          <p class="kpi-label">📌 Attendance Rate</p>
          <h3 class="kpi-value">{{ tesdaKpiLabel }}</h3>
        </div>

        <!-- ✅ DRIVING ONLY: compact clickable forecast card -->
        <button
            v-if="reportMode === 'driving'"
            type="button"
            @click="openForecastModal"
            class="kpi-card kpi-violet kpi-card-clickable"
          >
            <!-- LOADING STATE -->
            <div v-if="mlForecastLoading" class="flex items-center gap-3">
              <svg class="animate-spin h-5 w-5 flex-shrink-0" style="color:#6d28d9;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <div class="min-w-0 text-left">
                <p class="kpi-label" style="margin:0;">🔮 Enrollment Forecast</p>
                <p class="kpi-subtext" style="margin-top:4px;">Computing forecast from past enrollments…</p>
              </div>
            </div>

            <!-- LOADED STATE (existing content) -->
            <div v-else class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="kpi-label">🔮 Enrollment Forecast</p>
                <div class="mt-2 flex items-end gap-2">
                  <h3 class="kpi-value" style="margin:0;">{{ forecast.nextForecast }}</h3>
                  <span class="kpi-unit">students</span>
                </div>
                <p class="kpi-subtext">Prediction Range: <b>{{ forecast.low }}–{{ forecast.high }}</b></p>
                <p class="kpi-subtext truncate">Highest Course: <b>{{ forecast.topCourse || '-' }}</b></p>
              </div>
              <span class="pill pill-violet-outline">View</span>
            </div>
          </button>
      </div>

      <!-- TABS -->
      <div class="tab-group mb-5">
        <button
          class="tab-btn"
          :class="activeTab==='overview' ? 'tab-active-green' : 'tab-inactive'"
          @click="activeTab='overview'"
        >
          Overview
        </button>

        <!-- ✅ DRIVING ONLY: Revenue -->
        <button
          v-if="reportMode === 'driving'"
          class="tab-btn"
          :class="activeTab==='revenue' ? 'tab-active-green' : 'tab-inactive'"
          @click="activeTab='revenue'"
        >
          Revenue
        </button>

        <button
          class="tab-btn"
          :class="activeTab==='detailed' ? 'tab-active-green' : 'tab-inactive'"
          @click="activeTab='detailed'"
        >
          Detailed Reports
        </button>

        <!-- ✅ TESDA ONLY: Attendance -->
        <button
          v-if="reportMode === 'tesda'"
          class="tab-btn"
          :class="activeTab==='attendance' ? 'tab-active-blue' : 'tab-inactive'"
          @click="activeTab='attendance'"
        >
          Attendance
        </button>

        <!-- ✅ Issued Certificates (Driving / TESDA) -->
        <button
          class="tab-btn"
          :class="activeTab==='exams' ? 'tab-active-green' : 'tab-inactive'"
          @click="activeTab='exams'"
        >
          Issued Certificates
        </button>
      </div>

      <!-- ===================== OVERVIEW ===================== -->
      <div v-if="activeTab === 'overview'" class="stack-6">
        <!-- OVERVIEW FILTERS -->
        <div class="panel-card" style="padding: 20px;">
          <div class="filters-panel" style="background: transparent; border: none; padding: 0;">
            <div class="filter-field">
              <label class="filter-label">Date Range</label>
              <select v-model="overviewFilters.dateRange" class="select-modern-sm" style="width: 200px;">
                <option value="allMonths">All Months</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom</option>
              </select>
              <div v-if="overviewFilters.dateRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
                <input v-model="overviewFilters.customFrom" type="date" class="date-input-modern" style="width: 130px;" />
                <input v-model="overviewFilters.customTo" type="date" class="date-input-modern" style="width: 130px;" />
              </div>
            </div>

            <div class="filter-field">
              <label class="filter-label">Course (Trend)</label>
              <select v-model="overviewFilters.courseId" class="select-modern-sm" style="width: 220px;">
                <option value="">All courses</option>
                <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                  {{ c.course_name }}
                </option>
              </select>
            </div>

            <div class="filter-field">
              <label class="filter-label">Trend Period</label>
              <div class="toggle-row">
                <button type="button" @click="setTrendPeriod('day')" class="toggle-btn" :class="trendPeriod==='day' ? 'toggle-btn-active-green' : ''">Day</button>
                <button type="button" @click="setTrendPeriod('week')" class="toggle-btn" :class="trendPeriod==='week' ? 'toggle-btn-active-green' : ''">Week</button>
                <button type="button" @click="setTrendPeriod('month')" class="toggle-btn" :class="trendPeriod==='month' ? 'toggle-btn-active-green' : ''">Month</button>
              </div>
            </div>

            <div v-if="reportMode === 'driving'" class="filter-field">
              <label class="filter-label">Forecast Horizon</label>
              <select v-model="forecastHorizon" class="select-modern-sm" style="width: 170px;">
                <option v-for="option in forecastHorizonOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>

            <button @click="reloadOverview()" class="pg-btn pg-btn-accent" style="align-self: flex-end;">Apply</button>
            <button @click="openExport('overview')" class="pg-btn pg-btn-emerald" style="align-self: flex-end;">📤 Export Overview</button>
          </div>

          <div class="mt-3 flex items-center justify-between flex-wrap gap-2">
            <p class="filter-note">Last updated: {{ lastUpdated }}</p>
            <div class="flex gap-2 flex-wrap">
              <button @click="downloadChartImage('trend')" class="pg-btn" style="padding: 7px 12px; font-size: 0.75rem;">🖼️ Trend PNG</button>
              <button @click="downloadChartImage('topCourses')" class="pg-btn" style="padding: 7px 12px; font-size: 0.75rem;">🖼️ Top Courses PNG</button>
              <button @click="downloadChartImage('gender')" class="pg-btn" style="padding: 7px 12px; font-size: 0.75rem;">🖼️ Gender PNG</button>
            </div>
          </div>

          <div v-if="overviewError" class="alert-error mt-3">{{ overviewError }}</div>
        </div>

        <!-- OVERVIEW CHARTS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- Enrollment Trend -->
          <div class="panel-card" style="padding: 20px;">
            <div class="flex items-start justify-between gap-3 mb-3">
              <h3 class="panel-title">Enrollment Trend</h3>
              <button @click="openExport('overview-trend')" class="pg-btn pg-btn-emerald" style="padding: 7px 12px; font-size: 0.75rem;">📤 Export Trend</button>
            </div>

            <div class="h-64">
              <VChart ref="trendChartRef" :option="trendOption" autoresize />
            </div>

            <p v-if="overviewLoading" class="filter-note mt-2">Loading overview…</p>
          </div>

          <!-- Top Courses -->
          <div class="panel-card" style="padding: 20px;">
            <div class="flex items-start justify-between gap-3 mb-3">
              <h3 class="panel-title">Top Courses</h3>
              <button @click="openExport('overview-top-courses')" class="pg-btn pg-btn-emerald" style="padding: 7px 12px; font-size: 0.75rem;">📤 Export Courses</button>
            </div>

            <div class="h-64">
              <VChart ref="topCoursesChartRef" :option="topCoursesOption" autoresize />
            </div>
          </div>

          <!-- Gender Distribution -->
          <div class="panel-card" style="padding: 20px;">
            <div class="flex items-start justify-between gap-3 mb-3">
              <h3 class="panel-title">Students by Gender</h3>
              <button @click="openExport('overview-gender')" class="pg-btn pg-btn-emerald" style="padding: 7px 12px; font-size: 0.75rem;">📤 Export Gender</button>
            </div>

            <div class="h-64">
              <VChart ref="genderChartRef" :option="genderOption" autoresize />
            </div>
          </div>

          <!-- Course Monthly Summary -->
          <div class="panel-card" style="padding: 20px;">
            <div class="flex items-start justify-between gap-3 mb-3">
              <h3 class="panel-title">Course Enrollments per Month</h3>
              <button @click="openExport('overview-monthly')" class="pg-btn pg-btn-emerald" style="padding: 7px 12px; font-size: 0.75rem;">📤 Export Monthly</button>
            </div>

            <div class="table-wrap" style="max-height: 340px; overflow-y: auto;">
              <table class="modern-table">
                <thead class="thead-green">
                  <tr>
                    <th>Month</th>
                    <th>Course</th>
                    <th>Enrollments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in courseMonthlyPreview" :key="i">
                    <td>{{ r.month_label || "-" }}</td>
                    <td>{{ r.course_name || "-" }}</td>
                    <td class="font-medium">{{ r.count ?? 0 }}</td>
                  </tr>

                  <tr v-if="!overviewLoading && courseMonthlyPreview.length === 0">
                    <td colspan="3" class="empty-cell">No data</td>
                  </tr>

                  <tr v-if="overviewLoading">
                    <td colspan="3" class="empty-cell">Loading…</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== REVENUE (DRIVING ONLY) ===================== -->
      <div v-else-if="activeTab === 'revenue' && reportMode === 'driving'" class="stack-6">
        <div class="panel-card" style="padding: 20px;">
          <div class="flex items-start justify-between gap-3 mb-1">
            <h3 class="panel-title">💰 Revenue Analytics</h3>
          </div>

          <div class="filters-panel" style="background: transparent; border: none; padding: 14px 0 0;">
            <div class="filter-field">
              <label class="filter-label">Date Range</label>
              <select v-model="revenueTabFilters.dateRange" class="select-modern-sm" style="width: 190px;">
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisYear">This Year</option>
                <option value="allMonths">All Months</option>
                <option value="custom">Custom</option>
              </select>
              <div v-if="revenueTabFilters.dateRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
                <input v-model="revenueTabFilters.customFrom" type="date" class="date-input-modern" style="width: 130px;" />
                <input v-model="revenueTabFilters.customTo" type="date" class="date-input-modern" style="width: 130px;" />
              </div>
            </div>

            <div class="filter-field">
              <label class="filter-label">Course</label>
              <select v-model="revenueTabFilters.courseId" class="select-modern-sm" style="width: 220px;">
                <option value="">All</option>
                <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                  {{ c.course_name }}
                </option>
              </select>
            </div>

            <div class="filter-field">
              <label class="filter-label">Payment Method</label>
              <select v-model="revenueTabFilters.payment_method" class="select-modern-sm" style="width: 150px;">
                <option value="">All</option>
                <option value="GCASH">GCASH</option>
                <option value="CASH">CASH</option>
              </select>
            </div>

            <button @click="reloadRevenue()" class="pg-btn pg-btn-accent" style="align-self: flex-end;">Apply</button>
            <button @click="openExport('revenue')" class="pg-btn pg-btn-emerald" style="align-self: flex-end;">📤 Export Revenue</button>
          </div>

          <div class="kpi-grid kpi-grid-3 mt-5">
            <div class="kpi-card kpi-emerald">
              <p class="kpi-label">Verified Revenue</p>
              <h3 class="kpi-value" style="font-size:1.6rem;">{{ formatCurrency(revenueStats.verifiedRevenuePeso) }}</h3>
            </div>
            <div class="kpi-card kpi-green">
              <p class="kpi-label">Verified Payments</p>
              <h3 class="kpi-value" style="font-size:1.6rem;">{{ revenueStats.verifiedCount }}</h3>
            </div>
            <button type="button" @click="openForecastModal" class="kpi-card kpi-violet kpi-card-clickable">
              <p class="kpi-label">Forecast Revenue</p>
              <h3 class="kpi-value" style="font-size:1.6rem;">{{ formatCurrency(revenueStats.forecastRevenuePeso) }}</h3>
              <p class="kpi-subtext">Based on {{ revenueForecastCourseLabel }}</p>
              <p class="kpi-subtext">Revenue Range: <b>{{ formatCurrency(revenueForecastLowPeso) }}–{{ formatCurrency(revenueForecastHighPeso) }}</b></p>
            </button>
          </div>

          <div v-if="revenueError" class="alert-error mt-4">{{ revenueError }}</div>
        </div>

        <!-- Revenue Table -->
        <div class="panel-card">
          <div class="panel-header-bar" style="align-items: flex-start; flex-direction: column; gap: 10px;">
            <div class="flex justify-between items-end w-full flex-wrap gap-3">
              <h4 class="panel-title">Payments (preview)</h4>

              <div class="filters-panel" style="padding: 0; background: transparent; border: none;">
                <div class="filter-field">
                  <label class="filter-label">Rows per page</label>
                  <select v-model.number="revenuePageSize" class="select-modern-sm" style="width: 90px;">
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                </div>
                <div class="filter-note" style="align-self: center;">
                  Showing {{ revenuePageStart }}–{{ revenuePageEnd }} of {{ revenueFiltered.length }}
                </div>
              </div>
            </div>
          </div>

          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green">
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="p in revenuePaginated" :key="p.id || `${p.created_at}-${p.fullname}`">
                  <td>{{ p.fullname || '-' }}</td>
                  <td>{{ p.course_name || '-' }}</td>
                  <td>{{ normalizePaymentMethod(p.payment_method) || '-' }}</td>
                  <td class="font-medium">{{ formatCurrency(p.amount_peso || 0) }}</td>
                  <td>{{ p.created_at ? formatDate(p.created_at) : '-' }}</td>
                </tr>

                <tr v-if="!revenueLoading && revenueFiltered.length === 0">
                  <td colspan="5" class="empty-cell">No payments loaded</td>
                </tr>

                <tr v-if="revenueLoading">
                  <td colspan="5" class="empty-cell">Loading payments…</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="revenueTotalPages > 1" class="pagination-bar">
            <button class="pg-btn" :class="{ 'pg-disabled': revenuePage === 1 }" :disabled="revenuePage === 1" @click="revenuePage--">◀ Prev</button>

            <div class="page-btns">
              <button
                v-for="p in revenuePageButtons"
                :key="p"
                class="pg-btn"
                :class="p === revenuePage ? 'pg-btn-accent' : ''"
                @click="revenuePage = p"
              >
                {{ p }}
              </button>
            </div>

            <button class="pg-btn" :class="{ 'pg-disabled': revenuePage === revenueTotalPages }" :disabled="revenuePage === revenueTotalPages" @click="revenuePage++">Next ▶</button>
          </div>
        </div>
      </div>

      <!-- ===================== DETAILED REPORTS ===================== -->
      <div v-else-if="activeTab === 'detailed'" class="stack-6">
        <!-- DRIVING: month-only detailed certificate-style report -->
        <template v-if="reportMode === 'driving'">
          <div class="panel-card" style="padding: 20px;">
            <div class="filters-panel" style="background: transparent; border: none; padding: 0;">
              <div class="filter-field">
                <label class="filter-label">Report Month</label>
                <input v-model="detailedMonth" type="month" class="date-input-modern" style="width: 180px;" />
              </div>

              <div class="filter-field">
                <label class="filter-label">Course</label>
                <select v-model="detailedTabFilters.courseId" class="select-modern-sm" style="width: 240px;">
                  <option value="">All courses</option>
                  <option v-for="c in courses" :key="c.id" :value="String(c.id)">
                    {{ c.course_name }}
                  </option>
                </select>
              </div>

              <button @click="reloadDetailed()" class="pg-btn pg-btn-accent" style="align-self: flex-end;">Apply</button>
              <button @click="openExport('detailed')" class="pg-btn pg-btn-emerald" style="align-self: flex-end;">📤 Export Detailed</button>
            </div>

            <div v-if="detailedError" class="alert-error mt-4">{{ detailedError }}</div>
          </div>

          <div class="panel-card" style="padding: 16px;">
            <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
              <div>
                <h3 class="panel-title">📋 Detailed Reports</h3>
                <p class="filter-note mt-1">
                  Showing {{ detailedFiltered.length }} record{{ detailedFiltered.length === 1 ? '' : 's' }}
                </p>
              </div>

              <button @click="openExport('detailed')" class="pg-btn pg-btn-emerald">📤 Export Detailed</button>
            </div>

            <div v-if="detailedLoading" class="empty-cell" style="border: 1px dashed #e5e7eb; border-radius: 10px;">
              Loading detailed reports…
            </div>

            <div v-if="!detailedLoading && detailedFiltered.length === 0" class="empty-cell" style="border: 1px dashed #e5e7eb; border-radius: 10px;">
              No data for your filters
            </div>

            <div class="space-y-6">
              <!-- TDC Preview -->
              <div class="doc-preview">
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

                  <table class="doc-table">
                    <thead>
                      <tr class="doc-thead-blue">
                        <th class="w-10">No.</th>
                        <th class="w-28">Client ID</th>
                        <th>Full Name</th>
                        <th class="w-24">Birthdate<br />(MM/DD/YY)</th>
                        <th class="w-12">Sex<br />(M/F)</th>
                        <th class="w-40">Instructor Name</th>
                        <th class="w-20">Course<br />Start</th>
                        <th class="w-20">Course<br />End</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, idx) in detailedTdcRows" :key="`tdc-${row.reservation_id || idx}`">
                        <td class="text-center">{{ idx + 1 }}</td>
                        <td>{{ row.lto_client_id || '-' }}</td>
                        <td class="font-semibold">{{ row.fullname || row.group_label || '-' }}</td>
                        <td class="text-center">{{ row.birthday ? formatDateShort(row.birthday) : '-' }}</td>
                        <td class="text-center">{{ row.gender ? (String(row.gender).toLowerCase().startsWith('m') ? 'M' : 'F') : '-' }}</td>
                        <td>{{ row.instructor_name || row.trainer_name || '-' }}</td>
                        <td class="text-center">{{ (row.course_start || row.schedule_date) ? formatDateShort(row.course_start || row.schedule_date) : '-' }}</td>
                        <td class="text-center">{{ (row.course_end || row.schedule_date) ? formatDateShort(row.course_end || row.schedule_date) : '-' }}</td>
                      </tr>

                      <tr v-if="detailedTdcRows.length === 0">
                        <td colspan="8" class="empty-cell">No TDC records</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- PDC Preview -->
              <div class="doc-preview">
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

                  <table class="doc-table">
                    <thead>
                      <tr class="doc-thead-blue">
                        <th class="w-9">No.</th>
                        <th class="w-28">Client ID</th>
                        <th>Full Name</th>
                        <th class="w-24">Birthdate<br />(MM/DD/YY)</th>
                        <th class="w-10">Sex<br />(M/F)</th>
                        <th class="w-40">Instructor Name</th>
                        <th class="w-20">Course<br />Start</th>
                        <th class="w-20">Course<br />End</th>
                        <th class="w-14">DL<br />Code</th>
                        <th class="w-24">Training<br />Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, idx) in detailedPdcRows" :key="`pdc-${row.reservation_id || idx}`">
                        <td class="text-center">{{ idx + 1 }}</td>
                        <td>{{ row.lto_client_id || '-' }}</td>
                        <td class="font-semibold">{{ row.fullname || row.group_label || '-' }}</td>
                        <td class="text-center">{{ row.birthday ? formatDateShort(row.birthday) : '-' }}</td>
                        <td class="text-center">{{ row.gender ? (String(row.gender).toLowerCase().startsWith('m') ? 'M' : 'F') : '-' }}</td>
                        <td>{{ row.instructor_name || row.trainer_name || '-' }}</td>
                        <td class="text-center">{{ (row.course_start || row.schedule_date) ? formatDateShort(row.course_start || row.schedule_date) : '-' }}</td>
                        <td class="text-center">{{ (row.course_end || row.schedule_date) ? formatDateShort(row.course_end || row.schedule_date) : '-' }}</td>
                        <td class="text-center">{{ normalizeDLCode(row.dl_code) }}</td>
                        <td class="text-center">{{ shortTrainingPurpose(row.training_purpose) }}</td>
                      </tr>

                      <tr v-if="detailedPdcRows.length === 0">
                        <td colspan="10" class="empty-cell">No PDC records</td>
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
          <div class="panel-card" style="padding: 20px;">
            <div class="filters-panel" style="background: transparent; border: none; padding: 0;">
              <div class="filter-field">
                <label class="filter-label">Date Range</label>
                <select v-model="detailedTabFilters.dateRange" class="select-modern-sm" style="width: 190px;">
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="allMonths">All Months</option>
                  <option value="custom">Custom</option>
                </select>
                <div v-if="detailedTabFilters.dateRange === 'custom'" class="mt-2 grid grid-cols-2 gap-2">
                  <input v-model="detailedTabFilters.customFrom" type="date" class="date-input-modern" style="width: 130px;" />
                  <input v-model="detailedTabFilters.customTo" type="date" class="date-input-modern" style="width: 130px;" />
                </div>
              </div>

              <div class="filter-field">
                <label class="filter-label">Course</label>
                <select v-model="detailedTabFilters.courseId" class="select-modern-sm" style="width: 220px;">
                  <option value="">All</option>
                  <option v-for="c in courses" :key="c.id" :value="String(c.id)">{{ c.course_name }}</option>
                </select>
              </div>

              <div class="filter-field">
                <label class="filter-label">Group by</label>
                <select v-model="detailedTabFilters.groupBy" class="select-modern-sm" style="width: 160px;">
                  <option value="raw">Raw</option>
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div class="filter-field">
                <label class="filter-label">Source</label>
                <select v-model="detailedTabFilters.source" class="select-modern-sm" style="width: 140px;">
                  <option value="">All</option>
                  <option value="ONLINE">ONLINE</option>
                  <option value="WALKIN">WALKIN</option>
                </select>
              </div>

              <div class="filter-field">
                <label class="filter-label">Sort</label>
                <select v-model="detailedTabFilters.sort" class="select-modern-sm" style="width: 180px;">
                  <option value="created_desc">Created (newest)</option>
                  <option value="created_asc">Created (oldest)</option>
                  <option value="name_asc">Name (A–Z)</option>
                  <option value="name_desc">Name (Z–A)</option>
                </select>
              </div>

              <button @click="reloadDetailed()" class="pg-btn pg-btn-accent" style="align-self: flex-end;">Apply</button>
              <button @click="openExport('detailed')" class="pg-btn pg-btn-emerald" style="align-self: flex-end;">📤 Export Detailed</button>
              <button @click="columnsOpen = !columnsOpen" class="pg-btn" style="align-self: flex-end;">{{ columnsOpen ? 'Hide' : 'Show' }} Columns</button>
            </div>

            <div v-if="columnsOpen" class="info-box mt-4">
              <div class="flex items-center justify-between gap-3">
                <p class="filter-label" style="margin:0;">Column visibility</p>
                <div class="flex gap-2">
                  <button @click="applyColumnPreset('minimal')" class="pg-btn" style="padding: 6px 12px; font-size: 0.75rem;">Minimal</button>
                  <button @click="applyColumnPreset('all')" class="pg-btn" style="padding: 6px 12px; font-size: 0.75rem;">Show all</button>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-4 text-sm">
                <label v-for="col in columnOptions" :key="col.key" class="inline-flex items-center gap-2">
                  <input type="checkbox" v-model="visibleColumns[col.key]" />
                  <span>{{ col.label }}</span>
                </label>
              </div>
            </div>

            <div v-if="detailedError" class="alert-error mt-4">{{ detailedError }}</div>
          </div>

          <div class="panel-card">
            <div class="panel-header-bar">
              <div>
                <h3 class="panel-title">📋 Detailed Reports</h3>
                <p class="filter-note mt-1">Showing {{ detailedPageStart }}–{{ detailedPageEnd }} of {{ detailedFiltered.length }}</p>
              </div>

              <div class="filter-field">
                <label class="filter-label">Rows per page</label>
                <select v-model.number="detailedPageSize" class="select-modern-sm" style="width: 90px;">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
            </div>

            <div class="table-wrap">
              <table class="modern-table">
                <thead class="thead-green">
                  <tr>
                    <th>No.</th>
                    <th v-if="visibleColumns.fullname">Full Name</th>
                    <th v-if="visibleColumns.birthday">Birthdate</th>
                    <th v-if="visibleColumns.gender">Sex</th>
                    <th v-if="visibleColumns.instructor_name">Trainer</th>
                    <th v-if="visibleColumns.course_name">Course</th>
                    <th v-if="visibleColumns.course_start">Course Start</th>
                    <th v-if="visibleColumns.course_end">Course End</th>
                    <th v-if="visibleColumns.reservation_source">Source</th>
                    <th v-if="visibleColumns.created_at">Created</th>
                    <th v-if="visibleColumns.nationality">Nationality</th>
                    <th v-if="visibleColumns.civil_status">Civil Status</th>
                    <th v-if="visibleColumns.address">Address</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(row, idx) in detailedPaginated" :key="row.reservation_id || row.group_key || idx">
                    <td>{{ detailedPageStart + idx }}</td>
                    <td v-if="visibleColumns.fullname">{{ row.fullname || row.group_label || '-' }}</td>
                    <td v-if="visibleColumns.birthday">{{ row.birthday ? formatDateShort(row.birthday) : '-' }}</td>
                    <td v-if="visibleColumns.gender">{{ row.gender ? (String(row.gender).toLowerCase() === 'male' ? 'M' : 'F') : '-' }}</td>
                    <td v-if="visibleColumns.instructor_name">{{ row.trainer_name || row.instructor_name || '-' }}</td>
                    <td v-if="visibleColumns.course_name">{{ row.course_name || '-' }}</td>
                    <td v-if="visibleColumns.course_start">{{ (row.course_start || row.schedule_date) ? formatDate(row.course_start || row.schedule_date) : '-' }}</td>
                    <td v-if="visibleColumns.course_end">{{ (row.course_end || row.schedule_date) ? formatDate(row.course_end || row.schedule_date) : '-' }}</td>
                    <td v-if="visibleColumns.reservation_source">{{ row.reservation_source || '-' }}</td>
                    <td v-if="visibleColumns.created_at">{{ row.created_at ? formatDate(row.created_at) : '-' }}</td>
                    <td v-if="visibleColumns.nationality">{{ row.nationality || '-' }}</td>
                    <td v-if="visibleColumns.civil_status">{{ row.civil_status || '-' }}</td>
                    <td v-if="visibleColumns.address">{{ row.address || '-' }}</td>
                  </tr>

                  <tr v-if="!detailedLoading && detailedFiltered.length === 0">
                    <td :colspan="detailedColspanComputed" class="empty-cell">No data for your filters</td>
                  </tr>

                  <tr v-if="detailedLoading">
                    <td :colspan="detailedColspanComputed" class="empty-cell">Loading detailed reports…</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="detailedTotalPages > 1" class="pagination-bar">
              <button class="pg-btn" :class="{ 'pg-disabled': detailedPage === 1 }" :disabled="detailedPage === 1" @click="detailedPage--">◀ Prev</button>
              <div class="page-btns">
                <button v-for="p in detailedPageButtons" :key="p" class="pg-btn" :class="p === detailedPage ? 'pg-btn-accent' : ''" @click="detailedPage = p">{{ p }}</button>
              </div>
              <button class="pg-btn" :class="{ 'pg-disabled': detailedPage === detailedTotalPages }" :disabled="detailedPage === detailedTotalPages" @click="detailedPage++">Next ▶</button>
            </div>
          </div>
        </template>
      </div>

      <!-- ===================== ATTENDANCE (TESDA ONLY) ===================== -->
      <div v-else-if="activeTab === 'attendance' && reportMode === 'tesda'" class="stack-5">
        <!-- Clean Attendance Summary -->
        <div class="kpi-grid kpi-grid-5">
          <div class="kpi-card kpi-blue kpi-card-sm">
            <p class="kpi-label">Students</p>
            <h3 class="kpi-value" style="font-size:1.5rem;">{{ attendanceSummary.totalStudents }}</h3>
          </div>
          <div class="kpi-card kpi-green kpi-card-sm">
            <p class="kpi-label">Present</p>
            <h3 class="kpi-value" style="font-size:1.5rem;">{{ attendanceSummary.present }}</h3>
          </div>
          <div class="kpi-card kpi-amber kpi-card-sm">
            <p class="kpi-label">Late</p>
            <h3 class="kpi-value" style="font-size:1.5rem;">{{ attendanceSummary.late }}</h3>
          </div>
          <div class="kpi-card kpi-red kpi-card-sm">
            <p class="kpi-label">Absent</p>
            <h3 class="kpi-value" style="font-size:1.5rem;">{{ attendanceSummary.absent }}</h3>
          </div>
          <div class="kpi-card kpi-emerald kpi-card-sm">
            <p class="kpi-label">Rate</p>
            <h3 class="kpi-value" style="font-size:1.5rem;">{{ attendanceRate }}%</h3>
          </div>
        </div>

        <!-- Course picker: per-course attendance -->
        <div class="panel-card" style="padding: 20px;">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3" style="border-bottom: 1px solid #f3f4f6;">
            <div>
              <h3 class="panel-title">📚 Select Course</h3>
              <p class="filter-note mt-1">Select one course first. Attendance records, calendar, and follow-up list will be based on that course only.</p>
            </div>
            <button type="button" @click="openAttendanceCourseModal" class="pg-btn pg-btn-accent">Select Course</button>
          </div>

          <div class="info-box mt-4" style="background:#f0fdf4; border-color:#bbf7d0;">
            <p class="filter-label" style="margin:0; color:#059669;">Selected Course</p>
            <div class="mt-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h4 class="font-extrabold" style="color:#065f46; font-size:1.05rem;">{{ selectedAttendanceCourseLabel }}</h4>
                <p class="mt-1 text-xs" style="color:#047857;">
                  Trainer(s):
                  <span v-if="selectedAttendanceCourseTrainers.length" class="font-bold">{{ selectedAttendanceCourseTrainers.join(', ') }}</span>
                  <span v-else class="font-semibold text-gray-500 italic">No trainer assigned</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Basic filters only -->
          <div class="filters-panel mt-4" style="background: transparent; border: none; padding: 0;">
            <div class="filter-field">
              <label class="filter-label">From</label>
              <input v-model="attendanceFilters.from" type="date" @change="attendancePage = 1; loadAttendance()" class="date-input-modern" style="width: 150px;" />
            </div>
            <div class="filter-field">
              <label class="filter-label">To</label>
              <input v-model="attendanceFilters.to" type="date" @change="attendancePage = 1; loadAttendance()" class="date-input-modern" style="width: 150px;" />
            </div>
            <div class="filter-field">
              <label class="filter-label">Status</label>
              <select v-model="attendanceFilters.status" @change="attendancePage = 1; loadAttendance()" class="select-modern-sm" style="width: 140px;">
                <option value="">All</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <div class="filter-field">
              <label class="filter-label">Rows</label>
              <select v-model.number="attendancePageSize" class="select-modern-sm" style="width: 90px;">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <button @click="loadAttendance" class="pg-btn pg-btn-accent" style="align-self: flex-end;">Apply</button>
          </div>

          <!-- Separate action tabs / less crowded -->
          <div class="toolbar-row mt-4">
            <div class="flex flex-wrap gap-2">
              <button @click="toggleAttendancePanel('calendar')" class="pg-btn">{{ attendanceShowCalendar ? 'Hide' : 'Show' }} Calendar</button>
              <button @click="toggleAttendancePanel('warnings')" class="pg-btn">{{ attendanceShowWarnings ? 'Hide' : 'Show' }} Alerts</button>
              <button @click="toggleAttendancePanel('history')" class="pg-btn">{{ attendanceShowHistory ? 'Hide' : 'Show' }} History</button>
              <button @click="toggleAttendancePanel('columns')" class="pg-btn">{{ attendanceColumnsOpen ? 'Hide' : 'Show' }} Columns</button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button @click="exportAttendance('xlsx')" class="pg-btn pg-btn-emerald">📤 Excel</button>
              <button @click="exportAttendance('pdf')" class="pg-btn pg-btn-red">📄 PDF</button>
            </div>
          </div>

          <p class="filter-note mt-2">Viewing course: <b style="color:#059669;">{{ selectedAttendanceCourseLabel }}</b></p>

          <div v-if="attendanceColumnsOpen" ref="attendanceColumnsSectionRef" class="info-box mt-3">
            <p class="filter-label" style="margin-bottom: 8px;">Visible columns</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-sm">
              <label v-for="col in attendanceColumnOptions" :key="col.key" class="inline-flex items-center gap-2" style="background:#fff; border:1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px;">
                <input type="checkbox" v-model="attendanceVisibleColumns[col.key]" />
                <span>{{ col.label }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Course Modal -->
        <div v-if="attendanceCourseModalOpen" class="modal-overlay" @click.self="attendanceCourseModalOpen = false">
          <div class="modal-card modal-card-xl">
            <div class="modal-head modal-head-green">
              <div>
                <h3 class="modal-title">📚 Select TESDA Course</h3>
                <p class="text-xs text-gray-500 mt-0.5">Choose one course. Courses without assigned trainers are clearly marked.</p>
              </div>
              <button type="button" @click="attendanceCourseModalOpen = false" class="modal-close-btn">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style="padding: 16px 20px; border-bottom: 1px solid #f3f4f6;">
              <input v-model="attendanceCourseSearch" type="text" placeholder="Search course or assigned trainer..." class="date-input-modern" style="width: 100%;" />
            </div>

            <div class="modal-body-scroll">
              <div v-if="attendanceCourseTrainerLoading" class="empty-cell">Loading course assignments…</div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  v-for="course in attendanceCourseOptions"
                  :key="course.id"
                  type="button"
                  @click="selectAttendanceCourse(course)"
                  class="course-pick-card"
                  :class="String(attendanceFilters.courseId) === String(course.id) ? 'course-pick-active' : ''"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h4 class="font-extrabold text-gray-900 truncate">{{ course.course_name }}</h4>
                      <p class="mt-1 text-xs text-gray-500">{{ course.course_code || 'TESDA Course' }}</p>
                    </div>
                    <span class="pill pill-green">Select</span>
                  </div>

                  <div class="info-box mt-3">
                    <p class="filter-label" style="margin:0;">Assigned Trainer(s)</p>
                    <div v-if="getCourseTrainerNames(course.id).length" class="mt-2 flex flex-wrap gap-2">
                      <span v-for="trainerName in getCourseTrainerNames(course.id)" :key="`${course.id}-${trainerName}`" class="pill pill-green-outline">
                        {{ trainerName }}
                      </span>
                    </div>
                    <p v-else class="mt-2 text-xs font-semibold text-gray-500 italic">No trainer assigned</p>
                  </div>
                </button>

                <div v-if="!attendanceCourseOptions.length" class="md:col-span-2 empty-cell">No course found.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar + Follow-up -->
        <div v-if="attendanceShowCalendar || attendanceShowWarnings" ref="attendanceCalendarSectionRef" class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div v-if="attendanceShowCalendar" class="lg:col-span-2 panel-card" style="padding: 16px;">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="panel-title">📅 Attendance Calendar</h3>
                <p class="filter-note mt-1">Click a date to filter records.</p>
              </div>
              <button @click="attendanceFilters.from = ''; attendanceFilters.to = ''; attendancePage = 1; loadAttendance()" class="pg-btn" style="padding: 7px 12px; font-size: 0.75rem;">Clear Range</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
              <button
                v-for="day in attendanceCalendarDays"
                :key="day.date"
                @click="attendanceFilters.from = day.date; attendanceFilters.to = day.date; attendancePage = 1; loadAttendance()"
                class="cal-day-card"
                :class="attendanceFilters.from === day.date && attendanceFilters.to === day.date ? 'cal-day-active' : ''"
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

          <div v-if="attendanceShowWarnings" ref="attendanceWarningsSectionRef" class="panel-card" style="padding: 16px;" :class="attendanceShowCalendar ? '' : 'lg:col-span-3'">
            <div class="flex items-center justify-between mb-3">
              <h3 class="panel-title" style="color:#b45309;">⚡ Attendance Alerts</h3>
              <span class="filter-note">{{ atRiskStudents.length }} alert(s)</span>
            </div>
            <div v-if="atRiskStudents.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
              <div v-for="s in atRiskStudents" :key="s.name" class="alert-card">
                <div class="flex items-start justify-between gap-2">
                  <p class="font-semibold truncate" style="color:#78350f;">{{ s.name }}</p>
                  <span class="pill" :class="s.severityClass">{{ s.severity }}</span>
                </div>
                <p class="mt-1 text-xs" style="color:#b45309;">{{ s.absent }} absent • {{ s.late }} late • {{ s.rate }}% attendance</p>
                <p class="mt-1 text-[11px] text-gray-500">{{ s.reason }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500">No attendance alerts for this course and date range.</p>
          </div>
        </div>

        <!-- Attendance Records Table -->
        <div class="panel-card">
          <div class="panel-header-bar">
            <div>
              <h3 class="panel-title">🧑‍🎓 Student Attendance</h3>
              <p class="filter-note mt-1">Showing {{ attendancePageStart }}–{{ attendancePageEnd }} of {{ attendanceDisplayRows.length }} record(s)</p>
            </div>
            <div class="pill pill-green-outline" style="padding: 8px 14px;">{{ selectedAttendanceCourseLabel }}</div>
          </div>

          <div class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green">
                <tr>
                  <th v-if="attendanceVisibleColumns.student">Student</th>
                  <th v-if="attendanceVisibleColumns.course">Course</th>
                  <th v-if="attendanceVisibleColumns.trainer">Trainer</th>
                  <th v-if="attendanceVisibleColumns.date">Date</th>
                  <th v-if="attendanceVisibleColumns.session">Session</th>
                  <th v-if="attendanceVisibleColumns.remarks">Remarks</th>
                  <th v-if="attendanceVisibleColumns.status">Status</th>
                  <th v-if="attendanceVisibleColumns.rate">Rate</th>
                  <th v-if="attendanceVisibleColumns.eligibility">Eligibility</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in attendancePaginated" :key="row.key">
                  <td v-if="attendanceVisibleColumns.student" class="font-medium">{{ row.student }}</td>
                  <td v-if="attendanceVisibleColumns.course">{{ row.course }}</td>
                  <td v-if="attendanceVisibleColumns.trainer">{{ row.trainer }}</td>
                  <td v-if="attendanceVisibleColumns.date">{{ formatDate(row.date) }}</td>
                  <td v-if="attendanceVisibleColumns.session">{{ row.session }}</td>
                  <td v-if="attendanceVisibleColumns.remarks" class="text-gray-600">{{ row.raw?.remarks || '—' }}</td>
                  <td v-if="attendanceVisibleColumns.status"><span class="pill" :class="attendanceStatusClass(row.status)">{{ row.status }}</span></td>
                  <td v-if="attendanceVisibleColumns.rate" class="font-semibold">{{ row.studentRate }}%</td>
                  <td v-if="attendanceVisibleColumns.eligibility"><span class="pill" :class="row.eligible ? 'pill-green' : 'pill-red'">{{ row.eligible ? 'Eligible' : 'Not Eligible' }}</span></td>
                </tr>
                <tr v-if="!attendanceDisplayRows.length">
                  <td :colspan="attendanceVisibleColspan" class="empty-cell">No attendance records found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="attendanceTotalPages > 1" class="pagination-bar">
            <button class="pg-btn" :class="{ 'pg-disabled': attendancePage === 1 }" :disabled="attendancePage === 1" @click="attendancePage--">◀ Prev</button>
            <div class="page-btns">
              <button v-for="p in attendancePageButtons" :key="p" class="pg-btn" :class="p === attendancePage ? 'pg-btn-accent' : ''" @click="attendancePage = p">{{ p }}</button>
            </div>
            <button class="pg-btn" :class="{ 'pg-disabled': attendancePage === attendanceTotalPages }" :disabled="attendancePage === attendanceTotalPages" @click="attendancePage++">Next ▶</button>
          </div>
        </div>

        <!-- Per Student Attendance History -->
        <div v-if="attendanceShowHistory" ref="attendanceHistorySectionRef" class="panel-card" style="padding: 16px;">
          <h3 class="panel-title mb-3">📊 Per Student Attendance History</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div v-for="student in attendanceHistoryPaginated" :key="student.name" class="history-card">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-bold text-gray-800 truncate">{{ student.name }}</p>
                  <p class="text-xs text-gray-500">{{ student.present }} present / {{ student.total }} session(s)</p>
                </div>
                <span class="text-sm font-bold">{{ student.rate }}%</span>
              </div>
              <div class="mt-3 history-bar-track">
                <div class="history-bar-fill" :class="student.rate >= 80 ? 'bar-green' : student.rate >= 60 ? 'bar-amber' : 'bar-red'" :style="{ width: student.rate + '%' }"></div>
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="item in student.timeline.slice(0, 5)" :key="item.key" class="pill" :class="attendanceStatusClass(item.status)">{{ formatDate(item.date) }} — {{ item.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== ISSUED CERTIFICATES (DRIVING / TESDA) ===================== -->
      <div v-else-if="activeTab === 'exams'" class="stack-6">
        <div class="panel-card" style="padding: 20px;">
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h3 class="panel-title">📄 Issued Certificates of Completion</h3>
              <p class="filter-note mt-1">
                {{ reportMode === 'tesda' ? 'TESDA certificate summary by course.' : 'Driving certificate summary by TDC/PDC.' }}
              </p>
            </div>

            <div class="filters-panel" style="background: transparent; border: none; padding: 0;">
              <div class="filter-field">
                <label class="filter-label">Report Month</label>
                <input v-model="certificateMonth" type="month" class="date-input-modern" style="width: 170px;" />
              </div>
              <button @click="reloadCertificateReport()" class="pg-btn pg-btn-accent" style="align-self: flex-end;">Apply</button>
              <button @click="exportCertificateReport()" class="pg-btn pg-btn-emerald" style="align-self: flex-end;">📤 Export</button>
            </div>
          </div>

          <div class="doc-preview" style="max-width: 60rem; margin: 0 auto;">
            <div class="min-w-[760px]">
              <!-- Header -->
              <div class="relative text-center mb-5">
                <img src="/facet-logo.png" alt="FACET Logo" class="absolute left-0 top-0 w-14 h-14 object-contain" />
                <img v-if="reportMode === 'tesda'" src="/tesda-logo.png" alt="TESDA Logo" class="absolute right-0 top-0 w-14 h-14 object-contain" />
                <img v-else src="/lto-logo.png" alt="LTO Logo" class="absolute right-0 top-0 w-14 h-14 object-contain" />

                <p class="text-sm font-bold text-red-700">First Asian Cognizance Executive Training Institute (FACET Institute) Corp.</p>
                <p class="text-xs font-semibold text-red-600">Holy Spirit, Barcenaga, Naujan, Oriental Mindoro</p>
                <h4 class="mt-4 text-sm font-extrabold text-black uppercase leading-tight">
                  Total No. of Issued Certificates of Completion<br />
                  <span v-if="reportMode === 'tesda'">for TESDA Training Courses</span>
                  <span v-else>for Theoretical and Practical Driving Course</span>
                </h4>
                <p v-if="reportMode === 'tesda'" class="text-xs font-semibold mt-1">TESDA Training Report</p>
                <p v-else class="text-xs font-semibold mt-1">LTO Regional Office No. 4B</p>
                <p class="text-xs">For the Month of <span class="font-bold uppercase">{{ certificateReport.monthLabel }}</span></p>
              </div>

              <!-- TESDA CERTIFICATE REPORT -->
              <template v-if="reportMode === 'tesda'">
                <table class="doc-table mb-7">
                  <thead>
                    <tr class="doc-thead-olive">
                      <th class="text-left">Summary</th>
                      <th class="w-36">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-bold">A. TESDA Training Certificates Issued</td>
                      <td class="text-center font-bold">{{ certificateReport.tesdaTotal }}</td>
                    </tr>
                    <tr>
                      <td class="font-bold">B. Courses with Issued Certificates</td>
                      <td class="text-center">{{ certificateReport.tesdaCourseRows.length }}</td>
                    </tr>
                  </tbody>
                </table>

                <h4 class="text-center text-sm font-bold mb-1">TESDA Certificates by Course</h4>
                <table class="doc-table w-4/5 mx-auto mb-8">
                  <thead>
                    <tr class="doc-thead-olive">
                      <th>Course</th>
                      <th class="w-40">No. of Issued<br />Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="doc-subrow"><td colspan="2" class="font-bold">By Course</td></tr>
                    <tr v-for="row in certificateReport.tesdaCourseRows" :key="row.label">
                      <td>{{ row.label }}</td>
                      <td class="text-center">{{ row.count }}</td>
                    </tr>
                    <tr v-if="certificateReport.tesdaCourseRows.length === 0">
                      <td colspan="2" class="empty-cell">No issued TESDA certificates</td>
                    </tr>
                    <tr><td class="text-right font-bold">Total</td><td class="text-center font-bold">{{ certificateReport.tesdaTotal }}</td></tr>
                  </tbody>
                </table>

                <h4 class="text-center text-sm font-bold mb-1">TESDA Certificates by Trainer</h4>
                <table class="doc-table w-4/5 mx-auto">
                  <thead>
                    <tr class="doc-thead-olive">
                      <th>Trainer</th>
                      <th class="w-40">No. of Issued<br />Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="doc-subrow"><td colspan="2" class="font-bold">By Trainer</td></tr>
                    <tr v-for="row in certificateReport.tesdaTrainerRows" :key="row.label">
                      <td>{{ row.label }}</td>
                      <td class="text-center">{{ row.count }}</td>
                    </tr>
                    <tr v-if="certificateReport.tesdaTrainerRows.length === 0">
                      <td colspan="2" class="empty-cell">No trainer data</td>
                    </tr>
                    <tr><td class="text-right font-bold">Total</td><td class="text-center font-bold">{{ certificateReport.tesdaTotal }}</td></tr>
                  </tbody>
                </table>
              </template>

              <!-- DRIVING CERTIFICATE REPORT -->
              <template v-else>
                <table class="doc-table mb-7">
                  <thead>
                    <tr class="doc-thead-olive">
                      <th class="text-left"></th>
                      <th class="w-36">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-bold">A. Theoretical Driving Course (TDC)</td>
                      <td class="text-center">{{ certificateReport.tdcTotal }}</td>
                    </tr>
                    <tr>
                      <td class="font-bold">B. Practical Driving Course(PDC)</td>
                      <td class="text-center">{{ certificateReport.pdcTotal }}</td>
                    </tr>
                  </tbody>
                </table>

                <h4 class="text-center text-sm font-bold mb-1">Theoretical Driving Course (TDC)</h4>
                <table class="doc-table w-3/4 mx-auto mb-8">
                  <thead>
                    <tr class="doc-thead-olive">
                      <th>Categories</th>
                      <th class="w-40">No. of Issued<br />Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="doc-subrow"><td colspan="2" class="font-bold">By Sex</td></tr>
                    <tr><td>Male</td><td class="text-center">{{ certificateReport.tdc.sex.Male }}</td></tr>
                    <tr><td>Female</td><td class="text-center">{{ certificateReport.tdc.sex.Female }}</td></tr>
                    <tr><td class="text-right font-bold">Total</td><td class="text-center font-bold">{{ certificateReport.tdcTotal }}</td></tr>
                  </tbody>
                </table>

                <h4 class="text-center text-sm font-bold mb-1">Practical Driving Course (PDC)</h4>
                <table class="doc-table w-3/4 mx-auto mb-7">
                  <thead>
                    <tr class="doc-thead-olive">
                      <th>Categories</th>
                      <th class="w-40">No. of Issued<br />Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="doc-subrow"><td colspan="2" class="font-bold">By Sex</td></tr>
                    <tr><td>Male</td><td class="text-center">{{ certificateReport.pdc.sex.Male }}</td></tr>
                    <tr><td>Female</td><td class="text-center">{{ certificateReport.pdc.sex.Female }}</td></tr>
                    <tr><td class="text-right font-bold">Total</td><td class="text-center font-bold">{{ certificateReport.pdcTotal }}</td></tr>

                    <tr class="doc-subrow"><td colspan="2" class="font-bold">By Training Purpose</td></tr>
                    <tr v-for="row in certificateReport.trainingPurposeRows" :key="row.label">
                      <td>{{ row.label }}</td>
                      <td class="text-center">{{ row.count }}</td>
                    </tr>
                    <tr><td class="text-right font-bold">Total</td><td class="text-center font-bold">{{ certificateReport.pdcTotal }}</td></tr>
                  </tbody>
                </table>

                <table class="doc-table w-3/4 mx-auto">
                  <thead>
                    <tr class="doc-subrow">
                      <th>By DL Code</th>
                      <th class="w-40">No. of Issued<br />Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in certificateReport.dlCodeRows" :key="row.label">
                      <td class="text-center">{{ row.label }}</td>
                      <td class="text-center">{{ row.count }}</td>
                    </tr>
                    <tr><td class="text-right font-bold">Total</td><td class="text-center font-bold">{{ certificateReport.dlCodeTotal }}</td></tr>
                  </tbody>
                </table>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================== FORECAST DETAILS MODAL (DRIVING ONLY) ===================== -->
      <transition name="modal-fade">
        <div v-if="forecastModalOpen && reportMode === 'driving'" class="modal-overlay" @click.self="forecastModalOpen = false">
          <transition name="modal-scale">
            <div class="modal-card modal-card-xl" style="max-width: 1100px;">
              <div class="modal-head modal-head-blue">
                <div>
                  <h3 class="modal-title">Enrollment Forecast</h3>
                  <p class="text-xs text-gray-500 mt-0.5">Driving courses only • {{ forecastPeriodLabel }}</p>
                </div>
                <button @click="forecastModalOpen = false" class="modal-close-btn">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

             <div class="modal-body-scroll">
              <!-- ✅ LOADING STATE -->
              <div v-if="mlForecastLoading" class="flex flex-col items-center justify-center gap-3" style="padding: 60px 20px;">
                <svg class="animate-spin h-10 w-10" style="color:#6d28d9;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <p class="font-semibold" style="color:#4c1d95;">Computing enrollment forecast…</p>
                <p class="filter-note">Analyzing past enrollment data per course. This may take a moment.</p>
              </div>

              <!-- ✅ ERROR STATE -->
              <div v-else-if="mlForecastError" class="alert-error">
                {{ mlForecastError }}
              </div>

              <!-- ✅ LOADED STATE — everything below wrapped -->
              <template v-else>
                <div class="kpi-grid kpi-grid-4 mb-5">
                  <div class="kpi-card kpi-violet kpi-card-sm">
                    <p class="kpi-label">Predicted Enrollment</p>
                    <h4 class="kpi-value" style="font-size:1.7rem;">{{ forecast.nextForecast }}</h4>
                    <p class="kpi-subtext">{{ forecastPeriodLabel }}</p>
                  </div>
                  <div class="kpi-card kpi-slate kpi-card-sm">
                    <p class="kpi-label">Prediction Range</p>
                    <h4 class="kpi-value" style="font-size:1.4rem;">{{ forecast.low }}–{{ forecast.high }}</h4>
                    <p class="kpi-subtext">Low and high possible output</p>
                  </div>
                  <div class="kpi-card kpi-green kpi-card-sm">
                    <p class="kpi-label">Highest Forecast Course</p>
                    <h4 class="kpi-value kpi-value-text" style="font-size:1.05rem;">{{ forecast.topCourse || '-' }}</h4>
                    <p class="kpi-subtext">Most likely high demand</p>
                  </div>
                  <div class="kpi-card kpi-blue kpi-card-sm">
                    <p class="kpi-label">Data Basis</p>
                    <h4 class="kpi-value" style="font-size:1.4rem;">{{ forecast.dataPoints }}</h4>
                    <p class="kpi-subtext">Historical records used</p>
                  </div>
                </div>
<!-- ✅ LTO Promo Toggle (Save button below, equal width) -->
<div class="panel-card mb-5" style="padding: 16px; background: #fefce8; border-color: #fde68a;">
  <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
    <!-- Kaliwang bahagi: paglalarawan -->
    <div class="flex-1">
      <h4 class="panel-title" style="color: #92400e;">🏷️ Will There Be an LTO Promo in {{ nextMonthLabel }}?</h4>
      <p class="filter-note mt-1" style="color: #b45309;">
        LTO promos are a major factor in enrollment spikes. If you know there will be
        a promo next month, toggle this option to improve the forecast accuracy.
      </p>
      <div class="mt-2 flex items-center gap-2">
        <span class="text-xs font-medium text-gray-600">Current setting:</span>
        <span class="pill" :class="nextMonthPromo === true ? 'pill-green' : nextMonthPromo === false ? 'pill-gray' : 'pill-amber'">
          {{ nextMonthPromo === true ? 'Has promo' : nextMonthPromo === false ? 'No promo' : 'Not set' }}
        </span>
      </div>
    </div>

    <!-- Kanang bahagi: mga kontrol (naka-column) -->
    <div class="flex flex-col items-end gap-2 flex-shrink-0">
      <!-- Unang row: preview + No + Yes -->
      <div class="flex items-center gap-2">
        <span v-if="previewPromoValue !== null" class="text-xs text-gray-500 whitespace-nowrap">
          Preview: <span class="font-semibold">{{ previewPromoValue === 0 ? 'No promo' : 'Has promo' }}</span>
        </span>
        <span v-else class="text-xs text-gray-400 whitespace-nowrap">Select an option</span>

        <button
          type="button"
          @click="previewPromoFlag(0)"
          class="pg-btn"
          :class="previewPromoValue === 0 ? 'pg-btn-accent' : ''"
          :disabled="promoSaving"
        >
          No
        </button>
        <button
          type="button"
          @click="previewPromoFlag(1)"
          class="pg-btn"
          :class="previewPromoValue === 1 ? 'pg-btn-emerald' : ''"
          :disabled="promoSaving"
        >
          Yes
        </button>
      </div>

      <!-- Ikalawang row: Save button, kasinglapad ng nasa itaas -->
      <button
        type="button"
        @click="confirmPromoFlag(previewPromoValue === 1)"
        class="pg-btn pg-btn-accent w-full"
        :disabled="promoSaving || previewPromoValue === null"
      >
        ✅ Save setting
      </button>
    </div>
  </div>

  <p v-if="promoSaveError" class="alert-error mt-3">{{ promoSaveError }}</p>
</div>

                <div class="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
                  <div class="lg:col-span-3 panel-card" style="padding: 16px;">
                    <div class="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h4 class="panel-title">Forecast vs Past Enrollment</h4>
                        <p class="filter-note mt-1">Line graph showing past enrollment and forecast point.</p>
                      </div>
                    </div>
                    <div class="h-72">
                      <VChart :option="forecastLineOption" autoresize />
                    </div>
                  </div>

                  <div class="lg:col-span-2 panel-card" style="padding: 16px;">
                    <h4 class="panel-title mb-3">Past Enrollment Basis</h4>
                    <div class="table-wrap">
                      <table class="modern-table" style="font-size: 0.72rem;">
                        <thead class="thead-green">
                          <tr>
                            <th>Course</th>
                            <th v-for="m in forecastHistoryLabels" :key="m" class="text-center">{{ m }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="row in forecastHistoryMatrix" :key="row.course">
                            <td class="font-semibold">{{ row.course }}</td>
                            <td v-for="m in forecastHistoryLabels" :key="m" class="text-center">{{ row.values[m] || 0 }}</td>
                          </tr>
                          <tr v-if="forecastHistoryMatrix.length === 0">
                            <td :colspan="forecastHistoryLabels.length + 1" class="empty-cell">No historical data.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div class="panel-card" style="padding: 16px;">
                  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                    <div>
                      <h4 class="panel-title">Course Forecast Breakdown</h4>
                      <p class="filter-note mt-1">Per-course prediction with past basis, forecast, prediction range, and trend.</p>
                    </div>
                  </div>

                  <div class="table-wrap">
                    <table class="modern-table">
                      <thead class="thead-green">
                        <tr>
                          <th>Course</th>
                          <th class="text-center">Past 3 Periods</th>
                          <th class="text-center">Forecast</th>
                          <th class="text-center">Low</th>
                          <th class="text-center">High</th>
                          <th class="text-center">Trend</th>
                        </tr>
                      </thead>
                      <!-- AFTER -->
                      <tbody>
                        <tr v-for="row in courseForecastRowsDisplay" :key="row.course">
                          <td class="font-semibold">{{ row.course }}</td>
                          <td class="text-center font-mono">{{ row.historyLabel }}</td>
                          <td class="text-center font-extrabold" style="color:#6d28d9;">{{ row.forecast }}</td>
                          <td class="text-center">{{ row.low }}</td>
                          <td class="text-center">{{ row.high }}</td>
                          <td class="text-center">
                            <span class="pill" :class="forecastTrendClass(row.trend)">{{ row.trend }}</span>
                          </td>
                        </tr>
                        <tr v-if="courseForecastRows.length === 0">
                          <td colspan="6" class="empty-cell">No forecast data available yet.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- ✅ #2 Per-Course Forecast Bar Chart -->
                <div class="panel-card mt-5" style="padding: 16px;">
                  <h4 class="panel-title mb-3">Forecast by Course (Bar Chart)</h4>
                  <div class="h-72">
                    <VChart :option="courseForecastBarOption" autoresize />
                  </div>
                </div>

                <!-- ✅ #3 + #4 Multi-Horizon and Revenue Forecast (side by side) -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                  <div class="panel-card" style="padding: 16px;">
                    <h4 class="panel-title mb-3">Multi-Horizon Enrollment Projection</h4>
                    <p class="filter-note mb-3">Total predicted enrollment across all courses for the next 1, 2, and 3 months.</p>
                    <div class="h-64">
                      <VChart :option="multiHorizonOption" autoresize />
                    </div>
                  </div>

                  <div class="panel-card" style="padding: 16px;">
                    <h4 class="panel-title mb-3">Revenue Forecast Projection</h4>
                    <p class="filter-note mb-3">Estimated revenue based on predicted enrollment and average course fee.</p>
                    <div class="h-64">
                      <VChart :option="revenueForecastChartOption" autoresize />
                    </div>
                  </div>
                </div>

                <!-- ✅ #5 Seasonality Heatmap -->
                <div class="panel-card mt-5" style="padding: 16px;">
                  <h4 class="panel-title mb-3">Enrollment Seasonality (Month × Year)</h4>
                  <p class="filter-note mb-3">Darker cells indicate higher enrollment volume for that month.</p>
                  <div class="h-64">
                    <VChart :option="seasonalityHeatmapOption" autoresize />
                  </div>
                </div>
              </template>
            </div>

              <div class="modal-foot">
                <button @click="forecastModalOpen = false" class="btn-cancel">Close</button>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- ===================== EXPORT MODAL ===================== -->
      <transition name="modal-fade">
        <div v-if="exportOpen" class="modal-overlay">
          <transition name="modal-scale">
            <div class="modal-card modal-card-xl" style="max-width: 900px;">
              <div class="modal-head modal-head-green">
                <h3 class="modal-title">📤 Export Builder</h3>
                <button @click="exportOpen=false" class="modal-close-btn">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="modal-body-scroll">
                <div class="form-grid">
                  <div>
                    <label class="form-label">Target</label>
                    <select v-model="exportTarget" class="form-input">
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
                    <label class="form-label">Format</label>
                    <select v-model="exportFormat" class="form-input">
                      <option value="xlsx">Excel (.xlsx)</option>
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>

                  <div v-if="!(exportTarget === 'detailed' && reportMode === 'driving' && exportFormat === 'pdf')">
                    <label class="form-label">Scope</label>
                    <select v-model="exportScope" class="form-input">
                      <option value="all">All rows (filtered)</option>
                      <option value="page">Current page only</option>
                    </select>
                  </div>

                  <div v-if="exportTarget === 'detailed' && reportMode === 'driving'">
                    <label class="form-label">Report Month</label>
                    <input v-model="detailedMonth" type="month" class="form-input" />
                  </div>

                  <div>
                    <label class="form-label">Course</label>
                    <select v-model="exportCourseId" class="form-input">
                      <option value="">Use current tab filter / All</option>
                      <option v-for="c in courses" :key="c.id" :value="String(c.id)">{{ c.course_name }}</option>
                    </select>
                  </div>

                  <div v-if="!(exportTarget === 'detailed' && reportMode === 'driving' && exportFormat === 'pdf')">
                    <label class="form-label">Template</label>
                    <select v-model="exportTemplate" class="form-input">
                      <option value="custom">Custom (selected columns)</option>
                      <option value="pdc">PDC-style list (like your picture)</option>
                      <option value="minimal">Minimal list</option>
                    </select>
                  </div>

                  <div class="form-col-2">
                    <label class="form-label">File name</label>
                    <input v-model="exportFileName" class="form-input" />
                  </div>
                </div>

                <div
                  v-if="(exportTarget === 'detailed' && !(reportMode === 'driving' && exportFormat === 'pdf')) || exportTarget === 'revenue'"
                  class="info-box mt-4"
                >
                  <div class="flex items-center justify-between">
                    <p class="filter-label" style="margin:0;">Columns</p>
                    <div class="flex gap-2">
                      <button @click="selectExportColumns('fromVisible')" class="pg-btn" style="padding:6px 12px; font-size:0.72rem;">Use table columns</button>
                      <button @click="selectExportColumns('all')" class="pg-btn" style="padding:6px 12px; font-size:0.72rem;">Select all</button>
                      <button @click="selectExportColumns('none')" class="pg-btn" style="padding:6px 12px; font-size:0.72rem;">Clear</button>
                    </div>
                  </div>

                  <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <label v-for="col in exportColumnOptions" :key="col.key" class="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" v-model="exportColumns[col.key]" />
                      <span>{{ col.label }}</span>
                    </label>
                  </div>
                </div>

                <div v-if="exportError" class="alert-error mt-4">{{ exportError }}</div>
              </div>

              <div class="modal-foot">
                <button @click="exportOpen=false" class="btn-cancel">Cancel</button>
                <button @click="runExport()" class="btn-save btn-green">Export Now</button>
              </div>
            </div>
          </transition>
        </div>
      </transition>

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
import { LineChart, BarChart, PieChart, HeatmapChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent } from "echarts/components";

// Export libs
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

echarts.use([CanvasRenderer, LineChart, BarChart, PieChart, HeatmapChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent, VisualMapComponent]);

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
          if (mode === "driving") {
            await loadRevenue();
            await loadMLForecast(); // ✅ dagdag
          }
          if (mode === "tesda") {
        await loadAttendanceTrainers();
        await loadAttendanceCourseTrainers();
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

    
    // ✅ NEW: Promo toggle state
    const promoFlagsMap = ref({});
    const promoSaving = ref(false);
    const promoSaveError = ref("");
    const previewPromoValue = ref(null); // null = walang preview, gamitin ang saved value

    const nextMonthKey = computed(() => {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    const nextMonthLabel = computed(() => {
      const [y, m] = nextMonthKey.value.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    });

    const nextMonthPromo = computed(() => {
      const key = nextMonthKey.value;
      if (!(key in promoFlagsMap.value)) return false;
      return !!promoFlagsMap.value[key];
    });

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

    // Forecast helpers: chronological Weighted Moving Average + Trend Adjustment
    // ✅ Important fix: month labels are sorted oldest → newest before forecasting.
    // Before, labels like 2026-04, 2026-03, 2026-02 were treated as if February was the latest month,
    // so the forecast went up even when the actual trend was going down.
    function parseForecastPeriodKey(label) {
      const raw = String(label || "").trim();
      if (!raw || raw === "-") return Number.MAX_SAFE_INTEGER;

      // Supports: 2026-04, 2026-4, 2026/04
      const ym = raw.match(/^(\d{4})[-/](\d{1,2})$/);
      if (ym) return Number(ym[1]) * 100 + Number(ym[2]);

      // Supports date-like labels: 2026-04-15
      const dateLike = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (dateLike) {
        return Number(dateLike[1]) * 10000 + Number(dateLike[2]) * 100 + Number(dateLike[3]);
      }

      // Supports labels that Date can parse, fallback for Month names.
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.getFullYear() * 10000 + (parsed.getMonth() + 1) * 100 + parsed.getDate();
      }

      return Number.MAX_SAFE_INTEGER;
    }

    function sortForecastLabels(labels = []) {
      return [...labels].sort((a, b) => {
        const ak = parseForecastPeriodKey(a);
        const bk = parseForecastPeriodKey(b);
        if (ak !== bk) return ak - bk;
        return String(a).localeCompare(String(b));
      });
    }

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

      // ✅ Oldest → newest. Example: 2026-02, 2026-03, 2026-04.
      return sortForecastLabels(Array.from(labels)).slice(-6);
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

        // ✅ Simple sessionStorage cache na may expiry, para hindi na mag-recompute
    // ang ML kapag nag-navigate palayo't-balik sa page (basta hindi pa expired).
    const ML_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

    function readMlCache(key) {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.timestamp) return null;
        if (Date.now() - parsed.timestamp > ML_CACHE_TTL_MS) return null;
        return parsed.data;
      } catch {
        return null;
      }
    }

    function writeMlCache(key, data) {
      try {
        sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
      } catch {}
    }

    function weightedForecast(values) {
      const v = (values || [])
        .map((x) => Number(x || 0))
        .filter((x) => Number.isFinite(x));

      if (!v.length) {
        return { point: 0, low: 0, high: 0, trend: "No Data", confidence: "Low" };
      }

      // Values must already be chronological: oldest → newest.
      const last3 = v.slice(-3);
      let weighted = 0;

      if (last3.length === 1) {
        weighted = last3[0];
      } else if (last3.length === 2) {
        // latest gets stronger weight
        weighted = last3[1] * 0.65 + last3[0] * 0.35;
      } else {
        // latest month gets strongest weight, oldest gets weakest
        weighted = last3[2] * 0.55 + last3[1] * 0.30 + last3[0] * 0.15;
      }

      const first = last3[0] || 0;
      const latest = last3[last3.length - 1] || 0;
      const middle = last3.length >= 3 ? last3[1] : null;

      const slope = last3.length >= 2 ? (latest - first) / Math.max(1, last3.length - 1) : 0;

      // ✅ Stronger downward correction when the latest month is lower than the older month.
      // This prevents an old spike like February from inflating next month's forecast.
      const trendAdjustment = slope < 0 ? slope * 1.15 : slope * 0.75;
      const point = Math.max(0, Math.round(weighted + trendAdjustment));

      const spread = Math.max(
        1,
        Math.round(Math.abs(slope) + Math.sqrt(Math.max(1, latest)))
      );

      let trend = "Stable";
      if (latest < first) trend = "Decreasing";
      else if (latest > first) trend = "Increasing";

      // If three periods consistently go down, force decreasing.
      if (middle !== null && first > middle && middle > latest) trend = "Decreasing";
      if (middle !== null && first < middle && middle < latest) trend = "Increasing";

      const confidence = v.length >= 6 ? "High" : v.length >= 3 ? "Medium" : "Low";

      return {
        point,
        low: Math.max(0, point - spread),
        high: point + spread,
        trend,
        confidence,
      };
    }

const rawForecastData = ref([]); // ✅ raw galing sa API, hindi pa naka-multiply
    const courseForecastRows = ref([]);
    const mlForecastLoading = ref(false);
    const mlForecastError = ref("");

        const FORECAST_CACHE_KEY = "efacet_ml_forecast_cache_v2";

    
    async function loadPromoFlags() {
      try {
        const json = await apiGet(`/api/admin/reports/promo-flags`);
        promoFlagsMap.value = json.status === "success" && json.data ? json.data : {};
      } catch {
        promoFlagsMap.value = {};
      }
    }

    async function previewPromoFlag(value) {
      previewPromoValue.value = value;
      await loadMLForecast(true, value);
    }

    // ✅ Ito lang ang nagko-commit/nagse-save nang permanente sa DB.
    async function confirmPromoFlag(value) {
      promoSaving.value = true;
      promoSaveError.value = "";
      try {
        const res = await fetch(`/api/admin/reports/promo-flags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ month: nextMonthKey.value, has_promo: value }),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        promoFlagsMap.value = { ...promoFlagsMap.value, [nextMonthKey.value]: value };
        previewPromoValue.value = null; // clear preview state, saved na
        await loadMLForecast(true);
      } catch (e) {
        promoSaveError.value = e?.message || "Failed to save promo flag.";
      } finally {
        promoSaving.value = false;
      }
    }
    function courseSortRank(name) {
      const n = String(name || "").toUpperCase().replace(/[^A-Z0-9()]/g, "");
      if (n.includes("(AB)")) return 2;
      if (n.includes("(A)")) return 0;
      if (n.includes("(B)")) return 1;
      if (n.includes("THEORETICAL")) return 3;
      return 4;
    }

    // ✅ Instant lang ito — walang API call — kaya safe tawagin sa
    // bawat pagpalit ng forecastHorizon dropdown.
    function applyForecastMultiplier() {
      const multiplier = getForecastMultiplier();
      courseForecastRows.value = rawForecastData.value
        .map((r) => ({
          course: r.course,
          historyLabel: `${r.m3} → ${r.m2} → ${r.m1}`,
          forecast: Math.round(r.forecast * multiplier),
          low: Math.round(r.low * multiplier),
          high: Math.round(r.high * multiplier),
          baseForecast: Number(r.forecast || 0),
          baseLow: Number(r.low || 0),
          baseHigh: Number(r.high || 0),
          multiPoints: Array.isArray(r.multiPoints) ? r.multiPoints : [r.forecast, r.forecast, r.forecast],
          trend: r.trend,
          confidence: r.dataPoints >= 12 ? "High" : r.dataPoints >= 6 ? "Medium" : "Low",
          explanation: r.explanation,
          dataPoints: r.dataPoints,
          modelUsed: r.model_used,
        }))
        .sort((a, b) => b.forecast - a.forecast || a.course.localeCompare(b.course));
      computeForecastAndRevenueModel();
    }

    async function loadMLForecast(force = false, previewOverride = null) {
      if (reportMode.value !== "driving") {
        rawForecastData.value = [];
        courseForecastRows.value = [];
        computeForecastAndRevenueModel();
        return;
      }
      if (!force && previewOverride === null) {
        const cached = readMlCache(FORECAST_CACHE_KEY);
        if (cached) {
          rawForecastData.value = cached;
          applyForecastMultiplier();
          return;
        }
      }

      mlForecastLoading.value = true;
      mlForecastError.value = "";

      try {
        const previewParam = previewOverride !== null ? `&preview_promo=${previewOverride}` : "";
        const json = await apiGet(`/api/admin/reports/forecast?report_mode=driving${previewParam}`);
        const rows = json.status === "success" && Array.isArray(json.data) ? json.data : [];
        rawForecastData.value = rows;
        if (previewOverride === null) writeMlCache(FORECAST_CACHE_KEY, rows); // huwag i-cache ang preview
        applyForecastMultiplier();
      } catch (e) {
        mlForecastError.value = e?.message || "Failed to load ML forecast.";
        rawForecastData.value = [];
        courseForecastRows.value = [];
      } finally {
        mlForecastLoading.value = false;
      }
    }

    const forecastLineOption = computed(() => {
      const labels = [...forecastHistoryLabels.value, forecastPeriodLabel.value];
      const pastTotals = forecastHistoryLabels.value.map((label) =>
        forecastHistoryMatrix.value.reduce((sum, row) => sum + Number(row.values[label] || 0), 0)
      );
      const forecastPoint = Number(forecast.nextForecast || 0);
      const lowPoint = Number(forecast.low || 0);
      const highPoint = Number(forecast.high || 0);

      const lastPast = pastTotals.length ? pastTotals[pastTotals.length - 1] : 0;
      const leadingNulls = Array(Math.max(0, pastTotals.length - 1)).fill(null);

      // ✅ Confidence band: dalawang stacked series na gumagawa ng "shaded region"
      // sa pagitan ng Low at High — standard na paraan sa forecasting dashboards.
      const bandBase = [...leadingNulls, lastPast, lowPoint];
      const bandHeight = [...leadingNulls, 0, Math.max(0, highPoint - lowPoint)];

      return {
        tooltip: { trigger: "axis" },
        legend: { top: 0, data: ["Past Enrollment", "Forecast", "Confidence Range"] },
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
            name: "Confidence Base",
            type: "line",
            stack: "band",
            smooth: true,
            symbol: "none",
            lineStyle: { opacity: 0 },
            areaStyle: { opacity: 0 },
            data: bandBase,
            tooltip: { show: false },
          },
          {
            name: "Confidence Range",
            type: "line",
            stack: "band",
            smooth: true,
            symbol: "none",
            lineStyle: { opacity: 0 },
            areaStyle: { color: "#c4b5fd", opacity: 0.35 },
            data: bandHeight,
          },
          {
            name: "Forecast",
            type: "line",
            smooth: true,
            data: [...leadingNulls, lastPast, forecastPoint],
            itemStyle: { color: "#6d28d9" },
          },
        ],
      };
    });
// AFTER
    // ✅ Fixed-order view ng courseForecastRows, para lang sa
    // Course Forecast Breakdown table. Hindi apektado ang topCourse
    // logic o bar chart — sila pa rin ang gumagamit ng forecast-desc order.
    const courseForecastRowsDisplay = computed(() =>
      [...courseForecastRows.value].sort(
        (a, b) => courseSortRank(a.course) - courseSortRank(b.course) || a.course.localeCompare(b.course)
      )
    );

        // ✅ #2 Per-Course Forecast Bar Chart
    const courseForecastBarOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 50, right: 20, top: 30, bottom: 70 },
      xAxis: {
        type: "category",
        data: courseForecastRows.value.map((r) => r.course),
        axisLabel: { rotate: 25, fontSize: 10 },
      },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "Forecast",
          type: "bar",
          data: courseForecastRows.value.map((r) => r.forecast),
          itemStyle: { color: "#6d28d9", borderRadius: [6, 6, 0, 0] },
          barMaxWidth: 50,
        },
      ],
    }));

    // ✅ FIXED: totoong per-month na forecast na mula sa ML model
    // (multiPoints array), hindi na basta pag-multiply ng 1-month forecast.
    const multiHorizonTotals = computed(() => {
      const totals = [0, 0, 0];
      courseForecastRows.value.forEach((r) => {
        const points = Array.isArray(r.multiPoints) && r.multiPoints.length === 3
          ? r.multiPoints
          : [r.baseForecast || 0, r.baseForecast || 0, r.baseForecast || 0];

        totals[0] += Math.round(points[0] || 0);
        totals[1] += Math.round((points[0] || 0) + (points[1] || 0));
        totals[2] += Math.round((points[0] || 0) + (points[1] || 0) + (points[2] || 0));
      });
      return totals;
    });

    const multiHorizonOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 50, right: 20, top: 30, bottom: 40 },
      xAxis: { type: "category", data: ["Next Month", "Next 2 Months", "Next 3 Months"] },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "Total Predicted Enrollment",
          type: "bar",
          data: multiHorizonTotals.value,
          itemStyle: { color: "#059669", borderRadius: [6, 6, 0, 0] },
          barMaxWidth: 60,
          label: { show: true, position: "top" },
        },
      ],
    }));

    // ✅ #4 Revenue Forecast Chart (base sa multi-horizon totals x avg fee)
    const revenueForecastChartOption = computed(() => {
      const avgFee = Number(revenueStats.avgFeePeso || 0);
      const revenueByHorizon = multiHorizonTotals.value.map((t) => Math.round(t * avgFee));

      return {
        tooltip: {
          trigger: "axis",
          valueFormatter: (v) => formatCurrency(v),
        },
        grid: { left: 70, right: 20, top: 30, bottom: 40 },
        xAxis: { type: "category", data: ["Next Month", "Next 2 Months", "Next 3 Months"] },
        yAxis: {
          type: "value",
          axisLabel: { formatter: (v) => "₱" + (v / 1000).toFixed(0) + "k" },
        },
        series: [
          {
            name: "Forecast Revenue",
            type: "line",
            smooth: true,
            areaStyle: { opacity: 0.25 },
            data: revenueByHorizon,
            itemStyle: { color: "#10b981" },
            label: { show: true, formatter: (p) => formatCurrency(p.value), position: "top" },
          },
        ],
      };
    });

    // ✅ #5 Seasonality Heatmap (Month x Year, base sa courseMonthlyPreview)
    const seasonalityHeatmapOption = computed(() => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const totalsByMonth = new Map();

      (courseMonthlyPreview.value || []).forEach((r) => {
        const label = String(r.month_label || "");
        totalsByMonth.set(label, (totalsByMonth.get(label) || 0) + Number(r.count || 0));
      });

      const years = [...new Set(Array.from(totalsByMonth.keys()).map((k) => k.split("-")[0]))]
        .filter(Boolean)
        .sort();

      const data = [];
      years.forEach((y, yi) => {
        monthNames.forEach((_, mi) => {
          const key = `${y}-${String(mi + 1).padStart(2, "0")}`;
          const val = totalsByMonth.get(key) || 0;
          data.push([mi, yi, val]);
        });
      });

      const maxVal = Math.max(1, ...data.map((d) => d[2]));

      return {
        tooltip: {
          position: "top",
          formatter: (p) => `${monthNames[p.data[0]]} ${years[p.data[1]]}: ${p.data[2]} enrollments`,
        },
        grid: { left: 60, right: 20, top: 20, bottom: 80 },
        xAxis: { type: "category", data: monthNames, splitArea: { show: true } },
        yAxis: { type: "category", data: years, splitArea: { show: true } },
        visualMap: {
          min: 0,
          max: maxVal,
          calculable: true,
          orient: "horizontal",
          left: "center",
          bottom: 0,
          inRange: { color: ["#f0fdf4", "#10b981", "#065f46"] },
        },
        series: [
          {
            type: "heatmap",
            data,
            label: { show: true, fontSize: 9 },
            emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(0,0,0,0.3)" } },
          },
        ],
      };
    });

    const backtestRows = ref([]);
    const backtestLoading = ref(false);
    const backtestError = ref("");

    const BACKTEST_CACHE_KEY = "efacet_ml_backtest_cache";

    async function loadBacktest(force = false) {
      if (reportMode.value !== "driving") {
        backtestRows.value = [];
        return;
      }

      if (!force) {
        const cached = readMlCache(BACKTEST_CACHE_KEY);
        if (cached) {
          backtestRows.value = cached;
          return;
        }
      }

      backtestLoading.value = true;
      backtestError.value = "";
      try {
        const json = await apiGet(`/api/admin/reports/forecast-backtest?report_mode=driving`);
        const rows = json.status === "success" && Array.isArray(json.data) ? json.data : [];
        backtestRows.value = rows;
        writeMlCache(BACKTEST_CACHE_KEY, rows);
      } catch (e) {
        backtestError.value = e?.message || "Failed to load backtest.";
        backtestRows.value = [];
      } finally {
        backtestLoading.value = false;
      }
    }

    const backtestChartOption = computed(() => ({
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 70 },
      xAxis: {
        type: "category",
        data: backtestRows.value.map((r) => r.course),
        axisLabel: { rotate: 25, fontSize: 10 },
      },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "Actual",
          type: "bar",
          data: backtestRows.value.map((r) => r.actual),
          itemStyle: { color: "#059669" },
          barMaxWidth: 30,
        },
        {
          name: "Predicted",
          type: "bar",
          data: backtestRows.value.map((r) => r.predicted),
          itemStyle: { color: "#6d28d9" },
          barMaxWidth: 30,
        },
      ],
    }));

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
      // ✅ backtest lang tumatakbo kapag binuksan ang modal — hindi
      // na binabagalan ang unang pag-load ng buong page.
      if (!backtestRows.value.length) loadBacktest();
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
      applyForecastMultiplier(); // ✅ instant lang, walang bagong API/model call
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
        await loadAttendanceCourseTrainers();
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

      if (reportMode.value === "driving") {
              await loadRevenue();
              await loadMLForecast();
            } else {
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
    // ✅ FIXED: kinukuha na direkta sa /certificates-summary endpoint
    // (galing sa `certificates` table, base sa `issued_at`) — hindi na
    // basta bilang ng detailedRows/reservation dates. Kaya makukuha na
    // rin ngayon yung mga ONLINE reservations na na-release ang
    // certificate sa ibang buwan kesa sa booking date.
    function normalizeCourseType(row) {
      const text = `${row.course_name || ""} ${row.course_code || ""} ${row.course_type || ""}`.toUpperCase();
      if (text.includes("TDC") || text.includes("THEORETICAL")) return "tdc";
      return "pdc";
    }

    function normalizeDLCode(value) {
      const s = String(value || "").trim().toUpperCase();
      return s || "A";
    }

    function certificateMonthLabelFallback(value) {
      const [y, m] = String(value || "").split("-");
      const d = new Date(Number(y || new Date().getFullYear()), Number(m || 1) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    }

    function emptyCertificateReport(monthValue) {
      return {
        monthLabel: certificateMonthLabelFallback(monthValue),
        tesdaTotal: 0,
        tesdaCourseRows: [],
        tesdaTrainerRows: [],
        tdcTotal: 0,
        pdcTotal: 0,
        tdc: { sex: { Male: 0, Female: 0 } },
        pdc: { sex: { Male: 0, Female: 0 } },
        trainingPurposeRows: [],
        dlCodeRows: [],
        dlCodeTotal: 0,
      };
    }

    const certificateReport = ref(emptyCertificateReport(certificateMonth.value));
    const certificateLoading = ref(false);
    const certificateError = ref("");

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

      certificateLoading.value = true;
      certificateError.value = "";

      try {
        // ✅ Direktang tumatawag na sa backend gamit ang certificateMonth,
        // hiwalay sa detailedMonth/detailedTabFilters — kaya tama na ang
        // buwan na kino-query, hindi na basta yung huling na-load na range
        // ng Detailed Reports tab.
        const endpoint =
          reportMode.value === "tesda"
            ? `/api/admin/tesda-reports/certificates-summary?month=${encodeURIComponent(certificateMonth.value)}`
            : `/api/admin/reports/certificates-summary?month=${encodeURIComponent(certificateMonth.value)}`;

        const json = await apiGet(endpoint);

        if (json.status === "success" && json.data) {
          certificateReport.value = {
            ...emptyCertificateReport(certificateMonth.value),
            ...json.data,
            tdc: json.data.tdc || { sex: { Male: 0, Female: 0 } },
            pdc: json.data.pdc || { sex: { Male: 0, Female: 0 } },
          };
        } else {
          certificateReport.value = emptyCertificateReport(certificateMonth.value);
        }
      } catch (e) {
        certificateError.value = e?.message || "Failed to load issued certificates report.";
        certificateReport.value = emptyCertificateReport(certificateMonth.value);
      } finally {
        certificateLoading.value = false;
      }
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
      await loadPromoFlags();
      if (reportMode.value === "driving") {
        await loadRevenue();
        await loadMLForecast(); // ✅ dagdag
      }
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
      courseForecastRowsDisplay,
      mlForecastLoading,
      mlForecastError,
      courseForecastBarOption,
      multiHorizonOption,
      revenueForecastChartOption,
      seasonalityHeatmapOption,
      backtestRows,
      backtestLoading,
      backtestError,
      backtestChartOption, 
      forecastHistoryLabels,
      forecastHistoryMatrix,
      forecastLineOption,
      forecastAlgorithmSteps,
      forecastTrendClass,
      nextMonthKey,
      nextMonthLabel,
      nextMonthPromo,
      promoSaving,
      promoSaveError,
      previewPromoValue,
      previewPromoFlag,
      confirmPromoFlag,

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
      certificateLoading,
      certificateError,
      reloadCertificateReport,
      exportCertificateReport,

      // exams
      examStats,
    };
  },
};
</script>

<style scoped>
/* ========== SHARED LAYOUT / TOKENS (from AdminSchedule.vue design system) ========== */
.stack-5 > * + * { margin-top: 20px; }
.stack-6 > * + * { margin-top: 24px; }

/* ========== PAGE HEADER ========== */
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-title-accent { font-weight: 800; }
.accent-green { color: #059669; }
.accent-blue { color: #1d4ed8; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.info-note { font-size: 0.75rem; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px; }
.filter-note { font-size: 0.75rem; color: #9ca3af; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

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
.toggle-row { display: flex; gap: 4px; }

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
.pg-btn-emerald { background: #059669; color: #fff; border-color: #059669; }
.pg-btn-emerald:hover { background: #047857; color: #fff; }
.pg-btn-red { background: #ef4444; color: #fff; border-color: #ef4444; }
.pg-btn-red:hover { background: #dc2626; color: #fff; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

.toolbar-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }

/* ========== KPI CARDS ========== */
.kpi-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); }
@media (min-width: 640px) { .kpi-grid-3 { grid-template-columns: repeat(3, 1fr); } .kpi-grid-4 { grid-template-columns: repeat(2, 1fr); } .kpi-grid-5 { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px) { .kpi-grid-4 { grid-template-columns: repeat(4, 1fr); } .kpi-grid-5 { grid-template-columns: repeat(5, 1fr); } }

.kpi-card { border-radius: 16px; border: 1px solid #e5e7eb; padding: 16px; min-height: 112px; display: flex; flex-direction: column; justify-content: center; text-align: left; background: #fff; }
.kpi-card-sm { min-height: auto; padding: 12px; }
.kpi-card-clickable { cursor: pointer; transition: all 0.2s; }
.kpi-card-clickable:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.kpi-label { font-size: 0.75rem; font-weight: 700; margin: 0; opacity: 0.85; }
.kpi-value { font-size: 1.9rem; font-weight: 800; line-height: 1; margin: 8px 0 0; }
.kpi-value-text { font-size: 1.15rem; line-height: 1.3; }
.kpi-unit { font-size: 0.7rem; font-weight: 600; color: #6b7280; padding-bottom: 3px; }
.kpi-subtext { font-size: 0.72rem; color: #6b7280; margin: 6px 0 0; }

.kpi-green { background: #ecfdf5; border-color: #a7f3d0; } .kpi-green .kpi-label { color: #047857; } .kpi-green .kpi-value { color: #065f46; }
.kpi-blue { background: #eff6ff; border-color: #bfdbfe; } .kpi-blue .kpi-label { color: #1d4ed8; } .kpi-blue .kpi-value { color: #1e3a8a; }
.kpi-emerald { background: #ecfdf5; border-color: #a7f3d0; } .kpi-emerald .kpi-label { color: #059669; } .kpi-emerald .kpi-value { color: #065f46; }
.kpi-violet { background: #f5f3ff; border-color: #ddd6fe; } .kpi-violet .kpi-label { color: #6d28d9; } .kpi-violet .kpi-value { color: #4c1d95; }
.kpi-amber { background: #fffbeb; border-color: #fde68a; } .kpi-amber .kpi-label { color: #b45309; } .kpi-amber .kpi-value { color: #92400e; }
.kpi-red { background: #fef2f2; border-color: #fecaca; } .kpi-red .kpi-label { color: #b91c1c; } .kpi-red .kpi-value { color: #991b1b; }
.kpi-slate { background: #f8fafc; border-color: #e2e8f0; } .kpi-slate .kpi-label { color: #475569; } .kpi-slate .kpi-value { color: #1e293b; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }

/* ========== PILLS / BADGES ========== */
.pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.pill-green { color: #059669; background: #d1fae5; }
.pill-green-outline { color: #047857; background: #fff; border: 1px solid #a7f3d0; }
.pill-red { color: #dc2626; background: #fee2e2; }
.pill-blue { color: #1d4ed8; background: #dbeafe; }
.pill-amber { color: #b45309; background: #fef3c7; }
.pill-violet-outline { color: #6d28d9; background: #fff; border: 1px solid #ddd6fe; padding: 6px 12px; font-weight: 700; }
.pill-gray { color: #4b5563; background: #f3f4f6; }

/* ========== ALERTS / INFO BOXES ========== */
.alert-error { font-size: 0.8rem; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; }
.info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 14px; font-size: 0.85rem; color: #374151; }
.alert-card { padding: 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; }

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

/* ========== FORM ========== */
.form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.form-col-2 { grid-column: span 2; }
@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) {
  /* ========== GRID ========== */
  .kpi-grid {
    grid-template-columns: 1fr !important;
    gap: 12px;
    margin-top: 1.25rem !important; /* ← ito ang nagbibigay ng espasyo mula sa toggle button */
  }

  /* ========== CARDS ========== */
  .kpi-card {
    padding: 14px 16px !important;
    min-height: auto !important;
  }

  .kpi-value {
    font-size: 1.5rem !important;
  }

  .kpi-label {
    font-size: 0.7rem !important;
  }

  .kpi-subtext {
    font-size: 0.65rem !important;
  }

  .kpi-unit {
    font-size: 0.65rem !important;
    padding-bottom: 2px;
  }

  /* ========== FORECAST CARD ========== */
  .kpi-card-clickable .flex {
    flex-wrap: wrap !important;
    gap: 8px;
  }

  .kpi-card-clickable .flex .min-w-0 {
    flex: 1 1 100%;
  }

  .kpi-card-clickable .pill {
    align-self: flex-start;
  }

  .kpi-card-clickable {
    padding: 16px !important;
  }

  /* ========== HEADER / TOGGLE BUTTON SPACING ========== */
  .page-header-row {
    margin-bottom: 0.5rem !important;
  }

  .page-header-row .flex {
    gap: 0.5rem !important;
  }

  .page-header-row .tab-btn {
    align-self: flex-start;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    padding: 6px 14px;
  }

  /* ========== PAGE TITLE (opsyonal) ========== */
  .page-title {
    font-size: 1.2rem !important;
  }

  .page-subtitle {
    font-size: 0.75rem !important;
  }
}
.form-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; }
.form-input:focus { border-color: #10b981; }

.toggle-btn { padding: 8px 14px; border-radius: 10px; border: 2px solid #e5e7eb; font-size: 0.8rem; font-weight: 600; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.2s; }
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

/* ========== COURSE PICK CARD (attendance modal) ========== */
.course-pick-card { text-align: left; border-radius: 14px; border: 1px solid #e5e7eb; padding: 16px; background: #fff; transition: all 0.2s; cursor: pointer; }
.course-pick-card:hover { border-color: #a7f3d0; background: #f0fdf4; }
.course-pick-active { border-color: #10b981; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }

/* ========== ATTENDANCE CALENDAR / HISTORY ========== */
.cal-day-card { text-align: left; border-radius: 12px; border: 1px solid #e5e7eb; padding: 12px; background: #fff; transition: all 0.15s; cursor: pointer; }
.cal-day-card:hover { background: #f9fafb; }
.cal-day-active { box-shadow: 0 0 0 2px #10b981; border-color: #a7f3d0; }

.history-card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; background: #fff; }
.history-bar-track { height: 8px; width: 100%; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
.history-bar-fill { height: 8px; border-radius: 999px; }
.bar-green { background: #10b981; }
.bar-amber { background: #f59e0b; }
.bar-red { background: #ef4444; }

/* ========== DOCUMENT-STYLE PREVIEW TABLES (government form look, kept close to original) ========== */
.doc-preview { margin: 0 auto; background: #fff; border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; overflow-x: auto; }
.doc-table { width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 10px; }
.doc-table th, .doc-table td { border: 1px solid #000; padding: 4px 6px; }
.doc-thead-blue { background: #dbeafe; }
.doc-thead-olive { background: #c9c19a; }
.doc-subrow { background: #dbeafe; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
</style>