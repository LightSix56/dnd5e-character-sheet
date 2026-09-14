export type CalloutType = 'tip' | 'warning' | 'master' | 'example';

export interface EncyclopediaCallout {
  type: CalloutType;
  title?: string;
  text: string;
}

export interface EncyclopediaTable {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface EncyclopediaSection {
  id: string;
  title: string;
  content: string; // Detailed text explaining the topic
  callout?: EncyclopediaCallout;
  table?: EncyclopediaTable;
  bulletPoints?: string[];
}

export interface EncyclopediaChapter {
  id: string;
  title: string;
  subtitle: string;
  iconName: 'ScrollIcon' | 'D20Icon' | 'UserHeroIcon' | 'CrossedSwordsIcon' | 'SpellbookIcon' | 'HourglassIcon' | 'CrownRulerIcon';
  sections: EncyclopediaSection[];
}

export interface TourStep {
  id: string;
  targetId: string; // Matches data-tour-id in sheet DOM
  title: string;
  badge: string;
  description: string;
  chapterId: string; // Deep-link to encyclopedia chapter
  sectionId?: string; // Optional deep-link to section
  placement?: 'top' | 'bottom' | 'left' | 'right';
}
