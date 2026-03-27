const fs = require('fs');
const path = require('path');

const msgsDir = path.join(process.cwd(), 'messages');
if (fs.existsSync(msgsDir)) {
  const files = fs.readdirSync(msgsDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(msgsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Wipe everything from "bc": { onwards
      // This eliminates the corrupted blocks from `appointments`, `bc`, etc.
      content = content.replace(/,\s*"bc":\s*\{[\s\S]*/, '\n}');
      
      try {
        JSON.parse(content);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Truncated and fixed syntax for: ${file}`);
      } catch (e) {
        console.error(`Still invalid syntax in ${file}: ${e.message}`);
        // Fallback: try to forcefully strip trailing commas before }
        let cleaned = content.replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');
        try {
          JSON.parse(cleaned);
          fs.writeFileSync(filePath, cleaned, 'utf8');
          console.log(`Fixed trailing commas for: ${file}`);
        } catch (e2) {
          console.error(`Failed to completely salvage ${file}: ${e2.message}`);
        }
      }
    }
  }
}
