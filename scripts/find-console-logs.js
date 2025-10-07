#!/usr/bin/env node
/**
 * Find all console.log, console.warn, console.error statements
 * that need to be migrated to logger
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const SCAN_DIRS = [
  'apps/core/static/core/js/components',
  'apps/core/static/core/js/pages',
  'apps/core/static/core/js/core'
];

// Files to exclude
const EXCLUDE_FILES = [
  'Logger.js', // The logger itself
  'find-console-logs.js' // This script
];

// Patterns to find
const CONSOLE_PATTERNS = [
  /console\.log\(/g,
  /console\.debug\(/g,
  /console\.info\(/g,
  /console\.warn\(/g,
  /console\.error\(/g
];

class ConsoleFinder {
  constructor() {
    this.results = [];
    this.stats = {
      totalFiles: 0,
      filesWithConsole: 0,
      totalConsoleStatements: 0,
      byType: {
        log: 0,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0
      }
    };
  }

  scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        if (EXCLUDE_FILES.some(exclude => entry.name.includes(exclude))) {
          continue;
        }
        this.scanFile(fullPath);
      }
    }
  }

  scanFile(filePath) {
    this.stats.totalFiles++;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
      CONSOLE_PATTERNS.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const type = match[0].replace('console.', '').replace('(', '');
          
          matches.push({
            line: index + 1,
            type,
            code: line.trim(),
            column: line.indexOf(match[0])
          });

          this.stats.totalConsoleStatements++;
          this.stats.byType[type]++;
        }
      });
    });

    if (matches.length > 0) {
      this.stats.filesWithConsole++;
      this.results.push({
        file: filePath,
        matches
      });
    }
  }

  printResults() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         Console Statement Migration Report                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Files scanned:        ${this.stats.totalFiles}`);
    console.log(`   Files with console:   ${this.stats.filesWithConsole}`);
    console.log(`   Total statements:     ${this.stats.totalConsoleStatements}`);
    console.log('');
    console.log('   By type:');
    console.log(`     console.log:        ${this.stats.byType.log}`);
    console.log(`     console.debug:      ${this.stats.byType.debug}`);
    console.log(`     console.info:       ${this.stats.byType.info}`);
    console.log(`     console.warn:       ${this.stats.byType.warn}`);
    console.log(`     console.error:      ${this.stats.byType.error}`);
    console.log('');

    // Details
    if (this.results.length > 0) {
      console.log('📝 FILES TO MIGRATE:\n');

      this.results.forEach(({ file, matches }) => {
        const relPath = path.relative(process.cwd(), file);
        console.log(`\n  📄 ${relPath}`);
        console.log(`     ${matches.length} statement(s):\n`);

        matches.forEach(({ line, type, code }) => {
          const icon = this.getTypeIcon(type);
          console.log(`     ${icon} Line ${line}: ${code}`);
        });
      });

      console.log('\n');
      console.log('─'.repeat(65));
      console.log('\n✅ MIGRATION CHECKLIST:\n');
      
      this.results.forEach(({ file }) => {
        const relPath = path.relative(process.cwd(), file);
        console.log(`  [ ] ${relPath}`);
      });
    } else {
      console.log('✅ No console statements found! Migration complete.\n');
    }

    // Next steps
    console.log('\n📚 NEXT STEPS:\n');
    console.log('  1. Import logger: import { logger } from "@js/core/logger/Logger.js"');
    console.log('  2. Create child logger in constructor if it\'s a component');
    console.log('  3. Replace console.log → logger.debug');
    console.log('  4. Replace console.info → logger.info');
    console.log('  5. Replace console.warn → logger.warn');
    console.log('  6. Replace console.error → logger.error');
    console.log('  7. Remove emojis (logger adds them automatically)');
    console.log('  8. Add useful data as second parameter');
    console.log('\n  See: docs/LOGGER_MIGRATION_GUIDE.md for details\n');
  }

  getTypeIcon(type) {
    const icons = {
      log: '📝',
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    return icons[type] || '•';
  }

  generateMarkdownReport() {
    let md = '# Console Statement Migration Status\n\n';
    md += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    md += '## Summary\n\n';
    md += `- Files scanned: ${this.stats.totalFiles}\n`;
    md += `- Files with console statements: ${this.stats.filesWithConsole}\n`;
    md += `- Total console statements: ${this.stats.totalConsoleStatements}\n\n`;
    
    md += '### By Type\n\n';
    md += `- console.log: ${this.stats.byType.log}\n`;
    md += `- console.debug: ${this.stats.byType.debug}\n`;
    md += `- console.info: ${this.stats.byType.info}\n`;
    md += `- console.warn: ${this.stats.byType.warn}\n`;
    md += `- console.error: ${this.stats.byType.error}\n\n`;
    
    if (this.results.length > 0) {
      md += '## Files to Migrate\n\n';
      
      this.results.forEach(({ file, matches }) => {
        const relPath = path.relative(process.cwd(), file);
        md += `### ${relPath}\n\n`;
        md += `**Statements:** ${matches.length}\n\n`;
        
        matches.forEach(({ line, type, code }) => {
          md += `- Line ${line} \`${type}\`: \`${code}\`\n`;
        });
        
        md += '\n';
      });
      
      md += '## Migration Checklist\n\n';
      this.results.forEach(({ file }) => {
        const relPath = path.relative(process.cwd(), file);
        md += `- [ ] ${relPath}\n`;
      });
    } else {
      md += '## ✅ Migration Complete\n\n';
      md += 'No console statements found!\n';
    }
    
    return md;
  }

  saveReport(filename = 'CONSOLE_MIGRATION_STATUS.md') {
    const report = this.generateMarkdownReport();
    fs.writeFileSync(filename, report);
    console.log(`\n📝 Report saved to: ${filename}\n`);
  }

  run() {
    console.log('🔍 Scanning for console statements...\n');
    
    SCAN_DIRS.forEach(dir => {
      console.log(`   Scanning: ${dir}`);
      this.scanDirectory(dir);
    });

    this.printResults();
    this.saveReport();
  }
}

// Run if executed directly
if (require.main === module) {
  const finder = new ConsoleFinder();
  finder.run();
}

module.exports = ConsoleFinder;

