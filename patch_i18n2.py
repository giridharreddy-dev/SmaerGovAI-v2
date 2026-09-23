import re

with open('public/js/i18n.js', 'r', encoding='utf-8') as f:
    content = f.read()

te_add = """
            // Compare
            compareSchemes: 'పోల్చి చూడండి',
            compareModalTitle: 'పథకాల పోలిక',
            compareSelect1: 'మొదటి పథకం',
            compareSelect2: 'రెండవ పథకం',
"""

en_add = """
            // Compare
            compareSchemes: 'Compare Schemes',
            compareModalTitle: 'Compare Schemes',
            compareSelect1: 'First Scheme',
            compareSelect2: 'Second Scheme',
"""

content = re.sub(r'(appTitle:\s*\'SmartGovAI\',)', r'\1' + te_add, content, count=1)

# we need to find the 'en' section.
content = re.sub(r'(appTitle:\s*\'SmartGovAI Healthcare\',)', r'\1' + en_add, content, count=1)

with open('public/js/i18n.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("i18n patched 2.")
