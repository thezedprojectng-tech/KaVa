import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'C:\\Users\\Zayd Tahir\\.gemini\\antigravity\\brain\\8f11da39-ba27-458b-af6e-84e43f7003ef\\screenshots';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const views = [
  { name: 'ea-map', route: '/' },
  { name: 'ea-list', route: '/' },
  { name: 'interview-section-a', route: '/?view=/wizard' },
  { name: 'review-queue', route: '/?view=/review' },
  { name: 'responses-page', route: '/?view=/responses' },
  { name: 'users-page', route: '/?view=/staff' },
];

const viewports = [
  { label: 'desktop', width: 1920, height: 1080 },
  { label: 'mobile', width: 390, height: 844 }
];

const themes = ['light', 'dark'];

for (const theme of themes) {
  for (const vp of viewports) {
    for (const v of views) {
      const filename = `${v.name}-${theme}-${vp.label}.png`;
      const outPath = path.join(outputDir, filename);
      
      const separator = v.route.includes('?') ? '&' : '?';
      const url = `http://localhost:3000${v.route}${separator}theme=${theme}`;
      
      const cmd = `"${chromePath}" --headless=new --disable-gpu --virtual-time-budget=4000 --window-size=${vp.width},${vp.height} --screenshot="${outPath}" "${url}"`;
      
      console.log(`Capturing: ${filename} from ${url}`);
      try {
        execSync(cmd, { stdio: 'ignore', timeout: 30000 });
        console.log(`✓ Saved ${filename}`);
      } catch (err) {
        console.error(`✗ Error capturing ${filename}:`, err.message);
      }
    }
  }
}

console.log('All screenshots completed.');

