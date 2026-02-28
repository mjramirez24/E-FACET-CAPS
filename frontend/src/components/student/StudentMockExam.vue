<template>
  <StudentLayout active-page="student-quiz">
    <!-- Header Content Slot -->
    <template #header-left>
      <input 
        type="text" 
        placeholder="Search quizzes..." 
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
      <div class="flex items-center gap-3">
        <select 
          v-model="currentLanguage" 
          @change="updateUserLanguage"
          class="bg-white text-green-800 px-3 py-1 rounded border border-green-600"
        >
          <option value="en">🇺🇸 English</option>
          <option value="tl">🇵🇭 Tagalog</option>
        </select>
        <button @click="showTutorialModal = true" class="bg-white text-green-800 px-3 py-1 rounded">❓ Tutorial</button>
      </div>
    </template>

    <!-- Main Content -->
    <div class="space-y-6">
      <!-- Welcome Section - Always Visible -->
      <section class="bg-white rounded-xl shadow p-6 mb-6 border border-green-200">
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-lg font-bold text-green-800 mb-2">
              {{ hasTakenExams ? '📊 Welcome Back!' : '🎉 Welcome to Mock Exams!' }}
            </h2>
            <p class="text-gray-600 mb-4">
              {{ hasTakenExams 
                ? 'Continue your learning journey. Take the comprehensive assessment again to track your progress or try topic-specific quizzes below.' 
                : 'It looks like this is your first time here. To get started, take our initial assessment exam to identify your strengths and areas for improvement.' 
              }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-600">Language:</span>
            <select 
              v-model="currentLanguage" 
              class="border border-gray-300 rounded px-2 py-1"
              @change="updateUserLanguage"
            >
              <option value="en">English</option>
              <option value="tl">Tagalog</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-4 mt-2">
          <button 
            @click="startInitialExam" 
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition font-semibold"
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Loading...
            </span>
            <span v-else class="flex items-center gap-2">
              <span class="text-xl">📝</span>
              {{ hasTakenExams ? 'Take Comprehensive Assessment Again' : 'Start Initial Assessment' }}
            </span>
          </button>
          
          <button 
            v-if="hasTakenExams"
            @click="scrollToQuizzes" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition font-semibold"
          >
            <span class="flex items-center gap-2">
              <span class="text-xl">📚</span>
              Browse Topic Quizzes
            </span>
          </button>
        </div>

        <!-- Progress Stats (if may exams na) -->
        <div v-if="hasTakenExams" class="mt-6 pt-4 border-t border-green-100">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="bg-green-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-green-700">{{ examResults.length }}</div>
              <div class="text-sm text-gray-600">Exams Taken</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-green-700">
                {{ Math.round(examResults.reduce((acc, curr) => acc + curr.score, 0) / examResults.length) || 0 }}%
              </div>
              <div class="text-sm text-gray-600">Average Score</div>
            </div>
            <div class="bg-green-50 p-3 rounded-lg">
              <div class="text-2xl font-bold text-green-700">
                {{ examResults.filter(r => r.score >= 70).length }}
              </div>
              <div class="text-sm text-gray-600">Passed Exams</div>
            </div>
          </div>
        </div>
      </section>

      <!-- AI Recommendation Section -->
      <section v-if="hasTakenExams && weaknessAnalysis.length > 0" class="bg-white rounded-xl shadow p-6 mb-6 border border-green-200">
        <h2 class="text-lg font-bold text-green-800 mb-4">📊 AI-Powered Performance Analysis</h2>
        <p class="text-gray-600 mb-4">Based on your performance, our AI has identified areas where you need more practice:</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <!-- Weakness Analysis -->
          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 class="font-bold text-gray-700 mb-2">Performance Analysis</h3>
            <div class="space-y-3">
              <div v-for="item in weaknessAnalysis" :key="item.category" class="mb-3">
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium">{{ item.category }}</span>
                  <span class="text-sm font-medium">{{ item.score }}%</span>
                </div>
                <div class="progress-bar bg-gray-200">
                  <div 
                    class="progress-fill" 
                    :class="getScoreColorClass(item.score)"
                    :style="{ width: item.score + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recommended Exams -->
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 class="font-bold text-green-800 mb-2">AI Recommendations</h3>
            <ul class="space-y-2 mb-4">
              <li 
                v-for="recommendation in aiRecommendations" 
                :key="recommendation.id"
                class="flex items-center py-1"
              >
                <span class="text-red-600 mr-2">•</span>
                <span class="text-sm">{{ recommendation.title }}</span>
              </li>
            </ul>
            <button 
              @click="startRecommendedExam" 
              class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition w-full"
              :disabled="loading"
            >
              <span v-if="loading">Loading...</span>
              <span v-else>Start AI-Recommended Practice</span>
            </button>
          </div>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 class="font-bold text-blue-800 mb-2">AI Analysis Summary</h3>
          <p class="text-sm text-gray-700">
            {{ aiSummary }}
          </p>
        </div>
      </section>

      <!-- Quizzes Table -->
      <section class="bg-white rounded-xl shadow p-6 mb-6 border border-green-200 quizzes-section">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-green-800">Available Quizzes</h2>
        </div>
        <div class="overflow-hidden rounded-lg border border-green-700">
          <table class="w-full border-collapse text-sm text-left">
            <thead class="bg-green-700 text-white">
              <tr>
                <th class="py-3 px-4 border-r border-green-600">Quiz Title</th>
                <th class="py-3 px-4 border-r border-green-600">Course</th>
                <th class="py-3 px-4 border-r border-green-600">Status</th>
                <th class="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="quiz in filteredQuizzes" 
                :key="quiz.id"
                class="bg-white hover:bg-gray-50"
              >
                <td class="py-3 px-4 border-t border-green-700">{{ quiz.title }}</td>
                <td class="py-3 px-4 border-t border-green-700">{{ quiz.course_name || 'General' }}</td>
                <td class="py-3 px-4 border-t border-green-700 font-semibold" :class="getStatusClass(quiz.id)">
                  {{ getExamStatus(quiz.id) }}
                </td>
                <td class="py-3 px-4 border-t border-green-700">
                  <button 
                    @click="takeExam(quiz.id)"
                    class="text-white text-sm px-4 py-2 rounded transition"
                    :class="getButtonClass(quiz.id)"
                    :disabled="loading"
                  >
                    {{ getButtonText(quiz.id) }}
                  </button>
                </td>
              </tr>
              <tr v-if="availableQuizzes.length === 0 && !loading">
                <td colspan="4" class="py-4 px-4 border-t border-green-700 text-center text-gray-500">
                  No quizzes available at the moment.
                </td>
              </tr>
              <tr v-if="loading">
                <td colspan="4" class="py-4 px-4 border-t border-green-700 text-center">
                  <div class="flex justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Quiz Results Summary -->
      <section class="bg-white rounded-xl shadow p-6 border border-green-200">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-green-800">Recent Quiz Results</h2>
          <div class="text-sm text-gray-600">
            Showing {{ Math.min(examResults.length, 10) }} of {{ examResults.length }} results
          </div>
        </div>
        <div class="overflow-hidden rounded-lg border border-green-700">
          <table class="w-full border-collapse text-sm text-left">
            <thead class="bg-green-700 text-white">
              <tr>
                <th class="py-3 px-4 border-r border-green-600">Quiz Title</th>
                <th class="py-3 px-4 border-r border-green-600">Date Taken</th>
                <th class="py-3 px-4 border-r border-green-600">Score</th>
                <th class="py-3 px-4 border-r border-green-600">Remarks</th>
                <th class="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="result in filteredResults" 
                :key="result.id"
                class="bg-white hover:bg-gray-50"
              >
                <td class="py-3 px-4 border-t border-green-700">{{ result.exam_title }}</td>
                <td class="py-3 px-4 border-t border-green-700">{{ formatDate(result.completed_at) }}</td>
                <td class="py-3 px-4 border-t border-green-700 font-semibold" :class="getScoreColorClass(result.score)">
                  {{ result.score }}%
                </td>
                <td class="py-3 px-4 border-t border-green-700">{{ getRemarks(result.score) }}</td>
                <td class="py-3 px-4 border-t border-green-700">
                  <button 
                    @click="reviewExam(result)" 
                    class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
              <tr v-if="examResults.length === 0 && !loading">
                <td colspan="5" class="py-4 px-4 border-t border-green-700 text-center text-gray-500">
                  No exam results yet. Take your first exam to see results here.
                </td>
              </tr>
              <tr v-if="loading">
                <td colspan="5" class="py-4 px-4 border-t border-green-700 text-center">
                  <div class="flex justify-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Modals -->
    <!-- Tutorial Modal -->
    <div v-if="showTutorialModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="showTutorialModal = false">
      <div class="bg-white w-3/4 max-w-3xl p-6 rounded-xl shadow-lg">
        <h3 class="text-xl font-bold mb-3">How this prototype works (quick tutorial)</h3>
        <ol class="list-decimal pl-5 space-y-2 text-sm text-gray-800">
          <li>Click <strong>Start Initial Assessment</strong> to take your first exam and establish your baseline performance.</li>
          <li>After completing the exam, our AI will analyze your results and identify your weak areas.</li>
          <li>Based on the AI analysis, the system will recommend specific exams to help you improve.</li>
          <li>Take the recommended exams to strengthen your knowledge in specific driving topics.</li>
          <li>As you take more exams, the AI will continue to refine its recommendations based on your performance.</li>
        </ol>
        <div class="mt-6 text-right">
          <button @click="showTutorialModal = false" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    </div>

    <!-- Exam Modal -->
    <div v-if="showExamModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="closeExamModal">
      <div class="bg-white w-4/5 max-w-4xl p-6 rounded-xl shadow-lg overflow-y-auto max-h-[80vh]">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">{{ currentExam.title }}</h3>
          <div class="flex items-center">
            <span class="text-sm text-gray-600 mr-2">Time:</span>
            <div class="font-bold" :class="timerClass">{{ formattedTime }}</div>
          </div>
        </div>
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>Question {{ currentQuestionIndex + 1 }} of {{ currentQuestions.length }}</span>
          </div>
          <div class="progress-bar bg-gray-200">
            <div class="progress-fill bg-green-500" :style="{ width: progressWidth }"></div>
          </div>
        </div>
        
        <!-- Current Question -->
        <div v-if="currentQuestion" class="fade-in p-4 border rounded-lg bg-gray-50">
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ currentQuestionIndex + 1 }}. {{ getLocalizedText(currentQuestion.stem) }}
            </h3>
          </div>
          
          <div class="space-y-3">
            <div 
              v-for="choice in currentQuestion.choices" 
              :key="choice.key"
              class="flex items-center"
            >
              <input 
                type="radio" 
                :id="`option-${currentQuestionIndex}-${choice.key}`"
                :name="`answer-${currentQuestionIndex}`"
                :value="choice.key.toUpperCase()"
                :checked="userAnswers[currentQuestionIndex] === choice.key.toUpperCase()"
                @change="selectAnswer(currentQuestionIndex, choice.key.toUpperCase())"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
              >
              <label 
                :for="`option-${currentQuestionIndex}-${choice.key}`"
                class="ml-3 block text-gray-700"
              >
                {{ choice.key.toUpperCase() }}. {{ getLocalizedText(choice) }}
              </label>
            </div>
          </div>
        </div>
        
        <div class="mt-4 flex justify-between">
          <button 
            @click="previousQuestion"
            :disabled="currentQuestionIndex === 0"
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div>
            <button 
              v-if="currentQuestionIndex < currentQuestions.length - 1"
              @click="nextQuestion"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
            >
              Next
            </button>
            
            <button 
              v-else
              @click="submitExam"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>

      <!-- Exam Results Modal -->
      <div v-if="showResultsModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="showResultsModal = false">
        <div class="bg-white w-3/4 max-w-2xl rounded-xl shadow-lg flex flex-col max-h-[80vh]">
          <!-- Fixed Header -->
          <div class="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 class="text-xl font-bold text-green-800">AI-Powered Exam Results</h3>
            <button @click="showResultsModal = false" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
          </div>
          
          <!-- Scrollable Content -->
          <div class="p-6 overflow-y-auto flex-1">
            <!-- Score Section -->
            <div class="text-center mb-6">
              <div class="text-4xl font-bold mb-2" :class="getScoreColorClass(currentScore)">{{ currentScore }}%</div>
              <p class="text-lg text-gray-700">{{ getResultMessage(currentScore) }}</p>
            </div>
            
            <!-- Performance Breakdown -->
            <div class="mb-6">
              <h4 class="font-bold text-gray-700 mb-4">AI Performance Breakdown</h4>
              <div class="space-y-4">
                <div v-for="item in currentWeaknessAnalysis" :key="item.category" class="bg-gray-50 p-4 rounded-lg">
                  <div class="flex justify-between mb-2">
                    <span class="font-medium">{{ item.category }}</span>
                    <span class="font-semibold" :class="getScoreColorClass(item.score)">{{ item.score }}%</span>
                  </div>
                  <div class="progress-bar bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                    <div 
                      class="progress-fill h-full transition-all duration-500" 
                      :class="getScoreColorClass(item.score).replace('text', 'bg')"
                      :style="{ width: item.score + '%' }"
                    ></div>
                  </div>
                  <p class="text-sm text-gray-600 mb-1">
                    {{ item.feedback || getWeaknessFeedback(item.category, item.score) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ item.correct_answers || 0 }} correct out of {{ item.total_questions || 0 }}
                  </p>
                </div>
              </div>
            </div>
            
            <!-- AI Recommendations -->
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 class="font-bold text-blue-800 mb-2">AI Recommendations</h4>
              <p class="text-sm text-gray-700">
                {{ currentRecommendation }}
              </p>
            </div>
          </div>
          
          <!-- Fixed Footer -->
          <div class="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div class="flex justify-end">
              <button @click="showResultsModal = false" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Review Exam Modal -->
      <div v-if="showReviewModal" class="fixed inset-0 flex items-center justify-center backdrop z-50" @click.self="showReviewModal = false">
        <div class="bg-white w-4/5 max-w-4xl rounded-xl shadow-lg flex flex-col max-h-[80vh]">
          <!-- Fixed Header -->
          <div class="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 class="text-xl font-bold text-green-800">Exam Review: {{ currentReviewAttempt?.exam_title }}</h3>
            <button @click="showReviewModal = false" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
          </div>
          
          <!-- Scrollable Content -->
          <div class="p-6 overflow-y-auto flex-1">
            <div class="space-y-4">
              <div v-for="(question, index) in currentQuestions" :key="index" class="p-4 border rounded-lg" :class="getReviewQuestionClass(index)">
                <div class="flex justify-between items-start mb-3">
                  <h4 class="font-semibold text-gray-800">Question {{ index + 1 }}</h4>
                  <span class="text-sm px-3 py-1 rounded-full font-medium" :class="getReviewStatusClass(index)">
                    {{ getReviewStatus(index) }}
                  </span>
                </div>
                
                <p class="text-gray-700 mb-4">{{ getLocalizedText(question.stem) }}</p>
                
                <div class="space-y-2 mb-4">
                    <div v-for="option in ['A', 'B', 'C']" :key="option" 
    class="flex items-start p-2 rounded border"
    :class="{ 
      'bg-green-100 border-green-500': currentReviewAnswers[index]?.toLowerCase() === option.toLowerCase() && option.toLowerCase() === question.correct_key?.toLowerCase(),
      'bg-red-100 border-red-400': currentReviewAnswers[index]?.toLowerCase() === option.toLowerCase() && option.toLowerCase() !== question.correct_key?.toLowerCase(),
      'bg-green-100 border-green-400': option.toLowerCase() === question.correct_key?.toLowerCase() && currentReviewAnswers[index]?.toLowerCase() !== option.toLowerCase(),
      'border-transparent': option.toLowerCase() !== question.correct_key?.toLowerCase() && currentReviewAnswers[index]?.toLowerCase() !== option.toLowerCase()
    }">
                    <span class="w-8 font-medium">{{ option }}.</span>
                    <span class="flex-1">{{ getOptionText(question, option) }}</span>
                    <span v-if="option === question.correct_key" class="ml-2 text-green-600">✓</span>
                  </div>
                </div>
                
                <div class="text-sm border-t pt-3 mt-2">
                  <p class="mb-1"><span class="font-medium">Your answer:</span> {{ currentReviewAnswers[index] || 'Not answered' }}</p>
                  <p class="mb-1"><span class="font-medium">Correct answer:</span> {{ question.correct_key }}</p>
                  <p v-if="question.rationale && getLocalizedText(question.rationale)" class="mt-2 text-blue-600 bg-blue-50 p-2 rounded">
                    <span class="font-medium">Explanation:</span> {{ getLocalizedText(question.rationale) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Fixed Footer -->
          <div class="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div class="flex justify-end">
              <button @click="showReviewModal = false" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
  </StudentLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import StudentLayout from './StudentLayout.vue'

export default {
  name: 'StudentMockExam',
  components: {
    StudentLayout
  },
  
  setup() {
    // API Configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    
    // State
    const user = ref({
      id: null,
      name: '',
      email: '',
      preferred_language: 'en'
    })
    
    const currentLanguage = ref('en')
    const availableQuizzes = ref([])
    const comprehensiveExam = ref(null) // Separate storage for comprehensive exam
    const examResults = ref([])
    const searchQuery = ref('')
    
    // UI State
    const loading = ref(false)
    const showTutorialModal = ref(false)
    const showExamModal = ref(false)
    const showResultsModal = ref(false)
    const showReviewModal = ref(false)
    
    // AI Analysis State
    const weaknessAnalysis = ref([])
    const aiRecommendations = ref([])
    const aiSummary = ref('')
    
    // Exam State
    const currentExam = ref(null)
    const currentQuestions = ref([])
    const currentQuestionIndex = ref(0)
    const userAnswers = ref([])
    const timeRemaining = ref(0)
    const timerInterval = ref(null)
    
    // Results State
    const currentScore = ref(0)
    const currentWeaknessAnalysis = ref([])
    const currentRecommendation = ref('')
    const usedAIModel = ref(false)
    
    // Review State
    const currentReviewAttempt = ref(null)
    const currentReviewAnswers = ref([])
    const questionBank = ref(null)

    // Load questions from JSON file
    const loadQuestionBank = async () => {
      try {
        console.log('Fetching question bank...')
        const response = await fetch('/question_bank.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Question bank loaded:', data)
        console.log('Number of questions:', data.questions?.length)
        return data
      } catch (error) {
        console.error('Error loading question bank:', error)
        return { questions: [] }
      }
    }
    
    // Helper function to get localized text
    const getLocalizedText = (textObj) => {
      if (!textObj) return ''
      return textObj[currentLanguage.value] || textObj.en || ''
    }
    
    // Helper function to get option text
    const getOptionText = (question, optionKey) => {
      if (!question || !question.choices) return ''
      const option = question.choices.find(c => c.key.toLowerCase() === optionKey.toLowerCase())
      return option ? getLocalizedText(option) : ''
    }
    
    // Create topic-based quizzes only (no comprehensive exam)
    const createTopicQuizzes = (questions) => {
      // Define topic categories for grouping
      const topicCategories = {
        'Traffic Rules & Signs': ['traffic_rules', 'traffic_signs', 'road_signs', 'traffic_lights', 'road_markings', 'lane_lines', 'yellow_lines', 'signals', 'regulatory', 'prohibitory', 'warning', 'lane_use_signs'],
        'Safe Driving': ['defensive_driving', 'safe_driving_rules', 'road_safety', 'hazard_awareness', 'driver_attitude', 'road_discipline'],
        'Licensing & Documents': ['licensing', 'driver_classification', 'professional_driver', 'requirements', 'age', 'renewal', 'validity', 'dl_codes', 'authorized_vehicles', 'lending_license'],
        'Violations & Penalties': ['violations', 'penalties', 'settlement_period', 'lto_process', 'temporary_operator_permit', 'suspension', 'confiscation', 'adjudication'],
        'Vehicle Operations': ['parking', 'overtaking', 'lane_change', 'turning', 'hand_signals', 'backing_up', 'vehicle_control', 'braking'],
        'Emergency & Accidents': ['road_emergency', 'road_crash', 'first_aid', 'breakdown', 'ewd', 'tire_blowout', 'emergency_vehicles'],
        'Special Vehicles': ['motorcycle', 'motorcycle_safety', 'public_utility_vehicle', 'bike_lane', 'cyclists'],
        'Driver Wellness': ['driver_fatigue', 'drowsy_driving', 'stress_management', 'road_rage'],
        'Child Safety': ['child_safety', 'child_restraint', 'children'],
        'Vehicle Maintenance': ['vehicle_maintenance', 'inspection', 'roadworthiness'],
        'Weather & Conditions': ['weather_driving', 'heavy_rain', 'night_driving', 'visibility', 'headlights'],
        'Right of Way': ['right_of_way', 'yield_sign', 'stop_sign', 'uncontrolled_intersection', 'pedestrians', 'crosswalk']
      }
      
      // Group questions by category
      const categoryGroups = {}
      
      // Initialize category groups
      Object.keys(topicCategories).forEach(category => {
        categoryGroups[category] = []
      })
      
      // Add an "Other" category for uncategorized topics
      categoryGroups['Other Topics'] = []
      
      // Assign questions to categories
      questions.forEach(question => {
        let assigned = false
        
        if (question.topic && Array.isArray(question.topic)) {
          for (const topic of question.topic) {
            for (const [category, topics] of Object.entries(topicCategories)) {
              if (topics.includes(topic)) {
                categoryGroups[category].push(question)
                assigned = true
                break
              }
            }
            if (assigned) break
          }
        }
        
        if (!assigned) {
          categoryGroups['Other Topics'].push(question)
        }
      })
      
      // Create quizzes for each category
      const quizzes = []
      let quizIndex = 1
      
      Object.entries(categoryGroups).forEach(([category, categoryQuestions]) => {
        const uniqueQuestions = Array.from(new Map(categoryQuestions.map(q => [q.id, q])).values())
        
        if (uniqueQuestions.length > 0) {
          quizzes.push({
            id: `quiz-${quizIndex}`,
            title: category,
            course_name: 'Driving Theory',
            questions: uniqueQuestions,
            time_limit: uniqueQuestions.length * 60
          })
          quizIndex++
        }
      })
      
      return quizzes
    }
    
    // Initialize data
    const initializeData = async () => {
      const bankData = await loadQuestionBank()
      const questions = bankData.questions || []
      
      // Store comprehensive exam separately with ALL questions
      const allUniqueQuestions = Array.from(new Map(questions.map(q => [q.id, q])).values())
      comprehensiveExam.value = {
        id: 'quiz-0',
        title: 'Comprehensive Assessment',
        course_name: 'Full Exam',
        questions: allUniqueQuestions,
        time_limit: Math.min(allUniqueQuestions.length * 60, 7200) // Max 2 hours
      }
      
      // Create topic-based quizzes (without comprehensive exam)
      availableQuizzes.value = createTopicQuizzes(questions)
      
      console.log('Comprehensive exam stored:', comprehensiveExam.value)
      console.log('Topic quizzes:', availableQuizzes.value)
    }
    
    // Computed Properties
    const hasTakenExams = computed(() => {
      return examResults.value.length > 0
    })
    
    const filteredQuizzes = computed(() => {
      if (!searchQuery.value.trim()) return availableQuizzes.value
      
      const query = searchQuery.value.toLowerCase()
      return availableQuizzes.value.filter(quiz => 
        quiz.title.toLowerCase().includes(query) ||
        (quiz.course_name && quiz.course_name.toLowerCase().includes(query))
      )
    })
    
    const filteredResults = computed(() => {
      return examResults.value.slice(0, 10)
    })
    
    // Exam Modal Computed
    const currentQuestion = computed(() => {
      return currentQuestions.value[currentQuestionIndex.value]
    })
    
    const formattedTime = computed(() => {
      const minutes = Math.floor(timeRemaining.value / 60)
      const seconds = timeRemaining.value % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    })
    
    const timerClass = computed(() => {
      return timeRemaining.value < 300 ? 'text-red-600' : 'text-green-700'
    })
    
    const progressWidth = computed(() => {
      return `${((currentQuestionIndex.value + 1) / currentQuestions.value.length) * 100}%`
    })
    
    // API Helper Functions
    async function apiCall(endpoint, method = 'GET', data = null) {
      const token = localStorage.getItem('token')
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
        
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return null
        }
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        return await response.json()
      } catch (error) {
        console.error('API call failed:', error)
        throw error
      }
    }
    
    async function fetchUserData() {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          return JSON.parse(userData)
        }
        
        const response = await apiCall('/auth/me')
        if (response && response.user) {
          localStorage.setItem('user', JSON.stringify(response.user))
          return response.user
        }
        
        return {
          id: null,
          name: 'Student',
          email: '',
          preferred_language: 'en'
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        return user.value
      }
    }
    
    async function fetchExamQuestions(examId) {
      // If it's the comprehensive exam, get from comprehensiveExam ref
      if (examId === 'quiz-0' && comprehensiveExam.value) {
        return comprehensiveExam.value.questions
      }
      
      // Otherwise, get from topic-based quizzes
      const quiz = availableQuizzes.value.find(q => q.id === examId)
      return quiz ? quiz.questions : []
    }
    
    async function submitExamAttempt(attemptData) {
      try {
        const response = await apiCall('/student/exam-attempts', 'POST', attemptData)
        return response.data || response.attempt || attemptData
      } catch (error) {
        console.error('Error submitting exam attempt:', error)
        return attemptData
      }
    }
    
    async function analyzePerformanceWithAI(questions, userAnswers) {
      try {
        const response = await apiCall('/ai/analyze-performance', 'POST', {
          questions: questions,
          user_answers: userAnswers
        })
        return response.data || response.analysis
      } catch (error) {
        console.error('Error analyzing performance:', error)
        return performLocalAnalysis(questions, userAnswers)
      }
    }
      // Local Analysis Fallback
      function performLocalAnalysis(questions, userAnswers) {
        const categories = {}
        let totalCorrect = 0
        
        console.log('Analyzing questions:', questions.length)
        console.log('User answers:', userAnswers)
        
        questions.forEach((question, index) => {
          const userAnswer = userAnswers[index]
          const isCorrect = userAnswer?.toLowerCase() === question.correct_key?.toLowerCase()
          
          if (isCorrect) totalCorrect++
          
          // Check if question has topics
          if (question.topic && Array.isArray(question.topic)) {
            question.topic.forEach(topic => {
              if (!categories[topic]) {
                categories[topic] = { correct: 0, total: 0, score: 0 }
              }
              
              categories[topic].total++
              if (isCorrect) {
                categories[topic].correct++
              }
            })
          } else {
            // If no topic, put in "General" category
            if (!categories['general']) {
              categories['general'] = { correct: 0, total: 0, score: 0 }
            }
            categories['general'].total++
            if (isCorrect) {
              categories['general'].correct++
            }
          }
        })

        console.log('Categories data:', categories)

        // Calculate scores for each category
        const weaknessAnalysis = []
        Object.keys(categories).forEach(category => {
          const data = categories[category]
          // Calculate percentage
          data.score = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
          
          // Format category name for display
          const formattedCategory = category.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          weaknessAnalysis.push({
            category: formattedCategory,
            score: data.score,
            correct_answers: data.correct,
            total_questions: data.total,
            weakness_score: 100 - data.score,
            feedback: getWeaknessFeedback(formattedCategory, data.score)
          })
        })

        // Sort by weakness (lowest score first)
        weaknessAnalysis.sort((a, b) => a.score - b.score)

        const totalScore = Math.round((totalCorrect / questions.length) * 100)

        console.log('Total correct:', totalCorrect)
        console.log('Total questions:', questions.length)
        console.log('Total score:', totalScore)
        console.log('Weakness analysis:', weaknessAnalysis)

        return {
          overall_score: totalScore,
          weakness_analysis: weaknessAnalysis,
          total_questions: questions.length,
          correct_answers: totalCorrect,
          used_model: false,
          recommendation: generateRecommendation(weaknessAnalysis)
        }
}
    
    function generateRecommendation(weaknessAnalysis) {
      if (weaknessAnalysis.length === 0) return "Complete more exams to get better recommendations."
      
      const weakest = weaknessAnalysis[0]
      if (weakest.score >= 80) {
        return "Excellent performance! You're well-prepared. Consider advanced topics."
      } else if (weakest.score >= 70) {
        return "Good performance. Focus on maintaining consistency across all areas."
      } else if (weakest.score >= 50) {
        return `You need practice in ${weakest.category}. Review the fundamentals and try again.`
      } else {
        return `You need significant practice in ${weakest.category}. Study the basics thoroughly before retaking the exam.`
      }
    }
    
    // Helper Functions
    function getScoreColorClass(score) {
      if (score >= 80) return 'text-green-600'
      if (score >= 60) return 'text-yellow-600'
      return 'text-red-600'
    }
    
    function getStatusClass(examId) {
      const hasTaken = examResults.value.some(r => r.exam_id === examId)
      return hasTaken ? 'text-green-600' : 'text-yellow-600'
    }
    
    function getButtonClass(examId) {
      const hasTaken = examResults.value.some(r => r.exam_id === examId)
      return hasTaken ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
    }
    
    function getButtonText(examId) {
      const hasTaken = examResults.value.some(r => r.exam_id === examId)
      return hasTaken ? 'Review' : 'Take Quiz'
    }
    
    function getExamStatus(examId) {
      const hasTaken = examResults.value.some(r => r.exam_id === examId)
      return hasTaken ? 'Completed' : 'Not Taken'
    }
    
    function formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    function getRemarks(score) {
      if (score >= 80) return 'Excellent'
      if (score >= 70) return 'Good'
      if (score >= 60) return 'Fair'
      return 'Needs Improvement'
    }
    
    function getResultMessage(score) {
      if (score >= 80) return 'Excellent! You passed with flying colors.'
      if (score >= 70) return 'Good job! You passed the exam.'
      return 'You need more practice. Try again!'
    }
    
    function getWeaknessFeedback(category, score) {
      const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
      
      const feedback = {
        high: `Excellent knowledge of ${category}.`,
        medium: `Good understanding of ${category} with room for improvement.`,
        low: `Focus on learning more about ${category}.`
      }
      
      return feedback[level]
    }
    
      function getReviewQuestionClass(index) {
        const userAnswer = currentReviewAnswers.value[index]  // ← add .value
        const correctAnswer = currentQuestions.value[index]?.correct_key
        const isCorrect = userAnswer?.toLowerCase() === correctAnswer?.toLowerCase()  // ← case-insensitive
        return isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }

      function getReviewStatusClass(index) {
        const userAnswer = currentReviewAnswers.value[index]  // ← add .value
        const correctAnswer = currentQuestions.value[index]?.correct_key
        const isCorrect = userAnswer?.toLowerCase() === correctAnswer?.toLowerCase()  // ← case-insensitive
        return isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
      }

      function getReviewStatus(index) {
        const userAnswer = currentReviewAnswers.value[index]  // ← add .value
        const correctAnswer = currentQuestions.value[index]?.correct_key
        const isCorrect = userAnswer?.toLowerCase() === correctAnswer?.toLowerCase()  // ← case-insensitive
        return isCorrect ? '✓ Correct' : '✗ Incorrect'
      }
    
    // Method to scroll to quizzes section
    const scrollToQuizzes = () => {
      const quizzesSection = document.querySelector('.quizzes-section')
      if (quizzesSection) {
        quizzesSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
    
    const loadInitialData = async () => {
      loading.value = true
      try {
        await initializeData()
        
        // Load user data
        user.value = await fetchUserData()
        currentLanguage.value = user.value.preferred_language || 'en'
        
        // Load user's exam results from localStorage
        const savedResults = localStorage.getItem('examResults')
        if (savedResults) {
          examResults.value = JSON.parse(savedResults)
        } else {
          examResults.value = []
        }
        
        // Load AI recommendations if user has taken exams
        if (hasTakenExams.value) {
          await loadAIRecommendations()
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        availableQuizzes.value = []
      } finally {
        loading.value = false
      }
    }
    
    const loadAIRecommendations = async () => {
      if (!hasTakenExams.value || !user.value.id) return
      
      try {
        const analysis = await analyzePerformanceWithAI([], [])
        
        if (analysis) {
          weaknessAnalysis.value = analysis.weakness_analysis || []
          aiRecommendations.value = analysis.recommendations || []
          aiSummary.value = analysis.summary || 'Complete more exams to get personalized recommendations.'
        }
      } catch (error) {
        console.error('Error loading AI recommendations:', error)
        weaknessAnalysis.value = []
        aiRecommendations.value = []
        aiSummary.value = 'AI analysis will be available after completing more exams.'
      }
    }
    
    const startExam = async (examId) => {
      loading.value = true
      try {
        // Determine which exam to use
        if (examId === 'quiz-0' && comprehensiveExam.value) {
          currentExam.value = comprehensiveExam.value
        } else {
          currentExam.value = availableQuizzes.value.find(q => q.id === examId)
        }
        
        if (!currentExam.value) {
          alert('Exam not found.')
          return
        }
        
        // Load questions
        currentQuestions.value = await fetchExamQuestions(examId)
        
        if (currentQuestions.value.length === 0) {
          alert('No questions found for this exam.')
          return
        }
        
        // Initialize exam state
        currentQuestionIndex.value = 0
        userAnswers.value = new Array(currentQuestions.value.length).fill(null)
        timeRemaining.value = currentExam.value.time_limit || 3600
        
        // Start timer
        startTimer()
        
        // Show exam modal
        showExamModal.value = true
      } catch (error) {
        console.error('Error starting exam:', error)
        alert('Failed to load exam. Please try again.')
      } finally {
        loading.value = false
      }
    }
    
    const takeExam = (examId) => {
      startExam(examId)
    }
    
    const startInitialExam = () => {
      if (comprehensiveExam.value) {
        startExam(comprehensiveExam.value.id)
      } else {
        alert('Comprehensive exam not available.')
      }
    }
    
    const startRecommendedExam = () => {
      if (aiRecommendations.value.length > 0) {
        const recommendedQuiz = availableQuizzes.value.find(q => 
          q.title.toLowerCase().includes(aiRecommendations.value[0].title.toLowerCase())
        )
        if (recommendedQuiz) {
          startExam(recommendedQuiz.id)
        } else if (availableQuizzes.value.length > 0) {
          startExam(availableQuizzes.value[0].id)
        }
      } else if (availableQuizzes.value.length > 0) {
        startExam(availableQuizzes.value[0].id)
      }
    }
    
    const startTimer = () => {
      if (timerInterval.value) clearInterval(timerInterval.value)
      
      timerInterval.value = setInterval(() => {
        timeRemaining.value--
        
        if (timeRemaining.value <= 0) {
          clearInterval(timerInterval.value)
          submitExam()
        }
      }, 1000)
    }
    
    const selectAnswer = (questionIndex, answer) => {
      userAnswers.value[questionIndex] = answer
    }
    
    const previousQuestion = () => {
      if (currentQuestionIndex.value > 0) {
        currentQuestionIndex.value--
      }
    }
    
    const nextQuestion = () => {
      if (currentQuestionIndex.value < currentQuestions.value.length - 1) {
        currentQuestionIndex.value++
      }
    }
    
const submitExam = async () => {
  try {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    
    showExamModal.value = false
    
    // FIX: Better answer comparison
      const correctAnswers = currentQuestions.value.filter((q, index) => {
        const userAnswer = userAnswers.value[index]
        const correctKey = q.correct_key
        
        // Convert both to lowercase for comparison
        return userAnswer?.toLowerCase() === correctKey?.toLowerCase()
      }).length
          
    const score = Math.round((correctAnswers / currentQuestions.value.length) * 100)
    currentScore.value = score
    
    // FIX: Show loading state
    loading.value = true
    
    // Call AI analysis (this causes delay)
    const analysis = await analyzePerformanceWithAI(currentQuestions.value, userAnswers.value)
    
    currentWeaknessAnalysis.value = analysis.weakness_analysis || []
    currentRecommendation.value = analysis.recommendation || generateRecommendation(currentWeaknessAnalysis.value)
    usedAIModel.value = analysis.used_model || false
    
    // Submit exam attempt
    const attemptData = {
      student_id: user.value.id || 'demo-user',
      exam_id: currentExam.value.id,
      exam_title: currentExam.value.title,
      score: score,
      total_questions: currentQuestions.value.length,
      correct_answers: correctAnswers,
      time_taken: (currentExam.value.time_limit || 3600) - timeRemaining.value,
      answers: [...userAnswers.value],
      language: currentLanguage.value,
      completed_at: new Date().toISOString()
    }
    
    const savedAttempt = await submitExamAttempt(attemptData)
    
    examResults.value.unshift({
      ...savedAttempt,
      exam_title: currentExam.value.title,
      completed_at: new Date().toISOString()
    })
    
    localStorage.setItem('examResults', JSON.stringify(examResults.value))
    
    if (examResults.value.length === 1) {
      await loadAIRecommendations()
    }
    
    // FIX: Turn off loading before showing modal
    loading.value = false
    showResultsModal.value = true
  } catch (error) {
    console.error('Error submitting exam:', error)
    alert('Failed to submit exam. Please try again.')
    loading.value = false
  }
}
    
    const reviewExam = (attempt) => {
      const quiz = availableQuizzes.value.find(q => q.title === attempt.exam_title)
      if (quiz) {
        currentQuestions.value = quiz.questions
      }
      
      currentReviewAttempt.value = attempt
      currentReviewAnswers.value = attempt.answers || []
      showReviewModal.value = true
    }
    
    const updateUserLanguage = async () => {
      if (user.value.id) {
        await updateUserLanguageApi(user.value.id, currentLanguage.value)
      }
      if (user.value) {
        user.value.preferred_language = currentLanguage.value
        localStorage.setItem('user', JSON.stringify(user.value))
      }
    }
    
    const closeExamModal = () => {
      if (confirm('Are you sure you want to close the exam? Your progress will be lost.')) {
        if (timerInterval.value) {
          clearInterval(timerInterval.value)
          timerInterval.value = null
        }
        showExamModal.value = false
      }
    }
    
    onMounted(() => {
      loadInitialData()
    })
    
    return {
      // State
      user,
      currentLanguage,
      availableQuizzes,
      examResults,
      searchQuery,
      loading,
      showTutorialModal,
      showExamModal,
      showResultsModal,
      showReviewModal,
      weaknessAnalysis,
      aiRecommendations,
      aiSummary,
      currentExam,
      currentQuestions,
      currentQuestionIndex,
      userAnswers,
      timeRemaining,
      currentScore,
      currentWeaknessAnalysis,
      currentRecommendation,
      usedAIModel,
      currentReviewAttempt,
      currentReviewAnswers,
      
      // Computed
      hasTakenExams,
      filteredQuizzes,
      filteredResults,
      currentQuestion,
      formattedTime,
      timerClass,
      progressWidth,
      
      // Helper Functions
      getLocalizedText,
      getOptionText,
      
      // Methods
      takeExam,
      startExam,
      startInitialExam,
      startRecommendedExam,
      selectAnswer,
      previousQuestion,
      nextQuestion,
      submitExam,
      reviewExam,
      updateUserLanguage,
      closeExamModal,
      scrollToQuizzes,
      getScoreColorClass,
      getStatusClass,
      getButtonClass,
      getButtonText,
      getExamStatus,
      formatDate,
      getRemarks,
      getResultMessage,
      getWeaknessFeedback,
      getReviewQuestionClass,
      getReviewStatusClass,
      getReviewStatus
    }
  }
}
</script>

<style scoped>
.backdrop {
  background: rgba(0,0,0,0.4);
}

.progress-bar {
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease-in-out;
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
