from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
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

def get_organization_data(db: Session):
    """Fetch organization branding data from database"""
    try:
        from sqlalchemy import text
        # Use raw SQL to get the full logo data without truncation
        result = db.execute(text("""
            SELECT organization_name, tagline, address, phone, email, website, gstin, logo, logo_filename, logo_path
            FROM organization_branding 
            LIMIT 1
        """)).fetchone()
        
        print(f"Debug: Raw SQL result found: {result is not None}")
        if result:
            logo_data = result[9] or result[7]  # logo_path or logo field
            print(f"Debug: Logo path: {result[9]}, Logo data length: {len(result[7]) if result[7] else 0}")
            return {
                'name': result[0] or "Your Hospital Name",
                'tagline': result[1] or "Smart • Secure • NABH-Standard",
                'address': result[2] or "Address line for letterhead & PDFs",
                'phone': result[3] or "+91-XXXXXXXXXX",
                'email': result[4] or "info@example.com",
                'website': result[5] or "https://your-hospital.com",
                'gstin': result[6] or "",
                'logo': logo_data,  # This will be either file path or base64
                'logo_filename': result[8]
            }
        else:
            print("Debug: No organization data found in database")
            return {
                'name': "Your Hospital Name",
                'tagline': "Smart • Secure • NABH-Standard",
                'address': "Address line for letterhead & PDFs",
                'phone': "+91-XXXXXXXXXX",
                'email': "info@example.com",
                'website': "https://your-hospital.com",
                'gstin': "",
                'logo': None,
                'logo_filename': None
            }
    except Exception as e:
        print(f"Error fetching organization data: {e}")
        return {
            'name': "Your Hospital Name",
            'tagline': "Smart • Secure • NABH-Standard",
            'address': "Address line for letterhead & PDFs",
            'phone': "+91-XXXXXXXXXX",
            'email': "info@example.com",
            'website': "https://your-hospital.com",
            'gstin': "",
            'logo': None,
            'logo_filename': None
        }

def process_logo_image(logo_data):
    """Process logo - either from base64 or file path"""
    try:
        print(f"Debug: Processing logo, data type: {type(logo_data)}, length: {len(logo_data) if logo_data else 0}")
        if not logo_data:
            print("Debug: No logo data provided")
            return None
        
        # Check if it's a file path (starts with 'uploads/' or similar)
        if isinstance(logo_data, str) and not logo_data.startswith('data:image'):
            print(f"Debug: Logo appears to be a file path: {logo_data}")
            # Return file path directly for ReportLab
            import os
            if os.path.exists(logo_data):
                print(f"Debug: File exists, returning path: {logo_data}")
                return logo_data
            else:
                print(f"Debug: File path does not exist: {logo_data}")
                return None
        else:
            # Handle base64 data - convert to BytesIO
            print("Debug: Processing as base64 data")
            
            # Remove data URL prefix if present
            if logo_data.startswith('data:image'):
                logo_data = logo_data.split(',')[1]
                print("Debug: Removed data URL prefix")
            
            # Clean and fix base64 padding
            logo_data = ''.join(logo_data.split())
            logo_data = ''.join(c for c in logo_data if c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=')
            
            while len(logo_data) % 4 != 0:
                logo_data += '='
            
            print(f"Debug: Cleaned base64 length: {len(logo_data)}")
            
            # Try to decode
            try:
                image_data = base64.b64decode(logo_data, validate=True)
            except Exception as decode_error:
                print(f"Debug: Base64 decode failed: {decode_error}")
                return None
            
            try:
                image = Image.open(io.BytesIO(image_data))
                print(f"Debug: Opened image from base64, size: {image.size}")
            except Exception as img_error:
                print(f"Debug: Failed to open image from base64: {img_error}")
                return None
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
                print("Debug: Converted image to RGB")
            
            # Resize image to fit header (max 80px height)
            max_height = 80
            aspect_ratio = image.width / image.height
            if image.height > max_height:
                new_height = max_height
                new_width = int(new_height * aspect_ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                print(f"Debug: Resized image to {new_width}x{new_height}")
            
            # Convert PIL Image to BytesIO for ReportLab
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            print("Debug: Successfully processed logo image")
            
            return img_buffer
            
    except Exception as e:
        print(f"Error processing logo: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_pdf_header(canvas, doc, db: Session, title="Document"):
    """
    Create standardized PDF header with organization branding
    
    Args:
        canvas: ReportLab canvas object
        doc: ReportLab document template
        db: Database session
        title: Document title (optional)
    """
    # Get organization data
    org_data = get_organization_data(db)
    
    # Header dimensions
    page_width = A4[0]
    header_height = 120
    margin = 50
    
    # Save canvas state
    canvas.saveState()
    
    # Draw header background (optional light gray)
    canvas.setFillColor(colors.white)
    canvas.rect(0, A4[1] - header_height, page_width, header_height, fill=1, stroke=0)
    
    # Draw header border
    canvas.setStrokeColor(colors.black)
    canvas.setLineWidth(1)
    canvas.line(margin, A4[1] - header_height, page_width - margin, A4[1] - header_height)
    
    # Left side - Logo and Organization Name only
    left_x = margin
    logo_y = A4[1] - 40
    
    # Process and draw logo
    print(f"Debug: About to process logo for organization: {org_data['name']}")
    logo_img = process_logo_image(org_data['logo'])
    if logo_img:
        try:
            print("Debug: Drawing logo image")
            canvas.drawImage(logo_img, left_x, logo_y - 60, width=60, height=60)
            text_start_x = left_x + 70  # Start text after logo
            print("Debug: Logo drawn successfully")
        except Exception as e:
            print(f"Error drawing logo: {e}")
            import traceback
            traceback.print_exc()
            text_start_x = left_x
    else:
        print("Debug: No logo image to draw - drawing placeholder")
        # Draw a simple placeholder rectangle for logo
        canvas.setStrokeColor(colors.grey)
        canvas.setFillColor(colors.lightgrey)
        canvas.rect(left_x, logo_y - 60, 60, 60, fill=1, stroke=1)
        canvas.setFillColor(colors.black)
        canvas.setFont("Helvetica", 8)
        canvas.drawCentredString(left_x + 30, logo_y - 35, "LOGO")
        text_start_x = left_x + 70
    
    # Organization name only
    canvas.setFont("Helvetica-Bold", 16)
    canvas.setFillColor(colors.black)
    canvas.drawString(text_start_x, logo_y - 15, org_data['name'])
    
    # Tagline
    canvas.setFont("Helvetica", 10)
    canvas.setFillColor(colors.grey)
    canvas.drawString(text_start_x, logo_y - 30, org_data['tagline'])
    
    # Right side - Contact Details
    right_x = page_width - margin - 200  # 200px from right edge
    contact_y = logo_y
    
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.black)
    
    # Phone
    canvas.drawRightString(page_width - margin, contact_y, org_data['phone'])
    
    # Email
    canvas.drawRightString(page_width - margin, contact_y - 12, org_data['email'])
    
    # Website
    canvas.drawRightString(page_width - margin, contact_y - 24, org_data['website'])
    
    # Address
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(page_width - margin, contact_y - 40, org_data['address'])
    
    # GSTIN (if available)
    if org_data['gstin']:
        canvas.drawRightString(page_width - margin, contact_y - 52, f"GSTIN: {org_data['gstin']}")
    
    # Document title (centered below header)
    if title:
        canvas.setFont("Helvetica-Bold", 14)
        canvas.setFillColor(colors.black)
        title_y = A4[1] - header_height - 30
        canvas.drawCentredString(page_width / 2, title_y, title.upper())
    
    # Restore canvas state
    canvas.restoreState()

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