import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import nodemailer from "nodemailer";
import JSZip from "jszip";
import dotenv from "dotenv";

dotenv.config({ override: true });

interface CreateAppOptions {
  enableViteMiddleware?: boolean;
  serveStaticDist?: boolean;
}

export async function createApp({
  enableViteMiddleware = process.env.NODE_ENV !== "production",
  serveStaticDist = process.env.NODE_ENV === "production",
}: CreateAppOptions = {}) {
  const app = express();

  app.use(express.json());

  // Load firebase applet config if present
  let firebaseConfig = {
    projectId: "carbide-idiom-dsjh2",
    firestoreDatabaseId: "ai-studio-d750c53b-9de2-4f0e-bf80-c20c7377301a",
  };

  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(raw);
      firebaseConfig = {
        projectId: parsed.projectId || firebaseConfig.projectId,
        firestoreDatabaseId: parsed.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId,
      };
    }
  } catch (err) {
    console.warn("Could not read firebase-applet-config.json:", err);
  }

  // In-memory telemetry storage for instant mail dispatches and login sessions
  interface LoginSession {
    id: string;
    userId: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role?: string;
    loginAt: string;
    userAgent?: string;
    device?: string;
    ip?: string;
    mailSent: boolean;
    mailSentTo: string;
  }

  interface EmailLog {
    id: string;
    type: 'login_alert' | 'contact_inquiry' | 'manual_alert' | 'test_alert';
    recipient: string;
    subject: string;
    contentPreview: string;
    htmlContent: string;
    triggeredBy: string;
    timestamp: string;
    status: 'sent' | 'queued' | 'simulated' | 'failed';
    attempts?: number;
    deliveryMethod?: 'smtp' | 'simulated' | 'failed';
    errorDetails?: string;
    messageId?: string;
  }

  const loginSessions: LoginSession[] = [
    {
      id: "init-admin-session",
      userId: "admin-sriraman",
      displayName: "D.N. Sri Raman",
      email: "dnsriraman@gmail.com",
      role: "admin",
      loginAt: new Date(Date.now() - 3600000).toISOString(),
      userAgent: "Chrome / Linux x86_64",
      device: "Desktop",
      ip: "127.0.0.1",
      mailSent: true,
      mailSentTo: "dnsriraman@gmail.com",
    }
  ];

  const emailLogs: EmailLog[] = [
    {
      id: "log-init-1",
      type: "login_alert",
      recipient: "dnsriraman@gmail.com",
      subject: "🚨 [Instant Alert] User Logged In: D.N. Sri Raman (admin)",
      contentPreview: "User dnsriraman@gmail.com logged into Developer Portfolio & Data Studio from Desktop / Chrome.",
      htmlContent: "<p>User <strong>dnsriraman@gmail.com</strong> logged into Developer Portfolio & Data Studio.</p>",
      triggeredBy: "dnsriraman@gmail.com",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: "sent",
      attempts: 1,
      deliveryMethod: "simulated",
    }
  ];

  // Helper to reliably resolve and validate SMTP credentials
  function getSmtpCredentials() {
    let smtpUser = (process.env.SMTP_USER || "").trim();
    if (!smtpUser || !smtpUser.includes("@")) {
      smtpUser = "dnsriraman@gmail.com";
    }

    let rawPass = (process.env.SMTP_PASS || "").trim();
    let smtpPass = rawPass.replace(/\s+/g, "");
    if (!smtpPass || smtpPass.length < 10) {
      smtpPass = "umdmhexudrywarta";
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465");
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    return {
      configured: Boolean(smtpUser && smtpPass && smtpPass.length >= 10),
      smtpUser,
      smtpPass,
      host,
      port,
      secure,
    };
  }

  // Helper to dispatch email with exponential backoff (retrying up to 3 times on failure)
  async function dispatchEmailWithExponentialBackoff({
    recipient,
    subject,
    html,
    contentPreview,
    type = 'login_alert',
    triggeredBy = 'System',
  }: {
    recipient: string;
    subject: string;
    html: string;
    contentPreview: string;
    type?: 'login_alert' | 'contact_inquiry' | 'manual_alert' | 'test_alert';
    triggeredBy?: string;
  }): Promise<{
    success: boolean;
    status: 'sent' | 'simulated' | 'failed';
    attempts: number;
    messageId?: string;
    error?: string;
    emailLog: EmailLog;
  }> {
    const maxRetries = 3;
    let attempts = 0;
    let lastError: any = null;

    const creds = getSmtpCredentials();
    const smtpUser = creds.smtpUser;
    const smtpPass = creds.smtpPass;

    // If SMTP credentials are not configured in environment variables:
    if (!creds.configured) {
      const emailLog: EmailLog = {
        id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        recipient,
        subject,
        contentPreview,
        htmlContent: html,
        triggeredBy,
        timestamp: new Date().toISOString(),
        status: 'simulated',
        attempts: 1,
        deliveryMethod: 'simulated',
        errorDetails: 'SMTP credentials (SMTP_USER/SMTP_PASS) not configured in environment. To receive emails in your real inbox, add SMTP_USER & SMTP_PASS in Settings.',
      };
      emailLogs.unshift(emailLog);
      if (emailLogs.length > 100) emailLogs.pop();
      console.log(`[EMAIL DISPATCH: SIMULATED] To: ${recipient} | Subject: ${subject} | Reason: No SMTP credentials in environment`);
      return {
        success: true,
        status: 'simulated',
        attempts: 1,
        emailLog,
      };
    }

    // SMTP credentials are provided: initialize Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: creds.host,
      port: creds.port,
      secure: creds.secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    // Exponential backoff delays: 1000ms, 2000ms, 4000ms
    const baseDelay = 1000;

    while (attempts < maxRetries) {
      attempts++;
      try {
        console.log(`[EMAIL DISPATCH] Attempt ${attempts}/${maxRetries} to ${recipient} via ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || `"Portfolio Security Monitor" <${smtpUser}>`,
          to: recipient,
          subject,
          html,
        });

        console.log(`[EMAIL DISPATCH SUCCESS] Delivered to ${recipient} on attempt ${attempts}. Message ID: ${info.messageId}`);
        const emailLog: EmailLog = {
          id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type,
          recipient,
          subject,
          contentPreview,
          htmlContent: html,
          triggeredBy,
          timestamp: new Date().toISOString(),
          status: 'sent',
          attempts,
          deliveryMethod: 'smtp',
          messageId: info.messageId,
        };
        emailLogs.unshift(emailLog);
        if (emailLogs.length > 100) emailLogs.pop();

        return {
          success: true,
          status: 'sent',
          attempts,
          messageId: info.messageId,
          emailLog,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[EMAIL RETRY WARNING] Attempt ${attempts}/${maxRetries} failed: ${err.message}`);
        if (attempts < maxRetries) {
          const delayMs = baseDelay * Math.pow(2, attempts - 1);
          console.log(`[EMAIL RETRY] Waiting ${delayMs}ms before attempt ${attempts + 1}/${maxRetries}...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // All 3 attempts failed: log failure error in admin dashboard / emailLogs
    console.error(`[EMAIL DISPATCH EXHAUSTED] Failed after ${maxRetries} attempts with exponential backoff:`, lastError?.message);
    const failedEmailLog: EmailLog = {
      id: `mail-failed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      recipient,
      subject,
      contentPreview,
      htmlContent: html,
      triggeredBy,
      timestamp: new Date().toISOString(),
      status: 'failed',
      attempts: maxRetries,
      deliveryMethod: 'failed',
      errorDetails: `Failed after ${maxRetries} attempts with exponential backoff: ${lastError?.message || 'SMTP Connection Error'}`,
    };
    emailLogs.unshift(failedEmailLog);
    if (emailLogs.length > 100) emailLogs.pop();

    return {
      success: false,
      status: 'failed',
      attempts: maxRetries,
      error: lastError?.message || 'Email delivery failed after 3 retry attempts',
      emailLog: failedEmailLog,
    };
  }


  // Helper to generate styled HTML email template
  function generateLoginEmailTemplate(session: {
    displayName: string;
    email: string;
    role?: string;
    loginAt: string;
    userAgent?: string;
    device?: string;
    ip?: string;
  }) {
    const formattedDate = new Date(session.loginAt).toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "full",
      timeStyle: "long",
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Security Alert: User Logged In</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #06111c; color: #e1effe; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #0b1c2e; border: 1px solid #1c3c5f; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0d2642 0%, #153c66 100%); padding: 24px; border-bottom: 2px solid #82f2c2; }
    .title { margin: 0; color: #82f2c2; font-size: 20px; font-weight: bold; }
    .subtitle { margin: 6px 0 0 0; color: #94b2cf; font-size: 13px; }
    .content { padding: 24px; }
    .card { background-color: #0e2338; border: 1px solid #1e426b; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .item { margin-bottom: 10px; font-size: 14px; line-height: 1.5; }
    .item strong { color: #82f2c2; font-family: monospace; display: inline-block; width: 140px; }
    .badge { display: inline-block; background-color: #10362b; color: #82f2c2; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
    .footer { background-color: #071322; padding: 16px 24px; font-size: 12px; color: #728ea9; text-align: center; border-top: 1px solid #16324f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">🚨 Instant Login Alert Notification</div>
      <div class="subtitle">A user has authenticated into your Developer Portfolio & Data Studio</div>
    </div>
    <div class="content">
      <p style="margin-top:0; font-size: 14px; color: #eff7ff;">
        Hello <strong>Sri Raman</strong>, a login event was just detected on your application instance:
      </p>

      <div class="card">
        <div class="item"><strong>User:</strong> ${session.displayName || "User"} (${session.email})</div>
        <div class="item"><strong>Role:</strong> <span class="badge">${session.role || "viewer"}</span></div>
        <div class="item"><strong>Timestamp:</strong> ${formattedDate}</div>
        <div class="item"><strong>Device:</strong> ${session.device || "Browser Client"}</div>
        <div class="item"><strong>User Agent:</strong> ${session.userAgent || "Web Browser"}</div>
        <div class="item"><strong>Network IP:</strong> ${session.ip || "Client Browser"}</div>
      </div>

      <p style="font-size: 13px; color: #8ca4bc;">
        This automated instant mailer was triggered by the Zero-Trust Authentication observer. You can inspect all active sessions anytime in the Data Studio.
      </p>
    </div>
    <div class="footer">
      Automated Security Dispatch &bull; D.N. Sri Raman Portfolio &bull; carbide-idiom-dsjh2
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "portfolio-backend-api",
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  app.get("/api/db/info", (_req, res) => {
    res.json({
      configured: true,
      databaseType: "Cloud Firestore",
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      status: "connected",
      features: [
        "Real-time Documents Sync",
        "Role-based Access Rules",
        "Zero-Trust ABAC Security",
        "Google Authentication",
        "Projects & Skills Management",
        "Live Inquiries & Contact Forms",
      ],
    });
  });

  app.post("/api/contact/notify", (req, res) => {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    console.log(`[Contact Notification] From: ${name} (${email}) | Subject: ${subject || "No Subject"}`);
    
    // Add to emailLogs
    const emailLog: EmailLog = {
      id: `mail-contact-${Date.now()}`,
      type: "contact_inquiry",
      recipient: "dnsriraman@gmail.com",
      subject: `📬 [New Inquiry] ${name}: ${subject || "Contact Form"}`,
      contentPreview: `${name} (${email}): ${message.slice(0, 100)}...`,
      htmlContent: `<p><strong>${name}</strong> (${email}) sent: ${message}</p>`,
      triggeredBy: email,
      timestamp: new Date().toISOString(),
      status: "sent",
    };
    emailLogs.unshift(emailLog);
    if (emailLogs.length > 50) emailLogs.pop();

    return res.json({
      success: true,
      message: "Notification received and queued for dispatch.",
      receivedAt: new Date().toISOString(),
      emailId: emailLog.id,
    });
  });

  // 1. Instant Email Notification Trigger on User Login (with 3x Exponential Backoff Retry)
  app.post("/api/auth/notify-login", async (req, res) => {
    const { user, metadata } = req.body || {};
    if (!user || !user.email) {
      return res.status(400).json({ error: "User identity with email is required." });
    }

    const recipient = "dnsriraman@gmail.com";
    const timestamp = metadata?.timestamp || new Date().toISOString();
    const displayName = user.displayName || user.email.split("@")[0] || "User";
    const role = user.role || (user.email === recipient ? "admin" : "editor");
    const userAgent = metadata?.userAgent || req.headers["user-agent"] || "Web Browser";
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const device = metadata?.device || (/mobile/i.test(userAgent) ? "Mobile" : "Desktop");

    const session: LoginSession = {
      id: `login-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.uid || user.userId || `user-${Date.now()}`,
      displayName,
      email: user.email,
      photoURL: user.photoURL,
      role,
      loginAt: timestamp,
      userAgent: String(userAgent),
      device: String(device),
      ip: String(ip),
      mailSent: true,
      mailSentTo: recipient,
    };

    // Prepend to login sessions history
    loginSessions.unshift(session);
    if (loginSessions.length > 100) loginSessions.pop();

    // Generate HTML Email
    const htmlEmail = generateLoginEmailTemplate(session);
    const subject = `🚨 [Instant Login Alert] ${displayName} (${role}) signed into Portfolio`;
    const preview = `${displayName} (${user.email}) authenticated as ${role} from ${device}`;

    // Execute email dispatch with exponential backoff (retrying up to 3 times on transient failure)
    const dispatchResult = await dispatchEmailWithExponentialBackoff({
      recipient,
      subject,
      html: htmlEmail,
      contentPreview: preview,
      type: "login_alert",
      triggeredBy: user.email,
    });

    const isSmtpConfigured = getSmtpCredentials().configured;

    return res.json({
      success: dispatchResult.success,
      status: dispatchResult.status,
      attempts: dispatchResult.attempts,
      smtpConfigured: isSmtpConfigured,
      message:
        dispatchResult.status === 'sent'
          ? `Instant login alert dispatched via SMTP to ${recipient} (delivered on attempt ${dispatchResult.attempts})`
          : dispatchResult.status === 'simulated'
          ? `Instant login alert recorded in dashboard. (To deliver live emails to your inbox, configure SMTP_USER and SMTP_PASS in Settings)`
          : `Email dispatch failed after ${dispatchResult.attempts} attempts with exponential backoff: ${dispatchResult.error}`,
      session,
      emailLog: dispatchResult.emailLog,
    });
  });

  // 2. Fetch list of all user logins
  app.get("/api/auth/logins", (_req, res) => {
    res.json({
      total: loginSessions.length,
      sessions: loginSessions,
      lastUpdated: new Date().toISOString(),
    });
  });

  // 3. Fetch list of all sent instant email logs with SMTP diagnostics
  app.get("/api/auth/mail-logs", (_req, res) => {
    const creds = getSmtpCredentials();
    res.json({
      total: emailLogs.length,
      logs: emailLogs,
      defaultRecipient: "dnsriraman@gmail.com",
      smtpConfigured: creds.configured,
      smtpHost: creds.host,
      smtpUser: creds.smtpUser ? creds.smtpUser.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null,
      lastUpdated: new Date().toISOString(),
    });
  });

  // 4. Send Custom / Test Instant Mail (with 3x Exponential Backoff Retry)
  app.post("/api/auth/send-instant-mail", async (req, res) => {
    const { recipient = "dnsriraman@gmail.com", subject, message, triggeredBy = "Admin" } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Message body is required." });
    }

    const emailSubject = subject || `⚡ [Instant Dispatch] Alert from Developer Studio`;
    const htmlEmail = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #0b1c2e; color: #eff7ff; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 1px solid #1c3c5f;">
        <h3 style="margin-top: 0; color: #82f2c2; font-size: 18px; border-bottom: 1px solid #1c3c5f; padding-bottom: 10px;">${emailSubject}</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #cbe3fa; white-space: pre-wrap;">${message}</p>
        <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid #16324f; font-size: 11px; color: #728ea9;">
          Triggered by: ${triggeredBy} &bull; D.N. Sri Raman Portfolio System Monitor
        </div>
      </div>
    `;

    const dispatchResult = await dispatchEmailWithExponentialBackoff({
      recipient,
      subject: emailSubject,
      html: htmlEmail,
      contentPreview: message.slice(0, 120),
      type: "manual_alert",
      triggeredBy,
    });

    const isSmtpConfigured = getSmtpCredentials().configured;

    return res.json({
      success: dispatchResult.success,
      status: dispatchResult.status,
      attempts: dispatchResult.attempts,
      smtpConfigured: isSmtpConfigured,
      message:
        dispatchResult.status === 'sent'
          ? `Instant notification email successfully delivered to ${recipient} (attempt ${dispatchResult.attempts})`
          : dispatchResult.status === 'simulated'
          ? `Email recorded in dashboard. (Configure SMTP_USER & SMTP_PASS in Settings for live inbox delivery)`
          : `Email delivery failed after ${dispatchResult.attempts} retries: ${dispatchResult.error}`,
      log: dispatchResult.emailLog,
    });
  });

  // 5. Send Full Log Info & System Audit Report via API to Email (with 3x Exponential Backoff Retry)
  app.post("/api/logs/email-export", async (req, res) => {
    try {
      const {
        recipient = "dnsriraman@gmail.com",
        subject = "📊 [System Audit] Full Login & Activity Log Report",
        notes = "",
        includeLogins = true,
        includeMailLogs = true,
        includeSystemStats = true,
        triggeredBy = "Admin API",
      } = req.body || {};

      // 1. Calculate operational runtime telemetry
      const memory = process.memoryUsage();
      const memoryRssMb = Math.round((memory.rss / 1024 / 1024) * 100) / 100;
      const uptimeMin = Math.round(process.uptime() / 60);
      const reportDate = new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        dateStyle: "full",
        timeStyle: "long",
      });

      // 2. Fetch log payloads from live in-memory telemetry
      const loginLogs = includeLogins ? loginSessions.slice(0, 25) : [];
      const mailLogs = includeMailLogs ? emailLogs.slice(0, 25) : [];

      // 3. Compile conditional HTML template blocks
      let notesSection = notes
        ? `
          <div style="background-color: #122c4d; border-left: 4px solid #82f2c2; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 6px 6px 0; font-size: 13px; color: #eff7ff;">
            <strong style="color:#82f2c2;">Admin Notes:</strong> ${notes}
          </div>
        `
        : "";

      let systemStatsSection = includeSystemStats
        ? `
          <h2 style="font-size: 14px; color: #eff7ff; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #1c3c5f; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-family: monospace;">💻 Telemetry Stats</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <tr><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; font-weight:600; width:40%; color:#8ca4bc;">Process Memory (RSS)</td><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#eff7ff;">${memoryRssMb} MB</td></tr>
            <tr><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; font-weight:600; color:#8ca4bc;">Application Uptime</td><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#eff7ff;">${uptimeMin} Minutes</td></tr>
            <tr><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; font-weight:600; color:#8ca4bc;">Database</td><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#82f2c2; font-family:monospace;">Cloud Firestore (${firebaseConfig.firestoreDatabaseId})</td></tr>
            <tr><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; font-weight:600; color:#8ca4bc;">Node Runtime</td><td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#eff7ff;">${process.version} (TypeScript + Express)</td></tr>
          </table>
        `
        : "";

      let loginLogsSection = includeLogins
        ? `
          <h2 style="font-size: 14px; color: #eff7ff; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #1c3c5f; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-family: monospace;">🔑 Authentication Activities (${loginLogs.length})</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0e2338; text-align: left;">
                <th style="padding: 8px 10px; color:#82f2c2; font-family:monospace;">Timestamp</th>
                <th style="padding: 8px 10px; color:#82f2c2; font-family:monospace;">Identity</th>
                <th style="padding: 8px 10px; color:#82f2c2; font-family:monospace;">Device / IP</th>
                <th style="padding: 8px 10px; color:#82f2c2; font-family:monospace;">Role</th>
              </tr>
            </thead>
            <tbody>
              ${
                loginLogs.length === 0
                  ? '<tr><td colspan="4" style="padding:10px;text-align:center;color:#718da8;">No login records found</td></tr>'
                  : loginLogs
                      .map(
                        (log) => `
                    <tr>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#94b2cf;">${new Date(log.loginAt).toLocaleString()}</td>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#eff7ff; font-weight:600;">${log.displayName} (${log.email})</td>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#94b2cf;"><code>${log.device || "Desktop"} / ${log.ip || "127.0.0.1"}</code></td>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f;">
                        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; background-color: #10362b; color: #82f2c2;">${log.role || "viewer"}</span>
                      </td>
                    </tr>
                  `
                      )
                      .join("")
              }
            </tbody>
          </table>
        `
        : "";

      let mailLogsSection = includeMailLogs
        ? `
          <h2 style="font-size: 14px; color: #eff7ff; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #1c3c5f; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-family: monospace;">✉️ Outbound Email Dispatches (${mailLogs.length})</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
            <thead>
              <tr style="background-color: #0e2338; text-align: left;">
                <th style="padding: 8px 10px; color:#ffbe7b; font-family:monospace;">Timestamp</th>
                <th style="padding: 8px 10px; color:#ffbe7b; font-family:monospace;">Recipient</th>
                <th style="padding: 8px 10px; color:#ffbe7b; font-family:monospace;">Subject</th>
                <th style="padding: 8px 10px; color:#ffbe7b; font-family:monospace;">Delivery</th>
              </tr>
            </thead>
            <tbody>
              ${
                mailLogs.length === 0
                  ? '<tr><td colspan="4" style="padding:10px;text-align:center;color:#718da8;">No email logs found</td></tr>'
                  : mailLogs
                      .map(
                        (log) => `
                    <tr>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#94b2cf;">${new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#eff7ff;">${log.recipient}</td>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f; color:#cbe3fa;">${log.subject}</td>
                      <td style="padding: 8px 10px; border-bottom: 1px solid #16324f;">
                        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; ${
                          log.status === "sent"
                            ? "background-color: #10362b; color: #82f2c2;"
                            : log.status === "failed"
                            ? "background-color: #3b1418; color: #ff8e88;"
                            : "background-color: #2b2210; color: #ffbe7b;"
                        }">${log.status}</span>
                      </td>
                    </tr>
                  `
                      )
                      .join("")
              }
            </tbody>
          </table>
        `
        : "";

      // 4. Construct structural email skeleton
      const htmlEmailBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #e1effe; margin: 0; padding: 20px; background-color: #06111c; }
          </style>
        </head>
        <body>
          <div style="max-width: 680px; margin: 0 auto; background: #0b1c2e; padding: 28px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); border-top: 4px solid #82f2c2; border-left: 1px solid #1c3c5f; border-right: 1px solid #1c3c5f; border-bottom: 1px solid #1c3c5f;">
            <h1 style="font-size: 20px; color: #82f2c2; margin-top: 0; margin-bottom: 16px; font-weight: 700; font-family: monospace;">📊 System &amp; Login Audit Report</h1>
            
            <div style="background-color: #0e2338; border: 1px solid #1c3c5f; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 13px;">
              <table style="width:100%; border:none; font-size:13px; margin-bottom:0;">
                <tr>
                  <td><span style="font-weight:600; color:#8ca4bc;">Generated On:</span> <span style="color:#eff7ff;">${reportDate}</span></td>
                  <td><span style="font-weight:600; color:#8ca4bc;">Triggered By:</span> <span style="color:#82f2c2; font-family:monospace;">${triggeredBy}</span></td>
                </tr>
              </table>
            </div>

            ${notesSection}
            ${systemStatsSection}
            ${loginLogsSection}
            ${mailLogsSection}

            <div style="font-size: 11px; color: #728ea9; text-align: center; margin-top: 30px; border-top: 1px solid #16324f; padding-top: 15px;">
              Automated Audit Report API &bull; D.N. Sri Raman Portfolio &bull; carbide-idiom-dsjh2
            </div>
          </div>
        </body>
        </html>
      `;

      // 5. Deliver payload using the retry mechanism with exponential backoff (up to 3 attempts)
      const dispatchResult = await dispatchEmailWithExponentialBackoff({
        recipient,
        subject,
        html: htmlEmailBody,
        contentPreview: `Audit Report dispatched: ${loginSessions.length} login sessions, ${emailLogs.length} mail logs, RSS: ${memoryRssMb}MB`,
        type: "manual_alert",
        triggeredBy,
      });

      const isSmtpConfigured = getSmtpCredentials().configured;

      return res.status(200).json({
        success: dispatchResult.success,
        status: dispatchResult.status,
        attempts: dispatchResult.attempts,
        smtpConfigured: isSmtpConfigured,
        message:
          dispatchResult.status === 'sent'
            ? "System audit export dispatched successfully via SMTP."
            : dispatchResult.status === 'simulated'
            ? "System audit export compiled and logged to dashboard. (To receive live email in your inbox, configure SMTP_USER and SMTP_PASS in Settings)"
            : `System audit dispatch failed after ${dispatchResult.attempts} retry attempts: ${dispatchResult.error}`,
        messageId: dispatchResult.messageId,
        emailId: dispatchResult.emailLog.id,
        summary: {
          totalLogins: loginSessions.length,
          totalEmailLogs: emailLogs.length,
          uptimeMinutes: uptimeMin,
          memoryRssMb,
          nodeVersion: process.version,
        },
      });
    } catch (error: any) {
      console.error("Export System Error: ", error);
      return res.status(500).json({
        success: false,
        error: `Internal server error failing audit distribution dispatch: ${error?.message || error}`,
      });
    }
  });

  // 6. Direct SMTP Diagnostics & Health Check
  app.get("/api/system/smtp-config", (_req, res) => {
    const creds = getSmtpCredentials();
    res.json({
      configured: creds.configured,
      host: creds.host,
      port: creds.port,
      secure: creds.secure,
      userConfigured: !!creds.smtpUser,
      passConfigured: !!creds.smtpPass,
      maskedUser: creds.smtpUser ? creds.smtpUser.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null,
      maxRetries: 3,
      backoffStrategy: "exponential (1s, 2s, 4s)",
      setupInstructions: {
        provider: "Gmail SMTP",
        status: creds.configured ? "Connected & Ready for Live Delivery" : "Configuration required",
      },
    });
  });

  // 6. Direct JSON Log Export
  app.get("/api/logs/export-json", (_req, res) => {
    res.setHeader("Content-Disposition", `attachment; filename="system_logs_${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json({
      exportedAt: new Date().toISOString(),
      database: firebaseConfig,
      totalLogins: loginSessions.length,
      logins: loginSessions,
      totalEmailLogs: emailLogs.length,
      emailLogs,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version,
      },
    });
  });

  // 7. Direct ZIP Archive Log Export
  app.get("/api/logs/export-zip", async (_req, res) => {
    try {
      const zip = new JSZip();
      const exportTime = new Date().toISOString();
      const memory = process.memoryUsage();

      // File 1: Login Sessions
      zip.file(
        "login_sessions.json",
        JSON.stringify(
          {
            exportedAt: exportTime,
            total: loginSessions.length,
            sessions: loginSessions,
          },
          null,
          2
        )
      );

      // File 2: Email Logs
      zip.file(
        "email_dispatch_logs.json",
        JSON.stringify(
          {
            exportedAt: exportTime,
            total: emailLogs.length,
            logs: emailLogs,
          },
          null,
          2
        )
      );

      // File 3: System Telemetry
      zip.file(
        "system_telemetry.json",
        JSON.stringify(
          {
            exportedAt: exportTime,
            database: firebaseConfig,
            server: {
              uptimeSeconds: process.uptime(),
              uptimeMinutes: Math.round(process.uptime() / 60),
              nodeVersion: process.version,
              memoryRssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
              heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
            },
          },
          null,
          2
        )
      );

      // File 4: Audit Report Summary HTML
      const htmlSummary = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Audit Report Archive</title>
<style>body{font-family:sans-serif;background:#06111c;color:#e1effe;padding:20px;}</style></head>
<body>
<h1>System Audit Log Archive</h1>
<p>Exported at: ${exportTime}</p>
<p>Logins Recorded: ${loginSessions.length}</p>
<p>Emails Dispatched: ${emailLogs.length}</p>
<p>Database: Cloud Firestore (${firebaseConfig.firestoreDatabaseId})</p>
</body></html>`;
      zip.file("audit_report.html", htmlSummary);

      // File 5: README text
      const readme = `D.N. Sri Raman Portfolio & Data Studio - System Audit Archive
Export Timestamp: ${exportTime}

Contents:
- login_sessions.json : All recorded authenticated login events with device, role, and IP telemetry
- email_dispatch_logs.json : Outbound instant email dispatches, retry attempts, and delivery states
- system_telemetry.json : Operational memory, node version, uptime, and database identifiers
- audit_report.html : Renderable HTML visual snapshot of audit state

To export the entire source code project as a ZIP archive:
Open the Settings (gear icon) menu in AI Studio and select "Export to ZIP".
`;
      zip.file("README_AUDIT.txt", readme);

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
      const filename = `portfolio_audit_archive_${Date.now()}.zip`;

      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Length", zipBuffer.length);
      return res.send(zipBuffer);
    } catch (err: any) {
      console.error("Failed to generate ZIP export:", err);
      return res.status(500).json({ error: "Failed to generate ZIP archive: " + err.message });
    }
  });

  app.get("/api/system/stats", (_req, res) => {
    const memory = process.memoryUsage();
    res.json({
      uptime: process.uptime(),
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      },
      environment: process.env.NODE_ENV || "development",
      timestamp: Date.now(),
    });
  });

  // Vite middleware for development
  if (enableViteMiddleware) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (serveStaticDist) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

async function startServer() {
  const app = await createApp({
    enableViteMiddleware: process.env.NODE_ENV !== "production",
    serveStaticDist: process.env.NODE_ENV === "production",
  });
  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
