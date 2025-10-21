"""
Logging configuration for SDG relevance ingestion.

Provides centralized logging to structured log files with timestamps and proper formatting.
"""

import logging
import os
from pathlib import Path
from django.conf import settings


def get_logger(name='sdg_ingestion'):
    """
    Get or create a configured logger for SDG ingestion.
    
    Creates two log files:
    - logs/sdg_ingestion.log: General processing logs (INFO, ERROR, DEBUG)
    - logs/failed_sdg_scores.log: Failed document/SDG pairs for manual review
    
    Args:
        name: Logger name (default: 'sdg_ingestion')
        
    Returns:
        logging.Logger instance
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers if logger already configured
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.DEBUG)
    
    # Create logs directory if it doesn't exist
    logs_dir = Path(settings.BASE_DIR) / 'logs'
    logs_dir.mkdir(exist_ok=True)
    
    # Format for log messages
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s - %(name)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # General processing log file
    general_log_path = logs_dir / 'sdg_ingestion.log'
    file_handler = logging.FileHandler(general_log_path, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Console handler for real-time feedback
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger


def get_failure_logger(name='sdg_failures'):
    """
    Get logger specifically for failed SDG score calculations.
    
    This logger writes to a separate file for easy review and manual curation.
    
    Returns:
        logging.Logger instance
    """
    logger = logging.getLogger(name)
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.ERROR)
    
    # Create logs directory
    logs_dir = Path(settings.BASE_DIR) / 'logs'
    logs_dir.mkdir(exist_ok=True)
    
    # Simplified format for failure log (CSV-like for easy parsing)
    formatter = logging.Formatter(
        '%(asctime)s,%(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Failed scores log file
    failure_log_path = logs_dir / 'failed_sdg_scores.log'
    file_handler = logging.FileHandler(failure_log_path, encoding='utf-8')
    file_handler.setLevel(logging.ERROR)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger


def log_failure(document_id, sdg_id, error_message):
    """
    Log a failed SDG score calculation to the failures log.
    
    Format: timestamp,document_id,sdg_id,error_message
    This makes it easy to parse and retry later.
    
    Args:
        document_id: Document.id
        sdg_id: SDG.id
        error_message: Error description
    """
    failure_logger = get_failure_logger()
    failure_logger.error(f"{document_id},{sdg_id},{error_message}")


# Initialize main logger on import
main_logger = get_logger()

