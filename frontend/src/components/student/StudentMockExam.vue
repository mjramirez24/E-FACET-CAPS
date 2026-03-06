<template>
  <StudentLayout active-page="student-quiz">
    <!-- Header -->
    <template #header-left>
      <input
        type="text"
        placeholder="Search quizzes..."
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
      <div class="flex items-center gap-3">
        <select v-model="currentLanguage" @change="updateUserLanguage" class="bg-white text-green-800 px-3 py-1 rounded border border-green-600">
          <option value="en">🇺🇸 English</option>
          <option value="tl">🇵🇭 Tagalog</option>
        </select>
        <button @click="showTutorialModal = true" class="bg-white text-green-800 px-3 py-1 rounded">❓ Tutorial</button>
      </div>
    </template>

    <div class="space-y-6">
      <!-- TOP ROW: Welcome + Weakness Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Welcome Section -->
        <section class="bg-white rounded-xl shadow p-6 border border-green-200 flex flex-col" style="height: fit-content; min-height: 350px;">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h2 class="text-lg font-bold text-green-800 mb-1">
                {{ hasTakenExams ? '📊 Welcome Back!' : '🎉 Welcome to Mock Exams!' }}
              </h2>
              <p class="text-gray-500 text-sm">
                {{ hasTakenExams
                  ? 'Continue your journey. Take the comprehensive exam again or practice specific topics below.'
                  : 'Take the initial assessment to identify your strengths and areas for improvement.'
                }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-4">
            <button @click="startInitialExam" :disabled="loading"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2">
              <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span v-else>📝</span>
              {{ loading ? 'Loading...' : (hasTakenExams ? 'Take Comprehensive Assessment Again' : 'Start Initial Assessment') }}
            </button>
            <button v-if="hasTakenExams" @click="scrollToQuizzes"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2">
              📚 Browse Topic Quizzes
            </button>
          </div>

          <div class="flex-1"></div>

          <div v-if="hasTakenExams" class="pt-4 border-t border-green-100">
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-green-50 p-3 rounded-xl">
                <div class="text-2xl font-bold text-green-700">{{ uniqueExamsTaken }}</div>
                <div class="text-xs text-gray-500 mt-0.5">Quizzes Taken</div>
              </div>
              <div class="bg-green-50 p-3 rounded-xl">
                <div class="text-2xl font-bold text-green-700">{{ overallAvgScore }}%</div>
                <div class="text-xs text-gray-500 mt-0.5">Avg Best Score</div>
              </div>
              <div class="bg-green-50 p-3 rounded-xl">
                <div class="text-2xl font-bold text-green-700">{{ latestResultsPerQuiz.filter(r => r.bestScore >= 70).length }}</div>
                <div class="text-xs text-gray-500 mt-0.5">Passed</div>
              </div>
            </div>
          </div>
          <div v-if="!hasTakenExams" class="pt-4 border-t border-green-100 text-center text-gray-400">
            <p class="text-xs">Your stats will appear here after completing your first quiz.</p>
          </div>
        </section>

        <!-- Weakness Analysis Panel -->
        <section class="bg-white rounded-xl shadow border border-orange-200 flex flex-col overflow-hidden" style="height: 350px;">
          <div class="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 border-b border-orange-100 shrink-0">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-orange-700">🔍 Weakness Analysis</h2>
                <p class="text-xs text-gray-500 mt-0.5">Your weak spots — questions to review and retake</p>
              </div>
              <div v-if="hasTakenExams && allWeaknessGroups.length > 0" class="text-right shrink-0 ml-3">
                <div class="text-2xl font-extrabold text-red-500 leading-none">{{ totalWeakCount }}</div>
                <div class="text-xs text-gray-400 mt-0.5">issues left</div>
              </div>
            </div>
          </div>

          <div v-if="!hasTakenExams" class="flex-1 flex items-center justify-center p-8">
            <div class="text-center text-gray-400">
              <div class="text-5xl mb-3">📝</div>
              <p class="text-sm font-medium">No quizzes taken yet</p>
              <p class="text-xs mt-1">Take a quiz to see your weakness analysis here.</p>
            </div>
          </div>

          <div v-else-if="allWeaknessGroups.length === 0" class="flex-1 flex items-center justify-center p-8">
            <div class="text-center">
              <div class="text-5xl mb-3">🎉</div>
              <p class="text-sm font-bold text-green-600">All questions answered correctly!</p>
              <p class="text-xs mt-1 text-gray-400">No weaknesses detected across all your quizzes.</p>
            </div>
          </div>

          <div v-else class="overflow-y-auto flex-1 px-4 py-3 space-y-3 weakness-scrollbar">
            <div v-for="group in allWeaknessGroups" :key="group.quizId" class="rounded-xl border border-orange-100 overflow-hidden shadow-sm">
              <div class="bg-orange-50 px-4 py-2.5 flex items-center justify-between">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
                  <span class="font-bold text-orange-800 text-sm truncate">{{ group.quizTitle }}</span>
                </div>
                <span class="shrink-0 ml-2 text-xs font-bold text-white bg-red-400 rounded-full px-2.5 py-0.5">{{ group.totalWrong }}</span>
              </div>
              <div class="divide-y divide-gray-100 bg-white">
                <div v-for="sub in group.subcategories" :key="sub.name" class="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-gray-700 truncate">{{ sub.name }}</span>
                      <span class="shrink-0 text-xs bg-red-50 text-red-500 border border-red-200 rounded-full px-1.5 leading-5 font-bold">{{ sub.questions.length }}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-1 mt-1.5">
                      <div class="bg-gradient-to-r from-red-400 to-orange-400 h-1 rounded-full transition-all duration-500"
                        :style="{ width: Math.min((sub.questions.length / group.totalWrong) * 100, 100) + '%' }"></div>
                    </div>
                  </div>
                  <button @click="retakeSubcategory(sub.questions, sub.name, group.quizId, group.quizTitle)"
                    class="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-3 py-1.5 rounded-lg font-semibold transition"
                    :disabled="loading">
                    🔁 Retake
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="allWeaknessGroups.length > 2" class="text-[9px] text-gray-400 text-center pb-1 border-t border-orange-100">
            ⬇️ scroll for more
          </div>
        </section>
      </div>

      <!-- AI Recommendation -->
      <section v-if="hasTakenExams && weaknessAnalysis.length > 0" class="bg-white rounded-xl shadow p-6 border border-green-200">
        <h2 class="text-lg font-bold text-green-800 mb-4">📊 AI-Powered Performance Analysis</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 class="font-bold text-gray-700 mb-3 text-sm">Performance by Topic</h3>
            <div class="space-y-3">
              <div v-for="item in weaknessAnalysis" :key="item.category">
                <div class="flex justify-between mb-1 text-sm">
                  <span class="font-medium text-gray-700">{{ item.category }}</span>
                  <span :class="getScoreColorClass(item.score)" class="font-bold">{{ item.score }}%</span>
                </div>
                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full" :class="item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'"
                    :style="{ width: item.score + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-green-50 p-4 rounded-xl border border-green-200">
            <h3 class="font-bold text-green-800 mb-3 text-sm">AI Recommendations</h3>
            <ul class="space-y-1.5 mb-4">
              <li v-for="r in aiRecommendations" :key="r.id" class="flex items-start gap-2 text-sm">
                <span class="text-red-500 mt-0.5">•</span>{{ r.title }}
              </li>
            </ul>
            <button @click="startRecommendedExam" :disabled="loading"
              class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              Start AI-Recommended Practice
            </button>
          </div>
        </div>
        <div v-if="aiSummary" class="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <h4 class="font-bold text-blue-800 mb-1 text-sm">AI Analysis Summary</h4>
          <p class="text-sm text-gray-700">{{ aiSummary }}</p>
        </div>
      </section>

      <!-- Quizzes Table -->
      <section class="bg-white rounded-xl shadow p-6 border border-green-200 quizzes-section">
        <h2 class="text-lg font-bold text-green-800 mb-4">Available Quizzes</h2>
        <div class="overflow-hidden rounded-xl border border-green-700">
          <table class="w-full border-collapse text-sm text-left">
            <thead class="bg-green-700 text-white">
              <tr>
                <th class="py-3 px-4 border-r border-green-600">Quiz Title</th>
                <th class="py-3 px-4 border-r border-green-600">Course</th>
                <th class="py-3 px-4 border-r border-green-600">Best Score</th>
                <th class="py-3 px-4 border-r border-green-600">Status</th>
                <th class="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="quiz in filteredQuizzes" :key="quiz.id" class="bg-white hover:bg-gray-50">
                <td class="py-3 px-4 border-t border-green-700">{{ quiz.title }}</td>
                <td class="py-3 px-4 border-t border-green-700 text-gray-500">{{ quiz.course_name || 'General' }}</td>
                <td class="py-3 px-4 border-t border-green-700 font-bold" :class="getScoreColorClass(getCumulativeScoreForQuiz(quiz.id))">
                  {{ getCumulativeScoreForQuiz(quiz.id) }}%
                </td>
                <td class="py-3 px-4 border-t border-green-700 font-semibold" :class="getStatusClass(quiz.id)">{{ getExamStatus(quiz.id) }}</td>
                <td class="py-3 px-4 border-t border-green-700">
                  <button @click="takeExam(quiz.id)" :disabled="loading"
                    class="text-white text-xs px-4 py-2 rounded-lg font-semibold transition" :class="getButtonClass(quiz.id)">
                    {{ getButtonText(quiz.id) }}
                  </button>
                </td>
              </tr>
              <tr v-if="availableQuizzes.length === 0 && !loading">
                <td colspan="5" class="py-6 text-center text-gray-400">No quizzes available.</td>
              </tr>
              <tr v-if="loading">
                <td colspan="5" class="py-6 text-center">
                  <div class="flex justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Results Table -->
      <section class="bg-white rounded-xl shadow p-6 border border-green-200">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-green-800">Recent Quiz Results</h2>
          <div class="flex items-center gap-3">
            <button v-if="examResults.length > 0" @click="confirmClearAllResults"
              class="text-red-600 hover:text-red-800 text-sm font-semibold border border-red-200 px-3 py-1 rounded-lg flex items-center gap-1">
              🗑️ Clear All
            </button>
            <span class="text-sm text-gray-500">{{ latestResultsPerQuiz.length }} quiz{{ latestResultsPerQuiz.length !== 1 ? 'zes' : '' }}</span>
          </div>
        </div>
        <div class="overflow-hidden rounded-xl border border-green-700">
          <table class="w-full border-collapse text-sm text-left">
            <thead class="bg-green-700 text-white">
              <tr>
                <th class="py-3 px-4 border-r border-green-600">Quiz Title</th>
                <th class="py-3 px-4 border-r border-green-600">Last Taken</th>
                <th class="py-3 px-4 border-r border-green-600">Best Score</th>
                <th class="py-3 px-4 border-r border-green-600">Attempts</th>
                <th class="py-3 px-4 border-r border-green-600">Remarks</th>
                <th class="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in latestResultsPerQuiz" :key="result.exam_id" class="bg-white hover:bg-gray-50">
                <td class="py-3 px-4 border-t border-green-700">{{ result.exam_title }}</td>
                <td class="py-3 px-4 border-t border-green-700 text-gray-500">{{ formatDate(result.completed_at) }}</td>
                <td class="py-3 px-4 border-t border-green-700 font-bold" :class="getScoreColorClass(result.bestScore)">{{ result.bestScore }}%</td>
                <td class="py-3 px-4 border-t border-green-700 text-gray-500">{{ result.attempts }}×</td>
                <td class="py-3 px-4 border-t border-green-700">{{ getRemarks(result.bestScore) }}</td>
                <td class="py-3 px-4 border-t border-green-700">
                  <div class="flex items-center gap-2">
                    <button @click="reviewExam(result.latestAttempt)" class="text-blue-600 hover:text-blue-800 font-semibold hover:underline text-xs">View</button>
                    <button @click="confirmDeleteQuizResults(result.exam_id, result.exam_title)"
                      class="text-red-500 hover:text-red-700 font-semibold text-xs border-l border-gray-300 pl-2">
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="examResults.length === 0 && !loading">
                <td colspan="6" class="py-6 text-center text-gray-400">No exam results yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="examResults.length > 0" class="mt-2 text-xs text-gray-400 text-right">
          Total attempts: {{ examResults.length }}
        </div>
      </section>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="showDeleteModal = false">
      <div class="bg-white w-80 rounded-xl shadow-2xl overflow-hidden">
        <div class="bg-red-600 px-4 py-3">
          <h3 class="text-white font-bold text-sm">⚠️ Confirm Deletion</h3>
        </div>
        <div class="p-4">
          <p class="text-sm text-gray-700 mb-3">{{ deleteMessage }}</p>
          <div class="flex justify-end gap-2">
            <button @click="showDeleteModal = false" class="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-xs font-semibold">Cancel</button>
            <button @click="executeDelete" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tutorial Modal -->
    <div v-if="showTutorialModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="showTutorialModal = false">
      <div class="bg-white w-3/4 max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
        <div class="bg-green-700 px-6 py-4 flex items-center justify-between">
          <h3 class="text-white font-bold text-lg">❓ How This Works</h3>
          <button @click="showTutorialModal = false" class="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div class="p-6">
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
        <div class="px-6 pb-5 flex justify-end">
          <button @click="showTutorialModal = false" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold">Got it!</button>
        </div>
      </div>
    </div>

    <!-- Exam Modal -->
    <div v-if="showExamModal" class="fixed inset-0 flex items-center justify-center backdrop z-50">
      <div class="bg-white w-4/5 max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div class="bg-green-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div class="min-w-0">
            <h3 class="font-bold text-base leading-tight truncate">{{ currentExam?.title }}</h3>
            <span v-if="retakeLabel" class="inline-block mt-0.5 text-xs bg-orange-400 text-white font-semibold px-2 py-0.5 rounded-full">
              🔁 {{ retakeLabel }}
            </span>
          </div>
          <div class="flex items-center gap-4 shrink-0 ml-4">
            <div class="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5">
              <span class="text-xs text-white/70">⏱</span>
              <span class="font-mono font-bold text-sm" :class="timeRemaining < 300 ? 'text-red-300' : 'text-white'">{{ formattedTime }}</span>
            </div>
            <button @click="closeExamModal"
              class="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
              ✕ Exit
            </button>
          </div>
        </div>

        <div class="bg-gray-100 shrink-0">
          <div class="flex justify-between items-center px-6 py-2 text-xs text-gray-500">
            <span>Question {{ currentQuestionIndex + 1 }} of {{ currentQuestions.length }}</span>
            <span>{{ answeredCount }} answered</span>
          </div>
          <div class="h-1.5 bg-gray-200">
            <div class="h-full bg-green-500 transition-all duration-300" :style="{ width: progressWidth }"></div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5">
          <div v-if="currentQuestion" class="fade-in">
            <div v-if="currentQuestion.symbol" class="mb-5 flex justify-center">
              <div class="bg-gray-50 border-2 border-gray-200 rounded-2xl px-10 py-5 text-6xl shadow-inner select-none">
                {{ currentQuestion.symbol }}
              </div>
            </div>
            <p class="text-gray-800 font-semibold text-base mb-5 leading-relaxed">
              {{ currentQuestionIndex + 1 }}. {{ getLocalizedText(currentQuestion.stem) }}
            </p>
            <div class="space-y-2.5">
              <label v-for="choice in currentQuestion.choices" :key="choice.key"
                :for="`opt-${currentQuestionIndex}-${choice.key}`"
                class="flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all"
                :class="userAnswers[currentQuestionIndex] === choice.key.toUpperCase()
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40'">
                <input type="radio"
                  :id="`opt-${currentQuestionIndex}-${choice.key}`"
                  :name="`ans-${currentQuestionIndex}`"
                  :value="choice.key.toUpperCase()"
                  :checked="userAnswers[currentQuestionIndex] === choice.key.toUpperCase()"
                  @change="selectAnswer(currentQuestionIndex, choice.key.toUpperCase())"
                  class="mt-0.5 h-4 w-4 text-green-600 border-gray-300 shrink-0">
                <span class="text-sm text-gray-700 leading-relaxed">
                  <span class="font-bold text-gray-800">{{ choice.key.toUpperCase() }}.</span>
                  {{ getLocalizedText(choice) }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
          <button @click="previousQuestion" :disabled="currentQuestionIndex === 0"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
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
                :class="i === currentQuestionIndex ? 'bg-green-600 w-3'
                  : userAnswers[i] ? 'bg-green-400'
                  : skippedIndices.has(i) ? 'bg-orange-400'
                  : 'bg-gray-300'"></div>
              <span v-if="currentQuestions.length > 10" class="text-xs text-gray-400 ml-1">…</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button v-if="!userAnswers[currentQuestionIndex]" @click="skipQuestion"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition">
              ⏭️ Skip
            </button>
            <button v-else-if="currentQuestionIndex < currentQuestions.length - 1" @click="nextQuestion"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition">
              Next →
            </button>
            <button v-else-if="currentQuestionIndex === currentQuestions.length - 1 && skippedQuestions.length === 0" @click="submitExam"
              class="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition">
              ✅ Submit
            </button>
            <button v-else-if="currentQuestionIndex === currentQuestions.length - 1 && skippedQuestions.length > 0" @click="nextQuestion"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition">
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Exam Results Modal -->
    <div v-if="showResultsModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="showResultsModal = false">
      <div class="bg-white w-full max-w-xl mx-4 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div class="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-white font-bold text-base">{{ retakeLabel ? '🔁 Retake Results' : '📊 Exam Results' }}</h3>
            <p v-if="retakeLabel" class="text-green-200 text-xs mt-0.5">{{ retakeLabel }}</p>
          </div>
          <button @click="showResultsModal = false" class="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div class="overflow-y-auto flex-1 p-6">
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
              <div v-for="item in currentWeaknessAnalysis" :key="item.category" class="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div class="flex justify-between text-sm mb-1.5">
                  <span class="font-semibold text-gray-700">{{ item.category }}</span>
                  <span class="font-bold" :class="getScoreColorClass(item.score)">{{ item.score }}%</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-700"
                    :class="item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-400' : 'bg-red-500'"
                    :style="{ width: item.score + '%' }"></div>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ item.correct_answers }} / {{ item.total_questions }} correct</p>
              </div>
            </div>
          </div>
          <div v-if="currentRecommendation" class="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 class="font-bold text-blue-800 mb-1 text-sm">💡 Recommendation</h4>
            <p class="text-sm text-gray-700">{{ currentRecommendation }}</p>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-2xl shrink-0">
          <button @click="showResultsModal = false" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition text-sm">Close</button>
        </div>
      </div>
    </div>

    <!-- Review Exam Modal -->
    <div v-if="showReviewModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="showReviewModal = false">
      <div class="bg-white w-4/5 max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div class="bg-green-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div class="min-w-0">
            <h3 class="font-bold text-base truncate">📋 Review: {{ currentReviewAttempt?.exam_title }}</h3>
            <p class="text-green-200 text-xs mt-0.5">
              Score: {{ currentReviewAttempt?.score }}% · {{ currentReviewAttempt?.correct_answers }}/{{ currentReviewAttempt?.total_questions }} correct
            </p>
          </div>
          <button @click="showReviewModal = false" class="text-white/70 hover:text-white text-2xl leading-none ml-4 shrink-0">&times;</button>
        </div>
        <div class="overflow-y-auto flex-1 p-5 space-y-4">
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
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end rounded-b-2xl shrink-0">
          <button @click="showReviewModal = false" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition text-sm">Close</button>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from './StudentLayout.vue'
import axios from 'axios'

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
      baseURL: 'http://localhost:3000/api',
      withCredentials: true,
    })

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

    const currentScore            = ref(0)
    const currentWeaknessAnalysis = ref([])
    const currentRecommendation   = ref('')

    const currentReviewAttempt    = ref(null)
    const currentReviewAnswers    = ref([])
    const retakeLabel             = ref('')
    const retakeParentQuizId      = ref(null)

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

    // ── Latest result per quiz (for the results table) ───────
    const latestResultsPerQuiz = computed(() => {
      const map = {}
      examResults.value.forEach(r => {
        const cumScore = getCumulativeScoreForQuiz(r.exam_id)
        if (!map[r.exam_id]) {
          map[r.exam_id] = { exam_id: r.exam_id, exam_title: r.exam_title, bestScore: cumScore, attempts: 1, completed_at: r.completed_at, latestAttempt: r }
        } else {
          map[r.exam_id].attempts++
          map[r.exam_id].bestScore = cumScore
          if (new Date(r.completed_at) > new Date(map[r.exam_id].completed_at)) {
            map[r.exam_id].completed_at = r.completed_at
            map[r.exam_id].latestAttempt = r
          }
        }
      })
      return Object.values(map).slice(0, 10)
    })

    const uniqueExamsTaken = computed(() => new Set(examResults.value.map(r => r.exam_id)).size)
    const overallAvgScore  = computed(() => {
      if (!latestResultsPerQuiz.value.length) return 0
      return Math.round(latestResultsPerQuiz.value.reduce((s, r) => s + r.bestScore, 0) / latestResultsPerQuiz.value.length)
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

    // ── Delete functions ─────────────────────────────────────
    const confirmDeleteQuizResults = (quizId, quizTitle) => {
      deleteMode.value    = 'single'
      deleteQuizId.value  = quizId
      deleteMessage.value = `Delete all results for "${quizTitle}"? This cannot be undone.`
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
        if (deleteMode.value === 'single' && deleteQuizId.value) {
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
      retakeLabel.value        = `${quizTitle} › ${subcatName}`
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
        const parentTitle   = parentQuiz?.title || currentExam.value.course_name || currentExam.value.title

        // Calculate score
        let scoreToSave = 0
        let correctCount = 0
        if (isRetake && parentQuiz?.questions) {
          // Merge retake answers into existing mastery to compute cumulative score
          const tempMastery = { ...(masteryMap.value[parentQuizId] || {}) }
          currentQuestions.value.forEach((q, i) => {
            const ans = userAnswers.value[i]
            if (ans !== null) {
              tempMastery[q.id] = { answer: ans, correct: ans.toLowerCase() === q.correct_key?.toLowerCase() }
            }
          })
          const totalCorrect = parentQuiz.questions.filter(q => tempMastery[q.id]?.correct).length
          scoreToSave  = Math.round((totalCorrect / parentQuiz.questions.length) * 100)
          correctCount = totalCorrect
        } else {
          correctCount = currentQuestions.value.filter((q, i) => userAnswers.value[i]?.toLowerCase() === q.correct_key?.toLowerCase()).length
          scoreToSave  = Math.round((correctCount / currentQuestions.value.length) * 100)
        }

        currentScore.value = scoreToSave
        loading.value      = true

        // Local analysis for results modal
        const analysis = performLocalAnalysis(currentQuestions.value, userAnswers.value)
        currentWeaknessAnalysis.value = analysis.weakness_analysis || []
        currentRecommendation.value   = analysis.recommendation || ''

        // Save to DB
        await apiCall('/student/mock-exam/attempts', 'POST', {
          exam_id:              parentQuizId,
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
      const quiz = attempt.exam_id === 'quiz-0'
        ? comprehensiveExam.value
        : availableQuizzes.value.find(q => q.id === attempt.exam_id) || availableQuizzes.value.find(q => q.title === attempt.exam_title)
      if (!quiz) return

      const masterMap = getMasterAnswersForQuiz(attempt.exam_id, quiz.questions)
      currentQuestions.value      = quiz.questions
      currentReviewAnswers.value  = quiz.questions.map(q => masterMap[q.id]?.answer || null)
      currentReviewAttempt.value  = {
        ...attempt,
        score:           getCumulativeScoreForQuiz(attempt.exam_id),
        total_questions: quiz.questions.length,
        correct_answers: Object.values(masterMap).filter(v => v.correct).length,
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

    const closeExamModal = () => {
      if (confirm('Exit the exam? Your progress will be lost.')) {
        if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
        showExamModal.value      = false
        retakeLabel.value        = ''
        retakeParentQuizId.value = null
      }
    }

    onMounted(() => loadInitialData())

    return {
      user, currentLanguage, availableQuizzes, examResults, masteryMap, searchQuery,
      loading, showTutorialModal, showExamModal, showResultsModal, showReviewModal,
      showDeleteModal, deleteMessage,
      weaknessAnalysis, aiRecommendations, aiSummary,
      currentExam, currentQuestions, currentQuestionIndex, userAnswers, timeRemaining,
      currentScore, currentWeaknessAnalysis, currentRecommendation,
      currentReviewAttempt, currentReviewAnswers, retakeLabel,
      allWeaknessGroups, totalWeakCount, latestResultsPerQuiz, uniqueExamsTaken, overallAvgScore,
      hasTakenExams, filteredQuizzes, currentQuestion, answeredCount, formattedTime, progressWidth,
      skippedQuestions, skippedIndices, isReviewingSkipped,
      getLocalizedText, getOptionText, getOptionReviewClass, isReviewCorrect,
      takeExam, startExam, startInitialExam, startRecommendedExam, retakeSubcategory,
      selectAnswer, previousQuestion, nextQuestion, submitExam, reviewExam, skipQuestion,
      updateUserLanguage, closeExamModal, scrollToQuizzes,
      getScoreColorClass, getStatusClass, getButtonClass, getButtonText, getExamStatus,
      getCumulativeScoreForQuiz, formatDate, getRemarks, getResultMessage,
      confirmDeleteQuizResults, confirmClearAllResults, executeDelete,
    }
  }
}
</script>

<style scoped>
.backdrop { background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); }
.fade-in  { animation: fadeIn 0.3s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.weakness-scrollbar::-webkit-scrollbar       { width: 6px; }
.weakness-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
.weakness-scrollbar::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
.weakness-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
.weakness-scrollbar { scrollbar-width: thin; scrollbar-color: #f97316 #f1f1f1; }
</style>