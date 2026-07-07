<template>
  <AdminLayout active-page="mock-exam">
    <!-- Header -->
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          :placeholder="activeTab === 'monitor' ? 'Search exams...' : 'Search questions...'"
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div>
      <!-- Page Header -->
      <div class="page-header-row">
        <div>
          <h2 class="page-title">Mock Exam Management</h2>
          <p class="page-subtitle">Monitor exam performance and manage the question bank</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-group mb-5">
        <button @click="activeTab = 'monitor'" :class="['tab-btn', activeTab === 'monitor' ? 'tab-active-green' : 'tab-inactive']">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Exam Monitor
        </button>
        <button @click="activeTab = 'questions'" :class="['tab-btn', activeTab === 'questions' ? 'tab-active-green' : 'tab-inactive']">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Question Bank
        </button>
      </div>

      <!-- ══════════════════════════════════════════
           TAB 1: EXAM MONITOR
      ══════════════════════════════════════════ -->
      <template v-if="activeTab === 'monitor'">
        <!-- Stat Cards -->
        <div class="stat-grid mb-5">
          <div class="stat-card">
            <div class="stat-card-inner">
              <div>
                <span class="stat-value stat-value-green">{{ examStats.totalExams }}</span>
                <p class="stat-label">Total Exams</p>
                <p class="stat-meta">Unique exam categories</p>
              </div>
              <div class="stat-icon stat-icon-green">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-inner">
              <div>
                <span class="stat-value stat-value-blue">{{ examStats.totalStudents }}</span>
                <p class="stat-label">Total Students</p>
                <p class="stat-meta">Students who attempted</p>
              </div>
              <div class="stat-icon stat-icon-blue">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-inner">
              <div>
                <span class="stat-value stat-value-amber">{{ examStats.totalAttempts }}</span>
                <p class="stat-label">Total Attempts</p>
                <p class="stat-meta">Across all exams</p>
              </div>
              <div class="stat-icon stat-icon-amber">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-card-inner">
              <div>
                <span class="stat-value stat-value-purple">{{ examStats.averageScore }}%</span>
                <p class="stat-label">Average Score</p>
                <p class="stat-meta">Across all attempts</p>
              </div>
              <div class="stat-icon stat-icon-purple">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- All Mock Exams Table -->
        <div class="panel-card mb-5">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Showing {{ filteredExams.length }} of {{ exams.length }} exams</span>
          </div>
          <div v-if="loadingMonitor" class="loading-state">
            <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p class="text-gray-500">Loading exams...</p>
          </div>
          <div v-else class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green">
                <tr>
                  <th>Exam Title</th>
                  <th>Students</th>
                  <th>Total Attempts</th>
                  <th>Avg Score</th>
                  <th>Highest Score</th>
                  <th>Last Attempt</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="exam in filteredExams" :key="exam.id">
                  <td>
                    <div class="font-medium">{{ exam.title }}</div>
                    <div class="text-xs text-gray-400 mt-0.5">{{ exam.id }}</div>
                  </td>
                  <td><span class="pill pill-blue">👥 {{ exam.uniqueStudents }}</span></td>
                  <td><span class="pill pill-amber">✏️ {{ exam.totalAttempts }}</span></td>
                  <td>
                    <div class="score-bar-wrap">
                      <div class="score-bar-track">
                        <div class="score-bar-fill"
                          :class="exam.avgScore >= 80 ? 'bg-green-500' : exam.avgScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                          :style="{ width: exam.avgScore + '%' }"></div>
                      </div>
                      <span class="font-bold text-sm" :class="getScoreClass(exam.avgScore)">{{ exam.avgScore }}%</span>
                    </div>
                  </td>
                  <td><span class="font-bold text-sm" :class="getScoreClass(exam.highestScore)">{{ exam.highestScore }}%</span></td>
                  <td class="text-xs text-gray-500">{{ formatDate(exam.lastAttempt) }}</td>
                </tr>
                <tr v-if="filteredExams.length === 0">
                  <td colspan="6" class="empty-cell">No exams found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Attempts -->
        <div class="panel-card">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Latest attempt per student per exam</span>
            <select v-model="attemptsFilter" class="select-modern-sm">
              <option value="">All Exams</option>
              <option v-for="exam in exams" :key="exam.id" :value="exam.title">{{ exam.title }}</option>
            </select>
          </div>
          <div v-if="loadingMonitor" class="loading-state">
            <svg class="animate-spin h-6 w-6 mx-auto text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
          <div v-else class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green">
                <tr>
                  <th>Student</th>
                  <th>Exam</th>
                  <th>Latest Score</th>
                  <th>Avg Score</th>
                  <th>Attempts</th>
                  <th>Correct</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="attempt in filteredAttempts" :key="attempt.id">
                  <td>
                    <div class="user-cell">
                      <div class="avatar-sm">{{ getInitials(attempt.studentName) }}</div>
                      <span class="font-medium">{{ attempt.studentName }}</span>
                    </div>
                  </td>
                  <td class="max-w-[180px]"><p class="truncate font-medium text-gray-700">{{ attempt.examTitle }}</p></td>
                  <td>
                    <div class="score-bar-wrap">
                      <div class="score-bar-track score-bar-track-sm">
                        <div class="score-bar-fill"
                          :class="attempt.score >= 80 ? 'bg-green-500' : attempt.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                          :style="{ width: attempt.score + '%' }"></div>
                      </div>
                      <span class="font-bold" :class="getScoreClass(attempt.score)">{{ attempt.score }}%</span>
                    </div>
                  </td>
                  <td class="text-gray-500 text-sm">{{ attempt.studentAvgScore }}%</td>
                  <td><span class="pill pill-blue">🔁 {{ attempt.attemptCount }}×</span></td>
                  <td class="text-gray-600 text-sm">{{ attempt.correct_answers }}/{{ attempt.total_questions }}</td>
                  <td class="text-xs text-gray-400">{{ formatDate(attempt.date) }}</td>
                </tr>
                <tr v-if="filteredAttempts.length === 0">
                  <td colspan="7" class="empty-cell">No attempts recorded yet</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="filteredAttempts.length > 0" class="pagination-bar">
            <span class="page-info">Showing {{ filteredAttempts.length }} record{{ filteredAttempts.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </template>

      <!-- ══════════════════════════════════════════
           TAB 2: QUESTION BANK
      ══════════════════════════════════════════ -->
      <template v-if="activeTab === 'questions'">
        <div class="page-header-row" style="margin-bottom: 16px;">
          <div class="flex justify-between items-center w-full flex-wrap gap-3">
            <div>
              <h2 class="text-lg font-bold text-gray-900">Question Bank</h2>
              <p class="text-xs text-gray-500 mt-1">Manage all mock exam questions</p>
            </div>
            <button @click="openAddQuestionModal" class="add-btn">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Question
            </button>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stat-grid mb-5">
          <div class="mini-stat">
            <div class="mini-stat-value mini-stat-green">{{ allQuestions.length }}</div>
            <div class="mini-stat-label">Total Questions</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-value mini-stat-blue">{{ activeQCount }}</div>
            <div class="mini-stat-label">Active</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-value mini-stat-gray">{{ allQuestions.length - activeQCount }}</div>
            <div class="mini-stat-label">Inactive</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-value mini-stat-purple">{{ uniqueTopicCount }}</div>
            <div class="mini-stat-label">Topics Covered</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="panel-card mb-5">
          <div class="panel-header-bar filters-bar">
            <div class="filter-field">
              <label class="filter-label">Topic</label>
              <select v-model="qbTopicFilter" class="select-modern-sm" style="width: 210px;">
                <option value="">All Topics</option>
                <option v-for="t in allTopicOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div class="filter-field">
              <label class="filter-label">Status</label>
              <select v-model="qbStatusFilter" class="select-modern-sm">
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div class="filter-field">
              <label class="filter-label">Rows</label>
              <select v-model.number="qbPageSize" class="select-modern-sm">
                <option :value="10">10</option>
                <option :value="25">25</option>
                <option :value="50">50</option>
              </select>
            </div>
            <button @click="resetQbFilters" class="pg-btn">Reset</button>
            <button @click="fetchQuestions" class="pg-btn pg-btn-accent">↻ Refresh</button>
          </div>
        </div>

        <!-- Questions Table -->
        <div class="panel-card">
          <div class="panel-header-bar">
            <span class="text-sm text-gray-600">Showing {{ qbPaged.length }} of {{ qbFiltered.length }} questions</span>
          </div>
          <div v-if="loadingQuestions" class="loading-state">
            <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-emerald-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <p class="text-gray-500">Loading questions...</p>
          </div>
          <div v-else class="table-wrap">
            <table class="modern-table">
              <thead class="thead-green">
                <tr>
                  <th class="w-12">#</th>
                  <th>Question</th>
                  <th>Topics</th>
                  <th>Answer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(q, idx) in qbPaged" :key="q.id">
                  <td class="text-gray-400 text-xs">{{ (qbPage - 1) * qbPageSize + idx + 1 }}</td>
                  <td class="max-w-xs">
                    <div class="flex items-start gap-2">
                      <span v-if="q.symbol" class="text-xl shrink-0 leading-tight">{{ q.symbol }}</span>
                      <div>
                        <p class="font-medium text-gray-800 line-clamp-2">{{ q.stem_en }}</p>
                        <p class="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">{{ q.stem_tl }}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-wrap gap-1 max-w-xs">
                      <span v-for="t in getTopicArray(q.topic)" :key="t" class="pill pill-green">{{ getTopicLabel(t) }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="answer-badge">{{ String(q.correct_key || '').toUpperCase() }}</span>
                  </td>
                  <td>
                    <span class="pill" :class="q.is_active ? 'pill-green' : 'pill-gray'">{{ q.is_active ? 'Active' : 'Inactive' }}</span>
                  </td>
                  <td class="whitespace-nowrap">
                    <div class="action-btns">
                      <button @click="viewQuestion(q)" class="action-view">View</button>
                      <button @click="editQuestion(q)" class="action-edit">Edit</button>
                      <button @click="confirmDeleteQuestion(q)" class="action-delete">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="qbPaged.length === 0">
                  <td colspan="6" class="empty-cell">No questions found</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pagination-bar">
            <span class="page-info">Page {{ qbPage }} of {{ qbTotalPages }}</span>
            <div class="page-btns">
              <button @click="qbPage--" :disabled="qbPage <= 1" class="pg-btn" :class="{ 'pg-disabled': qbPage <= 1 }">← Prev</button>
              <button @click="qbPage++" :disabled="qbPage >= qbTotalPages" class="pg-btn" :class="{ 'pg-disabled': qbPage >= qbTotalPages }">Next →</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ══════════════════════════════════════════
         ADD / EDIT QUESTION MODAL
    ══════════════════════════════════════════ -->
    <transition name="modal-fade">
      <div v-if="showAddQuestionModal" class="modal-overlay" @click.self="closeAddQuestionModal">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg">
            <div class="modal-head modal-head-blue">
              <div>
                <h3 class="modal-title">{{ isEditingQuestion ? 'Edit Question' : 'Add New Question' }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">Fill in both English and Tagalog fields</p>
              </div>
              <button class="modal-close-btn" @click="closeAddQuestionModal">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="lang-tab-group">
              <button @click="modalLang = 'en'" :class="['lang-tab-btn', modalLang === 'en' ? 'lang-tab-active' : '']">🇺🇸 English</button>
              <button @click="modalLang = 'tl'" :class="['lang-tab-btn', modalLang === 'tl' ? 'lang-tab-active' : '']">🇵🇭 Tagalog</button>
            </div>

            <div class="modal-body modal-body-scroll">
              <!-- Topics Selection -->
              <div v-show="modalLang === 'en'" class="mb-5">
                <div class="flex justify-between items-center mb-2">
                  <label class="form-label">Topics * <span class="text-xs font-normal text-gray-400 ml-1">(select category first, then topics)</span></label>
                  <div class="space-x-2">
                    <button type="button" @click="selectAllTopics" class="text-xs text-emerald-600 hover:text-emerald-800 font-semibold">Select All</button>
                    <span class="text-gray-300">|</span>
                    <button type="button" @click="clearAllTopics" class="text-xs text-gray-500 hover:text-gray-700 font-semibold">Clear All</button>
                  </div>
                </div>

                <select v-model="selectedCategory" @change="onCategoryChange" class="form-input mb-3">
                  <option value="">-- Select a Category --</option>
                  <option v-for="group in TOPIC_GROUPS" :key="group.name" :value="group.name">{{ group.name }}</option>
                </select>

                <div v-if="selectedCategory" class="topic-panel">
                  <div class="topic-panel-header">
                    <div class="flex items-center">
                      <input type="checkbox" :id="'category-' + selectedCategory" :checked="areAllSelectedCategoryTopicsSelected" @change="toggleAllCategoryTopics" class="topic-checkbox" />
                      <label :for="'category-' + selectedCategory" class="ml-2 text-sm font-semibold text-emerald-700">{{ selectedCategory }}</label>
                    </div>
                    <span class="text-xs text-gray-400">{{ getSelectedCountInSelectedCategory }}/{{ getSelectedCategoryTopics.length }}</span>
                  </div>
                  <div class="topic-grid">
                    <div v-for="topicKey in getSelectedCategoryTopics" :key="topicKey" class="flex items-center">
                      <input type="checkbox" :id="'topic-' + topicKey" :value="topicKey" v-model="qForm.topics" class="topic-checkbox" />
                      <label :for="'topic-' + topicKey" class="ml-2 text-xs text-gray-700">{{ getTopicLabel(topicKey) }}</label>
                    </div>
                  </div>
                </div>
                <div v-else class="topic-panel-empty">
                  <p class="text-gray-400 text-sm">Please select a category first to view available topics</p>
                </div>

                <p v-if="qForm.topics.length === 0 && formError" class="text-xs text-red-500 mt-1">Please select at least one topic</p>
                <p class="text-xs text-gray-400 mt-2">Selected: <span class="font-semibold text-emerald-600">{{ qForm.topics.length }}</span> topic(s)</p>
              </div>

              <!-- Symbol -->
              <div v-show="modalLang === 'en'" class="mb-5">
                <label class="form-label">Symbol / Emoji <span class="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" v-model="qForm.symbol" placeholder="e.g. 🛑 or leave empty" class="form-input" />
              </div>

              <!-- Status toggle -->
              <div v-show="modalLang === 'en' && isEditingQuestion" class="mb-5">
                <label class="form-label">Status</label>
                <div class="flex gap-3">
                  <button type="button" @click="qForm.is_active = 1" class="toggle-btn" :class="qForm.is_active === 1 ? 'toggle-btn-active-green' : ''">✅ Active</button>
                  <button type="button" @click="qForm.is_active = 0" class="toggle-btn" :class="qForm.is_active === 0 ? 'toggle-btn-active-gray' : ''">🚫 Inactive</button>
                </div>
              </div>

              <!-- English fields -->
              <div v-show="modalLang === 'en'" class="lang-section lang-section-blue mb-5">
                <p class="lang-section-label">🇺🇸 English Content</p>
                <div class="mb-3">
                  <label class="form-label">Question (English) *</label>
                  <textarea v-model="qForm.stem_en" rows="3" placeholder="Type the question in English..." class="form-input"></textarea>
                </div>
                <div class="space-y-2 mb-3">
                  <div v-for="key in ['a','b','c']" :key="'en-'+key" class="flex items-start gap-2.5">
                    <div class="choice-badge" :class="qForm.correct_key === key ? 'choice-badge-active' : ''">{{ key.toUpperCase() }}</div>
                    <input type="text" v-model="qForm['choice_' + key + '_en']" :placeholder="`Choice ${key.toUpperCase()} in English`" class="form-input" :class="qForm.correct_key === key ? 'form-input-highlight' : ''" />
                  </div>
                </div>
                <div>
                  <label class="form-label">Rationale (English) <span class="text-gray-400 font-normal">(optional)</span></label>
                  <textarea v-model="qForm.rationale_en" rows="2" placeholder="Why is this the correct answer?" class="form-input"></textarea>
                </div>
              </div>

              <!-- Tagalog fields -->
              <div v-show="modalLang === 'tl'" class="lang-section lang-section-amber mb-5">
                <p class="lang-section-label lang-section-label-amber">🇵🇭 Tagalog Content</p>
                <div class="mb-3">
                  <label class="form-label">Tanong (Tagalog) *</label>
                  <textarea v-model="qForm.stem_tl" rows="3" placeholder="I-type ang tanong sa Tagalog..." class="form-input"></textarea>
                </div>
                <div class="space-y-2 mb-3">
                  <div v-for="key in ['a','b','c']" :key="'tl-'+key" class="flex items-start gap-2.5">
                    <div class="choice-badge" :class="qForm.correct_key === key ? 'choice-badge-active' : ''">{{ key.toUpperCase() }}</div>
                    <input type="text" v-model="qForm['choice_' + key + '_tl']" :placeholder="`Pagpipilian ${key.toUpperCase()} sa Tagalog`" class="form-input" :class="qForm.correct_key === key ? 'form-input-highlight' : ''" />
                  </div>
                </div>
                <div>
                  <label class="form-label">Paliwanag (Tagalog) <span class="text-gray-400 font-normal">(opsyonal)</span></label>
                  <textarea v-model="qForm.rationale_tl" rows="2" placeholder="Bakit ito ang tamang sagot?" class="form-input"></textarea>
                </div>
              </div>

              <!-- Correct Answer -->
              <div class="mb-5">
                <label class="form-label">Correct Answer *</label>
                <div class="flex gap-3">
                  <button v-for="key in ['a','b','c']" :key="'correct-'+key" type="button" @click="qForm.correct_key = key"
                    class="answer-select-btn" :class="qForm.correct_key === key ? 'answer-select-active' : ''">
                    {{ key.toUpperCase() }}<span v-if="qForm.correct_key === key" class="ml-1">✓</span>
                  </button>
                </div>
              </div>

              <div v-if="formError" class="error-box">{{ formError }}</div>
            </div>

            <div class="modal-foot modal-foot-between">
              <div class="text-xs text-gray-400">
                <span v-if="qForm.stem_en && qForm.stem_tl" class="text-emerald-600 font-semibold">✓ Both languages filled</span>
                <span v-else-if="qForm.stem_en || qForm.stem_tl" class="text-yellow-600 font-semibold">⚠ Fill both EN and TL</span>
                <span v-else>Fill in English and Tagalog content</span>
              </div>
              <div class="flex gap-2">
                <button @click="closeAddQuestionModal" class="btn-cancel">Cancel</button>
                <button @click="saveQuestion" :disabled="savingQuestion" class="btn-save btn-green">
                  {{ savingQuestion ? 'Saving...' : (isEditingQuestion ? 'Update' : 'Save Question') }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- VIEW QUESTION MODAL -->
    <transition name="modal-fade">
      <div v-if="showViewModal" class="modal-overlay" @click.self="showViewModal = false">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg">
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">Question #{{ viewingQuestion?.id }}</h3>
              <button class="modal-close-btn" @click="showViewModal = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body" v-if="viewingQuestion">
              <div class="flex flex-wrap gap-2 items-center mb-4">
                <div class="flex flex-wrap gap-1">
                  <span v-for="t in getTopicArray(viewingQuestion.topic)" :key="t" class="pill pill-green">{{ getTopicLabel(t) }}</span>
                </div>
                <span class="ml-auto pill" :class="viewingQuestion.is_active ? 'pill-green' : 'pill-gray'">{{ viewingQuestion.is_active ? 'Active' : 'Inactive' }}</span>
              </div>

              <div v-if="viewingQuestion.symbol" class="text-5xl text-center py-2 mb-2">{{ viewingQuestion.symbol }}</div>

              <div class="grid md:grid-cols-2 gap-4">
                <div class="lang-section lang-section-blue">
                  <p class="lang-section-label">🇺🇸 English</p>
                  <p class="font-semibold text-gray-800 mb-2">{{ viewingQuestion.stem_en }}</p>
                  <div class="space-y-1.5 mb-2">
                    <div v-for="key in ['a','b','c']" :key="key" class="flex items-center gap-2 text-sm">
                      <span class="choice-badge choice-badge-sm" :class="viewingQuestion.correct_key === key ? 'choice-badge-active' : ''">{{ key.toUpperCase() }}</span>
                      <span :class="viewingQuestion.correct_key === key ? 'font-semibold text-emerald-700' : 'text-gray-700'">{{ viewingQuestion['choice_' + key + '_en'] }}</span>
                    </div>
                  </div>
                  <div v-if="viewingQuestion.rationale_en" class="rationale-box">💡 {{ viewingQuestion.rationale_en }}</div>
                </div>
                <div class="lang-section lang-section-amber">
                  <p class="lang-section-label lang-section-label-amber">🇵🇭 Tagalog</p>
                  <p class="font-semibold text-gray-800 mb-2">{{ viewingQuestion.stem_tl }}</p>
                  <div class="space-y-1.5 mb-2">
                    <div v-for="key in ['a','b','c']" :key="key" class="flex items-center gap-2 text-sm">
                      <span class="choice-badge choice-badge-sm" :class="viewingQuestion.correct_key === key ? 'choice-badge-active' : ''">{{ key.toUpperCase() }}</span>
                      <span :class="viewingQuestion.correct_key === key ? 'font-semibold text-emerald-700' : 'text-gray-700'">{{ viewingQuestion['choice_' + key + '_tl'] }}</span>
                    </div>
                  </div>
                  <div v-if="viewingQuestion.rationale_tl" class="rationale-box">💡 {{ viewingQuestion.rationale_tl }}</div>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="editQuestion(viewingQuestion); showViewModal = false" class="btn-save btn-amber">Edit</button>
              <button @click="showViewModal = false" class="btn-cancel">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- DELETE CONFIRM MODAL -->
    <transition name="modal-fade">
      <div v-if="showDeleteQModal" class="modal-overlay" @click.self="showDeleteQModal = false">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head-delete">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Delete Question</h3>
                  <p class="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm text-gray-700 leading-relaxed">
                Permanently delete question <span class="font-semibold text-gray-900">#{{ questionToDelete?.id }}</span>. This cannot be undone.
              </p>
              <div class="mt-6 flex justify-end gap-3">
                <button @click="showDeleteQModal = false" class="btn-cancel">Cancel</button>
                <button @click="deleteQuestion" :disabled="deletingQuestion" class="btn-save btn-red flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {{ deletingQuestion ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- SUCCESS/ERROR NOTIFICATION MODAL -->
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
                    type="button"
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
  </AdminLayout>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import AdminLayout from './AdminLayout.vue'
import axios from 'axios'
import { API_URL } from "../../config/api"

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
   const api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    })

    const activeTab = ref('monitor')
    const searchQuery = ref('')

    // ── MONITOR ───────────────────────────────────────────────
    const exams = ref([])
    const recentAttempts = ref([])
    const loadingMonitor = ref(true)
    const attemptsFilter = ref('')
    const examStats = reactive({ totalExams: 0, totalStudents: 0, totalAttempts: 0, averageScore: 0 })

    const getParentExamId = (examId) => {
  return String(examId || "").includes("||")
    ? String(examId).split("||")[0]
    : String(examId || "");
};

const getParentExamTitle = (title) => {
  return String(title || "").includes("||")
    ? String(title).split("||")[0]
    : String(title || "");
};

const fetchMonitor = async () => {
  loadingMonitor.value = true;

  try {
    const [attemptsRes] = await Promise.all([
      api.get("/admin/mock-exam/recent-attempts"),
    ]);

    const rawAttempts = attemptsRes.data?.data || [];

    const attemptMap = {};

    rawAttempts.forEach((a) => {
      const parentId = getParentExamId(a.examId || a.exam_id);
      if (!parentId) return;

      const studentKey = a.studentId || a.student_id || a.user_id || a.studentName;
      const key = `${studentKey}-${parentId}`;

      if (!attemptMap[key] || new Date(a.date) > new Date(attemptMap[key].date)) {
        attemptMap[key] = {
          ...a,
          examId: parentId,
          examTitle: getParentExamTitle(a.examTitle || a.exam_title),
          score: Number(a.score || 0),
        };
      }
    });

    const latestAttempts = Object.values(attemptMap);
    recentAttempts.value = latestAttempts;

    const examMap = {};

    latestAttempts.forEach((a) => {
      const parentId = a.examId;
      const title = a.examTitle || parentId;

      if (!examMap[parentId]) {
        examMap[parentId] = {
          id: parentId,
          title,
          students: new Set(),
          scores: [],
          highestScore: 0,
          lastAttempt: null,
        };
      }

      const studentKey = a.studentId || a.student_id || a.user_id || a.studentName;
      const score = Number(a.score || 0);

      examMap[parentId].students.add(studentKey);
      examMap[parentId].scores.push(score);
      examMap[parentId].highestScore = Math.max(examMap[parentId].highestScore, score);

      if (
        a.date &&
        (!examMap[parentId].lastAttempt ||
          new Date(a.date) > new Date(examMap[parentId].lastAttempt))
      ) {
        examMap[parentId].lastAttempt = a.date;
      }
    });

    exams.value = Object.values(examMap).map((e) => ({
      id: e.id,
      title: e.title,
      totalAttempts: e.scores.length,
      uniqueStudents: e.students.size,
      avgScore: e.scores.length
        ? Math.round(e.scores.reduce((sum, score) => sum + score, 0) / e.scores.length)
        : 0,
      highestScore: e.highestScore,
      lastAttempt: e.lastAttempt,
    }));

    const allStudents = new Set(
      latestAttempts.map((a) => a.studentId || a.student_id || a.user_id || a.studentName)
    );

    const allScores = latestAttempts.map((a) => Number(a.score || 0));

    examStats.totalExams = exams.value.length;
    examStats.totalStudents = allStudents.size;
    examStats.totalAttempts = latestAttempts.length;
    examStats.averageScore = allScores.length
      ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
      : 0;

  } catch (err) {
    console.error("fetchMonitor error:", err);
  } finally {
    loadingMonitor.value = false;
  }
};

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
        const deletedId = questionToDelete.value.id
        await api.delete(`/admin/mock-exam/questions/${questionToDelete.value.id}`)
        showDeleteQModal.value = false;
        questionToDelete.value = null
        await fetchQuestions()
        showMessage('Question Deleted', `Question #${deletedId} was removed successfully.`, 'success')
      } catch (e) {
        showMessage('Error', e.response?.data?.message || 'Failed to delete question.', 'error')
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
    const messageOpen = ref(false)
    const messageTitle = ref('')
    const messageText = ref('')
    const messageType = ref('success') // 'success' | 'error'

    const showMessage = (title, text, type = 'success') => {
      messageTitle.value = title
      messageText.value = text
      messageType.value = type
      messageOpen.value = true
    }

    const closeMessage = () => {
      messageOpen.value = false
    }

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

        const wasEditing = isEditingQuestion.value

        if (wasEditing) {
          await api.put(`/admin/mock-exam/questions/${editingQuestionId.value}`, payload)
        } else {
          await api.post('/admin/mock-exam/questions', payload)
        }

        closeAddQuestionModal()
        await fetchQuestions()
        showMessage(
          'Changes Saved!',
          wasEditing ? 'Question updated successfully.' : 'Question added successfully.',
          'success'
        )
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

      messageOpen, messageTitle, messageText, messageType, showMessage, closeMessage,
    }
  }
}
</script>

<style scoped>
/* ========== PAGE HEADER ========== */
.page-header-row { margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

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

/* ========== STATS ========== */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; }
.stat-card-inner { display: flex; justify-content: space-between; align-items: flex-start; }
.stat-value { font-size: 1.75rem; font-weight: 700; line-height: 1; display: block; }
.stat-value-green { color: #059669; }
.stat-value-blue { color: #2563eb; }
.stat-value-amber { color: #d97706; }
.stat-value-purple { color: #7c3aed; }
.stat-label { font-size: 0.82rem; font-weight: 600; color: #374151; margin-top: 6px; }
.stat-meta { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; }
.stat-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon-green { background: #d1fae5; color: #059669; }
.stat-icon-blue { background: #dbeafe; color: #2563eb; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-purple { background: #ede9fe; color: #7c3aed; }

.mini-stat { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; text-align: center; }
.mini-stat-value { font-size: 1.5rem; font-weight: 700; }
.mini-stat-green { color: #059669; }
.mini-stat-blue { color: #2563eb; }
.mini-stat-gray { color: #6b7280; }
.mini-stat-purple { color: #7c3aed; }
.mini-stat-label { font-size: 0.72rem; color: #9ca3af; margin-top: 4px; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.filters-bar { align-items: flex-end; gap: 14px; }
.filter-field { display: flex; flex-direction: column; gap: 4px; }
.filter-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.03em; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.thead-blue th { background: #3b82f6; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.loading-state { text-align: center; padding: 40px; color: #9ca3af; }

/* ========== PILLS & BADGES ========== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-gray { background: #f3f4f6; color: #6b7280; }
.answer-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #10b981; color: #fff; font-size: 0.75rem; font-weight: 700; }

/* ========== SCORE BAR ========== */
.score-bar-wrap { display: flex; align-items: center; gap: 8px; }
.score-bar-track { width: 64px; height: 6px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.score-bar-track-sm { width: 48px; }
.score-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }

/* ========== USER CELL ========== */
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; background: #d1fae5; color: #047857; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }

/* ========== ACTION BUTTONS ========== */
.action-btns { display: flex; gap: 6px; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #6366f1; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #4f46e5; }
.action-edit { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #3b82f6; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-edit:hover { background: #2563eb; }
.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-delete:hover { background: #dc2626; }

/* ========== ADD BUTTON ========== */
.add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
.add-btn:hover { background: #059669; transform: translateY(-1px); }

/* ========== BUTTONS (generic) ========== */
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-btn-accent { background: #10b981; color: #fff; border-color: #10b981; }
.pg-btn-accent:hover { background: #059669; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
.page-btns { display: flex; align-items: center; gap: 6px; }

/* ========== MODAL ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-sm { max-width: 420px; }
.modal-card-lg { max-width: 720px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.modal-head-green { background: #f0fdf4; }
.modal-head-blue { background: #eff6ff; }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-body { padding: 20px; }
.modal-body-scroll { overflow-y: auto; flex: 1; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; flex-shrink: 0; }
.modal-foot-between { justify-content: space-between; align-items: center; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }

.lang-tab-group { display: flex; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-shrink: 0; }
.lang-tab-btn { flex: 1; padding: 12px; font-size: 0.85rem; font-weight: 600; border-bottom: 2px solid transparent; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.lang-tab-btn:hover { color: #374151; }
.lang-tab-active { border-bottom-color: #10b981; color: #059669; background: #fff; }
/* ========== MODERN SELECT / DROPDOWN ========== */
.select-modern-sm,
select.form-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: auto;
  padding: 9px 36px 9px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background-color: #fff;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}

select.form-input {
  width: 100%;
  font-weight: 500;
  font-size: 0.85rem;
}

.select-modern-sm:hover,
select.form-input:hover {
  border-color: #a7f3d0;
}

.select-modern-sm:focus,
select.form-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  background-color: #f0fdf4;
}

.select-modern-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* fixes native dropdown arrow duplication in IE/Edge legacy */
.select-modern-sm::-ms-expand,
select.form-input::-ms-expand {
  display: none;
}

/* ========== FORM ========== */
.form-label { display: block; font-size: 0.75rem; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; resize: none; }
.form-input:focus { border-color: #10b981; }
.form-input-highlight { border-color: #10b981; background: #f0fdf4; }

/* ========== TOPIC PANEL ========== */
.topic-panel { border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; padding: 16px; }
.topic-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
.topic-panel-empty { border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb; padding: 32px; text-align: center; }
.topic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-left: 8px; }
.topic-checkbox { width: 16px; height: 16px; accent-color: #10b981; }

/* ========== LANG SECTIONS ========== */
.lang-section { border-radius: 12px; padding: 16px; }
.lang-section-blue { background: #eff6ff; border: 1px solid #dbeafe; }
.lang-section-amber { background: #fffbeb; border: 1px solid #fef3c7; }
.lang-section-label { font-size: 0.7rem; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; }
.lang-section-label-amber { color: #d97706; }
.rationale-box { font-size: 0.75rem; color: #6b7280; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; }

/* ========== CHOICE / ANSWER BUTTONS ========== */
.choice-badge { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; background: #e5e7eb; color: #6b7280; flex-shrink: 0; margin-top: 2px; }
.choice-badge-sm { width: 24px; height: 24px; margin-top: 0; }
.choice-badge-active { background: #10b981; color: #fff; }
.answer-select-btn { flex: 1; padding: 10px; border-radius: 10px; border: 2px solid #e5e7eb; font-size: 0.85rem; font-weight: 700; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.answer-select-btn:hover { border-color: #10b981; color: #059669; }
.answer-select-active { background: #10b981; border-color: #10b981; color: #fff; }
.toggle-btn { flex: 1; padding: 9px; border-radius: 10px; border: 2px solid #e5e7eb; font-size: 0.85rem; font-weight: 600; background: #fff; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.toggle-btn:hover { border-color: #10b981; }
.toggle-btn-active-green { background: #10b981; border-color: #10b981; color: #fff; }
.toggle-btn-active-gray { background: #6b7280; border-color: #6b7280; color: #fff; }

/* ========== ERROR BOX ========== */
.error-box { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; padding: 12px 14px; font-size: 0.85rem; color: #dc2626; }

/* ========== BUTTONS (footer) ========== */
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.btn-blue { background: #3b82f6; }
.btn-blue:hover:not(:disabled) { background: #2563eb; }
.btn-amber { background: #f59e0b; }
.btn-amber:hover:not(:disabled) { background: #d97706; }
.btn-red { background: #ef4444; }
.btn-red:hover:not(:disabled) { background: #dc2626; }

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
  .topic-grid { grid-template-columns: 1fr; }
}
</style>