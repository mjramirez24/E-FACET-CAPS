<template>
  <div class="bg-gray-900 flex items-center justify-center min-h-screen p-6">
    <!-- Background Image -->
    <div class="fixed inset-0">
      <img
        src="/background.png"
        alt="Background"
        class="w-full h-full object-cover brightness-50"
      />
    </div>

    <!-- Modern Glass Card -->
    <div
      class="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-sm"
    >
      <!-- Logo -->
      <div class="flex justify-center mb-6">
        <img src="/facet-logo.png" alt="FACET Logo" class="w-20 h-20" />
      </div>

      <!-- Track title -->
      <div class="text-center mb-6">
        <div
          class="inline-flex items-center px-3 py-1 rounded-full mb-1"
          :class="track === 'tesda' ? 'bg-blue-500/20' : 'bg-green-500/20'"
        >
          <div
            class="w-2 h-2 rounded-full mr-2"
            :class="track === 'tesda' ? 'bg-blue-400' : 'bg-green-400'"
          ></div>
          <h2
            class="text-sm font-semibold"
            :class="track === 'tesda' ? 'text-blue-200' : 'text-green-200'"
          >
            {{ signupTitle }}
          </h2>
        </div>
        <p class="text-xs text-gray-300 mt-1">
          {{ signupSubtitle }}
        </p>
      </div>

      <!-- Message Alert -->
      <div
        v-if="message.text"
        :class="[
          'mb-5 p-3 rounded-lg text-sm font-medium border',
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        ]"
      >
        {{ message.text }}
      </div>

      <!-- Signup Form -->
      <form @submit.prevent="handleSignup" class="space-y-4">
        <!-- Full Name -->
        <div>
          <label class="block text-xs text-gray-300 font-medium mb-1">Full Name: *</label>
          <input
            type="text"
            v-model="formData.fullname"
            required
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
            placeholder="Enter your full name"
          />
          <p v-if="errors.fullname" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.fullname }}
          </p>
        </div>

        <!-- Username -->
        <div>
          <label class="block text-xs text-gray-300 font-medium mb-1">Username: *</label>
          <input
            type="text"
            v-model="formData.username"
            required
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
            placeholder="Choose a username"
          />
          <p v-if="errors.username" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.username }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs text-gray-300 font-medium mb-1">Email: *</label>
          <input
            type="email"
            v-model="formData.email"
            required
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
            placeholder="Enter your email"
          />
          <p v-if="errors.email" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.email }}
          </p>
        </div>

      <!-- Contact -->
      <div>
        <label class="block text-xs text-gray-300 font-medium mb-1">Contact Number:</label>
        <input
          type="text"
          v-model="formData.contact"
          @input="onContactInput"
          inputmode="numeric"
          maxlength="11"
          required
          class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
          :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
          placeholder="09XX XXX XXXX"
        />
        <p v-if="errors.contact" class="text-red-400 text-xs mt-1 flex items-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ errors.contact }}
        </p>
      </div>

        <!-- Address -->
        <div>
          <label class="block text-xs text-gray-300 font-medium mb-1">Address: *</label>

          <div class="space-y-2">
            <input
              type="text"
              v-model="addressParts.street"
              required
              class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
              placeholder="Street / Sitio / House No. (e.g., Sitio 3)"
            />

            <input
              type="text"
              v-model="addressParts.barangay"
              required
              class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
              placeholder="Barangay (e.g., Barcenaga)"
            />

            <input
              type="text"
              v-model="addressParts.city"
              required
              class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
              placeholder="City / Municipality (e.g., Naujan)"
            />

            <input
              type="text"
              v-model="addressParts.province"
              required
              class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
              placeholder="Province (e.g., Oriental Mindoro)"
            />

            <p class="text-[11px] text-gray-400">
              Format preview: <span class="text-gray-200">{{ composedAddressPreview }}</span>
            </p>
          </div>

          <p v-if="errors.address" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.address }}
          </p>
        </div>

        <!-- Civil Status (Custom Glass Dropdown) -->
        <div class="relative" ref="civilWrap">
          <label class="block text-xs text-gray-300 font-medium mb-1">Civil Status: *</label>

          <button
            type="button"
            @click="toggleCivil"
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-left text-gray-100 text-sm
                   backdrop-blur-xl flex justify-between items-center
                   focus:outline-none focus:ring-2 transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
          >
            <span>
              {{
                formData.civil_status
                  ? cap(formData.civil_status)
                  : "Select civil status"
              }}
            </span>

            <svg
              class="w-4 h-4 text-gray-300 transition-transform"
              :class="isCivilOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            v-if="isCivilOpen"
            class="absolute z-[999] mt-2 w-full rounded-xl overflow-hidden
                   border border-white/15 shadow-2xl backdrop-blur-xl bg-black/70"
          >
            <button
              v-for="opt in civilOptions"
              :key="opt"
              type="button"
              @click="selectCivil(opt)"
              class="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-white/10 transition"
            >
              {{ cap(opt) }}
            </button>
          </div>

          <p v-if="errors.civil_status" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.civil_status }}
          </p>
        </div>

        <!-- Nationality (searchable dropdown) -->
        <div class="relative" ref="natWrap">
          <label class="block text-xs text-gray-300 font-medium mb-1">Nationality: *</label>

          <input
            type="text"
            v-model="nationalityQuery"
            autocomplete="off"
            @focus="openNationality"
            @input="onNationalityInput"
            @keydown.down.prevent="moveNationality(1)"
            @keydown.up.prevent="moveNationality(-1)"
            @keydown.enter.prevent="selectHighlightedNationality()"
            @keydown.esc.prevent="closeAllDropdowns"
            required
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
            placeholder="Search nationality (e.g., Filipino)"
          />

          <div
            v-if="isNationalityOpen && filteredNationalities.length > 0"
            class="absolute z-[999] mt-2 w-full max-h-52 overflow-auto rounded-xl
                   border border-white/15 shadow-2xl backdrop-blur-xl bg-black/70"
          >
            <button
              v-for="(n, idx) in filteredNationalities"
              :key="n"
              type="button"
              class="w-full text-left px-4 py-2 text-sm transition"
              :class="idx === nationalityHighlight ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'"
              @mousedown.prevent="pickNationality(n)"
            >
              {{ n }}
            </button>
          </div>

          <p v-if="errors.nationality" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.nationality }}
          </p>
        </div>

        <!-- Gender (Custom Glass Dropdown) -->
        <div class="relative" ref="genderWrap">
          <label class="block text-xs text-gray-300 font-medium mb-1">Gender: *</label>

          <button
            type="button"
            @click="toggleGender"
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-left text-gray-100 text-sm
                   backdrop-blur-xl flex justify-between items-center
                   focus:outline-none focus:ring-2 transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
          >
            <span>
              {{ formData.gender ? cap(formData.gender) : "Select gender" }}
            </span>

            <svg
              class="w-4 h-4 text-gray-300 transition-transform"
              :class="isGenderOpen ? 'rotate-180' : ''"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            v-if="isGenderOpen"
            class="absolute z-[999] mt-2 w-full rounded-xl overflow-hidden
                   border border-white/15 shadow-2xl backdrop-blur-xl bg-black/70"
          >
            <button
              v-for="opt in genderOptions"
              :key="opt"
              type="button"
              @click="selectGender(opt)"
              class="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-white/10 transition"
            >
              {{ cap(opt) }}
            </button>
          </div>

          <p v-if="errors.gender" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.gender }}
          </p>
        </div>

        <!-- Birthday -->
        <div>
          <label class="block text-xs text-gray-300 font-medium mb-1">Birthday: *</label>
          <input
            type="date"
            v-model="formData.birthday"
            required
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
          />
          <p v-if="errors.birthday" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.birthday }}
          </p>
        </div>

      <!-- Password -->
      <div>
        <label class="block text-xs text-gray-300 font-medium mb-1">Password: *</label>
        <input
          type="password"
          v-model="formData.password"
          minlength="8"
          required
          class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
          :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-600'"
          placeholder="Create a password (min. 8 characters)"
        />

        <!-- Strength meter -->
        <div v-if="formData.password" class="mt-2">
          <div class="flex gap-1 mb-1">
            <div
              v-for="n in 4"
              :key="n"
              class="h-1 flex-1 rounded-full transition-colors"
              :class="n <= passwordStrength.score ? passwordStrength.barColor : 'bg-white/10'"
            ></div>
          </div>
          <p class="text-xs" :class="passwordStrength.textColor">
            {{ passwordStrength.label }}
          </p>
        </div>

        <p v-if="errors.password" class="text-red-400 text-xs mt-1 flex items-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ errors.password }}
        </p>
      </div>

        <!-- Confirm Password -->
        <div>
          <label class="block text-xs text-gray-300 font-medium mb-1">Confirm Password: *</label>
          <input
            type="password"
            v-model="formData.confirm"
            required
            class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
            :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-600'"
            placeholder="Confirm your password"
          />
          <p v-if="errors.confirm" class="text-red-400 text-xs mt-1 flex items-center">
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            {{ errors.confirm }}
          </p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          :class="track === 'tesda' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
          </span>
          <span v-else class="flex items-center justify-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Create Account
          </span>
        </button>
      </form>

      <!-- Footer Links -->
      <div class="mt-6 pt-5 border-t border-white/10">
        <p class="text-center text-xs text-gray-400 mb-3">
          Already have an account?
          <a href="#" @click.prevent="goToLogin" class="text-white font-medium hover:underline transition">
            Login here
          </a>
        </p>

        <p class="text-center text-xs text-gray-500">
          <a href="#" @click.prevent="goToLanding" class="hover:text-gray-300 transition inline-flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to enrollment options
          </a>
        </p>
      </div>
    </div>

    <!-- OTP Verification Modal -->
    <div
      v-if="otpStep"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-xs shadow-2xl">

        <!-- Icon -->
        <div class="flex justify-center mb-4">
          <div class="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg class="w-7 h-7 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h3 class="text-white font-semibold text-lg mb-1 text-center">Check your email</h3>
        <p class="text-gray-300 text-xs text-center mb-1">
          We sent a 6-digit verification code to
        </p>
        <p class="text-white text-xs text-center font-medium mb-5 truncate">{{ formData.email }}</p>

        <!-- Code input -->
        <input
          type="text"
          v-model="otpCode"
          maxlength="6"
          placeholder="000000"
          class="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-gray-100 text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition mb-2"
          :class="track === 'tesda' ? 'focus:ring-blue-500' : 'focus:ring-green-500'"
        />

        <!-- Error -->
        <p v-if="otpError" class="text-red-400 text-xs text-center mb-3 flex items-center justify-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ otpError }}
        </p>

        <!-- Verify button -->
        <button
          @click="verifyOtp"
          :disabled="otpLoading"
          class="w-full text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          :class="track === 'tesda' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'"
        >
          <span v-if="otpLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </span>
          <span v-else>Verify Code</span>
        </button>

        <!-- Resend -->
        <p class="text-center text-xs text-gray-400 mb-3">
          Didn't receive it?
          <button
            type="button"
            @click="sendOtp"
            :disabled="otpResendTimer > 0 || otpLoading"
            class="text-white font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed ml-1"
          >
            {{ otpResendTimer > 0 ? `Resend in ${otpResendTimer}s` : 'Resend code' }}
          </button>
        </p>

        <!-- Cancel -->
        <p class="text-center">
          <button
            type="button"
            @click="otpStep = false"
            class="text-gray-500 text-xs hover:text-gray-300 transition"
          >
            ← Cancel and go back
          </button>
        </p>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "SignupPage",

  data() {
    return {
      track: "driving",

      // address parts (PH implied)
      addressParts: {
        street: "",
        barangay: "",
        city: "",
        province: "",
      },

      // dropdown states
      isCivilOpen: false,
      isGenderOpen: false,

      civilOptions: ["single", "married", "widowed", "separated"],
      genderOptions: ["male", "female"],

      // nationality searchable
      nationalities: [
        "Filipino","American","British","Canadian","Australian","Chinese","Japanese","Korean",
        "Indian","Malaysian","Singaporean","Indonesian","Thai","Vietnamese","Cambodian","Laotian",
        "Myanmar","Pakistani","Bangladeshi","Sri Lankan","Nepalese","Bhutanese","Afghan","Iranian",
        "Iraqi","Saudi","Emirati","Qatari","Kuwaiti","Omani","Yemeni","Jordanian","Lebanese","Syrian",
        "Israeli","Palestinian","Turkish","Russian","Ukrainian","Polish","German","French","Spanish",
        "Italian","Portuguese","Dutch","Belgian","Swiss","Austrian","Swedish","Norwegian","Danish",
        "Finnish","Irish","Scottish","Welsh","Greek","Romanian","Bulgarian","Hungarian","Czech",
        "Slovak","Croatian","Serbian","Slovenian","Bosnian","Montenegrin","Albanian","Macedonian",
        "Brazilian","Argentinian","Chilean","Peruvian","Colombian","Venezuelan","Mexican","Cuban",
        "Dominican","Jamaican","Haitian","South African","Nigerian","Kenyan","Egyptian","Moroccan",
      ],
      nationalityQuery: "",
      isNationalityOpen: false,
      nationalityHighlight: 0,

      formData: {
        fullname: "",
        username: "",
        email: "",
        contact: "",
        address: "",
        civil_status: "",
        nationality: "",
        gender: "",
        birthday: "",
        password: "",
        confirm: "",
      },

      errors: {},
      message: { text: "", type: "" },
      isLoading: false,

      // OTP state
      otpStep: false,
      otpCode: "",
      otpSent: false,
      otpVerified: false,
      otpError: "",
      otpLoading: false,
      otpResendTimer: 0,
      otpTimerInterval: null,
    };
  },

  computed: {
    signupTitle() {
      return this.track === "tesda"
        ? "Create Your TESDA Account"
        : "Create Your Driving Course Account";
    },
    signupSubtitle() {
      return this.track === "tesda"
        ? "Register for TESDA training portal access"
        : "Register for driving course portal access";
    },

    composedAddressPreview() {
      const parts = [
        this.addressParts.street?.trim(),
        this.addressParts.barangay?.trim(),
        this.addressParts.city?.trim(),
        this.addressParts.province?.trim(),
      ].filter(Boolean);

      return parts.length ? parts.join(", ") : "—";
    },

    filteredNationalities() {
      const q = (this.nationalityQuery || "").trim().toLowerCase();
      const list = this.nationalities;

      if (!q) return list.slice(0, 12);
      return list.filter((n) => n.toLowerCase().includes(q)).slice(0, 12);
    },
          passwordStrength() {
      const pw = this.formData.password || "";
      if (!pw) return { score: 0, label: "", barColor: "", textColor: "" };

      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
      if (/\d/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;

      const levels = [
        { label: "Too weak — add more characters", barColor: "bg-red-500", textColor: "text-red-400" },
        { label: "Weak — try adding numbers or symbols", barColor: "bg-orange-500", textColor: "text-orange-400" },
        { label: "Medium — add uppercase or symbols", barColor: "bg-yellow-500", textColor: "text-yellow-400" },
        { label: "Strong password", barColor: "bg-green-500", textColor: "text-green-400" },
      ];

      return { score, ...levels[Math.max(0, score - 1)] };
    },

  },

  methods: {
    cap(s) {
      if (!s) return "";
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    onContactInput() {
      // strip non-digits, cap at 11 characters
      this.formData.contact = this.formData.contact.replace(/\D/g, "").slice(0, 11);
    },

    closeAllDropdowns() {
      this.isCivilOpen = false;
      this.isGenderOpen = false;
      this.isNationalityOpen = false;
    },

    toggleCivil() {
      const next = !this.isCivilOpen;
      this.closeAllDropdowns();
      this.isCivilOpen = next;
    },

    toggleGender() {
      const next = !this.isGenderOpen;
      this.closeAllDropdowns();
      this.isGenderOpen = next;
    },

    selectCivil(val) {
      this.formData.civil_status = val;
      this.isCivilOpen = false;
    },

    selectGender(val) {
      this.formData.gender = val;
      this.isGenderOpen = false;
    },

    openNationality() {
      this.closeAllDropdowns();
      this.isNationalityOpen = true;
      this.nationalityHighlight = 0;
    },

    onNationalityInput() {
      this.isNationalityOpen = true;
      this.nationalityHighlight = 0;
      this.formData.nationality = this.nationalityQuery;
    },

    pickNationality(n) {
      this.nationalityQuery = n;
      this.formData.nationality = n;
      this.isNationalityOpen = false;
    },

    moveNationality(dir) {
      if (!this.isNationalityOpen) this.isNationalityOpen = true;
      const max = this.filteredNationalities.length - 1;
      if (max < 0) return;
      const next = this.nationalityHighlight + dir;
      this.nationalityHighlight = Math.max(0, Math.min(max, next));
    },

    selectHighlightedNationality() {
      if (!this.filteredNationalities.length) return;
      this.pickNationality(this.filteredNationalities[this.nationalityHighlight]);
    },

    readTrackFromQuery() {
      const q = this.$route?.query?.track;
      if (q === "tesda" || q === "driving") {
        this.track = q;
        localStorage.setItem("lastSelectedTrack", q);
        return;
      }
      const last = localStorage.getItem("lastSelectedTrack");
      if (last === "tesda" || last === "driving") this.track = last;
    },

    validateForm() {
      this.errors = {};
      let isValid = true;

      const fullname = this.formData.fullname.trim();
      const username = this.formData.username.trim();
      const email = this.formData.email.trim();

      if (!fullname) {
        this.errors.fullname = "Full name is required";
        isValid = false;
      }
      if (!username) {
        this.errors.username = "Username is required";
        isValid = false;
      }
      if (!email) {
        this.errors.email = "Email is required";
        isValid = false;
      } else if (!this.isValidEmail(email)) {
        this.errors.email = "Please enter a valid email";
        isValid = false;
      }

      const contact = (this.formData.contact || "").trim();
      if (contact && contact.length !== 11) {
        this.errors.contact = "Contact number must be exactly 11 digits";
        isValid = false;
      }

      if (
        !this.addressParts.street.trim() ||
        !this.addressParts.barangay.trim() ||
        !this.addressParts.city.trim() ||
        !this.addressParts.province.trim()
      ) {
        this.errors.address = "Complete address is required (street/sitio, barangay, city, province).";
        isValid = false;
      }

      if (!this.formData.civil_status) {
        this.errors.civil_status = "Civil status is required";
        isValid = false;
      }

      const nat = (this.formData.nationality || "").trim();
      if (!nat) {
        this.errors.nationality = "Nationality is required";
        isValid = false;
      }

      if (!this.formData.gender) {
        this.errors.gender = "Gender is required";
        isValid = false;
      }

      if (!this.formData.birthday) {
        this.errors.birthday = "Birthday is required";
        isValid = false;
      }

      if (!this.formData.password) {
        this.errors.password = "Password is required";
        isValid = false;
      } else if (this.formData.password.length < 8) {
        this.errors.password = "Password must be at least 8 characters";
        isValid = false;
      }

      if (!this.formData.confirm) {
        this.errors.confirm = "Confirm password is required";
        isValid = false;
      }

      if (this.formData.password && this.formData.confirm && this.formData.password !== this.formData.confirm) {
        this.errors.confirm = "Passwords do not match";
        isValid = false;
      }

      return isValid;
    },

    isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },

    goToLanding() {
      this.$router.push("/");
    },

    goToLogin() {
      this.$router.push(`/login?track=${this.track}`);
    },

    buildAddressString() {
      const parts = [
        this.addressParts.street?.trim(),
        this.addressParts.barangay?.trim(),
        this.addressParts.city?.trim(),
        this.addressParts.province?.trim(),
      ].filter(Boolean);
      return parts.join(", ");
    },

    // --------------------
    // OTP methods
    // --------------------
    async sendOtp() {
      this.otpLoading = true;
      this.otpError = "";
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.formData.email.trim(), track: this.track }),
        });
        const data = await res.json();
        if (data.status === "success") {
          this.otpStep = true;
          this.otpSent = true;
          this.otpCode = "";
          this.startResendTimer();
        } else {
          this.message = { text: data.message || "Failed to send code", type: "error" };
        }
      } catch {
        this.message = { text: "Failed to send verification code. Please try again.", type: "error" };
      } finally {
        this.otpLoading = false;
      }
    },

    async verifyOtp() {
      if (!this.otpCode || this.otpCode.length !== 6) {
        this.otpError = "Please enter the 6-digit code";
        return;
      }
      this.otpLoading = true;
      this.otpError = "";
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.formData.email.trim(), code: this.otpCode }),
        });
        const data = await res.json();
        if (data.status === "success") {
          this.otpVerified = true;
          this.otpStep = false;
          clearInterval(this.otpTimerInterval);
          await this.createAccount();
        } else {
          this.otpError = data.message || "Invalid code. Please try again.";
        }
      } catch {
        this.otpError = "Verification failed. Please try again.";
      } finally {
        this.otpLoading = false;
      }
    },

    async createAccount() {
      this.isLoading = true;
      try {
        const payload = {
          fullname: this.formData.fullname.trim(),
          username: this.formData.username.trim(),
          email: this.formData.email.trim(),
          contact: (this.formData.contact || "").trim(),
          address: this.buildAddressString(),
          civil_status: this.formData.civil_status,
          nationality: (this.formData.nationality || "").trim(),
          gender: this.formData.gender,
          birthday: this.formData.birthday,
          password: this.formData.password,
          confirm: this.formData.confirm,
          track: this.track,
        };

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.status === "success") {
          localStorage.setItem("lastSelectedTrack", this.track);
          this.message = { text: data.message || "Account created successfully!", type: "success" };
          setTimeout(() => {
            this.$router.push(`/login?track=${this.track}`);
          }, 1000);
        } else {
          if (data.errors) this.errors = data.errors;
          this.message = {
            text: data.errors?.general || "Please check the form for errors",
            type: "error",
          };
        }
      } catch {
        this.message = { text: "An error occurred. Please try again.", type: "error" };
      } finally {
        this.isLoading = false;
      }
    },

    startResendTimer() {
      this.otpResendTimer = 60;
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = setInterval(() => {
        this.otpResendTimer -= 1;
        if (this.otpResendTimer <= 0) clearInterval(this.otpTimerInterval);
      }, 1000);
    },

    // --------------------
    // Main form submit
    // --------------------
    async handleSignup() {
      this.message.text = "";
      this.errors = {};
      this.closeAllDropdowns();

      if (!this.validateForm()) return;

      // Send OTP first — account is created only after verification
      await this.sendOtp();
    },

    handleGoogleSignup() {
      console.log("Google signup clicked");
    },

    onDocMouseDown(e) {
      const root = this.$el;
      if (!root) return;
      if (!root.contains(e.target)) {
        this.closeAllDropdowns();
      }
    },
  },

  mounted() {
    this.readTrackFromQuery();
    this.nationalityQuery = this.formData.nationality || "";
    document.addEventListener("mousedown", this.onDocMouseDown);
  },

  beforeUnmount() {
    document.removeEventListener("mousedown", this.onDocMouseDown);
    clearInterval(this.otpTimerInterval);
  },

  watch: {
    "$route.query.track"() {
      this.readTrackFromQuery();
    },
  },
};
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  width: 100%;
  position: relative;
}

/* Smooth transitions */
button, a, input {
  transition: all 0.2s ease;
}

/* Card hover effect */
.relative.z-10:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Glass scrollbar for dropdowns */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.28);
}
</style>