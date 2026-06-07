import os
import re

files = [
    r'c:\Users\omert\Desktop\TrexFactory-frontend\TrexFactory\frontend\src\pages\DigitalFactoryHub.jsx',
    r'c:\Users\omert\Desktop\TrexFactory-frontend\TrexFactory\frontend\src\pages\FinancialReport.jsx',
    r'c:\Users\omert\Desktop\TrexFactory-frontend\TrexFactory\frontend\src\pages\OEEAnalysis.jsx',
    r'c:\Users\omert\Desktop\TrexFactory-frontend\TrexFactory\frontend\src\pages\RCA.jsx'
]

replacements = [
    (r'bg-white dark:bg-dark-surface', r'bg-[#161b22]'),
    (r'bg-white/50 dark:bg-dark-bg/50', r'bg-white/5'),
    (r'bg-gray-50 dark:bg-gray-800/50', r'bg-[#0d1117]'),
    (r'bg-gray-50 dark:bg-dark-bg', r'bg-[#0d1117]'),
    (r'border-gray-200 dark:border-dark-border', r'border-white/10'),
    (r'border-gray-100 dark:border-dark-border', r'border-white/5'),
    (r'border-gray-100 dark:border-gray-800', r'border-white/5'),
    (r'border-gray-300 dark:border-gray-600', r'border-white/20'),
    (r'text-gray-900 dark:text-white', r'text-white'),
    (r'text-gray-900 dark:text-gray-200', r'text-white'),
    (r'text-gray-800 dark:text-gray-200', r'text-white/90'),
    (r'text-gray-700 dark:text-gray-300', r'text-white/80'),
    (r'text-gray-600 dark:text-gray-300', r'text-white/70'),
    (r'text-gray-600 dark:text-gray-400', r'text-white/60'),
    (r'text-gray-500 dark:text-gray-400', r'text-white/50'),
    (r'text-gray-500 dark:text-dark-muted', r'text-white/40'),
    (r'text-gray-900', r'text-white'),
    (r'text-gray-800', r'text-white/90'),
    (r'text-gray-700', r'text-white/80'),
    (r'text-gray-600', r'text-white/70'),
    (r'text-gray-500', r'text-white/50'),
    (r'text-gray-400', r'text-white/40'),
    (r'dark:text-white', r'text-white'),
    (r'dark:text-dark-muted', r'text-white/40'),
    (r'dark:bg-dark-surface', r'bg-[#161b22]'),
    (r'dark:border-dark-border', r'border-white/10'),
    (r'dark:bg-dark-bg', r'bg-[#0d1117]'),
    (r'bg-gray-100', r'bg-white/5'),
    (r'bg-gray-50', r'bg-[#0d1117]'),
    (r'border-gray-200', r'border-white/10'),
    (r'border-gray-100', r'border-white/5'),
    (r'className="p-6 h-full overflow-y-auto custom-scrollbar"', r'className="p-6 h-full overflow-y-auto custom-scrollbar bg-[#0a0d12]"'),
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated theme classes for all 4 files.")
