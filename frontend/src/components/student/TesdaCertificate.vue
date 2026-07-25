<!-- src/components/TesdaCertificate.vue -->
<template>
  <StudentLayoutTesda active-page="certificate">
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search certificates..."
            class="search-input-modern"
            v-model="searchQuery"
          />
        </div>
      </div>
    </template>

    <div class="certificate-wrapper">
      <div class="page-top">
        <h2 class="page-title">TESDA Certificates</h2>
        <p class="page-subtitle">View and download your training certificates</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card stat-card-blue">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-blue">{{ stats.total }}</span>
              <span class="stat-label">Total Certificates</span>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-green">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-emerald">{{ stats.completed }}</span>
              <span class="stat-label">Issued</span>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-amber">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-amber">{{ stats.pending }}</span>
              <span class="stat-label">Processing</span>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card-purple">
          <div class="stat-card-inner">
            <div class="stat-info">
              <span class="stat-value text-purple">{{ stats.available }}</span>
              <span class="stat-label">Available</span>
            </div>
            <div class="stat-icon stat-icon-purple">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Certificate Table -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <h3 class="panel-title">Certificate List</h3>
          <div class="panel-header-actions">
            <select v-model="filterStatus" class="select-modern-sm">
              <option value="all">All Status</option>
              <option value="completed">Issued</option>
              <option value="pending">Processing</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p class="text-gray-500">Loading certificates...</p>
        </div>

        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead class="thead-blue">
              <tr>
                <th>Course</th>
                <th>Type</th>
                <th>Issue Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filtered" :key="c.id">
                <td>
                  <div class="font-medium">{{ c.course || c.course_name || "—" }}</div>
                  <div class="text-xs text-gray-400">{{ c.certificate_code || "—" }}</div>
                </td>
                <td>
                  <span class="font-medium">{{ c.type || "TESDA" }}</span>
                </td>
                <td>
                  <span :class="c.issueDate || c.issued_at ? 'font-medium' : 'text-gray-400'">
                    {{ formatDate(c.issueDate || c.issued_at) }}
                  </span>
                </td>
                <td>
                  <span :class="getStatusPillClass(c.status)">
                    {{ formatStatus(c.status) }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button v-if="c.certificate_id" @click="openPreview(c)" class="action-view-sm">View</button>
                    <span v-if="!c.certificate_id" class="text-xs text-gray-400">Waiting for admin</span>
                  </div>
                </td>
              </tr>
              <tr v-if="filtered.length === 0">
                <td colspan="5" class="empty-cell">No certificates found</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-banner">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- TESDA Certificate Preview Modal -->
    <transition name="modal-fade">
      <div v-if="previewModalOpen" class="modal-overlay" @click.self="closePreview">
        <transition name="modal-scale">
          <div class="modal-card modal-card-xl">
            <div class="modal-head modal-head-blue">
              <div>
                <h3 class="modal-title">TESDA Certificate</h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ studentName }} — {{ selectedCert?.course || selectedCert?.course_name || "Certificate" }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button @click="downloadVisibleCertificate('png')" class="pg-btn pg-btn-purple">⬇ PNG</button>
                <button @click="downloadVisibleCertificate('pdf')" class="pg-btn pg-btn-accent-blue">⬇ PDF</button>
                <button @click="printPreview" class="pg-btn pg-btn-dark">🖨️ Print</button>
                <button class="modal-close-btn" @click="closePreview">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="modal-body-scroll" style="background: #f3f4f6;">
              <div class="mx-auto w-full overflow-auto p-4">
                <!-- TESDA Certificate Template -->
                <div
                  id="tesda-preview"
                  class="relative bg-white overflow-hidden text-[#111827] shadow-sm"
                  style="width: 11in; height: 8.5in; font-family: Arial, Helvetica, sans-serif;"
                >
                  <img
                    src="/tesda-logo.png"
                    alt="TESDA Watermark"
                    class="absolute pointer-events-none select-none"
                    style="left: 1.15in; top: 1.55in; width: 5.2in; height: 5.2in; object-fit: contain; opacity: 0.055;"
                  />

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
                    <!-- ✅ STUDENT NAME DAPAT GALING SA API -->
                    <div style="margin-top: 23px; font-size: 38px; line-height: 1.05; font-weight: 400;">
                      {{ studentName || '—' }}
                    </div>
                    <div style="margin-top: 18px; font-size: 17px; font-weight: 700; letter-spacing: .5px;">HAS COMPLETED THE COURSE</div>
                    <div style="margin-top: 18px; font-size: 34px; line-height: 1.12; font-weight: 400; max-width: 8.8in;">
                      {{ selectedCert?.course || selectedCert?.course_name || '—' }}
                    </div>
                    <div style="margin-top: 46px; font-size: 17px; font-weight: 500;">
                      <b>ON</b> {{ formatDate(selectedCert?.issueDate || selectedCert?.issued_at) }}
                    </div>
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
                    <div style="width: .95in; height: .95in; border-radius: 999px; background: #1aa0e8; color: white; display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 900; font-size: 14px; line-height: 1.05; margin-left: auto; margin-bottom: 8px; transform: rotate(-7deg);">
                      TESDA<br />Online<br />PROGRAM
                    </div>
                    <div>{{ selectedCert?.certificate_code || 'TESDA-CODE' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </StudentLayoutTesda>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import StudentLayoutTesda from "./StudentLayoutTesda.vue";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default {
  name: "TesdaCertificate",
  components: { StudentLayoutTesda },
  setup() {
    const API_BASE = API_URL.replace("/api", "");

    const loading = ref(false);
    const error = ref("");
    const certificates = ref([]);

    // ✅ ITO ANG FIX: Gamitin ang /api/settings/profile para makuha ang fullname
    const studentName = ref("");
    const studentInfo = ref(null);

    const searchQuery = ref("");
    const filterStatus = ref("all");

    // Preview Modal
    const previewModalOpen = ref(false);
    const selectedCert = ref(null);

    // ✅ FIXED: Kunin ang student info gamit ang /api/settings/profile
    const fetchStudentInfo = async () => {
      try {
        // ✅ ITO ANG TAMANG ENDPOINT — same sa sidebar at dashboard
        const res = await api.get("/settings/profile");
        
        if (res.data?.status === "success" && res.data?.profile) {
          const profile = res.data.profile;
          
          // Kunin ang fullname (check multiple possible field names)
          studentName.value = profile.fullname || 
                             profile.full_name || 
                             profile.name || 
                             profile.username || 
                             "";
          
          studentInfo.value = profile;
          
          console.log("✅ Student info loaded from /api/settings/profile:", profile);
          console.log("✅ Student name set to:", studentName.value);
        } else {
          throw new Error("Profile not found in response");
        }
      } catch (e) {
        console.log("⚠️ /api/settings/profile failed, trying alternatives...");
        
        // Fallback 1: Subukan ang /api/auth/check
        try {
          const authRes = await api.get("/auth/check");
          if (authRes.data?.authenticated && authRes.data?.user) {
            const user = authRes.data.user;
            studentName.value = user.fullname || user.full_name || user.name || user.username || "";
            studentInfo.value = user;
            console.log("✅ Student info loaded from /api/auth/check:", user);
            return;
          }
        } catch (err) {
          console.log("⚠️ /api/auth/check also failed");
        }
        
        // Fallback 2: Check localStorage
        try {
          const storedUser = localStorage.getItem("user") || 
                            localStorage.getItem("userData") || 
                            localStorage.getItem("studentInfo");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            studentName.value = userData?.fullname || 
                               userData?.full_name || 
                               userData?.name ||
                               userData?.username ||
                               "";
            studentInfo.value = userData;
            console.log("✅ Student info loaded from localStorage:", userData);
            return;
          }
        } catch (err) {
          console.log("⚠️ localStorage fallback failed");
        }
        
        console.log("❌ Could not retrieve student name from any source");
      }
    };

    const fetchCertificates = async () => {
      loading.value = true;
      error.value = "";
      try {
        const res = await api.get("/tesda/certificates");
        certificates.value = res?.data?.data || [];
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to load TESDA certificates.";
      } finally {
        loading.value = false;
      }
    };

    const filtered = computed(() => {
      let list = [...certificates.value];
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter((c) => {
          const course = (c.course || c.course_name || "").toLowerCase();
          const code = (c.certificate_code || "").toLowerCase();
          const type = (c.type || "").toLowerCase();
          return course.includes(q) || code.includes(q) || type.includes(q);
        });
      }
      if (filterStatus.value !== "all") {
        list = list.filter((c) => c.status === filterStatus.value);
      }
      return list;
    });

    const stats = computed(() => {
      const total = certificates.value.length;
      const completed = certificates.value.filter((c) => c.status === "completed").length;
      const pending = certificates.value.filter((c) => c.status === "pending").length;
      const available = completed;
      return { total, completed, pending, available };
    });

    const formatDate = (dateString) => {
      if (!dateString) return "Not yet issued";
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
    };

    const formatStatus = (status) => {
      if (!status) return "Unknown";
      if (status === "completed" || status === "issued") return "Issued";
      if (status === "pending" || status === "ready") return "Processing";
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const getStatusPillClass = (status) => {
      if (status === "completed" || status === "issued") return "pill pill-green";
      return "pill pill-amber";
    };

    const openPreview = (cert) => {
      selectedCert.value = cert;
      previewModalOpen.value = true;
    };

    const closePreview = () => {
      previewModalOpen.value = false;
      selectedCert.value = null;
    };

    const downloadCertificate = (c) => {
      if (!c?.certificate_id) return;
      window.open(`${API_URL}/tesda/certificates/${c.certificate_id}/download`, "_blank");
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
          a.download = `${(selectedCert.value?.certificate_code || "certificate").replace(/[^a-z0-9_-]/gi, "_")}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          return;
        }

        const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
        const pdf = new jsPDF({
          orientation,
          unit: "in",
          format: orientation === "landscape" ? [11, 8.5] : [8.5, 11],
        });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
        pdf.save(`${(selectedCert.value?.certificate_code || "certificate").replace(/[^a-z0-9_-]/gi, "_")}.pdf`);
      } catch (e) {
        console.error("downloadVisibleCertificate error:", e);
        error.value = e?.message || "Failed to download certificate.";
      }
    };

    const getHeadStylesHtml = () => {
      const nodes = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
      return nodes.map((n) => n.outerHTML).join("\n");
    };

    const printPreview = () => {
      const target = document.getElementById("tesda-preview");
      if (!target) return;

      const cloned = target.cloneNode(true);

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
            <title>Print Certificate</title>
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
          <body>
            <div class="wrap">${cloned.outerHTML}</div>
          </body>
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

    onMounted(async () => {
      await fetchStudentInfo();
      await fetchCertificates();
    });

    return {
      API_BASE,
      loading, error, certificates, searchQuery, filterStatus,
      studentName, studentInfo,
      filtered, stats, fetchCertificates, formatDate, formatStatus, getStatusPillClass,
      downloadCertificate, openPreview, closePreview,
      previewModalOpen, selectedCert,
      downloadVisibleCertificate, printPreview,
    };
  },
};
</script>

<style scoped>
.certificate-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #3b82f6; }
.page-top { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; transition: all 0.2s; }
.stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
.stat-label { font-size: 0.85rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }
.text-emerald { color: #059669; } .text-blue { color: #2563eb; } .text-amber { color: #d97706; } .text-purple { color: #7c3aed; }
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-header-actions { display: flex; gap: 8px; }
.select-modern-sm { padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.78rem; color: #374151; background: #fff; outline: none; cursor: pointer; }
.select-modern-sm:focus { border-color: #3b82f6; }
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e5e7eb; color: #6b7280; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; white-space: nowrap; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-amber { background: #fef3c7; color: #d97706; }
.action-buttons { display: flex; gap: 6px; }
.action-view-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view-sm:hover { background: #2563eb; }
.action-download-sm { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #10b981; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-download-sm:hover { background: #059669; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 720px; max-height: 92vh; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-xl { max-width: 1100px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; flex-wrap: wrap; gap: 10px; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body-scroll { overflow-y: auto; flex: 1; }
.pg-btn { padding: 9px 16px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover { border-color: #3b82f6; color: #2563eb; }
.pg-btn-accent-blue { background: #2563eb; color: #fff; border-color: #2563eb; }
.pg-btn-accent-blue:hover { background: #1d4ed8; color: #fff; }
.pg-btn-purple { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.pg-btn-purple:hover { background: #6d28d9; color: #fff; }
.pg-btn-dark { background: #1f2937; color: #fff; border-color: #1f2937; }
.pg-btn-dark:hover { background: #111827; color: #fff; }
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }
.error-banner { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; color: #dc2626; font-size: 0.85rem; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }
@media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
</style>