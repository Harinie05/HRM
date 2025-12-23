import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import logging

logger = logging.getLogger("HRM")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.office365.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "no-reply@nutryah.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "Nutryah@123")
SMTP_FROM = os.getenv("SMTP_FROM", "NUTRYAH <no-reply@nutryah.com>")


def send_email(to_email: str, subject: str, html_content: str, attachments: Optional[List[dict]] = None):
    """
    Sends an HTML email using SMTP (Office365 supported)
    """
    try:
        logger.info(f"🔄 Attempting to send email to {to_email}")
        logger.info(f"📧 SMTP Config: {SMTP_HOST}:{SMTP_PORT} | User: {SMTP_USER}")
        
        # Validate configuration
        if not SMTP_USER or not SMTP_PASSWORD:
            logger.error("❌ Missing SMTP credentials")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg["From"] = SMTP_FROM or SMTP_USER or ""
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_content, "html"))
        
        # Add attachments if provided
        if attachments:
            for attachment in attachments:
                try:
                    part = MIMEBase('application', 'octet-stream')
                    # Handle both binary content and file paths
                    if isinstance(attachment.get('content'), bytes):
                        part.set_payload(attachment['content'])
                    elif 'file_path' in attachment:
                        with open(attachment['file_path'], 'rb') as f:
                            part.set_payload(f.read())
                    else:
                        logger.error(f"❌ Invalid attachment format: {attachment}")
                        continue
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename="{attachment["filename"]}"'
                    )
                    msg.attach(part)
                    logger.info(f"📎 Attached file: {attachment['filename']}")
                except Exception as attach_error:
                    logger.error(f"❌ Failed to attach {attachment.get('filename', 'unknown')}: {attach_error}")
                    continue

        # Connect to SMTP server with timeout
        logger.info(f"🔗 Connecting to SMTP server...")
        server = smtplib.SMTP(SMTP_HOST or "localhost", SMTP_PORT, timeout=30)
        server.set_debuglevel(0)  # Disable debug for cleaner logs
        server.starttls()
        
        logger.info(f"🔐 Logging in with user: {SMTP_USER}")
        server.login(SMTP_USER or "", SMTP_PASSWORD or "")
        
        logger.info(f"📤 Sending email...")
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()

        logger.info(f"✅ Email sent successfully to {to_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP Authentication failed: {e}")
        logger.error(f"🔍 Check SMTP_USER and SMTP_PASSWORD in .env file")
        logger.error(f"💡 For Office365: Enable 'App passwords' or use OAuth2")
        return False
    except smtplib.SMTPRecipientsRefused as e:
        logger.error(f"❌ Recipient refused: {e}")
        return False
    except smtplib.SMTPServerDisconnected as e:
        logger.error(f"❌ SMTP server disconnected: {e}")
        return False
    except smtplib.SMTPConnectError as e:
        logger.error(f"❌ Cannot connect to SMTP server: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Email sending failed: {type(e).__name__}: {e}")
        return False
