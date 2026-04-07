export interface PageEvaluation {
  id: string;
  url: string;
  evaluatedAt: string;
  evaluatedBy: "skill" | "manual";

  // Revenue Forecast
  stream: string;
  streamLabel?: string;
  streamCvr?: number;
  streamUnit?: number;
  sum: string;
  ap: string;
  an: string;
  ao: string;
  pp: number[];
  pn: number[];
  po: number[];
  memo: string;

  // Quality Evaluation
  quality: {
    title: string;
    lang: "JP" | "EN";
    type: "ホテル" | "ガイド" | "ランニング" | "トップ";
    overall: number;
    publishedDate: string | null;

    scores: {
      "コンテンツ独自性": number;
      "写真・ビジュアル": number;
      "アフィリエイト設計": number;
      "内部リンク": number;
      "SEO技術実装": number;
      "ユーザー体験(UX)": number;
      "英語品質": number | null;
    };

    seoChecklist?: {
      hreflang: boolean;
      faqJsonLd: boolean;
      metaTitleKw: boolean;
      metaDescLength: boolean;
      canonicalUrl: boolean;
      ogpTwitterCard: boolean;
    };

    freshness?: "new" | "growing" | "indexing" | "mature";

    affiliateChecklist?: {
      ctaPosition: boolean;
      microCopy: boolean;
      multipleOta: boolean;
      minClicks: number;
    };

    strengths: string[];
    issues: Array<{
      level: "高" | "中" | "低";
      text: string;
      isSpeculation?: boolean;
    }>;
  };
}

export interface EvalRegistry {
  lastUpdated: string;
  streams: Array<{
    key: string;
    label: string;
    color: string;
    cvr: number;
    unit: number;
  }>;
  evaluations: Record<string, {
    file: string;
    url: string;
    title: string;
    stream: string;
    overall: number;
    evaluatedAt: string;
    lang: "JP" | "EN";
    type: string;
  }>;
}
