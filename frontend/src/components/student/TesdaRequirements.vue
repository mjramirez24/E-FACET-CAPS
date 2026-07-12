<template>
  <StudentLayoutTesda active-page="requirements">
    <!-- Header -->
    <template #header-left>
      <div class="header-actions">
        <div class="search-box">
          <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search requirements..."
            v-model="searchQuery"
            class="search-input-modern"
          />
        </div>
        <button @click="refreshRequirements" class="refresh-btn" title="Refresh">
          <svg class="refresh-icon" :class="{ 'spin-animation': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </template>

    <div class="requirements-wrapper">
      <div class="page-top">
        <h2 class="page-title">Document Requirements</h2>
        <p class="page-subtitle">Upload and manage your required training documents</p>
      </div>

      <!-- Main Grid -->
      <div class="requirements-grid">
        <!-- Requirements List -->
        <div class="requirements-left">
          <!-- Pending Requirements -->
          <div class="panel-card">
            <div class="panel-header-bar">
              <h3 class="panel-title">Pending Uploads</h3>
              <span class="panel-tag">{{ pendingRequirements.length }} pending</span>
            </div>
            <div class="panel-body-list">
              <div v-if="pendingRequirements.length === 0" class="empty-state-sm">
                <svg class="w-10 h-10 mx-auto mb-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-gray-500">All requirements submitted!</p>
              </div>
              <div v-for="req in pendingRequirements" :key="req.id" class="req-card req-card-pending">
                <div class="req-card-header">
                  <div>
                    <h4 class="req-card-title">{{ req.name }}</h4>
                    <p class="req-card-desc">{{ req.description }}</p>
                  </div>
                  <span class="pill pill-amber">Required</span>
                </div>
                <p class="req-card-meta">File types: PDF, JPG, PNG | Max size: 5MB</p>
              </div>
            </div>
          </div>

          <!-- Submitted Requirements -->
          <div class="panel-card">
            <div class="panel-header-bar">
              <h3 class="panel-title">Submitted Documents</h3>
              <span class="panel-tag">{{ submittedRequirements.length }} submitted</span>
            </div>
            <div class="panel-body-list">
              <div v-if="submittedRequirements.length === 0" class="empty-state-sm">
                <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p class="text-sm text-gray-500">No documents submitted yet</p>
              </div>
              <div v-for="req in submittedRequirements" :key="req.id" class="req-card req-card-submitted">
                <div class="req-card-header">
                  <div>
                    <h4 class="req-card-title">{{ req.name }}</h4>
                    <p class="req-card-desc">{{ req.description }}</p>
                  </div>
                  <span class="pill pill-green">Submitted</span>
                </div>
                <div class="req-card-file">
                  <div class="req-card-file-info">
                    <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span class="font-medium">{{ req.fileName }}</span>
                    <span class="text-gray-400">({{ req.fileSize }})</span>
                  </div>
                  <div class="req-card-file-actions">
                    <button class="action-link" @click="viewFile(req)">View</button>
                    <button class="action-link action-link-danger" @click="removeFile(req)">Remove</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Section -->
        <div class="upload-right">
          <div class="panel-card">
            <div class="panel-header-bar">
              <h3 class="panel-title">Upload Documents</h3>
            </div>
            <div class="panel-body">
              <!-- Drop Zone -->
              <label class="drop-zone">
                <input type="file" class="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" @change="onFilesPicked" />
                <svg class="w-10 h-10 mx-auto mb-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="font-semibold text-gray-700 mb-1">Drop files here</p>
                <p class="text-sm text-gray-500 mb-1">or click to browse</p>
                <p class="text-xs text-gray-400">Supports: PDF, JPG, PNG (Max 5MB each)</p>
              </label>

              <!-- Selected Files -->
              <div v-if="selectedFiles.length > 0" class="selected-files">
                <h5 class="text-sm font-semibold text-gray-700 mb-2">Selected Files ({{ selectedFiles.length }})</h5>
                <div v-for="(file, idx) in selectedFiles" :key="idx" class="selected-file-item">
                  <div class="selected-file-info">
                    <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div class="font-medium text-sm">{{ file.name }}</div>
                      <div class="text-xs text-gray-500">{{ formatBytes(file.size) }}</div>
                    </div>
                  </div>
                  <button type="button" class="btn-remove" @click="removeSelectedFile(idx)">Remove</button>
                </div>
              </div>

              <!-- Upload Progress -->
              <div class="upload-progress">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="text-sm font-semibold text-gray-700">Upload Progress</h4>
                  <span class="text-xs text-gray-500">{{ uploadedCount }} of {{ totalRequired }} documents</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
                </div>
                <div class="text-xs text-gray-500 mt-2 text-right">{{ progressPercent }}% complete</div>
              </div>

              <!-- Submit Button -->
              <button 
                class="btn-submit-upload"
                :disabled="selectedFiles.length === 0 || submitting"
                @click="submitDocuments"
              >
                {{ submitting ? 'Submitting...' : 'Submit All Documents' }}
              </button>
              <p v-if="uploadMsg" class="text-xs mt-2" :class="uploadMsg.includes('success') ? 'text-emerald' : 'text-red-500'">
                {{ uploadMsg }}
              </p>
            </div>
          </div>

          <!-- Instructions -->
          <div class="panel-card">
            <div class="panel-header-bar">
              <h3 class="panel-title">Upload Instructions</h3>
            </div>
            <div class="panel-body">
              <ul class="instructions-list">
                <li class="instructions-item">
                  <div class="instructions-dot"></div>
                  <span>Ensure all documents are clear and readable</span>
                </li>
                <li class="instructions-item">
                  <div class="instructions-dot"></div>
                  <span>File names should indicate the document type (e.g., "valid_id_passport.jpg")</span>
                </li>
                <li class="instructions-item">
                  <div class="instructions-dot"></div>
                  <span>Uploaded documents will be reviewed within 3-5 business days</span>
                </li>
                <li class="instructions-item">
                  <div class="instructions-dot"></div>
                  <span>You will receive a notification once documents are approved</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StudentLayoutTesda>
</template>

<script>
import StudentLayoutTesda from './StudentLayoutTesda.vue'

export default {
  name: 'TesdaRequirementsUpload',
  components: {
    StudentLayoutTesda
  },
  data() {
    return {
      searchQuery: '',
      loading: false,
      submitting: false,
      studentName: 'Student',
      uploadMsg: '',

      selectedFiles: [],

      pendingRequirements: [
        { id: 1, name: 'Valid ID', description: 'Government-issued ID (Passport, Driver\'s License, UMID, etc.)' },
        { id: 2, name: 'Birth Certificate', description: 'NSO/PSA authenticated birth certificate' },
      ],

      submittedRequirements: [
        { 
          id: 3, 
          name: 'Application Form', 
          description: 'Completed TESDA application form',
          fileName: 'application_form.pdf',
          fileSize: '2.4 MB'
        },
      ],
    }
  },

  computed: {
    totalRequired() {
      return this.pendingRequirements.length + this.submittedRequirements.length;
    },
    uploadedCount() {
      return this.submittedRequirements.length + this.selectedFiles.length;
    },
    progressPercent() {
      if (this.totalRequired === 0) return 0;
      return Math.round((this.uploadedCount / this.totalRequired) * 100);
    },
  },

  mounted() {
    this.loadUserData();
  },

  methods: {
    loadUserData() {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.studentName = user.name || user.username || 'Student';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    },

    getUserInitial() {
      return this.studentName.charAt(0).toUpperCase();
    },

    formatBytes(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    onFilesPicked(e) {
      const files = Array.from(e.target.files || []);
      const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png']);
      const filtered = files.filter(f => {
        if (!allowed.has(f.type)) return false;
        if (f.size > 5 * 1024 * 1024) return false;
        return true;
      });
      this.selectedFiles = [...this.selectedFiles, ...filtered];
      e.target.value = '';
    },

    removeSelectedFile(idx) {
      this.selectedFiles.splice(idx, 1);
    },

    viewFile(req) {
      if (req.fileUrl) {
        window.open(req.fileUrl, '_blank');
      }
    },

    removeFile(req) {
      const idx = this.submittedRequirements.findIndex(r => r.id === req.id);
      if (idx !== -1) {
        this.submittedRequirements.splice(idx, 1);
        this.pendingRequirements.push({
          id: req.id,
          name: req.name,
          description: req.description,
        });
        this.uploadMsg = 'success: File removed. You can upload again.';
        setTimeout(() => { this.uploadMsg = ''; }, 3000);
      }
    },

    submitDocuments() {
      if (this.selectedFiles.length === 0) return;
      this.submitting = true;
      this.uploadMsg = '';

      setTimeout(() => {
        this.selectedFiles.forEach(file => {
          const firstPending = this.pendingRequirements.shift();
          if (firstPending) {
            this.submittedRequirements.push({
              id: firstPending.id,
              name: firstPending.name,
              description: firstPending.description,
              fileName: file.name,
              fileSize: this.formatBytes(file.size),
            });
          }
        });
        this.selectedFiles = [];
        this.submitting = false;
        this.uploadMsg = 'success: All documents submitted successfully!';
        setTimeout(() => { this.uploadMsg = ''; }, 3000);
      }, 1500);
    },

    refreshRequirements() {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
      }, 1000);
    },
  }
}
</script>

<style scoped>
/* ===== GLOBAL WRAPPER ===== */
.requirements-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 20px; }

/* ===== HEADER ===== */
.header-actions { display: flex; align-items: center; gap: 12px; width: 100%; }
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #3b82f6; }
.refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #3b82f6; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn:hover { background: #2563eb; transform: translateY(-1px); }
.refresh-icon { width: 16px; height: 16px; }
.spin-animation { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== PAGE TOP ===== */
.page-top { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

/* ===== MAIN GRID ===== */
.requirements-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.requirements-left { display: flex; flex-direction: column; gap: 16px; }
.upload-right { display: flex; flex-direction: column; gap: 16px; }

/* ===== PANEL CARD ===== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 8px; }
.panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
.panel-tag { font-size: 0.72rem; padding: 4px 10px; background: #f3f4f6; border-radius: 8px; color: #6b7280; font-weight: 500; }
.panel-body { padding: 20px; }
.panel-body-list { padding: 12px; }

/* ===== EMPTY STATE ===== */
.empty-state-sm { text-align: center; padding: 24px; color: #9ca3af; }

/* ===== REQ CARDS ===== */
.req-card { padding: 16px; border-radius: 12px; border: 2px solid; margin-bottom: 8px; }
.req-card:last-child { margin-bottom: 0; }
.req-card-pending { border-color: #bfdbfe; background: #eff6ff; }
.req-card-submitted { border-color: #d1fae5; background: #f0fdf4; }
.req-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.req-card-title { font-weight: 600; color: #111827; font-size: 0.9rem; }
.req-card-desc { font-size: 0.8rem; color: #6b7280; margin-top: 4px; }
.req-card-meta { font-size: 0.72rem; color: #9ca3af; margin-top: 8px; }

.req-card-file { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #d1fae5; }
.req-card-file-info { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #374151; }
.req-card-file-actions { display: flex; gap: 10px; }
.action-link { font-size: 0.78rem; font-weight: 600; color: #2563eb; background: none; border: none; cursor: pointer; }
.action-link:hover { text-decoration: underline; }
.action-link-danger { color: #ef4444; }

/* ===== PILLS ===== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-amber { background: #fef3c7; color: #d97706; }

/* ===== DROP ZONE ===== */
.drop-zone { display: block; padding: 32px 16px; border: 2px dashed #bfdbfe; border-radius: 16px; text-align: center; background: #eff6ff; cursor: pointer; transition: all 0.2s; }
.drop-zone:hover { background: #dbeafe; border-color: #93c5fd; }

/* ===== SELECTED FILES ===== */
.selected-files { margin-top: 16px; }
.selected-file-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; margin-bottom: 6px; }
.selected-file-info { display: flex; align-items: center; gap: 8px; }
.btn-remove { font-size: 0.75rem; color: #ef4444; background: none; border: none; cursor: pointer; font-weight: 600; }

/* ===== UPLOAD PROGRESS ===== */
.upload-progress { margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 12px; }
.progress-bar { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: #3b82f6; border-radius: 4px; transition: width 0.5s ease; }

/* ===== SUBMIT BUTTON ===== */
.btn-submit-upload { width: 100%; margin-top: 16px; padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
.btn-submit-upload:hover:not(:disabled) { background: #1d4ed8; }
.btn-submit-upload:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }

/* ===== INSTRUCTIONS ===== */
.instructions-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.instructions-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; color: #374151; }
.instructions-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }

/* ===== UTILITY ===== */
.text-emerald { color: #059669; }
.text-red-500 { color: #ef4444; }
.hidden { display: none; }

@media (max-width: 1024px) {
  .requirements-grid { grid-template-columns: 1fr; }
}
</style>