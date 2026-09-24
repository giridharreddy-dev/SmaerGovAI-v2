import express from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { getDocs, collection, doc, setDoc, deleteDoc, query, orderBy, limit as fsLimit } from 'firebase/firestore';

export function createAdminRouter({ dbAdmin, db, schemes, slugToScheme, schemeNames, generateSlug, invalidateSchemesCache, DATA_DIR, runScraperSyncSafely, getDashboardMetrics, getSchemeStats }) {
  const router = express.Router();

  // Admin Auth Middleware
  function requireAdmin(req, res, next) {
    const adminToken = process.env.ADMIN_TOKEN || '12345678';
    if (req.session && req.session.admin_authenticated) {
      return next();
    }

    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token === adminToken) {
        return next();
      }
    }

    const headerToken = req.headers['x-admin-token'];
    if (headerToken && headerToken === adminToken) {
      return next();
    }

    const queryToken = req.query.admin_token || req.query.token;
    if (queryToken && queryToken === adminToken) {
      return next();
    }

    if (req.accepts(['html', 'json']) === 'html') {
      return res.redirect(`/admin/login?next=${encodeURIComponent(req.originalUrl)}`);
    }

    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  // Admin Login GET
  router.get('/admin/login', (req, res) => {
    const csrfToken = req.session.csrf_token || crypto.randomBytes(16).toString('hex');
    req.session.csrf_token = csrfToken;
    res.render('admin_login', {
      csrf_token: csrfToken,
      messages: req.session.messages || [],
      nextUrl: req.query.next || '/analytics',
    });
    req.session.messages = [];
  });

  // Admin Login POST
  router.post('/admin/login', (req, res) => {
    const { token } = req.body;
    const adminToken = process.env.ADMIN_TOKEN || '12345678';

    if (token && token.trim() === adminToken) {
      req.session.admin_authenticated = true;
      const nextUrl = req.query.next || '/analytics';
      return res.redirect(nextUrl);
    }

    req.session.messages = [{ category: 'error', text: 'చెల్లని అడ్మిన్ టోకెన్ (Invalid admin token).' }];
    res.redirect('/admin/login');
  });

  // Admin Logout
  router.get('/admin/logout', (req, res) => {
    req.session.admin_authenticated = false;
    res.redirect('/');
  });

  // Analytics Dashboard (Admin protected)
  router.get('/analytics', requireAdmin, async (req, res) => {
    const metrics = await getDashboardMetrics();
    const stats = await getSchemeStats();
    
    let recentFeedback = (db.feedback || []).slice(-20).reverse();
    let grievances = (db.staffFeedback || []).slice(-20).reverse();

    if (dbAdmin) {
      try {
        const fbSnap = await getDocs(query(collection(dbAdmin, 'feedback'), orderBy('timestamp', 'desc'), fsLimit(20)));
        recentFeedback = [];
        fbSnap.forEach(d => recentFeedback.push(d.data()));

        const staffSnap = await getDocs(query(collection(dbAdmin, 'staffFeedback'), orderBy('timestamp', 'desc'), fsLimit(20)));
        grievances = [];
        staffSnap.forEach(d => grievances.push(d.data()));
      } catch (e) { console.error('Firebase analytics fetch error:', e); }
    }

    const csrfToken = req.session.csrf_token || crypto.randomBytes(16).toString('hex');
    req.session.csrf_token = csrfToken;
    res.render('analytics', { metrics, stats, recentFeedback, grievances, csrf_token: csrfToken });
  });

  // GET all schemes from Firestore
  router.get('/api/admin/firestore/schemes', requireAdmin, async (req, res) => {
    try {
      const list = [];
      if (dbAdmin) {
        const snap = await getDocs(collection(dbAdmin, 'schemes'));
        snap.forEach((d) => {
          const data = d.data();
          data._firestore_id = d.id;
          list.push(data);
        });
      }

      if (list.length === 0) {
        Object.keys(schemes).forEach((sName) => {
          const item = schemes[sName];
          const id = item.id || item.slug || generateSlug(sName);
          list.push({
            _firestore_id: id,
            id: id,
            scheme_name: sName,
            telugu_name: item.telugu_name || (typeof item.telugu === 'object' ? item.telugu.scheme_name : sName) || sName,
            category: item.category || 'General Healthcare',
            level: item.level || 'State Government',
            benefit_amount: item.benefit_amount || '',
            benefit_amount_te: item.benefit_amount_te || '',
            source_name: item.source_name || 'Official Portal',
            source_url: item.source_url || item.official_website || '',
            official_website: item.official_website || item.source_url || '',
            simplified: typeof item.simplified === 'string' ? item.simplified : JSON.stringify(item.simplified || ''),
            telugu: typeof item.telugu === 'string' ? item.telugu : (item.telugu?.details || item.telugu?.simplified || JSON.stringify(item.telugu || '')),
            eligibility_confirmation: item.eligibility_confirmation || 'Government Office / Empanelled Hospital',
            updated_at: item.updated_at || new Date().toISOString()
          });
        });
      }

      res.json({ success: true, count: list.length, schemes: list });
    } catch (err) {
      console.error('Error fetching schemes from Firestore:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST Save / Update Scheme in Firestore
  router.post('/api/admin/firestore/schemes', requireAdmin, express.json(), express.urlencoded({ extended: true }), async (req, res) => {
    try {
      const body = req.body || {};
      const scheme_name = (body.scheme_name || '').trim();
      if (!scheme_name) {
        return res.status(400).json({ success: false, error: 'Scheme name is required.' });
      }

      const docId = (body.id || body._firestore_id || generateSlug(scheme_name)).trim();
      const docData = {
        id: docId,
        scheme_name: scheme_name,
        telugu_name: (body.telugu_name || '').trim() || scheme_name,
        category: (body.category || 'General Healthcare').trim(),
        level: (body.level || 'State Government').trim(),
        benefit_amount: (body.benefit_amount || '').trim(),
        benefit_amount_te: (body.benefit_amount_te || '').trim(),
        source_name: (body.source_name || 'Official Govt Portal').trim(),
        source_url: (body.source_url || body.official_website || '').trim(),
        official_website: (body.official_website || body.source_url || '').trim(),
        simplified: (body.simplified || '').trim(),
        telugu: (body.telugu || '').trim(),
        eligibility_confirmation: (body.eligibility_confirmation || 'Government Office / Empanelled Hospital').trim(),
        updated_at: new Date().toISOString()
      };

      if (dbAdmin) {
        await setDoc(doc(dbAdmin, 'schemes', docId), docData, { merge: true });
      }

      // Sync in-memory catalog
      schemes[scheme_name] = {
        ...docData,
        slug: docId,
        voice_url: '/public/audio/' + docId + '.mp3'
      };
      slugToScheme[docId] = scheme_name;
      if (!schemeNames.includes(scheme_name)) {
        schemeNames.push(scheme_name);
        schemeNames.sort();
      }
      invalidateSchemesCache();

      // Persist custom copy to file system
      const customFilePath = path.join(DATA_DIR, 'custom_schemes.json');
      let customSchemes = {};
      if (fs.existsSync(customFilePath)) {
        try { customSchemes = JSON.parse(fs.readFileSync(customFilePath, 'utf8')); } catch(e) {}
      }
      customSchemes[scheme_name] = schemes[scheme_name];
      fs.writeFileSync(customFilePath, JSON.stringify(customSchemes, null, 2), 'utf8');

      res.json({
        success: true,
        message: `Scheme "${scheme_name}" successfully saved to Firestore collection!`,
        id: docId,
        scheme: docData
      });
    } catch (err) {
      console.error('Error saving scheme to Firestore:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE Scheme from Firestore
  router.delete('/api/admin/firestore/schemes/:id', requireAdmin, async (req, res) => {
    try {
      const docId = req.params.id;
      if (!docId) {
        return res.status(400).json({ success: false, error: 'Document ID is required.' });
      }

      if (dbAdmin) {
        await deleteDoc(doc(dbAdmin, 'schemes', docId));
      }

      let foundSchemeName = slugToScheme[docId];
      if (!foundSchemeName) {
        Object.keys(schemes).forEach((sName) => {
          if (schemes[sName].id === docId || schemes[sName].slug === docId || generateSlug(sName) === docId) {
            foundSchemeName = sName;
          }
        });
      }

      if (foundSchemeName) {
        delete schemes[foundSchemeName];
        delete slugToScheme[docId];
        const idx = schemeNames.indexOf(foundSchemeName);
        if (idx !== -1) schemeNames.splice(idx, 1);
        invalidateSchemesCache();
      }

      res.json({
        success: true,
        message: `Scheme "${docId}" deleted successfully from Firestore collection.`,
        id: docId
      });
    } catch (err) {
      console.error('Error deleting scheme from Firestore:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // SEED/Batch upload local catalog to Firestore collection
  router.post('/api/admin/firestore/schemes/seed', requireAdmin, async (req, res) => {
    try {
      if (!dbAdmin) {
        return res.status(500).json({ success: false, error: 'Firestore database is not connected.' });
      }

      let batchCount = 0;
      const allNames = Object.keys(schemes);
      for (const sName of allNames) {
        const item = schemes[sName];
        const docId = item.id || item.slug || generateSlug(sName);
        const docData = {
          id: docId,
          scheme_name: sName,
          telugu_name: item.telugu_name || (typeof item.telugu === 'object' ? item.telugu.scheme_name : sName) || sName,
          category: item.category || 'General Healthcare',
          level: item.level || 'State Government',
          benefit_amount: item.benefit_amount || '',
          benefit_amount_te: item.benefit_amount_te || '',
          source_name: item.source_name || 'Official Govt Portal',
          source_url: item.source_url || item.official_website || '',
          official_website: item.official_website || item.source_url || '',
          simplified: typeof item.simplified === 'string' ? item.simplified : JSON.stringify(item.simplified || ''),
          telugu: typeof item.telugu === 'string' ? item.telugu : (item.telugu?.details || item.telugu?.simplified || JSON.stringify(item.telugu || '')),
          eligibility_confirmation: item.eligibility_confirmation || 'Government Office / Empanelled Hospital',
          updated_at: new Date().toISOString()
        };

        await setDoc(doc(dbAdmin, 'schemes', docId), docData, { merge: true });
        batchCount++;
      }

      res.json({
        success: true,
        message: `Successfully batch-seeded ${batchCount} schemes to Firestore collection!`,
        count: batchCount
      });
    } catch (err) {
      console.error('Error seeding schemes to Firestore:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Trigger scraper sync
  router.post('/api/admin/sync-india-gov-schemes', async (req, res) => {
    try {
      console.log('🔄 Triggering India.gov.in scheme scraper and synchronization...');
      const result = await runScraperSyncSafely();
      res.json({
        success: true,
        message: 'National scheme data scraped and synchronized successfully from India.gov.in & MyScheme.gov.in',
        source: result?.source || 'india.gov.in',
        total_schemes_loaded: schemeNames.length,
        scraped_count: result?.count || result?.total_schemes || 0
      });
    } catch (err) {
      console.error('Failed to sync India.gov.in schemes:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
