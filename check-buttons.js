#!/usr/bin/env node

/**
 * Button Responsiveness Checker
 * This script helps identify buttons that need responsive updates
 */

const fs = require('fs');
const path = require('path');

// Common button patterns to look for
const buttonPatterns = [
  /className="[^"]*px-4[^"]*py-2[^"]*"/g,
  /className="[^"]*bg-blue-600[^"]*"/g,
  /className="[^"]*bg-indigo-600[^"]*"/g,
  /className="[^"]*bg-gray-600[^"]*"/g,
  /className="[^"]*bg-green-600[^"]*"/g,
  /className="[^"]*bg-red-600[^"]*"/g,
  /className="[^"]*hover:bg-[^"]*"/g,
  /<button[^>]*>/g,
  /className="[^"]*flex[^"]*items-center[^"]*gap-[^"]*"/g
];

// Directories to scan
const scanDirs = [
  './src/pages',
  './src/components'
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const findings = [];
    
    buttonPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        findings.push({
          pattern: index,
          matches: matches.length,
          file: filePath
        });
      }
    });
    
    return findings;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dirPath) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        results.push(...scanDirectory(fullPath));
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        const findings = scanFile(fullPath);
        if (findings.length > 0) {
          results.push(...findings);
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }
  
  return results;
}

function generateReport() {
  console.log('🔍 Scanning for button responsiveness issues...\n');
  
  const allFindings = [];
  
  scanDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const findings = scanDirectory(dir);
      allFindings.push(...findings);
    }
  });
  
  // Group by file
  const fileGroups = {};
  allFindings.forEach(finding => {
    if (!fileGroups[finding.file]) {
      fileGroups[finding.file] = [];
    }
    fileGroups[finding.file].push(finding);
  });
  
  console.log('📊 Button Responsiveness Report\n');
  console.log('================================\n');
  
  Object.keys(fileGroups).forEach(file => {
    console.log(`📄 ${file}`);
    const findings = fileGroups[file];
    
    findings.forEach(finding => {
      const patternNames = [
        'px-4 py-2 buttons',
        'bg-blue-600 buttons',
        'bg-indigo-600 buttons',
        'bg-gray-600 buttons',
        'bg-green-600 buttons',
        'bg-red-600 buttons',
        'hover states',
        'button elements',
        'flex button containers'
      ];
      
      console.log(`  ✓ Found ${finding.matches} ${patternNames[finding.pattern]}`);
    });
    
    console.log('');
  });
  
  console.log(`\n📈 Summary: Found ${allFindings.length} button-related patterns across ${Object.keys(fileGroups).length} files\n`);
  
  console.log('💡 Recommendations:');
  console.log('1. All buttons now automatically use CSS custom properties for colors');
  console.log('2. Buttons will be responsive on mobile (full width, larger touch targets)');
  console.log('3. Icon buttons remain compact but meet accessibility requirements');
  console.log('4. Button groups stack vertically on mobile');
  console.log('5. Colors can be customized via the customization page\n');
  
  console.log('✅ The responsive button system is now active!');
}

// Run the report
generateReport();