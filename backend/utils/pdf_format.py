from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.platypus import Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfgen import canvas
from PIL import Image
import base64
import io
from sqlalchemy.orm import Session
from models.models_tenant import OrganizationBranding
from pathlib import Path
import os

def get_organization_data(db: Session):
    """Fetch organization branding data from database"""
    try:
        # Query the OrganizationBranding table directly
        branding = db.query(OrganizationBranding).first()
        
        if branding:
            return {
                'name': branding.organization_name or "NUTRYAH HRM",
                'tagline': branding.tagline or "Healthcare Management System",
                'address': branding.address or "Your Organization Address",
                'phone': branding.phone or "XXXXXXXXXX",
                'email': branding.email or "info@nutryah.com",
                'website': branding.website or "https://nutryah.com",
                'gstin': branding.gstin or "IGAK",
                'logo': branding.logo_path or branding.logo,
                'logo_filename': branding.logo_filename
            }
        else:
            # Return NUTRYAH defaults if no data found
            return {
                'name': "NUTRYAH HRM",
                'tagline': "Healthcare Management System",
                'address': "mathupallaymalakam",
                'phone': "8765556768768",
                'email': "sush@example.com",
                'website': "https://nutryah.com",
                'gstin': "IGAK",
                'logo': None,
                'logo_filename': None
            }
    except Exception as e:
        print(f"Error fetching organization data: {e}")
        return {
            'name': "NUTRYAH HRM",
            'tagline': "Healthcare Management System",
            'address': "mathupallaymalakam",
            'phone': "8765556768768",
            'email': "sush@example.com",
            'website': "https://nutryah.com",
            'gstin': "IGAK",
            'logo': None,
            'logo_filename': None
        }

def process_logo_image(logo_data):
    """Process logo - either from base64 or file path, optimized for rectangular shape"""
    try:
        if not logo_data:
            return None
        
        # Check if it's a file path
        if isinstance(logo_data, str) and not logo_data.startswith('data:image'):
            import os
            if os.path.exists(logo_data):
                return logo_data
            else:
                return None
        else:
            # Handle base64 data
            if logo_data.startswith('data:image'):
                logo_data = logo_data.split(',')[1]
            
            # Clean and fix base64 padding
            logo_data = ''.join(logo_data.split())
            logo_data = ''.join(c for c in logo_data if c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
            
            while len(logo_data) % 4 != 0:
                logo_data += '='
            
            try:
                image_data = base64.b64decode(logo_data, validate=True)
            except Exception:
                return None
            
            try:
                image = Image.open(io.BytesIO(image_data))
            except Exception:
                return None
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize for rectangular logo (80x40 aspect ratio)
            target_width = 80
            target_height = 40
            
            # Maintain aspect ratio but fit within rectangular bounds
            aspect_ratio = image.width / image.height
            if aspect_ratio > 2:  # Very wide image
                new_width = target_width
                new_height = int(target_width / aspect_ratio)
            else:  # Square or tall image
                new_height = target_height
                new_width = int(target_height * aspect_ratio)
            
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Convert PIL Image to BytesIO for ReportLab
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            
            return img_buffer
            
    except Exception as e:
        print(f"Error processing logo: {e}")
        return None

def create_pdf_header(canvas, doc, db: Session, title="Document"):
    """
    Create standardized PDF header with organization branding
    Logo on left, company details on right (matching friend's format)
    """
    # Get organization data
    org_data = get_organization_data(db)
    
    # Header dimensions
    page_width = A4[0]
    page_height = A4[1]
    header_y = page_height - 30  # Very close to top
    left_margin = 40
    right_margin = page_width - 40
    
    # Save canvas state
    canvas.saveState()
    
    # Left side - Logo (72mm width like friend's code)
    _draw_logo(canvas, org_data['logo'], left_margin, header_y)
    
    # Right side - Company details
    _draw_company_details(canvas, org_data, right_margin, header_y)
    
    # Draw separator line
    canvas.setStrokeColor(colors.black)
    canvas.setLineWidth(1.5)
    canvas.line(left_margin, header_y - 85, right_margin, header_y - 85)
    
    # Document title (centered below header)
    if title:
        canvas.setFont("Helvetica-Bold", 14)
        canvas.setFillColor(colors.black)
        title_y = header_y - 110
        canvas.drawCentredString(page_width / 2, title_y, title.upper())
    
    # Restore canvas state
    canvas.restoreState()

def _draw_company_details(canvas, org_data, right_x, y):
    """Draw company details on the right side"""
    canvas.setFont("Helvetica-Bold", 16)
    canvas.setFillColor(colors.HexColor("#2E8B57"))  # Sea green color
    
    # Company name - right aligned, lowercase
    company_name = org_data.get('name', 'your company').lower()
    text_width = canvas.stringWidth(company_name, "Helvetica-Bold", 16)
    canvas.drawString(right_x - text_width, y, company_name)
    
    # Contact details - right aligned
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.black)
    
    details_y = y - 20
    line_height = 10
    
    # Phone with + prefix
    if org_data.get('phone'):
        phone_text = f"+{org_data['phone']}"
        phone_width = canvas.stringWidth(phone_text, "Helvetica", 8)
        canvas.drawString(right_x - phone_width, details_y, phone_text)
        details_y -= line_height
    
    # Email
    if org_data.get('email'):
        email_width = canvas.stringWidth(org_data['email'], "Helvetica", 8)
        canvas.drawString(right_x - email_width, details_y, org_data['email'])
        details_y -= line_height
    
    # GST Number
    if org_data.get('gstin'):
        gst_text = f"GST: {org_data['gstin']}"
        gst_width = canvas.stringWidth(gst_text, "Helvetica", 8)
        canvas.drawString(right_x - gst_width, details_y, gst_text)
        details_y -= line_height
    
    # Address - right aligned, compact formatting
    if org_data.get('address'):
        address_lines = _split_text(org_data['address'], 40)
        for line in address_lines[:2]:  # Max 2 lines
            line_width = canvas.stringWidth(line, "Helvetica", 8)
            canvas.drawString(right_x - line_width, details_y, line)
            details_y -= line_height

def _draw_logo(canvas, logo_data, left_x, y):
    """Draw logo on the left side with 72mm width"""
    logo_width = 72 * mm
    logo_max_height = 25 * mm
    
    try:
        # Process logo image
        logo_img = process_logo_image(logo_data)
        if logo_img:
            # Handle different logo data types
            if isinstance(logo_img, str) and os.path.exists(logo_img):
                # File path
                with open(logo_img, 'rb') as f:
                    logo_data_bytes = f.read()
                img = Image.open(io.BytesIO(logo_data_bytes))
            else:
                # BytesIO object
                img = Image.open(logo_img)
            
            # Convert to RGBA and remove green background
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            data = img.getdata()
            new_data = []
            for item in data:
                # Remove greenish background
                if item[1] > item[0] + 30 and item[1] > item[2] + 30:
                    new_data.append((255, 255, 255, 0))
                else:
                    new_data.append(item)
            img.putdata(new_data)
            
            # Calculate dimensions
            original_width, original_height = img.size
            aspect_ratio = original_height / original_width
            logo_height = logo_width * aspect_ratio
            
            if logo_height > logo_max_height:
                logo_height = logo_max_height
                logo_width = logo_height / aspect_ratio
            
            # Position and draw logo
            logo_y = y - logo_height + 10
            canvas.drawInlineImage(img, left_x, logo_y, width=logo_width, height=logo_height)
            return
            
    except Exception as e:
        print(f"Error drawing logo: {e}")
    
    # Fallback: draw placeholder
    canvas.setStrokeColor(colors.black)
    canvas.setFillColor(colors.lightgrey)
    placeholder_height = 50
    placeholder_y = y - placeholder_height + 15
    canvas.rect(left_x, placeholder_y, 72 * mm, placeholder_height, fill=1, stroke=1)
    canvas.setFillColor(colors.black)
    canvas.setFont("Helvetica", 12)
    text_width = canvas.stringWidth("LOGO", "Helvetica", 12)
    canvas.drawString(left_x + (72 * mm - text_width) / 2, placeholder_y + 20, "LOGO")

def _split_text(text, max_length):
    """Split text into lines of maximum length"""
    if not text:
        return []
    words = text.split()
    lines = []
    current_line = ""
    
    for word in words:
        if len(current_line + " " + word) <= max_length:
            current_line += " " + word if current_line else word
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    
    if current_line:
        lines.append(current_line)
    
    return lines

def create_pdf_footer(canvas, doc, db: Session):
    """
    Create standardized PDF footer
    
    Args:
        canvas: ReportLab canvas object
        doc: ReportLab document template
        db: Database session
    """
    # Get organization data
    org_data = get_organization_data(db)
    
    # Footer dimensions
    page_width = A4[0]
    footer_height = 40
    margin = 50
    
    # Save canvas state
    canvas.saveState()
    
    # Draw footer line
    canvas.setStrokeColor(colors.black)
    canvas.setLineWidth(0.5)
    canvas.line(margin, footer_height, page_width - margin, footer_height)
    
    # Footer text
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    
    # Left side - Organization name
    canvas.drawString(margin, footer_height - 15, f"© {org_data['name']}")
    
    # Center - Powered by
    canvas.drawCentredString(page_width / 2, footer_height - 15, "Powered by NUTRYAH DIGITAL HEALTH")
    
    # Right side - Page number
    page_num = canvas.getPageNumber()
    canvas.drawRightString(page_width - margin, footer_height - 15, f"Page {page_num}")
    
    # Restore canvas state
    canvas.restoreState()

class PDFHeaderFooterTemplate:
    """
    Template class for creating PDFs with standardized header and footer
    """
    
    def __init__(self, db: Session, title="Document"):
        self.db = db
        self.title = title
    
    def header_footer(self, canvas, doc):
        """Combined header and footer function for PageTemplate"""
        create_pdf_header(canvas, doc, self.db, self.title)
        create_pdf_footer(canvas, doc, self.db)

# Usage example:
"""
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

def generate_sample_pdf(db: Session):
    # Create PDF with header/footer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=150, bottomMargin=60)
    
    # Create template with header/footer
    template = PDFHeaderFooterTemplate(db, "SAMPLE DOCUMENT")
    
    # Build content
    styles = getSampleStyleSheet()
    content = []
    content.append(Paragraph("This is a sample document with organization header.", styles['Normal']))
    
    # Build PDF with header/footer
    doc.build(content, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
    
    return buffer.getvalue()
"""