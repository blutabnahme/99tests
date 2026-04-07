const fs = require('fs');

const p = "C:/Users/luizf/.gemini/antigravity/brain/6b498dba-817d-4c35-9d1f-5dcdd6d15268/.system_generated/logs/overview.txt";
try {
  const c = fs.readFileSync(p, 'utf8');
  let pos = c.indexOf("file:///c:/99tests/app/patient/%5Btoken%5D/page.tsx");
  if (pos !== -1) {
    console.log("Found in log!");
    // Extract
    const startPhrase = "The following code has been modified to include a line number before every line";
    let startPos = c.lastIndexOf(startPhrase, pos);
    if(startPos === -1) startPos = c.indexOf(startPhrase, pos);
    
    if (startPos !== -1) {
      startPos = c.indexOf('\n', startPos) + 1;
      const endPhrase = "The above content shows the entire, complete file contents of the requested file.";
      let endPos = c.indexOf(endPhrase, startPos);
      if (endPos !== -1) {
        const block = c.substring(startPos, endPos);
        const lines = block.split('\n');
        let out = [];
        for(let l of lines) {
           let m = l.match(/^\d+:\s?(.*)/);
           if(m) out.push(m[1]);
        }
        fs.writeFileSync('C:/99tests/recovered.tsx', out.join('\n'));
        console.log("Wrote " + out.length + " lines!");
      }
    }
  } else {
    console.log("Not found in log :(");
  }
} catch(e) {
  console.log("Error reading file: " + e.message);
}
