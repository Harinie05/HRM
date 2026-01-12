            ('TEXTCOLOR', (0, 0), (3, 0), colors.white),
            ('FONTNAME', (0, 0), (3, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (3, 0), 11),
            ('ALIGN', (0, 0), (1, 0), 'CENTER'),
            ('ALIGN', (2, 0), (3, 0), 'CENTER'),
            ('FONTNAME', (0, 1), (3, -3), 'Helvetica'),
            ('FONTSIZE', (0, 1), (3, -3), 10),
            ('TEXTCOLOR', (0, 1), (3, -3), colors.black),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('ALIGN', (2, 1), (2, -1), 'LEFT'),
            ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
            ('BACKGROUND', (0, -1), (3, -1), colors.Color(0.9, 0.9, 0.9)),
            ('FONTNAME', (0, -1), (3, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (3, -1), 11),
            ('TEXTCOLOR', (0, -1), (3, -1), colors.black),
            ('GRID', (0, 0), (3, -1), 0.8, colors.Color(0.4, 0.4, 0.4)),
            ('VALIGN', (0, 0), (3, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (3, -1), 10),
            ('RIGHTPADDING', (0, 0), (3, -1), 10),
            ('TOPPADDING', (0, 0), (3, -1), 8),
            ('BOTTOMPADDING', (0, 0), (3, -1), 8)
        ]))
        story.append(earnings_table)
        story.append(Spacer(1, 12))
        
        # Net Salary Section
        net_salary_data = [['Net Salary', f'₹{net_salary:,.0f}']]
        net_table = Table(net_salary_data, colWidths=[5*inch, 2*inch])
        net_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.Color(0.2, 0.4, 0.8)),
            ('TEXTCOLOR', (0, 0), (1, 0), colors.white),
            ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (1, 0), 14),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('GRID', (0, 0), (1, 0), 1, colors.Color(0.2, 0.4, 0.8)),
            ('VALIGN', (0, 0), (1, 0), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (1, 0), 15),
            ('RIGHTPADDING', (0, 0), (1, 0), 15),
            ('TOPPADDING', (0, 0), (1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (1, 0), 12)
        ]))
        story.append(net_table)
        
        # Build PDF
        doc.build(story, onFirstPage=template.first_page, onLaterPages=template.later_pages)
        
        pdf_value = buffer.getvalue()
        buffer.close()
        return pdf_value
        
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        raise HTTPException(500, f"PDF generation failed: {str(e)}")