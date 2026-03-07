<template>
  <div class="bg-gray-100 flex min-h-screen">
    <!-- Mobile Menu Button (visible only on mobile) -->
    <button 
      @click="toggleMobileMenu" 
      class="lg:hidden fixed top-4 left-4 z-50 bg-blue-800 text-white p-2 rounded-lg shadow-lg"
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

    <!-- Sidebar - Pass props and events -->
    <StudentSidebarTesda 
      :active-page="activePage"
      :is-mobile-menu-open="isMobileMenuOpen"
      @close-mobile-menu="isMobileMenuOpen = false"
    />

    <!-- Main Content -->
    <main :class="[
      'flex-1 p-4 sm:p-6 overflow-y-auto min-h-screen bg-gray-100 transition-all duration-300',
      'lg:ml-64'
    ]">
      <!-- Page Header -->
      <header class="flex justify-between items-center bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-t-xl mb-4">
        <div class="flex items-center w-full gap-2 sm:gap-4">
          <slot name="header-left"></slot>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <!-- ─── Notification Bell (only for messages) ─── -->
          <div class="relative" ref="bellWrapper">
            <button
              @click="toggleDropdown"
              class="relative p-1.5 sm:p-2 hover:bg-blue-700 rounded-full transition-colors"
              title="Messages"
            >
              <!-- Bell icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              <!-- Red dot — only visible when there are unread messages -->
              <span
                v-if="hasUnreadMessages"
                class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-blue-800 animate-pulse"
              ></span>
            </button>

            <!-- ─── Dropdown Panel ─── -->
            <transition name="notif-drop">
              <div
                v-if="dropdownOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
              >
                <!-- Header -->
                <div class="px-4 py-3 bg-blue-800 text-white flex items-center justify-between">
                  <span class="font-semibold text-sm tracking-wide">Messages</span>
                  <button @click="dropdownOpen = false" class="text-blue-200 hover:text-white text-lg leading-none">✕</button>
                </div>

                <!-- Loading state -->
                <div v-if="notifLoading" class="px-4 py-6 text-center text-sm text-gray-400">
                  Loading…
                </div>

                <template v-else>
                  <!-- ── Unread Messages Section ── -->
                  <div>
                    <!-- Has unread -->
                    <template v-if="hasUnreadMessages">
                      <button
                        v-for="msg in unreadMessages"
                        :key="msg.id"
                        @click="goMessages(msg.id)"
                        class="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-b-0"
                      >
                        <span class="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                          {{ getInitials(msg.name) }}
                        </span>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center justify-between gap-2">
                            <p class="text-sm font-semibold text-gray-800 truncate">{{ msg.name }}</p>
                            <span class="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                              {{ msg.unreadCount > 9 ? '9+' : msg.unreadCount }}
                            </span>
                          </div>
                          <p class="text-xs text-gray-500 truncate mt-0.5">{{ msg.lastMessage || 'New message' }}</p>
                        </div>
                      </button>
                    </template>

                    <!-- None unread -->
                    <div v-else class="px-4 py-6 flex flex-col items-center gap-3 text-gray-400">
                      <span class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">💬</span>
                      <span class="text-sm">No unread messages</span>
                    </div>

                    <!-- Footer -->
                    <div class="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <button @click="goMessages()" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        View all messages →
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </transition>
          </div>
          <!-- ─── End Notification Bell ─── -->

          <!-- User Avatar (keep original) -->
          <div class="w-8 h-8 sm:w-10 sm:h-10 bg-white text-blue-800 rounded-full flex items-center justify-center text-base sm:text-xl cursor-pointer hover:bg-gray-100 transition-colors">
            👤
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <div class="bg-white rounded-b-xl shadow p-4 sm:p-6">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script>
import StudentSidebarTesda from "./StudentSidebarTesda.vue";

export default {
  name: "StudentLayoutTesda",
  components: { StudentSidebarTesda },
  props: {
    activePage: { type: String, default: "" },
  },
  data() {
    return {
      isMobileMenuOpen: false,
      dropdownOpen: false,
      notifLoading: false,
      unreadMessages: [],
      _pollTimer: null,
    };
  },
  computed: {
    hasUnreadMessages() {
      return this.unreadMessages.length > 0;
    }
  },
  mounted() {
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
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },

    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
      if (this.dropdownOpen) {
        this.fetchUnreadMessages();
      }
    },

    onOutsideClick(e) {
      if (this.$refs.bellWrapper && !this.$refs.bellWrapper.contains(e.target)) {
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
            this.unreadMessages = inbox
              .filter(m => m.unreadCount > 0)
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
        console.error('fetchUnreadMessages error:', err);
      } finally {
        this.notifLoading = false;
      }
    },

    goMessages(userId) {
      this.dropdownOpen = false;
      const path = userId ? `/tesda-messages?user=${userId}` : '/tesda-messages';
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
};
</script>

<style scoped>
main {
  max-height: 100vh;
  overflow-y: auto;
  scrollbar-width: thin;
}

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

@media (max-width: 1023px) {
  main {
    margin-left: 0 !important;
    padding-top: 4rem;
  }
}

/* Dropdown animation */
.notif-drop-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.notif-drop-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.notif-drop-enter-from   { opacity: 0; transform: translateY(-6px); }
.notif-drop-leave-to     { opacity: 0; transform: translateY(-6px); }

/* Mobile menu button animation */
.fixed.top-4.left-4 {
  transition: all 0.3s ease;
}
</style>