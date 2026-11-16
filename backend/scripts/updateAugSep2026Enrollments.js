require("dotenv").config();
const mysql = require("mysql2/promise");

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

const TARGETS = [

    // =====================================
// JANUARY 2025
// Current total: 75
// Correct total: 74
// =====================================
{
  label: "January 2025 TDC",
  course: "TDC",
  year: 2025,
  month: 1,
  target: 9,
  maxDay: 27,
},
{
  label: "January 2025 PDC-A",
  course: "PDC-A",
  year: 2025,
  month: 1,
  target: 33,
  maxDay: 27,
},
{
  label: "January 2025 PDC-B",
  course: "PDC-B",
  year: 2025,
  month: 1,
  target: 20,
  maxDay: 27,
},
{
  label: "January 2025 PDC-AB",
  course: "PDC-AB",
  year: 2025,
  month: 1,
  target: 13,
  maxDay: 27,
},
  // =====================================
  // FEBRUARY 2024
  // Current total: 135
  // Correct total: 121
  // =====================================
  {
    label: "February 2024 TDC",
    course: "TDC",
    year: 2024,
    month: 2,
    target: 41,
    maxDay: 27,
  },
  {
    label: "February 2024 PDC-A",
    course: "PDC-A",
    year: 2024,
    month: 2,
    target: 71,
    maxDay: 27,
  },
  {
    label: "February 2024 PDC-B",
    course: "PDC-B",
    year: 2024,
    month: 2,
    target: 9,
    maxDay: 27,
  },
  {
    label: "February 2024 PDC-AB",
    course: "PDC-AB",
    year: 2024,
    month: 2,
    target: 0,
    maxDay: 27,
  },

  // =====================================
  // APRIL 2025
  // Current total: 93
  // Correct total: 98
  // =====================================
  {
    label: "April 2025 TDC",
    course: "TDC",
    year: 2025,
    month: 4,
    target: 11,
    maxDay: 27,
  },
  {
    label: "April 2025 PDC-A",
    course: "PDC-A",
    year: 2025,
    month: 4,
    target: 44,
    maxDay: 27,
  },
  {
    label: "April 2025 PDC-B",
    course: "PDC-B",
    year: 2025,
    month: 4,
    target: 26,
    maxDay: 27,
  },
  {
    label: "April 2025 PDC-AB",
    course: "PDC-AB",
    year: 2025,
    month: 4,
    target: 17,
    maxDay: 27,
  },

  // =====================================
  // NOVEMBER 2025
  // Current total: 69
  // Correct total: 67
  // =====================================
  {
    label: "November 2025 TDC",
    course: "TDC",
    year: 2025,
    month: 11,
    target: 0,
    maxDay: 27,
  },
  {
    label: "November 2025 PDC-A",
    course: "PDC-A",
    year: 2025,
    month: 11,
    target: 34,
    maxDay: 27,
  },
  {
    label: "November 2025 PDC-B",
    course: "PDC-B",
    year: 2025,
    month: 11,
    target: 20,
    maxDay: 27,
  },
  {
    label: "November 2025 PDC-AB",
    course: "PDC-AB",
    year: 2025,
    month: 11,
    target: 13,
    maxDay: 27,
  },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDate(year, month, maxDay) {
  const day = randomInt(1, maxDay);
  const hour = randomInt(8, 17);
  const minute = randomInt(0, 59);

  const yyyy = String(year);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
}

async function getCurrentCount(pool, courseId, year, month) {
  const monthString = String(month).padStart(2, "0");
  const start = `${year}-${monthString}-01`;

  let nextYear = year;
  let nextMonth = month + 1;

  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear++;
  }

  const nextMonthString = String(nextMonth).padStart(2, "0");
  const end = `${nextYear}-${nextMonthString}-01`;

  const [rows] = await pool.execute(
    `
    SELECT COUNT(*) AS total
    FROM schedule_reservations sr
    JOIN users u ON u.id = sr.student_id
    WHERE u.email LIKE 'mockstudent%@seedtest.local'
      AND sr.course_id = ?
      AND sr.created_at >= ?
      AND sr.created_at < ?
    `,
    [courseId, start, end]
  );

  return Number(rows[0].total);
}

async function getUnusedStudent(pool, scheduleId) {
  const [rows] = await pool.execute(
    `
    SELECT u.id
    FROM users u
    WHERE u.email LIKE 'mockstudent%@seedtest.local'
      AND NOT EXISTS (
        SELECT 1
        FROM schedule_reservations sr
        WHERE sr.student_id = u.id
          AND sr.schedule_id = ?
      )
    ORDER BY RAND()
    LIMIT 1
    `,
    [scheduleId]
  );

  if (!rows.length) {
    throw new Error(
      `No unused mock student available for schedule_id ${scheduleId}`
    );
  }

  return rows[0].id;
}

async function insertReservation(
  pool,
  course,
  year,
  month,
  maxDay
) {
  const studentId = await getUnusedStudent(
    pool,
    course.scheduleId
  );

  const createdAt = randomDate(
    year,
    month,
    maxDay
  );

  const paymentMethod = randomChoice([
    "GCASH",
    "CASH",
  ]);

  const [result] = await pool.execute(
    `
    INSERT INTO schedule_reservations
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
    VALUES (
      ?, ?, ?, 'WALKIN', 'DONE',
      ?, ?, ?, ?, 'DRIVING', 'walkin'
    )
    `,
    [
      course.scheduleId,
      studentId,
      course.id,
      paymentMethod,
      createdAt,
      createdAt,
      createdAt,
    ]
  );

  const reservationId = result.insertId;

  const certificateCode =
    `DRIVE-${year}-${randomInt(
      1000000,
      9999999
    )}-${reservationId}`;

  await pool.execute(
    `
    INSERT INTO certificates
    (
      reservation_id,
      certificate_code,
      certificate_type,
      status,
      issued_at
    )
    VALUES (?, ?, 'DRIVING', 'issued', ?)
    `,
    [
      reservationId,
      certificateCode,
      createdAt,
    ]
  );

  console.log(
    `  + Added reservation ${reservationId} for student ${studentId}`
  );
}

async function removeExcess(
  pool,
  course,
  year,
  month,
  amount
) {
  if (amount <= 0) return;

  const monthString =
    String(month).padStart(2, "0");

  const start =
    `${year}-${monthString}-01`;

  let nextYear = year;
  let nextMonth = month + 1;

  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear++;
  }

  const end =
    `${nextYear}-${String(nextMonth)
      .padStart(2, "0")}-01`;

  const [rows] = await pool.execute(
    `
    SELECT sr.reservation_id
    FROM schedule_reservations sr
    JOIN users u
      ON u.id = sr.student_id
    WHERE u.email LIKE 'mockstudent%@seedtest.local'
      AND sr.course_id = ?
      AND sr.created_at >= ?
      AND sr.created_at < ?
    ORDER BY sr.reservation_id DESC
    LIMIT ${Number(amount)}
    `,
    [
      course.id,
      start,
      end,
    ]
  );

  for (const row of rows) {

    // Delete certificate first because it references reservation
    await pool.execute(
      `
      DELETE FROM certificates
      WHERE reservation_id = ?
      `,
      [row.reservation_id]
    );

    // Then delete the reservation
    await pool.execute(
      `
      DELETE FROM schedule_reservations
      WHERE reservation_id = ?
      `,
      [row.reservation_id]
    );

    console.log(
      `  - Removed reservation ${row.reservation_id}`
    );
  }
}

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log(
      "Connected to DB:",
      process.env.DB_NAME
    );

    console.log(
      "\nUpdating August and September 2026...\n"
    );

    for (const target of TARGETS) {
      const course =
        COURSES[target.course];

      const current =
        await getCurrentCount(
          connection,
          course.id,
          target.year,
          target.month
        );

      console.log(
        `${target.label}: current=${current}, target=${target.target}`
      );

      if (current < target.target) {
        const missing =
          target.target - current;

        console.log(
          `  Need to add ${missing}`
        );

        for (
          let i = 0;
          i < missing;
          i++
        ) {
          await insertReservation(
            connection,
            course,
            target.year,
            target.month,
            target.maxDay
          );
        }
      } else if (
        current > target.target
      ) {
        const excess =
          current - target.target;

        console.log(
          `  Need to remove ${excess}`
        );

        await removeExcess(
          connection,
          course,
          target.year,
          target.month,
          excess
        );
      } else {
        console.log(
          "  Already correct."
        );
      }
    }

    await connection.commit();

    console.log(
      "\n=================================="
    );
    console.log(
      "AUGUST / SEPTEMBER UPDATE COMPLETE"
    );
    console.log(
      "=================================="
    );
  } catch (err) {
    await connection.rollback();

    console.error(
      "\nUpdate failed."
    );
    console.error(
      "All changes rolled back."
    );
    console.error(err);

    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();