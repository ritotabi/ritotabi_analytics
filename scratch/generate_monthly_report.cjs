const fs = require('fs');
const path = require('path');

// 為替レート取得（フェッチ）
async function getExchangeRate() {
  const fallbackRate = 159.2466;
  try {
    const res = await fetch('https://ritotabi.com/data/exchange_rate/latest.json');
    if (!res.ok) {
      console.log(`Failed to fetch exchange rate, status: ${res.status}. Using fallback JPY rate: ${fallbackRate}`);
      return fallbackRate;
    }
    const data = await res.json();
    if (data && data.conversion_rates && typeof data.conversion_rates.JPY === 'number') {
      console.log(`Successfully fetched exchange rate JPY: ${data.conversion_rates.JPY}`);
      return data.conversion_rates.JPY;
    }
    console.log(`Invalid exchange rate JSON format. Using fallback JPY rate: ${fallbackRate}`);
    return fallbackRate;
  } catch (err) {
    console.log(`Error fetching exchange rate: ${err.message}. Using fallback JPY rate: ${fallbackRate}`);
    return fallbackRate;
  }
}

// ストリームマッピング関数
function mapPathToStream(urlPath) {
  const isEn = urlPath.startsWith('/en/');
  
  if (urlPath.includes('ishigaki-island')) {
    return isEn ? 'en_ishigaki' : 'jp_ishigaki';
  }
  if (urlPath.includes('miyako-island')) {
    return isEn ? 'en_miyako' : 'jp_miyako';
  }
  if (urlPath.includes('yoron-island')) {
    return 'jp_yoron';
  }
  if (urlPath.includes('kume-island')) {
    return 'jp_kume';
  }
  if (urlPath.includes('aka-island')) {
    return 'jp_aka';
  }
  if (urlPath.includes('amami-island')) {
    return isEn ? 'en_amami' : 'jp_amami';
  }
  if (urlPath.includes('okinawa-main')) {
    return isEn ? 'en_other' : 'jp_other';
  }
  
  // ベトナム
  if (urlPath.includes('con-dao-island')) {
    return isEn ? 'cen' : 'cjp';
  }
  if (urlPath.includes('cham-island') || urlPath.includes('hoian-old-town') || urlPath.includes('hoi-an') || urlPath.includes('an-bang')) {
    return isEn ? 'hen' : 'hjp';
  }
  
  // フォールバック
  if (urlPath === '/') {
    return 'jp_other';
  }
  if (urlPath === '/en/') {
    return 'en_other';
  }
  if (isEn) {
    return 'en_other';
  }
  return 'jp_other';
}

const STREAM_LABELS = {
  jp_ishigaki: "石垣島 (日本語)",
  en_ishigaki: "石垣島 (英語)",
  jp_miyako: "宮古島 (日本語)",
  en_miyako: "宮古島 (英語)",
  jp_yoron: "与論島 (日本語)",
  jp_kume: "久米島 (日本語)",
  jp_aka: "阿嘉島 (日本語)",
  jp_amami: "奄美大島 (日本語)",
  en_amami: "奄美大島 (英語)",
  jp_other: "その他 日本 (日本語)",
  en_other: "その他 日本 (英語)",
  cjp: "コンダオ (日本語)",
  cen: "コンダオ (英語)",
  hjp: "ホイアン/チャム (日本語)",
  hen: "ホイアン/チャム (英語)"
};

// CSVパース用のヘルパー
function parseGA4CSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ページパスとスクリーン クラス')) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    throw new Error('GA4 header not found');
  }
  
  const dataLines = lines.slice(headerIndex + 1);
  return dataLines.map(line => line.split(','));
}

function parseGSCCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(1);
  return dataLines.map(line => line.split(','));
}

function parseBingCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(1);
  return dataLines.map(line => line.split(',').map(v => v.replace(/^"|"$/g, '')));
}

function parseRakutenCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(3); // 3行目以降がデータ
  return dataLines.map(line => line.split(','));
}

function parseStay22CSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(1);
  return dataLines.map(line => line.split(',').map(v => v.replace(/^"|"$/g, '')));
}

async function run() {
  const reportMonth = "2026-05";
  const periodStart = "2026-05-01";
  const periodEnd = "2026-05-31";

  const ga4Path = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605.csv';
  const gscPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_google.csv';
  const bingPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_bing.csv';
  const rakutenPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_rakuten.csv';
  const stay22Path = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_stay22.csv';
  const vintagesPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/forecast-vintages.json';
  const prevReportPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/reports/202604.json';
  const reportOutputPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/reports/202605.json';

  console.log('Fetching exchange rate...');
  const jpyRate = await getExchangeRate();

  // 1. 売上データの集計
  console.log('Processing Rakuten sales...');
  const rakutenRows = parseRakutenCSV(rakutenPath);
  let rakutenTotalRewards = 0;
  rakutenRows.forEach(row => {
    if (row.length >= 5) {
      rakutenTotalRewards += parseInt(row[1]) || 0;
    }
  });

  console.log('Processing Stay22 sales...');
  const stay22Rows = parseStay22CSV(stay22Path);
  let stay22TotalCommissionUsd = 0;
  stay22Rows.forEach(row => {
    if (row.length >= 9) {
      stay22TotalCommissionUsd += parseFloat(row[8]) || 0;
    }
  });
  const stay22TotalCommissionJpy = Math.round(stay22TotalCommissionUsd * jpyRate);

  // 売上のストリームマッピング
  // 楽天 -> jp_other (案A)
  // Stay22 -> hjp (chamisland)
  const revenueByStream = {};
  Object.keys(STREAM_LABELS).forEach(k => {
    revenueByStream[k] = 0;
  });
  revenueByStream['jp_other'] = rakutenTotalRewards;
  revenueByStream['hjp'] = stay22TotalCommissionJpy;
  
  const totalRevenue = rakutenTotalRewards + stay22TotalCommissionJpy;
  console.log(`Revenue calculated: Total JPY=${totalRevenue} (Rakuten: ${rakutenTotalRewards}, Stay22: ${stay22TotalCommissionJpy} JPY from ${stay22TotalCommissionUsd} USD at rate ${jpyRate})`);

  // 2. GA4データパース
  console.log('Processing GA4...');
  const ga4Raw = parseGA4CSV(ga4Path);
  const ga4Pages = ga4Raw.map(row => {
    return {
      path: row[0],
      pageviews: parseInt(row[1]) || 0,
      users: parseInt(row[2]) || 0,
      avgEngagementTime: parseFloat(row[4]) || 0,
      keyEvents: parseInt(row[6]) || 0
    };
  }).filter(p => p.path && p.path.startsWith('/')); // コメント行等除外

  let totalPageviews = 0;
  let totalUsers = 0;
  let totalKeyEvents = 0;
  
  const streamGa4 = {};
  Object.keys(STREAM_LABELS).forEach(k => {
    streamGa4[k] = { pageviews: 0, users: 0, pagesCount: 0 };
  });

  const languageGa4 = {
    jp: { pageviews: 0, users: 0 },
    en: { pageviews: 0, users: 0 }
  };

  ga4Pages.forEach(p => {
    totalPageviews += p.pageviews;
    totalUsers += p.users;
    totalKeyEvents += p.keyEvents;

    const stream = mapPathToStream(p.path);
    if (streamGa4[stream]) {
      streamGa4[stream].pageviews += p.pageviews;
      streamGa4[stream].users += p.users;
      streamGa4[stream].pagesCount += 1;
    }

    const isEn = p.path.startsWith('/en/');
    const langKey = isEn ? 'en' : 'jp';
    languageGa4[langKey].pageviews += p.pageviews;
    languageGa4[langKey].users += p.users;
  });

  const byStreamArray = Object.entries(streamGa4).map(([stream, data]) => {
    return {
      stream,
      label: STREAM_LABELS[stream] || stream,
      pageviews: data.pageviews,
      users: data.users,
      pagesCount: data.pagesCount
    };
  }).sort((a, b) => b.pageviews - a.pageviews);

  const topPages = [...ga4Pages].sort((a, b) => b.pageviews - a.pageviews).slice(0, 10);

  // 新規ページの検出
  const prevReport = JSON.parse(fs.readFileSync(prevReportPath, 'utf-8'));
  const prevAllPages = new Set();
  prevReport.traffic.topPages.forEach(p => prevAllPages.add(p.path));
  if (prevReport.traffic.newPages) prevReport.traffic.newPages.forEach(p => prevAllPages.add(p));
  prevReport.engagement.topEngagedPages.forEach(p => prevAllPages.add(p.path));
  prevReport.engagement.lowEngagementPages.forEach(p => prevAllPages.add(p.path));
  prevReport.engagement.keyEventPages.forEach(p => prevAllPages.add(p.path));
  prevReport.conversion.topCvPages.forEach(p => prevAllPages.add(p.path));
  if (prevReport.conversion.hotelCvSummary && prevReport.conversion.hotelCvSummary.pages) {
    prevReport.conversion.hotelCvSummary.pages.forEach(p => prevAllPages.add(p.path));
  }

  const newPages = ga4Pages.map(p => p.path).filter(p => !prevAllPages.has(p));

  // 前月比 momComparison
  const momComparison = {
    pageviewsChange: parseFloat(((totalPageviews / prevReport.summary.totalPageviews - 1) * 100).toFixed(2)),
    usersChange: parseFloat(((totalUsers / prevReport.summary.totalUsers - 1) * 100).toFixed(2)),
    keyEventsChange: parseFloat(((totalKeyEvents / prevReport.summary.totalKeyEvents - 1) * 100).toFixed(2))
  };

  // 3. GSCデータパース
  console.log('Processing GSC...');
  const gscRaw = parseGSCCSV(gscPath);
  const gscPages = gscRaw.map(row => {
    return {
      url: row[0],
      clicks: parseInt(row[1]) || 0,
      impressions: parseInt(row[2]) || 0,
      ctr: parseFloat(row[3].replace('%', '')) || 0,
      position: parseFloat(row[4]) || 0
    };
  }).filter(p => p.url && !p.url.includes('/images/'));

  let gscTotalClicks = 0;
  let gscTotalImpressions = 0;
  let gscSumPosImp = 0;
  gscPages.forEach(p => {
    gscTotalClicks += p.clicks;
    gscTotalImpressions += p.impressions;
    gscSumPosImp += p.position * p.impressions;
  });
  const gscAvgCtr = gscTotalImpressions > 0 ? parseFloat(((gscTotalClicks / gscTotalImpressions) * 100).toFixed(2)) : 0;
  const gscAvgPosition = gscTotalImpressions > 0 ? parseFloat((gscSumPosImp / gscTotalImpressions).toFixed(2)) : 0;

  const gscTopPages = [...gscPages].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const gscZeroCtrPages = gscPages
    .filter(p => p.impressions >= 50 && p.clicks === 0)
    .sort((a, b) => b.impressions - a.impressions)
    .map(p => ({ url: p.url, impressions: p.impressions, position: p.position }));

  // 4. Bingデータパース
  console.log('Processing Bing...');
  const bingRaw = parseBingCSV(bingPath);
  const bingPages = bingRaw.map(row => {
    return {
      url: row[0],
      impressions: parseInt(row[1]) || 0,
      clicks: parseInt(row[2]) || 0,
      ctr: parseFloat(row[3].replace('%', '')) || 0,
      position: parseFloat(row[4]) || 0
    };
  }).filter(p => p.url && !p.url.includes('/images/'));

  let bingTotalClicks = 0;
  let bingTotalImpressions = 0;
  let bingSumPosImp = 0;
  bingPages.forEach(p => {
    bingTotalClicks += p.clicks;
    bingTotalImpressions += p.impressions;
    bingSumPosImp += p.position * p.impressions;
  });
  const bingAvgCtr = bingTotalImpressions > 0 ? parseFloat(((bingTotalClicks / bingTotalImpressions) * 100).toFixed(2)) : 0;
  const bingAvgPosition = bingTotalImpressions > 0 ? parseFloat((bingSumPosImp / bingTotalImpressions).toFixed(2)) : 0;

  const bingTopPages = [...bingPages].sort((a, b) => b.clicks - a.clicks).slice(0, 10);

  // Engine Comparison
  const totalEngineClicks = gscTotalClicks + bingTotalClicks;
  const googleShare = totalEngineClicks > 0 ? parseFloat(((gscTotalClicks / totalEngineClicks) * 100).toFixed(2)) : 0;
  const bingShare = totalEngineClicks > 0 ? parseFloat(((bingTotalClicks / totalEngineClicks) * 100).toFixed(2)) : 0;

  // 5. Engagement
  const topEngagedPages = ga4Pages
    .filter(p => p.users >= 2)
    .sort((a, b) => b.avgEngagementTime - a.avgEngagementTime)
    .slice(0, 10)
    .map(p => ({ path: p.path, avgEngagementTime: p.avgEngagementTime, users: p.users }));

  const lowEngagementPages = ga4Pages
    .filter(p => p.users >= 2 && p.avgEngagementTime < 30)
    .sort((a, b) => a.avgEngagementTime - b.avgEngagementTime)
    .map(p => ({ path: p.path, avgEngagementTime: p.avgEngagementTime, users: p.users }));

  const keyEventPages = ga4Pages
    .filter(p => p.keyEvents > 0)
    .map(p => ({
      path: p.path,
      keyEvents: p.keyEvents,
      users: p.users,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    }))
    .sort((a, b) => b.keyEvents - a.keyEvents);

  // 6. Conversion
  const topCvPages = ga4Pages
    .filter(p => p.keyEvents > 0)
    .sort((a, b) => b.keyEvents - a.keyEvents)
    .slice(0, 10)
    .map(p => ({
      path: p.path,
      keyEvents: p.keyEvents,
      users: p.users,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    }));

  const hotelCvPages = ga4Pages
    .filter(p => p.path.includes('/hotels/') && p.keyEvents > 0)
    .sort((a, b) => b.keyEvents - a.keyEvents)
    .map(p => ({
      path: p.path,
      keyEvents: p.keyEvents,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    }));
  const totalHotelKeyEvents = hotelCvPages.reduce((sum, p) => sum + p.keyEvents, 0);

  // 7. Calibration & Forecast Comparison
  console.log('Running Calibration...');
  const vintagesData = JSON.parse(fs.readFileSync(vintagesPath, 'utf-8'));
  const currentVintage = vintagesData.vintages.find(v => v.id === vintagesData.currentVintageId);
  const forecastMay = currentVintage.forecasts.find(f => f.m === "May'26").pv;

  const actualPv = {};
  Object.keys(STREAM_LABELS).forEach(k => {
    actualPv[k] = streamGa4[k].pageviews;
  });

  const forecastComparisonByStream = [];
  const rawFactors = {};
  const accuracies = {};
  let totalForecastPv = 0;
  let totalActualPv = 0;

  Object.keys(STREAM_LABELS).forEach(stream => {
    const fPv = forecastMay[stream] || 0;
    const aPv = actualPv[stream] || 0;
    totalForecastPv += fPv;
    totalActualPv += aPv;

    let accuracy = null;
    if (fPv > 0) {
      accuracy = parseFloat(((aPv / fPv) * 100).toFixed(2));
      rawFactors[stream] = aPv / fPv;
      accuracies[stream] = accuracy;
    } else {
      rawFactors[stream] = null;
      accuracies[stream] = null;
    }

    forecastComparisonByStream.push({
      stream,
      label: STREAM_LABELS[stream] || stream,
      forecastPv: fPv,
      actualPv: aPv,
      accuracy: accuracy
    });
  });

  // フォールバックの適用
  if (rawFactors['jp_amami'] === null) {
    rawFactors['jp_amami'] = (rawFactors['jp_aka'] || 0) * 0.7;
  }
  if (rawFactors['en_amami'] === null) {
    rawFactors['en_amami'] = (rawFactors['en_ishigaki'] || 0) * 0.5;
  }

  // dampened factors calculation
  const dampenedFactors = {};
  Object.entries(rawFactors).forEach(([stream, rf]) => {
    if (rf === null || rf === undefined || rf === 0) {
      dampenedFactors[stream] = 0;
    } else {
      dampenedFactors[stream] = Math.sqrt(rf);
    }
  });

  const overallAccuracy = parseFloat(((totalActualPv / totalForecastPv) * 100).toFixed(2));

  // 8. Action Items
  const actionItems = [];
  
  // ctr: GSCで表示回数 >= 50 かつ CTR = 0% のページが存在
  if (gscZeroCtrPages.length > 0) {
    actionItems.push({
      category: "ctr",
      priority: "高",
      description: `${gscZeroCtrPages.length}ページがGoogle検索で表示されていますがクリックがありません。タイトルやメタディスクリプションの最適化でCTR向上が見込めます。`,
      targetPages: gscZeroCtrPages.slice(0, 5).map(p => p.url)
    });
  }

  // engagement: エンゲージメント時間 < 15秒 かつ ユーザー >= 3 のページが存在
  const lowEngagedTargets = ga4Pages
    .filter(p => p.users >= 3 && p.avgEngagementTime < 15)
    .map(p => p.path);
  if (lowEngagedTargets.length > 0) {
    actionItems.push({
      category: "engagement",
      priority: "中",
      description: "アクセスがあるもののエンゲージメント時間が極端に短い（15秒未満）ページが検出されました。導入文の改善や関連リンクの追加を検討してください。",
      targetPages: lowEngagedTargets.slice(0, 5)
    });
  }

  // conversion: PV >= 50 かつ キーイベント = 0 のページが存在
  const noCvTargets = ga4Pages
    .filter(p => p.pageviews >= 50 && p.keyEvents === 0)
    .map(p => p.path);
  if (noCvTargets.length > 0) {
    actionItems.push({
      category: "conversion",
      priority: "高",
      description: "PVが50以上あるにもかかわらずキーイベント（アフィリエイトクリック）が発生していないページがあります。CTA（コールトゥアクション）ボタンの配置やマイクロコピーを見直してください。",
      targetPages: noCvTargets.slice(0, 5)
    });
  }

  // content: 新規ページが検出された場合のフォローアップ
  if (newPages.length > 0) {
    actionItems.push({
      category: "content",
      priority: "低",
      description: "新しいページが検出されました。検索インデックスへの登録状況の監視と、内部リンクの最適化を行ってください。",
      targetPages: newPages.slice(0, 5)
    });
  }

  // highlights
  const highlights = [
    `総PVは ${totalPageviews.toLocaleString()} PV（前月比 ${momComparison.pageviewsChange >= 0 ? '+' : ''}${momComparison.pageviewsChange}%）で、アクティブユーザーは ${totalUsers.toLocaleString()} 人（前月比 ${momComparison.usersChange >= 0 ? '+' : ''}${momComparison.usersChange}%）でした。`,
    `最もアクセスの多いページは「${topPages[0].path}」（${topPages[0].pageviews} PV）でした。`,
    `キーイベントは計 ${totalKeyEvents} 件発生し、合計売上（成果報酬額）は ${totalRevenue} 円を達成しました。`
  ];

  // Report JSON オブジェクト
  const report = {
    reportMonth,
    generatedAt: new Date().toISOString(),
    generatedBy: "skill",
    periodStart,
    periodEnd,
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
      byStream: byStreamArray,
      byLanguage: {
        jp: languageGa4.jp,
        en: languageGa4.en
      },
      topPages: topPages.map(p => ({
        path: p.path,
        pageviews: p.pageviews,
        users: p.users,
        avgEngagementTime: p.avgEngagementTime,
        keyEvents: p.keyEvents
      })),
      newPages
    },
    search: {
      google: {
        totalClicks: gscTotalClicks,
        totalImpressions: gscTotalImpressions,
        avgCtr: gscAvgCtr,
        avgPosition: gscAvgPosition,
        topPages: gscTopPages.map(p => ({
          url: p.url,
          clicks: p.clicks,
          impressions: p.impressions,
          ctr: parseFloat(p.ctr.toFixed(2)),
          position: p.position
        })),
        zeroCtrPages: gscZeroCtrPages
      },
      bing: {
        totalClicks: bingTotalClicks,
        totalImpressions: bingTotalImpressions,
        avgCtr: bingAvgCtr,
        avgPosition: bingAvgPosition,
        topPages: bingTopPages.map(p => ({
          url: p.url,
          clicks: p.clicks,
          impressions: p.impressions,
          ctr: parseFloat(p.ctr.toFixed(2)),
          position: p.position
        }))
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
        totalKeyEvents: totalHotelKeyEvents,
        pages: hotelCvPages
      }
    },
    forecastComparison: {
      vintageId: currentVintage.id,
      byStream: forecastComparisonByStream,
      overallAccuracy,
      calibrationApplied: {
        newVintageId: "v2_202605",
        factors: Object.fromEntries(
          Object.entries(rawFactors).map(([k, v]) => [k, v !== null ? parseFloat(v.toFixed(2)) : null])
        )
      }
    },
    actionItems
  };

  // レポートJSON書き込み
  fs.writeFileSync(reportOutputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Generated report JSON written to ${reportOutputPath}`);

  // 9. forecast-vintages.json に新しいビンテージを追加
  console.log('Generating new forecast vintage v2_202605...');
  const v0 = vintagesData.vintages.find(v => v.id === 'v0_initial');
  
  // v2 の forecasts を作成
  const v2Forecasts = v0.forecasts.map(f => {
    const month = f.m;
    const isPast = month === "Apr'26" || month === "May'26"; // 実績が確定した月についてはどうする？
    // 実績確定月も予測値を計算しておくか、それとも元のv0のまま、または実績を入れるか？
    // 設計書に従い、v0の予測PVに dampened_factor を乗算：
    const newPv = {};
    Object.keys(f.pv).forEach(stream => {
      const v0Pv = f.pv[stream] || 0;
      const df = dampenedFactors[stream] !== undefined ? dampenedFactors[stream] : 1.0;
      newPv[stream] = Math.round(v0Pv * df);
    });
    return {
      m: f.m,
      mp: f.mp,
      pv: newPv
    };
  });

  const streamAccuracyForVintage = {};
  Object.keys(STREAM_LABELS).forEach(stream => {
    streamAccuracyForVintage[stream] = {
      forecastPv: forecastMay[stream] || 0,
      actualPv: actualPv[stream] || 0,
      accuracy: accuracies[stream]
    };
  });

  const newVintage = {
    id: "v2_202605",
    createdAt: new Date().toISOString(),
    label: "5月実績反映キャリブレーション",
    trigger: "calibration",
    calibration: {
      baseMonth: "2026-05",
      factors: Object.fromEntries(
        Object.entries(rawFactors).map(([k, v]) => [k, v !== null ? parseFloat(v.toFixed(2)) : null])
      ),
      streamAccuracy: streamAccuracyForVintage,
      overallAccuracy: overallAccuracy
    },
    forecasts: v2Forecasts
  };

  vintagesData.currentVintageId = "v2_202605";
  vintagesData.vintages.push(newVintage);

  fs.writeFileSync(vintagesPath, JSON.stringify(vintagesData, null, 2), 'utf-8');
  console.log(`Updated forecast-vintages.json with currentVintageId=v2_202605`);

  // 10. src/data/actual-pv.ts の更新
  console.log('Updating actual-pv.ts...');
  const actualPvPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual-pv.ts';
  const actualPvContent = fs.readFileSync(actualPvPath, 'utf-8');
  
  // 5月分のデータを作成
  const mayActualData = {
    m: "May'26",
    mp: "5月",
    pv: actualPv,
    rev: revenueByStream
  };

  // 配列の最後に挿入する
  // `export const ACTUAL_PV_OBJ: BasePVRow[] = [` という構造。
  // 末尾の `];` の前に挿入する
  const insertIndex = actualPvContent.lastIndexOf('];');
  if (insertIndex === -1) {
    throw new Error('Could not find end of ACTUAL_PV_OBJ array in actual-pv.ts');
  }

  const newActualPvContent = actualPvContent.slice(0, insertIndex) + 
    `  ${JSON.stringify(mayActualData, null, 2)},\n` + 
    actualPvContent.slice(insertIndex);

  fs.writeFileSync(actualPvPath, newActualPvContent, 'utf-8');
  console.log('Updated actual-pv.ts successfully.');

  // 11. src/data/baseline-pv.ts の更新
  console.log('Updating baseline-pv.ts...');
  const baselinePvPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/baseline-pv.ts';
  // 最新予測値 v2_202605.forecasts を BASE_PV_OBJ として書き出す
  const newBaselineContent = `import type { BasePVRow } from "../utils/calc";

export const BASE_PV_OBJ: BasePVRow[] = [
${v2Forecasts.map(f => `  ${JSON.stringify(f)},`).join('\n')}
];
`;
  fs.writeFileSync(baselinePvPath, newBaselineContent, 'utf-8');
  console.log('Updated baseline-pv.ts successfully.');

  console.log('All reports generated and calibration updated successfully!');
}

run();
