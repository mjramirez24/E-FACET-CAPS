<template>
  <div class="bg-gray-50 flex min-h-screen">
    <!-- Mobile Menu Button (visible only on mobile) -->
    <button 
      @click="toggleMobileMenu" 
      class="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
      aria-label="Toggle menu"
    >
      <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Overlay for mobile -->
    <div 
      v-if="isMobileMenuOpen" 
      @click="isMobileMenuOpen = false"
      class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
    ></div>

    <!-- Sidebar -->
    <StudentSidebar 
      :active-page="activePage"
      :is-mobile-menu-open="isMobileMenuOpen"
      @close-mobile-menu="isMobileMenuOpen = false"
    />
    
    <!-- Main Content -->
    <main :class="[
      'flex-1 p-4 sm:p-6 overflow-y-auto min-h-screen bg-gray-50 transition-all duration-300',
      'lg:ml-64'
    ]">
      <!-- Page Header -->
      <header class="flex justify-between items-center bg-gradient-to-r from-emerald-700 to-emerald-600 text-white px-5 sm:px-6 py-3 rounded-2xl mb-4 shadow-lg shadow-emerald-500/20">
        <div class="flex items-center w-full gap-2 sm:gap-4">
          <slot name="header-left"></slot>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Notification Bell -->
          <div class="relative" ref="bellWrapper">
            <button
              @click="toggleDropdown"
              class="relative p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
              title="Messages"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              
              <!-- Red dot indicator -->
            <span
              v-if="hasUnseenNotifs"
              class="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-emerald-700 animate-pulse"
            ></span>
            </button>

            <!-- Dropdown Panel -->
            <transition name="notif-drop">
              <div
                v-if="dropdownOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              >
                <!-- Header -->
                <div class="px-5 py-3.5 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span class="font-semibold text-sm">Messages</span>
                  </div>
                  <button @click="dropdownOpen = false" class="text-emerald-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Loading state -->
                <div v-if="notifLoading" class="px-4 py-8 text-center">
                  <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-sm text-gray-400">Loading messages...</span>
                </div>

                <template v-else>
                  <!-- New Courses Section -->
                  <div class="border-b border-gray-100">
                    <div class="px-5 pt-4 pb-1 flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">New Courses</span>
                    </div>

                    <template v-if="hasNewCourses">
                      <button
                        v-for="course in visibleNewCourses"
                        :key="course.id"
                        @click="goCourses(course)"
                        class="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-t border-gray-50"
                      >
                        <div class="mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 shadow-inner">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-800 truncate">{{ course.name }}</p>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ course.lastMessage || 'New course added' }}</p>
                        </div>
                      </button>
                    </template>

                    <div v-else class="px-5 py-3.5 flex items-center gap-3 text-gray-400 border-t border-gray-50">
                      <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span class="text-sm">No new courses</span>
                    </div>
                  </div>

                  <!-- Unread Messages Section -->
                  <div>
                    <div class="px-5 pt-4 pb-1 flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Unread Messages</span>
                    </div>

                    <template v-if="hasUnreadMessages">
                      <button
                        v-for="msg in unreadMessages"
                        :key="msg.id"
                        @click="goMessages(msg.id)"
                        class="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-t border-gray-50"
                      >
                        <div class="mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 shadow-inner">
                          {{ getInitials(msg.name) }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2">
                            <p class="text-sm font-semibold text-gray-800 truncate">{{ msg.name }}</p>
                            <span class="flex-shrink-0 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                              {{ msg.unreadCount > 99 ? '99+' : msg.unreadCount }}
                            </span>
                          </div>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ msg.lastMessage || 'New message' }}</p>
                        </div>
                      </button>
                    </template>

                    <div v-else class="px-5 py-3.5 flex items-center gap-3 text-gray-400 border-t border-gray-50">
                      <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <span class="text-sm">No unread messages</span>
                    </div>

                    <!-- Footer -->
                    <div class="px-5 py-3 border-t border-gray-100 bg-gray-50">
                      <button @click="goMessages()" class="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors flex items-center gap-1">
                        View all messages
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </transition>
          </div>
          <!-- End Notification Bell -->

          <!-- Student Avatar - Shows first letter of fullname -->
          <div 
            class="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm text-white rounded-xl flex items-center justify-center text-sm sm:text-base font-bold cursor-pointer hover:bg-white/30 transition-all duration-200 border-2 border-white/20 shadow-inner" 
            :title="userData.fullname || 'Student'"
          >
            {{ userInitial }}
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <div class="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-4 sm:p-6">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script>
import StudentSidebar from './StudentSidebar.vue';

export default {
  name: 'StudentLayout',
  components: {
    StudentSidebar
  },
  props: {
    activePage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isMobileMenuOpen: false,
      dropdownOpen: false,
      notifLoading: false,
      unreadMessages: [],
      newCourses: [],
      seenNotifIds: [], 
      userData: {
        fullname: '',
        email: ''
      },
      _pollTimer: null,
    };
  },
  computed: {
      visibleNewCourses() {                                 
    return this.newCourses.filter(c => !this.seenNotifIds.includes(c.id));
  },
  hasNewCourses() {                                    
    return this.visibleNewCourses.length > 0;
  },
    hasUnreadMessages() {
      return this.unreadMessages.length > 0;
    },
      hasUnseenNotifs() {                                          // ADD THIS
    const allIds = [...this.newCourses, ...this.unreadMessages].map(n => n.id);
    return allIds.some(id => !this.seenNotifIds.includes(id));
  },
    userInitial() {
      if (this.userData.fullname && this.userData.fullname.trim()) {
        return this.userData.fullname.trim().charAt(0).toUpperCase();
      }
      return 'S';
    }
  },
  mounted() {
     this.seenNotifIds = this.loadSeenIds();   // ADD THIS
    this.fetchUserData();
    this.fetchUnreadMessages();
    this._pollTimer = setInterval(this.fetchUnreadMessages, 30000);
    document.addEventListener('click', this.onOutsideClick);
    window.addEventListener('resize', this.handleResize);
    
    this.$router.afterEach(() => {
      this.isMobileMenuOpen = false;
    });
  },
  beforeUnmount() {
    clearInterval(this._pollTimer);
    document.removeEventListener('click', this.onOutsideClick);
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
      loadSeenIds() {                     
    try {
      const raw = localStorage.getItem('student_seen_notif_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  saveSeenIds() {                      
    try {
      localStorage.setItem('student_seen_notif_ids', JSON.stringify(this.seenNotifIds));
    } catch {
      // Silent fail
    }
  },
  markAllAsSeen() {   
    const allIds = [...this.newCourses, ...this.unreadMessages].map(n => n.id);
    this.seenNotifIds = [...new Set([...this.seenNotifIds, ...allIds])];
    this.saveSeenIds();
  },
    async fetchUserData() {
      try {
        const profileRes = await fetch('/api/settings/profile', { credentials: 'include' });
        const profileJson = await profileRes.json();
        
        if (profileJson?.status === 'success' && profileJson?.profile) {
          this.userData = {
            fullname: profileJson.profile.fullname || '',
            email: profileJson.profile.email || ''
          };
        }
      } catch (e) {
        // Silent fail
      }
    },

    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },

      toggleDropdown() {
        const willOpen = !this.dropdownOpen;
        this.dropdownOpen = willOpen;

        if (willOpen) {
          this.fetchUnreadMessages();       // ipapakita muna nang buo habang bukas
        } else {
          this.markAllAsSeen();             // pag isinara, saka lang mama-mark as seen
        }
      },

      onOutsideClick(e) {
        if (this.$refs.bellWrapper && !this.$refs.bellWrapper.contains(e.target)) {
          if (this.dropdownOpen) {
            this.markAllAsSeen();
          }
          this.dropdownOpen = false;
        }
      },

    handleResize() {
      if (window.innerWidth >= 1024) {
        this.isMobileMenuOpen = false;
      }
    },

    async fetchUnreadMessages() {
      this.notifLoading = true;
      try {
        const response = await fetch('/api/messages/inbox', { 
          credentials: 'include' 
        });

        if (response.ok) {
          const inbox = await response.json();
          if (Array.isArray(inbox)) {
            const isCourseNotif = (m) => typeof m.id === 'string' && m.id.startsWith('notif-');

            this.newCourses = inbox
              .filter(isCourseNotif)
              .slice(0, 5)
              .map(m => ({
                id: m.id,
                name: m.name,
                lastMessage: m.lastMessage || '',
              }));

            this.unreadMessages = inbox
              .filter(m => !isCourseNotif(m) && m.unreadCount > 0)
              .slice(0, 5)
              .map(m => ({
                id: m.id,
                name: m.name,
                unreadCount: m.unreadCount,
                lastMessage: m.lastMessage || '',
              }));
          }
        }
      } catch (err) {
        // Silent fail
      } finally {
        this.notifLoading = false;
      }
    },
    goMessages(msg) {
      this.dropdownOpen = false;
      const path = msg ? `/student-messages?user=${msg.id}` : '/student-messages';
      if (this.$router) this.$router.push(path);
      else window.location.href = path;
    },

    goCourses(course) {
      this.dropdownOpen = false;
      const path = '/student-enroll';
      if (this.$router) this.$router.push(path);
      else window.location.href = path;
    },

    getInitials(name) {
      return String(name || '')
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase() || '?';
    }
  }
}
</script>

<style scoped>
/* Main content area */
main {
  max-height: 100vh;
  overflow-y: auto;
  scrollbar-width: thin;
}

/* Custom scrollbar */
main::-webkit-scrollbar {
  width: 8px;
}

main::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

main::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

main::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Mobile responsive */
@media (max-width: 1023px) {
  main {
    margin-left: 0 !important;
    padding-top: 4rem;
  }
}

/* Dropdown animations */
.notif-drop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.notif-drop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.notif-drop-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.notif-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Mobile menu button */
.fixed.top-4.left-4 {
  transition: all 0.3s ease;
}
</style>