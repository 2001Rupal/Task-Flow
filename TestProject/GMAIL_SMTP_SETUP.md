# Gmail SMTP Setup Guide

TaskFlow uses Gmail to send collaboration invites, reminders, and share notifications.
Gmail requires an **App Password** — your regular Gmail password will NOT work.

---

## Step 1 — Enable 2-Step Verification on your Google account

Gmail App Passwords only work when 2FA is active.

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google", click **2-Step Verification**
4. Follow the prompts to turn it on

---

## Step 2 — Generate an App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   *(If you don't see this page, 2FA is not enabled yet — go back to Step 1)*
2. Under "Select app", choose **Mail**
3. Under "Select device", choose **Other (Custom name)** and type `TaskFlow`
4. Click **Generate**
5. Google shows a **16-character password** like `abcd efgh ijkl mnop`
   — copy it, you won't see it again

---

## Step 3 — Add credentials to your `.env` file

Open `TestProject/.env` and fill in these four lines:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

> Remove all spaces from the App Password when pasting it.
> `abcd efgh ijkl mnop` → `abcdefghijklmnop`

---

## Step 4 — Verify the email service config

Open `TestProject/services/emailService.js` and confirm the transporter uses these env vars:

```js
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT),
  secure: false,          // false = STARTTLS on port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

If the file uses different variable names, update either the `.env` keys or the service file to match.

---

## Step 5 — Test it

Start the server and invite a collaborator to a list. You should receive an email within a few seconds.

If it fails, check the server console — nodemailer logs the exact SMTP error.

---

## Common errors

| Error | Fix |
|---|---|
| `Invalid login` | Wrong email or App Password — regenerate the App Password |
| `Username and Password not accepted` | 2FA is not enabled, or you used your regular password instead of App Password |
| `Connection timeout` | Port 587 is blocked by your network/firewall — try port 465 with `secure: true` |
| `self signed certificate` | Add `tls: { rejectUnauthorized: false }` to the transporter options (dev only) |

---

## Using port 465 (SSL) instead of 587 (STARTTLS)

If port 587 is blocked, switch to SSL:

```env
EMAIL_PORT=465
```

And update the transporter:

```js
secure: true,   // true = SSL on port 465
```

---

## Using a different email provider

The same pattern works for any SMTP provider:

| Provider | Host | Port |
|---|---|---|
| Gmail | smtp.gmail.com | 587 |
| Outlook / Hotmail | smtp-mail.outlook.com | 587 |
| Yahoo Mail | smtp.mail.yahoo.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |

Just update `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASSWORD` in `.env`.
