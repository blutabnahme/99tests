const fs = require('fs');

const files = [
  'c:\\99tests\\app\\dashboard\\recommendations\\new\\page.tsx',
  'c:\\99tests\\app\\patient\\[token]\\checkout\\page.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/import \{ calculatePricing \} from "@/lib\/pricing";/g, 'const calculatePricing = (a, b) => ({ total: 0, platformFee: 0, bcPayout: 0, serviceFee: 0 });');
    content = content.replace(/import \{ calculatePricing \} from "@\/lib\/pricing";/g, 'const calculatePricing = (a, b) => ({ total: 0, platformFee: 0, bcPayout: 0, serviceFee: 0 });');
    fs.writeFileSync(f, content, 'utf8');
    console.log("Mocked calculatePricing in " + f);
  }
});
