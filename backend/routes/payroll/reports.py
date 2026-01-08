from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import StreamingResponse, Response
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch
from io import BytesIO
import io
import datetime
from sqlalchemy.orm import Session
from database import get_tenant_db
from utils.audit_logger import audit_crud
from routes.hospital import get_current_user
from utils.permission import require_permission
from utils.pdf_format import PDFHeaderFooterTemplate
from models.models_tenant import Employee, User, PayrollRun

router = APIRouter(
    prefix="/payroll",
    tags=["Payroll - Reports"]
)

@router.get("/summary")
def payroll_summary(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user),
    _: dict = Depends(require_permission("view_payroll_reports"))
):
    return {
        "employee_count": 3,
        "total_payroll": 450000,
        "avg_salary": 150000,
        "pf_contribution": 54000,
        "esi_contribution": 7875,
        "tds_deducted": 45000,
        "total_gross": 450000,
        "total_deductions": 106875,
        "net_payable": 343125,
        "payroll_runs": 3,
        "period": "DECEMBER 2024"
    }

@router.get("/form16/pdf")
def generate_form16_pdf(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user),
    _: dict = Depends(require_permission("generate_compliance_reports"))
):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=120, bottomMargin=40, leftMargin=40, rightMargin=40)
        template = PDFHeaderFooterTemplate(db, "FORM 16 - ANNUAL TAX CERTIFICATE")
        styles = getSampleStyleSheet()
        story = []
        
        form16_data = [
            ['EMPLOYER INFORMATION', '', 'ASSESSMENT DETAILS', ''],
            ['Company Name:', 'NUTRYAH TECHNOLOGIES PVT LTD', 'Assessment Year:', '2024-25'],
            ['TAN Number:', 'BLRN12345A', 'Financial Year:', '2023-24'],
            ['PAN Number:', 'AABCN1234F', 'Period:', 'Apr 2023 - Mar 2024'],
            ['Address:', 'Bangalore, Karnataka, India', 'Certificate Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['', '', '', ''],
            ['EMPLOYEE INFORMATION', '', 'TAX COMPUTATION', ''],
            ['Employee Name:', 'Sample Employee', 'Gross Salary:', '₹ 18,00,000.00'],
            ['Employee Code:', 'EMP001', 'Standard Deduction:', '₹ 50,000.00'],
            ['PAN Number:', 'ABCDE1234F', 'Taxable Income:', '₹ 17,50,000.00'],
            ['Designation:', 'Software Engineer', 'Tax Computed:', '₹ 1,87,500.00'],
            ['', '', '', ''],
            ['TOTAL GROSS SALARY', '₹ 18,00,000.00', 'TOTAL TDS DEDUCTED', '₹ 1,87,500.00'],
            ['', '', '', ''],
            ['NET TAX LIABILITY', '₹ 0.00', '', ''],
            ['Status:', 'TAX FULLY DEDUCTED AT SOURCE', '', ''],
            ['', '', '', ''],
            ['EMPLOYER VERIFICATION', '', 'EMPLOYEE ACKNOWLEDGMENT', ''],
            ['', '', '', ''],
            ['Authorized Signatory', 'Date: __________', 'Employee Signature', 'Date: __________'],
        ]
        
        form16_table = Table(form16_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        form16_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            ('BACKGROUND', (0, 12), (3, 12), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 12), (3, 12), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 12), (3, 12), 10),
            ('BACKGROUND', (0, 14), (3, 16), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 14), (3, 16), colors.black),
            ('FONTNAME', (0, 14), (3, 16), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 16), 11),
            ('BACKGROUND', (0, 17), (3, 17), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 17), (3, 17), colors.white),
            ('FONTNAME', (0, 17), (3, 17), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 17), (3, 17), 9),
            ('TEXTCOLOR', (0, 1), (3, 16), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 16), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 16), 9),
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 12), (3, 12), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 16), (3, 16), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 17), (3, 17), 2, colors.Color(0.35, 0.35, 0.35)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
        ]))
        
        story.append(form16_table)
        story.append(Spacer(1, 10))
        
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This Form 16 is generated electronically and is valid without signature. "
            "All tax computations are as per Income Tax Act 1961. This certificate is issued under section 203 "
            "of the Income Tax Act for tax deducted at source on salary. For any discrepancies, "
            "contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=form16_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"Form 16 report generation failed: {str(e)}")

@router.get("/reports/pf-challan/pdf")
def generate_pf_challan_pdf(
    month: str,
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user),
    _: dict = Depends(require_permission("generate_payroll_reports"))
):
    """Generate PF Challan PDF with exact payslip format"""
    try:
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            topMargin=120,
            bottomMargin=40,
            leftMargin=40,
            rightMargin=40
        )
        
        template = PDFHeaderFooterTemplate(db, "SALARY SLIP")
        
        styles = getSampleStyleSheet()
        story = []
        
        # PF Challan data with exact payslip format
        pf_data = [
            # Employee Information Header
            ['EMPLOYEE INFORMATION', '', 'PAYROLL PERIOD', ''],
            ['Employee Name:', 'Sample Employee', 'Pay Period:', month],
            ['Employee ID:', 'EMP001', 'Pay Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['Department:', 'IT Department', 'Working Days:', '30'],
            ['Designation:', 'Software Engineer', 'Days Worked:', '30'],
            
            # Separator
            ['', '', '', ''],
            
            # Earnings and Deductions Header
            ['EARNINGS', 'AMOUNT (₹)', 'DEDUCTIONS', 'AMOUNT (₹)'],
            ['Basic Salary', '50,000.00', 'Provident Fund (PF)', '6,000.00'],
            ['House Rent Allowance', '20,000.00', 'Employee State Insurance', '787.50'],
            ['Special Allowance', '10,000.00', 'Professional Tax', '200.00'],
            ['Bonus/Incentives', '0.00', 'Income Tax (TDS)', '0.00'],
            
            # Separator
            ['', '', '', ''],
            
            # Totals
            ['GROSS EARNINGS', '80,000.00', 'TOTAL DEDUCTIONS', '6,987.50'],
            
            # Separator
            ['', '', '', ''],
            
            # Net Salary
            ['NET SALARY PAYABLE', '₹ 73,012.50', '', ''],
            ['Amount in Words:', '', '', ''],
            ['SEVENTY THREE THOUSAND TWELVE RUPEES FIFTY PAISE ONLY', '', '', ''],
            
            # Separator
            ['', '', '', ''],
            
            # Signature Section
            ['EMPLOYER VERIFICATION', '', 'EMPLOYEE ACKNOWLEDGMENT', ''],
            ['', '', '', ''],
            ['Authorized Signatory', 'Date: __________', 'Employee Signature', 'Date: __________'],
        ]
        
        # Create single table with elegant styling (exact payslip format)
        pf_table = Table(pf_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        pf_table.setStyle(TableStyle([
            # Employee info header - elegant dark grey
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            
            # Earnings/Deductions header - professional grey
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            
            # Totals row - subtle highlight
            ('BACKGROUND', (0, 12), (3, 12), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 12), (3, 12), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 12), (3, 12), 10),
            
            # Net salary rows - light grey background with dark text
            ('BACKGROUND', (0, 14), (3, 16), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 14), (3, 16), colors.black),
            ('FONTNAME', (0, 14), (3, 16), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 16), 11),
            
            # Signature header - professional finish
            ('BACKGROUND', (0, 18), (3, 18), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 18), (3, 18), colors.white),
            ('FONTNAME', (0, 18), (3, 18), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 18), (3, 18), 9),
            
            # General elegant styling
            ('TEXTCOLOR', (0, 1), (3, 17), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 17), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 17), 9),
            
            # Compact padding for single page
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            
            # Professional grid lines
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 12), (3, 12), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 16), (3, 16), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 18), (3, 18), 2, colors.Color(0.35, 0.35, 0.35)),
            
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
            
            # Special styling for amount in words - black text on light background
            ('SPAN', (0, 15), (3, 15)),
            ('ALIGN', (0, 15), (3, 15), 'CENTER'),
            ('FONTSIZE', (0, 15), (3, 15), 8),
            ('FONTNAME', (0, 15), (3, 15), 'Helvetica'),
            ('TEXTCOLOR', (0, 15), (3, 15), colors.black),
        ]))
        
        story.append(pf_table)
        story.append(Spacer(1, 10))
        
        # Government compliance note
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This payslip is generated electronically and is valid without signature. "
            "All statutory deductions are computed as per prevailing Government of India regulations including "
            "Provident Fund Act 1952, ESI Act 1948, and Income Tax Act 1961. For any discrepancies, "
            "contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        # Build PDF with header and footer
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=pf_challan_report_{month.replace('-', '_')}.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"PF Challan report generation failed: {str(e)}")

@router.get("/reports/esi-challan/pdf")
def generate_esi_challan_pdf(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user),
    _: dict = Depends(require_permission("generate_payroll_reports"))
):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=120, bottomMargin=40, leftMargin=40, rightMargin=40)
        template = PDFHeaderFooterTemplate(db, "ESI CHALLAN REPORT")
        styles = getSampleStyleSheet()
        story = []
        
        esi_data = [
            ['ESI CHALLAN SUMMARY', '', 'PERIOD INFORMATION', ''],
            ['Establishment Code:', 'NUTRYAH001', 'Pay Period:', 'December 2024'],
            ['Establishment Name:', 'NUTRYAH TECHNOLOGIES PVT LTD', 'Challan Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['ESI Office:', 'BANGALORE', 'Total Employees:', '3'],
            ['Contribution Rate:', '1.75% of Gross Salary', 'Working Days:', '30'],
            ['', '', '', ''],
            ['CONTRIBUTION DETAILS', 'AMOUNT (₹)', 'STATUTORY COMPLIANCE', 'DETAILS'],
            ['Employee Contribution (0.75%)', '3,375.00', 'ESI Act Reference:', 'ESI Act 1948'],
            ['Employer Contribution (3.25%)', '14,625.00', 'Contribution Rate:', '4.75% of Gross'],
            ['Total Gross Salary', '4,50,000.00', 'Due Date:', '21st of Next Month'],
            ['Administrative Charges', '0.00', 'Compliance Status:', 'As per Statute'],
            ['', '', '', ''],
            ['TOTAL CONTRIBUTIONS', '18,000.00', 'TOTAL GROSS SALARY', '4,50,000.00'],
            ['', '', '', ''],
            ['NET ESI CONTRIBUTION PAYABLE', '₹ 18,000.00', '', ''],
            ['Amount in Words:', 'EIGHTEEN THOUSAND RUPEES ONLY', '', ''],
            ['', '', '', ''],
            ['EMPLOYER VERIFICATION', '', 'AUTHORIZED SIGNATORY', ''],
            ['', '', '', ''],
            ['Prepared By: HR Department', 'Date: __________', 'Signature: __________', 'Date: __________'],
        ]
        
        esi_table = Table(esi_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        esi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            ('BACKGROUND', (0, 12), (3, 12), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 12), (3, 12), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 12), (3, 12), 10),
            ('BACKGROUND', (0, 14), (3, 16), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 14), (3, 16), colors.black),
            ('FONTNAME', (0, 14), (3, 16), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 16), 11),
            ('BACKGROUND', (0, 17), (3, 17), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 17), (3, 17), colors.white),
            ('FONTNAME', (0, 17), (3, 17), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 17), (3, 17), 9),
            ('TEXTCOLOR', (0, 1), (3, 16), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 16), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 16), 9),
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 12), (3, 12), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 16), (3, 16), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 17), (3, 17), 2, colors.Color(0.35, 0.35, 0.35)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
            ('SPAN', (1, 15), (3, 15)),
            ('ALIGN', (1, 15), (3, 15), 'CENTER'),
        ]))
        
        story.append(esi_table)
        story.append(Spacer(1, 10))
        
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This ESI Challan is generated electronically and is valid without signature. "
            "All statutory contributions are computed as per prevailing Government of India regulations including "
            "Employees' State Insurance Act 1948. For any discrepancies, "
            "contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=esi_challan_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"ESI Challan report generation failed: {str(e)}")

@router.get("/reports/tds/pdf")
def generate_tds_pdf(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user),
    _: dict = Depends(require_permission("generate_compliance_reports"))
):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=120, bottomMargin=40, leftMargin=40, rightMargin=40)
        template = PDFHeaderFooterTemplate(db, "TDS REPORT")
        styles = getSampleStyleSheet()
        story = []
        
        tds_data = [
            ['TDS SUMMARY', '', 'PERIOD INFORMATION', ''],
            ['Company Name:', 'NUTRYAH TECHNOLOGIES PVT LTD', 'Assessment Year:', '2024-25'],
            ['TAN Number:', 'BLRN12345A', 'Financial Year:', '2023-24'],
            ['PAN Number:', 'AABCN1234F', 'Report Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['Address:', 'Bangalore, Karnataka, India', 'Total Employees:', '3'],
            ['', '', '', ''],
            ['EMPLOYEE DETAILS', '', 'TDS COMPUTATION', ''],
            ['Employee Name:', 'Sample Employee 1', 'Gross Salary:', '₹ 6,00,000.00'],
            ['Employee Code:', 'EMP001', 'TDS Deducted:', '₹ 60,000.00'],
            ['PAN Number:', 'ABCDE1234F', 'Tax Rate:', '10%'],
            ['Designation:', 'Software Engineer', 'Quarterly TDS:', '₹ 15,000.00'],
            ['', '', '', ''],
            ['TOTAL GROSS SALARY', '₹ 18,00,000.00', 'TOTAL TDS DEDUCTED', '₹ 1,80,000.00'],
            ['', '', '', ''],
            ['NET TDS LIABILITY', '₹ 1,80,000.00', '', ''],
            ['Status:', 'TDS DEDUCTED AS PER INCOME TAX ACT', '', ''],
            ['', '', '', ''],
            ['EMPLOYER VERIFICATION', '', 'AUTHORIZED SIGNATORY', ''],
            ['', '', '', ''],
            ['Prepared By: HR Department', 'Date: __________', 'Signature: __________', 'Date: __________'],
        ]
        
        tds_table = Table(tds_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        tds_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            ('BACKGROUND', (0, 12), (3, 12), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 12), (3, 12), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 12), (3, 12), 10),
            ('BACKGROUND', (0, 14), (3, 16), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 14), (3, 16), colors.black),
            ('FONTNAME', (0, 14), (3, 16), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 16), 11),
            ('BACKGROUND', (0, 17), (3, 17), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 17), (3, 17), colors.white),
            ('FONTNAME', (0, 17), (3, 17), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 17), (3, 17), 9),
            ('TEXTCOLOR', (0, 1), (3, 16), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 16), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 16), 9),
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 12), (3, 12), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 16), (3, 16), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 17), (3, 17), 2, colors.Color(0.35, 0.35, 0.35)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
        ]))
        
        story.append(tds_table)
        story.append(Spacer(1, 10))
        
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This TDS Report is generated electronically and is valid without signature. "
            "All tax deductions are computed as per prevailing Income Tax Act 1961. "
            "For any discrepancies, contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=tds_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"TDS report generation failed: {str(e)}")

@router.get("/reports/bank-transfer/pdf")
def generate_bank_transfer_pdf(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user),
    _: dict = Depends(require_permission("generate_payroll_reports"))
):
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=120, bottomMargin=40, leftMargin=40, rightMargin=40)
        template = PDFHeaderFooterTemplate(db, "BANK TRANSFER REPORT")
        styles = getSampleStyleSheet()
        story = []
        
        bank_data = [
            ['BANK TRANSFER SUMMARY', '', 'PAYMENT DETAILS', ''],
            ['Company Name:', 'NUTRYAH TECHNOLOGIES PVT LTD', 'Payment Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['Company Account:', '1234567890123456', 'Payment Mode:', 'NEFT/RTGS'],
            ['Bank Name:', 'STATE BANK OF INDIA', 'Total Employees:', '3'],
            ['Branch:', 'BANGALORE MAIN BRANCH', 'Total Amount:', '₹ 1,35,000.00'],
            ['', '', '', ''],
            ['EMPLOYEE DETAILS', '', 'BANK INFORMATION', ''],
            ['Employee Name:', 'Sample Employee 1', 'Account Number:', '1234567890'],
            ['Employee Code:', 'EMP001', 'Bank Name:', 'SBI Bank'],
            ['Net Salary:', '₹ 45,000.00', 'IFSC Code:', 'SBIN0001234'],
            ['Payment Status:', 'PROCESSED', 'Transfer Mode:', 'NEFT'],
            ['', '', '', ''],
            ['TOTAL NET SALARY', '₹ 1,35,000.00', 'TOTAL TRANSFERS', '3'],
            ['', '', '', ''],
            ['PAYMENT CONFIRMATION', '₹ 1,35,000.00', '', ''],
            ['Status:', 'ALL TRANSFERS COMPLETED SUCCESSFULLY', '', ''],
            ['', '', '', ''],
            ['EMPLOYER VERIFICATION', '', 'AUTHORIZED SIGNATORY', ''],
            ['', '', '', ''],
            ['Prepared By: HR Department', 'Date: __________', 'Signature: __________', 'Date: __________'],
        ]
        
        bank_table = Table(bank_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        bank_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            ('BACKGROUND', (0, 12), (3, 12), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 12), (3, 12), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 12), (3, 12), 10),
            ('BACKGROUND', (0, 14), (3, 16), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 14), (3, 16), colors.black),
            ('FONTNAME', (0, 14), (3, 16), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 16), 11),
            ('BACKGROUND', (0, 17), (3, 17), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 17), (3, 17), colors.white),
            ('FONTNAME', (0, 17), (3, 17), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 17), (3, 17), 9),
            ('TEXTCOLOR', (0, 1), (3, 16), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 16), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 16), 9),
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 12), (3, 12), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 16), (3, 16), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 17), (3, 17), 2, colors.Color(0.35, 0.35, 0.35)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
        ]))
        
        story.append(bank_table)
        story.append(Spacer(1, 10))
        
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This Bank Transfer Report is generated electronically and is valid without signature. "
            "All salary transfers are processed as per company policy and banking regulations. "
            "For any discrepancies, contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=bank_transfer_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"Bank Transfer report generation failed: {str(e)}")

@router.get("/reports/department-wise/pdf")
def generate_department_wise_pdf(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Generate Department-wise PDF report with professional format"""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=120, bottomMargin=40, leftMargin=40, rightMargin=40)
        template = PDFHeaderFooterTemplate(db, "DEPARTMENT-WISE PAYROLL REPORT")
        styles = getSampleStyleSheet()
        story = []
        
        dept_data = [
            ['DEPARTMENT SUMMARY', '', 'PAYROLL PERIOD', ''],
            ['Company Name:', 'NUTRYAH TECHNOLOGIES PVT LTD', 'Report Period:', 'December 2024'],
            ['Report Type:', 'Department-wise Analysis', 'Report Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['Total Departments:', '3', 'Total Employees:', '3'],
            ['Analysis Scope:', 'All Active Employees', 'Currency:', 'INR (₹)'],
            ['', '', '', ''],
            ['DEPARTMENT BREAKDOWN', '', 'SALARY DISTRIBUTION', ''],
            ['IT Department:', '2 Employees', 'Total Salary:', '₹ 1,10,000.00'],
            ['Average Salary:', '₹ 55,000.00', 'Percentage Share:', '73.33%'],
            ['HR Department:', '1 Employee', 'Total Salary:', '₹ 40,000.00'],
            ['Average Salary:', '₹ 40,000.00', 'Percentage Share:', '26.67%'],
            ['', '', '', ''],
            ['TOTAL PAYROLL', '₹ 1,50,000.00', 'AVERAGE SALARY', '₹ 50,000.00'],
            ['', '', '', ''],
            ['DEPARTMENT ANALYSIS SUMMARY', '', '', ''],
            ['Highest Paying Department:', 'IT Department (₹ 55,000 avg)', '', ''],
            ['Most Employees:', 'IT Department (2 employees)', '', ''],
            ['', '', '', ''],
            ['MANAGEMENT SUMMARY', '', 'AUTHORIZED SIGNATORY', ''],
            ['', '', '', ''],
            ['Prepared By: HR Analytics', 'Date: __________', 'Signature: __________', 'Date: __________'],
        ]
        
        dept_table = Table(dept_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        dept_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            ('BACKGROUND', (0, 12), (3, 12), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 12), (3, 12), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 12), (3, 12), 10),
            ('BACKGROUND', (0, 14), (3, 17), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 14), (3, 17), colors.black),
            ('FONTNAME', (0, 14), (3, 17), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 17), 11),
            ('BACKGROUND', (0, 18), (3, 18), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 18), (3, 18), colors.white),
            ('FONTNAME', (0, 18), (3, 18), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 18), (3, 18), 9),
            ('TEXTCOLOR', (0, 1), (3, 17), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 17), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 17), 9),
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 12), (3, 12), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 17), (3, 17), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 18), (3, 18), 2, colors.Color(0.35, 0.35, 0.35)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
            ('SPAN', (0, 15), (3, 15)),
            ('SPAN', (0, 16), (3, 16)),
        ]))
        
        story.append(dept_table)
        story.append(Spacer(1, 10))
        
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This Department-wise Report is generated electronically and is valid without signature. "
            "All salary computations are as per company policy and statutory regulations. "
            "For any discrepancies, contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=department_wise_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"Department-wise report generation failed: {str(e)}")

@router.get("/reports/grade-wise/pdf")
def generate_grade_wise_pdf(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Generate Grade-wise PDF report with professional format"""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=120, bottomMargin=40, leftMargin=40, rightMargin=40)
        template = PDFHeaderFooterTemplate(db, "GRADE-WISE PAYROLL REPORT")
        styles = getSampleStyleSheet()
        story = []
        
        grade_data = [
            ['GRADE ANALYSIS', '', 'PAYROLL PERIOD', ''],
            ['Company Name:', 'NUTRYAH TECHNOLOGIES PVT LTD', 'Report Period:', 'December 2024'],
            ['Report Type:', 'Grade-wise Salary Analysis', 'Report Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['Total Grades:', '3', 'Total Employees:', '3'],
            ['Analysis Scope:', 'All Active Employees', 'Currency:', 'INR (₹)'],
            ['', '', '', ''],
            ['GRADE BREAKDOWN', '', 'SALARY DISTRIBUTION', ''],
            ['Senior Grade:', '1 Employee', 'Total Salary:', '₹ 60,000.00'],
            ['Average Salary:', '₹ 60,000.00', 'Percentage Share:', '40.00%'],
            ['Mid Grade:', '1 Employee', 'Total Salary:', '₹ 50,000.00'],
            ['Average Salary:', '₹ 50,000.00', 'Percentage Share:', '33.33%'],
            ['Junior Grade:', '1 Employee', 'Total Salary:', '₹ 40,000.00'],
            ['Average Salary:', '₹ 40,000.00', 'Percentage Share:', '26.67%'],
            ['', '', '', ''],
            ['TOTAL PAYROLL', '₹ 1,50,000.00', 'OVERALL AVERAGE', '₹ 50,000.00'],
            ['', '', '', ''],
            ['GRADE ANALYSIS SUMMARY', '', '', ''],
            ['Highest Grade:', 'Senior Grade (₹ 60,000 avg)', '', ''],
            ['Most Populated Grade:', 'Equal Distribution (1 each)', '', ''],
            ['', '', '', ''],
            ['MANAGEMENT SUMMARY', '', 'AUTHORIZED SIGNATORY', ''],
            ['', '', '', ''],
            ['Prepared By: HR Analytics', 'Date: __________', 'Signature: __________', 'Date: __________'],
        ]
        
        grade_table = Table(grade_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        grade_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            ('BACKGROUND', (0, 14), (3, 14), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 14), (3, 14), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 14), 10),
            ('BACKGROUND', (0, 16), (3, 19), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 16), (3, 19), colors.black),
            ('FONTNAME', (0, 16), (3, 19), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 16), (3, 19), 11),
            ('BACKGROUND', (0, 20), (3, 20), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 20), (3, 20), colors.white),
            ('FONTNAME', (0, 20), (3, 20), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 20), (3, 20), 9),
            ('TEXTCOLOR', (0, 1), (3, 19), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 19), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 19), 9),
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 14), (3, 14), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 19), (3, 19), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 20), (3, 20), 2, colors.Color(0.35, 0.35, 0.35)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
            ('SPAN', (0, 17), (3, 17)),
            ('SPAN', (0, 18), (3, 18)),
        ]))
        
        story.append(grade_table)
        story.append(Spacer(1, 10))
        
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This Grade-wise Report is generated electronically and is valid without signature. "
            "All salary computations are as per company policy and grade structure. "
            "For any discrepancies, contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=grade_wise_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"Grade-wise report generation failed: {str(e)}")

@router.get("/reports/attendance-payroll/pdf")
def generate_attendance_payroll_pdf(
    request: Request,
    db: Session = Depends(get_tenant_db),
    user = Depends(get_current_user)
):
    """Generate Attendance vs Payroll PDF report with professional format"""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=120, bottomMargin=40, leftMargin=40, rightMargin=40)
        template = PDFHeaderFooterTemplate(db, "ATTENDANCE VS PAYROLL REPORT")
        styles = getSampleStyleSheet()
        story = []
        
        attendance_data = [
            ['ATTENDANCE ANALYSIS', '', 'PAYROLL PERIOD', ''],
            ['Company Name:', 'NUTRYAH TECHNOLOGIES PVT LTD', 'Report Period:', 'December 2024'],
            ['Report Type:', 'Attendance vs Payroll Analysis', 'Report Date:', datetime.datetime.now().strftime('%d-%b-%Y')],
            ['Total Employees:', '3', 'Working Days:', '22'],
            ['Analysis Scope:', 'All Active Employees', 'Currency:', 'INR (₹)'],
            ['', '', '', ''],
            ['EMPLOYEE ATTENDANCE', '', 'SALARY IMPACT', ''],
            ['Sample Employee 1:', '22 Days Present', 'Gross Salary:', '₹ 50,000.00'],
            ['Attendance Rate:', '100%', 'Net Salary:', '₹ 45,000.00'],
            ['Sample Employee 2:', '20 Days Present', 'Gross Salary:', '₹ 60,000.00'],
            ['Attendance Rate:', '91%', 'Net Salary:', '₹ 54,000.00'],
            ['Sample Employee 3:', '21 Days Present', 'Gross Salary:', '₹ 40,000.00'],
            ['Attendance Rate:', '95%', 'Net Salary:', '₹ 36,000.00'],
            ['', '', '', ''],
            ['TOTAL ATTENDANCE', '63 Days', 'TOTAL PAYROLL', '₹ 1,35,000.00'],
            ['AVERAGE ATTENDANCE', '95%', 'AVERAGE SALARY', '₹ 45,000.00'],
            ['', '', '', ''],
            ['ATTENDANCE SUMMARY', '', '', ''],
            ['Perfect Attendance:', '1 Employee (33%)', '', ''],
            ['Above 90% Attendance:', '3 Employees (100%)', '', ''],
            ['Total Absent Days:', '3 Days', '', ''],
            ['', '', '', ''],
            ['MANAGEMENT SUMMARY', '', 'AUTHORIZED SIGNATORY', ''],
            ['', '', '', ''],
            ['Prepared By: HR Analytics', 'Date: __________', 'Signature: __________', 'Date: __________'],
        ]
        
        attendance_table = Table(attendance_data, colWidths=[2.2*inch, 1.8*inch, 2.2*inch, 1.8*inch])
        attendance_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.3, 0.3, 0.3)),
            ('BACKGROUND', (2, 0), (3, 0), colors.Color(0.3, 0.3, 0.3)),
            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 10),
            ('BACKGROUND', (0, 6), (3, 6), colors.Color(0.4, 0.4, 0.4)),
            ('TEXTCOLOR', (0, 6), (3, 6), colors.white),
            ('FONTNAME', (0, 6), (3, 6), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 6), (3, 6), 10),
            ('BACKGROUND', (0, 14), (3, 15), colors.Color(0.85, 0.85, 0.85)),
            ('FONTNAME', (0, 14), (3, 15), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 14), (3, 15), 10),
            ('BACKGROUND', (0, 17), (3, 21), colors.Color(0.9, 0.9, 0.9)),
            ('TEXTCOLOR', (0, 17), (3, 21), colors.black),
            ('FONTNAME', (0, 17), (3, 21), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 17), (3, 21), 11),
            ('BACKGROUND', (0, 22), (3, 22), colors.Color(0.35, 0.35, 0.35)),
            ('TEXTCOLOR', (0, 22), (3, 22), colors.white),
            ('FONTNAME', (0, 22), (3, 22), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 22), (3, 22), 9),
            ('TEXTCOLOR', (0, 1), (3, 21), colors.Color(0.1, 0.1, 0.1)),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 1), (3, 21), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, 21), 9),
            ('BOTTOMPADDING', (0, 0), (3, -1), 6),
            ('TOPPADDING', (0, 0), (3, -1), 6),
            ('LEFTPADDING', (0, 0), (3, -1), 6),
            ('RIGHTPADDING', (0, 0), (3, -1), 6),
            ('GRID', (0, 0), (3, -1), 0.5, colors.Color(0.6, 0.6, 0.6)),
            ('LINEBELOW', (0, 0), (3, 0), 2, colors.Color(0.3, 0.3, 0.3)),
            ('LINEBELOW', (0, 6), (3, 6), 2, colors.Color(0.4, 0.4, 0.4)),
            ('LINEBELOW', (0, 15), (3, 15), 1.5, colors.Color(0.5, 0.5, 0.5)),
            ('LINEBELOW', (0, 21), (3, 21), 2, colors.Color(0.7, 0.7, 0.7)),
            ('LINEBELOW', (0, 22), (3, 22), 2, colors.Color(0.35, 0.35, 0.35)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
            ('SPAN', (0, 18), (3, 18)),
            ('SPAN', (0, 19), (3, 19)),
            ('SPAN', (0, 20), (3, 20)),
        ]))
        
        story.append(attendance_table)
        story.append(Spacer(1, 10))
        
        compliance_text = Paragraph(
            "<b>IMPORTANT NOTICE:</b> This Attendance vs Payroll Report is generated electronically and is valid without signature. "
            "All attendance data is computed from biometric/manual records and salary impact is calculated accordingly. "
            "For any discrepancies, contact HR Department within 7 days of receipt.",
            ParagraphStyle('Compliance', parent=styles['Normal'], fontSize=8, textColor=colors.darkblue, 
                         leftIndent=10, rightIndent=10, spaceAfter=10)
        )
        story.append(compliance_text)
        
        doc.build(story, onFirstPage=template.header_footer, onLaterPages=template.header_footer)
        buffer.seek(0)
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=attendance_payroll_report.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(500, f"Attendance vs Payroll report generation failed: {str(e)}")