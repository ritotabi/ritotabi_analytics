const fs = require('fs');
const path = require('path');

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
  return dataLines.map(line => {
    return line.split(',');
  });
}

function parseGSCCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(1);
  return dataLines.map(line => {
    return line.split(',');
  });
}

function parseBingCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(1);
  return dataLines.map(line => {
    return line.split(',').map(v => v.replace(/^"|"$/g, ''));
  });
}

function parseRakutenCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  // 3行目以降がデータ
  const dataLines = lines.slice(3);
  return dataLines.map(line => {
    return line.split(',');
  });
}

function parseStay22CSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const dataLines = lines.slice(1);
  return dataLines.map(line => {
    return line.split(',').map(v => v.replace(/^"|"$/g, ''));
  });
}

function main() {
  const ga4Path = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605.csv';
  const gscPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_google.csv';
  const bingPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_bing.csv';
  const rakutenPath = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_rakuten.csv';
  const stay22Path = '/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/actual_dl/202605_stay22.csv';

  // 1. GA4
  const ga4Data = parseGA4CSV(ga4Path);
  const ga4Pages = ga4Data.map(row => {
    return {
      path: row[0],
      pageviews: parseInt(row[1]) || 0,
      users: parseInt(row[2]) || 0,
      avgEngagementTime: parseFloat(row[4]) || 0,
      keyEvents: parseInt(row[6]) || 0
    };
  });

  // Top 10 pages
  const topPages = [...ga4Pages].sort((a, b) => b.pageviews - a.pageviews).slice(0, 10);
  console.log('--- Top 10 Pages ---');
  topPages.forEach(p => console.log(`- ${p.path}: PV=${p.pageviews}, Users=${p.users}, avgEng=${p.avgEngagementTime}, keyEv=${p.keyEvents}`));

  // New Pages (compared to 4月)
  const prevReport = JSON.parse(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/reports/202604.json', 'utf-8'));
  const prevPages = new Set(prevReport.traffic.topPages.map(p => p.path).concat(prevReport.traffic.newPages || []));
  // 4月の全ページパスのリストは4月レポートの traffic 以下のどこかにあるが、前月レポート全体の全ページを収集するべき
  // 前月レポート内に現れた全ページパスを収集する
  const prevAllPages = new Set();
  prevReport.traffic.topPages.forEach(p => prevAllPages.add(p.path));
  if (prevReport.traffic.newPages) prevReport.traffic.newPages.forEach(p => prevAllPages.add(p));
  // また前月レポートの engagement.topEngagedPages, engagement.lowEngagementPages, engagement.keyEventPages, conversion.topCvPages も追加する
  prevReport.engagement.topEngagedPages.forEach(p => prevAllPages.add(p.path));
  prevReport.engagement.lowEngagementPages.forEach(p => prevAllPages.add(p.path));
  prevReport.engagement.keyEventPages.forEach(p => prevAllPages.add(p.path));
  prevReport.conversion.topCvPages.forEach(p => prevAllPages.add(p.path));
  if (prevReport.conversion.hotelCvSummary && prevReport.conversion.hotelCvSummary.pages) {
    prevReport.conversion.hotelCvSummary.pages.forEach(p => prevAllPages.add(p.path));
  }

  const newPages = ga4Pages.map(p => p.path).filter(p => !prevAllPages.has(p));
  console.log('\n--- New Pages ---');
  console.log(newPages);

  // 2. GSC
  const gscData = parseGSCCSV(gscPath);
  const gscPages = gscData.map(row => {
    return {
      url: row[0],
      clicks: parseInt(row[1]) || 0,
      impressions: parseInt(row[2]) || 0,
      ctr: parseFloat(row[3].replace('%', '')) || 0,
      position: parseFloat(row[4]) || 0
    };
  }).filter(p => !p.url.includes('/images/')); // 画像除外

  let gscTotalClicks = 0;
  let gscTotalImpressions = 0;
  let gscSumPosImp = 0;
  gscPages.forEach(p => {
    gscTotalClicks += p.clicks;
    gscTotalImpressions += p.impressions;
    gscSumPosImp += p.position * p.impressions;
  });
  const gscAvgCtr = gscTotalImpressions > 0 ? (gscTotalClicks / gscTotalImpressions) * 100 : 0;
  const gscAvgPosition = gscTotalImpressions > 0 ? gscSumPosImp / gscTotalImpressions : 0;

  console.log('\n--- GSC Summary ---');
  console.log(`Clicks: ${gscTotalClicks}`);
  console.log(`Impressions: ${gscTotalImpressions}`);
  console.log(`Avg CTR: ${gscAvgCtr.toFixed(2)}%`);
  console.log(`Avg Position: ${gscAvgPosition.toFixed(2)}`);

  // GSC zeroCtrPages (Impressions >= 50, Clicks == 0)
  const gscZeroCtr = gscPages.filter(p => p.impressions >= 50 && p.clicks === 0).sort((a, b) => b.impressions - a.impressions);
  console.log('\nGSC Zero CTR Pages:');
  gscZeroCtr.forEach(p => console.log(`- ${p.url}: Imp=${p.impressions}, Pos=${p.position}`));

  // 3. Bing
  const bingData = parseBingCSV(bingPath);
  const bingPages = bingData.map(row => {
    return {
      url: row[0],
      impressions: parseInt(row[1]) || 0,
      clicks: parseInt(row[2]) || 0,
      ctr: parseFloat(row[3].replace('%', '')) || 0,
      position: parseFloat(row[4]) || 0
    };
  }).filter(p => p.url && !p.url.includes('/images/')); // 画像除外

  let bingTotalClicks = 0;
  let bingTotalImpressions = 0;
  let bingSumPosImp = 0;
  bingPages.forEach(p => {
    bingTotalClicks += p.clicks;
    bingTotalImpressions += p.impressions;
    bingSumPosImp += p.position * p.impressions;
  });
  const bingAvgCtr = bingTotalImpressions > 0 ? (bingTotalClicks / bingTotalImpressions) * 100 : 0;
  const bingAvgPosition = bingTotalImpressions > 0 ? bingSumPosImp / bingTotalImpressions : 0;

  console.log('\n--- Bing Summary ---');
  console.log(`Clicks: ${bingTotalClicks}`);
  console.log(`Impressions: ${bingTotalImpressions}`);
  console.log(`Avg CTR: ${bingAvgCtr.toFixed(2)}%`);
  console.log(`Avg Position: ${bingAvgPosition.toFixed(2)}`);

  // Engine Comparison
  const totalEngineClicks = gscTotalClicks + bingTotalClicks;
  const googleShare = totalEngineClicks > 0 ? (gscTotalClicks / totalEngineClicks) * 100 : 0;
  const bingShare = totalEngineClicks > 0 ? (bingTotalClicks / totalEngineClicks) * 100 : 0;
  console.log(`\nEngine Share: Google = ${googleShare.toFixed(2)}%, Bing = ${bingShare.toFixed(2)}%`);

  // 4. Engagement
  // topEngagedPages (users >= 2, sorted by avgEngagementTime desc, Top 10)
  const topEngaged = ga4Pages.filter(p => p.users >= 2).sort((a, b) => b.avgEngagementTime - a.avgEngagementTime).slice(0, 10);
  console.log('\n--- Top Engaged Pages ---');
  topEngaged.forEach(p => console.log(`- ${p.path}: avgEng=${p.avgEngagementTime}, Users=${p.users}`));

  // lowEngagementPages (users >= 2, avgEngagementTime < 30)
  const lowEngaged = ga4Pages.filter(p => p.users >= 2 && p.avgEngagementTime < 30).sort((a, b) => a.avgEngagementTime - b.avgEngagementTime);
  console.log('\n--- Low Engagement Pages ---');
  lowEngaged.forEach(p => console.log(`- ${p.path}: avgEng=${p.avgEngagementTime}, Users=${p.users}`));

  // keyEventPages (keyEvents > 0)
  const keyEventPages = ga4Pages.filter(p => p.keyEvents > 0).map(p => {
    return {
      path: p.path,
      keyEvents: p.keyEvents,
      users: p.users,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    };
  }).sort((a, b) => b.keyEvents - a.keyEvents);
  console.log('\n--- Key Event Pages ---');
  keyEventPages.forEach(p => console.log(`- ${p.path}: keyEvents=${p.keyEvents}, Users=${p.users}, cvRate=${p.cvRate}%`));

  // 5. Conversion
  const hotelCvPages = ga4Pages.filter(p => p.path.includes('/hotels/') && p.keyEvents > 0).map(p => {
    return {
      path: p.path,
      keyEvents: p.keyEvents,
      cvRate: parseFloat(((p.keyEvents / p.users) * 100).toFixed(2))
    };
  }).sort((a, b) => b.keyEvents - a.keyEvents);
  const totalHotelKeyEvents = hotelCvPages.reduce((sum, p) => sum + p.keyEvents, 0);
  console.log('\n--- Hotel CV Summary ---');
  console.log(`Total Hotel KeyEvents: ${totalHotelKeyEvents}`);
  hotelCvPages.forEach(p => console.log(`- ${p.path}: keyEvents=${p.keyEvents}, cvRate=${p.cvRate}%`));

  // 6. Sales Data
  console.log('\n--- Sales Data ---');
  const rakuten = parseRakutenCSV(rakutenPath);
  let rakutenRewards = 0;
  let rakutenSales = 0;
  let rakutenAmount = 0;
  rakuten.forEach(row => {
    if (row.length >= 5) {
      rakutenRewards += parseInt(row[1]) || 0;
      rakutenSales += parseInt(row[3]) || 0;
      rakutenAmount += parseInt(row[4]) || 0;
    }
  });
  console.log(`Rakuten: Rewards=${rakutenRewards}, SalesCount=${rakutenSales}, Amount=${rakutenAmount}`);

  const stay22 = parseStay22CSV(stay22Path);
  let stay22Commission = 0;
  stay22.forEach(row => {
    if (row.length >= 9) {
      stay22Commission += parseFloat(row[8]) || 0;
    }
  });
  console.log(`Stay22: Commission=${stay22Commission} (USD)`);

  // 7. Calibration
  console.log('\n--- Calibration Analysis ---');
  // May'26 forecasts for v1_202604 (forecast-vintages.json)
  const vintagesData = JSON.parse(fs.readFileSync('/home/mune1/dev/ritotabi/ritotabi_analytics/src/data/forecast-vintages.json', 'utf-8'));
  const v1 = vintagesData.vintages.find(v => v.id === 'v1_202604');
  const mayForecast = v1.forecasts.find(f => f.m === "May'26");
  const forecastPv = mayForecast.pv;

  const actualPv = {};
  // 集計した streamData から actualPv を取得
  Object.keys(STREAM_LABELS).forEach(k => {
    actualPv[k] = 0;
  });
  ga4Pages.forEach(p => {
    // メタデータ行除外
    if (p.path.startsWith('#') || p.path === 'ページパスとスクリーン クラス' || !p.path.startsWith('/')) {
      return;
    }
    const stream = mapPathToStream(p.path);
    if (actualPv[stream] !== undefined) {
      actualPv[stream] += p.pageviews;
    }
  });

  const rawFactors = {};
  const accuracies = {};
  let totalForecastPv = 0;
  let totalActualPv = 0;

  Object.keys(STREAM_LABELS).forEach(stream => {
    const fPv = forecastPv[stream] || 0;
    const aPv = actualPv[stream] || 0;
    
    totalForecastPv += fPv;
    totalActualPv += aPv;

    if (fPv === 0) {
      rawFactors[stream] = null;
      accuracies[stream] = null;
    } else {
      const rf = aPv / fPv;
      rawFactors[stream] = rf;
      accuracies[stream] = rf * 100;
    }
  });

  // フォールバックの適用
  // jp_amami -> jp_aka の 70%
  // en_amami -> en_ishigaki の 50%
  // cen -> cjp の 60% (但し5月はcenの予測は7なので、予測は0ではないが、フォールバックするか？通常は予測が0の場合のみ。ただ、予測があった場合は通常通り計算する)
  
  // 5月の予測が0だったのは jp_amami, en_amami
  if (rawFactors['jp_amami'] === null) {
    const jpAkaFactor = rawFactors['jp_aka'];
    rawFactors['jp_amami'] = jpAkaFactor * 0.7;
  }
  if (rawFactors['en_amami'] === null) {
    const enIshigakiFactor = rawFactors['en_ishigaki'];
    rawFactors['en_amami'] = enIshigakiFactor * 0.5;
  }

  // dampened factors
  const dampenedFactors = {};
  Object.entries(rawFactors).forEach(([stream, rf]) => {
    if (rf === null || rf === undefined) {
      dampenedFactors[stream] = 0; // またはフォールバック適用不可なら0？
    } else {
      dampenedFactors[stream] = Math.sqrt(rf);
    }
  });

  console.log('Stream-level Accuracy and Factors:');
  Object.keys(STREAM_LABELS).forEach(stream => {
    const f = forecastPv[stream] || 0;
    const a = actualPv[stream] || 0;
    const acc = accuracies[stream] !== null ? `${accuracies[stream].toFixed(2)}%` : 'null';
    const rf = rawFactors[stream] !== null ? rawFactors[stream].toFixed(4) : 'null';
    const df = dampenedFactors[stream] !== undefined ? dampenedFactors[stream].toFixed(4) : 'null';
    console.log(`- ${stream} (${STREAM_LABELS[stream]}): Forecast=${f}, Actual=${a}, Accuracy=${acc}, RawFactor=${rf}, DampenedFactor=${df}`);
  });

  const overallAccuracy = (totalActualPv / totalForecastPv) * 100;
  console.log(`\nOverall Accuracy: ${overallAccuracy.toFixed(2)}% (Total Forecast: ${totalForecastPv}, Total Actual: ${totalActualPv})`);
}

main();

