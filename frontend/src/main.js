import { createApp } from "vue";
import App from "./App.vue";
import "normalize.css";
import router from "./router";
import "./style.css";

import axios from "axios";
axios.defaults.withCredentials = true;

// ✅ Font Awesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

// Import ALL the icons your component uses
import {
  // Your existing icons
  faUser,
  faHome,
  faBars,
  faChartLine,
  faSignInAlt,
  faUserPlus,
  faGraduationCap,
  faCar,
  faStar,
  faCogs,
  faQuestionCircle,
  faCloudUploadAlt,
  faCertificate,
  faFileAlt,
  faCalendarCheck,
  faFileSignature,
  faCheckCircle,
  faFileUpload,
  faCalendarAlt,
  faChartBar,
  faClipboardCheck,
  faUpload,
  faAward,
  faPhoneAlt,
  faList,
  faInfoCircle,
  faBriefcase,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faClock,
  faFile,
  faCalendar,
  faArrowRight,

  // NEW ICONS for enhanced modal
  faTimes, // For close button
  faChevronRight, // For course action buttons
  faListUl, // For course list section title
  faRoad, // For driving courses section title
} from "@fortawesome/free-solid-svg-icons";

// Import brand icons
import {
  faFacebookF,
  faTwitter,
  faInstagram,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

// Register ALL icons
library.add(
  // Your existing icons
  faUser,
  faHome,
  faBars,
  faChartLine,
  faSignInAlt,
  faUserPlus,
  faGraduationCap,
  faCar,
  faStar,
  faCogs,
  faQuestionCircle,
  faCloudUploadAlt,
  faCertificate,
  faFileAlt,
  faCalendarCheck,
  faFileSignature,
  faCheckCircle,
  faFileUpload,
  faCalendarAlt,
  faChartBar,
  faClipboardCheck,
  faUpload,
  faAward,
  faPhoneAlt,
  faList,
  faInfoCircle,
  faBriefcase,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faClock,
  faFile,
  faCalendar,
  faArrowRight,

  // NEW ICONS
  faTimes,
  faChevronRight,
  faListUl,
  faRoad,

  // Brand icons
  faFacebookF,
  faTwitter,
  faInstagram,
  faYoutube,
);

const app = createApp(App);

// Register Font Awesome component globally
app.component("font-awesome-icon", FontAwesomeIcon);

app.use(router);

app.config.globalProperties.$formatTime12 = (time) => {
  if (!time) return "—";

  const value = String(time).slice(0, 5);
  const [h, m] = value.split(":").map(Number);

  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return String(time);
  }

  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;

  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

app.config.globalProperties.$formatTimeRange12 = (start, end) => {
  const format = app.config.globalProperties.$formatTime12;
  return `${format(start)} - ${format(end)}`;
};

app.mount("#app");
