const toLocalYMD = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return String(dateLike || "");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// "2026-10-05" o "2026-10-04T16:00:00.000Z" -> "2026-10-05" (local)
export const normalizeYMD = (v) => {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return toLocalYMD(s);
};

const TESDA_HOURS_PER_DAY = 9;

export const parseDurationHours = (duration) => {
  const m = String(duration || "").match(/(\d+(?:\.\d+)?)/);
  const n = m ? Number(m[1]) : 0;
  return Number.isFinite(n) ? n : 0;
};

const tesdaDaysFromDuration = (duration) => {
  const totalHours = parseDurationHours(duration);
  return totalHours > 0 ? Math.max(1, Math.ceil(totalHours / TESDA_HOURS_PER_DAY)) : 1;
};

export const isMonToSatYMD = (ymd) => {
  if (!ymd) return false;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day >= 1 && day <= 6;
};

const addDaysSkipSundays = (startYmd, addTrainingDays) => {
  let d = new Date(`${startYmd}T00:00:00`);
  let added = 0;
  while (added < addTrainingDays) {
    d.setDate(d.getDate() + 1);
    if (isMonToSatYMD(toLocalYMD(d))) added++;
  }
  return toLocalYMD(d);
};

export const listTesdaTrainingDays = (startYmd, duration) => {
  if (!startYmd) return [];
  if (!isMonToSatYMD(startYmd)) return [];
  const daysNeeded = tesdaDaysFromDuration(duration);
  const out = [startYmd];
  let cur = startYmd;
  while (out.length < daysNeeded) {
    cur = addDaysSkipSundays(cur, 1);
    out.push(cur);
  }
  return out;
};

export const tesdaEndDateFromStart = (startYmd, duration) => {
  if (!startYmd) return "";
  const days = listTesdaTrainingDays(startYmd, duration);
  return days.length ? days[days.length - 1] : "";
};