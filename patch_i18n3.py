import re

with open('public/js/i18n.js', 'r', encoding='utf-8') as f:
    content = f.read()

en_add = """
            // Compare
            compareSchemes: 'Compare Schemes',
            compareModalTitle: 'Compare Schemes',
            compareSelect1: 'First Scheme',
            compareSelect2: 'Second Scheme',
"""

content = re.sub(r'(en: \{\s*// App Shell & Header\s*appTitle: \'SmartGovAI\',)', r'\1' + en_add, content, count=1)

with open('public/js/i18n.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("i18n patched 3.")
