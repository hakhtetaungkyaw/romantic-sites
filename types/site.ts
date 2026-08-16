export interface SitePhoto {
  src: string;
  caption?: string;
}

export interface SitePerson {
  name: string;
}

export interface SiteVideo {
  src: string;
  caption?: string;
  role?: string;
}

export interface SiteSong {
  url: string;
  title: string;
}

export interface SiteData {
  /** Minimum 1 entry. */
  people: SitePerson[];
  groupTitle?: string;
  title: string;
  message: string;
  specialDate: string;
  photos: SitePhoto[];
  videos?: SiteVideo[];
  songs?: SiteSong[];
  milestones?: {
    date: string;
    title: string;
    description?: string;
    photo?: string;
  }[];
  closingLine?: string;
  secretNote?: string;
  places?: {
    name: string;
    caption: string;
    x: number;
    y: number;
    photo?: string;
  }[];
  typedPhrases?: string[];
  /**
   * Escape hatch for genuinely new, template-specific data that doesn't fit
   * an existing field yet. Not a dumping ground — if a field turns out to be
   * used by every template, promote it to a real field instead.
   */
  customData?: Record<string, unknown>;
}
