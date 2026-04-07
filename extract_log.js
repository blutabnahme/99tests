const fs = require('fs');

const logPath = "C:\\Users\\luizf\\.gemini\\antigravity\\brain\\6b498dba-817d-4c35-9d1f-5dcdd6d15268\\.system_generated\\logs\\overview.txt";
const logContent = fs.readFileSync(logPath, 'utf8');

// Find the last view_file output for the patient portal by looking for the path
const searchString = "file:///c:/99tests/app/patient/%5Btoken%5D/page.tsx`";
let pos = logContent.lastIndexOf(searchString);

if (pos === -1) {
  // try another format
  pos = logContent.lastIndexOf("c:\\99tests\\app\\patient\\[token]\\page.tsx");
}

if (pos !== -1) {
  // Start from the beginning of the file content lines
  const startPhrase = "The following code has been modified to include a line number";
  let startPos = logContent.indexOf(startPhrase, pos);
  
  if (startPos !== -1) {
    startPos = logContent.indexOf('\n', startPos) + 1; // move to next line
    
    const endPhrase = "The above content shows the entire, complete file contents";
    let endPos = logContent.indexOf(endPhrase, startPos);
    
    if (endPos !== -1) {
      const fileBlock = logContent.substring(startPos, endPos);
      const outputLines = [];
      const lines = fileBlock.split('\n');
      for (const line of lines) {
        // match line numbers like "1: ", "12: ", "800: "
        const match = line.match(/^\d+:\s(.*)/);
        if (match) {
          outputLines.push(match[1]);
        } else {
          // If it doesn't match the line number format, we just push it if it's not empty maybe?
          // Actually sometimes there are empty lines like "12: "
          if (line.match(/^\d+:$/)) {
             outputLines.push("");
          }
        }
      }
      
      fs.writeFileSync("C:\\99tests\\recovered_patient_page.tsx", outputLines.join('\n'));
      console.log("Successfully recovered " + outputLines.length + " lines!");
    } else {
      console.log("Could not find end phrase.");
    }
  } else {
    console.log("Could not find start phrase.");
  }
} else {
  console.log("Could not find view log for the file in the log history at all!");
}
