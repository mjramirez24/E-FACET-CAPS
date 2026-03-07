<template>
  <AdminLayout active-page="mock-exam">
    <!-- Header -->
    <template #header-left>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          :placeholder="activeTab === 'monitor' ? 'Search exams...' : 'Search questions...'"
          v-model="searchQuery"
          class="w-72 pl-9 pr-4 py-2 rounded-lg text-gray-800 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
        >
      </div>
    </template>

    <div class="space-y-6">
      <!-- ── TAB SWITCHER ── -->
      <div class="flex gap-2">
        <button @click="activeTab = 'monitor'"
          class="px-4 py-2 rounded-md text-sm font-semibold border transition"
          :class="activeTab === 'monitor' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
          📊 Exam Monitor
        </button>
        <button @click="activeTab = 'questions'"
          class="px-4 py-2 rounded-md text-sm font-semibold border transition"
          :class="activeTab === 'questions' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
          🧠 Question Bank
        </button>
      </div>

      <!-- ══════════════════════════════════════════
           TAB 1: EXAM MONITOR
      ══════════════════════════════════════════ -->
      <template v-if="activeTab === 'monitor'">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-green-800">📊 Mock Exam Monitor</h2>
            <p class="text-xs text-gray-500 mt-1">Real-time exam activity from your database</p>
          </div>
        </div>

        <!-- Stat Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-green-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-3xl font-bold text-green-800">{{ examStats.totalExams }}</h3>
                <p class="text-green-700 font-medium mt-1">Total Exams</p>
                <p class="text-xs text-green-700 mt-1">Unique exam categories</p>
              </div>
              <div class="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center"><span class="text-2xl">📋</span></div>
            </div>
          </div>
          <div class="bg-blue-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-3xl font-bold text-blue-800">{{ examStats.totalStudents }}</h3>
                <p class="text-blue-700 font-medium mt-1">Total Students</p>
                <p class="text-xs text-blue-700 mt-1">Students who attempted</p>
              </div>
              <div class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center"><span class="text-2xl">👥</span></div>
            </div>
          </div>
          <div class="bg-yellow-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-3xl font-bold text-yellow-800">{{ examStats.totalAttempts }}</h3>
                <p class="text-yellow-700 font-medium mt-1">Total Attempts</p>
                <p class="text-xs text-yellow-700 mt-1">Across all exams</p>
              </div>
              <div class="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center"><span class="text-2xl">✏️</span></div>
            </div>
          </div>
          <div class="bg-purple-100 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-3xl font-bold text-purple-800">{{ examStats.averageScore }}%</h3>
                <p class="text-purple-700 font-medium mt-1">Average Score</p>
                <p class="text-xs text-purple-700 mt-1">Across all attempts</p>
              </div>
              <div class="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center"><span class="text-2xl">📈</span></div>
            </div>
          </div>
        </div>

        <!-- All Mock Exams Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h3 class="font-bold text-green-800">All Mock Exams</h3>
              <p class="text-xs text-gray-400 mt-0.5">Showing {{ filteredExams.length }} of {{ exams.length }} exams</p>
            </div>
          </div>
          <div v-if="loadingMonitor" class="py-16 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            <p class="mt-3 text-sm text-gray-500">Loading exams...</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-green-800 text-white">
                <tr>
                  <th class="py-3 px-4 text-left font-medium">Exam Title</th>
                  <th class="py-3 px-4 text-left font-medium">Students</th>
                  <th class="py-3 px-4 text-left font-medium">Total Attempts</th>
                  <th class="py-3 px-4 text-left font-medium">Avg Score</th>
                  <th class="py-3 px-4 text-left font-medium">Highest Score</th>
                  <th class="py-3 px-4 text-left font-medium">Last Attempt</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="exam in filteredExams" :key="exam.id" class="hover:bg-green-50 transition-colors">
                  <td class="py-3 px-4">
                    <p class="font-semibold text-gray-800">{{ exam.title }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ exam.id }}</p>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1">👥 {{ exam.uniqueStudents }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-full px-2.5 py-1">✏️ {{ exam.totalAttempts }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <div class="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500"
                          :class="exam.avgScore >= 80 ? 'bg-green-500' : exam.avgScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                          :style="{ width: exam.avgScore + '%' }"></div>
                      </div>
                      <span class="font-bold text-sm" :class="getScoreClass(exam.avgScore)">{{ exam.avgScore }}%</span>
                    </div>
                  </td>
                  <td class="py-3 px-4"><span class="font-bold text-sm" :class="getScoreClass(exam.highestScore)">{{ exam.highestScore }}%</span></td>
                  <td class="py-3 px-4 text-xs text-gray-500">{{ formatDate(exam.lastAttempt) }}</td>
                </tr>
                <tr v-if="filteredExams.length === 0">
                  <td colspan="6" class="py-12 text-center">
                    <div class="text-4xl mb-2">🧠</div>
                    <p class="text-gray-500 font-medium">No exams found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Attempts -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h3 class="font-bold text-green-800">📊 Recent Exam Attempts</h3>
              <p class="text-xs text-gray-400 mt-0.5">Latest attempt per student per exam</p>
            </div>
            <select v-model="attemptsFilter"
              class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-400 bg-white">
              <option value="">All Exams</option>
              <option v-for="exam in exams" :key="exam.id" :value="exam.title">{{ exam.title }}</option>
            </select>
          </div>
          <div v-if="loadingMonitor" class="py-12 text-center">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-700"></div>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-green-800 text-white">
                <tr>
                  <th class="py-3 px-4 text-left font-medium">Student</th>
                  <th class="py-3 px-4 text-left font-medium">Exam</th>
                  <th class="py-3 px-4 text-left font-medium">Latest Score</th>
                  <th class="py-3 px-4 text-left font-medium">Avg Score</th>
                  <th class="py-3 px-4 text-left font-medium">Attempts</th>
                  <th class="py-3 px-4 text-left font-medium">Correct</th>
                  <th class="py-3 px-4 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="attempt in filteredAttempts" :key="attempt.id" class="hover:bg-green-50 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold shrink-0">{{ getInitials(attempt.studentName) }}</div>
                      <span class="font-medium text-gray-800">{{ attempt.studentName }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 max-w-[180px]"><p class="truncate font-medium text-gray-700">{{ attempt.examTitle }}</p></td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <div class="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full rounded-full"
                          :class="attempt.score >= 80 ? 'bg-green-500' : attempt.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                          :style="{ width: attempt.score + '%' }"></div>
                      </div>
                      <span class="font-bold" :class="getScoreClass(attempt.score)">{{ attempt.score }}%</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-gray-500 text-sm">{{ attempt.studentAvgScore }}%</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">🔁 {{ attempt.attemptCount }}×</span>
                  </td>
                  <td class="py-3 px-4 text-gray-600 text-sm">{{ attempt.correct_answers }}/{{ attempt.total_questions }}</td>
                  <td class="py-3 px-4 text-xs text-gray-400">{{ formatDate(attempt.date) }}</td>
                </tr>
                <tr v-if="filteredAttempts.length === 0">
                  <td colspan="7" class="py-12 text-center text-gray-400">
                    <div class="text-3xl mb-2">📭</div>
                    <p>No attempts recorded yet</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="filteredAttempts.length > 0" class="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
            Showing {{ filteredAttempts.length }} record{{ filteredAttempts.length !== 1 ? 's' : '' }}
          </div>
        </div>
      </template>

      <!-- ══════════════════════════════════════════
           TAB 2: QUESTION BANK
      ══════════════════════════════════════════ -->
      <template v-if="activeTab === 'questions'">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-bold text-green-800">🧠 Question Bank</h2>
            <p class="text-xs text-gray-500 mt-1">Manage all mock exam questions</p>
          </div>
          <button @click="openAddQuestionModal"
            class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm text-sm font-semibold transition">
            ➕ Add Question
          </button>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
            <div class="text-2xl font-bold text-green-800">{{ allQuestions.length }}</div>
            <div class="text-xs text-gray-500 mt-1">Total Questions</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
            <div class="text-2xl font-bold text-blue-700">{{ activeQCount }}</div>
            <div class="text-xs text-gray-500 mt-1">Active</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
            <div class="text-2xl font-bold text-gray-500">{{ allQuestions.length - activeQCount }}</div>
            <div class="text-xs text-gray-500 mt-1">Inactive</div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-center">
            <div class="text-2xl font-bold text-purple-700">{{ uniqueTopicCount }}</div>
            <div class="text-xs text-gray-500 mt-1">Topics Covered</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Topic</label>
            <select v-model="qbTopicFilter" class="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-52">
              <option value="">All Topics</option>
              <option v-for="t in allTopicOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select v-model="qbStatusFilter" class="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
              <option value="">All</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Rows</label>
            <select v-model.number="qbPageSize" class="border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
          </div>
          <button @click="resetQbFilters" class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 font-medium">Reset</button>
          <button @click="fetchQuestions" class="px-3 py-2 bg-green-700 text-white rounded-lg text-sm hover:bg-green-800 font-medium">↻ Refresh</button>
        </div>

        <!-- Questions Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
            Showing {{ qbPaged.length }} of {{ qbFiltered.length }} questions
          </div>
          <div v-if="loadingQuestions" class="py-16 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
            <p class="mt-3 text-sm text-gray-500">Loading questions...</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-green-800 text-white">
                <tr>
                  <th class="py-3 px-4 text-left font-medium w-12">#</th>
                  <th class="py-3 px-4 text-left font-medium">Question</th>
                  <th class="py-3 px-4 text-left font-medium">Topics</th>
                  <th class="py-3 px-4 text-left font-medium">Answer</th>
                  <th class="py-3 px-4 text-left font-medium">Status</th>
                  <th class="py-3 px-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(q, idx) in qbPaged" :key="q.id" class="hover:bg-green-50 transition-colors">
                  <td class="py-3 px-4 text-gray-400 text-xs">{{ (qbPage - 1) * qbPageSize + idx + 1 }}</td>
                  <td class="py-3 px-4 max-w-xs">
                    <div class="flex items-start gap-2">
                      <span v-if="q.symbol" class="text-xl shrink-0 leading-tight">{{ q.symbol }}</span>
                      <div>
                        <p class="font-medium text-gray-800 line-clamp-2">{{ q.stem_en }}</p>
                        <p class="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">{{ q.stem_tl }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-1 max-w-xs">
                      <span v-for="t in getTopicArray(q.topic)" :key="t"
                        class="inline-block bg-green-50 text-green-700 border border-green-100 rounded-full px-2 py-0.5 text-xs">
                        {{ getTopicLabel(t) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold">
                      {{ String(q.correct_key || '').toUpperCase() }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold"
                      :class="q.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                      {{ q.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 whitespace-nowrap">
                    <button @click="viewQuestion(q)" class="text-blue-600 hover:text-blue-800 text-xs font-medium mr-2">View</button>
                    <button @click="editQuestion(q)" class="text-yellow-600 hover:text-yellow-800 text-xs font-medium mr-2">Edit</button>
                    <button @click="confirmDeleteQuestion(q)" class="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                  </td>
                </tr>
                <tr v-if="qbPaged.length === 0">
                  <td colspan="6" class="py-12 text-center text-gray-400">
                    <div class="text-3xl mb-2">📭</div>
                    <p>No questions found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div class="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <div class="text-xs text-gray-500">Page {{ qbPage }} of {{ qbTotalPages }}</div>
            <div class="flex gap-2">
              <button @click="qbPage--" :disabled="qbPage <= 1"
                class="px-3 py-1.5 border rounded-md text-xs font-semibold disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <button @click="qbPage++" :disabled="qbPage >= qbTotalPages"
                class="px-3 py-1.5 border rounded-md text-xs font-semibold disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ══════════════════════════════════════════
         ADD / EDIT QUESTION MODAL
    ══════════════════════════════════════════ -->
    <div v-if="showAddQuestionModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="closeAddQuestionModal">
      <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div class="bg-green-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-white font-bold text-base">{{ isEditingQuestion ? '✏️ Edit Question' : '➕ Add New Question' }}</h3>
            <p class="text-green-200 text-xs mt-0.5">Fill in both English and Tagalog fields</p>
          </div>
          <button @click="closeAddQuestionModal" class="text-white/70 hover:text-white text-2xl leading-none transition">×</button>
        </div>

        <div class="flex border-b border-gray-200 bg-gray-50 shrink-0">
          <button @click="modalLang = 'en'"
            class="flex-1 py-3 text-sm font-semibold transition border-b-2"
            :class="modalLang === 'en' ? 'border-green-600 text-green-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'">
            🇺🇸 English
          </button>
          <button @click="modalLang = 'tl'"
            class="flex-1 py-3 text-sm font-semibold transition border-b-2"
            :class="modalLang === 'tl' ? 'border-green-600 text-green-700 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'">
            🇵🇭 Tagalog
          </button>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <!-- Topics Selection with Category First Approach -->
          <div v-show="modalLang === 'en'">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-xs font-bold text-gray-600 uppercase tracking-wide">
                Topics <span class="text-red-400">*</span>
                <span class="text-xs font-normal text-gray-400 ml-2">(select category first, then topics)</span>
              </label>
              <div class="space-x-2">
                <button 
                  type="button"
                  @click="selectAllTopics" 
                  class="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  Select All
                </button>
                <span class="text-gray-300">|</span>
                <button 
                  type="button"
                  @click="clearAllTopics" 
                  class="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
  
            <!-- Category Selection First -->
            <div class="mb-4">
              <select 
                v-model="selectedCategory"
                @change="onCategoryChange"
                class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">-- Select a Category --</option>
                <option v-for="group in TOPIC_GROUPS" :key="group.name" :value="group.name">
                  {{ group.name }}
                </option>
              </select>
            </div>

            <!-- Show topics only when category is selected -->
            <div v-if="selectedCategory" class="border border-gray-300 rounded-lg bg-white p-4">
              <!-- Category Header with Select All for this category -->
              <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                <div class="flex items-center">
                  <input 
                    type="checkbox" 
                    :id="'category-' + selectedCategory"
                    :checked="areAllSelectedCategoryTopicsSelected"
                    @change="toggleAllCategoryTopics"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  >
                  <label :for="'category-' + selectedCategory" class="ml-2 text-sm font-semibold text-green-700">
                    {{ selectedCategory }}
                  </label>
                </div>
                <span class="text-xs text-gray-400">
                  {{ getSelectedCountInSelectedCategory }}/{{ getSelectedCategoryTopics.length }}
                </span>
              </div>
              
              <!-- Topics in this category -->
              <div class="grid grid-cols-2 gap-3 pl-2">
                <div v-for="topicKey in getSelectedCategoryTopics" :key="topicKey" class="flex items-center">
                  <input 
                    type="checkbox" 
                    :id="'topic-' + topicKey" 
                    :value="topicKey"
                    v-model="qForm.topics"
                    class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  >
                  <label :for="'topic-' + topicKey" class="ml-2 text-xs text-gray-700">
                    {{ getTopicLabel(topicKey) }}
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Show message if no category selected -->
            <div v-else class="border border-gray-300 rounded-lg bg-gray-50 p-8 text-center">
              <p class="text-gray-400 text-sm">Please select a category first to view available topics</p>
            </div>
            
            <p v-if="qForm.topics.length === 0 && formError" class="text-xs text-red-500 mt-1">Please select at least one topic</p>
            <p class="text-xs text-gray-400 mt-2">Selected: <span class="font-semibold text-green-600">{{ qForm.topics.length }}</span> topic(s)</p>
          </div>

          <!-- Symbol -->
          <div v-show="modalLang === 'en'">
            <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Symbol / Emoji <span class="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" v-model="qForm.symbol" placeholder="e.g. 🛑 or leave empty"
              class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          </div>

          <!-- Status toggle (edit only) -->
          <div v-show="modalLang === 'en' && isEditingQuestion">
            <label class="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
            <div class="flex gap-3">
              <button type="button" @click="qForm.is_active = 1"
                class="flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition"
                :class="qForm.is_active === 1 ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'">
                ✅ Active
              </button>
              <button type="button" @click="qForm.is_active = 0"
                class="flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition"
                :class="qForm.is_active === 0 ? 'bg-gray-500 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'">
                🚫 Inactive
              </button>
            </div>
          </div>

          <!-- English fields -->
          <div v-show="modalLang === 'en'" class="space-y-4">
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-4">
              <p class="text-xs font-bold text-blue-700 uppercase tracking-wide">🇺🇸 English Content</p>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Question (English) <span class="text-red-400">*</span></label>
                <textarea v-model="qForm.stem_en" rows="3" placeholder="Type the question in English..."
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
              </div>
              <div class="grid grid-cols-1 gap-3">
                <div v-for="key in ['a','b','c']" :key="'en-'+key" class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    :class="qForm.correct_key === key ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'">
                    {{ key.toUpperCase() }}
                  </div>
                  <input type="text" v-model="qForm['choice_' + key + '_en']" :placeholder="`Choice ${key.toUpperCase()} in English`"
                    class="flex-1 p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                    :class="qForm.correct_key === key ? 'border-green-400 focus:ring-green-500 bg-green-50' : 'border-gray-300 focus:ring-green-500'">
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Rationale (English) <span class="text-gray-400 font-normal">(optional)</span></label>
                <textarea v-model="qForm.rationale_en" rows="2" placeholder="Why is this the correct answer?"
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
              </div>
            </div>
          </div>

          <!-- Tagalog fields -->
          <div v-show="modalLang === 'tl'" class="space-y-4">
            <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-4 space-y-4">
              <p class="text-xs font-bold text-yellow-700 uppercase tracking-wide">🇵🇭 Tagalog Content</p>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Tanong (Tagalog) <span class="text-red-400">*</span></label>
                <textarea v-model="qForm.stem_tl" rows="3" placeholder="I-type ang tanong sa Tagalog..."
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"></textarea>
              </div>
              <div class="grid grid-cols-1 gap-3">
                <div v-for="key in ['a','b','c']" :key="'tl-'+key" class="flex items-start gap-2.5">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    :class="qForm.correct_key === key ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'">
                    {{ key.toUpperCase() }}
                  </div>
                  <input type="text" v-model="qForm['choice_' + key + '_tl']" :placeholder="`Pagpipilian ${key.toUpperCase()} sa Tagalog`"
                    class="flex-1 p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition"
                    :class="qForm.correct_key === key ? 'border-green-400 focus:ring-green-500 bg-green-50' : 'border-gray-300 focus:ring-yellow-500'">
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Paliwanag (Tagalog) <span class="text-gray-400 font-normal">(opsyonal)</span></label>
                <textarea v-model="qForm.rationale_tl" rows="2" placeholder="Bakit ito ang tamang sagot?"
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"></textarea>
              </div>
            </div>
          </div>

          <!-- Correct Answer -->
          <div>
            <label class="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Correct Answer <span class="text-red-400">*</span></label>
            <div class="flex gap-3">
              <button v-for="key in ['a','b','c']" :key="'correct-'+key" type="button" @click="qForm.correct_key = key"
                class="flex-1 py-2.5 rounded-lg border-2 text-sm font-bold transition"
                :class="qForm.correct_key === key ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-600'">
                {{ key.toUpperCase() }}<span v-if="qForm.correct_key === key" class="ml-1">✓</span>
              </button>
            </div>
          </div>

          <div v-if="formError" class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            ⚠️ {{ formError }}
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
          <div class="text-xs text-gray-400">
            <span v-if="qForm.stem_en && qForm.stem_tl" class="text-green-600 font-semibold">✓ Both languages filled</span>
            <span v-else-if="qForm.stem_en || qForm.stem_tl" class="text-yellow-600 font-semibold">⚠ Fill both EN and TL</span>
            <span v-else>Fill in English and Tagalog content</span>
          </div>
          <div class="flex gap-2">
            <button @click="closeAddQuestionModal" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">Cancel</button>
            <button @click="saveQuestion" :disabled="savingQuestion"
              class="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              <div v-if="savingQuestion" class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
              {{ savingQuestion ? 'Saving...' : (isEditingQuestion ? '💾 Update' : '💾 Save Question') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW QUESTION MODAL -->
    <div v-if="showViewModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showViewModal = false">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="bg-green-700 px-6 py-4 flex items-center justify-between">
          <h3 class="text-white font-bold">🔍 Question #{{ viewingQuestion?.id }}</h3>
          <button @click="showViewModal = false" class="text-white/70 hover:text-white text-2xl">×</button>
        </div>
        <div class="p-6 space-y-4" v-if="viewingQuestion">
          <div class="flex flex-wrap gap-2 items-center">
            <div class="flex flex-wrap gap-1">
              <span v-for="t in getTopicArray(viewingQuestion.topic)" :key="t"
                class="bg-green-50 text-green-700 border border-green-100 rounded-full px-3 py-1 text-xs font-semibold">
                {{ getTopicLabel(t) }}
              </span>
            </div>
            <span class="ml-auto px-2 py-1 rounded-full text-xs font-semibold"
              :class="viewingQuestion.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
              {{ viewingQuestion.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <div v-if="viewingQuestion.symbol" class="text-5xl text-center py-2">{{ viewingQuestion.symbol }}</div>

          <div class="grid md:grid-cols-2 gap-4">
            <!-- EN -->
            <div class="bg-blue-50 rounded-xl p-4 space-y-3">
              <p class="text-xs font-bold text-blue-700 uppercase">🇺🇸 English</p>
              <p class="font-semibold text-gray-800">{{ viewingQuestion.stem_en }}</p>
              <div class="space-y-1.5">
                <div v-for="key in ['a','b','c']" :key="key" class="flex items-center gap-2 text-sm">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    :class="viewingQuestion.correct_key === key ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'">
                    {{ key.toUpperCase() }}
                  </span>
                  <span :class="viewingQuestion.correct_key === key ? 'font-semibold text-green-700' : 'text-gray-700'">
                    {{ viewingQuestion['choice_' + key + '_en'] }}
                  </span>
                </div>
              </div>
              <div v-if="viewingQuestion.rationale_en" class="text-xs text-gray-600 bg-white rounded-lg p-2 border">
                💡 {{ viewingQuestion.rationale_en }}
              </div>
            </div>
            <!-- TL -->
            <div class="bg-yellow-50 rounded-xl p-4 space-y-3">
              <p class="text-xs font-bold text-yellow-700 uppercase">🇵🇭 Tagalog</p>
              <p class="font-semibold text-gray-800">{{ viewingQuestion.stem_tl }}</p>
              <div class="space-y-1.5">
                <div v-for="key in ['a','b','c']" :key="key" class="flex items-center gap-2 text-sm">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    :class="viewingQuestion.correct_key === key ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'">
                    {{ key.toUpperCase() }}
                  </span>
                  <span :class="viewingQuestion.correct_key === key ? 'font-semibold text-green-700' : 'text-gray-700'">
                    {{ viewingQuestion['choice_' + key + '_tl'] }}
                  </span>
                </div>
              </div>
              <div v-if="viewingQuestion.rationale_tl" class="text-xs text-gray-600 bg-white rounded-lg p-2 border">
                💡 {{ viewingQuestion.rationale_tl }}
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button @click="editQuestion(viewingQuestion); showViewModal = false"
              class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold">✏️ Edit</button>
            <button @click="showViewModal = false"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-100">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRM -->
    <div v-if="showDeleteQModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-red-600 mb-2">Delete Question?</h3>
        <p class="text-gray-600 text-sm mb-4">
          Permanently delete question <span class="font-semibold">#{{ questionToDelete?.id }}</span>. This cannot be undone.
        </p>
        <div class="flex justify-end gap-2">
          <button @click="showDeleteQModal = false" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button @click="deleteQuestion" :disabled="deletingQuestion"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
            {{ deletingQuestion ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import AdminLayout from './AdminLayout.vue'
import axios from 'axios'

const TOPIC_MAP = {
  traffic_rules:'Traffic Rules', traffic_signs:'Traffic Signs', road_signs:'Road Signs',
  traffic_lights:'Traffic Lights', road_markings:'Road Markings', regulatory:'Regulatory Signs',
  warning:'Warning Signs', prohibitory:'Prohibitory Signs', lane_use_signs:'Lane-Use Signs',
  defensive_driving:'Defensive Driving', safe_driving_rules:'Safe Driving Rules', road_safety:'Road Safety',
  hazard_awareness:'Hazard Awareness', driver_attitude:'Driver Attitude', road_discipline:'Road Discipline',
  speed_management:'Speed Management', licensing:'Licensing', driver_classification:'Driver Classification',
  requirements:'License Requirements', renewal:'License Renewal', validity:'License Validity',
  dl_codes:'DL Codes', registration:'Vehicle Registration', violations:'Violations',
  penalties:'Penalties', suspension:'License Suspension', confiscation:'License Confiscation',
  drunk_driving:'Drunk Driving', distracted_driving:'Distracted Driving', parking:'Parking Rules',
  overtaking:'Overtaking', lane_change:'Lane Changing', turning:'Turning', hand_signals:'Hand Signals',
  right_of_way:'Right of Way', intersection:'Intersection Rules', road_emergency:'Road Emergency',
  road_crash:'Road Crash', first_aid:'First Aid', breakdown:'Vehicle Breakdown', ewd:'Early Warning Device',
  tire_blowout:'Tire Blowout', motorcycle:'Motorcycle Rules', motorcycle_safety:'Motorcycle Safety',
  public_utility_vehicle:'PUV Rules', bike_lane:'Bike Lanes', driver_fatigue:'Driver Fatigue',
  drowsy_driving:'Drowsy Driving', road_rage:'Road Rage', stress_management:'Stress Management',
  child_safety:'Child Safety', child_restraint:'Child Restraint', pedestrians:'Pedestrian Right of Way',
  crosswalk:'Crosswalk', seatbelt:'Seat Belt', vehicle_maintenance:'Vehicle Maintenance',
  inspection:'Vehicle Inspection', roadworthiness:'Roadworthiness', weather_driving:'Weather Driving',
  night_driving:'Night Driving', visibility:'Visibility', headlights:'Headlights',
}

const TOPIC_GROUPS = [
  {
    name: '🚦 Traffic Rules & Signs',
    topics: ['traffic_rules', 'traffic_signs', 'road_signs', 'traffic_lights', 'road_markings', 
             'regulatory', 'warning', 'prohibitory', 'lane_use_signs']
  },
  {
    name: '🛡️ Safe Driving',
    topics: ['defensive_driving', 'safe_driving_rules', 'road_safety', 'hazard_awareness', 
             'driver_attitude', 'road_discipline', 'speed_management']
  },
  {
    name: '📋 Licensing & Documents',
    topics: ['licensing', 'driver_classification', 'requirements', 'renewal', 'validity', 
             'dl_codes', 'registration']
  },
  {
    name: '⚠️ Violations & Penalties',
    topics: ['violations', 'penalties', 'suspension', 'confiscation', 'drunk_driving', 'distracted_driving']
  },
  {
    name: '🚗 Vehicle Operations',
    topics: ['parking', 'overtaking', 'lane_change', 'turning', 'hand_signals', 'right_of_way', 'intersection']
  },
  {
    name: '🚨 Emergency & Accidents',
    topics: ['road_emergency', 'road_crash', 'first_aid', 'breakdown', 'ewd', 'tire_blowout']
  },
  {
    name: '🏍️ Special Vehicles',
    topics: ['motorcycle', 'motorcycle_safety', 'public_utility_vehicle', 'bike_lane']
  },
  {
    name: '😊 Driver Wellness',
    topics: ['driver_fatigue', 'drowsy_driving', 'road_rage', 'stress_management']
  },
  {
    name: '👶 Child & Pedestrian Safety',
    topics: ['child_safety', 'child_restraint', 'pedestrians', 'crosswalk', 'seatbelt']
  },
  {
    name: '🔧 Vehicle Maintenance',
    topics: ['vehicle_maintenance', 'inspection', 'roadworthiness']
  },
  {
    name: '🌦️ Weather & Conditions',
    topics: ['weather_driving', 'night_driving', 'visibility', 'headlights']
  }
]

export default {
  name: 'AdminMockExam',
  components: { AdminLayout },

  setup() {
    const api = axios.create({ baseURL: '/api', withCredentials: true })

    const activeTab = ref('monitor')
    const searchQuery = ref('')

    // ── MONITOR ───────────────────────────────────────────────
    const exams = ref([])
    const recentAttempts = ref([])
    const loadingMonitor = ref(true)
    const attemptsFilter = ref('')
    const examStats = reactive({ totalExams: 0, totalStudents: 0, totalAttempts: 0, averageScore: 0 })

    const fetchMonitor = async () => {
      loadingMonitor.value = true
      try {
        const [examsRes, attemptsRes, statsRes] = await Promise.all([
          api.get('/admin/mock-exam/exams'),
          api.get('/admin/mock-exam/recent-attempts'),
          api.get('/admin/mock-exam/stats'),
        ])
        exams.value = (examsRes.data?.data || []).map(e => ({
          id: e.id, title: e.title,
          totalAttempts: e.totalAttempts || 0, uniqueStudents: e.uniqueStudents || 0,
          avgScore: e.avgScore || 0, highestScore: e.highestScore || 0, lastAttempt: e.lastAttempt,
        }))
        recentAttempts.value = attemptsRes.data?.data || []
        const s = statsRes.data?.data || {}
        examStats.totalExams = s.totalExams || 0; examStats.totalStudents = s.totalStudents || 0
        examStats.totalAttempts = s.totalAttempts || 0; examStats.averageScore = s.averageScore || 0
      } catch (err) { console.error('fetchMonitor error:', err) }
      finally { loadingMonitor.value = false }
    }

    const filteredExams = computed(() => {
      if (!searchQuery.value.trim()) return exams.value
      const q = searchQuery.value.toLowerCase()
      return exams.value.filter(e => String(e.title).toLowerCase().includes(q) || String(e.id).toLowerCase().includes(q))
    })

    const filteredAttempts = computed(() =>
      !attemptsFilter.value ? recentAttempts.value
        : recentAttempts.value.filter(a => a.examTitle === attemptsFilter.value)
    )

    // ── QUESTION BANK ─────────────────────────────────────────
    const allQuestions = ref([])
    const loadingQuestions = ref(false)
    const qbTopicFilter = ref('')
    const qbStatusFilter = ref('')
    const qbPage = ref(1)
    const qbPageSize = ref(25)
    const selectedCategory = ref('')

    const fetchQuestions = async () => {
      loadingQuestions.value = true
      try {
        const res = await api.get('/admin/mock-exam/questions')
        allQuestions.value = res.data?.data || []
      } catch (err) { console.error('fetchQuestions error:', err) }
      finally { loadingQuestions.value = false }
    }

    const getTopicArray = (topic) => {
      if (!topic) return []
      if (Array.isArray(topic)) return topic
      if (typeof topic === 'string') {
        try {
          const parsed = JSON.parse(topic)
          return Array.isArray(parsed) ? parsed : [topic]
        } catch {
          return [topic]
        }
      }
      return [String(topic)]
    }

    const getTopicLabel = (key) => TOPIC_MAP[key] || key

    const allTopicOptions = computed(() =>
      Object.entries(TOPIC_MAP).map(([v, l]) => ({ value: v, label: l })).sort((a, b) => a.label.localeCompare(b.label))
    )

    const activeQCount = computed(() => allQuestions.value.filter(q => q.is_active).length)

    const uniqueTopicCount = computed(() => {
      const s = new Set()
      allQuestions.value.forEach(q => getTopicArray(q.topic).forEach(t => s.add(t)))
      return s.size
    })

    const qbFiltered = computed(() => {
      let list = [...allQuestions.value]
      const sq = searchQuery.value.trim().toLowerCase()

      if (sq) {
        list = list.filter(q =>
          String(q.stem_en).toLowerCase().includes(sq) ||
          String(q.stem_tl).toLowerCase().includes(sq)
        )
      }

      if (qbTopicFilter.value) {
        list = list.filter(q => {
          const questionTopics = getTopicArray(q.topic)
          return questionTopics.includes(qbTopicFilter.value)
        })
      }

      if (qbStatusFilter.value !== '') {
        list = list.filter(q => Number(q.is_active) === Number(qbStatusFilter.value))
      }

      return list
    })

    const qbTotalPages = computed(() => Math.max(1, Math.ceil(qbFiltered.value.length / qbPageSize.value)))

    watch(qbFiltered, () => { qbPage.value = 1 })

    const qbPaged = computed(() => qbFiltered.value.slice((qbPage.value - 1) * qbPageSize.value, qbPage.value * qbPageSize.value))

    const resetQbFilters = () => {
      qbTopicFilter.value = '';
      qbStatusFilter.value = '';
      qbPage.value = 1;
      qbPageSize.value = 25
    }

    const getSelectedCategoryTopics = computed(() => {
      if (!selectedCategory.value) return []
      const group = TOPIC_GROUPS.find(g => g.name === selectedCategory.value)
      return group ? group.topics : []
    })

    const areAllSelectedCategoryTopicsSelected = computed(() => {
      if (!selectedCategory.value) return false
      const categoryTopics = getSelectedCategoryTopics.value
      return categoryTopics.length > 0 &&
        categoryTopics.every(topic => qForm.topics.includes(topic))
    })

    const getSelectedCountInSelectedCategory = computed(() => {
      if (!selectedCategory.value) return 0
      const categoryTopics = getSelectedCategoryTopics.value
      return categoryTopics.filter(topic => qForm.topics.includes(topic)).length
    })

    // View
    const showViewModal = ref(false)
    const viewingQuestion = ref(null)

    const viewQuestion = (q) => {
      viewingQuestion.value = q;
      showViewModal.value = true
    }

    // Delete
    const showDeleteQModal = ref(false)
    const questionToDelete = ref(null)
    const deletingQuestion = ref(false)

    const confirmDeleteQuestion = (q) => {
      questionToDelete.value = q;
      showDeleteQModal.value = true
    }

    const deleteQuestion = async () => {
      if (!questionToDelete.value) return
      deletingQuestion.value = true
      try {
        await api.delete(`/admin/mock-exam/questions/${questionToDelete.value.id}`)
        showDeleteQModal.value = false;
        questionToDelete.value = null
        await fetchQuestions()
      } catch (e) {
        alert(e.response?.data?.message || 'Failed to delete question.')
      }
      finally { deletingQuestion.value = false }
    }

    // ── ADD / EDIT MODAL ──────────────────────────────────────
    const showAddQuestionModal = ref(false)
    const isEditingQuestion = ref(false)
    const editingQuestionId = ref(null)
    const modalLang = ref('en')
    const savingQuestion = ref(false)
    const formError = ref('')

    const defaultForm = () => ({
      topics: [],
      symbol: '',
      stem_en: '',
      stem_tl: '',
      choice_a_en: '',
      choice_a_tl: '',
      choice_b_en: '',
      choice_b_tl: '',
      choice_c_en: '',
      choice_c_tl: '',
      correct_key: '',
      rationale_en: '',
      rationale_tl: '',
      is_active: 1,
    })

    const qForm = reactive(defaultForm())

    // Topic group helpers
    const areAllGroupTopicsSelected = (group) => {
      return group.topics.every(topic => qForm.topics.includes(topic))
    }

    const getSelectedCountInGroup = (group) => {
      return group.topics.filter(topic => qForm.topics.includes(topic)).length
    }

    const toggleGroup = (group, checked) => {
      if (checked) {
        const newTopics = [...new Set([...qForm.topics, ...group.topics])]
        qForm.topics = newTopics
      } else {
        qForm.topics = qForm.topics.filter(topic => !group.topics.includes(topic))
      }
    }

    const selectAllTopics = () => {
      qForm.topics = TOPIC_GROUPS.flatMap(group => group.topics)
    }

    const clearAllTopics = () => {
      qForm.topics = []
      selectedCategory.value = ''
    }

    const onCategoryChange = () => {
      // Optional: Auto-select or clear topics when category changes
    }

    const toggleAllCategoryTopics = (event) => {
      const checked = event.target.checked
      const categoryTopics = getSelectedCategoryTopics.value

      if (checked) {
        const newTopics = [...new Set([...qForm.topics, ...categoryTopics])]
        qForm.topics = newTopics
      } else {
        qForm.topics = qForm.topics.filter(topic => !categoryTopics.includes(topic))
      }
    }

    const openAddQuestionModal = () => {
      Object.assign(qForm, defaultForm())
      selectedCategory.value = ''
      isEditingQuestion.value = false;
      editingQuestionId.value = null
      formError.value = '';
      modalLang.value = 'en';
      showAddQuestionModal.value = true
    }

    const editQuestion = (q) => {
      const topicArray = getTopicArray(q.topic)

      if (topicArray.length > 0) {
        const firstTopic = topicArray[0]
        const group = TOPIC_GROUPS.find(g => g.topics.includes(firstTopic))
        selectedCategory.value = group ? group.name : ''
      } else {
        selectedCategory.value = ''
      }

      Object.assign(qForm, {
        topics: topicArray,
        symbol: q.symbol || '',
        stem_en: q.stem_en || '',
        stem_tl: q.stem_tl || '',
        choice_a_en: q.choice_a_en || '',
        choice_a_tl: q.choice_a_tl || '',
        choice_b_en: q.choice_b_en || '',
        choice_b_tl: q.choice_b_tl || '',
        choice_c_en: q.choice_c_en || '',
        choice_c_tl: q.choice_c_tl || '',
        correct_key: q.correct_key || '',
        rationale_en: q.rationale_en || '',
        rationale_tl: q.rationale_tl || '',
        is_active: Number(q.is_active ?? 1),
      })
      isEditingQuestion.value = true;
      editingQuestionId.value = q.id
      formError.value = '';
      modalLang.value = 'en';
      showAddQuestionModal.value = true
    }

    const closeAddQuestionModal = () => {
      showAddQuestionModal.value = false;
      formError.value = ''
      isEditingQuestion.value = false;
      editingQuestionId.value = null
    }

    const validateForm = () => {
      if (!qForm.topics || qForm.topics.length === 0) return 'Please select at least one topic.'
      if (!qForm.stem_en) return 'Please enter the question in English.'
      if (!qForm.stem_tl) return 'Please enter the question in Tagalog.'
      if (!qForm.choice_a_en) return 'Please enter Choice A in English.'
      if (!qForm.choice_a_tl) return 'Please enter Choice A in Tagalog.'
      if (!qForm.choice_b_en) return 'Please enter Choice B in English.'
      if (!qForm.choice_b_tl) return 'Please enter Choice B in Tagalog.'
      if (!qForm.choice_c_en) return 'Please enter Choice C in English.'
      if (!qForm.choice_c_tl) return 'Please enter Choice C in Tagalog.'
      if (!qForm.correct_key) return 'Please select the correct answer.'
      return null
    }

    const saveQuestion = async () => {
      formError.value = ''
      const err = validateForm()
      if (err) {
        formError.value = err;
        return
      }

      savingQuestion.value = true
      try {
        const payload = {
          topic: qForm.topics,
          symbol: qForm.symbol || null,
          stem_en: qForm.stem_en,
          stem_tl: qForm.stem_tl,
          choice_a_en: qForm.choice_a_en,
          choice_a_tl: qForm.choice_a_tl,
          choice_b_en: qForm.choice_b_en,
          choice_b_tl: qForm.choice_b_tl,
          choice_c_en: qForm.choice_c_en,
          choice_c_tl: qForm.choice_c_tl,
          correct_key: qForm.correct_key,
          rationale_en: qForm.rationale_en || '',
          rationale_tl: qForm.rationale_tl || '',
          is_active: qForm.is_active,
        }

        if (isEditingQuestion.value) {
          await api.put(`/admin/mock-exam/questions/${editingQuestionId.value}`, payload)
        } else {
          await api.post('/admin/mock-exam/questions', payload)
        }

        closeAddQuestionModal()
        await fetchQuestions()
        alert(isEditingQuestion.value ? '✅ Question updated!' : '✅ Question saved successfully!')
      } catch (e) {
        console.error('saveQuestion error:', e)
        formError.value = e.response?.data?.message || 'Failed to save question. Please try again.'
      } finally {
        savingQuestion.value = false
      }
    }

    // ── Helpers ───────────────────────────────────────────────
    const formatDate = d => !d ? '—' : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const getInitials = name => (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)

    const getScoreClass = s => {
      const n = Number(s);
      return n >= 80 ? 'text-green-600' : n >= 60 ? 'text-yellow-600' : 'text-red-500'
    }

    onMounted(async () => {
      await fetchMonitor()
      await fetchQuestions()
    })

    watch(activeTab, (tab) => {
      if (tab === 'questions' && allQuestions.value.length === 0) fetchQuestions()
    })

    return {
      // Constants
      TOPIC_GROUPS,

      // Tab and search
      activeTab,
      searchQuery,

      // Monitor
      exams,
      recentAttempts,
      loadingMonitor,
      attemptsFilter,
      examStats,
      filteredExams,
      filteredAttempts,

      // Question Bank
      allQuestions,
      loadingQuestions,
      fetchQuestions,
      qbTopicFilter,
      qbStatusFilter,
      qbPage,
      qbPageSize,
      qbFiltered,
      qbPaged,
      qbTotalPages,
      activeQCount,
      uniqueTopicCount,
      allTopicOptions,
      resetQbFilters,

      // Category Selection
      selectedCategory,
      getSelectedCategoryTopics,
      areAllSelectedCategoryTopicsSelected,
      getSelectedCountInSelectedCategory,
      onCategoryChange,
      toggleAllCategoryTopics,

      // View Modal
      showViewModal,
      viewingQuestion,
      viewQuestion,

      // Delete
      showDeleteQModal,
      questionToDelete,
      deletingQuestion,
      confirmDeleteQuestion,
      deleteQuestion,

      // Add/Edit Modal
      showAddQuestionModal,
      isEditingQuestion,
      modalLang,
      savingQuestion,
      formError,
      qForm,
      openAddQuestionModal,
      editQuestion,
      closeAddQuestionModal,
      saveQuestion,

      // Topic Group Helpers
      areAllGroupTopicsSelected,
      getSelectedCountInGroup,
      toggleGroup,
      selectAllTopics,
      clearAllTopics,

      // Utility Functions
      formatDate,
      getInitials,
      getScoreClass,
      getTopicArray,
      getTopicLabel,
    }
  }
}
</script>