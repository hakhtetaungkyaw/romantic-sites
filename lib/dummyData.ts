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
    caption: "Lifted higher than the evening itself.",
  },
  {
    src: "/demo-assets/photos/couple-08.jpg",
    caption: "Lifted higher than the evening itself.",
  },
  {
    src: "/demo-assets/photos/couple-09.jpg",
    caption: "Lifted higher than the evening itself.",
  },
  {
    src: "/demo-assets/photos/couple-10.jpg",
    caption: "Lifted higher than the evening itself.",
  },
  {
    src: "/demo-assets/photos/couple-11.jpg",
    caption: "Lifted higher than the evening itself.",
  },
  {
    src: "/demo-assets/photos/couple-12.jpg",
    caption: "Lifted higher than the evening itself.",
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
      photo: "/demo-assets/photos/couple-01.jpg",
    },
    {
      date: "November 2022",
      title: "First trip together",
      description:
        "Three weeks backpacking through the coast, running out of money and out of reasons to leave.",
      photo: "/demo-assets/photos/couple-11.jpg",
    },
    {
      date: "August 2024",
      title: "Moved in together",
      description:
        "A tiny apartment with a leaky faucet that somehow felt like the biggest home we'd ever had.",
      // Deliberately no `photo` — exercises timeline/SunsetTimeline.tsx's
      // text-only fallback for milestones without one, alongside the 3
      // that do have one.
    },
    {
      date: "June 2026",
      title: "The proposal",
      description: "Under the same rain, on the same street, four years later.",
      photo: "/demo-assets/photos/couple-05.jpg",
    },
  ],
  closingLine: "And every day since has been another page we get to write together.",
  secretNote:
    "If you're reading this, it means you found the little things too — just like I hoped you would.",
  // x/y positions are tuned (not the raw midpoints of the map) so the route
  // line — which connects them in this exact order — reads as a deliberate
  // wandering journey flowing left-to-right across the map, rather than a
  // scattered zigzag. Real customer data will vary; the component itself
  // stays fully data-driven, this is just a better-looking demo arrangement.
  places: [
    {
      name: "Riverside Café",
      caption: "Where a shared umbrella turned into a three-hour conversation.",
      x: 15,
      y: 55,
      photo: "/demo-assets/photos/couple-07.jpg",
    },
    {
      name: "The Coastal Trail",
      caption: "Three weeks of backpacking, and still not enough.",
      x: 38,
      y: 25,
      photo: "/demo-assets/photos/couple-09.jpg",
    },
    {
      name: "Our First Apartment",
      caption: "The leaky faucet that somehow felt like home.",
      x: 62,
      y: 60,
      photo: "/demo-assets/photos/couple-02.jpg",
    },
    {
      name: "That Same Rainy Street",
      caption: "Where he asked, four years later, in the same rain.",
      x: 85,
      y: 32,
      photo: "/demo-assets/photos/couple-08.jpg",
    },
  ],
  typedPhrases: [
    "I still choose you, every single day.",
    "Here's to every tomorrow with you.",
    "You are, quite simply, my favorite person.",
  ],
};
