import fs from 'fs';
import path from 'path';

// 各種ファイルパス
const WORKSPACE_DIR = '/home/mune1/dev/ritotabi/ritotabi_analytics';
const GA4_FILE = path.join(WORKSPACE_DIR, 'src/data/actual_dl/202606.csv');
const GSC_FILE = path.join(WORKSPACE_DIR, 'src/data/actual_dl/202606_google.csv');
const BING_FILE = path.join(WORKSPACE_DIR, 'src/data/actual_dl/202606_bing.csv');
const RAKUTEN_FILE = path.join(WORKSPACE_DIR, 'src/data/actual_dl/202606_rakuten.csv');

const PREV_REPORT_FILE = path.join(WORKSPACE_DIR, 'src/reports/202605.json');
const PREV_GA4_FILE = path.join(WORKSPACE_DIR, 'src/data/actual_dl/202605.csv');

const FORECAST_VINTAGES_FILE = path.join(WORKSPACE_DIR, 'src/data/forecast-vintages.json');
const ACTUAL_PV_TS_FILE = path.join(WORKSPACE_DIR, 'src/data/actual-pv.ts');
const BASELINE_PV_TS_FILE = path.join(WORKSPACE_DIR, 'src/data/baseline-pv.ts');
const OUTPUT_REPORT_FILE = path.join(WORKSPACE_DIR, 'src/reports/202606.json');

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

const STREAM_MAP = new Map(STREAMS.map(s => [s.key, s.label]));

// ストリーム判定ルール
function getStreamKey(pathStr) {
  const cleanPath = pathStr.split('?')[0].split('#')[0];
  
  if (cleanPath.startsWith('/en/destinations/ishigaki-island')) return 'en_ishigaki';
  if (cleanPath.startsWith('/destinations/ishigaki-island')) return 'jp_ishigaki';
  
  if (cleanPath.startsWith('/en/destinations/miyako-island')) return 'en_miyako';
  if (cleanPath.startsWith('/destinations/miyako-island')) return 'jp_miyako';
  
  if (cleanPath.startsWith('/destinations/yoron-island')) return 'jp_yoron';
  if (cleanPath.startsWith('/destinations/kume-island')) return 'jp_kume';
  if (cleanPath.startsWith('/destinations/aka-island')) return 'jp_aka';
  
  if (cleanPath.startsWith('/en/destinations/amami-island')) return 'en_amami';
  if (cleanPath.startsWith('/destinations/amami-island')) return 'jp_amami';
  
  if (cleanPath.startsWith('/destinations/con-dao-island') || cleanPath.startsWith('/hotels/con-dao-island')) return 'cjp';
  if (cleanPath.startsWith('/en/destinations/con-dao-island') || cleanPath.startsWith('/en/hotels/con-dao-island')) return 'cen';
  
  if (cleanPath.startsWith('/destinations/cham-island') || 
      cleanPath.startsWith('/hotels/hoian-old-town') || 
      cleanPath.startsWith('/hotels/an-bang') || 
      cleanPath.startsWith('/destinations/hoi-an') || 
      cleanPath.startsWith('/destinations/an-bang')) return 'hjp';
      
  if (cleanPath.startsWith('/en/destinations/cham-island') || 
      cleanPath.startsWith('/en/hotels/hoian-old-town') || 
      cleanPath.startsWith('/en/hotels/an-bang') || 
      cleanPath.startsWith('/en/destinations/hoi-an') || 
      cleanPath.startsWith('/en/destinations/an-bang')) return 'hen';
      
  if (cleanPath === '/') return 'jp_other';
  if (cleanPath === '/en' || cleanPath === '/en/') return 'en_other';
  
  if (cleanPath.startsWith('/hotels/okinawa-main')) return 'jp_other';
  
  if (cleanPath.startsWith('/en/')) return 'en_other';
  return 'jp_other';
}

function getPathFromUrl(url) {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      return parsed.pathname;
    }
    return url;
  } catch (e) {
    return url;
  }
}

// CSVパースユーティリティ
function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  const result = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // シンプルなCSVパース (クォーテーション対応)
    const row = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    result.push(row);
  }
  return result;
}

// GA4 CSV パース
function parseGA4(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const allLines = content.split(/\r?\n/);
  const rows = [];
  let headerIndex = -1;
  
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();
    // BOM対応
    const cleanLine = line.replace(/^\uFEFF/, '');
    if (cleanLine.startsWith('ページパスとスクリーン クラス')) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    // もし見つからなければ、部分一致も試す
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim();
      if (line.includes('ページパスとスクリーン')) {
        headerIndex = i;
        break;
      }
    }
  }
  
  if (headerIndex === -1) {
    throw new Error('GA4 CSV header not found');
  }
  
  // ヘッダー行からもBOMを除去
  const headerLine = allLines[headerIndex].replace(/^\uFEFF/, '');
  const headers = parseCSV(headerLine)[0];
  console.log('GA4 Headers:', headers);
  
  for (let i = headerIndex + 1; i < allLines.length; i++) {
    const line = allLines[i].trim();
    if (!line || line.startsWith('#')) continue;
    const values = parseCSV(line)[0];
    if (!values || values.length < headers.length) continue;
    
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index];
    });
    rows.push(rowObj);
  }
  return rows;
}

// 楽天 CSV パース
function parseRakuten(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const allLines = content.split(/\r?\n/);
  const rows = [];
  let headerIndex = -1;
  
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim().replace(/^\uFEFF/, '');
    if (line.startsWith('発生日') || line.startsWith('date') || line.startsWith('"発生日"')) {
      headerIndex = i;
      if (allLines[i+1] && allLines[i+1].replace(/^\uFEFF/, '').includes('rewards')) {
        headerIndex = i + 1;
      }
      break;
    }
  }
  
  if (headerIndex === -1) {
    console.log('Rakuten header not found, printing first 5 lines:');
    for (let i = 0; i < Math.min(5, allLines.length); i++) {
      console.log(`Line ${i}:`, allLines[i]);
    }
    return [];
  }
  
  const headerLine = allLines[headerIndex].replace(/^\uFEFF/, '');
  const headers = parseCSV(headerLine)[0];
  console.log('Rakuten Headers:', headers);
  
  for (let i = headerIndex + 1; i < allLines.length; i++) {
    const line = allLines[i].trim();
    if (!line) continue;
    const values = parseCSV(line)[0];
    if (!values || values.length < headers.length) continue;
    
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index];
    });
    rows.push(rowObj);
  }
  console.log(`Rakuten parsed rows: ${rows.length}`);
  return rows;
}

// メイン集計ロジック
async function main() {
  console.log('--- 202606 月次レポート生成スクリプト実行開始 ---');
  
  // 1. 各種データの読み込みとパース
  console.log('データを読み込んでいます...');
  const ga4Data = parseGA4(GA4_FILE);
  const gscCSV = fs.readFileSync(GSC_FILE, 'utf-8');
  const gscRows = parseCSV(gscCSV).slice(1).filter(r => r.length >= 5);
  const bingCSV = fs.readFileSync(BING_FILE, 'utf-8');
  const bingRows = parseCSV(bingCSV).slice(1).filter(r => r.length >= 5);
  const rakutenRows = parseRakuten(RAKUTEN_FILE);
  
  // 楽天報酬集計
  let rakutenRevenue = 0;
  for (const row of rakutenRows) {
    const rewards = parseInt(row.rewards || row['成果報酬'] || '0', 10);
    rakutenRevenue += rewards;
  }
  console.log(`楽天アフィリエイト売上合計: ${rakutenRevenue} 円`);
  
  // Stay22は売上0
  const stay22Revenue = 0;
  
  // 2. 前月レポートの読み込み
  const prevReport = JSON.parse(fs.readFileSync(PREV_REPORT_FILE, 'utf-8'));
  const prevGa4 = parseGA4(PREV_GA4_FILE);
  const prevPages = new Set(prevGa4.map(r => r['ページパスとスクリーン クラス']));
  
  // 3. GA4集計
  let totalPageviews = 0;
  let totalUsers = 0;
  let totalKeyEvents = 0;
  
  const streamAggregate = {};
  STREAMS.forEach(s => {
    streamAggregate[s.key] = { pageviews: 0, users: 0, pages: new Set() };
  });
  
  const languageAggregate = {
    jp: { pageviews: 0, users: 0 },
    en: { pageviews: 0, users: 0 }
  };
  
  const pagesList = [];
  
  for (const row of ga4Data) {
    const path = row['ページパスとスクリーン クラス'];
    const pv = parseInt(row['表示回数'] || '0', 10);
    const users = parseInt(row['アクティブ ユーザー'] || '0', 10);
    const keyEvents = parseInt(row['キーイベント'] || '0', 10);
    const avgEngTime = parseFloat(row['アクティブ ユーザーあたりの平均エンゲージメント時間'] || '0');
    
    totalPageviews += pv;
    totalUsers += users;
    totalKeyEvents += keyEvents;
    
    const streamKey = getStreamKey(path);
    if (streamAggregate[streamKey]) {
      streamAggregate[streamKey].pageviews += pv;
      streamAggregate[streamKey].users += users;
      streamAggregate[streamKey].pages.add(path);
    }
    
    const isEn = path.startsWith('/en/');
    const langKey = isEn ? 'en' : 'jp';
    languageAggregate[langKey].pageviews += pv;
    languageAggregate[langKey].users += users;
    
    pagesList.push({
      path,
      pageviews: pv,
      users,
      avgEngagementTime: avgEngTime,
      keyEvents
    });
  }
  
  console.log(`GA4総計 - PV: ${totalPageviews}, ユーザー: ${totalUsers}, キーイベント: ${totalKeyEvents}`);
  
  // byStream の整形
  const byStream = STREAMS.map(s => {
    return {
      stream: s.key,
      label: s.label,
      pageviews: streamAggregate[s.key].pageviews,
      users: streamAggregate[s.key].users,
      pagesCount: streamAggregate[s.key].pages.size
    };
  }).sort((a, b) => b.pageviews - a.pageviews);
  
  // topPages
  const topPages = [...pagesList].sort((a, b) => b.pageviews - a.pageviews).slice(0, 10);
  
  // newPages
  const newPages = pagesList
    .map(p => p.path)
    .filter(path => !prevPages.has(path));
    
  console.log(`新規検出ページ数: ${newPages.length}`);
  
  // 4. 検索パフォーマンス集計
  // GSC
  let gscTotalClicks = 0;
  let gscTotalImpressions = 0;
  let gscSumWeightedPosition = 0;
  const gscPages = [];
  const gscZeroCtrPages = [];
  
  for (const row of gscRows) {
    const url = row[0];
    if (url.includes('/images/')) continue;
    
    const clicks = parseInt(row[1] || '0', 10);
    const impressions = parseInt(row[2] || '0', 10);
    const ctrStr = row[3] || '0%';
    const ctr = parseFloat(ctrStr.replace('%', ''));
    const position = parseFloat(row[4] || '0');
    
    gscTotalClicks += clicks;
    gscTotalImpressions += impressions;
    gscSumWeightedPosition += position * impressions;
    
    gscPages.push({
      url,
      clicks,
      impressions,
      ctr: parseFloat(ctr.toFixed(2)),
      position
    });
    
    if (impressions >= 50 && clicks === 0) {
      gscZeroCtrPages.push({
        url,
        impressions,
        position
      });
    }
  }
  
  const gscAvgCtr = gscTotalImpressions > 0 ? parseFloat(((gscTotalClicks / gscTotalImpressions) * 100).toFixed(2)) : 0;
  const gscAvgPosition = gscTotalImpressions > 0 ? parseFloat((gscSumWeightedPosition / gscTotalImpressions).toFixed(2)) : 0;
  
  const gscTopPages = [...gscPages].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const gscZeroCtrPagesSorted = [...gscZeroCtrPages].sort((a, b) => b.impressions - a.impressions);
  
  // Bing
  let bingTotalClicks = 0;
  let bingTotalImpressions = 0;
  let bingSumWeightedPosition = 0;
  const bingPages = [];
  
  for (const row of bingRows) {
    const url = row[0];
    if (url.includes('/images/')) continue;
    
    const impressions = parseInt(row[1] || '0', 10);
    const clicks = parseInt(row[2] || '0', 10);
    const ctrStr = row[3] || '0%';
    const ctr = parseFloat(ctrStr.replace('%', ''));
    const position = parseFloat(row[4] || '0');
    
    bingTotalClicks += clicks;
    bingTotalImpressions += impressions;
    bingSumWeightedPosition += position * impressions;
    
    bingPages.push({
      url,
      clicks,
      impressions,
      ctr: parseFloat(ctr.toFixed(2)),
      position
    });
  }
  
  const bingAvgCtr = bingTotalImpressions > 0 ? parseFloat(((bingTotalClicks / bingTotalImpressions) * 100).toFixed(2)) : 0;
  const bingAvgPosition = bingTotalImpressions > 0 ? parseFloat((bingSumWeightedPosition / bingTotalImpressions).toFixed(2)) : 0;
  const bingTopPages = [...bingPages].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  
  // Share
  const totalEngineClicks = gscTotalClicks + bingTotalClicks;
  const googleShare = totalEngineClicks > 0 ? parseFloat(((gscTotalClicks / totalEngineClicks) * 100).toFixed(2)) : 0;
  const bingShare = totalEngineClicks > 0 ? parseFloat(((bingTotalClicks / totalEngineClicks) * 100).toFixed(2)) : 0;
  
  // 5. エンゲージメント集計
  // topEngagedPages: ユーザー >= 2, 平均エンゲージメント時間降順
  const topEngagedPages = pagesList
    .filter(p => p.users >= 2)
    .sort((a, b) => b.avgEngagementTime - a.avgEngagementTime)
    .slice(0, 10)
    .map(p => ({
      path: p.path,
      avgEngagementTime: p.avgEngagementTime,
      users: p.users
    }));
    
  // lowEngagementPages: ユーザー >= 2 かつ 平均エンゲージメント時間 < 30秒, 平均エンゲージメント時間昇順
  const lowEngagementPages = pagesList
    .filter(p => p.users >= 2 && p.avgEngagementTime < 30)
    .sort((a, b) => a.avgEngagementTime - b.avgEngagementTime)
    .map(p => ({
      path: p.path,
      avgEngagementTime: p.avgEngagementTime,
      users: p.users
    }));
    
  // keyEventPages: キーイベント > 0, キーイベント降順
  const keyEventPages = pagesList
    .filter(p => p.keyEvents > 0)
    .sort((a, b) => b.keyEvents - a.keyEvents)
    .map(p => ({
      path: p.path,
      keyEvents: p.keyEvents,
      users: p.users,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    }));
    
  // 6. コンバージョン集計
  const totalRevenue = rakutenRevenue + stay22Revenue;
  const topCvPages = pagesList
    .filter(p => p.keyEvents > 0)
    .sort((a, b) => b.keyEvents - a.keyEvents)
    .slice(0, 10)
    .map(p => ({
      path: p.path,
      keyEvents: p.keyEvents,
      users: p.users,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    }));
    
  const hotelPages = pagesList.filter(p => p.path.includes('/hotels/'));
  const hotelTotalKeyEvents = hotelPages.reduce((sum, p) => sum + p.keyEvents, 0);
  const hotelCvPages = hotelPages
    .filter(p => p.keyEvents > 0)
    .sort((a, b) => b.keyEvents - a.keyEvents)
    .map(p => ({
      path: p.path,
      keyEvents: p.keyEvents,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    }));
    
  // 7. 前月比の算出
  const momComparison = {
    pageviewsChange: parseFloat(((totalPageviews / prevReport.summary.totalPageviews - 1) * 100).toFixed(2)),
    usersChange: parseFloat(((totalUsers / prevReport.summary.totalUsers - 1) * 100).toFixed(2)),
    keyEventsChange: parseFloat(((totalKeyEvents / prevReport.summary.totalKeyEvents - 1) * 100).toFixed(2))
  };
  
  // 8. 自然言語ハイライト
  const highlights = [
    `総PVは ${totalPageviews.toLocaleString()} PV（前月比 ${momComparison.pageviewsChange >= 0 ? '+' : ''}${momComparison.pageviewsChange.toFixed(2)}%）で、アクティブユーザーは ${totalUsers.toLocaleString()} 人（前月比 ${momComparison.usersChange >= 0 ? '+' : ''}${momComparison.usersChange.toFixed(2)}%）でした。`,
    `最もアクセスの多いページは「${topPages[0].path}」（${topPages[0].pageviews.toLocaleString()} PV）でした。`,
    `キーイベントは計 ${totalKeyEvents.toLocaleString()} 件発生し、合計売上（成果報酬額）は ${totalRevenue.toLocaleString()} 円を達成しました。`
  ];
  
  // 9. 予実対比 & キャリブレーション
  const forecastVintages = JSON.parse(fs.readFileSync(FORECAST_VINTAGES_FILE, 'utf-8'));
  const activeVintage = forecastVintages.vintages.find(v => v.id === forecastVintages.currentVintageId);
  const activeJuneForecast = activeVintage.forecasts.find(f => f.m === "Jun'26");
  
  if (!activeJuneForecast) {
    throw new Error('Jun\'26 forecast not found in active vintage');
  }
  
  const forecastComparisonByStream = [];
  let totalForecastPv = 0;
  let rawFactors = {};
  
  for (const stream of STREAMS) {
    const forecastPv = activeJuneForecast.pv[stream.key] || 0;
    const actualPv = streamAggregate[stream.key].pageviews;
    
    totalForecastPv += forecastPv;
    
    let accuracy = null;
    let rawFactor = 0;
    
    if (forecastPv > 0) {
      accuracy = parseFloat(((actualPv / forecastPv) * 100).toFixed(2));
      rawFactor = actualPv / forecastPv;
    } else {
      rawFactor = 0;
    }
    
    forecastComparisonByStream.push({
      stream: stream.key,
      label: stream.label,
      forecastPv,
      actualPv,
      accuracy
    });
    
    rawFactors[stream.key] = rawFactor;
  }
  
  // 予測がゼロだったストリームのフォールバックロジック適用
  if (rawFactors['jp_aka'] > 0) rawFactors['jp_amami'] = rawFactors['jp_aka'] * 0.7;
  if (rawFactors['en_ishigaki'] > 0) rawFactors['en_amami'] = rawFactors['en_ishigaki'] * 0.5;
  if (rawFactors['cjp'] > 0) rawFactors['cen'] = rawFactors['cjp'] * 0.6;
  if (rawFactors['cjp'] > 0) rawFactors['hjp'] = rawFactors['cjp'];
  if (rawFactors['cen'] > 0) rawFactors['hen'] = rawFactors['cen'];
  
  const overallAccuracy = totalForecastPv > 0 ? parseFloat(((totalPageviews / totalForecastPv) * 100).toFixed(2)) : 0;
  
  // dampened_factor (sqrt) の適用
  const dampenedFactors = {};
  for (const key of Object.keys(rawFactors)) {
    const rawFactor = rawFactors[key];
    dampenedFactors[key] = parseFloat(Math.sqrt(rawFactor).toFixed(4));
  }
  
  const newVintageId = `v${forecastVintages.vintages.length}_202606`;
  
  // 10. アクションアイテム生成
  const actionItems = [];
  
  if (gscZeroCtrPagesSorted.length > 0) {
    actionItems.push({
      category: 'ctr',
      priority: '高',
      description: 'Google Search Consoleで表示回数が50回以上ありながらクリックが発生していないページ（CTR 0%）のタイトルタグおよびメタディスクリプションの最適化を行います。',
      targetPages: gscZeroCtrPagesSorted.map(p => p.url)
    });
  }
  
  const lowEngTarget = pagesList
    .filter(p => p.users >= 3 && p.avgEngagementTime < 15)
    .map(p => p.path);
  if (lowEngTarget.length > 0) {
    actionItems.push({
      category: 'engagement',
      priority: '中',
      description: '滞在時間が極端に短い（15秒未満）かつ一定以上のトラフィックがあるページのコンテンツ改善を行います。',
      targetPages: lowEngTarget
    });
  }
  
  const lowCvTarget = pagesList
    .filter(p => p.pageviews >= 50 && p.keyEvents === 0)
    .map(p => p.path);
  if (lowCvTarget.length > 0) {
    actionItems.push({
      category: 'conversion',
      priority: '高',
      description: '閲覧数が一定以上（50 PV以上）ありながらコンバージョン（キーイベント）が発生していないページの導線設計およびアフィリエイトリンクの配置を見直します。',
      targetPages: lowCvTarget
    });
  }
  
  if (newPages.length > 0) {
    actionItems.push({
      category: 'content',
      priority: '低',
      description: '新規検出されたページのインデックス状況の監視と内部リンクの構築を行います。',
      targetPages: newPages
    });
  }
  
  // 11. レポートJSON生成
  const report = {
    reportMonth: '2026-06',
    generatedAt: new Date().toISOString(),
    generatedBy: 'skill',
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
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
      byStream,
      byLanguage: languageAggregate,
      topPages,
      newPages
    },
    search: {
      google: {
        totalClicks: gscTotalClicks,
        totalImpressions: gscTotalImpressions,
        avgCtr: gscAvgCtr,
        avgPosition: gscAvgPosition,
        topPages: gscTopPages,
        zeroCtrPages: gscZeroCtrPagesSorted
      },
      bing: {
        totalClicks: bingTotalClicks,
        totalImpressions: bingTotalImpressions,
        avgCtr: bingAvgCtr,
        avgPosition: bingAvgPosition,
        topPages: bingTopPages
      },
      engineComparison: {
        googleShare,
        bingShare
      }
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
      hotelCvSummary: {
        totalKeyEvents: hotelTotalKeyEvents,
        pages: hotelCvPages
      }
    },
    forecastComparison: {
      vintageId: forecastVintages.currentVintageId,
      byStream: forecastComparisonByStream,
      overallAccuracy,
      calibrationApplied: {
        newVintageId,
        factors: dampenedFactors
      }
    },
    actionItems
  };
  
  fs.writeFileSync(OUTPUT_REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`月次レポートを生成しました: ${OUTPUT_REPORT_FILE}`);
  
  // 12. forecast-vintages.json の更新
  const initialVintage = forecastVintages.vintages.find(v => v.id === 'v0_initial');
  
  const newForecasts = initialVintage.forecasts.map(f => {
    const updatedPv = {};
    for (const key of Object.keys(f.pv)) {
      const v0Val = f.pv[key];
      const factor = dampenedFactors[key] !== undefined ? dampenedFactors[key] : 1.0;
      updatedPv[key] = Math.round(v0Val * factor);
    }
    return {
      m: f.m,
      mp: f.mp,
      pv: updatedPv
    };
  });
  
  const streamAccuracyForVintage = {};
  for (const fc of forecastComparisonByStream) {
    streamAccuracyForVintage[fc.stream] = {
      forecastPv: fc.forecastPv,
      actualPv: fc.actualPv,
      accuracy: fc.accuracy
    };
  }
  for (const streamKey of ['jp_amami', 'en_amami', 'cen', 'hjp', 'hen']) {
    if (!streamAccuracyForVintage[streamKey]) {
      streamAccuracyForVintage[streamKey] = {
        forecastPv: activeJuneForecast.pv[streamKey] || 0,
        actualPv: streamAggregate[streamKey]?.pageviews || 0,
        accuracy: null
      };
    }
  }
  
  const newVintage = {
    id: newVintageId,
    createdAt: new Date().toISOString(),
    label: "6月実績反映キャリブレーション",
    trigger: "calibration",
    calibration: {
      baseMonth: "2026-06",
      factors: dampenedFactors,
      streamAccuracy: streamAccuracyForVintage,
      overallAccuracy
    },
    forecasts: newForecasts
  };
  
  forecastVintages.currentVintageId = newVintageId;
  forecastVintages.vintages.push(newVintage);
  
  fs.writeFileSync(FORECAST_VINTAGES_FILE, JSON.stringify(forecastVintages, null, 2));
  console.log(`forecast-vintages.json を更新しました。新ビンテージ: ${newVintageId}`);
  
  // 13. actual-pv.ts の更新
  let actualPvTsContent = fs.readFileSync(ACTUAL_PV_TS_FILE, 'utf-8');
  
  const juneActualPv = {};
  const juneActualRev = {};
  for (const stream of STREAMS) {
    juneActualPv[stream.key] = streamAggregate[stream.key].pageviews;
    juneActualRev[stream.key] = stream.key === 'jp_other' ? rakutenRevenue : 0;
  }
  
  const newRowStr = `  {\n    "m": "Jun'26",\n    "mp": "6月",\n    "pv": ${JSON.stringify(juneActualPv, null, 6).replace(/\n/g, '\n    ')},\n    "rev": ${JSON.stringify(juneActualRev, null, 6).replace(/\n/g, '\n    ')}\n  },\n];`;
  
  const lastIndex = actualPvTsContent.lastIndexOf('];');
  if (lastIndex !== -1) {
    actualPvTsContent = actualPvTsContent.substring(0, lastIndex) + newRowStr;
    fs.writeFileSync(ACTUAL_PV_TS_FILE, actualPvTsContent);
    console.log(`actual-pv.ts を更新しました。`);
  } else {
    console.error('actual-pv.ts の置換に失敗しました。末尾の ]; が見つかりません。');
  }
  
  // 14. baseline-pv.ts の更新
  let baselinePvTsContent = `import type { BasePVRow } from "../utils/calc";\n\nexport const BASE_PV_OBJ: BasePVRow[] = [\n`;
  for (const f of newForecasts) {
    baselinePvTsContent += `  ${JSON.stringify(f)},\n`;
  }
  baselinePvTsContent += `];\n`;
  fs.writeFileSync(BASELINE_PV_TS_FILE, baselinePvTsContent);
  console.log(`baseline-pv.ts を更新しました。`);
  
  console.log('--- すべての処理が正常に完了しました ---');
}

main().catch(err => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
