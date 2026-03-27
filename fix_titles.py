import os

app_dir = r"c:\Blutabnahme\app"
for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.jsx'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            if 'className="page-title"' in content or ' page-title"' in content:
                content = content.replace('className="page-title"', 'className="hidden sm:block"')
                content = content.replace(' page-title"', '"')
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(content)
print("Fix executed")
