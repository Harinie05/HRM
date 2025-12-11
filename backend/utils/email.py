import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional

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
        # Create message
        msg = MIMEMultipart()
        msg["From"] = SMTP_FROM or SMTP_USER or ""
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_content, "html"))
        
        # Add attachments if provided
        if attachments:
            for attachment in attachments:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(attachment['content'])
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment["filename"]}'
                )
                msg.attach(part)

        # Connect to SMTP server
        server = smtplib.SMTP(SMTP_HOST or "localhost", SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER or "", SMTP_PASSWORD or "")

        # Extract email from SMTP_FROM if it contains name format
        from_email = SMTP_USER
        if SMTP_FROM and "<" in SMTP_FROM and ">" in SMTP_FROM:
            # Extract email from "Name <email@domain.com>" format
            from_email = SMTP_FROM.split("<")[1].split(">")[0]
        elif SMTP_FROM:
            from_email = SMTP_FROM
            
        server.sendmail(SMTP_USER, to_email, msg.as_string())
        server.quit()

        print(f"📧 Email sent successfully to {to_email}")
        return True

    except Exception as e:
        print("❌ Email sending failed:", e)
        return False
