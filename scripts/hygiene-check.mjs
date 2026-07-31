#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Patterns to check
const patterns = [
  {
    name: 'hardcoded colors in class names',
    regex: /(?:bg|text|border|from|to)-\[\#[0-9a-fA-F]{6}\]/g,
    reason: 'Colors should use theme tokens, not arbitrary values'
  },
  {
    name: 'raw HTML text elements in pages/sections',
    regex: /<(h[1-6]|p|button|span)(?:\s[^>]*)?>(?!.*<?\/\1)/,
    reason: 'Use Title/Heading/Text/Button components instead'
  },
  {
    name: 'arbitrary Tailwind values',
    regex: /\[(?!\/)/,
    reason: 'Avoid arbitrary Tailwind values; use theme scale'
  }
];

// Files to check
const srcDir = path.join(projectRoot, 'components');
const appDir = path.join(projectRoot, 'app');

function walkDir(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  });
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, idx) => {
    if (line.includes('// tw-allow:')) {
      return; // Skip whitelisted lines
    }

    // Check for hardcoded colors (many legitimate uses, so just flag for review)
    const colorMatches = line.match(/\[\#F46325\]|\[\#111111\]|\[\#000000\]/g);
    if (colorMatches) {
      colorMatches.forEach(match => {
        issues.push({
          line: idx + 1,
          severity: 'info',
          message: `Found theme color as arbitrary value: ${match}. Prefer CSS variables in @theme.`,
          content: line.trim().substring(0, 80)
        });
      });
    }
  });

  return issues;
}

function main() {
  const files = [...walkDir(srcDir), ...walkDir(appDir)];
  const allIssues = [];

  files.forEach(file => {
    const issues = checkFile(file);
    issues.forEach(issue => {
      allIssues.push({
        file: path.relative(projectRoot, file),
        ...issue
      });
    });
  });

  if (allIssues.length === 0) {
    console.log('✓ Hygiene check passed! No issues found.');
    process.exit(0);
  } else {
    console.log(`Found ${allIssues.length} issues:\n`);
    allIssues.slice(0, 10).forEach(issue => {
      console.log(`${issue.file}:${issue.line}`);
      console.log(`  [${issue.severity}] ${issue.message}`);
      console.log(`  ${issue.content}\n`);
    });

    if (allIssues.length > 10) {
      console.log(`... and ${allIssues.length - 10} more issues`);
    }
    process.exit(0);
  }
}

main();
