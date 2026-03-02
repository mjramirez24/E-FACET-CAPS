<template>
  <div class="space-y-6">
    <!-- TESDA PAGE HEADER -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-blue-800">📊 TESDA Reports Panel</h2>
        <p class="text-xs text-gray-500">Overview + Detailed Reports (TESDA) • Separate from Driving</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          @click="$emit('switch-to-lto')"
          class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          🚗 Back to Driving
        </button>

        <button
          @click="openExport('overview')"
          class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          📤 Export Overview
        </button>

        <button
          @click="openExport('detailed')"
          class="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          📤 Export Detailed
        </button>
      </div>
    </div>

    <!-- TABS -->
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
    </div>

    <!-- ===================== OVERVIEW ===================== -->
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
              <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select v-model="overviewFilters.courseId" class="w-60 p-2 border border-gray-300 rounded-md text-sm">
                <option value="">All TESDA Courses</option>
                <option v-for="c in tesdaCourses" :key="c.id" :value="String(c.id)">
                  {{ c.course_name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trend Period</label>
              <select v-model="overviewFilters.period" class="w-40 p-2 border border-gray-300 rounded-md text-sm">
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>

          <button
            @click="loadOverview()"
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
          <p class="text-sm text-blue-700 font-medium">Total Enrolled</p>
          <h3 class="text-2xl font-bold text-blue-800 mt-1">{{ summary.totalEnrolled }}</h3>
        </div>

        <div class="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <p class="text-sm text-emerald-700 font-medium">Completed (DONE)</p>
          <h3 class="text-2xl font-bold text-emerald-800 mt-1">{{ summary.doneCount }}</h3>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p class="text-sm text-purple-700 font-medium">Completion Rate</p>
          <h3 class="text-2xl font-bold text-purple-800 mt-1">{{ summary.completionRate }}%</h3>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <p class="text-sm text-yellow-700 font-medium">Estimated Revenue</p>
          <h3 class="text-2xl font-bold text-yellow-800 mt-1">{{ formatCurrency(summary.totalRevenuePeso) }}</h3>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-blue-800 font-semibold mb-3">Enrollment Trend (TESDA)</h3>
          <div class="h-64">
            <VChart ref="trendChartRef" :option="trendOption" autoresize />
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-blue-800 font-semibold mb-3">Top TESDA Courses</h3>
          <div class="h-64">
            <VChart ref="topCoursesChartRef" :option="topCoursesOption" autoresize />
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <h3 class="text-blue-800 font-semibold mb-3">Gender Breakdown</h3>
          <div class="h-72">
            <VChart ref="genderChartRef" :option="genderOption" autoresize />
          </div>
        </div>
      </div>

      <!-- Recent (from detailed page 1) -->
      <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-blue-800 font-semibold">Recent TESDA Enrollments</h3>
          <button @click="activeTab = 'detailed'" class="text-sm text-blue-600 hover:underline">View All →</button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full border border-gray-200 text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-2 px-3 text-left">Name</th>
                <th class="py-2 px-3 text-left">Course</th>
                <th class="py-2 px-3 text-left">Status</th>
                <th class="py-2 px-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in recentRows" :key="r.reservation_id" class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-2 px-3">{{ r.fullname || '-' }}</td>
                <td class="py-2 px-3">{{ r.course_name || '-' }}</td>
                <td class="py-2 px-3">{{ r.reservation_status || '-' }}</td>
                <td class="py-2 px-3">{{ r.created_at ? formatDate(r.created_at) : '-' }}</td>
              </tr>
              <tr v-if="recentRows.length === 0">
                <td colspan="4" class="py-6 text-center text-gray-500">No recent enrollments</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===================== DETAILED ===================== -->
    <div v-else class="space-y-6">
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div class="flex flex-wrap gap-4">
            <DateRangePicker
              v-model:range="detailedFilters.dateRange"
              v-model:from="detailedFilters.customFrom"
              v-model:to="detailedFilters.customTo"
            />

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select v-model="detailedFilters.courseId" class="w-60 p-2 border border-gray-300 rounded-md text-sm">
                <option value="">All TESDA Courses</option>
                <option v-for="c in tesdaCourses" :key="c.id" :value="String(c.id)">
                  {{ c.course_name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select v-model="detailedFilters.gender" class="w-40 p-2 border border-gray-300 rounded-md text-sm">
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sort</label>
              <select v-model="detailedFilters.sort" class="w-44 p-2 border border-gray-300 rounded-md text-sm">
                <option value="created_desc">Created (Newest)</option>
                <option value="created_asc">Created (Oldest)</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="detailedPage = 1; loadDetailed()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Apply
            </button>
          </div>
        </div>

        <div v-if="detailedError" class="mt-3 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
          {{ detailedError }}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-4 border-b flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-blue-800">📋 TESDA Detailed (Enrollments)</h3>
            <p class="text-xs text-gray-500">Total: {{ detailedMeta.total }} records</p>
          </div>

          <div class="flex items-center gap-3">
            <select v-model.number="detailedPageSize" class="w-24 p-2 border rounded-md text-sm" @change="detailedPage = 1; loadDetailed()">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
            <span class="text-sm text-gray-600">Page {{ detailedPage }} / {{ detailedTotalPages }}</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-2 px-3 text-left">#</th>
                <th class="py-2 px-3 text-left">Name</th>
                <th class="py-2 px-3 text-left">Course</th>
                <th class="py-2 px-3 text-left">Instructor</th>
                <th class="py-2 px-3 text-left">Gender</th>
                <th class="py-2 px-3 text-left">Status</th>
                <th class="py-2 px-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in detailedRows" :key="r.reservation_id || idx" class="border-b hover:bg-gray-50">
                <td class="py-2 px-3">{{ (detailedMeta.offset || 0) + idx + 1 }}</td>
                <td class="py-2 px-3">{{ r.fullname || '-' }}</td>
                <td class="py-2 px-3">{{ r.course_name || '-' }}</td>
                <td class="py-2 px-3">{{ r.instructor_name || '-' }}</td>
                <td class="py-2 px-3">{{ r.gender ? (String(r.gender).toLowerCase() === 'male' ? 'M' : 'F') : '-' }}</td>
                <td class="py-2 px-3">{{ r.reservation_status || '-' }}</td>
                <td class="py-2 px-3">{{ r.created_at ? formatDate(r.created_at) : '-' }}</td>
              </tr>
              <tr v-if="detailedLoading">
                <td colspan="7" class="py-8 text-center text-gray-500">Loading...</td>
              </tr>
              <tr v-if="!detailedLoading && detailedRows.length === 0">
                <td colspan="7" class="py-8 text-center text-gray-500">No records found</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="detailedTotalPages > 1" class="p-4 flex justify-between items-center border-t">
          <button class="px-3 py-2 border rounded text-sm disabled:opacity-50" :disabled="detailedPage === 1" @click="detailedPage--; loadDetailed()">
            ← Prev
          </button>
          <div class="flex gap-1">
            <button
              v-for="p in detailedPageButtons"
              :key="p"
              class="px-3 py-2 border rounded text-sm"
              :class="p === detailedPage ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'"
              @click="detailedPage = p; loadDetailed()"
            >
              {{ p }}
            </button>
          </div>
          <button class="px-3 py-2 border rounded text-sm disabled:opacity-50" :disabled="detailedPage === detailedTotalPages" @click="detailedPage++; loadDetailed()">
            Next →
          </button>
        </div>
      </div>
    </div>

    <!-- EXPORT MODAL -->
    <div v-if="exportOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div class="w-full max-w-xl bg-white rounded-xl shadow-xl">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold text-blue-800">📤 Export TESDA</h3>
          <button @click="exportOpen = false" class="px-3 py-1 border rounded hover:bg-gray-50">✖</button>
        </div>

        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Format</label>
              <select v-model="exportFormat" class="w-full p-2 border rounded-md">
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">What</label>
              <select v-model="exportTarget" class="w-full p-2 border rounded-md">
                <option value="overview">Overview</option>
                <option value="detailed">Detailed (current page)</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button @click="exportOpen = false" class="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
            <button @click="runExport" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Export</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
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
  name: "AdminReportsTesda",
  components: { DateRangePicker, VChart },
  emits: ["switch-to-lto"],

  setup() {
    const activeTab = ref("overview");

    // Data
    const tesdaCourses = ref([]);

    const summary = reactive({
      totalEnrolled: 0,
      doneCount: 0,
      completionRate: 0,
      totalRevenuePeso: 0,
    });

    const trend = reactive({ labels: [], values: [] });
    const topCourses = reactive({ labels: [], values: [] });
    const gender = reactive({ labels: ["Male", "Female"], values: [0, 0] });

    const recentRows = ref([]);

    // Detailed
    const detailedRows = ref([]);
    const detailedMeta = reactive({ total: 0, page: 1, limit: 25, offset: 0 });
    const detailedPage = ref(1);
    const detailedPageSize = ref(25);

    // Loading + errors
    const overviewLoading = ref(false);
    const detailedLoading = ref(false);
    const overviewError = ref("");
    const detailedError = ref("");

    // Filters
    const overviewFilters = reactive({
      dateRange: "thisMonth",
      customFrom: "",
      customTo: "",
      courseId: "",
      period: "month",
    });

    const detailedFilters = reactive({
      dateRange: "thisMonth",
      customFrom: "",
      customTo: "",
      courseId: "",
      gender: "",
      sort: "created_desc",
    });

    // Chart refs
    const trendChartRef = ref(null);
    const topCoursesChartRef = ref(null);
    const genderChartRef = ref(null);

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
      if (range === "thisMonth") return { from: toISODateLocal(new Date(yyyy, mm, 1)), to: toISODateLocal(today) };
      if (range === "lastMonth") return { from: toISODateLocal(new Date(yyyy, mm - 1, 1)), to: toISODateLocal(new Date(yyyy, mm, 0)) };
      if (range === "thisQuarter") {
        const qStart = Math.floor(mm / 3) * 3;
        return { from: toISODateLocal(new Date(yyyy, qStart, 1)), to: toISODateLocal(today) };
      }
      return { from: toISODateLocal(new Date(yyyy, 0, 1)), to: toISODateLocal(today) };
    }

    async function apiGet(url) {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed: ${res.status}`);
      }
      return res.json();
    }

    async function loadTesdaCourses() {
      // ✅ use existing admin courses OR tesda courses endpoint if you already have it
      // If you don't have /api/tesda/courses, change it to /api/admin/courses?report_mode=tesda (optional).
      try {
        const json = await apiGet("/api/tesda/courses");
        tesdaCourses.value = json.status === "success" ? json.data || [] : [];
      } catch {
        tesdaCourses.value = [];
      }
    }

    function buildQsForOverview() {
      const range = getRangeDates(overviewFilters.dateRange, overviewFilters.customFrom, overviewFilters.customTo);
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        course_id: overviewFilters.courseId || "",
        period: overviewFilters.period || "month",
        report_mode: "tesda", // ✅ CRITICAL FIX
      });
      return { range, qs };
    }

    function buildQsForDetailed() {
      const range = getRangeDates(detailedFilters.dateRange, detailedFilters.customFrom, detailedFilters.customTo);
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        course_id: detailedFilters.courseId || "",
        gender: detailedFilters.gender || "",
        sort: detailedFilters.sort || "created_desc", // backend ignores sort for tesda right now (ok)
        page: String(detailedPage.value || 1),
        limit: String(detailedPageSize.value || 25),
        report_mode: "tesda", // ✅ CRITICAL FIX
      });
      return { range, qs };
    }

    async function loadOverview() {
      overviewLoading.value = true;
      overviewError.value = "";

      try {
        const { range, qs } = buildQsForOverview();

        const [sum, tr, top, gen] = await Promise.all([
          apiGet(`/api/admin/reports/summary?${qs.toString()}`),
          apiGet(`/api/admin/reports/trend?${qs.toString()}`),
          apiGet(`/api/admin/reports/top-courses?${qs.toString()}`),
          apiGet(`/api/admin/reports/gender-breakdown?${qs.toString()}`),
        ]);

        if (sum.status === "success" && sum.data) {
          summary.totalEnrolled = Number(sum.data.totalEnrolled || 0);
          summary.doneCount = Number(sum.data.doneCount || 0);
          summary.completionRate = Number(sum.data.completionRate || 0);
          summary.totalRevenuePeso = Number(sum.data.totalRevenuePeso || 0);
        } else {
          summary.totalEnrolled = 0;
          summary.doneCount = 0;
          summary.completionRate = 0;
          summary.totalRevenuePeso = 0;
        }

        trend.labels = tr.status === "success" ? (tr.data?.labels || []) : [];
        trend.values = tr.status === "success" ? (tr.data?.values || []) : [];

        topCourses.labels = top.status === "success" ? (top.data?.labels || []) : [];
        topCourses.values = top.status === "success" ? (top.data?.values || []) : [];

        if (gen.status === "success" && gen.data) {
          gender.labels = Array.isArray(gen.data.labels) ? gen.data.labels : ["Male", "Female"];
          gender.values = Array.isArray(gen.data.values) ? gen.data.values : [0, 0];
        } else {
          gender.labels = ["Male", "Female"];
          gender.values = [0, 0];
        }

        // recent rows (page1, limit5)
        const recentQs = new URLSearchParams({
          from: range.from,
          to: range.to,
          course_id: overviewFilters.courseId || "",
          page: "1",
          limit: "5",
          report_mode: "tesda",
        });
        const recent = await apiGet(`/api/admin/reports/detailed?${recentQs.toString()}`);
        recentRows.value = recent.status === "success" ? (recent.data || []) : [];
      } catch (e) {
        overviewError.value = e?.message || "Failed to load TESDA overview.";
        trend.labels = [];
        trend.values = [];
        topCourses.labels = [];
        topCourses.values = [];
        gender.labels = ["Male", "Female"];
        gender.values = [0, 0];
        recentRows.value = [];
        summary.totalEnrolled = 0;
        summary.doneCount = 0;
        summary.completionRate = 0;
        summary.totalRevenuePeso = 0;
      } finally {
        overviewLoading.value = false;
        await nextTick();
        resizeCharts();
      }
    }

    async function loadDetailed() {
      detailedLoading.value = true;
      detailedError.value = "";

      try {
        const { qs } = buildQsForDetailed();

        const json = await apiGet(`/api/admin/reports/detailed?${qs.toString()}`);
        detailedRows.value = json.status === "success" ? (json.data || []) : [];

        // ✅ your getDetailed returns meta
        if (json.status === "success" && json.meta) {
          detailedMeta.total = Number(json.meta.total || 0);
          detailedMeta.page = Number(json.meta.page || detailedPage.value || 1);
          detailedMeta.limit = Number(json.meta.limit || detailedPageSize.value || 25);
          detailedMeta.offset = (detailedMeta.page - 1) * detailedMeta.limit;
        } else {
          detailedMeta.total = 0;
          detailedMeta.page = detailedPage.value;
          detailedMeta.limit = detailedPageSize.value;
          detailedMeta.offset = 0;
        }
      } catch (e) {
        detailedError.value = e?.message || "Failed to load TESDA detailed.";
        detailedRows.value = [];
        detailedMeta.total = 0;
        detailedMeta.offset = 0;
      } finally {
        detailedLoading.value = false;
      }
    }

    const trendOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      xAxis: { type: "category", data: trend.labels },
      yAxis: { type: "value" },
      series: [{ name: "Enrollments", type: "line", smooth: true, data: trend.values, areaStyle: {} }],
    }));

    const topCoursesOption = computed(() => ({
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 20, bottom: 60 },
      xAxis: { type: "category", data: topCourses.labels, axisLabel: { rotate: 35 } },
      yAxis: { type: "value" },
      series: [{ name: "Enrollments", type: "bar", data: topCourses.values }],
    }));

    const genderOption = computed(() => ({
      tooltip: { trigger: "item" },
      legend: { bottom: 0 },
      series: [
        {
          name: "Gender",
          type: "pie",
          radius: ["40%", "70%"],
          data: (gender.labels || []).map((lbl, i) => ({ name: lbl, value: Number(gender.values?.[i] || 0) })),
        },
      ],
    }));

    function resizeCharts() {
      try { trendChartRef.value?.resize?.(); } catch {}
      try { topCoursesChartRef.value?.resize?.(); } catch {}
      try { genderChartRef.value?.resize?.(); } catch {}
    }

    const detailedTotalPages = computed(() =>
      Math.max(1, Math.ceil(Number(detailedMeta.total || 0) / Number(detailedPageSize.value || 25)))
    );

    const detailedPageButtons = computed(() => {
      const total = detailedTotalPages.value;
      const current = detailedPage.value;
      const max = 5;
      if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
      let start = Math.max(1, current - 2);
      let end = Math.min(total, start + max - 1);
      start = Math.max(1, end - max + 1);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    // Export
    const exportOpen = ref(false);
    const exportTarget = ref("overview");
    const exportFormat = ref("xlsx");

    function openExport(target) {
      exportTarget.value = target;
      exportFormat.value = "xlsx";
      exportOpen.value = true;
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

    function runExport() {
      const stamp = new Date().toISOString().slice(0, 10);

      if (exportTarget.value === "overview") {
        const tables = [
          {
            sheetName: "Summary",
            headers: ["Metric", "Value"],
            rows: [
              ["Total Enrolled", summary.totalEnrolled],
              ["Completed (DONE)", summary.doneCount],
              ["Completion Rate", `${summary.completionRate}%`],
              ["Estimated Revenue", summary.totalRevenuePeso],
            ],
          },
          {
            sheetName: "Trend",
            headers: ["Label", "Enrollments"],
            rows: (trend.labels || []).map((l, i) => [l, Number(trend.values?.[i] || 0)]),
          },
          {
            sheetName: "Top Courses",
            headers: ["Course", "Enrollments"],
            rows: (topCourses.labels || []).map((l, i) => [l, Number(topCourses.values?.[i] || 0)]),
          },
          {
            sheetName: "Gender",
            headers: ["Gender", "Count"],
            rows: (gender.labels || []).map((l, i) => [l, Number(gender.values?.[i] || 0)]),
          },
        ];

        if (exportFormat.value === "xlsx") exportXlsx(tables, `tesda-overview-${stamp}`);
        else if (exportFormat.value === "csv") exportCsv({ headers: tables[0].headers, rows: tables[0].rows }, `tesda-overview-${stamp}`);
        else exportPdf({ headers: tables[0].headers, rows: tables[0].rows }, `tesda-overview-${stamp}`);

        exportOpen.value = false;
        return;
      }

      // detailed (current page)
      const headers = ["Name", "Course", "Instructor", "Gender", "Status", "Created"];
      const rows = (detailedRows.value || []).map((r) => [
        r.fullname || "",
        r.course_name || "",
        r.instructor_name || "",
        r.gender ? (String(r.gender).toLowerCase() === "male" ? "M" : "F") : "",
        r.reservation_status || "",
        r.created_at ? formatDate(r.created_at) : "",
      ]);

      const table = { headers, rows };
      if (exportFormat.value === "xlsx") exportXlsx([{ sheetName: "Detailed", ...table }], `tesda-detailed-${stamp}`);
      else if (exportFormat.value === "csv") exportCsv(table, `tesda-detailed-${stamp}`);
      else exportPdf(table, `tesda-detailed-${stamp}`);

      exportOpen.value = false;
    }

    onMounted(async () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      overviewFilters.customFrom = toISODateLocal(lastMonth);
      overviewFilters.customTo = toISODateLocal(today);

      detailedFilters.customFrom = toISODateLocal(lastMonth);
      detailedFilters.customTo = toISODateLocal(today);

      await loadTesdaCourses();
      await loadOverview();
      await loadDetailed();
    });

    return {
      activeTab,
      tesdaCourses,

      summary,
      trend,
      topCourses,
      gender,
      recentRows,

      detailedRows,
      detailedMeta,
      detailedPage,
      detailedPageSize,
      detailedTotalPages,
      detailedPageButtons,

      overviewFilters,
      detailedFilters,

      overviewLoading,
      detailedLoading,
      overviewError,
      detailedError,

      // charts
      trendChartRef,
      topCoursesChartRef,
      genderChartRef,
      trendOption,
      topCoursesOption,
      genderOption,

      // helpers
      formatDate,
      formatCurrency,

      // actions
      loadOverview,
      loadDetailed,
      resizeCharts,

      // export
      exportOpen,
      exportTarget,
      exportFormat,
      openExport,
      runExport,
    };
  },
};
</script>