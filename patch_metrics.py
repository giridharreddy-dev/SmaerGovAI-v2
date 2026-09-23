import re

with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("let totalFeedback = db.feedback.length;", "let totalFeedback = db.feedback.length;\n  let totalGrievances = db.staffFeedback.length;")
content = content.replace("getCountFromServer(collection(dbAdmin, 'whatsappShares')),", "getCountFromServer(collection(dbAdmin, 'whatsappShares')),\n        getCountFromServer(collection(dbAdmin, 'staffFeedback')),")

content = content.replace("totalShares = shareSnap.data().count;", "totalShares = shareSnap.data().count;\n      const staffSnap = arguments[0]; // will just use manual array access\n")

# better way:
content = re.sub(
    r"const \[reqSnap, fbSnap, shareSnap, allFbSnap\] = await Promise.all\(\[(.*?)\]\);",
    r"const [reqSnap, fbSnap, shareSnap, staffSnap, allFbSnap] = await Promise.all([\1, getCountFromServer(collection(dbAdmin, 'staffFeedback'))]);",
    content,
    flags=re.DOTALL
)

# wait I can just do this manually in sed or python

