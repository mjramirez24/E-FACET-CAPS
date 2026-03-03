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

          <button
            @click="exportCsvActiveTab"
            class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Export CSV
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
                    @click="activeTab === 'driving' ? openDrivingPreview(row) : openTesdaPreview(row)"
                    class="text-gray-700 hover:text-gray-900 text-sm font-medium px-2 py-1 hover:bg-gray-100 rounded"
                  >
                    👁️ Preview / Edit
                  </button>

                  <button
                    v-if="getActiveCertId(row)"
                    @click="viewActiveCertificate(row)"
                    class="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    View
                  </button>

                  <button
                    v-if="getActiveCertId(row)"
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
                        <img v-if="logoUrl" :src="logoUrl" class="w-full h-full object-contain" />
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

      <!-- TESDA Modal (keep as is, omitted for brevity in this reply) -->
       <!-- TESDA Modal -->
      <div
        v-if="tesdaModalOpen"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="closeModals"
      >
        <div class="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
          <div class="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900">TESDA Certificate Preview</h3>
              <p class="text-sm text-gray-600">{{ modalRow?.student_name }} — {{ modalRow?.course_name }}</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="modalRow && getActiveStatus(modalRow) === 'ready'"
                @click="generateTesda(modalRow)"
                class="px-3 py-2 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800"
              >
                ✅ Generate from Preview
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

          <div class="overflow-y-auto">
            <div class="p-4">
              <div
                id="tesda-preview"
                class="relative w-full border border-gray-200 rounded-xl overflow-hidden bg-white"
                style="aspect-ratio: 8.5 / 11"
              >
                <!-- subtle watermark -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="text-[180px] font-black text-gray-100 opacity-70 tracking-widest">TESDA</div>
                </div>

                <div class="absolute inset-0 p-8">
                  <!-- Header -->
                  <div class="flex items-start gap-4">
                    <div class="w-16 h-16 rounded-full border border-gray-300 overflow-hidden bg-white flex items-center justify-center">
                      <img v-if="logoUrl" :src="logoUrl" class="w-full h-full object-contain" />
                      <div v-else class="text-[10px] text-gray-500">LOGO</div>
                    </div>

                    <div class="flex-1">
                      <div class="text-center leading-tight">
                        <div class="text-sm font-extrabold text-gray-900">
                          TECHNICAL EDUCATION AND SKILLS DEVELOPMENT AUTHORITY
                        </div>
                        <div class="text-[11px] text-gray-700 font-semibold">
                          NATIONAL INSTITUTE FOR TECHNICAL EDUCATION AND SKILLS DEVELOPMENT (NITESD)
                        </div>
                        <div class="text-[10px] text-gray-600">
                          EAST SERVICE ROAD, SOUTH LUZON EXPRESSWAY (SLEX), FORT BONIFACIO, TAGUIG CITY
                        </div>
                      </div>

                      <div class="mt-3 h-2 bg-blue-700 rounded"></div>
                    </div>
                  </div>

                  <!-- Code -->
                  <div class="mt-4 flex justify-end">
                    <div class="text-right">
                      <div class="text-[10px] text-gray-500">Certificate Code</div>
                      <div class="text-xs font-mono font-bold text-gray-900">
                        {{ getActiveCertCode(modalRow) || 'TESDA-YYYY-XXXXXX' }}
                      </div>
                    </div>
                  </div>

                  <!-- Title -->
                  <div class="mt-10 text-center">
                    <div class="text-3xl font-extrabold text-gray-900">CERTIFICATE OF COMPLETION</div>
                  </div>

                  <div class="mt-6 text-center text-xs text-gray-600 font-semibold tracking-wide">
                    THIS IS TO CERTIFY THAT
                  </div>

                  <div class="mt-3 text-center">
                    <div class="text-4xl font-black text-gray-900">
                      {{ modalRow?.student_name || '—' }}
                    </div>
                  </div>

                  <div class="mt-6 text-center text-xs text-gray-600 font-semibold tracking-wide">
                    HAS COMPLETED THE COURSE
                  </div>

                  <div class="mt-3 text-center">
                    <div class="text-2xl font-bold text-gray-900">
                      {{ modalRow?.course_name || '—' }}
                    </div>
                  </div>

                  <div class="mt-6 text-center text-sm text-gray-800">
                    ON {{ modalRow?.done_at ? formatDate(modalRow.done_at) : '—' }}
                  </div>

                  <!-- Footer -->
                  <div class="absolute left-8 bottom-8 text-[11px] text-gray-700">
                    <div>This is a computer generated certificate,</div>
                    <div>it is valid even without a signature.</div>
                  </div>

                  <div class="absolute right-8 bottom-8 text-[11px] text-gray-700 text-right">
                    <div class="font-semibold">For verification purposes, contact:</div>
                    <div>eTESDA Division</div>
                    <div>tesdaonlineprogram@tesda.gov.ph</div>
                    <div>(02) 8893 - 8297</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      <!-- You can keep your existing TESDA modal code unchanged -->
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import AdminLayout from "./AdminLayout.vue";

export default {
  name: "AdminCertificates",
  components: { AdminLayout },
  setup() {
    const API_BASE = "http://localhost:3000";

    const normalizeTrack = (t) => String(t || "").trim().toLowerCase();

    const logoUrl = ref(`${API_BASE}/assets/logo.png`);
    const onLogoError = () => (logoUrl.value = "");

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
        const res = await axios.get(`${API_BASE}/api/admin/certificates/completions`, { withCredentials: true });
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

        await axios.post(ENDPOINTS.drivingGenerate, payload, { withCredentials: true });
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

        await axios.post(ENDPOINTS.tesdaGenerate, { reservation_id: row.reservation_id }, { withCredentials: true });
        await fetchRows();
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

        await axios.patch(ENDPOINTS.drivingRevoke(certId), {}, { withCredentials: true });
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

        await axios.patch(ENDPOINTS.tesdaRevoke(certId), {}, { withCredentials: true });
        await fetchRows();
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || "Failed to revoke TESDA.";
      }
    };

    const viewActiveCertificate = (row) => {
      const certId = getActiveCertId(row);
      if (!certId) return;
      window.open(activeTab.value === "driving" ? ENDPOINTS.drivingView(certId) : ENDPOINTS.tesdaView(certId), "_blank");
    };

    const downloadActiveCertificate = (row) => {
      const certId = getActiveCertId(row);
      if (!certId) return;
      window.open(activeTab.value === "driving" ? ENDPOINTS.drivingDownload(certId) : ENDPOINTS.tesdaDownload(certId), "_blank");
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

      const w = window.open("", "_blank", "width=1200,height=800");
      if (!w) return;

      const styles = getHeadStylesHtml();

      w.document.open();
      w.document.write(`
        <html>
          <head>
            <title>Print Certificate</title>
            ${styles}
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #fff; }
              .wrap { width: 100%; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="wrap">${target.outerHTML}</div>
          </body>
        </html>
      `);
      w.document.close();

      w.onload = () => {
        w.focus();
        w.print();
        w.onafterprint = () => w.close();
      };
    };

    const exportCsvActiveTab = () => {
      const headers = ["Student", "Email", "Course", "Course Code", "Track", "Done At", "Certificate Code", "Status", "Tab"];
      const lines = activeRowsFiltered.value.map((r) => {
        const arr = [
          r.student_name,
          r.student_email,
          r.course_name,
          r.course_code || "",
          r.track || "",
          (r.done_at || "").slice(0, 10),
          getActiveCertCode(r) || "",
          getActiveStatus(r) || "",
          activeTab.value,
        ];
        return arr.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
      });

      const csv = [headers.join(","), ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab.value}-certificates.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    onMounted(fetchRows);

    return {
      API_BASE,
      ENDPOINTS,
      logoUrl,
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
      exportCsvActiveTab,

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