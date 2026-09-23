import re

with open('views/portal.ejs', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"(restoreDocumentChecks\(\);\s*)(document\.getElementById\('resultArea'\)\.scrollIntoView\(\{[\s\S]*?\}\);)"
replacement = r"\1if (!preventScroll) {\n            \2\n        }"
content = re.sub(pattern, replacement, content)

with open('views/portal.ejs', 'w', encoding='utf-8') as f:
    f.write(content)
