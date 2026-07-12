<template>
  <StudentLayout active-page="student-quiz">
    <!-- Header -->
    <template #header-left>
      <div class="search-box">
        <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search quizzes..."
          v-model="searchQuery"
          class="search-input-modern"
        />
      </div>
    </template>

    <div>
      <!-- Page Header -->
      <div class="page-header-row mb-5">
        <div>
          <h2 class="page-title">Mock Exams</h2>
          <p class="page-subtitle">Practice, track your progress, and master every topic</p>
        </div>

        <!-- Language + Tutorial -->
        <div class="lang-tutorial-row">
          <select v-model="currentLanguage" @change="updateUserLanguage" class="select-modern-sm">
            <option value="en">🇺🇸 English</option>
            <option value="tl">🇵🇭 Tagalog</option>
          </select>
          <button @click="showTutorialModal = true" class="pg-btn">❓ Tutorial</button>
        </div>
      </div>

      <!-- TOP ROW: Welcome + Weakness Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <!-- Welcome Section -->
        <section class="panel-card welcome-card">
          <div class="panel-header-bar">
            <h3 class="card-title">
              {{ hasTakenExams ? '📊 Welcome Back!' : '🎉 Welcome to Mock Exams!' }}
            </h3>
          </div>

          <div class="welcome-body">
            <p class="text-sm text-gray-500">
              {{ hasTakenExams
                ? 'Continue your journey. Take the comprehensive exam again or practice specific topics below.'
                : 'Take the initial assessment to identify your strengths and areas for improvement.'
              }}
            </p>

            <div class="flex flex-col gap-2">
              <button @click="startInitialExam" :disabled="loading" class="btn-save btn-green btn-block">
                <div v-if="loading" class="spinner-sm"></div>
                <span v-else>📝</span>
                {{ loading ? 'Loading...' : (hasTakenExams ? 'Take Comprehensive Assessment Again' : 'Start Initial Assessment') }}
              </button>
              <button v-if="hasTakenExams" @click="scrollToQuizzes" class="btn-save btn-blue btn-block">
                📚 Browse Topic Quizzes
              </button>
            </div>

            <div class="flex-1"></div>

            <div v-if="hasTakenExams" class="welcome-stats">
              <div class="mini-stat">
                <div class="mini-stat-value mini-stat-green">{{ uniqueExamsTaken }}</div>
                <div class="mini-stat-label">Quizzes Taken</div>
              </div>
              <div class="mini-stat">
                <div class="mini-stat-value mini-stat-blue">{{ overallAvgScore }}%</div>
                <div class="mini-stat-label">Avg Best Score</div>
              </div>
              <div class="mini-stat">
                <div class="mini-stat-value mini-stat-purple">{{ passedQuizCount }}</div>
                <div class="mini-stat-label">Passed</div>
              </div>
            </div>
            <div v-if="!hasTakenExams" class="welcome-empty">
              <p class="text-xs text-gray-400">Your stats will appear here after completing your first quiz.</p>
            </div>
          </div>
        </section>

        <!-- Weakness Analysis Panel -->
        <section class="panel-card weakness-card">
          <div class="panel-header-bar weakness-header-bar">
            <div>
              <h3 class="card-title card-title-amber">🔍 Weakness Analysis</h3>
              <p class="text-xs text-gray-500 mt-0.5">Your weak spots — questions to review and retake</p>
            </div>
            <div v-if="hasTakenExams && allWeaknessGroups.length > 0" class="text-right shrink-0 ml-3">
              <div class="text-2xl font-extrabold text-red-500 leading-none">{{ totalWeakCount }}</div>
              <div class="text-xs text-gray-400 mt-0.5">issues left</div>
            </div>
          </div>

          <div v-if="!hasTakenExams" class="weakness-empty-state">
            <div class="text-center text-gray-400">
              <div class="text-5xl mb-3">📝</div>
              <p class="text-sm font-medium">No quizzes taken yet</p>
              <p class="text-xs mt-1">Take a quiz to see your weakness analysis here.</p>
            </div>
          </div>

          <div v-else-if="allWeaknessGroups.length === 0" class="weakness-empty-state">
            <div class="text-center">
              <div class="text-5xl mb-3">🎉</div>
              <p class="text-sm font-bold text-emerald-600">All questions answered correctly!</p>
              <p class="text-xs mt-1 text-gray-400">No weaknesses detected across all your quizzes.</p>
            </div>
          </div>

          <!-- NOTE: scrollbar behavior/classes intentionally unchanged, even with many quizzes -->
          <div v-else class="weakness-list weakness-scrollbar">
            <div v-for="group in allWeaknessGroups" :key="group.quizId" class="weakness-group">
              <div class="weakness-group-head">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
                  <span class="font-bold text-orange-800 text-sm truncate">{{ group.quizTitle }}</span>
                </div>
                <span class="weakness-count-badge">{{ group.totalWrong }}</span>
              </div>
              <div class="divide-y divide-gray-100 bg-white">
                <div v-for="sub in group.subcategories" :key="sub.name" class="weakness-sub-row">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-gray-700 truncate">{{ sub.name }}</span>
                      <span class="shrink-0 text-xs bg-red-50 text-red-500 border border-red-200 rounded-full px-1.5 leading-5 font-bold">{{ sub.questions.length }}</span>
                    </div>
                    <div class="score-bar-track score-bar-track-weakness mt-1.5">
                      <div class="score-bar-fill bg-gradient-orange"
                        :style="{ width: Math.min((sub.questions.length / group.totalWrong) * 100, 100) + '%' }"></div>
                    </div>
                  </div>
                  <button @click="retakeSubcategory(sub.questions, sub.name, group.quizId, group.quizTitle)"
                    class="retake-btn" :disabled="loading">
                    🔁 Retake
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="allWeaknessGroups.length > 2" class="weakness-scroll-hint">
            ⬇️ scroll for more
          </div>
        </section>
      </div>

      <!-- AI Recommendation -->
      <section v-if="hasTakenExams && weaknessAnalysis.length > 0" class="panel-card mb-5">
        <div class="panel-header-bar">
          <h3 class="card-title">📊 AI-Powered Performance Analysis</h3>
        </div>
        <div class="panel-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="analysis-box">
              <h4 class="analysis-box-title">Performance by Topic</h4>
              <div class="space-y-3">
                <div v-for="item in weaknessAnalysis" :key="item.category">
                  <div class="flex justify-between mb-1 text-sm">
                    <span class="font-medium text-gray-700">{{ item.category }}</span>
                    <span :class="getScoreColorClass(item.score)" class="font-bold">{{ item.score }}%</span>
                  </div>
                  <div class="score-bar-track score-bar-track-full">
                    <div class="score-bar-fill"
                      :class="item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'"
                      :style="{ width: item.score + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="analysis-box analysis-box-green">
              <h4 class="analysis-box-title analysis-box-title-green">AI Recommendations</h4>
              <ul class="space-y-1.5 mb-4">
                <li v-for="r in aiRecommendations" :key="r.id" class="flex items-start gap-2 text-sm">
                  <span class="text-red-500 mt-0.5">•</span>{{ r.title }}
                </li>
              </ul>
              <button @click="startRecommendedExam" :disabled="loading" class="btn-save btn-green btn-block">
                Start AI-Recommended Practice
              </button>
            </div>
          </div>
          <div v-if="aiSummary" class="analysis-summary-box">
            <h4 class="analysis-summary-title">AI Analysis Summary</h4>
            <p class="text-sm text-gray-700">{{ aiSummary }}</p>
          </div>
        </div>
      </section>

      <!-- Quizzes Table -->
      <section class="panel-card mb-5 quizzes-section">
        <div class="panel-header-bar">
          <span class="text-sm text-gray-600">Showing {{ filteredQuizzes.length }} quizzes</span>
        </div>
        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Quiz Title</th>
                <th>Course</th>
                <th>Best Score</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="quiz in filteredQuizzes" :key="quiz.id">
                <td class="font-medium">{{ quiz.title }}</td>
                <td class="text-gray-500">{{ quiz.course_name || 'General' }}</td>
                <td>
                  <div class="score-bar-wrap">
                    <div class="score-bar-track">
                      <div class="score-bar-fill"
                        :class="getCumulativeScoreForQuiz(quiz.id) >= 80 ? 'bg-green-500' : getCumulativeScoreForQuiz(quiz.id) >= 60 ? 'bg-yellow-400' : 'bg-red-400'"
                        :style="{ width: getCumulativeScoreForQuiz(quiz.id) + '%' }"></div>
                    </div>
                    <span class="font-bold text-sm" :class="getScoreColorClass(getCumulativeScoreForQuiz(quiz.id))">{{ getCumulativeScoreForQuiz(quiz.id) }}%</span>
                  </div>
                </td>
                <td><span class="pill" :class="getStatusPillClass(quiz.id)">{{ getExamStatus(quiz.id) }}</span></td>
                <td>
                  <button @click="takeExam(quiz.id)" :disabled="loading" class="pg-btn" :class="getButtonPillClass(quiz.id)">
                    {{ getButtonText(quiz.id) }}
                  </button>
                </td>
              </tr>
              <tr v-if="availableQuizzes.length === 0 && !loading">
                <td colspan="5" class="empty-cell">No quizzes available.</td>
              </tr>
              <tr v-if="loading">
                <td colspan="5" class="loading-state"><div class="spinner-md mx-auto"></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Results Table -->
      <section class="panel-card">
        <div class="panel-header-bar">
          <span class="text-sm text-gray-600">Recent Quiz Results — {{ latestResultsPerQuiz.length }} quiz{{ latestResultsPerQuiz.length !== 1 ? 'zes' : '' }}</span>
          <button v-if="examResults.length > 0" @click="confirmClearAllResults" class="pg-btn pg-btn-danger">🗑️ Clear All</button>
        </div>
        <div class="table-wrap">
          <table class="modern-table">
            <thead class="thead-green">
              <tr>
                <th>Quiz Title</th>
                <th>Last Taken</th>
                <th>Best Score</th>
                <th>Attempts</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in latestResultsPerQuiz" :key="result._raw_id || result.exam_id">
                <td>
                  <div class="font-medium text-gray-800">{{ result.exam_title.split('||')[0] }}</div>
                  <div v-if="result.exam_title.includes('||')" class="text-xs text-orange-500 font-semibold mt-0.5">
                    🔁 {{ result.exam_title.split('||')[1] }}
                  </div>
                </td>
                <td class="text-gray-500">{{ formatDate(result.completed_at) }}</td>
                <td class="font-bold" :class="getScoreColorClass(result.bestScore)">{{ result.bestScore }}%</td>
                <td class="text-gray-500">{{ getOrdinal(result.attempts) }}</td>
                <td><span class="pill" :class="getRemarksPillClass(result.bestScore)">{{ getRemarks(result.bestScore) }}</span></td>
                <td>
                  <!-- View button + Review modal logic below are unchanged; only colors adapt -->
                  <div class="action-btns">
                    <button @click="reviewExam(result.latestAttempt)" class="action-view">View</button>
                    <button @click="confirmDeleteQuizResults(result.exam_id, result.exam_title, result._raw_id, result.isRetake)" class="action-delete">🗑️ Delete</button>
                  </div>
                </td>
              </tr>
              <tr v-if="examResults.length === 0 && !loading">
                <td colspan="6" class="empty-cell">No exam results yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="examResults.length > 0" class="pagination-bar">
          <span class="page-info">Total attempts: {{ examResults.length }}</span>
        </div>
      </section>
    </div>

    <!-- Delete Confirmation Modal -->
    <transition name="modal-fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head-delete">
              <div class="flex items-center gap-3">
                <div class="warning-icon-circle warning-icon-circle-red">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                  <p class="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm text-gray-700 leading-relaxed">{{ deleteMessage }}</p>
              <div class="mt-6 flex justify-end gap-3">
                <button @click="showDeleteModal = false" class="btn-cancel">Cancel</button>
                <button @click="executeDelete" class="btn-save btn-red">Delete</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Tutorial Modal -->
    <transition name="modal-fade">
      <div v-if="showTutorialModal" class="modal-overlay" @click.self="showTutorialModal = false">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg">
            <div class="modal-head modal-head-green">
              <h3 class="modal-title">❓ How This Works</h3>
              <button class="modal-close-btn" @click="showTutorialModal = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <ol class="list-decimal pl-5 space-y-2.5 text-sm text-gray-700">
                <li>Click <strong>Start Initial Assessment</strong> to take your first exam.</li>
                <li>After each quiz, the <strong>Weakness Analysis</strong> panel auto-updates with your incorrect/unanswered questions.</li>
                <li>Each quiz = main category. Wrong questions are grouped into <strong>subcategories by topic</strong>.</li>
                <li>Click <strong>🔁 Retake</strong> on any subcategory to practice <em>only those specific wrong questions</em>.</li>
                <li>When you answer a question correctly in a retake, it is <strong>removed from the weakness list</strong>.</li>
                <li>The score accumulates — it won't reach 100% until <em>all</em> questions are answered correctly.</li>
                <li>Use the <strong>🗑️ Delete</strong> buttons to remove results from Recent Quiz.</li>
              </ol>
            </div>
            <div class="modal-foot">
              <button @click="showTutorialModal = false" class="btn-save btn-green">Got it!</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Exam Modal -->
    <div v-if="showExamModal" class="modal-overlay exam-overlay">
      <div class="exam-modal-card">
        <div class="exam-modal-head">
          <div class="min-w-0">
            <h3 class="font-bold text-base leading-tight truncate">{{ currentExam?.title }}</h3>
            <span v-if="retakeLabel" class="retake-chip">
              🔁 {{ retakeLabel }}
            </span>
          </div>
          <div class="flex items-center gap-4 shrink-0 ml-4">
            <div class="timer-badge">
              <span class="text-xs text-white/70">⏱</span>
              <span class="font-mono font-bold text-sm" :class="timeRemaining < 300 ? 'text-red-300' : 'text-white'">{{ formattedTime }}</span>
            </div>
            <button @click="closeExamModal" class="exit-btn">✕ Exit</button>
          </div>
        </div>

        <div class="bg-gray-100 shrink-0">
          <div class="flex justify-between items-center px-6 py-2 text-xs text-gray-500">
            <span>Question {{ currentQuestionIndex + 1 }} of {{ currentQuestions.length }}</span>
            <span>{{ answeredCount }} answered</span>
          </div>
          <div class="h-1.5 bg-gray-200">
            <div class="h-full bg-emerald-500 transition-all duration-300" :style="{ width: progressWidth }"></div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5">
          <div v-if="currentQuestion" class="fade-in">
            <div v-if="currentQuestion.symbol" class="mb-5 flex justify-center">
              <div class="symbol-box">
                {{ currentQuestion.symbol }}
              </div>
            </div>
            <p class="text-gray-800 font-semibold text-base mb-5 leading-relaxed">
              {{ currentQuestionIndex + 1 }}. {{ getLocalizedText(currentQuestion.stem) }}
            </p>
            <div class="space-y-2.5">
              <label v-for="choice in currentQuestion.choices" :key="choice.key"
                :for="`opt-${currentQuestionIndex}-${choice.key}`"
                class="choice-option"
                :class="userAnswers[currentQuestionIndex] === choice.key.toUpperCase() ? 'choice-option-active' : ''">
                <input type="radio"
                  :id="`opt-${currentQuestionIndex}-${choice.key}`"
                  :name="`ans-${currentQuestionIndex}`"
                  :value="choice.key.toUpperCase()"
                  :checked="userAnswers[currentQuestionIndex] === choice.key.toUpperCase()"
                  @change="selectAnswer(currentQuestionIndex, choice.key.toUpperCase())"
                  class="mt-0.5 h-4 w-4 text-emerald-600 border-gray-300 shrink-0">
                <span class="text-sm text-gray-700 leading-relaxed">
                  <span class="font-bold text-gray-800">{{ choice.key.toUpperCase() }}.</span>
                  {{ getLocalizedText(choice) }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="exam-modal-foot">
          <button @click="previousQuestion" :disabled="currentQuestionIndex === 0" class="pg-btn" :class="{ 'pg-disabled': currentQuestionIndex === 0 }">
            ← Previous
          </button>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">
              Question {{ currentQuestionIndex + 1 }} of {{ currentQuestions.length }}
              <span v-if="skippedQuestions.length > 0" class="ml-2 text-orange-500">({{ skippedQuestions.length }} skipped)</span>
            </span>
            <div class="hidden sm:flex items-center gap-1 ml-2">
              <div v-for="(_, i) in Math.min(currentQuestions.length, 10)" :key="i"
                class="w-2 h-2 rounded-full transition-all"
                :class="i === currentQuestionIndex ? 'bg-emerald-600 w-3'
                  : userAnswers[i] ? 'bg-emerald-400'
                  : skippedIndices.has(i) ? 'bg-orange-400'
                  : 'bg-gray-300'"></div>
              <span v-if="currentQuestions.length > 10" class="text-xs text-gray-400 ml-1">…</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button v-if="!userAnswers[currentQuestionIndex]" @click="skipQuestion" class="pg-btn pg-btn-amber">
              ⏭️ Skip
            </button>
            <button v-else-if="currentQuestionIndex < currentQuestions.length - 1" @click="nextQuestion" class="pg-btn pg-btn-accent">
              Next →
            </button>
            <button v-else-if="currentQuestionIndex === currentQuestions.length - 1 && skippedQuestions.length === 0" @click="submitExam" class="pg-btn pg-btn-info">
              ✅ Submit
            </button>
            <button v-else-if="currentQuestionIndex === currentQuestions.length - 1 && skippedQuestions.length > 0" @click="nextQuestion" class="pg-btn pg-btn-accent">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Exit Exam Warning Modal (replaces window.confirm) -->
    <transition name="modal-fade">
      <div v-if="showExitConfirmModal" class="modal-overlay" @click.self="cancelExitExam">
        <transition name="modal-scale">
          <div class="modal-card modal-card-sm">
            <div class="modal-head-delete">
              <div class="flex items-center gap-3">
                <div class="warning-icon-circle">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Exit Exam?</h3>
                  <p class="text-sm text-gray-500">Your progress will be lost</p>
                </div>
              </div>
            </div>
            <div class="modal-body-delete">
              <p class="text-sm text-gray-700 leading-relaxed">
                Are you sure you want to exit <span class="font-semibold text-gray-900">{{ currentExam?.title }}</span>? Any unsaved answers will not be recorded.
              </p>
              <div class="mt-6 flex justify-end gap-3">
                <button @click="cancelExitExam" class="btn-cancel">Keep Going</button>
                <button @click="confirmExitExam" class="btn-save btn-red">Exit Exam</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Exam Results Modal -->
    <transition name="modal-fade">
      <div v-if="showResultsModal" class="modal-overlay" @click.self="showResultsModal = false">
        <transition name="modal-scale">
          <div class="modal-card results-modal-card">
            <div class="modal-head results-modal-head">
              <div>
                <h3 class="text-white font-bold text-base">{{ retakeLabel ? '🔁 Retake Results' : '📊 Exam Results' }}</h3>
                <p v-if="retakeLabel" class="text-emerald-100 text-xs mt-0.5">{{ retakeLabel }}</p>
              </div>
              <button @click="showResultsModal = false" class="modal-close-btn modal-close-btn-light">&times;</button>
            </div>
            <div class="modal-body">
              <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-28 h-28 rounded-full border-8 mb-3"
                  :class="currentScore >= 80 ? 'border-green-400 bg-green-50' : currentScore >= 60 ? 'border-yellow-400 bg-yellow-50' : 'border-red-400 bg-red-50'">
                  <div>
                    <div class="text-3xl font-extrabold" :class="getScoreColorClass(currentScore)">{{ currentScore }}%</div>
                  </div>
                </div>
                <p class="text-gray-700 font-semibold">{{ getResultMessage(currentScore) }}</p>
                <p v-if="retakeLabel" class="text-xs text-orange-500 mt-1">
                  {{ currentQuestions.length }} questions retaken from <em>{{ retakeLabel }}</em>
                </p>
              </div>
              <div class="mb-5">
                <h4 class="font-bold text-gray-700 mb-3 text-sm">Performance by Topic</h4>
                <div class="space-y-2.5">
                  <div v-for="item in currentWeaknessAnalysis" :key="item.category" class="analysis-box">
                    <div class="flex justify-between text-sm mb-1.5">
                      <span class="font-semibold text-gray-700">{{ item.category }}</span>
                      <span class="font-bold" :class="getScoreColorClass(item.score)">{{ item.score }}%</span>
                    </div>
                    <div class="score-bar-track score-bar-track-full">
                      <div class="score-bar-fill"
                        :class="item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-400' : 'bg-red-500'"
                        :style="{ width: item.score + '%' }"></div>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ item.correct_answers }} / {{ item.total_questions }} correct</p>
                  </div>
                </div>
              </div>
              <div v-if="currentRecommendation" class="analysis-summary-box">
                <h4 class="analysis-summary-title">💡 Recommendation</h4>
                <p class="text-sm text-gray-700">{{ currentRecommendation }}</p>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="showResultsModal = false" class="btn-save btn-green">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- Review Exam Modal — logic/markup unchanged, only color classes adapted -->
    <transition name="modal-fade">
      <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
        <transition name="modal-scale">
          <div class="modal-card modal-card-lg review-modal-card">
            <div class="modal-head modal-head-green">
              <div class="min-w-0">
                <h3 class="modal-title truncate">📋 Review: {{ currentReviewAttempt?.exam_title }}</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  Score: {{ currentReviewAttempt?.score }}% · {{ currentReviewAttempt?.correct_answers }}/{{ currentReviewAttempt?.total_questions }} correct
                </p>
              </div>
              <button class="modal-close-btn" @click="showReviewModal = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body space-y-4">
              <div v-for="(question, index) in currentQuestions" :key="question.id || index"
                class="rounded-xl border-2 overflow-hidden"
                :class="isReviewCorrect(index) ? 'border-green-300' : 'border-red-300'">
                <div class="flex items-center justify-between px-4 py-2.5"
                  :class="isReviewCorrect(index) ? 'bg-green-50' : 'bg-red-50'">
                  <span class="font-bold text-sm text-gray-700">Q{{ index + 1 }}</span>
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    :class="isReviewCorrect(index) ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'">
                    {{ isReviewCorrect(index) ? '✓ Correct' : '✗ Incorrect' }}
                  </span>
                </div>
                <div class="p-4 bg-white">
                  <div v-if="question.symbol" class="mb-3 flex justify-center">
                    <div class="bg-gray-50 border border-gray-200 rounded-xl px-6 py-3 text-4xl shadow-sm">{{ question.symbol }}</div>
                  </div>
                  <p class="text-gray-800 text-sm font-medium mb-3 leading-relaxed">{{ getLocalizedText(question.stem) }}</p>
                  <div class="space-y-1.5 mb-3">
                    <div v-for="opt in ['A','B','C']" :key="opt"
                      class="flex items-start gap-2.5 p-2.5 rounded-lg border text-sm"
                      :class="getOptionReviewClass(question, index, opt)">
                      <span class="font-bold text-gray-700 w-5 shrink-0">{{ opt }}.</span>
                      <span class="flex-1 text-gray-700">{{ getOptionText(question, opt) }}</span>
                      <span v-if="opt.toLowerCase() === question.correct_key?.toLowerCase()" class="text-green-600 shrink-0 font-bold">✓</span>
                    </div>
                  </div>
                  <div class="text-xs pt-2.5 border-t border-gray-100 space-y-1">
                    <div class="flex gap-2">
                      <span class="font-semibold text-gray-500 w-28 shrink-0">Your answer:</span>
                      <span :class="isReviewCorrect(index) ? 'text-green-700 font-bold' : 'text-red-600 font-bold'">
                        {{ currentReviewAnswers[index]?.toUpperCase() || '— Not answered' }}
                      </span>
                    </div>
                    <div class="flex gap-2">
                      <span class="font-semibold text-gray-500 w-28 shrink-0">Correct answer:</span>
                      <span class="text-green-700 font-bold">{{ question.correct_key?.toUpperCase() }}</span>
                    </div>
                    <div v-if="question.rationale && getLocalizedText(question.rationale)" class="mt-2 bg-blue-50 rounded-lg p-2.5">
                      <span class="font-semibold text-blue-700">💡 Explanation: </span>
                      <span class="text-blue-800">{{ getLocalizedText(question.rationale) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button @click="showReviewModal = false" class="btn-save btn-green">Close</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </StudentLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from './StudentLayout.vue'
import axios from "axios";
import { API_URL } from "../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const TOPIC_LABEL = {
  traffic_rules:'Traffic Rules',traffic_signs:'Traffic Signs',road_signs:'Traffic Signs',
  traffic_lights:'Traffic Lights',road_markings:'Road Markings',lane_lines:'Road Markings',
  yellow_lines:'Road Markings',signals:'Traffic Lights',regulatory:'Regulatory Signs',
  prohibitory:'Prohibitory Signs',warning:'Warning Signs',lane_use_signs:'Lane-Use Signs',
  pedestrian:'Pedestrian Signs',defensive_driving:'Defensive Driving',
  safe_driving_rules:'Safe Driving Rules',road_safety:'Road Safety',
  hazard_awareness:'Hazard Awareness',driver_attitude:'Driver Attitude',
  road_discipline:'Road Discipline',licensing:'Licensing',
  driver_classification:'Driver Classification',professional_driver:'Professional Driver',
  requirements:'License Requirements',age:'Age Requirements',renewal:'License Renewal',
  validity:'License Validity',dl_codes:'DL Codes',authorized_vehicles:'Authorized Vehicles',
  lending_license:'License Lending',fake_license:'Fake License',violations:'Violations',
  penalties:'Penalties',settlement_period:'Settlement Period',lto_process:'LTO Process',
  temporary_operator_permit:'Temporary Operator Permit',suspension:'License Suspension',
  confiscation:'License Confiscation',adjudication:'Adjudication',
  license_suspension:'License Suspension',parking:'Parking Rules',
  curb_markings:'Curb Markings',fire_hydrant:'Fire Hydrant Parking',overtaking:'Overtaking',
  lane_change:'Lane Changing',turning:'Turning',hand_signals:'Hand Signals',
  stopping:'Stopping',backing_up:'Backing Up',vehicle_control:'Vehicle Control',
  braking:'Braking',abs:'ABS Braking',mirrors:'Mirror Usage',blind_spots:'Blind Spots',
  road_emergency:'Road Emergency',road_crash:'Road Crash',first_aid:'First Aid',
  breakdown:'Vehicle Breakdown',ewd:'Early Warning Device',tire_blowout:'Tire Blowout',
  emergency_vehicles:'Emergency Vehicles',motorcycle:'Motorcycle Rules',
  motorcycle_safety:'Motorcycle Safety',helmets:'Helmet Rules',
  protective_gear:'Protective Gear',public_utility_vehicle:'PUV Rules',
  bike_lane:'Bike Lanes',cyclists:'Cyclists',driver_fatigue:'Driver Fatigue',
  drowsy_driving:'Drowsy Driving',stress_management:'Stress Management',road_rage:'Road Rage',
  child_safety:'Child Safety',child_restraint:'Child Restraint',children:'Children Safety',
  vehicle_maintenance:'Vehicle Maintenance',inspection:'Vehicle Inspection',
  roadworthiness:'Roadworthiness',weather_driving:'Weather Driving',heavy_rain:'Rain Driving',
  night_driving:'Night Driving',visibility:'Visibility',headlights:'Headlights',
  right_of_way:'Right of Way',yield_sign:'Yield Sign',stop_sign:'Stop Sign',
  uncontrolled_intersection:'Uncontrolled Intersection',pedestrians:'Pedestrian Right of Way',
  crosswalk:'Crosswalk',seatbelt:'Seat Belt',distracted_driving:'Distracted Driving',
  mobile_phone_mount:'Phone Mounting',registration:'Vehicle Registration',
  plate_number:'Plate Number',drunk_driving:'Drunk Driving',sobriety_test:'Sobriety Tests',
  expressway:'Expressway Rules',lane_usage:'Lane Usage',road_hazards:'Road Hazards',
  speed_management:'Speed Management',intersection:'Intersection Rules',curves:'Curve Driving',
  tailgating:'Tailgating',two_lane_road:'Two-Lane Road',loading_unloading:'Loading/Unloading',
  overloading:'Overloading',vehicle_safety:'Vehicle Safety',
  vehicle_requirements:'Vehicle Requirements',lights:'Vehicle Lights',
  brake_lights:'Brake Lights',transition_lines:'Transition Lines',
  rumble_strips:'Rumble Strips',social_responsibility:'Social Responsibility',
  loss_of_control:'Loss of Control',speeding:'Speeding',pwd:'PWD Considerations',
  liability:'Liability',duty_of_care:'Duty of Care',crime_while_driving:'Crime While Driving',
  crime_liability:'Crime Liability',responsibility:'Responsibility',enforcement:'Enforcement',
  impounding:'Impounding',procedure:'Procedure',contesting:'Contesting Violations',
  law:'Traffic Laws',law_ra8750:'R.A. 8750',law_ra11229:'R.A. 11229',
  law_childrens_safety_on_motorcycles:'Children Motorcycle Act',
  height_requirement:'Height Requirements',equipment_rules:'Equipment Rules',
  front_seat:'Front Seat Rules',standards:'Safety Standards',driver_senses:'Driver Senses',
  driving_basics:'Driving Basics',purpose:'Traffic Law Purpose',traffic_laws:'Traffic Laws',
  caution:'Caution Signals',stopping_rules:'Stopping Rules',accident_prone:'Accident Prone Areas',
  bridge_marker:'Bridge Markers',blind_curve:'Blind Curves',unsafe_overtake:'Unsafe Overtaking',
  intersections:'Intersections',certificate_of_registration:'Certificate of Registration',
  transmission_restrictions:'Transmission Restrictions',two_way_road:'Two-Way Road',
  no_overtaking:'No Overtaking',
}

function getSubcategoryLabel(topics) {
  if (!topics || !Array.isArray(topics)) return 'General'
  for (const t of topics) { if (TOPIC_LABEL[t]) return TOPIC_LABEL[t] }
  return topics[0]?.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') || 'General'
}

export default {
  name: 'StudentMockExam',
  components: { StudentLayout },

  setup() {
    const api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
    });
    // ── State ────────────────────────────────────────────────
    const user               = ref({ id: null, name: '', email: '', preferred_language: 'en' })
    const currentLanguage    = ref('en')
    const allQuestions       = ref([])   // All questions loaded from DB
    const availableQuizzes   = ref([])
    const comprehensiveExam  = ref(null)
    const examResults        = ref([])   // All attempts from DB
    const masteryMap         = ref({})   // { exam_id: { question_id: { answer, correct } } }
    const searchQuery        = ref('')

    const loading            = ref(false)
    const showTutorialModal  = ref(false)
    const showExamModal      = ref(false)
    const showResultsModal   = ref(false)
    const showReviewModal    = ref(false)
    const showDeleteModal    = ref(false)
    const showExitConfirmModal = ref(false)

    const skippedQuestions   = ref([])
    const isReviewingSkipped = ref(false)
    const skippedIndices     = computed(() => new Set(skippedQuestions.value))

    const deleteMode         = ref('')
    const deleteQuizId       = ref(null)
    const deleteMessage      = ref('')

    const weaknessAnalysis   = ref([])
    const aiRecommendations  = ref([])
    const aiSummary          = ref('')

    const currentExam             = ref(null)
    const currentQuestions        = ref([])
    const currentQuestionIndex    = ref(0)
    const userAnswers             = ref([])
    const timeRemaining           = ref(0)
    const timerInterval           = ref(null)

    const currentScore              = ref(0)
    const currentWeaknessAnalysis   = ref([])
    const currentRecommendation     = ref('')
    const cumulativeScoreForParent  = ref(null)

    const currentReviewAttempt    = ref(null)
    const currentReviewAnswers    = ref([])
    const retakeLabel             = ref('')
    const retakeParentQuizId      = ref(null)
    const retakeSubcategoryName   = ref('')

    // ── Helpers ──────────────────────────────────────────────
    const getLocalizedText = obj => !obj ? '' : (obj[currentLanguage.value] || obj.en || '')
    const getOptionText = (question, optionKey) => {
      if (!question?.choices) return ''
      const opt = question.choices.find(c => c.key.toLowerCase() === optionKey.toLowerCase())
      return opt ? getLocalizedText(opt) : ''
    }

    // ── API call helper ──────────────────────────────────────
    async function apiCall(endpoint, method = 'GET', data = null) {
      try {
        const config = { method, url: endpoint }
        if (data) config.data = data
        const res = await api(config)
        return res.data
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('user')
          window.location.href = '/login'
          return null
        }
        throw err
      }
    }

    // ── Load questions from DB ───────────────────────────────
    const loadQuestions = async () => {
      const res = await apiCall('/student/mock-exam/questions')
      return res?.data || []
    }

    // ── Build topic quizzes from question array ──────────────
    const createTopicQuizzes = (questions) => {
      const topicCategories = {
        'Traffic Rules & Signs':  ['traffic_rules','traffic_signs','road_signs','traffic_lights','road_markings','lane_lines','yellow_lines','signals','regulatory','prohibitory','warning','lane_use_signs'],
        'Safe Driving':           ['defensive_driving','safe_driving_rules','road_safety','hazard_awareness','driver_attitude','road_discipline'],
        'Licensing & Documents':  ['licensing','driver_classification','professional_driver','requirements','age','renewal','validity','dl_codes','authorized_vehicles','lending_license'],
        'Violations & Penalties': ['violations','penalties','settlement_period','lto_process','temporary_operator_permit','suspension','confiscation','adjudication'],
        'Vehicle Operations':     ['parking','overtaking','lane_change','turning','hand_signals','backing_up','vehicle_control','braking'],
        'Emergency & Accidents':  ['road_emergency','road_crash','first_aid','breakdown','ewd','tire_blowout','emergency_vehicles'],
        'Special Vehicles':       ['motorcycle','motorcycle_safety','public_utility_vehicle','bike_lane','cyclists'],
        'Driver Wellness':        ['driver_fatigue','drowsy_driving','stress_management','road_rage'],
        'Child Safety':           ['child_safety','child_restraint','children'],
        'Vehicle Maintenance':    ['vehicle_maintenance','inspection','roadworthiness'],
        'Weather & Conditions':   ['weather_driving','heavy_rain','night_driving','visibility','headlights'],
        'Right of Way':           ['right_of_way','yield_sign','stop_sign','uncontrolled_intersection','pedestrians','crosswalk'],
      }
      const groups = {}
      Object.keys(topicCategories).forEach(c => { groups[c] = [] })
      groups['Other Topics'] = []

      questions.forEach(q => {
        let assigned = false
        if (q.topic && Array.isArray(q.topic)) {
          for (const t of q.topic) {
            for (const [cat, topics] of Object.entries(topicCategories)) {
              if (topics.includes(t)) { groups[cat].push(q); assigned = true; break }
            }
            if (assigned) break
          }
        }
        if (!assigned) groups['Other Topics'].push(q)
      })

      const quizzes = []
      let idx = 1
      Object.entries(groups).forEach(([cat, qs]) => {
        const unique = Array.from(new Map(qs.map(q => [q.id, q])).values())
        if (unique.length > 0) {
          quizzes.push({ id: `quiz-${idx}`, title: cat, course_name: 'Driving Theory', questions: unique, time_limit: unique.length * 60 })
          idx++
        }
      })
      return quizzes
    }

    // ── Build master answer map per quiz from masteryMap ─────
    // Uses masteryMap (DB-backed) instead of scanning all attempts
    const getMasterAnswersForQuiz = (quizId, quizQuestions) => {
      if (!quizQuestions?.length) return {}
      const quizMastery = masteryMap.value[quizId] || {}
      const result = {}
      quizQuestions.forEach(q => {
        const entry = quizMastery[q.id]
        if (entry) {
          result[q.id] = { answer: entry.answer, correct: entry.correct }
        }
      })
      return result
    }

    // ── Cumulative score for a quiz ──────────────────────────
    const getCumulativeScoreForQuiz = (quizId) => {
      const quiz = quizId === 'quiz-0'
        ? comprehensiveExam.value
        : availableQuizzes.value.find(q => q.id === quizId)
      if (!quiz?.questions?.length) return 0
      const masterMap = getMasterAnswersForQuiz(quizId, quiz.questions)
      const totalCorrect = Object.values(masterMap).filter(v => v.correct).length
      return Math.round((totalCorrect / quiz.questions.length) * 100)
    }

    // ── Weakness groups ──────────────────────────────────────
    const allWeaknessGroups = computed(() => {
      if (!hasTakenExams.value) return []

      const quizIds = [...new Set(examResults.value.map(r => r.exam_id))]
      const groups = []

      quizIds.forEach(qid => {
        const quiz = qid === 'quiz-0'
          ? comprehensiveExam.value
          : availableQuizzes.value.find(q => q.id === qid)
        if (!quiz?.questions) return

        const quizTitle = examResults.value.find(r => r.exam_id === qid)?.exam_title || quiz.title
        const masterMap = getMasterAnswersForQuiz(qid, quiz.questions)

        const wrongItems = quiz.questions.filter(q => {
          const entry = masterMap[q.id]
          if (!entry) return true   // never answered = still weak
          return !entry.correct
        })
        if (wrongItems.length === 0) return

        const subMap = {}
        wrongItems.forEach(q => {
          const label = getSubcategoryLabel(q.topic)
          if (!subMap[label]) subMap[label] = []
          subMap[label].push(q)
        })

        groups.push({
          quizId: qid,
          quizTitle,
          totalWrong: wrongItems.length,
          subcategories: Object.entries(subMap)
            .map(([name, questions]) => ({ name, questions }))
            .sort((a, b) => b.questions.length - a.questions.length),
        })
      })

      return groups.sort((a, b) => b.totalWrong - a.totalWrong)
    })

    const totalWeakCount = computed(() => allWeaknessGroups.value.reduce((s, g) => s + g.totalWrong, 0))

    const latestResultsPerQuiz = computed(() => {
      const map = {}
      const retakeRows = []

      examResults.value.forEach(r => {
        const isRetakeRow = r.exam_id.includes('||')
        const realQuizId = isRetakeRow ? r.exam_id.split('||')[0] : r.exam_id

        let cumScore
        if (isRetakeRow) {
          const subcatName = r.exam_id.split('||')[1]
          const parentQuiz = realQuizId === 'quiz-0'
            ? comprehensiveExam.value
            : availableQuizzes.value.find(q => q.id === realQuizId)
          if (parentQuiz) {
            const subcatQuestions = parentQuiz.questions.filter(q => getSubcategoryLabel(q.topic) === subcatName)
            const parentMastery   = masteryMap.value[realQuizId] || {}
            const correctInSubcat = subcatQuestions.filter(q => parentMastery[q.id]?.correct).length
            cumScore = subcatQuestions.length > 0
              ? Math.round((correctInSubcat / subcatQuestions.length) * 100)
              : r.score
          } else {
            cumScore = r.score
          }

            retakeRows.push({
            exam_id:       r.exam_id,
            real_quiz_id:  realQuizId,
            exam_title:    r.exam_title,
            bestScore:     r.score,   // use the actual saved score, not cumulative
            attempts:      null,
            completed_at:  r.completed_at,
            latestAttempt: r,
            isRetake:      true,
            _raw_id:       r.id,
          })
    } else {
              // Main quizzes: each attempt is its own row
              cumScore = r.score
              retakeRows.push({
                exam_id:       r.exam_id,
                real_quiz_id:  realQuizId,
                exam_title:    r.exam_title,
                bestScore:     cumScore,
                attempts:      null,
                completed_at:  r.completed_at,
                latestAttempt: r,
                isRetake:      false,
                _raw_id:       r.id,
              })
            }
      })

// Assign attempt numbers chronologically per exam_id (covers both main and subtopic)
      const attemptCounts = {}
      const chronoRows = [...retakeRows].sort((a, b) =>
        new Date(a.completed_at) - new Date(b.completed_at)
      )
      chronoRows.forEach(row => {
        const key = row.exam_id
        attemptCounts[key] = (attemptCounts[key] || 0) + 1
        row.attempts = attemptCounts[key]
      })

      return retakeRows
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 20)
    })

const uniqueExamsTaken = computed(() => {
      const mainQuizIds = examResults.value
        .map(r => r.exam_id.includes('||') ? r.exam_id.split('||')[0] : r.exam_id)
      return new Set(mainQuizIds).size
    })

    const passedQuizCount = computed(() => {
      const mainQuizIds = [...new Set(
        examResults.value.map(r => r.exam_id.includes('||') ? r.exam_id.split('||')[0] : r.exam_id)
      )]
      return mainQuizIds.filter(qid => getCumulativeScoreForQuiz(qid) >= 70).length
    })
const overallAvgScore = computed(() => {
      const mainQuizIds = [...new Set(
        examResults.value.map(r => r.exam_id.includes('||') ? r.exam_id.split('||')[0] : r.exam_id)
      )]
      if (!mainQuizIds.length) return 0
      const scores = mainQuizIds.map(qid => getCumulativeScoreForQuiz(qid))
      return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
    })

    // ── Computed ─────────────────────────────────────────────
    const hasTakenExams    = computed(() => examResults.value.length > 0)
    const filteredQuizzes  = computed(() => {
      if (!searchQuery.value.trim()) return availableQuizzes.value
      const q = searchQuery.value.toLowerCase()
      return availableQuizzes.value.filter(quiz => quiz.title.toLowerCase().includes(q) || quiz.course_name?.toLowerCase().includes(q))
    })
    const currentQuestion  = computed(() => currentQuestions.value[currentQuestionIndex.value])
    const answeredCount    = computed(() => userAnswers.value.filter(a => a !== null).length)
    const formattedTime    = computed(() => {
      const m = Math.floor(timeRemaining.value / 60)
      const s = timeRemaining.value % 60
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    })
    const progressWidth    = computed(() => `${((currentQuestionIndex.value + 1) / currentQuestions.value.length) * 100}%`)

    // ── Load initial data ────────────────────────────────────
    const loadInitialData = async () => {
      loading.value = true
      try {
        // 1. Load questions from DB
        allQuestions.value = await loadQuestions()

        // 2. Build quizzes from those questions
        const unique = Array.from(new Map(allQuestions.value.map(q => [q.id, q])).values())
        comprehensiveExam.value = {
          id: 'quiz-0',
          title: 'Comprehensive Assessment',
          course_name: 'Full Exam',
          questions: unique,
          time_limit: Math.min(unique.length * 60, 7200),
        }
        availableQuizzes.value = createTopicQuizzes(allQuestions.value)

        // 3. Load user info
        const userData = localStorage.getItem('user')
        if (userData) user.value = JSON.parse(userData)

        // 4. Load language preference from DB
        const langRes = await apiCall('/student/mock-exam/language')
        if (langRes?.data?.language) currentLanguage.value = langRes.data.language

        // 5. Load all attempts + mastery from DB
        await fetchAttemptsFromDB()

      } catch (e) {
        console.error('loadInitialData error:', e)
      } finally {
        loading.value = false
      }
    }

    const fetchAttemptsFromDB = async () => {
      const res = await apiCall('/student/mock-exam/attempts')
      if (res?.data) {
        examResults.value = res.data.attempts || []
        masteryMap.value  = res.data.mastery  || {}
      }
    }

    // ── Score / status helpers ───────────────────────────────
    const getScoreColorClass = s => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600'
    const getStatusClass     = id => examResults.value.some(r => r.exam_id === id) ? 'text-green-600' : 'text-yellow-600'
    const getButtonClass     = id => examResults.value.some(r => r.exam_id === id) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
    const getButtonText      = id => examResults.value.some(r => r.exam_id === id) ? 'Retake' : 'Take Quiz'
    const getExamStatus      = id => examResults.value.some(r => r.exam_id === id) ? 'Completed' : 'Not Taken'
    const getStatusPillClass = id => examResults.value.some(r => r.exam_id === id) ? 'pill-green' : 'pill-amber'
    const getButtonPillClass = id => examResults.value.some(r => r.exam_id === id) ? 'pg-btn-info' : 'pg-btn-accent'
    const getRemarksPillClass = s => s >= 80 ? 'pill-green' : s >= 70 ? 'pill-blue' : s >= 60 ? 'pill-amber' : 'pill-gray'
    const formatDate         = d => !d ? 'N/A' : new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
    const getRemarks         = s => s >= 80 ? 'Excellent' : s >= 70 ? 'Good' : s >= 60 ? 'Fair' : 'Needs Improvement'
    const getResultMessage   = s => s >= 80 ? 'Excellent! You passed with flying colors.' : s >= 70 ? 'Good job! You passed.' : 'Keep practicing — you can do it!'

    // ── Review helpers ───────────────────────────────────────
    const isReviewCorrect = (index) => {
      const ua = currentReviewAnswers.value[index]?.toLowerCase()
      const ck = currentQuestions.value[index]?.correct_key?.toLowerCase()
      return ua === ck
    }
    const getOptionReviewClass = (question, index, option) => {
      const u = currentReviewAnswers.value[index]?.toLowerCase()
      const c = question.correct_key?.toLowerCase()
      const o = option.toLowerCase()
      if (u === o && o === c) return 'bg-green-100 border-green-400'
      if (u === o && o !== c) return 'bg-red-100 border-red-400'
      if (o === c)            return 'bg-green-50 border-green-300'
      return 'bg-white border-gray-200'
    }

    // ── Local performance analysis ───────────────────────────
    function performLocalAnalysis(questions, answers) {
      const cats = {}
      let correct = 0
      questions.forEach((q, i) => {
        const ans = answers[i]
        const ok  = ans?.toLowerCase() === q.correct_key?.toLowerCase()
        if (ok) correct++
        const topics = q.topic && Array.isArray(q.topic) ? q.topic : ['general']
        topics.forEach(t => {
          if (!cats[t]) cats[t] = { correct: 0, total: 0 }
          cats[t].total++
          if (ok) cats[t].correct++
        })
      })
      const wa = Object.keys(cats).map(t => {
        const d = cats[t]
        const score = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
        const label = TOPIC_LABEL[t] || t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
        return { category: label, score, correct_answers: d.correct, total_questions: d.total }
      }).sort((a, b) => a.score - b.score)
      const total = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
      return { overall_score: total, weakness_analysis: wa, recommendation: generateRecommendation(wa) }
    }

    function generateRecommendation(wa) {
      if (!wa.length) return 'Complete more exams to get better recommendations.'
      const w = wa[0]
      if (w.score >= 80) return 'Excellent performance! You\'re well-prepared.'
      if (w.score >= 70) return 'Good performance. Focus on consistency.'
      if (w.score >= 50) return `You need practice in ${w.category}. Review fundamentals and try again.`
      return `You need significant practice in ${w.category}. Study basics thoroughly before retaking.`
    }

    const confirmDeleteQuizResults = (quizId, quizTitle, rawId, isRetake) => {
            deleteMode.value    = isRetake ? 'single-attempt' : 'single'
            deleteQuizId.value  = isRetake ? rawId : quizId   // for retakes, use the DB row id
            deleteMessage.value = `Delete results for "${quizTitle.split('||')[0]}"${quizTitle.includes('||') ? ` › ${quizTitle.split('||')[1]}` : ''}? This cannot be undone.`
            showDeleteModal.value = true
          }
    const confirmClearAllResults = () => {
      deleteMode.value    = 'all'
      deleteQuizId.value  = null
      deleteMessage.value = 'Delete all exam results? This cannot be undone.'
      showDeleteModal.value = true
    }
    const executeDelete = async () => {
          try {
            if (deleteMode.value === 'single-attempt' && deleteQuizId.value) {
              // Delete only this one DB row by its id
              await apiCall(`/student/mock-exam/attempts/row/${deleteQuizId.value}`, 'DELETE')
            } else if (deleteMode.value === 'single' && deleteQuizId.value) {
              await apiCall(`/student/mock-exam/attempts/${deleteQuizId.value}`, 'DELETE')
            } else {
              await apiCall('/student/mock-exam/attempts', 'DELETE')
            }
        await fetchAttemptsFromDB()
        if (!hasTakenExams.value) {
          weaknessAnalysis.value  = []
          aiRecommendations.value = []
          aiSummary.value         = ''
        }
      } catch (e) {
        console.error('Delete failed:', e)
        alert('Failed to delete results.')
      } finally {
        showDeleteModal.value = false
        deleteMode.value      = ''
        deleteQuizId.value    = null
      }
    }

    // ── Exam flow ────────────────────────────────────────────
    const startExam = async (examId) => {
      loading.value = true
      retakeLabel.value        = ''
      retakeParentQuizId.value = null
      skippedQuestions.value   = []
      isReviewingSkipped.value = false
      try {
        currentExam.value = examId === 'quiz-0'
          ? comprehensiveExam.value
          : availableQuizzes.value.find(q => q.id === examId)
        if (!currentExam.value) { alert('Exam not found.'); return }
        currentQuestions.value    = currentExam.value.questions || []
        if (!currentQuestions.value.length) { alert('No questions available.'); return }
        currentQuestionIndex.value = 0
        userAnswers.value          = new Array(currentQuestions.value.length).fill(null)
        timeRemaining.value        = currentExam.value.time_limit || 3600
        startTimer()
        showExamModal.value = true
      } catch (e) {
        console.error(e)
        alert('Failed to load exam.')
      } finally {
        loading.value = false
      }
    }

    const takeExam           = id => startExam(id)
    const startInitialExam   = () => comprehensiveExam.value ? startExam('quiz-0') : alert('Comprehensive exam not available.')
    const startRecommendedExam = () => availableQuizzes.value.length ? startExam(availableQuizzes.value[0].id) : null
    const scrollToQuizzes    = () => document.querySelector('.quizzes-section')?.scrollIntoView({ behavior: 'smooth' })

    const retakeSubcategory = (questions, subcatName, quizId, quizTitle) => {
      if (!questions?.length) return
      retakeLabel.value           = `${quizTitle} › ${subcatName}`
      retakeParentQuizId.value    = quizId
      retakeSubcategoryName.value = subcatName
      retakeParentQuizId.value = quizId
      currentExam.value = { id: 'retake_sub', title: `📝 ${subcatName}`, course_name: quizTitle, questions, time_limit: questions.length * 90 }
      currentQuestions.value     = [...questions]
      currentQuestionIndex.value = 0
      userAnswers.value          = new Array(questions.length).fill(null)
      skippedQuestions.value     = []
      isReviewingSkipped.value   = false
      timeRemaining.value        = questions.length * 90
      startTimer()
      showExamModal.value = true
    }

    const startTimer = () => {
      if (timerInterval.value) clearInterval(timerInterval.value)
      timerInterval.value = setInterval(() => {
        timeRemaining.value--
        if (timeRemaining.value <= 0) { clearInterval(timerInterval.value); submitExam() }
      }, 1000)
    }

    const skipQuestion = () => {
      if (!skippedQuestions.value.includes(currentQuestionIndex.value)) {
        skippedQuestions.value.push(currentQuestionIndex.value)
      }
      if (currentQuestionIndex.value < currentQuestions.value.length - 1) {
        currentQuestionIndex.value++
      } else {
        goToFirstSkipped()
      }
    }

    const goToFirstSkipped = () => {
      if (skippedQuestions.value.length > 0) {
        skippedQuestions.value.sort((a, b) => a - b)
        currentQuestionIndex.value = skippedQuestions.value[0]
        isReviewingSkipped.value   = true
      }
    }

    const nextQuestion = () => {
      if (isReviewingSkipped.value && userAnswers.value[currentQuestionIndex.value]) {
        const idx = skippedQuestions.value.indexOf(currentQuestionIndex.value)
        if (idx > -1) skippedQuestions.value.splice(idx, 1)
        const allAnswered = userAnswers.value.every(a => a !== null)
        if (allAnswered) {
          currentQuestionIndex.value = currentQuestions.value.length - 1
          isReviewingSkipped.value   = false
          return
        }
        if (skippedQuestions.value.length > 0) {
          skippedQuestions.value.sort((a, b) => a - b)
          currentQuestionIndex.value = skippedQuestions.value[0]
          return
        }
        isReviewingSkipped.value = false
        const firstUnanswered = userAnswers.value.findIndex(a => a === null)
        if (firstUnanswered !== -1) { currentQuestionIndex.value = firstUnanswered; return }
      }
      if (currentQuestionIndex.value < currentQuestions.value.length - 1) {
        currentQuestionIndex.value++
      } else if (skippedQuestions.value.length > 0) {
        skippedQuestions.value.sort((a, b) => a - b)
        currentQuestionIndex.value = skippedQuestions.value[0]
        isReviewingSkipped.value   = true
      }
    }

    const previousQuestion = () => {
      if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--
        if (isReviewingSkipped.value && !skippedIndices.value.has(currentQuestionIndex.value)) {
          isReviewingSkipped.value = false
        }
      }
    }

    const selectAnswer = (index, answer) => {
      userAnswers.value[index] = answer
      const skippedIdx = skippedQuestions.value.indexOf(index)
      if (skippedIdx > -1) skippedQuestions.value.splice(skippedIdx, 1)
      const allAnswered = userAnswers.value.every(a => a !== null)
      if (allAnswered && currentQuestionIndex.value < currentQuestions.value.length - 1) {
        currentQuestionIndex.value = currentQuestions.value.length - 1
        isReviewingSkipped.value   = false
      }
    }

    const submitExam = async () => {
      const unanswered = userAnswers.value.map((a, i) => a === null ? i : null).filter(i => i !== null)
      if (unanswered.length > 0) {
        skippedQuestions.value     = unanswered
        currentQuestionIndex.value = unanswered[0]
        isReviewingSkipped.value   = true
        alert(`Please answer all questions. You have ${unanswered.length} unanswered question(s).`)
        return
      }

      try {
        if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
        showExamModal.value = false

        const isRetake      = retakeLabel.value !== ''
        const parentQuizId  = isRetake ? retakeParentQuizId.value : currentExam.value.id
        const parentQuiz    = parentQuizId === 'quiz-0'
          ? comprehensiveExam.value
          : availableQuizzes.value.find(q => q.id === parentQuizId)
        const parentTitle   = isRetake && retakeSubcategoryName.value
        ? `${parentQuiz?.title || currentExam.value.course_name}||${retakeSubcategoryName.value}`
        : (parentQuiz?.title || currentExam.value.course_name || currentExam.value.title)

        // Calculate score
        let scoreToSave = 0
        let correctCount = 0
    if (isRetake && parentQuiz?.questions) {
              // Score for THIS retake attempt only (subcategory questions only)
              const subcatCorrect = currentQuestions.value.filter((q, i) =>
                userAnswers.value[i]?.toLowerCase() === q.correct_key?.toLowerCase()
              ).length
              const subcatScore = Math.round((subcatCorrect / currentQuestions.value.length) * 100)

              // Cumulative score for the parent quiz (used for mastery/weakness tracking)
              const tempMastery = { ...(masteryMap.value[parentQuizId] || {}) }
              currentQuestions.value.forEach((q, i) => {
                const ans = userAnswers.value[i]
                if (ans !== null) {
                  tempMastery[q.id] = { answer: ans, correct: ans.toLowerCase() === q.correct_key?.toLowerCase() }
                }
              })
              const totalCorrect = parentQuiz.questions.filter(q => tempMastery[q.id]?.correct).length

              // Save subcategory score as the attempt score, cumulative for mastery
              scoreToSave  = subcatScore
              correctCount = subcatCorrect

              // Store cumulative separately so the main topic score updates correctly
              cumulativeScoreForParent.value = Math.round((totalCorrect / parentQuiz.questions.length) * 100)
            } else {
              correctCount = currentQuestions.value.filter((q, i) => userAnswers.value[i]?.toLowerCase() === q.correct_key?.toLowerCase()).length
              scoreToSave  = Math.round((correctCount / currentQuestions.value.length) * 100)
              cumulativeScoreForParent.value = null
            }
        currentScore.value = scoreToSave
        loading.value      = true

        // Local analysis for results modal
        const analysis = performLocalAnalysis(currentQuestions.value, userAnswers.value)
        currentWeaknessAnalysis.value = analysis.weakness_analysis || []
        currentRecommendation.value   = analysis.recommendation || ''

        // Save to DB
        await apiCall('/student/mock-exam/attempts', 'POST', {
          exam_id:              isRetake ? `${parentQuizId}||${retakeSubcategoryName.value}` : parentQuizId,
          exam_title:           parentTitle,
          score:                scoreToSave,
          total_questions:      isRetake && parentQuiz ? parentQuiz.questions.length : currentQuestions.value.length,
          correct_answers:      correctCount,
          answers:              [...userAnswers.value],
          retake_question_ids:  isRetake ? currentQuestions.value.map(q => q.id) : null,
          questions:            currentQuestions.value,   // needed for mastery upsert
          language:             currentLanguage.value,
        })

        // Re-fetch attempts + mastery from DB so UI is fresh
        await fetchAttemptsFromDB()

        loading.value         = false
        showResultsModal.value = true
      } catch (e) {
        console.error('submitExam error:', e)
        alert('Failed to submit exam.')
        loading.value = false
      }
    }

const reviewExam = (attempt) => {
      // attempt is the raw DB row (passed directly from template as result.latestAttempt)
      const isRetakeRow = attempt.exam_id.includes('||')
      const realQuizId = isRetakeRow ? attempt.exam_id.split('||')[0] : attempt.exam_id
      const subcatName = isRetakeRow ? attempt.exam_id.split('||')[1] : null

      const quiz = realQuizId === 'quiz-0'
        ? comprehensiveExam.value
        : availableQuizzes.value.find(q => q.id === realQuizId)
      if (!quiz) return

      // Get the questions pool for this attempt
      const allQuizQuestions = isRetakeRow
        ? quiz.questions.filter(q => getSubcategoryLabel(q.topic) === subcatName)
        : quiz.questions

      // Use the saved answers from this specific attempt
      const savedAnswers = attempt.answers || []

      // If retake_question_ids exist, use them to match questions to answers in order
      const retakeIds = attempt.retake_question_ids
      const questionsToReview = retakeIds
        ? retakeIds.map(id => allQuizQuestions.find(q => String(q.id) === String(id))).filter(Boolean)
        : allQuizQuestions

      // Map saved answers to questions positionally
      const reviewAnswers = questionsToReview.map((q, i) => savedAnswers[i] || null)

      const correctCount = questionsToReview.filter((q, i) =>
        reviewAnswers[i]?.toLowerCase() === q.correct_key?.toLowerCase()
      ).length

      currentQuestions.value     = questionsToReview
      currentReviewAnswers.value = reviewAnswers
      currentReviewAttempt.value = {
        ...attempt,
        exam_title:      attempt.exam_title,
        score:           attempt.score,
        total_questions: questionsToReview.length,
        correct_answers: correctCount,
      }
      showReviewModal.value = true
    }

    const updateUserLanguage = async () => {
      try {
        await apiCall('/student/mock-exam/language', 'PUT', { language: currentLanguage.value })
        if (user.value) {
          user.value.preferred_language = currentLanguage.value
          localStorage.setItem('user', JSON.stringify(user.value))
        }
      } catch (e) {
        console.error('updateLanguage error:', e)
      }
    }

    // ── Exit exam (now a styled confirmation modal instead of window.confirm) ─
    const closeExamModal = () => {
      showExitConfirmModal.value = true
    }

    const cancelExitExam = () => {
      showExitConfirmModal.value = false
    }

    const confirmExitExam = () => {
      if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
      showExamModal.value      = false
      retakeLabel.value        = ''
      retakeParentQuizId.value = null
      showExitConfirmModal.value = false
    }

    const getOrdinal = (n) => {
      const s = ['th','st','nd','rd']
      const v = n % 100
      return n + (s[(v - 20) % 10] || s[v] || s[0]) + ' attempt'
    }

    onMounted(() => loadInitialData())

    return {
      user, currentLanguage, availableQuizzes, examResults, masteryMap, searchQuery,
      loading, showTutorialModal, showExamModal, showResultsModal, showReviewModal,
      showDeleteModal, deleteMessage, showExitConfirmModal,
      weaknessAnalysis, aiRecommendations, aiSummary,
      currentExam, currentQuestions, currentQuestionIndex, userAnswers, timeRemaining,
      currentScore, currentWeaknessAnalysis, currentRecommendation, cumulativeScoreForParent,
      currentReviewAttempt, currentReviewAnswers, retakeLabel, retakeSubcategoryName,
      allWeaknessGroups, totalWeakCount, latestResultsPerQuiz, uniqueExamsTaken, overallAvgScore, passedQuizCount,
      hasTakenExams, filteredQuizzes, currentQuestion, answeredCount, formattedTime, progressWidth,
      skippedQuestions, skippedIndices, isReviewingSkipped,
      getLocalizedText, getOptionText, getOptionReviewClass, isReviewCorrect,
      takeExam, startExam, startInitialExam, startRecommendedExam, retakeSubcategory,
      selectAnswer, previousQuestion, nextQuestion, submitExam, reviewExam, skipQuestion,
      updateUserLanguage, closeExamModal, cancelExitExam, confirmExitExam, scrollToQuizzes,
      getScoreColorClass, getStatusClass, getButtonClass, getButtonText, getExamStatus,
      getStatusPillClass, getButtonPillClass, getRemarksPillClass,
      getCumulativeScoreForQuiz, formatDate, getRemarks, getResultMessage, getOrdinal,
      confirmDeleteQuizResults, confirmClearAllResults, executeDelete,
    }
  }
}
</script>

<style scoped>
/* ========== PAGE HEADER ========== */
.page-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 4px; }
.page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
.page-subtitle { font-size: 0.85rem; color: #6b7280; margin: 4px 0 0; }

/* ========== SEARCH ========== */
.search-box { position: relative; flex: 1; max-width: 380px; }
.search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
.search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
.search-input-modern:focus { border-color: #10b981; }

/* ========== PANEL ========== */
.panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
.panel-header-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.panel-body { padding: 20px; }
.card-title { font-size: 1.05rem; font-weight: 700; color: #111827; margin: 0; }
.card-title-amber { color: #c2410c; }

/* ========== WELCOME CARD ========== */
.welcome-card { display: flex; flex-direction: column; min-height: 350px; }
.welcome-body { display: flex; flex-direction: column; gap: 16px; padding: 20px; flex: 1; }
.lang-tutorial-row { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.welcome-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-top: 16px; border-top: 1px solid #ecfdf5; }
.welcome-stats .mini-stat { background: #ecfdf5; border: none; }
.welcome-empty { padding-top: 16px; border-top: 1px solid #f3f4f6; text-align: center; }

/* ========== WEAKNESS CARD (scrollbar styling intentionally unchanged) ========== */
.weakness-card { height: 350px; display: flex; flex-direction: column; overflow: hidden; }
.weakness-header-bar { background: linear-gradient(to right, #fff7ed, #fffbeb); border-bottom: 1px solid #fed7aa; }
.weakness-empty-state { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px; }
.weakness-list { overflow-y: auto; flex: 1; padding: 12px 16px; }
.weakness-group { border-radius: 12px; border: 1px solid #fed7aa; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04); margin-bottom: 12px; }
.weakness-group:last-child { margin-bottom: 0; }
.weakness-group-head { background: #fff7ed; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; }
.weakness-count-badge { flex-shrink: 0; margin-left: 8px; font-size: 0.7rem; font-weight: 700; color: #fff; background: #f87171; border-radius: 999px; padding: 2px 10px; }
.weakness-sub-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; transition: background 0.15s; }
.weakness-sub-row:hover { background: #fff7ed; }
.score-bar-track-weakness { width: 100%; height: 4px; }
.bg-gradient-orange { background: linear-gradient(to right, #f87171, #fb923c); height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.retake-btn { flex-shrink: 0; font-size: 0.7rem; background: #f97316; color: #fff; padding: 6px 12px; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; transition: all 0.15s; }
.retake-btn:hover { background: #ea580c; }
.retake-btn:active { transform: scale(0.95); }
.weakness-scroll-hint { font-size: 9px; color: #9ca3af; text-align: center; padding-bottom: 4px; border-top: 1px solid #fed7aa; }

/* -- Original scrollbar rules, unchanged -- */
.weakness-scrollbar::-webkit-scrollbar       { width: 6px; }
.weakness-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
.weakness-scrollbar::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
.weakness-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
.weakness-scrollbar { scrollbar-width: thin; scrollbar-color: #f97316 #f1f1f1; }

/* ========== MINI STATS ========== */
.mini-stat { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; text-align: center; }
.mini-stat-value { font-size: 1.5rem; font-weight: 700; }
.mini-stat-green { color: #059669; }
.mini-stat-blue { color: #2563eb; }
.mini-stat-purple { color: #7c3aed; }
.mini-stat-label { font-size: 0.72rem; color: #9ca3af; margin-top: 4px; }

/* ========== ANALYSIS BOXES ========== */
.analysis-box { background: #f9fafb; padding: 14px 16px; border-radius: 12px; border: 1px solid #e5e7eb; }
.analysis-box-green { background: #ecfdf5; border-color: #a7f3d0; }
.analysis-box-title { font-weight: 700; color: #374151; margin-bottom: 12px; font-size: 0.85rem; }
.analysis-box-title-green { color: #065f46; }
.analysis-summary-box { background: #eff6ff; padding: 16px; border-radius: 12px; border: 1px solid #dbeafe; }
.analysis-summary-title { font-weight: 700; color: #1e40af; margin-bottom: 4px; font-size: 0.85rem; }

/* ========== TABLE ========== */
.table-wrap { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.modern-table th { text-align: left; padding: 11px 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.modern-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #374151; }
.modern-table tbody tr:hover { background: #f9fafb; }
.thead-green th { background: #10b981; color: #fff; border-bottom: none; }
.empty-cell { text-align: center; color: #9ca3af; padding: 30px !important; }
.loading-state { text-align: center; padding: 30px; color: #9ca3af; }

/* ========== PILLS ========== */
.pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
.pill-green { background: #d1fae5; color: #059669; }
.pill-blue { background: #dbeafe; color: #2563eb; }
.pill-amber { background: #fef3c7; color: #d97706; }
.pill-gray { background: #f3f4f6; color: #6b7280; }

/* ========== SCORE BAR ========== */
.score-bar-wrap { display: flex; align-items: center; gap: 8px; }
.score-bar-track { width: 64px; height: 6px; background: #f3f4f6; border-radius: 999px; overflow: hidden; }
.score-bar-track-full { width: 100%; height: 8px; }
.score-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }

/* ========== ACTION BUTTONS (Recent Quiz Results — unchanged behavior) ========== */
.action-btns { display: flex; gap: 6px; }
.action-view { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #6366f1; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-view:hover { background: #4f46e5; }
.action-delete { padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; background: #ef4444; color: #fff; border: none; cursor: pointer; transition: all 0.2s; }
.action-delete:hover { background: #dc2626; }

/* ========== BUTTONS (generic pill-style) ========== */
.pg-btn { padding: 7px 14px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; }
.pg-btn:hover:not(.pg-disabled) { border-color: #10b981; color: #059669; }
.pg-btn-accent { background: #10b981; color: #fff; border-color: #10b981; }
.pg-btn-accent:hover { background: #059669; }
.pg-btn-info { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.pg-btn-info:hover { background: #2563eb; }
.pg-btn-amber { background: #f59e0b; color: #fff; border-color: #f59e0b; }
.pg-btn-amber:hover { background: #d97706; }
.pg-btn-danger { color: #dc2626; border-color: #fecaca; }
.pg-btn-danger:hover { background: #fef2f2; border-color: #dc2626; color: #dc2626; }
.pg-disabled { opacity: 0.4; cursor: not-allowed; }

/* ========== PAGINATION ========== */
.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-top: 1px solid #e5e7eb; background: #f9fafb; flex-wrap: wrap; gap: 10px; }
.page-info { font-size: 0.8rem; color: #6b7280; font-weight: 500; }

/* ========== MODAL (shared) ========== */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.modal-card-sm { max-width: 420px; }
.modal-card-lg { max-width: 720px; }
.modal-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
.modal-head-green { background: #f0fdf4; }
.results-modal-head { background: linear-gradient(to right, #047857, #059669); }
.modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
.modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
.modal-close-btn:hover { background: #f3f4f6; color: #111827; }
.modal-close-btn-light { color: rgba(255,255,255,0.8); font-size: 1.5rem; line-height: 1; }
.modal-close-btn-light:hover { color: #fff; background: transparent; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.modal-foot { padding: 14px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; background: #f9fafb; flex-shrink: 0; }
.modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
.modal-body-delete { padding: 20px; }
.warning-icon-circle { width: 44px; height: 44px; border-radius: 50%; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.warning-icon-circle-red { background: #fee2e2; color: #dc2626; }
.results-modal-card { max-width: 560px; }
.review-modal-card { max-width: 760px; }

/* ========== FORM / SELECT ========== */
.select-modern-sm {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
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
.select-modern-sm:hover { border-color: #a7f3d0; }
.select-modern-sm:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15); background-color: #f0fdf4; }

/* ========== BUTTONS (save/cancel) ========== */
.btn-cancel { padding: 9px 18px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #374151; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: #f3f4f6; }
.btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-block { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-green { background: #10b981; }
.btn-green:hover:not(:disabled) { background: #059669; }
.btn-blue { background: #3b82f6; }
.btn-blue:hover:not(:disabled) { background: #2563eb; }
.btn-red { background: #ef4444; }
.btn-red:hover:not(:disabled) { background: #dc2626; }

/* ========== SPINNERS ========== */
.spinner-sm { animation: spin 0.8s linear infinite; border-radius: 50%; height: 16px; width: 16px; border: 2px solid rgba(255,255,255,0.4); border-bottom-color: #fff; }
.spinner-md { animation: spin 0.8s linear infinite; border-radius: 50%; height: 32px; width: 32px; border: 3px solid #d1fae5; border-bottom-color: #059669; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== EXAM MODAL ========== */
.exam-overlay { padding: 16px; }
.exam-modal-card { background: #fff; width: 100%; max-width: 46rem; border-radius: 16px; box-shadow: 0 25px 60px rgba(0,0,0,0.25); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
.exam-modal-head { background: #047857; color: #fff; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.retake-chip { display: inline-block; margin-top: 4px; font-size: 0.7rem; background: #fb923c; color: #fff; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
.timer-badge { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.12); border-radius: 10px; padding: 6px 12px; }
.exit-btn { display: flex; align-items: center; gap: 6px; background: #ef4444; color: #fff; font-size: 0.75rem; font-weight: 600; padding: 6px 12px; border-radius: 10px; border: none; cursor: pointer; transition: background 0.2s; }
.exit-btn:hover { background: #dc2626; }
.exam-modal-foot { padding: 14px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; flex-wrap: wrap; gap: 10px; }

.symbol-box { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 16px; padding: 20px 40px; font-size: 3.5rem; box-shadow: inset 0 1px 3px rgba(0,0,0,0.06); user-select: none; }

.choice-option { display: flex; align-items: flex-start; gap: 12px; padding: 14px; border-radius: 12px; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.15s; background: #fff; }
.choice-option:hover { border-color: #6ee7b7; background: rgba(16,185,129,0.04); }
.choice-option-active { border-color: #10b981; background: #ecfdf5; }

.fade-in { animation: fadeIn 0.3s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ========== ANIMATIONS ========== */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-scale-enter-active { transition: all 0.25s ease; }
.modal-scale-leave-active { transition: all 0.15s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

/* ========== RESPONSIVE ========== */
@media (max-width: 1024px) {
  .welcome-stats { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 640px) {
  .welcome-stats { grid-template-columns: 1fr; }
}
</style>