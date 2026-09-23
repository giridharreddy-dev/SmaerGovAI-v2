import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const COLORS = [
  '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

function CustomChartTooltip({ active, payload, isEn, totalCount = 1 }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload || {};
    const count = payload[0].value !== undefined ? payload[0].value : (data.count || 0);
    const name = data.name || payload[0].name || '';
    const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.15)',
        minWidth: '190px',
        maxWidth: '280px',
        pointerEvents: 'none',
        zIndex: 9999
      }}>
        <div style={{ fontWeight: '700', fontSize: '0.84rem', color: '#0f172a', marginBottom: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', wordBreak: 'break-word' }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', margin: '3px 0' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {isEn ? 'Total Schemes:' : 'మొత్తం పథకాలు:'}
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0284c7' }}>
            {count} {isEn ? (count === 1 ? 'Scheme' : 'Schemes') : 'పథకాలు'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', margin: '3px 0' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {isEn ? 'Share:' : 'వాటా:'}
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#059669' }}>
            {percent}%
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function SchemesAnalyticsDashboard({ schemes = {}, onSelectCategory, onFilterDistrict, onClose }) {
  const [lang, setLang] = useState(() => (window.getLang ? window.getLang() : 'te'));
  const [activeTab, setActiveTab] = useState('category'); // 'category', 'age', 'income', 'benefits'
  const [viewMode, setViewMode] = useState('charts'); // 'charts', 'table'
  const [liveSchemes, setLiveSchemes] = useState(schemes);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const isEn = lang === 'en';

  useEffect(() => {
    setLiveSchemes(schemes);
  }, [schemes]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleLangChange = (e) => {
      if (e?.detail?.lang) {
        setLang(e.detail.lang);
      } else if (window.getLang) {
        setLang(window.getLang());
      }
    };
    window.addEventListener('languageChanged', handleLangChange);
    return () => window.removeEventListener('languageChanged', handleLangChange);
  }, []);

  const schemeList = useMemo(() => {
    const source = (liveSchemes && Object.keys(liveSchemes).length > 0) ? liveSchemes : (window.schemesCatalog || {});
    return Object.keys(source).map(key => {
      const item = source[key] || {};
      return {
        id: key,
        name: key,
        name_te: item.telugu_name || key,
        category: item.category || 'General Healthcare',
        category_te: item.category_te || item.category || 'సాధారణ వైద్య సేవలు',
        level: item.level || 'Andhra Pradesh',
        benefit_amount: item.benefit_amount || '',
        benefit_amount_te: item.benefit_amount_te || '',
        simplified: item.simplified || {},
        telugu: item.telugu || {}
      };
    });
  }, [liveSchemes]);

  // High-Level KPIs
  const kpiMetrics = useMemo(() => {
    let nationalCount = 0;
    let apCount = 0;
    let freeSurgeriesCount = 0;
    let dbtCashCount = 0;

    schemeList.forEach(s => {
      if (s.level === 'National') nationalCount++;
      else apCount++;

      const text = `${s.name} ${s.name_te} ${s.category} ${s.benefit_amount} ${s.benefit_amount_te}`.toLowerCase();
      if (text.includes('lakh') || text.includes('surgery') || text.includes('vaidya seva') || text.includes('pmjay') || text.includes('ఆరోగ్యశ్రీ') || text.includes('ఆపరేషన్')) {
        freeSurgeriesCount++;
      }
      if (text.includes('dbt') || text.includes('pension') || text.includes('cash') || text.includes('5,000') || text.includes('6,000') || text.includes('10,000') || text.includes('నగదు') || text.includes('భృతి') || text.includes('రూ.')) {
        dbtCashCount++;
      }
    });

    return {
      total: schemeList.length,
      national: nationalCount,
      ap: apCount,
      surgeries: freeSurgeriesCount,
      dbt: dbtCashCount
    };
  }, [schemeList]);

  // 1. Disease / Specialty Category Distribution
  const categoryData = useMemo(() => {
    const counts = {};
    const labelMapTe = {
      'Tertiary Hospital Care': 'ఆసుపత్రి & శస్త్రచికిత్సలు (Hospital & Surgeries)',
      'Maternal & Child Care': 'మాతృ & శిశు సంరక్షణ (Maternal & Child)',
      'Chronic & Critical Care': 'దీర్ఘకాలిక వ్యాధులు & పెన్షన్ (Chronic Care)',
      'Preventive & Primary Care': 'ప్రాథమిక & నివారణ పరీక్షలు (Primary Care)',
      'Emergency & Universal': 'అత్యవసర & సార్వత్రిక సేవలు (Emergency Care)',
      'Generic Medicines & Pharmacy': 'చౌక జనరిక్ మందులు (Generic Pharmacy)',
      'Other Healthcare': 'ఇతర ఆరోగ్య పథకాలు (General Welfare)'
    };
    const labelMapEn = {
      'Tertiary Hospital Care': 'Tertiary & Inpatient Care',
      'Maternal & Child Care': 'Maternal & Child Health',
      'Chronic & Critical Care': 'Chronic Care & Pensions',
      'Preventive & Primary Care': 'Primary & Preventive Care',
      'Emergency & Universal': 'Emergency & 108/104',
      'Generic Medicines & Pharmacy': 'Generic Medicines & Pharmacy',
      'Other Healthcare': 'Other Welfare Programs'
    };

    schemeList.forEach(s => {
      const cat = (s.category || '').toLowerCase();
      let bucket = 'Other Healthcare';

      if (cat.includes('aarogyasri') || cat.includes('tertiary') || cat.includes('surgery') || cat.includes('hospital') || cat.includes('cashless')) {
        bucket = 'Tertiary Hospital Care';
      } else if (cat.includes('matern') || cat.includes('child') || cat.includes('pregnancy') || cat.includes('bidda') || cat.includes('baby') || cat.includes('immuniz')) {
        bucket = 'Maternal & Child Care';
      } else if (cat.includes('chronic') || cat.includes('dialysis') || cat.includes('pension') || cat.includes('aasara') || cat.includes('cancer') || cat.includes('tb') || cat.includes('leprosy')) {
        bucket = 'Chronic & Critical Care';
      } else if (cat.includes('primary') || cat.includes('preventive') || cat.includes('clinic') || cat.includes('screening') || cat.includes('eye') || cat.includes('dental') || cat.includes('ayush')) {
        bucket = 'Preventive & Primary Care';
      } else if (cat.includes('emergency') || cat.includes('108') || cat.includes('104') || cat.includes('tele')) {
        bucket = 'Emergency & Universal';
      } else if (cat.includes('medicine') || cat.includes('pharmacy') || cat.includes('janaushadhi') || cat.includes('aushadh')) {
        bucket = 'Generic Medicines & Pharmacy';
      }

      counts[bucket] = (counts[bucket] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: isEn ? labelMapEn[key] || key : labelMapTe[key] || key,
      key: key,
      count: counts[key]
    })).sort((a, b) => b.count - a.count);
  }, [schemeList, isEn]);

  // 2. Target Age Group Distribution
  const ageGroupData = useMemo(() => {
    const buckets = {
      all_ages: { en: 'Universal / All Age Groups', te: 'అన్ని వయస్సుల వారు (Universal)', count: 0 },
      mothers_infants: { en: 'Pregnant Mothers & Infants', te: 'గర్భిణులు & శిశువులు (0-5 సం.)', count: 0 },
      children_youth: { en: 'Children & Adolescents (6-18)', te: 'పిల్లలు & కౌమార బాలికలు (6-18)', count: 0 },
      adults: { en: 'Adults (18-59 Years)', te: 'పెద్దలు & శ్రామికులు (18-59 సం.)', count: 0 },
      seniors: { en: 'Senior Citizens (60+ Years)', te: 'వృద్ధులు & వయోవృద్ధులు (60+ సం.)', count: 0 }
    };

    schemeList.forEach(s => {
      const text = `${s.name} ${s.name_te} ${s.category} ${JSON.stringify(s.simplified)} ${JSON.stringify(s.telugu)}`.toLowerCase();
      if (text.includes('pregnant') || text.includes('mother') || text.includes('infant') || text.includes('bidda') || text.includes('maternal') || text.includes('delivery')) {
        buckets.mothers_infants.count++;
      } else if (text.includes('senior') || text.includes('vridha') || text.includes('old age') || text.includes('60') || text.includes('pensioner')) {
        buckets.seniors.count++;
      } else if (text.includes('child') || text.includes('girl') || text.includes('school') || text.includes('rbsk') || text.includes('adolescent')) {
        buckets.children_youth.count++;
      } else if (text.includes('employee') || text.includes('worker') || text.includes('driver')) {
        buckets.adults.count++;
      } else {
        buckets.all_ages.count++;
      }
    });

    return Object.keys(buckets).map(k => ({
      name: isEn ? buckets[k].en : buckets[k].te,
      count: buckets[k].count
    }));
  }, [schemeList, isEn]);

  // 3. Income & Card Distribution
  const incomeData = useMemo(() => {
    const tiers = {
      rice_card: { en: 'Rice Card / BPL (< ₹5L)', te: 'తెల్ల రేషన్ / బియ్యం కార్డు (< ₹5 లక్షలు)', count: 0 },
      low_income: { en: 'Antyodaya & Chronic Patients', te: 'అంత్యోదయ & దీర్ఘకాలిక రోగులు', count: 0 },
      universal: { en: 'Universal / No Income Limit', te: 'ఆదాయ పరిమితి లేదు (సార్వత్రికం)', count: 0 },
      employees: { en: 'Govt Employees & Pensioners', te: 'ప్రభుత్వ ఉద్యోగులు & సిబ్బంది', count: 0 }
    };

    schemeList.forEach(s => {
      const text = `${s.name} ${s.name_te} ${JSON.stringify(s.simplified)} ${JSON.stringify(s.telugu)}`.toLowerCase();
      if (text.includes('employee') || text.includes('ehs') || text.includes('pensioner')) {
        tiers.employees.count++;
      } else if (text.includes('universal') || text.includes('108') || text.includes('104') || text.includes('telemanas') || text.includes('jan aushadhi')) {
        tiers.universal.count++;
      } else if (text.includes('antyodaya') || text.includes('chronic kidney') || text.includes('pension kanuka') || text.includes('dialysis')) {
        tiers.low_income.count++;
      } else {
        tiers.rice_card.count++;
      }
    });

    return Object.keys(tiers).map(k => ({
      name: isEn ? tiers[k].en : tiers[k].te,
      count: tiers[k].count
    }));
  }, [schemeList, isEn]);

  // 4. Financial Benefit Tiers
  const benefitTierData = useMemo(() => {
    const tiers = {
      t1: { en: 'Up to ₹25 Lakhs (Aarogyasri Surgeries)', te: '₹25 లక్షల వరకు (నగదు రహిత ఆపరేషన్లు)', count: 0 },
      t2: { en: 'Up to ₹5 Lakhs (PM-JAY National)', te: '₹5 లక్షల వరకు (జాతీయ PM-JAY)', count: 0 },
      t3: { en: 'Monthly Pensions (₹3,000 - ₹10,000)', te: 'నెలవారీ పెన్షన్ & భృతి (₹3k - ₹10k)', count: 0 },
      t4: { en: '100% Free Medicines & Diagnostics', te: '100% ఉచిత మందులు & ల్యాబ్ పరీక్షలు', count: 0 },
      t5: { en: 'Direct Cash DBT (₹5,000 - ₹12,000)', te: 'ప్రసవ & వేతన నష్ట సాయం (DBT)', count: 0 }
    };

    schemeList.forEach(s => {
      const text = `${s.benefit_amount} ${s.benefit_amount_te} ${s.name} ${s.name_te}`.toLowerCase();
      if (text.includes('25 lakh') || text.includes('25,00,000') || text.includes('25 లక్షల')) {
        tiers.t1.count++;
      } else if (text.includes('5 lakh') || text.includes('5,00,000') || text.includes('5 లక్షల')) {
        tiers.t2.count++;
      } else if (text.includes('pension') || text.includes('10,000') || text.includes('3,000') || text.includes('aasara')) {
        tiers.t3.count++;
      } else if (text.includes('incentive') || text.includes('matru') || text.includes('pmmvy') || text.includes('dbt') || text.includes('5,000') || text.includes('6,000') || text.includes('12,000')) {
        tiers.t5.count++;
      } else {
        tiers.t4.count++;
      }
    });

    return Object.keys(tiers).map(k => ({
      name: isEn ? tiers[k].en : tiers[k].te,
      count: tiers[k].count
    }));
  }, [schemeList, isEn]);

  const handleBarClick = (entry) => {
    if (onSelectCategory && entry) {
      onSelectCategory(entry.key || entry.name);
    }
  };

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    if (typeof window.closeSchemesDashboardModal === 'function') {
      window.closeSchemesDashboardModal();
    }
  };

  return (
    <div className="schemes-recharts-dashboard" style={{
      background: '#ffffff',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      padding: isMobile ? '8px 10px 12px' : '18px',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Mobile-Friendly Sticky Header with Embedded Close Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        paddingBottom: '8px',
        marginBottom: '10px',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: isMobile ? '1.2rem' : '1.4rem' }}>📊</span>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              margin: 0,
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              fontWeight: '800',
              color: '#0f172a',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {isEn ? 'Schemes Analytics & Insights' : 'ఆరోగ్య పథకాల విశ్లేషణ (Analytics)'}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
              {isEn ? 'Live metrics, coverage tiers & categories' : 'వర్గాలు, వయస్సు & అర్హతల ప్రత్యక్ష విశ్లేషణ'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={isEn ? 'Close Analytics' : 'విశ్లేషణ మూసివేయి'}
          title={isEn ? 'Close' : 'మూసివేయి'}
          style={{
            background: '#dc2626',
            color: '#ffffff',
            border: 'none',
            padding: isMobile ? '5px 10px' : '6px 14px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: isMobile ? '0.78rem' : '0.86rem',
            fontWeight: '800',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 5px rgba(220, 38, 38, 0.35)',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>✕</span>
          <span>{isEn ? 'Close' : 'మూసివేయి'}</span>
        </button>
      </div>

      {/* Top KPI Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '6px' : '8px',
        marginBottom: isMobile ? '12px' : '16px'
      }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: isMobile ? '6px 8px' : '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: '900', color: '#15803d' }}>{kpiMetrics.total}</div>
          <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', color: '#166534', marginTop: '1px' }}>
            {isEn ? 'Total Schemes' : 'మొత్తం పథకాలు'}
          </div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: isMobile ? '6px 8px' : '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: '900', color: '#1d4ed8' }}>{kpiMetrics.ap}</div>
          <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', color: '#1e40af', marginTop: '1px' }}>
            {isEn ? 'AP State' : 'ఆంధ్రప్రదేశ్'}
          </div>
        </div>

        <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: isMobile ? '6px 8px' : '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: '900', color: '#7e22ce' }}>{kpiMetrics.national}</div>
          <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', color: '#6b21a8', marginTop: '1px' }}>
            {isEn ? 'National' : 'జాతీయ పథకాలు'}
          </div>
        </div>

        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: isMobile ? '6px 8px' : '10px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: '900', color: '#c2410c' }}>{kpiMetrics.surgeries}</div>
          <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', color: '#9a3412', marginTop: '1px' }}>
            {isEn ? 'Free Surgeries' : 'ఉచిత శస్త్రచికిత్స'}
          </div>
        </div>

        <div style={{
          background: '#fdf2f8',
          border: '1px solid #fbcfe8',
          borderRadius: '8px',
          padding: isMobile ? '6px 8px' : '10px 12px',
          textAlign: 'center',
          gridColumn: isMobile ? 'span 2' : 'auto'
        }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: '900', color: '#be185d' }}>{kpiMetrics.dbt}</div>
          <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: '700', color: '#9d174d', marginTop: '1px' }}>
            {isEn ? 'Cash DBT & Pensions' : 'నగదు బదిలీ & పెన్షన్'}
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs & View Switch */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '10px',
        marginBottom: '14px'
      }}>
        {/* Metric Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '2px' }}>
          {[
            { id: 'category', label_en: 'Specialties & Care', label_te: 'వైద్య విభాగాలు' },
            { id: 'benefits', label_en: 'Coverage Tiers', label_te: 'ఆర్థిక ప్రయోజనాలు' },
            { id: 'age', label_en: 'Target Age Groups', label_te: 'వయో పరిమితులు' },
            { id: 'income', label_en: 'Income & Cards', label_te: 'అర్హత & కార్డులు' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: activeTab === tab.id ? '1px solid #0284c7' : '1px solid #cbd5e1',
                background: activeTab === tab.id ? '#0284c7' : '#f8fafc',
                color: activeTab === tab.id ? '#ffffff' : '#334155',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {isEn ? tab.label_en : tab.label_te}
            </button>
          ))}
        </div>

        {/* View Mode Toggle: Charts vs Summary Table */}
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('charts')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'charts' ? '#ffffff' : 'transparent',
              color: viewMode === 'charts' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '0.74rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'charts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📊 {isEn ? 'Charts' : 'చార్ట్‌లు'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'table' ? '#ffffff' : 'transparent',
              color: viewMode === 'table' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '0.74rem',
              cursor: 'pointer',
              boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📋 {isEn ? 'Summary' : 'పట్టిక'}
          </button>
        </div>
      </div>

      {/* Content Rendering: Charts or Table */}
      {viewMode === 'charts' ? (
        <div style={{ width: '100%', height: isMobile ? 260 : 300, position: 'relative', overflow: 'hidden' }}>
          {activeTab === 'category' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout={isMobile ? 'vertical' : 'horizontal'}
                data={categoryData}
                margin={{ top: 10, right: 15, left: isMobile ? 10 : 10, bottom: isMobile ? 10 : 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={isMobile} horizontal={!isMobile} stroke="#f1f5f9" />
                {isMobile ? (
                  <>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 10, fill: '#334155' }}
                      tickFormatter={(val) => val.length > 18 ? val.substring(0, 16) + '…' : val}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      angle={-12}
                      textAnchor="end"
                      height={45}
                      tickFormatter={(val) => val.length > 22 ? val.substring(0, 20) + '…' : val}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  </>
                )}
                <Tooltip content={<CustomChartTooltip isEn={isEn} totalCount={schemeList.length} />} />
                <Bar dataKey="count" radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]} onClick={handleBarClick}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'benefits' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout={isMobile ? 'vertical' : 'horizontal'}
                data={benefitTierData}
                margin={{ top: 10, right: 15, left: isMobile ? 10 : 10, bottom: isMobile ? 10 : 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={isMobile} horizontal={!isMobile} stroke="#f1f5f9" />
                {isMobile ? (
                  <>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 10, fill: '#334155' }}
                      tickFormatter={(val) => val.length > 18 ? val.substring(0, 16) + '…' : val}
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 10, fill: '#475569' }}
                      angle={-12}
                      textAnchor="end"
                      height={45}
                      tickFormatter={(val) => val.length > 22 ? val.substring(0, 20) + '…' : val}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  </>
                )}
                <Tooltip content={<CustomChartTooltip isEn={isEn} totalCount={schemeList.length} />} />
                <Bar dataKey="count" fill="#8b5cf6" radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
                  {benefitTierData.map((_, idx) => (
                    <Cell key={`cell-ben-${idx}`} fill={COLORS[(idx + 4) % COLORS.length]} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'age' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageGroupData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={isMobile ? 70 : 90}
                  innerRadius={isMobile ? 35 : 45}
                  paddingAngle={3}
                >
                  {ageGroupData.map((_, index) => (
                    <Cell key={`cell-age-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip isEn={isEn} totalCount={schemeList.length} />} />
                <Legend
                  verticalAlign="bottom"
                  height={40}
                  wrapperStyle={{ fontSize: '0.72rem', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'income' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={incomeData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={isMobile ? 120 : 160}
                  tick={{ fontSize: 10, fill: '#334155' }}
                  tickFormatter={(val) => val.length > 20 ? val.substring(0, 18) + '…' : val}
                />
                <Tooltip content={<CustomChartTooltip isEn={isEn} totalCount={schemeList.length} />} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]}>
                  {incomeData.map((_, idx) => (
                    <Cell key={`cell-inc-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        /* Summary Table View */
        <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569' }}>
                  {isEn ? 'Category / Segment' : 'వర్గం / విభాగం'}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>
                  {isEn ? 'Count' : 'సంఖ్య'}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>
                  {isEn ? 'Share' : 'వాటా'}
                </th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'category' ? categoryData : activeTab === 'benefits' ? benefitTierData : activeTab === 'age' ? ageGroupData : incomeData).map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }} onClick={() => handleBarClick(row)}>
                  <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0f172a' }}>{row.name}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', color: '#0284c7' }}>{row.count}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>
                    {schemeList.length > 0 ? `${Math.round((row.count / schemeList.length) * 100)}%` : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Category Filtering Chips */}
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>
          {isEn ? '💡 Quick Filter: Tap any category to view schemes:' : '💡 త్వరిత ఫిల్టర్: పథకాలను చూడటానికి తాకండి:'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {categoryData.slice(0, 6).map((cat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleBarClick(cat)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.72rem',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Global mounting function for vanilla EJS integration
let _reactDashboardRoot = null;

window.mountSchemesDashboard = function (containerId = 'schemesDashboardRoot', schemesData = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const data = schemesData || window.schemesCatalog || window.schemesData || {};
  
  if (!_reactDashboardRoot) {
    _reactDashboardRoot = createRoot(container);
  }

  _reactDashboardRoot.render(
    <SchemesAnalyticsDashboard
      schemes={data}
      onClose={() => {
        if (typeof window.closeSchemesDashboardModal === 'function') {
          window.closeSchemesDashboardModal();
        }
      }}
      onSelectCategory={(cat) => {
        if (typeof window.closeSchemesDashboardModal === 'function') {
          window.closeSchemesDashboardModal();
        }
        if (window.filterSchemesByCategory) {
          window.filterSchemesByCategory(cat);
        } else {
          const searchInput = document.getElementById('searchInput') || document.getElementById('searchQuery');
          if (searchInput) {
            searchInput.value = cat;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      }}
      onFilterDistrict={(dist) => {
        if (window.filterSchemesByDistrict) {
          window.filterSchemesByDistrict(dist);
        }
      }}
    />
  );
};
