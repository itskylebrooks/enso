export type RoadmapStatus = 'planned' | 'in-progress' | 'launched' | 'meta';

export type RoadmapIconName =
  | 'palette'
  | 'messageSquarePlus'
  | 'splitSquareHorizontal'
  | 'map'
  | 'listCheck'
  | 'gitBranch'
  | 'cloudOff'
  | 'handshake'
  | 'sparkles'
  | 'infinity';

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
