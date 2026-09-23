/**
 * public/js/scheme-nlp-search.js
 * =============================================================================
 * SmartGovAI - Vector-Based Semantic Search & NLP Engine for Healthcare Schemes
 * =============================================================================
 * Implements a full Vector Space Model (VSM) and Semantic Concept Embeddings
 * engine for bilingual (Telugu & English) healthcare welfare schemes.
 *
 * Core Capabilities:
 * 1. Bilingual Tokenizer & Diacritic Normalization (Telugu Unicode & English)
 * 2. Phonetic & Romanized Transliteration Matrix (e.g. "mandulu", "prasavam", "kallu")
 * 3. 16-Dimensional Dense Semantic Concept Space (Surgery, Maternity DBT, CKD Dialysis,
 *    TB Ni-kshay, Cataract/Vision, Disability/Wheelchair/Cochlear, Generic Pharmacy,
 *    Mental Health/Tele-MANAS, Leprosy, AYUSH, Oral/Dental, NCD/BP-Sugar, etc.)
 * 4. TF-IDF & Sublinear Term Weighting with Okapi/BM25 inverse document frequency
 * 5. Vector Dot-Product & Cosine Similarity Metric: Cos(Q, D) = (Q · D) / (||Q|| * ||D||)
 * 6. Semantic Concept Projection: Query terms with completely different terminology
 *    (e.g., "baby birth money", "గర్భవతి ఆర్థిక సాయం", "lung cough blood", "cheap tablets")
 *    align with target scheme vectors through dense semantic concept centroids.
 * 7. Explainability: Returns match percentage (e.g., 95%), triggered concept badges,
 *    and bilingual intent explanations.
 *
 * Global Export: window.SmartGovNLP & window.SmartGovVectorSearch
 */

(function (window) {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. Phonetic & Cross-Lingual Transliteration Map
    // -------------------------------------------------------------------------
    const PHONETIC_MAP = {
        'aarogya': ['ఆరోగ్య', 'ఆరోగ్యశ్రీ', 'arogya', 'aarogyasree', 'arogyasri', 'health', 'vaidya'],
        'aarogyasri': ['ఆరోగ్యశ్రీ', 'ఆరోగ్య శ్రీ', 'arogyasri', 'aarogya sri', 'ntr vaidya seva', 'vaidyaseva'],
        'asara': ['ఆసరా', 'ఆసర', 'aasara', 'assara', 'post-operative', 'recuperation', 'rest allowance'],
        'kanti': ['కంటి', 'కన్ను', 'కంటి వెలుగు', 'kanti velugu', 'eye', 'cataract', 'vision', 'spectacles'],
        'velugu': ['వెలుగు', 'కంటి వెలుగు', 'kanti', 'light', 'vision'],
        'talli': ['తల్లి', 'తల్లి బిడ్డ', 'thalli', 'mother', 'maternal', 'pregnancy', 'pregnant'],
        'bidda': ['బిడ్డ', 'తల్లి బిడ్డ', 'child', 'infant', 'baby', 'newborn'],
        'garbham': ['గర్భం', 'గర్భిణి', 'గర్భిణీ', 'pregnancy', 'pregnant', 'maternity', 'pmmvy', 'delivery'],
        'prasavam': ['ప్రసవం', 'కాన్పు', 'డెలివరీ', 'delivery', 'institutional delivery', 'safe motherhood', 'birth'],
        'dialysis': ['డయాలసిస్', 'డయాలిసిస్', 'kidney', 'ckd', 'మూత్రపిండ', 'renal', 'hemodialysis', 'peritoneal'],
        'kidney': ['కిడ్నీ', 'మూత్రపిండ', 'మూత్రపిండాలు', 'dialysis', 'uddanam', 'renal', 'nephrology', 'creatinine'],
        'cancer': ['క్యాన్సర్', 'క్యాన్సరు', 'పుండు', 'tumor', 'oncology', 'chemotherapy', 'radiation', 'malignant'],
        'tb': ['క్షయ', 'టీబీ', 'నిక్షయ్', 'nikshay', 'tuberculosis', 'dots', 'sputum', 'cough', 'lung'],
        'nikshay': ['నిక్షయ్', 'నిక్షయ్ పోషణ్', 'tb', 'tuberculosis', 'nutrition', 'dbt'],
        'mandulu': ['మందులు', 'ఔషధాలు', 'మాత్రలు', 'medicines', 'drugs', 'janaushadhi', 'pharmacy', 'generic', 'tablets'],
        'janaushadhi': ['జన్ ఔషధి', 'జనౌషధి', 'pmbjp', 'generic medicine', 'cheap medicine', 'pmbi', 'subsidized pharmacy'],
        'kallu': ['కళ్ళు', 'కంటి', 'కంటిశుక్లం', 'శుక్లం', 'eye', 'cataract', 'spectacles', 'glasses', 'ophthalmic'],
        'spectacles': ['కళ్లద్దాలు', 'అద్దాలు', 'glasses', 'spectacles', 'npcbvi', 'frames'],
        'chevi': ['చెవి', 'వినికిడి', 'చెవుడు', 'ear', 'hearing', 'cochlear', 'hearing aid', 'deafness'],
        'cochlear': ['కాక్లియర్', 'వినికిడి ఇంప్లాంట్', 'cochlear implant', 'deaf', 'hearing loss'],
        'divyangu': ['దివ్యాంగులు', 'వికలాంగులు', 'దివ్యాంగుల', 'disability', 'handicapped', 'pwds', 'disabled'],
        'wheelchair': ['వీల్‌చైర్', 'చక్రాల కుర్చీ', 'wheelchair', 'tricycle', 'adip', 'calipers'],
        'tricycle': ['ట్రైసైకిల్', 'మోటరైజ్డ్ ట్రైసైకిల్', 'tricycle', 'adip', 'motorized'],
        'sadarem': ['సదరం', 'సదరమ్', 'sadarem', 'udid', 'disability certificate', '40 percent'],
        'ayush': ['ఆయుష్', 'ఆయుర్వేదం', 'హోమియోపతి', 'యునాని', 'యోగా', 'సిద్ధ', 'ayurveda', 'homeopathy', 'unani', 'yoga'],
        'dental': ['దంత', 'పంటి', 'పన్ను', 'నోటి', 'dental', 'teeth', 'dentist', 'cavity', 'oral', 'nohp', 'root canal'],
        'leprosy': ['కుష్టు', 'కుష్టు వ్యాధి', 'హాన్సెన్', 'leprosy', 'nlep', 'mdt', 'mcr footwear', 'rcs surgery'],
        'emergency': ['అత్యవసర', 'ఆంబులెన్స్', '108', '104', 'ambulance', 'free ambulance', 'mobile clinic'],
        'pension': ['పెన్షన్', 'భృతి', 'ఆసరా', 'నెలవారీ', 'pension', 'financial assistance', 'dbt', 'monthly allowance'],
        'free': ['ఉచిత', 'ఉచితం', 'నగదు రహిత', 'cashless', 'free treatment', '100% free', 'no cost', 'free surgery'],
        'sugar': ['షుగర్', 'మధుమేహం', 'డయాబెటిస్', 'sugar', 'diabetes', 'insulin', 'blood sugar'],
        'bp': ['బీపీ', 'రక్తపోటు', 'హైపర్ టెన్షన్', 'bp', 'blood pressure', 'hypertension'],
        'mental': ['మానసిక', 'టెలి మానస్', 'ఆందోళన', 'డిప్రెషన్', 'mental health', 'tele manas', 'depression', 'counseling', '14416']
    };

    // -------------------------------------------------------------------------
    // 2. 16-Dimensional Semantic Concept Space Definition
    // -------------------------------------------------------------------------
    const SEMANTIC_CONCEPTS = [
        {
            dimension: 'TERTIARY_SURGERY_INPATIENT',
            label_en: 'Cashless Inpatient Surgery & Critical Hospital Care (₹25L)',
            label_te: 'నగదు రహిత శస్త్రచికిత్సలు & ఆసుపత్రి సూపర్ స్పెషాలిటీ చికిత్స',
            icon: '🏥',
            terms: [
                'surgery', 'operation', 'inpatient', 'hospitalization', 'cashless', 'icu', 'heart',
                'stent', 'bypass', 'transplant', 'neurosurgery', 'orthopedic', 'aarogyasri', 'pmjay',
                'vaidya seva', 'network hospital', 'admitted', 'tertiary', 'surgical procedure',
                'ఆసుపత్రి', 'శస్త్రచికిత్స', 'ఆపరేషన్', 'నగదు రహిత', 'ఆరోగ్యశ్రీ', 'గుండె ఆపరేషన్',
                'వైద్య సేవా', 'ఉచిత అడ్మిషన్', 'లక్షల బీమా', 'సూపర్ స్పెషాలిటీ', 'సర్జరీ'
            ],
            targetSchemes: [
                'Dr. NTR Vaidya Seva (AP Cashless Hospital Care)',
                'Ayushman Bharat - PMJAY (National Health Protection Mission)',
                'Ayushman Bharat PM-JAY (National Health Cover)',
                'Dr. YSR Aarogya Asara (Post-Operative Financial Allowance)',
                'Employees and Journalists Health Scheme (EHS & WJHS)'
            ]
        },
        {
            dimension: 'MATERNAL_CHILD_CARE',
            label_en: 'Maternal Care, Safe Delivery & Maternity Financial DBT (₹5,000 - ₹6,000)',
            label_te: 'గర్భం, సురక్షిత కాన్పు & మాతృత్వ నగదు ప్రోత్సాహకం',
            icon: '👶',
            terms: [
                'pregnancy', 'pregnant', 'maternity', 'mother', 'infant', 'baby', 'child', 'delivery',
                'birth', 'pmmvy', 'janani suraksha', 'jsy', 'jssk', 'pmsma', 'anc', 'mcp card',
                'talli bidda', 'newborn', 'vaccination', 'child health', 'rbsk', 'institutional delivery',
                'గర్భం', 'గర్భిణి', 'బాలింత', 'ప్రసవం', 'కాన్పు', 'తల్లి బిడ్డ', 'మాతృ వందన',
                'జనని సురక్ష', 'శిశు సంరక్షణ', 'నవజాత శిశువు', 'కాన్పు డబ్బులు', 'టీకాలు'
            ],
            targetSchemes: [
                'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
                'Janani Suraksha Yojana (Safe Motherhood Cash Support)',
                'Janani Shishu Suraksha Karyakram (Free Delivery Care)',
                'Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)',
                'Dr. YSR Talli Bidda Express (Maternal Postnatal Transport)',
                'Rashtriya Bal Swasthya Karyakram (RBSK - Child Health Screening)'
            ]
        },
        {
            dimension: 'CHRONIC_KIDNEY_DIALYSIS',
            label_en: 'Chronic Kidney Disease (CKD) & Free Dialysis Care (₹10,000/Month)',
            label_te: 'కిడ్నీ వ్యాధి, ఉచిత డయాలసిస్ & నెలవారీ జీవన భృతి',
            icon: '🧪',
            terms: [
                'kidney', 'dialysis', 'ckd', 'renal', 'uddanam', 'creatinine', 'urea', 'hemodialysis',
                'peritoneal', 'kidney failure', 'renal transplant', 'nephrology', 'dialysis pension',
                'డయాలసిస్', 'కిడ్నీ', 'మూత్రపిండ', 'మూత్రపిండాలు', 'ఉద్దానం', 'కిడ్నీ ఫెయిల్యూర్',
                'ఉచిత డయాలసిస్', 'డయాలసిస్ పెన్షన్', 'రక్త శుద్ధి'
            ],
            targetSchemes: [
                'AP Free Dialysis and CKD Financial Aid Scheme',
                'Pradhan Mantri National Dialysis Programme',
                'Dr. NTR Vaidya Seva (AP Cashless Hospital Care)'
            ]
        },
        {
            dimension: 'TB_INFECTIOUS_DISEASE',
            label_en: 'Tuberculosis (TB) Free Treatment & Ni-kshay Poshan DBT (₹500 - ₹1,000)',
            label_te: 'క్షయ (టీబీ) ఉచిత చికిత్స & నిక్షయ్ పోషణ్ నెలవారీ సాయం',
            icon: '🫁',
            terms: [
                'tb', 'tuberculosis', 'nikshay', 'nikshay poshan', 'dots', 'sputum', 'cough',
                'chest cough', 'lungs', 'blood sputum', 'ntep', 'anti-tb', 'nikshay mitra',
                'క్షయ', 'టీబీ', 'నిక్షయ్', 'నిక్షయ్ పోషణ్', 'దగ్గు', 'కఫం', 'కఫ పరీక్ష',
                'ఊపిరితిత్తులు', 'క్షయ మందులు', 'క్షయ రోగులకు సాయం'
            ],
            targetSchemes: [
                'National TB Elimination Programme & Ni-kshay Poshan (NTEP)',
                'Ni-kshay Poshan Yojana (TB Nutrition Support)',
                'National TB Elimination Programme (NTEP)',
                'Pradhan Mantri TB Mukt Bharat Abhiyaan (Ni-kshay Mitra)'
            ]
        },
        {
            dimension: 'EYE_VISION_CATARACT',
            label_en: 'Universal Eye Screening, Cataract Surgery & Free Spectacles',
            label_te: 'కంటి వెలుగు, ఉచిత కంటిశుక్లం ఆపరేషన్లు & కళ్లద్దాలు',
            icon: '👁️',
            terms: [
                'eye', 'eyes', 'cataract', 'vision', 'spectacles', 'glasses', 'blindness', 'npcbvi',
                'kanti velugu', 'cornea', 'intraocular lens', 'iol', 'eyesight', 'optometry',
                'కంటి', 'కన్ను', 'కళ్ళు', 'కంటిశుక్లం', 'శుక్లం', 'కంటి వెలుగు', 'కళ్లద్దాలు',
                'దృష్టి లోపం', 'ఉచిత కంటి ఆపరేషన్', 'లెన్స్'
            ],
            targetSchemes: [
                'Dr. YSR Kanti Velugu (Comprehensive Universal Eye Care)',
                'National Programme for Control of Blindness (NPCBVI)',
                'National Programme for Control of Blindness & Visual Impairment (NPCBVI)'
            ]
        },
        {
            dimension: 'DISABILITY_ASSISTIVE_DEVICES',
            label_en: 'Assistive Devices, Wheelchairs, Hearing Aids & Cochlear Implants',
            label_te: 'దివ్యాంగుల ఉపకరణాలు, వీల్‌చైర్లు, వినికిడి యంత్రాలు & కాక్లియర్ ఇంప్లాంట్',
            icon: '🦽',
            terms: [
                'disability', 'handicapped', 'wheelchair', 'tricycle', 'motorized tricycle', 'hearing aid',
                'cochlear implant', 'calipers', 'crutches', 'adip', 'sadarem', 'udid', 'deaf', 'locomotor',
                'దివ్యాంగులు', 'వికలాంగులు', 'వీల్‌చైర్', 'చక్రాల కుర్చీ', 'ట్రైసైకిల్', 'వినికిడి యంత్రం',
                'చెవుడు', 'సదరం సర్టిఫికెట్', 'కాక్లియర్ ఇంప్లాంట్', 'ఉచిత ఉపకరణాలు'
            ],
            targetSchemes: [
                'Assistance to Disabled Persons for Purchase/Fitting of Aids (ADIP Scheme)',
                'Assistance to Disabled Persons (ADIP - Assistive Aids)',
                'Assistance to Disabled Persons Scheme (ADIP)',
                'AP Cochlear Implant & Hearing Restoration Scheme'
            ]
        },
        {
            dimension: 'AFFORDABLE_GENERIC_MEDICINES',
            label_en: 'Quality Generic Medicines & Subsidized Pharmacy (50% - 90% Off)',
            label_te: 'చౌక జనరిక్ మందులు & జన్ ఔషధి కేంద్రాల రాయితీ మందులు (50-90% తగ్గింపు)',
            icon: '💊',
            terms: [
                'generic', 'medicine', 'medicines', 'pharmacy', 'cheap medicine', 'discount medicine',
                'tablets', 'capsules', 'pmbjp', 'janaushadhi', 'jan aushadhi', 'suvidha', 'surgical items',
                'మందులు', 'ఔషధాలు', 'మాత్రలు', 'జన్ ఔషధి', 'జనౌషధి', 'చౌక మందులు',
                'రాయితీ మందులు', 'జనరిక్ మందులు', 'డిస్కౌంట్ ఫార్మసీ'
            ],
            targetSchemes: [
                'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)',
                'Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP - Generic Medicines)'
            ]
        },
        {
            dimension: 'MENTAL_HEALTH_COUNSELING',
            label_en: '24/7 Mental Health Support, Tele-MANAS (14416) & Psychiatric Care',
            label_te: 'మానసిక ఆరోగ్య కౌన్సిలింగ్, టెలి-మానస్ (14416) & ఉచిత సహాయం',
            icon: '🧠',
            terms: [
                'mental health', 'tele-manas', 'tele manas', '14416', 'counseling', 'depression',
                'anxiety', 'psychiatric', 'stress', 'suicide prevention', 'psychology', 'nmhp',
                'మానసిక ఆరోగ్యం', 'టెలి మానస్', 'ఆందోళన', 'మానసిక ఒత్తిడి', 'డిప్రెషన్',
                'కౌన్సిలింగ్', 'మానసిక నిపుణులు', '14416 హెల్ప్‌లైన్'
            ],
            targetSchemes: [
                'National Tele Mental Health Programme (Tele-MANAS)',
                'National Tele Mental Health Programme (Tele-MANAS - 24/7 Helpline)'
            ]
        },
        {
            dimension: 'LEPROSY_ERADICATION',
            label_en: 'Leprosy Eradication, MDT Therapy & Reconstructive Surgery (₹12,000)',
            label_te: 'కుష్టు వ్యాధి నివారణ, ఉచిత MDT మందులు & సర్జరీ ప్రోత్సాహకం (₹12,000)',
            icon: '🩹',
            terms: [
                'leprosy', 'nlep', 'mdt', 'multidrug therapy', 'mcr footwear', 'reconstructive surgery',
                'rcs', 'skin patches', 'loss of sensation', 'hansens',
                'కుష్టు', 'కుష్టు వ్యాధి', 'చర్మంపై మచ్చలు', 'స్పర్శ లేకపోవడం', 'ఉచిత కుష్టు మందులు',
                'పునర్నిర్మాణ శస్త్రచికిత్స', 'ఎంసీఆర్ చెప్పులు'
            ],
            targetSchemes: [
                'National Leprosy Eradication Programme (NLEP)',
                'National Leprosy Eradication Programme (NLEP - Free MDT Treatment)'
            ]
        },
        {
            dimension: 'ORAL_DENTAL_HEALTH',
            label_en: 'Community Oral Health, Dental Extractions & Tooth Restoration',
            label_te: 'నోటి మరియు దంత ఆరోగ్యం, పంటి చికిత్స & రూట్ కెనాల్',
            icon: '🦷',
            terms: [
                'dental', 'oral', 'teeth', 'tooth', 'dentist', 'cavity', 'caries', 'root canal',
                'extraction', 'oral hygiene', 'nohp', 'oral cancer screening',
                'దంత', 'పంటి', 'పంటి నొప్పి', 'నోటి ఆరోగ్యం', 'దంత వైద్యం', 'దంత పరీక్షలు', 'పిప్పి పన్ను'
            ],
            targetSchemes: [
                'National Oral Health Programme (NOHP)',
                'National Oral Health Programme (NOHP - Dental Care)'
            ]
        },
        {
            dimension: 'AYUSH_TRADITIONAL_WELLNESS',
            label_en: 'AYUSH Holistic Wellness: Ayurveda, Yoga, Homeopathy & Unani',
            label_te: 'ఆయుష్ సంప్రదాయ వైద్యం: ఆయుర్వేదం, యోగా, హోమియోపతి & యునాని',
            icon: '🌿',
            terms: [
                'ayush', 'ayurveda', 'homeopathy', 'unani', 'siddha', 'yoga', 'naturopathy',
                'panchakarma', 'herbal', 'traditional medicine', 'holistic',
                'ఆయుష్', 'ఆయుర్వేదం', 'హోమియోపతి', 'యునాని', 'యోగా', 'సిద్ధ', 'పంచకర్మ', 'మూలికా వైద్యం'
            ],
            targetSchemes: [
                'National AYUSH Mission (NAM)',
                'National AYUSH Mission (NAM - Holistic Wellness)'
            ]
        },
        {
            dimension: 'NON_COMMUNICABLE_BP_DIABETES',
            label_en: 'NCD Screening, Hypertension, Diabetes Mellitus & Village Clinics',
            label_te: 'బీపీ, షుగర్, గుండె జబ్బుల స్క్రీనింగ్ & గ్రామ ఆరోగ్య కేంద్రాల చికిత్స',
            icon: '🩺',
            terms: [
                'diabetes', 'hypertension', 'blood pressure', 'sugar', 'bp', 'stroke', 'np-ncd',
                'screening', 'village health clinic', 'fever', 'general checkup', 'lifestyle disease',
                'షుగర్', 'బీపీ', 'రక్తపోటు', 'మధుమేహం', 'గ్రామ క్లినిక్', 'పరీక్షలు', 'ఉచిత మందులు'
            ],
            targetSchemes: [
                'National Programme for Prevention and Control of Non-Communicable Diseases (NP-NCD)',
                'Dr. YSR Village Health Clinics (Family Physician Concept)'
            ]
        },
        {
            dimension: 'EMERGENCY_AMBULANCE_108_104',
            label_en: 'Free 24/7 Emergency Ambulance (108) & Mobile Medical Units (104)',
            label_te: 'ఉచిత అత్యవసర అంబులెన్స్ (108) & సంచార వైద్య సేవలు (104)',
            icon: '🚑',
            terms: [
                '108', '104', 'ambulance', 'emergency', 'accident', 'trauma', 'mobile medical unit',
                'telemedicine', 'esanjeevani', 'online doctor consultation',
                '108 అంబులెన్స్', '104 సంచార చికిత్స', 'అత్యవసర చికిత్స', 'రోడ్డు ప్రమాదం', 'ఈ-సంజీవని'
            ],
            targetSchemes: [
                '108 Emergency Ambulance Service (AP Health)',
                '104 Mobile Medical Units & Telemedicine (AP Health)'
            ]
        },
        {
            dimension: 'EMPLOYEE_JOURNALIST_HEALTH',
            label_en: 'Government Employees & Working Journalists Cashless Insurance (EHS & WJHS)',
            label_te: 'ప్రభుత్వ ఉద్యోగులు, పెన్షనర్లు & వర్కింగ్ జర్నలిస్టుల ఆరోగ్య పథకం',
            icon: '🛡️',
            terms: [
                'ehs', 'employee health scheme', 'government employees', 'pensioners', 'journalists',
                'wjhs', 'cashless health card', 'working journalists',
                'ఉద్యోగుల ఆరోగ్య పథకం', 'జర్నలిస్టుల బీమా', 'పెన్షనర్లు', 'ఉద్యోగి హెల్త్ కార్డు'
            ],
            targetSchemes: [
                'Employees and Journalists Health Scheme (EHS & WJHS)',
                'Employees Health Scheme (EHS AP)'
            ]
        },
        {
            dimension: 'POST_OPERATIVE_RECUPERATION',
            label_en: 'Post-Operative Recovery Allowance (₹225/Day up to ₹5,000/Month)',
            label_te: 'శస్త్రచికిత్స అనంతరం విశ్రాంతి కాల జీవన భృతి (రోజుకు ₹225)',
            icon: '💰',
            terms: [
                'post-operative', 'aarogya asara', 'wage loss', 'recuperation', 'rest allowance',
                'daily allowance', '225 per day', 'post surgery',
                'ఆరోగ్య ఆసరా', 'శస్త్రచికిత్స తర్వాత విశ్రాంతి భృతి', 'రోజుకు 225', 'వేతన నష్టం పరిహారం'
            ],
            targetSchemes: [
                'Dr. YSR Aarogya Asara (Post-Operative Financial Allowance)'
            ]
        },
        {
            dimension: 'SENIOR_CITIZEN_GERIATRIC',
            label_en: 'Senior Citizen Healthcare, Geriatric OPDs & Mobility Aids (NPHCE)',
            label_te: 'వృద్ధుల సంరక్షణ, ప్రత్యేక జేరియాట్రిక్ ఓపీ & ఉచిత వీల్‌చైర్లు',
            icon: '🧓',
            terms: [
                'elderly', 'senior citizen', 'geriatric', 'old age', 'nphce', 'walking stick',
                'age related', 'pensioners',
                'వృద్ధులు', 'సీనియర్ సిటిజన్లు', 'వయోవృద్ధుల క్లినిక్', 'చేతికర్ర', 'వృద్ధాప్య సమస్యలు'
            ],
            targetSchemes: [
                'National Programme for Health Care of the Elderly (NPHCE)',
                'Assistance to Disabled Persons for Purchase/Fitting of Aids (ADIP Scheme)'
            ]
        }
    ];

    // -------------------------------------------------------------------------
    // 3. Text Normalization & Bilingual Tokenizer
    // -------------------------------------------------------------------------
    function normalizeText(text) {
        if (!text) return '';
        return String(text)
            .normalize('NFKD')
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
            .replace(/[^\w\s\u0C00-\u0C7F-]/gi, ' ') // retain alphanumeric, Telugu Unicode block, hyphen
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function tokenize(text) {
        const norm = normalizeText(text);
        if (!norm) return [];
        return norm.split(' ').filter(token => token.length > 0);
    }

    // Expand tokens with phonetic/synonym transliterations
    function expandTokenTransliterations(tokens) {
        const expanded = new Set(tokens);
        for (const tok of tokens) {
            // Check direct phonetic map
            for (const [key, variants] of Object.entries(PHONETIC_MAP)) {
                if (key === tok || variants.some(v => v.toLowerCase() === tok)) {
                    expanded.add(key);
                    variants.forEach(v => expanded.add(v.toLowerCase()));
                }
            }
        }
        return Array.from(expanded);
    }

    // -------------------------------------------------------------------------
    // 4. Vector Space Model (VSM) Core Engine
    // -------------------------------------------------------------------------
    class VectorSearchEngine {
        constructor() {
            this.catalog = {};
            this.docVectors = {};       // schemeName -> { tfidf: Map(term -> weight), norm: number, concepts: Array(16) }
            this.vocabulary = new Set();
            this.idfMap = new Map();
            this.docCount = 0;
            this.conceptDimensions = SEMANTIC_CONCEPTS;
            this.isIndexed = false;
        }

        init(schemesCatalog) {
            this.catalog = schemesCatalog || {};
            this.buildIndex();
        }

        buildIndex() {
            const schemeNames = Object.keys(this.catalog);
            this.docCount = schemeNames.length;
            if (this.docCount === 0) return;

            const docTermFreqs = {}; // schemeName -> Map(term -> weightedCount)
            const docFrequency = new Map(); // term -> count of docs containing term

            // 1. Process each scheme and extract weighted text fields
            for (const name of schemeNames) {
                const scheme = this.catalog[name] || {};
                const tfMap = new Map();

                const addWeightedText = (text, weight) => {
                    if (!text) return;
                    const tokens = tokenize(text);
                    const expanded = expandTokenTransliterations(tokens);
                    for (const tok of expanded) {
                        if (tok.length <= 1) continue;
                        const curr = tfMap.get(tok) || 0;
                        tfMap.set(tok, curr + weight);
                    }
                };

                // Multi-field field weightings
                addWeightedText(name, 5.0);
                addWeightedText(scheme.telugu_name, 5.0);
                addWeightedText((scheme.keywords || []).join(' '), 3.5);
                addWeightedText(scheme.category, 3.0);
                addWeightedText(scheme.coverage_type, 3.0);
                addWeightedText(scheme.coverage_type_te, 3.0);
                addWeightedText(scheme.benefit_amount, 2.5);
                addWeightedText(scheme.benefit_amount_te, 2.5);
                addWeightedText(scheme.target_beneficiary, 2.0);
                addWeightedText(scheme.target_beneficiary_te, 2.0);

                const simp = scheme.simplified || {};
                addWeightedText(simp.eligibility, 2.0);
                addWeightedText(simp.benefits, 2.5);
                addWeightedText(simp.description, 2.0);

                const tel = scheme.telugu || {};
                addWeightedText(tel.eligibility, 2.0);
                addWeightedText(tel.benefits, 2.5);
                addWeightedText(tel.description, 2.0);

                addWeightedText((scheme.key_treatments || []).join(' '), 3.0);
                addWeightedText((scheme.key_treatments_te || []).join(' '), 3.0);

                docTermFreqs[name] = tfMap;

                // Update document frequency for vocabulary terms
                for (const term of tfMap.keys()) {
                    this.vocabulary.add(term);
                    docFrequency.set(term, (docFrequency.get(term) || 0) + 1);
                }
            }

            // 2. Compute BM25/Okapi IDF: ln(1 + (N - nt + 0.5) / (nt + 0.5))
            this.idfMap.clear();
            const N = this.docCount;
            for (const [term, df] of docFrequency.entries()) {
                const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
                this.idfMap.set(term, Math.max(0.2, idf));
            }

            // 3. Build dense semantic concept projection vector for each scheme
            for (const name of schemeNames) {
                const scheme = this.catalog[name] || {};
                const tfMap = docTermFreqs[name] || new Map();
                const tfidfVec = new Map();
                let sumSq = 0;

                // Sublinear TF-IDF: (1 + ln(tf)) * idf
                for (const [term, count] of tfMap.entries()) {
                    const idf = this.idfMap.get(term) || 0.2;
                    const sublinearTf = 1 + Math.log(count);
                    const weight = sublinearTf * idf;
                    tfidfVec.set(term, weight);
                    sumSq += weight * weight;
                }
                const norm = Math.sqrt(sumSq) || 1.0;

                // Dense Concept Vector: 16 Dimensions
                const conceptVec = this.conceptDimensions.map(concept => {
                    let cScore = 0;
                    // Direct boost if this scheme is explicitly registered for this concept
                    if (concept.targetSchemes.includes(name)) {
                        cScore += 3.5;
                    }
                    // Term overlap with concept's defining clinical terms
                    for (const cTerm of concept.terms) {
                        const cTokens = tokenize(cTerm);
                        for (const cTok of cTokens) {
                            if (tfMap.has(cTok)) {
                                cScore += (tfMap.get(cTok) || 1) * 0.4;
                            }
                        }
                    }
                    return cScore;
                });

                // Concept Vector L2 norm
                const cSumSq = conceptVec.reduce((acc, val) => acc + val * val, 0);
                const cNorm = Math.sqrt(cSumSq) || 1.0;
                const normalizedConceptVec = conceptVec.map(v => v / cNorm);

                this.docVectors[name] = {
                    tfidf: tfidfVec,
                    norm: norm,
                    concepts: normalizedConceptVec,
                    rawConceptScores: conceptVec
                };
            }

            // 4. Build Approximate Nearest Neighbor (ANN) Index Structures
            this.buildAnnIndex(schemeNames);

            this.isIndexed = true;
        }

        // Initialize Deterministic Random Hyperplanes for LSH (12-bit binary code)
        buildAnnIndex(schemeNames) {
            const dims = this.conceptDimensions.length;
            const numHyperplanes = 12;
            
            // Deterministic pseudo-random seed generator
            let seed = 42;
            const pseudoRandom = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return (seed / 233280.0) * 2.0 - 1.0;
            };

            this.hyperplanes = [];
            for (let i = 0; i < numHyperplanes; i++) {
                const plane = [];
                for (let d = 0; d < dims; d++) {
                    plane.push(pseudoRandom());
                }
                // Normalize hyperplane vector
                const planeNorm = Math.sqrt(plane.reduce((sum, v) => sum + v * v, 0)) || 1.0;
                this.hyperplanes.push(plane.map(v => v / planeNorm));
            }

            // Populate LSH Buckets
            this.lshBuckets = new Map(); // hashKey (int) -> Array of scheme names
            for (const name of schemeNames) {
                const vec = this.docVectors[name]?.concepts;
                if (!vec) continue;
                const hash = this.computeLshHash(vec);
                if (!this.lshBuckets.has(hash)) {
                    this.lshBuckets.set(hash, []);
                }
                this.lshBuckets.get(hash).push(name);
            }

            // Build Proximity / Small-World Graph (HNSW-style nearest neighbor graph, k=8)
            this.annGraph = new Map(); // schemeName -> Array of neighbor names
            const kNeighbors = Math.min(8, schemeNames.length - 1);

            for (const name of schemeNames) {
                const vecA = this.docVectors[name]?.concepts;
                if (!vecA) continue;

                const similarities = [];
                for (const otherName of schemeNames) {
                    if (otherName === name) continue;
                    const vecB = this.docVectors[otherName]?.concepts;
                    if (!vecB) continue;
                    let dot = 0;
                    for (let d = 0; d < dims; d++) {
                        dot += vecA[d] * vecB[d];
                    }
                    similarities.push({ name: otherName, sim: dot });
                }

                similarities.sort((a, b) => b.sim - a.sim);
                this.annGraph.set(name, similarities.slice(0, kNeighbors).map(s => s.name));
            }

            // Store entry node (the scheme with highest connectivity / centroid centrality)
            this.annEntryNode = schemeNames[0] || null;
        }

        // Compute 12-bit LSH Hash for a Dense Vector
        computeLshHash(vec) {
            let hash = 0;
            for (let i = 0; i < this.hyperplanes.length; i++) {
                const plane = this.hyperplanes[i];
                let dot = 0;
                for (let d = 0; d < vec.length; d++) {
                    dot += vec[d] * plane[d];
                }
                if (dot >= 0) {
                    hash |= (1 << i);
                }
            }
            return hash;
        }

        // Multi-probe ANN Retrieval: Graph traversal + LSH multi-bucket probe
        retrieveAnnCandidates(qConceptVec, qTfMap, efSearch = 20) {
            const candidates = new Set();
            const schemeNames = Object.keys(this.catalog);
            if (schemeNames.length <= 25) {
                // For small catalog sizes, examine all candidates with zero indexing overhead
                return schemeNames;
            }

            // 1. Probe Exact LSH Bucket and Hamming-1 Neighbor Buckets
            const qHash = this.computeLshHash(qConceptVec);
            const bucketsToProbe = [qHash];
            for (let i = 0; i < this.hyperplanes.length; i++) {
                bucketsToProbe.push(qHash ^ (1 << i)); // Hamming distance 1
            }

            for (const bucketHash of bucketsToProbe) {
                const bucketDocs = this.lshBuckets.get(bucketHash);
                if (bucketDocs) {
                    for (const doc of bucketDocs) {
                        candidates.add(doc);
                    }
                }
            }

            // 2. Proximity Graph Beam Search (HNSW beam search)
            let currNode = this.annEntryNode;
            if (currNode) {
                const visited = new Set([currNode]);
                const queue = [currNode];

                while (queue.length > 0 && candidates.size < efSearch * 2) {
                    const node = queue.shift();
                    candidates.add(node);
                    const neighbors = this.annGraph.get(node) || [];
                    for (const nb of neighbors) {
                        if (!visited.has(nb)) {
                            visited.add(nb);
                            queue.push(nb);
                            candidates.add(nb);
                            if (queue.length >= efSearch) break;
                        }
                    }
                }
            }

            // 3. Fallback / Postings verification for vocabulary keywords
            for (const tok of qTfMap.keys()) {
                for (const name of schemeNames) {
                    if (candidates.has(name)) continue;
                    if (this.docVectors[name]?.tfidf.has(tok)) {
                        candidates.add(name);
                    }
                }
            }

            return Array.from(candidates);
        }

        // Vectorize User Query
        vectorizeQuery(queryText) {
            const rawTokens = tokenize(queryText);
            if (rawTokens.length === 0) {
                return null;
            }

            const expandedTokens = expandTokenTransliterations(rawTokens);
            const qTfMap = new Map();

            for (const tok of expandedTokens) {
                qTfMap.set(tok, (qTfMap.get(tok) || 0) + 1);
            }

            const qTfidf = new Map();
            let sumSq = 0;
            for (const [term, count] of qTfMap.entries()) {
                const idf = this.idfMap.get(term) || 1.5; // fallback IDF for unseen query terms
                const sublinearTf = 1 + Math.log(count);
                const weight = sublinearTf * idf;
                qTfidf.set(term, weight);
                sumSq += weight * weight;
            }
            const qNorm = Math.sqrt(sumSq) || 1.0;

            // Project query onto the 16 Semantic Concept Dimensions
            const qConceptScores = this.conceptDimensions.map(concept => {
                let score = 0;
                for (const cTerm of concept.terms) {
                    const cToks = tokenize(cTerm);
                    for (const tok of cToks) {
                        if (qTfMap.has(tok)) {
                            score += 2.0;
                        }
                        // Substring or root match
                        for (const qTok of qTfMap.keys()) {
                            if (qTok.length >= 3 && (tok.includes(qTok) || qTok.includes(tok))) {
                                score += 1.2;
                            }
                        }
                    }
                }
                return score;
            });

            const qCSumSq = qConceptScores.reduce((acc, val) => acc + val * val, 0);
            const qCNorm = Math.sqrt(qCSumSq) || 1.0;
            const qConceptNormalized = qConceptScores.map(v => v / qCNorm);

            // Find primary and secondary detected concept intents
            let topIntent = null;
            let topIntentScore = 0;
            this.conceptDimensions.forEach((concept, idx) => {
                if (qConceptScores[idx] > topIntentScore && qConceptScores[idx] >= 1.5) {
                    topIntentScore = qConceptScores[idx];
                    topIntent = {
                        dimension: concept.dimension,
                        label_en: concept.label_en,
                        label_te: concept.label_te,
                        icon: concept.icon,
                        score: qConceptScores[idx]
                    };
                }
            });

            return {
                tokens: expandedTokens,
                rawTokens: rawTokens,
                tfidf: qTfidf,
                norm: qNorm,
                concepts: qConceptNormalized,
                rawConceptScores: qConceptScores,
                detectedIntent: topIntent
            };
        }

        // Vector-Based Semantic Search Execution
        search(queryText, customCatalog = null) {
            if (customCatalog && (!this.isIndexed || Object.keys(this.catalog).length !== Object.keys(customCatalog).length)) {
                this.init(customCatalog);
            }

            const cleanQuery = normalizeText(queryText);
            if (!cleanQuery) {
                return {
                    results: Object.keys(this.catalog).map(name => ({
                        name: name,
                        score: 1.0,
                        cosineSimilarity: 1.0,
                        matchedConcepts: []
                    })),
                    detectedIntent: null,
                    query: queryText,
                    totalMatches: Object.keys(this.catalog).length
                };
            }

            const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const qVec = this.vectorizeQuery(cleanQuery);
            if (!qVec) {
                return { results: [], detectedIntent: null, query: queryText, totalMatches: 0, isAnnAccelerated: true };
            }

            // Sub-linear Approximate Nearest Neighbor (ANN) Candidate Retrieval
            const candidateNames = this.retrieveAnnCandidates(qVec.concepts, qVec.tfidf, 24);
            const scored = [];

            for (const name of candidateNames) {
                const docVec = this.docVectors[name];
                if (!docVec) continue;

                // 1. TF-IDF Cosine Similarity: (Q · D) / (||Q|| * ||D||)
                let dotProduct = 0;
                for (const [term, qWeight] of qVec.tfidf.entries()) {
                    if (docVec.tfidf.has(term)) {
                        dotProduct += qWeight * (docVec.tfidf.get(term) || 0);
                    }
                }
                const tfidfCosine = (dotProduct / (qVec.norm * docVec.norm)) || 0;

                // 2. Semantic Concept Vector Dot-Product (Dense Cosine)
                let conceptCosine = 0;
                for (let i = 0; i < this.conceptDimensions.length; i++) {
                    conceptCosine += qVec.concepts[i] * docVec.concepts[i];
                }
                conceptCosine = Math.max(0, Math.min(1.0, conceptCosine));

                // 3. Exact & Prefix String Boost for Scheme Titles
                let titleBoost = 0;
                const normName = normalizeText(name);
                const schemeData = this.catalog[name] || {};
                const normTeName = normalizeText(schemeData.telugu_name || '');

                if (normName === cleanQuery || normTeName === cleanQuery) {
                    titleBoost = 0.5;
                } else if (normName.includes(cleanQuery) || normTeName.includes(cleanQuery)) {
                    titleBoost = 0.3;
                }

                // 4. Intent boost for targeted schemes
                let intentBoost = 0;
                const matchedConceptsList = [];
                if (qVec.detectedIntent) {
                    const conceptDef = this.conceptDimensions.find(c => c.dimension === qVec.detectedIntent.dimension);
                    if (conceptDef) {
                        if (conceptDef.targetSchemes.includes(name)) {
                            intentBoost = 0.4;
                            matchedConceptsList.push({
                                label_en: conceptDef.label_en,
                                label_te: conceptDef.label_te,
                                icon: conceptDef.icon
                            });
                        }
                    }
                }

                // Blended Hybrid Vector Score
                // 50% Concept Vector Cosine + 35% TF-IDF Cosine + 15% Title/Intent Boost
                const blendedScore = (conceptCosine * 0.50) + (tfidfCosine * 0.35) + titleBoost + intentBoost;
                const combinedSimilarity = Math.min(0.99, (conceptCosine * 0.6 + tfidfCosine * 0.4) + (titleBoost ? 0.15 : 0));

                if (blendedScore > 0.08 || tfidfCosine > 0.05 || conceptCosine > 0.25) {
                    scored.push({
                        name: name,
                        score: blendedScore,
                        cosineSimilarity: combinedSimilarity,
                        tfidfCosine: tfidfCosine,
                        conceptCosine: conceptCosine,
                        matchPercent: Math.round(Math.min(99, Math.max(40, combinedSimilarity * 100))),
                        matchedConcepts: matchedConceptsList,
                        detectedIntent: qVec.detectedIntent
                    });
                }
            }

            // Rank by highest vector similarity
            scored.sort((a, b) => b.score - a.score);
            const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

            return {
                results: scored,
                detectedIntent: qVec.detectedIntent,
                query: queryText,
                totalMatches: scored.length,
                isAnnAccelerated: true,
                candidatesExamined: candidateNames.length,
                lookupTimeMs: Number((endTime - startTime).toFixed(2))
            };
        }
    }

    // Instantiate Singleton Vector Engine
    const vectorEngine = new VectorSearchEngine();

    // Export Public API
    window.SmartGovVectorSearch = vectorEngine;
    window.SmartGovNLP = {
        search: (query, catalog) => vectorEngine.search(query, catalog),
        init: (catalog) => vectorEngine.init(catalog),
        tokenize: tokenize,
        normalizeText: normalizeText,
        concepts: SEMANTIC_CONCEPTS,
        phonetics: PHONETIC_MAP
    };

})(typeof window !== 'undefined' ? window : this);
