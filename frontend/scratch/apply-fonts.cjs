const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('src/pages/WhatIfAnalysis.jsx', 'utf8');
content = content.replace(/className="text-3xl font-bold mt-1/g, 'className="text-3xl font-bold font-mono mt-1');
content = content.replace(/className="text-3xl font-black/g, 'className="text-3xl font-black font-mono');
content = content.replace(/className="text-2xl font-bold/g, 'className="text-2xl font-bold font-mono');
fs.writeFileSync('src/pages/WhatIfAnalysis.jsx', content);

let contentRCA = fs.readFileSync('src/pages/RCA.jsx', 'utf8');
contentRCA = contentRCA.replace(/className="text-3xl font-black/g, 'className="text-3xl font-black font-mono');
contentRCA = contentRCA.replace(/rounded-full/g, 'rounded-sm');
fs.writeFileSync('src/pages/RCA.jsx', contentRCA);

let contentHub = fs.readFileSync('src/pages/DigitalFactoryHub.jsx', 'utf8');
contentHub = contentHub.replace(/rounded-full/g, 'rounded-sm');
fs.writeFileSync('src/pages/DigitalFactoryHub.jsx', contentHub);
