"""
Management command to test automatic review status reset functionality.
"""

from django.core.management.base import BaseCommand, CommandError
from apps.documents.models import Document


class Command(BaseCommand):
    help = 'Test automatic review status reset functionality'

    def add_arguments(self, parser):
        parser.add_argument(
            '--document-id',
            type=int,
            help='Test with a specific Document ID'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing automatic review status reset...'))
        
        if options['document_id']:
            # Test with a specific document
            try:
                document = Document.objects.get(id=options['document_id'])
                self.test_document_review_reset(document)
            except Document.DoesNotExist:
                raise CommandError(f'Document with ID {options["document_id"]} does not exist')
        
        else:
            # Test with the first few documents
            documents = Document.objects.all()[:3]
            
            if not documents.exists():
                self.stdout.write(self.style.WARNING('No documents found in the database'))
                return
            
            self.stdout.write(f'Testing with {documents.count()} documents...')
            
            for document in documents:
                self.test_document_review_reset(document)
                self.stdout.write('-' * 50)

    def test_document_review_reset(self, document):
        """Test review status reset for a document."""
        self.stdout.write(f'\nTesting Document ID {document.id}: {document.title}')
        
        # Show current status
        self.stdout.write(f'  Current human_check_status: {document.human_check_status}')
        self.stdout.write(f'  Current human_check_date: {document.human_check_date}')
        self.stdout.write(f'  Current human_reviewer: {document.human_reviewer}')
        self.stdout.write(f'  Current score: {document.score}')
        self.stdout.write(f'  Current executive_summary length: {len(document.executive_summary or "")}')
        
        # Mark as human reviewed first
        if not document.human_check_status:
            from django.contrib.auth.models import User
            user = User.objects.first()
            if user:
                document.mark_human_reviewed(user)
                self.stdout.write(f'  ✅ Marked as human reviewed by {user.username}')
            else:
                self.stdout.write('  ⚠️ No users found to mark as reviewer')
                return
        
        # Test changing executive_summary
        original_summary = document.executive_summary
        document.executive_summary = (document.executive_summary or "") + " [TEST MODIFICATION]"
        
        self.stdout.write(f'  🔄 Modifying executive_summary...')
        print(f"DEBUG: About to save document {document.id}")
        document.save()
        print(f"DEBUG: Document {document.id} saved")
        
        # Refresh from database
        document.refresh_from_db()
        
        self.stdout.write(f'  Result - human_check_status: {document.human_check_status}')
        self.stdout.write(f'  Result - human_check_date: {document.human_check_date}')
        self.stdout.write(f'  Result - human_reviewer: {document.human_reviewer}')
        
        if document.human_check_status:
            self.stdout.write(self.style.ERROR('  ❌ FAILED: human_check_status should be False after modification'))
        else:
            self.stdout.write(self.style.SUCCESS('  ✅ SUCCESS: human_check_status was reset to False'))
        
        # Restore original summary
        document.executive_summary = original_summary
        document.save()
        self.stdout.write(f'  🔄 Restored original executive_summary')
        
        self.stdout.write(self.style.SUCCESS('Review status reset test completed!'))
