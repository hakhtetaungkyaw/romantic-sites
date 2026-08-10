export interface SitePhoto {
  src: string;
  caption?: string;
}

export interface SiteData {
  coupleNames: {
    partnerA: string;
    partnerB: string;
  };
  title: string;
  message: string;
  specialDate: string;
  photos: SitePhoto[];
  songTitle?: string;
  songUrl?: string;
  heroVideo?: string;
  momentVideo?: string;
  milestones?: {
    date: string;
    title: string;
    description?: string;
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
}
