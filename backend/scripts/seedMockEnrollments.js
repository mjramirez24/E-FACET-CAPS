// backend/scripts/seedMockEnrollments.js
require("dotenv").config();
const mysql = require("mysql2/promise");

// =====================================================
// REAL MONTHLY DATA — JANUARY 2025 TO AUGUST 2026
// =====================================================
const REAL_MONTHLY_DATA = [
  // =========================
  // 2025
  // =========================
  { month: "2025-01", tdc: 9,  pdcTotal: 66 },
  { month: "2025-02", tdc: 11, pdcTotal: 99 },
  { month: "2025-03", tdc: 8,  pdcTotal: 122 },
  { month: "2025-04", tdc: 11, pdcTotal: 82 },
  { month: "2025-05", tdc: 13, pdcTotal: 153 },
  { month: "2025-06", tdc: 6,  pdcTotal: 66 },
  { month: "2025-07", tdc: 3,  pdcTotal: 78 },
  { month: "2025-08", tdc: 12, pdcTotal: 90 },
  { month: "2025-09", tdc: 0,  pdcTotal: 40 },
  { month: "2025-10", tdc: 0,  pdcTotal: 41 },
  { month: "2025-11", tdc: 0,  pdcTotal: 69 },
  { month: "2025-12", tdc: 0,  pdcTotal: 49 },

  // =========================
  // 2026
  // =========================
  { month: "2026-01", tdc: 5, pdcTotal: 19 },
  { month: "2026-02", tdc: 6, pdcTotal: 28 },
  { month: "2026-03", tdc: 2, pdcTotal: 28 },
  { month: "2026-04", tdc: 3, pdcTotal: 40 },
  { month: "2026-05", tdc: 6, pdcTotal: 46 },
  { month: "2026-06", tdc: 8, pdcTotal: 31 },
  { month: "2026-07", tdc: 5, pdcTotal: 24 },
  { month: "2026-08", tdc: 2, pdcTotal: 11 },
];

// =====================================================
// PDC DISTRIBUTION
// =====================================================
const PDC_RATIO = {
  A: 0.5,
  B: 0.3,
  AB: 0.2,
};

// =====================================================
// COURSES
// =====================================================
const COURSES = {
  TDC: {
    id: 6,
    scheduleId: 1,
  },

  "PDC-A": {
    id: 10,
    scheduleId: 8,
  },

  "PDC-B": {
    id: 11,
    scheduleId: 6,
  },

  "PDC-AB": {
    id: 12,
    scheduleId: 5,
  },
};

// 650 is needed because PDC-A alone exceeds 500
const MOCK_STUDENT_COUNT = 650;

// =====================================================
// RANDOM HELPERS
// =====================================================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffle(arr) {
  const a = [...arr];

  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

function randomDateInMonth(year, monthIndex) {
  const day = randomInt(1, 27);
  const hour = randomInt(8, 17);
  const minute = randomInt(0, 59);

  const d = new Date(
    year,
    monthIndex,
    day,
    hour,
    minute
  );

  return d
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

// =====================================================
// SPLIT PDC TOTAL INTO A / B / AB
// =====================================================
function splitPdcTotal(total) {
  const rawA = total * PDC_RATIO.A;
  const rawB = total * PDC_RATIO.B;
  const rawAB = total * PDC_RATIO.AB;

  let a = Math.round(rawA);
  let b = Math.round(rawB);
  let ab = Math.round(rawAB);

  // Adjust rounding difference to A
  const diff = total - (a + b + ab);

  a += diff;

  return {
    A: Math.max(0, a),
    B: Math.max(0, b),
    AB: Math.max(0, ab),
  };
}

// =====================================================
// MAIN
// =====================================================
async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  console.log("Connected to DB:", process.env.DB_NAME);

  // ===================================================
  // STEP A
  // CREATE MOCK STUDENT ACCOUNTS
  // ===================================================
  console.log(
    `Ensuring ${MOCK_STUDENT_COUNT} mock student accounts exist...`
  );

  const studentIds = [];

  for (let i = 1; i <= MOCK_STUDENT_COUNT; i++) {
    const email = `mockstudent${i}@seedtest.local`;
    const username = `mockstudent${i}`;

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length) {
      studentIds.push(existing[0].id);
      continue;
    }

    const [result] = await pool.execute(
      `INSERT INTO users
        (fullname, username, email, password, gender, role, track_id, is_disabled)
       VALUES (?, ?, ?, ?, ?, 'user', 1, 0)`,
      [
        `Mock Student ${i}`,
        username,
        email,
        "MOCK_SEED_NO_LOGIN",
        randomChoice(["male", "female"]),
      ]
    );

    studentIds.push(result.insertId);
  }

  console.log(
    `Ready: ${studentIds.length} mock student IDs.`
  );

  // ===================================================
  // STEP B
  // BUILD MASTER ENROLLMENT LIST
  // ===================================================
  const courseSchedule = {
    TDC: [],
    "PDC-A": [],
    "PDC-B": [],
    "PDC-AB": [],
  };

  for (const row of REAL_MONTHLY_DATA) {
    const [year, month] = row.month
      .split("-")
      .map(Number);

    const monthIndex = month - 1;

    // -------------------------
    // TDC
    // -------------------------
    if (row.tdc > 0) {
      courseSchedule.TDC.push({
        year,
        monthIndex,
        count: row.tdc,
      });
    }

    // -------------------------
    // PDC
    // -------------------------
    const split = splitPdcTotal(row.pdcTotal);

    if (split.A > 0) {
      courseSchedule["PDC-A"].push({
        year,
        monthIndex,
        count: split.A,
      });
    }

    if (split.B > 0) {
      courseSchedule["PDC-B"].push({
        year,
        monthIndex,
        count: split.B,
      });
    }

    if (split.AB > 0) {
      courseSchedule["PDC-AB"].push({
        year,
        monthIndex,
        count: split.AB,
      });
    }
  }

  // ===================================================
  // STEP C
  // INSERT RESERVATIONS + CERTIFICATES
  // ===================================================
  let totalReservationsInserted = 0;
  let totalCertificatesInserted = 0;

  for (const courseName of Object.keys(courseSchedule)) {
    const course = COURSES[courseName];
    const monthRows = courseSchedule[courseName];

    const totalNeeded = monthRows.reduce(
      (sum, r) => sum + r.count,
      0
    );

    console.log(
      `\n${courseName} (course_id ${course.id}): total ${totalNeeded} enrollments`
    );

    if (totalNeeded > studentIds.length) {
      console.warn(
        `⚠️ WARNING: ${courseName} needs ${totalNeeded} students, but only ${studentIds.length} are available.`
      );
    }

    // Shuffle once per course
    // This ensures no student repeats within the same course
    const shuffledStudents = shuffle(studentIds);

    let pointer = 0;

    for (const row of monthRows) {
      for (let e = 0; e < row.count; e++) {
        if (pointer >= shuffledStudents.length) {
          console.warn(
            `⚠️ Student pool exhausted for ${courseName}.`
          );

          break;
        }

        const studentId = shuffledStudents[pointer];
        pointer++;

        // ---------------------------------------------
        // CREATED AT
        // ---------------------------------------------
        const createdAt = randomDateInMonth(
          row.year,
          row.monthIndex
        );

        const paymentMethod = randomChoice([
          "GCASH",
          "CASH",
        ]);

        const source = "WALKIN";

        // ---------------------------------------------
        // INSERT RESERVATION
        // ---------------------------------------------
        const [resResult] = await pool.execute(
          `INSERT INTO schedule_reservations
            (
              schedule_id,
              student_id,
              course_id,
              reservation_source,
              reservation_status,
              payment_method,
              created_at,
              updated_at,
              done_at,
              reservation_type,
              requirements_mode
            )
           VALUES (?, ?, ?, ?, 'DONE', ?, ?, ?, ?, 'DRIVING', ?)`,
          [
            course.scheduleId,
            studentId,
            course.id,
            source,
            paymentMethod,
            createdAt,
            createdAt,
            createdAt,
            "walkin",
          ]
        );

        totalReservationsInserted++;

        // ---------------------------------------------
        // CERTIFICATE
        // ---------------------------------------------
        const reservationId = resResult.insertId;

        const certYear = row.year;
        const certRandom = randomInt(100000, 999999);

        const certCode =
          `DRIVE-${certYear}-${certRandom}`;

        // Keep certificate within the same month
        const lastDayOfMonth = new Date(
          row.year,
          row.monthIndex + 1,
          0
        ).getDate();

        const enrollDay =
          new Date(createdAt).getDate();

        const issuedDay = Math.min(
          lastDayOfMonth,
          enrollDay + randomInt(0, 5)
        );

        const issuedHour = randomInt(8, 17);
        const issuedMinute = randomInt(0, 59);

        const issuedDate = new Date(
          row.year,
          row.monthIndex,
          issuedDay,
          issuedHour,
          issuedMinute
        );

        const issuedAt = issuedDate
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

        await pool.execute(
          `INSERT INTO certificates
            (
              reservation_id,
              certificate_code,
              certificate_type,
              status,
              issued_at
            )
           VALUES (?, ?, 'DRIVING', 'issued', ?)`,
          [
            reservationId,
            certCode,
            issuedAt,
          ]
        );

        totalCertificatesInserted++;
      }
    }
  }

  // ===================================================
  // SUMMARY
  // ===================================================
  console.log("\n==========================================");
  console.log("✅ SEEDING COMPLETE");
  console.log("==========================================");

  console.log(
    `Reservations inserted: ${totalReservationsInserted}`
  );

  console.log(
    `Certificates inserted: ${totalCertificatesInserted}`
  );

  console.log(
    "Period: January 2025 - August 2026"
  );

  console.log(
    "2025 TDC: 73"
  );

  console.log(
    "2025 PDC: 955"
  );

  console.log(
    "2026 TDC: 37"
  );

  console.log(
    "2026 PDC: 227"
  );

  console.log(
    "Combined TDC: 110"
  );

  console.log(
    "Combined PDC: 1,182"
  );

  console.log(
    "Grand Total: 1,292"
  );

  console.log(
    "=========================================="
  );

  await pool.end();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});