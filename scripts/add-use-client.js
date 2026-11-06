const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(full);
    } else if (entry.name.endsWith('.tsx') || (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') && !entry.name.includes('data.ts'))) {
      let content = fs.readFileSync(full, 'utf8');
      if (!content.startsWith('"use client"') && !content.startsWith("'use client'")) {
        console.log('Adding "use client" to', full);
        fs.writeFileSync(full, '"use client";\n' + content, 'utf8');
      }
    }
  }
}

processDir(path.join('components', 'watermelon', 'gridline-dashboard'));

