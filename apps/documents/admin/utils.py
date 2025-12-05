"""
Admin Utilities
Helper functions for common admin display formatting (badges, labels, etc.)
"""
from django.utils.html import format_html


def create_badge(text, color, size='small'):
    """
    Create a styled badge element.
    
    Args:
        text: The text to display in the badge
        color: Background color (hex code)
        size: Badge size ('small', 'medium', 'large')
    
    Returns:
        HTML formatted badge string
    """
    sizes = {
        'small': '10px',
        'medium': '11px',
        'large': '12px'
    }
    font_size = sizes.get(size, '10px')
    
    return format_html(
        '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 10px; font-size: {};">{}</span>',
        color, font_size, text
    )


def create_colored_label(text, color, bold=False):
    """
    Create a colored text label.
    
    Args:
        text: The text to display
        color: Text color (hex code)
        bold: Whether to make text bold
    
    Returns:
        HTML formatted label string
    """
    style = f'color: {color};'
    if bold:
        style += ' font-weight: bold;'
    
    return format_html('<span style="{}">{}</span>', style, text)


def create_preview(text, max_length=100, wrapper_style=None):
    """
    Create a truncated text preview.
    
    Args:
        text: The text to preview
        max_length: Maximum length before truncation
        wrapper_style: Optional CSS style for wrapper div
    
    Returns:
        HTML formatted preview string
    """
    if not text:
        return '-'
    
    preview = text[:max_length] + "..." if len(text) > max_length else text
    
    if wrapper_style:
        return format_html('<div style="{}">{}</div>', wrapper_style, preview)
    return preview


def get_category_color(category, color_map):
    """
    Get color for a category from a color map.
    
    Args:
        category: The category name
        color_map: Dictionary mapping categories to colors
    
    Returns:
        Color hex code or default gray
    """
    return color_map.get(category, '#6c757d')


def format_file_size(size_bytes):
    """
    Convert bytes to human-readable file size.
    
    Args:
        size_bytes: Size in bytes
    
    Returns:
        Formatted string (e.g., "1.5 MB")
    """
    if not size_bytes:
        return '-'
    
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"

