import os
import re

files = [
    'app/dashboard/page.tsx',
    'app/dashboard/billing/InvoiceHistoryTable.tsx',
    'app/dashboard/billing/page.tsx',
    'app/dashboard/invoices/page.tsx',
    'app/dashboard/notifications/page.tsx',
    'app/dashboard/patients/page.tsx',
    'app/dashboard/patients/[id]/page.tsx',
    'app/dashboard/recommendations/page.tsx',
    'app/dashboard/recommendations/[id]/page.tsx',
    'app/dashboard/recommendations/[id]/matching/MatchingShortlistClient.tsx',
    'app/patient/[token]/receipt/page.tsx',
    'app/portal/profile/page.tsx',
    'components/dashboard/DoctorConfirmationBanner.tsx',
    'components/dashboard/RecentRecommendationsTable.tsx',
    'components/dashboard/RecommendationsOverviewTable.tsx',
    'components/dashboard/RequestCard.tsx',
    'components/dashboard/wizard/WizardStep1.tsx',
    'components/dashboard/wizard/WizardStep3.tsx',
    'components/dashboard/wizard/WizardStep4.tsx',
    'components/ui/CookieConsent.tsx'
]

def add_import(content):
    if "import { formatDate }" not in content and "from '@/lib/format-date'" not in content:
        lines = content.split('\n')
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        lines.insert(last_import + 1, "import { formatDate } from '@/lib/format-date';")
        return '\n'.join(lines)
    return content

for path in files:
    if not os.path.exists(path):
        print(f'Missing: {path}')
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # 1. Remove local functions
    content = re.sub(r'function formatDateShort\(iso:\s*string\):\s*string\s*\{[^}]+\}', '', content)
    content = re.sub(r'function formatDate\(iso:\s*string\):\s*string\s*\{[^}]+\}', '', content)
    
    # 2. Pattern replacements
    # new Date(X).toLocaleDateString(...)
    content = re.sub(r'new Date\(([^)]+)\)\.toLocaleDateString\([^)]*\)', r'formatDate(\1)', content)
    # new Date(X).toLocaleString(...)
    content = re.sub(r'new Date\(([^)]+)\)\.toLocaleString\([^)]*\)', r'formatDate(\1)', content)
    
    # variable.toLocaleDateString(...)
    # For data.patient.date_of_birth, it's already formatDate(data...) in profile/page.tsx
    content = re.sub(r'([a-zA-Z0-9_\.]+)\.toLocaleDateString\([^)]*\)', r'formatDate(\1)', content)
    content = re.sub(r'([a-zA-Z0-9_\.]+)\.toLocaleString\([^)]*\)', r'formatDate(\1)', content)
    content = re.sub(r'([a-zA-Z0-9_\.]+)\.toLocaleTimeString\([^)]*\)', r'""', content)
    
    content = re.sub(r'formatDateShort\(', r'formatDate(', content)

    if content != original:
        content = add_import(content)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated: {path}')
