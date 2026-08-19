<!-- src/components/AdminCertificates.vue -->
<template>
  <AdminLayout>
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search students/certificates..."
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div>
      <!-- Page Header -->
      <div class="page-header-row mb-5">
        <div class="flex justify-between items-center w-full flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div>
              <h2 class="page-title">Certificate Management</h2>
              <p class="page-subtitle">Generate, view, and manage student certificates</p>
            </div>
            <img
              v-if="drivingLogo"
              :src="drivingLogo"
              alt="Logo"
              class="header-logo-img"
              @error="onLogoError"
            />
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-group mb-5">
        <button
          @click="activeTab = 'driving'"
          :class="['tab-btn', activeTab === 'driving' ? 'tab-active-green' : 'tab-inactive']"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 11l2-4h10l2 4M3 16v-3a1 1 0 011-1h16a1 1 0 011 1v3" />
            <path d="M7 12h10l1 4H6l1-4z" />
            <circle cx="6" cy="17" r="2" fill="currentColor" />
            <circle cx="18" cy="17" r="2" fill="currentColor" />
          </svg>
          Driving Certificates
          <span class="tab-count">{{ drivingRows.length }}</span>
        </button>

        <button
          @click="activeTab = 'tesda'"
          :class="['tab-btn', activeTab === 'tesda' ? 'tab-active-blue' : 'tab-inactive']"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          TESDA Certificates
          <span class="tab-count">{{ tesdaRows.length }}</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="panel-card mb-5">
        <div class="panel-header-bar filters-bar">
          <div class="filter-field">
            <label class="filter-label">Course</label>
            <select v-model="selectedCourse" class="select-modern-sm" style="width: 220px;">
              <option value="">All Courses</option>
              <option v-for="c in courseOptionsForActiveTab" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="filter-field">
            <label class="filter-label">Status</label>
            <select v-model="selectedStatus" class="select-modern-sm">
              <option value="">All</option>
              <option value="issued">Issued</option>
              <option value="ready">Ready</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div class="filter-field">
            <label class="filter-label">Done Date</label>
            <input type="date" v-model="selectedDate" class="date-input-modern" />
          </div>

          <button @click="clearFilters" class="pg-btn">Clear</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stat-grid mb-5">
        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-green">{{ activeIssuedCount }}</span>
              <p class="stat-label">Issued</p>
            </div>
            <div class="stat-icon stat-icon-green">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-amber">{{ activeReadyCount }}</span>
              <p class="stat-label">Ready to Generate</p>
            </div>
            <div class="stat-icon stat-icon-amber">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-blue">{{ activeRowsFiltered.length }}</span>
              <p class="stat-label">Shown</p>
            </div>
            <div class="stat-icon stat-icon-blue">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-inner">
            <div>
              <span class="stat-value stat-value-red">{{ activeRevokedCount }}</span>
              <p class="stat-label">Revoked</p>
            </div>
            <div class="stat-icon stat-icon-red">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="panel-card">
        <div class="panel-header-bar">
          <span class="text-sm text-gray-600">
            Showing {{ activeRowsFiltered.length }} of {{ activeRowsBase.length }}
            <span class="font-semibold text-gray-700">({{ activeTab === "driving" ? "Driving" : "TESDA" }})</span>
          </span>

          <div class="filter-field" style="flex-direction: row; align-items: center; gap: 8px;">
            <label class="filter-label" style="margin: 0;">Sort by</label>
            <select v-model="sortBy" class="select-modern-sm">
              <option value="dateDesc">Most Recent</option>
              <option value="dateAsc">Oldest First</option>
              <option value="name">Student A-Z</option>
              <option value="course">Course</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p class="text-gray-500">Loading...</p>
        </div>

        <div v-else class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Track</th>
                <th>Done Date</th>
                <th>{{ activeTab === "driving" ? "Driving Cert Code" : "TESDA Cert Code" }}</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in activeRowsFiltered" :key="row.reservation_id">
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ getInitials(row.student_name) }}</div>
                    <div>
                      <p class="font-medium">{{ row.student_name }}</p>
                      <p class="text-xs text-gray-400">{{ row.student_email }}</p>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="font-medium">{{ row.course_name }}</span>
                  <p class="text-xs text-gray-400 mt-0.5">code: <span class="font-mono">{{ row.course_code || "—" }}</span></p>
                </td>

                <td>
                  <span class="track-tag" :class="normalizeTrack(row.track) === 'tesda' ? 'track-blue' : 'track-green'">
                    {{ (row.track || "—").toString().toUpperCase() }}
                  </span>
                </td>

                <td class="text-gray-500 text-sm">{{ row.done_at ? formatDate(row.done_at) : "—" }}</td>

                <td>
                  <code class="cert-code-badge">{{ getActiveCertCode(row) || "—" }}</code>
                </td>

                <td>
                  <span class="pill" :class="getStatusClass(getActiveStatus(row))">{{ formatStatus(getActiveStatus(row)) }}</span>
                </td>

                <td class="whitespace-nowrap">
                  <div class="action-btns">
                    <button
                      v-if="getActiveStatus(row) === 'ready'"
                      @click="activeTab === 'driving' ? openConfirm('generate-driving', row) : openConfirm('generate-tesda', row)"
                      class="action-generate"
                    >
                      + Generate
                    </button>

                    <button
                      v-if="activeTab === 'driving'"
                      @click="openDrivingPreview(row)"
                      class="action-edit"
                    >
                      Preview/Edit
                    </button>

                    <button
                      v-if="getActiveCertId(row)"
                      @click="viewActiveCertificate(row)"
                      class="action-view"
                    >
                      View
                    </button>

                    <button
                      v-if="activeTab === 'driving' && getActiveCertId(row)"
                      @click="downloadActiveCertificate(row)"
                      class="action-download"
                    >
                      Download
                    </button>

                    <button
                      v-if="getActiveStatus(row) === 'issued'"
                      @click="activeTab === 'driving' ? openConfirm('revoke-driving', row) : openConfirm('revoke-tesda', row)"
                      class="action-delete"
                    >
                      Revoke
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="activeRowsFiltered.length === 0">
                <td colspan="7" class="empty-cell">
                  <span class="text-3xl mb-2 block">🎓</span>
                  No results — try adjusting your filters
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <!-- DRIVING Modal -->
      <transition name="modal-fade">
        <div v-if="drivingModalOpen" class="modal-overlay" @click.self="closeModals">
          <transition name="modal-scale">
            <div class="modal-card modal-card-xl">
              <div class="modal-head modal-head-green">
                <div>
                  <h3 class="modal-title">Driving Certificate Preview — {{ isPDC(modalRow) ? "PDC" : "TDC" }}</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="modalRow && getActiveStatus(modalRow) === 'ready'"
                    @click="openConfirm('generate-driving', modalRow, draftToOverrides())"
                    class="pg-btn pg-btn-accent"
                  >
                    ✅ Generate from Preview
                  </button>
                  <button @click="printPreview('driving')" class="pg-btn pg-btn-dark">🖨️ Print</button>
                  <button class="modal-close-btn" @click="closeModals">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="modal-body-scroll">
                <!-- EDIT PANEL -->
                <div class="edit-panel">
                  <div class="flex flex-wrap items-start gap-6">
                    <div v-if="isPDC(modalRow)">
                      <div class="form-label" style="margin-bottom: 8px;">Mode (MT / AT)</div>
                      <div class="flex items-center gap-3">
                        <label class="radio-label">
                          <input type="radio" value="MT" v-model="draft.mode" @change="applyModeToDl()" />
                          MT
                        </label>
                        <label class="radio-label">
                          <input type="radio" value="AT" v-model="draft.mode" @change="applyModeToDl()" />
                          AT
                        </label>
                      </div>
                      <div class="text-xs text-gray-400 mt-1">* This DOES NOT print as text. It moves the checkmarks to MT/AT columns.</div>
                    </div>

                    <div v-if="isPDC(modalRow)" class="flex-1" style="min-width: 320px;">
                      <div class="form-label" style="margin-bottom: 8px;">DL Codes Checklist</div>
                      <div class="dl-grid">
                        <div class="dl-box">
                          <div class="dl-box-title">Left</div>
                          <div v-for="item in leftDlCodes" :key="'L-'+item.code" class="dl-row">
                            <div class="text-xs"><b>{{ item.code }}</b> <span class="text-gray-500">{{ item.desc }}</span></div>
                            <div class="flex items-center gap-4 text-xs">
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].mt" @change="syncModeFromDl()" />
                                MT
                              </label>
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].at" @change="syncModeFromDl()" />
                                AT
                              </label>
                            </div>
                          </div>
                        </div>

                        <div class="dl-box">
                          <div class="dl-box-title">Right</div>
                          <div v-for="item in rightDlCodes" :key="'R-'+item.code" class="dl-row">
                            <div class="text-xs"><b>{{ item.code }}</b> <span class="text-gray-500">{{ item.desc }}</span></div>
                            <div class="flex items-center gap-4 text-xs">
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].mt" @change="syncModeFromDl()" />
                                MT
                              </label>
                              <label class="check-label">
                                <input type="checkbox" v-model="draft.dl[item.code].at" @change="syncModeFromDl()" />
                                AT
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="text-xs text-gray-400 mt-2">* Kung AT ang mode, ililipat automatically yung checks to AT column (A/B based on course_code).</div>
                    </div>
                  </div>
                </div>

                <!-- PREVIEW (certificate template — left as-is) -->
                <div class="p-4">
                  <div
                    id="driving-preview"
                    class="relative w-full border border-gray-200 rounded-xl overflow-hidden bg-white"
                    style="aspect-ratio: 8.5 / 11"
                  >
                    <div class="absolute inset-0 p-8">
                      <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-14 h-14 rounded-full border border-gray-300 overflow-hidden bg-white flex items-center justify-center">
                            <img v-if="drivingLogo" :src="drivingLogo" class="w-full h-full object-contain" />
                            <div v-else class="text-[10px] text-gray-500">LOGO</div>
                          </div>
                          <div class="leading-tight">
                            <div class="text-xs text-gray-700">Republic of the Philippines</div>
                            <div class="text-sm font-extrabold text-gray-900">DEPARTMENT OF TRANSPORTATION</div>
                            <div class="text-sm font-extrabold text-gray-900">LAND TRANSPORTATION OFFICE</div>
                            <div class="text-xs text-gray-600">East Avenue, Quezon City</div>
                          </div>
                        </div>

                        <div class="w-28">
                          <div class="w-28 h-28 border border-gray-400 bg-gray-50 overflow-hidden rounded-md flex items-center justify-center">
                            <img v-if="modalRow?.picture_2x2" :src="modalRow.picture_2x2" alt="2x2" class="w-full h-full object-cover" />
                            <div v-else class="text-[10px] text-gray-500 text-center px-2">2x2 Photo<br />missing</div>
                          </div>
                          <div class="mt-1 text-[10px] text-gray-500 text-center">2x2</div>
                        </div>
                      </div>

                      <div class="mt-6 text-center">
                        <div class="text-xl font-extrabold text-gray-900">CERTIFICATE OF COMPLETION</div>
                        <div class="text-sm font-bold text-gray-800">
                          {{ isPDC(modalRow) ? "PRACTICAL DRIVING COURSE" : "THEORETICAL DRIVING COURSE" }}
                        </div>
                      </div>

                      <div v-if="isPDC(modalRow)" class="mt-6">
                        <div class="grid grid-cols-2 gap-6 text-[11px]">
                          <div class="border border-gray-300 rounded">
                            <div class="px-2 py-1 font-bold bg-gray-50 border-b border-gray-300">DL Code (Vehicle Category)</div>
                            <div class="p-2">
                              <div class="grid grid-cols-12 font-bold text-gray-700 mb-1">
                                <div class="col-span-8">DL Code</div>
                                <div class="col-span-2 text-center">MT</div>
                                <div class="col-span-2 text-center">AT</div>
                              </div>
                              <div v-for="item in leftDlCodes" :key="item.code" class="grid grid-cols-12 items-center border-t border-gray-200 py-1">
                                <div class="col-span-8">
                                  <span class="font-semibold">{{ item.code }}</span>
                                  <span class="text-gray-600 ml-2">{{ item.desc }}</span>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.mt ? "✓" : "" }}
                                  </div>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.at ? "✓" : "" }}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="border border-gray-300 rounded">
                            <div class="px-2 py-1 font-bold bg-gray-50 border-b border-gray-300">DL Code (Vehicle Category)</div>
                            <div class="p-2">
                              <div class="grid grid-cols-12 font-bold text-gray-700 mb-1">
                                <div class="col-span-8">DL Code</div>
                                <div class="col-span-2 text-center">MT</div>
                                <div class="col-span-2 text-center">AT</div>
                              </div>
                              <div v-for="item in rightDlCodes" :key="item.code" class="grid grid-cols-12 items-center border-t border-gray-200 py-1">
                                <div class="col-span-8">
                                  <span class="font-semibold">{{ item.code }}</span>
                                  <span class="text-gray-600 ml-2">{{ item.desc }}</span>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.mt ? "✓" : "" }}
                                  </div>
                                </div>
                                <div class="col-span-2 flex justify-center">
                                  <div class="w-4 h-4 border border-gray-400 flex items-center justify-center text-[10px]">
                                    {{ draft.dl[item.code]?.at ? "✓" : "" }}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="mt-3 text-[10px] text-gray-600">* Preview DL checklist only.</div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-4 text-sm text-gray-500"><b>Note:</b> MT/AT is via checkbox column only (no Transmission text).</div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- TESDA View Modal -->
      <transition name="modal-fade">
        <div v-if="tesdaModalOpen" class="modal-overlay" @click.self="closeModals">
          <transition name="modal-scale">
            <div class="modal-card modal-card-xl">
              <div class="modal-head modal-head-blue">
                <div>
                  <h3 class="modal-title">TESDA Certificate View</h3>
                  <p class="text-xs text-gray-500 mt-0.5">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="downloadVisibleCertificate('png')" class="pg-btn pg-btn-purple">⬇ PNG</button>
                  <button @click="downloadVisibleCertificate('pdf')" class="pg-btn pg-btn-accent-blue">⬇ PDF</button>
                  <button @click="printPreview('tesda')" class="pg-btn pg-btn-dark">🖨️ Print</button>
                  <button class="modal-close-btn" @click="closeModals">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="modal-body-scroll" style="background: #f3f4f6;">
                <div class="mx-auto w-full overflow-auto p-4">
                  <!-- Certificate template — left as-is -->
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
                      <div style="margin-top: 23px; font-size: 38px; line-height: 1.05; font-weight: 400;">{{ modalRow?.student_name || '—' }}</div>
                      <div style="margin-top: 18px; font-size: 17px; font-weight: 700; letter-spacing: .5px;">HAS COMPLETED THE COURSE</div>
                      <div style="margin-top: 18px; font-size: 34px; line-height: 1.12; font-weight: 400; max-width: 8.8in;">{{ modalRow?.course_name || '—' }}</div>
                      <div style="margin-top: 46px; font-size: 17px; font-weight: 500;">
                        <b>ON</b> {{ modalRow?.done_at ? formatDate(modalRow.done_at) : '—' }}
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
                      <div>{{ getActiveCertCode(modalRow) || 'TESDA-CODE' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </div>
  </AdminLayout>

  <!-- CONFIRM ACTION MODAL -->
      <transition name="modal-fade">
        <div v-if="confirmModalOpen" class="modal-overlay" @click.self="closeConfirm">
          <transition name="modal-scale">
            <div class="modal-card modal-card-sm">
              <div class="modal-head-delete">
                <div class="flex items-center gap-3">
                  <div
                    class="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                    :class="confirmActionType.startsWith('revoke') ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path v-if="confirmActionType.startsWith('revoke')" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">{{ confirmTitle }}</h3>
                    <p class="text-sm text-gray-500">Please confirm this action</p>
                  </div>
                </div>
              </div>
              <div class="modal-body-delete">
                <p class="text-sm text-gray-700 leading-relaxed">{{ confirmText }}</p>
                <div class="mt-6 flex justify-end gap-3">
                  <button @click="closeConfirm" :disabled="confirmLoading" class="btn-cancel">Cancel</button>
                  <button
                    @click="runConfirmedAction"
                    :disabled="confirmLoading"
                    class="btn-save"
                    :class="confirmActionType.startsWith('revoke') ? 'btn-red' : 'btn-green'"
                  >
                    {{ confirmLoading ? 'Processing...' : 'Confirm' }}
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- SUCCESS/ERROR MESSAGE MODAL -->
      <transition name="modal-fade">
        <div v-if="messageOpen" class="modal-overlay" @click.self="closeMessage">
          <transition name="modal-scale">
            <div class="modal-card modal-card-sm">
              <div class="modal-head-delete">
                <div class="flex items-center gap-3">
                  <div
                    class="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                    :class="messageType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'"
                  >
                    <svg v-if="messageType === 'success'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">{{ messageTitle }}</h3>
                  </div>
                </div>
              </div>
              <div class="modal-body-delete">
                <p class="text-sm text-gray-700 leading-relaxed">{{ messageText }}</p>
                <div class="mt-6 flex justify-end">
                  <button
                    @click="closeMessage"
                    class="btn-save"
                    :class="messageType === 'success' ? 'btn-green' : 'btn-red'"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import AdminLayout from "./AdminLayout.vue";
import { API_URL, API_BASE } from "../../config/api";

export default {
  name: "AdminCertificates",
  components: { AdminLayout },
  setup() {
    const api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });

    const normalizeTrack = (t) => String(t || "").trim().toLowerCase();

    const drivingLogo = ref(`${API_BASE}/assets/lto-logo.png`);
    const tesdaLogo = ref("/tesda-logo.png");
    const onLogoError = () => {
      drivingLogo.value = "";
      tesdaLogo.value = "";
    };

    const ENDPOINTS = {
      drivingGenerate: `${API_BASE}/api/admin/certificates/driving/generate`,
      tesdaGenerate: `${API_BASE}/api/admin/certificates/tesda/generate`,
      drivingRevoke: (id) => `${API_BASE}/api/admin/certificates/driving/${id}/revoke`,
      tesdaRevoke: (id) => `${API_BASE}/api/admin/certificates/tesda/${id}/revoke`,
      drivingView: (id) => `${API_BASE}/api/admin/certificates/driving/${id}/view`,
      tesdaView: (id) => `${API_BASE}/api/admin/certificates/tesda/${id}/view`,
      drivingDownload: (id) => `${API_BASE}/api/admin/certificates/driving/${id}/download`,
      tesdaDownload: (id) => `${API_BASE}/api/admin/certificates/tesda/${id}/download`,
    };

    const rows = ref([]);
    const certStats = ref({
      driving: { issued: 0, ready: 0, revoked: 0, total: 0 },
      tesda: { issued: 0, ready: 0, revoked: 0, total: 0 },
    });
    const loading = ref(true);
    const error = ref("");

    const activeTab = ref("driving");
    const searchQuery = ref("");
    const selectedCourse = ref("");
    const selectedStatus = ref("");
    const selectedDate = ref("");
    const sortBy = ref("dateDesc");

    const drivingModalOpen = ref(false);
    const tesdaModalOpen = ref(false);
    const modalRow = ref(null);
    // Confirm modal (replaces native confirm())
    const confirmModalOpen = ref(false);
    const confirmTitle = ref("");
    const confirmText = ref("");
    const confirmActionType = ref(""); // 'generate-driving' | 'generate-tesda' | 'revoke-driving' | 'revoke-tesda'
    const confirmRow = ref(null);
    const confirmOverrides = ref(null);
    const confirmLoading = ref(false);

    // Success/Error message modal
    const messageOpen = ref(false);
    const messageTitle = ref("");
    const messageText = ref("");
    const messageType = ref("success"); // 'success' | 'error'

    const showMessage = (title, text, type = "success") => {
      messageTitle.value = title;
      messageText.value = text;
      messageType.value = type;
      messageOpen.value = true;
    };

    const closeMessage = () => {
      messageOpen.value = false;
    };

    const leftDlCodes = ref([
      { code: "A", desc: "(L1,L2,L3)" },
      { code: "A1", desc: "(L4,L5,L6,L7)" },
      { code: "B", desc: "(M1)" },
      { code: "B1", desc: "(M2)" },
      { code: "B2", desc: "(N1)" },
    ]);
    const rightDlCodes = ref([
      { code: "BE", desc: "(O1,O2)" },
      { code: "C", desc: "(N2,N3)" },
      { code: "CE", desc: "(O3,O4)" },
      { code: "D", desc: "(M3)" },
    ]);

    const allDlCodes = computed(() => [...leftDlCodes.value, ...rightDlCodes.value].map((x) => x.code));

    const draft = ref({
      mode: "MT", // MT|AT
      dl: {},
    });

    const normalizeCourseCode = (v) => String(v || "").trim().toUpperCase();
    const isPDC = (row) => {
      const cc = normalizeCourseCode(row?.course_code);
      if (cc) return cc.includes("PDC");
      const name = String(row?.course_name || "").toUpperCase();
      return name.includes("PRACTICAL") || name.includes("PDC");
    };

    const parsePdcAB = (course_code = "", course_name = "") => {
      const s = String(course_code || "").toUpperCase();
      if (/\bAB\b/.test(s) || /PDC\s*[-(]?\s*AB/.test(s)) return "AB";
      if (/\bA\b/.test(s) || /PDC\s*[-(]?\s*A\b/.test(s)) return "A";
      if (/\bB\b/.test(s) || /PDC\s*[-(]?\s*B\b/.test(s)) return "B";
      const n = String(course_name || "").toUpperCase();
      if (n.includes("(AB)")) return "AB";
      if (n.includes("(A)")) return "A";
      if (n.includes("(B)")) return "B";
      return "";
    };

    const initDraftForRow = (row) => {
      draft.value = { mode: "MT", dl: {} };
      for (const code of allDlCodes.value) {
        draft.value.dl[code] = { mt: false, at: false };
      }

      // default tick based on course_code for A/B only (same as backend fallback)
      if (isPDC(row)) {
        const parsed = parsePdcAB(row?.course_code, row?.course_name);
        const shouldA = parsed === "A" || parsed === "AB";
        const shouldB = parsed === "B" || parsed === "AB";
        if (shouldA) draft.value.dl["A"].mt = true;
        if (shouldB) draft.value.dl["B"].mt = true;
      }
    };

    const applyModeToDl = () => {
      if (!modalRow.value || !isPDC(modalRow.value)) return;
      const parsed = parsePdcAB(modalRow.value?.course_code, modalRow.value?.course_name);
      const shouldA = parsed === "A" || parsed === "AB";
      const shouldB = parsed === "B" || parsed === "AB";

      // clear A/B only then set by mode
      if (shouldA) {
        draft.value.dl["A"].mt = false;
        draft.value.dl["A"].at = false;
        draft.value.dl["A"][draft.value.mode === "AT" ? "at" : "mt"] = true;
      }
      if (shouldB) {
        draft.value.dl["B"].mt = false;
        draft.value.dl["B"].at = false;
        draft.value.dl["B"][draft.value.mode === "AT" ? "at" : "mt"] = true;
      }
    };

    // if user manually changes checkboxes, try to infer mode
    const syncModeFromDl = () => {
      if (!modalRow.value || !isPDC(modalRow.value)) return;
      const aAt = !!draft.value.dl["A"]?.at;
      const bAt = !!draft.value.dl["B"]?.at;
      const aMt = !!draft.value.dl["A"]?.mt;
      const bMt = !!draft.value.dl["B"]?.mt;

      if ((aAt || bAt) && !(aMt || bMt)) draft.value.mode = "AT";
      if ((aMt || bMt) && !(aAt || bAt)) draft.value.mode = "MT";
    };

    const draftToOverrides = () => {
      // send only what backend needs
      const dl = {};
      for (const code of Object.keys(draft.value.dl || {})) {
        const v = draft.value.dl[code];
        if (v?.mt || v?.at) dl[code] = { mt: !!v.mt, at: !!v.at };
      }
      return { mode: draft.value.mode, dl };
    };

    const drivingRows = computed(() => rows.value.filter((r) => normalizeTrack(r.track) !== "tesda"));
    const tesdaRows = computed(() => rows.value.filter((r) => normalizeTrack(r.track) === "tesda"));

    const activeRowsBase = computed(() => (activeTab.value === "driving" ? drivingRows.value : tesdaRows.value));

    const courseOptionsForActiveTab = computed(() => {
      const set = new Set(activeRowsBase.value.map((r) => r.course_name).filter(Boolean));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });

    const getActiveStatus = (row) => {
      if (!row) return "";
      if (activeTab.value === "driving") return row.driving_status || row.ui_status || "";
      return row.tesda_status || row.ui_status || "";
    };

    const getActiveCertCode = (row) => {
      if (!row) return "";
      if (activeTab.value === "driving") return row.driving_certificate_code || row.certificate_code || "";
      return row.tesda_certificate_code || row.certificate_code || "";
    };

    const getActiveCertId = (row) => {
      if (!row) return null;
      if (activeTab.value === "driving") return row.driving_certificate_id || row.certificate_id || null;
      return row.tesda_certificate_id || row.certificate_id || null;
    };

    const getCertificateViewUrl = (row, type = activeTab.value) => {
      if (!row) return "";
      const certId =
        type === "tesda"
          ? row.tesda_certificate_id || row.certificate_id || null
          : row.driving_certificate_id || row.certificate_id || null;

      if (!certId) return "";
      return type === "tesda" ? ENDPOINTS.tesdaView(certId) : ENDPOINTS.drivingView(certId);
    };

    const hasGeneratedCertificate = (row, type = activeTab.value) => !!getCertificateViewUrl(row, type);

    const activeRowsFiltered = computed(() => {
      let result = [...activeRowsBase.value];

      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter((r) => {
          const name = (r.student_name || "").toLowerCase();
          const email = (r.student_email || "").toLowerCase();
          const course = (r.course_name || "").toLowerCase();
          const code = (getActiveCertCode(r) || "").toLowerCase();
          const track = (r.track || "").toLowerCase();
          const courseCode = (r.course_code || "").toLowerCase();
          return name.includes(q) || email.includes(q) || course.includes(q) || code.includes(q) || track.includes(q) || courseCode.includes(q);
        });
      }

      if (selectedCourse.value) result = result.filter((r) => r.course_name === selectedCourse.value);
      if (selectedStatus.value) result = result.filter((r) => getActiveStatus(r) === selectedStatus.value);
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
            return (getActiveStatus(a) || "").localeCompare(getActiveStatus(b) || "");
          default:
            return 0;
        }
      });

      return result;
    });

    const activeIssuedCount = computed(() => certStats.value[activeTab.value]?.issued || 0);
    const activeRevokedCount = computed(() => certStats.value[activeTab.value]?.revoked || 0);
    const activeReadyCount = computed(() => certStats.value[activeTab.value]?.ready || 0);

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
          return "bg-green-100 text-green-800";
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
        const res = await api.get(`/admin/certificates/completions`);
        rows.value = res.data.data || [];
        certStats.value = res.data.stats || {
          driving: { issued: 0, ready: 0, revoked: 0, total: 0 },
          tesda: { issued: 0, ready: 0, revoked: 0, total: 0 },
        };
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to load.";
      } finally {
        loading.value = false;
      }
    };

    const viewActiveCertificate = (row) => {
      if (activeTab.value === "tesda") {
        openTesdaPreview(row);
        return;
      }

      const certId = getActiveCertId(row);
      if (!certId) return;
      window.open(ENDPOINTS.drivingView(certId), "_blank");
    };

    const downloadActiveCertificate = (row) => {
      const certId = getActiveCertId(row);
      if (!certId) return;

      if (activeTab.value === "tesda") {
        openTesdaPreview(row);
        return;
      }

      window.open(ENDPOINTS.drivingDownload(certId), "_blank");
    };

    const getVisibleCertificateElement = () => {
      const elId = activeTab.value === "driving" ? "driving-preview" : "tesda-preview";
      return document.getElementById(elId);
    };

    const getDownloadFileName = (format) => {
      const code = getActiveCertCode(modalRow.value) || `${activeTab.value}-certificate`;
      return `${String(code).replace(/[^a-z0-9_-]/gi, "_")}.${format}`;
    };

    const downloadVisibleCertificate = async (format = "png") => {
      error.value = "";
      await nextTick();

      const target = getVisibleCertificateElement();
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

        const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
        const pdf = new jsPDF({
          orientation,
          unit: "in",
          format: orientation === "landscape" ? [11, 8.5] : [8.5, 11],
        });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
        pdf.save(getDownloadFileName("pdf"));
      } catch (e) {
        console.error("downloadVisibleCertificate error:", e);
        error.value = e?.message || "Failed to download visible certificate.";
      }
    };

    const openDrivingPreview = (row) => {
      modalRow.value = row;
      initDraftForRow(row);
      drivingModalOpen.value = true;
      tesdaModalOpen.value = false;
    };

    const openTesdaPreview = (row) => {
      modalRow.value = row;
      tesdaModalOpen.value = true;
      drivingModalOpen.value = false;
    };

    const closeModals = () => {
      drivingModalOpen.value = false;
      tesdaModalOpen.value = false;
      modalRow.value = null;
      draft.value = { mode: "MT", dl: {} };
    };

    const openConfirm = (type, row, overrides = null) => {
      confirmActionType.value = type;
      confirmRow.value = row;
      confirmOverrides.value = overrides;

      const name = row?.student_name || "this student";
      const course = row?.course_name || "";

      if (type === "generate-driving") {
        confirmTitle.value = "Generate Driving Certificate";
        confirmText.value = `Generate DRIVING certificate for ${name} (${course})?`;
      } else if (type === "generate-tesda") {
        confirmTitle.value = "Generate TESDA Certificate";
        confirmText.value = `Generate TESDA certificate for ${name} (${course})?`;
      } else if (type === "revoke-driving") {
        confirmTitle.value = "Revoke Driving Certificate";
        confirmText.value = `Revoke DRIVING certificate ${getActiveCertCode(row) || ""}? This cannot be undone.`;
      } else if (type === "revoke-tesda") {
        confirmTitle.value = "Revoke TESDA Certificate";
        confirmText.value = `Revoke TESDA certificate ${getActiveCertCode(row) || ""}? This cannot be undone.`;
      }

      confirmModalOpen.value = true;
    };

    const closeConfirm = () => {
      if (confirmLoading.value) return;
      confirmModalOpen.value = false;
      confirmActionType.value = "";
      confirmRow.value = null;
      confirmOverrides.value = null;
    };

    const runConfirmedAction = async () => {
      const type = confirmActionType.value;
      const row = confirmRow.value;
      const overrides = confirmOverrides.value;
      if (!row || !type) return;

      confirmLoading.value = true;
      error.value = "";

      try {
        if (type === "generate-driving") {
          const payload = { reservation_id: row.reservation_id };
          if (overrides) payload.overrides = overrides;
          await api.post(`/admin/certificates/driving/generate`, payload);
          await fetchRows();
          closeModals();
          showMessage("Certificate Generated", `Driving certificate for ${row.student_name} was generated successfully.`, "success");
        } else if (type === "generate-tesda") {
          await api.post(`/admin/certificates/tesda/generate`, { reservation_id: row.reservation_id });
          await fetchRows();
          closeModals();
          showMessage("Certificate Generated", `TESDA certificate for ${row.student_name} was generated successfully.`, "success");
        } else if (type === "revoke-driving") {
          const certId = getActiveCertId(row);
          if (!certId) throw new Error("No Driving certificate id found.");
          await api.patch(`/admin/certificates/driving/${certId}/revoke`, {});
          await fetchRows();
          showMessage("Certificate Revoked", `Driving certificate for ${row.student_name} was revoked.`, "success");
        } else if (type === "revoke-tesda") {
          const certId = getActiveCertId(row);
          if (!certId) throw new Error("No TESDA certificate id found.");
          await api.patch(`/admin/certificates/tesda/${certId}/revoke`, {});
          await fetchRows();
          showMessage("Certificate Revoked", `TESDA certificate for ${row.student_name} was revoked.`, "success");
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e.message || "Something went wrong.";
        error.value = msg;
        showMessage("Action Failed", msg, "error");
      } finally {
        confirmLoading.value = false;
        closeConfirm();
      }
    };

    const getHeadStylesHtml = () => {
      const nodes = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
      return nodes.map((n) => n.outerHTML).join("\n");
    };

    const printPreview = (type) => {
      const elId = type === "driving" ? "driving-preview" : "tesda-preview";
      const target = document.getElementById(elId);
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
            <title>Print Certificate</title>
            ${styles}
            <style>
              * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              html, body { width: 11in; height: 8.5in; margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; overflow: hidden; }
              @page { size: letter landscape; margin: 0; }
              .wrap { width: 11in; height: 8.5in; margin: 0; padding: 0; overflow: hidden; background: #fff; }
              #tesda-preview { width: 11in !important; height: 8.5in !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; transform: none !important; }
              #driving-preview { margin: 0 !important; box-shadow: none !important; }
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

    onMounted(fetchRows);

    return {
      API_BASE,
      ENDPOINTS,
      drivingLogo,
      tesdaLogo,
      onLogoError,

      rows,
      certStats, 
      loading,
      error,

      activeTab,
      searchQuery,
      selectedCourse,
      selectedStatus,
      selectedDate,
      sortBy,

      normalizeTrack,
      drivingRows,
      tesdaRows,
      activeRowsBase,
      activeRowsFiltered,
      courseOptionsForActiveTab,

      activeIssuedCount,
      activeReadyCount,
      activeRevokedCount,

      getInitials,
      formatDate,
      getStatusClass,
      formatStatus,

      getActiveStatus,
      getActiveCertCode,
      getActiveCertId,
      getCertificateViewUrl,
      hasGeneratedCertificate,

      isPDC,
      leftDlCodes,
      rightDlCodes,

      draft,
      applyModeToDl,
      syncModeFromDl,
      draftToOverrides,

      fetchRows,
      clearFilters,
      viewActiveCertificate,
      downloadActiveCertificate,
      downloadVisibleCertificate,

      drivingModalOpen,
      tesdaModalOpen,
      modalRow,
      openDrivingPreview,
      openTesdaPreview,
      closeModals,
      printPreview,
      confirmModalOpen, confirmTitle, confirmText, confirmLoading, confirmActionType,
      openConfirm, closeConfirm, runConfirmedAction,
      messageOpen, messageTitle, messageText, messageType, showMessage, closeMessage,
    };
  },
};

</script>

<style scoped>
/* ========== PAGE HEADER ========== */
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }
.header-logo-img { height: 40px; width: auto; object-fit: contain; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* ========== TABS ========== */
.tab-group { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.2s; background: #fff; color: #6b7280; }
.tab-inactive:hover { border-color: #d1d5db; color: #374151; }
.tab-active-green { background: #10b981; color: #fff; border-color: #10b981; }
.tab-active-blue { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.tab-count { background: rgba(255,255,255,0.25); padding: 1px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
.tab-inactive .tab-count { background: #f3f4f6; color: #6b7280; }

/* ========== REFRESH BUTTON ========== */
.refresh-btn-modern { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.refresh-btn-modern:hover { background: #059669; transform: translateY(-1px); }

/* ========== PANEL / FILTERS ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.filters-bar { align-items: flex-end; gap: 14px; }
.filter-field { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }

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
.pg-btn:hover { border-color: #10b981; color: #059669; }
.pg-btn-accent { background: #10b981; color: #fff; border-color: #10b981; }
.pg-btn-accent:hover { background: #059669; color: #fff; }
.pg-btn-accent-blue { background: #2563eb; color: #fff; border-color: #2563eb; }
.pg-btn-accent-blue:hover { background: #1d4ed8; color: #fff; }
.pg-btn-purple { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.pg-btn-purple:hover { background: #6d28d9; color: #fff; }
.pg-btn-dark { background: #1f2937; color: #fff; border-color: #1f2937; }
.pg-btn-dark:hover { background: #111827; color: #fff; }

/* ========== STATS ========== */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-value { font-size: 1.75rem; font-weight: 700; line-height: 1; display: block; }
.stat-value-green { color: #059669; }
.stat-value-amber { color: #d97706; }
.stat-value-blue { color: #2563eb; }
.stat-value-red { color: #dc2626; }
.stat-label { font-size: 0.82rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-red { background: #fee2e2; color: #dc2626; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 40px !important; }
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }

/* ========== USER CELL ========== */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: #d1fae5; color: #047857; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }

/* ========== PILLS / TAGS ========== */
.pill { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
.track-tag { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
.track-green { background: #d1fae5; color: #059669; }
.track-blue { background: #dbeafe; color: #2563eb; }
.cert-code-badge { font-size: 0.72rem; background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-family: monospace; color: #374151; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.action-generate, .action-edit, .action-view, .action-download, .action-delete {
  padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; color: #fff;
}
.action-generate { background: #059669; }
.action-generate:hover { background: #047857; }
.action-edit { background: #3b82f6; }
.action-edit:hover { background: #2563eb; }
.action-view { background: #6366f1; }
.action-view:hover { background: #4f46e5; }
.action-download { background: #7c3aed; }
.action-download:hover { background: #6d28d9; }
.action-delete { background: #ef4444; }
.action-delete:hover { background: #dc2626; }

/* ========== ERROR TEXT ========== */
.error-text { margin-top: 16px; font-size: 0.85rem; color: #dc2626; }

/* ========== MODAL ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 720px; max-height: 92vh; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-xl { max-width: 1100px; }
/* ========== CONFIRM & MESSAGE MODALS ========== */
.modal-card-sm { max-width: 420px; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.btn-red { background: #ef4444; }
.btn-red:hover:not(:disabled) { background: #dc2626; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; flex-wrap: wrap; gap: 10px; }
.modal-head-green { background: #f0fdf4; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body-scroll { overflow-y: auto; flex: 1; }

/* ========== EDIT PANEL ========== */
.edit-panel { padding: 16px 20px; background: #f9fafb; border-bottom: 1px solid #f3f4f6; }
.form-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; }
.radio-label, .check-label { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #374151; cursor: pointer; }
.radio-label input, .check-label input { accent-color: #10b981; width: 15px; height: 15px; }

.dl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 640px) { .dl-grid { grid-template-columns: 1fr; } }
.dl-box { border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; padding: 12px; }
.dl-box-title { font-size: 0.7rem; font-weight: 700; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; }
.dl-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
.dl-row:last-child { border-bottom: none; }

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .stat-grid { grid-template-columns: 1fr; }
}
</style>