const fs = require('fs');

// === Stream Mapping Logic ===
function pathToStream(path) {
  const isEn = path.startsWith('/en/');
  // Remove /en/ prefix for matching
  const cleanPath = isEn ? path.replace('/en/', '/') : path;
  
  // Mapping rules
  const slugMap = {
    'ishigaki-island': isEn ? 'en_ishigaki' : 'jp_ishigaki',
    'miyako-island': isEn ? 'en_miyako' : 'jp_miyako',
    'yoron-island': isEn ? 'jp_yoron' : 'jp_yoron', // no en_yoron data yet
    'kume-island': isEn ? 'jp_kume' : 'jp_kume',
    'aka-island': isEn ? 'jp_aka' : 'jp_aka',
    'amami-island': isEn ? 'en_amami' : 'jp_amami',
    'okinawa-main': isEn ? 'en_other' : 'jp_other',
    'con-dao-island': isEn ? 'cen' : 'cjp',
    'cham-island': isEn ? 'hen' : 'hjp',
    'hoian-old-town': isEn ? 'hen' : 'hjp',
    'hoi-an': isEn ? 'hen' : 'hjp',
    'an-bang': isEn ? 'hen' : 'hjp',
  };
  
  for (const [slug, stream] of Object.entries(slugMap)) {
    if (cleanPath.includes(slug)) return stream;
  }
  
  // Top page or other
  if (path === '/') return 'jp_other';
  if (path === '/en/') return 'en_other';
  return isEn ? 'en_other' : 'jp_other';
}

// Stream labels
const streamLabels = {
  jp_ishigaki: "石垣島 (JP)", en_ishigaki: "石垣島 (EN)",
  jp_miyako: "宮古島 (JP)", en_miyako: "宮古島 (EN)",
  jp_yoron: "与論島 (JP)", jp_kume: "久米島 (JP)",
  jp_aka: "阿嘉島 (JP)", jp_amami: "奄美大島 (JP)", en_amami: "奄美大島 (EN)",
  cjp: "コンダオ (JP)", cen: "コンダオ (EN)",
  hjp: "ホイアン/チャム (JP)", hen: "ホイアン/チャム (EN)",
  jp_other: "その他 (JP)", en_other: "その他 (EN)"
};

// === Parse GA4 CSV ===
function parseGA4(content) {
  const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim());
  const header = lines[0];
  return lines.slice(1).map(line => {
    const parts = line.split(',');
    return {
      path: parts[0],
      pageviews: parseInt(parts[1]) || 0,
      users: parseInt(parts[2]) || 0,
      viewsPerUser: parseFloat(parts[3]) || 0,
      avgEngagementTime: parseFloat(parts[4]) || 0,
      events: parseInt(parts[5]) || 0,
      keyEvents: parseInt(parts[6]) || 0,
      revenue: parseInt(parts[7]) || 0
    };
  });
}

// === Parse GSC CSV ===
function parseGSC(content) {
  const lines = content.split('\n').filter(l => l.trim());
  return lines.slice(1).map(line => {
    const parts = line.split(',');
    return {
      url: parts[0],
      clicks: parseInt(parts[1]) || 0,
      impressions: parseInt(parts[2]) || 0,
      ctr: parseFloat(parts[3]) || 0,
      position: parseFloat(parts[4]) || 0
    };
  }).filter(r => !r.url.includes('/images/')); // Exclude image results
}

// === Parse Bing CSV ===
function parseBing(content) {
  const lines = content.split('\n').filter(l => l.trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const parts = line.replace(/\r/g, '').split('","').map(s => s.replace(/"/g, ''));
    return {
      url: parts[0],
      impressions: parseInt(parts[1]) || 0,
      clicks: parseInt(parts[2]) || 0,
      ctr: parseFloat(parts[3]) || 0,
      position: parseFloat(parts[4]) || 0
    };
  });
}

// === Generate Report ===
function generateReport(month, ga4Data, gscData, bingData, prevReport) {
  const year = parseInt(month.slice(0, 4));
  const mon = parseInt(month.slice(4, 6));
  const daysInMonth = new Date(year, mon, 0).getDate();
  
  // 1. Summary
  const totalPageviews = ga4Data.reduce((a, r) => a + r.pageviews, 0);
  const totalUsers = ga4Data.reduce((a, r) => a + r.users, 0);
  const totalKeyEvents = ga4Data.reduce((a, r) => a + r.keyEvents, 0);
  const totalRevenue = ga4Data.reduce((a, r) => a + r.revenue, 0);
  
  // Highlights
  const sorted = [...ga4Data].sort((a, b) => b.pageviews - a.pageviews);
  const highlights = [
    `総PV ${totalPageviews.toLocaleString()}、アクティブユーザー ${totalUsers.toLocaleString()}人`,
    `最もアクセスの多いページは「${sorted[0]?.path}」（${sorted[0]?.pageviews} PV）`,
    totalKeyEvents > 0 
      ? `キーイベント ${totalKeyEvents}件が${ga4Data.filter(r => r.keyEvents > 0).length}ページで発生`
      : `キーイベントは${ga4Data.filter(r => r.keyEvents > 0).length}ページで合計${totalKeyEvents}件`
  ];
  
  const summary = {
    totalPageviews, totalUsers, totalKeyEvents, totalRevenue, highlights
  };
  
  if (prevReport) {
    summary.momComparison = {
      pageviewsChange: Math.round((totalPageviews / prevReport.summary.totalPageviews - 1) * 10000) / 100,
      usersChange: Math.round((totalUsers / prevReport.summary.totalUsers - 1) * 10000) / 100,
      keyEventsChange: Math.round((totalKeyEvents / (prevReport.summary.totalKeyEvents || 1) - 1) * 10000) / 100
    };
  }
  
  // 2. Traffic
  const streamMap = {};
  ga4Data.forEach(row => {
    const stream = pathToStream(row.path);
    if (!streamMap[stream]) streamMap[stream] = { pageviews: 0, users: 0, pagesCount: 0 };
    streamMap[stream].pageviews += row.pageviews;
    streamMap[stream].users += row.users;
    streamMap[stream].pagesCount += 1;
  });
  
  const byStream = Object.entries(streamMap).map(([stream, data]) => ({
    stream, label: streamLabels[stream] || stream, ...data
  })).sort((a, b) => b.pageviews - a.pageviews);
  
  const jpPv = ga4Data.filter(r => !r.path.startsWith('/en/')).reduce((a, r) => a + r.pageviews, 0);
  const enPv = ga4Data.filter(r => r.path.startsWith('/en/')).reduce((a, r) => a + r.pageviews, 0);
  const jpUsers = ga4Data.filter(r => !r.path.startsWith('/en/')).reduce((a, r) => a + r.users, 0);
  const enUsers = ga4Data.filter(r => r.path.startsWith('/en/')).reduce((a, r) => a + r.users, 0);
  
  const topPages = sorted.slice(0, 10).map(r => ({
    path: r.path, pageviews: r.pageviews, users: r.users,
    avgEngagementTime: Math.round(r.avgEngagementTime * 10) / 10,
    keyEvents: r.keyEvents
  }));
  
  // Detect new pages (vs prev report)
  const newPages = prevReport
    ? ga4Data.map(r => r.path).filter(p => !prevReport.traffic.topPages.some(t => t.path === p) && !prevReport.traffic.byStream.some(s => s.stream === pathToStream(p)))
    : [];
  
  const traffic = {
    byStream,
    byLanguage: {
      jp: { pageviews: jpPv, users: jpUsers },
      en: { pageviews: enPv, users: enUsers }
    },
    topPages,
    newPages: newPages.slice(0, 20)
  };
  
  // 3. Search
  const gscFiltered = gscData.filter(r => !r.url.includes('/images/'));
  const googleClicks = gscFiltered.reduce((a, r) => a + r.clicks, 0);
  const googleImpressions = gscFiltered.reduce((a, r) => a + r.impressions, 0);
  const googleAvgCtr = googleImpressions > 0 ? Math.round((googleClicks / googleImpressions) * 10000) / 100 : 0;
  const googlePositions = gscFiltered.filter(r => r.impressions > 0);
  const googleAvgPos = googlePositions.length > 0 
    ? Math.round(googlePositions.reduce((a, r) => a + r.position * r.impressions, 0) / googleImpressions * 100) / 100
    : 0;
  
  const bingClicks = bingData.reduce((a, r) => a + r.clicks, 0);
  const bingImpressions = bingData.reduce((a, r) => a + r.impressions, 0);
  const bingAvgCtr = bingImpressions > 0 ? Math.round((bingClicks / bingImpressions) * 10000) / 100 : 0;
  const bingAvgPos = bingData.length > 0
    ? Math.round(bingData.reduce((a, r) => a + r.position * r.impressions, 0) / bingImpressions * 100) / 100
    : 0;
  
  const totalClicks = googleClicks + bingClicks;
  
  const search = {
    google: {
      totalClicks: googleClicks, totalImpressions: googleImpressions,
      avgCtr: googleAvgCtr, avgPosition: googleAvgPos,
      topPages: gscFiltered.filter(r => r.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 10),
      zeroCtrPages: gscFiltered.filter(r => r.clicks === 0 && r.impressions >= 50)
        .sort((a, b) => b.impressions - a.impressions).slice(0, 10)
        .map(r => ({ url: r.url, impressions: r.impressions, position: r.position }))
    },
    bing: {
      totalClicks: bingClicks, totalImpressions: bingImpressions,
      avgCtr: bingAvgCtr, avgPosition: bingAvgPos,
      topPages: bingData.filter(r => r.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 10)
    },
    engineComparison: {
      googleShare: totalClicks > 0 ? Math.round((googleClicks / totalClicks) * 10000) / 100 : 0,
      bingShare: totalClicks > 0 ? Math.round((bingClicks / totalClicks) * 10000) / 100 : 0
    }
  };
  
  // 4. Engagement
  const engagementSorted = [...ga4Data].filter(r => r.users >= 2).sort((a, b) => b.avgEngagementTime - a.avgEngagementTime);
  const engagement = {
    topEngagedPages: engagementSorted.slice(0, 10).map(r => ({
      path: r.path, avgEngagementTime: Math.round(r.avgEngagementTime * 10) / 10, users: r.users
    })),
    lowEngagementPages: engagementSorted.filter(r => r.avgEngagementTime < 30 && r.users >= 2)
      .sort((a, b) => a.avgEngagementTime - b.avgEngagementTime).slice(0, 10)
      .map(r => ({ path: r.path, avgEngagementTime: Math.round(r.avgEngagementTime * 10) / 10, users: r.users })),
    keyEventPages: ga4Data.filter(r => r.keyEvents > 0)
      .sort((a, b) => b.keyEvents - a.keyEvents)
      .map(r => ({
        path: r.path, keyEvents: r.keyEvents, users: r.users,
        cvRate: Math.round((r.keyEvents / r.users) * 10000) / 100
      }))
  };
  
  // 5. Conversion
  const hotelPages = ga4Data.filter(r => r.path.includes('/hotels/'));
  const conversion = {
    totalKeyEvents,
    totalRevenue,
    topCvPages: ga4Data.filter(r => r.keyEvents > 0).sort((a, b) => b.keyEvents - a.keyEvents).slice(0, 10)
      .map(r => ({ path: r.path, keyEvents: r.keyEvents, users: r.users, cvRate: Math.round((r.keyEvents / r.users) * 10000) / 100 })),
    hotelCvSummary: {
      totalKeyEvents: hotelPages.reduce((a, r) => a + r.keyEvents, 0),
      pages: hotelPages.filter(r => r.keyEvents > 0).sort((a, b) => b.keyEvents - a.keyEvents)
        .map(r => ({ path: r.path, keyEvents: r.keyEvents, cvRate: Math.round((r.keyEvents / r.users) * 10000) / 100 }))
    }
  };
  
  // 6. Forecast Comparison
  const vintages = JSON.parse(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/forecast-vintages.json', 'utf8'));
  const v0 = vintages.vintages[0];
  const monthKey = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][mon - 1] + "'" + String(year).slice(-2);
  const v0Row = v0.forecasts.find(r => r.m === monthKey);
  
  // Actual PV by stream
  const actualByStream = {};
  ga4Data.forEach(row => {
    const stream = pathToStream(row.path);
    actualByStream[stream] = (actualByStream[stream] || 0) + row.pageviews;
  });
  
  const forecastByStream = [];
  let totalFcst = 0, totalAct = 0;
  if (v0Row) {
    for (const [stream, forecastPv] of Object.entries(v0Row.pv)) {
      const actualPv = actualByStream[stream] || 0;
      totalFcst += forecastPv;
      totalAct += actualPv;
      forecastByStream.push({
        stream, label: streamLabels[stream] || stream,
        forecastPv, actualPv,
        accuracy: forecastPv > 0 ? Math.round((actualPv / forecastPv) * 10000) / 100 : null
      });
    }
  }
  
  const forecastComparison = {
    vintageId: "v0_initial",
    byStream: forecastByStream.sort((a, b) => (b.actualPv - b.forecastPv) - (a.actualPv - a.forecastPv)),
    overallAccuracy: totalFcst > 0 ? Math.round((totalAct / totalFcst) * 10000) / 100 : 0,
    calibrationApplied: {
      newVintageId: "v1_202604",
      factors: vintages.vintages[1]?.calibration?.factors || {}
    }
  };
  
  // 7. Action Items
  const actionItems = [];
  
  // CTR improvement candidates
  const zeroCtrWithImprs = gscFiltered.filter(r => r.clicks === 0 && r.impressions >= 50);
  if (zeroCtrWithImprs.length > 0) {
    actionItems.push({
      category: "ctr",
      priority: "高",
      description: `${zeroCtrWithImprs.length}ページがGoogle検索で表示されているがクリックゼロ。タイトル・descriptionの改善でCTR向上が見込める。`,
      targetPages: zeroCtrWithImprs.slice(0, 5).map(r => r.url)
    });
  }
  
  // Low engagement
  const lowEng = ga4Data.filter(r => r.avgEngagementTime < 15 && r.users >= 3);
  if (lowEng.length > 0) {
    actionItems.push({
      category: "engagement",
      priority: "中",
      description: `${lowEng.length}ページでエンゲージメント時間が15秒未満。コンテンツの改善または導線の見直しが必要。`,
      targetPages: lowEng.slice(0, 5).map(r => r.path)
    });
  }
  
  // CV potential
  const highPvNoCv = ga4Data.filter(r => r.pageviews >= 50 && r.keyEvents === 0);
  if (highPvNoCv.length > 0) {
    actionItems.push({
      category: "conversion",
      priority: "高",
      description: `${highPvNoCv.length}ページにPVがあるがCVゼロ。アフィリエイトリンクの追加やCTA改善の余地あり。`,
      targetPages: highPvNoCv.slice(0, 5).map(r => r.path)
    });
  }
  
  return {
    reportMonth: `${year}-${String(mon).padStart(2, '0')}`,
    generatedAt: new Date().toISOString(),
    generatedBy: "skill",
    periodStart: `${year}-${String(mon).padStart(2, '0')}-01`,
    periodEnd: `${year}-${String(mon).padStart(2, '0')}-${daysInMonth}`,
    revenue: 0,
    summary, traffic, search, engagement, conversion, forecastComparison, actionItems
  };
}

// === Generate March Report ===
const mar_ga4 = parseGA4(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202603.csv', 'utf8'));
const mar_gsc = parseGSC(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202603_google.csv', 'utf8'));
const mar_bing = parseBing(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202603_bing.csv', 'utf8'));

const marReport = generateReport('202603', mar_ga4, mar_gsc, mar_bing, null);
fs.mkdirSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/reports', { recursive: true });
fs.writeFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/reports/202603.json', JSON.stringify(marReport, null, 2));
console.log("Generated 202603.json");

// === Generate April Report ===
const apr_ga4 = parseGA4(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202604.csv', 'utf8'));
const apr_gsc = parseGSC(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202604_google.csv', 'utf8'));
const apr_bing = parseBing(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202604_bing.csv', 'utf8'));

const aprReport = generateReport('202604', apr_ga4, apr_gsc, apr_bing, marReport);
fs.writeFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/reports/202604.json', JSON.stringify(aprReport, null, 2));
console.log("Generated 202604.json");

console.log("\nMarch summary:", JSON.stringify(marReport.summary, null, 2));
console.log("\nApril summary:", JSON.stringify(aprReport.summary, null, 2));
