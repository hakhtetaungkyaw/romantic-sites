// Homepage-only bilingual copy (Burmese default / English toggle). Scoped
// deliberately to the marketing homepage (app/page.tsx + components/home/)
// — V1/V2 gift templates, order pages, and the admin CLI script are
// unaffected by this and stay English-only.
//
// `my` and `en` share the exact same shape (enforced by both being typed
// as `HomepageDictionary`), so every consumer can pull `t.section.key`
// without needing to branch on language itself — LanguageContext.tsx
// resolves which object is "current" and hands it down as `t`.

export type Lang = "my" | "en";

export interface HomepageDictionary {
  nav: {
    templates: string;
    howItWorks: string;
    contact: string;
    orderNow: string;
    telegramLabel: string;
    tiktokLabel: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    heading: string;
    subtitle: string;
    cta: string;
  };
  showcase: {
    heading: string;
    subtitle: string;
    filters: {
      all: string;
      anniversary: string;
      birthday: string;
    };
    emptyBirthday: string;
    emptyGeneric: string;
    orderThisStyle: string;
    previewLabel: string;
    viewDemoAria: (templateName: string) => string;
  };
  howItWorks: {
    heading: string;
    steps: { title: string; description: string }[];
  };
  faq: {
    heading: string;
    items: { question: string; answer: string }[];
  };
  payment: {
    note: string;
  };
  finalCta: {
    heading: string;
    subtitle: string;
    button: string;
    emailCta: string;
  };
  footer: {
    tagline: string;
    copyright: (year: number) => string;
    emailLabel: string;
  };
  languageToggle: {
    switchToEnglish: string;
    switchToBurmese: string;
  };
}

const my: HomepageDictionary = {
  nav: {
    templates: "နမူနာပုံစံ",
    howItWorks: "လုပ်ဆောင်ပုံ",
    contact: "ဆက်သွယ်ရန်",
    orderNow: "အခုမှာယူပါ",
    telegramLabel: "Telegram",
    tiktokLabel: "TikTok",
    openMenu: "မီနူးဖွင့်ရန်",
    closeMenu: "မီနူးပိတ်ရန်",
  },
  hero: {
    heading: "ချစ်ရသောသူနှင့် မမေ့နိုင်တဲ့ ချစ်ခြင်းအမှတ်တရလေးတွေဖန်တီးကြစို့",
    subtitle:
      "ဓာတ်ပုံများနှင့် အမှတ်တရနေ့ရက်များကို ဇာတ်လမ်းအပေါ်အခြေခံပြီး ရက်အနည်းငယ်အတွင်း ကိုယ်ပိုင်ဝဘ်ဆိုက်တစ်ခုအဖြစ် ပြောင်းလဲပေးပါသည်။",
    cta: "နမူနာပုံစံကြည့်ရန်",
  },
  showcase: {
    heading: "နမူနာပုံစံများရွေးချယ်ပါ",
    subtitle:
      "နမူနာပုံစံတိုင်းကို သင့်ကိုယ်ပိုင်ဓာတ်ပုံများ၊ နာမည်များနှင့် ဇာတ်လမ်းဖြင့် အပြည့်အဝ စိတ်ကြိုက်ပြင်ဆင်ပေးပါသည်။",
    filters: {
      all: "အားလုံး",
      anniversary: "နှစ်ပတ်လည်နေ့",
      birthday: "မွေးနေ့",
    },
    emptyBirthday: "မွေးနေ့ပုံစံများ မကြာမီရောက်ရှိလာပါမည်။",
    emptyGeneric: "ပုံစံအသစ်များ မကြာမီရောက်ရှိလာမည်ဖြစ်ပါသဖြင့် ခဏနေမှ ပြန်လာကြည့်ပါ။",
    orderThisStyle: "ဒီပုံစံမှာယူရန်",
    previewLabel: "နမူနာကြည့်ရန်",
    viewDemoAria: (templateName) => `${templateName} ၏ နမူနာကြည့်ရန် (တဲဘ်အသစ်ဖြင့်ဖွင့်မည်)`,
  },
  howItWorks: {
    heading: "လုပ်ဆောင်ပုံ",
    steps: [
      {
        title: "ပုံစံရွေးချယ်ပါ",
        description: "ပုံစံများကြည့်ပြီး သင်နှစ်သက်ရာရွေးချယ်ပါ။",
      },
      {
        title: "ဇာတ်လမ်းမျှဝေပါ",
        description: "ဓာတ်ပုံများ၊ နာမည်များနှင့် အမှတ်တရများ ပို့ပေးပါ။",
      },
      {
        title: "ကျွန်ုပ်တို့ ဖန်တီးပေးသည်",
        description: "ရက်အနည်းငယ်အတွင်း သင့်ကိုယ်ပိုင်ဝဘ်ဆိုက် ဖန်တီးပေးသည်။",
      },
      {
        title: "လင့်ခ်ရယူပါ",
        description: "မျှဝေရန် သီးသန့်လင့်ခ်တစ်ခု ရယူပါ။",
      },
    ],
  },
  faq: {
    heading: "အမေးများသောမေးခွန်းများ",
    items: [
      {
        question: "အော်ဒါတင်ခြင်း ဘယ်လိုလုပ်ရမလဲ?",
        answer:
          "ပုံစံတစ်ခုကို ရွေးပြီး \"ဒီပုံစံမှာယူရန်\" ကိုနှိပ်ပါ။ Telegram မှတစ်ဆင့် ကျွန်ုပ်တို့နှင့် တိုက်ရိုက်ဆက်သွယ်ပြီး အသေးစိတ်များ ပေးပို့ရုံဖြင့် အော်ဒါစတင်နိုင်ပါသည်။",
      },
      {
        question: "ဘယ်လိုဓာတ်ပုံ/အချက်အလက်တွေ ပေးရမလဲ?",
        answer:
          "စုံတွဲဓာတ်ပုံများ၊ နာမည်များ၊ အထူးနေ့ရက်များနှင့် သင်တို့၏ဇာတ်လမ်း အကျဉ်းချုပ်ကို ပေးပို့ရုံဖြင့် လုံလောက်ပါသည်။ ကျန်တာကို ကျွန်ုပ်တို့ ဂရုစိုက်ပေးပါမည်။",
      },
      {
        question: "ပြီးစီးတဲ့ ဝဘ်ဆိုက်ကို ဘယ်လောက်ကြာမှ ရရှိမလဲ?",
        answer:
          "ပုံမှန်အားဖြင့် ရက်အနည်းငယ်အတွင်း ပြီးစီးပါသည်။ ပုံစံအမျိုးအစားနှင့် လက်ရှိအော်ဒါအရေအတွက်ပေါ် မူတည်၍ အနည်းငယ်ကွာခြားနိုင်ပါသည်။",
      },
      {
        question: "ငွေပေးချေမှု ဘယ်လိုလုပ်ရမလဲ?",
        answer:
          "Telegram ပေါ်တွင် အော်ဒါအတည်ပြုပြီးနောက် KBZPay သို့မဟုတ် Wave Money ဖြင့် လွယ်ကူစွာ ငွေပေးချေနိုင်ပါသည်။",
      },
      {
        question: "အော်ဒါမတင်ခင် ပုံစံကို နမူနာကြည့်လို့ရလား?",
        answer:
          "ရပါတယ်။ ပုံစံတစ်ခုစီရဲ့ \"နမူနာကြည့်ရန်\" လင့်ခ်ကိုနှိပ်ပြီး အပြည့်အဝ လုပ်ဆောင်နိုင်သော နမူနာဆိုက်ကို အခမဲ့ကြည့်ရှုနိုင်ပါသည်။",
      },
      {
        question: "ကျွန်ုပ်ရဲ့ အချက်အလက်/ဓာတ်ပုံများကို လုံခြုံအောင် ထိန်းသိမ်းပေးပါသလား?",
        answer:
          "ဟုတ်ကဲ့။ ပြီးစီးသော ဝဘ်ဆိုက်တစ်ခုစီကို ရှာဖွေမှုအင်ဂျင်များက မတွေ့နိုင်အောင် သီးသန့်၊ မှော်ဝှက်လင့်ခ်ဖြင့်သာ တည်ဆောက်ပေးထားပြီး လင့်ခ်ကိုသိသူများသာ ဝင်ရောက်ကြည့်ရှုနိုင်ပါသည်။",
      },
    ],
  },
  payment: {
    note: "Telegram တွင် အော်ဒါအတည်ပြုပြီးနောက် KBZPay သို့မဟုတ် Wave Money ဖြင့် ငွေပေးချေနိုင်ပါသည်။",
  },
  finalCta: {
    heading: "လှပတဲ့အမှတ်တရတွေ ဖန်တီးဖို့အဆင်သင့်ဖြစ်နေပြီလား? ",
    subtitle:
      "ဓာတ်ပုံများနှင့် အချစ်ဇာတ်လမ်းကို Telegram မှတစ်ဆင့် ပို့ပေးလိုက်ပါ — ကျန်တာကျွန်ုပ်တို့ ဖန်တီးပေးပါမည်။",
    button: "Telegram မှတစ်ဆင့် စာပို့ရန်",
    emailCta: "သို့မဟုတ် အီးမေးလ်ပို့ရန်",
  },
  footer: {
    tagline: "ပြောချင်နေတဲ့ အချစ်ဇာတ်လမ်းများကို သူသိအောင်ပြောပြလိုက်ပါ ...",
    copyright: (year) => `© ${year} Vowx. မူပိုင်ခွင့်အားလုံးရယူထားသည်။`,
    emailLabel: "အီးမေးလ်",
  },
  languageToggle: {
    switchToEnglish: "Switch to English",
    switchToBurmese: "မြန်မာဘာသာသို့ ပြောင်းရန်",
  },
};

const en: HomepageDictionary = {
  nav: {
    templates: "Templates",
    howItWorks: "How It Works",
    contact: "Contact",
    orderNow: "Order Now",
    telegramLabel: "Telegram",
    tiktokLabel: "TikTok",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    heading: "Let's make unforgettable love memories with the one you love",
    subtitle:
      "We turn photos and memories into a private, personalized website — built around your story, delivered in days.",
    cta: "Browse Templates",
  },
  showcase: {
    heading: "Choose your style",
    subtitle: "Every template is fully personalized with your own photos, names, and story.",
    filters: {
      all: "All",
      anniversary: "Anniversary",
      birthday: "Birthday",
    },
    emptyBirthday: "Birthday templates coming soon.",
    emptyGeneric: "New templates are on the way — check back soon.",
    orderThisStyle: "Order This Style",
    previewLabel: "Preview",
    viewDemoAria: (templateName) => `View demo of ${templateName} (opens in a new tab)`,
  },
  howItWorks: {
    heading: "How it works",
    steps: [
      {
        title: "Pick your style",
        description: "Browse templates, choose your favorite.",
      },
      {
        title: "Share your story",
        description: "Send your photos, names, and memories.",
      },
      {
        title: "We craft it",
        description: "Your personalized site, built in days.",
      },
      {
        title: "Get your link",
        description: "A private link, ready to share.",
      },
    ],
  },
  faq: {
    heading: "Frequently asked questions",
    items: [
      {
        question: "How does ordering work?",
        answer:
          "Pick a template and tap \"Order This Style\" — you'll be connected with us directly on Telegram to share your details and get started.",
      },
      {
        question: "What photos or information do I need to provide?",
        answer:
          "Just send your photos, names, key dates, and a short summary of your story — we'll take care of the rest.",
      },
      {
        question: "How long does it take to receive my finished site?",
        answer:
          "Usually just a few days. The exact time can vary slightly depending on the template and current order volume.",
      },
      {
        question: "How do I pay?",
        answer:
          "Once your order is confirmed on Telegram, you can pay easily via KBZPay or Wave Money.",
      },
      {
        question: "Can I preview the template before ordering?",
        answer:
          "Yes — tap the \"Preview\" link on any template to view a fully working demo site, free, before you order.",
      },
      {
        question: "Is my information and photos kept private?",
        answer:
          "Yes. Every finished site is built on a private, unlisted link that search engines can't index — only people you share the link with can view it.",
      },
    ],
  },
  payment: {
    note: "Payment via KBZPay or Wave Money after order confirmation on Telegram.",
  },
  finalCta: {
    heading: "Ready to create something beautiful?",
    subtitle: "Message us on Telegram with your photos and story — we'll take care of the rest.",
    button: "Message Us on Telegram",
    emailCta: "Or email us instead",
  },
  footer: {
    tagline: "Your love story, beautifully told.",
    copyright: (year) => `© ${year} Vowx. All rights reserved.`,
    emailLabel: "Email",
  },
  languageToggle: {
    switchToEnglish: "Switch to English",
    switchToBurmese: "Switch to Burmese",
  },
};

export const HOMEPAGE_DICTIONARIES: Record<Lang, HomepageDictionary> = { my, en };
