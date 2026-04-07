const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = [...walk('./app'), ...walk('./components')];

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Remove any text matching hover:-translate-y-SOMETHING or hover:translate-y-SOMETHING
    content = content.replace(/hover:-?translate-y-[^\s'"`]+/g, '');
    
    // Also remove hover:transform
    content = content.replace(/hover:transform/g, '');

    // Cleanup double spaces created by deletion inside standard strings
    content = content.replace(/  +/g, ' ');

    if (original !== content) {
        // Change transition-all to transition-colors in the SAME file where we cleaned up jitter
        content = content.replace(/transition-all/g, 'transition-colors');
        fs.writeFileSync(file, content);
        count++;
        console.log('Fixed:', file);
    }
});

console.log('Total files updated:', count);
