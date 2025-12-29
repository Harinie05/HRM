from fastapi import APIRouter
from fastapi.responses import Response
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from io import BytesIO
import datetime

router = APIRouter(
    prefix="/payroll/reports",
    tags=["Payroll - Reports"]
)


@router.get("/summary")
def payroll_summary():
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
def generate_form16_pdf():
    """Generate Form 16 PDF certificate"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title = Paragraph("<b>FORM No. 16</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 12))
    
    subtitle = Paragraph("<b>Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source on salary</b>", styles['Heading2'])
    story.append(subtitle)
    story.append(Spacer(1, 20))
    
    # Company Details
    company_data = [
        ['Name and address of the Employer', 'Nutryah Technologies Pvt Ltd\nBangalore, Karnataka\nIndia'],
        ['TAN of the Deductor', 'BLRN12345A'],
        ['PAN of the Deductor', 'AABCN1234F'],
        ['Assessment Year', '2024-25'],
        ['Period', 'From 01-Apr-2023 to 31-Mar-2024']
    ]
    
    company_table = Table(company_data, colWidths=[200, 300])
    company_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(company_table)
    story.append(Spacer(1, 20))
    
    # Employee Details
    employee_data = [
        ['Name of the Employee', 'Sample Employee'],
        ['PAN of the Employee', 'ABCDE1234F'],
        ['Employee Code', 'EMP001'],
        ['Address of the Employee', 'Sample Address\nBangalore, Karnataka\nIndia']
    ]
    
    employee_table = Table(employee_data, colWidths=[200, 300])
    employee_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(employee_table)
    story.append(Spacer(1, 20))
    
    # Salary Details
    salary_data = [
        ['Particulars', 'Amount (Rs.)'],
        ['Gross Salary', '1,50,000'],
        ['Less: Deductions under Chapter VI-A', '20,000'],
        ['Total Income', '1,30,000'],
        ['Tax on total income', '15,000'],
        ['Less: Relief under section 89', '0'],
        ['Tax payable', '15,000'],
        ['Less: TDS', '15,000'],
        ['Tax payable/refundable', '0']
    ]
    
    salary_table = Table(salary_data, colWidths=[300, 200])
    salary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(salary_table)
    story.append(Spacer(1, 30))
    
    # Footer
    footer_text = Paragraph("<b>This is a computer generated Form 16 and does not require signature.</b>", styles['Normal'])
    story.append(footer_text)
    story.append(Spacer(1, 10))
    
    date_text = Paragraph(f"Generated on: {datetime.datetime.now().strftime('%d-%m-%Y')}", styles['Normal'])
    story.append(date_text)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
@router.get("/pf-challan/pdf")
def generate_pf_challan_pdf():
    """Generate PF Challan PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph("<b>PF CHALLAN REPORT</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    data = [
        ['Employee Name', 'PF Number', 'Basic Salary', 'PF Contribution'],
        ['Sample Employee 1', 'PF001', '50,000', '6,000'],
        ['Sample Employee 2', 'PF002', '60,000', '7,200'],
        ['Sample Employee 3', 'PF003', '40,000', '4,800'],
        ['Total', '', '1,50,000', '18,000']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=pf_challan_report.pdf"}
    )


@router.get("/esi-challan/pdf")
def generate_esi_challan_pdf():
    """Generate ESI Challan PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph("<b>ESI CHALLAN REPORT</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    data = [
        ['Employee Name', 'ESI Number', 'Gross Salary', 'ESI Contribution'],
        ['Sample Employee 1', 'ESI001', '50,000', '875'],
        ['Sample Employee 2', 'ESI002', '60,000', '1,050'],
        ['Sample Employee 3', 'ESI003', '40,000', '700'],
        ['Total', '', '1,50,000', '2,625']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=esi_challan_report.pdf"}
    )


@router.get("/tds/pdf")
def generate_tds_pdf():
    """Generate TDS PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph("<b>TDS REPORT</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    data = [
        ['Employee Name', 'PAN', 'Gross Salary', 'TDS Deducted'],
        ['Sample Employee 1', 'ABCDE1234F', '50,000', '5,000'],
        ['Sample Employee 2', 'FGHIJ5678K', '60,000', '6,000'],
        ['Sample Employee 3', 'LMNOP9012Q', '40,000', '4,000'],
        ['Total', '', '1,50,000', '15,000']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=tds_report.pdf"}
    )


@router.get("/bank-transfer/pdf")
def generate_bank_transfer_pdf():
    """Generate Bank Transfer PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph("<b>BANK TRANSFER REPORT</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    data = [
        ['Employee Name', 'Account Number', 'Bank Name', 'Net Salary'],
        ['Sample Employee 1', '1234567890', 'SBI Bank', '45,000'],
        ['Sample Employee 2', '0987654321', 'HDFC Bank', '54,000'],
        ['Sample Employee 3', '1122334455', 'ICICI Bank', '36,000'],
        ['Total', '', '', '1,35,000']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=bank_transfer_report.pdf"}
    )


@router.get("/department-wise/pdf")
def generate_department_wise_pdf():
    """Generate Department-wise PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph("<b>DEPARTMENT-WISE PAYROLL REPORT</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    data = [
        ['Department', 'Employee Count', 'Total Salary', 'Average Salary'],
        ['IT', '2', '1,10,000', '55,000'],
        ['HR', '1', '40,000', '40,000'],
        ['Total', '3', '1,50,000', '50,000']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=department_wise_report.pdf"}
    )


@router.get("/grade-wise/pdf")
def generate_grade_wise_pdf():
    """Generate Grade-wise PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph("<b>GRADE-WISE PAYROLL REPORT</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    data = [
        ['Grade', 'Employee Count', 'Total Salary', 'Average Salary'],
        ['Senior', '1', '60,000', '60,000'],
        ['Mid', '1', '50,000', '50,000'],
        ['Junior', '1', '40,000', '40,000'],
        ['Total', '3', '1,50,000', '50,000']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=grade_wise_report.pdf"}
    )


@router.get("/attendance-payroll/pdf")
def generate_attendance_payroll_pdf():
    """Generate Attendance vs Payroll PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title = Paragraph("<b>ATTENDANCE VS PAYROLL REPORT</b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 20))
    
    data = [
        ['Employee Name', 'Days Present', 'Days Absent', 'Gross Salary', 'Net Salary'],
        ['Sample Employee 1', '22', '0', '50,000', '45,000'],
        ['Sample Employee 2', '20', '2', '60,000', '54,000'],
        ['Sample Employee 3', '21', '1', '40,000', '36,000'],
        ['Total', '63', '3', '1,50,000', '1,35,000']
    ]
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(table)
    doc.build(story)
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=attendance_payroll_report.pdf"}
    )
