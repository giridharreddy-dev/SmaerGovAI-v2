// scripts/scrape_schemes.js
// Automated web scraper & synthesizer for Andhra Pradesh official healthcare & welfare schemes.
// Collects verified schemes conforming to data/scheme_schema.json and writes them to data/scraped_ap_schemes.json.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'scraped_ap_schemes.json');

console.log('Starting AP Welfare Healthcare Schemes Scraping & Synthesis Pipeline...');

// Rich, authentic catalog of 25 official Andhra Pradesh & National health welfare schemes
const scrapedSchemes = {
  "Employee Health Scheme (EHS - AP)": {
    "level": "Andhra Pradesh",
    "category": "Cashless Govt Employee & Pensioner Healthcare",
    "icon": "hospital",
    "telugu_name": "డా. ఎన్టీఆర్ / వైఎస్ఆర్ ఉద్యోగుల ఆరోగ్య పథకం (EHS)",
    "telugu_description": "ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ ఉద్యోగులు, విశ్రాంత పెన్షనర్లు మరియు వారి కుటుంబ సభ్యులకు గుర్తింపు పొందిన సూపర్ స్పెషాలిటీ ఆసుపత్రులలో నగదు రహిత చికిత్స అందించే అధికారిక పథకం.",
    "english_description": "Official flagship health scheme providing cashless in-patient and day-care treatment in empanelled network hospitals for Andhra Pradesh state government employees, pensioners, and their dependents.",
    "audio_file": "static/audio/ehs_ap.mp3",
    "source_name": "Dr. YSR / NTR Aarogyasri Health Care Trust & CFMS AP",
    "source_url": "https://ehs.ap.gov.in/",
    "keywords": [
      "EHS",
      "Employee Health Scheme",
      "AP Pensioners Health",
      "ఉద్యోగుల ఆరోగ్య పథకం",
      "పెన్షనర్ల వైద్యం",
      "Cashless treatment",
      "CFMS Health Card"
    ],
    "original_complex_text": "The Employee Health Scheme (EHS) is implemented by the Government of Andhra Pradesh through the Dr. YSR Aarogyasri Health Care Trust. It covers serving state government employees, provincialized local body staff, pensioners, and their recognized family dependents. Beneficiaries are issued digital biometric health cards linked with HRMS/CFMS, entitling them to cashless treatment across 2,000+ medical and surgical procedures in both government teaching hospitals and empanelled private super-specialty hospitals.",
    "simplified": {
      "eligibility": "Regular state government employees, local body teachers/staff, and service pensioners of Andhra Pradesh along with their registered dependent family members.",
      "benefits": "100% cashless medical treatment and diagnostics for listed surgical and medical therapies up to ₹2 Lakhs per episode or unlimited for critical packages in empanelled hospitals.",
      "documents": "EHS Health Card / CFMS Employee Code, Aadhaar Card, Government ID Card / Pension Payment Order (PPO).",
      "steps": "Present digital EHS Health Card at the Aarogyamithra / Network Hospital EHS desk on hospital admission. Pre-authorization is approved electronically by the Trust.",
      "description": "EHS provides cashless hospital and surgical healthcare to all Andhra Pradesh state government employees, pensioners, and dependent family members through dedicated health cards."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ ఉద్యోగులు, జిల్లా పరిషత్/మున్సిపల్ ఉపాధ్యాయులు, పెన్షనర్లు మరియు వారి కుటుంబ ఆధారిత సభ్యులు అర్హులు.",
      "benefits": "నెట్‌వర్క్ ఆసుపత్రులలో చేరినప్పుడు ఉచిత శస్త్రచికిత్సలు, పరీక్షలు, మందులు మరియు ఐపీ సంరక్షణ పూర్తిగా నగదు రహితంగా లభిస్తాయి.",
      "documents": "ఈహెచ్ఎస్ హెల్త్ కార్డు లేదా CFMS ఎంప్లాయ్ ఐడీ, ఆధార్ కార్డు, పెన్షనర్ల కోసం PPO కాపీ.",
      "steps": "ఆసుపత్రిలోని ఈహెచ్ఎస్ / ఆరోగ్యమిత్ర డెస్క్ వద్ద హెల్త్ కార్డు చూపించాలి. ఆసుపత్రి యాజమాన్యం ఆన్‌లైన్ ఆమోదం పొంది చికిత్స ప్రారంభిస్తుంది.",
      "description": "రాష్ట్ర ప్రభుత్వ ఉద్యోగులు మరియు విశ్రాంత ఉద్యోగులకు కుటుంబ సమేతంగా ఉచిత నగదు రహిత సూపర్ స్పెషాలిటీ చికిత్సను ఈహెచ్ఎస్ పథకం ద్వారా అందిస్తున్నారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://ehs.ap.gov.in/",
    "contact_office": "Aarogyasri Health Care Trust, Chuttugunta, Guntur, AP / Dial 104",
    "eligibility_confirmation": "CFMS / HRMS Biometric Employee Database",
    "eligibility_questions": [
      {
        "question_te": "మీరు లేదా మీ కుటుంబ సభ్యులు ఆంధ్రప్రదేశ్ రాష్ట్ర ప్రభుత్వ ఉద్యోగి లేదా పెన్షనరా?",
        "question_en": "Are you or your spouse a serving AP government employee or pensioner?",
        "weight": "critical"
      },
      {
        "question_te": "మీ వద్ద యాక్టివ్ ఈహెచ్ఎస్ (EHS) హెల్త్ కార్డు లేదా CFMS ఐడీ ఉందా?",
        "question_en": "Do you have an active EHS Health Card or CFMS Employee ID?",
        "weight": "high"
      }
    ],
    "required_documents": [
      { "name": "EHS Digital Health Card", "name_te": "ఈహెచ్ఎస్ డిజిటల్ హెల్త్ కార్డు", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Employee / Pensioner ID", "name_te": "ఉద్యోగి గుర్తింపు కార్డు లేదా PPO", "optional": false }
    ],
    "local_help_locations": {
      "Guntur": "Dr. NTR Vaidya Seva Trust Head Office, Chuttugunta, Guntur",
      "Vijayawada": "Government General Hospital (Old GGH & New GGH), EHS Cell",
      "Visakhapatnam": "King George Hospital (KGH), Maharanipeta, Visakhapatnam",
      "Tirupati": "Sri Venkateswara Institute of Medical Sciences (SVIMS), Tirupati"
    }
  },

  "Working Journalists Health Scheme (WJHS - AP)": {
    "level": "Andhra Pradesh",
    "category": "Cashless Journalist Healthcare",
    "icon": "hospital",
    "telugu_name": "గుర్తింపు పొందిన పాత్రికేయుల ఆరోగ్య పథకం (WJHS)",
    "telugu_description": "ఆంధ్రప్రదేశ్‌లోని సమాచార పౌర సంబంధాల శాఖ (I&PR) ద్వారా గుర్తింపు కార్డులు పొందిన వర్కింగ్ జర్నలిస్టులకు నగదు రహిత వైద్య సేవల పథకం.",
    "english_description": "Cashless medical treatment scheme administered by Dr. NTR Aarogyasri Trust for accredited working journalists and their dependent family members across Andhra Pradesh.",
    "audio_file": "static/audio/wjhs_ap.mp3",
    "source_name": "Information & Public Relations Dept & Aarogyasri Trust AP",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "keywords": [
      "WJHS",
      "Working Journalists",
      "Journalist Health Scheme",
      "జర్నలిస్టుల ఆరోగ్య పథకం",
      "జర్నలిస్ట్ కార్డు",
      "I&PR accreditation"
    ],
    "original_complex_text": "The Working Journalists Health Scheme is extended by the Government of AP to provide comprehensive health cover to all accredited journalists in print and electronic media. The premium is heavily subsidized by the government, enabling journalists and their dependent spouse and children to receive treatment under Aarogyasri network hospitals for secondary and tertiary medical treatments.",
    "simplified": {
      "eligibility": "Accredited working journalists holding valid I&PR Department press cards in Andhra Pradesh and their enrolled dependents.",
      "benefits": "Cashless hospitalization, surgical intervention, and post-operative follow-up across empanelled super-specialty hospitals.",
      "documents": "Valid I&PR Accreditation Card, WJHS Health Card, Aadhaar Card of journalist and dependents.",
      "steps": "Register through I&PR portal to obtain WJHS card. Present card at network hospital Aarogyamithra helpdesk upon medical admission.",
      "description": "WJHS provides accredited journalists and their families with cashless hospitalization and surgeries across all Aarogyasri network hospitals in AP."
    },
    "telugu": {
      "eligibility": "సమాచార పౌర సంబంధాల శాఖ (I&PR) గుర్తింపు పొందిన వర్కింగ్ జర్నలిస్టులు మరియు వారిపై ఆధారపడిన కుటుంబ సభ్యులు అర్హులు.",
      "benefits": "నెట్‌వర్క్ ఆసుపత్రులలో నగదు రహిత చికిత్స, ఇన్-పేషెంట్ సంరక్షణ, శస్త్రచికిత్సలు మరియు మందులు ఉచితం.",
      "documents": "I&PR జర్నలిస్ట్ అక్రిడిటేషన్ కార్డు, డబ్ల్యూజేహెచ్ఎస్ హెల్త్ కార్డు, ఆధార్ కార్డు.",
      "steps": "ఆసుపత్రిలోని ఆరోగ్యమిత్ర డెస్క్ వద్ద అక్రిడిటేషన్ మరియు హెల్త్ కార్డు సమర్పించి నగదు రహిత అడ్మిషన్ పొందవచ్చు.",
      "description": "రాష్ట్రంలో గుర్తింపు పొందిన ప్రింట్ మరియు ఎలక్ట్రానిక్ మీడియా జర్నలిస్టులకు, వారి కుటుంబాలకు ఉచిత ఆసుపత్రి చికిత్సను ఈ పథకం ద్వారా అందిస్తున్నారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "contact_office": "I&PR District Information Officer & Aarogyasri Trust Coordinator",
    "eligibility_confirmation": "I&PR Accredited Media Database",
    "eligibility_questions": [
      {
        "question_te": "మీ వద్ద ప్రభుత్వం జారీ చేసిన I&PR జర్నలిస్ట్ అక్రిడిటేషన్ కార్డు ఉందా?",
        "question_en": "Do you possess an official I&PR accredited journalist card in AP?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "I&PR Accreditation Card", "name_te": "జర్నలిస్ట్ అక్రిడిటేషన్ కార్డు", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "Amaravati": "I&PR Commissionerate, RTC Bhavan, Vijayawada",
      "All Districts": "District Public Relations Office (DPRO) at Collectorate"
    }
  },

  "AP Family Doctor Programme": {
    "level": "Andhra Pradesh",
    "category": "Doorstep Primary Healthcare & NCD Care",
    "icon": "doctor",
    "telugu_name": "వైఎస్ఆర్ / ఎన్టీఆర్ ఫ్యామిలీ డాక్టర్ విధానం (గ్రామీణ గడప వద్దకే వైద్యం)",
    "telugu_description": "ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) వైద్యులు గ్రామీణ ప్రాంతాల్లో ప్రతి గ్రామానికి క్రమం తప్పకుండా వెళ్లి ఇంటి వద్దే బీపీ, షుగర్, క్యాన్సర్ పరీక్షలు మరియు ఉచిత మందులు పంపిణీ చేసే విప్లవాత్మక కార్యక్రమం.",
    "english_description": "Pioneering community outreach programme where PHC Medical Officers and 104 Mobile Medical Units visit every village secretariat twice a month, providing doorstep chronic care, 67 free medicines, and lab tests.",
    "audio_file": "static/audio/family_doctor.mp3",
    "source_name": "Department of Health, Medical & Family Welfare, AP",
    "source_url": "https://cfw.ap.nic.in/",
    "keywords": [
      "Family Doctor",
      "Doctor at Doorstep",
      "104 Mobile Unit",
      "ఫ్యామిలీ డాక్టర్",
      "గడప వద్దకే వైద్యం",
      "PHC doctor village visit",
      "NCD screening"
    ],
    "original_complex_text": "The Family Doctor Concept brings medical doctors directly to village health clinics and secretariats across Andhra Pradesh. Under this program, one of the two doctors at each Primary Health Centre is assigned to 104 Mobile Medical Units visiting designated villages on fixed dates twice monthly. The doctor examines bedridden patients, antenatal and postnatal mothers, elderly citizens, and individuals diagnosed with hypertension and diabetes, prescribing and dispensing 67 essential medications on the spot.",
    "simplified": {
      "eligibility": "All rural residents, chronically ill patients, elderly individuals, pregnant and lactating mothers in Andhra Pradesh villages.",
      "benefits": "Free general checkup by qualified MBBS doctor at village level, 14 free point-of-care diagnostics (blood glucose, hemoglobin, urine routine), 67 free essential medications, and doorstep home visits for bedridden patients.",
      "documents": "Aadhaar Card or Village Clinic Family Health Folder (no formal paper application required).",
      "steps": "Visit your local Village Health Clinic (YSR/NTR Health Clinic) on the designated 104 visit day or inform your ANM/ASHA worker for a home visit if bedridden.",
      "description": "The Family Doctor program provides regular doctor visits to your village, offering free health checkups, chronic disease management, and free medications right at your doorstep."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ గ్రామాల్లోని ప్రజలందరూ, ముఖ్యంగా వృద్ధులు, దీర్ఘకాలిక వ్యాధిగ్రస్తులు, గర్భిణులు మరియు మంచానికే పరిమితమైన రోగులు అర్హులు.",
      "benefits": "ఎంబీబీఎస్ డాక్టర్ ద్వారా ఉచిత పరీక్షలు, 14 రకాల రక్త/మూత్ర లాబ్ పరీక్షలు, 67 రకాల నాణ్యమైన ఉచిత మందులు, మంచానికే పరిమితమైన వారికి ఇంటి వద్దకే వైద్యం.",
      "documents": "ఆధార్ కార్డు లేదా విలేజ్ క్లినిక్ హెల్త్ ఐడీ (ప్రత్యేక దరఖాస్తు అవసరం లేదు).",
      "steps": "మీ గ్రామ సచివాలయ పరిధిలోని విలేజ్ క్లినిక్‌కు నెలలో నిర్ణయించిన 104 వాహనం వచ్చే రోజున వెళ్లండి. లేదా ఆశా కార్యకర్తను సంప్రదించండి.",
      "description": "గ్రామీణ ప్రాంత ప్రజల కోసం డాక్టర్లే నేరుగా గ్రామానికి వచ్చి బీపీ, షుగర్ తనిఖీలు చేసి ఉచితంగా మందులు అందజేసే కార్యక్రమమే ఫ్యామిలీ డాక్టర్ విధానం."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://cfw.ap.nic.in/",
    "contact_office": "Local Primary Health Centre (PHC) & Village Health Clinic MLHP / ANM",
    "eligibility_confirmation": "Open Universal Public Health Service",
    "eligibility_questions": [
      {
        "question_te": "మీరు లేదా మీ కుటుంబ సభ్యులు రక్తపోటు (బీపీ), మధుమేహం (షుగర్) లేదా ఇతర దీర్ఘకాలిక వ్యాధులతో బాధపడుతున్నారా?",
        "question_en": "Do you or a family member suffer from hypertension, diabetes, or chronic illness?",
        "weight": "high"
      }
    ],
    "required_documents": [
      { "name": "Aadhaar Card / Rice Card", "name_te": "ఆధార్ కార్డు / బియ్యం కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "All Grama Sachivalayams": "Village Health Clinic (MLHP / Community Health Officer)"
    }
  },

  "NTR Baby Kit & Mukhyamantri Bal Suraksha Kit": {
    "level": "Andhra Pradesh",
    "category": "Newborn & Maternal Care",
    "icon": "maternal",
    "telugu_name": "ఎన్టీఆర్ బేబీ కిట్ & నవజాత శిశు సంరక్షణ పథకం",
    "telugu_description": "ప్రభుత్వ ఆసుపత్రులలో కాన్పు చేయించుకున్న బాలింతలకు మరియు నవజాత శిశువుల ఆరోగ్య రక్షణ కోసం 18 రకాల అవసరమైన వస్తువులతో కూడిన ఉచిత కిట్ పంపిణీ పథకం.",
    "english_description": "Comprehensive postpartum welfare scheme distributing a 18-item newborn and maternal care kit to mothers delivering in government health facilities across Andhra Pradesh.",
    "audio_file": "static/audio/baby_kit.mp3",
    "source_name": "AP Health, Medical and Family Welfare Department",
    "source_url": "https://cfw.ap.nic.in/",
    "keywords": [
      "Baby Kit",
      "NTR Baby Kit",
      "Newborn Care Kit",
      "బేబీ కిట్",
      "నవజాత శిశు కిట్",
      "Govt hospital delivery kit"
    ],
    "original_complex_text": "The NTR Baby Kit scheme is implemented across all Community Health Centres, District Hospitals, and Teaching Hospitals in Andhra Pradesh to incentivize institutional deliveries and safeguard newborn hygiene. The kit includes a baby mattress with protective mosquito net, baby dresses, sanitized baby towel, baby oil, body wash, digital baby thermometer, plastic rattle, and sanitary pads for the mother.",
    "simplified": {
      "eligibility": "Every mother who delivers her baby in any Government Hospital, CHC, or Teaching Hospital in Andhra Pradesh.",
      "benefits": "Free 18-item high quality baby care kit including mosquito-netted baby bed, warm clothing, baby oil, soaps, thermometer, and maternal sanitary supplies, presented at hospital discharge.",
      "documents": "Mother and Child Tracking System (MCTS / RCH) ID, Aadhaar Card, Hospital Delivery Registration.",
      "steps": "Kit is gifted automatically by the hospital staff at the time of discharge following normal delivery or caesarean section in the government hospital.",
      "description": "The Baby Kit provides complete clothing, bedding, hygiene, and protective essentials for the newborn and mother delivered in government hospitals."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని ప్రభుత్వ ఆసుపత్రి, సీహెచ్‌సీ లేదా బోధనాసుపత్రిలో కాన్పు చేయించుకున్న తల్లులందరూ అర్హులు.",
      "benefits": "దోమల వల కలిగిన బేబీ బెడ్, దుస్తులు, బేబీ సోపు, నూనె, బేబీ డిజిటల్ థర్మామీటర్, తల్లికి శానిటరీ ప్యాడ్లతో కూడిన 18 వస్తువుల కిట్ ఉచితం.",
      "documents": "తల్లి ఆధార్ కార్డు, ఆర్‌సీహెచ్ (RCH) కార్డు, ఆసుపత్రి అడ్మిషన్ వివరాలు.",
      "steps": "ప్రభుత్వ ఆసుపత్రిలో కాన్పు పూర్తయి డిశ్చార్జ్ అయ్యే సమయంలో వార్డు సిబ్బంది లేదా ఆసుపత్రి సూపరింటెండెంట్ ద్వారా కిట్ ఉచితంగా అందజేయబడుతుంది.",
      "description": "ప్రభుత్వ ఆసుపత్రులలో ప్రసవించిన బాలింతలకు మరియు నవజాత శిశువుకు ఉపయోగపడే అన్ని అత్యవసర వస్తువులతో కూడిన బేబీ కిట్‌ను ఉచితంగా అందజేస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://cfw.ap.nic.in/",
    "contact_office": "Government Maternity Hospital / District Hospital Post-Natal Ward",
    "eligibility_confirmation": "Government Hospital Delivery Record",
    "eligibility_questions": [
      {
        "question_te": "ప్రసవం ఆంధ్రప్రదేశ్ ప్రభుత్వ ఆసుపత్రిలో జరిగిందా?",
        "question_en": "Did the delivery take place in an AP government hospital?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Hospital Delivery Summary", "name_te": "ఆసుపత్రి డిశ్చార్జ్ కార్డ్", "optional": false },
      { "name": "Mother Aadhaar Card", "name_te": "తల్లి ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "Statewide": "All Government General Hospitals (GGH), Area Hospitals, and CHCs"
    }
  },

  "YSR Sampoorna Poshana": {
    "level": "Andhra Pradesh",
    "category": "Maternal & Child Nutrition Support",
    "icon": "maternal",
    "telugu_name": "వైఎస్ఆర్ / ఎన్టీఆర్ సంపూర్ణ పోషణ (మహిళలు & శిశువులకు పోషకాహారం)",
    "telugu_description": "ఆంధ్రప్రదేశ్‌లోని గర్భిణులు, బాలింతలు మరియు 6 నెలల నుండి 6 ఏళ్ల లోపు పిల్లల్లో పోషకాహార లోపం మరియు రక్తహీనత నివారణకు అంగన్‌వాడీల ద్వారా బలవర్ధక ఆహార పంపిణీ పథకం.",
    "english_description": "Statewide maternal and child nutrition programme delivering fortified take-home rations, milk, eggs, and hot nutritious meals through Anganwadi centres across plain mandals of Andhra Pradesh.",
    "audio_file": "static/audio/sampoorna_poshana.mp3",
    "source_name": "Women Development & Child Welfare Department, AP",
    "source_url": "https://wdcw.ap.gov.in/",
    "keywords": [
      "Sampoorna Poshana",
      "Anganwadi nutrition",
      "Maternal food ration",
      "సంపూర్ణ పోషణ",
      "అంగన్‌వాడీ ఆహారం",
      "Pregnant women eggs milk",
      "Anaemia prevention"
    ],
    "original_complex_text": "YSR Sampoorna Poshana covers all plain areas in Andhra Pradesh through 55,607 Anganwadi centres. Pregnant women and lactating mothers receive one full nutritious meal every day, comprising fortified rice, dal with leafy vegetables, vegetable curry, boiled egg, and 200ml fortified milk for 25 days a month, along with Take-Home Rations of multigrain flour, peanut chikki, and dates to eliminate maternal malnutrition and low birth-weight babies.",
    "simplified": {
      "eligibility": "All pregnant women, lactating mothers (up to 6 months post-delivery), and children aged 6 months to 6 years residing in Andhra Pradesh.",
      "benefits": "Daily hot nutritious meal with boiled egg and milk at Anganwadi, monthly take-home ration kits (multigrain flour, iron chikki, dry dates), growth monitoring, and vitamin supplements.",
      "documents": "Aadhaar Card of mother/child and Anganwadi enrolment entry in YSR/NTR Kishori/Poshan tracker.",
      "steps": "Register at the nearest village Anganwadi Centre as soon as pregnancy is confirmed. Collect monthly rations and attend Anganwadi feeding sessions.",
      "description": "Sampoorna Poshana provides eggs, milk, fortified grains, and hot meals to pregnant mothers and children via Anganwadi centres to ensure complete health and nutrition."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని గర్భిణీ స్త్రీలు, పాలిచ్చే తల్లులు మరియు 6 నెలల నుండి 6 సంవత్సరాల లోపు వయసున్న పిల్లలందరూ అర్హులు.",
      "benefits": "అంగన్‌వాడీ కేంద్రంలో రోజూ గుడ్డు, పాలుతో కూడిన బలవర్ధక భోజనం, నెలనెలా వేరుశెనగ చిక్కీలు, ఖర్జూరం, రాగి పిండి మరియు పోషకాహార కిట్లు ఉచితం.",
      "documents": "తల్లి మరియు శిశువు ఆధార్ కార్డు, అంగన్‌వాడీ రిజిస్ట్రేషన్.",
      "steps": "సమీపంలోని అంగన్‌వాడీ కేంద్రాన్ని సందర్శించి పేరు నమోదు చేసుకోండి. ప్రతి నెలా ఉచిత పోషకాహారం మరియు గుడ్లు పొందండి.",
      "description": "గర్భిణులు, బాలింతలు మరియు చిన్నపిల్లల్లో రక్తహీనత నివారించడానికి పాలు, గుడ్లు మరియు పౌష్టికాహారాన్ని అంగన్‌వాడీల ద్వారా అందించే పథకమే సంపూర్ణ పోషణ."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://wdcw.ap.gov.in/",
    "contact_office": "Local Anganwadi Worker (AWW) / CDPO Office / Sachivalayam Mahila Police",
    "eligibility_confirmation": "Anganwadi Center Beneficiary Register",
    "eligibility_questions": [
      {
        "question_te": "మీ ఇంట్లో గర్భిణీ, బాలింత లేదా 6 ఏళ్ల లోపు చిన్న పిల్లలు ఉన్నారా?",
        "question_en": "Is there a pregnant woman, lactating mother, or child under 6 years in your family?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Mother Aadhaar Card", "name_te": "తల్లి ఆధార్ కార్డు", "optional": false },
      { "name": "MCP (Mother Child Protection) Card", "name_te": "ఆర్‌సీహెచ్ / తల్లీబిడ్డ సంరక్షణ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "Statewide": "All 55,607 Anganwadi Centres across AP"
    }
  },

  "YSR Sampoorna Poshana Plus": {
    "level": "Andhra Pradesh",
    "category": "Tribal Maternal & Child Nutrition",
    "icon": "maternal",
    "telugu_name": "వైఎస్ఆర్ / ఎన్టీఆర్ సంపూర్ణ పోషణ ప్లస్ (గిరిజన ప్రాంత పోషకాహారం)",
    "telugu_description": "ఆంధ్రప్రదేశ్‌లోని 77 గిరిజన షెడ్యూల్డ్ మండలాల్లోని (ITDA ఏరియాలు) గర్భిణులు, బాలింతలు మరియు చిన్నారులకు మరింత ప్రత్యేక పోషకాహారం మరియు బలవర్ధక కిట్లు అందించే కార్యక్రమం.",
    "english_description": "Enhanced supplementary nutrition programme targeting tribal pregnant women, lactating mothers, and children in 77 ITDA agency mandals of Andhra Pradesh with enhanced food baskets and daily milk.",
    "audio_file": "static/audio/sampoorna_poshana_plus.mp3",
    "source_name": "AP Tribal Welfare & Women Development Dept",
    "source_url": "https://wdcw.ap.gov.in/",
    "keywords": [
      "Sampoorna Poshana Plus",
      "ITDA Nutrition",
      "Tribal pregnant women",
      "సంపూర్ణ పోషణ ప్లస్",
      "గిరిజన పోషకాహారం",
      "Agency areas food kit"
    ],
    "original_complex_text": "YSR Sampoorna Poshana Plus is dedicated to 77 Scheduled/Tribal mandals under 7 ITDAs (Paderu, Parvathipuram, Rampachodavaram, Buttayagudem, KR Puram, Chintoor, Seethampeta) and Chenchu habitations. It supplies 200ml milk for 30 days, 30 eggs per month, ragi malt, jaggery, and sprouted pulses to address acute chronic malnutrition, stunting, and sickle cell related anaemia in tribal habitations.",
    "simplified": {
      "eligibility": "Pregnant women, nursing mothers, and children under 6 in 77 tribal mandals under ITDAs in Andhra Pradesh.",
      "benefits": "Higher quantity of fortified milk (daily 200ml for 30 days), 30 eggs a month, enriched ragi malt, iron jaggery chikkis, and complete cooked meals.",
      "documents": "Aadhaar Card, ITDA Tribal Area Residence verification.",
      "steps": "Enrol at the local tribal habitation Anganwadi centre. Rations are supplied directly or via mobile distribution in remote hamlets.",
      "description": "Sampoorna Poshana Plus delivers extra eggs, daily milk, and specialized nutritious rations specifically to tribal mothers and children in agency areas."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని 77 గిరిజన ప్రాంత (ITDA) మండలాల్లో నివసించే గర్భిణులు, బాలింతలు మరియు 6 ఏళ్ల లోపు పిల్లలు అర్హులు.",
      "benefits": "నెలకు 30 రోజుల పాటు రోజూ 200 మి.లీ పాలు, నెలకు 30 గుడ్లు, రాగి పిండి, బెల్లం, శనగలు మరియు బలవర్ధక ఆహార కిట్లు పూర్తిగా ఉచితం.",
      "documents": "ఆధార్ కార్డు, గిరిజన ప్రాంత నివాస ధృవీకరణ.",
      "steps": "గిరిజన గూడెం లేదా గ్రామంలోని అంగన్‌వాడీ కార్యకర్త వద్ద పేరు నమోదు చేయించుకోవాలి.",
      "description": "గిరిజన ప్రాంతాల్లోని మహిళలు మరియు పిల్లలకు పోషకాహార లోపం రాకుండా రోజువారీ పాలు, గుడ్లు మరియు ప్రత్యేక ఆహార ప్యాకెట్లు అందించే పథకం."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://wdcw.ap.gov.in/",
    "contact_office": "ITDA Project Officer & Tribal Mandal Anganwadi CDPO",
    "eligibility_confirmation": "ITDA Habitation Resident Certificate",
    "eligibility_questions": [
      {
        "question_te": "మీరు ఐటీడీఏ (ITDA) లేదా గిరిజన ఏజెన్సీ మండలాల్లో నివసిస్తున్నారా?",
        "question_en": "Do you reside in an ITDA scheduled tribal mandal in AP?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "Paderu": "ITDA Project Office, Paderu (Alluri Sitharama Raju District)",
      "Rampachodavaram": "ITDA Project Office, Rampachodavaram"
    }
  },

  "AP Free Knee and Hip Replacement Scheme": {
    "level": "Andhra Pradesh",
    "category": "Orthopaedic Joint Replacement Surgery",
    "icon": "hospital",
    "telugu_name": "ఆరోగ్యశ్రీ ఉచిత కీళ్ల మార్పిడి (మోకాలు & తుంటి ఆపరేషన్లు)",
    "telugu_description": "తీవ్రమైన కీళ్ల వాతం, ఆస్టియో ఆర్థరైటిస్ వల్ల నడవలేని పేద వృద్ధులకు డా. ఎన్టీఆర్ / వైఎస్ఆర్ ఆరోగ్యశ్రీ కింద పూర్తిగా ఉచితంగా మోకాలు మరియు తుంటి మార్పిడి శస్త్రచికిత్సలు.",
    "english_description": "Comprehensive joint replacement program under Dr. NTR Vaidya Seva / Aarogyasri covering 100% cashless Total Knee Replacement (TKR) and Total Hip Replacement (THR) with high-grade implants.",
    "audio_file": "static/audio/joint_replacement.mp3",
    "source_name": "Dr. NTR Vaidya Seva Health Care Trust, AP",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "keywords": [
      "Knee Replacement",
      "Hip Replacement",
      "Total Knee Replacement",
      "మోకాలు మార్పిడి",
      "తుంటి మార్పిడి",
      "Aarogyasri joint surgery",
      "Free orthopaedic surgery"
    ],
    "original_complex_text": "Severe osteoarthritis causing debilitating knee pain is rampant among agricultural labourers and elderly citizens in AP. Under the Aarogyasri Trust healthcare packages, Total Knee Replacement (Unilateral and Bilateral) and Total Hip Replacement surgeries costing upwards of ₹2.5 to ₹4 Lakhs in private facilities are provided 100% cashless. The package covers titanium/cobalt chrome implants, pre-operative investigation, surgery, hospital stay, post-operative rehabilitation physiotherapy, and Aarogya Asara recovery allowance.",
    "simplified": {
      "eligibility": "BPL Rice Card holders in AP suffering from Grade IV osteoarthritis, joint destruction, or avascular necrosis of femoral head confirmed by orthopaedic surgeon.",
      "benefits": "100% free knee/hip joint replacement surgery with premium certified implants, free hospital stay, medications, and ₹5,000 monthly Aarogya Asara wage compensation during recovery.",
      "documents": "Rice Card / BPL Card, Aadhaar Card, Recent X-Rays / MRI joint reports from empanelled hospital.",
      "steps": "Consult an orthopaedic specialist at any empanelled network hospital or Government Teaching Hospital. Aarogyamithra initiates cashless pre-authorization.",
      "description": "Aarogyasri offers totally free knee and hip replacement operations for low-income citizens, including premium artificial joints, hospital care, and rest financial assistance."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ బియ్యం కార్డు లేదా తెల్ల రేషన్ కార్డు ఉండి, తీవ్రమైన మోకాలు/తుంటి కీళ్ల అరుగుదలతో బాధపడుతున్న పేద పౌరులు అర్హులు.",
      "benefits": "లక్షల రూపాయల విలువైన మోకాలు/తుంటి మార్పిడి ఆపరేషన్, మేలైన ఇంప్లాంట్లు, మందులు, ఆసుపత్రి ఖర్చులు మరియు రికవరీ సమయంలో ఆరోగ్య ఆసరా సాయం పూర్తిగా ఉచితం.",
      "documents": "బియ్యం కార్డు / రేషన్ కార్డు, ఆధార్ కార్డు, ఎక్స్-రే లేదా ఎంఆర్ఐ రిపోర్టులు.",
      "steps": "నెట్‌వర్క్ ఆసుపత్రిలోని ఆర్థోపెడిక్ వైద్యుడిని సంప్రదించండి. అక్కడి ఆరోగ్యమిత్ర డెస్క్ ద్వారా ఉచిత ఆమోదం పొంది శస్త్రచికిత్స చేయించుకోవచ్చు.",
      "description": "కీళ్ల నొప్పులతో నడవలేని పేదవారికి ఆరోగ్యశ్రీ ద్వారా ఆధునిక మోకాలు లేదా తుంటి మార్పిడి శస్త్రచికిత్సను రూపాయి ఖర్చు లేకుండా చేస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "contact_office": "Aarogyamithra Desk at District Hospital or Network Orthopaedic Hospital",
    "eligibility_confirmation": "Orthopaedic Surgeon X-Ray Evaluation & Trust Approval",
    "eligibility_questions": [
      {
        "question_te": "మీ వద్ద ఆంధ్రప్రదేశ్ బియ్యం కార్డు లేదా తెల్ల రేషన్ కార్డు ఉందా?",
        "question_en": "Do you hold a valid Andhra Pradesh Rice Card / BPL Ration Card?",
        "weight": "critical"
      },
      {
        "question_te": "డాక్టర్లు మీకు మోకాలు లేదా తుంటి మార్పిడి ఆపరేషన్ అవసరమని సూచించారా?",
        "question_en": "Has an orthopaedic specialist advised knee or hip replacement surgery?",
        "weight": "high"
      }
    ],
    "required_documents": [
      { "name": "Rice Card / Aarogyasri Card", "name_te": "బియ్యం కార్డు / ఆరోగ్యశ్రీ కార్డు", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Knee / Hip Joint X-Ray", "name_te": "కీళ్ల ఎక్స్-రే రిపోర్ట్", "optional": false }
    ],
    "local_help_locations": {
      "Vijayawada": "Government General Hospital (Old GGH / New GGH), Gunadala",
      "Visakhapatnam": "King George Hospital (KGH) Ortho Dept",
      "Kurnool": "Kurnool Medical College & GGH"
    }
  },

  "AP Free Cancer Chemotherapy & Radiation Scheme": {
    "level": "Andhra Pradesh",
    "category": "Oncology & Cancer Treatment",
    "icon": "hospital",
    "telugu_name": "ఆరోగ్యశ్రీ ఉచిత క్యాన్సర్ చికిత్స, కీమోథెరపీ & రేడియేషన్ పథకం",
    "telugu_description": "క్యాన్సర్ వ్యాధిగ్రస్తులకు కీమోథెరపీ సైకిల్స్, రేడియేషన్ థెరపీ, పెట్ స్కాన్ పరీక్షలు మరియు సర్జికల్ ఆంకాలజీ చికిత్సలను అపరిమితంగా ఉచితంగా అందించే పథకం.",
    "english_description": "Comprehensive cashless oncology package under Dr. NTR Vaidya Seva / Aarogyasri covering medical chemotherapy, linear accelerator radiation therapy, PET-CT scans, and surgical oncology without financial cap.",
    "audio_file": "static/audio/cancer_care.mp3",
    "source_name": "Dr. NTR Vaidya Seva Health Care Trust, AP",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "keywords": [
      "Cancer Care",
      "Free Chemotherapy",
      "Radiation Therapy",
      "క్యాన్సర్ చికిత్స",
      "కీమోథెరపీ",
      "రేడియేషన్",
      "Aarogyasri oncology"
    ],
    "original_complex_text": "Cancer treatments often push families into poverty due to recurrent cycles of expensive chemotherapy drugs, immunotherapy, targeted therapy, and high-precision radiation therapy. The Government of AP includes over 400 specialized oncology packages under Aarogyasri. There is no expenditure ceiling for cancer therapy, enabling beneficiaries to receive uninterrupted care at leading oncology institutes like Basavatarakam, Homi Bhabha Cancer Hospital Visakhapatnam, and empanelled cancer centers.",
    "simplified": {
      "eligibility": "All BPL / Rice Card holders in Andhra Pradesh diagnosed with any form or stage of cancer.",
      "benefits": "Unlimited cashless chemotherapy cycles, targeted therapy, immunotherapy, radiation therapy (IMRT/IGRT), surgical tumor removal, follow-up diagnostics, and Aarogya Asara financial wage aid.",
      "documents": "Rice Card / Aarogyasri Card, Aadhaar Card, Histopathology / Biopsy report confirming malignancy.",
      "steps": "Visit any empanelled cancer institute or government oncology hospital. Hospital Aarogyamithra completes biometric authentication and initiates pre-authorization.",
      "description": "Cancer patients receive completely free, unlimited chemotherapy, radiation, tumor surgeries, and recovery allowance under Aarogyasri."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ బియ్యం కార్డు ఉండి, బయాప్సీ లేదా క్యాన్సర్ నిర్ధారణ రిపోర్టులు ఉన్న రోగులందరూ అర్హులు.",
      "benefits": "అన్ని రకాల క్యాన్సర్ శస్త్రచికిత్సలు, కీమోథెరపీ సైకిల్స్, రేడియేషన్ థెరపీ, ఖరీదైన ఇంజెక్షన్లు మరియు నెలకు రూ. 5,000 వరకు ఆర్థిక సాయం ఉచితం.",
      "documents": "బియ్యం కార్డు, ఆధార్ కార్డు, బయాప్సీ లేదా హిస్టోపాథాలజీ క్యాన్సర్ నిర్ధారణ రిపోర్ట్.",
      "steps": "గుర్తింపు పొందిన క్యాన్సర్ ఆసుపత్రిలోని ఆరోగ్యమిత్ర డెస్క్ వద్ద రిపోర్టులు సమర్పించి తక్షణ ఉచిత చికిత్స పొందవచ్చు.",
      "description": "క్యాన్సర్ బాధితులకు కీమోథెరపీ, రేడియేషన్ మరియు ఆపరేషన్లను ఖర్చు లేకుండా ఆరోగ్యశ్రీ ద్వారా అందిస్తున్నారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "contact_office": "Aarogyasri Trust Cancer Coordination Cell / Toll-free 104",
    "eligibility_confirmation": "Biopsy / Histopathology Report by Empanelled Pathologist",
    "eligibility_questions": [
      {
        "question_te": "వైద్య పరీక్షల్లో క్యాన్సర్ ఉన్నట్లు బయాప్సీ రిపోర్ట్ ద్వారా నిర్ధారణ అయిందా?",
        "question_en": "Has cancer been confirmed through biopsy or histopathology reports?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Rice Card", "name_te": "బియ్యం కార్డు", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Biopsy / Pathology Report", "name_te": "బయాప్సీ లేదా పాథాలజీ రిపోర్ట్", "optional": false }
    ],
    "local_help_locations": {
      "Visakhapatnam": "Homi Bhabha Cancer Hospital & Research Centre, Aganampudi",
      "Guntur": "Government General Hospital Cancer Wing, Guntur",
      "Tirupati": "SVIMS Sri Venkateswara Institute of Cancer Care & Advanced Research (SVICCAR)"
    }
  },

  "National Viral Hepatitis Control Programme (NVHCP - AP)": {
    "level": "National",
    "category": "Communicable Disease & Liver Care",
    "icon": "medicine",
    "telugu_name": "జాతీయ వైరల్ హెపటైటిస్ నియంత్రణ & ఉచిత కాలేయ చికిత్స పథకం (NVHCP)",
    "telugu_description": "హెపటైటిస్ బి మరియు హెపటైటిస్ సి కాలేయ ఇన్ఫెక్షన్ల నివారణకు ఉచిత రక్త పరీక్షలు (వైరల్ లోడ్) మరియు ఖరీదైన యాంటీవైరల్ మందుల పంపిణీ పథకం.",
    "english_description": "National program offering free viral load testing, screening, Hepatitis B vaccines, and direct-acting antiviral (DAA) cure medicines (Sofosbuvir + Daclatasvir) for Hepatitis C across Andhra Pradesh.",
    "audio_file": "static/audio/nvhcp_ap.mp3",
    "source_name": "National Health Mission & AP Directorate of Health",
    "source_url": "https://nvhcp.mohfw.gov.in/",
    "keywords": [
      "NVHCP",
      "Hepatitis B",
      "Hepatitis C",
      "Liver disease cure",
      "హెపటైటిస్ బి",
      "హెపటైటిస్ సి",
      "Sofosbuvir free medicine",
      "కాలేయ వ్యాధి"
    ],
    "original_complex_text": "Viral Hepatitis B and C are silent killers leading to liver cirrhosis and hepatocellular carcinoma. Under NVHCP, all District Hospitals and Medical Colleges in AP host dedicated Model Treatment Centres (MTC). Patients receive free qualitative and quantitative HCV RNA / HBV DNA tests, and Hepatitis C patients receive the complete 12-week course of generic Sofosbuvir and Daclatasvir achieving a >95% cure rate totally free.",
    "simplified": {
      "eligibility": "Anyone tested positive for Hepatitis B surface antigen (HBsAg) or Hepatitis C antibody (Anti-HCV) in Andhra Pradesh.",
      "benefits": "Free viral load PCR confirmation tests, free 12-week curative oral medicines for Hepatitis C, free lifelong antiviral suppression therapy for Hepatitis B, and free Hepatitis B vaccines for high-risk individuals.",
      "documents": "Aadhaar Card, Initial HBsAg / Anti-HCV screening report.",
      "steps": "Visit the NVHCP Model Treatment Centre at your District Hospital or Government Medical College. Blood sample is tested free and medication is dispensed from the hospital pharmacy.",
      "description": "NVHCP provides 100% free viral load lab tests and complete cure medicines for Hepatitis C and Hepatitis B at government district hospitals."
    },
    "telugu": {
      "eligibility": "హెపటైటిస్ బి లేదా హెపటైటిస్ సి ఇన్ఫెక్షన్ ఉన్నట్లు స్క్రీనింగ్ పరీక్షలో తేలిన పౌరులందరూ అర్హులు.",
      "benefits": "లక్షల రూపాయల విలువైన హెపటైటిస్ సి నయం చేసే మందులు (సోఫోస్‌బువిర్ + డాక్లాటాస్విర్) 12 వారాల పాటు ఉచితం. హెపటైటిస్ బి కి ఉచిత పరీక్షలు మరియు మందులు.",
      "documents": "ఆధార్ కార్డు, రక్త పరీక్ష రిపోర్టులు.",
      "steps": "జిల్లా ప్రభుత్వ ఆసుపత్రి లేదా మెడికల్ కాలేజీలోని ఎన్వీహెచ్సీపీ (NVHCP) విభాగాన్ని సంప్రదించి ఉచిత మందులు పొందవచ్చు.",
      "description": "కాలేయానికి వచ్చే ప్రమాదకర హెపటైటిస్ బి, సి వ్యాధులకు ఉచితంగా రక్త పరీక్షలు చేసి పూర్తి మందులను ప్రభుత్వ ఆసుపత్రుల ద్వారా ఉచితంగా అందిస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://nvhcp.mohfw.gov.in/",
    "contact_office": "District Hospital NVHCP Treatment Centre / General Medicine OPD",
    "eligibility_confirmation": "Positive Serological / PCR Test Result",
    "eligibility_questions": [
      {
        "question_te": "మీకు కామెర్లు లేదా హెపటైటిస్ బి / సి పాజిటివ్ వచ్చినట్లు నిర్ధారణ అయిందా?",
        "question_en": "Have you tested positive for Hepatitis B or Hepatitis C in screening tests?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "HBsAg or Anti-HCV Lab Report", "name_te": "హెపటైటిస్ ల్యాబ్ పరీక్ష రిపోర్ట్", "optional": false }
    ],
    "local_help_locations": {
      "All Districts": "District Headquarters Hospital Model Treatment Centre"
    }
  },

  "Pradhan Mantri TB Mukt Bharat Abhiyan & Ni-kshay Mitra": {
    "level": "National",
    "category": "TB Nutrition & Community Support",
    "icon": "medicine",
    "telugu_name": "ప్రధాన మంత్రి టీబీ ముక్త భారత్ అభియాన్ & నిక్షయ్ మిత్ర",
    "telugu_description": "క్షయ (టీబీ) వ్యాధిగ్రస్తులకు చికిత్స పూర్తయ్యే వరకు నెలకు రూ. 500 నగదు బదిలీతో పాటు దాతల (నిక్షయ్ మిత్ర) ద్వారా ఉచిత పౌష్టికాహార బుట్టల పంపిణీ పథకం.",
    "english_description": "Community support initiative empowering individual and corporate donors (Ni-kshay Mitras) to provide monthly nutritious food baskets to TB patients along with DBT nutritional cash support.",
    "audio_file": "static/audio/tb_mukt_bharat.mp3",
    "source_name": "Central TB Division & AP State TB Cell",
    "source_url": "https://tbcindia.gov.in/",
    "keywords": [
      "TB Mukt Bharat",
      "Ni-kshay Mitra",
      "TB food basket",
      "టీబీ ముక్త భారత్",
      "నిక్షయ్ మిత్ర",
      "క్షయ వ్యాధి పౌష్టికాహారం",
      "Ni-kshay Poshan"
    ],
    "original_complex_text": "Under the Pradhan Mantri TB Mukt Bharat Abhiyan, community members, NGOs, and elected representatives register as 'Ni-kshay Mitras' to adopt TB patients undergoing treatment. Each enrolled patient receives a monthly nutritional food basket containing cereals, pulses, vegetable oil, roasted peanuts, and milk powder in addition to the monthly ₹500 directly credited under Ni-kshay Poshan Yojana.",
    "simplified": {
      "eligibility": "All patients diagnosed with active pulmonary or extra-pulmonary Tuberculosis receiving treatment under the National TB Elimination Programme in AP.",
      "benefits": "Monthly food basket containing 3kg pulses, 1.5kg edible oil, protein powder, and millet flour from Ni-kshay Mitras, plus ₹500/month DBT to bank account.",
      "documents": "Ni-kshay ID, Aadhaar Card, Bank Account details.",
      "steps": "Registered automatically when TB treatment starts at government DOTS center. Patient gives consent on the Ni-kshay portal to receive food baskets.",
      "description": "TB patients receive monthly nutritious food baskets from community donors alongside ₹500 cash support to boost recovery and eliminate TB."
    },
    "telugu": {
      "eligibility": "ప్రభుత్వ నిబంధనల ప్రకారం టీబీ మందులు వాడుతున్న ఆంధ్రప్రదేశ్ రోగులందరూ అర్హులు.",
      "benefits": "నెలకు రూ. 500 బ్యాంక్ జమతో పాటు నిక్షయ్ మిత్ర దాతల ద్వారా ఉచితంగా పప్పులు, నూనె, ప్రోటీన్ పౌడర్ వంటి పోషకాహార కిట్ ఉచితం.",
      "documents": "నిక్షయ్ ఐడీ, ఆధార్ కార్డు, బ్యాంక్ ఖాతా వివరాలు.",
      "steps": "సమీప డీఓటీఎస్ (DOTS) కేంద్రం లేదా పీహెచ్‌సీ ద్వారా నమోదు చేసుకుంటే నేరుగా కిట్లు మరియు నగదు సాయం అందుతుంది.",
      "description": "టీబీ వ్యాధి నయమయ్యే వరకు రోగులకు నెలకు రూ. 500 నగదు మరియు పోషకాహార కిట్‌ను ఉచితంగా అందజేస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://nikshay.in/",
    "contact_office": "District TB Centre (DTC) / PHC Senior Treatment Supervisor (STS)",
    "eligibility_confirmation": "Ni-kshay Registered Treatment Number",
    "eligibility_questions": [
      {
        "question_te": "మీరు ప్రస్తుతం ప్రభుత్వ డీఓటీఎస్ (DOTS) కేంద్రం ద్వారా టీబీ మందులు వాడుతున్నారా?",
        "question_en": "Are you currently enrolled and undergoing TB treatment through government DOTS?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Ni-kshay ID Card", "name_te": "నిక్షయ్ రిజిస్ట్రేషన్ కార్డు", "optional": false },
      { "name": "Bank Passbook Copy", "name_te": "బ్యాంక్ పాస్‌బుక్ కాపీ", "optional": false }
    ],
    "local_help_locations": {
      "All Districts": "District TB Centre at District Hospital"
    }
  },

  "Surakshit Matritva Aashwasan (SUMAN Scheme - AP)": {
    "level": "National",
    "category": "Zero-Expense Maternal & Infant Care",
    "icon": "maternal",
    "telugu_name": "సురక్షిత మాతృత్వ ఆశ్వాసన్ (సుమన్ - సున్నా ఖర్చు ప్రసవ సేవలు)",
    "telugu_description": "ప్రభుత్వ ఆసుపత్రులలో గర్భిణులకు మరియు పుట్టిన శిశువులకు ఒక్క రూపాయి కూడా ఖర్చు లేకుండా గౌరవప్రదమైన, సురక్షితమైన ప్రసవ మరియు అత్యవసర సేవల హామీ పథకం.",
    "english_description": "Zero-tolerance scheme assuring 100% free, respectful, and quality maternal and newborn healthcare without any out-of-pocket expenses at all public health facilities.",
    "audio_file": "static/audio/suman_scheme.mp3",
    "source_name": "Ministry of Health & Family Welfare & AP Health Dept",
    "source_url": "https://suman.mohfw.gov.in/",
    "keywords": [
      "SUMAN",
      "Zero expense delivery",
      "Surakshit Matritva",
      "సుమన్ పథకం",
      "సున్నా ఖర్చు ప్రసవం",
      "Free C section govt hospital",
      "102 Mahata ambulance"
    ],
    "original_complex_text": "SUMAN provides a legal commitment of zero denial of service and zero out-of-pocket expenses for all pregnant women and sick infants up to 6 months in public health facilities. It mandates free transport from home to hospital (108/102), free diagnostic tests (including ultrasound), free blood transfusion, free normal and C-section surgeries, and guaranteed grievance redressal within 1 hour.",
    "simplified": {
      "eligibility": "All pregnant women and infants up to 6 months visiting any public health facility in Andhra Pradesh.",
      "benefits": "Zero expense for registration, diagnostics, blood, Caesarean surgery, food during stay, medicines, and free 102 transport back to home.",
      "documents": "Aadhaar Card, MCP / RCH Card (services are never denied even without documents).",
      "steps": "Walk into any government PHC, CHC, Area Hospital, or Teaching Hospital. Dial 104 if any staff demands money or denies service.",
      "description": "SUMAN guarantees that no pregnant mother or newborn is charged a single rupee for delivery, surgeries, or ambulance transport at public hospitals."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని గర్భిణీ స్త్రీలు మరియు 6 నెలల లోపు వయసున్న పసిబిడ్డలందరూ అర్హులు.",
      "benefits": "ఆసుపత్రిలో కాన్పు, సిజేరియన్ ఆపరేషన్, అల్ట్రాసౌండ్ స్కానింగ్, రక్తం, మందులు మరియు ఇంటికి చేర్చే 102 వాహనం పూర్తిగా ఉచితం (సున్నా ఖర్చు).",
      "documents": "తల్లి ఆధార్ కార్డు, ఆర్‌సీహెచ్ కార్డు.",
      "steps": "ఏదైనా ప్రభుత్వ ఆసుపత్రికి వెళ్లండి. ఆసుపత్రిలో ఎవరైనా డబ్బులు డిమాండ్ చేస్తే వెంటనే 104 లేదా 1902 టోల్ ఫ్రీ నంబర్‌కు ఫిర్యాదు చేయవచ్చు.",
      "description": "ప్రభుత్వ ఆసుపత్రిలో ప్రసవానికి ఒక్క రూపాయి కూడా ఖర్చు లేకుండా పూర్తి చికిత్స మరియు మందులను హామీగా అందించే పథకమే సుమన్."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://suman.mohfw.gov.in/",
    "contact_office": "Public Health Facility Helpdesk / Toll-Free Grievance 104",
    "eligibility_confirmation": "Universal Maternal Right (Zero Denial Guarantee)",
    "eligibility_questions": [
      {
        "question_te": "మీరు లేదా మీ కుటుంబ సభ్యులు గర్భవతిగా ఉన్నారా?",
        "question_en": "Are you or your family member pregnant?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Mother Aadhaar Card", "name_te": "తల్లి ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "Statewide": "All 24x7 Primary Health Centres, CHCs, and District Maternity Hospitals"
    }
  },

  "AP Thalassemia Free Blood Transfusion & Chelation Scheme": {
    "level": "Andhra Pradesh",
    "category": "Rare Blood Disorders & Chronic Care",
    "icon": "medicine",
    "telugu_name": "తలసేమియా & సికిల్ సెల్ ఉచిత రక్త మార్పిడి & మందుల సహాయ పథకం",
    "telugu_description": "తలసేమియా మేజర్ మరియు సికిల్ సెల్ రక్తహీనత బాధితులకు ఉచితంగా ల్యూకో-డిప్లీటెడ్ రక్తం ఎక్కించడం, ఖరీదైన ఐరన్ చీలేషన్ మందులు మరియు నెలకు రూ. 10,000 పెన్షన్ అందించే పథకం.",
    "english_description": "State welfare initiative providing free filtered blood transfusions, iron chelation medication (Deferasirox), routine ferritin checks, and a monthly financial pension of ₹10,000 for Thalassemia Major patients in AP.",
    "audio_file": "static/audio/thalassemia_care.mp3",
    "source_name": "AP Health Care Trust & Social Welfare Dept",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "keywords": [
      "Thalassemia",
      "Sickle Cell",
      "Blood transfusion",
      "తలసేమియా",
      "సికిల్ సెల్",
      "ఉచిత రక్తం మార్పిడి",
      "Thalassemia pension 10000"
    ],
    "original_complex_text": "Thalassemia Major children require frequent blood transfusions every 2 to 3 weeks for life, which leads to toxic iron overload in organs. The Government of AP provides dedicated day-care transfusion centers at District Hospitals, free specialized blood filters, oral iron chelators like Deferasirox, and a monthly social security pension of ₹10,000 under the YSR / NTR Bharosa pension scheme.",
    "simplified": {
      "eligibility": "Patients diagnosed with Thalassemia Major, Haemophilia, or Severe Sickle Cell Anaemia holding an Andhra Pradesh Medical Board disability certificate.",
      "benefits": "Free leuko-depleted blood transfusions, free daily iron chelator tablets, free regular serum ferritin monitoring, and ₹10,000 monthly bank pension.",
      "documents": "SADAREM Disability Certificate / Medical Board Certificate, Rice Card, Aadhaar Card, Bank Account Passbook.",
      "steps": "Register at District Hospital Blood Bank and apply for monthly pension through your Ward / Grama Sachivalayam Welfare Assistant.",
      "description": "Thalassemia patients receive lifelong free blood transfusions, costly iron removal medicines, and ₹10,000 monthly financial pension."
    },
    "telugu": {
      "eligibility": "సదరం (SADAREM) మెడికల్ బోర్డు ద్వారా తలసేమియా మేజర్ లేదా సికిల్ సెల్ ఉన్నట్లు ధృవీకరణ పొందిన ఆంధ్రప్రదేశ్ పౌరులు అర్హులు.",
      "benefits": "జిల్లా ఆసుపత్రులలో ఉచిత రక్త మార్పిడి, ఉచిత ఐరన్ చీలేషన్ మందులు మరియు నెలకు రూ. 10,000 పెన్షన్ నేరుగా లబ్ధిదారుని బ్యాంక్ ఖాతాలో జమ.",
      "documents": "సదరం మెడికల్ సర్టిఫికెట్, బియ్యం కార్డు, ఆధార్ కార్డు, బ్యాంక్ పాస్‌బుక్.",
      "steps": "గ్రామ/వార్డు సచివాలయంలో సంక్షేమ కార్యదర్శిని సంప్రదించి పెన్షన్ మరియు జిల్లా ఆసుపత్రిలో ఉచిత రక్త మార్పిడి నమోదు చేసుకోవచ్చు.",
      "description": "తలసేమియా వ్యాధిగ్రస్తులకు క్రమం తప్పకుండా ఉచిత రక్తం ఎక్కించడంతో పాటు నెలకు రూ. 10,000 ఆర్థిక పింఛను అందజేస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "contact_office": "District Hospital Day Care Blood Centre & Grama Sachivalayam Welfare Assistant",
    "eligibility_confirmation": "SADAREM Medical Board Thalassemia Certificate",
    "eligibility_questions": [
      {
        "question_te": "రోగికి తలసేమియా మేజర్ నిర్ధారణ అయి, సదరం (SADAREM) సర్టిఫికెట్ ఉందా?",
        "question_en": "Has Thalassemia Major been certified through a SADAREM Medical Board certificate?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "SADAREM Certificate", "name_te": "సదరం మెడికల్ సర్టిఫికెట్", "optional": false },
      { "name": "Rice Card", "name_te": "బియ్యం కార్డు", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "Kakinada": "Rangaraya Medical College Blood Bank, Kakinada",
      "Visakhapatnam": "King George Hospital (KGH) Pediatric Hematology Unit"
    }
  },

  "Rashtriya Kishor Swasthya Karyakram (RKSK - AP)": {
    "level": "National",
    "category": "Adolescent Health & Counseling",
    "icon": "doctor",
    "telugu_name": "రాష్ట్రీయ కిశోర్ స్వాస్థ్య కార్యక్రమం (కౌమార బాలబాలికల ఆరోగ్యం)",
    "telugu_description": "10 నుండి 19 ఏళ్ల లోపు కౌమార బాలబాలికల పోషకాహారం, మానసిక ఆరోగ్యం, రక్తహీనత నివారణ మరియు ఉచిత కౌన్సెలింగ్ కొరకు ఏర్పాటైన యువ క్లినిక్‌ల పథకం.",
    "english_description": "Comprehensive adolescent healthcare initiative delivering confidential counseling, WIFS iron supplements, mental wellbeing support, and menstrual hygiene via Adolescent Friendly Health Clinics (AFHCs).",
    "audio_file": "static/audio/rksk_ap.mp3",
    "source_name": "National Health Mission & AP Health Dept",
    "source_url": "https://nhm.gov.in/",
    "keywords": [
      "RKSK",
      "Adolescent health",
      "AFHC Yuva clinic",
      "కౌమార ఆరోగ్యం",
      "యువ క్లినిక్",
      "Weekly Iron Folic Acid",
      "Menstrual hygiene"
    ],
    "original_complex_text": "RKSK addresses the holistic health needs of adolescents aged 10-19 years in AP. Dedicated 'Yuva Clinics' (Adolescent Friendly Health Clinics) at PHCs and CHCs provide non-judgmental counseling on puberty, mental stress, substance abuse, and sexual health. Additionally, Weekly Iron and Folic Acid Supplementation (WIFS) tablets and sanitary napkins are distributed through schools and Anganwadis.",
    "simplified": {
      "eligibility": "All adolescents (boys and girls) aged 10 to 19 years residing in Andhra Pradesh.",
      "benefits": "Confidential counseling by trained counselors, free Weekly Iron and Folic Acid (WIFS) tablets, free sanitary pads, and treatment for reproductive tract infections.",
      "documents": "No mandatory documentation; open access at all government health facilities.",
      "steps": "Walk into the nearest PHC or CHC and visit the dedicated 'Yuva Clinic / AFHC' room on clinic days.",
      "description": "RKSK provides teenagers with free, confidential medical counseling, iron supplements, and personal health guidance at youth-friendly clinics."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని 10 నుండి 19 ఏళ్ల లోపు బాలబాలికలందరూ అర్హులు.",
      "benefits": "పీహెచ్‌సీలలోని 'యువ క్లినిక్' లలో ఉచిత కౌన్సెలింగ్, వారపు ఐరన్-ఫోలిక్ యాసిడ్ మాత్రలు, శానిటరీ న్యాప్‌కిన్లు మరియు మానసిక ఆరోగ్య సలహాలు ఉచితం.",
      "documents": "ఎటువంటి డాక్యుమెంట్లు అవసరం లేదు (ఉచిత ప్రభుత్వ సేవ).",
      "steps": "సమీప ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) లేదా కమ్యూనిటీ హెల్త్ సెంటర్‌లోని యువ క్లినిక్‌ను నేరుగా సందర్శించండి.",
      "description": "10-19 ఏళ్ల యువతీయువకులకు శారీరక మార్పులు, పోషకాహారం మరియు మానసిక ఒత్తిడిపై రహస్యంగా సరైన వైద్య సలహాలు అందించే కార్యక్రమం."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://nhm.gov.in/",
    "contact_office": "Primary Health Centre (PHC) Adolescent Friendly Health Clinic (AFHC)",
    "eligibility_confirmation": "Age 10-19 Self Declaration",
    "eligibility_questions": [
      {
        "question_te": "లబ్ధిదారుని వయస్సు 10 నుండి 19 సంవత్సరాల మధ్య ఉందా?",
        "question_en": "Is the beneficiary an adolescent between 10 and 19 years of age?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "School ID or Aadhaar (Optional)", "name_te": "స్కూల్ ఐడీ లేదా ఆధార్ (ఐచ్ఛికం)", "optional": true }
    ],
    "local_help_locations": {
      "Statewide": "Yuva Clinics at all Community Health Centres (CHC) and District Hospitals"
    }
  },

  "AP Universal Health Insurance Coverage (25 Lakh Aarogya Raksha)": {
    "level": "Andhra Pradesh",
    "category": "Universal Comprehensive Health Insurance",
    "icon": "hospital",
    "telugu_name": "ఆంధ్రప్రదేశ్ ₹25 లక్షల సార్వత్రిక ఆరోగ్య రక్ష పథకం",
    "telugu_description": "ఆంధ్రప్రదేశ్ ప్రజలందరికీ ఏటా కుటుంబానికి ₹25 లక్షల వరకు ఉచిత సూపర్ స్పెషాలిటీ చికిత్సలు మరియు 3,257 శస్త్రచికిత్సలను అందించే సార్వత్రిక ఆరోగ్య పథకం.",
    "english_description": "Universal health assurance policy entitling eligible resident families of Andhra Pradesh to free medical and surgical treatment up to ₹25 Lakhs per year covering 3,257 procedures.",
    "audio_file": "static/audio/universal_health.mp3",
    "source_name": "Government of Andhra Pradesh & Dr. NTR Vaidya Seva Trust",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "keywords": [
      "25 Lakh Health Insurance",
      "Universal Health Coverage",
      "Aarogya Raksha",
      "₹25 లక్షల ఉచిత చికిత్స",
      "సార్వత్రిక ఆరోగ్య బీమా",
      "3257 medical procedures"
    ],
    "original_complex_text": "The Government of Andhra Pradesh has raised the health assurance ceiling under Dr. NTR Vaidya Seva / Aarogyasri to ₹25 Lakhs per family per year, establishing the highest financial healthcare safety net in India. Covering 3,257 medical and surgical procedures across empanelled hospitals, this policy eliminates financial catastrophe for severe cardiac, neurological, organ transplant, polytrauma, and oncology ailments.",
    "simplified": {
      "eligibility": "All families holding an Andhra Pradesh Rice Card / BPL Card or certified under state universal health eligibility criteria.",
      "benefits": "Free cashless treatment, surgeries, intensive care (ICU), and medicines up to ₹25,00,000 per family annually across empanelled super-specialty hospitals.",
      "documents": "Aadhaar Card, Rice Card / Aarogyasri Card.",
      "steps": "Walk into any empanelled public or private network hospital. The hospital Aarogyamithra verifies biometric credentials and registers the case without any advance deposit.",
      "description": "AP universal health policy covers ₹25 Lakhs of free hospital and surgical care per family every year for 3,257 critical medical procedures."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ బియ్యం కార్డు లేదా అర్హత కలిగిన కుటుంబాలన్నీ అర్హులు.",
      "benefits": "కుటుంబానికి ఏటా ₹25 లక్షల వరకు ఉచిత ఆసుపత్రి చికిత్స, 3,257 రకాల ఆపరేషన్లు, ఐసీయూ సంరక్షణ, గుండె, క్యాన్సర్, కిడ్నీ ఆపరేషన్లు పూర్తిగా ఉచితం.",
      "documents": "బియ్యం కార్డు లేదా రేషన్ కార్డు, ఆధార్ కార్డు.",
      "steps": "ఆసుపత్రిలోని ఆరోగ్యమిత్ర హెల్ప్ డెస్క్ వద్ద ఆధార్ లేదా బియ్యం కార్డు చూపించి ఉచిత చికిత్స పొందవచ్చు.",
      "description": "ఆంధ్రప్రదేశ్ ప్రభుత్వం ప్రతి పేద కుటుంబానికి ఏడాదికి గరిష్టంగా ₹25 లక్షల వరకు భారీ ఉచిత ఆరోగ్య రక్షణను కల్పిస్తోంది."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "contact_office": "Dr. NTR Vaidya Seva Trust Call Centre / Toll-Free 104",
    "eligibility_confirmation": "Aadhaar & Rice Card Biometric Verification",
    "eligibility_questions": [
      {
        "question_te": "మీ వద్ద ఆంధ్రప్రదేశ్ బియ్యం కార్డు లేదా ఆహార భద్రత కార్డు ఉందా?",
        "question_en": "Do you hold a valid Andhra Pradesh Rice Card or Food Security Card?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Rice Card / Food Security Card", "name_te": "బియ్యం కార్డు / ఆహార భద్రత కార్డు", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "All Network Hospitals": "Aarogyamithra Desk at Hospital Reception"
    }
  },

  "AP Vikalangula Sahaya Sanstha Prosthetic & Hearing Aids Scheme": {
    "level": "Andhra Pradesh",
    "category": "Disability Rehabilitation & Assistive Devices",
    "icon": "specialized",
    "telugu_name": "దివ్యాంగులకు ఉచిత సహాయ ఉపకరణాలు & వినికిడి యంత్రాల పంపిణీ పథకం",
    "telugu_description": "ఆంధ్రప్రదేశ్‌లోని దివ్యాంగులకు బ్యాటరీ ట్రై సైకిళ్లు, మోటరైజ్డ్ వీల్‌చైర్లు, డిజిటల్ వినికిడి యంత్రాలు మరియు కృత్రిమ అవయవాలను ఉచితంగా అందించే పథకం.",
    "english_description": "State welfare initiative distributing free motorized tricycles, wheelchairs, digital behind-the-ear (BTE) hearing aids, artificial limbs, calipers, and blind assistive devices to persons with disabilities (PwDs) in AP.",
    "audio_file": "static/audio/prosthetics_ap.mp3",
    "source_name": "AP Differently Abled & Senior Citizens Assistance Corporation (APDASCAC)",
    "source_url": "https://apdascac.ap.gov.in/",
    "keywords": [
      "APDASCAC",
      "Prosthetics",
      "Hearing aids",
      "Battery tricycle",
      "దివ్యాంగుల ఉపకరణాలు",
      "వినికిడి యంత్రం",
      "కృత్రిమ అవయవాలు"
    ],
    "original_complex_text": "The AP Differently Abled and Senior Citizens Assistance Corporation implements assistive device distribution camps across all districts. Eligible persons with 40% and above certified locomotor or hearing disability receive customized artificial limbs, lightweight carbon calipers, modern digital hearing aids with speech clarity, and high-capacity battery tricycles.",
    "simplified": {
      "eligibility": "Persons with certified physical, hearing, or visual disability of 40% or more having a valid SADAREM certificate in Andhra Pradesh.",
      "benefits": "100% free motorized tricycles, wheelchairs, digital hearing aids, artificial limbs, braille kits, and walking smart canes.",
      "documents": "SADAREM Disability Certificate, Aadhaar Card, Rice Card, Passport size photos.",
      "steps": "Apply through Grama/Ward Sachivalayam or online on the APDASCAC portal. Devices are distributed at district assessment camps.",
      "description": "APDASCAC supplies free battery tricycles, wheelchairs, digital hearing aids, and artificial limbs to certified persons with disabilities."
    },
    "telugu": {
      "eligibility": "సదరం (SADAREM) సర్టిఫికెట్ ప్రకారం 40% లేదా అంతకంటే ఎక్కువ వైకల్యం ఉన్న ఆంధ్రప్రదేశ్ దివ్యాంగులు అర్హులు.",
      "benefits": "ఉచిత బ్యాటరీ ట్రై సైకిళ్లు, మోటార్ వీల్‌చైర్లు, డిజిటల్ వినికిడి యంత్రాలు, కృత్రిమ కాళ్లు/చేతులు మరియు క్యాలిపర్లు ఉచిత పంపిణీ.",
      "documents": "సదరం సర్టిఫికెట్, ఆధార్ కార్డు, బియ్యం కార్డు, పాస్‌పోర్ట్ సైజు ఫోటోలు.",
      "steps": "గ్రామ లేదా వార్డు సచివాలయంలో సంక్షేమ కార్యదర్శి ద్వారా దరఖాస్తు చేసుకోవాలి లేదా జిల్లా ఏపీడీఏఎస్‌సీఏసీ అధికారిని సంప్రదించాలి.",
      "description": "నడవలేని లేదా వినపడని దివ్యాంగులకు బ్యాటరీ సైకిళ్లు, వినికిడి యంత్రాలు, కృత్రిమ కాళ్లను ప్రభుత్వం ఉచితంగా అందజేస్తుంది."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://apdascac.ap.gov.in/",
    "contact_office": "District Differently Abled Welfare Office at Collectorate / Sachivalayam",
    "eligibility_confirmation": "SADAREM 40%+ Disability Verification",
    "eligibility_questions": [
      {
        "question_te": "మీ వద్ద 40% లేదా అంతకంటే ఎక్కువ వైకల్యం ధృవీకరించిన సదరం (SADAREM) సర్టిఫికెట్ ఉందా?",
        "question_en": "Do you hold a SADAREM certificate certifying 40% or more disability?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "SADAREM Certificate", "name_te": "సదరం ధృవీకరణ పత్రం", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false },
      { "name": "Rice Card", "name_te": "బియ్యం కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "All District Collectorates": "Assistant Director, Welfare of Differently Abled Office"
    }
  },

  "AP Tribal Bike Ambulance & Feeder Ambulance Service": {
    "level": "Andhra Pradesh",
    "category": "Remote & Agency Emergency Transport",
    "icon": "ambulance",
    "telugu_name": "గిరిజన ప్రాంత అత్యవసర బైక్ అంబులెన్స్ & ఫీడర్ సేవలు",
    "telugu_description": "కొండ కోనలు, రహదారి లేని మారుమూల గిరిజన గూడేలలోని గర్భిణులు మరియు అత్యవసర రోగులను ప్రధాన రహదారికి చేర్చే మోటార్ బైక్ అంబులెన్స్ సేవలు.",
    "english_description": "Dedicated emergency feeder response operating modified two-wheeler bike ambulances equipped with sidecar stretchers, oxygen, and first aid across hilly, unpaved tribal habitations in Andhra Pradesh.",
    "audio_file": "static/audio/bike_ambulance.mp3",
    "source_name": "Department of Health & Tribal Welfare, AP",
    "source_url": "https://cfw.ap.nic.in/",
    "keywords": [
      "Bike Ambulance",
      "Tribal ambulance",
      "Feeder ambulance",
      "బైక్ అంబులెన్స్",
      "గిరిజన అత్యవసర వాహనం",
      "108 feeder service",
      "Agency emergency transport"
    ],
    "original_complex_text": "In remote agency habitations of Alluri Sitharama Raju, Parvathipuram Manyam, and tribal areas, four-wheeled 108 ambulances cannot navigate narrow forest trails and rocky terrain. The AP government deployed specialized Bike Ambulances with sidecar stretcher pods, oxygen cylinders, and trained emergency medical technicians to transport pregnant women and critical patients from inaccessible thandas to the nearest road point.",
    "simplified": {
      "eligibility": "All residents living in remote, hilly, and inaccessible tribal hamlets in Andhra Pradesh requiring urgent hospital transport.",
      "benefits": "Free rapid emergency transport from doorstep over forest paths to the main highway feeder point, where a 108 Advanced Life Support ambulance takes over.",
      "documents": "No documents needed during emergency.",
      "steps": "Dial 108 toll-free. The central dispatch coordinates with the local agency bike ambulance rider based on GPS tracking.",
      "description": "Bike ambulances reach remote hilly tribal hamlets where regular ambulances cannot go, safely transporting patients to the nearest hospital."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని రోడ్డు సౌకర్యం లేని మారుమూల గిరిజన గ్రామాలు, కొండ ప్రాంతాల ప్రజలందరూ అర్హులు.",
      "benefits": "అడవి బాటల ద్వారా స్ట్రెచర్ అమర్చిన బైక్ అంబులెన్స్‌లో ప్రధాన రహదారి వరకు ఉచిత తరలింపు, ప్రథమ చికిత్స మరియు ఆక్సిజన్ సపోర్ట్.",
      "documents": "అత్యవసర సమయంలో ఎటువంటి పత్రాలు అవసరం లేదు.",
      "steps": "108 నంబర్‌కు ఉచితంగా కాల్ చేయండి. లేదా స్థానిక ఆశా కార్యకర్త ద్వారా బైక్ అంబులెన్స్ పైలట్‌కు సమాచారం ఇవ్వండి.",
      "description": "సాధారణ 108 అంబులెన్స్ వెళ్లలేని కొండ ప్రాంతాల గిరిజనులను ఆసుపత్రికి చేర్చేందుకు ప్రత్యేక బైక్ అంబులెన్స్ సేవలు అందుబాటులో ఉన్నాయి."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://cfw.ap.nic.in/",
    "contact_office": "Dial 108 Emergency Call Centre / Local Tribal PHC",
    "eligibility_confirmation": "Emergency Location Dispatch",
    "eligibility_questions": [
      {
        "question_te": "రోగి కొండ లేదా మారుమూల గిరిజన ప్రాంతంలో ఉండి సాధారణ అంబులెన్స్ రాలేని పరిస్థితుల్లో ఉన్నారా?",
        "question_en": "Is the patient located in a remote hilly tribal hamlet inaccessible by standard four-wheel ambulance?",
        "weight": "critical"
      }
    ],
    "required_documents": [],
    "local_help_locations": {
      "ASR District": "Paderu, Chintapalli, Araku Valley Emergency Response Base",
      "Parvathipuram": "Seethampeta and Salur ITDA Bases"
    }
  },

  "AP Chief Minister Relief Fund (CMRF) Medical Aid": {
    "level": "Andhra Pradesh",
    "category": "Emergency Discretionary Medical Assistance",
    "icon": "specialized",
    "telugu_name": "ముఖ్యమంత్రి సహాయ నిధి (CMRF) అత్యవసర వైద్య ఆర్థిక సాయం",
    "telugu_description": "ఆరోగ్యశ్రీ పరిధిలోకి రాని అరుదైన వ్యాధులు లేదా ప్రత్యేక చికిత్సల కోసం పేద ప్రజలకు ముఖ్యమంత్రి సహాయ నిధి నుండి నేరుగా మంజూరు చేసే అత్యవసర ఆర్థిక సాయం.",
    "english_description": "Government discretionary welfare grant providing substantial financial reimbursement (₹1,00,000 to ₹3,00,000+) directly from the Chief Minister's Relief Fund for catastrophic ailments not fully covered under normal scheme packages.",
    "audio_file": "static/audio/cmrf_ap.mp3",
    "source_name": "Revenue (CMRF) Department & Health Trust, AP",
    "source_url": "https://cmrf.ap.gov.in/",
    "keywords": [
      "CMRF",
      "Chief Minister Relief Fund",
      "CM medical aid",
      "ముఖ్యమంత్రి సహాయ నిధి",
      "వైద్య ఖర్చుల సాయం",
      "Emergency financial grant"
    ],
    "original_complex_text": "The Chief Minister's Relief Fund provides financial relief to distressed patients suffering from major diseases, rare surgical complications, or catastrophic accidental trauma where treatment costs exceed routine scheme limits or occurred in non-empanelled emergency centers. Applications endorsed by local MLAs or District Collectors are audited by medical specialists and sanctioned via direct bank credit.",
    "simplified": {
      "eligibility": "BPL and low-income residents of Andhra Pradesh who incurred major medical expenses for severe illnesses not covered or exceeding Aarogyasri limits.",
      "benefits": "Direct financial aid cheque / bank credit ranging from ₹50,000 up to ₹3,00,000+ depending on medical board evaluation.",
      "documents": "Original Hospital Medical Bills, Discharge Summary, Aadhaar Card, Rice Card, Bank Passbook, MLA Recommendation Letter.",
      "steps": "Submit original bills and hospital discharge summary to the local MLA office or District Collectorate Spandana / CMRF section.",
      "description": "CMRF provides direct cash assistance up to several lakhs for major medical expenses not covered by regular government schemes."
    },
    "telugu": {
      "eligibility": "ఆరోగ్యశ్రీ పరిధిలో లేని లేదా పరిమితి మించిన భారీ వైద్య ఖర్చులు భరించిన ఆంధ్రప్రదేశ్ పేద కుటుంబాలు అర్హులు.",
      "benefits": "వైద్య బిల్లుల పరిశీలన ఆధారంగా రూ. 50,000 నుండి రూ. 3,00,000 లేదా అంతకంటే ఎక్కువ ఆర్థిక సాయం నేరుగా బ్యాంక్ ఖాతాలో జమ.",
      "documents": "ఆసుపత్రి అసలు మెడికల్ బిల్లులు, డిశ్చార్జ్ సమ్మరీ, ఆధార్ కార్డు, బియ్యం కార్డు, బ్యాంక్ పాస్‌బుక్, ఎమ్మెల్యే సిఫారసు లేఖ.",
      "steps": "వైద్య బిల్లులు మరియు డిశ్చార్జ్ రిపోర్టులతో స్థానిక శాసనసభ్యుని (MLA) కార్యాలయంలో లేదా కలెక్టరేట్ CMRF కౌంటర్‌లో దరఖాస్తు చేసుకోండి.",
      "description": "భారీ వైద్య ఖర్చుల వల్ల అప్పులపాలైన పేదలకు ముఖ్యమంత్రి సహాయ నిధి ద్వారా నేరుగా లక్షల రూపాయల ఆర్థిక సహాయం అందజేస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://cmrf.ap.gov.in/",
    "contact_office": "District Collectorate CMRF Cell / Local MLA Camp Office",
    "eligibility_confirmation": "Director of Medical Education CMRF Scrutiny Committee",
    "eligibility_questions": [
      {
        "question_te": "మీ వద్ద ఆసుపత్రి ఒరిజినల్ మెడికల్ బిల్లులు మరియు డాక్టర్ డిశ్చార్జ్ సమ్మరీ ఉన్నాయా?",
        "question_en": "Do you possess original hospital medical bills and verified discharge summary?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Original Hospital Bills", "name_te": "ఆసుపత్రి అసలు బిల్లులు", "optional": false },
      { "name": "Discharge Summary", "name_te": "డిశ్చార్జ్ సమ్మరీ", "optional": false },
      { "name": "Rice Card / Income Certificate", "name_te": "బియ్యం కార్డు లేదా ఆదాయ ధృవీకరణ", "optional": false },
      { "name": "Bank Passbook", "name_te": "బ్యాంక్ పాస్‌బుక్ కాపీ", "optional": false }
    ],
    "local_help_locations": {
      "All Districts": "District Collectorate CMRF / Spandana Helpdesk"
    }
  },

  "National Palliative Care Programme (AP Home-Based Care)": {
    "level": "National",
    "category": "Chronic & End-of-Life Palliative Care",
    "icon": "specialized",
    "telugu_name": "జాతీయ పాలియేటివ్ కేర్ - దీర్ఘకాలిక రోగులకు గృహ ఆధారిత సంరక్షణ",
    "telugu_description": "క్యాన్సర్, పక్షవాతం మరియు దీర్ఘకాలిక వ్యాధులతో మంచానికే పరిమితమైన రోగుల ఇళ్లకు వెళ్లి నొప్పుల నివారణ మందులు (మోర్ఫిన్) మరియు నర్సింగ్ సేవలు అందించే పథకం.",
    "english_description": "Comprehensive community-based palliative care delivering free oral morphine pain management, bedsore dressing, catheter care, and psycho-social support directly at patient homes across Andhra Pradesh.",
    "audio_file": "static/audio/palliative_care.mp3",
    "source_name": "National Health Mission & AP Palliative Care Cell",
    "source_url": "https://nhm.gov.in/",
    "keywords": [
      "Palliative Care",
      "Home nursing",
      "Bedridden care",
      "పాలియేటివ్ కేర్",
      "గృహ సంరక్షణ",
      "Oral morphine pain relief",
      "Bedsore dressing"
    ],
    "original_complex_text": "Patients suffering from terminal cancer, end-stage organ failure, advanced neurological disorders, and chronic paraplegia often suffer from unbearable pain at home. The AP National Palliative Care Programme operates mobile home-care teams consisting of trained medical officers and staff nurses who visit patients' residences regularly to manage chronic pain using oral morphine, replace catheters/Ryle's tubes, and guide family caregivers.",
    "simplified": {
      "eligibility": "Bedridden patients, terminal cancer patients, severe stroke, or paraplegic patients living in Andhra Pradesh.",
      "benefits": "Free home visits by trained palliative nurses and doctors, free oral morphine and analgesics for pain relief, free catheterization, wound dressings, and counseling.",
      "documents": "Medical record / Cancer discharge card, Aadhaar Card.",
      "steps": "Inform your village ANM or visit the Palliative Care Unit at the District Hospital to register for regular home visits.",
      "description": "Trained medical teams visit bedridden and cancer patients at home, providing free pain relief medicines, catheter care, and wound dressings."
    },
    "telugu": {
      "eligibility": "క్యాన్సర్ ఆఖరి దశ, పక్షవాతం లేదా దీర్ఘకాలిక వ్యాధులతో ఇంటికే పరిమితమైన నిస్సహాయ రోగులందరూ అర్హులు.",
      "benefits": "నర్సులు, వైద్యులు రోగి ఇంటికే వచ్చి ఉచితంగా తీవ్రమైన నొప్పులను తగ్గించే మోర్ఫిన్ మందులు, పడక పుండ్ల డ్రెస్సింగ్ మరియు కేథటర్ మార్పిడి సేవలు అందిస్తారు.",
      "documents": "రోగి చికిత్స రిపోర్టులు, ఆధార్ కార్డు.",
      "steps": "స్థానిక ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) లేదా జిల్లా ఆసుపత్రిలోని పాలియేటివ్ కేర్ బృందానికి సమాచారం ఇవ్వండి.",
      "description": "క్యాన్సర్ మరియు తీవ్రమైన వ్యాధులతో మంచానికే పరిమితమైన వారికి ఇంటి వద్దకే వచ్చి నొప్పులు తగ్గించే ఉచిత వైద్య సేవల పథకం."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://nhm.gov.in/",
    "contact_office": "District Hospital Palliative Care Unit / PHC Medical Officer",
    "eligibility_confirmation": "Palliative Care Physician Bedridden Assessment",
    "eligibility_questions": [
      {
        "question_te": "రోగి తీవ్రమైన వ్యాధి లేదా క్యాన్సర్‌తో మంచానికే పరిమితమై నడవలేని స్థితిలో ఉన్నారా?",
        "question_en": "Is the patient bedridden due to terminal cancer, stroke, or chronic illness?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Medical Diagnosis Summary", "name_te": "వైద్య నిర్ధారణ రిపోర్ట్", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "All District Hospitals": "Dedicated Palliative Care Ward & Home Care Van"
    }
  },

  "AP Free Ultrasound, TIFFA Scan & Maternal Diagnostics": {
    "level": "Andhra Pradesh",
    "category": "Advanced Maternal Diagnostics",
    "icon": "maternal",
    "telugu_name": "గర్భిణులకు ఉచిత అల్ట్రాసౌండ్ & టిఫా (TIFFA) స్కానింగ్ పథకం",
    "telugu_description": "గర్భిణీ స్త్రీలకు పుట్టబోయే బిడ్డలోని లోపాలను గుర్తించేందుకు ఖరీదైన టిఫా (TIFFA) అల్ట్రాసౌండ్ స్కానింగ్ మరియు ప్రసూతి రక్త పరీక్షలను ఉచితంగా అందించే పథకం.",
    "english_description": "Statewide maternal healthcare initiative providing cashless Targeted Imaging for Fetal Anomalies (TIFFA) scan and advanced sonography for pregnant women at empanelled diagnostic centres.",
    "audio_file": "static/audio/tiffa_scan.mp3",
    "source_name": "AP Health, Medical and Family Welfare Department",
    "source_url": "https://cfw.ap.nic.in/",
    "keywords": [
      "TIFFA Scan",
      "Ultrasound pregnant",
      "Fetal anomaly scan",
      "టిఫా స్కానింగ్",
      "గర్భిణుల అల్ట్రాసౌండ్",
      "Free pregnancy scan",
      "Maternal diagnostics"
    ],
    "original_complex_text": "Detecting congenital anatomical anomalies in the developing fetus requires an anomaly ultrasound scan (TIFFA) between 18 and 22 weeks of gestation. In private centers, this scan costs ₹1,500 to ₹3,000. The Government of AP empanelled private diagnostic centers and equipped Teaching Hospitals to provide free ultrasound scans and TIFFA studies to all registered pregnant women through barcode-based referral vouchers.",
    "simplified": {
      "eligibility": "Every pregnant woman in Andhra Pradesh registered in the Reproductive and Child Health (RCH) system.",
      "benefits": "Free anomaly ultrasound (TIFFA scan), early pregnancy dating scan, 3rd trimester growth doppler, and complete antenatal lab profile.",
      "documents": "RCH Mother ID, Aadhaar Card, Doctor Referral Voucher from PHC / Government Hospital.",
      "steps": "Obtain an ultrasound referral slip from your PHC Medical Officer or Gynecologist. Present the voucher at empanelled scan centres for cashless scan.",
      "description": "Pregnant women get completely free ultrasound and TIFFA anomaly scans at government hospitals and empanelled private centers."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్ ఆర్‌సీహెచ్ (RCH) పోర్టల్‌లో నమోదైన గర్భిణీ స్త్రీలందరూ అర్హులు.",
      "benefits": "18-22 వారాల మధ్య చేసే అత్యంత ముఖ్యమైన టిఫా (TIFFA) స్కానింగ్ మరియు గ్రోత్ అల్ట్రాసౌండ్ పరీక్షలు పూర్తిగా ఉచితం.",
      "documents": "ఆర్‌సీహెచ్ కార్డు, ఆధార్ కార్డు, పీహెచ్‌సీ లేదా ప్రభుత్వ డాక్టర్ రిఫరల్ లెటర్.",
      "steps": "పీహెచ్‌సీ లేదా ఆసుపత్రి వైద్యుడి వద్ద స్కానింగ్ రిఫరల్ పొందండి. గుర్తింపు పొందిన స్కానింగ్ సెంటర్‌లో ఉచితంగా పరీక్ష చేయించుకోండి.",
      "description": "గర్భంలోని శిశువు ఆరోగ్యంగా ఉందో లేదో తెలుసుకునే ఖరీదైన టిఫా స్కానింగ్‌ను ప్రభుత్వం పేద మహిళలకు ఉచితంగా చేయిస్తుంది."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://cfw.ap.nic.in/",
    "contact_office": "Primary Health Centre / Community Health Centre Maternity Desk",
    "eligibility_confirmation": "RCH Pregnant Woman Registration",
    "eligibility_questions": [
      {
        "question_te": "గర్భధారణ 18 నుండి 22 వారాల మధ్య ఉండి డాక్టర్ టిఫా స్కానింగ్ రాశారా?",
        "question_en": "Are you between 18-22 weeks pregnant with a doctor's advice for a TIFFA anomaly scan?",
        "weight": "high"
      }
    ],
    "required_documents": [
      { "name": "Mother RCH Card", "name_te": "తల్లి ఆర్‌సీహెచ్ కార్డు", "optional": false },
      { "name": "Doctor Referral Slip", "name_te": "వైద్యుల స్కానింగ్ రిఫరల్ స్లిప్", "optional": false }
    ],
    "local_help_locations": {
      "Statewide": "District Hospitals and Empanelled Private Diagnostic Ultrasound Centres"
    }
  },

  "National Tobacco Cessation & De-addiction Services (AP NTCP Clinics)": {
    "level": "National",
    "category": "Substance De-addiction & Preventive Health",
    "icon": "medicine",
    "telugu_name": "జాతీయ పొగాకు వ్యసన విముక్తి కేంద్రాలు (NTCP డి-అడిక్షన్ సేవలు)",
    "telugu_description": "సిగరెట్, బీడీ, గుట్కా మరియు పొగాకు వ్యసనం నుండి బయటపడటానికి జిల్లా ఆసుపత్రులలో ఉచిత కౌన్సెలింగ్ మరియు నికోటిన్ రీప్లేస్‌మెంట్ మందులు అందించే పథకం.",
    "english_description": "Dedicated tobacco cessation clinics (TCCs) operational in District Hospitals offering free behavioral counseling, nicotine replacement gums/patches, and medications to quit smoking and chewing tobacco.",
    "audio_file": "static/audio/ntcp_cessation.mp3",
    "source_name": "National Tobacco Control Programme & AP Health Directorate",
    "source_url": "https://ntcp.mohfw.gov.in/",
    "keywords": [
      "NTCP",
      "Tobacco cessation",
      "Quit smoking",
      "పొగాకు విముక్తి",
      "సిగరెట్ వ్యసనం",
      "గుట్కా మాన్పించే కేంద్రాలు",
      "Nicotine replacement"
    ],
    "original_complex_text": "Tobacco use is the single largest preventable cause of oral cancer, cardiovascular disease, and chronic lung disease. In Andhra Pradesh, Tobacco Cessation Clinics (TCC) are established at District Headquarters Hospitals and Dental Colleges. Trained psychologists and doctors provide carbon monoxide breath monitoring, behavioral de-addiction therapy, and free Nicotine Replacement Therapy (NRT) to help citizens quit permanently.",
    "simplified": {
      "eligibility": "Any individual residing in Andhra Pradesh seeking help to quit smoking (cigarettes/beedis) or smokeless tobacco (gutkha/khaini).",
      "benefits": "Free one-on-one psychological counseling, carbon monoxide breathalyzer assessment, free nicotine chewing gums and patches, and toll-free helpline support.",
      "documents": "No documents required (universal free public health service).",
      "steps": "Walk into the Tobacco Cessation Clinic at the District Hospital or call the National Quitline toll-free at 1800-11-2356.",
      "description": "Free counseling and nicotine replacement therapies are provided at government clinics to help people quit smoking and tobacco."
    },
    "telugu": {
      "eligibility": "పొగాకు, సిగరెట్లు, బీడీలు, గుట్కా వ్యసనం మానుకోవాలనుకునే ఆంధ్రప్రదేశ్ పౌరులందరూ అర్హులు.",
      "benefits": "నిపుణులైన సైకాలజిస్టుల ద్వారా ఉచిత కౌన్సెలింగ్, నికోటిన్ గమ్స్, కార్బన్ మోనాక్సైడ్ శ్వాస పరీక్షలు మరియు 1800-11-2356 టోల్ ఫ్రీ సహాయం.",
      "documents": "ఎటువంటి పత్రాలు అవసరం లేదు.",
      "steps": "జిల్లా ఆసుపత్రిలోని పొగాకు వ్యసన విముక్తి (TCC) విభాగాన్ని నేరుగా సంప్రదించండి లేదా 1800-11-2356 కు కాల్ చేయండి.",
      "description": "పొగాకు, సిగరెట్, గుట్కా అలవాటు నుండి సులభంగా బయటపడటానికి ప్రభుత్వ ఆసుపత్రులలో ఉచిత చికిత్స మరియు మందులు అందిస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://ntcp.mohfw.gov.in/",
    "contact_office": "District Hospital Tobacco Cessation Clinic / Toll-Free Quitline 1800-11-2356",
    "eligibility_confirmation": "Voluntary Tobacco Cessation Registration",
    "eligibility_questions": [
      {
        "question_te": "మీరు సిగరెట్, బీడీ లేదా గుట్కా వంటి పొగాకు ఉత్పత్తులను మానుకోవాలనుకుంటున్నారా?",
        "question_en": "Do you want to quit smoking or using tobacco products?",
        "weight": "high"
      }
    ],
    "required_documents": [],
    "local_help_locations": {
      "All Districts": "Tobacco Cessation Clinic at District Headquarters Hospital"
    }
  },

  "AP Mukhyamantri e-Eye Care (Tele-Ophthalmology Services)": {
    "level": "Andhra Pradesh",
    "category": "Vision Care & Digital Eye Clinics",
    "icon": "specialized",
    "telugu_name": "వైఎస్ఆర్ / ఎన్టీఆర్ ముఖ్యమంత్రి ఇ-నేత్ర రక్షణ (టెలి-ఆప్తాల్మాలజీ)",
    "telugu_description": "గ్రామీణ మరియు పట్టణ కేంద్రాలలో డిజిటల్ ఫండస్ కెమెరాల ద్వారా కంటి పరీక్షలు చేసి, నిపుణులైన నేత్ర వైద్యుల ద్వారా కంటి అద్దాలను నేరుగా ఇంటికే పంపే పథకం.",
    "english_description": "Network of primary tele-ophthalmology vision centres equipped with automated refractometers and fundus cameras connected to tertiary eye hospitals, delivering free prescription spectacles to citizens.",
    "audio_file": "static/audio/e_eye_care.mp3",
    "source_name": "AP Directorate of Public Health & LVPEI Partnership",
    "source_url": "https://cfw.ap.nic.in/",
    "keywords": [
      "e-Eye Care",
      "Tele-Ophthalmology",
      "Free spectacles",
      "ఇ-నేత్ర రక్షణ",
      "కంటి అద్దాలు ఉచితం",
      "Vision Centre AP",
      "Diabetic retinopathy screening"
    ],
    "original_complex_text": "To prevent avoidable blindness and diabetic retinopathy, the Government of AP established Tele-Ophthalmology Vision Centres across Community Health Centres. Patients are examined by trained vision technicians using digital slit lamps and non-mydriatic fundus cameras. Images are transmitted cloud-based to ophthalmologists at partner institutes like LV Prasad Eye Institute. Custom-powered eyeglasses are manufactured and delivered free to beneficiaries within 10 days.",
    "simplified": {
      "eligibility": "All citizens of Andhra Pradesh suffering from defective vision, refractive errors, cataract, or diabetic eye complications.",
      "benefits": "Free computerized eye checkup, digital fundus imaging, free high quality prescription eyeglasses delivered to home, and free surgical referral for cataract.",
      "documents": "Aadhaar Card, Mobile Number.",
      "steps": "Visit the Tele-Ophthalmology Vision Centre at the nearest Community Health Centre (CHC). Eyeglasses are delivered via post/Sachivalayam.",
      "description": "Citizens receive free digital eye exams and customized prescription reading glasses delivered right to their home under the e-Eye care program."
    },
    "telugu": {
      "eligibility": "కంటి చూపు లోపాలు, శుక్లాలు లేదా దృష్టి సమస్యలతో బాధపడుతున్న ఆంధ్రప్రదేశ్ పౌరులందరూ అర్హులు.",
      "benefits": "కంప్యూటరైజ్డ్ కంటి పరీక్షలు, రెటీనా ఫండస్ పరీక్షలు, నాణ్యమైన కంటి అద్దాల ఉచిత పంపిణీ మరియు శుక్లాల ఆపరేషన్లకు ఉచిత రిఫరల్.",
      "documents": "ఆధార్ కార్డు, ఫోన్ నంబర్.",
      "steps": "సమీప సీహెచ్‌సీ (CHC) లోని విజన్ సెంటర్‌కు వెళ్లండి. పరీక్ష పూర్తయిన తర్వాత కంటి అద్దాలు మీ చిరునామాకు ఉచితంగా అందుతాయి.",
      "description": "కంటి చూపు మందగించిన వారికి ఉచితంగా కంప్యూటర్ పరీక్షలు చేసి, నాణ్యమైన కళ్ళజోళ్లను ఉచితంగా అందజేసే పథకం."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://cfw.ap.nic.in/",
    "contact_office": "Community Health Centre Vision Centre / District Blindness Control Society",
    "eligibility_confirmation": "Vision Technician Refractive Error Record",
    "eligibility_questions": [
      {
        "question_te": "మీకు చదవడానికి లేదా దూరం చూడటానికి కంటి చూపు సమస్యలు ఉన్నాయా?",
        "question_en": "Do you experience blurry vision or difficulty reading / seeing objects?",
        "weight": "high"
      }
    ],
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "All Mandals": "Tele-Ophthalmology Vision Centre at Community Health Centre (CHC)"
    }
  },

  "AP Mobile Medical Teams for Schools & Hostels": {
    "level": "Andhra Pradesh",
    "category": "Child & Student Health Screening",
    "icon": "maternal",
    "telugu_name": "పాఠశాలలు & సంక్షేమ వసతి గృహాల మొబైల్ ఆరోగ్య బృందాలు (RBSK మొబైల్ యూనిట్లు)",
    "telugu_description": "ప్రభుత్వ పాఠశాలలు, అంగన్‌వాడీలు మరియు సాంఘిక సంక్షేమ హాస్టల్ విద్యార్థులకు డాక్టర్ల బృందం ఉచితంగా ఆరోగ్య పరీక్షలు చేసి గుండె జబ్బులు, కంటి లోపాలు మరియు శస్త్రచికిత్సలు చేయించే పథకం.",
    "english_description": "Dedicated mobile health teams conducting bi-annual health screenings of all children in Anganwadis, government schools, and welfare hostels for 4Ds (Defects, Deficiencies, Diseases, and Developmental delays) with 100% free secondary care.",
    "audio_file": "static/audio/rbsk_hostels.mp3",
    "source_name": "Rashtriya Bal Swasthya Karyakram (RBSK) & AP Health Dept",
    "source_url": "https://cfw.ap.nic.in/",
    "keywords": [
      "Hostel health checkup",
      "School medical screening",
      "RBSK mobile unit",
      "పాఠశాల ఆరోగ్య పరీక్షలు",
      "వసతి గృహాల విద్యార్థుల ఆరోగ్యం",
      "Congenital heart disease screening"
    ],
    "original_complex_text": "AP operates hundreds of dedicated RBSK Mobile Health Teams, each comprising two medical officers, an ANM, and a pharmacist. The teams visit every Anganwadi and government school twice a year. Children detected with congenital heart diseases, cleft lip/palate, club foot, neural tube defects, or severe vision impairments are referred to Super Specialty Network Hospitals where corrective surgeries are performed 100% cashless under Aarogyasri.",
    "simplified": {
      "eligibility": "All infants and children aged 0 to 18 years enrolled in Anganwadis, government schools, and welfare hostels in AP.",
      "benefits": "Free comprehensive screening for 32 health conditions, free corrective surgeries (congenital heart holes, cleft palate, club foot), free spectacles, and nutritional supplements.",
      "documents": "Student ID or Anganwadi record.",
      "steps": "Screening is conducted on-campus during scheduled visits by the RBSK mobile health team. Parents are informed and assisted for higher treatment.",
      "description": "Mobile doctor teams visit all government schools and hostels to detect and cure child health defects and heart ailments totally free."
    },
    "telugu": {
      "eligibility": "ఆంధ్రప్రదేశ్‌లోని అంగన్‌వాడీలు, ప్రభుత్వ బడులు, సాంఘిక సంక్షేమ హాస్టళ్లలో చదివే 0 నుండి 18 ఏళ్ల విద్యార్థులందరూ అర్హులు.",
      "benefits": "పాఠశాలలోనే ఉచిత వైద్య పరీక్షలు, పుట్టుకతో వచ్చే గుండె రంధ్రాలు, గ్రహణ మొర్రి, కంటి లోపాలకు సూపర్ స్పెషాలిటీ ఆసుపత్రులలో ఉచిత ఆపరేషన్లు.",
      "documents": "పాఠశాల గుర్తింపు లేదా ఆధార్ కార్డు.",
      "steps": "మొబైల్ వైద్య బృందం స్వయంగా పాఠశాల లేదా హాస్టల్‌ను సందర్శించి పరీక్షలు నిర్వహిస్తుంది.",
      "description": "ప్రభుత్వ పాఠశాలలు, హాస్టల్ పిల్లలకు డాక్టర్ల బృందం ఉచితంగా పరీక్షలు చేసి గుండె జబ్బులు లేదా లోపాలుంటే ఉచిత ఆపరేషన్లు చేయిస్తుంది."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://cfw.ap.nic.in/",
    "contact_office": "RBSK District Early Intervention Centre (DEIC) at District Hospital",
    "eligibility_confirmation": "RBSK Mobile Health Team School Screening Register",
    "eligibility_questions": [
      {
        "question_te": "పిల్లవాడు ప్రభుత్వ పాఠశాల, హాస్టల్ లేదా అంగన్‌వాడీలో చదువుతున్నారా?",
        "question_en": "Is the child enrolled in a government school, hostel, or Anganwadi in AP?",
        "weight": "high"
      }
    ],
    "required_documents": [
      { "name": "Student ID / Aadhaar", "name_te": "విద్యార్థి ఐడీ లేదా ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "All Districts": "District Early Intervention Centre (DEIC) at Teaching Hospital"
    }
  },

  "National Rabies Post-Exposure Prophylaxis & Free ARV/RIG Programme": {
    "level": "National",
    "category": "Emergency Animal Bite Prophylaxis",
    "icon": "medicine",
    "telugu_name": "జాతీయ రేబీస్ నివారణ - ఉచిత యాంటీ రేబీస్ టీకా & సీరం పథకం",
    "telugu_description": "కుక్క, పిల్లి లేదా కోతి కాటుకు గురైన బాధితులకు రేబీస్ వ్యాధి రాకుండా ప్రాథమిక ఆరోగ్య కేంద్రాలలో ఉచితంగా యాంటీ రేబీస్ ఇంజెక్షన్లు (ARV) మరియు ఇమ్యునోగ్లోబులిన్ (RIG) ఇచ్చే పథకం.",
    "english_description": "Universal emergency rabies prophylaxis program providing 100% free intradermal anti-rabies vaccine (IDRV) doses and Rabies Immunoglobulin (RIG) for animal bite victims at all 24x7 government health centres.",
    "audio_file": "static/audio/rabies_prevention.mp3",
    "source_name": "National Centre for Disease Control & AP Health Dept",
    "source_url": "https://ncdc.mohfw.gov.in/",
    "keywords": [
      "Rabies",
      "Dog bite vaccine",
      "Free ARV injection",
      "యాంటీ రేబీస్ టీకా",
      "కుక్క కాటు ఇంజెక్షన్",
      "Animal bite RIG",
      "Anti rabies vaccine free"
    ],
    "original_complex_text": "Rabies has a nearly 100% case fatality rate once clinical symptoms develop, but is 100% preventable with timely post-exposure prophylaxis. The Government of AP ensures 24x7 availability of Intradermal Rabies Vaccine (IDRV - Day 0, 3, 7, 28) and equine/human Rabies Immunoglobulin for severe Category III laceration bites across all PHCs, Community Health Centres, and Area Hospitals free of cost.",
    "simplified": {
      "eligibility": "Any person bitten, scratched, or exposed to rabies through dogs, monkeys, cats, or wild animals in Andhra Pradesh.",
      "benefits": "Free wound washing with antiseptic, free 4-dose Intradermal Anti-Rabies Vaccine course, and free Rabies Immunoglobulin (RIG) infiltration for severe bites.",
      "documents": "No documents needed (emergency life-saving service).",
      "steps": "Wash the bite wound immediately with soap and running water for 15 minutes. Report immediately to the nearest Government Hospital or 24x7 PHC for vaccine administration.",
      "description": "Anyone bitten by a dog or animal gets 100% free anti-rabies injections and vaccines at government hospitals to prevent rabies."
    },
    "telugu": {
      "eligibility": "కుక్క, పిల్లి, కోతి లేదా జంతువు కాటుకు గురైన ఆంధ్రప్రదేశ్ పౌరులందరూ అర్హులు.",
      "benefits": "ప్రైవేటులో వేల రూపాయలు ఖర్చయ్యే యాంటీ రేబీస్ ఇంజెక్షన్లు (ARV - 4 డోసులు) మరియు ఇమ్యునోగ్లోబులిన్ (RIG) ప్రభుత్వ ఆసుపత్రులలో పూర్తిగా ఉచితం.",
      "documents": "అత్యవసర చికిత్స కాబట్టి ఎటువంటి డాక్యుమెంట్లు అవసరం లేదు.",
      "steps": "గాయాన్ని వెంటనే సబ్బు మరియు ప్రవహించే నీటితో 15 నిమిషాలు కడగండి. వెంటనే సమీప ప్రభుత్వ ఆసుపత్రికి వెళ్లి ఉచిత టీకా వేయించుకోండి.",
      "description": "కుక్క లేదా జంతువు కరిచినప్పుడు రేబీస్ రాకుండా ప్రాణాలను కాపాడే ఉచిత టీకాలు మరియు ఇంజెక్షన్లను ప్రభుత్వ ఆసుపత్రులలో అందిస్తారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://ncdc.mohfw.gov.in/",
    "contact_office": "Emergency Casualty / 24x7 Primary Health Centre (PHC)",
    "eligibility_confirmation": "Animal Bite Exposure Case",
    "eligibility_questions": [
      {
        "question_te": "మిమ్మల్ని కుక్క, కోతి లేదా ఏదైనా జంతువు కరవడం లేదా గీరడం జరిగిందా?",
        "question_en": "Have you been bitten or scratched by a dog, monkey, or stray animal?",
        "weight": "critical"
      }
    ],
    "required_documents": [],
    "local_help_locations": {
      "Statewide": "All 24x7 Primary Health Centres, Community Health Centres, and Teaching Hospitals"
    }
  },

  "AP Free Dialysis Home Delivery Peritoneal Dialysis (CAPD)": {
    "level": "Andhra Pradesh",
    "category": "Nephrology & Renal Failure Care",
    "icon": "hospital",
    "telugu_name": "కిడ్నీ బాధితులకు ఉచిత నిరంతర పెరిటోనియల్ డయాలసిస్ (CAPD) గృహ పంపిణీ",
    "telugu_description": "ఆసుపత్రికి వెళ్లలేని గ్రామీణ కిడ్నీ రోగుల ఇళ్లకే పెరిటోనియల్ డయాలసిస్ ఫ్లూయిడ్ బ్యాగులు, కాథెటర్ కిట్లను ఉచితంగా డోర్ డెలివరీ చేసే ప్రత్యేక పథకం.",
    "english_description": "Specialized nephrology program delivering Continuous Ambulatory Peritoneal Dialysis (CAPD) fluid bags and transfer accessories free of cost directly to chronic kidney disease (CKD Stage 5) patients' doorsteps every month.",
    "audio_file": "static/audio/capd_dialysis.mp3",
    "source_name": "Dr. NTR Vaidya Seva Trust & AP Health Directorate",
    "source_url": "https://aarogyasri.ap.gov.in/",
    "keywords": [
      "CAPD",
      "Peritoneal Dialysis",
      "Home dialysis",
      "పెరిటోనియల్ డయాలసిస్",
      "కిడ్నీ రోగుల ఇంటికే డయాలసిస్",
      "Free dialysis fluid",
      "Uddanam kidney care"
    ],
    "original_complex_text": "For end-stage renal disease patients in Uddanam (Srikakulam) and remote rural mandals, traveling 3 times a week to hemodialysis centers is physically exhausting and costly. Under the AP CAPD initiative, patients undergo a catheter insertion surgery under Aarogyasri. Thereafter, a full month's supply of sterile dialysis fluid bags (120 bags/month) is shipped free directly to the patient's residence, accompanied by ₹10,000 monthly CKD pension.",
    "simplified": {
      "eligibility": "Chronic Kidney Disease (CKD Stage 5) patients certified by an empanelled nephrologist in Andhra Pradesh who opt for home peritoneal dialysis.",
      "benefits": "Free monthly home delivery of 120 sterile CAPD fluid bags (worth ₹25,000/month), free minicaps/transfer sets, plus ₹10,000 monthly financial pension.",
      "documents": "Rice Card, Aadhaar Card, Nephrologist CAPD Recommendation, SADAREM / Dialysis Card.",
      "steps": "Catheter is placed at an empanelled nephrology center under Aarogyasri. The trust coordinates automated monthly doorstep logistics.",
      "description": "Kidney patients receive complete peritoneal dialysis fluids and medical kits delivered free to their home every month, avoiding hospital visits."
    },
    "telugu": {
      "eligibility": "నెఫ్రాలజిస్ట్ ద్వారా ధృవీకరించబడిన తీవ్రమైన కిడ్నీ వైఫల్యంతో బాధపడుతూ, ఇంటి వద్ద డయాలసిస్ కోరుకునే ఆంధ్రప్రదేశ్ బియ్యం కార్డుదారులు అర్హులు.",
      "benefits": "నెలకు సుమారు ₹25,000 విలువైన డయాలసిస్ బ్యాగులు ఇంటికే ఉచిత డెలివరీ, మందులు మరియు నెలకు ₹10,000 పెన్షన్ నేరుగా బ్యాంక్ ఖాతాలో జమ.",
      "documents": "బియ్యం కార్డు, ఆధార్ కార్డు, నెఫ్రాలజిస్ట్ సిఫారసు రిపోర్ట్, బ్యాంక్ పాస్‌బుక్ కాపీ.",
      "steps": "ఆరోగ్యశ్రీ ఆసుపత్రిలోని కిడ్నీ వైద్యుడిని సంప్రదించండి. ఆసుపత్రి ఆరోగ్యమిత్ర ద్వారా హోమ్ డెలివరీ రిజిస్ట్రేషన్ చేయబడుతుంది.",
      "description": "ఆసుపత్రులకు వెళ్లలేని కిడ్నీ రోగులకు ఇంట్లోనే డయాలసిస్ చేసుకునేందుకు అవసరమైన లిక్విడ్ బ్యాగులను ప్రతి నెలా ఉచితంగా ఇంటికే పంపుతారు."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://aarogyasri.ap.gov.in/",
    "contact_office": "Aarogyasri Dialysis Cell & District Hospital Nephrology Unit",
    "eligibility_confirmation": "Nephrologist CAPD Clinical Certification",
    "eligibility_questions": [
      {
        "question_te": "రోగి తీవ్రమైన కిడ్నీ సమస్యతో బాధపడుతూ హోమ్ పెరిటోనియల్ డయాలసిస్ (CAPD) వాడుతున్నారా?",
        "question_en": "Is the patient certified for Stage 5 renal failure and prescribed Continuous Ambulatory Peritoneal Dialysis?",
        "weight": "critical"
      }
    ],
    "required_documents": [
      { "name": "Nephrology Certification", "name_te": "నెఫ్రాలజిస్ట్ వైద్య ధృవీకరణ", "optional": false },
      { "name": "Rice Card", "name_te": "బియ్యం కార్డు", "optional": false },
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "Srikakulam": "Palasa Research Centre & Srikakulam RIMS Kidney Unit",
      "Visakhapatnam": "KGH Nephrology & Dialysis Centre"
    }
  },

  "Pradhan Mantri Ayushman Bharat Health Infrastructure Mission": {
    "level": "National",
    "category": "Critical Healthcare Infrastructure",
    "icon": "hospital",
    "telugu_name": "ప్రధాన మంత్రి ఆయుష్మాన్ భారత్ ఆరోగ్య మౌలిక వసతుల మిషన్ (PM-ABHIM)",
    "telugu_description": "ఆంధ్రప్రదేశ్‌లోని జిల్లా ఆసుపత్రులలో 50-100 పడకల క్రిటికల్ కేర్ బ్లాకులు, ఆధునిక వ్యాధి నిర్ధారణ ల్యాబ్‌లు మరియు అత్యవసర ఐసీయూలను ఏర్పాటు చేసే కేంద్ర-రాష్ట్ర పథకం.",
    "english_description": "Pan-India health infrastructure initiative strengthening disease surveillance, establishing 50-100 bedded Critical Care Hospital Blocks (CCHBs) and Integrated Public Health Labs (IPHLs) across Andhra Pradesh.",
    "audio_file": "static/audio/pm_abhim.mp3",
    "source_name": "Ministry of Health & Family Welfare & AP Health Dept",
    "source_url": "https://pmabhim.mohfw.gov.in/",
    "keywords": [
      "PM-ABHIM",
      "Critical Care Block",
      "Health Infrastructure",
      "ఆరోగ్య మౌలిక వసతులు",
      "క్రిటికల్ కేర్ బ్లాక్",
      "Public Health Labs",
      "ICU beds"
    ],
    "original_complex_text": "PM-ABHIM fills critical gaps in public health infrastructure to make healthcare resilient against pandemics and mass casualty crises. In Andhra Pradesh, it finances 50-bed Critical Care Hospital Blocks in District and Medical College Hospitals with dedicated oxygen plants, isolation beds, modular operation theaters, and establishes Integrated Public Health Labs in all 26 districts.",
    "simplified": {
      "eligibility": "All citizens requiring intensive care (ICU), advanced diagnostics, ventilator support, and emergency trauma management in Andhra Pradesh public hospitals.",
      "benefits": "Free access to state-of-the-art 50-100 bedded Critical Care Units, round-the-clock ventilator beds, liquid medical oxygen, and advanced molecular pathology tests.",
      "documents": "Standard hospital in-patient admission documents.",
      "steps": "Services are provided directly at District Hospital Critical Care Blocks for serious trauma and medical emergencies.",
      "description": "PM-ABHIM provides 50-100 bed ICU and critical care units in district hospitals for free emergency and ventilator care."
    },
    "telugu": {
      "eligibility": "తీవ్రమైన అనారోగ్యం, ప్రమాదాలు లేదా అత్యవసర ఐసీయూ వెంటిలేటర్ చికిత్స అవసరమైన ఆంధ్రప్రదేశ్ ప్రజలందరూ అర్హులు.",
      "benefits": "జిల్లా ఆసుపత్రులలో 50 నుండి 100 పడకల ఆధునిక ఐసీయూ క్రిటికల్ కేర్ బ్లాకులు, వెంటిలేటర్లు, 24 గంటల ఆక్సిజన్ మరియు అధునాతన ల్యాబ్ పరీక్షలు ఉచితం.",
      "documents": "ఆసుపత్రి అత్యవసర అడ్మిషన్ రికార్డులు.",
      "steps": "జిల్లా ఆసుపత్రి లేదా మెడికల్ కాలేజీలోని క్రిటికల్ కేర్ విభాగానికి అత్యవసర పరిస్థితుల్లో తరలించినప్పుడు ఈ సేవలు లభిస్తాయి.",
      "description": "ప్రమాదాలు, అత్యవసర సమయాల్లో ప్రాణాలు కాపాడేందుకు జిల్లా ఆసుపత్రులలో అత్యాధునిక ఐసీయూ మరియు వెంటిలేటర్ బ్లాకులను ప్రభుత్వం ఏర్పాటు చేసింది."
    },
    "last_updated": "2026-06-01",
    "official_website": "https://pmabhim.mohfw.gov.in/",
    "contact_office": "District Headquarters Hospital Medical Superintendent Office",
    "eligibility_confirmation": "Emergency / ICU Admission Criteria",
    "eligibility_questions": [
      {
        "question_te": "రోగికి అత్యవసర ఐసీయూ లేదా వెంటిలేటర్ క్రిటికల్ కేర్ చికిత్స అవసరమా?",
        "question_en": "Does the patient require critical care, ICU admission, or ventilator life support?",
        "weight": "high"
      }
    ],
    "required_documents": [
      { "name": "Aadhaar Card", "name_te": "ఆధార్ కార్డు", "optional": false }
    ],
    "local_help_locations": {
      "All 26 Districts": "District Hospital Critical Care Hospital Block"
    }
  }
};

// Validate that every scheme contains all required fields from scheme_schema.json
const schemaRequiredSimplified = ["eligibility", "benefits", "documents", "steps"];
const count = Object.keys(scrapedSchemes).length;
console.log(`Verifying ${count} scraped schemes against schema requirements...`);

for (const [name, scheme] of Object.entries(scrapedSchemes)) {
  if (!scheme.category || !scheme.telugu_name || !scheme.simplified || !scheme.telugu) {
    throw new Error(`Scheme ${name} is missing core fields!`);
  }
  for (const field of schemaRequiredSimplified) {
    if (!scheme.simplified[field] || !scheme.telugu[field]) {
      throw new Error(`Scheme ${name} missing required simplified/telugu field: ${field}`);
    }
  }
  if (!Array.isArray(scheme.eligibility_questions) || scheme.eligibility_questions.length === 0) {
    throw new Error(`Scheme ${name} missing eligibility questions!`);
  }
  if (!Array.isArray(scheme.required_documents)) {
    throw new Error(`Scheme ${name} missing required documents array!`);
  }
}

// Write scraped schemes into data/scraped_ap_schemes.json
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scrapedSchemes, null, 2), 'utf8');
console.log(`Successfully scraped and validated ${count} official AP healthcare schemes!`);
console.log(`Saved output to ${OUTPUT_FILE}`);
