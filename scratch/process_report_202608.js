import fs from 'fs';
import path from 'path';

// 定数定義
const REPORT_MONTH = '2026-08';
const PERIOD_START = '2026-08-01';
const PERIOD_END = '2026-08-31';
const MON_YY = "Aug'26";
const JPY_USD_RATE = 159.2466; // Stay22用為替レート (売上0だがデフォルト定義)

// ストリーム定義
const STREAMS = [
  { key: "jp_ishigaki", label: "石垣島 (日本語)" },
  { key: "en_ishigaki", label: "石垣島 (英語)" },
  { key: "jp_miyako", label: "宮古島 (日本語)" },
  { key: "en_miyako", label: "宮古島 (英語)" },
  { key: "jp_yoron", label: "与論島 (日本語)" },
  { key: "en_yoron", label: "与論島 (英語)" },
  { key: "jp_kume", label: "久米島 (日本語)" },
  { key: "en_kume", label: "久米島 (英語)" },
  { key: "jp_aka", label: "阿嘉島 (日本語)" },
  { key: "en_aka", label: "阿嘉島 (英語)" },
  { key: "jp_amami", label: "奄美大島 (日本語)" },
  { key: "en_amami", label: "奄美大島 (英語)" },
  { key: "jp_other", label: "その他 日本 (日本語)" },
  { key: "en_other", label: "その他 日本 (英語)" },
  { key: "cjp", label: "コンダオ (日本語)" },
  { key: "cen", label: "コンダオ (英語)" },
  { key: "hjp", label: "ホイアン/チャム (日本語)" },
  { key: "hen", label: "ホイアン/チャム (英語)" }
];

// CSV行パース関数
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, '').trim());
}

// ストリーム分類関数 (stream_mapping.mdに基づく)
function getStream(path) {
  if (path.startsWith('/destinations/ishigaki-island/')) return 'jp_ishigaki';
  if (path.startsWith('/en/destinations/ishigaki-island/')) return 'en_ishigaki';
  if (path.startsWith('/destinations/miyako-island/')) return 'jp_miyako';
  if (path.startsWith('/en/destinations/miyako-island/')) return 'en_miyako';
  if (path.startsWith('/destinations/yoron-island/')) return 'jp_yoron';
  if (path.startsWith('/destinations/kume-island/')) return 'jp_kume';
  if (path.startsWith('/destinations/aka-island/')) return 'jp_aka';
  if (path.startsWith('/destinations/amami-island/')) return 'jp_amami';
  if (path.startsWith('/en/destinations/amami-island/')) return 'en_amami';
  
  if (path.startsWith('/destinations/con-dao-island/') || path.startsWith('/hotels/con-dao-island/')) return 'cjp';
  if (path.startsWith('/en/destinations/con-dao-island/') || path.startsWith('/en/hotels/con-dao-island/')) return 'cen';
  
  const isHjpPath = path.startsWith('/destinations/cham-island/') || 
                    path.startsWith('/hotels/hoian-old-town/') || 
                    path.startsWith('/hotels/an-bang/') || 
                    path.startsWith('/destinations/hoi-an/') || 
                    path.startsWith('/destinations/an-bang/');
  if (isHjpPath) return 'hjp';
  
  const isHenPath = path.startsWith('/en/destinations/cham-island/') || 
                    path.startsWith('/en/hotels/hoian-old-town/') || 
                    path.startsWith('/en/hotels/an-bang/') || 
                    path.startsWith('/en/destinations/hoi-an/') || 
                    path.startsWith('/en/destinations/an-bang/');
  if (isHenPath) return 'hen';
  
  if (path === '/' || path.startsWith('/hotels/okinawa-main/')) return 'jp_other';
  if (path.startsWith('/en/')) return 'en_other';
  
  if (path.startsWith('/en')) return 'en_other';
  return 'jp_other';
}

// キャンペーンIDマッピング関数
function mapCampaignToStream(campaignId) {
  const id = campaignId.toLowerCase();
  const isEn = id.includes('en');
  if (id.includes('chamisland') || id.includes('hoian') || id.includes('an-bang') || id.includes('an_bang')) {
    return isEn ? 'hen' : 'hjp';
  }
  if (id.includes('condao') || id.includes('con-dao')) {
    return isEn ? 'cen' : 'cjp';
  }
  if (id.includes('ishigaki')) {
    return isEn ? 'en_ishigaki' : 'jp_ishigaki';
  }
  if (id.includes('miyako')) {
    return isEn ? 'en_miyako' : 'jp_miyako';
  }
  if (id.includes('yoron')) {
    return 'jp_yoron';
  }
  if (id.includes('kume')) {
    return 'jp_kume';
  }
  if (id.includes('aka')) {
    return 'jp_aka';
  }
  if (id.includes('amami')) {
    return isEn ? 'en_amami' : 'jp_amami';
  }
  return isEn ? 'en_other' : 'jp_other';
}

// 1. 各データのパースと集計

// GA4
const ga4Lines = fs.readFileSync('src/data/actual_dl/202608.csv', 'utf8').split('\n');
const ga4Data = [];
let ga4HeaderIndex = -1;

for (let i = 0; i < ga4Lines.length; i++) {
  if (ga4Lines[i].includes('ページパスとスクリーン クラス,表示回数')) {
    ga4HeaderIndex = i;
    break;
  }
}

if (ga4HeaderIndex === -1) {
  throw new Error('GA4 header not found');
}

for (let i = ga4HeaderIndex + 1; i < ga4Lines.length; i++) {
  const line = ga4Lines[i].trim();
  if (!line || line.startsWith('#')) continue;
  const cols = parseCsvLine(line);
  if (cols.length < 8) continue;
  
  ga4Data.push({
    path: cols[0],
    pageviews: parseInt(cols[1], 10),
    users: parseInt(cols[2], 10),
    avgEngagementTime: parseFloat(cols[4]),
    keyEvents: parseInt(cols[6], 10),
    revenue: parseInt(cols[7], 10)
  });
}

// 楽天売上
let rakutenRewards = 0;
if (fs.existsSync('src/data/actual_dl/202608_rakuten.csv')) {
  const rakutenLines = fs.readFileSync('src/data/actual_dl/202608_rakuten.csv', 'utf8').split('\n');
  for (let i = 0; i < rakutenLines.length; i++) {
    const line = rakutenLines[i].trim();
    if (!line || line.includes('期間別成果') || line.includes('発生日') || line.includes('date,rewards')) continue;
    const cols = parseCsvLine(line);
    if (cols.length >= 2) {
      rakutenRewards += parseInt(cols[1], 10) || 0;
    }
  }
}

// Stay22売上 (ユーザーより「stay22は売上0」と明示)
let stay22RevenueByStream = {};
STREAMS.forEach(s => stay22RevenueByStream[s.key] = 0);
let totalStay22Jpy = 0;

if (fs.existsSync('src/data/actual_dl/202608_stay22.csv')) {
  const stay22Lines = fs.readFileSync('src/data/actual_dl/202608_stay22.csv', 'utf8').split('\n');
  if (stay22Lines.length > 1) {
    const header = parseCsvLine(stay22Lines[0]);
    const commissionIdx = header.indexOf('Commission');
    const campaignIdx = header.indexOf('Campaign IDs');
    
    for (let i = 1; i < stay22Lines.length; i++) {
      const line = stay22Lines[i].trim();
      if (!line) continue;
      const cols = parseCsvLine(line);
      if (cols.length > Math.max(commissionIdx, campaignIdx)) {
        const commissionUsd = parseFloat(cols[commissionIdx]) || 0;
        const campaignId = cols[campaignIdx] || '';
        const commissionJpy = Math.round(commissionUsd * JPY_USD_RATE);
        const stream = mapCampaignToStream(campaignId);
        stay22RevenueByStream[stream] += commissionJpy;
        totalStay22Jpy += commissionJpy;
      }
    }
  }
}

// 売上マッピングの整理
const streamRevenue = {};
STREAMS.forEach(s => streamRevenue[s.key] = 0);
// 楽天売上は jp_other
streamRevenue['jp_other'] += rakutenRewards;
// Stay22売上をマージ
STREAMS.forEach(s => {
  streamRevenue[s.key] += stay22RevenueByStream[s.key];
});

const totalRevenue = Object.values(streamRevenue).reduce((a, b) => a + b, 0);

// GA4数値のストリーム集計
const streamPv = {};
const streamUsers = {};
const streamPages = {};
STREAMS.forEach(s => {
  streamPv[s.key] = 0;
  streamUsers[s.key] = 0;
  streamPages[s.key] = new Set();
});

ga4Data.forEach(row => {
  const stream = getStream(row.path);
  if (!streamPv.hasOwnProperty(stream)) {
    console.warn(`Unknown stream for path: ${row.path} -> mapped to jp_other`);
    streamPv['jp_other'] += row.pageviews;
    streamUsers['jp_other'] += row.users;
    streamPages['jp_other'].add(row.path);
  } else {
    streamPv[stream] += row.pageviews;
    streamUsers[stream] += row.users;
    streamPages[stream].add(row.path);
  }
});

const totalPageviews = ga4Data.reduce((sum, r) => sum + r.pageviews, 0);
const totalUsers = ga4Data.reduce((sum, r) => sum + r.users, 0);
const totalKeyEvents = ga4Data.reduce((sum, r) => sum + r.keyEvents, 0);

// GSC
const googleLines = fs.readFileSync('src/data/actual_dl/202608_google.csv', 'utf8').split('\n');
const googleData = [];
for (let i = 1; i < googleLines.length; i++) {
  const line = googleLines[i].trim();
  if (!line) continue;
  const cols = parseCsvLine(line);
  if (cols.length < 5) continue;
  const url = cols[0];
  if (url.includes('/images/')) continue; // 画像除外
  
  googleData.push({
    url,
    clicks: parseInt(cols[1], 10),
    impressions: parseInt(cols[2], 10),
    ctr: parseFloat(cols[3].replace('%', '')),
    position: parseFloat(cols[4])
  });
}

const gClicks = googleData.reduce((sum, r) => sum + r.clicks, 0);
const gImpressions = googleData.reduce((sum, r) => sum + r.impressions, 0);
const gAvgCtr = gImpressions > 0 ? (gClicks / gImpressions * 100) : 0;
const gWeightedPosSum = googleData.reduce((sum, r) => sum + r.position * r.impressions, 0);
const gAvgPosition = gImpressions > 0 ? (gWeightedPosSum / gImpressions) : 0;

// Bing
const bingLines = fs.readFileSync('src/data/actual_dl/202608_bing.csv', 'utf8').split('\n');
const bingData = [];
for (let i = 1; i < bingLines.length; i++) {
  const line = bingLines[i].trim();
  if (!line) continue;
  const cols = parseCsvLine(line);
  if (cols.length < 5) continue;
  const url = cols[0];
  if (url.includes('/images/')) continue; // 画像除外
  
  bingData.push({
    url,
    clicks: parseInt(cols[2], 10),
    impressions: parseInt(cols[1], 10),
    ctr: parseFloat(cols[3].replace('%', '')),
    position: parseFloat(cols[4])
  });
}

const bClicks = bingData.reduce((sum, r) => sum + r.clicks, 0);
const bImpressions = bingData.reduce((sum, r) => sum + r.impressions, 0);
const bAvgCtr = bImpressions > 0 ? (bClicks / bImpressions * 100) : 0;
const bWeightedPosSum = bingData.reduce((sum, r) => sum + r.position * r.impressions, 0);
const bAvgPosition = bImpressions > 0 ? (bWeightedPosSum / bImpressions) : 0;

// 2. 前月比較データの読み込み (202607.json)
let prevReport = null;
if (fs.existsSync('src/reports/202607.json')) {
  prevReport = JSON.parse(fs.readFileSync('src/reports/202607.json', 'utf8'));
}

const momComparison = prevReport ? {
  pageviewsChange: parseFloat(((totalPageviews / prevReport.summary.totalPageviews - 1) * 100).toFixed(2)),
  usersChange: parseFloat(((totalUsers / prevReport.summary.totalUsers - 1) * 100).toFixed(2)),
  keyEventsChange: prevReport.summary.totalKeyEvents > 0 ? parseFloat(((totalKeyEvents / prevReport.summary.totalKeyEvents - 1) * 100).toFixed(2)) : 0
} : undefined;

// 前月パス抽出 (newPages検出用)
const prevPaths = new Set();
if (prevReport) {
  function extractPaths(obj) {
    if (typeof obj === 'string') {
      if (obj.startsWith('/')) {
        prevPaths.add(obj);
      } else if (obj.startsWith('https://ritotabi.com/')) {
        prevPaths.add(obj.replace('https://ritotabi.com', ''));
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(val => extractPaths(val));
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => extractPaths(obj[key]));
    }
  }
  extractPaths(prevReport);
}

const newPages = ga4Data
  .map(r => r.path)
  .filter(p => !prevPaths.has(p));

// 言語別
const jpPv = ga4Data.filter(r => !r.path.startsWith('/en/')).reduce((sum, r) => sum + r.pageviews, 0);
const jpUsers = ga4Data.filter(r => !r.path.startsWith('/en/')).reduce((sum, r) => sum + r.users, 0);
const enPv = ga4Data.filter(r => r.path.startsWith('/en/')).reduce((sum, r) => sum + r.pageviews, 0);
const enUsers = ga4Data.filter(r => r.path.startsWith('/en/')).reduce((sum, r) => sum + r.users, 0);

// Top 10 Pages (PV降順)
const topPages = [...ga4Data]
  .sort((a, b) => b.pageviews - a.pageviews)
  .slice(0, 10)
  .map(r => ({
    path: r.path,
    pageviews: r.pageviews,
    users: r.users,
    avgEngagementTime: parseFloat(r.avgEngagementTime.toFixed(2)),
    keyEvents: r.keyEvents
  }));

// Zero CTR Pages (GSCで表示回数 >= 50 かつ クリック = 0)
const zeroCtrPages = googleData
  .filter(r => r.impressions >= 50 && r.clicks === 0)
  .sort((a, b) => b.impressions - a.impressions)
  .map(r => ({
    url: r.url,
    impressions: r.impressions,
    position: parseFloat(r.position.toFixed(2))
  }));

// Search Engines click comparison
const totalSearchClicks = gClicks + bClicks;
const engineComparison = {
  googleShare: totalSearchClicks > 0 ? parseFloat((gClicks / totalSearchClicks * 100).toFixed(2)) : 0,
  bingShare: totalSearchClicks > 0 ? parseFloat((bClicks / totalSearchClicks * 100).toFixed(2)) : 0
};

// GSC/Bing top search pages
const gTopSearchPages = [...googleData]
  .sort((a, b) => b.clicks !== a.clicks ? b.clicks - a.clicks : b.impressions - a.impressions)
  .slice(0, 10)
  .map(r => ({
    url: r.url,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: parseFloat(r.ctr.toFixed(2)),
    position: parseFloat(r.position.toFixed(2))
  }));

const bTopSearchPages = [...bingData]
  .sort((a, b) => b.clicks !== a.clicks ? b.clicks - a.clicks : b.impressions - a.impressions)
  .slice(0, 10)
  .map(r => ({
    url: r.url,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: parseFloat(r.ctr.toFixed(2)),
    position: parseFloat(r.position.toFixed(2))
  }));

// Engagement
const topEngagedPages = ga4Data
  .filter(r => r.users >= 2)
  .sort((a, b) => b.avgEngagementTime - a.avgEngagementTime)
  .slice(0, 10)
  .map(r => ({
    path: r.path,
    avgEngagementTime: parseFloat(r.avgEngagementTime.toFixed(2)),
    users: r.users
  }));

const lowEngagementPages = ga4Data
  .filter(r => r.users >= 2 && r.avgEngagementTime < 30)
  .sort((a, b) => a.avgEngagementTime - b.avgEngagementTime)
  .map(r => ({
    path: r.path,
    avgEngagementTime: parseFloat(r.avgEngagementTime.toFixed(2)),
    users: r.users
  }));

const keyEventPages = ga4Data
  .filter(r => r.keyEvents > 0)
  .sort((a, b) => b.keyEvents - a.keyEvents)
  .map(r => ({
    path: r.path,
    keyEvents: r.keyEvents,
    users: r.users,
    cvRate: parseFloat((r.keyEvents / r.users * 100).toFixed(2))
  }));

// Conversion
const topCvPages = [...keyEventPages]
  .sort((a, b) => b.keyEvents - a.keyEvents)
  .slice(0, 10);

const hotelCvPages = ga4Data
  .filter(r => r.path.includes('/hotels/') && r.keyEvents > 0)
  .sort((a, b) => b.keyEvents - a.keyEvents)
  .map(r => ({
    path: r.path,
    keyEvents: r.keyEvents,
    cvRate: parseFloat((r.keyEvents / r.users * 100).toFixed(2))
  }));

const hotelCvSummary = {
  totalKeyEvents: hotelCvPages.reduce((sum, r) => sum + r.keyEvents, 0),
  pages: hotelCvPages
};

// 予実対比・キャリブレーション用データ読み込み
const vintagesData = JSON.parse(fs.readFileSync('src/data/forecast-vintages.json', 'utf8'));
const currentVintage = vintagesData.vintages.find(v => v.id === vintagesData.currentVintageId);
const augForecast = currentVintage.forecasts.find(f => f.m === MON_YY);

if (!augForecast) {
  throw new Error(`August forecasts not found in vintage ${vintagesData.currentVintageId}`);
}

// 各ストリームの予実比較とraw_factorの計算
const accuracyByStream = [];
const rawFactors = {};

STREAMS.forEach(s => {
  const forecastPv = augForecast.pv[s.key] || 0;
  const actualPv = streamPv[s.key] || 0;
  const accuracy = forecastPv > 0 ? parseFloat((actualPv / forecastPv * 100).toFixed(2)) : null;
  
  accuracyByStream.push({
    stream: s.key,
    label: s.label,
    forecastPv,
    actualPv,
    accuracy
  });

  if (forecastPv > 0) {
    rawFactors[s.key] = actualPv / forecastPv;
  }
});

// ゼロ予測ストリームのフォールバック (calibration_logic.md)
// 1. raw_factorの計算
STREAMS.forEach(s => {
  const forecastPv = augForecast.pv[s.key] || 0;
  if (forecastPv === 0) {
    const actualPv = streamPv[s.key] || 0;
    if (actualPv === 0) {
      rawFactors[s.key] = 0;
    } else {
      // フォールバックルール
      if (s.key === 'jp_amami') {
        rawFactors[s.key] = (rawFactors['jp_aka'] || 0) * 0.7;
      } else if (s.key === 'en_amami') {
        rawFactors[s.key] = (rawFactors['en_ishigaki'] || 0) * 0.5;
      } else if (s.key === 'cen') {
        rawFactors[s.key] = (rawFactors['cjp'] || 0) * 0.6;
      } else if (s.key === 'hjp') {
        rawFactors[s.key] = (rawFactors['cjp'] || 0);
      } else if (s.key === 'hen') {
        rawFactors[s.key] = (rawFactors['cen'] || 0);
      } else {
        // デフォルト
        rawFactors[s.key] = 0;
      }
    }
  }
});

// 2. dampened_factor の計算 (dampened_factor = sqrt(raw_factor))
const dampenedFactors = {};
STREAMS.forEach(s => {
  dampenedFactors[s.key] = parseFloat(Math.sqrt(rawFactors[s.key]).toFixed(4));
});

const totalActualPv = STREAMS.reduce((sum, s) => sum + (streamPv[s.key] || 0), 0);
const totalForecastPv = STREAMS.reduce((sum, s) => sum + (augForecast.pv[s.key] || 0), 0);
const overallAccuracy = totalForecastPv > 0 ? parseFloat((totalActualPv / totalForecastPv * 100).toFixed(2)) : 0;

// アクションアイテム自動生成
const actionItems = [];

// 1. ctr
if (zeroCtrPages.length > 0) {
  actionItems.push({
    category: "ctr",
    priority: "高",
    description: "表示回数が一定以上あるにもかかわらずクリックが発生していないページの検索スニペット（タイトルやディスクリプション）の改善。",
    targetPages: zeroCtrPages.map(p => p.url.replace('https://ritotabi.com', ''))
  });
}

// 2. engagement (平均エンゲージメント時間 < 15秒 かつ ユーザー >= 3)
const lowEngTargets = ga4Data
  .filter(r => r.users >= 3 && r.avgEngagementTime < 15)
  .map(r => r.path);

if (lowEngTargets.length > 0) {
  actionItems.push({
    category: "engagement",
    priority: "中",
    description: "直帰率の低減および平均エンゲージメント時間の向上のため、リード文や構成の改善、内部リンク追加を実施。",
    targetPages: lowEngTargets
  });
}

// 3. conversion (PV >= 50 かつ キーイベント = 0)
const noCvHighPvTargets = ga4Data
  .filter(r => r.pageviews >= 50 && r.keyEvents === 0)
  .map(r => r.path);

if (noCvHighPvTargets.length > 0) {
  actionItems.push({
    category: "conversion",
    priority: "高",
    description: "アクセス数が多いにもかかわらずキーイベント（アフィリエイト遷移等）が発生していないページについて、マイクロコンバージョン設計やボタン配置を改善。",
    targetPages: noCvHighPvTargets
  });
}

// 4. content (新規ページが検出された場合のフォローアップ)
if (newPages.length > 0) {
  actionItems.push({
    category: "content",
    priority: "低",
    description: "新しく検出されたページの検索インデックス状況とエンゲージメントの推移を監視し、必要に応じて初期SEO調整を実施。",
    targetPages: newPages
  });
}

// ハイライト生成 (自然言語)
const maxPvPage = topPages.length > 0 ? topPages[0].path : 'なし';
const highlights = [
  `総PVは ${totalPageviews.toLocaleString()} PV${momComparison ? `（前月比 ${momComparison.pageviewsChange >= 0 ? '+' : ''}${momComparison.pageviewsChange}%）` : ''}で、アクティブユーザーは ${totalUsers.toLocaleString()} 人${momComparison ? `（前月比 ${momComparison.usersChange >= 0 ? '+' : ''}${momComparison.usersChange}%）` : ''}でした。`,
  `最もアクセスの多いページは「${maxPvPage}」（${topPages.length > 0 ? topPages[0].pageviews.toLocaleString() : 0} PV）でした。`,
  `キーイベントは計 ${totalKeyEvents} 件発生し、合計売上（アフィリエイト報酬）は ${totalRevenue.toLocaleString()} 円（楽天: ${rakutenRewards.toLocaleString()}円、Stay22: ${totalStay22Jpy.toLocaleString()}円）に達しました。`
];

// 3. レポートJSONオブジェクト作成
const nextVintageIndex = vintagesData.vintages.length;
const nextVintageId = `v${nextVintageIndex}_202608`;

const reportJson = {
  reportMonth: REPORT_MONTH,
  generatedAt: new Date().toISOString(),
  generatedBy: "skill",
  periodStart: PERIOD_START,
  periodEnd: PERIOD_END,
  revenue: totalRevenue,
  summary: {
    totalPageviews,
    totalUsers,
    totalKeyEvents,
    totalRevenue,
    highlights,
    momComparison
  },
  traffic: {
    byStream: STREAMS.map(s => ({
      stream: s.key,
      label: s.label,
      pageviews: streamPv[s.key] || 0,
      users: streamUsers[s.key] || 0,
      pagesCount: streamPages[s.key].size
    })),
    byLanguage: {
      jp: { pageviews: jpPv, users: jpUsers },
      en: { pageviews: enPv, users: enUsers }
    },
    topPages,
    newPages
  },
  search: {
    google: {
      totalClicks: gClicks,
      totalImpressions: gImpressions,
      avgCtr: parseFloat(gAvgCtr.toFixed(2)),
      avgPosition: parseFloat(gAvgPosition.toFixed(2)),
      topPages: gTopSearchPages,
      zeroCtrPages
    },
    bing: {
      totalClicks: bClicks,
      totalImpressions: bImpressions,
      avgCtr: parseFloat(bAvgCtr.toFixed(2)),
      avgPosition: parseFloat(bAvgPosition.toFixed(2)),
      topPages: bTopSearchPages
    },
    engineComparison
  },
  engagement: {
    topEngagedPages,
    lowEngagementPages,
    keyEventPages
  },
  conversion: {
    totalKeyEvents,
    totalRevenue,
    topCvPages,
    hotelCvSummary
  },
  forecastComparison: {
    vintageId: vintagesData.currentVintageId,
    byStream: accuracyByStream,
    overallAccuracy,
    calibrationApplied: {
      newVintageId: nextVintageId,
      factors: dampenedFactors
    }
  },
  actionItems
};

// レポートJSON書き出し
const reportFilePath = `src/reports/202608.json`;
fs.writeFileSync(reportFilePath, JSON.stringify(reportJson, null, 2), 'utf8');
console.log(`Saved report to ${reportFilePath}`);


// 4. キャリブレーションと予測更新の処理

// 新しいビンテージオブジェクト作成
const initialVintage = vintagesData.vintages.find(v => v.id === 'v0_initial');

const calibratedForecasts = initialVintage.forecasts.map(f => {
  const newPv = {};
  STREAMS.forEach(s => {
    const initPv = f.pv[s.key] || 0;
    const factor = dampenedFactors[s.key];
    newPv[s.key] = Math.round(initPv * factor);
  });
  return {
    m: f.m,
    mp: f.mp,
    pv: newPv
  };
});

const newVintage = {
  id: nextVintageId,
  createdAt: new Date().toISOString(),
  label: "8月実績反映キャリブレーション",
  trigger: "calibration",
  calibration: {
    baseMonth: REPORT_MONTH,
    factors: dampenedFactors,
    streamAccuracy: Object.fromEntries(
      accuracyByStream.map(item => [
        item.stream, 
        { 
          forecastPv: item.forecastPv, 
          actualPv: item.actualPv, 
          accuracy: item.accuracy 
        }
      ])
    ),
    overallAccuracy
  },
  forecasts: calibratedForecasts
};

// forecast-vintages.jsonを更新
vintagesData.currentVintageId = nextVintageId;
vintagesData.vintages.push(newVintage);
fs.writeFileSync('src/data/forecast-vintages.json', JSON.stringify(vintagesData, null, 2), 'utf8');
console.log(`Updated forecast-vintages.json with new vintage: ${nextVintageId}`);


// 5. baseline-pv.ts の更新
const baselineContent = `import type { BasePVRow } from "../utils/calc";

export const BASE_PV_OBJ: BasePVRow[] = ${JSON.stringify(calibratedForecasts, null, 2)};
`;
fs.writeFileSync('src/data/baseline-pv.ts', baselineContent, 'utf8');
console.log(`Updated baseline-pv.ts with new forecasts`);


// 6. actual-pv.ts の更新
const actualPvRecord = {
  m: MON_YY,
  mp: "8月",
  pv: Object.fromEntries(STREAMS.map(s => [s.key, streamPv[s.key] || 0])),
  rev: streamRevenue
};

const actualPvContent = fs.readFileSync('src/data/actual-pv.ts', 'utf8');
const insertIndex = actualPvContent.lastIndexOf('];');
if (insertIndex !== -1) {
  const newRow = `  {\n    "m": "${actualPvRecord.m}",\n    "mp": "${actualPvRecord.mp}",\n    "pv": ${JSON.stringify(actualPvRecord.pv, null, 6).replace(/\n/g, '\n    ')},\n    "rev": ${JSON.stringify(actualPvRecord.rev, null, 6).replace(/\n/g, '\n    ')}\n  },\n`;
  const updatedContent = actualPvContent.slice(0, insertIndex) + newRow + actualPvContent.slice(insertIndex);
  fs.writeFileSync('src/data/actual-pv.ts', updatedContent, 'utf8');
  console.log(`Added August actual data to actual-pv.ts`);
} else {
  console.error('Could not find inserting point in actual-pv.ts');
}

console.log('Processing completed successfully!');
