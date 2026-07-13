  <template>
    <AdminLayout>
      <!-- Header -->
      <template #header-left>
        <div class="header-actions">
          <div class="search-box">
            <svg class="search-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search settings..."
              v-model="searchQuery"
              class="search-input-modern"
            />
          </div>
        </div>
      </template>

      <div class="settings-wrapper">
        <!-- Page Header -->
        <div class="page-top">
          <div>
            <h2 class="page-title">Settings</h2>
            <p class="page-subtitle">Manage your profile details and account security</p>
          </div>
          <button 
            @click="saveAllSettings"
            :disabled="saving"
            class="add-btn"
          >
            <span v-if="saving" class="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            {{ saving ? 'Saving...' : 'Save All Changes' }}
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-box">
          <svg class="animate-spin h-6 w-6 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          Loading settings...
        </div>

        <!-- Settings Content -->
        <div v-else class="settings-body">

          <!-- ══════════ Profile Section ══════════ -->
          <div class="panel-card">
            <div class="panel-header">
              <div class="flex items-center gap-3">
                <div class="section-icon-wrap section-icon-green">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                  </div>
                <div>
                  <h3 class="panel-title">Profile Information</h3>
                  <p class="panel-meta">Your name and contact details as they appear across the system</p>
                </div>
              </div>
              <button 
                @click="saveProfile"
                :disabled="saving"
                class="btn-outline"
              >
                Save Profile
              </button>
            </div>

            <div class="panel-body">
              <div class="profile-grid">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input type="text" v-model="profile.fullname" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input type="email" v-model="profile.email" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Username</label>
                  <input type="text" v-model="profile.username" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    v-model="profile.contact" 
                    @input="onPhoneInput"
                    maxlength="11"
                    class="form-input" 
                    placeholder="09123456789"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════ Security Section ══════════ -->
          <div class="panel-card">
            <div class="panel-header">
              <div class="flex items-center gap-3">
                <div class="section-icon-wrap section-icon-green">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
                <div>
                  <h3 class="panel-title">Account Security</h3>
                  <p class="panel-meta">Update your account password</p>
                </div>
              </div>
              <button 
                @click="updatePassword"
                :disabled="saving"
                class="btn-outline"
              >
                Update Password
              </button>
            </div>

            <div class="panel-body">
              <div class="security-grid">
                <div class="form-group">
                  <label class="form-label">Current Password</label>
                  <input type="password" v-model="security.currentPassword" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">New Password</label>
                  <input type="password" v-model="security.newPassword" class="form-input">
                  <p class="field-hint">
                    Password strength: <span :class="passwordStrengthClass">{{ passwordStrength }}</span>
                  </p>
                </div>
                <div class="form-group">
                  <label class="form-label">Confirm Password</label>
                  <input type="password" v-model="security.confirmPassword" class="form-input">
                  <p v-if="security.newPassword !== security.confirmPassword" class="field-hint field-hint-error">
                    Passwords do not match
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

        <!-- Success/Error Modal (copied from AdminInstructorTrainer's delete modal style) -->
        <transition name="modal-fade">
          <div v-if="messageOpen" class="modal-overlay" @click.self="closeMessage">
            <transition name="modal-scale">
              <div class="modal-card modal-card-sm">
                <div class="modal-head-delete">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-full flex items-center justify-center text-xl" :class="notifIconClass">
                      <svg v-if="messageIcon === '✅'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg v-else-if="messageIcon === '❌'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m-9.303 3.376C1.83 17.615 2.865 19.5 4.559 19.5h14.882c1.694 0 2.73-1.885 1.862-3.374L13.882 4.5c-.847-1.457-2.917-1.457-3.764 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
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
                    <button class="btn-save" :class="messageIcon === '❌' ? 'btn-red' : 'btn-green'" @click="closeMessage">
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
  import AdminLayout from './AdminLayout.vue'
  import axios from "axios";
  import { API_URL } from "../../config/api";

  const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  export default {
    name: 'AdminSettings',
    components: {
      AdminLayout
    },

    data() {
      return {
        searchQuery: '',
        loading: true,
        saving: false,

        // Message modal
        messageOpen: false,
        messageTitle: '',
        messageText: '',
        messageIcon: '',

        // Profile data
        profile: {
          fullname: '',
          username: '',
          email: '',
          contact: ''
        },

        // Preferences data (kept for saveAllSettings/savePreferences calls)
        preferences: {
          theme: 'light',
          layout: 'compact',
          notification_sound: 'default',
          language: 'en',
          show_avatars: true,
          show_notifications_badge: true,
          auto_refresh: true,
          email_new_enrollments: true,
          email_course_updates: true,
          email_system_logs: false,
          email_exam_completion: true,
          inapp_new_messages: true,
          inapp_pending_approvals: true,
          inapp_announcements: true
        },

        // Security data
        security: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      }
    },

    computed: {
      passwordStrength() {
        if (!this.security.newPassword) return 'None'
        const pwd = this.security.newPassword
        const length = pwd.length
        const hasUpper = /[A-Z]/.test(pwd)
        const hasLower = /[a-z]/.test(pwd)
        const hasNumber = /\d/.test(pwd)
        const hasSpecial = /[^A-Za-z0-9]/.test(pwd)

        let score = 0
        if (length >= 8) score++
        if (length >= 12) score++
        if (hasUpper && hasLower) score++
        if (hasNumber) score++
        if (hasSpecial) score++

        if (score >= 4) return 'Strong'
        if (score >= 3) return 'Good'
        if (score >= 2) return 'Fair'
        return 'Weak'
      },

      passwordStrengthClass() {
        const strength = this.passwordStrength
        return {
          'Strong': 'text-green-600 font-semibold',
          'Good': 'text-blue-600 font-semibold',
          'Fair': 'text-yellow-600 font-semibold',
          'Weak': 'text-red-600 font-semibold',
          'None': 'text-gray-600'
        }[strength] || 'text-gray-600'
      },

      notifIconClass() {
        if (this.messageIcon === '✅') return 'bg-emerald-100 text-emerald-600'
        if (this.messageIcon === '❌') return 'bg-red-100 text-red-600'
        return 'bg-amber-100 text-amber-600'
      }
    },

        methods: {
      onPhoneInput(e) {
        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 11)
        this.profile.contact = digitsOnly
        e.target.value = digitsOnly
      },

      showMessage(title, text, icon = 'ℹ️') {
        this.messageTitle = title
        this.messageText = text
        this.messageIcon = icon
        this.messageOpen = true
      },

      closeMessage() {
        this.messageOpen = false
      },

      async fetchProfile() {
        try {
          const response = await api.get("/settings/profile")
          if (response.data?.status === 'success' && response.data?.profile) {
            Object.assign(this.profile, response.data.profile)
            window.dispatchEvent(new CustomEvent('user-updated', {
              detail: {
                fullname: response.data.profile.fullname,
                username: response.data.profile.username,
                email: response.data.profile.email
              }
            }))
          }
        } catch (err) {
          console.error("Fetch profile error:", err)
          this.showMessage('Error', err.response?.data?.message || 'Failed to load profile', '❌')
        }
      },

      async fetchPreferences() {
        try {
          const response = await api.get("/settings/preferences")
          if (response.data?.status === 'success' && response.data?.preferences) {
            Object.assign(this.preferences, response.data.preferences)
          }
        } catch (err) {
          console.error("Fetch preferences error:", err)
        }
      },

      async saveProfile() {
        if (!this.profile.fullname || !this.profile.email) {
          this.showMessage('Validation Error', 'Name and email are required', '⚠️')
          return
        }
        this.saving = true
        try {
          const response = await api.put("/settings/profile", this.profile)
          if (response.data?.status === 'success') {
            window.dispatchEvent(new CustomEvent('user-updated', {
              detail: {
                fullname: this.profile.fullname,
                username: this.profile.username,
                email: this.profile.email
              }
            }))
            this.showMessage('Success', 'Profile updated successfully', '✅')
          }
        } catch (err) {
          console.error("Save profile error:", err)
          this.showMessage('Error', err.response?.data?.message || 'Failed to update profile', '❌')
        } finally {
          this.saving = false
        }
      },

      async savePreferences() {
        this.saving = true
        try {
          const response = await api.put("/settings/preferences", this.preferences)
          if (response.data?.status === 'success') {
            this.showMessage('Success', 'Preferences saved successfully', '✅')
          }
        } catch (err) {
          console.error("Save preferences error:", err)
          this.showMessage('Error', err.response?.data?.message || 'Failed to save preferences', '❌')
        } finally {
          this.saving = false
        }
      },

      async updatePassword() {
        if (!this.security.currentPassword) {
          this.showMessage('Validation Error', 'Current password is required', '⚠️')
          return
        }
        if (!this.security.newPassword) {
          this.showMessage('Validation Error', 'New password is required', '⚠️')
          return
        }
        if (this.security.newPassword.length < 8) {
          this.showMessage('Validation Error', 'Password must be at least 8 characters', '⚠️')
          return
        }
        if (this.security.newPassword !== this.security.confirmPassword) {
          this.showMessage('Validation Error', 'Passwords do not match', '⚠️')
          return
        }
        this.saving = true
        try {
          const response = await api.post("/settings/change-password", {
            currentPassword: this.security.currentPassword,
            newPassword: this.security.newPassword
          })
          if (response.data?.status === 'success') {
            this.showMessage('Success', 'Password updated successfully', '✅')
            this.security.currentPassword = ''
            this.security.newPassword = ''
            this.security.confirmPassword = ''
          }
        } catch (err) {
          console.error("Update password error:", err)
          this.showMessage('Error', err.response?.data?.message || 'Failed to update password', '❌')
        } finally {
          this.saving = false
        }
      },

      async saveAllSettings() {
        if (!this.profile.fullname || !this.profile.email) {
          this.showMessage('Validation Error', 'Name and email are required', '⚠️')
          return
        }

        const wantsPasswordChange =
          this.security.currentPassword || this.security.newPassword || this.security.confirmPassword

        if (wantsPasswordChange) {
          if (!this.security.currentPassword) {
            this.showMessage('Validation Error', 'Current password is required', '⚠️')
            return
          }
          if (!this.security.newPassword) {
            this.showMessage('Validation Error', 'New password is required', '⚠️')
            return
          }
          if (this.security.newPassword.length < 8) {
            this.showMessage('Validation Error', 'Password must be at least 8 characters', '⚠️')
            return
          }
          if (this.security.newPassword !== this.security.confirmPassword) {
            this.showMessage('Validation Error', 'Passwords do not match', '⚠️')
            return
          }
        }

        this.saving = true

        const results = { profile: null, preferences: null, password: null }
        let profileErrorMsg = ''
        let preferencesErrorMsg = ''
        let passwordErrorMsg = ''

        try {
          const profileRes = await api.put("/settings/profile", this.profile)
          if (profileRes.data?.status === 'success') {
            results.profile = true
            window.dispatchEvent(new CustomEvent('user-updated', {
              detail: {
                fullname: this.profile.fullname,
                username: this.profile.username,
                email: this.profile.email
              }
            }))
          } else {
            results.profile = false
          }
        } catch (err) {
          console.error("Save profile error:", err)
          results.profile = false
          profileErrorMsg = err.response?.data?.message || 'Failed to update profile'
        }

        try {
          const prefRes = await api.put("/settings/preferences", this.preferences)
          results.preferences = prefRes.data?.status === 'success'
          if (!results.preferences) preferencesErrorMsg = 'Failed to save preferences'
        } catch (err) {
          console.error("Save preferences error:", err)
          results.preferences = false
          preferencesErrorMsg = err.response?.data?.message || 'Failed to save preferences'
        }

        if (wantsPasswordChange) {
          try {
            const pwRes = await api.post("/settings/change-password", {
              currentPassword: this.security.currentPassword,
              newPassword: this.security.newPassword
            })
            if (pwRes.data?.status === 'success') {
              results.password = true
              this.security.currentPassword = ''
              this.security.newPassword = ''
              this.security.confirmPassword = ''
            } else {
              results.password = false
            }
          } catch (err) {
            console.error("Update password error:", err)
            results.password = false
            passwordErrorMsg = err.response?.data?.message || 'Failed to update password'
          }
        }

        this.saving = false

        const failures = []
        if (results.profile === false) failures.push(`Profile: ${profileErrorMsg}`)
        if (results.preferences === false) failures.push(`Preferences: ${preferencesErrorMsg}`)
        if (results.password === false) failures.push(`Password: ${passwordErrorMsg}`)

        if (failures.length === 0) {
          this.showMessage('Success', 'All settings saved successfully', '✅')
        } else {
          const succeeded = []
          if (results.profile === true) succeeded.push('Profile')
          if (results.preferences === true) succeeded.push('Preferences')
          if (results.password === true) succeeded.push('Password')

          const successPart = succeeded.length ? `${succeeded.join(' and ')} saved successfully. ` : ''
          const failurePart = failures.join(' | ')

          this.showMessage(
            succeeded.length ? 'Partially Saved' : 'Error',
            `${successPart}${failurePart}`,
            succeeded.length ? '⚠️' : '❌'
          )
        }
      }
    },

    async mounted() {
      this.loading = true
      await this.fetchProfile()
      await this.fetchPreferences()
      this.loading = false
    }
  }
  </script>

  <style scoped>
  /* ========== WRAPPER ========== */
  .settings-wrapper { padding: 4px 0; display: flex; flex-direction: column; gap: 16px; }
  .page-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .page-title { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 0; }
  .page-subtitle { font-size: 0.8rem; color: #6b7280; margin: 2px 0 0; }
  .settings-body { display: flex; flex-direction: column; gap: 16px; }

  /* ========== HEADER SEARCH ========== */
  .header-actions { display: flex; align-items: center; gap: 12px; width: 100%; flex-wrap: wrap; }
  .search-box { position: relative; flex: 1; min-width: 200px; max-width: 380px; }
  .search-icon-svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9ca3af; }
  .search-input-modern { width: 100%; padding: 10px 16px 10px 40px; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; color: #111827 !important; background: #fff !important; }
  .search-input-modern:focus { border-color: #10b981; }

  /* ========== TOP BUTTON ========== */
  .add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #10b981; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
  .add-btn:hover { background: #059669; transform: translateY(-1px); }
  .add-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  /* ========== LOADING ========== */
  .loading-box { padding: 40px; text-align: center; color: #9ca3af; font-size: 0.9rem; }

  /* ========== PANEL ========== */
  .panel-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
  .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f3f4f6; flex-wrap: wrap; gap: 12px; }
  .panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
  .panel-meta { font-size: 0.78rem; color: #9ca3af; margin: 2px 0 0; }
  .panel-body { padding: 24px; }

  .section-icon-wrap { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
  .section-icon-green { background: #d1fae5; color: #059669; }

  /* ========== BUTTONS ========== */
  .btn-outline { display: flex; align-items: center; gap: 8px; padding: 9px 16px; background: #fff; color: #374151; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
  .btn-outline:hover:not(:disabled) { border-color: #10b981; color: #059669; background: #f9fafb; }
  .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ========== FORM GRIDS ========== */
  .profile-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .security-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 4px; }
  .form-label { font-size: 0.75rem; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.03em; }
  .form-input { padding: 9px 12px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 0.85rem; outline: none; transition: border-color 0.2s; background: #fff; color: #111827; }
  .form-input:focus { border-color: #10b981; }
  .field-hint { font-size: 0.72rem; color: #9ca3af; margin-top: 2px; }
  .field-hint-error { color: #dc2626; }

  @media (max-width: 1024px) {
    .profile-grid { grid-template-columns: repeat(2, 1fr); }
    .security-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .profile-grid, .security-grid { grid-template-columns: 1fr; }
  }

  /* ========== MODAL (copied from AdminUsers' Delete Account modal) ========== */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .modal-card { background: #fff; border-radius: 16px; width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
  .modal-card-sm { max-width: 420px; }
  .modal-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0; }
  .modal-head-delete { padding: 20px 20px 16px; border-bottom: 1px solid #f3f4f6; }
  .modal-body-delete { padding: 20px; }
  .modal-close-btn { padding: 6px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; transition: all 0.2s; }
  .modal-close-btn:hover { background: #f3f4f6; color: #111827; }
  .modal-body { padding: 20px; }

  .btn-save { padding: 9px 18px; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; color: #fff; cursor: pointer; transition: all 0.2s; }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-green { background: #10b981; }
  .btn-green:hover:not(:disabled) { background: #059669; }
  .btn-red { background: #ef4444; }
  .btn-red:hover:not(:disabled) { background: #dc2626; }

  /* ========== ANIMATIONS ========== */
  .modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
  .modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
  .modal-scale-enter-active { transition: all 0.25s ease; }
  .modal-scale-leave-active { transition: all 0.15s ease; }
  .modal-scale-enter-from { opacity: 0; transform: scale(0.95) translateY(10px); }
  .modal-scale-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

  /* ========== MISC ========== */
  .flex { display: flex; } .items-center { align-items: center; } .gap-3 { gap: 12px; }
  .text-sm { font-size: 0.875rem; } .text-gray-700 { color: #374151; }
  </style>