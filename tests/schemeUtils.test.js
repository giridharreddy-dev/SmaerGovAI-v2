import {
  cleanText,
  generateSlug,
  filterSchemes,
  mapScrapedSchemeToFirestore,
  transformFirestoreScheme
} from '../services/schemeUtils.js';

describe('Text Cleaning & Slug Utilities', () => {
  test('cleanText should strip HTML tags and collapse whitespace', () => {
    const rawHtml = '  <p>Free <strong>cashless</strong> hospitalization care.&nbsp;</p>  ';
    expect(cleanText(rawHtml)).toBe('Free cashless hospitalization care.');
  });

  test('cleanText should handle non-string or empty inputs gracefully', () => {
    expect(cleanText(null)).toBe('');
    expect(cleanText(undefined)).toBe('');
    expect(cleanText(12345)).toBe('');
  });

  test('generateSlug should produce clean kebab-case URL slugs', () => {
    expect(generateSlug('Dr. YSR Aarogyasri Scheme 2026!')).toBe('dr-ysr-aarogyasri-scheme-2026');
    expect(generateSlug('  Ayushman Bharat  PM-JAY  ')).toBe('ayushman-bharat-pm-jay');
  });
});

describe('Scraped Health Schemes Mapping & Firestore Transformation', () => {
  test('mapScrapedSchemeToFirestore should clean raw scraped payload and map to Firestore schema', () => {
    const rawScraped = {
      title: '  <span class="title">Pradhan Mantri Jan Arogya Yojana</span>  ',
      description: '<p>Provides coverage up to <strong>₹5 Lakhs</strong> per family per year for secondary and tertiary care.</p>',
      url: 'https://myscheme.gov.in/schemes/pmjay',
      category: 'Hospitalization Care',
      level: 'Central Government',
      financial_benefit: '₹5 Lakhs coverage'
    };

    const transformed = mapScrapedSchemeToFirestore(rawScraped);

    expect(transformed.scheme_name).toBe('Pradhan Mantri Jan Arogya Yojana');
    expect(transformed.slug).toBe('pradhan-mantri-jan-arogya-yojana');
    expect(transformed.id).toBe('pradhan-mantri-jan-arogya-yojana');
    expect(transformed._firestore_id).toBe('pradhan-mantri-jan-arogya-yojana');
    expect(transformed.simplified).toBe('Provides coverage up to ₹5 Lakhs per family per year for secondary and tertiary care.');
    expect(transformed.source_url).toBe('https://myscheme.gov.in/schemes/pmjay');
    expect(transformed.source_name).toBe('MyScheme Portal');
    expect(transformed.level).toBe('Central Government');
    expect(transformed.category).toBe('Hospitalization Care');
    expect(transformed.benefit_amount).toBe('₹5 Lakhs coverage');
  });

  test('should infer State Government level and category when missing in raw scraped data', () => {
    const rawAPScheme = {
      name: 'YSR Aarogya Asara Andhra Pradesh',
      details: 'Financial allowance for post-operative recovery in AP'
    };

    const transformed = mapScrapedSchemeToFirestore(rawAPScheme);

    expect(transformed.scheme_name).toBe('YSR Aarogya Asara Andhra Pradesh');
    expect(transformed.level).toBe('State Government');
    expect(transformed.category).toBe('Hospitalization Care');
    expect(transformed.benefit_amount).toBe('Free Care & Financial Assistance');
    expect(transformed.benefit_amount_te).toBe('ఉచిత వైద్యం & ఆర్థిక సహాయం');
  });

  test('should extract nested Telugu object translation fields correctly', () => {
    const rawWithTeluguObj = {
      scheme_name: 'Dr. YSR Aarogyasri',
      telugu: {
        scheme_name: 'డాక్టర్ వైఎస్ఆర్ ఆరోగ్యశ్రీ',
        details: 'ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రజలకు ఉచిత వైద్య చికిత్స పథకం.'
      }
    };

    const transformed = mapScrapedSchemeToFirestore(rawWithTeluguObj);

    expect(transformed.scheme_name).toBe('Dr. YSR Aarogyasri');
    expect(transformed.telugu_name).toBe('డాక్టర్ వైఎస్ఆర్ ఆరోగ్యశ్రీ');
    expect(transformed.telugu).toBe('ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రజలకు ఉచిత వైద్య చికిత్స పథకం.');
  });
});

describe('Scheme Filtering Logic (filterSchemes)', () => {
  const mockSchemes = [
    {
      scheme_name: 'Dr. YSR Aarogyasri Scheme',
      telugu_name: 'డాక్టర్ వైఎస్ఆర్ ఆరోగ్యశ్రీ పథకం',
      category: 'Hospitalization Care',
      level: 'State Government',
      benefit_amount: 'Up to ₹25 Lakhs per family per year',
      simplified: 'Free cashless inpatient medical treatment for BPL families'
    },
    {
      scheme_name: 'Ayushman Bharat PM-JAY',
      telugu_name: 'ఆయుష్మాన్ భారత్ పిఎం-జేఏవై',
      category: 'Hospitalization Care',
      level: 'Central Government',
      benefit_amount: 'Up to ₹5 Lakhs per family per year',
      simplified: 'National health protection scheme covering secondary and tertiary care'
    },
    {
      scheme_name: 'YSR Aarogya Asara',
      telugu_name: 'వైఎస్ఆర్ ఆరోగ్య ఆసరా',
      category: 'Maternal & Child Health',
      level: 'State Government',
      benefit_amount: '₹225 to ₹5,000 post-operative allowance',
      simplified: 'Post-operative daily financial assistance for patients during recovery'
    }
  ];

  test('should return all schemes when options are empty or default', () => {
    const result = filterSchemes(mockSchemes);
    expect(result.length).toBe(3);
  });

  test('should filter schemes correctly by category', () => {
    const result = filterSchemes(mockSchemes, { category: 'Maternal' });
    expect(result.length).toBe(1);
    expect(result[0].scheme_name).toBe('YSR Aarogya Asara');
  });

  test('should filter schemes correctly by level (State)', () => {
    const result = filterSchemes(mockSchemes, { level: 'state' });
    expect(result.length).toBe(2);
    expect(result.map(s => s.scheme_name)).toContain('Dr. YSR Aarogyasri Scheme');
    expect(result.map(s => s.scheme_name)).toContain('YSR Aarogya Asara');
  });

  test('should filter schemes correctly by level (Central)', () => {
    const result = filterSchemes(mockSchemes, { level: 'central' });
    expect(result.length).toBe(1);
    expect(result[0].scheme_name).toBe('Ayushman Bharat PM-JAY');
  });

  test('should search by keyword in English and Telugu', () => {
    const enResult = filterSchemes(mockSchemes, { query: 'Aarogyasri' });
    expect(enResult.length).toBe(1);
    expect(enResult[0].scheme_name).toBe('Dr. YSR Aarogyasri Scheme');

    const teResult = filterSchemes(mockSchemes, { query: 'ఆరోగ్య' });
    expect(teResult.length).toBe(2);
  });
});
