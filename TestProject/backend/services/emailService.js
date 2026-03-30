const nodemailer = require('nodemailer');

// HTML-escape helper for email templates
const escapeEmailText = s => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send email with attachment
const sendEmailWithAttachment = async (to, subject, body, attachment) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: body,
    attachments: attachment ? [{
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType
    }] : []
  };

  await transporter.sendMail(mailOptions);
};

// Send plain text email
const sendPlainEmail = async (to, subject, body) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: body
  };

  await transporter.sendMail(mailOptions);
};

// Send HTML email
const sendHtmlEmail = async (to, subject, html, text) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || "HTML email content"
  };
  await transporter.sendMail(mailOptions);
};

// Send collaboration invitation email
const sendCollaborationInvitation = async (to, listName, role, inviterEmail) => {
  const subject = `You've been invited to collaborate on "${listName}"`;
  const body = `Hello!

${inviterEmail} has invited you to collaborate on the list "${listName}".

Your role: ${role}

You can now access this list in your Todo App dashboard.

Best regards,
Todo App Team`;

  await sendPlainEmail(to, subject, body);
};

// Send shared content email
const sendSharedContent = async (to, resourceName, format, fileBuffer, fileName, fileType) => {
  const subject = `Shared: ${resourceName}`;
  const body = `Hello!

Someone has shared "${resourceName}" with you.

The file is attached in ${format.toUpperCase()} format.

Best regards,
Todo App Team`;

  await sendEmailWithAttachment(to, subject, body, {
    filename: fileName,
    content: fileBuffer,
    contentType: fileType
  });
};

// Send task assignment notification email
const sendTaskAssignment = async (toEmail, assignerEmail, taskTitle, listName, dueDate, priority, appUrl) => {
  const dueLine  = dueDate
    ? `Due date:  ${new Date(dueDate).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}`
    : 'Due date:  Not set';
  const prioLine = `Priority:  ${priority || 'Medium'}`;
  const link     = appUrl || 'http://localhost:3000';

  const subject = `📌 You've been assigned: "${taskTitle}"`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background:#f7f8fa; margin:0; padding:0; }
    .wrap { max-width:520px; margin:40px auto; background:#fff; border-radius:12px;
            border:1px solid #e5e7eb; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,.07); }
    .header { background:#6366f1; padding:28px 32px; }
    .header h1 { color:#fff; margin:0; font-size:1.1rem; font-weight:700; }
    .header p  { color:#c7d2fe; margin:6px 0 0; font-size:0.85rem; }
    .body { padding:28px 32px; }
    .task-box { background:#f3f4f6; border-radius:8px; padding:16px 20px; margin:20px 0; }
    .task-title { font-size:1rem; font-weight:700; color:#111827; margin:0 0 12px; }
    .meta-row { display:flex; gap:8px; align-items:center; margin:6px 0; font-size:0.82rem; color:#6b7280; }
    .badge { display:inline-block; padding:2px 8px; border-radius:99px; font-size:0.72rem; font-weight:600; }
    .badge-high { background:#fee2e2; color:#ef4444; }
    .badge-med  { background:#fef3c7; color:#f59e0b; }
    .badge-low  { background:#d1fae5; color:#10b981; }
    .cta { display:inline-block; margin-top:20px; padding:10px 22px; background:#6366f1;
           color:#fff; border-radius:8px; text-decoration:none; font-weight:600; font-size:0.875rem; }
    .footer { padding:16px 32px; border-top:1px solid #e5e7eb; font-size:0.78rem; color:#9ca3af; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>📌 New task assigned to you</h1>
      <p>${escapeEmailText(assignerEmail)} assigned you a task in <strong>${escapeEmailText(listName)}</strong></p>
    </div>
    <div class="body">
      <div class="task-box">
        <div class="task-title">${escapeEmailText(taskTitle)}</div>
        <div class="meta-row">
          📋 List: <strong>${escapeEmailText(listName)}</strong>
        </div>
        <div class="meta-row">
          📅 ${dueLine}
        </div>
        <div class="meta-row">
          Priority: <span class="badge badge-${(priority||'Medium').toLowerCase() === 'high' ? 'high' : (priority||'Medium').toLowerCase() === 'low' ? 'low' : 'med'}">${escapeEmailText(priority || 'Medium')}</span>
        </div>
      </div>
      <a href="${link}/dashboard.html" class="cta">Open TaskFlow →</a>
    </div>
    <div class="footer">You received this because you were assigned a task on TaskFlow.</div>
  </div>
</body>
</html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text: `You've been assigned: "${taskTitle}"\n\nAssigned by: ${assignerEmail}\nList: ${listName}\n${dueLine}\n${prioLine}\n\nOpen TaskFlow: ${link}/dashboard.html`
  });
};

// Send task reassignment / unassignment notification
const sendTaskReassigned = async (toEmail, assignerEmail, taskTitle, listName, newAssigneeEmail) => {
  const subject = `🔄 Task reassigned: "${taskTitle}"`;
  const body = newAssigneeEmail
    ? `Hi,\n\n${assignerEmail} has reassigned the task "${taskTitle}" (list: ${listName}) to ${newAssigneeEmail}.\n\nYou are no longer assigned to this task.\n\nTaskFlow`
    : `Hi,\n\n${assignerEmail} has unassigned you from the task "${taskTitle}" (list: ${listName}).\n\nTaskFlow`;
  await sendPlainEmail(toEmail, subject, body);
};
// Send reminder email for upcoming due date
const sendReminder = async (userEmail, todoTitle, listName, dueDate) => {
  const dueDateFormatted = new Date(dueDate).toLocaleDateString();
  const subject = `Reminder: "${todoTitle}" due soon`;
  const body = `Hello!

This is a reminder that your todo "${todoTitle}" is due on ${dueDateFormatted}.

List: ${listName}

Please complete it before the due date.

Best regards,
Todo App Team`;

  await sendPlainEmail(userEmail, subject, body);
};

// Send mention notification email
const sendMentionNotification = async (toEmail, mentionerEmail, taskTitle, taskLink) => {
  const subject = `💬 You were mentioned in "${taskTitle}"`;
  const body = `Hi,\n\n${mentionerEmail} mentioned you in a comment on task "${taskTitle}".\n\nView task: ${taskLink || ''}\n\nTaskFlow`;
  await sendPlainEmail(toEmail, subject, body);
};

// Generic notification email
const sendNotificationEmail = async (toEmail, type, payload) => {
  const subject = payload.title || 'TaskFlow Notification';
  const body = `${payload.body || ''}\n\n${payload.link ? 'View: ' + payload.link : ''}\n\nTaskFlow`;
  await sendPlainEmail(toEmail, subject, body);
};

// Send workspace invitation email
const sendWorkspaceInvitation = async (toEmail, inviterEmail, workspaceName, inviteLink) => {
  const subject = `🏢 You've been invited to join "${workspaceName}" on TaskFlow`;
  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f7f8fa;margin:0;padding:0;}
  .wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;}
  .header{background:#6366f1;padding:28px 32px;}
  .header h1{color:#fff;margin:0;font-size:1.1rem;}
  .body{padding:28px 32px;}
  .cta{display:inline-block;margin-top:20px;padding:10px 22px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;}
  .footer{padding:16px 32px;border-top:1px solid #e5e7eb;font-size:0.78rem;color:#9ca3af;}
</style></head><body>
<div class="wrap">
  <div class="header"><h1>🏢 Workspace Invitation</h1></div>
  <div class="body">
    <p><strong>${escapeEmailText(inviterEmail)}</strong> has invited you to join the workspace <strong>"${escapeEmailText(workspaceName)}"</strong> on TaskFlow.</p>
    <a href="${inviteLink}" class="cta">Accept Invitation →</a>
    <p style="margin-top:16px;font-size:0.8rem;color:#6b7280;">This invitation expires in 7 days.</p>
  </div>
  <div class="footer">You received this because someone invited you to TaskFlow.</div>
</div>
</body></html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text: `${inviterEmail} invited you to join "${workspaceName}" on TaskFlow.\n\nAccept: ${inviteLink}\n\nThis invitation expires in 7 days.`
  });
};

// Send password reset email
const sendPasswordReset = async (toEmail, resetLink) => {
  const subject = '🔑 Reset your TaskFlow password';
  const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Arial,sans-serif;background:#f7f8fa;margin:0;padding:0;}
  .wrap{max-width:520px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;}
  .header{background:#6366f1;padding:28px 32px;}
  .header h1{color:#fff;margin:0;font-size:1.1rem;}
  .body{padding:28px 32px;color:#374151;}
  .cta{display:inline-block;margin-top:20px;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;}
  .note{margin-top:20px;font-size:0.8rem;color:#9ca3af;}
  .footer{padding:16px 32px;border-top:1px solid #e5e7eb;font-size:0.78rem;color:#9ca3af;}
</style></head><body>
<div class="wrap">
  <div class="header"><h1>🔑 Password Reset Request</h1></div>
  <div class="body">
    <p>We received a request to reset your TaskFlow password. Click the button below to choose a new password.</p>
    <a href="${resetLink}" class="cta">Reset Password →</a>
    <p class="note">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
  <div class="footer">TaskFlow Pro · You received this because a password reset was requested for your account.</div>
</div>
</body></html>`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text: `Reset your TaskFlow password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`
  });
};

module.exports = {
  sendEmailWithAttachment,
  sendPlainEmail,
  sendHtmlEmail,
  sendCollaborationInvitation,
  sendSharedContent,
  sendReminder,
  sendTaskAssignment,
  sendTaskReassigned,
  sendMentionNotification,
  sendNotificationEmail,
  sendWorkspaceInvitation,
  sendPasswordReset
};
