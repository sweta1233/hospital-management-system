"""
Notification and OTP dispatch service for Email (SMTP / Gmail / SendGrid) and SMS (Twilio).
"""
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import urllib.parse
import urllib.request
import base64
import json
import logging

logger = logging.getLogger(__name__)

def send_email_otp(to_email: str, otp_code: str, recipient_name: str = "Valued User") -> dict:
    """
    Sends a real OTP verification email using SMTP if configured.
    Supports Gmail, Outlook, AWS SES, SendGrid, and standard SMTP hosts.
    """
    smtp_host = os.environ.get("SMTP_HOST") or os.environ.get("SMTP_SERVER") or os.environ.get("MAIL_SERVER")
    smtp_port_raw = os.environ.get("SMTP_PORT") or os.environ.get("MAIL_PORT") or "587"
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587

    smtp_user = os.environ.get("SMTP_USER") or os.environ.get("SMTP_USERNAME") or os.environ.get("MAIL_USERNAME")
    smtp_pass = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS") or os.environ.get("MAIL_PASSWORD")
    smtp_from = os.environ.get("SMTP_FROM_EMAIL") or smtp_user or "no-reply@arogyahms.org"
    use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() in ["true", "1", "yes"]
    use_ssl = os.environ.get("SMTP_USE_SSL", "false").lower() in ["true", "1", "yes"] or smtp_port == 465

    subject = f"Your Arogya HMS Verification Code: {otp_code}"

    # Plain text version
    text_content = f"""Hello {recipient_name},

Your one-time authentication code for Arogya Hospital Management System is:

{otp_code}

This code is valid for 10 minutes. If you did not request this login code, please ignore this email or contact hospital security.

Best regards,
Arogya Hospital Management & Telehealth System
"""

    # HTML rich email template
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Verification Code</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070d1e; margin: 0; padding: 24px; color: #f1f5f9; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #0f172a; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }}
    .header {{ background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 32px 24px; text-align: center; }}
    .header h1 {{ margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }}
    .header p {{ margin: 6px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 500; }}
    .content {{ padding: 36px 28px; text-align: center; }}
    .otp-box {{ background: #020617; border: 2px dashed #06b6d4; border-radius: 16px; padding: 20px; margin: 24px auto; display: inline-block; min-width: 240px; box-shadow: 0 0 20px rgba(6,182,212,0.2); }}
    .otp-code {{ font-family: monospace; font-size: 38px; font-weight: 900; color: #38bdf8; letter-spacing: 10px; margin: 0; }}
    .validity {{ color: #94a3b8; font-size: 12px; margin-top: 8px; font-weight: 600; }}
    .info {{ color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 16px 0; text-align: left; }}
    .footer {{ background: #070d1e; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Arogya HMS Portal</h1>
      <p>Secure Medical Portal Authentication</p>
    </div>
    <div class="content">
      <div class="info">
        <p>Dear <strong>{recipient_name}</strong>,</p>
        <p>You requested a secure login passcode for your Arogya Hospital Management account. Use the one-time code below to complete your authentication:</p>
      </div>

      <div class="otp-box">
        <div class="otp-code">{otp_code}</div>
        <div class="validity">⏱ Valid for 10 minutes</div>
      </div>

      <div class="info">
        <p style="font-size: 12px; color: #94a3b8;">
          🔒 <strong>Security Warning:</strong> Hospital staff will never ask for your verification code. Never share this code with anyone.
        </p>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 Arogya Hospital Management System &bull; Confidential Medical Services
    </div>
  </div>
</body>
</html>
"""

    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Arogya Hospital <{smtp_from}>"
            msg["To"] = to_email

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            context = ssl.create_default_context()

            if use_ssl or smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=12) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                    if use_tls:
                        server.starttls(context=context)
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, [to_email], msg.as_string())

            logger.info(f"[EMAIL SERVICE] Delivered real OTP to {to_email} via SMTP ({smtp_host})")
            return {"success": True, "delivered": True, "method": "smtp", "target": to_email}
        except Exception as e:
            logger.error(f"[EMAIL SERVICE ERROR] Failed to send email via SMTP: {e}")
            return {"success": False, "delivered": False, "error": str(e), "method": "smtp"}
    else:
        logger.warning(
            f"[EMAIL SERVICE] SMTP credentials not set in .env (Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD to send live emails to inboxes). OTP: {otp_code} for {to_email}"
        )
        return {
            "success": True,
            "delivered": False,
            "simulated": True,
            "note": "To receive real emails in your inbox, add SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env",
            "target": to_email,
        }


def send_sms_otp(phone_number: str, otp_code: str) -> dict:
    """
    Sends a real SMS OTP using Twilio API if credentials are provided in .env.
    """
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_token = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_from = os.environ.get("TWILIO_PHONE_NUMBER") or os.environ.get("TWILIO_FROM")

    # Format phone number ensuring E.164 if possible
    clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
    if not clean_phone.startswith("+"):
        if len(clean_phone) == 10:
            clean_phone = f"+91{clean_phone}"
        else:
            clean_phone = f"+{clean_phone}"

    sms_body = f"Your Arogya HMS verification code is: {otp_code}. Valid for 10 minutes. Do not share this code."

    if twilio_sid and twilio_token and twilio_from:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            data = urllib.parse.urlencode({
                "To": clean_phone,
                "From": twilio_from,
                "Body": sms_body,
            }).encode("utf-8")

            req = urllib.request.Request(url, data=data, method="POST")
            auth_header = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode("utf-8")).decode("ascii")
            req.add_header("Authorization", f"Basic {auth_header}")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")

            with urllib.request.urlopen(req, timeout=10) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                logger.info(f"[SMS SERVICE] Real SMS dispatched to {clean_phone}, SID: {resp_json.get('sid')}")
                return {"success": True, "delivered": True, "method": "twilio", "sid": resp_json.get("sid")}
        except Exception as e:
            logger.error(f"[SMS SERVICE ERROR] Failed to send SMS via Twilio: {e}")
            return {"success": False, "delivered": False, "error": str(e), "method": "twilio"}
    else:
        logger.warning(
            f"[SMS SERVICE] Twilio credentials not set in .env (Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to send live SMS to phones). OTP: {otp_code} for {clean_phone}"
        )
        return {
            "success": True,
            "delivered": False,
            "simulated": True,
            "note": "To receive real SMS on your phone, add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env",
            "target": clean_phone,
        }
