/**
 * SmartGovAI Localization Engine (i18n.js)
 * Global Telugu ↔ English localization system.
 * Defaults to Telugu ('te') on initial visit, with persistent localStorage support.
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'smartgov_lang';
    const DEFAULT_LANG = 'te';

    const TRANSLATIONS = {
        te: {
            // App Shell & Header
            appTitle: 'SmartGovAI',
            // Compare
            compareSchemes: 'పోల్చి చూడండి',
            compareModalTitle: 'పథకాల పోలిక',
            compareSelect1: 'మొదటి పథకం',
            compareSelect2: 'రెండవ పథకం',

            appSubtitle: 'మీకు వర్తించే ఉచిత వైద్యం, మందులు మరియు ప్రభుత్వ పథకాలను సులభంగా తెలుసుకోండి.',
            heroBadge: 'పౌర సమాచార వేదిక • ప్రజా ఆరోగ్యం',
            heroSub: 'గ్రామీణ, వయోవృద్ధుల సులభ మార్గదర్శి',
            floatingAssistantLabel: 'AI సహాయకుడు',
            appEyebrow: 'ఆంధ్రప్రదేశ్ ఆరోగ్య సహాయం',
            appSubhead: 'జాతీయ మరియు రాష్ట్ర ఆరోగ్య పథకాలు',
            langLabel: 'భాష:',
            langToggleTe: 'తెలుగు',
            langToggleEn: 'English',
            langToggleTeTitle: 'తెలుగులోకి మార్చండి',
            langToggleEnTitle: 'Switch to English',
            fontSizeLabel: 'పరిమాణం:',
            fontSizeSmall: 'చిన్న అక్షరాలు (A-)',
            fontSizeNormal: 'సాధారణ అక్షరాలు (A)',
            fontSizeLarge: 'పెద్ద అక్షరాలు (A+)',
            fontSizeExtraLarge: 'చాలా పెద్ద అక్షరాలు (A++)',
            fontSizeAria: 'అక్షరాల పరిమాణం మార్చండి',
            reportModalTitle: 'సమస్య నివేదిక / అభిప్రాయం',
            feedbackCategoryLabel: 'వర్గం / రకం:',
            feedbackOptionWrongInfo: 'తప్పుడు సమాచారం (Incorrect Info)',
            feedbackOptionAudio: 'ఆడియో సమస్య (Audio Issue)',
            feedbackOptionMissing: 'పథకం దొరకలేదు (Missing Scheme)',
            feedbackOptionSuggestion: 'సలహా (Suggestion)',
            feedbackDescLabel: 'వివరణ:',
            feedbackPlaceholder: 'సమస్యను క్లుప్తంగా వివరించండి...',
            feedbackSubmitBtn: 'సమర్పించండి',
            feedbackSubmitting: 'పంపుతున్నాం...',
            feedbackSelectPdfPrompt: '⚠️ దయచేసి ముందుగా PDF లేదా ఇమేజ్ ఫైల్‌ను ఎంచుకోండి.',
            feedbackConsentPrompt: '⚠️ దయచేసి పత్రం అప్‌లోడ్ చేయడానికి ముందు గోప్యతా అంగీకారం చెక్‌బాక్స్ (Consent) ను టిక్ చేయండి.',
            fileTooLargeError: 'ఫైల్ పరిమాణం 20MB కంటే ఎక్కువగా ఉంది. దయచేసి 20MB లోపు ఉన్న PDF లేదా ఇమేజ్ ఫైల్‌ను ఎంచుకోండి.',
            pdfOcrSupport: 'స్కాన్ చేసిన ఇమేజ్ పత్రాలు (OCR) & PDF లకు మద్దతు కలదు (గరిష్టం: 20 MB)',
            themeToggle: 'థీమ్ మార్చండి',
            contrastBtn: 'కాంట్రాస్ట్',
            themeLight: '☀️ లైట్',
            themeDark: '🌙 డార్క్',
            themeContrast: '🌓 కాంట్రాస్ట్',
            installApp: 'ఇన్‌స్టాల్ చేయండి',
            installAppBtn: 'ఇన్‌స్టాల్',

            // Assistant & Quick Tools Bar
            aiAssistantTitle: 'AI సహాయకుడిని అడగండి',
            aiAssistantSub: 'పథకాలపై మీ ప్రశ్నలకు తక్షణ సమాధానాలు',
            guidedModeTitle: 'పథకాల స్లైడ్లు (దశలవారీగా)',
            guidedModeSub: 'ఒక్కొక్కటిగా సులభంగా అర్థం చేసుకోండి',
            guidedModeBadge: 'దశల వారీ వివరణ',
            listenSlide: 'వినండి (వాయిస్ గైడ్)',
            mapTitle: 'సమీప ఆసుపత్రులు & PHC మ్యాప్',
            mapSub: 'AP వ్యాప్తంగా ఆరోగ్య కేంద్రాలు',
            analyticsTitle: 'పథకాల విశ్లేషణ (Analytics)',
            analyticsSub: 'వర్గాలు, వయస్సు & అర్హతల చార్ట్‌లు',
            dashboardModalHeading: 'ఆరోగ్య పథకాల విశ్లేషణ డాష్‌బోర్డ్',
            dashboardModalSub: 'లైవ్ వర్గీకరణ, బడ్జెట్ పరిమితులు & జనాభా విశ్లేషణ',
            emergencyTitle: 'అత్యవసర హెల్ప్‌లైన్లు',
            emergencySub: '108 • 104 • 102 ఉచిత నంబర్లు',
            guidedModeBannerTitle: 'పథకాల స్లైడ్ ప్రెజెంటేషన్',
            guidedModeBannerSub: 'ఒక్కొక్కటిగా సులభమైన కార్డుల రూపంలో చూడండి',
            guidedModeBannerBtn: 'స్లైడ్లు చూడండి',
            pdfToolTitle: 'సచివాలయ సిబ్బంది PDF టూల్',
            pdfToolSub: 'ప్రభుత్వ ఉత్తర్వులు (GO) సులభమైన కార్డులుగా మార్చండి',

            // Helplines
            helpline108Title: 'అత్యవసర అంబులెన్స్',
            helpline108Sub: 'ఉచిత 24/7 అత్యవసర సర్వీస్',
            helpline104Title: 'వైద్య సమాచార కేంద్రం',
            helpline104Sub: 'ఆరోగ్య సలహాలు, పథకాల వివరాలు',
            helpline102Title: 'తల్లీ-బిడ్డ ఎక్స్‌ప్రెస్',
            helpline102Sub: 'గర్భిణులు & బాలింతల వాహనం',
            helpline181Title: 'మహిళా హెల్ప్‌లైన్',
            helpline181Sub: 'మహిళల రక్షణ & సహాయం',
            emergencyNote: 'ఈ నంబర్లన్నీ ఉచితం (Toll-Free). ఏదైనా ఫోన్ నుండి డయల్ చేయవచ్చు.',

            // Emergency Strip
            emergency: 'అత్యవసరం',
            healthAdvice: 'ఆరోగ్య సలహా',
            nearbyPhc: 'దగ్గర సేవ',

            // Search & Filters
            searchSectionTitle: '🔍 పథకాల శోధన & ఫిల్టర్లు',
            searchSectionSub: 'పథకం పేరు, వ్యాధి లేదా కీవర్డ్ ద్వారా వెతకండి',
            searchPlaceholder: 'పథకం పేరు లేదా సమస్య రాయండి...',
            searchBtn: 'వెతకండి',
            searchBtnTitle: 'వెతకండి లేదా Enter నొక్కండి',
            searchKbdHint: '↵ Enter',
            searchFeedbackDefault: 'పథకం పేరు లేదా సమస్య టైప్ చేయండి — ఫలితాలు తక్షణమే కనిపిస్తాయి',
            searchFeedbackTyping: '⚡ శోధిస్తున్నాం: "{query}"...',
            searchProcessing: '⚡ శోధన ప్రాసెస్ చేస్తున్నాం...',
            searchFeedbackFound: '✅ "{query}" కోసం {count} పథకాలు దొరికాయి',
            searchFeedbackNear: '💡 సరిపోలిన సంబంధిత పథకాలు: {count} దొరికాయి',
            searchFeedbackEmpty: '⚠️ "{query}" కోసం పథకాలు దొరకలేదు. వేరే పదం ప్రయత్నించండి.',
            jumpToResults: 'ఫలితాలు చూడండి',
            symptomFinderSummary: '🎯 మీ వైద్య అవసరం / సమస్య ఆధారంగా పథకం కనుగొనండి',
            symptomChipHospital: '🏥 ఆసుపత్రి & శస్త్రచికిత్స',
            symptomChipPregnancy: '🤰 గర్భం & ప్రసవ సంరక్షణ',
            symptomChipChildren: '👶 పిల్లల ఆరోగ్యం & టీకాలు',
            symptomChipElderly: '👴 వృద్ధాప్య చికిత్స & పింఛను',
            symptomChipMedicines: '💊 ఉచిత మందులు & క్లినిక్',
            symptomChipEmergency: '🚑 అత్యవసర రవాణా (108/104)',
            symptomChipKidney: '🧬 డయాలసిస్ & కిడ్నీ సంరక్షణ',
            symptomChipTb: '🫁 క్షయ (TB) చికిత్స & పోషణ',
            symptomChipEye: '👁️ కంటి పరీక్ష & ఉచిత ఆపరేషన్లు',
            symptomChipCancer: '🩺 క్యాన్సర్ చికిత్స & మద్దతు',
            symptomChipMental: '🧠 మానసిక ఆరోగ్యం & కౌన్సెలింగ్',
            symptomChipBlood: '🩸 రక్త వ్యాధులు & థలస్సేమియా',
            symptomChipDisability: '🦽 దివ్యాంగుల సహాయ పరికరాలు',
            symptomChipAyush: '🌿 ఆయుష్ & సాంప్రదాయ వైద్యం',
            symptomChipDental: '🦷 దంత & నోటి సంరక్షణ',
            symptomChipInsurance: '🛡️ ఆరోగ్యశ్రీ & ABHA హెల్త్ కార్డులు',
            filterLabel: 'ఫిల్టర్:',
            filterAll: 'అన్నీ',
            filterAp: 'ఆంధ్రప్రదేశ్',
            filterAP: 'ఆంధ్రప్రదేశ్',
            filterNational: 'జాతీయ',
            filterFavorites: '★ ఇష్టమైనవి',
            recentSearchesTitle: 'ఇటీవల వెతికినవి',
            clearRecentSearches: 'అన్నీ తుడిచివేయి',
            clearRecentSearchesTitle: 'శోధన చరిత్రను తొలగించండి',
            removeSearchItem: 'ఈ శోధనను తీసివేయి',
            quickSearchTip: 'శోధించడానికి నొక్కండి',
            availableSchemesTitle: 'అందుబాటులో ఉన్న ఆరోగ్య పథకాలు',
            voiceBtnAria: 'వాయిస్ ద్వారా వెతకండి',
            voiceBtnTitle: 'వాయిస్ ద్వారా వెతకండి',
            clearSearchAria: 'శోధన తొలగించండి',
            voiceStatusDefault: 'పథకం వెతకండి లేదా మైక్ నొక్కండి',
            voiceListening: 'వింటున్నాం... మాట్లాడండి',
            voiceNotSupported: 'ఈ బ్రౌజర్ వాయిస్ సెర్చ్‌కు మద్దతు ఇవ్వదు.',
            voiceStartError: 'మైక్ ప్రారంభం కాలేదు. మళ్లీ ప్రయత్నించండి.',
            voiceErrNotAllowed: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో మైక్ అనుమతించండి.',
            voiceErrNoSpeech: 'మాట వినిపించలేదు. దయచేసి మళ్లీ మాట్లాడండి.',
            voiceErrAudioCapture: 'మైక్రోఫోన్ కనుగొనబడలేదు లేదా ఆడియో రికార్డింగ్ విఫలమైంది.',
            voiceErrNetwork: 'వాయిస్ గుర్తింపులో నెట్‌వర్క్ సమస్య ఏర్పడింది.',
            voiceErrAborted: 'వాయిస్ ఇన్‌పుట్ రద్దు చేయబడింది.',
            voiceErrGeneric: 'మైక్ లోపం: {error}',
            voiceCommandTitle: 'వాయిస్ ఆదేశాలు:',
            voiceStopListening: 'వాయిస్ రికార్డింగ్ ఆపండి',
            voiceSearchCleared: 'శోధన క్లియర్ చేయబడింది',
            voiceOpeningScheme: 'పథకం వివరాలు తెరుస్తున్నాం...',
            voiceSchemesFound: '{count} పథకాలు లభించాయి',
            voiceNearMatchesFound: '"{query}" కోసం {count} సమీప లేదా సంబంధిత పథకాలు లభించాయి',
            voiceDidYouMean: 'మీరు ఉద్దేశించినది: {scheme}?',
            nearMatchesBanner: '💡 "{query}" కోసం ఖచ్చితమైన సరిపోలిక లేకపోయినా, <strong>సమీప లేదా సంబంధిత పథకాలు</strong> ఇవి:',
            nearMatchBadge: 'సమీప సరిపోలిక',
            showAllSchemesBtn: 'అన్ని పథకాలు చూపించు',
            tryOtherVoiceKeywords: 'సూచన: "ఆరోగ్యశ్రీ", "కంటి వెలుగు", "డయాలసిస్", "108" వంటి పదాలతో మాట్లాడండి.',
            filterAll: 'అన్నీ',
            filterAp: 'ఆంధ్రప్రదేశ్',
            filterNational: 'జాతీయ',

            // Entry Banners
            symptomTitle: 'నా సమస్య',
            symptomSubtitle: 'మీ సమస్యకు సరిపోయే పథకాలను కనుగొనండి',
            symptomStartBtn: 'ప్రారంభించండి',
            chatTitle: 'పథకాల గురించి అడగండి',
            chatSubtitle: 'తెలుగులో ప్రశ్నలు అడగండి, AI సహాయం పొందండి',
            chatBtn: 'AI సహాయం',

            // Lists & Favorites
            favoritesTitle: '⭐ ఇష్టమైన పథకాలు',
            recentlyViewedTitle: '🕒 ఇటీవల చూసిన పథకాలు',
            emptyResultsTitle: 'ఫలితాలు లేవు',
            emptyResultsMsg: 'మరో పదంతో వెతకండి.',
            levelAp: 'ఆంధ్రప్రదేశ్',
            levelNational: 'జాతీయ',
            favoriteBtnTitle: 'ఇష్టమైనదిగా గుర్తించండి',

            // Scheme Detail Panel
            loadingDetails: 'వివరాలు తెస్తున్నాం...',
            errorLoading: 'సమాచారం లోడ్ కాలేదు.',
            eligibilityTitle: 'అర్హత',
            benefitsTitle: 'ప్రయోజనాలు',
            documentsTitle: 'కావలసిన పత్రాలు',
            stepsTitle: 'దరఖాస్తు విధానం',
            aboutSchemeTitle: 'ఈ పథకం గురించి',
            sourceLabel: 'మూలం:',
            officialSource: 'అధికారిక మూలం',
            uploadedSource: 'అప్‌లోడ్ చేసిన పత్రం',
            audioTitle: '🎙️ తెలుగు ఆడియో',
            speakPageBtn: '🔊 ఈ పేజీ చదవండి',
            speakSlowBtn: '🔊 మెల్లగా చదవండి',
            audioNotAvailable: 'ఆడియో అందుబాటులో లేదు',
            startGuidedModeBtn: '🧭 దశలవారీగా చూడండి (Guided Mode)',
            shareResultBtn: '📤 ఫలితాన్ని షేర్ చేయండి',
            downloadPdfBtn: '📥 PDF డౌన్‌లోడ్',
            printSchemeBtn: '🖨️ పథకం ముద్రణ',
            printChecklistBtn: '🖨️ పథకం ముద్రణ',
            qrCardBtn: '📄 QR కార్డు',
            reportIssueBtn: '⚠️ సమస్య తెలపండి',
            feedbackGood: '👍 ఉపయోగకరమైనది',
            feedbackImprove: '👎 మెరుగుపర్చండి',
            feedbackSaving: 'సేవ్ చేస్తున్నాం...',
            feedbackSuccess: '✅ ధన్యవాదాలు! మీ అభిప్రాయం నమోదు చేయబడింది.',
            feedbackError: '❌ అభిప్రాయం పంపలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి.',
            networkError: 'నెట్‌వర్క్ లోపం: {error}',
            selectSchemeError: 'దయచేసి పథకం ఎంచుకోండి.',
            selectPdfError: 'దయచేసి PDF ఫైల్ ఎంచుకోండి.',
            pdfRequiresInternet: 'PDF విశ్లేషణకు ఇంటర్నెట్ అవసరం (మిగతా పథకాలు ఆఫ్‌లైన్‌లో పనిచేస్తాయి)',
            pdfOfflineAlert: '🌐 ఇంటర్నెట్ కనెక్షన్ అవసరం: కొత్త PDF పత్రాలను AI ద్వారా విశ్లేషించడానికి ఇంటర్నెట్ కనెక్షన్ అవసరం. మిగతా అన్ని పథకాల వివరాలు, ఆడియో మరియు అర్హత పరీక్షలు ఆఫ్‌లైన్‌లో పూర్తిగా పనిచేస్తాయి.',
            trustVerified: 'ధృవీకరించిన అధికారి:',
            trustLastUpdated: 'చివరిగా నవీకరించబడింది:',
            trustOfficialSite: '🌐 అధికారిక వెబ్‌సైట్',
            trustConfirmation: 'అర్హత ధృవీకరణ:',
            privacyWarning: '🔒 గోప్యతా నోటీసు: ఆధార్ కార్డు నంబర్లు లేదా వ్యక్తిగత వైద్య పత్రాలను ఇక్కడ అప్‌లోడ్ చేయవద్దు.',

            // Eligibility Checker
            quizTitle: '🎯 అర్హత పరీక్ష',
            quizSubtitle: 'సులభమైన ప్రశ్నలకు సమాధానం ఇవ్వండి:',
            btnYes: 'అవును',
            btnNo: 'కాదు',
            quizScore: 'మీ అర్హత అవకాశం:',
            quizHigh: 'మీరు ఈ పథకానికి అర్హత పొందే అవకాశం చాలా ఉంది.',
            quizMedium: 'మీరు కొన్ని నిబంధనలతో అర్హత పొందవచ్చు.',
            quizLow: 'ఈ పథకానికి అర్హత తక్కువగా ఉండవచ్చు.',
            quizDisclaimer: 'అధికారిక ఆసుపత్రి, PHC, ASHA/ANM లేదా గ్రామ సచివాలయం వద్ద చివరి అర్హతను తప్పక ధృవీకరించండి.',

            // Document Checklist
            docChecklistTitle: '📋 డాక్యుమెంట్ చెక్‌లిస్ట్',
            docChecklistSubtitle: 'కార్యాలయానికి వెళ్లేముందు సరిచూసుకోండి:',
            docOptional: '(ఐచ్ఛికం)',
            docMandatory: '(తప్పనిసరి)',
            docProgress: '{count} / {total} పత్రాలు సిద్ధంగా ఉన్నాయి',

            // Rich Scheme Details
            keyParametersTitle: '⚡ పథకం కీలక ప్రమాణాలు & ముఖ్యాంశాలు',
            coverageTypeLabel: 'కవరేజ్ రకం',
            benefitAmountLabel: 'ఆర్థిక ప్రయోజనం / పరిమితి',
            targetBeneficiaryLabel: 'లబ్ధిదారులు',
            facilityTypeLabel: 'ఆసుపత్రులు / కేంద్రాలు',
            applicationModeLabel: 'దరఖాస్తు & యాక్సెస్ విధానం',
            processingTimeLabel: 'ప్రాసెసింగ్ వ్యవధి',
            validityPeriodLabel: 'చెల్లుబాటు కాలం',
            keyTreatmentsTitle: '🩺 కవర్ చేయబడే ప్రధాన చికిత్సలు & సేవలు',
            helplineNumbersTitle: '📞 అధికారిక హెల్ప్‌లైన్ నంబర్లు',
            exclusionsTitle: '🚫 మినహాయింపులు (వర్తించనివి)',
            directDial: 'డయల్ చేయండి',

            // Guided Mode (Slide by Slide)
            guidedStep: 'దశ {step} / 6',
            guidedTitle1: 'ℹ️ ఈ పథకం గురించి',
            guidedTitle2: '👤 ఎవరు పొందవచ్చు?',
            guidedTitle3: '🎁 ఏమి లభిస్తుంది?',
            guidedTitle4: '📄 ఏమి తీసుకెళ్లాలి?',
            guidedTitle5: '📝 ఎలా దరఖాస్తు చేయాలి?',
            guidedTitle6: '📍 ఎక్కడ సహాయం పొందాలి?',
            guidedPrev: '← వెనుకకు',
            guidedNext: 'తర్వాత →',
            guidedFinish: 'ముగించు',
            guidedClose: 'మూసివేయి',
            localHelp: 'స్థానిక సహాయం:',
            nearbyCentres: 'దగ్గరలోని ఆరోగ్య కేంద్రాలు:',

            // Symptom Finder
            symptomNavBack: '← వెనుకకు',
            symptomNavCategories: '← సమస్యలు',
            symptomNavAll: 'అన్ని పథకాలు',
            symptomHeaderTitle: 'నా సమస్య ఏమిటి?',
            symptomHeaderSubtitle: 'మీకు ఏ రకమైన సహాయం కావాలి?',
            symptomResultsTitle: 'సరిపోయే పథకాలు ({count})',
            catHospital: 'ఆసుపత్రి / అత్యవసర చికిత్స',
            catPregnancy: 'గర్భం / ప్రసవం',
            catChild: 'పిల్లల ఆరోగ్యం',
            catMedicines: 'మందులు / పరీక్షలు',
            catEyeHearing: 'కన్ను మరియు వినికిడి',
            catNutrition: 'పోషణ / రక్తం',
            catChronic: 'దీర్ఘకాలిక వ్యాధులు',
            catTelehealth: 'ఫోన్ ద్వారా వైద్య సేవలు',

            // Facilities GIS Map
            mapHeader: '📍 దగ్గరలోని ఆరోగ్య కేంద్రాలు',
            mapOverlayTitle: 'ఆంధ్రప్రదేశ్ ఆరోగ్య కేంద్రాలు & PHC మ్యాప్',
            mapExpand: 'విస్తరించు',
            mapCollapse: 'కుదించు',
            mapLocationBtn: '📍 నా స్థానం / జిల్లాను గుర్తించు',
            mapViewAllBtn: '🗺️ మొత్తం AP',
            mapRadiusLabel: 'దూరం: {km} కి.మీ',
            mapTypeAll: 'అన్నీ',
            mapTypePhc: 'PHC',
            mapTypeChc: 'CHC',
            mapTypeHospital: 'ఆసుపత్రి',
            mapTypeMapOnly: 'కేవలం మ్యాప్',
            mapTypeDistrict: 'డిస్ట్రిక్ట్ ఆసుపత్రి',
            mapTypeArea: 'ఏరియా ఆసుపత్రి',
            mapDist: 'దూరం:',
            mapType: 'రకం:',
            mapDistrict: 'జిల్లా:',
            mapMandal: 'మండలం:',
            mapVillage: 'గ్రామం:',
            mapContact: 'సంప్రదించండి:',
            mapKm: 'కి.మీ',
            mapSelectDistrict: '-- జిల్లాను ఎంచుకోండి --',
            mapSelectMandal: '-- మండలాన్ని ఎంచుకోండి --',
            mapSelectVillage: '-- గ్రామాన్ని ఎంచుకోండి --',
            mapLocationFinding: '⏳ వెతుకుతోంది...',
            mapYourLocationPopup: 'మీ స్థానం',
            mapErrDenied: '❌ అనుమతి నిరాకరించబడింది',
            mapErrUnavailable: '❌ స్థానం అందుబాటులో లేదు',
            mapErrTimeout: '❌ సమయం ముగిసింది',
            mapErrNotFound: '❌ స్థానం దొరకలేదు',
            mapFoundCount: 'కనుగొనబడినవి: {count}',

            // AI Chat
            chatModalTitle: 'SmartGovAI ఆరోగ్య సహాయకుడు',
            chatModalSubtitle: 'ఆరోగ్య పథకాల గురించి అడగండి',
            chatModalSub: 'ఆంధ్రప్రదేశ్ & జాతీయ ఆరోగ్య పథకాల సలహాదారు',
            chatStatusOnline: 'AI ఆన్‌లైన్',
            downloadChatBtn: 'చాట్ డౌన్‌లోడ్',
            clearChatBtn: 'కొత్త చాట్',
            clearChatTitle: 'సంభాషణను క్లియర్ చేయండి',
            chatModelLabel: 'AI మోడ్:',
            modeFast: 'వేగవంతం (Flash Lite)',
            modeGeneral: 'సాధారణం (3.5 Flash)',
            modeComplex: 'సమగ్రం (Pro Preview)',
            chatQuickPromptLabel: 'సూచనలు:',
            chatInputPlaceholder: 'మీ ప్రశ్నను ఇక్కడ అడగండి (ఉదా: ఆరోగ్యశ్రీ కార్డు ఎలా పొందాలి?)...',
            chatPlaceholder: 'మీ ప్రశ్నను ఇక్కడ రాయండి...',
            chatSendBtn: 'పంపండి',
            chatCloseAria: 'చాట్ మూసివేయి',
            chatUserRole: 'మీరు',
            chatBotRole: 'SmartGovAI సలహాదారు',
            chatWelcome: 'నమస్కారం! నేను SmartGovAI అధికారిక ఆరోగ్య సలహాదారుని. ఆంధ్రప్రదేశ్ ప్రభుత్వ ఆరోగ్య పథకాలు (ఆరోగ్యశ్రీ ₹25 లక్షల ఉచిత చికిత్స, ఆరోగ్య ఆసరా, గర్భిణుల సంరక్షణ, ఉచిత మందులు) పై మీరు ఏ ప్రశ్నైనా అడగవచ్చు. మీ తదుపరి ప్రశ్నలకు మునుపటి సమాచారం గుర్తుంచుకుని సమాధానం ఇస్తాను.',
            chatDisclaimer: '⚠️ AI సమాచారం కేవలం మార్గదర్శకత్వం కొరకు మాత్రమే. అధికారిక ధృవీకరణ కోసం సమీప సచివాలయం లేదా ఆరోగ్య మిత్రను సంప్రదించండి.',
            chatCopyBtn: '📋 కాపీ',
            chatCopied: '✅ కాపీ చేయబడింది',
            chatSpeakBtn: '🔊 వినండి',
            chatSpeakingBtn: '⏹️ ఆపండి',
            chatViewScheme: '🏥 పథకం వివరాలు',
            chatSugg1: 'ఉచిత చికిత్స ఎలా పొందాలి?',
            chatSugg2: 'గర్భిణీ స్త్రీలకు ఏ పథకాలు ఉన్నాయి?',
            chatSugg3: 'ఆరోగ్యశ్రీకి అర్హత ఏమిటి?',
            chatSugg4: '108 అంబులెన్స్ సేవ ఎలా పొందాలి?',
            chatThinking: 'సమాధానం సిద్ధం చేస్తున్నాం...',
            chatError: 'క్షమించండి, సమాధానం తీసుకురావడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
            chatCleared: 'సంభాషణ క్లియర్ చేయబడింది. కొత్త ప్రశ్న అడగండి.',

            // Secretariat / Staff Tools
            staffToolsSummary: 'సచివాలయం / ఆరోగ్య సిబ్బంది సాధనాలు',
            selectSchemeFromList: 'జాబితా నుండి పథకం',
            selectDropdownPlaceholder: '-- ఎంచుకోండి --',
            showDetailsBtn: 'వివరాలు చూపించు',
            pdfDocumentLabel: 'PDF పత్రం',
            pdfSimplifyTitle: '📄 పాలసీ పత్రాన్ని సరళీకరించండి',
            pdfConsent: 'నేను వ్యక్తిగత డేటాను అప్‌లోడ్ చేయడం లేదని ధృవీకరిస్తున్నాను (I consent to document processing without PII)',
            pdfSimplifyBtn: 'PDF ను సరళీకరించు',
            offlineModeNotice: '📡 ఆఫ్‌లైన్ మోడ్ - కాష్‌ చేసిన సమాచారం చూపిస్తున్నాం',
            staffReportTitle: 'సమస్య నివేదించండి',
            staffVillage: 'గ్రామం',
            staffDetails: 'వివరాలు',
            staffSubmit: 'సమర్పించండి',

            // Modals
            feedbackTitle: 'మీ అభిప్రాయం చెప్పండి',
            feedbackRating: 'రేటింగ్:',
            feedbackComment: 'వ్యాఖ్యలు:',
            feedbackSubmit: 'పంపండి',
            feedbackCancel: 'రద్దు',
            shareSuccess: '✅ ఫలితం కాపీ చేయబడింది!',
            qrCardTitle: 'పథకం కరపత్రం (QR Card)',
            qrPrintBtn: '🖨️ ముద్రించండి',
            qrCloseBtn: 'మూసివేయి',
            footerCredit: 'SmartGovAI - కమ్యూనిటీ సర్వీస్ ప్రాజెక్ట్',
            footerDesc: 'ప్రభుత్వ ఆరోగ్య పథకాలను సరళీకృతం చేయడానికి ఈ వేదిక రూపొందించబడింది. ప్రాజెక్టును మెరుగుపరచడానికి దయచేసి మీ అమూల్యమైన అభిప్రాయాన్ని పంచుకోండి.',
            reportToProfessor: 'అభిప్రాయం నివేదించండి'
        },

        en: {
            // App Shell & Header
            appTitle: 'SmartGovAI',
            // Compare
            compareSchemes: 'Compare Schemes',
            compareModalTitle: 'Compare Schemes',
            compareSelect1: 'First Scheme',
            compareSelect2: 'Second Scheme',

            appSubtitle: 'Discover free medical care, medicines, surgeries, and government schemes easily.',
            heroBadge: 'Citizen Information Guide • Public Health',
            heroSub: 'Accessible Guide for Rural & Elderly Citizens',
            floatingAssistantLabel: 'AI Assistant',
            appEyebrow: 'Andhra Pradesh Healthcare Assistance',
            footerCredit: 'SmartGovAI - Community Service Project',
            footerDesc: 'This platform is designed to simplify government healthcare schemes. We value your feedback to improve this project.',
            reportToProfessor: 'Report Feedback',
            appSubhead: 'National & State Health Welfare Schemes',
            langLabel: 'Language:',
            langToggleTe: 'తెలుగు',
            langToggleEn: 'English',
            langToggleTeTitle: 'తెలుగులోకి మార్చండి',
            langToggleEnTitle: 'Switch to English',
            fontSizeLabel: 'Text Size:',
            fontSizeSmall: 'Small text (A-)',
            fontSizeNormal: 'Normal text (A)',
            fontSizeLarge: 'Large text (A+)',
            fontSizeExtraLarge: 'Extra large text (A++)',
            fontSizeAria: 'Adjust font size',
            reportModalTitle: 'Report Issue / Feedback',
            feedbackCategoryLabel: 'Category:',
            feedbackOptionWrongInfo: 'Incorrect Information',
            feedbackOptionAudio: 'Audio Issue',
            feedbackOptionMissing: 'Missing Scheme',
            feedbackOptionSuggestion: 'Suggestion',
            feedbackDescLabel: 'Description:',
            feedbackPlaceholder: 'Briefly describe the issue...',
            feedbackSubmitBtn: 'Submit Feedback',
            feedbackSubmitting: 'Submitting...',
            feedbackSelectPdfPrompt: '⚠️ Please select a PDF or image file first.',
            feedbackConsentPrompt: '⚠️ Please check "I confirm this document contains no personal data / PII and consent to processing" before uploading.',
            fileTooLargeError: 'File size exceeds 20MB limit. Please select a document under 20MB.',
            pdfOcrSupport: 'Supports scanned image documents (OCR) & PDFs (Max: 20 MB)',
            themeToggle: 'Toggle Theme',
            contrastBtn: 'Contrast',
            themeLight: '☀️ Light',
            themeDark: '🌙 Dark',
            themeContrast: '🌓 Contrast',
            installApp: 'Install App',
            installAppBtn: 'Install',

            // Assistant & Quick Tools Bar
            aiAssistantTitle: 'Ask AI Assistant',
            aiAssistantSub: 'Instant answers to your health scheme queries',
            guidedModeTitle: 'Step-by-Step Scheme Slides',
            guidedModeSub: 'Understand schemes clearly one-by-one',
            guidedModeBadge: 'Step-by-Step Walkthrough',
            listenSlide: 'Listen (Voice Guide)',
            mapTitle: 'Nearby Hospitals & PHC Map',
            mapSub: 'Healthcare facilities across Andhra Pradesh',
            analyticsTitle: 'Scheme Analytics',
            analyticsSub: 'Category, age & eligibility insights',
            dashboardModalHeading: 'Health Schemes Analytics Dashboard',
            dashboardModalSub: 'Live categorization, budget limits & demographic insights',
            emergencyTitle: 'Emergency Helplines',
            emergencySub: '108 • 104 • 102 Toll-free helplines',
            guidedModeBannerTitle: 'Step-by-Step Scheme Slideshow',
            guidedModeBannerSub: 'View schemes one-by-one as clear visual slides',
            guidedModeBannerBtn: 'View Slides',
            pdfToolTitle: 'Secretariat Staff PDF Simplifier',
            pdfToolSub: 'Convert government circulars into simple citizen cards',

            // Helplines
            helpline108Title: 'Emergency Ambulance',
            helpline108Sub: 'Free 24/7 Emergency Transport',
            helpline104Title: 'Medical Advice Helpline',
            helpline104Sub: 'Health guidance & scheme info',
            helpline102Title: 'Mother & Child Express',
            helpline102Sub: 'Transport for pregnant women & infants',
            helpline181Title: "Women's Helpline",
            helpline181Sub: 'Protection & welfare support',
            emergencyNote: 'All these helplines are Toll-Free and can be dialed from any mobile or landline.',

            // Emergency Strip
            emergency: 'Emergency',
            healthAdvice: 'Health Advice',
            nearbyPhc: 'Nearby PHC',

            // Search & Filters
            searchSectionTitle: '🔍 Search Schemes & Filters',
            searchSectionSub: 'Search by scheme name, medical condition, or keyword',
            searchPlaceholder: 'Search scheme name or health condition...',
            searchBtn: 'Search',
            searchBtnTitle: 'Search or press Enter',
            searchKbdHint: '↵ Enter',
            searchFeedbackDefault: 'Type a scheme name or medical condition — results update instantly',
            searchFeedbackTyping: '⚡ Searching for "{query}"...',
            searchProcessing: '⚡ Processing search request...',
            searchFeedbackFound: '✅ Found {count} scheme{s} for "{query}"',
            searchFeedbackNear: '💡 Closest matching schemes: {count} found',
            searchFeedbackEmpty: '⚠️ No schemes found for "{query}". Try another keyword.',
            jumpToResults: 'View Results',
            symptomFinderSummary: '🎯 Find schemes matching your medical need',
            symptomChipHospital: '🏥 Hospitalization & Surgery',
            symptomChipPregnancy: '🤰 Pregnancy & Maternity',
            symptomChipChildren: '👶 Child Health & Vaccines',
            symptomChipElderly: '👴 Senior Citizen Care & Pension',
            symptomChipMedicines: '💊 Free Medicines & Clinics',
            symptomChipEmergency: '🚑 Emergency Transport (108/104)',
            symptomChipKidney: '🧬 Dialysis & Kidney Care',
            symptomChipTb: '🫁 TB Treatment & Nutrition',
            symptomChipEye: '👁️ Eye Care & Free Surgery',
            symptomChipCancer: '🩺 Cancer Care & Oncology',
            symptomChipMental: '🧠 Mental Health & Counseling',
            symptomChipBlood: '🩸 Blood Disorders & Thalassemia',
            symptomChipDisability: '🦽 Disability Assistive Aids',
            symptomChipAyush: '🌿 AYUSH & Traditional Medicine',
            symptomChipDental: '🦷 Oral & Dental Health',
            symptomChipInsurance: '🛡️ Aarogyasri & ABHA Health Cards',
            filterLabel: 'Filter:',
            filterAll: 'All Schemes',
            filterAp: 'Andhra Pradesh',
            filterAP: 'Andhra Pradesh',
            filterNational: 'National',
            filterFavorites: '★ Favorites',
            recentSearchesTitle: 'Recent Searches',
            clearRecentSearches: 'Clear All',
            clearRecentSearchesTitle: 'Clear recent searches history',
            removeSearchItem: 'Remove search',
            quickSearchTip: 'Click to search',
            availableSchemesTitle: 'Available Health Welfare Schemes',
            voiceBtnAria: 'Search by voice',
            voiceBtnTitle: 'Search by voice',
            clearSearchAria: 'Clear search',
            voiceStatusDefault: 'Search schemes or tap microphone',
            voiceListening: 'Listening... please speak',
            voiceNotSupported: 'Voice search is not supported on this browser.',
            voiceStartError: 'Could not start microphone. Please try again.',
            voiceErrNotAllowed: 'Microphone permission was denied. Please allow microphone access in browser settings.',
            voiceErrNoSpeech: 'No speech was detected. Please try speaking again.',
            voiceErrAudioCapture: 'No microphone found or audio capture failed.',
            voiceErrNetwork: 'Network error during voice recognition.',
            voiceErrAborted: 'Voice input was cancelled.',
            voiceErrGeneric: 'Microphone error: {error}',
            voiceCommandTitle: 'Voice Commands:',
            voiceStopListening: 'Stop voice recording',
            voiceSearchCleared: 'Search cleared',
            voiceOpeningScheme: 'Opening scheme details...',
            voiceSchemesFound: '{count} schemes found',
            voiceNearMatchesFound: 'Found {count} near or related schemes for "{query}"',
            voiceDidYouMean: 'Did you mean: {scheme}?',
            nearMatchesBanner: '💡 No exact match for "{query}". Showing <strong>closest matching government schemes</strong>:',
            nearMatchBadge: 'Near Match',
            showAllSchemesBtn: 'Show All Schemes',
            tryOtherVoiceKeywords: 'Tip: Try speaking keywords like "Aarogyasri", "Eye care", "Dialysis", "108".',
            filterAll: 'All Schemes',
            filterAp: 'Andhra Pradesh',
            filterNational: 'National',

            // Entry Banners
            symptomTitle: 'Symptom Finder',
            symptomSubtitle: 'Find government schemes matching your health condition',
            symptomStartBtn: 'Get Started',
            chatTitle: 'Ask About Schemes',
            chatSubtitle: 'Ask questions in English, get instant AI guidance',
            chatBtn: 'AI Help',

            // Lists & Favorites
            favoritesTitle: '⭐ Favorite Schemes',
            recentlyViewedTitle: '🕒 Recently Viewed Schemes',
            emptyResultsTitle: 'No Schemes Found',
            emptyResultsMsg: 'Try searching with different keywords.',
            levelAp: 'Andhra Pradesh',
            levelNational: 'National',
            favoriteBtnTitle: 'Toggle favorite',

            // Scheme Detail Panel
            loadingDetails: 'Loading scheme details...',
            errorLoading: 'Failed to load details.',
            eligibilityTitle: 'Eligibility',
            benefitsTitle: 'Benefits',
            documentsTitle: 'Required Documents',
            stepsTitle: 'How to Apply',
            aboutSchemeTitle: 'About This Scheme',
            sourceLabel: 'Source:',
            officialSource: 'Official Source',
            uploadedSource: 'Uploaded Document',
            audioTitle: '🎙️ Audio Guide',
            speakPageBtn: '🔊 Read Page Aloud',
            speakSlowBtn: '🔊 Read Aloud',
            audioNotAvailable: 'Audio not available',
            startGuidedModeBtn: '🧭 Guided Step-by-Step View',
            shareResultBtn: '📤 Share Result',
            downloadPdfBtn: '📥 Download Scheme PDF',
            printSchemeBtn: '🖨️ Print Scheme Details',
            printChecklistBtn: '🖨️ Print Scheme Details',
            qrCardBtn: '📄 QR Flyer',
            reportIssueBtn: '⚠️ Report Issue',
            feedbackGood: '👍 Helpful',
            feedbackImprove: '👎 Needs Improvement',
            feedbackSaving: 'Saving...',
            feedbackSuccess: '✅ Thank you! Your feedback has been recorded.',
            feedbackError: '❌ Could not submit feedback. Please try again.',
            networkError: 'Network error: {error}',
            selectSchemeError: 'Please select a scheme.',
            selectPdfError: 'Please select a PDF file.',
            pdfRequiresInternet: 'PDF analysis requires Internet (All schemes work offline)',
            pdfOfflineAlert: '🌐 Internet connection required: The Document Simplifier / PDF feature requires an active internet connection to analyze files with AI. All scheme browsing, audio guides, and eligibility quizzes remain fully functional offline.',
            trustVerified: 'Verifying Authority:',
            trustLastUpdated: 'Last Updated:',
            trustOfficialSite: '🌐 Official Website',
            trustConfirmation: 'Eligibility Confirmation:',
            privacyWarning: '🔒 Privacy Notice: Do not upload Aadhaar card numbers or private medical prescriptions here.',

            // Eligibility Checker
            quizTitle: '🎯 Eligibility Check',
            quizSubtitle: 'Answer simple questions to check eligibility:',
            btnYes: 'Yes',
            btnNo: 'No',
            quizScore: 'Estimated Eligibility:',
            quizHigh: 'You are highly likely to be eligible for this scheme.',
            quizMedium: 'You may be eligible subject to specific conditions.',
            quizLow: 'Eligibility criteria may not be fully met.',
            quizDisclaimer: 'Please verify final eligibility at an official hospital, PHC, ASHA/ANM or Village Secretariat.',

            // Document Checklist
            docChecklistTitle: '📋 Document Checklist',
            docChecklistSubtitle: 'Verify before visiting the government office:',
            docOptional: '(Optional)',
            docMandatory: '(Mandatory)',
            docProgress: '{count} of {total} documents ready',

            // Rich Scheme Details
            keyParametersTitle: '⚡ Key Scheme Parameters & Highlights',
            coverageTypeLabel: 'Coverage Type',
            benefitAmountLabel: 'Financial Benefit Limit',
            targetBeneficiaryLabel: 'Target Beneficiaries',
            facilityTypeLabel: 'Healthcare Facilities',
            applicationModeLabel: 'Application & Access Mode',
            processingTimeLabel: 'Processing Time',
            validityPeriodLabel: 'Validity Period',
            keyTreatmentsTitle: '🩺 Key Treatments & Services Covered',
            helplineNumbersTitle: '📞 Official Toll-Free Helplines',
            exclusionsTitle: '🚫 Coverage Exclusions & Boundaries',
            directDial: 'Call Now',

            // Guided Mode (Slide by Slide)
            guidedStep: 'Step {step} of 6',
            guidedTitle1: 'ℹ️ About This Scheme',
            guidedTitle2: '👤 Who is Eligible?',
            guidedTitle3: '🎁 What Benefits are Provided?',
            guidedTitle4: '📄 What Documents to Carry?',
            guidedTitle5: '📝 How to Apply?',
            guidedTitle6: '📍 Where to Get Help?',
            guidedPrev: '← Previous',
            guidedNext: 'Next →',
            guidedFinish: 'Done',
            guidedClose: 'Close',
            localHelp: 'Local Assistance:',
            nearbyCentres: 'Nearby Healthcare Facilities:',

            // Symptom Finder
            symptomNavBack: '← Back',
            symptomNavCategories: '← Categories',
            symptomNavAll: 'All Schemes',
            symptomHeaderTitle: 'What is your health concern?',
            symptomHeaderSubtitle: 'What type of assistance do you need?',
            symptomResultsTitle: 'Matching Health Schemes ({count})',
            catHospital: 'Hospital / Emergency Care',
            catPregnancy: 'Pregnancy & Maternity',
            catChild: 'Child & Infant Health',
            catMedicines: 'Medicines & Diagnostics',
            catEyeHearing: 'Eye & Hearing Care',
            catNutrition: 'Nutrition & Anemia',
            catChronic: 'Chronic Diseases',
            catTelehealth: 'Telemedicine & Digital Health',

            // Facilities GIS Map
            mapHeader: '📍 Nearby Healthcare Facilities',
            mapOverlayTitle: 'Andhra Pradesh Healthcare Centres & PHC Map',
            mapExpand: 'Expand Map',
            mapCollapse: 'Collapse Map',
            mapLocationBtn: '📍 My Location / District',
            mapViewAllBtn: '🗺️ View All AP',
            mapRadiusLabel: 'Radius: {km} km',
            mapTypeAll: 'All',
            mapTypePhc: 'PHC',
            mapTypeChc: 'CHC',
            mapTypeHospital: 'Hospital',
            mapTypeMapOnly: 'Map Only',
            mapTypeDistrict: 'District Hospital',
            mapTypeArea: 'Area Hospital',
            mapDist: 'Distance:',
            mapType: 'Type:',
            mapDistrict: 'District:',
            mapMandal: 'Mandal:',
            mapVillage: 'Village:',
            mapContact: 'Contact:',
            mapKm: 'km',
            mapSelectDistrict: '-- Select District --',
            mapSelectMandal: '-- Select Mandal --',
            mapSelectVillage: '-- Select Village --',
            mapLocationFinding: '⏳ Locating...',
            mapYourLocationPopup: 'Your Location',
            mapErrDenied: '❌ Location permission denied',
            mapErrUnavailable: '❌ Location unavailable',
            mapErrTimeout: '❌ Location request timed out',
            mapErrNotFound: '❌ Location not found',
            mapFoundCount: 'Found: {count}',

            // AI Chat
            chatModalTitle: 'SmartGovAI Health Advisor',
            chatModalSubtitle: 'Ask questions about health schemes',
            chatModalSub: 'AP & National Healthcare Schemes Virtual Advisor',
            chatStatusOnline: 'AI Online',
            downloadChatBtn: 'Download Chat',
            clearChatBtn: 'New Chat',
            clearChatTitle: 'Clear conversation history',
            chatModelLabel: 'AI Mode:',
            modeFast: 'Fast (Flash Lite)',
            modeGeneral: 'General (3.5 Flash)',
            modeComplex: 'In-Depth (Pro Preview)',
            chatQuickPromptLabel: 'Suggestions:',
            chatInputPlaceholder: 'Ask any question (e.g., How to apply for Aarogyasri card?)...',
            chatPlaceholder: 'Type your question in English or Telugu...',
            chatSendBtn: 'Send',
            chatCloseAria: 'Close chat',
            chatUserRole: 'You',
            chatBotRole: 'SmartGovAI Advisor',
            chatWelcome: 'Hello! I am SmartGovAI, your official Healthcare & Welfare Schemes Advisor. You can ask any question regarding AP healthcare schemes (Dr. NTR Vaidya Seva / Aarogyasri ₹25 Lakhs coverage, Aarogya Asara, maternal assistance, free medicines). I maintain conversation memory and will guide your follow-up questions step-by-step.',
            chatDisclaimer: '⚠️ AI responses are for guidance only. Please verify with your local Village/Ward Secretariat or hospital Aarogya Mithra desk for formal confirmation.',
            chatCopyBtn: '📋 Copy',
            chatCopied: '✅ Copied',
            chatSpeakBtn: '🔊 Listen',
            chatSpeakingBtn: '⏹️ Stop',
            chatViewScheme: '🏥 View Scheme',
            chatSugg1: 'How to get free hospital treatment?',
            chatSugg2: 'What schemes are available for pregnant women?',
            chatSugg3: 'What is the eligibility for Aarogyasri?',
            chatSugg4: 'How to call the 108 emergency ambulance?',
            chatThinking: 'Preparing response...',
            chatError: 'Sorry, an error occurred while fetching the response. Please try again.',
            chatCleared: 'Conversation cleared. Ask a new question.',

            // Secretariat / Staff Tools
            staffToolsSummary: 'Village Secretariat / Health Staff Tools',
            selectSchemeFromList: 'Select Scheme From List',
            selectDropdownPlaceholder: '-- Select Scheme --',
            showDetailsBtn: 'Show Details',
            pdfDocumentLabel: 'PDF Document',
            pdfSimplifyTitle: '📄 Simplify Policy Document',
            pdfConsent: 'I confirm this document contains no personal data / PII and consent to processing',
            pdfSimplifyBtn: 'Simplify PDF Document',
            offlineModeNotice: '📡 Offline Mode - Showing cached data',
            staffReportTitle: 'Report Scheme Discrepancy',
            staffVillage: 'Village / Mandal',
            staffDetails: 'Details',
            staffSubmit: 'Submit Report',

            // Modals
            feedbackTitle: 'Share Your Feedback',
            feedbackRating: 'Rating:',
            feedbackComment: 'Comments:',
            feedbackSubmit: 'Submit Feedback',
            feedbackCancel: 'Cancel',
            shareSuccess: '✅ Result copied to clipboard!',
            qrCardTitle: 'Scheme Flyer (QR Card)',
            qrPrintBtn: '🖨️ Print Flyer',
            qrCloseBtn: 'Close'
        }
    };

    // Category translations mapping
    const CATEGORIES = {
        'Hospital treatment': { te: 'ఆసుపత్రి చికిత్స', en: 'Hospital Treatment' },
        'Hospital Treatment': { te: 'ఆసుపత్రి చికిత్స', en: 'Hospital Treatment' },
        'Hospital Care': { te: 'ఆసుపత్రి చికిత్స', en: 'Hospital Care' },
        'Maternal & Child': { te: 'తల్లీ బిడ్డల సంరక్షణ', en: 'Maternal & Child Care' },
        'Maternal Health': { te: 'తల్లీ బిడ్డల ఆరోగ్యం', en: 'Maternal Health' },
        'Maternal Cash Support': { te: 'గర్భిణులకు నగదు ప్రోత్సాహం', en: 'Maternal Cash Support' },
        'Emergency Medical': { te: 'అత్యవసర వైద్య సేవలు', en: 'Emergency Medical Services' },
        'National Health': { te: 'జాతీయ ఆరోగ్య పథకం', en: 'National Health Scheme' },
        'De-addiction Services': { te: 'వ్యసన విముక్తి సేవలు', en: 'De-addiction Services' },
        'Leprosy Services': { te: 'కుష్టు నివారణ సేవలు', en: 'Leprosy Eradication Services' },
        'Leprosy Eradication Services': { te: 'కుష్టు నివారణ సేవలు', en: 'Leprosy Eradication Services' },
        'Malaria & Dengue Services': { te: 'మలేరియా & డెంగ్యూ నివారణ', en: 'Vector Borne Disease Services' },
        'Vector Borne Disease Services': { te: 'మలేరియా & డెంగ్యూ నివారణ', en: 'Vector Borne Disease Services' },
        'Eye Care Services': { te: 'నేత్ర చికిత్స సేవలు', en: 'Eye Care Services' },
        'Hearing Care Services': { te: 'వినికిడి సంరక్షణ సేవలు', en: 'Hearing Care Services' },
        'Dental Health': { te: 'దంత ఆరోగ్యం', en: 'Dental Healthcare' },
        'Nutrition Services': { te: 'పోషకాహార సేవలు', en: 'Nutrition Services' },
        'Nutritional Services': { te: 'పోషకాహార సేవలు', en: 'Nutritional Services' },
        'Cancer Care': { te: 'క్యాన్సర్ చికిత్స సేవలు', en: 'Cancer Care' },
        'Mental Health': { te: 'మానసిక ఆరోగ్య సేవలు', en: 'Mental Healthcare' },
        'Mental Health Services': { te: 'మానసిక ఆరోగ్య సేవలు', en: 'Mental Health Services' },
        'Elderly Care': { te: 'వృద్ధుల సంరక్షణ', en: 'Elderly Care' },
        'Elderly Care Services': { te: 'వృద్ధుల సంరక్షణ', en: 'Elderly Care Services' },
        'Palliative Care': { te: 'ఉపశమన సంరక్షణ', en: 'Palliative Care' },
        'Adolescent Health': { te: 'కౌమార ఆరోగ్య సేవలు', en: 'Adolescent Health' },
        'TB Services': { te: 'క్షయ వ్యాధి నివారణ', en: 'TB Elimination Services' },
        'TB Elimination Services': { te: 'క్షయ వ్యాధి నివారణ', en: 'TB Elimination Services' },
        'TB support': { te: 'క్షయ పోషణ సహాయం', en: 'TB Nutrition Support' },
        'HIV & AIDS Services': { te: 'హెచ్‌ఐవి & ఎయిడ్స్ సేవలు', en: 'HIV & AIDS Services' },
        'Kidney dialysis': { te: 'డయాలసిస్ & కిడ్నీ సంరక్షణ', en: 'Kidney Dialysis Services' },
        'Disability Welfare': { te: 'దివ్యాంగుల సంక్షేమం', en: 'Disability Welfare' },
        'Ayurveda & AYUSH': { te: 'ఆయుష్ & ఆయుర్వేదం', en: 'AYUSH & Traditional Medicine' },
        'Occupational Health': { te: 'వృత్తిపరమైన ఆరోగ్యం', en: 'Occupational Health' },
        'Rabies Control': { te: 'రేబీస్ నివారణ', en: 'Rabies Control' },
        'Rabies Prevention': { te: 'రేబీస్ నివారణ', en: 'Rabies Prevention' },
        'Dialysis & Kidney Care': { te: 'డయాలసిస్ & కిడ్నీ సంరక్షణ', en: 'Dialysis & Renal Care' },
        'Blood Bank Services': { te: 'రక్తనిధి సేవలు', en: 'Blood Bank Services' },
        'Blood Transfusion': { te: 'రక్తనిధి సేవలు', en: 'Blood Bank Services' },
        'Tele-Medicine': { te: 'టెలి-మెడిసిన్ సేవలు', en: 'Telemedicine Services' },
        'Digital Health Services': { te: 'డిజిటల్ ఆరోగ్య సేవలు', en: 'Digital Health Services' },
        'Doctor by phone': { te: 'ఫోన్ ద్వారా డాక్టర్ సలహా', en: 'Doctor by Phone' },
        'PHC and village care': { te: 'గ్రామ ప్రాథమిక ఆరోగ్య సేవలు', en: 'Primary Healthcare & Village Clinics' },
        'Village health service': { te: 'గ్రామ ఆరోగ్య సేవలు', en: 'Village Health Service' },
        'Primary Care Clinics': { te: 'పట్టణ & ప్రాథమిక ఆరోగ్య కేంద్రాలు', en: 'Primary Care Clinics' },
        'Affordable Medicines': { te: 'తక్కువ ధరల మందులు (జన ఔషధి)', en: 'Affordable Generic Medicines' },
        'Pregnancy and newborn': { te: 'గర్భిణి & నవజాత శిశు సంరక్షణ', en: 'Pregnancy & Newborn Care' },
        'Pregnancy cash support': { te: 'గర్భిణులకు నగదు ప్రోత్సాహం', en: 'Maternity Cash Assistance' },
        'Child health': { te: 'పిల్లల ఆరోగ్య సేవలు', en: 'Child Health & Screening' },
        'Vaccination': { te: 'టీకాల కార్యక్రమం', en: 'Vaccination & Immunization' },
        'Vaccination / Immunization': { te: 'టీకాల కార్యక్రమం', en: 'Vaccination & Immunization' },
        'Emergency ambulance': { te: 'అత్యవసర అంబులెన్స్ సేవ', en: 'Emergency Ambulance Service' },
        'Organ Donation Services': { te: 'అవయవ దాన సేవలు', en: 'Organ Donation Services' }
    };

    let currentLang = DEFAULT_LANG;

    // Initialize language from localStorage (defaults to Telugu)
    function initLanguage() {
        try {
            const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
            const saved = storage ? (storage.getItem(STORAGE_KEY) || storage.getItem('smartgov_language')) : null;
            if (saved === 'en' || saved === 'te') {
                currentLang = saved;
            } else {
                currentLang = DEFAULT_LANG;
            }
        } catch (e) {
            currentLang = DEFAULT_LANG;
        }
        document.documentElement.setAttribute('lang', currentLang);
    }

    // Get current language code ('te' or 'en')
    function getLang() {
        return currentLang;
    }

    // Translate string key with optional param replacement {param} and optional lang override
    function t(key, params, lang) {
        const l = lang || currentLang;
        const langDict = TRANSLATIONS[l] || TRANSLATIONS[DEFAULT_LANG];
        let text = langDict[key] || (TRANSLATIONS[DEFAULT_LANG] ? TRANSLATIONS[DEFAULT_LANG][key] : '') || key;
        if (params && typeof params === 'object') {
            Object.keys(params).forEach(function (param) {
                text = text.replace(new RegExp('\\{' + param + '\\}', 'g'), params[param]);
            });
        }
        return text;
    }

    // Translate category with optional lang override
    function translateCategory(cat, lang) {
        if (!cat) return '';
        const l = lang || currentLang;
        if (CATEGORIES[cat]) {
            return CATEGORIES[cat][l] || cat;
        }
        for (const k in CATEGORIES) {
            if (CATEGORIES[k].en === cat || CATEGORIES[k].te === cat) {
                return CATEGORIES[k][l] || cat;
            }
        }
        return cat;
    }

    // Translate level badge with optional lang override
    function translateLevel(level, lang) {
        const l = lang || currentLang;
        if (level === 'Andhra Pradesh') {
            return l === 'te' ? 'ఆంధ్రప్రదేశ్' : 'AP';
        }
        return l === 'te' ? 'జాతీయ' : 'National';
    }

    function findSchemeInCatalog(schemeOrName) {
        if (!schemeOrName) return null;
        if (typeof schemeOrName === 'object') return schemeOrName;
        if (!window.schemesCatalog) return { name: schemeOrName };
        if (window.schemesCatalog[schemeOrName]) {
            return Object.assign({ name: schemeOrName }, window.schemesCatalog[schemeOrName]);
        }
        for (const key in window.schemesCatalog) {
            const item = window.schemesCatalog[key];
            if (key === schemeOrName || item.telugu_name === schemeOrName || item.name === schemeOrName) {
                return Object.assign({ name: key }, item);
            }
        }
        return { name: schemeOrName };
    }

    // Central Scheme Name Resolver
    function getLocalizedSchemeName(schemeOrName, lang) {
        if (!schemeOrName) return '';
        const l = lang || currentLang;
        const scheme = findSchemeInCatalog(schemeOrName);
        if (l === 'en') {
            return scheme.name || scheme.scheme_name || (typeof schemeOrName === 'string' ? schemeOrName : '');
        }
        return scheme.telugu_name || scheme.name || scheme.scheme_name || (typeof schemeOrName === 'string' ? schemeOrName : '');
    }

    // Central Scheme Subtitle Resolver
    function getLocalizedSchemeSubtitle(schemeOrName, lang) {
        if (!schemeOrName) return '';
        const l = lang || currentLang;
        const scheme = findSchemeInCatalog(schemeOrName);
        if (l === 'en') {
            // In English mode, show localized category (NO TELUGU)
            return scheme.category ? translateCategory(scheme.category, 'en') : '';
        }
        // In Telugu mode, show English name as secondary reference
        return scheme.name || scheme.scheme_name || (typeof schemeOrName === 'string' ? schemeOrName : '');
    }

    // Central Scheme Description Resolver
    function getLocalizedSchemeDescription(schemeOrName, lang) {
        if (!schemeOrName) return '';
        const l = lang || currentLang;
        const scheme = findSchemeInCatalog(schemeOrName);
        if (l === 'en') {
            return scheme.english_description || scheme.simplified?.description || scheme.simplified?.benefits || '';
        }
        return scheme.telugu_description || scheme.telugu?.description || scheme.telugu?.benefits || '';
    }

    // Microphone error localization
    function getLocalizedMicError(errorType, lang) {
        const l = lang || currentLang;
        const err = (errorType || '').toLowerCase();
        if (err.includes('not-allowed') || err.includes('permission') || err.includes('denied')) {
            return t('voiceErrNotAllowed', null, l);
        }
        if (err.includes('no-speech')) {
            return t('voiceErrNoSpeech', null, l);
        }
        if (err.includes('audio-capture')) {
            return t('voiceErrAudioCapture', null, l);
        }
        if (err.includes('network')) {
            return t('voiceErrNetwork', null, l);
        }
        if (err.includes('aborted')) {
            return t('voiceErrAborted', null, l);
        }
        return t('voiceErrGeneric', { error: errorType || 'unknown' }, l);
    }

    // Set active language and apply across DOM
    function setLang(lang) {
        if (lang !== 'te' && lang !== 'en') return;

        // Stop any active audio and clear audio queue immediately upon language switch
        if (typeof window !== 'undefined' && window.AudioController && typeof window.AudioController.onLanguageChange === 'function') {
            window.AudioController.onLanguageChange(lang);
        }

        currentLang = lang;
        try {
            const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
            if (storage) {
                storage.setItem(STORAGE_KEY, lang);
                storage.setItem('smartgov_language', lang);
            }
        } catch (e) {
            // ignore localStorage quota/privacy errors
        }

        document.documentElement.setAttribute('lang', lang);

        // Update toggle button states
        const teBtn = document.getElementById('langTeBtn');
        const enBtn = document.getElementById('langEnBtn');
        if (teBtn && enBtn) {
            if (lang === 'te') {
                teBtn.classList.add('active');
                teBtn.setAttribute('aria-pressed', 'true');
                enBtn.classList.remove('active');
                enBtn.setAttribute('aria-pressed', 'false');
            } else {
                enBtn.classList.add('active');
                enBtn.setAttribute('aria-pressed', 'true');
                teBtn.classList.remove('active');
                teBtn.setAttribute('aria-pressed', 'false');
            }
        }

        applyStaticTranslations();

        // Dispatch language change event for dynamic views
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
    }

    // Apply translations to all DOM elements with data-i18n attributes
    function applyStaticTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            const key = el.getAttribute('data-i18n');
            if (key) {
                const translated = t(key);
                // Only replace if a real translation exists and is not just the raw key string
                if (translated && translated !== key) {
                    el.textContent = translated;
                }
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                const translated = t(key);
                if (translated && translated !== key) {
                    el.setAttribute('placeholder', translated);
                }
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                const translated = t(key);
                if (translated && translated !== key) {
                    el.setAttribute('title', translated);
                }
            }
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            const key = el.getAttribute('data-i18n-aria');
            if (key) {
                const translated = t(key);
                if (translated && translated !== key) {
                    el.setAttribute('aria-label', translated);
                }
            }
        });
    }

    // Expose global API
    initLanguage();

    window.SmartGovI18n = {
        getLang: getLang,
        setLang: setLang,
        setLanguage: setLang,
        initLanguage: initLanguage,
        t: t,
        translateCategory: translateCategory,
        translateLevel: translateLevel,
        getLocalizedSchemeName: getLocalizedSchemeName,
        getLocalizedSchemeSubtitle: getLocalizedSchemeSubtitle,
        getLocalizedSchemeDescription: getLocalizedSchemeDescription,
        getLocalizedMicError: getLocalizedMicError,
        applyStaticTranslations: applyStaticTranslations,
        TRANSLATIONS: TRANSLATIONS,
        CATEGORIES: CATEGORIES
    };

    // Shorthand helpers
    window.t = t;
    window.getLang = getLang;
    window.setLang = setLang;
    window.setLanguage = setLang;
    window.getLocalizedSchemeName = getLocalizedSchemeName;
    window.getLocalizedSchemeSubtitle = getLocalizedSchemeSubtitle;
    window.getLocalizedSchemeDescription = getLocalizedSchemeDescription;
    window.getLocalizedMicError = getLocalizedMicError;

})();
