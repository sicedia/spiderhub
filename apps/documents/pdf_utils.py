"""
PDF export utilities for Document model.
This module provides functionality to export Document data to PDF format.
"""

from datetime import datetime
from io import BytesIO
from django.http import HttpResponse
from django.utils.text import slugify
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

# Define custom brand colors
BRAND_COLORS = {
    'primary_blue': colors.Color(28/255, 115/255, 119/255),      # #1C7377
    'primary_green': colors.Color(50/255, 175/255, 175/255),     # #32AFAF
    'accent_yellow': colors.Color(251/255, 188/255, 4/255),      # #FBBC04
    'text_primary': colors.Color(51/255, 51/255, 51/255),        # #333333
    'text_secondary': colors.Color(85/255, 85/255, 85/255),      # #555555
    'text_muted': colors.Color(102/255, 102/255, 102/255),       # #666666
    'bg_light': colors.Color(247/255, 247/255, 247/255),         # #F7F7F7
    'border_light': colors.Color(221/255, 221/255, 221/255),     # #ddd
}


class DocumentPDFExporter:
    """Class to handle PDF export of Document instances."""
    
    def __init__(self, document):
        self.document = document
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for the PDF using brand colors and Roboto font."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=BRAND_COLORS['primary_blue'],
            fontName='Helvetica-Bold'  # Fallback to Helvetica if Roboto not available
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceBefore=25,
            spaceAfter=12,
            textColor=BRAND_COLORS['primary_blue'],
            fontName='Helvetica-Bold',
            borderWidth=2,
            borderColor=BRAND_COLORS['primary_green'],
            borderPadding=8,
            backColor=colors.Color(247/255, 247/255, 247/255, alpha=0.3)  # Light background
        ))
        
        # Subsection style
        self.styles.add(ParagraphStyle(
            name='SubSection',
            parent=self.styles['Heading3'],
            fontSize=13,
            spaceBefore=15,
            spaceAfter=8,
            textColor=BRAND_COLORS['text_primary'],
            fontName='Helvetica-Bold'
        ))
        
        # Info style for metadata
        self.styles.add(ParagraphStyle(
            name='InfoStyle',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceBefore=5,
            spaceAfter=5,
            leftIndent=20,
            textColor=BRAND_COLORS['text_secondary'],
            fontName='Helvetica'
        ))
        
        # Normal text style with brand colors
        self.styles.add(ParagraphStyle(
            name='BrandNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=BRAND_COLORS['text_primary'],
            fontName='Helvetica'
        ))
    
    def generate_pdf(self):
        """Generate and return PDF as HttpResponse."""
        # Create filename
        filename = f"document_{self.document.id}_{slugify(self.document.title[:50])}.pdf"
        
        # Create response
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Create PDF document
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build content
        story = []
        story.extend(self._build_header())
        story.extend(self._build_basic_info())
        story.extend(self._build_taxonomies())
        story.extend(self._build_commitments())
        story.extend(self._build_kpis())
        story.extend(self._build_practical_applications())
        story.extend(self._build_source_files())
        
        # Build PDF
        doc.build(story)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        response.write(pdf_content)
        return response
    
    def _build_header(self):
        """Build PDF header with document title and basic info."""
        content = []
        
        # Title
        title = Paragraph(self.document.title, self.styles['CustomTitle'])
        content.append(title)
        content.append(Spacer(1, 20))
        
        # Document type and date info
        if self.document.document_type:
            doc_type = Paragraph(f"<b>Document Type:</b> {self.document.get_document_type_display()}", 
                               self.styles['BrandNormal'])
            content.append(doc_type)
        
        if self.document.event_date:
            event_date = Paragraph(f"<b>Event Date:</b> {self.document.event_date.strftime('%B %d, %Y')}", 
                                 self.styles['BrandNormal'])
            content.append(event_date)
        
        content.append(Spacer(1, 20))
        return content
    
    def _build_basic_info(self):
        """Build basic document information section."""
        content = []
        content.append(Paragraph("Document Information", self.styles['SectionHeader']))
        
        # Create table data for basic info
        table_data = []
        
        # Add basic fields
        if self.document.event_country:
            table_data.append(['Event Country:', str(self.document.event_country)])
        
        if self.document.event_city:
            table_data.append(['Event City:', str(self.document.event_city)])
            
        if self.document.lead_country:
            table_data.append(['Lead Country:', str(self.document.lead_country)])
            
        if self.document.event_format:
            table_data.append(['Event Format:', self.document.get_event_format_display()])
            
        if self.document.coverage_scope:
            table_data.append(['Coverage Scope:', self.document.get_coverage_scope_display()])
            
        if self.document.legal_bindingness:
            table_data.append(['Legal Bindingness:', self.document.get_legal_bindingness_display()])
            
        if self.document.score:
            table_data.append(['Score:', str(self.document.score)])
        
        # Review status
        table_data.append(['AI Check Status:', 'Completed' if self.document.ai_check_status else 'Pending'])
        table_data.append(['Human Review Status:', 'Completed' if self.document.human_check_status else 'Pending'])
        
        if self.document.human_reviewer:
            table_data.append(['Human Reviewer:', str(self.document.human_reviewer)])
        
        # Countries involved - handle long lists properly
        if self.document.countries_involved.exists():
            countries_list = [str(c) for c in self.document.countries_involved.all()]
            
            # If there are many countries (more than 5), create a separate section
            if len(countries_list) > 5:
                table_data.append(['Countries Involved:', f'{len(countries_list)} countries (see details below)'])
                show_countries_separately = True
            else:
                countries_text = ", ".join(countries_list)
                # If the text is still too long, wrap it
                if len(countries_text) > 80:
                    countries_paragraph = Paragraph(countries_text, self.styles['BrandNormal'])
                    table_data.append(['Countries Involved:', countries_paragraph])
                else:
                    table_data.append(['Countries Involved:', countries_text])
                show_countries_separately = False
        else:
            show_countries_separately = False
        
        if table_data:
            table = Table(table_data, colWidths=[2*inch, 4*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), BRAND_COLORS['bg_light']),
                ('TEXTCOLOR', (0, 0), (0, -1), BRAND_COLORS['primary_blue']),  # Header column in brand blue
                ('TEXTCOLOR', (1, 0), (-1, -1), BRAND_COLORS['text_primary']), # Content in primary text
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Align to top for better readability
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),  # Bold for headers
                ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),      # Regular for content
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),  # Add top padding
                ('GRID', (0, 0), (-1, -1), 1, BRAND_COLORS['border_light'])
            ]))
            content.append(table)
        
        # Add countries involved as separate section if there are many
        if show_countries_separately:
            content.append(Spacer(1, 15))
            content.append(Paragraph("Countries Involved", self.styles['SubSection']))
            
            # Create a more readable format for many countries
            countries_list = [str(c) for c in self.document.countries_involved.all()]
            # Group countries in rows of 3 for better readability
            countries_rows = []
            for i in range(0, len(countries_list), 3):
                row = countries_list[i:i+3]
                countries_rows.append(row)
            
            # Create table for countries
            countries_table = Table(countries_rows, colWidths=[2*inch, 2*inch, 2*inch])
            countries_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TEXTCOLOR', (0, 0), (-1, -1), BRAND_COLORS['text_primary']),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, BRAND_COLORS['border_light']),
                ('BACKGROUND', (0, 0), (-1, -1), colors.Color(247/255, 247/255, 247/255, alpha=0.3))
            ]))
            content.append(countries_table)
        
        # Executive Summary
        if self.document.executive_summary:
            content.append(Spacer(1, 15))
            content.append(Paragraph("Executive Summary", self.styles['SubSection']))
            
            # Create a properly formatted paragraph for the executive summary
            summary_style = ParagraphStyle(
                name='SummaryStyle',
                parent=self.styles['BrandNormal'],
                fontSize=10,
                leading=14,  # Line spacing
                spaceBefore=5,
                spaceAfter=5,
                alignment=TA_JUSTIFY,  # Justify text for better readability
                textColor=BRAND_COLORS['text_primary']
            )
            summary = Paragraph(self.document.executive_summary, summary_style)
            content.append(summary)
        
        content.append(Spacer(1, 20))
        return content
    
    def _build_taxonomies(self):
        """Build taxonomies section (themes, actors, beneficiaries, SDGs)."""
        content = []
        content.append(Paragraph("Taxonomies", self.styles['SectionHeader']))
        
        # Themes
        if self.document.themes.exists():
            content.append(Paragraph("Themes", self.styles['SubSection']))
            for doc_theme in self.document.documenttheme_set.all():
                theme_text = f"• <b>{doc_theme.theme.label}</b>"
                if doc_theme.theme.category:
                    theme_text += f" ({doc_theme.theme.category})"
                if doc_theme.relevance_score:
                    theme_text += f" - Relevance: {doc_theme.relevance_score}"
                
                # Create custom style for theme items
                theme_style = ParagraphStyle(
                    name='ThemeStyle',
                    parent=self.styles['InfoStyle'],
                    fontSize=10,
                    leading=12,
                    spaceBefore=3,
                    spaceAfter=3
                )
                content.append(Paragraph(theme_text, theme_style))
                
                if doc_theme.justification:
                    # Format justification with proper wrapping
                    justification_style = ParagraphStyle(
                        name='JustificationStyle',
                        parent=self.styles['InfoStyle'],
                        fontSize=9,
                        leading=11,
                        leftIndent=30,
                        spaceBefore=2,
                        spaceAfter=5,
                        alignment=TA_JUSTIFY
                    )
                    justification_text = f"Justification: {doc_theme.justification}"
                    content.append(Paragraph(justification_text, justification_style))
        
        # Actors
        if self.document.actors.exists():
            content.append(Paragraph("Actors", self.styles['SubSection']))
            for doc_actor in self.document.documentactor_set.all():
                actor_text = f"• <b>{doc_actor.actor.label}</b>"
                if doc_actor.actor.category:
                    actor_text += f" ({doc_actor.actor.category})"
                if doc_actor.relevance_score:
                    actor_text += f" - Relevance: {doc_actor.relevance_score}"
                
                # Create custom style for actor items
                actor_style = ParagraphStyle(
                    name='ActorStyle',
                    parent=self.styles['InfoStyle'],
                    fontSize=10,
                    leading=12,
                    spaceBefore=3,
                    spaceAfter=3
                )
                content.append(Paragraph(actor_text, actor_style))
                
                if doc_actor.justification:
                    # Format justification with proper wrapping
                    justification_style = ParagraphStyle(
                        name='ActorJustificationStyle',
                        parent=self.styles['InfoStyle'],
                        fontSize=9,
                        leading=11,
                        leftIndent=30,
                        spaceBefore=2,
                        spaceAfter=5,
                        alignment=TA_JUSTIFY
                    )
                    justification_text = f"Justification: {doc_actor.justification}"
                    content.append(Paragraph(justification_text, justification_style))
        
        # Beneficiary Groups
        if self.document.beneficiary_groups.exists():
            content.append(Paragraph("Beneficiary Groups", self.styles['SubSection']))
            for bg in self.document.beneficiary_groups.all():
                bg_text = f"• <b>{bg.label}</b>"
                if bg.category:
                    bg_text += f" ({bg.category})"
                content.append(Paragraph(bg_text, self.styles['InfoStyle']))
        
        # Raw Beneficiary Groups
        if self.document.beneficiary_groups_raw.exists():
            content.append(Paragraph("Additional Beneficiary Groups", self.styles['SubSection']))
            for raw_bg in self.document.beneficiary_groups_raw.all():
                content.append(Paragraph(f"• {raw_bg.name}", self.styles['InfoStyle']))
        
        # SDGs
        if self.document.sdgs.exists():
            content.append(Paragraph("Sustainable Development Goals (SDGs)", self.styles['SubSection']))
            for sdg in self.document.sdgs.all():
                sdg_text = f"• {sdg.label}"
                content.append(Paragraph(sdg_text, self.styles['InfoStyle']))
        
        # EU Policy Alignments
        if self.document.eu_policy_alignments.exists():
            content.append(Paragraph("EU Policy Alignments", self.styles['SubSection']))
            for policy in self.document.eu_policy_alignments.all():
                content.append(Paragraph(f"• {policy.name}", self.styles['InfoStyle']))
        
        content.append(Spacer(1, 20))
        return content
    
    def _build_commitments(self):
        """Build commitments section."""
        content = []
        
        if self.document.commitments.exists():
            content.append(Paragraph("Commitments", self.styles['SectionHeader']))
            
            for i, commitment in enumerate(self.document.commitments.all(), 1):
                content.append(Paragraph(f"Commitment {i}", self.styles['SubSection']))
                
                # Format commitment text with proper paragraph styling for long text
                commitment_style = ParagraphStyle(
                    name='CommitmentStyle',
                    parent=self.styles['BrandNormal'],
                    fontSize=10,
                    leading=12,
                    spaceBefore=5,
                    spaceAfter=5,
                    alignment=TA_JUSTIFY,
                    textColor=BRAND_COLORS['text_primary']
                )
                content.append(Paragraph(commitment.text, commitment_style))
                
                # Commitment details
                if commitment.details.exists():
                    content.append(Paragraph("Details:", self.styles['SubSection']))
                    for detail in commitment.details.all():
                        detail_text = f"• {detail.text}"
                        if detail.commitment_class:
                            detail_text += f" (Type: {detail.commitment_class})"
                        
                        # Use proper paragraph styling for long detail text
                        detail_style = ParagraphStyle(
                            name='DetailStyle',
                            parent=self.styles['InfoStyle'],
                            fontSize=9,
                            leading=11,
                            leftIndent=20,
                            alignment=TA_JUSTIFY,
                            textColor=BRAND_COLORS['text_secondary']
                        )
                        content.append(Paragraph(detail_text, detail_style))
                
                content.append(Spacer(1, 10))
        
        return content
    
    def _build_kpis(self):
        """Build KPIs section."""
        content = []
        
        if self.document.kpis.exists():
            content.append(Paragraph("Key Performance Indicators (KPIs)", self.styles['SectionHeader']))
            
            for kpi in self.document.kpis.all():
                content.append(Paragraph(f"KPI: {kpi.metric_name}", self.styles['SubSection']))
                
                # KPI details table
                kpi_data = []
                if kpi.kpi_text:
                    # Wrap long KPI text in a Paragraph for proper text wrapping
                    kpi_text_para = self._wrap_long_text(kpi.kpi_text, 60)
                    kpi_data.append(['Description:', kpi_text_para])
                if kpi.kpi_type:
                    kpi_data.append(['Type:', kpi.kpi_type])
                if kpi.target_value:
                    kpi_data.append(['Target Value:', kpi.target_value])
                if kpi.target_description:
                    # Wrap long target descriptions
                    target_desc_para = self._wrap_long_text(kpi.target_description, 60)
                    kpi_data.append(['Target Description:', target_desc_para])
                if kpi.unit:
                    kpi_data.append(['Unit:', kpi.unit])
                if kpi.timeframe:
                    kpi_data.append(['Timeframe:', kpi.timeframe])
                if kpi.measurement_method:
                    # Wrap long measurement methods
                    method_para = self._wrap_long_text(kpi.measurement_method, 60)
                    kpi_data.append(['Measurement Method:', method_para])
                if kpi.responsible_entity:
                    kpi_data.append(['Responsible Entity:', kpi.responsible_entity])
                if kpi.sector:
                    kpi_data.append(['Sector:', kpi.sector])
                
                if kpi_data:
                    kpi_table = Table(kpi_data, colWidths=[1.5*inch, 4.5*inch])
                    kpi_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (0, -1), BRAND_COLORS['primary_green']),
                        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),  # White text on green background
                        ('TEXTCOLOR', (1, 0), (-1, -1), BRAND_COLORS['text_primary']), # Brand text for content
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Align to top for better readability
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),  # Bold for headers
                        ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),      # Regular for content
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                        ('TOPPADDING', (0, 0), (-1, -1), 8),  # Add top padding
                        ('GRID', (0, 0), (-1, -1), 1, BRAND_COLORS['border_light'])
                    ]))
                    content.append(kpi_table)
                
                content.append(Spacer(1, 15))
        
        return content
    
    def _build_practical_applications(self):
        """Build practical applications section."""
        content = []
        
        if self.document.practical_applications.exists():
            content.append(Paragraph("Practical Applications", self.styles['SectionHeader']))
            
            for i, app in enumerate(self.document.practical_applications.all(), 1):
                content.append(Paragraph(f"Application {i}:", self.styles['SubSection']))
                
                # Format application description with proper paragraph styling
                app_style = ParagraphStyle(
                    name='ApplicationStyle',
                    parent=self.styles['BrandNormal'],
                    fontSize=10,
                    leading=12,
                    spaceBefore=5,
                    spaceAfter=5,
                    alignment=TA_JUSTIFY,
                    textColor=BRAND_COLORS['text_primary']
                )
                content.append(Paragraph(app.description, app_style))
                content.append(Spacer(1, 10))
        
        return content
    
    def _build_source_files(self):
        """Build source files section."""
        content = []
        
        if self.document.source_files.exists():
            content.append(Paragraph("Source Files", self.styles['SectionHeader']))
            
            # Create table for source files
            file_data = [['Filename', 'Type', 'Size', 'Upload Date']]
            
            for source_file in self.document.source_files.all():
                size_str = f"{source_file.file_size / 1024:.1f} KB" if source_file.file_size else "Unknown"
                
                # Handle long filenames by wrapping them in Paragraph
                filename_display = source_file.filename
                if len(filename_display) > 30:  # If filename is too long
                    filename_para = Paragraph(filename_display, ParagraphStyle(
                        name='FilenameStyle',
                        parent=self.styles['BrandNormal'],
                        fontSize=8,
                        leading=10,
                        textColor=BRAND_COLORS['text_primary']
                    ))
                    filename_display = filename_para
                
                file_data.append([
                    filename_display,
                    source_file.get_file_type_display(),
                    size_str,
                    source_file.upload_date.strftime('%Y-%m-%d')
                ])
            
            files_table = Table(file_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1.5*inch])
            files_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLORS['primary_blue']),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), BRAND_COLORS['text_primary']),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Align to top for better readability
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),  # Add top padding
                ('GRID', (0, 0), (-1, -1), 1, BRAND_COLORS['border_light'])
            ]))
            content.append(files_table)
        
        # Footer with generation info
        content.append(Spacer(1, 30))
        footer_style = ParagraphStyle(
            name='FooterStyle',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=BRAND_COLORS['text_muted'],
            alignment=TA_CENTER
        )
        content.append(Paragraph(
            f"PDF generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            footer_style
        ))
        
        return content
    
    def _wrap_long_text(self, text, max_length=60, style_name='BrandNormal'):
        """
        Helper method to wrap long text in a Paragraph for proper formatting.
        
        Args:
            text: The text to potentially wrap
            max_length: Maximum length before wrapping (default 60)
            style_name: Style to use for the paragraph (default 'BrandNormal')
            
        Returns:
            Either the original text or a Paragraph object
        """
        if isinstance(text, str) and len(text) > max_length:
            return Paragraph(text, self.styles[style_name])
        return text


def export_document_to_pdf(document):
    """
    Export a single document to PDF.
    
    Args:
        document: Document instance to export
        
    Returns:
        HttpResponse with PDF content
    """
    exporter = DocumentPDFExporter(document)
    return exporter.generate_pdf()
