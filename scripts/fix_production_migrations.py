#!/usr/bin/env python
"""
Script para sincronizar el estado de las migraciones en producción.

Este script ayuda a resolver problemas donde la tabla documents_document_sdgs
ya existe en la base de datos pero Django no tiene registrada la migración 0010.

Uso:
    python manage.py shell < scripts/fix_production_migrations.py

O desde el shell de Django:
    python manage.py shell
    >>> exec(open('scripts/fix_production_migrations.py').read())
"""

from django.db import connection
from django.db.migrations.recorder import MigrationRecorder


def check_table_exists(table_name):
    """Verifica si una tabla existe en la base de datos"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]


def check_migration_applied(app_name, migration_name):
    """Verifica si una migración está registrada en Django"""
    return MigrationRecorder.Migration.objects.filter(
        app=app_name,
        name=migration_name
    ).exists()


def fake_apply_migration(app_name, migration_name):
    """Marca una migración como aplicada sin ejecutarla"""
    MigrationRecorder.Migration.objects.get_or_create(
        app=app_name,
        name=migration_name
    )
    print(f"✓ Migración {app_name}.{migration_name} marcada como aplicada")


def main():
    print("=" * 70)
    print("Script de sincronización de migraciones - SpiderHub")
    print("=" * 70)
    print()
    
    # Verificar si la tabla existe
    table_exists = check_table_exists('documents_document_sdgs')
    print(f"¿Tabla 'documents_document_sdgs' existe? {table_exists}")
    
    # Verificar si la migración 0010 está aplicada
    migration_applied = check_migration_applied('documents', '0010_documentsdg_alter_document_sdgs_and_more')
    print(f"¿Migración 0010 aplicada? {migration_applied}")
    
    # Verificar si la migración 0011 está aplicada (si existía)
    migration_011_applied = check_migration_applied('documents', '0011_add_relevance_to_existing_sdg_table')
    print(f"¿Migración 0011 aplicada? {migration_011_applied}")
    
    print()
    
    # Caso 1: Tabla existe pero migración 0010 no está registrada
    if table_exists and not migration_applied:
        print("⚠️  SITUACIÓN DETECTADA:")
        print("   La tabla existe pero la migración 0010 no está registrada.")
        print("   Esto causará errores al intentar aplicar migraciones.")
        print()
        print("🔧 SOLUCIÓN:")
        print("   Marcando la migración 0010 como aplicada...")
        fake_apply_migration('documents', '0010_documentsdg_alter_document_sdgs_and_more')
        
        # Si la migración 0011 existe en el registro, eliminarla
        if migration_011_applied:
            print("   Eliminando registro de migración 0011 obsoleta...")
            MigrationRecorder.Migration.objects.filter(
                app='documents',
                name='0011_add_relevance_to_existing_sdg_table'
            ).delete()
            print("✓ Migración 0011 eliminada del registro")
    
    # Caso 2: Todo está sincronizado
    elif table_exists and migration_applied:
        print("✓ Todo está sincronizado correctamente.")
        print("  La tabla existe y la migración está registrada.")
        
        # Limpiar migración 0011 si existe
        if migration_011_applied:
            print()
            print("⚠️  Limpiando migración 0011 obsoleta...")
            MigrationRecorder.Migration.objects.filter(
                app='documents',
                name='0011_add_relevance_to_existing_sdg_table'
            ).delete()
            print("✓ Migración 0011 eliminada del registro")
    
    # Caso 3: Instalación nueva
    elif not table_exists and not migration_applied:
        print("ℹ️  Instalación nueva detectada.")
        print("   Ejecute 'python manage.py migrate' para aplicar las migraciones.")
    
    # Caso 4: Situación inconsistente
    else:
        print("⚠️  SITUACIÓN INCONSISTENTE:")
        print("   La migración está registrada pero la tabla no existe.")
        print("   Considere ejecutar 'python manage.py migrate' nuevamente.")
    
    print()
    print("=" * 70)
    print("Script completado")
    print("=" * 70)


if __name__ == '__main__':
    main()

# Si se ejecuta desde shell, llamar a main()
try:
    main()
except NameError:
    # Si hay error, probablemente se está importando, no ejecutando
    pass

