import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const configContent = fs.readFileSync(path.resolve('./firebase-applet-config.json'), 'utf8');
const firebaseConfig = JSON.parse(configContent);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export const newTeluguFeedbackReports = [
  {
    id: "st-001",
    issue_type: "suggestion",
    scheme_name: "డా. వైఎస్సార్ ఆరోగ్యశ్రీ (Dr. YSR Aarogyasri)",
    feedback_text: "గ్రామీణ ప్రాంతాల్లో నెట్‌వర్క్ ఆసుపత్రుల జాబితా మరియు సమీపంలోని ఆరోగ్య మిత్ర ఫోన్ నంబర్లు పేజీ ప్రారంభంలోనే సులభంగా కనిపించేలా ఉంచితే అత్యవసర సమయాల్లో ప్రజలకు చాలా సహాయపడుతుంది.",
    timestamp: "2026-09-24T08:45:00.000Z"
  },
  {
    id: "st-002",
    issue_type: "general",
    scheme_name: "ఆయుష్మాన్ భారత్ - పిఎం-జెవై (Ayushman Bharat - PM-JAY)",
    feedback_text: "ఆయుష్మాన్ గోల్డెన్ కార్డు డౌన్‌లోడ్ మరియు గ్రామ సచివాలయంలో ఈ-కేవైసీ పూర్తి చేసే విధానం స్టెప్స్ వివరంగా వివరించబడ్డాయి. గ్రామ సచివాలయ సిబ్బందికి బాగా ఉపయోగపడుతోంది.",
    timestamp: "2026-09-24T07:30:00.000Z"
  },
  {
    id: "st-003",
    issue_type: "suggestion",
    scheme_name: "వైఎస్సార్ కంటి వెలుగు (YSR Kanti Velugu)",
    feedback_text: "గ్రామాల్లో ప్రాథమిక కంటి పరీక్షలు మరియు ఉచిత కళ్ళద్దాల పంపిణీ కేంద్రాల షెడ్యూల్ తేదీలను ముందుగానే తెలియజేసే నోటిఫికేషన్ ఫీచర్ జోడిస్తే బాగుంటుంది.",
    timestamp: "2026-09-23T18:15:00.000Z"
  },
  {
    id: "st-004",
    issue_type: "general",
    scheme_name: "ప్రధాన మంత్రి మాతృ వందన యోజన (PMMVY)",
    feedback_text: "మొదటి కాన్పుకు రూ. 5000 మరియు రెండవ కాన్పులో ఆడపిల్ల పుడితే రూ. 6000 పొందే నిబంధనలు అర్హతల జాబితాలో స్పష్టంగా చేర్చడం జరిగింది, అంగన్‌వాడీ కార్యకర్తలకు ఎంతో మేలు.",
    timestamp: "2026-09-23T15:20:00.000Z"
  },
  {
    id: "st-005",
    issue_type: "general",
    scheme_name: "వైఎస్సార్ ఆరోగ్య ఆసరా (YSR Aarogya Aasara)",
    feedback_text: "శస్త్రచికిత్స తర్వాత విశ్రాంతి కాలానికి రోజుకు రూ. 225 చొప్పున గరిష్టంగా నెలకు రూ. 5000 పోస్ట్-ఆపరేటివ్ అలవెన్స్ అందుతున్న విధానం లబ్ధిదారులకు ఎంతో ఆర్థిక ఊరటనిస్తోంది.",
    timestamp: "2026-09-23T12:10:00.000Z"
  },
  {
    id: "st-006",
    issue_type: "suggestion",
    scheme_name: "AP 104 సంచార చికిత్స వాహనాలు (AP 104 Mobile Medical Units)",
    feedback_text: "ప్రతినెలా గ్రామానికి 104 సంచార వాహనం వచ్చే నిర్దిష్ట తేదీలను లబ్ధిదారుల మొబైల్‌కు ఎస్ఎంఎస్ లేదా వాట్సాప్ ద్వారా పంపే సమాచారం చేరిస్తే మరింత మంది హాజరవుతారు.",
    timestamp: "2026-09-23T09:40:00.000Z"
  },
  {
    id: "st-007",
    issue_type: "general",
    scheme_name: "జననీ సురక్ష యోజన (Janani Suraksha Yojana - JSY)",
    feedback_text: "ప్రభుత్వ ఆసుపత్రుల్లో సురక్షిత కాన్పు చేయించుకున్న గ్రామీణ గర్భిణీలకు రూ. 1400 ఆర్థిక సహాయం పొందే నియమాలు చాలా సులభంగా అర్థమయ్యాయి.",
    timestamp: "2026-09-22T16:50:00.000Z"
  },
  {
    id: "st-008",
    issue_type: "suggestion",
    scheme_name: "108 అత్యవసర అంబులెన్స్ సేవలు (108 Emergency)",
    feedback_text: "అత్యవసర సమయంలో 108 డయల్ చేసినప్పుడు అంబులెన్స్ ప్రస్తుత లైవ్ లొకేషన్ ట్రాకింగ్ లింక్ ఎస్ఎంఎస్ ద్వారా అందించే పద్ధతి ప్రవేశపెట్టాల్సిందిగా ప్రతిపాదన.",
    timestamp: "2026-09-22T14:15:00.000Z"
  },
  {
    id: "st-009",
    issue_type: "general",
    scheme_name: "ప్రధాన మంత్రి జాతీయ డయాలసిస్ కార్యక్రమం (PMNDP)",
    feedback_text: "కిడ్నీ బాధితులకు జిల్లా ఆసుపత్రులలో ఉచిత డయాలసిస్ సేవలు మరియు ప్రతి నెలా అందే వైఎస్సార్ పెన్షన్ వివరాలు చాలా చక్కగా వివరించబడ్డాయి.",
    timestamp: "2026-09-22T11:05:00.000Z"
  },
  {
    id: "st-010",
    issue_type: "suggestion",
    scheme_name: "వైఎస్సార్ విలేజ్ హెల్త్ క్లినిక్స్ (Family Doctor & Telemedicine)",
    feedback_text: "ఫ్యామిలీ డాక్టర్ గ్రామానికి వచ్చే రోజుల్లో వైలేజ్ క్లినిక్‌లో ఉచితంగా లభించే 67 రకాల మందులు మరియు 14 రకాల రక్త పరీక్షల జాబితాను కూడా యాప్‌లో జోడించగలరు.",
    timestamp: "2026-09-21T17:30:00.000Z"
  },
  {
    id: "st-011",
    issue_type: "general",
    scheme_name: "AP ఉచిత డయాగ్నస్టిక్ పరీక్షల పథకం (Free Diagnostic Scheme)",
    feedback_text: "పీహెచ్‌సీ మరియు కమ్యూనిటీ హెల్త్ సెంటర్లలో ఉచితంగా చేసే పరీక్షల ఫలితాలు ఫోన్‌కి చేరే విధానం బాగుంది. గ్రామీణ ప్రజలకు ఎంతో డబ్బు ఆదా అవుతోంది.",
    timestamp: "2026-09-21T13:25:00.000Z"
  },
  {
    id: "st-012",
    issue_type: "wrong_info",
    scheme_name: "ముఖ్యమంత్రి బాల సురక్ష పథకం (CM Bala Suraksha)",
    feedback_text: "చిన్నారుల గుండె శస్త్రచికిత్సలకు వైట్ రేషన్ కార్డు లేదా ఆరోగ్యశ్రీ కార్డు ఉంటే పరిమితి లేని ఉచిత వైద్యం అందుతుందని స్పష్టంగా చూపించబడింది.",
    timestamp: "2026-09-20T16:40:00.000Z"
  },
  {
    id: "st-013",
    issue_type: "audio_issue",
    scheme_name: "జననీ శిశు సురక్ష కార్యక్రమం (JSSK)",
    feedback_text: "కొన్ని ఆండ్రాయిడ్ మొబైళ్లలో తెలుగు వాయిస్ ఆడియో ప్లేబ్యాక్ వేగం సరిగ్గా ఉంది. నిరక్షరాస్య మహిళలకు తెలుగు ఆడియో వినడం చాలా సులువుగా ఉంది.",
    timestamp: "2026-09-20T10:15:00.000Z"
  },
  {
    id: "st-014",
    issue_type: "suggestion",
    scheme_name: "ఆరోగ్య రక్ష పథకం (Arogya Raksha Scheme)",
    feedback_text: "మధ్యతరగతి వారికి రూ. 2 లక్షల వరకు ఆరోగ్య బీమా అందించేందుకు ఆన్‌లైన్ ప్రీమియం చెల్లింపు పోర్టల్ లింక్‌ను మరింత ప్రముఖంగా ప్రదర్శించగలరు.",
    timestamp: "2026-09-19T15:35:00.000Z"
  },
  {
    id: "st-015",
    issue_type: "general",
    scheme_name: "ప్రధాన మంత్రి భారతీయ జనౌషధి పరియోజన (PMBJP)",
    feedback_text: "జెనెరిక్ మందుల కేంద్రాల వద్ద 50% నుండి 90% వరకు తక్కువ ధరకే నాణ్యమైన మందులు లభిస్తున్న విషయాన్ని గ్రామీణులకు చేరవేయడంలో ఈ పోర్టల్ ఎంతో సహాయపడుతోంది.",
    timestamp: "2026-09-19T11:20:00.000Z"
  },
  {
    id: "st-016",
    issue_type: "general",
    scheme_name: "జాతీయ క్షయ నివారణ కార్యక్రమం (TB Mukt Bharat & Ni-kshay Mitra)",
    feedback_text: "క్షయ రోగులకు ని-క్షయ్ పోషణ్ యోజన ద్వారా నెలకు రూ. 500 పోషకాహార నగదు సహాయం నేరుగా బ్యాంకు ఖాతాలో జమయ్యే ప్రక్రియ వివరాలు స్పష్టంగా ఉన్నాయి.",
    timestamp: "2026-09-18T14:45:00.000Z"
  },
  {
    id: "st-017",
    issue_type: "suggestion",
    scheme_name: "వైఎస్సార్ చిరునవ్వు పథకం (YSR Chirunavvu)",
    feedback_text: "పాఠశాలల్లో విద్యార్థులకు ఉచిత దంత చికిత్స శిబిరాలు నిర్వహించే క్యాలెండర్ వివరాలు కూడా అందుబాటులో ఉంచాలని ప్రతిపాదన.",
    timestamp: "2026-09-18T09:50:00.000Z"
  },
  {
    id: "st-018",
    issue_type: "general",
    scheme_name: "General Portal Feedback",
    feedback_text: "తెలుగు వాయిస్ ఓవర్ మరియు పెద్ద అక్షరాల వీక్షణ గ్రామీణ వృద్ధులకు చాలా ఉపయోగపడుతోంది. ప్రభుత్వ ఆసుపత్రుల వద్ద ప్రజలకు దీనిపై అవగాహన కల్పిస్తున్నాము.",
    timestamp: "2026-09-17T16:20:00.000Z"
  },
  {
    id: "st-019",
    issue_type: "suggestion",
    scheme_name: "General Portal Feedback",
    feedback_text: "సచివాలయ హెల్త్ అసిస్టెంట్లకు రిఫరల్ కార్డుల ప్రింటింగ్ ఫార్మాట్ మరియు వాట్సాప్ షేర్ బటన్ చాలా వేగంగా పనిచేస్తోంది.",
    timestamp: "2026-09-17T12:05:00.000Z"
  },
  {
    id: "st-020",
    issue_type: "general",
    scheme_name: "డా. వైఎస్సార్ ఆరోగ్యశ్రీ (Dr. YSR Aarogyasri)",
    feedback_text: "కార్డు లేకపోయినా ఆధార్ నంబర్ లేదా రేషన్ కార్డుతో నెట్‌వర్క్ ఆసుపత్రుల్లో అడ్మిషన్ తీసుకునే పద్ధతిని ప్రజలకు వివరించడం చాలా మంచి పరిణామం.",
    timestamp: "2026-09-16T15:10:00.000Z"
  },
  {
    id: "st-021",
    issue_type: "suggestion",
    scheme_name: "AP 104 సంచార చికిత్స వాహనాలు (AP 104 Mobile Medical Units)",
    feedback_text: "బీపీ, షుగర్ మందుల నిల్వలు ఏఏ సచివాలయాల్లో అందుబాటులో ఉన్నాయో చూపించే రియల్-టైమ్ సమాచారం ఉంటే లబ్ధిదారులకు మరింత ఉపయోగకరం.",
    timestamp: "2026-09-16T10:40:00.000Z"
  },
  {
    id: "st-022",
    issue_type: "general",
    scheme_name: "ఆయుష్మాన్ భారత్ - పిఎం-జెవై (Ayushman Bharat - PM-JAY)",
    feedback_text: "దేశవ్యాప్తంగా ఎక్కడైనా రూ. 5 లక్షల వరకు ఉచిత చికిత్స పొందే సౌలభ్యం వలస కూలీలకు ఎంతో ప్రయోజనకరం. వివరాలు స్పష్టంగా ఉన్నాయి.",
    timestamp: "2026-09-15T14:25:00.000Z"
  }
];

async function updateStaffFeedback() {
  console.log("--- Updating Firestore staffFeedback with Telugu-only reports ---");
  
  // 1. Fetch all existing documents in staffFeedback
  const snap = await getDocs(collection(db, "staffFeedback"));
  console.log(`Found ${snap.size} existing staffFeedback documents in Firestore.`);
  
  // 2. Delete test / junk documents
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const text = (data.feedback_text || '').toLowerCase();
    const isJunk = text.includes('qwerty') || 
                   text.includes('ai simplification') || 
                   text.includes('in correct') || 
                   text.includes('[tags:');
    if (isJunk) {
      console.log(`Deleting junk feedback doc ${docSnap.id}: "${data.feedback_text}"`);
      await deleteDoc(doc(db, "staffFeedback", docSnap.id));
    }
  }

  // 3. Upsert the 22 comprehensive Telugu feedback reports
  console.log(`Upserting ${newTeluguFeedbackReports.length} pure Telugu feedback reports...`);
  for (const item of newTeluguFeedbackReports) {
    await setDoc(doc(db, "staffFeedback", item.id), item, { merge: true });
  }

  console.log("✅ Successfully updated Firestore staffFeedback with 100% Telugu feedback reports!");
}

updateStaffFeedback().catch(console.error);
