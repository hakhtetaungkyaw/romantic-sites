import type { SitePhoto, SiteData } from "@/types/site";

// All 15 demo photos, each with a caption specific to what's actually in that image.
const galleryPhotos: SitePhoto[] = [
  {
    src: "/demo-assets/photos/couple-01.jpg",
    caption: "A forehead kiss, and the sky blushed.",
  },
  {
    src: "/demo-assets/photos/couple-02.jpg",
    caption: "A lazy evening, string lights, and forever.",
  },
  {
    src: "/demo-assets/photos/couple-03.jpg",
    caption: "Every promise we wrote down that night.",
  },
  {
    src: "/demo-assets/photos/couple-04.jpg",
    caption: "He spun her straight into the horizon.",
  },
  {
    src: "/demo-assets/photos/couple-05.jpg",
    caption: "We built a heart out of sunlight.",
  },
  {
    src: "/demo-assets/photos/couple-06.jpg",
    caption: "Lifted higher than the evening itself.",
  },
  {
    src: "/demo-assets/photos/couple-07.jpg",
    caption: "Just holding on a little longer.",
  },
  {
    src: "/demo-assets/photos/couple-08.jpg",
    caption: "Our silhouette against a sky on fire.",
  },
  {
    src: "/demo-assets/photos/couple-09.jpg",
    caption: "Two hills away from everywhere else.",
  },
  {
    src: "/demo-assets/photos/couple-10.jpg",
    caption: "Camera up, still only seeing her.",
  },
  {
    src: "/demo-assets/photos/couple-11.jpg",
    caption: "Leaning in, laughing at nothing at all.",
  },
  {
    src: "/demo-assets/photos/couple-12.jpg",
    caption: "Hand in hand, and the tide waited.",
  },
  {
    src: "/demo-assets/photos/couple-13.jpg",
    caption: "One flower, handed over mid-sentence.",
  },
  {
    src: "/demo-assets/photos/couple-14.jpg",
    caption: "Come on — the boats won't wait.",
  },
  {
    src: "/demo-assets/photos/couple-15.jpg",
    caption: "Grey skies, never grey between us.",
  },
];

export const dummySiteData: SiteData = {
  people: [{ name: "Aria" }, { name: "Noah" }],
  title: "Two Hearts, One Story",
  message:
    "From the moment we met, I knew my life had changed for the better. Every day with you feels like a new page in the best story I've ever known. Thank you for your laughter, your patience, and your endless love. Here's to every memory we've made and every one still waiting for us.",
  specialDate: "2026-06-14T00:00:00.000Z",
  photos: galleryPhotos,
  songs: [{ title: "Our Song", url: "/audio/Dandelions.mp3" }],
  videos: [
    { src: "/videos/hero-01.mp4", role: "hero" },
    { src: "/videos/hero-02.mp4", role: "moment" },
  ],
  milestones: [
    {
      date: "March 2021",
      title: "The day we met",
      description:
        "A rainy afternoon, a shared umbrella, and a conversation that lasted until midnight.",
    },
    {
      date: "November 2022",
      title: "First trip together",
      description:
        "Three weeks backpacking through the coast, running out of money and out of reasons to leave.",
    },
    {
      date: "August 2024",
      title: "Moved in together",
      description:
        "A tiny apartment with a leaky faucet that somehow felt like the biggest home we'd ever had.",
    },
    {
      date: "June 2026",
      title: "The proposal",
      description: "Under the same rain, on the same street, four years later.",
    },
  ],
  closingLine: "And every day since has been another page we get to write together.",
  secretNote:
    "If you're reading this, it means you found the little things too — just like I hoped you would.",
  places: [
    {
      name: "Riverside Café",
      caption: "Where a shared umbrella turned into a three-hour conversation.",
      x: 22,
      y: 38,
      photo: "/demo-assets/photos/couple-07.jpg",
    },
    {
      name: "The Coastal Trail",
      caption: "Three weeks of backpacking, and still not enough.",
      x: 68,
      y: 22,
      photo: "/demo-assets/photos/couple-09.jpg",
    },
    {
      name: "Our First Apartment",
      caption: "The leaky faucet that somehow felt like home.",
      x: 42,
      y: 68,
      photo: "/demo-assets/photos/couple-02.jpg",
    },
    {
      name: "That Same Rainy Street",
      caption: "Where he asked, four years later, in the same rain.",
      x: 80,
      y: 62,
      photo: "/demo-assets/photos/couple-08.jpg",
    },
  ],
  typedPhrases: [
    "I still choose you, every single day.",
    "Here's to every tomorrow with you.",
    "You are, quite simply, my favorite person.",
  ],
};
