#!/usr/bin/env python
"""
Script para probar la configuración de logging en diferentes entornos.

Uso:
    # Development
    python scripts/test_logging.py

    # Production
    DJANGO_SETTINGS_MODULE=config.settings.production python scripts/test_logging.py
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

import logging
from django.conf import settings

def test_logging():
    """Test logging configuration"""
    
    print("=" * 80)
    print("🔍 LOGGING CONFIGURATION TEST")
    print("=" * 80)
    print()
    
    # Show current environment
    settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', 'Not set')
    print(f"📌 Settings Module: {settings_module}")
    print(f"🐛 DEBUG Mode: {settings.DEBUG}")
    print()
    
    # Show logging configuration
    logging_config = settings.LOGGING
    root_level = logging_config.get('root', {}).get('level', 'Not set')
    handlers = logging_config.get('handlers', {})
    
    print(f"📊 Root Log Level: {root_level}")
    print(f"🎯 Handlers configured: {', '.join(handlers.keys())}")
    print()
    
    # Show handler details
    print("📝 Handler Details:")
    for handler_name, handler_config in handlers.items():
        level = handler_config.get('level', 'Inherited')
        print(f"  - {handler_name}: level={level}, class={handler_config.get('class')}")
    print()
    
    # Test different log levels
    logger = logging.getLogger('apps.test')
    
    print("🧪 Testing log levels:")
    print("-" * 80)
    
    print("\n1️⃣ Testing DEBUG level:")
    logger.debug("🔍 This is a DEBUG message")
    print(f"   Expected in development: ✅ YES")
    print(f"   Expected in production: ❌ NO")
    
    print("\n2️⃣ Testing INFO level:")
    logger.info("ℹ️ This is an INFO message")
    print(f"   Expected in development: ✅ YES")
    print(f"   Expected in production: ❌ NO")
    
    print("\n3️⃣ Testing WARNING level:")
    logger.warning("⚠️ This is a WARNING message")
    print(f"   Expected in development: ✅ YES")
    print(f"   Expected in production: ✅ YES")
    
    print("\n4️⃣ Testing ERROR level:")
    logger.error("❌ This is an ERROR message")
    print(f"   Expected in development: ✅ YES")
    print(f"   Expected in production: ✅ YES")
    
    print()
    print("-" * 80)
    print()
    
    # Show recommendations
    if settings.DEBUG:
        print("✅ DEVELOPMENT MODE DETECTED")
        print("   - All logs are visible (DEBUG, INFO, WARNING, ERROR)")
        print("   - SQL queries are logged")
        print("   - Verbose output for debugging")
    else:
        print("🚀 PRODUCTION MODE DETECTED")
        print("   - Only WARNING and ERROR logs are visible")
        print("   - Logs saved to file: /app/logs/django.log")
        print("   - Optimized for performance")
        
        # Check if log directory exists
        log_file = Path('/app/logs/django.log')
        if log_file.parent.exists():
            print(f"   ✅ Log directory exists: {log_file.parent}")
        else:
            print(f"   ⚠️ Log directory does not exist: {log_file.parent}")
            print(f"   💡 Create with: mkdir -p {log_file.parent}")
    
    print()
    print("=" * 80)
    print("✅ Test completed")
    print("=" * 80)

if __name__ == '__main__':
    test_logging()

