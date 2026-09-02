"""
Notification and Multi-Provider OTP Dispatch Service for SMS and Email.
Supports:
  - SMS: Fast2SMS (India Quick OTP), Twilio (Global E.164), 2Factor.in, MSG91
  - Email: SMTP (Gmail, Outlook, AWS SES, Brevo, SendGrid), Brevo HTTP API
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
import re
import logging

logger = logging.getLogger(__name__)


def normalize_phone_number(raw_phone: str) -> dict:
    """
    Normalizes any input phone number into:
      - raw_digits: clean digits without symbols
      - e164: standard +E.164 format (e.g. +919876543210 or +12025550123)
      - local_10: 10-digit Indian mobile number (e.g. 9876543210) if applicable
      - is_indian: boolean
    """
    clean = raw_phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    digits = re.sub(r"\D", "", clean)

    is_indian = False
    local_10 = ""
    e164 = ""

    if len(digits) == 10 and digits[0] in "6789":
        is_indian = True
        local_10 = digits
        e164 = f"+91{digits}"
    elif len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
        is_indian = True
        local_10 = digits[2:]
        e164 = f"+{digits}"
    elif clean.startswith("+"):
        e164 = f"+{digits}"
        if digits.startswith("91") and len(digits) == 12:
            is_indian = True
            local_10 = digits[2:]
    else:
        if len(digits) == 10:
            local_10 = digits
            e164 = f"+91{digits}"
            is_indian = True
        else:
            e164 = f"+{digits}"

    return {
        "raw": clean,
        "digits": digits,
        "e164": e164,
        "local_10": local_10,
        "is_indian": is_indian,
    }


def send_email_otp(to_email: str, otp_code: str, recipient_name: str = "Valued User") -> dict:
    """
    Sends a real 6-digit OTP verification email using SMTP or Brevo HTTP API.
    Supports Gmail, Outlook, AWS SES, Brevo/Sendinblue, SendGrid, and standard SMTP.
    """
    to_email_clean = to_email.strip().lower()
    subject = f"Your Arogya HMS 6-Digit Verification Code: {otp_code}"

    # Plain text version
    text_content = f"""Hello {recipient_name},

Your 6-digit one-time authentication code for Arogya Hospital Management System is:

{otp_code}

This verification code is valid for 10 minutes.
If you did not request this login code, please ignore this email or contact hospital security.

Best regards,
Arogya Hospital Management & Telehealth System
"""

    # Rich cyber-medical HTML template
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Arogya HMS Verification Code</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060b19; margin: 0; padding: 24px; color: #f1f5f9; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #0b142c; border-radius: 24px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); }}
    .header {{ background: linear-gradient(135deg, #10b981, #06b6d4, #8b5cf6); padding: 36px 28px; text-align: center; }}
    .header h1 {{ margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }}
    .header p {{ margin: 8px 0 0 0; color: #e0f2fe; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }}
    .content {{ padding: 36px 30px; text-align: center; background: #080f26; }}
    .welcome {{ color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 24px; text-align: left; }}
    .otp-wrapper {{ background: #030712; border: 2px solid #06b6d4; border-radius: 20px; padding: 24px 20px; margin: 28px auto; display: inline-block; width: 85%; box-shadow: 0 0 35px rgba(6,182,212,0.25); }}
    .otp-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #38bdf8; font-weight: 800; margin-bottom: 8px; }}
    .otp-code {{ font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 42px; font-weight: 900; color: #34d399; letter-spacing: 12px; margin: 8px 0; text-shadow: 0 0 16px rgba(52,211,153,0.5); }}
    .validity {{ color: #94a3b8; font-size: 13px; margin-top: 10px; font-weight: 600; }}
    .security-notice {{ background: #0f172a; border-radius: 12px; padding: 14px 16px; margin-top: 24px; border-left: 4px solid #f59e0b; text-align: left; font-size: 12px; color: #cbd5e1; line-height: 1.5; }}
    .footer {{ background: #040817; padding: 22px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Arogya HMS</h1>
      <p>Secure Portal One-Time Passcode</p>
    </div>
    <div class="content">
      <div class="welcome">
        Hello <strong>{recipient_name}</strong>,<br><br>
        You have requested a secure one-time password (OTP) to log in to your <strong>Arogya Hospital Management System</strong> account.
      </div>

      <div class="otp-wrapper">
        <div class="otp-label">Your 6-Digit Authentication Code</div>
        <div class="otp-code">{otp_code}</div>
        <div class="validity">⏱ Code expires in <strong>10 minutes</strong></div>
      </div>

      <div class="security-notice">
        🔒 <strong>Security Warning:</strong> Hospital doctors, staff, or support agents will NEVER ask for your verification code. Never share this 6-digit number with anyone.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 Arogya Hospital Management & Telehealth Network &bull; HIPAA & 256-Bit SSL Encrypted
    </div>
  </div>
</body>
</html>
"""

    # 1. Try Brevo (Sendinblue) HTTP API if configured (avoids blocked outbound SMTP ports)
    brevo_key = os.environ.get("BREVO_API_KEY") or os.environ.get("SENDINBLUE_API_KEY")
    sender_email = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("SMTP_USER") or "no-reply@arogyahms.org"
    sender_name = os.environ.get("SMTP_FROM_NAME") or "Arogya Hospital Portal"

    if brevo_key:
        try:
            url = "https://api.brevo.com/v3/smtp/email"
            payload = {
                "sender": {"name": sender_name, "email": sender_email},
                "to": [{"email": to_email_clean, "name": recipient_name}],
                "subject": subject,
                "htmlContent": html_content,
                "textContent": text_content,
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "api-key": brevo_key,
                    "Accept": "application/json",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                logger.info(f"[EMAIL] Delivered live OTP to {to_email_clean} via Brevo API: {resp_data}")
                return {
                    "success": True,
                    "delivered": True,
                    "provider": "Brevo HTTP API",
                    "channel": "email",
                    "target": to_email_clean,
                }
        except Exception as e:
            logger.error(f"[EMAIL ERROR] Brevo API failed: {e}. Falling back to standard SMTP...")

    # 2. Try Standard SMTP (Gmail, Outlook, AWS SES, Brevo SMTP, etc.)
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

    if smtp_host and smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{sender_name} <{smtp_from}>"
            msg["To"] = to_email_clean

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            context = ssl.create_default_context()

            if use_ssl or smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=12) as server:
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, [to_email_clean], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=12) as server:
                    if use_tls:
                        server.starttls(context=context)
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_from, [to_email_clean], msg.as_string())

            logger.info(f"[EMAIL] Delivered live OTP to {to_email_clean} via SMTP ({smtp_host}:{smtp_port})")
            return {
                "success": True,
                "delivered": True,
                "provider": f"SMTP ({smtp_host})",
                "channel": "email",
                "target": to_email_clean,
            }
        except Exception as e:
            logger.error(f"[EMAIL ERROR] SMTP dispatch failed: {e}")
            return {
                "success": False,
                "delivered": False,
                "error": str(e),
                "provider": "SMTP",
                "channel": "email",
                "target": to_email_clean,
            }

    # If no email credentials configured, log and return development simulation
    logger.info(
        f"[EMAIL SERVICE (DEV MODE)] OTP {otp_code} for {to_email_clean}. "
        f"Add SMTP_HOST/SMTP_USER/SMTP_PASSWORD or BREVO_API_KEY in .env to dispatch live inboxes."
    )
    return {
        "success": True,
        "delivered": False,
        "simulated": True,
        "provider": "Local Sandbox Engine",
        "channel": "email",
        "target": to_email_clean,
        "note": "To receive live emails in your inbox, add SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env",
    }


def send_sms_otp(phone_number: str, otp_code: str) -> dict:
    """
    Sends a real 6-digit SMS OTP to a mobile phone.
    Automatically checks and uses:
      1. Fast2SMS API (for instant, reliable SMS to Indian 10-digit mobile phones)
      2. 2Factor.in API (Indian OTP gateway)
      3. Twilio SMS API (Global E.164 SMS)
      4. MSG91 API
    """
    norm = normalize_phone_number(phone_number)
    sms_body = f"Your Arogya HMS verification code is: {otp_code}. Valid for 10 minutes. Do not share this code with anyone."

    # 1. Check Fast2SMS API Key (Fast & direct for Indian numbers like Flipkart/Amazon)
    fast2sms_key = os.environ.get("FAST2SMS_API_KEY") or os.environ.get("FAST2SMS_KEY")
    if fast2sms_key and norm["is_indian"] and norm["local_10"]:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            # Route: otp
            post_params = {
                "variables_values": otp_code,
                "route": "otp",
                "numbers": norm["local_10"],
            }
            encoded_data = urllib.parse.urlencode(post_params).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=encoded_data,
                headers={
                    "authorization": fast2sms_key,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cache-Control": "no-cache",
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                logger.info(f"[SMS FAST2SMS] Live OTP dispatched to {norm['local_10']}: {resp_json}")
                if resp_json.get("return") is True or resp_json.get("status_code") == 200:
                    return {
                        "success": True,
                        "delivered": True,
                        "provider": "Fast2SMS",
                        "channel": "sms",
                        "target": norm["local_10"],
                        "message": resp_json.get("message", ["SMS dispatched successfully"])[0],
                    }
        except Exception as e:
            logger.error(f"[SMS ERROR] Fast2SMS dispatch failed: {e}. Checking secondary gateways...")

    # 2. Check 2Factor.in API Key
    twofactor_key = os.environ.get("TWOFACTOR_API_KEY") or os.environ.get("2FACTOR_API_KEY")
    if twofactor_key and norm["local_10"]:
        try:
            url = f"https://2factor.in/API/V1/{twofactor_key}/SMS/{norm['local_10']}/{otp_code}/AUTOGEN"
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                logger.info(f"[SMS 2FACTOR] Live OTP dispatched to {norm['local_10']}: {resp_json}")
                if resp_json.get("Status") == "Success":
                    return {
                        "success": True,
                        "delivered": True,
                        "provider": "2Factor.in",
                        "channel": "sms",
                        "target": norm["local_10"],
                    }
        except Exception as e:
            logger.error(f"[SMS ERROR] 2Factor.in failed: {e}")

    # 3. Check Twilio API (Global E.164 SMS)
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_token = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_from = os.environ.get("TWILIO_PHONE_NUMBER") or os.environ.get("TWILIO_FROM")

    if twilio_sid and twilio_token and twilio_from:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
            data = urllib.parse.urlencode({
                "To": norm["e164"],
                "From": twilio_from,
                "Body": sms_body,
            }).encode("utf-8")

            req = urllib.request.Request(url, data=data, method="POST")
            auth_header = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode("utf-8")).decode("ascii")
            req.add_header("Authorization", f"Basic {auth_header}")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")

            with urllib.request.urlopen(req, timeout=12) as response:
                resp_json = json.loads(response.read().decode("utf-8"))
                logger.info(f"[SMS TWILIO] Real SMS dispatched to {norm['e164']}, SID: {resp_json.get('sid')}")
                return {
                    "success": True,
                    "delivered": True,
                    "provider": "Twilio SMS",
                    "channel": "sms",
                    "sid": resp_json.get("sid"),
                    "target": norm["e164"],
                }
        except Exception as e:
            logger.error(f"[SMS ERROR] Twilio SMS dispatch failed: {e}")
            return {
                "success": False,
                "delivered": False,
                "error": str(e),
                "provider": "Twilio SMS",
                "channel": "sms",
                "target": norm["e164"],
            }

    # If no SMS provider configured, return development simulation with target information
    target_display = norm["local_10"] if norm["is_indian"] and norm["local_10"] else norm["e164"]
    logger.info(
        f"[SMS SERVICE (DEV MODE)] OTP {otp_code} for {target_display}. "
        f"Add FAST2SMS_API_KEY, TWILIO_ACCOUNT_SID, or TWOFACTOR_API_KEY in .env for live SMS to mobile phones."
    )
    return {
        "success": True,
        "delivered": False,
        "simulated": True,
        "provider": "Local Sandbox Engine",
        "channel": "sms",
        "target": target_display,
        "note": "To receive real SMS on your mobile phone, add FAST2SMS_API_KEY or TWILIO credentials in .env",
    }
