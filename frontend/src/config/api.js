export const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:3000`
  : window.location.origin;

export const API_URL = `${API_BASE}/api`;
