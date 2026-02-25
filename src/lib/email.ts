import nodemailer from 'nodemailer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContactEmailData {
  name: string;
  email: string;
  message: string;
  ip: string;
  userAgent: string;
}

// ─── Transport ───────────────────────────────────────────────────────────────

// How long (ms) to wait for each SMTP phase before giving up
const SMTP_TIMEOUT_MS = 10_000;
// Hard ceiling for the entire send operation
const SEND_TIMEOUT_MS = 15_000;

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // STARTTLS – widely allowed; port 465 (implicit SSL) is often blocked
    secure: false, // false = start plain, then upgrade via STARTTLS
    requireTLS: true, // abort if the server doesn't offer STARTTLS
    auth: {
      user: process.env.CONTACT_SMTP_USER,
      pass: process.env.CONTACT_SMTP_PASS,
    },
    // These prevent indefinite hangs when Gmail is slow or credentials are wrong
    connectionTimeout: SMTP_TIMEOUT_MS, // TCP connect
    greetingTimeout: SMTP_TIMEOUT_MS, // SMTP 220 banner
    socketTimeout: SMTP_TIMEOUT_MS, // idle socket read
  });
}

/** Rejects after `ms` milliseconds with a clear error message. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Email send timed out after ${ms / 1000}s`)),
        ms
      )
    ),
  ]);
}

// ─── HTML Sanitiser ──────────────────────────────────────────────────────────

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Plain-text alternative ──────────────────────────────────────────────────

function generatePlainText(data: ContactEmailData, tehranTime: string): string {
  return [
    'New message from your portfolio',
    '─'.repeat(40),
    `Name:      ${data.name}`,
    `Email:     ${data.email}`,
    `Time:      ${tehranTime}`,
    '',
    'Message:',
    data.message,
    '',
    '─'.repeat(40),
    `IP: ${data.ip}`,
    `UA: ${data.userAgent}`,
    '',
    'Sent from your portfolio contact form',
  ].join('\n');
}

// ─── Dark HTML Email Template ────────────────────────────────────────────────

function generateDarkEmailHtml(
  data: ContactEmailData,
  tehranTime: string
): string {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br>');
  const safeTime = escapeHtml(tehranTime);
  const safeIp = escapeHtml(data.ip);

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Portfolio Message</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1220;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#0b1220;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:600px;">

          <!-- ── Header ──────────────────────────────────────────── -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <div style="display:inline-block;
                          background:linear-gradient(135deg,#3b82f6 0%,#22d3ee 100%);
                          border-radius:12px;padding:2px;">
                <div style="background:#0b1220;border-radius:10px;padding:10px 24px;">
                  <span style="font-size:13px;font-weight:700;letter-spacing:2px;
                               text-transform:uppercase;
                               -webkit-background-clip:text;
                               -webkit-text-fill-color:transparent;
                               color:#3b82f6;">
                    Omid Portfolio
                  </span>
                </div>
              </div>
            </td>
          </tr>

          <!-- ── Card ───────────────────────────────────────────── -->
          <tr>
            <td style="background-color:#0f172a;
                       border:1px solid #1e293b;
                       border-radius:16px;
                       overflow:hidden;">

              <!-- Card header bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e3a5f 0%,#0f2744 100%);
                              padding:24px 32px;
                              border-bottom:1px solid #1e293b;">
                    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:2px;
                               text-transform:uppercase;color:#d7d9db;">
                      New Message
                    </p>
                    <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#e5e7eb;
                                line-height:1.3;">
                      New message from your portfolio
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Card body -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px;">

                    <!-- Sender info: Name -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           style="margin-bottom:16px;">
                      <tr>
                        <td style="background:#0b1220;border:1px solid #1e293b;
                                   border-radius:10px;padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                                     letter-spacing:1.5px;text-transform:uppercase;
                                     color:#3b82f6;">
                            Sender
                          </p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#e5e7eb;">
                            ${safeName}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Sender info: Email -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           style="margin-bottom:16px;">
                      <tr>
                        <td style="background:#0b1220;border:1px solid #1e293b;
                                   border-radius:10px;padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                                     letter-spacing:1.5px;text-transform:uppercase;
                                     color:#3b82f6;">
                            Email
                          </p>
                          <p style="margin:0;font-size:15px;color:#93c5fd;">
                            ${safeEmail}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <div style="height:1px;background:linear-gradient(90deg,transparent,#1e293b,transparent);
                                margin:24px 0;"></div>

                    <!-- Message -->
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;
                               letter-spacing:1.5px;text-transform:uppercase;
                               color:#3b82f6;">
                      Message
                    </p>
                    <div style="background:#0b1220;border:1px solid #1e293b;
                                border-left:3px solid #3b82f6;
                                border-radius:10px;padding:20px 24px;">
                      <p style="margin:0;font-size:15px;line-height:1.75;color:#cbd5e1;">
                        ${safeMessage}
                      </p>
                    </div>

                    <!-- Divider -->
                    <div style="height:1px;background:linear-gradient(90deg,transparent,#1e293b,transparent);
                                margin:24px 0;"></div>

                    <!-- Meta: Timestamp -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                           style="margin-bottom:24px;">
                      <tr>
                        <td style="padding:0 0 8px;">
                          <span style="font-size:11px;color:#475569;letter-spacing:1px;
                                        text-transform:uppercase;font-weight:600;">
                            &#128337;&nbsp; Received at
                          </span>
                          &nbsp;&nbsp;
                          <span style="font-size:13px;color:#94a3b8;">${safeTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size:11px;color:#475569;letter-spacing:1px;
                                        text-transform:uppercase;font-weight:600;">
                            &#128205;&nbsp; IP
                          </span>
                          &nbsp;&nbsp;
                          <span style="font-size:13px;color:#94a3b8;">${safeIp}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Reply CTA -->
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:10px;
                                   background:linear-gradient(135deg,#3b82f6,#22d3ee);">
                          <a href="mailto:${safeEmail}"
                             style="display:inline-block;padding:13px 32px;
                                    font-size:14px;font-weight:700;color:#ffffff;
                                    text-decoration:none;letter-spacing:0.5px;">
                            &#9993;&nbsp; Reply to ${safeName}
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ──────────────────────────────────────────── -->
          <tr>
            <td style="padding:24px 0 8px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#475569;">
                Omid Portfolio
              </p>
              <p style="margin:0;font-size:12px;color:#334155;">
                Sent from your portfolio contact form
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Main send function ───────────────────────────────────────────────────────

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const now = new Date();

  // Jalali (Shamsi) date with Persian numerals – e.g. "۴ اسفند ۱۴۰۴"
  const jalaliDate = new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian',
  }).format(now);

  // Time in 24-hour format – e.g. "۱۷:۴۰:۱۵"
  const jalaliTime = new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now);

  const tehranTime = `${jalaliDate}  ساعت ${jalaliTime}`;

  // Fail fast if credentials are not configured
  if (!process.env.CONTACT_SMTP_USER || !process.env.CONTACT_SMTP_PASS) {
    throw new Error('SMTP credentials are not configured.');
  }

  const transporter = createTransporter();

  const fromName = process.env.CONTACT_FROM_NAME ?? 'Omid Portfolio';
  const fromAddr = process.env.CONTACT_SMTP_USER;
  const toAddr = process.env.CONTACT_TO ?? fromAddr;

  await withTimeout(
    transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: toAddr,
      replyTo: `"${escapeHtml(data.name)}" <${data.email}>`,
      subject: `New message from ${data.name} — Portfolio`,
      text: generatePlainText(data, tehranTime),
      html: generateDarkEmailHtml(data, tehranTime),
    }),
    SEND_TIMEOUT_MS
  );
}
