const fs = require('fs');

const path = 'server.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    "let totalFeedback = db.feedback.length;\n  let totalShares = db.whatsappShares.length;",
    "let totalFeedback = db.feedback.length;\n  let totalGrievances = db.staffFeedback.length;\n  let totalShares = db.whatsappShares.length;"
);

content = content.replace(
    "const [reqSnap, fbSnap, shareSnap, allFbSnap] = await Promise.all([",
    "const [reqSnap, fbSnap, shareSnap, staffSnap, allFbSnap] = await Promise.all(["
);

content = content.replace(
    "getCountFromServer(collection(dbAdmin, 'whatsappShares')),\n        getDocs(collection(dbAdmin, 'feedback'))",
    "getCountFromServer(collection(dbAdmin, 'whatsappShares')),\n        getCountFromServer(collection(dbAdmin, 'staffFeedback')),\n        getDocs(collection(dbAdmin, 'feedback'))"
);

content = content.replace(
    "totalShares = shareSnap.data().count;",
    "totalShares = shareSnap.data().count;\n      totalGrievances = staffSnap.data().count;"
);

content = content.replace(
    "return { total_requests: totalRequests, total_feedback: totalFeedback, avg_rating: avgRating, total_shares: totalShares };",
    "return { total_requests: totalRequests, total_feedback: totalFeedback, total_grievances: totalGrievances, avg_rating: avgRating, total_shares: totalShares };"
);

content = content.replace(
    "total_feedback: totalFeedback,\n    avg_rating: avgRating,\n    total_shares: totalShares,\n  };",
    "total_feedback: totalFeedback,\n    total_grievances: totalGrievances,\n    avg_rating: avgRating,\n    total_shares: totalShares,\n  };"
);

fs.writeFileSync(path, content, 'utf8');
console.log('patched');
