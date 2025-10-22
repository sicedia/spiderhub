"""
Django management command to automatically clean up old logs
Usage: python manage.py cleanup_logs --days=14 --keep=5
"""
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os
import glob
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Clean up old system logs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=14,
            help='Number of days to keep logs (default: 14)'
        )
        parser.add_argument(
            '--keep',
            type=int,
            default=5,
            help='Minimum number of log files to keep (default: 5)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate cleanup without actually deleting files'
        )

    def handle(self, *args, **options):
        days = options['days']
        keep_min = options['keep']
        dry_run = options['dry_run']
        
        self.stdout.write(f"Starting log cleanup (last {days} days, keep minimum {keep_min} files)")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY-RUN MODE: No files will be deleted"))
        
        # Log directories to clean up
        log_dirs = [
            '/app/logs/',  # Application logs
            '/var/log/',   # System logs (if accessible)
        ]
        
        total_deleted = 0
        total_size_freed = 0
        
        for log_dir in log_dirs:
            if os.path.exists(log_dir):
                deleted, size_freed = self.cleanup_directory(log_dir, days, keep_min, dry_run)
                total_deleted += deleted
                total_size_freed += size_freed
        
        # Clean up Django-specific logs
        django_logs_deleted, django_size_freed = self.cleanup_django_logs(days, keep_min, dry_run)
        total_deleted += django_logs_deleted
        total_size_freed += django_size_freed
        
        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f"Cleanup completed: {total_deleted} files, "
                f"{self.format_size(total_size_freed)} freed"
            )
        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING("To execute for real, omit --dry-run"))

    def cleanup_directory(self, directory, days, keep_min, dry_run):
        """Clean up log files in a specific directory"""
        deleted = 0
        size_freed = 0
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Log file patterns
        log_patterns = ['*.log', '*.log.*']
        
        for pattern in log_patterns:
            log_files = glob.glob(os.path.join(directory, pattern))
            
            # Sort by modification date (newest first)
            log_files.sort(key=os.path.getmtime, reverse=True)
            
            # Keep at least keep_min files
            files_to_check = log_files[keep_min:] if len(log_files) > keep_min else []
            
            for log_file in files_to_check:
                try:
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(log_file))
                    
                    if file_mtime < cutoff_date:
                        file_size = os.path.getsize(log_file)
                        
                        if not dry_run:
                            os.remove(log_file)
                            self.stdout.write(f"Deleted: {log_file}")
                        else:
                            self.stdout.write(f"[DRY-RUN] Would delete: {log_file}")
                        
                        deleted += 1
                        size_freed += file_size
                        
                except (OSError, IOError) as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error processing {log_file}: {e}")
                    )
        
        return deleted, size_freed

    def cleanup_django_logs(self, days, keep_min, dry_run):
        """Clean up Django-specific logs"""
        deleted = 0
        size_freed = 0
        
        # Application-specific logs
        django_log_files = [
            '/app/logs/django.log',
            '/app/logs/django.log.*',
            '/app/logs/failed_sdg_scores.log',
            '/app/logs/sdg_ingestion.log',
        ]
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        for log_pattern in django_log_files:
            if '*' in log_pattern:
                files = glob.glob(log_pattern)
            else:
                files = [log_pattern] if os.path.exists(log_pattern) else []
            
            # Sort by modification date
            files.sort(key=os.path.getmtime, reverse=True)
            
            # Keep at least keep_min files
            files_to_check = files[keep_min:] if len(files) > keep_min else []
            
            for log_file in files_to_check:
                try:
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(log_file))
                    
                    if file_mtime < cutoff_date:
                        file_size = os.path.getsize(log_file)
                        
                        if not dry_run:
                            os.remove(log_file)
                            self.stdout.write(f"Deleted Django log: {log_file}")
                        else:
                            self.stdout.write(f"[DRY-RUN] Would delete Django log: {log_file}")
                        
                        deleted += 1
                        size_freed += file_size
                        
                except (OSError, IOError) as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error processing Django log {log_file}: {e}")
                    )
        
        return deleted, size_freed

    def format_size(self, size_bytes):
        """Format size in bytes to readable format"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f} {size_names[i]}"
