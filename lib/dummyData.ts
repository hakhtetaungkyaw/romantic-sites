import type { BirthdayCustomData, SitePhoto, SiteData } from "@/types/site";

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
  // Both distinct from every photo already used elsewhere in this dataset —
  // galleryPhotos only ever draws from couple-01 through couple-12 (also
  // reused by milestones/places above and CinematicVideo's own photos[0]
  // poster), so couple-13/14 here are genuinely never seen anywhere else.
  constellationRevealPhoto: "/demo-assets/photos/couple-13.jpg",
  shootingStarWishPhoto: "/demo-assets/photos/couple-14.jpg",
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

// Reuses the same public/demo-assets/photos/couple-NN.jpg files
// dummySiteData's own gallery draws from — no dedicated Birthday demo
// photos exist yet, and creating them is out of scope for scaffolding.
// Captions below are written for a birthday Memory Frame gallery
// regardless of what the underlying photo actually shows; swap in real
// birthday-appropriate images before this ever ships as an actual demo.
const birthdayMemoryPhotos: SitePhoto[] = [
  { src: "/demo-assets/photos/couple-03.jpg", caption: "The candles almost didn't survive that gust of wind." },
  { src: "/demo-assets/photos/couple-06.jpg", caption: "Best surprise party face, no contest." },
  { src: "/demo-assets/photos/couple-10.jpg", caption: "Confetti in the hair for a week straight." },
  { src: "/demo-assets/photos/couple-13.jpg", caption: "That look right before the first bite of cake." },
  { src: "/demo-assets/photos/couple-14.jpg", caption: "Every single friend who showed up that night." },
  { src: "/demo-assets/photos/couple-15.jpg", caption: "The balloon that got away — RIP." },
];

const birthdayCustomData: BirthdayCustomData = {
  age: 25,
  cakeWishMessage:
    "Blow out the candles and make it count — this year's already off to a wonderful start.",
  balloonMessages: [
    "You make every room brighter just by walking in.",
    "Here's to another year of your terrible jokes and great hugs.",
    "25 looks incredible on you.",
    "Never change how loudly you laugh at your own jokes.",
    "The world got lucky the day you were born.",
    "May this year bring you everything you didn't even know to ask for.",
    "Still the most fun person in every group chat.",
  ],
  balloonCompletionMessage:
    "Every single one of those is true, by the way — and there are a hundred more where they came from.",
  // Distinct from every photo already used elsewhere in this dummy object
  // (birthdayMemoryPhotos' own 6 gallery entries, giftPhoto below) — see
  // types/site.ts's own doc comment on why this needs its own dedicated
  // photo rather than reusing a gallery index.
  balloonCompletionPhoto: "/demo-assets/photos/couple-08.jpg",
  // Was a hardcoded literal inside interactive/GiftUnwrap.tsx itself until
  // this field existed — kept as the same word here now that it's a real,
  // sourced value rather than baked into the component.
  giftLayerOneKeyword: "Joy",
  giftLayerTwoPhrase: "Getting warmer...",
  giftWheelItems: [
    "A trip together",
    "Something you've wanted",
    "A handwritten letter",
    "Breakfast in bed",
    "A whole lazy day",
    "Money",
    "A surprise date night",
  ],
  giftMessage:
    "This isn't much, but it comes with everything I have — thank you for another year of you.",
  giftPhoto: "/demo-assets/photos/couple-16.jpg",
};

export const dummyBirthdayData: SiteData = {
  people: [{ name: "Maya" }],
  title: "Maya's Celebration Room",
  message:
    "Twenty-five years of you, and every single one has been worth celebrating. Here's to the person who turns ordinary Tuesdays into main character energy, who remembers everyone's coffee order, and who somehow makes getting older look like the best plan anyone's ever had. Happy birthday — this room, and everyone in it, adores you.",
  specialDate: "2001-03-14T00:00:00.000Z",
  photos: birthdayMemoryPhotos,
  songs: [{ title: "Happy Birthday", url: "/audio/birthdaysong.mp3" }],
  customData: {
    birthday: birthdayCustomData,
  },
};
