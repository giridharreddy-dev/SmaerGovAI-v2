import express from 'express';

export function createFacilityRouter({ facilities, searchNearbyFacilities, getDirectionsInfo, getCache, setCache }) {
  const router = express.Router();

  // GET Facilities
  router.get('/api/facilities', async (req, res) => {
    try {
      const cached = await getCache('facilities:all');
      if (cached) return res.json(cached);

      const respData = {
        success: true,
        count: facilities.length,
        facilities: facilities
      };
      await setCache('facilities:all', respData, 3600);
      res.json(respData);
    } catch (e) {
      res.json({ success: true, count: facilities.length, facilities: facilities });
    }
  });

  // GET Nearby Facilities
  router.get('/api/facilities/nearby', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseFloat(req.query.radius || 15);
      const type = req.query.type || 'all';

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: 'Valid lat and lng coordinates required.' });
      }

      const results = searchNearbyFacilities(lat, lng, radius, type);
      res.json({
        success: true,
        user_location: { lat, lng },
        radius_km: radius,
        type_filter: type,
        count: results.length,
        facilities: results
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST Facility Directions
  router.post('/api/facilities/directions', (req, res) => {
    try {
      const { user_lat, user_lng, facility_id } = req.body;
      const directions = getDirectionsInfo(user_lat, user_lng, facility_id);
      res.json({ success: true, directions });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Local Locations
  router.get('/local-locations', (req, res) => {
    res.json({
      success: true,
      locations: facilities.map((f) => ({
        id: f.id,
        name: f.name,
        name_te: f.name_te,
        type: f.type,
        district: f.district,
        mandal: f.mandal,
        lat: f.lat,
        lng: f.lng,
        phone: f.phone,
        empanelled: f.empanelled
      }))
    });
  });

  return router;
}
