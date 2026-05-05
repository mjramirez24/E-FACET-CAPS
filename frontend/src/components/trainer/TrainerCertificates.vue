<template>
  <TrainerLayout active-page="certificates">
    <template #header-left>
      <input
        type="text"
        placeholder="Search students/certificates..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      />
    </template>

    <div>
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-bold text-blue-800">🎓 TESDA Certificate Management</h2>

          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Logo"
            class="h-10 w-auto object-contain"
            @error="onLogoError"
          />
        </div>

        <button
          @click="fetchRows"
          class="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          🔄 Refresh
        </button>
      </div>

      <div v-if="error" class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {{ error }}
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
          <select
            v-model="selectedCourse"
            class="w-56 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="issued">Issued</option>
            <option value="ready">Ready</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Done Date</label>
          <input
            type="date"
            v-model="selectedDate"
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div class="flex items-end gap-2">
          <button
            @click="clearFilters"
            class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-blue-800">{{ issuedCount }}</h3>
              <p class="text-blue-700 font-medium mt-1">Issued</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-xl">✅</span>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-5 rounded-lg border border-yellow-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-yellow-800">{{ readyCount }}</h3>
              <p class="text-yellow-700 font-medium mt-1">Ready</p>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span class="text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-blue-800">{{ rowsFiltered.length }}</h3>
              <p class="text-blue-700 font-medium mt-1">Shown</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-xl">📄</span>
            </div>
          </div>
        </div>

        <div class="bg-red-50 p-5 rounded-lg border border-red-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-red-800">{{ revokedCount }}</h3>
              <p class="text-red-700 font-medium mt-1">Revoked</p>
            </div>
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
        <p class="mt-3 text-gray-600">Loading...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Showing {{ rowsFiltered.length }} of {{ rowsBase.length }} (TESDA)
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Sort by:</span>
            <select v-model="sortBy" class="text-sm border rounded px-2 py-1">
              <option value="dateDesc">Most Recent</option>
              <option value="dateAsc">Oldest First</option>
              <option value="name">Student A-Z</option>
              <option value="course">Course</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <table class="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
          <thead class="bg-blue-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Student</th>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Done Date</th>
              <th class="py-3 px-4 text-left font-medium">TESDA Cert Code</th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in rowsFiltered"
              :key="row.reservation_id"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                    {{ getInitials(row.student_name) }}
                  </div>
                  <div>
                    <p class="font-medium">{{ row.student_name }}</p>
                    <p class="text-xs text-gray-500">{{ row.student_email }}</p>
                  </div>
                </div>
              </td>

              <td class="py-3 px-4">
                <span class="font-medium">{{ row.course_name }}</span>
                <p class="text-xs text-gray-500 mt-0.5">
                  code: <span class="font-mono">{{ row.course_code || "—" }}</span>
                </p>
              </td>

              <td class="py-3 px-4 text-gray-600">
                {{ row.done_at ? formatDate(row.done_at) : "—" }}
              </td>

              <td class="py-3 px-4">
                <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {{ row.certificate_code || "—" }}
                </code>
              </td>

              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getStatusClass(row.ui_status)">
                  {{ formatStatus(row.ui_status) }}
                </span>
              </td>

              <td class="py-3 px-4">
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-if="row.ui_status === 'ready'"
                    @click="generateTesda(row)"
                    class="text-blue-700 hover:text-blue-900 text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    ➕ Generate
                  </button>


                  <button
                    v-if="row.certificate_id"
                    @click="viewCertificate(row)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    👁️ View
                  </button>

                </div>
              </td>
            </tr>

            <tr v-if="rowsFiltered.length === 0">
              <td colspan="6" class="py-8 text-center text-gray-500">
                <div class="text-gray-400">
                  <span class="text-3xl mb-2 block">🎓</span>
                  <p class="text-gray-500">No results</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TESDA View Modal -->
      <div
        v-if="tesdaModalOpen"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="closeTesdaPreview"
      >
        <div class="bg-white w-full max-w-7xl rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
          <div class="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900">TESDA Certificate View</h3>
              <p class="text-sm text-gray-600">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="downloadVisibleCertificate('png')" class="px-3 py-2 text-sm rounded-md bg-purple-700 text-white hover:bg-purple-800">⬇ PNG</button>
              <button @click="downloadVisibleCertificate('pdf')" class="px-3 py-2 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800">⬇ PDF</button>
              <button @click="printPreview" class="px-3 py-2 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-900">🖨️ Print</button>
              <button @click="closeTesdaPreview" class="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">✖ Close</button>
            </div>
          </div>

          <div class="overflow-y-auto bg-gray-100 p-4">
            <div class="mx-auto w-full overflow-auto">
              <div id="tesda-preview" class="relative bg-white overflow-hidden text-[#111827] shadow-sm" style="width: 11in; height: 8.5in; font-family: Arial, Helvetica, sans-serif;">
                <img src="/tesda-logo.png" alt="TESDA Watermark" class="absolute pointer-events-none select-none" style="left: 1.15in; top: 1.55in; width: 5.2in; height: 5.2in; object-fit: contain; opacity: 0.055;" />

                <div class="absolute" style="left: .32in; top: .20in; width: 1.05in; height: 1.05in;">
                  <img src="/tesda-logo.png" alt="TESDA Logo" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>

                <div class="absolute leading-tight" style="left: 1.55in; top: .22in; width: 8.9in;">
                  <div style="font-size: 22px; font-weight: 500; letter-spacing: .2px;">TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY</div>
                  <div style="font-size: 13.5px; margin-top: 4px; font-weight: 500;">NATIONAL INSTITUTE FOR TECHNICAL EDUCATION AND SKILLS DEVELOPMENT (NITESD)</div>
                  <div style="font-size: 13.5px; margin-top: 2px; font-weight: 500;">EAST SERVICE ROAD, SOUTH LUZON EXPRESSWAY (SLEX), FORT BONIFACIO, TAGUIG CITY</div>
                  <div style="height: 9px; background: #003cff; width: 7.9in; margin-top: 8px;"></div>
                </div>

                <div class="absolute" style="left: 1.55in; top: 1.55in; width: 8.7in; text-align: left;">
                  <div style="font-size: 41px; line-height: 1; font-weight: 900; letter-spacing: 2px;">CERTIFICATE OF COMPLETION</div>
                  <div style="margin-top: 31px; font-size: 17px; font-weight: 700; letter-spacing: .5px;">THIS IS TO CERTIFY THAT</div>
                  <div style="margin-top: 23px; font-size: 38px; line-height: 1.05; font-weight: 400;">{{ modalRow?.student_name || '—' }}</div>
                  <div style="margin-top: 18px; font-size: 17px; font-weight: 700; letter-spacing: .5px;">HAS COMPLETED THE COURSE</div>
                  <div style="margin-top: 18px; font-size: 34px; line-height: 1.12; font-weight: 400; max-width: 8.8in;">{{ modalRow?.course_name || '—' }}</div>
                  <div style="margin-top: 46px; font-size: 17px; font-weight: 500;"><b>ON</b> {{ modalRow?.done_at ? formatDate(modalRow.done_at) : '—' }}</div>
                </div>

                <div class="absolute" style="left: .47in; bottom: .48in; font-size: 17px; line-height: 1.25; font-weight: 600;">
                  <div>This is a computer generated certificate,</div>
                  <div>it is valid even without a signature.</div>
                  <br />
                  <div>For verification purposes, contact:</div>
                  <div>eTESDA Division</div>
                  <div>tesdaonlineprogram@tesda.gov.ph (02) 8893 - 8297</div>
                </div>

                <div class="absolute text-right" style="right: .47in; bottom: .46in; font-size: 13px; line-height: 1.1;">
                  <div style="width: .95in; height: .95in; border-radius: 999px; background: #1aa0e8; color: white; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 900; font-size: 14px; line-height: 1.05; margin-left: auto; margin-bottom: 8px; transform: rotate(-7deg);">TESDA<br />Online<br />PROGRAM</div>
                  <div>{{ modalRow?.certificate_code || 'TESDA-CODE' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </TrainerLayout>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import TrainerLayout from "./TrainerLayout.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const API_BASE = API_URL.replace("/api", "");

export default {
  name: "TrainerCertificates",
  components: { TrainerLayout },
  setup() {

    const logoUrl = ref("/tesda-logo.png");
    const onLogoError = () => (logoUrl.value = "");

      const ENDPOINTS = {
        view: (id) => `${API_BASE}/api/trainer/certificates/tesda/${id}/view`,
        download: (id) => `${API_BASE}/api/trainer/certificates/tesda/${id}/download`,
      };

    const rows = ref([]);
    const loading = ref(true);
    const error = ref("");

    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");
    const selectedDate = ref("");
    const sortBy = ref("dateDesc");
    const tesdaModalOpen = ref(false);
    const modalRow = ref(null);

    const rowsBase = computed(() => rows.value);

    const courseOptions = computed(() => {
      const set = new Set(rowsBase.value.map((r) => r.course_name).filter(Boolean));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });

    const rowsFiltered = computed(() => {
      let result = [...rowsBase.value];

      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter((r) => {
          const name = (r.student_name || "").toLowerCase();
          const email = (r.student_email || "").toLowerCase();
          const course = (r.course_name || "").toLowerCase();
          const code = (r.certificate_code || "").toLowerCase();
          const courseCode = (r.course_code || "").toLowerCase();
          return name.includes(q) || email.includes(q) || course.includes(q) || code.includes(q) || courseCode.includes(q);
        });
      }

      if (selectedCourse.value) result = result.filter((r) => r.course_name === selectedCourse.value);
      if (selectedStatus.value) result = result.filter((r) => (r.ui_status || "") === selectedStatus.value);
      if (selectedDate.value) result = result.filter((r) => (r.done_at || "").slice(0, 10) === selectedDate.value);

      result.sort((a, b) => {
        switch (sortBy.value) {
          case "dateDesc":
            return new Date(b.done_at || 0) - new Date(a.done_at || 0);
          case "dateAsc":
            return new Date(a.done_at || 0) - new Date(b.done_at || 0);
          case "name":
            return (a.student_name || "").localeCompare(b.student_name || "");
          case "course":
            return (a.course_name || "").localeCompare(b.course_name || "");
          case "status":
            return (a.ui_status || "").localeCompare(b.ui_status || "");
          default:
            return 0;
        }
      });

      return result;
    });

    const issuedCount = computed(() => rowsBase.value.filter((r) => r.ui_status === "issued").length);
    const revokedCount = computed(() => rowsBase.value.filter((r) => r.ui_status === "revoked").length);
    const readyCount = computed(() => rowsBase.value.filter((r) => r.ui_status === "ready").length);

    const getInitials = (name) => {
      const safe = String(name || "").trim();
      if (!safe) return "??";
      const parts = safe.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || "";
      const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
      return (first + last).toUpperCase() || "??";
    };

    const formatDate = (dateString) => {
      if (!dateString) return "—";
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getStatusClass = (status) => {
      switch (status) {
        case "issued":
          return "bg-blue-100 text-blue-800";
        case "ready":
          return "bg-yellow-100 text-yellow-800";
        case "revoked":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const formatStatus = (status) => {
      if (status === "ready") return "Ready";
      return String(status || "").charAt(0).toUpperCase() + String(status || "").slice(1);
    };

    const clearFilters = () => {
      searchQuery.value = "";
      selectedCourse.value = "";
      selectedStatus.value = "";
      selectedDate.value = "";
    };

    const fetchRows = async () => {
      loading.value = true;
      error.value = "";
      try {
        const res = await api.get("/trainer/certificates/tesda/completions");
        const data = res?.data?.data || [];
        rows.value = data.map((r) => ({
          ...r,
          ui_status: r.ui_status || (r.certificate_id ? "issued" : "ready"),
        }));
} catch (e) {
  console.log("CERT ERR:", e?.response?.status, e?.response?.data);
  error.value =
    (e?.response?.data && JSON.stringify(e.response.data)) ||
    e.message ||
    "Failed to load.";
} finally {
        loading.value = false;
      }
    };

    const generateTesda = async (row) => {
      error.value = "";
      try {
        const ok = confirm(`Generate TESDA certificate for ${row.student_name} (${row.course_name})?`);
        if (!ok) return;

        await api.post("/trainer/certificates/tesda/generate", {
          reservation_id: row.reservation_id,
        });
        await fetchRows();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to generate TESDA certificate.";
      }
    };

    const viewCertificate = (row) => {
      openTesdaPreview(row);
    };

    const downloadCertificate = (row) => {
      viewCertificate(row);
    };

    const getDownloadFileName = (format) => {
      const code = modalRow.value?.certificate_code || "TESDA-certificate";
      return `${String(code).replace(/[^a-z0-9_-]/gi, "_")}.${format}`;
    };

    const downloadVisibleCertificate = async (format = "png") => {
      error.value = "";
      await nextTick();

      const target = document.getElementById("tesda-preview");
      if (!target) {
        error.value = "No certificate is currently visible.";
        return;
      }

      try {
        const canvas = await html2canvas(target, {
          backgroundColor: "#ffffff",
          scale: 3,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");

        if (format === "png") {
          const a = document.createElement("a");
          a.href = imgData;
          a.download = getDownloadFileName("png");
          document.body.appendChild(a);
          a.click();
          a.remove();
          return;
        }

        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "in",
          format: [11, 8.5],
        });

        pdf.addImage(imgData, "PNG", 0, 0, 11, 8.5);
        pdf.save(getDownloadFileName("pdf"));
      } catch (e) {
        console.error("downloadVisibleCertificate error:", e);
        error.value = e?.message || "Failed to download visible certificate.";
      }
    };

    const openTesdaPreview = (row) => {
      modalRow.value = row;
      tesdaModalOpen.value = true;
    };

    const closeTesdaPreview = () => {
      tesdaModalOpen.value = false;
      modalRow.value = null;
    };

    const getHeadStylesHtml = () => {
      const nodes = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
      return nodes.map((n) => n.outerHTML).join("\n");
    };

    const printPreview = () => {
      const target = document.getElementById("tesda-preview");
      if (!target) return;

      const cloned = target.cloneNode(true);

      // ✅ Important: gawing absolute URL ang logos/watermark para hindi mawala sa print window/PDF
      cloned.querySelectorAll("img").forEach((img) => {
        const src = img.getAttribute("src") || "";
        if (src.startsWith("/")) img.setAttribute("src", `${window.location.origin}${src}`);
      });

      const w = window.open("", "_blank", "width=1300,height=850");
      if (!w) return;

      const styles = getHeadStylesHtml();

      w.document.open();
      w.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print TESDA Certificate</title>
            ${styles}
            <style>
              * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              html, body { width: 11in; height: 8.5in; margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; overflow: hidden; }
              @page { size: letter landscape; margin: 0; }
              .wrap { width: 11in; height: 8.5in; margin: 0; padding: 0; overflow: hidden; background: #fff; }
              #tesda-preview { width: 11in !important; height: 8.5in !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; transform: none !important; }
              img { max-width: none !important; }
              @media print {
                html, body { width: 11in; height: 8.5in; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
                .wrap { width: 11in !important; height: 8.5in !important; }
              }
            </style>
          </head>
          <body><div class="wrap">${cloned.outerHTML}</div></body>
        </html>
      `);
      w.document.close();

      const waitForImagesThenPrint = () => {
        const imgs = Array.from(w.document.images || []);
        if (!imgs.length) {
          w.focus();
          w.print();
          return;
        }

        let loaded = 0;
        const done = () => {
          loaded += 1;
          if (loaded >= imgs.length) {
            setTimeout(() => {
              w.focus();
              w.print();
            }, 350);
          }
        };

        imgs.forEach((img) => {
          if (img.complete) done();
          else {
            img.onload = done;
            img.onerror = done;
          }
        });
      };

      w.onload = waitForImagesThenPrint;
      w.onafterprint = () => w.close();
    };
    onMounted(fetchRows);

    return {
      logoUrl,
      onLogoError,

      rows,
      loading,
      error,

      searchQuery,
      selectedCourse,
      selectedStatus,
      selectedDate,
      sortBy,

      rowsBase,
      rowsFiltered,
      courseOptions,

      issuedCount,
      readyCount,
      revokedCount,

      getInitials,
      formatDate,
      getStatusClass,
      formatStatus,

      clearFilters,
      fetchRows,
      generateTesda,
      viewCertificate,
      downloadCertificate,
      downloadVisibleCertificate,
      tesdaModalOpen,
      modalRow,
      openTesdaPreview,
      closeTesdaPreview,
      printPreview,
    };
  },
};
</script>