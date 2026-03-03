<template>
  <StudentLayout>
    <!-- Header -->
    <template #header-left>
      <input 
        type="text" 
        placeholder="Search settings..." 
        v-model="searchQuery"
        class="w-1/3 p-2 rounded-md text-gray-800 focus:outline-none"
      >
    </template>

    <div>
      <!-- Page Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-green-800">⚙️ Settings</h2>
        <button 
          @click="saveAllSettings"
          :disabled="saving"
          class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="saving" class="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
          {{ saving ? 'Saving...' : '💾 Save All Changes' }}
        </button>
      </div>

      <!-- Settings Tabs -->
      <div class="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === tab.id 
              ? 'bg-green-700 text-white' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        <p class="mt-3 text-gray-600">Loading settings...</p>
      </div>

      <!-- Settings Content -->
      <div v-else class="space-y-6">
        <!-- Profile Settings -->
        <div v-if="activeTab === 'profile'" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-green-800">👤 Profile Information</h3>
            <button 
              @click="saveProfile"
              :disabled="saving"
              class="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium disabled:opacity-50"
            >
              Save Profile
            </button>
          </div>
          
          <div class="space-y-4">
            <div class="flex items-center gap-4 mb-6">
              <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-800">
                {{ getInitials(profile.fullname) }}
              </div>
              <div>
                <input 
                  type="file" 
                  ref="fileInput"
                  accept="image/jpeg,image/png"
                  class="hidden"
                  @change="handleFileUpload"
                >
                <button 
                  @click="triggerFileUpload"
                  :disabled="uploading"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                >
                  {{ uploading ? 'Uploading...' : 'Change Photo' }}
                </button>
                <p class="text-xs text-gray-500 mt-1">JPG, PNG up to 5MB</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  v-model="profile.fullname"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  v-model="profile.email"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  v-model="profile.username"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input 
                  type="tel" 
                  v-model="profile.contact"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="+63 123 456 7890"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  v-model="profile.address"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter your address"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select 
                  v-model="profile.gender"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                <input 
                  type="date" 
                  v-model="profile.birthday"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
                <select 
                  v-model="profile.civil_status"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Select Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input 
                  type="text" 
                  v-model="profile.nationality"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Enter nationality"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Security Settings -->
        <div v-if="activeTab === 'security'" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-green-800">🔒 Account Security</h3>
            <button 
              @click="updatePassword"
              :disabled="saving"
              class="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium disabled:opacity-50"
            >
              Update Password
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input 
                type="password" 
                v-model="security.currentPassword"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  v-model="security.newPassword"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                <div class="text-xs text-gray-500 mt-1">
                  Password strength: 
                  <span :class="passwordStrengthClass">{{ passwordStrength }}</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  v-model="security.confirmPassword"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                <div v-if="security.newPassword !== security.confirmPassword" class="text-xs text-red-600 mt-1">
                  Passwords do not match
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- System Preferences -->
        <div v-if="activeTab === 'preferences'" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-green-800">🎨 System Preferences</h3>
            <button 
              @click="savePreferences"
              :disabled="saving"
              class="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium disabled:opacity-50"
            >
              Save Preferences
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select 
                v-model="preferences.theme"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dashboard Layout</label>
              <select 
                v-model="preferences.layout"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="compact">Compact</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notification Sound</label>
              <select 
                v-model="preferences.notification_sound"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="default">Default</option>
                <option value="muted">Muted</option>
                <option value="soft">Soft Tone</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select 
                v-model="preferences.language"
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="en">English</option>
                <option value="fil">Filipino</option>
              </select>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-gray-200">
            <h4 class="text-md font-medium text-gray-800 mb-3">Display Settings</h4>
            <div class="space-y-3">
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  v-model="preferences.show_avatars"
                  class="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                >
                <span class="text-sm text-gray-700">Show user avatars</span>
              </label>
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  v-model="preferences.show_notifications_badge"
                  class="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                >
                <span class="text-sm text-gray-700">Show notifications badge</span>
              </label>
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  v-model="preferences.auto_save_progress"
                  class="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                >
                <span class="text-sm text-gray-700">Auto-save exam progress</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div v-if="activeTab === 'notifications'" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-green-800">🔔 Notifications</h3>
            <button 
              @click="saveNotifications"
              :disabled="saving"
              class="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm font-medium disabled:opacity-50"
            >
              Save Notifications
            </button>
          </div>
          
          <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-md font-medium text-gray-800 mb-3">Email Notifications</h4>
              <div class="space-y-3">
                <label class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">Course update notifications</span>
                  <input 
                    type="checkbox" 
                    v-model="preferences.email_course_updates"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  >
                </label>
                <label class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">Exam schedule alerts</span>
                  <input 
                    type="checkbox" 
                    v-model="preferences.email_exam_schedules"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  >
                </label>
                <label class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">Grade release notifications</span>
                  <input 
                    type="checkbox" 
                    v-model="preferences.email_grade_releases"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  >
                </label>
                <label class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">Certificate completion alerts</span>
                  <input 
                    type="checkbox" 
                    v-model="preferences.email_certificate_completion"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  >
                </label>
              </div>
            </div>

            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-md font-medium text-gray-800 mb-3">In-App Notifications</h4>
              <div class="space-y-3">
                <label class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">New messages from instructors</span>
                  <input 
                    type="checkbox" 
                    v-model="preferences.inapp_new_messages"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  >
                </label>
                <label class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">Assignment deadlines</span>
                  <input 
                    type="checkbox" 
                    v-model="preferences.inapp_assignment_deadlines"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  >
                </label>
                <label class="flex items-center justify-between">
                  <span class="text-sm text-gray-700">System announcements</span>
                  <input 
                    type="checkbox" 
                    v-model="preferences.inapp_announcements"
                    class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  >
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Modal (using same pattern as StudentSchedule) -->
    <div
      v-if="messageOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeMessage"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-200 flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ messageIcon }}</span>
            <h3 class="text-lg font-semibold text-gray-800">
              {{ messageTitle }}
            </h3>
          </div>
          <button
            @click="closeMessage"
            class="px-3 py-1 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            ✕
          </button>
        </div>
        <div class="p-6 text-center">
          <p class="text-gray-600">{{ messageText }}</p>
        </div>
        <div class="p-4 border-t border-gray-200 flex justify-end">
          <button
            @click="closeMessage"
            class="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  </StudentLayout>
</template>

<script>
import StudentLayout from "./StudentLayout.vue";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

export default {
  name: "StudentSettings",
  components: { StudentLayout },

  data() {
    return {
      searchQuery: "",
      loading: false,
      saving: false,
      uploading: false,
      activeTab: "profile",
      
      // Message modal
      messageOpen: false,
      messageTitle: "",
      messageText: "",
      messageIcon: "",
      
      // Profile data
      profile: {
        fullname: "",
        username: "",
        email: "",
        contact: "",
        address: "",
        gender: "",
        birthday: "",
        civil_status: "",
        nationality: ""
      },
      
      // Security data
      security: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      },

      // Preferences data
      preferences: {
        theme: 'light',
        layout: 'compact',
        notification_sound: 'default',
        language: 'en',
        show_avatars: true,
        show_notifications_badge: true,
        auto_save_progress: true,
        email_course_updates: true,
        email_exam_schedules: true,
        email_grade_releases: true,
        email_certificate_completion: true,
        inapp_new_messages: true,
        inapp_assignment_deadlines: true,
        inapp_announcements: true
      },
      
      // Tabs
      tabs: [
        { id: "profile", label: "👤 Profile" },
        { id: "security", label: "🔒 Security" },
        { id: "preferences", label: "🎨 Preferences" },
        { id: "notifications", label: "🔔 Notifications" }
      ],
      
      fileInput: null
    };
  },

  computed: {
    passwordStrength() {
      if (!this.security.newPassword) return "None";
      const pwd = this.security.newPassword;
      const length = pwd.length;
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNumber = /\d/.test(pwd);
      const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
      
      let score = 0;
      if (length >= 8) score++;
      if (length >= 12) score++;
      if (hasUpper && hasLower) score++;
      if (hasNumber) score++;
      if (hasSpecial) score++;
      
      if (score >= 4) return "Strong";
      if (score >= 3) return "Good";
      if (score >= 2) return "Fair";
      return "Weak";
    },

    passwordStrengthClass() {
      const strength = this.passwordStrength;
      return {
        "Strong": "text-green-600 font-semibold",
        "Good": "text-blue-600 font-semibold",
        "Fair": "text-yellow-600 font-semibold",
        "Weak": "text-red-600 font-semibold",
        "None": "text-gray-600"
      }[strength] || "text-gray-600";
    }
  },

  methods: {
    getInitials(name) {
      if (!name) return "??";
      return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
    },

    // Message modal methods
    showMessage(title, text, icon = "ℹ️") {
      this.messageTitle = title;
      this.messageText = text;
      this.messageIcon = icon;
      this.messageOpen = true;
    },

    closeMessage() {
      this.messageOpen = false;
    },

    async fetchProfile() {
      try {
        this.loading = true;
        const response = await api.get("/settings/profile");
        if (response.data?.status === "success" && response.data?.profile) {
          Object.assign(this.profile, response.data.profile);
          
          // Dispatch event for sidebar update
          const event = new CustomEvent('user-updated', { 
            detail: {
              fullname: response.data.profile.fullname,
              username: response.data.profile.username,
              email: response.data.profile.email
            }
          });
          window.dispatchEvent(event);
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        this.showMessage(
          "Error", 
          err.response?.data?.message || "Failed to load profile", 
          "❌"
        );
      } finally {
        this.loading = false;
      }
    },

    async fetchPreferences() {
      try {
        const response = await api.get("/settings/preferences");
        if (response.data?.status === "success" && response.data?.preferences) {
          Object.assign(this.preferences, response.data.preferences);
        }
      } catch (err) {
        console.error("Fetch preferences error:", err);
      }
    },

    async saveProfile() {
      if (!this.profile.fullname || !this.profile.email) {
        this.showMessage("Validation Error", "Name and email are required", "⚠️");
        return;
      }

      this.saving = true;
      try {
        const response = await api.put("/settings/profile", this.profile);
        if (response.data?.status === "success") {
          // Dispatch custom event with updated user data
          const event = new CustomEvent('user-updated', { 
            detail: {
              fullname: this.profile.fullname,
              username: this.profile.username,
              email: this.profile.email
            }
          });
          window.dispatchEvent(event);
          
          this.showMessage("Success", "Profile updated successfully", "✅");
        }
      } catch (err) {
        console.error("Save profile error:", err);
        this.showMessage(
          "Error", 
          err.response?.data?.message || "Failed to update profile", 
          "❌"
        );
      } finally {
        this.saving = false;
      }
    },

    async savePreferences() {
      this.saving = true;
      try {
        const response = await api.put("/settings/preferences", this.preferences);
        if (response.data?.status === "success") {
          this.showMessage("Success", "Preferences saved successfully", "✅");
        }
      } catch (err) {
        console.error("Save preferences error:", err);
        this.showMessage(
          "Error", 
          err.response?.data?.message || "Failed to save preferences", 
          "❌"
        );
      } finally {
        this.saving = false;
      }
    },

    // Alias for savePreferences to use in notifications tab
    saveNotifications() {
      return this.savePreferences();
    },

    async updatePassword() {
      if (!this.security.currentPassword) {
        this.showMessage("Validation Error", "Current password is required", "⚠️");
        return;
      }
      if (!this.security.newPassword) {
        this.showMessage("Validation Error", "New password is required", "⚠️");
        return;
      }
      if (this.security.newPassword.length < 8) {
        this.showMessage("Validation Error", "Password must be at least 8 characters", "⚠️");
        return;
      }
      if (this.security.newPassword !== this.security.confirmPassword) {
        this.showMessage("Validation Error", "Passwords do not match", "⚠️");
        return;
      }

      this.saving = true;
      try {
        const response = await api.post("/settings/change-password", {
          currentPassword: this.security.currentPassword,
          newPassword: this.security.newPassword
        });
        
        if (response.data?.status === "success") {
          this.showMessage("Success", "Password updated successfully", "✅");
          this.security.currentPassword = "";
          this.security.newPassword = "";
          this.security.confirmPassword = "";
        }
      } catch (err) {
        console.error("Update password error:", err);
        this.showMessage(
          "Error", 
          err.response?.data?.message || "Failed to update password", 
          "❌"
        );
      } finally {
        this.saving = false;
      }
    },

    async saveAllSettings() {
      this.saving = true;
      try {
        await this.saveProfile();
        await this.savePreferences();
        this.showMessage("Success", "All settings saved successfully", "✅");
      } catch (err) {
        console.error("Save all error:", err);
      } finally {
        this.saving = false;
      }
    },

    triggerFileUpload() {
      this.$refs.fileInput?.click();
    },

    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage("Error", "File size must be less than 5MB", "❌");
        return;
      }
      
      if (!file.type.match(/image\/(jpeg|png)/)) {
        this.showMessage("Error", "Only JPG and PNG files are allowed", "❌");
        return;
      }
      
      this.uploading = true;
      const formData = new FormData();
      formData.append("avatar", file);
      
      try {
        const response = await api.post("/settings/avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        if (response.data?.status === "success") {
          this.showMessage("Success", "Photo uploaded successfully", "✅");
        }
      } catch (err) {
        console.error("Upload error:", err);
        this.showMessage("Error", err.response?.data?.message || "Failed to upload photo", "❌");
      } finally {
        this.uploading = false;
        event.target.value = "";
      }
    }
  },

  async mounted() {
    await this.fetchProfile();
    await this.fetchPreferences();
  }
};
</script>

<style scoped>
.transition-colors {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
</style>