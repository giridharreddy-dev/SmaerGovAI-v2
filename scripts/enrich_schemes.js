// Script to enrich all schemes with deep structured details
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

const schemeEnrichments = {
  // --- health.json ---
  "Dr. NTR Vaidya Seva (AP Cashless Hospital Care)": {
    coverage_type: "Cashless Hospitalization & Surgical Care",
    coverage_type_te: "నగదు రహిత ఆసుపత్రి & శస్త్రచికిత్స సేవలు",
    benefit_amount: "Up to ₹25,00,000 per family per year",
    benefit_amount_te: "ఏటా కుటుంబానికి ₹25,00,000 వరకు ఉచిత చికిత్స",
    target_beneficiary: "BPL / Rice Card Holder Families in Andhra Pradesh",
    target_beneficiary_te: "ఆంధ్రప్రదేశ్‌లోని బీపీఎల్ మరియు బియ్యం కార్డు లబ్ధిదారుల కుటుంబాలు",
    application_mode: "Aarogyamithra Desk at Network Hospital on Admission",
    application_mode_te: "ఆసుపత్రిలోని ఆరోగ్యమిత్ర హెల్ప్ డెస్క్ వద్ద నేరుగా నమోదు",
    processing_time: "Instant pre-authorization & cashless admission",
    processing_time_te: "ఆసుపత్రిలో చేరిన వెంటనే తక్షణ ప్రీ-ఆథరైజేషన్",
    facility_type: "Empanelled Public & Private Super-Specialty Network Hospitals",
    facility_type_te: "గుర్తింపు పొందిన ప్రభుత్వ & ప్రైవేట్ సూపర్ స్పెషాలిటీ నెట్‌వర్క్ ఆసుపత్రులు",
    validity_period: "Continuous coverage linked with active Rice/Aadhaar card",
    validity_period_te: "బియ్యం/ఆధార్ కార్డు ఆధారంగా నిరంతర వార్షిక రక్షణ",
    helpline_numbers: ["104 (Health Advice & Grievance)", "1902 (AP CM Public Grievance Helpline)", "1800-425-7778 (Trust Helpline)"],
    key_treatments: [
      "Open Heart Surgery & Coronary Angioplasty / Stents",
      "Medical, Surgical & Radiation Oncology (Cancer Care)",
      "Polytrauma, Brain & Spine Neuro-Surgeries",
      "Kidney & Liver Transplants and Post-Op Immunosuppressants",
      "Joint Replacements (Knee & Hip)",
      "Neonatal Intensive Care (NICU) & Paediatric Surgeries"
    ],
    key_treatments_te: [
      "గుండె శస్త్రచికిత్సలు, బైపాస్ & స్టెంట్ అమరిక",
      "క్యాన్సర్ కీమోథెరపీ, రేడియేషన్ & సర్జరీ",
      "తీవ్ర గాయాలు, మెదడు & వెన్నెముక న్యూరో సర్జరీలు",
      "మూత్రపిండాలు & కాలేయ మార్పిడి చికిత్సలు",
      "కీళ్ల మార్పిడి (మోకాలు & తుంటి ఆపరేషన్లు)",
      "నవజాత శిశు సంరక్షణ (NICU) & పీడియాట్రిక్ సర్జరీలు"
    ],
    exclusions: "Purely cosmetic procedures without trauma, non-prescribed outpatient checkups, un-empanelled non-network clinics.",
    exclusions_te: "వైద్యేతర సౌందర్య శస్త్రచికిత్సలు, అనవసరమైన అవుట్‌పేషెంట్ పరీక్షలు, గుర్తించబడని ప్రైవేట్ క్లినిక్‌లు వర్తించవు."
  },
  "AP 108 Emergency Ambulance Service": {
    coverage_type: "24x7 Free Emergency Medical Response & Advanced Life Support",
    coverage_type_te: "24x7 ఉచిత అత్యవసర అంబులెన్స్ & లైఫ్ సపోర్ట్ సేవలు",
    benefit_amount: "100% Free Toll-Free Emergency Dispatch & Pre-Hospital Care",
    benefit_amount_te: "100% ఉచిత అత్యవసర తరలింపు & ప్రథమ చికిత్స",
    target_beneficiary: "All Citizens & Road Accident / Medical Emergency Victims in AP",
    target_beneficiary_te: "అత్యవసర వైద్య పరిస్థితి లేదా రోడ్డు ప్రమాదంలో ఉన్న ఆంధ్రప్రదేశ్ పౌరులందరూ",
    application_mode: "Dial 108 (Toll-Free 24x7 Dispatch)",
    application_mode_te: "108 టోల్-ఫ్రీ నంబర్‌కు నేరుగా కాల్ చేయడం ద్వారా",
    processing_time: "Immediate dispatch; average response time 15-20 minutes",
    processing_time_te: "కాల్ చేసిన వెంటనే బయలుదేరుతుంది; 15-20 నిమిషాల్లో చేరుకుంటుంది",
    facility_type: "GPS-Tracked Advanced Life Support (ALS) & Basic Life Support (BLS) Ambulances",
    facility_type_te: "జీపీఎస్ ట్రాకింగ్ కలిగిన అడ్వాన్స్‌డ్ & బేసిక్ లైఫ్ సపోర్ట్ అంబులెన్స్‌లు",
    validity_period: "Immediate transit from incident site to nearest receiving hospital",
    validity_period_te: "ప్రమాదం జరిగిన స్థలం నుండి సమీప ఆసుపత్రికి చేరేవరకు",
    helpline_numbers: ["108 (Emergency Dispatch 24x7)", "112 (National Unified Emergency)"],
    key_treatments: [
      "Road Traffic Accidents & Major Trauma Triage",
      "Acute Myocardial Infarction (Heart Attack) & ECG Transmission",
      "Acute Stroke & Golden Hour Resuscitation",
      "Labour & Pregnancy Complications Emergency Delivery",
      "Snake Bite, Poisoning & Asphyxiation Pre-Hospital Care"
    ],
    key_treatments_te: [
      "రోడ్డు ప్రమాదాల అత్యవసర స్పందన & ప్రథమ చికిత్స",
      "గుండెపోటు లక్షణాల్లో ఆక్సిజన్ & తక్షణ ఈసీజీ పర్యవేక్షణ",
      "పక్షవాతం (స్ట్రోక్) గోల్డెన్ అవర్ అత్యవసర రవాణా",
      "గర్భిణీ స్త్రీల ప్రసవ నొప్పులు & అత్యవసర కాన్పు సేవలు",
      "పాముకాటు, విషప్రభావం & శ్వాస సంబంధిత అత్యవసర చికిత్స"
    ],
    exclusions: "Non-emergency routine patient transfers (use 104 or local patient transport).",
    exclusions_te: "సాధారణ రోగుల సాధారణ ప్రయాణాలకు వర్తించదు (అత్యవసర కేసులకు మాత్రమే)."
  },
  "AP 104 Mobile Medical Units": {
    coverage_type: "Fixed-Day Mobile Primary Healthcare & Free Diagnostics in Villages",
    coverage_type_te: "గ్రామాల్లో నిర్ణీత తేదీలలో ఉచిత ప్రాథమిక వైద్యం & పరీక్షలు",
    benefit_amount: "100% Free Consultation, Diagnostic Tests & Generic Medicines",
    benefit_amount_te: "100% ఉచిత వైద్య పరీక్షలు, రక్త పరీక్షలు మరియు మందులు",
    target_beneficiary: "Rural, Tribal & Remote Village Residents in Andhra Pradesh",
    target_beneficiary_te: "ఆంధ్రప్రదేశ్‌లోని గ్రామీణ, గిరిజన & మారుమూల ప్రాంతాల ప్రజలు",
    application_mode: "Walk-in at monthly scheduled 104 village campsite",
    application_mode_te: "గ్రామంలో 104 వాహనం వచ్చే నిర్ణీత రోజున నేరుగా హాజరుకావడం",
    processing_time: "Same-day on-site consultation and medicine dispensing",
    processing_time_te: "అదే రోజున ఉచిత వైద్య పరీక్షలు & మందుల పంపిణీ",
    facility_type: "Customized Mobile Medical Vans with Medical Officers & Lab Techs",
    facility_type_te: "డాక్టర్, ల్యాబ్ టెక్నీషియన్ మరియు మందులతో కూడిన సంచార వైద్య వాహనాలు",
    validity_period: "Recurring monthly village visits",
    validity_period_te: "ప్రతినెల నిర్ణీత షెడ్యూల్ ప్రకారం నిరంతరం",
    helpline_numbers: ["104 (Health Advice Helpline)", "1902 (Citizen Helpline)"],
    key_treatments: [
      "Chronic Disease Management (Hypertension & Diabetes Mellitus Screening)",
      "Antenatal & Postnatal Care (ANC/PNC) for Rural Mothers",
      "Free 20+ Point-of-Care Diagnostic Lab Tests (Blood Glucose, Haemoglobin)",
      "Free 30-day Supply of Essential Chronic Medicines",
      "Referral linkage to PHC/CHC/NTR Vaidya Seva Hospitals"
    ],
    key_treatments_te: [
      "రక్తపోటు (బీపీ) మరియు మధుమేహం (షుగర్) వ్యాధుల నియంత్రణ",
      "గర్భిణీ స్త్రీలు మరియు బాలింతల సాధారణ ఆరోగ్య పరీక్షలు",
      "రక్తహీనత, రక్తంలో చక్కెర శాతం తదితర 20+ ఉచిత పరీక్షలు",
      "దీర్ఘకాలిక వ్యాధులకు ఉచితంగా నెలవారీ మందుల అందజేత",
      "అవసరమైన రోగులను పెద్దాసుపత్రులకు రిఫర్ చేసే విధానం"
    ],
    exclusions: "Major inpatient surgeries and overnight hospitalizations (referred to CHC/District Hospital).",
    exclusions_te: "పెద్ద ఆపరేషన్లు మరియు ఇన్‌పేషెంట్ అడ్మిషన్లు (సీహెచ్‌సీ లేదా జిల్లా ఆసుపత్రులకు రిఫర్ చేస్తారు)."
  },
  "Ayushman Bharat PM-JAY (National Health Cover)": {
    coverage_type: "National Cashless Health Assurance Scheme",
    coverage_type_te: "జాతీయ స్థాయి నగదు రహిత ఆరోగ్య రక్షణ పథకం",
    benefit_amount: "Up to ₹5,00,000 per family per year on floater basis",
    benefit_amount_te: "ఏటా కుటుంబానికి ₹5,00,000 వరకు ఉచిత చికిత్స రక్షణ",
    target_beneficiary: "Deprived Rural & Identified Occupational Urban Families (SECC 2011 / Ayushman Card Holders)",
    target_beneficiary_te: "SECC జాబితాలోని అర్హులైన గ్రామీణ మరియు పట్టణ పేద కుటుంబాలు",
    application_mode: "Ayushman Mitra desk at empanelled hospital / CSC Centre / PMJAY Portal",
    application_mode_te: "ఆసుపత్రిలోని ఆయుష్మాన్ మిత్ర డెస్క్ లేదా CSC కేంద్రంలో ఆయుష్మాన్ కార్డు ద్వారా",
    processing_time: "Instant pre-authorization using PMJAY BIS Portal",
    processing_time_te: "ఆయుష్మాన్ కార్డు లేదా ఆధార్ ద్వారా తక్షణ అనుమతి",
    facility_type: "Empanelled Public and Private Hospitals across India (National Portability)",
    facility_type_te: "భారతదేశం అంతటా విస్తరించిన ప్రభుత్వ మరియు ప్రైవేట్ నెట్‌వర్క్ ఆసుపత్రులు",
    validity_period: "Annual floater entitlement for the entire family",
    validity_period_te: "కుటుంబం మొత్తానికి వార్షిక ప్రాతిపదికన వర్తింపు",
    helpline_numbers: ["14555 (National PM-JAY Helpline)", "1800-111-565 (Toll-Free)"],
    key_treatments: [
      "Cardiology & Cardio-thoracic Surgeries",
      "Oncology (Medical, Surgical & Radiation)",
      "Orthopaedics & Complex Trauma Surgeries",
      "Urology & Nephrology Procedures",
      "Paediatric Intensive Care & Neonatal Surgeries",
      "Pre-hospitalization (3 days) & Post-hospitalization (15 days) medicine expenses"
    ],
    key_treatments_te: [
      "గుండె జబ్బుల ఆపరేషన్లు మరియు స్టెంట్లు",
      "క్యాన్సర్ చికిత్సలు మరియు శస్త్రచికిత్సలు",
      "ఎముకలు, కీళ్ల శస్త్రచికిత్సలు మరియు ట్రామా కేర్",
      "యూరాలజీ మరియు కిడ్నీ సంబంధిత ప్రక్రియలు",
      "పీడియాట్రిక్ సర్జరీలు మరియు నవజాత శిశు చికిత్స",
      "చేరడానికి 3 రోజుల ముందు మరియు డిశ్చార్జ్ తర్వాత 15 రోజుల మందుల ఖర్చులు"
    ],
    exclusions: "OPD consultation only, cosmetic procedures, non-empanelled hospitals without emergency portability.",
    exclusions_te: "ఓపీడీ వైద్యం మాత్రమే, కాస్మెటిక్ శస్త్రచికిత్సలు మరియు ఎంప్యానెల్ చేయని ఆసుపత్రులు వర్తించవు."
  },
  "Ayushman Arogya Mandir (Free Primary Health Care)": {
    coverage_type: "Comprehensive Primary Health Care (CPHC) & Wellness Services",
    coverage_type_te: "సమగ్ర ప్రాథమిక ఆరోగ్య సంరక్షణ & వెల్‌నెస్ సేవలు",
    benefit_amount: "100% Free Essential Drugs, Diagnostics & Preventive Care",
    benefit_amount_te: "100% ఉచిత అవసరమైన మందులు, ల్యాబ్ పరీక్షలు మరియు వెల్‌నెస్ సేవలు",
    target_beneficiary: "All Citizens residing in the local village or urban ward catchment area",
    target_beneficiary_te: "స్థానిక గ్రామ మరియు పట్టణ వార్డుల పరిధిలోని పౌరులందరూ",
    application_mode: "Walk-in at local Ayushman Arogya Mandir / Village Clinic",
    application_mode_te: "సమీప ఆయుష్మాన్ ఆరోగ్య మందిర్ / విలేజ్ క్లినిక్ వద్ద నేరుగా సంప్రదించడం",
    processing_time: "Immediate on-site care and tele-consultation linking",
    processing_time_te: "వెంటనే వైద్య పరీక్షలు మరియు అవసరమైతే టెలి-కన్సల్టేషన్",
    facility_type: "Upgraded Sub-Health Centres, PHCs and Urban PHCs with Community Health Officers (CHOs)",
    facility_type_te: "కమ్యూనిటీ హెల్త్ ఆఫీసర్లు (CHO) కలిగిన సబ్-సెంటర్లు, పీహెచ్‌సీలు",
    validity_period: "Continuous lifelong primary care access",
    validity_period_te: "నిరంతర సమగ్ర ప్రాథమిక ఆరోగ్య సేవలు",
    helpline_numbers: ["104 (Health Information)", "1075 (National Health Portal)"],
    key_treatments: [
      "Care in Pregnancy and Child-birth",
      "Neonatal and Infant Health Care Services",
      "Childhood and Adolescent Health Care",
      "Universal Immunization & Growth Monitoring",
      "Management of Communicable Diseases (TB, Malaria, Dengue)",
      "Screening and Basic Management of NCDs (Hypertension, Diabetes, 3 common cancers)",
      "Yoga and Wellness Sessions"
    ],
    key_treatments_te: [
      "గర్భధారణ మరియు ప్రసవ సంబంధిత ప్రాథమిక సంరక్షణ",
      "నవజాత శిశు మరియు పసిపిల్లల ఆరోగ్య పరీక్షలు",
      "సార్వత్రిక టీకాలు మరియు పోషకాహార పర్యవేక్షణ",
      "టీబీ, మలేరియా, డెంగ్యూ వ్యాధుల నిర్ధారణ & చికిత్స",
      "బీపీ, షుగర్ మరియు క్యాన్సర్ స్క్రీనింగ్ పరీక్షలు",
      "యోగా మరియు సంపూర్ణ ఆరోగ్య అవగాహన సదస్సులు"
    ],
    exclusions: "Major surgeries requiring operation theatres (referred to CHC/District Hospital).",
    exclusions_te: "ఆపరేషన్ థియేటర్ అవసరమైన పెద్ద శస్త్రచికిత్సలు (సీహెచ్‌సీ లేదా జిల్లా ఆసుపత్రులకు రిఫర్ చేస్తారు)."
  },
  "eSanjeevani National Telemedicine Service": {
    coverage_type: "Free Doctor-to-Patient & Doctor-to-Doctor Tele-Consultations",
    coverage_type_te: "ఉచిత డాక్టర్-టు-పేషెంట్ & స్పెషలిస్ట్ టెలి-కన్సల్టేషన్",
    benefit_amount: "100% Free Video Consultation & Digital e-Prescriptions",
    benefit_amount_te: "100% ఉచిత వీడియో కన్సల్టేషన్ & డిజిటల్ ప్రిస్క్రిప్షన్",
    target_beneficiary: "All Citizens across India with smartphone/computer or at Ayushman Arogya Mandir",
    target_beneficiary_te: "స్మార్ట్‌ఫోన్ కలిగిన పౌరులందరూ లేదా సమీప హెల్త్ అండ్ వెల్‌నెస్ సెంటర్‌లో",
    application_mode: "eSanjeevani App (Android/iOS) or esanjeevani.mohfw.gov.in portal",
    application_mode_te: "eSanjeevani యాప్ లేదా esanjeevani.mohfw.gov.in వెబ్‌సైట్ ద్వారా",
    processing_time: "Queue-based video consultation within 5-15 minutes",
    processing_time_te: "లైవ్‌లో 5-15 నిమిషాల్లో స్పెషలిస్ట్ డాక్టర్‌తో వీడియో కాల్",
    facility_type: "National Tele-Consultation Hubs & State Medical Colleges",
    facility_type_te: "ప్రభుత్వ మెడికల్ కాలేజీలు మరియు జాతీయ టెలి-కన్సల్టేషన్ హబ్‌లు",
    validity_period: "Per consultation session with downloadable PDF prescription",
    validity_period_te: "ప్రతి సంప్రదింపు సెషన్‌కు వర్తిస్తుంది (పీడీఎఫ్ ప్రిస్క్రిప్షన్ లభిస్తుంది)",
    helpline_numbers: ["104 (State Telehealth Helpline)", "011-23978046 (Technical Support)"],
    key_treatments: [
      "General Outpatient Consultation (Fever, Cough, Infection, Skin issues)",
      "Specialist Consultations (Cardiology, Gynaecology, Paediatrics, Dermatology, Psychiatry)",
      "Follow-up for Chronic Diseases (Hypertension, Diabetes, Thyroid)",
      "Review of Lab Investigation Reports and Digital Prescription Generation",
      "AYUSH (Ayurveda, Yoga, Unani, Siddha, Homeopathy) Tele-consultations"
    ],
    key_treatments_te: [
      "సాధారణ జ్వరం, దగ్గు, చర్మ సంబంధిత వ్యాధులకు వైద్య సలహా",
      "గైనకాలజీ, పీడియాట్రిక్స్, కార్డియాలజీ స్పెషలిస్ట్ కన్సల్టేషన్",
      "బీపీ, షుగర్, థైరాయిడ్ వ్యాధుల రెగ్యులర్ రివ్యూ",
      "రక్త పరీక్షల రిపోర్టులను సమీక్షించి డిజిటల్ ప్రిస్క్రిప్షన్ జారీ",
      "ఆయుష్ (ఆయుర్వేద, హోమియోపతి) నిపుణుల సలహాలు"
    ],
    exclusions: "Critical acute emergencies requiring immediate physical intervention (call 108).",
    exclusions_te: "తక్షణ అత్యవసర శస్త్రచికిత్సలు లేదా తీవ్ర గాయాలు (108 కి కాల్ చేయాలి)."
  },
  "Janani Shishu Suraksha Karyakram (Free Delivery Care)": {
    coverage_type: "Zero-Expense Cashless Institutional Delivery & Infant Care",
    coverage_type_te: "ప్రభుత్వ ఆసుపత్రుల్లో 100% ఉచిత ప్రసవం & శిశు సంరక్షణ",
    benefit_amount: "100% Free C-Section/Normal Delivery, Free Food, Drugs, Blood & Drop-back Transport",
    benefit_amount_te: "100% ఉచిత కాన్పు, సిజేరియన్, ఉచిత మందులు, భోజనం మరియు ఉచిత వాహన రవాణా",
    target_beneficiary: "All Pregnant Women delivering in public health institutions and Sick Infants up to 1 year",
    target_beneficiary_te: "ప్రభుత్వ ఆసుపత్రుల్లో ప్రసవించే గర్భిణులు మరియు 1 సంవత్సరం లోపు అనారోగ్య శిశువులు",
    application_mode: "Automatic on admission at any Government PHC, CHC, Area Hospital or Teaching Hospital",
    application_mode_te: "ప్రభుత్వ ఆసుపత్రిలో అడ్మిట్ అయిన వెంటనే స్వయంచాలకంగా వర్తింపు",
    processing_time: "Immediate on arrival at labour room",
    processing_time_te: "ఆసుపత్రికి చేరిన వెంటనే ఉచిత సేవలు ప్రారంభం",
    facility_type: "All Government Health Facilities (PHC, CHC, District Hospital, Medical College)",
    facility_type_te: "అన్ని ప్రభుత్వ ప్రాథమిక, సామాజిక మరియు జిల్లా ఆసుపత్రులు",
    validity_period: "Antenatal period, delivery, 48-hour postpartum stay, and sick infants up to 1 year",
    validity_period_te: "డెలివరీ సమయం, 48 గంటల ఆసుపత్రి బస మరియు 1 సంవత్సరం వరకు శిశువుకు",
    helpline_numbers: ["102 (Janani Express / Drop-back Ambulance)", "104 (Health Advice)", "108 (Emergency)"],
    key_treatments: [
      "Completely Free Normal Delivery & Caesarean Section (C-Section)",
      "Free Essential Obstetric & Neonatal Medications",
      "Free Diagnostics (USG Scans, Blood & Urine Investigations)",
      "Free Blood Transfusions during delivery complications",
      "Free Nutritional Diet during hospital stay (up to 3 days for normal, 7 days for C-section)",
      "Free Transport from home to facility and drop-back to home (102 vehicle)"
    ],
    key_treatments_te: [
      "పూర్తిగా ఉచిత సాధారణ ప్రసవం మరియు సిజేరియన్ ఆపరేషన్",
      "ఉచిత అత్యవసర మందులు మరియు ఇంజెక్షన్లు",
      "ఉచిత స్కానింగ్ (USG) మరియు రక్త పరీక్షలు",
      "డెలివరీ సమయంలో అవసరమైతే ఉచిత రక్త మార్పిడి",
      "ఆసుపత్రి బస సమయంలో ఉచిత పౌష్టికాహారం",
      "ఇంటి నుండి ఆసుపత్రికి మరియు తిరిగి ఇంటికి ఉచిత 102 వాహన సదుపాయం"
    ],
    exclusions: "Deliveries in un-empanelled private nursing homes without government referral.",
    exclusions_te: "ప్రభుత్వ రిఫరల్ లేని ప్రైవేట్ నర్సింగ్ హోమ్‌లలో ప్రసవాలు వర్తించవు."
  },
  "Janani Suraksha Yojana (Safe Motherhood Cash Support)": {
    coverage_type: "Direct Benefit Transfer (DBT) Cash Incentive for Institutional Delivery",
    coverage_type_te: "ప్రభుత్వ ఆసుపత్రి ప్రసవాలకు డైరెక్ట్ బ్యాంక్ బదిలీ నగదు ప్రోత్సాహకం",
    benefit_amount: "₹1,000 to ₹1,400 Cash Incentive credited directly to bank account",
    benefit_amount_te: "తల్లి బ్యాంక్ ఖాతాలో నేరుగా ₹1,000 నుండి ₹1,400 వరకు నగదు జమ",
    target_beneficiary: "BPL / SC / ST Pregnant Mothers delivering in Government Health Facilities",
    target_beneficiary_te: "ప్రభుత్వ ఆసుపత్రులలో కాన్పు చేయించుకున్న బీపీఎల్, ఎస్సీ, ఎస్టీ గర్భిణీ తల్లులు",
    application_mode: "Registration through Village ANM / ASHA Worker on Mother & Child Tracking System (MCTS/RCH)",
    application_mode_te: "గ్రామ ఏఎన్ఎం / ఆశా కార్యకర్త ద్వారా ఆర్సీహెచ్ పోర్టల్‌లో నమోదు",
    processing_time: "Credited within 7 to 15 days of post-delivery verification",
    processing_time_te: "ప్రసవానంతరం 7 నుండి 15 రోజుల్లో నేరుగా బ్యాంక్ ఖాతాలో జమ",
    facility_type: "Government Health Institutions & Accredited Private Facilities",
    facility_type_te: "ప్రభుత్వ ఆరోగ్య కేంద్రాలు మరియు గుర్తింపు పొందిన ఆసుపత్రులు",
    validity_period: "Valid for institutional deliveries as per state eligibility norms",
    validity_period_te: "ఆసుపత్రి ప్రసవం జరిగిన వెంటనే లబ్ధి వర్తిస్తుంది",
    helpline_numbers: ["104 (Maternal Health Helpline)", "1800-180-1104 (JSY Helpline)"],
    key_treatments: [
      "Cash Assistance for institutional delivery expenses",
      "Incentive for Village ASHA Worker for escorting mother to health facility",
      "Linkage with post-delivery immunization and nutrition counselling"
    ],
    key_treatments_te: [
      "ఆసుపత్రి ప్రసవ ఖర్చుల కోసం ప్రత్యక్ష నగదు ప్రోత్సాహకం",
      "గర్భిణిని ఆసుపత్రికి తీసుకువచ్చినందుకు ఆశా కార్యకర్తకు ప్రోత్సాహకం",
      "ప్రసవానంతర శిశు టీకాలు మరియు పోషకాహార సలహాలు"
    ],
    exclusions: "Deliveries occurring at home without certified institutional supervision.",
    exclusions_te: "ఆసుపత్రిలో కాకుండా ఇంట్లో జరిగే ప్రసవాలకు వర్తించదు."
  },
  "Mission Indradhanush / Universal Immunization": {
    coverage_type: "Universal Free Childhood & Maternal Vaccine Coverage",
    coverage_type_te: "సార్వత్రిక ఉచిత టీకా పంపిణీ కార్యక్రమం",
    benefit_amount: "100% Free Vaccination protecting against 12 Vaccine-Preventable Diseases",
    benefit_amount_te: "12 ప్రాణాంతక వ్యాధుల నుండి రక్షణ కల్పించే 100% ఉచిత టీకాలు",
    target_beneficiary: "All Infants and Children aged 0-5 years, and Pregnant Women",
    target_beneficiary_te: "0-5 సంవత్సరాల లోపు పిల్లలు మరియు గర్భిణీ స్త్రీలందరూ",
    application_mode: "Walk-in at Village Village Health Sanitation & Nutrition Day (VHSND), Anganwadi, or PHC",
    application_mode_te: "గ్రామ అంగన్‌వాడీ కేంద్రం, విలేజ్ క్లినిక్ లేదా పీహెచ్‌సీ వద్ద నేరుగా టీకా వేయించుకోవడం",
    processing_time: "Immediate administration with entries in MCP Card / U-WIN Portal",
    processing_time_te: "హాజరైన వెంటనే టీకా వేసి, ఎంసీపీ కార్డు / U-WIN లో నమోదు చేస్తారు",
    facility_type: "All Anganwadi Centres, Sub-Centres, PHCs, CHCs and Area Hospitals",
    facility_type_te: "అన్ని అంగన్‌వాడీ కేంద్రాలు, సబ్-సెంటర్లు మరియు ప్రభుత్వ ఆసుపత్రులు",
    validity_period: "From birth up to 16 years of age as per National Immunization Schedule",
    validity_period_te: "పుట్టినప్పటి నుండి 16 సంవత్సరాల వయస్సు వరకు నిర్దేశిత షెడ్యూల్ ప్రకారం",
    helpline_numbers: ["104 (Health Advice)", "1075 (National Health Portal)"],
    key_treatments: [
      "BCG (Tuberculosis) at birth",
      "Hepatitis B birth dose & Pentavalent (DPT, Hep B, Hib)",
      "Oral Polio Vaccine (OPV) & Inactivated Polio Vaccine (fIPV)",
      "Rotavirus Vaccine (Severe Diarrhoea Prevention)",
      "Pneumococcal Conjugate Vaccine (PCV for Pneumonia & Meningitis)",
      "Measles-Rubella (MR) & Vitamin A Supplementation",
      "Tetanus & Diphtheria (Td) for Pregnant Women and Adolescents"
    ],
    key_treatments_te: [
      "బీసీజీ (క్షయ వ్యాధి నిరోధక టీకా)",
      "హెపటైటిస్ బి మరియు పెంటావాలెంట్ టీకా",
      "పోలియో చుక్కలు (OPV) మరియు పోలియో ఇంజెక్షన్ (fIPV)",
      "రోటావైరస్ (తీవ్ర విరేచనాల నివారణ టీకా)",
      "న్యుమోనియా నివారణ టీకా (PCV)",
      "తట్టు-రుబెల్లా (MR) టీకా మరియు విటమిన్-ఎ ద్రావణం",
      "గర్భిణులకు ధనుర్వాతం నివారణ టీకా (Td)"
    ],
    exclusions: "Non-mandatory optional travel vaccines (e.g., Yellow fever) not on standard national schedule.",
    exclusions_te: "జాతీయ షెడ్యూల్‌లో లేని ప్రత్యేక అంతర్జాతీయ ప్రయాణ వ్యాక్సిన్లు వర్తించవు."
  },
  "Rashtriya Bal Swasthya Karyakram (Child Health Screening)": {
    coverage_type: "Free Universal Child Health Screening & Early Intervention Treatment",
    coverage_type_te: "పిల్లల ఉచిత ఆరోగ్య పరీక్షలు & ముందస్తు చికిత్స పథకం",
    benefit_amount: "100% Free Screening for 4Ds (Defects, Diseases, Deficiencies, Delays) & Free Surgeries",
    benefit_amount_te: "4D లోపాలకు (పుట్టుక లోపాలు, వ్యాధులు, లోపాలు, ఎదుగుదల లోపాలు) 100% ఉచిత చికిత్స",
    target_beneficiary: "All Children from birth up to 18 years enrolled in Anganwadis and Government/Aided Schools",
    target_beneficiary_te: "అంగన్‌వాడీలు, ప్రభుత్వ మరియు ఎయిడెడ్ పాఠశాలల్లోని 0 నుండి 18 సంవత్సరాల పిల్లలందరూ",
    application_mode: "Dedicated Mobile Health Teams visiting Schools/Anganwadis & District Early Intervention Centres (DEIC)",
    application_mode_te: "పాఠశాలలు/అంగన్‌వాడీలను సందర్శించే మొబైల్ హెల్త్ టీంల ద్వారా లేదా జిల్లా DEIC కేంద్రంలో",
    processing_time: "Screened at school; tertiary surgery scheduled within 1-4 weeks",
    processing_time_te: "పాఠశాలలో స్క్రీనింగ్ అనంతరం అవసరమైన సర్జరీలను 1-4 వారాల్లో నిర్వహిస్తారు",
    facility_type: "District Early Intervention Centres (DEIC) & Empanelled Tertiary Pediatric Hospitals",
    facility_type_te: "జిల్లా ఎర్లీ ఇంటర్వెన్షన్ కేంద్రాలు (DEIC) & ప్రభుత్వ స్పెషాలిటీ ఆసుపత్రులు",
    validity_period: "Continuous annual school screening up to age 18",
    validity_period_te: "18 సంవత్సరాల వయస్సు వరకు వార్షిక పరీక్షల ద్వారా నిరంతరం",
    helpline_numbers: ["104 (Health Helpline)", "1800-425-7778 (DEIC Child Health Helpline)"],
    key_treatments: [
      "Congenital Heart Defects (Free Paediatric Cardiac Surgery)",
      "Neural Tube Defects, Cleft Lip & Cleft Palate Surgeries",
      "Club Foot (Ponseti treatment) & Congenital Cataract Removal",
      "Severe Acute Malnutrition (SAM) & Severe Anaemia Management",
      "Developmental Delays, Autism, Vision & Hearing Impairment Therapy at DEIC"
    ],
    key_treatments_te: [
      "పుట్టుకతో వచ్చే గుండె జబ్బులకు ఉచిత శస్త్రచికిత్సలు",
      "చీలిక పెదవి (Cleft Lip), అంగిలి లోపాలకు ఉచిత సర్జరీలు",
      "వంకర పాదాలు (Club Foot) మరియు పుట్టుకతో వచ్చే కంటి శుక్లాల చికిత్స",
      "తీవ్ర పోషకాహార లోపం (SAM) మరియు రక్తహీనత నివారణ",
      "నడవలేకపోవడం, వినికిడి లోపాలు, మాటలు రాని పిల్లలకు DEIC లో ప్రత్యేక థెరపీ"
    ],
    exclusions: "Routine non-prescription nutritional supplements outside RBSK protocol.",
    exclusions_te: "ఆర్బీఎస్కే నిబంధనలకు సంబంధం లేని సాధారణ టానిక్కులు వర్తించవు."
  },
  "Pradhan Mantri National Dialysis Programme": {
    coverage_type: "Free Hemodialysis & Peritoneal Dialysis for End-Stage Renal Disease (ESRD)",
    coverage_type_te: "కిడ్నీ వ్యాధిగ్రస్తులకు ఉచిత డయాలసిస్ సేవలు",
    benefit_amount: "100% Free Dialysis Sessions, Dialyzers, Heparin & EPO Injections",
    benefit_amount_te: "100% ఉచిత డయాలసిస్ సెషన్లు, మందులు మరియు ఇంజెక్షన్లు",
    target_beneficiary: "BPL & Poor Chronic Kidney Failure Patients requiring regular maintenance dialysis",
    target_beneficiary_te: "ఆంధ్రప్రదేశ్‌లోని దీర్ఘకాలిక మూత్రపిండ వైఫల్యం (CKD) ఉన్న పేద రోగులు",
    application_mode: "Registration at District Hospital / Area Hospital / CHC Dialysis Unit with Aarogyasri Card",
    application_mode_te: "ఆరోగ్యశ్రీ కార్డుతో సమీప జిల్లా / ఏరియా ఆసుపత్రి డయాలసిస్ కేంద్రంలో నమోదు",
    processing_time: "Scheduled slots 2-3 times per week as per nephrologist prescription",
    processing_time_te: "వైద్యుల సూచన మేరకు వారానికి 2-3 సార్లు నిర్ణీత సమయాల్లో",
    facility_type: "Public-Private Partnership (PPP) & Government Hospital Dialysis Centres",
    facility_type_te: "ప్రభుత్వ మరియు పీపీపీ డయాలసిస్ నెట్‌వర్క్ కేంద్రాలు",
    validity_period: "Lifelong maintenance therapy until kidney transplant",
    validity_period_te: "కిడ్నీ మార్పిడి జరిగే వరకు జీవితాంతం ఉచితంగా కొనసాగుతుంది",
    helpline_numbers: ["104 (Health Helpline)", "1800-425-7778 (Dialysis Care Desk)"],
    key_treatments: [
      "Hemodialysis (HD) sessions 2-3 times weekly",
      "Peritoneal Dialysis (PD) catheter support & training",
      "Free Erythropoietin (EPO) & Iron Injections for Anaemia",
      "Routine biochemical kidney profile and electrolyte monitoring",
      "Arteriovenous (AV) Fistula creation surgery"
    ],
    key_treatments_te: [
      "వారానికి 2 నుండి 3 సార్లు ఉచిత హెమోడయాలసిస్ సెషన్లు",
      "పెరిటోనియల్ డయాలసిస్ (PD) కిట్లు మరియు శిక్షణ",
      "రక్తహీనత నివారణకు ఉచిత ఎరిత్రోపాయిటిన్ (EPO) ఇంజెక్షన్లు",
      "సీరం క్రియాటినిన్, యూరియా తదితర క్రమబద్ధ రక్త పరీక్షలు",
      "డయాలసిస్ కొరకు ఏవీ ఫిస్టులా (AV Fistula) శస్త్రచికిత్స"
    ],
    exclusions: "Dialysis at luxury non-empanelled private clinics without Dr. NTR Vaidya Seva / PM-JAY authorization.",
    exclusions_te: "ప్రభుత్వ గుర్తింపు లేని ప్రైవేట్ కార్పొరేట్ కేంద్రాలలో అనుమతి లేని డయాలసిస్ వర్తించవు."
  },
  "Ni-kshay Poshan Yojana (TB Nutrition Support)": {
    coverage_type: "Direct Benefit Transfer (DBT) Monthly Cash Grant for TB Nutritional Support",
    coverage_type_te: "క్షయ (టీబీ) రోగులకు నెలవారీ పోషకాహార ఆర్థిక సహాయం (DBT)",
    benefit_amount: "₹500 to ₹1,000 per month credited directly to bank account throughout treatment",
    benefit_amount_te: "చికిత్స ముగిసేవరకు నెలకు ₹500 నుండి ₹1,000 నేరుగా బ్యాంక్ ఖాతాలో జమ",
    target_beneficiary: "All Notified Tuberculosis (TB) Patients undergoing treatment across India",
    target_beneficiary_te: "ని-క్షయ్ పోర్టల్‌లో నమోదైన క్షయ (టీబీ) వ్యాధిగ్రస్తులందరూ",
    application_mode: "Automatic enrollment on Ni-kshay Portal by Treating Doctor / Senior Treatment Supervisor (STS)",
    application_mode_te: "ప్రభుత్వ ఆసుపత్రి లేదా డాక్టర్ ద్వారా ని-క్షయ్ పోర్టల్‌లో ఆటోమేటిక్ నమోదు",
    processing_time: "Monthly installment transfer during active anti-TB drug regimen",
    processing_time_te: "నెలవారీ చికిత్స నివేదిక ఆధారంగా నేరుగా బ్యాంక్ ఖాతాలో జమ",
    facility_type: "Designated Microscopy Centres (DMC), PHCs, CHCs, TB Sanatoriums & District TB Centres",
    facility_type_te: "అన్ని ప్రభుత్వ ప్రాథమిక ఆరోగ్య కేంద్రాలు & జిల్లా క్షయ నివారణ కేంద్రాలు",
    validity_period: "Duration of anti-TB treatment (6 months to 24 months for MDR-TB)",
    validity_period_te: "చికిత్స పూర్తయ్యే వరకు (6 నెలల నుండి 24 నెలల వరకు)",
    helpline_numbers: ["1800-11-6666 (National TB Toll-Free Helpline)", "104 (Health Advice)"],
    key_treatments: [
      "100% Free Daily DOTS / Fixed-Dose Combination Anti-TB Medicines",
      "CBNAAT & TrueNat Molecular Drug Resistance Diagnostic Testing",
      "Monthly DBT Financial Grant for protein-rich nutritional food",
      "Free Chest X-rays, Sputum Microscopy & Regular Sputum Follow-up",
      "Treatment Support & Counseling by Ni-kshay Mitras"
    ],
    key_treatments_te: [
      "100% ఉచిత పూర్తి కోర్సు టీబీ మందులు (DOTS కిట్లు)",
      "ట్రూనాట్ (TrueNat) మరియు జీన్ ఎక్స్‌పర్ట్ అధునాతన ల్యాబ్ పరీక్షలు",
      "పౌష్టికాహారం కొరకు ప్రతి నెలా నేరుగా బ్యాంక్ ఖాతాలో ఆర్థిక సాయం",
      "ఉచిత ఛాతీ ఎక్స్-రే మరియు కఫం (స్పుటమ్) పరీక్షలు",
      "ని-క్షయ్ మిత్రల ద్వారా కౌన్సిలింగ్ మరియు పోషకాహార కిట్ల పంపిణీ"
    ],
    exclusions: "Non-notified private clinic patients whose bank details and Aadhaar are not linked on Ni-kshay portal.",
    exclusions_te: "ని-క్షయ్ పోర్టల్‌లో నమోదు చేయని లేదా ఆధార్ సీడింగ్ లేని ప్రైవేట్ క్లినిక్ రోగులకు డీబీటీ అందదు."
  },

  // --- extra_schemes.json ---
  "National Tobacco Control Programme (NTCP)": {
    coverage_type: "Free Tobacco Cessation Services & Behavioral Counseling",
    coverage_type_te: "ఉచిత పొగాకు వ్యసన విముక్తి కౌన్సిలింగ్ & చికిత్స",
    benefit_amount: "100% Free Nicotine Replacement Therapy & Tobacco Cessation Counseling",
    benefit_amount_te: "100% ఉచిత నికోటిన్ రీప్లేస్‌మెంట్ చికిత్స & కౌన్సిలింగ్",
    target_beneficiary: "Citizens seeking assistance to quit smoking, gutkha, khaini or tobacco products",
    target_beneficiary_te: "పొగాకు, సిగరెట్, గుట్కా వ్యసనం నుండి బయటపడాలనుకునే పౌరులందరూ",
    application_mode: "Toll-Free National Quitline (1800-11-2356) or District Tobacco Cessation Centre (TCC)",
    application_mode_te: "టోల్-ఫ్రీ నేషనల్ క్విట్‌లైన్ (1800-11-2356) లేదా జిల్లా ఆసుపత్రిలోని TCC కేంద్రం",
    processing_time: "Immediate counseling on call or walk-in",
    processing_time_te: "కాల్ చేసిన వెంటనే నిపుణుల సలహాలు ప్రారంభం",
    facility_type: "District Tobacco Cessation Centres (TCCs) & Dental Colleges",
    facility_type_te: "జిల్లా ఆసుపత్రులలోని టొబాకో సెసేషన్ కేంద్రాలు మరియు డెంటల్ కాలేజీలు",
    validity_period: "6 to 12 months guided behavioral recovery protocol",
    validity_period_te: "వ్యసనం తగ్గే వరకు నిరంతర ఫాలో-అప్",
    helpline_numbers: ["1800-11-2356 (National Tobacco Quitline)", "104 (Health Advice)"],
    key_treatments: [
      "One-on-one Behavioral Counseling and Relapse Prevention Therapy",
      "Free Nicotine Gums, Nicotine Patches (NRT) for heavy dependence",
      "Bupropion / Varenicline medical therapy under specialist supervision",
      "Oral precancerous screening (Leukoplakia, Oral Submucous Fibrosis)",
      "Quit Tobacco SMS and digital mobile support"
    ],
    key_treatments_te: [
      "వ్యక్తిగత కౌన్సిలింగ్ మరియు మానసిక స్థైర్యం పెంపొందించే థెరపీ",
      "ఉచిత నికోటిన్ గమ్స్ మరియు ప్యాచ్‌ల పంపిణీ",
      "నోటి క్యాన్సర్ ముందస్తు పరీక్షలు మరియు తెల్లటి మచ్చల నిర్ధారణ",
      "పొగాకు మానేయడానికి ఉచిత మొబైల్ మెసేజ్ సలహాలు"
    ],
    exclusions: "Non-FDA approved commercial alternative smoking devices (e-cigarettes / vapes are banned).",
    exclusions_te: "నిషేధించబడిన ఈ-సిగరెట్లు లేదా వాణిజ్య పరికరాలు అనుమతించబడవు."
  },
  "National Leprosy Eradication Programme (NLEP)": {
    coverage_type: "Free Multi-Drug Therapy (MDT) & Disability Prevention / Medical Rehabilitation",
    coverage_type_te: "కుష్టు వ్యాధి ఉచిత పూర్తి చికిత్స (MDT) & పునరావాసం",
    benefit_amount: "100% Free MDT Blister Packs, Reconstructive Surgeries & ₹8,000 RCS Incentive",
    benefit_amount_te: "100% ఉచిత ఎండీటీ మందులు, ఉచిత ఆపరేషన్లు మరియు ₹8,000 ప్రోత్సాహకం",
    target_beneficiary: "All individuals diagnosed with Paucibacillary (PB) or Multibacillary (MB) Leprosy",
    target_beneficiary_te: "కుష్టు వ్యాధి లక్షణాలు లేదా తెల్లటి స్పర్శలేని మచ్చలు ఉన్న బాధితులందరూ",
    application_mode: "Walk-in at Govt PHC, CHC, District Hospital or Doorstep Leprosy Case Detection Campaign (LCDC)",
    application_mode_te: "సమీప పీహెచ్‌సీ లేదా ఆశా కార్యకర్తల ఇంటింటి కుష్టు గుర్తింపు సర్వే ద్వారా",
    processing_time: "Same day diagnosis and first MDT dose administration",
    processing_time_te: "అదే రోజున ఉచిత వ్యాధి నిర్ధారణ మరియు మందుల కిట్ ప్రారంభం",
    facility_type: "All PHCs, CHCs, District Hospitals & Reconstructive Surgery Centres",
    facility_type_te: "అన్ని ప్రభుత్వ ప్రాథమిక ఆరోగ్య కేంద్రాలు & జిల్లా కుష్టు నివారణ విభాగాలు",
    validity_period: "6 months (for PB) to 12 months (for MB) complete curative course",
    validity_period_te: "పూర్తి కోర్సు ముగిసే వరకు (6 నెలల నుండి 12 నెలల వరకు)",
    helpline_numbers: ["104 (Health Helpline)", "1800-11-1075 (National Health Portal)"],
    key_treatments: [
      "100% Free WHO Multi-Drug Therapy (Rifampicin, Clofazimine, Dapsone) Blister Packs",
      "Free Reconstructive Surgery (RCS) for hand, foot and eye deformities with ₹8,000 cash incentive",
      "Free Microcellular Rubber (MCR) Footwear to prevent ulceration",
      "Self-care kits and physiotherapy guidance at PHC level",
      "Monthly disability pension linkage through Sachivalayam"
    ],
    key_treatments_te: [
      "100% ఉచిత WHO ఎండీటీ (MDT) మందుల బ్లిస్టర్ ప్యాక్‌లు",
      "అవయవ లోపాలు సరిచేయడానికి ఉచిత రికన్‌స్ట్రక్టివ్ సర్జరీ & ₹8,000 నగదు సాయం",
      "పుండ్లు పడకుండా కాపాడే ఉచిత ఎంసీఆర్ (MCR) పాదరక్షల అందజేత",
      "పుండ్ల సంరక్షణ కిట్లు మరియు ఫిజియోథెరపీ సేవలు",
      "సచివాలయం ద్వారా నెలకు ప్రత్యేక పింఛను సదుపాయం"
    ],
    exclusions: "Leprosy is completely curable; isolation sanatoriums are obsolete and discontinued.",
    exclusions_te: "కుష్టు వ్యాధి మందులతో పూర్తిగా నయమవుతుంది, రోగులను వేరుగా ఉంచాల్సిన అవసరం లేదు."
  },
  "National Vector Borne Disease Control Programme (NVBDCP)": {
    coverage_type: "Free Rapid Diagnostic Testing & Treatment for Mosquito-Borne Diseases",
    coverage_type_te: "దోమల ద్వారా వ్యాపించే వ్యాధులకు ఉచిత పరీక్షలు & చికిత్స",
    benefit_amount: "100% Free Rapid Test Kits (RDT), ACT Antimalarials & Indoor Residual Spraying",
    benefit_amount_te: "100% ఉచిత తక్షణ రక్త పరీక్షలు, ఉచిత మలేరియా/డెంగ్యూ మందులు",
    target_beneficiary: "All Citizens suffering from acute fever, chills, body ache, or suspected vector diseases in AP",
    target_beneficiary_te: "జ్వరం, చలి, ఒళ్ళు నొప్పులతో బాధపడుతున్న ఆంధ్రప్రదేశ్ పౌరులందరూ",
    application_mode: "Walk-in at Village Health Clinic / PHC / CHC or Village Fever Survey by ANM",
    application_mode_te: "గ్రామ సచివాలయ ఏఎన్ఎం జ్వర సర్వే లేదా పీహెచ్‌సీలో నేరుగా పరీక్ష",
    processing_time: "Rapid blood smear / RDT result within 15-30 minutes",
    processing_time_te: "15-30 నిమిషాల్లో రక్త పరీక్ష ఫలితం లభిస్తుంది",
    facility_type: "Village Health Clinics, PHCs, CHCs & District Sentinel Surveillance Labs",
    facility_type_te: "విలేజ్ క్లినిక్‌లు, పీహెచ్‌సీలు మరియు జిల్లా డయాగ్నస్టిక్ ల్యాబ్‌లు",
    validity_period: "Full acute illness recovery and continuous vector surveillance",
    validity_period_te: "వ్యాధి పూర్తిగా నయమయ్యే వరకు నిరంతర పర్యవేక్షణ",
    helpline_numbers: ["104 (Health Advice)", "108 (Severe Fever / Dengue Emergency Transit)"],
    key_treatments: [
      "Point-of-Care Bivalent RDT Testing for Malaria (P. falciparum and P. vivax)",
      "Complete Artemisinin Combination Therapy (ACT) & Primaquine regimens",
      "ELISA NS1 Antigen & IgM Serology Testing for Dengue and Chikungunya",
      "Platelet count monitoring & free platelet transfusion linkage in District Hospitals",
      "Distribution of Long Lasting Insecticidal Nets (LLIN) in tribal/high-risk endemic zones"
    ],
    key_treatments_te: [
      "మలేరియా నిర్ధారణకు 15 నిమిషాల్లో తక్షణ రక్త పరీక్ష",
      "ఉచిత ACT మరియు ప్రైమాక్విన్ మలేరియా పూర్తి కోర్సు మందులు",
      "డెంగ్యూ నిర్ధారణకు ఉచిత ఎలైసా (ELISA) మరియు ప్లేట్‌లెట్స్ పరీక్షలు",
      "తీవ్ర డెంగ్యూ బాధితులకు ప్రభుత్వ బ్లడ్ బ్యాంకుల ద్వారా ఉచిత ప్లేట్‌లెట్ మార్పిడి",
      "గిరిజన ప్రాంతాల్లో ఉచిత దోమతెరల (LLIN) పంపిణీ మరియు ఫాగింగ్"
    ],
    exclusions: "Non-accredited unvalidated private rapid dengue antibody card tests.",
    exclusions_te: "గుర్తింపు లేని ప్రైవేట్ ర్యాపిడ్ కార్డు పరీక్షలు అధికారికంగా పరిగణించబడవు."
  },
  "National Programme for Control of Blindness (NPCBVI)": {
    coverage_type: "Free Universal Eye Screening, Free Cataract Surgeries & Low Vision Aids",
    coverage_type_te: "అంధత్వ నివారణ ఉచిత కంటి శుక్లాల ఆపరేషన్లు & కంటి పరీక్షలు",
    benefit_amount: "100% Free SICS/Phaco Cataract Surgery with Intraocular Lens & Free Spectacles",
    benefit_amount_te: "100% ఉచిత కంటి శుక్లాల శస్త్రచికిత్స, లెన్స్ అమరిక మరియు ఉచిత కళ్ళద్దాలు",
    target_beneficiary: "Senior citizens (60+ years), school children and visually impaired citizens",
    target_beneficiary_te: "వృద్ధులు, పాఠశాల విద్యార్థులు మరియు చూపు లోపం ఉన్న పౌరులందరూ",
    application_mode: "District Blindness Control Society (DBCS) Camps / District Hospital Ophthalmic Unit",
    application_mode_te: "జిల్లా అంధత్వ నివారణ శిబిరాలు లేదా ప్రభుత్వ కంటి ఆసుపత్రిలో",
    processing_time: "Same-day screening; surgery scheduled within 1 week",
    processing_time_te: "అదే రోజున పరీక్ష; 1 వారంలో ఉచిత ఆపరేషన్",
    facility_type: "District Ophthalmic Units, Teaching Eye Hospitals & Accredited Eye NGO Centres",
    facility_type_te: "జిల్లా కంటి ఆసుపత్రులు మరియు స్వచ్ఛంద నేత్ర వైద్యశాలలు",
    validity_period: "Lifelong post-operative vision recovery and annual checkup",
    validity_period_te: "ఆపరేషన్ తర్వాత జీవితాంతం చూపు మెరుగుపడుతుంది",
    helpline_numbers: ["104 (Health Helpline)", "1800-425-7778 (Vision Helpline)"],
    key_treatments: [
      "Small Incision Cataract Surgery (SICS) with Foldable/Rigid Intraocular Lens (IOL)",
      "Refraction error screening and distribution of free prescription eyeglasses",
      "Diabetic Retinopathy and Glaucoma laser screening",
      "Free Corneal Transplant surgery under Eye Bank linkage",
      "Low vision aids for partially sighted individuals"
    ],
    key_treatments_te: [
      "నాణ్యమైన ఇంట్రాఓక్యులర్ లెన్స్ (IOL) తో ఉచిత కంటి శుక్లాల ఆపరేషన్",
      "చూపు లోపాలకు ఉచిత ప్రిస్క్రిప్షన్ కళ్ళద్దాల పంపిణీ",
      "డయాబెటిక్ రెటినోపతి మరియు గ్లకోమా లేజర్ పరీక్షలు",
      "కంటి కార్నియా మార్పిడి (కంటి చూపు దానం) ఉచిత శస్త్రచికిత్స",
      "దృష్టి లోపం ఉన్నవారికి ప్రత్యేక రీడింగ్ పరికరాలు"
    ],
    exclusions: "High-end elective cosmetic laser surgeries (LASIK/PRK).",
    exclusions_te: "సౌందర్య లేసిక్ (LASIK) లేజర్ సర్జరీలు వర్తించవు."
  },
  "National Oral Health Programme": {
    coverage_type: "Free Preventive, Diagnostic & Curative Dental Healthcare",
    coverage_type_te: "ఉచిత దంత వైద్య పరీక్షలు, చికిత్సలు & సంరక్షణ",
    benefit_amount: "100% Free Dental OPD, Scaling, Restorations, Extractions & Oral Cancer Screening",
    benefit_amount_te: "100% ఉచిత పంటి చికిత్సలు, క్లీనింగ్, పిప్పి పన్ను ఫిల్లింగ్ మరియు నోటి క్యాన్సర్ పరీక్షలు",
    target_beneficiary: "All Citizens with dental caries, gum disease, toothache, or tobacco-related oral lesions",
    target_beneficiary_te: "పంటి నొప్పి, చిగుళ్ల సమస్యలు లేదా నోటి పూతలతో బాధపడుతున్న పౌరులందరూ",
    application_mode: "Walk-in at Dental Unit in District Hospital, CHC or Government Dental College",
    application_mode_te: "జిల్లా ఆసుపత్రి లేదా ప్రభుత్వ డెంటల్ కాలేజీ దంత వైద్య విభాగంలో",
    processing_time: "Same-day dental consultation and immediate outpatient procedure",
    processing_time_te: "అదే రోజున ఉచిత దంత పరీక్ష మరియు ప్రాథమిక చికిత్స",
    facility_type: "Government Dental Colleges, District Hospital Dental Clinics & Upgraded CHCs",
    facility_type_te: "ప్రభుత్వ డెంటల్ కాలేజీలు మరియు జిల్లా ఆసుపత్రుల దంత విభాగాలు",
    validity_period: "Per dental treatment episode with ongoing preventive care",
    validity_period_te: "దంత సమస్య తగ్గే వరకు ఉచిత వైద్య సేవలు",
    helpline_numbers: ["104 (Health Advice)", "1902 (Public Grievance)"],
    key_treatments: [
      "Dental Caries Restoration (Light-cure Composite / Glass Ionomer Fillings)",
      "Painless Tooth Extractions under Local Anaesthesia",
      "Ultrasonic Scaling and Periodontal Deep Cleaning",
      "Root Canal Treatment (RCT) in District Dental Units",
      "Oral Pre-Cancerous Lesions Screening & Biopsy (for tobacco users)"
    ],
    key_treatments_te: [
      "పిప్పి పన్నులకు ఉచిత సిమెంట్ ఫిల్లింగ్",
      "నొప్పి లేని పంటి తొలగింపు (టూత్ ఎక్స్‌ట్రాక్షన్)",
      "అల్ట్రాసోనిక్ స్కేలింగ్ ద్వారా పళ్ళ క్లీనింగ్",
      "రూట్ కెనాల్ ట్రీట్‌మెంట్ (RCT) సదుపాయం",
      "గుట్కా, పొగాకు వాడేవారికి నోటి క్యాన్సర్ ముందస్తు బయాప్సీ పరీక్షలు"
    ],
    exclusions: "Purely cosmetic dental veneers and precious metal crowns.",
    exclusions_te: "సౌందర్య దంత చికిత్సలు (కాస్మెటిక్ వీనియర్స్) వర్తించవు."
  },
  "Anaemia Mukt Bharat": {
    coverage_type: "Universal Prophylactic & Therapeutic Iron-Folic Acid (IFA) Strategy (6x6x6)",
    coverage_type_te: "రక్తహీనత నివారణ ఉచిత ఐరన్-ఫోలిక్ యాసిడ్ పంపిణీ పథకం",
    benefit_amount: "100% Free Age-Appropriate IFA Syrups/Tablets, Deworming (Albendazole) & Point-of-Care Testing",
    benefit_amount_te: "100% ఉచిత ఐరన్ సిరప్‌లు, ఐరన్ మాత్రలు, నట్టల నివారణ మాత్రలు",
    target_beneficiary: "Children (6-59m), School Kids (5-9y), Adolescents (10-19y), Women of Reproductive Age (15-49y), Pregnant & Lactating Mothers",
    target_beneficiary_te: "చిన్నపిల్లలు, బడికెళ్లే విద్యార్థులు, కిశోర బాలికలు మరియు గర్భిణీ తల్లులు",
    application_mode: "Anganwadi Centres, Schools (WIFS), Village Clinics & Primary Health Centres",
    application_mode_te: "అంగన్‌వాడీ కేంద్రాలు, పాఠశాలలు మరియు ప్రభుత్వ ఆరోగ్య కేంద్రాల ద్వారా",
    processing_time: "Immediate on-site screening and weekly/daily distribution",
    processing_time_te: "వెంటనే హిమోగ్లోబిన్ పరీక్ష మరియు ఉచిత ఐరన్ మాత్రల అందజేత",
    facility_type: "All Anganwadis, Govt Schools, Junior Colleges, PHCs & Urban Clinics",
    facility_type_te: "అన్ని అంగన్‌వాడీలు, ప్రభుత్వ పాఠశాలలు మరియు ప్రాథమిక ఆరోగ్య కేంద్రాలు",
    validity_period: "Continuous lifecourse intervention as per National Iron Plus Initiative",
    validity_period_te: "జీవిత చక్రం పొడవునా నిర్దేశిత వయస్సు ప్రకారం నిరంతరం",
    helpline_numbers: ["104 (Nutrition Helpline)", "1075 (National Health Portal)"],
    key_treatments: [
      "Bi-weekly Iron Folic Acid Syrup for Infants 6-59 months",
      "Weekly Pink IFA Tablets for School Children 5-9 years",
      "Weekly Blue IFA Tablets for Adolescents 10-19 years in Schools and Anganwadis",
      "Daily Red IFA Tablets for Pregnant Women (from 2nd trimester) and Lactating Mothers",
      "Bi-annual National Deworming Day (Albendazole 400mg) for all children",
      "Point-of-Care Digital Haemoglobinometer Screening"
    ],
    key_treatments_te: [
      "6-59 నెలల పసిపిల్లలకు వారానికి రెండుసార్లు ఐరన్ సిరప్",
      "5-9 సంవత్సరాల పిల్లలకు వారానికి ఒకసారి గులాబీ రంగు ఐరన్ మాత్రలు",
      "10-19 సంవత్సరాల విద్యార్థినులకు వారానికి ఒకసారి నీలి రంగు ఐరన్ మాత్రలు",
      "గర్భిణులు మరియు బాలింతలకు రోజువారీ ఎరుపు రంగు ఐరన్ మాత్రలు",
      "సంవత్సరానికి రెండుసార్లు ఉచిత నట్టల నివారణ ఆల్బెండజోల్ మాత్రలు",
      "డిజిటల్ మీటర్ ద్వారా క్షణాల్లో రక్తహీనత (Hb) శాతం నిర్ధారణ"
    ],
    exclusions: "Patients with Thalassemia Major (iron supplementation is contraindicated without serum ferritin check).",
    exclusions_te: "తలసేమియా మేజర్ రోగులకు ఐరన్ మాత్రలు వాడకూడదు (వైద్యుల సలహా తప్పనిసరి)."
  },
  "Poshan Abhiyaan": {
    coverage_type: "National Holistic Nutrition Mission & Growth Monitoring Programme",
    coverage_type_te: "సంపూర్ణ పోషకాహార మిషన్ & పిల్లల ఎదుగుదల పర్యవేక్షణ",
    benefit_amount: "100% Free Supplementary Nutrition (Take Home Ration / Hot Cooked Meals) & Poshan Tracker Monitoring",
    benefit_amount_te: "100% ఉచిత పౌష్టికాహార రేషన్, వేడి పౌష్టిక భోజనం మరియు గుడ్లు",
    target_beneficiary: "Children aged 0-6 years, Pregnant Women, Lactating Mothers and Adolescent Girls in AP",
    target_beneficiary_te: "0-6 సంవత్సరాల పిల్లలు, గర్భిణులు, బాలింతలు మరియు కిశోర బాలికలు",
    application_mode: "Enrollment at local Anganwadi Centre under ICDS / Poshan Tracker App",
    application_mode_te: "సమీప అంగన్‌వాడీ కేంద్రంలో పోషణ్ ట్రాకర్‌లో నమోదు చేసుకోవడం ద్వారా",
    processing_time: "Immediate enrollment for monthly Take-Home Ration & daily preschool meals",
    processing_time_te: "నమోదైన వెంటనే ప్రతి నెలా ఉచిత పోషకాహార కిట్లు ప్రారంభం",
    facility_type: "All Anganwadi Centres (AWCs) in rural, urban and tribal project areas",
    facility_type_te: "గ్రామీణ, గిరిజన మరియు పట్టణ ప్రాంతాల్లోని అంగన్‌వాడీ కేంద్రాలు",
    validity_period: "From conception through first 1,000 golden days of child life up to age 6",
    validity_period_te: "గర్భధారణ నుండి మొదటి 1000 రోజులు మరియు 6 సంవత్సరాల వయస్సు వరకు",
    helpline_numbers: ["14408 (Poshan Abhiyaan Toll-Free)", "104 (Maternal & Child Health)"],
    key_treatments: [
      "Daily Hot Cooked Meal with Milk, Eggs and Fortified Rice for Pregnant/Lactating Mothers",
      "Nutritious Balaamrutham / Take-Home Ration (THR) for 7m-3y infants",
      "Monthly Child Growth Monitoring (Height, Weight, Stunting & Wasting tracking via Poshan Tracker)",
      "Management of Severely Underweight (SUW) & Moderately Acute Malnutrition (MAM)",
      "Breastfeeding, Infant & Young Child Feeding (IYCF) Counseling"
    ],
    key_treatments_te: [
      "గర్భిణులు, బాలింతలకు రోజువారీ వేడి పౌష్టిక భోజనం, పాలు మరియు కోడిగుడ్లు",
      "చిన్నపిల్లలకు బలవర్ధకమైన బాలామృతం ప్యాకెట్ల అందజేత",
      "ప్రతినెల పిల్లల ఎత్తు, బరువు కొలిచి ఎదుగుదల లోపాలను పర్యవేక్షించడం",
      "తీవ్ర పోషకాహార లోపం ఉన్న పిల్లలకు ప్రత్యేక చికిత్స & సంరక్షణ",
      "తల్లులకు తల్లిపాల ప్రాముఖ్యత మరియు శిశు సంరక్షణపై శిక్షణ"
    ],
    exclusions: "Non-pregnant, non-lactating individuals outside targeted maternal/child age brackets.",
    exclusions_te: "పథక పరిధిలో లేని సాధారణ పెద్దవారికి వర్తించదు."
  },
  "National AIDS Control Programme (NACP)": {
    coverage_type: "Free Universal HIV Testing, Anti-Retroviral Therapy (ART) & Prevention of Parent-to-Child Transmission",
    coverage_type_te: "ఉచిత హెచ్ఐవి పరీక్షలు, ఏఆర్టీ (ART) మందులు & ఉచిత సంరక్షణ",
    benefit_amount: "100% Free Lifelong Antiretroviral Drugs, CD4/Viral Load Testing & Free Delivery Care",
    benefit_amount_te: "100% ఉచిత జీవితాంతం ART మందులు, ఉచిత వైరల్ లోడ్ పరీక్షలు",
    target_beneficiary: "All Individuals living with HIV/AIDS (PLHIV) and high-risk demographic populations",
    target_beneficiary_te: "హెచ్ఐవితో జీవిస్తున్న బాధితులు మరియు వారి కుటుంబ సభ్యులు",
    application_mode: "Integrated Counseling and Testing Centres (ICTC) & Anti-Retroviral Therapy (ART) Centres in Govt Hospitals",
    application_mode_te: "ప్రభుత్వ ఆసుపత్రులలోని ICTC మరియు ART కేంద్రాల వద్ద సంప్రదించడం ద్వారా",
    processing_time: "Same-day rapid confidential HIV test; ART initiation on diagnosis",
    processing_time_te: "అదే రోజున గోప్యంగా ఉచిత పరీక్ష మరియు వెంటనే మందుల ప్రారంభం",
    facility_type: "Government Medical Colleges, District Hospital ART Centres & Care and Support Centres (CSC)",
    facility_type_te: "ప్రభుత్వ బోధనాసుపత్రులు మరియు జిల్లా ఏఆర్టీ (ART) కేంద్రాలు",
    validity_period: "Lifelong uninterrupted daily medication and viral suppression care",
    validity_period_te: "జీవితాంతం క్రమం తప్పకుండా ఉచిత మందులు మరియు వైద్య పరీక్షలు",
    helpline_numbers: ["1097 (National AIDS Helpline Toll-Free)", "104 (Health Helpline)"],
    key_treatments: [
      "100% Free Daily Fixed-Dose Combination Antiretroviral Therapy (TLD Regimen)",
      "Free Periodic CD4 Count and Quantitative HIV Viral Load Plasma Testing",
      "Prevention of Parent to Child Transmission (PPTCT) with safe institutional delivery",
      "Free Prophylaxis and Treatment for Opportunistic Infections (TB, Cryptococcal Meningitis)",
      "Confidential Pre-Test and Post-Test Counseling with strict privacy safeguards"
    ],
    key_treatments_te: [
      "100% ఉచిత రోజువారీ ఆధునిక ఏఆర్టీ (TLD) మందులు",
      "ఉచిత సీడీ4 (CD4) కౌంట్ మరియు వైరల్ లోడ్ ల్యాబ్ పరీక్షలు",
      "తల్లి నుండి బిడ్డకు వైరస్ సోకకుండా సురక్షిత కాన్పు సేవలు (PPTCT)",
      "టీబీ మరియు ఇతర ఇన్ఫెక్షన్ల నివారణకు ఉచిత మందులు",
      "పూర్తి గోప్యతతో కూడిన ఉచిత కౌన్సిలింగ్ సేవలు"
    ],
    exclusions: "Commercial paid private testing (Government ICTC centres guarantee 100% free and confidential services).",
    exclusions_te: "ప్రభుత్వ కేంద్రాల్లో పూర్తి ఉచితం మరియు పేర్లు గోప్యంగా ఉంచబడతాయి."
  },
  "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)": {
    coverage_type: "High-Quality Affordable Generic Medicines & Surgical Consumables at 50-90% Discount",
    coverage_type_te: "50% నుండి 90% తక్కువ ధరకే నాణ్యమైన జెనరిక్ మందుల పంపిణీ",
    benefit_amount: "50% to 90% Discount compared to branded market drugs across 2,000+ essential medicines",
    benefit_amount_te: "బ్రాండెడ్ మందులతో పోలిస్తే 50% నుండి 90% వరకు భారీ తగ్గింపు ధరలు",
    target_beneficiary: "All Citizens across India seeking high-quality affordable medications",
    target_beneficiary_te: "తక్కువ ఖర్చుతో నాణ్యమైన మందులు పొందాలనుకునే భారతదేశ పౌరులందరూ",
    application_mode: "Walk-in with doctor's prescription at nearest Pradhan Mantri Jan Aushadhi Kendra",
    application_mode_te: "డాక్టర్ ప్రిస్క్రిప్షన్‌తో సమీప జన్ ఔషధి కేంద్రంలో నేరుగా కొనుగోలు",
    processing_time: "Immediate over-the-counter dispensing",
    processing_time_te: "వెంటనే కౌంటర్ వద్ద బిల్లింగ్ మరియు మందుల అందజేత",
    facility_type: "10,000+ Standalone PMBJP Outlets, Hospital Campuses & Railway Stations",
    facility_type_te: "ఆసుపత్రుల ప్రాంగణాలు మరియు మార్కెట్లలోని జన్ ఔషధి కేంద్రాలు",
    validity_period: "Per prescription purchase with official receipt",
    validity_period_te: "ప్రిస్క్రిప్షన్ ఆధారంగా ఎప్పుడైనా కొనుగోలు చేయవచ్చు",
    helpline_numbers: ["1800-180-8080 (PMBJP National Toll-Free)", "104 (Health Information)"],
    key_treatments: [
      "Over 2,046 Generic Formulations (Cardiac, Anti-diabetic, Anti-hypertensive, Antibiotics)",
      "300+ Surgical Implants and Consumables (Surgical Gloves, Cannulas, Syringes)",
      "Suvidha Oxo-Biodegradable Sanitary Napkins at just ₹1 per pad",
      "Nutraceuticals, Protein Supplements, and Immuno-boosters",
      "NABL-Accredited Lab Quality Tested Formulations"
    ],
    key_treatments_te: [
      "గుండె జబ్బులు, బీపీ, షుగర్ మరియు యాంటీబయాటిక్స్ తో సహా 2,046+ రకాల మందులు",
      "శస్త్రచికిత్సలకు అవసరమైన 300+ సర్జికల్ వస్తువులు",
      "కేవలం ₹1 కే 'సువిధ' పర్యావరణ హిత శానిటరీ న్యాప్‌కిన్లు",
      "ప్రొటీన్ పౌడర్లు, విటమిన్లు మరియు న్యూట్రిషన్ ఉత్పత్తులు",
      "NABL ల్యాబ్ పరీక్షల్లో నాణ్యత ధృవీకరించబడిన ఔషధాలు"
    ],
    exclusions: "Narcotics and Schedule X restricted psychotropic drugs without valid specialist triplicate prescription.",
    exclusions_te: "షెడ్యూల్ X మరియు నిషేధిత మత్తు మందులు సాధారణంగా విక్రయించబడవు."
  },
  "Ayushman Bharat Health Account (ABHA)": {
    coverage_type: "Universal Digital 14-Digit Health Identity & Interoperable EHR System",
    coverage_type_te: "14 అంకెల జాతీయ డిజిటల్ హెల్త్ ఐడీ & ఆన్‌లైన్ మెడికల్ రికార్డులు",
    benefit_amount: "100% Free Lifetime Digital Health Locker & Paperless Hospital Registration",
    benefit_amount_te: "100% ఉచిత డిజిటల్ హెల్త్ లాకర్ మరియు పేపర్‌లెస్ ఆసుపత్రి క్యూ నమోదు",
    target_beneficiary: "All Citizens of India desiring consolidated digital health records",
    target_beneficiary_te: "ఆరోగ్య రికార్డులను ఆన్‌లైన్‌లో భద్రపరుచుకోవాలనుకునే భారత పౌరులందరూ",
    application_mode: "Online at abha.abdm.gov.in / ABHA App / Scan & Share QR at Hospital OPD",
    application_mode_te: "abha.abdm.gov.in వెబ్‌సైట్, ABHA యాప్ లేదా ఆసుపత్రి ఓపీడీ క్యూఆర్ కోడ్ స్కాన్ ద్వారా",
    processing_time: "Instant 2-minute creation via Aadhaar / Mobile OTP",
    processing_time_te: "ఆధార్ లేదా మొబైల్ ఓటీపీతో కేవలం 2 నిమిషాల్లో తయారవుతుంది",
    facility_type: "All ABDM-Enabled Public Hospitals, Private Clinics, Diagnostic Labs & Pharmacies",
    facility_type_te: "అన్ని ప్రభుత్వ, ప్రైవేట్ ఆసుపత్రులు మరియు డయాగ్నస్టిక్ ల్యాబ్‌లు",
    validity_period: "Permanent unique lifetime digital health identity",
    validity_period_te: "జీవితాంతం శాశ్వతంగా ఉండే విశిష్ట డిజిటల్ హెల్త్ నంబర్",
    helpline_numbers: ["1800-11-4477 (ABDM National Toll-Free)", "1075 (National Health Portal)"],
    key_treatments: [
      "Unique 14-Digit ABHA ID and ABHA Address (@abdm handle)",
      "Paperless 'Scan & Share' Fast-Track OPD Registration in Hospitals",
      "Interoperable Linking of Lab Reports, Prescriptions, Hospital Discharge Summaries",
      "Consent-Based Secure Sharing of Medical History with Treating Specialists",
      "Integration with Aarogya Setu and Personal Health Record (PHR) Mobile Apps"
    ],
    key_treatments_te: [
      "14 అంకెల విశిష్ట డిజిటల్ హెల్త్ ఐడీ కార్డు",
      "ఆసుపత్రులలో లైన్లలో నిలబడకుండా 'స్కాన్ & షేర్' ద్వారా వేగవంతమైన ఓపీడీ టోకెన్",
      "పాత రక్త పరీక్షల రిపోర్టులు, డిశ్చార్జ్ సమ్మరీలను ఒకే చోట భద్రపరుచుకునే సదుపాయం",
      "రోగి అనుమతితో మాత్రమే డాక్టర్లకు పాత వైద్య చరిత్రను షేర్ చేసే భద్రత",
      "ఆరోగ్య సేతు మరియు ABHA యాప్‌లతో సులభ అనుసంధానం"
    ],
    exclusions: "Does not provide direct medical insurance by itself (acts as the digital gateway for PM-JAY and other health programs).",
    exclusions_te: "ఇది డిజిటల్ హెల్త్ ఐడీ మాత్రమే, ఇన్సూరెన్స్ పథకాలకు లింక్ చేసుకునేందుకు ఉపయోగపడుతుంది."
  },
  "National Rabies Control Programme (NRCP)": {
    coverage_type: "Free Post-Exposure Prophylaxis (PEP) & Anti-Rabies Vaccination (ARV)",
    coverage_type_te: "కుక్కకాటు ఉచిత వ్యాక్సిన్ (ARV) & యాంటీ-రేబిస్ సీరం చికిత్స",
    benefit_amount: "100% Free Intra-Dermal Anti-Rabies Vaccine (ARV) & Rabies Immunoglobulin (RIG)",
    benefit_amount_te: "100% ఉచిత రేబిస్ నిరోధక ఇంజెక్షన్లు (ARV) మరియు ఇమ్యునోగ్లోబులిన్ (RIG)",
    target_beneficiary: "All individuals bitten, scratched or exposed to suspected rabid dogs, cats, monkeys or wildlife",
    target_beneficiary_te: "కుక్కకాటు, పిల్లికాటు లేదా కోతికాటుకు గురైన బాధితులందరూ",
    application_mode: "Immediate walk-in at Casualty / Anti-Rabies Clinic in Govt PHC, CHC or District Hospital",
    application_mode_te: "ప్రభుత్వ ఆసుపత్రిలోని క్యాజువాలిటీ లేదా యాంటీ-రేబిస్ క్లినిక్ వద్ద తక్షణమే హాజరుకావడం",
    processing_time: "Immediate emergency wound washing and Day 0 vaccination dose",
    processing_time_te: "చేరిన వెంటనే గాయం శుభ్రం చేసి మొదటి డోస్ ఇంజెక్షన్ వేస్తారు",
    facility_type: "Designated Anti-Rabies Clinics, Government CHCs, Area Hospitals and Teaching Hospitals",
    facility_type_te: "అన్ని ప్రభుత్వ సామాజిక ఆరోగ్య కేంద్రాలు (CHC) మరియు ఏరియా ఆసుపత్రులు",
    validity_period: "Mandatory multi-dose regimen (Days 0, 3, 7, 28 for IDRV)",
    validity_period_te: "నిర్దేశిత షెడ్యూల్ ప్రకారం (0, 3, 7, 28వ రోజులలో) 4 డోసులు పూర్తి చేయాలి",
    helpline_numbers: ["104 (Health Advice)", "108 (Emergency Transit for Severe Bites)"],
    key_treatments: [
      "Immediate Scientific Wound Washing with running water and soap for 15 minutes",
      "Intradermal Rabies Vaccination (IDRV - 0.1ml at 2 sites on Days 0, 3, 7, 28)",
      "Equine or Human Rabies Immunoglobulin (eRIG / hRIG) infiltration into Category III wounds",
      "Tetanus Toxoid (TT/Td) booster administration",
      "Animal observation counseling for 10 days"
    ],
    key_treatments_te: [
      "కుక్కకాటు గాయాన్ని పారే నీరు మరియు సబ్బుతో 15 నిమిషాలు శుభ్రం చేయడం",
      "ఉచిత ఇంట్రాడెర్మల్ రేబిస్ ఇంజెక్షన్ల షెడ్యూల్ (0, 3, 7, 28వ రోజులు)",
      "తీవ్ర గాయాలకు లోతుగా ఇచ్చే యాంటీ-రేబిస్ ఇమ్యునోగ్లోబులిన్ (RIG) ఇంజెక్షన్",
      "ధనుర్వాతం రాకుండా ధనుర్వాతం (టిటి) ఇంజెక్షన్",
      "కుక్కను 10 రోజుల పాటు పర్యవేక్షించే విధానంపై సలహాలు"
    ],
    exclusions: "Non-exposure contact (touching animal or un-broken skin without saliva contact requires simple soap washing only).",
    exclusions_te: "గాయం లేని సాధారణ స్పర్శకు సబ్బుతో కడిగితే సరిపోతుంది (ఇంజెక్షన్లు అవసరం ఉండదు)."
  },
  "National Programme for Prevention of Deafness (NPPCD)": {
    coverage_type: "Free Universal Hearing Screening, Ear Surgeries & Free Digital Hearing Aids",
    coverage_type_te: "వినికిడి లోపాల ఉచిత పరీక్షలు, చెవి ఆపరేషన్లు & ఉచిత వినికిడి యంత్రాలు",
    benefit_amount: "100% Free Pure Tone Audiometry (PTA), Tympanometry, Tympanoplasty Surgeries & Hearing Aids",
    benefit_amount_te: "100% ఉచిత ఆడియోమెట్రీ పరీక్షలు, కర్ణభేరి శస్త్రచికిత్సలు & ఉచిత వినికిడి మిషన్లు",
    target_beneficiary: "Infants, school children, industrial workers, elderly with age-related hearing loss (Presbycusis)",
    target_beneficiary_te: "వినికిడి లోపం, చెవిలో చీము లేదా శబ్దాల సమస్యలతో బాధపడుతున్న పౌరులందరూ",
    application_mode: "ENT OPD at District Hospital / Teaching Hospital / Audiology Assessment Camps",
    application_mode_te: "జిల్లా ఆసుపత్రిలోని ఈఎన్‌టీ (ENT) విభాగం లేదా వినికిడి నిర్ధారణ క్యాంపులలో",
    processing_time: "Audiological evaluation within 1-3 days; hearing aid fitting within 2 weeks",
    processing_time_te: "ఆడియోమెట్రీ పరీక్ష అనంతరం 2 వారాల్లో ఉచిత వినికిడి పరికరం అందజేత",
    facility_type: "District Hospital ENT Departments, Medical Colleges & DEIC Centres",
    facility_type_te: "జిల్లా ఆసుపత్రులు మరియు ప్రభుత్వ మెడికల్ కాలేజీల ఈఎన్‌టీ విభాగాలు",
    validity_period: "Lifelong audiological monitoring and annual device maintenance",
    validity_period_te: "వినికిడి పరికరం ద్వారా నిరంతర సంరక్షణ",
    helpline_numbers: ["104 (Health Helpline)", "1800-425-7778 (ENT Care Desk)"],
    key_treatments: [
      "Pure Tone Audiometry (PTA) & Brainstem Evoked Response Audiometry (BERA)",
      "Treatment and Microsurgery for Chronic Suppurative Otitis Media (CSOM / Perforated Eardrum)",
      "Tympanoplasty, Mastoidectomy and Stapedectomy Ear Surgeries",
      "Free Fitting of Custom Digital Behind-the-Ear (BTE) Hearing Aids",
      "Ear Wax Removal and Noise-Induced Hearing Loss Prevention Education"
    ],
    key_treatments_te: [
      "కంప్యూటరైజ్డ్ ఆడియోమెట్రీ (PTA) మరియు బెరా వినికిడి పరీక్షలు",
      "చెవిలో కర్ణభేరి రంధ్రం (CSOM) పూడ్చడానికి ఉచిత టింపనోప్లాస్టీ ఆపరేషన్",
      "చెవిలో చీము మరియు ఎముక సమస్యలకు ఉచిత మైక్రో సర్జరీలు",
      "చెవి వెనుక పెట్టుకునే నాణ్యమైన ఉచిత డిజిటల్ వినికిడి యంత్రాల పంపిణీ",
      "చెవి గులిమి శుభ్రం చేయడం మరియు శబ్ద కాలుష్య నివారణ సలహాలు"
    ],
    exclusions: "High-end luxury invisible Bluetooth fashion hearing aids (standard clinical high-performance BTE units provided free).",
    exclusions_te: "ఫ్యాషన్ బ్లూటూత్ డివైజ్‌లు వర్తించవు (ప్రభుత్వం నాణ్యమైన క్లినికల్ బిటిఈ పరికరాలను ఉచితంగా ఇస్తుంది)."
  },
  "National Organ Transplant Programme (NOTP)": {
    coverage_type: "Deceased & Living Organ Donation Coordination, Waitlist Registry & Post-Transplant Medication Support",
    coverage_type_te: "అవయవ దానం, ఉచిత అవయవ మార్పిడి శస్త్రచికిత్స & పోస్ట్-ట్రాన్స్‌ప్లాంట్ మందులు",
    benefit_amount: "Free Organ Transplant Surgeries under Dr. NTR Vaidya Seva / PM-JAY & Free Immunosuppressants",
    benefit_amount_te: "ఆరోగ్యశ్రీ ద్వారా ఉచిత అవయవ మార్పిడి సర్జరీలు & ఉచిత రోగనిరోధక మందులు",
    target_beneficiary: "Patients with End-Stage Organ Failure (Kidney, Liver, Heart, Lungs, Cornea) in AP",
    target_beneficiary_te: "కిడ్నీ, కాలేయం, గుండె వైఫల్యంతో బాధపడుతూ అవయవ మార్పిడి అవసరమైన రోగులు",
    application_mode: "Registration through State Organ Tissue Transplant Organization (SOTTO / Jeevandan AP)",
    application_mode_te: "ఆంధ్రప్రదేశ్ 'జీవన్‌దాన్' పోర్టల్ మరియు నెట్‌వర్క్ ఆసుపత్రి ద్వారా రిజిస్ట్రేషన్",
    processing_time: "Waiting list priority based on clinical severity (MELD/Status score) and tissue matching",
    processing_time_te: "వ్యాధి తీవ్రత మరియు బ్లడ్ గ్రూప్ మ్యాచ్ ఆధారంగా అధికారిక జాబితా ప్రకారం",
    facility_type: "Registered Super-Specialty Organ Transplant Centres & Government Teaching Hospitals",
    facility_type_te: "గుర్తింపు పొందిన సూపర్ స్పెషాలిటీ ట్రాన్స్‌ప్లాంట్ ఆసుపత్రులు",
    validity_period: "Lifelong post-transplant follow-up and immunosuppressive therapy",
    validity_period_te: "ఆపరేషన్ తర్వాత జీవితాంతం ఉచిత మందులు మరియు వైద్య పర్యవేక్షణ",
    helpline_numbers: ["104 (Health Helpline)", "1800-425-7778 (Jeevandan AP Hotline)"],
    key_treatments: [
      "Deceased Donor (Cadaver) Kidney, Liver, Heart, Lung and Cornea Harvesting & Allocation",
      "Living Related Kidney and Living Donor Liver Transplant Surgeries",
      "Green Corridor Traffic Coordination for emergency interstate organ transport",
      "Free Post-Transplant Immunosuppressive Medications (Tacrolimus, Mycophenolate)",
      "Donor Family Facilitation and Honouring Ceremonies"
    ],
    key_treatments_te: [
      "బ్రెయిన్ డెడ్ రోగుల నుండి కిడ్నీ, లివర్, గుండె అవయవాల స్వీకరణ మరియు పారదర్శక కేటాయింపు",
      "బంధువుల నుండి కిడ్నీ మరియు కాలేయ మార్పిడి శస్త్రచికిత్సలు",
      "అవయవాలను వేగంగా చేరవేయడానికి గ్రీన్ కారిడార్ పోలీసు రవాణా సమన్వయం",
      "ఆపరేషన్ తర్వాత జీవితాంతం వాడాల్సిన ఉచిత టాక్రోలిమస్ తదితర మందుల సరఫరా",
      "అవయవ దాతల కుటుంబాలకు ప్రభుత్వం తరపున సత్కారం"
    ],
    exclusions: "Commercial paid organ trade (strictly prohibited and illegal under the Transplantation of Human Organs Act).",
    exclusions_te: "అవయవాల క్రయవిక్రయాలు చట్టరీత్యా నేరం (అధికారిక జీవన్‌దాన్ ద్వారా మాత్రమే జరుగుతుంది)."
  },
  "National Iodine Deficiency Disorders Control Programme (NIDDCP)": {
    coverage_type: "Universal Salt Iodization, Goitre Surveillance & Community Iodine Testing",
    coverage_type_te: "అయోడిన్ లోప నివారణ, గాయిటర్ సర్వే & నాణ్యమైన ఉప్పు పర్యవేక్షణ",
    benefit_amount: "100% Subsidized Adequately Iodized Salt via PDS Ration & Free MBI Kit Testing",
    benefit_amount_te: "రేషన్ దుకాణాల ద్వారా నాణ్యమైన అయోడైజ్డ్ ఉప్పు సరఫరా & ఉచిత పరీక్షలు",
    target_beneficiary: "All Households, Pregnant Women, Infants and Growing Children across AP",
    target_beneficiary_te: "ఆంధ్రప్రదేశ్‌లోని అన్ని కుటుంబాలు, గర్భిణులు మరియు ఎదుగుతున్న పిల్లలు",
    application_mode: "Available via Public Distribution System (PDS / Rice Card) and Local Retail Outlets",
    application_mode_te: "రేషన్ షాపుల ద్వారా మరియు అంగన్‌వాడీ కేంద్రాల ద్వారా",
    processing_time: "Continuous daily dietary consumption",
    processing_time_te: "రోజువారీ ఆహారంలో నాణ్యమైన అయోడైజ్డ్ ఉప్పు వినియోగం",
    facility_type: "District Food Safety Labs, PDS Fair Price Shops, Anganwadis & PHCs",
    facility_type_te: "రేషన్ దుకాణాలు, అంగన్‌వాడీలు మరియు ఆహార భద్రతా ల్యాబ్‌లు",
    validity_period: "Lifelong preventive dietary nutrition",
    validity_period_te: "జీవితాంతం నిరంతర పోషకాహార రక్షణ",
    helpline_numbers: ["104 (Health Information)", "1902 (Public Grievance)"],
    key_treatments: [
      "Mandatory Salt Iodization (≥15 ppm iodine at household level, ≥30 ppm at production level)",
      "Spot Testing of Household Salt samples by ASHA workers using MBI Field Kits",
      "Prevention of Endemic Goitre, Cretinism, Mental Retardation and Deaf-Mutism",
      "Urinary Iodine Excretion (UIE) lab surveillance in vulnerable populations",
      "Thyroid Health Education and Maternal Iodine Awareness"
    ],
    key_treatments_te: [
      "తగినంత అయోడిన్ కలిగిన ఉప్పు వినియోగాన్ని నిర్ధారించడం (15 పీపీఎం పైగా)",
      "ఆశా కార్యకర్తల ద్వారా ఇళ్లలోని ఉప్పును ఉచితంగా పరీక్షించే కిట్లు",
      "గొంతు వాపు (గాయిటర్), మానసిక ఎదుగుదల లోపాలు మరియు బుద్ధిమాంద్యం నివారణ",
      "గర్భిణులలో థైరాయిడ్ మరియు పిండం మెదడు ఎదుగుదలకు అవగాహన",
      "రేషన్ ద్వారా తక్కువ ధరకే నాణ్యమైన అయోడైజ్డ్ ఉప్పు పంపిణీ"
    ],
    exclusions: "Non-iodized industrial crude salt for human culinary consumption.",
    exclusions_te: "అయోడిన్ లేని పారిశ్రామిక ఉప్పును ఆహారంలో వాడకూడదు."
  },
  "YSR Urban Health Clinics": {
    coverage_type: "Comprehensive Urban Primary Healthcare, Free Diagnostics & Specialist E-Clinics",
    coverage_type_te: "పట్టణ పేదలకు వార్డుల్లోనే ఉచిత వైద్యం, పరీక్షలు & మందులు",
    benefit_amount: "100% Free Outpatient Care, 63 Essential Lab Tests, 172 Medicines & Tele-Consultations",
    benefit_amount_te: "100% ఉచిత ఓపీడీ వైద్యం, 63 రకాల ల్యాబ్ టెస్టులు, 172 ఉచిత మందులు",
    target_beneficiary: "Urban slum dwellers, daily-wage workers and all urban ward residents across AP municipalities",
    target_beneficiary_te: "పట్టణ పేదలు, మురికివాడల నివాసితులు మరియు పట్టణ వార్డుల ప్రజలందరూ",
    application_mode: "Walk-in at Ward Urban Primary Health Centre (UPHC / Urban Clinic)",
    application_mode_te: "సమీప వార్డు అర్బన్ హెల్త్ క్లినిక్ వద్ద నేరుగా సంప్రదించడం",
    processing_time: "Immediate outpatient consultation; rapid lab tests within 30 minutes",
    processing_time_te: "వెంటనే డాక్టర్ పరీక్ష మరియు అరగంటలో ల్యాబ్ రిపోర్టులు",
    facility_type: "Upgraded Modern Ward Urban Health Clinics staffed with MBBS Doctors, Staff Nurses & Pharmacists",
    facility_type_te: "ఎంబీబీఎస్ డాక్టర్, స్టాఫ్ నర్స్ మరియు ఫార్మసిస్ట్ కలిగిన అర్బన్ క్లినిక్‌లు",
    validity_period: "Continuous daily outpatient services (9:00 AM to 4:00 PM)",
    validity_period_te: "ప్రతిరోజూ ఉదయం 9 నుండి సాయంత్రం 4 గంటల వరకు నిరంతరం",
    helpline_numbers: ["104 (Health Helpline)", "1902 (Citizen Helpline)"],
    key_treatments: [
      "Daily Doctor OPD Consultation for acute illnesses and chronic diseases",
      "Free 63 Point-of-Care and Centralized Diagnostic Lab Investigations",
      "Free 172 Essential Generic Medicines Dispensing",
      "Specialist Tele-Consultations with Teaching Hospital Professors via eSanjeevani",
      "Antenatal, Immunization and Family Welfare Services in Urban Slums"
    ],
    key_treatments_te: [
      "ఎంబీబీఎస్ డాక్టర్ ద్వారా రోజువారీ ఉచిత ఓపీడీ వైద్య పరీక్షలు",
      "షుగర్, థైరాయిడ్, లిపిడ్ ప్రొఫైల్ సహా 63 రకాల ఉచిత ల్యాబ్ పరీక్షలు",
      "172 రకాల నాణ్యమైన ఉచిత మందుల పంపిణీ",
      "మెడికల్ కాలేజీ ప్రొఫెసర్లతో ఉచిత వీడియో స్పెషలిస్ట్ టెలి-మెడిసిన్",
      "పట్టణ గర్భిణులకు ఉచిత పరీక్షలు మరియు పిల్లలకు టీకాలు"
    ],
    exclusions: "Major overnight hospital admissions (referred seamlessly to Govt General Hospital under Aarogyasri).",
    exclusions_te: "రాత్రి బస చేసే ఇన్ పేషెంట్ అడ్మిషన్లు (పెద్ద ప్రభుత్వ ఆసుపత్రికి రిఫర్ చేస్తారు)."
  },
  "AP Blood Bank Services": {
    coverage_type: "Safe Blood Transfusion Services, Component Separation & 24x7 Emergency Blood Availability",
    coverage_type_te: "సురక్షిత రక్తం, ప్లేట్‌లెట్స్, ప్లాస్మా ఉచిత అందజేత సేవలు",
    benefit_amount: "100% Free Blood & Blood Components for Aarogyasri / Govt Hospital Patients, Thalassemia & Trauma Victims",
    benefit_amount_te: "ప్రభుత్వ ఆసుపత్రులు, ఆరోగ్యశ్రీ రోగులు, తలసేమియా బాధితులకు 100% ఉచిత రక్తం",
    target_beneficiary: "Emergency trauma patients, surgical cases, pregnant mothers, Thalassemia/Haemophilia patients across AP",
    target_beneficiary_te: "ప్రమాద బాధితులు, గర్భిణులు, శస్త్రచికిత్స రోగులు మరియు తలసేమియా బాధితులు",
    application_mode: "Doctor's Blood Requisition Form at District Hospital / Blood Centre or via e-RaktKosh Portal",
    application_mode_te: "డాక్టర్ ప్రిస్క్రిప్షన్‌తో బ్లడ్ బ్యాంకులో లేదా e-RaktKosh పోర్టల్ ద్వారా",
    processing_time: "Emergency cross-matching within 30-45 minutes; uncrossmatched O-negative immediate",
    processing_time_te: "క్రాస్ మ్యాచింగ్ అనంతరం 30-45 నిమిషాల్లో సురక్షిత రక్తం అందజేత",
    facility_type: "Government Model Blood Banks, Component Separation Units & Red Cross Blood Centres",
    facility_type_te: "జిల్లా ప్రభుత్వ బ్లడ్ బ్యాంకులు మరియు బ్లడ్ కాంపోనెంట్ యూనిట్లు",
    validity_period: "Per emergency blood requirement episode",
    validity_period_te: "అత్యవసర చికిత్స అవసరమైన ప్రతిసారీ వర్తిస్తుంది",
    helpline_numbers: ["104 (Blood Availability Search Helpline)", "108 (Emergency)", "1902 (Grievance)"],
    key_treatments: [
      "100% Nucleic Acid Testing (NAT) / ELISA Tested Safe Blood against HIV, Hep B, Hep C, Malaria & Syphilis",
      "Blood Component Separation: Packed Red Blood Cells (PRBC), Platelet Concentrates, Fresh Frozen Plasma (FFP), Cryoprecipitate",
      "Single Donor Platelet (SDP) Apheresis for severe Dengue and Oncology emergencies",
      "Free Voluntary Blood Donation Mobile Camps and Donor Felicitation",
      "Real-Time Online Blood Stock Tracking on e-RaktKosh Portal"
    ],
    key_treatments_te: [
      "హెచ్ఐవి, హెపటైటిస్ పరీక్షలు పూర్తి చేసిన 100% సురక్షిత రక్తం",
      "రక్త కణాలు వేరుచేసే పద్ధతి: ఎర్ర రక్తకణాలు (PRBC), ప్లేట్‌లెట్స్, ప్లాస్మా (FFP)",
      "డెంగ్యూ మరియు క్యాన్సర్ రోగుల కోసం సింగిల్ డోనర్ ప్లేట్‌లెట్ (SDP) సేవలు",
      "స్వచ్ఛంద రక్తదాన శిబిరాలు మరియు రక్తదాతలకు గుర్తింపు కార్డులు",
      "e-RaktKosh పోర్టల్‌లో జిల్లావ్యాప్తంగా అందుబాటులో ఉన్న రక్తం నిల్వల వివరాలు"
    ],
    exclusions: "Commercial paid blood selling (strictly banned and punishable by law; only voluntary donation allowed).",
    exclusions_te: "రక్తం అమ్మడం చట్టరీత్యా నేరం (స్వచ్ఛంద దానం ద్వారా మాత్రమే లభిస్తుంది)."
  },
  "National TB Elimination Programme (NTEP)": {
    coverage_type: "Free Universal Tuberculosis Diagnosis, TrueNat Molecular Testing & Daily FDC Treatment",
    coverage_type_te: "క్షయ (టీబీ) ఉచిత నిర్ధారణ, ట్రూనాట్ పరీక్షలు & పూర్తి ఉచిత మందులు",
    benefit_amount: "100% Free CBNAAT/TrueNat Testing, Free Anti-TB Medicines, Bedaquiline for MDR-TB & ₹500-1000/mo DBT",
    benefit_amount_te: "100% ఉచిత అధునాతన ల్యాబ్ పరీక్షలు, ఉచిత టీబీ మందులు & నెలకు ₹500-1000 పోషకాహార సాయం",
    target_beneficiary: "All individuals with cough > 2 weeks, fever, night sweats, unexplained weight loss or diagnosed TB",
    target_beneficiary_te: "2 వారాలకు పైగా దగ్గు, సాయంత్రం జ్వరం, బరువు తగ్గడం లక్షణాలు ఉన్న పౌరులందరూ",
    application_mode: "Walk-in at Designated Microscopy Centre (DMC), PHC, CHC or TB Unit (TU) in Govt Hospital",
    application_mode_te: "సమీప ప్రభుత్వ ప్రాథమిక ఆరోగ్య కేంద్రం లేదా జిల్లా టీబీ సెంటర్‌లో",
    processing_time: "Sputum microscopy same day; TrueNat/CBNAAT molecular results within 24 hours",
    processing_time_te: "అదే రోజున కఫం పరీక్ష; 24 గంటల్లో ట్రూనాట్ మాలిక్యులర్ రిపోర్ట్",
    facility_type: "All Government PHCs, CHCs, District TB Sanatoriums, DMCs & Intermediate Reference Labs",
    facility_type_te: "అన్ని ప్రభుత్వ ప్రాథమిక ఆరోగ్య కేంద్రాలు & జిల్లా క్షయ నివారణ విభాగాలు",
    validity_period: "Full curative treatment duration (6 months for Drug-Sensitive TB, 9-24 months for Drug-Resistant TB)",
    validity_period_te: "వ్యాధి పూర్తిగా నయమయ్యే వరకు (6 నెలల నుండి 24 నెలల వరకు)",
    helpline_numbers: ["1800-11-6666 (National TB Toll-Free Helpline)", "104 (Health Helpline)"],
    key_treatments: [
      "Point-of-Care TrueNat and CBNAAT (GeneXpert) Molecular Drug Resistance Testing",
      "100% Free Daily Fixed-Dose Combination (FDC) Anti-TB Oral Medicines",
      "Advanced All-Oral Regimens containing Bedaquiline and Delamanid for MDR/XDR-TB",
      "Monthly ₹500 to ₹1,000 Ni-kshay Poshan Direct Benefit Transfer (DBT) into Bank Account",
      "Free Preventive Therapy (TPT) for household contacts and children under 5"
    ],
    key_treatments_te: [
      "కఫం పరీక్ష మరియు అధునాతన ట్రూనాట్ (TrueNat) జన్యు పరీక్షలు",
      "100% ఉచిత పూర్తి కోర్సు రోజువారీ టీబీ మందుల కిట్లు",
      "తీవ్రమైన మందులకు లొంగని టీబీ (MDR-TB) రోగులకు బేడాక్విలిన్ ఉచిత చికిత్స",
      "పోషకాహారం కొరకు ప్రతి నెలా బ్యాంక్ ఖాతాలో ₹500 నుండి ₹1,000 నగదు జమ",
      "ఇంట్లోని చిన్న పిల్లలకు టీబీ సోకకుండా ఉచిత ప్రివెంటివ్ మందులు"
    ],
    exclusions: "Irregular non-supervised medication intake (monitored via 99DOTS / digital pill tracking).",
    exclusions_te: "మందులు మధ్యలో ఆపకూడదు (క్రమం తప్పకుండా వాడితేనే పూర్తిగా నయమవుతుంది)."
  },
  "Integrated Child Development Services (ICDS)": {
    coverage_type: "Holistic Early Childhood Development, Supplementary Nutrition, Pre-School Education & Health Checkups",
    coverage_type_te: "సమగ్ర శిశు అభివృద్ధి, ఉచిత పౌష్టికాహారం & ముందస్తు విద్య",
    benefit_amount: "100% Free Nutritional Meals, Eggs, Milk, Growth Monitoring, Pre-School Kits & Health Checkups",
    benefit_amount_te: "100% ఉచిత పౌష్టికాహారం, కోడిగుడ్లు, పాలు, ప్రీ-స్కూల్ విద్య మరియు ఆరోగ్య పరీక్షలు",
    target_beneficiary: "Children aged 6 months to 6 years, Pregnant Women, Lactating Mothers and Adolescent Girls in AP",
    target_beneficiary_te: "6 నెలల నుండి 6 సంవత్సరాల పిల్లలు, గర్భిణులు, బాలింతలు మరియు కిశోర బాలికలు",
    application_mode: "Enrollment at Village / Ward Anganwadi Centre through Anganwadi Worker (AWW)",
    application_mode_te: "గ్రామ / వార్డు అంగన్‌వాడీ కార్యకర్త వద్ద నేరుగా పేరు నమోదు చేసుకోవడం ద్వారా",
    processing_time: "Immediate enrollment for daily preschool attendance and monthly food rations",
    processing_time_te: "నమోదైన వెంటనే ప్రతిరోజూ అంగన్‌వాడీ సేవలు ప్రారంభం",
    facility_type: "55,000+ Anganwadi Centres (AWCs) and Mini-Anganwadis across Andhra Pradesh",
    facility_type_te: "ఆంధ్రప్రదేశ్ వ్యాప్తంగా ఉన్న 55,000+ అంగన్‌వాడీ కేంద్రాలు",
    validity_period: "From pregnancy through lactation and child's 6th year of age",
    validity_period_te: "గర్భధారణ సమయం నుండి శిశువుకు 6 సంవత్సరాలు నిండే వరకు",
    helpline_numbers: ["1098 (Childline Helpline Toll-Free)", "14408 (Poshan Helpline)", "104 (Health Advice)"],
    key_treatments: [
      "Supplementary Nutrition (Hot Cooked Meals, Eggs 4-5 times weekly, Fortified Milk)",
      "Take-Home Ration (Balaamrutham packets for children 6m to 3y)",
      "Non-Formal Pre-School Education for children aged 3 to 6 years",
      "Regular Immunization and Health Checkups in coordination with ANM and ASHA",
      "Referral Services for severely malnourished or sick children to Nutrition Rehabilitation Centres (NRC)"
    ],
    key_treatments_te: [
      "రోజువారీ వేడి పౌష్టిక ఆహారం, వారానికి 4-5 కోడిగుడ్లు, పాలు",
      "చిన్నపిల్లలకు బలవర్ధకమైన 'బాలామృతం' ఉచిత ప్యాకెట్ల పంపిణీ",
      "3 నుండి 6 సంవత్సరాల పిల్లలకు ఆటపాటలతో కూడిన ప్రాథమిక ముందస్తు విద్య",
      "ఏఎన్ఎం మరియు ఆశా కార్యకర్తలతో కలిసి క్రమబద్ధమైన టీకాలు & పరీక్షలు",
      "తీవ్ర పోషకాహార లోపం ఉన్న పిల్లలను NRC పోషకాహార కేంద్రాలకు పంపే సదుపాయం"
    ],
    exclusions: "Non-enrolled individuals outside the designated project catchment area.",
    exclusions_te: "అంగన్‌వాడీ పరిధిలోని స్థానిక ప్రజలందరికీ ఈ సేవలు వర్తిస్తాయి."
  },

  // --- national_and_ap_schemes.json ---
  "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)": {
    coverage_type: "Fixed-Day Quality Specialist Antenatal Care (ANC) on 9th of Every Month",
    coverage_type_te: "ప్రతినెల 9వ తేదీన ఉచిత స్పెషలిస్ట్ గర్భిణీ పరీక్షలు (PMSMA)",
    benefit_amount: "100% Free Obstetric Specialist Consultation, Ultrasound Scanning, Lab Investigations & High-Risk Tracking",
    benefit_amount_te: "100% ఉచిత గైనకాలజిస్ట్ పరీక్షలు, ఉచిత స్కానింగ్ (USG) & ల్యాబ్ టెస్టులు",
    target_beneficiary: "All Pregnant Women in their 2nd and 3rd trimesters across Andhra Pradesh",
    target_beneficiary_te: "2వ మరియు 3వ త్రైమాసికంలో ఉన్న గర్భిణీ స్త్రీలందరూ",
    application_mode: "Walk-in on the 9th of every month at any Govt PHC, CHC, Area Hospital or District Hospital",
    application_mode_te: "ప్రతినెల 9వ తేదీన సమీప ప్రభుత్వ ప్రాథమిక, సామాజిక లేదా జిల్లా ఆసుపత్రికి వెళ్లడం",
    processing_time: "Same-day comprehensive specialist package on 9th of every month",
    processing_time_te: "9వ తేదీన అదే రోజున పూర్తి వైద్య పరీక్షలు మరియు రిపోర్టులు",
    facility_type: "Designated PMSMA Clinics at Government Health Facilities and Empanelled Private Voluntarily Participating Gynaecologists",
    facility_type_te: "ప్రభుత్వ ఆసుపత్రులు మరియు స్వచ్ఛందంగా పాల్గొనే ప్రైవేట్ గైనకాలజిస్టులు",
    validity_period: "Throughout pregnancy from 4th month to delivery",
    validity_period_te: "గర్భధారణ 4వ నెల నుండి ప్రసవం వరకు ప్రతి నెలా 9వ తేదీన",
    helpline_numbers: ["104 (Maternal Health Helpline)", "1800-11-2016 (PMSMA Toll-Free)"],
    key_treatments: [
      "Comprehensive Examination by Gynaecologist / Obstetrician",
      "Free Obstetric Ultrasound Scanning (USG) for fetal growth and anomaly screening",
      "Free Laboratory Investigations (Blood Grouping, Hb, Blood Sugar, Urine Albumin, HIV, Syphilis, Hepatitis B)",
      "Identification and Red-Sticker Flagging of High-Risk Pregnancies (HRP)",
      "Free Iron-Folic Acid, Calcium tablets and dietary nutrition counseling"
    ],
    key_treatments_te: [
      "గైనకాలజిస్ట్ (స్త్రీల వైద్య నిపుణులు) ద్వారా సమగ్ర వైద్య పరీక్షలు",
      "శిశువు ఎదుగుదలను పరిశీలించే 100% ఉచిత అల్ట్రాసౌండ్ స్కానింగ్",
      "రక్తహీనత, షుగర్, బీపీ, హెపటైటిస్ తదితర పూర్తి ఉచిత ల్యాబ్ పరీక్షలు",
      "అధిక ప్రమాదం ఉన్న గర్భిణులను (High Risk) గుర్తించి ఎరుపు రంగు స్టిక్కర్ తో ప్రత్యేక పర్యవేక్షణ",
      "ఉచిత కాల్షియం, ఐరన్ మాత్రలు మరియు పౌష్టికాహార సలహాలు"
    ],
    exclusions: "Non-pregnant general gynaecological consultations on PMSMA day (held for antenatal mothers).",
    exclusions_te: "9వ తేదీన కేవలం గర్భిణీ తల్లులకు ప్రాధాన్యత ఇవ్వబడుతుంది."
  },
  "Pradhan Mantri Matru Vandana Yojana (PMMVY)": {
    coverage_type: "Direct Benefit Transfer (DBT) Maternity Cash Incentive for First & Second Child",
    coverage_type_te: "గర్భిణీ తల్లులకు ₹5,000 నుండి ₹6,000 నేరుగా బ్యాంక్ బదిలీ (PMMVY)",
    benefit_amount: "₹5,000 in two installments for 1st child; ₹6,000 in single installment if 2nd child is a girl",
    benefit_amount_te: "మొదటి కాన్పుకు ₹5,000; రెండవ కాన్పులో ఆడపిల్ల పుడితే ₹6,000 బ్యాంక్ ఖాతాలో జమ",
    target_beneficiary: "Pregnant Women & Lactating Mothers belonging to socially/economically disadvantaged sections",
    target_beneficiary_te: "ఆర్థికంగా వెనుకబడిన, రేషన్ కార్డు కలిగిన గర్భిణులు మరియు బాలింతలు",
    application_mode: "Online at pmmvy.wcd.gov.in or through Village ANM / Anganwadi Worker at Sachivalayam",
    application_mode_te: "గ్రామ సచివాలయంలో ఏఎన్ఎం / అంగన్‌వాడీ ద్వారా లేదా pmmvy.wcd.gov.in పోర్టల్ ద్వారా",
    processing_time: "Direct installment credit to Aadhaar-seeded bank account within 30 days of stage verification",
    processing_time_te: "నమోదు మరియు పరీక్షల ధృవీకరణ పూర్తయిన 30 రోజుల్లో నేరుగా ఖాతాలో జమ",
    facility_type: "Anganwadi Centres, Village Secretariats & Govt Health Centres",
    facility_type_te: "అంగన్‌వాడీ కేంద్రాలు, గ్రామ సచివాలయాలు మరియు ప్రభుత్వ ఆరోగ్య కేంద్రాలు",
    validity_period: "From early pregnancy registration up to completion of 1st cycle of child vaccination",
    validity_period_te: "గర్భం దాల్చినప్పటి నుండి బిడ్డ మొదటి విడత టీకాలు పూర్తయ్యే వరకు",
    helpline_numbers: ["104 (Health Information)", "011-23382393 (PMMVY Helpdesk)", "14408 (Poshan Helpline)"],
    key_treatments: [
      "1st Installment (₹3,000) on Early ANC Registration & at least one ANC checkup within 6 months",
      "2nd Installment (₹2,000) upon Child Birth Registration and completion of 1st cycle of vaccinations (BCG, OPV, DPT, Hep B)",
      "Special Girl Child Incentive: ₹6,000 single installment for second girl child to promote child sex ratio",
      "Wage compensation for resting during advanced pregnancy and breastfeeding",
      "Improved institutional health-seeking behaviour"
    ],
    key_treatments_te: [
      "మొదటి విడత (₹3,000): గర్భం దాల్చిన 6 నెలల్లోపు నమోదు చేసుకుని కనీసం ఒకసారి వైద్య పరీక్ష చేయించుకున్నప్పుడు",
      "రెండవ విడత (₹2,000): బిడ్డ పుట్టిన తర్వాత జనన నమోదు చేసి మొదటి విడత టీకాలు వేయించినప్పుడు",
      "రెండవ కాన్పులో ఆడపిల్ల పుడితే ఒకే విడతలో ₹6,000 ప్రత్యేక ప్రోత్సాహకం",
      "గర్భిణి విశ్రాంతి సమయంలో వేతన నష్టపరిహారంగా ఆర్థిక రక్షణ",
      "ఆసుపత్రుల్లో సురక్షిత కాన్పులను ప్రోత్సహించే ప్రత్యక్ష ప్రయోజనం"
    ],
    exclusions: "Regular Central or State Government employees and Public Sector Undertaking (PSU) employees.",
    exclusions_te: "ప్రభుత్వ మరియు పబ్లిక్ సెక్టార్ శాశ్వత ఉద్యోగులకు ఈ నగదు సాయం వర్తించదు."
  },
  "YSR Village Health Clinics": {
    coverage_type: "Permanent Village-Level Primary Healthcare, 14 Diagnostics, 67 Essential Drugs & Telemedicine",
    coverage_type_te: "గ్రామంలోనే 24x7 శాశ్వత విలేజ్ క్లినిక్, 14 పరీక్షలు & 67 మందులు",
    benefit_amount: "100% Free Daily Clinic Services, Community Health Officer (CHO) Care & Tele-Consultation",
    benefit_amount_te: "100% ఉచిత వైద్య సేవలు, కమ్యూనిటీ హెల్త్ ఆఫీసర్ సంరక్షణ మరియు ఉచిత మందులు",
    target_beneficiary: "All Rural Citizens residing in Grama Panchayats across Andhra Pradesh",
    target_beneficiary_te: "ఆంధ్రప్రదేశ్‌లోని గ్రామీణ పంచాయతీలలో నివసించే పౌరులందరూ",
    application_mode: "Walk-in at local YSR Village Health Clinic (attached to Grama Sachivalayam)",
    application_mode_te: "గ్రామ సచివాలయం పక్కనే ఉన్న విలేజ్ హెల్త్ క్లినిక్‌కు నేరుగా వెళ్లడం",
    processing_time: "Immediate on-site testing and consultation (Open 9:00 AM to 4:00 PM)",
    processing_time_te: "వెంటనే బీపీ, షుగర్ పరీక్షలు మరియు ఉచిత మందుల పంపిణీ",
    facility_type: "State-of-the-art Village Health Clinics with dedicated MLHP/CHO, ANM and ASHA network",
    facility_type_te: "గ్రామాల్లోని సుసజ్జిత విలేజ్ హెల్త్ క్లినిక్‌లు (MLHP/CHO మరియు ఏఎన్ఎం)",
    validity_period: "Continuous daily village primary healthcare",
    validity_period_te: "ప్రతిరోజూ గ్రామ ప్రజలకు నిరంతర ప్రాథమిక వైద్య సేవలు",
    helpline_numbers: ["104 (Health Helpline)", "1902 (CM Citizen Helpline)"],
    key_treatments: [
      "Daily Outpatient Services by Community Health Officer (B.Sc Nursing / MLHP)",
      "14 Point-of-Care Diagnostic Tests (BP, Blood Glucose, Haemoglobin, Urine Pregnancy, Malaria RDT)",
      "Free 67 Essential Generic Drugs dispensing",
      "Doctor-to-Doctor Tele-Consultations connecting patients directly with PHC/Medical College Specialists",
      "Routine Antenatal, Postnatal and Child Immunization sessions at village level"
    ],
    key_treatments_te: [
      "కమ్యూనిటీ హెల్త్ ఆఫీసర్ ద్వారా ప్రతిరోజూ ఉచిత వైద్య పరీక్షలు",
      "గ్రామంలోనే 14 రకాల తక్షణ రక్త, మూత్ర పరీక్షలు",
      "67 రకాల ఉచిత అత్యవసర మందుల అందజేత",
      "టెలి-మెడిసిన్ ద్వారా పెద్దాసుపత్రి స్పెషలిస్ట్ డాక్టర్లతో నేరుగా వీడియో సంప్రదింపులు",
      "గ్రామ గర్భిణులకు పరీక్షలు మరియు పిల్లలకు సార్వత్రిక టీకాలు"
    ],
    exclusions: "Major inpatient surgeries and trauma resuscitations (linked seamlessly via 108 to Network Hospitals).",
    exclusions_te: "పెద్ద ఆపరేషన్లు ఉన్న రోగులను 108 ద్వారా పెద్దాసుపత్రులకు తరలిస్తారు."
  },
  "AP Organ Donation Programme (Jeevandan)": {
    coverage_type: "State Deceased Organ Donation Registry, Cadavre Allocation & Transplant Network",
    coverage_type_te: "ఆంధ్రప్రదేశ్ 'జీవన్‌దాన్' అవయవ దానం & అవయవ మార్పిడి సమన్వయం",
    benefit_amount: "Priceless Life-Saving Organ Allocation with Free Surgeries for BPL Patients under Aarogyasri",
    benefit_amount_te: "ప్రాణ రక్షణ అవయవాల పారదర్శక కేటాయింపు మరియు ఆరోగ్యశ్రీ ద్వారా ఉచిత సర్జరీలు",
    target_beneficiary: "End-Stage Organ Failure Patients on state waitlist and altruistic organ donor families in AP",
    target_beneficiary_te: "అవయవాలు ఫెయిల్ అయిన రోగులు మరియు అవయవదానం చేయాలనుకునే దాతలు",
    application_mode: "Online Donor Pledge at jeevandan.ap.gov.in or Patient Waitlist Registration via Transplant Hospital",
    application_mode_te: "jeevandan.ap.gov.in లో డోనర్ ప్రతిజ్ఞ లేదా ఆసుపత్రి ద్వారా వెయిట్‌లిస్ట్‌లో నమోదు",
    processing_time: "Instant donor card download; waitlist allocation strictly as per state computerized score",
    processing_time_te: "వెంటనే డోనర్ కార్డు డౌన్‌లోడ్; పారదర్శక కంప్యూటర్ స్కోర్ ఆధారంగా అవయవాల కేటాయింపు",
    facility_type: "Empanelled Organ Transplant Centres in Visakhapatnam, Vijayawada, Guntur, Tirupati & Kurnool",
    facility_type_te: "విశాఖపట్నం, విజయవాడ, గుంటూరు, తిరుపతి, కర్నూలులలోని గుర్తింపు పొందిన ట్రాన్స్‌ప్లాంట్ ఆసుపత్రులు",
    validity_period: "Active waitlist status with ongoing clinical updates",
    validity_period_te: "అవయవం లభించే వరకు వెయిట్‌లిస్ట్‌లో నిరంతర పర్యవేక్షణ",
    helpline_numbers: ["104 (Health Helpline)", "1800-425-7778 (Jeevandan Hotline)"],
    key_treatments: [
      "Deceased Donor (Brain-Stem Death) Organ Retrieval: Kidneys, Liver, Heart, Lungs, Pancreas, Corneas",
      "Equitable and transparent computerized allocation as per NOTTO/SOTTO guidelines",
      "Green Corridor Fast-Track Inter-City Organ Transport with Police Escort",
      "Grief Counseling and Family Support for deceased donor kin",
      "State honours for cadaver organ donor families"
    ],
    key_treatments_te: [
      "బ్రెయిన్ డెడ్ దాతల నుండి కిడ్నీలు, కాలేయం, గుండె, ఊపిరితిత్తులు, కళ్ళ సేకరణ",
      "కంప్యూటరైజ్డ్ విధానంలో ఎవరికీ అన్యాయం జరగకుండా పారదర్శక అవయవాల కేటాయింపు",
      "పోలీసు ఎస్కార్ట్ తో ట్రాఫిక్ లేని 'గ్రీన్ కారిడార్' ద్వారా అవయవాల వేగవంతమైన రవాణా",
      "దాత కుటుంబాలకు ప్రత్యేక కౌన్సిలింగ్ మరియు ప్రభుత్వ గౌరవ మర్యాదలు",
      "ఆరోగ్యశ్రీ కింద పేద రోగులకు ఉచిత అవయవ మార్పిడి శస్త్రచికిత్సలు"
    ],
    exclusions: "Commercial paid organ trade is strictly illegal and severely punishable under Indian law.",
    exclusions_te: "అవయవాల క్రయవిక్రయాలు చట్టరీత్యా నేరం."
  },
  "National Mental Health Programme (NMHP)": {
    coverage_type: "District Mental Health Services, Life Skills, Suicide Prevention & Free Psychiatric Drugs",
    coverage_type_te: "జిల్లా మానసిక ఆరోగ్య సేవలు, కౌన్సిలింగ్ & ఉచిత సైకియాట్రిక్ మందులు",
    benefit_amount: "100% Free Psychiatric OPD, Clinical Counseling, Day Care Rehabilitation & Psychotropic Drugs",
    benefit_amount_te: "100% ఉచిత మానసిక వైద్య పరీక్షలు, కౌన్సిలింగ్ మరియు ఉచిత మందులు",
    target_beneficiary: "Individuals suffering from Depression, Schizophrenia, Bipolar Disorder, Anxiety, Substance Abuse, Epilepsy",
    target_beneficiary_te: "డిప్రెషన్, ఆందోళన, నిద్రలేమి, తీవ్ర మానసిక సమస్యలు లేదా వ్యసనాలతో బాధపడుతున్నవారు",
    application_mode: "Walk-in at District Mental Health Clinic (DMHP) in District Hospital or Tele-MANAS (14416)",
    application_mode_te: "జిల్లా ఆసుపత్రిలోని మానసిక ఆరోగ్య విభాగం లేదా 14416 టెలి-మానస్ కాల్ ద్వారా",
    processing_time: "Immediate clinical consultation and same-day medicine initiation",
    processing_time_te: "హాజరైన వెంటనే డాక్టర్ పరీక్ష మరియు ఉచిత మందుల పంపిణీ",
    facility_type: "District Mental Health Programme (DMHP) Units, Government Psychiatric Hospitals & Medical Colleges",
    facility_type_te: "జిల్లా మానసిక ఆరోగ్య కేంద్రాలు మరియు విశాఖపట్నం మానసిక వైద్యశాల",
    validity_period: "Continuous long-term clinical maintenance and relapse prevention",
    validity_period_te: "పూర్తిగా కోలుకునే వరకు నిరంతర ఉచిత చికిత్స మరియు కౌన్సిలింగ్",
    helpline_numbers: ["14416 (Tele-MANAS Toll-Free 24x7)", "104 (Health Helpline)", "1800-891-4416"],
    key_treatments: [
      "Specialist Psychiatric Outpatient and Inpatient Care",
      "Free Supply of Essential Psychotropic Medications (Antidepressants, Antipsychotics, Mood Stabilizers, Anti-epileptics)",
      "Individual Psychotherapy, Cognitive Behavioral Therapy (CBT) & Family Counseling",
      "De-addiction Clinic for Alcohol and Substance Dependence",
      "Suicide Prevention and Crisis Intervention Counseling"
    ],
    key_treatments_te: [
      "సైకియాట్రిస్ట్ నిపుణుల ద్వారా ఓపీడీ మరియు ఇన్‌పేషెంట్ సంరక్షణ",
      "డిప్రెషన్, ఫిట్స్, నిద్రలేమి నివారణకు 100% ఉచిత సైకియాట్రిక్ మందులు",
      "సైకోథెరపీ, బిహేవియరల్ థెరపీ (CBT) మరియు కుటుంబ కౌన్సిలింగ్",
      "మద్యపానం మరియు మత్తు పదార్థాల వ్యసన విముక్తి చికిత్సలు",
      "ఆత్మహత్యల నివారణ మరియు అత్యవసర మానసిక సహాయ సేవలు"
    ],
    exclusions: "Involuntary detention without competent medical board certification as per Mental Healthcare Act 2017.",
    exclusions_te: "చట్టపరమైన నిబంధనల ప్రకారం రోగి హక్కులకు పూర్తి రక్షణ ఉంటుంది."
  },
  "National Programme for Health Care of the Elderly (NPHCE)": {
    coverage_type: "Dedicated Geriatric Healthcare Clinics, Physiotherapy, Home Care & Free Assistive Devices",
    coverage_type_te: "వృద్ధుల ప్రత్యేక ఆరోగ్య క్లినిక్‌లు, ఫిజియోథెరపీ & ఉచిత సంరక్షణ (NPHCE)",
    benefit_amount: "100% Free Dedicated Geriatric OPD, 10-Bed Geriatric Ward, Free Physiotherapy & Chronic Medications",
    benefit_amount_te: "100% ఉచిత వృద్ధుల ఓపీడీ, ప్రత్యేక వార్డులు, ఉచిత ఫిజియోథెరపీ & మందులు",
    target_beneficiary: "All Senior Citizens aged 60 years and above in Andhra Pradesh",
    target_beneficiary_te: "60 సంవత్సరాలు పైబడిన ఆంధ్రప్రదేశ్ వృద్ధ పౌరులందరూ",
    application_mode: "Walk-in with priority queue at Geriatric OPD in District Hospital, CHC or PHC",
    application_mode_te: "ప్రభుత్వ ఆసుపత్రిలోని వృద్ధుల ప్రత్యేక క్యూ లైన్ / జెరియాట్రిక్ ఓపీడీలో",
    processing_time: "Fast-track priority consultation with zero waiting for senior citizens",
    processing_time_te: "వృద్ధులకు ప్రత్యేక ప్రాధాన్యతతో వేగవంతమైన వైద్య పరీక్షలు",
    facility_type: "Geriatric Units in District Hospitals, Regional Geriatric Centres & Government Teaching Hospitals",
    facility_type_te: "జిల్లా ఆసుపత్రులలోని ప్రత్యేక వృద్ధుల వార్డులు మరియు పీహెచ్‌సీలు",
    validity_period: "Continuous lifelong senior care and domiciliary nurse visits for bedridden elders",
    validity_period_te: "జీవితాంతం నిరంతర సంరక్షణ మరియు మంచానికే పరిమితమైన వృద్ధులకు ఇంటి వద్దే వైద్యం",
    helpline_numbers: ["14567 (Elderline National Senior Citizens Helpline)", "104 (Health Advice)", "1902 (Grievance)"],
    key_treatments: [
      "Dedicated Senior Citizen Fast-Track OPD and 10-Bed Inpatient Geriatric Wards",
      "Free Physiotherapy and Rehabilitation for arthritis, stroke paralysis, and mobility disorders",
      "Screening and Long-term Management of Hypertension, Diabetes, Dementia, Alzheimer's, Parkinson's",
      "Domiciliary / Home-based Palliative Care for bedridden elderly citizens",
      "Free Prescription Walking Sticks, Hearing Aids and Spectacles linkage"
    ],
    key_treatments_te: [
      "వృద్ధుల కోసం ప్రత్యేక ఓపీడీ మరియు 10 పడకల ప్రత్యేక ఆసుపత్రి వార్డులు",
      "కీళ్ల నొప్పులు, పక్షవాతం కోసం ఉచిత ఫిజియోథెరపీ మరియు వ్యాయామ శిక్షణ",
      "బీపీ, షుగర్, మతిమరుపు (డిమెన్షియా), పార్కిన్సన్స్ వ్యాధులకు ఉచిత మందులు",
      "మంచానికే పరిమితమైన వృద్ధులకు ఇంటి వద్దకే వచ్చి నర్సింగ్ సేవలు",
      "ఉచిత చేతికర్రలు, వినికిడి యంత్రాలు మరియు కళ్ళద్దాల అందజేత"
    ],
    exclusions: "Commercial paid private nursing homes without government health accreditation.",
    exclusions_te: "ప్రభుత్వ ఆరోగ్య కేంద్రాల ద్వారా ఈ సేవలు పూర్తిగా ఉచితంగా లభిస్తాయి."
  }
};

// Function to update a json file safely
function updateJsonFile(filename, enrichments) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${filename} not found.`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  let updatedCount = 0;

  for (const [schemeName, schemeObj] of Object.entries(data)) {
    const enrich = enrichments[schemeName] || schemeEnrichments[schemeName];
    if (enrich) {
      Object.assign(schemeObj, enrich);
      updatedCount++;
    } else {
      // Provide standard default structured enrichments based on category / level
      const isAP = schemeObj.level === 'Andhra Pradesh';
      
      if (!schemeObj.coverage_type) {
        schemeObj.coverage_type = isAP ? "State Healthcare Welfare & Free Medical Services" : "National Health Programme & Free Services";
        schemeObj.coverage_type_te = isAP ? "ఆంధ్రప్రదేశ్ ప్రభుత్వ ఉచిత వైద్య సేవలు" : "జాతీయ ఆరోగ్య పథకం & ఉచిత సేవలు";
      }
      if (!schemeObj.benefit_amount) {
        schemeObj.benefit_amount = "100% Free Service / Financial Support as per government guidelines";
        schemeObj.benefit_amount_te = "ప్రభుత్వ నిబంధనల ప్రకారం 100% ఉచిత సేవలు / ఆర్థిక సహాయం";
      }
      if (!schemeObj.target_beneficiary) {
        schemeObj.target_beneficiary = isAP ? "Eligible Citizens & Families in Andhra Pradesh" : "Eligible Citizens across India";
        schemeObj.target_beneficiary_te = isAP ? "ఆంధ్రప్రదేశ్‌లోని అర్హులైన పౌరులు & కుటుంబాలు" : "భారతదేశంలోని అర్హులైన పౌరులు";
      }
      if (!schemeObj.application_mode) {
        schemeObj.application_mode = isAP ? "Grama/Ward Sachivalayam, PHC or Empanelled Hospital" : "Govt Health Facility / Dedicated Portal";
        schemeObj.application_mode_te = isAP ? "గ్రామ/వార్డు సచివాలయం లేదా సమీప ప్రభుత్వ ఆసుపత్రి" : "ప్రభుత్వ ఆరోగ్య కేంద్రం లేదా అధికారిక పోర్టల్";
      }
      if (!schemeObj.processing_time) {
        schemeObj.processing_time = "Standard government processing timeline (Immediate to 7 days)";
        schemeObj.processing_time_te = "ప్రభుత్వ మార్గదర్శకాల ప్రకారం తక్షణమే లేదా 7 పని దినాల్లో";
      }
      if (!schemeObj.facility_type) {
        schemeObj.facility_type = "Government Primary, Secondary and Tertiary Health Facilities";
        schemeObj.facility_type_te = "ప్రభుత్వ ప్రాథమిక, సామాజిక మరియు జిల్లా ఆసుపత్రులు";
      }
      if (!schemeObj.validity_period) {
        schemeObj.validity_period = "Continuous / As per program duration";
        schemeObj.validity_period_te = "నిరంతరం / పథకం మార్గదర్శకాల ప్రకారం";
      }
      if (!schemeObj.helpline_numbers || schemeObj.helpline_numbers.length === 0) {
        schemeObj.helpline_numbers = ["104 (Health Helpline)", "1902 (Citizen Grievance Helpline)"];
      }
      if (!schemeObj.key_treatments || schemeObj.key_treatments.length === 0) {
        schemeObj.key_treatments = [
          "Free Diagnostic Consultation & Clinical Evaluation",
          "Free Essential Generic Medicines & Consumables",
          "Specialized Care Referral & Follow-up Support"
        ];
        schemeObj.key_treatments_te = [
          "ఉచిత వైద్య పరీక్షలు మరియు డాక్టర్ సంప్రదింపులు",
          "ఉచిత నాణ్యమైన జెనరిక్ మందుల పంపిణీ",
          "స్పెషలిస్ట్ వైద్యం కొరకు రిఫరల్ మరియు ఫాలో-అప్ సేవలు"
        ];
      }
      if (!schemeObj.exclusions) {
        schemeObj.exclusions = "Non-empanelled private commercial setups without official authorization.";
        schemeObj.exclusions_te = "అధికారిక అనుమతి లేని ప్రైవేట్ వాణిజ్య కేంద్రాలు వర్తించవు.";
      }
      updatedCount++;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${updatedCount} schemes in ${filename}`);
}

// Update all 4 JSON files
updateJsonFile('health.json', schemeEnrichments);
updateJsonFile('ap_flagship_schemes.json', schemeEnrichments);
updateJsonFile('extra_schemes.json', schemeEnrichments);
updateJsonFile('national_and_ap_schemes.json', schemeEnrichments);

console.log('All 4 scheme database files enriched successfully!');
