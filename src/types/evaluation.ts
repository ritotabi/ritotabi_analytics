export interface PageEvaluation {
  id: string;
  url: string;
  evaluatedAt: string;
  evaluatedBy: "skill" | "manual" | "Antigravity";

  // Revenue Forecast
  stream: string;
  streamLabel?: string;
  streamCvr?: number;
  streamUnit?: number;
  sum: string;
  ap: string;
  an: string;
  ao: string;
  scenarios: {
    pessimistic: number[];
    normal: number[];
    optimistic: number[];
  };
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
      "キーワード獲得可能性": number | null;
    };

    seoChecklist?: {
      hreflang: boolean;
      faq: boolean;
      keyword: boolean;
      meta: boolean;
      canonical: boolean;
      ogp: boolean;
    };

    freshness?: "new" | "growing" | "indexing" | "mature";

    // 競合サイトとの相対的な品質水準
    competitorBenchmark?: "above" | "equal" | "below";

    affiliateChecklist?: {
      ctaPosition: boolean;
      microCopy: boolean;
      multipleOta: boolean;
      priceVisible: boolean;
      socialProof: boolean;
      mobileStickyCta: boolean;
      carRentalLink: boolean;
      activityLink: boolean;
      urgencySignals: number;
      minClicks: number;
    };

    brandChecklist?: {
      toneAndManner: boolean;
      firstPersonInsight: boolean;
      benefitUpfront: boolean;
      personaDrivenPros: boolean | null;
    };

    categoryChecklist?: {
      comparisonTable: boolean | null;
      affiliateMicroCopy: boolean | null;
      courseSpecs: boolean | null;
      runBadge: boolean | null;
      runningCvr?: {
        internalHotelLinks: number;
        directAffiliateLinks: number;
        hotelCtaPerCourse: number;
        runnerPersonaMatch: boolean;
      } | null;
    };

    techChecklist?: {
      nextImage: boolean;
      imageAlt: boolean;
      affiliateRel: boolean;
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
