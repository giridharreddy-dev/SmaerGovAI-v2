import re

with open('server.js', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { initializeApp, getApps, getApp } from 'firebase-admin/app';", "import { initializeApp, getApps, getApp } from 'firebase/app';")
content = content.replace("import { getFirestore } from 'firebase-admin/firestore';", "import { getFirestore, collection, doc, setDoc, addDoc, getDoc, getDocs, getCountFromServer, query, orderBy, limit as fsLimit } from 'firebase/firestore';")

# 2. Init
old_init = """  const app = initializeApp({
    projectId: firebaseConfig.projectId
  });"""
new_init = """  const app = initializeApp(firebaseConfig);"""
content = content.replace(old_init, new_init)

# 3. logRequest
content = content.replace("dbAdmin.collection('requests').doc(id).set(docData)", "setDoc(doc(dbAdmin, 'requests', id), docData)")

# 4. saveFeedback
content = content.replace("dbAdmin.collection('requests').doc(String(requestId)).get()", "getDoc(doc(dbAdmin, 'requests', String(requestId)))")
content = content.replace("dbAdmin.collection('feedback').doc(id).set(docData)", "setDoc(doc(dbAdmin, 'feedback', id), docData)")

# 5. getDashboardMetrics
old_metrics = """      const [reqSnap, fbSnap, shareSnap, allFbSnap] = await Promise.all([
        dbAdmin.collection('requests').count().get(),
        dbAdmin.collection('feedback').count().get(),
        dbAdmin.collection('whatsappShares').count().get(),
        dbAdmin.collection('feedback').get()
      ]);"""
new_metrics = """      const [reqSnap, fbSnap, shareSnap, allFbSnap] = await Promise.all([
        getCountFromServer(collection(dbAdmin, 'requests')),
        getCountFromServer(collection(dbAdmin, 'feedback')),
        getCountFromServer(collection(dbAdmin, 'whatsappShares')),
        getDocs(collection(dbAdmin, 'feedback'))
      ]);"""
content = content.replace(old_metrics, new_metrics)

# 6. getSchemeStats
content = content.replace("dbAdmin.collection('requests').get()", "getDocs(collection(dbAdmin, 'requests'))")
content = content.replace("dbAdmin.collection('feedback').get()", "getDocs(collection(dbAdmin, 'feedback'))")

# 7. enhanced-feedback / staff-report
content = content.replace("dbAdmin.collection('staffFeedback').doc(id).set(docData)", "setDoc(doc(dbAdmin, 'staffFeedback', id), docData)")

# 8. whatsapp-share
content = content.replace("dbAdmin.collection('whatsappShares').add(docData)", "addDoc(collection(dbAdmin, 'whatsappShares'), docData)")

# 9. analytics fetch
old_fetch1 = "await dbAdmin.collection('feedback').orderBy('timestamp', 'desc').limit(20).get()"
new_fetch1 = "await getDocs(query(collection(dbAdmin, 'feedback'), orderBy('timestamp', 'desc'), fsLimit(20)))"
content = content.replace(old_fetch1, new_fetch1)

old_fetch2 = "await dbAdmin.collection('staffFeedback').orderBy('timestamp', 'desc').limit(20).get()"
new_fetch2 = "await getDocs(query(collection(dbAdmin, 'staffFeedback'), orderBy('timestamp', 'desc'), fsLimit(20)))"
content = content.replace(old_fetch2, new_fetch2)

with open('server.js', 'w') as f:
    f.write(content)

