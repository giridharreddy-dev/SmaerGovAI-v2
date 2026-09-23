import re

with open('public/js/i18n.js', 'r', encoding='utf-8') as f:
    content = f.read()

te_add = """    compareSchemes: 'పోల్చి చూడండి',
    compareModalTitle: 'పథకాల పోలిక',
    compareSelect1: 'మొదటి పథకం',
    compareSelect2: 'రెండవ పథకం',
"""

en_add = """    compareSchemes: 'Compare Schemes',
    compareModalTitle: 'Compare Schemes',
    compareSelect1: 'First Scheme',
    compareSelect2: 'Second Scheme',
"""

content = content.replace("    // Fallbacks", te_add + "    // Fallbacks")
content = content.replace("    // En Fallbacks", en_add + "    // En Fallbacks")

with open('public/js/i18n.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("i18n patched.")
