# Generated manually

from django.db import migrations, models
import django.contrib.postgres.search
import django.contrib.postgres.indexes


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0010_documentsdg_alter_document_sdgs_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            # Add columns if they don't exist
            sql="""
                -- Add relevance_score column if it doesn't exist
                ALTER TABLE documents_document_sdgs 
                ADD COLUMN IF NOT EXISTS relevance_score double precision DEFAULT 1.0;
                
                -- Add justification column if it doesn't exist
                ALTER TABLE documents_document_sdgs 
                ADD COLUMN IF NOT EXISTS justification text;
                
                -- Add justification_normalized column if it doesn't exist
                ALTER TABLE documents_document_sdgs 
                ADD COLUMN IF NOT EXISTS justification_normalized text;
                
                -- Add search_vector column if it doesn't exist
                ALTER TABLE documents_document_sdgs 
                ADD COLUMN IF NOT EXISTS search_vector tsvector;
                
                -- Add created_at column if it doesn't exist
                ALTER TABLE documents_document_sdgs 
                ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT NOW();
                
                -- Add updated_at column if it doesn't exist
                ALTER TABLE documents_document_sdgs 
                ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT NOW();
            """,
            reverse_sql="""
                ALTER TABLE documents_document_sdgs DROP COLUMN IF EXISTS relevance_score;
                ALTER TABLE documents_document_sdgs DROP COLUMN IF EXISTS justification;
                ALTER TABLE documents_document_sdgs DROP COLUMN IF EXISTS justification_normalized;
                ALTER TABLE documents_document_sdgs DROP COLUMN IF EXISTS search_vector;
                ALTER TABLE documents_document_sdgs DROP COLUMN IF EXISTS created_at;
                ALTER TABLE documents_document_sdgs DROP COLUMN IF EXISTS updated_at;
            """
        ),
    ]

