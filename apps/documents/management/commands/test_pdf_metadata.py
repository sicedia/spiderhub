"""
Management command to test PDF metadata extraction functionality.
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from apps.documents.models import SourceFile
from apps.documents.services.pdf_metadata_extractor import (
    extract_pdf_metadata,
    generate_smart_filename,
    get_pdf_info
)


class Command(BaseCommand):
    help = 'Test PDF metadata extraction functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file-id',
            type=int,
            help='Test with a specific SourceFile ID'
        )
        parser.add_argument(
            '--file-path',
            type=str,
            help='Test with a specific file path'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing PDF metadata extraction...'))
        
        if options['file_id']:
            # Test with a specific SourceFile
            try:
                source_file = SourceFile.objects.get(id=options['file_id'])
                self.test_source_file(source_file)
            except SourceFile.DoesNotExist:
                raise CommandError(f'SourceFile with ID {options["file_id"]} does not exist')
        
        elif options['file_path']:
            # Test with a specific file path
            self.test_file_path(options['file_path'])
        
        else:
            # Test with the first PDF file found
            pdf_files = SourceFile.objects.filter(file_type='pdf')[:5]
            
            if not pdf_files.exists():
                self.stdout.write(self.style.WARNING('No PDF files found in the database'))
                return
            
            self.stdout.write(f'Testing with {pdf_files.count()} PDF files...')
            
            for source_file in pdf_files:
                self.test_source_file(source_file)
                self.stdout.write('-' * 50)

    def test_source_file(self, source_file):
        """Test metadata extraction for a SourceFile instance."""
        self.stdout.write(f'\nTesting SourceFile ID {source_file.id}: {source_file.filename}')
        
        try:
            file_path = source_file.file.path
            
            # Test metadata extraction
            metadata = extract_pdf_metadata(file_path)
            self.stdout.write(f'  Metadata extracted: {bool(any(metadata.values()))}')
            
            if metadata.get('title'):
                self.stdout.write(f'  Title: {metadata["title"]}')
            if metadata.get('author'):
                self.stdout.write(f'  Author: {metadata["author"]}')
            
            # Test smart filename generation
            original_filename = source_file.file.name.split('/')[-1]
            suggested_filename = generate_smart_filename(file_path, original_filename)
            self.stdout.write(f'  Original filename: {original_filename}')
            self.stdout.write(f'  Suggested filename: {suggested_filename}')
            
            # Test comprehensive info
            info = get_pdf_info(file_path, original_filename)
            self.stdout.write(f'  File size: {info["file_size"]} bytes')
            self.stdout.write(f'  Page count: {info["page_count"]}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))

    def test_file_path(self, file_path):
        """Test metadata extraction for a specific file path."""
        self.stdout.write(f'\nTesting file: {file_path}')
        
        try:
            # Test metadata extraction
            metadata = extract_pdf_metadata(file_path)
            self.stdout.write(f'  Metadata extracted: {bool(any(metadata.values()))}')
            
            if metadata.get('title'):
                self.stdout.write(f'  Title: {metadata["title"]}')
            if metadata.get('author'):
                self.stdout.write(f'  Author: {metadata["author"]}')
            
            # Test smart filename generation
            original_filename = file_path.split('/')[-1]
            suggested_filename = generate_smart_filename(file_path, original_filename)
            self.stdout.write(f'  Original filename: {original_filename}')
            self.stdout.write(f'  Suggested filename: {suggested_filename}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  Error: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS('PDF metadata extraction test completed!'))
