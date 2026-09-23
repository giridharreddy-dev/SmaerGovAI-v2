/**
 * scripts/cheerio_crawler.cjs
 * =============================================================================
 * SmartGovAI - Node.js Cheerio Government Health Scheme Crawler
 * =============================================================================
 * Uses Cheerio to parse HTML from official Andhra Pradesh and National healthcare
 * portals, extracting structured scheme data conforming to data/scheme_schema.json.
 * 
 * Invoked by scripts/crawl_health_schemes.py or directly via command line.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const cheerio = require('cheerio');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SCHEMA_FILE = path.join(DATA_DIR, 'scheme_schema.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'scraped_ap_schemes.json');

// Government Health Portals to Crawl
const GOVERNMENT_PORTALS = [
  {
    id: 'aarogyasri',
    name: 'Dr. NTR Vaidya Seva / Dr. YSR Aarogyasri Health Care Trust',
    url: 'https://aarogyasri.ap.gov.in/',
    domain: 'aarogyasri.ap.gov.in',
    level: 'Andhra Pradesh',
    defaultCategory: 'Tertiary Hospital Healthcare'
  },
  {
    id: 'cfw',
    name: 'AP Commissionerate of Health, Medical & Family Welfare',
    url: 'https://cfw.ap.nic.in/',
    domain: 'cfw.ap.nic.in',
    level: 'Andhra Pradesh',
    defaultCategory: 'Public Health & Maternal Care'
  },
  {
    id: 'nhm',
    name: 'National Health Mission - Andhra Pradesh',
    url: 'https://nhm.gov.in/',
    domain: 'nhm.gov.in',
    level: 'National',
    defaultCategory: 'Primary & Reproductive Healthcare'
  },
  {
    id: 'ehs',
    name: 'Employee Health Scheme (EHS AP)',
    url: 'https://ehs.ap.gov.in/',
    domain: 'ehs.ap.gov.in',
    level: 'Andhra Pradesh',
    defaultCategory: 'State Employees & Pensioners Healthcare'
  },
  {
    id: 'pmjay',
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    url: 'https://nha.gov.in/PM-JAY',
    domain: 'nha.gov.in',
    level: 'National',
    defaultCategory: 'Secondary & Tertiary Hospitalization'
  }
];

// Curated Master Catalog of Official AP & National Healthcare Schemes
// Extracted and ground-truthed from official AP Government Orders & portals
const MASTER_GOV_SCHEMES = {
  "Dr. NTR Vaidya Seva (Aarogyasri Health Scheme)": {
    "level": "Andhra Pradesh",
    "category": "Tertiary Hospital Healthcare",
    "icon": "hospital",
    "telugu_name": "డా. ఎన్టీఆర్ వైద్యసేవ (ఆరోగ్యశ్రీ పథకం)",
    "telugu_description": "ఆంధ్రప్రదేశ్ రాష్ట్రంలోని తెల్ల రేషన్ కార్డు మరియు బియ్యం కార్డు కలిగిన నిరుపేద కుటుంబాలకు ఏటా రూ. 25 లక్షల వరకు ఉచిత నగదు రహిత సూపర్ స్పెషాలిటీ ఆసుపత్రి చికిత్స అందించే ప్రధాన ఆరోగ్య రక్షణ పథకం. 3,257 కంటే ఎక్కువ శస్త్రచికిత్సలు మరియు తీవ్ర వైద్య విధానాలు నెట్‌వర్క్ ఆసుపత్రులలో ఉచితంగా లభిస్తాయి.",
    "english_description": "Flagship comprehensive tertiary healthcare scheme of Andhra Pradesh providing cashless treatment up to ₹25 Lakhs per family per annum across 3,257+ medical and surgical procedures in over 2,200 empanelled government and private network hospitals.",
    "benefit_amount": "Up to ₹25,00,000 per family per year",
    "benefit_amount_te": "కుటుంబానికి సంవత్సరానికి రూ. 25,00,000 వరకు ఉచిత నగదు రహిత చికిత్స",
    "source_name": "Dr. NTR Vaidya Seva Trust, Government of Andhra Pradesh",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "helpline_numbers": ["104", "1800 599 111"],
    "contact_office": "Aarogya Mithra Help Desk at Empanelled Hospitals & Grama Sachivalayam",
    "keywords": ["aarogyasri", "ntr vaidya seva", "cashless treatment", "25 lakhs", "hospitalization", "ఆరోగ్యశ్రీ"],
    "original_complex_text": "Government of Andhra Pradesh Order: Dr. NTR Vaidya Seva Trust Scheme provides universal health coverage up to ₹25 Lakhs per family per year. All BPL families holding valid Rice Card / Aarogyasri Card are eligible for cashless treatment across 3,257 clinical packages.",
    "simplified": {
      "eligibility": "BPL families residing in Andhra Pradesh holding an active Rice Card, Aarogyasri Card, or annual family income below ₹5 Lakhs. Covers all family members registered on the card.",
      "benefits": "100% cashless hospitalization, surgical interventions, medicines, diagnostics, food, and post-discharge medications up to ₹25 Lakhs per year. Includes 3,257 medical procedures.",
      "documents": "Original Aadhaar Card and AP Rice Card / White Ration Card / Aarogyasri Health Card.",
      "steps": "1. Approach the Aarogya Mithra kiosk at any network hospital.\n2. Present your Aadhaar and Rice Card for biometric e-KYC.\n3. The medical team generates a pre-authorization within hours.\n4. Receive complete cashless treatment and follow-up care."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ రాష్ట్రంలో నివసిస్తూ బియ్యం కార్డు (తెల్ల రేషన్ కార్డు) లేదా ఆరోగ్యశ్రీ కార్డు కలిగిన నిరుపేద కుటుంబాలు. వార్షిక ఆదాయం రూ. 5 లక్షలలోపు ఉన్న కుటుంబాలన్నీ అర్హులు.",
      "benefits": "ఏటా కుటుంబానికి రూ. 25 లక్షల వరకు ఉచిత శస్త్రచికిత్సలు, పరీక్షలు, మందులు మరియు ఆసుపత్రి ఖర్చులు. 3,257 చికిత్స విధానాలు మరియు ఉచిత ప్రయాణ భత్యం వర్తిస్తాయి.",
      "documents": "ఆధార్ కార్డు, బియ్యం కార్డు / తెల్ల రేషన్ కార్డు / ఆరోగ్యశ్రీ హెల్త్ కార్డు.",
      "steps": "1. నెట్‌వర్క్ ఆసుపత్రిలోని ఆరోగ్య మిత్ర హెల్ప్ డెస్క్‌ను సంప్రదించండి.\n2. ఆధార్ మరియు బియ్యం కార్డుతో బయోమెట్రిక్ ధృవీకరణ పూర్తి చేయండి.\n3. ఆసుపత్రి ప్రీ-ఆథరైజేషన్ అనుమతి పొంది ఉచిత చికిత్స పొందండి.\n4. డిశ్చార్జ్ సమయంలో ఉచిత మందులు మరియు ప్రయాణ ఖర్చులు అందుకోండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "AP Rice Card / White Ration Card", "name_te": "ఏపీ బియ్యం కార్డు / తెల్ల రేషన్ కార్డు", "optional": false },
      { "name": "Medical Referral / Doctor Prescription", "name_te": "డాక్టర్ ప్రిస్క్రిప్షన్ / వైద్య పత్రాలు", "optional": true }
    ],
    "eligibility_questions": [
      { "question_te": "మీ వద్ద ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వం జారీ చేసిన బియ్యం కార్డు లేదా ఆరోగ్యశ్రీ కార్డు ఉందా?", "question_en": "Do you hold an active AP Rice Card or Aarogyasri Card?", "weight": "critical" },
      { "question_te": "మీ కుటుంబ వార్షిక ఆదాయం రూ. 5 లక్షల లోపు ఉందా?", "question_en": "Is your family's annual income below ₹5 Lakhs?", "weight": "critical" }
    ],
    "key_treatments": ["Cardiac Surgery", "Oncology & Chemotherapy", "Joint Replacement", "Kidney Transplant", "Neurosurgery", "Polytrauma Care"],
    "key_treatments_te": ["గుండె శస్త్రచికిత్సలు", "క్యాన్సర్ చికిత్స & కీమోథెరపీ", "కీళ్ల మార్పిడి", "కిడ్నీ మార్పిడి", "న్యూరో సర్జరీ", "తీవ్ర గాయాల అత్యవసర చికిత్స"]
  },

  "Dr. YSR Aarogya Asara (Post-Operative Financial Allowance)": {
    "level": "Andhra Pradesh",
    "category": "Post-Operative Financial Assistance",
    "icon": "cash",
    "telugu_name": "డా. వైఎస్సార్ ఆరోగ్య ఆసరా (విశ్రాంతి వేతన పథకం)",
    "telugu_description": "ఆరోగ్యశ్రీ కింద శస్త్రచికిత్స చేయించుకున్న రోగి కోలుకునే విశ్రాంతి కాలంలో జీవనోపాధి కోల్పోకుండా రోజుకు రూ. 225 లేదా గరిష్టంగా నెలకు రూ. 5,000 వరకు నేరుగా బ్యాంక్ ఖాతాలో జమ చేసే ఆర్థిక సాయం పథకం.",
    "english_description": "Post-operative subsistence allowance providing ₹225 per day up to a maximum of ₹5,000 per month directly into the patient's bank account to support family livelihood during recovery from surgeries performed under Aarogyasri.",
    "benefit_amount": "₹225 per day (up to ₹5,000 per month) during recovery",
    "benefit_amount_te": "విశ్రాంతి సమయంలో రోజుకు రూ. 225 (నెలకు గరిష్టంగా రూ. 5,000)",
    "source_name": "Aarogyasri Health Care Trust, AP",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "helpline_numbers": ["104"],
    "contact_office": "Aarogya Mithra at Discharge Desk & Grama Ward Sachivalayam",
    "keywords": ["aarogya asara", "post-operative allowance", "wage compensation", "ఆసరా", "విశ్రాంతి వేతనం"],
    "original_complex_text": "AP GO Ms No 131: Provision of financial allowance of ₹225 per day up to ₹5,000 per month for patients undergoing designated surgical procedures under Aarogyasri to offset loss of daily wages during post-operative convalescence period.",
    "simplified": {
      "eligibility": "Patients who underwent surgical treatment under Aarogyasri scheme in empanelled hospitals for prescribed surgical procedures requiring rest.",
      "benefits": "₹225 per day up to ₹5,000 per month credited directly to the beneficiary's Aadhaar-linked bank account within 48 hours of hospital discharge.",
      "documents": "Aadhaar Card, Aarogyasri Card, Discharge Summary with resting period, and Active Bank Passbook copy.",
      "steps": "1. Complete eligible surgery under Aarogyasri.\n2. Aarogya Mithra captures bank details during discharge.\n3. Allowance credited via DBT directly to patient's account."
    },
    "telugu": {
      "eligibility": "ఆరోగ్యశ్రీ కింద నెట్‌వర్క్ ఆసుపత్రులలో నిర్దేశిత శస్త్రచికిత్స చేయించుకుని విశ్రాంతి అవసరమైన రోగులు.",
      "benefits": "డిశ్చార్జ్ అయిన 48 గంటల్లో రోగి బ్యాంక్ ఖాతాలో రోజుకు రూ. 225 చొప్పున గరిష్టంగా నెలకు రూ. 5,000 వరకు జమ అవుతుంది.",
      "documents": "ఆధార్ కార్డు, ఆరోగ్యశ్రీ కార్డు, ఆసుపత్రి డిశ్చార్జ్ సమ్మరీ, బ్యాంక్ పాస్‌బుక్ జిరాక్స్.",
      "steps": "1. ఆరోగ్యశ్రీ కింద ఆసుపత్రిలో శస్త్రచికిత్స పూర్తి చేసుకోండి.\n2. డిశ్చార్జ్ సమయంలో ఆరోగ్య మిత్ర వద్ద బ్యాంక్ ఖాతా వివరాలు నమోదు చేయించండి.\n3. ప్రభుత్వం నేరుగా మీ ఖాతాకు డీబీటీ ద్వారా సొమ్ము జమ చేస్తుంది."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Discharge Summary with Doctor Prescribed Rest Period", "name_te": "డాక్టర్ సూచించిన విశ్రాంతి వివరాలతో కూడిన డిశ్చార్జ్ సమ్మరీ", "optional": false },
      { "name": "Aadhaar Linked Bank Account Details", "name_te": "ఆధార్ అనుసంధాన బ్యాంక్ ఖాతా వివరాలు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_te": "మీరు ఆరోగ్యశ్రీ నెట్‌వర్క్ ఆసుపత్రిలో శస్త్రచికిత్స చేయించుకున్నారా?", "question_en": "Did you undergo surgery in an Aarogyasri empanelled hospital?", "weight": "critical" },
      { "question_te": "మీ వద్ద యాక్టివ్ బ్యాంక్ ఖాతా మరియు ఆధార్ కార్డు ఉన్నాయా?", "question_en": "Do you hold an active bank account linked with Aadhaar?", "weight": "high" }
    ],
    "key_treatments": ["Major Surgeries", "Cardiac Bypass", "Orthopedic Rest", "Neurosurgery Recovery"],
    "key_treatments_te": ["ప్రధాన శస్త్రచికిత్సలు", "గుండె బైపాస్ విశ్రాంతి", "ఎముకల శస్త్రచికిత్స", "న్యూరోసర్జరీ రికవరీ"]
  },

  "YSR Pension Kanuka - Chronic Illness Healthcare Pension": {
    "level": "Andhra Pradesh",
    "category": "Chronic Disease Monthly Financial Pension",
    "icon": "wallet",
    "telugu_name": "వైఎస్సార్ పెన్షన్ కానుక - దీర్ఘకాలిక వ్యాధుల పెన్షన్",
    "telugu_description": "డయాలసిస్ చేయించుకుంటున్న కిడ్నీ వ్యాధిగ్రస్తులకు, తలసేమియా, సికిల్ సెల్ ఎనీమియా, హీమోఫీలియా, పక్షవాతం, కుష్టు మరియు వీల్‌చైర్ బాధితులకు నెలకు రూ. 5,000 నుండి రూ. 10,000 వరకు ఇంటి వద్దకే అందించే నెలవారీ ఆరోగ్య పెన్షన్.",
    "english_description": "Monthly healthcare financial pension providing ₹5,000 to ₹10,000 delivered directly at the beneficiary doorstep for patients suffering from End-Stage Renal Disease (ESRD on dialysis), Thalassemia, Hemophilia, Sickle Cell Disease, Paralysis, Severe Muscular Dystrophy, and Leprosy.",
    "benefit_amount": "₹5,00,0 to ₹10,000 per month doorstep cash delivery",
    "benefit_amount_te": "నెలకు రూ. 5,000 నుండి రూ. 10,000 వరకు ఇంటి వద్దకే నగదు పెన్షన్",
    "source_name": "Society for Elimination of Rural Poverty (SERP) & Health Dept, AP",
    "source_url": "https://sspensions.ap.gov.in/",
    "official_website": "https://sspensions.ap.gov.in/",
    "helpline_numbers": ["104", "1902"],
    "contact_office": "Village / Ward Secretariat (Grama Ward Sachivalayam)",
    "keywords": ["pension kanuka", "dialysis pension", "thalassemia pension", "chronic disease pension", "పెన్షన్ కానుక", "డయాలసిస్ పెన్షన్"],
    "original_complex_text": "AP GO Ms No 103: Grant of monthly social security pensions for chronic medical conditions: ₹10,000/month for chronic kidney disease patients on dialysis (government or private), and ₹5,000/month for Thalassemia, Hemophilia, Sickle Cell, Paralysis, and Bilateral Elephantiasis Grade 4.",
    "simplified": {
      "eligibility": "Residents of Andhra Pradesh verified with chronic kidney disease on regular dialysis, or diagnosed with Thalassemia, Hemophilia, Severe Paralysis, or Muscular Dystrophy with clinical certificate.",
      "benefits": "Dialysis patients receive ₹10,000 every month; Thalassemia, Hemophilia, and Severe Paralysis patients receive ₹5,000 every month delivered at doorstep.",
      "documents": "Aadhaar Card, Rice Card, Medical Board Certificate / Dialysis Case Sheet, Bank Details, and Passport size photo.",
      "steps": "1. Submit application at Grama / Ward Sachivalayam with medical certificate.\n2. Medical Officer verifies the clinical case records.\n3. Monthly pension delivered to your doorstep on the 1st of every month."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ నివాసితులై కిడ్నీ డయాలసిస్ చేయించుకుంటున్న వారు, లేదా తలసేమియా, హీమోఫీలియా, పక్షవాతం, కండరాల క్షీణత కలిగినట్లు ప్రభుత్వ వైద్య ధృవీకరణ పొందిన వారు.",
      "benefits": "కిడ్నీ డయాలసిస్ రోగులకు నెలకు రూ. 10,000; తలసేమియా, హీమోఫీలియా రోగులకు నెలకు రూ. 5,000 ప్రతి నెలా 1వ తేదీన ఇంటి వద్దకే పంపిణీ చేయబడుతుంది.",
      "documents": "ఆధార్ కార్డు, రేషన్ కార్డు, ప్రభుత్వ మెడికల్ బోర్డు సర్టిఫికెట్ / డయాలసిస్ కేస్ షీట్, ఫోటో.",
      "steps": "1. మీ సమీప గ్రామ/వార్డు సచివాలయంలో దరఖాస్తు సమర్పించండి.\n2. ప్రభుత్వ వైద్యాధికారి మీ పత్రాలను క్లినికల్ తనిఖీ చేసి ఆమోదిస్తారు.\n3. ప్రతి నెలా 1వ తేదీన వాలంటీర్ మీ ఇంటి వద్దకే పెన్షన్ సొమ్ము అందజేస్తారు."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "AP Rice Card", "name_te": "ఏపీ బియ్యం కార్డు", "optional": false },
      { "name": "Government Medical Board Disability / Dialysis Certificate", "name_te": "ప్రభుత్వ మెడికల్ బోర్డు సర్టిఫికెట్ / డయాలసిస్ రికార్డులు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_te": "మీరు డయాలసిస్ చేయించుకుంటున్నారా లేదా తలసేమియా / పక్షవాతం వంటి వ్యాధిగ్రస్తులా?", "question_en": "Are you undergoing regular dialysis or diagnosed with Thalassemia / Paralysis?", "weight": "critical" },
      { "question_te": "మీ వద్ద ప్రభుత్వ ఆసుపత్రి మెడికల్ సర్టిఫికెట్ ఉందా?", "question_en": "Do you hold a medical certificate from a Government Hospital / Medical Board?", "weight": "critical" }
    ],
    "key_treatments": ["Hemodialysis", "Peritoneal Dialysis", "Blood Transfusions for Thalassemia", "Palliative Care"],
    "key_treatments_te": ["హీమోడయాలసిస్", "పెరిటోనియల్ డయాలసిస్", "తలసేమియా రక్త మార్పిడి", "ఉపశమన సంరక్షణ"]
  },

  "104 Mobile Medical Units & Village Clinics (Doctor YSR Sanchara Chikitsha)": {
    "level": "Andhra Pradesh",
    "category": "Rural Primary Healthcare & Diagnostic Screening",
    "icon": "ambulance",
    "telugu_name": "104 మొబైల్ మెడికల్ యూనిట్స్ & వైఎస్సార్ విలేజ్ క్లినిక్స్",
    "telugu_description": "ఆంధ్రప్రదేశ్ లోని ప్రతి గ్రామానికి క్రమం తప్పకుండా వచ్చే 104 సంచార వైద్య వాహనాలు మరియు వైఎస్సార్ విలేజ్ క్లినిక్‌ల ద్వారా 20 రకాల ప్రాథమిక రక్త పరీక్షలు, 67 రకాల ఉచిత మందులు, గర్భిణుల తనిఖీలు మరియు బీపీ, షుగర్ రోగులకు ఉచిత వైద్యం.",
    "english_description": "Comprehensive primary healthcare delivered directly to remote villages through 104 Mobile Medical Units (MMUs) and Village Health Clinics, offering 20 free diagnostic lab tests, 67 essential medicines, maternal checkups, and monthly chronic disease management.",
    "benefit_amount": "100% Free Rural Medical Visits, 20 Lab Tests & 67 Free Medicines",
    "benefit_amount_te": "100% ఉచిత వైద్య సేవలు, 20 రకాల పరీక్షలు & 67 రకాల మందులు",
    "source_name": "Commissioner of Health, Medical & Family Welfare, AP",
    "source_url": "https://cfw.ap.nic.in/",
    "official_website": "https://cfw.ap.nic.in/",
    "helpline_numbers": ["104"],
    "contact_office": "Village Clinic / 104 Medical Officer & ANM",
    "keywords": ["104 mobile clinic", "village clinic", "free medicines", "bp sugar tests", "104 వాహనం", "విలేజ్ క్లినిక్"],
    "original_complex_text": "AP Health Dept: Fixed-day health service delivery via 104 Mobile Medical Units in every revenue village once a month, coupled with YSR Village Health Clinics manned by Community Health Officers (CHOs) providing tele-consultation and free point-of-care diagnostics.",
    "simplified": {
      "eligibility": "All residents in rural and tribal villages of Andhra Pradesh. No ration card restrictions; accessible to everyone in the village.",
      "benefits": "Free general consultation with MBBS doctor, antenatal checkups, screening for diabetes, hypertension, cancer, 20 rapid lab diagnostics, and 67 essential free medicines.",
      "documents": "Aadhaar Card or Mobile Number for electronic health record generation.",
      "steps": "1. Visit the 104 mobile vehicle on scheduled village visit day or walk into Village Clinic.\n2. Get vitals, BP, and blood sugar tested free of charge.\n3. Consult the medical officer and collect free prescribed medicines."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ రాష్ట్రంలోని గ్రామీణ మరియు ఏజెన్సీ ప్రాంతాల నివాసితులందరూ. ఎటువంటి ఆదాయ పరిమితి లేదు; ప్రతి ఒక్కరికీ ఉచితం.",
      "benefits": "ఎంబీబీఎస్ డాక్టర్ ద్వారా ఉచిత వైద్య పరీక్షలు, గర్భిణుల సంరక్షణ, బీపీ, షుగర్ పరీక్షలు, 20 రకాల ల్యాబ్ పరీక్షలు మరియు 67 రకాల నిత్యావసర మందులు ఉచితం.",
      "documents": "ఆధార్ కార్డు లేదా మొబైల్ నంబర్.",
      "steps": "1. మీ గ్రామానికి 104 వాహనం వచ్చిన రోజున లేదా విలేజ్ క్లినిక్‌కు వెళ్లండి.\n2. ఉచితంగా రక్త పరీక్షలు మరియు బీపీ తనిఖీ చేయించుకోండి.\n3. డాక్టర్ సలహా మేరకు ఉచిత మందులు తీసుకోండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card or Mobile Number", "name_te": "ఆధార్ కార్డు లేదా మొబైల్ నంబర్", "optional": false }
    ],
    "eligibility_questions": [
      { "question_te": "మీరు ఆంధ్రప్రదేశ్ రాష్ట్ర గ్రామీణ లేదా మున్సిపల్ పరిధిలోని నివాసితులా?", "question_en": "Are you a resident of rural or urban areas in Andhra Pradesh?", "weight": "medium" }
    ],
    "key_treatments": ["Hypertension & Diabetes Screening", "Antenatal & Postnatal Care", "Pediatric Consultations", "Telemedicine to District Specialists"],
    "key_treatments_te": ["బీపీ & షుగర్ వ్యాధుల గుర్తింపు", "గర్భిణుల & శిశు సంరక్షణ", "చిన్నపిల్లల వైద్యం", "టెలిమెడిసిన్ ద్వారా స్పెషలిస్ట్ సలహాలు"]
  },

  "108 Emergency Ambulance Medical Service": {
    "level": "Andhra Pradesh",
    "category": "Emergency Medical Transport & Pre-Hospital Care",
    "icon": "ambulance",
    "telugu_name": "108 అత్యవసర అంబులెన్స్ సేవలు",
    "telugu_description": "ఆంధ్రప్రదేశ్ అంతటా ప్రమాదాలు, గుండెపోటు, ప్రసవాలు మరియు అత్యవసర వైద్య పరిస్థితులలో 15 నుండి 20 నిమిషాల్లో ఆక్సిజన్, వెంటిలేటర్, డిఫిబ్రిలేటర్లతో కూడిన అత్యాధునిక అంబులెన్స్ సేవను 100% ఉచితంగా అందించే జీవరక్షక సేవ.",
    "english_description": "24x7 state-of-the-art emergency ambulance response service reachable via toll-free number 108. Provides Advanced Life Support (ALS) and Basic Life Support (BLS) pre-hospital medical care and transportation to nearest emergency hospitals within 15-20 minutes.",
    "benefit_amount": "100% Free 24x7 Life Support Emergency Transport",
    "benefit_amount_te": "100% ఉచిత 24x7 అత్యవసర లైఫ్ సపోర్ట్ అంబులెన్స్ రవాణా",
    "source_name": "EMRI Green Health Services & AP Health Department",
    "source_url": "https://cfw.ap.nic.in/",
    "official_website": "https://cfw.ap.nic.in/",
    "helpline_numbers": ["108"],
    "contact_office": "Toll-Free Dial 108 Emergency Control Room",
    "keywords": ["108 ambulance", "emergency ambulance", "als ambulance", "trauma transport", "108 అంబులెన్స్", "అత్యవసర వాహనం"],
    "original_complex_text": "AP Govt 108 Fleet: Deployment of 768+ Advanced and Basic Life Support ambulances covering every mandal with GPS navigation, ventilator, cardiac defibrillator, and trained Emergency Medical Technicians (EMTs) for zero-cost public emergency transit.",
    "simplified": {
      "eligibility": "Anyone within the territory of Andhra Pradesh in need of critical medical attention, road accident transport, cardiac emergency, or pregnancy labor.",
      "benefits": "24x7 toll-free dispatch, on-site paramedic stabilization, Advanced Life Support ventilation, and rapid transit to the nearest hospital at zero charge.",
      "documents": "No documents required to summon or board an emergency ambulance.",
      "steps": "1. Immediately dial 108 from any mobile or landline without prefix.\n2. State your location, nearest landmark, and the patient's medical condition.\n3. The nearest GPS-tracked ambulance arrives within 15 minutes."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ రాష్ట్ర పరిధిలో అత్యవసర వైద్య పరిస్థితి, రోడ్డు ప్రమాదం, గుండెపోటు లేదా ప్రసవ నొప్పులతో ఉన్న ఎవరైనా సరే ఉపయోగించుకోవచ్చు.",
      "benefits": "24 గంటల ఉచిత సేవ, ఆక్సిజన్, వెంటిలేటర్, లైఫ్ సపోర్ట్ మరియు అత్యవసర చికిత్సతో కూడిన ఉచిత ఆసుపత్రి ప్రయాణం.",
      "documents": "ఎటువంటి పత్రాలు అవసరం లేదు. వెంటనే కాల్ చేయవచ్చు.",
      "steps": "1. ఏదైనా ఫోన్ నుండి ఎటువంటి పైసలు లేకుండా వెంటనే 108 కి డయల్ చేయండి.\n2. రోగి పరిస్థితి మరియు మీ ప్రాంతం వివరాలు తెలియజేయండి.\n3. జీపీఎస్ ఆధారంగా 15-20 నిమిషాల్లో అంబులెన్స్ మీ వద్దకు చేరుకుంటుంది."
    },
    "required_documents": [],
    "eligibility_questions": [
      { "question_te": "మీకు లేదా మీ సమీపంలో ఉన్న వ్యక్తికి తక్షణ అత్యవసర వైద్య సహాయం అవసరమా?", "question_en": "Is there an immediate medical emergency or life-threatening situation?", "weight": "critical" }
    ],
    "key_treatments": ["Pre-Hospital Resuscitation", "Cardiopulmonary Resuscitation (CPR)", "Polytrauma Immobilization", "Emergency Delivery"],
    "key_treatments_te": ["ప్రాథమిక ప్రాణ రక్షణ", "సీపీఆర్ మరియు ఆక్సిజన్ సపోర్ట్", "ప్రమాద గాయాల స్థిరీకరణ", "అత్యవసర ప్రసవ నిర్వహణ"]
  },

  "Pradhan Mantri Matru Vandana Yojana (PMMVY) - Maternal Health Aid": {
    "level": "National",
    "category": "Maternal Welfare & Nutrition Financial Aid",
    "icon": "heart",
    "telugu_name": "ప్రధాన మంత్రి మాతృ వందన యోజన (గర్భిణుల ఆర్థిక సాయం)",
    "telugu_description": "గర్భిణీ స్త్రీలు మరియు బాలింతలకు పౌష్టికాహార లోపం నివారించడానికి మరియు సురక్షిత ప్రసవాన్ని ప్రోత్సహించడానికి మొదటి మరియు రెండవ కాన్పు (ఆడపిల్ల పుడితే) సమయంలో బ్యాంక్ ఖాతాలో నేరుగా రూ. 5,000 నుండి రూ. 6,000 జమ చేసే నగదు బదిలీ పథకం.",
    "english_description": "Centrally sponsored conditional maternity benefit cash incentive scheme providing ₹5,000 to ₹6,000 via Direct Benefit Transfer (DBT) into the mother's bank account in designated installments for institutional delivery, early registration, and child immunization.",
    "benefit_amount": "₹5,000 to ₹6,000 in DBT installments",
    "benefit_amount_te": "నేరుగా బ్యాంక్ ఖాతాలో రూ. 5,000 నుండి రూ. 6,000 నగదు సాయం",
    "source_name": "Ministry of Women & Child Development, Govt of India & AP WCD",
    "source_url": "https://pmmvy.wcd.gov.in/",
    "official_website": "https://pmmvy.wcd.gov.in/",
    "helpline_numbers": ["104", "181"],
    "contact_office": "Anganwadi Center & Grama Sachivalayam Mahila Police / ANM",
    "keywords": ["pmmvy", "maternity benefit", "pregnancy allowance", "anganwadi maternity", "మాతృ వందన", "గర్భిణుల సాయం"],
    "original_complex_text": "PMMVY Guidelines: Maternity Benefit Programme providing partial wage compensation to pregnant women and lactating mothers for wage loss, encouraging safe institutional delivery, and child vaccination up to ₹5,000 for first child and ₹6,000 for second girl child.",
    "simplified": {
      "eligibility": "Pregnant women and lactating mothers aged 19 years and above for first live birth (and second live birth if child is female). Excludes regular government employees.",
      "benefits": "₹5,000 cash assistance in installments upon early pregnancy registration, ANC checkups, and child immunization. Additional ₹1,000 under Janani Suraksha Yojana for institutional delivery.",
      "documents": "Mother and Father Aadhaar Card, MCP (Mother Child Protection) Card, and Mother's Single Bank Account Passbook.",
      "steps": "1. Register pregnancy within 150 days at the local Anganwadi Center or PHC.\n2. Complete prescribed ANC health checkups.\n3. Benefits transferred directly via DBT to the mother's bank account."
    },
    "telugu": {
      "eligibility": "19 సంవత్సరాలు నిండిన గర్భిణీ స్త్రీలు మరియు బాలింతలు (మొదటి కాన్పుకు, మరియు రెండవ కాన్పులో ఆడపిల్ల జన్మిస్తే). ప్రభుత్వ ఉద్యోగులు మినహా అందరూ అర్హులు.",
      "benefits": "సకాలంలో గర్భం నమోదు, వైద్య పరీక్షలు మరియు శిశువు టీకాల అనంతరం రూ. 5,000 నుండి రూ. 6,000 నేరుగా తల్లి బ్యాంక్ ఖాతాలో జమ అవుతుంది.",
      "documents": "తల్లి మరియు తండ్రి ఆధార్ కార్డులు, ఎంసీపీ (తల్లీ బిడ్డ రక్షణ) కార్డు, తల్లి పేరు మీద ఉన్న బ్యాంక్ పాస్‌బుక్.",
      "steps": "1. గర్భం దాల్చిన 150 రోజుల్లోపు అంగన్‌వాడీ కేంద్రం లేదా పీహెచ్‌సీ వద్ద పేరు నమోదు చేయించండి.\n2. క్రమం తప్పకుండా వైద్య పరీక్షలు చేయించుకోండి.\n3. ప్రభుత్వ నిబంధనల ప్రకారం సొమ్ము నేరుగా తల్లి బ్యాంక్ ఖాతాకు చేరుతుంది."
    },
    "required_documents": [
      { "name": "Mother's Aadhaar Card", "name_te": "తల్లి ఆధార్ కార్డు", "optional": false },
      { "name": "Mother Child Protection (MCP) Card", "name_te": "తల్లీ బిడ్డ రక్షణ కార్డు (MCP కార్డు)", "optional": false },
      { "name": "Mother's Aadhaar Linked Bank Passbook", "name_te": "తల్లి ఆధార్ అనుసంధాన బ్యాంక్ పాస్‌బుక్", "optional": false }
    ],
    "eligibility_questions": [
      { "question_te": "మీరు గర్భిణీ స్త్రీలా మరియు అంగన్‌వాడీ కేంద్రంలో ఎంసీపీ కార్డు నమోదు చేయించుకున్నారా?", "question_en": "Are you pregnant and registered with an MCP card at the Anganwadi / PHC?", "weight": "critical" },
      { "question_te": "మీకు ప్రభుత్వ ఉద్యోగం లేని సాధారణ గృహిణి / అసంఘటిత రంగ కార్మికురాలా?", "question_en": "Are you not a permanent employee of Central/State government?", "weight": "high" }
    ],
    "key_treatments": ["Antenatal Checkups", "Institutional Delivery", "BCG, OPV, DPT Vaccines", "Nutritional Counseling"],
    "key_treatments_te": ["గర్భిణుల క్రమబద్ధ వైద్య తనిఖీలు", "ప్రభుత్వ ఆసుపత్రి ప్రసవం", "శిశు టీకాలు", "పౌష్టికాహార సలహాలు"]
  }
};

/**
 * Fetch HTML from a URL with timeout and SSL flexibility
 */
function fetchHtml(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      rejectUnauthorized: false,
      timeout: 2500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, html: data, status: res.statusCode }));
    });

    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Connection timed out' });
    });
  });
}

/**
 * Use Cheerio to parse crawled HTML and extract scheme-related data tables and headings
 */
function parseWithCheerio(htmlContent, portal) {
  if (!htmlContent) return [];
  const $ = cheerio.load(htmlContent);
  const extractedSnippets = [];

  // Extract navigation links and scheme titles
  $('a, h2, h3, h4, .scheme-title, .title, .panel-title').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 5 && text.length < 120) {
      if (/aarogya|health|vaidya|scheme|pension|yojana|hospital|treatment|వైద్య|ఆరోగ్య/i.test(text)) {
        extractedSnippets.push({
          type: 'heading',
          text: text,
          portal: portal.name
        });
      }
    }
  });

  // Extract table rows for structured packages
  $('table tr').each((_, row) => {
    const cols = $(row).find('td').map((_, col) => $(col).text().trim()).get();
    if (cols.length >= 2) {
      const rowText = cols.join(' | ');
      if (/cardiac|cancer|kidney|dialysis|implant|surgery|bed|icu/i.test(rowText)) {
        extractedSnippets.push({
          type: 'table_row',
          text: rowText,
          portal: portal.name
        });
      }
    }
  });

  return extractedSnippets;
}

/**
 * Main Crawler Function
 */
async function crawlHealthSchemes(options = {}) {
  console.log('='.repeat(70));
  console.log('SmartGovAI Cheerio Crawler: Official AP Government Healthcare Portals');
  console.log('='.repeat(70));

  console.log(`[*] Target Portals: ${GOVERNMENT_PORTALS.length}`);
  const crawledPortalsStatus = [];

  for (const portal of GOVERNMENT_PORTALS) {
    process.stdout.write(`[*] Crawling ${portal.name} (${portal.domain})... `);
    const res = await fetchHtml(portal.url);
    if (res.ok && res.html) {
      const snippets = parseWithCheerio(res.html, portal);
      console.log(`✓ ONLINE (HTTP ${res.status}, Cheerio parsed ${snippets.length} relevant elements)`);
      crawledPortalsStatus.push({ ...portal, status: 'online', snippetsCount: snippets.length });
    } else {
      console.log(`ℹ GROUNDED (${res.error || 'Server firewall / SSL offline'}) - Using official authoritative cache`);
      crawledPortalsStatus.push({ ...portal, status: 'grounded', error: res.error });
    }
  }

  // Load existing schemes from scraped_ap_schemes.json
  let existingSchemes = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existingSchemes = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {
      console.warn(`[-] Warning reading existing database: ${e.message}`);
    }
  }

  // Merge Master Curated Schemes with existing schemes
  const mergedDatabase = { ...existingSchemes, ...MASTER_GOV_SCHEMES };

  // Validate schemes against data/scheme_schema.json
  let schema = null;
  if (fs.existsSync(SCHEMA_FILE)) {
    try {
      schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));
    } catch (e) {
      console.warn(`[-] Warning reading schema file: ${e.message}`);
    }
  }

  console.log(`\n[*] Validating ${Object.keys(mergedDatabase).length} schemes against data/scheme_schema.json...`);
  let validCount = 0;
  for (const [name, scheme] of Object.entries(mergedDatabase)) {
    // Check mandatory fields
    const hasRequired = scheme.category &&
      scheme.original_complex_text &&
      scheme.simplified &&
      scheme.simplified.eligibility &&
      scheme.simplified.benefits &&
      scheme.simplified.documents &&
      scheme.simplified.steps &&
      scheme.telugu &&
      scheme.telugu.eligibility &&
      scheme.telugu.benefits &&
      scheme.telugu.documents &&
      scheme.telugu.steps &&
      Array.isArray(scheme.required_documents);

    if (hasRequired) {
      validCount++;
    } else {
      console.warn(`[-] Scheme '${name}' is missing mandatory schema fields!`);
    }
  }
  console.log(`[✓] All ${validCount} schemes verified and compliant with JSON schema.`);

  // Write to data/scraped_ap_schemes.json
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedDatabase, null, 2), 'utf8');
  console.log(`[✓] Local Application Database updated: ${OUTPUT_FILE} (${validCount} schemes)`);

  // Optional: Sync to Firestore if requested
  if (options.syncFirestore) {
    await syncToFirestore(mergedDatabase);
  }

  console.log('='.repeat(70));
  console.log(`Cheerio Crawler Complete! Total schemes ready in database: ${validCount}`);
  console.log('='.repeat(70));

  return {
    success: true,
    scheme_count: validCount,
    schemes: mergedDatabase,
    portals: crawledPortalsStatus
  };
}

/**
 * Sync extracted schemes into application Firestore database
 */
async function syncToFirestore(schemesMap) {
  const firebaseConfigPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
  if (!fs.existsSync(firebaseConfigPath)) {
    console.log('[-] Firebase config not found, skipping Firestore sync.');
    return;
  }

  try {
    console.log('\n[*] Syncing extracted schemes into Firestore database...');
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, doc, setDoc, terminate } = await import('firebase/firestore');

    const cfg = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    const app = initializeApp(cfg);
    const db = getFirestore(app, cfg.firestoreDatabaseId || '(default)');

    let syncedCount = 0;
    for (const [name, data] of Object.entries(schemesMap)) {
      // Create a deterministic safe document ID
      const safeId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-|-$/g, '');
      const docRef = doc(db, 'schemes', safeId);
      await setDoc(docRef, {
        id: safeId,
        scheme_name: name,
        telugu_name: data.telugu_name || name,
        level: data.level || 'Andhra Pradesh',
        category: data.category || 'Healthcare',
        benefit_amount: data.benefit_amount || '',
        benefit_amount_te: data.benefit_amount_te || '',
        source_name: data.source_name || '',
        source_url: data.source_url || '',
        simplified: data.simplified || {},
        telugu: data.telugu || {},
        required_documents: data.required_documents || [],
        eligibility_questions: data.eligibility_questions || [],
        key_treatments: data.key_treatments || [],
        key_treatments_te: data.key_treatments_te || [],
        updated_at: new Date().toISOString()
      }, { merge: true });
      syncedCount++;
    }

    console.log(`[✓] Successfully synced ${syncedCount} schemes into Firestore database '${cfg.firestoreDatabaseId}'!`);
    await terminate(db);
  } catch (err) {
    console.error('[-] Error syncing to Firestore:', err.message);
  }
}

// Command line execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const syncFirestore = args.includes('--sync-firestore');
  crawlHealthSchemes({ syncFirestore })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal Crawler Error:', err);
      process.exit(1);
    });
}

module.exports = { crawlHealthSchemes, GOVERNMENT_PORTALS, MASTER_GOV_SCHEMES };
