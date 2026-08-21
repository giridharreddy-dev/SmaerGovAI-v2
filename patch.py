import re

with open('server.js', 'r') as f:
    content = f.read()

# 1. Replace logRequest and saveFeedback block
new_db_functions = """let nextRequestId = 1;
let nextFeedbackId = 1;

function logRequest(schemeName, source) {
  const id = crypto.randomUUID();
  const docData = {
    id,
    scheme_name: schemeName,
    source,
    timestamp: new Date().toISOString(),
  };
  db.requests.push(docData);
  if (dbAdmin) {
    dbAdmin.collection('requests').doc(id).set(docData).catch(err => console.error("Firebase err:", err));
  }
  return id;
}

async function saveFeedback(requestId, rating, comment = '') {
  const id = crypto.randomUUID();
  let scheme_name = '';
  const reqMemory = db.requests.find((r) => String(r.id) === String(requestId));
  if (reqMemory) {
    scheme_name = reqMemory.scheme_name;
  } else if (dbAdmin) {
    try {
      const reqDoc = await dbAdmin.collection('requests').doc(String(requestId)).get();
      if (reqDoc.exists) {
        scheme_name = reqDoc.data().scheme_name;
      }
    } catch(e) {}
  }
  
  const docData = {
    id,
    request_id: requestId,
    scheme_name: scheme_name || 'Unknown',
    rating: Number(rating) || 0,
    comment,
    timestamp: new Date().toISOString(),
  };
  db.feedback.push(docData);
  if (dbAdmin) {
    await dbAdmin.collection('feedback').doc(id).set(docData).catch(err => console.error("Firebase err:", err));
  }
  return id;
}

async function getDashboardMetrics() {
  let totalRequests = db.requests.length;
  let totalFeedback = db.feedback.length;
  let totalShares = db.whatsappShares.length;
  let avgRating = 0;

  if (dbAdmin) {
    try {
      const [reqSnap, fbSnap, shareSnap, allFbSnap] = await Promise.all([
        dbAdmin.collection('requests').count().get(),
        dbAdmin.collection('feedback').count().get(),
        dbAdmin.collection('whatsappShares').count().get(),
        dbAdmin.collection('feedback').get()
      ]);
      totalRequests = reqSnap.data().count;
      totalFeedback = fbSnap.data().count;
      totalShares = shareSnap.data().count;
      
      let sum = 0;
      allFbSnap.forEach(d => { sum += (d.data().rating || 0); });
      if (totalFeedback > 0) {
        avgRating = Number((sum / totalFeedback).toFixed(1));
      }
      return { total_requests: totalRequests, total_feedback: totalFeedback, avg_rating: avgRating, total_shares: totalShares };
    } catch (e) { console.error('Firebase count error:', e); }
  }

  if (totalFeedback > 0) {
    const sum = db.feedback.reduce((acc, f) => acc + (f.rating || 0), 0);
    avgRating = Number((sum / totalFeedback).toFixed(1));
  }
  return {
    total_requests: totalRequests,
    total_feedback: totalFeedback,
    avg_rating: avgRating,
    total_shares: totalShares,
  };
}

async function getSchemeStats() {
  const counts = {};
  const ratings = {};
  const ratingCounts = {};

  if (dbAdmin) {
    try {
      const reqs = await dbAdmin.collection('requests').get();
      reqs.forEach(d => {
        const data = d.data();
        counts[data.scheme_name] = (counts[data.scheme_name] || 0) + 1;
      });
      const fbs = await dbAdmin.collection('feedback').get();
      fbs.forEach(d => {
        const data = d.data();
        if (data.scheme_name && data.scheme_name !== 'Unknown') {
          ratings[data.scheme_name] = (ratings[data.scheme_name] || 0) + data.rating;
          ratingCounts[data.scheme_name] = (ratingCounts[data.scheme_name] || 0) + 1;
        }
      });
    } catch(e) { console.error(e); }
  } else {
    for (const r of db.requests) {
      counts[r.scheme_name] = (counts[r.scheme_name] || 0) + 1;
    }
    for (const f of db.feedback) {
      const req = db.requests.find((r) => String(r.id) === String(f.request_id));
      const sName = f.scheme_name && f.scheme_name !== 'Unknown' ? f.scheme_name : (req ? req.scheme_name : null);
      if (sName) {
        ratings[sName] = (ratings[sName] || 0) + f.rating;
        ratingCounts[sName] = (ratingCounts[sName] || 0) + 1;
      }
    }
  }

  const result = [];
  for (const [name, count] of Object.entries(counts)) {
    let avg = null;
    if (ratingCounts[name]) {
      avg = (ratings[name] / ratingCounts[name]).toFixed(1);
    }
    result.push({ name, count, rating: avg });
  }
  result.sort((a, b) => b.count - a.count);
  return result;
}"""

content = re.sub(r'let nextRequestId = 1;.*?function getSchemeStats\(\) \{.*?\n\}', new_db_functions, content, flags=re.DOTALL)

# 2. Update Endpoints
# app.post('/feedback', (req, res) => {
feedback_route = """app.post('/feedback', async (req, res) => {
  const { request_id, rating, comment = '' } = req.body;
  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  const id = await saveFeedback(request_id, rating, comment);
  res.json({ status: 'success', feedback_id: id });
});"""
content = re.sub(r"app\.post\('/feedback', \(req, res\) => \{.*?res\.json\(\{ status: 'success', feedback_id: id \}\);\n\}\);", feedback_route, content, flags=re.DOTALL)

enhanced_route = """app.post('/enhanced-feedback', async (req, res) => {
  const { scheme_name, rating, feedback_text = '', village = '', issue_type = 'general' } = req.body;
  const id = crypto.randomUUID();
  const docData = {
    id,
    scheme_name: scheme_name || '',
    village,
    feedback_text,
    issue_type,
    rating: Number(rating) || 5,
    timestamp: new Date().toISOString(),
  };
  db.staffFeedback.push(docData);
  if (dbAdmin) {
    await dbAdmin.collection('staffFeedback').doc(id).set(docData).catch(()=> {});
  }
  res.json({ status: 'success', id });
});"""
content = re.sub(r"app\.post\('/enhanced-feedback', \(req, res\) => \{.*?res\.json\(\{ status: 'success', id \}\);\n\}\);", enhanced_route, content, flags=re.DOTALL)

staff_route = """app.post('/staff-report', async (req, res) => {
  const { scheme_name, village = '', feedback_text = '', issue_type = 'grievance' } = req.body;
  const id = crypto.randomUUID();
  const docData = {
    id,
    scheme_name: scheme_name || '',
    village,
    feedback_text,
    issue_type,
    timestamp: new Date().toISOString(),
  };
  db.staffFeedback.push(docData);
  if (dbAdmin) {
    await dbAdmin.collection('staffFeedback').doc(id).set(docData).catch(()=> {});
  }
  res.json({ status: 'success', id });
});"""
content = re.sub(r"app\.post\('/staff-report', \(req, res\) => \{.*?res\.json\(\{ status: 'success', id \}\);\n\}\);", staff_route, content, flags=re.DOTALL)

whatsapp_route = """app.post('/whatsapp-share', async (req, res) => {
  const { scheme_name } = req.body;
  if (scheme_name) {
    const docData = {
      scheme_name,
      timestamp: new Date().toISOString(),
    };
    db.whatsappShares.push(docData);
    if (dbAdmin) {
      await dbAdmin.collection('whatsappShares').add(docData).catch(()=> {});
    }
  }
  res.json({ status: 'success' });
});"""
content = re.sub(r"app\.post\('/whatsapp-share', \(req, res\) => \{.*?res\.json\(\{ status: 'success' \}\);\n\}\);", whatsapp_route, content, flags=re.DOTALL)


# 3. Update Analytics
analytics_route = """app.get('/analytics', requireAdmin, async (req, res) => {
  const metrics = await getDashboardMetrics();
  const stats = await getSchemeStats();
  
  let recentFeedback = (db.feedback || []).slice(-20).reverse();
  let grievances = (db.staffFeedback || []).slice(-20).reverse();

  if (dbAdmin) {
    try {
      const fbSnap = await dbAdmin.collection('feedback').orderBy('timestamp', 'desc').limit(20).get();
      recentFeedback = [];
      fbSnap.forEach(d => recentFeedback.push(d.data()));

      const staffSnap = await dbAdmin.collection('staffFeedback').orderBy('timestamp', 'desc').limit(20).get();
      grievances = [];
      staffSnap.forEach(d => grievances.push(d.data()));
    } catch (e) { console.error('Firebase analytics fetch error:', e); }
  }

  const csrfToken = req.session.csrf_token || crypto.randomBytes(16).toString('hex');
  req.session.csrf_token = csrfToken;
  res.render('analytics', { metrics, stats, recentFeedback, grievances, csrf_token: csrfToken });
});"""
content = re.sub(r"app\.get\('/analytics', requireAdmin, \(req, res\) => \{.*?res\.render\('analytics', \{ metrics, stats, recentFeedback, grievances, csrf_token: csrfToken \}\);\n\}\);", analytics_route, content, flags=re.DOTALL)

with open('server.js', 'w') as f:
    f.write(content)
