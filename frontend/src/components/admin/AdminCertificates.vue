<!-- src/components/AdminCertificates.vue -->
<template>
  <AdminLayout>
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
          <h2 class="text-lg font-bold text-green-800">🎓 Certificate Management</h2>

          <img
            v-if="drivingLogo"
            :src="drivingLogo"
            alt="Logo"
            class="h-10 w-auto object-contain"
            @error="onLogoError"
          />
        </div>

        <button
          @click="fetchRows"
          class="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm"
        >
          🔄 Refresh
        </button>
      </div>

      <!-- Tabs -->
      <div class="mb-6 flex flex-wrap gap-2">
        <button
          @click="activeTab = 'driving'"
          class="px-4 py-2 rounded-md text-sm font-semibold border"
          :class="
            activeTab === 'driving'
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          "
        >
          🚗 Driving Certificates
          <span class="ml-2 text-xs font-bold opacity-90">({{ drivingRows.length }})</span>
        </button>

        <button
          @click="activeTab = 'tesda'"
          class="px-4 py-2 rounded-md text-sm font-semibold border"
          :class="
            activeTab === 'tesda'
              ? 'bg-green-700 text-white border-green-700'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          "
        >
          🏛️ TESDA Certificates
          <span class="ml-2 text-xs font-bold opacity-90">({{ tesdaRows.length }})</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
          <select
            v-model="selectedCourse"
            class="w-56 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">All Courses</option>
            <option v-for="c in courseOptionsForActiveTab" :key="c" :value="c">
              {{ c }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            v-model="selectedStatus"
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
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
            class="w-44 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
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
        <div class="bg-green-50 p-5 rounded-lg border border-green-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-green-800">{{ activeIssuedCount }}</h3>
              <p class="text-green-700 font-medium mt-1">Issued</p>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span class="text-xl">✅</span>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-5 rounded-lg border border-yellow-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-yellow-800">{{ activeReadyCount }}</h3>
              <p class="text-yellow-700 font-medium mt-1">Ready to Generate</p>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <span class="text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 p-5 rounded-lg border border-blue-100">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-bold text-blue-800">{{ activeRowsFiltered.length }}</h3>
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
              <h3 class="text-2xl font-bold text-red-800">{{ activeRevokedCount }}</h3>
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
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        <p class="mt-3 text-gray-600">Loading...</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-4 border-b border-gray-200 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            Showing {{ activeRowsFiltered.length }} of {{ activeRowsBase.length }}
            <span class="ml-2 font-semibold text-gray-700">
              ({{ activeTab === "driving" ? "Driving" : "TESDA" }})
            </span>
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
          <thead class="bg-green-800 text-white">
            <tr>
              <th class="py-3 px-4 text-left font-medium">Student</th>
              <th class="py-3 px-4 text-left font-medium">Course</th>
              <th class="py-3 px-4 text-left font-medium">Track</th>
              <th class="py-3 px-4 text-left font-medium">Done Date</th>
              <th class="py-3 px-4 text-left font-medium">
                {{ activeTab === "driving" ? "Driving Cert Code" : "TESDA Cert Code" }}
              </th>
              <th class="py-3 px-4 text-left font-medium">Status</th>
              <th class="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in activeRowsFiltered"
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

              <td class="py-3 px-4">
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="normalizeTrack(row.track) === 'tesda' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ (row.track || "—").toString().toUpperCase() }}
                </span>
              </td>

              <td class="py-3 px-4 text-gray-600">
                {{ row.done_at ? formatDate(row.done_at) : "—" }}
              </td>

              <td class="py-3 px-4">
                <code class="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {{ getActiveCertCode(row) || "—" }}
                </code>
              </td>

              <td class="py-3 px-4">
                <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getStatusClass(getActiveStatus(row))">
                  {{ formatStatus(getActiveStatus(row)) }}
                </span>
              </td>

              <td class="py-3 px-4">
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-if="getActiveStatus(row) === 'ready'"
                    @click="activeTab === 'driving' ? generateDriving(row) : generateTesda(row)"
                    class="text-green-700 hover:text-green-900 text-sm font-medium px-2 py-1 hover:bg-green-50 rounded"
                  >
                    ➕ Generate {{ activeTab === "driving" ? "Driving" : "TESDA" }}
                  </button>

                  <button
                    v-if="activeTab === 'driving'"
                    @click="openDrivingPreview(row)"
                    class="text-gray-700 hover:text-gray-900 text-sm font-medium px-2 py-1 hover:bg-gray-100 rounded"
                  >
                    👁️ Preview / Edit
                  </button>

                  <button
                    v-if="getActiveCertId(row)"
                    @click="viewActiveCertificate(row)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    👁️ View
                  </button>

                  <button
                    v-if="activeTab === 'driving' && getActiveCertId(row)"
                    @click="downloadActiveCertificate(row)"
                    class="text-purple-600 hover:text-purple-800 text-sm font-medium px-2 py-1 hover:bg-purple-50 rounded"
                  >
                    Download
                  </button>

                  <button
                    v-if="getActiveStatus(row) === 'issued'"
                    @click="activeTab === 'driving' ? revokeDriving(row) : revokeTesda(row)"
                    class="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 hover:bg-red-50 rounded"
                  >
                    Revoke
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="activeRowsFiltered.length === 0">
              <td colspan="7" class="py-8 text-center text-gray-500">
                <div class="text-gray-400">
                  <span class="text-3xl mb-2 block">🎓</span>
                  <p class="text-gray-500">No results</p>
                  <p class="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>

      <!-- DRIVING Modal -->
      <div
        v-if="drivingModalOpen"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="closeModals"
      >
        <!-- ✅ scrollable modal container -->
        <div class="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
          <div class="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900">
                Driving Certificate Preview — {{ isPDC(modalRow) ? "PDC" : "TDC" }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ modalRow?.student_name }} — {{ modalRow?.course_name }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="modalRow && getActiveStatus(modalRow) === 'ready'"
                @click="generateDriving(modalRow, draftToOverrides())"
                class="px-3 py-2 text-sm rounded-md bg-green-700 text-white hover:bg-green-800"
              >
                ✅ Generate from Preview
              </button>
              <button
                @click="printPreview('driving')"
                class="px-3 py-2 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-900"
              >
                🖨️ Print
              </button>
              <button
                @click="closeModals"
                class="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >
                ✖ Close
              </button>
            </div>
          </div>

          <!-- ✅ scroll body -->
          <div class="overflow-y-auto">
            <!-- EDIT PANEL -->
            <div class="p-4 border-b border-gray-100 bg-gray-50">
              <div class="flex flex-wrap items-start gap-6">
                <div v-if="isPDC(modalRow)">
                  <div class="text-sm font-semibold text-gray-800 mb-1">Mode (MT / AT)</div>
                  <div class="flex items-center gap-3">
                    <label class="flex items-center gap-2 text-sm">
                      <input type="radio" value="MT" v-model="draft.mode" @change="applyModeToDl()" />
                      MT
                    </label>
                    <label class="flex items-center gap-2 text-sm">
                      <input type="radio" value="AT" v-model="draft.mode" @change="applyModeToDl()" />
                      AT
                    </label>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    * This DOES NOT print as text. It moves the checkmarks to MT/AT columns.
                  </div>
                </div>

                <div v-if="isPDC(modalRow)" class="flex-1 min-w-[320px]">
                  <div class="text-sm font-semibold text-gray-800 mb-1">DL Codes Checklist</div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="border rounded bg-white p-3">
                      <div class="text-xs font-bold text-gray-700 mb-2">Left</div>
                      <div
                        v-for="item in leftDlCodes"
                        :key="'L-'+item.code"
                        class="flex items-center justify-between py-1 border-b last:border-b-0"
                      >
                        <div class="text-xs">
                          <b>{{ item.code }}</b> <span class="text-gray-500">{{ item.desc }}</span>
                        </div>
                        <div class="flex items-center gap-4 text-xs">
                          <label class="flex items-center gap-1">
                            <input type="checkbox" v-model="draft.dl[item.code].mt" @change="syncModeFromDl()" />
                            MT
                          </label>
                          <label class="flex items-center gap-1">
                            <input type="checkbox" v-model="draft.dl[item.code].at" @change="syncModeFromDl()" />
                            AT
                          </label>
                        </div>
                      </div>
                    </div>

                    <div class="border rounded bg-white p-3">
                      <div class="text-xs font-bold text-gray-700 mb-2">Right</div>
                      <div
                        v-for="item in rightDlCodes"
                        :key="'R-'+item.code"
                        class="flex items-center justify-between py-1 border-b last:border-b-0"
                      >
                        <div class="text-xs">
                          <b>{{ item.code }}</b> <span class="text-gray-500">{{ item.desc }}</span>
                        </div>
                        <div class="flex items-center gap-4 text-xs">
                          <label class="flex items-center gap-1">
                            <input type="checkbox" v-model="draft.dl[item.code].mt" @change="syncModeFromDl()" />
                            MT
                          </label>
                          <label class="flex items-center gap-1">
                            <input type="checkbox" v-model="draft.dl[item.code].at" @change="syncModeFromDl()" />
                            AT
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="text-xs text-gray-500 mt-2">
                    * Kung AT ang mode, ililipat automatically yung checks to AT column (A/B based on course_code).
                  </div>
                </div>
              </div>
            </div>

            <!-- PREVIEW -->
            <div class="p-4">
              <!-- Preview/Edit design is always used here, even for issued certificates. -->
              <div
                id="driving-preview"
                class="relative w-full border border-gray-200 rounded-xl overflow-hidden bg-white"
                style="aspect-ratio: 8.5 / 11"
              >
                <div class="absolute inset-0 p-8">
                  <!-- Header -->
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-14 h-14 rounded-full border border-gray-300 overflow-hidden bg-white flex items-center justify-center"
                      >
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

                    <!-- 2x2 -->
                    <div class="w-28">
                      <div
                        class="w-28 h-28 border border-gray-400 bg-gray-50 overflow-hidden rounded-md flex items-center justify-center"
                      >
                        <img
                          v-if="modalRow?.picture_2x2"
                          :src="modalRow.picture_2x2"
                          alt="2x2"
                          class="w-full h-full object-cover"
                        />
                        <div v-else class="text-[10px] text-gray-500 text-center px-2">
                          2x2 Photo<br />missing
                        </div>
                      </div>
                      <div class="mt-1 text-[10px] text-gray-500 text-center">2x2</div>
                    </div>
                  </div>

                  <!-- Title -->
                  <div class="mt-6 text-center">
                    <div class="text-xl font-extrabold text-gray-900">CERTIFICATE OF COMPLETION</div>
                    <div class="text-sm font-bold text-gray-800">
                      {{ isPDC(modalRow) ? "PRACTICAL DRIVING COURSE" : "THEORETICAL DRIVING COURSE" }}
                    </div>
                  </div>

                  <!-- PDC DL Codes preview (uses draft.dl checks) -->
                  <div v-if="isPDC(modalRow)" class="mt-6">
                    <div class="grid grid-cols-2 gap-6 text-[11px]">
                      <div class="border border-gray-300 rounded">
                        <div class="px-2 py-1 font-bold bg-gray-50 border-b border-gray-300">
                          DL Code (Vehicle Category)
                        </div>
                        <div class="p-2">
                          <div class="grid grid-cols-12 font-bold text-gray-700 mb-1">
                            <div class="col-span-8">DL Code</div>
                            <div class="col-span-2 text-center">MT</div>
                            <div class="col-span-2 text-center">AT</div>
                          </div>

                          <div
                            v-for="item in leftDlCodes"
                            :key="item.code"
                            class="grid grid-cols-12 items-center border-t border-gray-200 py-1"
                          >
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
                        <div class="px-2 py-1 font-bold bg-gray-50 border-b border-gray-300">
                          DL Code (Vehicle Category)
                        </div>
                        <div class="p-2">
                          <div class="grid grid-cols-12 font-bold text-gray-700 mb-1">
                            <div class="col-span-8">DL Code</div>
                            <div class="col-span-2 text-center">MT</div>
                            <div class="col-span-2 text-center">AT</div>
                          </div>

                          <div
                            v-for="item in rightDlCodes"
                            :key="item.code"
                            class="grid grid-cols-12 items-center border-t border-gray-200 py-1"
                          >
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

                    <div class="mt-3 text-[10px] text-gray-600">
                      * Preview DL checklist only.
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 text-sm text-gray-600">
                <b>Note:</b> MT/AT is via checkbox column only (no Transmission text).
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TESDA View Modal -->
      <div
        v-if="tesdaModalOpen"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="closeModals"
      >
        <div class="bg-white w-full max-w-7xl rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
          <div class="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900">TESDA Certificate View</h3>
              <p class="text-sm text-gray-600">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="downloadVisibleCertificate('png')"
                class="px-3 py-2 text-sm rounded-md bg-purple-700 text-white hover:bg-purple-800"
              >
                ⬇ PNG
              </button>
              <button
                @click="downloadVisibleCertificate('pdf')"
                class="px-3 py-2 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800"
              >
                ⬇ PDF
              </button>
              <button
                @click="printPreview('tesda')"
                class="px-3 py-2 text-sm rounded-md bg-gray-800 text-white hover:bg-gray-900"
              >
                🖨️ Print
              </button>
              <button
                @click="closeModals"
                class="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
              >
                ✖ Close
              </button>
            </div>
          </div>

          <div class="overflow-y-auto bg-gray-100 p-4">
            <div class="mx-auto w-full overflow-auto">
              <!-- View design is always used here. -->
              <div
                id="tesda-preview"
                class="relative bg-white overflow-hidden text-[#111827] shadow-sm"
                style="width: 11in; height: 8.5in; font-family: Arial, Helvetica, sans-serif;"
              >
                <!-- faint TESDA watermark -->
                <img
                  src="/tesda-logo.png"
                  alt="TESDA Watermark"
                  class="absolute pointer-events-none select-none"
                  style="left: 1.15in; top: 1.55in; width: 5.2in; height: 5.2in; object-fit: contain; opacity: 0.055;"
                />

                <!-- Header -->
                <div class="absolute" style="left: .32in; top: .20in; width: 1.05in; height: 1.05in;">
                  <img src="/tesda-logo.png" alt="TESDA Logo" style="width: 100%; height: 100%; object-fit: contain;" />
                </div>

                <div class="absolute leading-tight" style="left: 1.55in; top: .22in; width: 8.9in;">
                  <div style="font-size: 22px; font-weight: 500; letter-spacing: .2px;">TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY</div>
                  <div style="font-size: 13.5px; margin-top: 4px; font-weight: 500;">NATIONAL INSTITUTE FOR TECHNICAL EDUCATION AND SKILLS DEVELOPMENT (NITESD)</div>
                  <div style="font-size: 13.5px; margin-top: 2px; font-weight: 500;">EAST SERVICE ROAD, SOUTH LUZON EXPRESSWAY (SLEX), FORT BONIFACIO, TAGUIG CITY</div>
                  <div style="height: 9px; background: #003cff; width: 7.9in; margin-top: 8px;"></div>
                </div>

                <!-- Body like sample -->
                <div class="absolute" style="left: 1.55in; top: 1.55in; width: 8.7in; text-align: left;">
                  <div style="font-size: 41px; line-height: 1; font-weight: 900; letter-spacing: 2px;">CERTIFICATE OF COMPLETION</div>

                  <div style="margin-top: 31px; font-size: 17px; font-weight: 700; letter-spacing: .5px;">THIS IS TO CERTIFY THAT</div>

                  <div style="margin-top: 23px; font-size: 38px; line-height: 1.05; font-weight: 400;">
                    {{ modalRow?.student_name || '—' }}
                  </div>

                  <div style="margin-top: 18px; font-size: 17px; font-weight: 700; letter-spacing: .5px;">HAS COMPLETED THE COURSE</div>

                  <div style="margin-top: 18px; font-size: 34px; line-height: 1.12; font-weight: 400; max-width: 8.8in;">
                    {{ modalRow?.course_name || '—' }}
                  </div>

                  <div style="margin-top: 46px; font-size: 17px; font-weight: 500;">
                    <b>ON</b> {{ modalRow?.done_at ? formatDate(modalRow.done_at) : '—' }}
                  </div>
                </div>

                <!-- Footer -->
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
      </div>
      
    </div>
  </AdminLayout>
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

    const activeIssuedCount = computed(() => activeRowsBase.value.filter((r) => getActiveStatus(r) === "issued").length);
    const activeRevokedCount = computed(() => activeRowsBase.value.filter((r) => getActiveStatus(r) === "revoked").length);
    const activeReadyCount = computed(() => activeRowsBase.value.filter((r) => getActiveStatus(r) === "ready").length);

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
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to load.";
      } finally {
        loading.value = false;
      }
    };

    const generateDriving = async (row, overrides = null) => {
      error.value = "";
      try {
        const ok = confirm(`Generate DRIVING certificate for ${row.student_name} (${row.course_name})?`);
        if (!ok) return;

        const payload = { reservation_id: row.reservation_id };
        if (overrides) payload.overrides = overrides;

        await api.post(`/admin/certificates/driving/generate`, payload);
        await fetchRows();
        closeModals();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to generate DRIVING certificate.";
      }
    };

    const generateTesda = async (row) => {
      error.value = "";
      try {
        const ok = confirm(`Generate TESDA certificate for ${row.student_name} (${row.course_name})?`);
        if (!ok) return;

        await api.post(`/admin/certificates/tesda/generate`, {
          reservation_id: row.reservation_id,
        });
        await fetchRows();
        closeModals();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to generate TESDA certificate.";
      }
    };

    const revokeDriving = async (row) => {
      error.value = "";
      try {
        const code = getActiveCertCode(row) || "this certificate";
        const ok = confirm(`Revoke DRIVING certificate ${code}?`);
        if (!ok) return;

        const certId = getActiveCertId(row);
        if (!certId) return (error.value = "No Driving certificate id found.");

        await api.patch(`/admin/certificates/driving/${certId}/revoke`, {});
        await fetchRows();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to revoke DRIVING.";
      }
    };

    const revokeTesda = async (row) => {
      error.value = "";
      try {
        const code = getActiveCertCode(row) || "this certificate";
        const ok = confirm(`Revoke TESDA certificate ${code}?`);
        if (!ok) return;

        const certId = getActiveCertId(row);
        if (!certId) return (error.value = "No TESDA certificate id found.");

        await api.patch(`/admin/certificates/tesda/${certId}/revoke`, {});
        await fetchRows();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to revoke TESDA.";
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
      generateDriving,
      generateTesda,
      revokeDriving,
      revokeTesda,
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
    };
  },
};
</script>