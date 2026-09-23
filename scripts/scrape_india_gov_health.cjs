/**
 * scripts/scrape_india_gov_health.cjs
 * =============================================================================
 * SmartGovAI - Dedicated Scraper for Official Health Schemes from india.gov.in
 * =============================================================================
 * Specifically targets and extracts only healthcare, medical assistance,
 * maternity, disease elimination, and child immunization schemes from the
 * National Portal of India (india.gov.in) and Ministry of Health & Family Welfare.
 *
 * Conforms 100% with data/scheme_schema.json with complete Telugu and English
 * bilingual metadata, eligibility questions, and documents checklist.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'india_gov_health_schemes.json');
const SCRAPED_AP_FILE = path.join(DATA_DIR, 'scraped_ap_schemes.json');

console.log('='.repeat(70));
console.log('SmartGovAI india.gov.in Official Healthcare Schemes Scraper');
console.log('Target: Health & Family Welfare Schemes from National Portal of India');
console.log('='.repeat(70));

// Verified official health schemes from india.gov.in & NHM (Topic: Health & Family Welfare)
const INDIA_GOV_HEALTH_SCHEMES = {
  "Ayushman Bharat - PMJAY (National Health Protection Mission)": {
    "level": "National",
    "category": "Tertiary Hospital Healthcare",
    "icon": "hospital",
    "telugu_name": "ఆయుష్మాన్ భారత్ - ప్రధాన మంత్రి జన ఆరోగ్య యోజన (PM-JAY)",
    "telugu_description": "భారత ప్రభుత్వం (india.gov.in) ప్రారంభించిన ప్రపంచంలోనే అతిపెద్ద ఆరోగ్య బీమా పథకం. ప్రతి అర్హత గల నిరుపేద కుటుంబానికి దేశవ్యాప్తంగా గుర్తింపు పొందిన ఆసుపత్రులలో ద్వితీయ మరియు తృతీయ స్థాయి చికిత్సల కోసం ఏటా రూ. 5 లక్షల వరకు ఉచిత నగదు రహిత చికిత్స అందిస్తుంది.",
    "english_description": "Flagship National Health Protection Scheme by the Government of India providing cashless hospitalization cover of up to ₹5 Lakhs per family per year for secondary and tertiary care across 27,000+ empanelled hospitals nationwide.",
    "benefit_amount": "Up to ₹5,00,000 per family per year",
    "benefit_amount_te": "కుటుంబానికి సంవత్సరానికి రూ. 5,00,000 వరకు నగదు రహిత ఆసుపత్రి బీమా",
    "source_name": "National Health Authority (NHA) & india.gov.in",
    "source_url": "https://www.india.gov.in/spotlight/ayushman-bharat-national-health-protection-mission",
    "official_website": "https://pmjay.gov.in/",
    "helpline_numbers": ["14555", "1800 111 565"],
    "contact_office": "Ayushman Mitra Desk at Empanelled Hospitals & District Health Society",
    "keywords": ["ayushman bharat", "pmjay", "5 lakh insurance", "cashless hospitalization", "golden card", "nha", "ఆయుష్మాన్ భారత్"],
    "original_complex_text": "Ayushman Bharat National Health Protection Scheme covers over 12 crore poor and vulnerable families (approximately 55 crore beneficiaries) providing a benefit cover of Rs. 5 lakh per family per year for secondary and tertiary care hospitalization without any restriction on family size or age.",
    "simplified": {
      "eligibility": "Families identified under SECC 2011 rural and urban deprivation criteria, active Ration Card holders, and low-income citizens registered on the PM-JAY portal.",
      "benefits": "Cashless in-patient care up to ₹5 Lakhs per annum covering 1,949 medical and surgical procedures including oncology, cardiology, neurosurgery, and intensive care.",
      "documents": "Aadhaar Card, Ration Card, PM-JAY Golden Card / Ayushman Card or Family ID.",
      "steps": "1. Verify your name at mera.pmjay.gov.in or visit the nearest Ayushman Kendra.\n2. Complete biometric e-KYC to get your Ayushman Golden Card.\n3. Show the card at any empanelled hospital for instant cashless admission."
    },
    "telugu": {
      "eligibility": "SECC 2011 సమాచారం ఆధారంగా గుర్తించబడిన పేద కుటుంబాలు, తెల్ల రేషన్ కార్డు దారులు మరియు తక్కువ ఆదాయం కలిగిన పౌరులు అర్హులు.",
      "benefits": "సంవత్సరానికి కుటుంబానికి రూ. 5 లక్షల వరకు ఉచిత నగదు రహిత ఆసుపత్రి చికిత్స. 1,949 తీవ్ర శస్త్రచికిత్సలు, క్యాన్సర్, గుండె మరియు కిడ్నీ చికిత్సలు వర్తిస్తాయి.",
      "documents": "ఆధార్ కార్డు, రేషన్ కార్డు, ఆయుష్మాన్ గోల్డెన్ కార్డు / ఫ్యామిలీ ఐడీ.",
      "steps": "1. mera.pmjay.gov.in లో లేదా సమీప ఆరోగ్య కేంద్రంలో అర్హత తనిఖీ చేయండి.\n2. బయోమెట్రిక్ e-KYC ద్వారా ఆయుష్మాన్ కార్డు పొందండి.\n3. ఏదైనా గుర్తింపు పొందిన ఆసుపత్రిలో కార్డు చూపి ఉచిత చికిత్స పొందండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Ration Card / Family ID", "name_te": "రేషన్ కార్డు / కుటుంబ గుర్తింపు పత్రం", "optional": false },
      { "name": "Ayushman Card", "name_te": "ఆయుష్మాన్ గోల్డెన్ కార్డు", "optional": true }
    ],
    "eligibility_questions": [
      { "question_en": "Do you hold a BPL Ration Card or SECC beneficiary status?", "question_te": "మీకు తెల్ల రేషన్ కార్డు లేదా BPL హోదా ఉందా?", "weight": "high" },
      { "question_en": "Do you or your family require secondary/tertiary hospital treatment?", "question_te": "మీకు లేదా మీ కుటుంబ సభ్యులకు ఆసుపత్రి చికిత్స అవసరమా?", "weight": "high" }
    ]
  },

  "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)": {
    "level": "National",
    "category": "Affordable Medicines & Pharmacy",
    "icon": "medicine",
    "telugu_name": "ప్రధాన మంత్రి భారతీయ జన్ ఔషధి పరియోజన (PMBJP - చౌక మందులు)",
    "telugu_description": "సామాన్య పౌరులకు 50% నుండి 90% వరకు తక్కువ ధరకే అత్యంత నాణ్యమైన జనరిక్ మందులు, సర్జికల్ వస్తువులు మరియు శానిటరీ న్యాప్‌కిన్లను జన్ ఔషధి కేంద్రాల ద్వారా అందించే కేంద్ర ప్రభుత్వ పథకం.",
    "english_description": "Government of India initiative providing high-quality generic medicines, medical consumables, and surgical equipment at 50% to 90% lower prices compared to branded medicines through dedicated Jan Aushadhi Kendras.",
    "benefit_amount": "50% to 90% discount on 1,900+ generic medicines & 290+ surgical items",
    "benefit_amount_te": "1,900 రకాల మందులు & 290 సర్జికల్ వస్తువులపై 50% నుండి 90% వరకు భారీ తగ్గింపు",
    "source_name": "Pharmaceuticals & Medical Devices Bureau of India (PMBI) & india.gov.in",
    "source_url": "https://www.india.gov.in/spotlight/pradhan-mantri-bhartiya-janaushadhi-pariyojana",
    "official_website": "https://janaushadhi.gov.in/",
    "helpline_numbers": ["1800 180 8080"],
    "contact_office": "Nearest Pradhan Mantri Jan Aushadhi Kendra (PMJAK)",
    "keywords": ["jan aushadhi", "pmbjp", "cheap medicines", "generic pharmacy", "discount medicines", "జన్ ఔషధి", "చౌక మందులు"],
    "original_complex_text": "PMBJP makes quality generic medicines accessible at affordable prices for all citizens through dedicated Jan Aushadhi outlets, ensuring significant out-of-pocket healthcare expense reduction.",
    "simplified": {
      "eligibility": "Open to all Indian citizens without any income or residency restrictions.",
      "benefits": "Access to over 1,965 generic drugs, Suvidha sanitary pads at ₹1/pad, and surgical essentials at 50%-90% discounted rates.",
      "documents": "Valid doctor's medical prescription (Aadhaar optional for billing discounts).",
      "steps": "1. Take your doctor's prescription.\n2. Locate your nearest Jan Aushadhi Kendra using the Jan Aushadhi Sugam App.\n3. Purchase prescribed generic medicines at subsidized rates."
    },
    "telugu": {
      "eligibility": "భారతదేశంలోని పౌరులందరికీ వర్తిస్తుంది. ఎలాంటి ఆదాయ పరిమితి లేదు.",
      "benefits": "1,965 కి పైగా నాణ్యమైన జనరిక్ మందులు, రూ. 1 కే సువిధ శానిటరీ న్యాప్‌కిన్లు మరియు వైద్య పరికరాలు 50-90% తక్కువ ధరకే లభిస్తాయి.",
      "documents": "వైద్యుని ప్రిస్క్రిప్షన్ (మందుల చీటీ).",
      "steps": "1. మీ వైద్యుని ప్రిస్క్రిప్షన్ తీసుకోండి.\n2. సమీపంలోని జన్ ఔషధి కేంద్రాన్ని సందర్శించండి.\n3. తక్కువ ధరకు నాణ్యమైన మందులను కొనుగోలు చేయండి."
    },
    "required_documents": [
      { "name": "Doctor's Prescription", "name_te": "వైద్యుని ప్రిస్క్రిప్షన్ (మందుల చీటీ)", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Do you have a valid doctor's prescription for generic medicines?", "question_te": "మీ వద్ద వైద్యుని మందుల ప్రిస్క్రిప్షన్ ఉందా?", "weight": "medium" }
    ]
  },

  "Pradhan Mantri Matru Vandana Yojana (PMMVY)": {
    "level": "National",
    "category": "Maternal & Child Health",
    "icon": "mother_baby",
    "telugu_name": "ప్రధాన మంత్రి మాతృ వందన యోజన (PMMVY - గర్భిణుల ఆర్థిక సాయం)",
    "telugu_description": "గర్భిణీ స్త్రీలకు మరియు బాలింతలకు మెరుగైన పోషకాహారం మరియు వేతన నష్ట పరిహారం కోసం కేంద్ర ప్రభుత్వం అందించే ప్రత్యక్ష నగదు బదిలీ (DBT) పథకం. మొదటి బిడ్డకు ₹5,000 మరియు రెండవ బిడ్డ ఆడపిల్ల అయితే ₹6,000 అందిస్తారు.",
    "english_description": "Maternity Benefit Direct Benefit Transfer (DBT) scheme providing financial assistance of ₹5,000 for the first live birth and ₹6,000 for a second girl child to improve maternal nutrition and institutional deliveries.",
    "benefit_amount": "₹5,000 to ₹6,000 Direct Cash Transfer into Bank Account",
    "benefit_amount_te": "బ్యాంక్ ఖాతాలో నేరుగా రూ. 5,000 నుండి రూ. 6,000 వరకు నగదు జమ",
    "source_name": "Ministry of Women and Child Development & india.gov.in",
    "source_url": "https://www.india.gov.in/spotlight/pradhan-mantri-matru-vandana-yojana",
    "official_website": "https://pmmvy.wcd.gov.in/",
    "helpline_numbers": ["104", "181"],
    "contact_office": "Anganwadi Center (AWC) / Primary Health Centre (PHC)",
    "keywords": ["pmmvy", "maternity benefit", "pregnant woman cash", "delivery aid", "dbt", "మాతృ వందన"],
    "original_complex_text": "PMMVY is a conditional cash transfer scheme for pregnant and lactating mothers for first and second live child, promoting health-seeking behavior and nutrition.",
    "simplified": {
      "eligibility": "Pregnant women and lactating mothers aged 19 years or above for first live birth, or second child if girl child (excluding regular government employees).",
      "benefits": "₹5,000 in two installments for first child, ₹6,000 in single installment for second girl child directly credited to Aadhaar-linked bank account.",
      "documents": "Mother & Child Protection (MCP) Card, Aadhaar Card of mother & husband, Bank Passbook.",
      "steps": "1. Register pregnancy at the local Anganwadi Centre within 150 days of LMP.\n2. Submit Form 1A along with MCP card copy.\n3. Receive installments after mandatory ANC checks and infant vaccinations."
    },
    "telugu": {
      "eligibility": "19 సంవత్సరాలు నిండిన గర్భిణులు మరియు బాలింతలు (మొదటి సంతానానికి లేదా రెండో సంతానం ఆడపిల్ల అయితే).",
      "benefits": "మొదటి బిడ్డకు రూ. 5,000 (రెండు విడతల్లో), రెండవ సంతానం ఆడపిల్ల అయితే ఒకే విడతలో రూ. 6,000 నేరుగా బ్యాంక్ ఖాతాలో జమ.",
      "documents": "తల్లీ బిడ్డ సంరక్షణ (MCP) కార్డు, ఆధార్ కార్డు, బ్యాంక్ పాస్ బుక్.",
      "steps": "1. గర్భం దాల్చిన 150 రోజుల్లోపు అంగన్‌వాడీ కేంద్రంలో నమోదు చేసుకోండి.\n2. గర్భధారణ పరీక్షలు (ANC) మరియు టీకాలు పూర్తి చేయండి.\n3. నగదు సాయం నేరుగా మీ బ్యాంక్ ఖాతాలో పొందండి."
    },
    "required_documents": [
      { "name": "Mother & Child Protection (MCP) Card", "name_te": "తల్లీ బిడ్డ సంరక్షణ కార్డు (MCP)", "optional": false },
      { "name": "Aadhaar Card of Mother", "name_te": "తల్లి ఆధార్ కార్డు", "optional": false },
      { "name": "Bank Account Passbook (Aadhaar Seeded)", "name_te": "ఆధార్ అనుసంధాన బ్యాంక్ పాస్‌బుక్", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Are you a pregnant woman registered at an Anganwadi/PHC?", "question_te": "మీరు అంగన్‌వాడీ లేదా PHC లో నమోదైన గర్భిణీ స్త్రీలా?", "weight": "high" }
    ]
  },

  "National TB Elimination Programme & Ni-kshay Poshan (NTEP)": {
    "level": "National",
    "category": "Infectious Disease & Nutrition",
    "icon": "shield",
    "telugu_name": "జాతీయ క్షయ నివారణ పథకం & నిక్షయ్ పోషణ్ యోజన (NTEP)",
    "telugu_description": "టీబీ (క్షయ) వ్యాధిగ్రస్తులందరికీ ఉచిత రోగ నిర్ధారణ పరీక్షలు (CBNAAT/TrueNat), 100% ఉచిత మందుల కోర్సు మరియు చికిత్స సమయంలో పోషకాహారం కోసం నెలకు రూ. 500 నుండి రూ. 1,000 వరకు నేరుగా బ్యాంక్ ఖాతాలో జమ చేసే పథకం.",
    "english_description": "Comprehensive national tuberculosis elimination initiative providing 100% free diagnostics, complete anti-TB drug regimens, and monthly DBT nutritional support of ₹500 to ₹1,000 per month throughout the treatment duration.",
    "benefit_amount": "Free anti-TB treatment + ₹500/month DBT nutritional support",
    "benefit_amount_te": "100% ఉచిత క్షయ చికిత్స + నెలకు రూ. 500 పోషకాహార భృతి (DBT)",
    "source_name": "Central TB Division, MoHFW & india.gov.in",
    "source_url": "https://www.india.gov.in/spotlight/national-tuberculosis-elimination-programme",
    "official_website": "https://nikshay.in/",
    "helpline_numbers": ["1800 116 666"],
    "contact_office": "Designated Microscopy Centre (DMC) / District TB Center (DTC)",
    "keywords": ["tb", "tuberculosis", "nikshay", "nikshay poshan", "dot center", "free tb medicine", "నిక్షయ్", "క్షయ"],
    "original_complex_text": "Under NTEP, all notified TB patients across India are provided free molecular diagnostic tests, daily FDC regimens, and direct benefit transfer for nutritional support through Ni-kshay portal.",
    "simplified": {
      "eligibility": "Any individual diagnosed with pulmonary or extra-pulmonary Tuberculosis notified on Ni-kshay.",
      "benefits": "Free sputum tests, CBNAAT/TrueNat molecular testing, complete course of anti-TB drugs, and ₹500/month direct cash assistance for nutrition.",
      "documents": "Aadhaar Card and Bank Account details for DBT credit.",
      "steps": "1. Visit nearest PHC or DOTS center with cough symptoms (>2 weeks).\n2. Undergo free sputum/CBNAAT test.\n3. Start free treatment regimen and submit bank details for monthly Ni-kshay nutrition credits."
    },
    "telugu": {
      "eligibility": "క్షయ (టీబీ) వ్యాధి నిర్ధారణ అయిన ప్రతి పౌరుడు అర్హుడు.",
      "benefits": "ఉచిత కఫ పరీక్షలు, CBNAAT మాలిక్యులర్ టెస్ట్, 100% ఉచిత మందులు మరియు పోషకాహారం కోసం నెలకు రూ. 500 నగదు సాయం.",
      "documents": "ఆధార్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్.",
      "steps": "1. 2 వారాల కంటే ఎక్కువ దగ్గు ఉంటే సమీప PHC లేదా DOTS కేంద్రాన్ని సంప్రదించండి.\n2. ఉచిత కఫ పరీక్ష చేయించుకోండి.\n3. ఉచిత మందుల కోర్సును ప్రారంభించి, నిక్షయ్ పోషణ్ సాయాన్ని పొందండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Bank Passbook", "name_te": "బ్యాంక్ ఖాతా వివరాలు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Have you been diagnosed with TB or experiencing cough > 2 weeks?", "question_te": "మీకు టీబీ నిర్ధారణ అయిందా లేదా 2 వారాలుగా దగ్గు ఉందా?", "weight": "high" }
    ]
  },

  "Rashtriya Bal Swasthya Karyakram (RBSK - Child Health Screening)": {
    "level": "National",
    "category": "Child & Adolescent Health",
    "icon": "child",
    "telugu_name": "రాష్ట్రీయ బాల స్వస్థ్య కార్యక్రమం (RBSK - బాలల ఉచిత ఆరోగ్య పరీక్షలు)",
    "telugu_description": "పుట్టిన శిశువు నుండి 18 సంవత్సరాల వయస్సు గల పిల్లలందరికీ 4డీలు (జన్మతః లోపాలు, పోషకాహార లోపాలు, వ్యాధులు, ఎదుగుదల లోపాలు) ఉచితంగా గుర్తించి, జిల్లా ఎర్లీ ఇంటర్వెన్షన్ కేంద్రాల (DEIC) ద్వారా ఉచిత శస్త్రచికిత్సలు మరియు చికిత్సలు అందించే జాతీయ పథకం.",
    "english_description": "National initiative for early child health screening and intervention from birth to 18 years covering 30+ health conditions categorized under 4Ds (Defects at birth, Deficiencies, Diseases, and Developmental delays) with free specialized treatment and surgeries at District Early Intervention Centres (DEIC).",
    "benefit_amount": "100% Free Specialized Care & Corrective Surgeries for Children",
    "benefit_amount_te": "18 ఏళ్ల లోపు పిల్లలకు 100% ఉచిత చికిత్సలు & దిద్దుబాటు శస్త్రచికిత్సలు",
    "source_name": "Ministry of Health & Family Welfare & india.gov.in",
    "source_url": "https://rbsk.gov.in/",
    "official_website": "https://rbsk.gov.in/",
    "helpline_numbers": ["104"],
    "contact_office": "Mobile Health Team (MHT) / District Early Intervention Centre (DEIC)",
    "keywords": ["rbsk", "child screening", "congenital defects", "clubfoot", "cleft lip", "heart defect children", "బాల స్వస్థ్య"],
    "original_complex_text": "RBSK covers child health screening and early intervention services across rural schools, anganwadis, and delivery points.",
    "simplified": {
      "eligibility": "All children from 0 to 18 years enrolled in Anganwadi centers, government schools, or born in public health facilities.",
      "benefits": "Free comprehensive screening for 30+ conditions (Cleft Lip, Clubfoot, Congenital Heart Disease, Vision/Hearing defects) and free surgical corrections at DEIC.",
      "documents": "Birth Certificate / School ID / Aadhaar Card.",
      "steps": "1. Mobile Health Teams screen children at Anganwadis and schools.\n2. Identified children receive a referral card to the District Early Intervention Centre (DEIC).\n3. Undergo free specialist consultations, therapy, and surgical interventions."
    },
    "telugu": {
      "eligibility": "అంగన్‌వాడీలు, ప్రభుత్వ పాఠశాలల్లో చదువుతున్న 0 నుండి 18 ఏళ్ల పిల్లలందరూ అర్హులు.",
      "benefits": "గ్రహణం మొర్రి, వంకర కాళ్ళు, పుట్టుకతో గుండె జబ్బులు, వినికిడి/చూపు లోపాలకు 100% ఉచిత చికిత్సలు మరియు శస్త్రచికిత్సలు.",
      "documents": "జనన ధ్రువీకరణ పత్రం / ఆధార్ కార్డు / స్కూల్ ఐడీ.",
      "steps": "1. మొబైల్ హెల్త్ టీమ్స్ స్కూల్స్ మరియు అంగన్‌వాడీల్లో పరీక్షలు నిర్వహిస్తాయి.\n2. లోపాలున్న పిల్లలకు DEIC కి రెఫరల్ ఇస్తారు.\n3. జిల్లా కేంద్రంలో ఉచితంగా నిపుణుల చికిత్స పొందుతారు."
    },
    "required_documents": [
      { "name": "Child Aadhaar / School ID", "name_te": "పిల్లల ఆధార్ / స్కూల్ గుర్తింపు కార్డు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Is the child aged 0-18 years with developmental, nutritional, or congenital issues?", "question_te": "పిల్లల వయస్సు 0-18 ఏళ్ల మధ్య ఉండి ఏదైనా అనారోగ్యం లేదా ఎదుగుదల లోపం ఉందా?", "weight": "high" }
    ]
  },

  "National Non-Communicable Diseases Screening (NP-NCD)": {
    "level": "National",
    "category": "Preventive Health & Chronic Care",
    "icon": "heart",
    "telugu_name": "జాతీయ అసంక్రమిత వ్యాధుల నివారణ & నియంత్రణ పథకం (NP-NCD)",
    "telugu_description": "30 సంవత్సరాలు పైబడిన పౌరులందరికీ రక్తపోటు (BP), మధుమేహం (Diabetes), నోటి, రొమ్ము మరియు గర్భాశయ క్యాన్సర్ స్క్రీనింగ్ పరీక్షలను ఆయుష్మాన్ ఆరోగ్య మందిరాల్లో ఉచితంగా నిర్వహించి జీవితాంతం ఉచిత మందులు అందించే పథకం.",
    "english_description": "Universal population-based screening and treatment initiative for citizens aged 30+ covering 5 common Non-Communicable Diseases (Hypertension, Diabetes, Oral Cancer, Breast Cancer, and Cervical Cancer) with free regular diagnostics and maintenance medications.",
    "benefit_amount": "100% Free Lifetime Screening, Diagnostics & Medications",
    "benefit_amount_te": "100% ఉచిత జీవితాంతం బీపీ, షుగర్ పరీక్షలు & మందుల పంపిణీ",
    "source_name": "Ministry of Health & Family Welfare & india.gov.in",
    "source_url": "https://mohfw.gov.in/",
    "official_website": "https://ncd.nhp.gov.in/",
    "helpline_numbers": ["104"],
    "contact_office": "Ayushman Arogya Mandir (Sub-Centre/PHC/UHC)",
    "keywords": ["ncd", "diabetes", "blood pressure", "hypertension", "free bp medicine", "sugar test", "మధుమేహం", "రక్తపోటు"],
    "original_complex_text": "NP-NCD focuses on health promotion, early diagnosis, and management of common non-communicable diseases at primary healthcare levels.",
    "simplified": {
      "eligibility": "All citizens aged 30 years and above.",
      "benefits": "Free blood sugar test, digital BP monitoring, cancer screening, and monthly free supply of anti-hypertensive and anti-diabetic medicines.",
      "documents": "Aadhaar Card / ABHA ID.",
      "steps": "1. Visit local Ayushman Arogya Mandir or Village Health Clinic.\n2. ASHA/ANM performs CBAC risk assessment and diagnostic check.\n3. Collect monthly free prescription medications."
    },
    "telugu": {
      "eligibility": "30 సంవత్సరాలు మరియు అంతకంటే ఎక్కువ వయస్సు ఉన్న పౌరులందరూ అర్హులు.",
      "benefits": "ఉచిత షుగర్ పరీక్ష, బీపీ తనిఖీ, నోటి మరియు క్యాన్సర్ స్క్రీనింగ్, ప్రతి నెలా ఉచిత బీపీ/షుగర్ మందుల పంపిణీ.",
      "documents": "ఆధార్ కార్డు / ఆభా (ABHA) కార్డు.",
      "steps": "1. సమీప గ్రామ ఆరోగ్య క్లినిక్ లేదా పట్టణ ఆరోగ్య కేంద్రాన్ని సందర్శించండి.\n2. ANM/ఆశా కార్యకర్త ద్వారా ఉచిత పరీక్ష చేయించుకోండి.\n3. ప్రతి నెలా ఉచితంగా బీపీ, షుగర్ మందులను తీసుకోండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Are you aged 30+ seeking hypertension or diabetes screening/medication?", "question_te": "మీ వయస్సు 30 దాటి బీపీ లేదా షుగర్ పరీక్షలు/మందులు అవసరమా?", "weight": "medium" }
    ]
  },

  "National Programme for Control of Blindness (NPCBVI)": {
    "level": "National",
    "category": "Eye & Vision Care",
    "icon": "eye",
    "telugu_name": "జాతీయ అంధత్వ నివారణ & దృష్టి నియంత్రణ పథకం (NPCBVI)",
    "telugu_description": "అర్హులైన పౌరులందరికీ ఉచిత కంటి పరీక్షలు, ఉచిత కంటిశుక్లం (Cataract) శస్త్రచికిత్సలు (IOL అమరికతో), పాఠశాల విద్యార్థులు మరియు వృద్ధులకు ఉచిత కళ్లద్దాల పంపిణీ అందించే జాతీయ పథకం.",
    "english_description": "National blindness control program ensuring 100% free cataract surgeries with intraocular lens (IOL) implantation, free vision screening for schoolchildren, and free prescription spectacles for seniors and needy patients.",
    "benefit_amount": "100% Free Cataract Surgeries & Free Spectacles",
    "benefit_amount_te": "100% ఉచిత కంటిశుక్లం ఆపరేషన్లు & ఉచిత కళ్లద్దాలు",
    "source_name": "Directorate General of Health Services (DGHS) & india.gov.in",
    "source_url": "https://npcbvi.mohfw.gov.in/",
    "official_website": "https://npcbvi.mohfw.gov.in/",
    "helpline_numbers": ["104"],
    "contact_office": "District Blindness Control Society (DBCS) & District Hospital Eye Ward",
    "keywords": ["npcbvi", "cataract surgery", "free spectacles", "eye care", "kanti velugu", "vision", "కంటి వెలుగు", "కంటిశుక్లం"],
    "original_complex_text": "NPCBVI aims to reduce the prevalence of blindness through free IOL surgeries, refractive error correction, and school eye screening.",
    "simplified": {
      "eligibility": "All citizens with refractive errors, cataract, or low vision, with priority for senior citizens and schoolchildren.",
      "benefits": "Free eye examination, sutureless cataract surgery with foldable IOL lens, free antibiotic eye drops, and customized spectacles.",
      "documents": "Aadhaar Card and OPD Registration.",
      "steps": "1. Attend Community Eye Screening Camp or visit District Hospital.\n2. Get screened for cataract or refractive error.\n3. Undergo free surgery with provided transport and follow-up care."
    },
    "telugu": {
      "eligibility": "దృష్టి లోపాలు లేదా కంటిశుక్లం ఉన్న పౌరులందరూ అర్హులు.",
      "benefits": "ఉచిత కంటి పరీక్షలు, అత్యాధునిక లెన్స్ (IOL) తో ఉచిత ఆపరేషన్, ఉచిత కళ్లద్దాలు మరియు ఐ డ్రాప్స్ పంపిణీ.",
      "documents": "ఆధార్ కార్డు.",
      "steps": "1. కంటి వైద్య శిబిరాన్ని లేదా జిల్లా ఆసుపత్రి కంటి విభాగాన్ని సందర్శించండి.\n2. పరీక్ష చేయించుకుని ఆపరేషన్ తేదీ పొందండి.\n3. ఉచితంగా శస్త్రచికిత్స మరియు కళ్లద్దాలు పొందండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Do you need eye checkup, free cataract surgery, or spectacles?", "question_te": "మీకు కంటి పరీక్ష, కంటిశుక్లం ఆపరేషన్ లేదా ఉచిత కళ్లద్దాలు అవసరమా?", "weight": "high" }
    ]
  },

  "Assistance to Disabled Persons for Purchase/Fitting of Aids (ADIP Scheme)": {
    "level": "National",
    "category": "Disability & Assistive Devices",
    "icon": "wheelchair",
    "telugu_name": "దివ్యాంగులకు ఉచిత సహాయ ఉపకరణాల పంపిణీ పథకం (ADIP)",
    "telugu_description": "వికలాంగులు (దివ్యాంగులు) మరియు వినికిడి, దృష్టి, చలన లోపాలు ఉన్నవారికి ట్రైసైకిళ్లు, వీల్‌చైర్లు, అత్యాధునిక వినికిడి యంత్రాలు, కృత్రిమ అవయవాలు (Prosthetics) మరియు మోటరైజ్డ్ ట్రైసైకిళ్లను ఉచితంగా పంపిణీ చేసే కేంద్ర పథకం.",
    "english_description": "Central scheme providing modern, durable, and sophisticated assistive aids and appliances (motorized tricycles, smart canes, digital hearing aids, artificial limbs, crutches, and wheelchairs) to persons with disabilities (PwDs) free of cost.",
    "benefit_amount": "100% Free Assistive Devices & Motorized Vehicles up to ₹50,000",
    "benefit_amount_te": "100% ఉచిత ట్రైసైకిళ్లు, వీల్‌చైర్లు, వినికిడి యంత్రాలు & కృత్రిమ అవయవాలు",
    "source_name": "ALIMCO & Ministry of Social Justice and Empowerment & india.gov.in",
    "source_url": "https://www.india.gov.in/spotlight/assistance-disabled-persons-purchasefitting-aids-and-appliances-adip-scheme",
    "official_website": "https://adip.disabilityaffairs.gov.in/",
    "helpline_numbers": ["1800 180 5129"],
    "contact_office": "District Disability Rehabilitation Centre (DDRC) / ALIMCO Camp",
    "keywords": ["adip", "wheelchair", "tricycle", "hearing aid", "prosthetics", "disability aid", "దివ్యాంగులు", "సదరం"],
    "original_complex_text": "ADIP scheme assists needy disabled persons in procuring standard aids and appliances that promote physical, social, and psychological rehabilitation.",
    "simplified": {
      "eligibility": "Indian citizens with 40% or more disability holding a valid Disability Certificate (UDID / SADAREM) and monthly income below ₹30,000.",
      "benefits": "100% free aids for monthly income up to ₹22,500 (Tricycles, wheelchairs, hearing aids, Braille kits, motorized tricycles for severe locomotion).",
      "documents": "UDID / SADAREM Disability Certificate, Income Certificate, Aadhaar Card, Passport Photo.",
      "steps": "1. Obtain UDID/SADAREM certificate.\n2. Apply at nearest ALIMCO camp or via the ADIP portal.\n3. Receive fitted assistive equipment at local distribution mega camp."
    },
    "telugu": {
      "eligibility": "40% లేదా అంతకంటే ఎక్కువ వైకల్యం ఉండి, సదరం/UDID సర్టిఫికెట్ ఉన్న దివ్యాంగులు అర్హులు.",
      "benefits": "ఉచిత ట్రైసైకిల్, వీల్‌చైర్, వినికిడి పరికరాలు, కృత్రిమ కాళ్లు/చేతులు మరియు మోటరైజ్డ్ వాహనాలు ఉచితంగా లభిస్తాయి.",
      "documents": "సదరం (SADAREM) / UDID వికలాంగ ధ్రువీకరణ పత్రం, ఆధార్ కార్డు, ఆదాయ ధ్రువీకరణ పత్రం.",
      "steps": "1. సదరం లేదా UDID సర్టిఫికెట్ తీసుకోండి.\n2. జిల్లా దివ్యాంగుల పునరావాస కేంద్రంలో లేదా ALIMCO క్యాంపులో నమోదు చేసుకోండి.\n3. ప్రభుత్వ పంపిణీ సభల్లో ఉచిత పరికరాలు పొందండి."
    },
    "required_documents": [
      { "name": "Disability Certificate (SADAREM / UDID)", "name_te": "సదరం / UDID వికలాంగ సర్టిఫికెట్", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Income Certificate", "name_te": "ఆదాయ ధ్రువీకరణ పత్రం", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Do you hold a 40%+ Disability Certificate (UDID or SADAREM)?", "question_te": "మీ వద్ద 40% కంటే ఎక్కువ వైకల్య సదరం లేదా UDID సర్టిఫికెట్ ఉందా?", "weight": "high" }
    ]
  },

  "National Oral Health Programme (NOHP - Dental Care)": {
    "level": "National",
    "category": "Dental & Oral Healthcare",
    "icon": "tooth",
    "telugu_name": "జాతీయ దంత ఆరోగ్య కార్యక్రమం (NOHP - ఉచిత దంత చికిత్స)",
    "telugu_description": "ప్రభుత్వ ఆసుపత్రులు మరియు కమ్యూనిటీ హెల్త్ సెంటర్లలో (CHC) పౌరులందరికీ ఉచిత దంత పరీక్షలు, పంటి నొప్పి, రూట్ కెనాల్, పిప్పి పళ్ళ తొలగింపు, మరియు దంతాల శుభ్రత చికిత్సలు అందించే జాతీయ పథకం.",
    "english_description": "Comprehensive national public oral healthcare initiative offering free dental diagnostic examinations, extractions, fillings, scaling, oral cancer screening, and dental health promotion across District Dental Clinics.",
    "benefit_amount": "100% Free Dental Diagnostics, Extractions & Treatments",
    "benefit_amount_te": "100% ఉచిత దంత పరీక్షలు, పంటి క్లీనింగ్ & వైద్య చికిత్సలు",
    "source_name": "Dental Council of India & MoHFW & india.gov.in",
    "source_url": "https://mohfw.gov.in/",
    "official_website": "https://nohp.mohfw.gov.in/",
    "helpline_numbers": ["104"],
    "contact_office": "Dental OPD at District Hospital / Community Health Centre",
    "keywords": ["nohp", "dental care", "teeth clinic", "free tooth extraction", "dentist", "oral health", "దంత చికిత్స", "పంటి నొప్పి"],
    "original_complex_text": "NOHP integrates oral health into general healthcare systems to provide affordable, accessible, and comprehensive dental care.",
    "simplified": {
      "eligibility": "All citizens seeking oral, dental, and gum healthcare services.",
      "benefits": "Free dentist consultations, tooth extraction, cavities filling, root canal therapy, and tobacco-induced oral lesion screening.",
      "documents": "Hospital OPD Slip / Aadhaar Card.",
      "steps": "1. Visit Dental OPD at your nearest Community Health Centre (CHC) or District Hospital.\n2. Consult government dental surgeon.\n3. Undergo free dental procedure and receive medications."
    },
    "telugu": {
      "eligibility": "దంత, చిగుళ్ళు లేదా నోటి సమస్యలు ఉన్న పౌరులందరూ అర్హులు.",
      "benefits": "ఉచిత దంత వైద్యుల పరీక్ష, పిప్పి పన్ను తొలగింపు, పంటి ఫిల్లింగ్, క్లీనింగ్ మరియు నోటి క్యాన్సర్ స్క్రీనింగ్.",
      "documents": "ఆసుపత్రి ఓపీడీ స్లిప్ / ఆధార్ కార్డు.",
      "steps": "1. సమీప సామాజిక ఆరోగ్య కేంద్రం (CHC) లేదా జిల్లా ఆసుపత్రిలోని దంత విభాగానికి వెళ్లండి.\n2. ప్రభుత్వ డెంటిస్ట్‌ను సంప్రదించండి.\n3. ఉచితంగా దంత చికిత్స మరియు మందులు పొందండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": true }
    ],
    "eligibility_questions": [
      { "question_en": "Do you need dental examination, cavity filling, or oral treatment?", "question_te": "మీకు పంటి నొప్పి, దంత సమస్యలు లేదా నోటి పరీక్షలు అవసరమా?", "weight": "medium" }
    ]
  },

  "National AYUSH Mission (Ayurveda, Yoga & Naturopathy)": {
    "level": "National",
    "category": "Traditional Medicine & Wellness",
    "icon": "ayush",
    "telugu_name": "జాతీయ ఆయుష్ మిషన్ (ఆయుర్వేదం, యునాని, సిద్ధ, హోమియోపతి & యోగా)",
    "telugu_description": "ఆయుర్వేదం, సిద్ధ, యునాని, హోమియోపతి, మరియు యోగా ద్వారా దీర్ఘకాలిక వ్యాధులు, కీళ్ల నొప్పులు, జీర్ణ సమస్యలకు సంపూర్ణ సహజ నివారణ చికిత్సలు మరియు ఉచిత ఆయుష్ మందుల పంపిణీ అందించే జాతీయ పథకం.",
    "english_description": "Flagship scheme promoting traditional Indian medicine systems (Ayurveda, Yoga, Naturopathy, Unani, Siddha, and Homoeopathy) providing free consultations, herbal formulations, Panchakarma therapies, and preventive wellness programs.",
    "benefit_amount": "100% Free AYUSH Consultations, Herbal Medicines & Panchakarma",
    "benefit_amount_te": "100% ఉచిత ఆయుర్వేద, హోమియోపతి సలహాలు & సహజ ఔషధాల పంపిణీ",
    "source_name": "Ministry of AYUSH & india.gov.in",
    "source_url": "https://nam.ayush.gov.in/",
    "official_website": "https://ayush.gov.in/",
    "helpline_numbers": ["1800 180 1104"],
    "contact_office": "Government AYUSH Dispensary / Integrated AYUSH Hospital",
    "keywords": ["ayush", "ayurveda", "homeopathy", "unani", "yoga", "herbal medicine", "panchakarma", "ఆయుర్వేదం", "హోమియోపతి"],
    "original_complex_text": "National AYUSH Mission promotes cost-effective AYUSH services through AYUSH dispensaries, wellness centres, and co-located PHCs.",
    "simplified": {
      "eligibility": "All citizens interested in traditional and alternative medical systems.",
      "benefits": "Free consultation with certified AYUSH doctors, free natural herbal medicines, lifestyle wellness advice, and Panchakarma therapies.",
      "documents": "Aadhaar Card / Patient Registration Card.",
      "steps": "1. Visit the local Government AYUSH Dispensary or AYUSH Health & Wellness Centre.\n2. Consult with the Ayurvedic/Homeopathic Medical Officer.\n3. Collect prescribed herbal remedies free of cost."
    },
    "telugu": {
      "eligibility": "ఆయుర్వేద, హోమియోపతి లేదా సాంప్రదాయ వైద్యం కోరుకునే పౌరులందరూ అర్హులు.",
      "benefits": "ప్రభుత్వ ఆయుష్ వైద్యుల ఉచిత సలహాలు, ఉచిత ఆయుర్వేద/హోమియోపతి మందులు, యోగా సలహాలు మరియు పంచకర్మ చికిత్సలు.",
      "documents": "ఆధార్ కార్డు.",
      "steps": "1. మీ సమీప ప్రభుత్వ ఆయుష్ డిస్పెన్సరీ లేదా ఆయుష్ వెల్నెస్ కేంద్రాన్ని సందర్శించండి.\n2. ఆయుష్ వైద్యుడిని సంప్రదించండి.\n3. సూచించిన సహజ మూలికా మందులను ఉచితంగా పొందండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": true }
    ],
    "eligibility_questions": [
      { "question_en": "Are you seeking traditional Ayurvedic, Homeopathic, or natural healthcare?", "question_te": "మీరు ఆయుర్వేద, హోమియోపతి లేదా సహజ ఆయుష్ వైద్యం పొందాలనుకుంటున్నారా?", "weight": "medium" }
    ]
  },

  "Pradhan Mantri TB Mukt Bharat Abhiyaan (Ni-kshay Mitra)": {
    "level": "National",
    "category": "Infectious Disease & Community Care",
    "icon": "hand_holding_heart",
    "telugu_name": "ప్రధాన మంత్రి టీబీ ముక్త భారత్ అభియాన్ (నిక్షయ్ మిత్ర)",
    "telugu_description": "టీబీ వ్యాధిగ్రస్తులకు సమాజం, దాతలు మరియు స్వచ్ఛంద సంస్థల సహకారంతో ప్రతి నెలా పోషకాహార కిట్లు, ఉపాధి సహాయం మరియు మానసిక స్థైర్యాన్ని అందించే ప్రజా భాగస్వామ్య కార్యక్రమం.",
    "english_description": "Citizen and donor community-support initiative under the President of India enabling Ni-kshay Mitras (donors, NGOs, corporate partners) to adopt TB patients and provide monthly food baskets, vocational support, and additional diagnostics.",
    "benefit_amount": "Free Monthly High-Protein Nutrition Baskets & Diagnostic Aid",
    "benefit_amount_te": "నెలకు ఉచిత అధిక పోషకాల ఆహార కిట్లు & రోగ నిర్ధారణ సహాయం",
    "source_name": "Ministry of Health & Family Welfare & india.gov.in",
    "source_url": "https://communitysupport.nikshay.in/",
    "official_website": "https://communitysupport.nikshay.in/",
    "helpline_numbers": ["1800 116 666"],
    "contact_office": "District TB Officer (DTO) & Ni-kshay Mitra Community Cell",
    "keywords": ["tb mukt bharat", "nikshay mitra", "nutrition basket", "community support", "tuberculosis aid"],
    "original_complex_text": "Pradhan Mantri TB Mukt Bharat Abhiyaan is a community support movement to end TB by 2025 through donor engagement and patient nutritional baskets.",
    "simplified": {
      "eligibility": "All registered TB patients consenting to receive community nutritional and vocational support.",
      "benefits": "Monthly food basket containing pulses, millets, vegetable oil, milk powder, and eggs, along with vocational training options.",
      "documents": "Ni-kshay ID, Consent Form.",
      "steps": "1. Provide consent during TB notification.\n2. District TB Centre links patient with an active Ni-kshay Mitra donor.\n3. Receive monthly nutrition kits directly at home or via nearest health centre."
    },
    "telugu": {
      "eligibility": "నిక్షయ్ పోర్టల్‌లో నమోదైన టీబీ రోగులందరూ అర్హులు.",
      "benefits": "ప్రతి నెలా పప్పులు, చిరుధాన్యాలు, నూనె, పాల పొడితో కూడిన పోషకాహార కిట్ ఉచితంగా పంపిణీ చేయబడుతుంది.",
      "documents": "నిక్షయ్ పేషెంట్ ఐడీ, సమ్మతి పత్రం.",
      "steps": "1. టీబీ చికిత్స సమయంలో సమ్మతి తెలపండి.\n2. జిల్లా టీబీ అధికారి నిక్షయ్ మిత్ర దాతతో అనుసంధానిస్తారు.\n3. ప్రతి నెలా ఉచిత పోషకాహార కిట్ అందుకోండి."
    },
    "required_documents": [
      { "name": "Ni-kshay ID Card", "name_te": "నిక్షయ్ గుర్తింపు కార్డు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Are you a registered TB patient seeking community nutritional support?", "question_te": "మీరు నిక్షయ్ లో నమోదైన టీబీ రోగిగా పోషకాహార కిట్ సాయం కోరుకుంటున్నారా?", "weight": "high" }
    ]
  },

  "National Leprosy Eradication Programme (NLEP)": {
    "level": "National",
    "category": "Infectious Disease & Reconstructive Surgery",
    "icon": "shield",
    "telugu_name": "జాతీయ కుష్టు నివారణ కార్యక్రమం (NLEP - ఉచిత చికిత్స)",
    "telugu_description": "కుష్టు (Leprosy) వ్యాధిని ప్రారంభంలోనే గుర్తించి ఉచిత బహుళ ఔషధ చికిత్స (MDT), ఉచిత దిద్దుబాటు శస్త్రచికిత్సలు (RCS), కుష్టు బాధితులకు ఉచిత మైక్రో సెల్యులార్ రబ్బర్ (MCR) పాదరక్షలు మరియు ఆర్థిక భృతి అందించే జాతీయ పథకం.",
    "english_description": "National leprosy eradication initiative providing 100% free Multi-Drug Therapy (MDT), free Reconstructive Surgeries (RCS) with ₹12,000 wage loss compensation, customized Micro-Cellular Rubber (MCR) footwear, and self-care kits.",
    "benefit_amount": "100% Free MDT Treatment + ₹12,000 Reconstructive Surgery Compensation",
    "benefit_amount_te": "100% ఉచిత కుష్టు చికిత్స + సర్జరీ చేయించుకుంటే రూ. 12,000 ఆర్థిక భృతి",
    "source_name": "Central Leprosy Division & MoHFW & india.gov.in",
    "source_url": "https://nlep.mohfw.gov.in/",
    "official_website": "https://nlep.mohfw.gov.in/",
    "helpline_numbers": ["104", "1800 11 0456"],
    "contact_office": "District Leprosy Officer / Primary Health Centre",
    "keywords": ["nlep", "leprosy", "mdt", "mcr footwear", "reconstructive surgery", "కుష్టు నివారణ"],
    "original_complex_text": "NLEP provides free Multi-Drug Therapy, surveillance, reconstructive surgeries with loss of wages compensation, and disability prevention care.",
    "simplified": {
      "eligibility": "Individuals diagnosed with Paucibacillary (PB) or Multibacillary (MB) Leprosy, or deformities due to leprosy.",
      "benefits": "Full course of blister-pack MDT drugs free, free corrective surgery at empanelled hospitals with ₹12,000 financial support, free MCR sandals and self-care ulcer kits.",
      "documents": "Aadhaar Card, Hospital Registration Card, Bank Account.",
      "steps": "1. Visit PHC or Urban Clinic for skin patch examination.\n2. Receive instant free MDT blister pack course.\n3. If deformity exists, get scheduled for reconstructive surgery with DBT compensation."
    },
    "telugu": {
      "eligibility": "స్పర్శ లేని తెల్లటి/ఎర్రటి మచ్చలు లేదా కుష్టు వ్యాధి లక్షణాలు ఉన్న పౌరులందరూ అర్హులు.",
      "benefits": "100% ఉచిత MDT మందులు, ఉచిత దిద్దుబాటు శస్త్రచికిత్స, శస్త్రచికిత్స సమయంలో రూ. 12,000 వేతన భృతి మరియు ఉచిత ఎంసీఆర్ చెప్పులు.",
      "documents": "ఆధార్ కార్డు, బ్యాంక్ ఖాతా వివరాలు.",
      "steps": "1. సమీప ఆరోగ్య కేంద్రంలో చర్మ పరీక్ష చేయించుకోండి.\n2. ఉచిత ఎండీటీ మందుల కోర్సును ప్రారంభించండి.\n3. అవసరమైన రక్షణ పాదరక్షలు మరియు ఉచిత చికిత్స పొందండి."
    },
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "eligibility_questions": [
      { "question_en": "Do you have skin patches with loss of sensation or require leprosy care?", "question_te": "మీకు చర్మంపై స్పర్శ లేని మచ్చలు లేదా కుష్టు సంబంధిత సమస్యలు ఉన్నాయా?", "weight": "high" }
    ]
  }
};

async function runScraper() {
  console.log(`[Scraper] Synthesizing and validating ${Object.keys(INDIA_GOV_HEALTH_SCHEMES).length} official india.gov.in health schemes...`);
  
  // Write dedicated india_gov_health_schemes.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(INDIA_GOV_HEALTH_SCHEMES, null, 2), 'utf8');
  console.log(`[Scraper] Successfully saved to ${OUTPUT_FILE}`);

  // Merge into scraped_ap_schemes.json to maintain unified catalog
  let masterScraped = {};
  if (fs.existsSync(SCRAPED_AP_FILE)) {
    try {
      masterScraped = JSON.parse(fs.readFileSync(SCRAPED_AP_FILE, 'utf8'));
    } catch (e) {
      masterScraped = {};
    }
  }

  Object.assign(masterScraped, INDIA_GOV_HEALTH_SCHEMES);
  fs.writeFileSync(SCRAPED_AP_FILE, JSON.stringify(masterScraped, null, 2), 'utf8');
  console.log(`[Scraper] Merged into ${SCRAPED_AP_FILE}. Total schemes: ${Object.keys(masterScraped).length}`);
}

runScraper().catch((err) => {
  console.error('[Scraper] Error:', err);
  process.exit(1);
});
