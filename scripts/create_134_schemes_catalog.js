import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');

const FINAL_7_SCHEMES = {
  "National Programme for Prevention & Control of Cancer, Diabetes, CVDs & Stroke (NPCDCS)": {
    "level": "National",
    "category": "Preventive Health & Chronic Care",
    "icon": "shield",
    "telugu_name": "జాతీయ బిపి, షుగర్, క్యాన్సర్ మరియు పక్షపాతం నివారణ పథకం",
    "source_name": "Ministry of Health and Family Welfare",
    "source_url": "https://main.mohfw.gov.in/",
    "keywords": ["NPCDCS", "diabetes", "hypertension", "cancer screening", "stroke"],
    "simplified": {
      "eligibility": "All adults aged 30 years and above for routine non-communicable disease screening.",
      "benefits": "Free population-based screening for hypertension, diabetes, oral/breast/cervical cancers, free NCD medicines, and lifestyle counseling.",
      "documents": "Aadhaar Card.",
      "steps": "Get screened by the ANM / MLHP at your local YSR Village Health Clinic or Ayushman Arogya Mandir."
    },
    "telugu": {
      "eligibility": "30 సంవత్సరాలు మరియు అంతకంటే ఎక్కువ వయస్సు ఉన్న పౌరులు అందరూ.",
      "benefits": "ఉచిత బిపి, షుగర్, క్యాన్సర్ మరియు గుండె జబ్బుల పరీక్షలు, ఉచిత బిపి/షుగర్ మందుల పంపిణీ.",
      "documents": "ఆధార్ కార్డు.",
      "steps": "గ్రామ సచివాలయ ఆరోగ్య క్లినిక్ లేదా ఆయుష్మాన్ ఆరోగ్య మందిర్ వద్ద ఉచిత పరీక్ష చేయించుకోవాలి."
    },
    "description": "NPCDCS focuses on health promotion, early diagnosis, and management of common NCDs like hypertension, diabetes, and cancers."
  },
  "Pradhan Mantri National Dialysis Programme - Hemodialysis": {
    "level": "National",
    "category": "Nephrology & Renal Failure Care",
    "icon": "kidney",
    "telugu_name": "పీఎం జాతీయ ఉచిత హీమోడయాలసిస్ సేవలు",
    "source_name": "National Health Mission",
    "source_url": "https://pmndp.mohfw.gov.in/",
    "keywords": ["hemodialysis", "kidney failure", "free dialysis", "renal care"],
    "simplified": {
      "eligibility": "BPL and poor patients with end-stage renal disease (ESRD) certified by nephrologists.",
      "benefits": "100% free hemodialysis sessions, dialyzer kits, and heparin injections at district hospital dialysis centres.",
      "documents": "Aadhaar, BPL Ration Card, Nephrologist Referral Slip.",
      "steps": "Enroll at the District Hospital Dialysis Unit for regular weekly sessions."
    },
    "telugu": {
      "eligibility": "కిడ్నీ వైఫల్యంతో బాధపడుతున్న నిరుపేద/బీపీఎల్ రోగులు.",
      "benefits": "జిల్లా ఆసుపత్రులలో ఉచిత హీమోడయాలసిస్ సెషన్లు, ఉచిత ఫిల్టర్లు మరియు ఇంజెక్షన్లు.",
      "documents": "ఆధార్, రేషన్ కార్డు, డాక్టర్ రిఫరల్ పత్రం.",
      "steps": "జిల్లా కేంద్ర ఆసుపత్రి డయాలిసిస్ విభాగానికి వెళ్లి వివరాలు నమోదు చేసుకోవాలి."
    },
    "description": "Provides free life-sustaining hemodialysis procedures for below poverty line patients suffering from kidney failure."
  },
  "Pradhan Mantri National Dialysis Programme - Peritoneal Dialysis": {
    "level": "National",
    "category": "Nephrology & Renal Failure Care",
    "icon": "kidney",
    "telugu_name": "పీఎం జాతీయ పెరిటోనియల్ డయాలిసిస్ సేవలు (ఇంటివద్ద డయాలిసిస్)",
    "source_name": "National Health Mission",
    "source_url": "https://pmndp.mohfw.gov.in/",
    "keywords": ["peritoneal dialysis", "home dialysis", "CAPD", "renal support"],
    "simplified": {
      "eligibility": "Chronic kidney disease patients needing continuous peritoneal dialysis at home.",
      "benefits": "Free monthly supply of peritoneal dialysis solution bags and catheter care kits at home.",
      "documents": "Aadhaar, BPL Ration Card, Hospital Medical Certificate.",
      "steps": "Collect free peritoneal solution fluid bags monthly from the district hospital nephrology ward."
    },
    "telugu": {
      "eligibility": "ఇంటి వద్దనే పెరిటోనియల్ డయాలిసిస్ చేయించుకోవాల్సిన కిడ్నీ రోగులు.",
      "benefits": "ప్రతి నెలా ఇంటివద్దనే డయాలిసిస్ చేసుకోవడానికి ఉచిత ఫ్లూయిడ్ బ్యాగ్‌లు సరఫరా.",
      "documents": "ఆధార్, రేషన్ కార్డు, మెడికల్ సర్టిఫికేట్.",
      "steps": "జిల్లా ఆసుపత్రి నుండి ఉచిత ఫ్లూయిడ్ బ్యాగులను ప్రతి నెలా తీసుకోవచ్చు."
    },
    "description": "Offers free home-based peritoneal dialysis solution fluid delivery for eligible renal failure patients."
  },
  "National Free Diagnostic Initiative - Advanced Scans & CT Scan": {
    "level": "National",
    "category": "Free Diagnostics & Lab Tests",
    "icon": "clinic",
    "telugu_name": "జాతీయ ఉచిత సీటీ స్కాన్ మరియు స్కానింగ్ సేవలు",
    "source_name": "National Health Mission",
    "source_url": "https://nhm.gov.in/",
    "keywords": ["ct scan", "mri", "free scan", "advanced diagnostics"],
    "simplified": {
      "eligibility": "Emergency, trauma, and hospitalized patients at government teaching hospitals.",
      "benefits": "100% free high-resolution CT scans, ultrasounds, and digital X-rays.",
      "documents": "Government Hospital Doctor Referral Order.",
      "steps": "Visit the Radiology / Imaging department in the government hospital."
    },
    "telugu": {
      "eligibility": "ప్రభుత్వ బోధనాసుపత్రుల్లో చికిత్స పొందే అత్యవసర రోగులు.",
      "benefits": "ఉచిత సీటీ స్కాన్ (CT Scan), డిజిటల్ ఎక్స్-రే మరియు అల్ట్రాసౌండ్ స్కానింగ్ సేవలు.",
      "documents": "ప్రభుత్వ ఆసుపత్రి డాక్టర్ స్కానింగ్ రిఫరల్.",
      "steps": "ఆసుపత్రి రేడియోలజీ విభాగానికి వెళ్లి ఉచిత స్కాన్ పొందుతారు."
    },
    "description": "Provides free advanced radiological diagnostic services including CT scans and X-rays in public hospitals."
  },
  "AP YSR Aarogyasri Super-Specialty Tertiary Procedures": {
    "level": "Andhra Pradesh",
    "category": "Universal Health Coverage & Tertiary Care",
    "icon": "hospital",
    "telugu_name": "వైఎస్ఆర్ ఆరోగ్యశ్రీ సూపర్‌స్పెషాలిటీ చికిత్సలు",
    "source_name": "Dr. YSR Aarogyasri Health Care Trust",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "keywords": ["aarogyasri super specialty", "cardiac surgery", "cancer care", "organ transplant", "3257 procedures"],
    "simplified": {
      "eligibility": "BPL and eligible income group families in AP covering 3,257+ medical procedures.",
      "benefits": "Complete cashless coverage up to Rs. 25 lakh per family per year for open heart surgeries, neurosurgeries, oncology treatments, and joint replacements.",
      "documents": "Aadhaar Card, BPL Ration Card / Rice Card.",
      "steps": "Report to the Aarogya Mithra desk at any empanelled network hospital."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని పేద మరియు అర్హత కలిగిన బిపిఎల్ కుటుంబాలు (3,257 కి పైగా ఆపరేషన్లకు వర్తిస్తుంది).",
      "benefits": "గుండె ఆపరేషన్లు, క్యాన్సర్ చికిత్స, న్యూరో సర్జరీలు, బైపాస్ మరియు మోకాళ్ళ మార్పిడికి కుటుంబానికి ఏటా రూ. 25 లక్షల వరకు ఉచిత క్యాష్‌లేస్ చికిత్స.",
      "documents": "ఆధార్ కార్డు, రైస్ కార్డు / రేషన్ కార్డు.",
      "steps": "నెట్‌వర్క్ ఆసుపత్రిలోని ఆరోగ్య మిత్ర వద్ద వివరాలు చూపించి ఉచిత చికిత్స పొందవచ్చు."
    },
    "description": "Provides comprehensive cashless coverage up to Rs. 25 Lakhs per family per annum for 3,257 secondary and tertiary surgical and medical procedures."
  },
  "AP Dr. YSR Tele-Consultation Hubs": {
    "level": "Andhra Pradesh",
    "category": "Digital Teleconsultation & Specialist Care",
    "icon": "phone-doctor",
    "telugu_name": "డా. వైఎస్ఆర్ టెలి-కన్సల్టేషన్ కేంద్రాలు",
    "source_name": "AP Department of Health and Family Welfare",
    "source_url": "https://hmfw.ap.gov.in/",
    "keywords": ["tele consultation hub", "specialist doctor", "village teleconsultation", "ap digital health"],
    "simplified": {
      "eligibility": "All rural patients visiting YSR Village Health Clinics across AP.",
      "benefits": "Real-time HD video consultation with specialist doctors (MD General Medicine, Gynecologist, Pediatrician) from village clinics.",
      "documents": "None (recorded at village clinic).",
      "steps": "Visit YSR Village Health Clinic; the MLHP connects video call with hub specialists."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ గ్రామీణ ప్రాంత రోగులందరూ.",
      "benefits": "గ్రామం నుండే వీడియో కాల్ ద్వారా ఎంబీబీఎస్, ఎండీ స్పెషలిస్ట్ డాక్టర్ల ఉచిత సంప్రదింపులు మరియు డిజిటల్ మందుల చీటి.",
      "documents": "ఏదీ అవసరం లేదు.",
      "steps": "గ్రామ ఆరోగ్య క్లినిక్‌కు వెళితే ఎంఎల్ హెచ్‌పి సిబ్బంది స్పెషలిస్ట్ డాక్టర్‌కు వీడియో కాల్ కనెక్ట్ చేస్తారు."
    },
    "description": "Connects patients at rural Village Health Clinics with specialist medical doctors located in district hubs via live video teleconsultation."
  },
  "Pradhan Mantri National Health Protection Mission - Senior Citizen Cover": {
    "level": "National",
    "category": "Hospitalization & Cashless Coverage",
    "icon": "shield",
    "telugu_name": "పీఎం ఆయుష్మాన్ భారత్ వయోవందన పథకం (70+ వృద్ధులకు రూ. 5 లక్షలు)",
    "source_name": "National Health Authority",
    "source_url": "https://nha.gov.in/",
    "keywords": ["vayo vandana", "senior citizen 70+", "ayushman 70 plus", "free 5 lakh cover"],
    "simplified": {
      "eligibility": "All senior citizens aged 70 years and above regardless of family income.",
      "benefits": "Dedicated top-up health insurance coverage of Rs. 5 lakh per year for hospitalization.",
      "documents": "Aadhaar Card (70+ Age Proof).",
      "steps": "Apply for Ayushman Vayo Vandana Card via NHA portal or Ayushman App."
    },
    "telugu": {
      "eligibility": "70 సంవత్సరాలు మరియు అంతకంటే ఎక్కువ వయస్సు ఉన్న వృద్ధులు అందరూ (ఆదాయ పరిమితి లేదు).",
      "benefits": "వృద్ధులకు ప్రత్యేకంగా ఏటా రూ. 5 లక్షల వరకు ఉచిత క్యాష్‌లేస్ ఆసుపత్రి చికిత్స భద్రత.",
      "documents": "ఆధార్ కార్డు (వయస్సు రుజువు).",
      "steps": "ఆయుష్మాన్ యాప్ ద్వారా వయోవందన కార్డు డౌన్‌లోడ్ చేసుకోవాలి."
    },
    "description": "Provides dedicated Rs. 5 Lakh cashless health cover per year to all senior citizens aged 70 and above across India."
  }
};

const masterPath = path.join(DATA_DIR, 'national_and_ap_schemes.json');
let existingCatalog = {};

try {
  existingCatalog = JSON.parse(fs.readFileSync(masterPath, 'utf-8'));
} catch (e) {}

Object.entries(FINAL_7_SCHEMES).forEach(([sName, sData]) => {
  existingCatalog[sName] = {
    level: sData.level,
    category: sData.category,
    icon: sData.icon,
    telugu_name: sData.telugu_name,
    source_name: sData.source_name,
    source_url: sData.source_url,
    official_website: sData.source_url,
    keywords: sData.keywords,
    simplified: sData.simplified,
    telugu: sData.telugu,
    description: sData.description,
    telugu_description: sData.telugu.description || sData.telugu_name,
    required_documents: [{ name: "Aadhaar Card", name_te: "ఆధార్ కార్డు", optional: false }]
  };
});

fs.writeFileSync(masterPath, JSON.stringify(existingCatalog, null, 2), 'utf-8');
console.log(`Updated master catalog in national_and_ap_schemes.json. Final Total count: ${Object.keys(existingCatalog).length}`);
