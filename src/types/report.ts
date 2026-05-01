export interface MonthlyReport {
  reportMonth: string;
  generatedAt: string;
  generatedBy: "skill";
  periodStart: string;
  periodEnd: string;
  revenue: number;

  summary: {
    totalPageviews: number;
    totalUsers: number;
    totalKeyEvents: number;
    totalRevenue: number;
    highlights: string[];
    momComparison?: {
      pageviewsChange: number;
      usersChange: number;
      keyEventsChange: number;
    };
  };

  traffic: {
    byStream: Array<{
      stream: string;
      label: string;
      pageviews: number;
      users: number;
      pagesCount: number;
    }>;
    byLanguage: {
      jp: { pageviews: number; users: number };
      en: { pageviews: number; users: number };
    };
    topPages: Array<{
      path: string;
      pageviews: number;
      users: number;
      avgEngagementTime: number;
      keyEvents: number;
    }>;
    newPages: string[];
  };

  search: {
    google: {
      totalClicks: number;
      totalImpressions: number;
      avgCtr: number;
      avgPosition: number;
      topPages: Array<{
        url: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }>;
      zeroCtrPages: Array<{
        url: string;
        impressions: number;
        position: number;
      }>;
    };
    bing: {
      totalClicks: number;
      totalImpressions: number;
      avgCtr: number;
      avgPosition: number;
      topPages: Array<{
        url: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      }>;
    };
    engineComparison: {
      googleShare: number;
      bingShare: number;
    };
  };

  engagement: {
    topEngagedPages: Array<{
      path: string;
      avgEngagementTime: number;
      users: number;
    }>;
    lowEngagementPages: Array<{
      path: string;
      avgEngagementTime: number;
      users: number;
    }>;
    keyEventPages: Array<{
      path: string;
      keyEvents: number;
      users: number;
      cvRate: number;
    }>;
  };

  conversion: {
    totalKeyEvents: number;
    totalRevenue: number;
    topCvPages: Array<{
      path: string;
      keyEvents: number;
      users: number;
      cvRate: number;
    }>;
    hotelCvSummary: {
      totalKeyEvents: number;
      pages: Array<{
        path: string;
        keyEvents: number;
        cvRate: number;
      }>;
    };
  };

  forecastComparison: {
    vintageId: string;
    byStream: Array<{
      stream: string;
      label: string;
      forecastPv: number;
      actualPv: number;
      accuracy: number;
    }>;
    overallAccuracy: number;
    calibrationApplied: {
      newVintageId: string;
      factors: Record<string, number>;
    };
  };

  actionItems: Array<{
    category: "ctr" | "engagement" | "conversion" | "content";
    priority: "高" | "中" | "低";
    description: string;
    targetPages: string[];
  }>;
}
