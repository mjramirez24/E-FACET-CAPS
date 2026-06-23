const transporter = require('../config/email.config');
const pool = require('../config/database'); // ← ADD THIS

/**
 * Send reservation confirmation email to student
 */
const sendReservationConfirmation = async (emailData) => {
  const {
    studentEmail,
    studentName,
    courseName,
    courseCode,
    scheduleId,
    date,
    startTime,
    endTime,
    instructor,
    courseFee,
    paymentMethod,
    paymentRef,
    requirementsMode,
    notes,
    isPackage,
    day2Date,
    day2StartTime,
    day2EndTime,
  } = emailData;

  const mailOptions = {
    from: `"E-FACET" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `✅ Reservation Confirmed - ${courseName} (${courseCode})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #15803d 0%, #166534 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px 20px;
            border: 1px solid #e5e7eb;
          }
          .info-box {
            background: white;
            border-left: 4px solid #15803d;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #374151;
          }
          .value {
            color: #15803d;
            font-weight: 500;
          }
          .package-notice {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
          }
          .footer {
            background: #1f2937;
            color: #9ca3af;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-radius: 0 0 10px 10px;
          }
          .important {
            background: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
          }
          .success-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎉 Reservation Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.95;">Your slot has been successfully reserved</p>
        </div>

        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <p>Your reservation has been confirmed! Here are your booking details:</p>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #15803d;">📚 Course Information</h3>
            <div class="info-row">
              <span class="label">Course:</span>
              <span class="value">${courseName}</span>
            </div>
            <div class="info-row">
              <span class="label">Course Code:</span>
              <span class="value">${courseCode}</span>
            </div>
            <div class="info-row">
              <span class="label">Course Fee:</span>
              <span class="value">₱${Number(courseFee).toLocaleString()}</span>
            </div>
          </div>

          ${isPackage ? `
            <div class="package-notice">
              <h3 style="margin-top: 0; color: #f59e0b;">📦 2-Day Package Reservation</h3>
              <p style="margin: 5px 0;"><strong>You have reserved BOTH days:</strong></p>
            </div>
          ` : ''}

          <div class="info-box">
            <h3 style="margin-top: 0; color: #15803d;">📅 Schedule Details ${isPackage ? '- Day 1' : ''}</h3>
            <div class="info-row">
              <span class="label">Schedule ID:</span>
              <span class="value">#${scheduleId}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-row">
              <span class="label">Time:</span>
              <span class="value">${startTime} - ${endTime}</span>
            </div>
            <div class="info-row">
              <span class="label">Instructor:</span>
              <span class="value">${instructor}</span>
            </div>
          </div>

          ${isPackage && day2Date ? `
            <div class="info-box">
              <h3 style="margin-top: 0; color: #15803d;">📅 Schedule Details - Day 2</h3>
              <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(day2Date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">${day2StartTime} - ${day2EndTime}</span>
              </div>
            </div>
          ` : ''}

          <div class="info-box">
            <h3 style="margin-top: 0; color: #15803d;">💳 Payment Information</h3>
            <div class="info-row">
              <span class="label">Payment Method:</span>
              <span class="value">${paymentMethod === 'CASH' ? 'Cash On-Site' : paymentMethod}</span>
            </div>
            ${paymentRef ? `
              <div class="info-row">
                <span class="label">Payment Reference:</span>
                <span class="value" style="font-family: monospace;">${paymentRef}</span>
              </div>
            ` : ''}
            <div class="info-row">
              <span class="label">Requirements Mode:</span>
              <span class="value">${requirementsMode === 'walkin' ? 'Walk-in (On-site)' : 'Online Upload'}</span>
            </div>
          </div>

          ${notes ? `
            <div class="info-box">
              <h3 style="margin-top: 0; color: #15803d;">📝 Your Notes</h3>
              <p style="margin: 5px 0; font-style: italic;">${notes}</p>
            </div>
          ` : ''}

          ${paymentMethod === 'CASH' ? `
            <div class="important">
              <h4 style="margin-top: 0; color: #dc2626;">⚠️ Important Reminder</h4>
              <p style="margin: 5px 0;">Please bring the exact payment amount on your scheduled date:</p>
              <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #15803d;">₱${Number(courseFee).toLocaleString()}</p>
            </div>
          ` : ''}

          ${requirementsMode === 'walkin' ? `
            <div class="important">
              <h4 style="margin-top: 0; color: #dc2626;">📋 Requirements Reminder</h4>
              <p style="margin: 5px 0;">Don't forget to bring all required documents on your scheduled date.</p>
            </div>
          ` : ''}

          <div style="margin: 30px 0; padding: 20px; background: #ecfdf5; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #047857;">
              <strong>Reservation Status:</strong>
            </p>
            <span class="success-badge">CONFIRMED</span>
          </div>

          <p style="margin-top: 20px;">
            Thank you for choosing our driving school! If you have any questions, please don't hesitate to contact us.
          </p>

          <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            See you on your scheduled date!
          </p>
        </div>

        <div class="footer">
          <p style="margin: 0 0 10px 0;">This is an automated message. Please do not reply to this email.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Driving School Reservation System. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Reservation confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending reservation email:', error);
    throw error;
  }
};

/**
 * Send notification to admin about new reservation
 */
const sendAdminNotification = async (emailData) => {
  const {
    studentName,
    studentEmail,
    courseName,
    courseCode,
    scheduleId,
    date,
    startTime,
    endTime,
    paymentMethod,
    paymentRef,
    isPackage,
    reservationId,
  } = emailData;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"Driving School System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `🔔 New Reservation - ${studentName} - ${courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .info-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🔔 New Reservation Alert</h2>
          </div>
          <div class="content">
            <h3>Reservation Details</h3>
            <div class="info-row">
              <span class="label">Reservation ID:</span> #${reservationId}
            </div>
            <div class="info-row">
              <span class="label">Student:</span> ${studentName}
            </div>
            <div class="info-row">
              <span class="label">Email:</span> ${studentEmail}
            </div>
            <div class="info-row">
              <span class="label">Course:</span> ${courseName} (${courseCode})
            </div>
            <div class="info-row">
              <span class="label">Schedule:</span> #${scheduleId}
            </div>
            <div class="info-row">
              <span class="label">Date:</span> ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="info-row">
              <span class="label">Time:</span> ${startTime} - ${endTime}
            </div>
            <div class="info-row">
              <span class="label">Payment Method:</span> ${paymentMethod}
            </div>
            ${paymentRef ? `
              <div class="info-row">
                <span class="label">Payment Ref:</span> ${paymentRef}
              </div>
            ` : ''}
            ${isPackage ? `
              <div class="info-row" style="background: #fef3c7; padding: 10px; margin-top: 10px;">
                <strong>⚠️ This is a 2-DAY PACKAGE reservation</strong>
              </div>
            ` : ''}
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
              Please review and process this reservation in the admin panel.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    throw error;
  }
};

/**
 * Send schedule reminder email to student (1 day before)
 */
const sendReminderEmail = async (emailData) => {
  const {
    studentEmail,
    studentName,
    courseName,
    courseCode,
    scheduleId,
    date,
    startTime,
    endTime,
    instructor,
    courseFee,
    paymentMethod,
    requirementsMode,
    notes,
    isPackage,
    day2Date,
    day2StartTime,
    day2EndTime,
  } = emailData;

  const mailOptions = {
    from: `"E-FACET" <${process.env.EMAIL_USER}>`,
    to: studentEmail,
    subject: `⏰ Reminder: Your Schedule Tomorrow - ${courseName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px 20px;
            border: 1px solid #e5e7eb;
          }
          .info-box {
            background: white;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            color: #374151;
          }
          .value {
            color: #f59e0b;
            font-weight: 500;
          }
          .package-notice {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
          }
          .footer {
            background: #1f2937;
            color: #9ca3af;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            border-radius: 0 0 10px 10px;
          }
          .important {
            background: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
          }
          .reminder-badge {
            display: inline-block;
            background: #f59e0b;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 700;
            margin: 15px 0;
          }
          .countdown {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
          }
          .countdown-text {
            font-size: 28px;
            font-weight: bold;
            color: #d97706;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 32px;">⏰ Schedule Reminder</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 18px;">Your schedule is tomorrow!</p>
        </div>

        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>
          
          <div class="countdown">
            <p style="margin: 0; font-size: 16px; color: #78350f;">Your scheduled class is:</p>
            <div class="countdown-text">TOMORROW</div>
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <p style="font-size: 16px; font-weight: 600; color: #374151;">
            This is a friendly reminder about your upcoming driving lesson.
          </p>

          ${isPackage ? `
            <div class="package-notice">
              <h3 style="margin-top: 0; color: #f59e0b;">📦 2-Day Package Reminder</h3>
              <p style="margin: 5px 0;"><strong>Note: This is a 2-day course</strong></p>
              <p style="margin: 5px 0; font-size: 14px;">Please attend BOTH days to complete the course.</p>
            </div>
          ` : ''}

          <div class="info-box">
            <h3 style="margin-top: 0; color: #f59e0b;">📚 Course Details</h3>
            <div class="info-row">
              <span class="label">Course:</span>
              <span class="value">${courseName}</span>
            </div>
            <div class="info-row">
              <span class="label">Course Code:</span>
              <span class="value">${courseCode}</span>
            </div>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #f59e0b;">📅 Tomorrow's Schedule ${isPackage ? '- Day 1' : ''}</h3>
            <div class="info-row">
              <span class="label">Schedule ID:</span>
              <span class="value">#${scheduleId}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-row">
              <span class="label">Time:</span>
              <span class="value">${startTime} - ${endTime}</span>
            </div>
            <div class="info-row">
              <span class="label">Instructor:</span>
              <span class="value">${instructor}</span>
            </div>
          </div>

          ${isPackage && day2Date ? `
            <div class="info-box">
              <h3 style="margin-top: 0; color: #f59e0b;">📅 Day 2 Schedule</h3>
              <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${new Date(day2Date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">${day2StartTime} - ${day2EndTime}</span>
              </div>
            </div>
          ` : ''}

          <div class="important">
            <h4 style="margin-top: 0; color: #dc2626;">📋 Important Reminders</h4>
            
            ${paymentMethod === 'CASH' ? `
              <p style="margin: 8px 0;">
                💰 <strong>Payment:</strong> Bring cash payment of 
                <strong style="color: #15803d;">₱${Number(courseFee).toLocaleString()}</strong>
              </p>
            ` : `
              <p style="margin: 8px 0;">
                💳 <strong>Payment:</strong> ${paymentMethod} payment verified
              </p>
            `}
            
            ${requirementsMode === 'walkin' ? `
              <p style="margin: 8px 0;">
                📄 <strong>Requirements:</strong> Don't forget to bring all required documents
              </p>
            ` : `
              <p style="margin: 8px 0;">
                📤 <strong>Requirements:</strong> Already uploaded online
              </p>
            `}
            
            <p style="margin: 8px 0;">
              ⏰ <strong>Be on time:</strong> Please arrive 10-15 minutes before ${startTime}
            </p>
            
            <p style="margin: 8px 0;">
              📱 <strong>Contact:</strong> If you need to cancel or reschedule, please inform us immediately
            </p>
          </div>

          ${notes ? `
            <div class="info-box">
              <h3 style="margin-top: 0; color: #f59e0b;">📝 Your Notes</h3>
              <p style="margin: 5px 0; font-style: italic;">${notes}</p>
            </div>
          ` : ''}

          <div style="margin: 30px 0; padding: 20px; background: #fef3c7; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 18px; color: #78350f; font-weight: 600;">
              See you tomorrow!
            </p>
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              We're looking forward to your class. Drive safely! 🚗
            </p>
          </div>

        </div>

        <div class="footer">
          <p style="margin: 0 0 10px 0;">This is an automated reminder. Please do not reply to this email.</p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} Driving School Reservation System. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const transporter = require('../config/email.config');
    const pool = require('../config/database');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending reminder email:', error);
    throw error;
  }
};

const sendNewCourseAnnouncement = async (courseData, track = 'driving') => {
  const { course_name, course_code, duration, description } = courseData;

  const isTesda = track === 'tesda';
  const primaryColor = isTesda ? '#1d4ed8' : '#15803d';
  const primaryDark  = isTesda ? '#1e40af' : '#166534';
  const trackLabel   = isTesda ? 'TESDA Training' : 'Driving Course';
  const emoji        = isTesda ? '🛠️' : '🚦';

  const [students] = await pool.query(
    `SELECT u.email, u.fullname 
     FROM users u
     JOIN tracks t ON t.track_id = u.track_id
     WHERE u.role = 'user' 
       AND t.track_code = ?`,
    [track]
  );

  if (!students.length) return { sent: 0 };

  let sent = 0;
  for (const student of students) {
    try {
      await transporter.sendMail({
        from: `"E-FACET" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `📢 New Course Available - ${course_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, ${primaryColor}, ${primaryDark}); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; }
              .info-box { background: white; border-left: 4px solid ${primaryColor}; padding: 15px; margin: 15px 0; border-radius: 5px; }
              .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .info-row:last-child { border-bottom: none; }
              .label { font-weight: 600; color: #374151; }
              .value { color: ${primaryColor}; font-weight: 500; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin:0; font-size:28px;">${emoji} New Course Available!</h1>
              <p style="margin:10px 0 0 0; opacity:0.95;">A new ${trackLabel} course has been added</p>
            </div>
            <div class="content">
              <p>Dear <strong>${student.fullname}</strong>,</p>
              <p>We're excited to announce a new course is now available for enrollment!</p>
              <div class="info-box">
                <h3 style="margin-top:0; color:${primaryColor};">📚 Course Details</h3>
                <div class="info-row">
                  <span class="label">Course Name:</span>
                  <span class="value">${course_name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Course Code:</span>
                  <span class="value">${course_code}</span>
                </div>
                <div class="info-row">
                  <span class="label">Duration:</span>
                  <span class="value">${duration}</span>
                </div>
                ${description ? `
                <div class="info-row">
                  <span class="label">Description:</span>
                  <span class="value">${description}</span>
                </div>` : ''}
              </div>
              <div style="margin:30px 0; padding:20px; background:#ecfdf5; border-radius:8px; text-align:center;">
                <p style="margin:0; font-size:16px; color:${primaryDark}; font-weight:600;">
                  Log in to your account to enroll now!
                </p>
              </div>
              <p style="color:#6b7280; font-size:14px;">If you have any questions, feel free to contact us.</p>
            </div>
            <div class="footer">
              <p style="margin:0 0 10px 0;">This is an automated message. Please do not reply.</p>
              <p style="margin:0;">&copy; ${new Date().getFullYear()} E-FACET Enrollment System. All rights reserved.</p>
            </div>
          </body>
          </html>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`❌ Failed to send to ${student.email}:`, err.message);
    }
  }

  console.log(`✅ New course announcement sent to ${sent}/${students.length} students`);
  return { sent, total: students.length };
};

const sendPasswordResetCode = async (email, fullname, code) => {
  const mailOptions = {
    from: `"E-FACET" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 Password Reset Code - E-FACET`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #15803d 0%, #166534 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; }
          .code-box { background: white; border: 2px dashed #15803d; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .code { font-size: 42px; font-weight: bold; color: #15803d; letter-spacing: 10px; font-family: monospace; }
          .warning { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin:0; font-size:28px;">🔐 Password Reset</h1>
          <p style="margin:10px 0 0 0; opacity:0.95;">You requested a password reset</p>
        </div>
        <div class="content">
          <p>Dear <strong>${fullname}</strong>,</p>
          <p>Use the verification code below to reset your password. This code expires in <strong>10 minutes</strong>.</p>
          <div class="code-box">
            <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;">Your verification code:</p>
            <div class="code">${code}</div>
          </div>
          <div class="warning">
            <h4 style="margin-top:0; color:#dc2626;">⚠️ Security Reminder</h4>
            <p style="margin:5px 0;">Never share this code with anyone. E-FACET staff will never ask for this code.</p>
            <p style="margin:5px 0;">If you did not request a password reset, please ignore this email.</p>
          </div>
          <p style="color:#6b7280; font-size:14px;">This code will expire in 10 minutes.</p>
        </div>
        <div class="footer">
          <p style="margin:0 0 10px 0;">This is an automated message. Please do not reply to this email.</p>
          <p style="margin:0;">&copy; ${new Date().getFullYear()} E-FACET Enrollment System. All rights reserved.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset code sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending reset code:', error);
    throw error;
  }
};

module.exports = {
  sendReservationConfirmation,
  sendAdminNotification,
  sendReminderEmail,
  sendNewCourseAnnouncement,
  sendPasswordResetCode,
};