/**
 * Utility functions for scheme filtering, text cleaning, scraped data mapping,
 * and Firestore document structure normalization.
 */

/**
 * Clean raw text by stripping HTML tags, extra whitespace, and special characters.
 * @param {string} text - Raw input string
 * @returns {string} Cleaned plain string
 */
export function cleanText(text = '') {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * Generate URL-friendly kebab-case slug from scheme name.
 * @param {string} name - Raw scheme name
 * @returns {string} URL slug
 */
export function generateSlug(name = '') {
  const cleaned = cleanText(name).toLowerCase();
  return cleaned
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'scheme-' + Date.now();
}

/**
 * Filter a list of schemes based on query string, category, and level filters.
 * @param {Array<Object>} schemesList - List of scheme objects
 * @param {Object} options - Filter parameters
 * @param {string} [options.query] - Search query keyword
 * @param {string} [options.category] - Category filter ('all' or specific name)
 * @param {string} [options.level] - Level filter ('all' or 'State Government'/'Central Government')
 * @returns {Array<Object>} Filtered list of schemes
 */
export function filterSchemes(schemesList = [], options = {}) {
  const { query = '', category = 'all', level = 'all' } = options;
  const q = query.trim().toLowerCase();

  return schemesList.filter(scheme => {
    // 1. Category Filter
    if (category && category !== 'all') {
      const cat = (scheme.category || '').toLowerCase();
      if (!cat.includes(category.toLowerCase())) return false;
    }

    // 2. Level Filter
    if (level && level !== 'all') {
      const lvl = (scheme.level || '').toLowerCase();
      if (level === 'state' && !lvl.includes('state') && !lvl.includes('ap') && !lvl.includes('andhra')) return false;
      if (level === 'central' && !lvl.includes('central') && !lvl.includes('national') && !lvl.includes('india')) return false;
    }

    // 3. Search Query Filter
    if (q) {
      const sName = (scheme.scheme_name || '').toLowerCase();
      const tName = (scheme.telugu_name || '').toLowerCase();
      const simp = typeof scheme.simplified === 'string' ? scheme.simplified.toLowerCase() : '';
      const cat = (scheme.category || '').toLowerCase();
      const ben = (scheme.benefit_amount || '').toLowerCase();

      const matches = sName.includes(q) ||
                      tName.includes(q) ||
                      simp.includes(q) ||
                      cat.includes(q) ||
                      ben.includes(q);

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Maps and sanitizes scraped health scheme data from external sources (India.gov.in, MyScheme, etc.)
 * into pristine Firestore-compliant scheme document interfaces.
 * @param {Object} rawScraped - Raw scraped scheme payload
 * @returns {Object} Sanitized Firestore scheme interface
 */
export function mapScrapedSchemeToFirestore(rawScraped = {}) {
  const rawName = rawScraped.scheme_name || rawScraped.title || rawScraped.name || 'Unnamed Health Scheme';
  const schemeName = cleanText(rawName);
  const slug = rawScraped.id || rawScraped.slug || generateSlug(schemeName);

  // Infer Level
  let level = rawScraped.level;
  if (!level) {
    const combinedText = (schemeName + ' ' + (rawScraped.description || '') + ' ' + (rawScraped.state || '')).toLowerCase();
    if (combinedText.includes('andhra') || combinedText.includes('ap ') || combinedText.includes('state')) {
      level = 'State Government';
    } else {
      level = 'Central Government';
    }
  }

  // Infer Category
  let category = cleanText(rawScraped.category);
  if (!category || category === 'Uncategorized') {
    const lowerText = (schemeName + ' ' + (rawScraped.description || '') + ' ' + (rawScraped.details || '')).toLowerCase();
    if (lowerText.includes('maternal') || lowerText.includes('mother') || lowerText.includes('child') || lowerText.includes('pregnant')) {
      category = 'Maternal & Child Health';
    } else if (lowerText.includes('hospital') || lowerText.includes('care') || lowerText.includes('treatment') || lowerText.includes('insurance') || lowerText.includes('recovery') || lowerText.includes('operative') || lowerText.includes('asara')) {
      category = 'Hospitalization Care';
    } else if (lowerText.includes('eye') || lowerText.includes('vision') || lowerText.includes('dialysis')) {
      category = 'Specialized Medical Care';
    } else {
      category = 'General Healthcare';
    }
  }

  const rawTelugu = rawScraped.telugu;
  let teluguName = cleanText(rawScraped.telugu_name);
  let teluguText = '';

  if (typeof rawTelugu === 'object' && rawTelugu !== null) {
    teluguName = teluguName || cleanText(rawTelugu.scheme_name || rawTelugu.title || '');
    teluguText = cleanText(rawTelugu.details || rawTelugu.simplified || rawTelugu.description || '');
  } else if (typeof rawTelugu === 'string') {
    teluguText = cleanText(rawTelugu);
  }

  teluguName = teluguName || schemeName;

  const rawSimplified = typeof rawScraped.simplified === 'string'
    ? cleanText(rawScraped.simplified)
    : cleanText(rawScraped.description || rawScraped.details || '');

  const benefitAmt = cleanText(rawScraped.benefit_amount || rawScraped.financial_benefit || '');
  const benefitAmtTe = cleanText(rawScraped.benefit_amount_te || '');

  const websiteUrl = (rawScraped.official_website || rawScraped.source_url || rawScraped.url || '').trim();
  const sourceName = cleanText(rawScraped.source_name || (websiteUrl.includes('india.gov.in') ? 'India.gov.in' : (websiteUrl.includes('myscheme.gov.in') ? 'MyScheme Portal' : 'Official Portal')));

  return {
    _firestore_id: slug,
    id: slug,
    slug: slug,
    scheme_name: schemeName,
    telugu_name: teluguName,
    category: category,
    level: level,
    benefit_amount: benefitAmt || 'Free Care & Financial Assistance',
    benefit_amount_te: benefitAmtTe || 'ఉచిత వైద్యం & ఆర్థిక సహాయం',
    source_name: sourceName,
    source_url: websiteUrl,
    official_website: websiteUrl,
    simplified: rawSimplified || `${schemeName} provides comprehensive health coverage and medical assistance benefits to eligible beneficiaries.`,
    telugu: teluguText || `${teluguName} అర్హులైన లబ్ధిదారులకు సమగ్ర ఆరోగ్య సంరక్షణ మరియు వైద్య సహాయ సేవలను అందిస్తుంది.`,
    eligibility_confirmation: cleanText(rawScraped.eligibility_confirmation || 'Government Office / Empanelled Hospital'),
    updated_at: rawScraped.updated_at || new Date().toISOString()
  };
}

/**
 * Transforms raw Firestore document data or catalog items into standard scheme structure.
 * @param {Object} item - Firestore doc data or raw item
 * @param {Function} [generateSlugFn] - Slug generation function fallback
 * @returns {Object} Standardized scheme object
 */
export function transformFirestoreScheme(item = {}, generateSlugFn = null) {
  return mapScrapedSchemeToFirestore(item);
}
