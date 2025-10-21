export type RoadmapStatus = 'planned' | 'in-progress' | 'launched' | 'meta';

// Allow any Lucide icon name coming from content
export type RoadmapIconName = string;

export type RoadmapItem = {
  id: string;
  status: RoadmapStatus;
  title: string | { en: string; de: string };
  summary: {
    en: string;
    de: string;
  };
  version?: string;
  icon?: RoadmapIconName;
  badges?: string[];
  detailUrl?: string;
};
