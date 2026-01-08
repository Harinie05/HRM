import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models.models_tenant import LoginOTP
from utils.email import send_email
import logging

logger = logging.getLogger("HRM")

def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_login_otp(db: Session, email: str, tenant_code: str, user_name: str = None) -> bool:
    """Generate and send OTP for login verification"""
    try:
        # Generate OTP
        otp_code = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=5)  # 5 minutes expiry
        
        # Delete any existing OTPs for this email/tenant
        db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.tenant_code == tenant_code
        ).delete()
        
        # Save new OTP
        new_otp = LoginOTP(
            email=email,
            tenant_code=tenant_code,
            otp_code=otp_code,
            expires_at=expires_at
        )
        db.add(new_otp)
        db.commit()
        
        # Send email
        subject = "Login OTP - Nutryah HRM"
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2862e9; margin: 0;">Nutryah HRM</h1>
                    <p style="color: #666; margin: 5px 0;">Human Resource Management System</p>
                </div>
                
                <h2 style="color: #333; margin-bottom: 20px;">Login Verification</h2>
                
                <p style="color: #555; line-height: 1.6;">
                    Hello {user_name or '------'},<br><br>
                    Your login OTP for Nutryah HRM is:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; background-color: #2862e9; color: white; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                        {otp_code}
                    </div>
                </div>
                
                <p style="color: #555; line-height: 1.6;">
                    This OTP is valid for <strong>5 minutes</strong> only.<br>
                    Please do not share this OTP with anyone.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© 2024 Nutryah HRM. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        success = send_email(email, subject, html_content)
        if success:
            logger.info(f"OTP sent successfully to {email}")
            return True
        else:
            logger.error(f"Failed to send OTP to {email}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending OTP: {str(e)}")
        return False

def verify_login_otp(db: Session, email: str, tenant_code: str, otp_code: str) -> bool:
    """Verify OTP for login"""
    try:
        # Find valid OTP
        otp_record = db.query(LoginOTP).filter(
            LoginOTP.email == email,
            LoginOTP.tenant_code == tenant_code,
            LoginOTP.otp_code == otp_code,
            LoginOTP.is_used == False,
            LoginOTP.expires_at > datetime.utcnow()
        ).first()
        
        if not otp_record:
            logger.warning(f"Invalid or expired OTP for {email}")
            return False
        
        # Mark OTP as used
        otp_record.is_used = True
        db.commit()
        
        logger.info(f"OTP verified successfully for {email}")
        return True
        
    except Exception as e:
        logger.error(f"Error verifying OTP: {str(e)}")
        return False

def cleanup_expired_otps(db: Session):
    """Clean up expired OTPs"""
    try:
        expired_count = db.query(LoginOTP).filter(
            LoginOTP.expires_at < datetime.utcnow()
        ).delete()
        db.commit()
        logger.info(f"Cleaned up {expired_count} expired OTPs")
    except Exception as e:
        logger.error(f"Error cleaning up OTPs: {str(e)}")