export interface Entry {
  id: string;
  title: string;
  transcript: string;
  summary: string;
  tags: string[];
  mood: string;
  category: string;
  subcategory: string;
  people: string[];
  action_items: string[];
  audio_url?: string;
  created_at: string;
}

export interface WeeklySummary {
  summary: string;
  themes: string[];
  mood_trend: string;
  highlights: string[];
}

export interface Folder {
  name: string;
  icon: string;
  count: number;
  subcategories: { name: string; count: number }[];
}

export const MOCK_ENTRIES: Entry[] = [
  {
    id: "1",
    title: "Voice journal app is taking shape",
    transcript:
      "Okay so I've been building this voice journal thing and it's actually starting to come together. The idea is simple — I just talk into my phone whenever I have a thought, and it transcribes it, tags it, pulls out action items. Way better than typing notes that I never go back to. The key insight is that the friction of writing is what kills journaling for most people. If I can just talk for 30 seconds and get a structured entry back, that changes everything. Need to figure out the PWA setup so it feels native on my phone.",
    summary:
      "Reflected on the voice journal project coming together. The core insight is reducing friction — talking is easier than typing, which should make journaling stick.",
    tags: ["voice-journal", "product", "building"],
    mood: "excited",
    category: "Projects",
    subcategory: "Voice Journal",
    people: [],
    action_items: ["Set up PWA manifest for mobile install", "Test recording flow on iPhone Safari"],
    created_at: "2026-04-12T09:15:00.000Z",
  },
  {
    id: "2",
    title: "Morning walk — thinking about focus",
    transcript:
      "Just got back from a walk around the neighborhood. Been thinking about how scattered my attention has been lately. I've got the trading bots, the voice journal, TradeFlow... I keep context switching and nothing gets to 100%. I think the move is to timebox — mornings for the journal app since that's the new thing with momentum, afternoons for trading, and evenings are free. Also ran into Dave from next door, he asked about the landscaping quote I mentioned. Need to send that to him.",
    summary:
      "Morning walk reflection on attention being too scattered across projects. Decision to timebox: mornings for voice journal, afternoons for trading. Ran into Dave.",
    tags: ["focus", "productivity", "routine"],
    mood: "reflective",
    category: "Daily Life",
    subcategory: "Reflections",
    people: ["Dave"],
    action_items: ["Implement timeboxing schedule", "Send Dave the landscaping quote"],
    created_at: "2026-04-12T08:30:00.000Z",
  },
  {
    id: "3",
    title: "MNQ strategy hit a new equity high",
    transcript:
      "Quick update — the MNQ momentum strategy just hit a new equity high. Up 12% this month which is solid for the drawdown profile we're seeing. The parameter optimization I did last week on the entry filter is paying off. RSI divergence plus the volume confirmation is catching these morning moves really clean. Thinking about scaling from 2 to 4 contracts but want to see another week of this before I commit. Also need to check if the VPS is running low on disk space, got a warning yesterday.",
    summary:
      "MNQ momentum strategy hit new equity high, up 12% this month. Entry filter optimization is working well. Considering scaling from 2 to 4 contracts.",
    tags: ["trading", "mnq", "futures", "strategy"],
    mood: "positive",
    category: "Trading",
    subcategory: "Futures / MNQ",
    people: [],
    action_items: [
      "Monitor strategy for another week before scaling",
      "Check VPS disk space",
    ],
    created_at: "2026-04-11T16:00:00.000Z",
  },
  {
    id: "4",
    title: "Feeling stuck on the TradeFlow pricing",
    transcript:
      "I keep going back and forth on TradeFlow pricing. On one hand, contractors aren't used to paying for software — they're used to free estimates from HomeAdvisor or whatever. On the other hand, if the AI phone agent actually books jobs for them, that's worth real money. I'm thinking maybe a free tier that does basic quote building, and then $49/month for the AI phone agent and automated follow-ups. Sarah said she thinks we should go higher, like $99, because the value is clearly there if it works. But I don't want price to be a barrier to getting those first 10 customers. Maybe start at $49 and raise later.",
    summary:
      "Wrestling with TradeFlow pricing strategy. Considering free tier for quotes + $49/mo for AI phone agent. Sarah suggests $99. Leaning toward starting low to get first 10 customers.",
    tags: ["tradeflow", "pricing", "saas", "strategy"],
    mood: "mixed",
    category: "Projects",
    subcategory: "TradeFlow",
    people: ["Sarah"],
    action_items: [
      "Finalize pricing tiers for TradeFlow",
      "Talk to 3 more contractors about willingness to pay",
    ],
    created_at: "2026-04-11T11:00:00.000Z",
  },
  {
    id: "5",
    title: "Great conversation with Mom",
    transcript:
      "Had a really good call with Mom today. She's been doing the garden thing and sounds happier than she has in months. We talked about maybe doing a trip together this summer — she suggested Lake Tahoe which could be cool. I mentioned the business stuff and she was surprisingly supportive, said Dad would have been proud of me for taking the risk. That hit me in a good way. Need to look into Tahoe rentals and figure out dates that work for both of us.",
    summary:
      "Great phone call with Mom. She's doing well with gardening. Planning a potential summer trip to Lake Tahoe together. She said Dad would be proud — meant a lot.",
    tags: ["family", "mom", "trip-planning"],
    mood: "positive",
    category: "People",
    subcategory: "Family",
    people: ["Mom", "Dad"],
    action_items: ["Research Lake Tahoe rentals for summer", "Send Mom some date options"],
    created_at: "2026-04-10T19:00:00.000Z",
  },
  {
    id: "6",
    title: "Sleep has been terrible this week",
    transcript:
      "Okay I need to talk about this because my sleep has been garbage. I've been going to bed at like 1 AM, scrolling, then waking up at 7 feeling wrecked. The screens before bed thing is real. I used to be good about this — phone goes on the charger at 10:30, read a book, lights out by 11. I need to get back to that. Also I think the afternoon coffee is hurting me. Going to cut caffeine after noon starting tomorrow and do the phone-away-at-10:30 thing again. No excuses.",
    summary:
      "Sleep quality has tanked due to late-night scrolling and afternoon coffee. Committing to phone away at 10:30 PM and no caffeine after noon.",
    tags: ["health", "sleep", "habits"],
    mood: "tired",
    category: "Health",
    subcategory: "Sleep",
    people: [],
    action_items: [
      "No caffeine after 12pm starting tomorrow",
      "Phone on charger at 10:30pm",
      "Read before bed instead of scrolling",
    ],
    created_at: "2026-04-10T23:00:00.000Z",
  },
  {
    id: "7",
    title: "Idea: voice journal for therapists",
    transcript:
      "Random thought — what if there was a version of this voice journal app specifically for therapy? Like, your therapist gives you a prompt each week, you record voice entries about it, and the AI organizes your reflections so when you walk into your session, both you and your therapist have this structured summary of what you've been processing. Could be huge. The therapy note-taking market is already big but nobody's doing the patient side well. Parking this for later but it's interesting.",
    summary:
      "Idea for a therapy-focused voice journal. Therapist assigns prompts, patient records reflections, AI structures them for session prep. Interesting market opportunity.",
    tags: ["idea", "therapy", "product", "voice-journal"],
    mood: "excited",
    category: "Ideas",
    subcategory: "Product Ideas",
    people: [],
    action_items: ["Research therapy journaling apps market"],
    created_at: "2026-04-09T14:00:00.000Z",
  },
  {
    id: "8",
    title: "Polymarket position update — election odds",
    transcript:
      "Quick Polymarket check-in. My position on the governor's race is sitting at about 2x right now since I got in early when the odds were way off. The market is starting to correct toward what I predicted. I'm going to hold through the primary results next week — if my candidate wins that, the payout could be 3-4x. Risk is obviously that I'm wrong and it goes to zero, but the position size is small enough that I'm comfortable. Also looking at some new markets around the Fed rate decision in June.",
    summary:
      "Polymarket governor's race position up ~2x. Holding through primary results for potential 3-4x. Eyeing Fed rate decision markets for June.",
    tags: ["polymarket", "trading", "politics"],
    mood: "positive",
    category: "Trading",
    subcategory: "Polymarket",
    people: [],
    action_items: ["Monitor primary results next week", "Research Fed rate decision markets"],
    created_at: "2026-04-08T10:00:00.000Z",
  },
  {
    id: "9",
    title: "Need to be better about exercise",
    transcript:
      "I haven't worked out in like 10 days and I can feel it. My energy is lower, I'm more anxious, sleep is worse — it's all connected. The gym membership is just sitting there. I think the problem is I keep trying to do these hour-long sessions and then I skip because I don't have time. What if I just committed to 20 minutes? Like, 20 minutes of anything — a run, some pushups, whatever. The research says even short workouts make a huge difference for mood. Starting tomorrow, 20 minutes before I open the laptop. Non-negotiable.",
    summary:
      "Haven't exercised in 10 days and feeling the effects on energy and mood. Committing to 20-minute minimum workouts before opening the laptop each morning.",
    tags: ["health", "exercise", "habits", "motivation"],
    mood: "anxious",
    category: "Health",
    subcategory: "Exercise",
    people: [],
    action_items: ["20-minute workout before laptop every morning", "Cancel gym, get a pull-up bar instead"],
    created_at: "2026-04-07T07:00:00.000Z",
  },
  {
    id: "10",
    title: "Dinner with Jake and Lisa",
    transcript:
      "Had dinner with Jake and Lisa tonight at that new Italian place on Main. Really good time. Jake is thinking about leaving his corporate job to do consulting, which is a big move for him. I told him about my experience going independent and the financial runway thing — you need at least 6 months of expenses saved before you jump. Lisa is pregnant! They're super excited, due in October. We should plan something for them. Also the pasta at that restaurant was incredible, need to go back.",
    summary:
      "Dinner with Jake and Lisa. Jake considering leaving corporate for consulting — shared advice about financial runway. Lisa is pregnant, due in October.",
    tags: ["friends", "dinner", "life-update"],
    mood: "positive",
    category: "People",
    subcategory: "Friends",
    people: ["Jake", "Lisa"],
    action_items: ["Plan something for Jake and Lisa's baby news", "Go back to the Italian restaurant"],
    created_at: "2026-04-07T21:00:00.000Z",
  },
  {
    id: "11",
    title: "Rethinking the gold bot parameters",
    transcript:
      "The gold bot has been underperforming since the volatility spike last week. I think the ATR multiplier needs to go up from 1.5 to maybe 2.0 during high-vol regimes. The entries are fine but the stops are getting clipped by the wider ranges. Going to run a backtest tonight with regime-adaptive stops — if ATR is above the 20-day average, widen stops by 30%. Should be a quick test in backtesting.py. Also want to add a filter that reduces position size during FOMC weeks.",
    summary:
      "Gold bot underperforming in high volatility. Planning to test regime-adaptive stops (wider when ATR is elevated) and FOMC week position size reduction.",
    tags: ["trading", "gold", "optimization", "backtesting"],
    mood: "neutral",
    category: "Trading",
    subcategory: "Gold Bot",
    people: [],
    action_items: [
      "Backtest ATR multiplier 2.0 for high-vol regime",
      "Add FOMC week position size filter",
    ],
    created_at: "2026-04-06T15:00:00.000Z",
  },
  {
    id: "12",
    title: "Gratitude moment — appreciating the freedom",
    transcript:
      "Just want to put this on record. I'm sitting on my porch at 2 PM on a Tuesday, building something I care about, with nobody telling me what to do. A year ago I was grinding at a desk job I hated. The money situation isn't perfect but I have enough runway and the trading is covering basics. I'm healthier mentally even if the sleep needs work. I get to choose what I work on every day. That's worth more than any salary. I don't say this enough but I'm genuinely grateful for where I'm at right now.",
    summary:
      "Gratitude reflection on having the freedom to work independently. Contrasting current life with desk job a year ago. Financially stable enough through trading. Genuinely grateful.",
    tags: ["gratitude", "reflection", "freedom", "mindset"],
    mood: "positive",
    category: "Daily Life",
    subcategory: "Reflections",
    people: [],
    action_items: [],
    created_at: "2026-04-06T14:00:00.000Z",
  },
];

export function getFolders(): Folder[] {
  const folderMap: Record<string, { entries: Entry[]; subs: Record<string, number> }> = {};

  for (const e of MOCK_ENTRIES) {
    if (!folderMap[e.category]) {
      folderMap[e.category] = { entries: [], subs: {} };
    }
    folderMap[e.category].entries.push(e);
    folderMap[e.category].subs[e.subcategory] =
      (folderMap[e.category].subs[e.subcategory] || 0) + 1;
  }

  const icons: Record<string, string> = {
    Trading: "chart-bar",
    Projects: "rocket",
    Health: "heart",
    People: "users",
    Ideas: "lightbulb",
    "Daily Life": "sun",
  };

  return Object.entries(folderMap)
    .map(([name, data]) => ({
      name,
      icon: icons[name] || "folder",
      count: data.entries.length,
      subcategories: Object.entries(data.subs)
        .map(([subName, count]) => ({ name: subName, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getEntriesByCategory(category: string, subcategory?: string): Entry[] {
  return MOCK_ENTRIES.filter(
    (e) =>
      e.category === category &&
      (!subcategory || e.subcategory === subcategory),
  );
}

export const MOCK_WEEKLY_SUMMARY: WeeklySummary = {
  summary:
    "This was a productive but scattered week. You made real progress on the voice journal app and your MNQ strategy hit a new high — both momentum builders. But you also flagged attention fragmentation as a problem, bouncing between the journal, trading, and TradeFlow pricing decisions. The sleep issues came up twice and seem connected to the late-night scrolling habit you identified.\n\nOn the personal side, the call with Mom was a highlight and the dinner with Jake and Lisa added some warmth to the week. You're clearly in a building phase — lots of plates spinning — but the gratitude entry on Tuesday shows you haven't lost sight of why you chose this path.\n\nThe pattern is clear: when you stick to your routines (morning workouts, phone away at 10:30), everything else runs better. The timeboxing idea could help with the context-switching problem.",
  themes: [
    "Building momentum on projects",
    "Attention fragmentation",
    "Health habits slipping",
    "Gratitude and freedom",
    "Relationships and connection",
  ],
  mood_trend:
    "Generally positive with pockets of anxiety. Your excited/positive entries outnumber the stressed ones, but the health-related entries (sleep, exercise) show some unresolved tension. Mood lifts noticeably when you're building or connecting with people.",
  highlights: [
    "MNQ strategy hit new equity high — up 12% this month",
    "Mom said Dad would be proud, and it meant a lot",
    "Jake and Lisa announced pregnancy",
    "Committed to timeboxing schedule for focus",
    "Therapy voice journal idea could be a real product",
  ],
};

export const MOCK_ASK_RESPONSES: Record<string, string> = {
  default:
    "Based on your recent entries, you've been focused on three main areas: building the voice journal app, managing your trading strategies (MNQ and gold bot), and thinking through TradeFlow pricing. The recurring theme is that you have strong momentum on multiple fronts but are struggling with context-switching between them. Your timeboxing idea from the morning walk entry seems like the right solution.",
  sleep:
    "You talked about sleep issues in your entry from 2 days ago. The main problems you identified were: scrolling until 1 AM, afternoon coffee, and skipping your old routine. You committed to no caffeine after noon, phone on charger at 10:30 PM, and reading before bed. You also noted that lack of exercise is making the sleep worse. These two habits seem tightly linked — fixing one should help the other.",
  trading:
    "Your trading has been going well overall. The MNQ momentum strategy hit a new equity high, up 12% this month — you're considering scaling from 2 to 4 contracts but want another week of data first. The gold bot needs attention though — you're planning to test wider stops during high-vol regimes and add FOMC week position sizing. Your Polymarket governor's race position is up 2x and you're holding through the primary.",
  people:
    "This week you mentioned: Mom (great call, planning Lake Tahoe trip), Dave (neighbor, owes him a landscaping quote), Sarah (discussed TradeFlow pricing, she suggested $99/mo), Jake (considering leaving corporate for consulting), and Lisa (pregnant, due October). Seems like a socially rich week!",
};

export function mockSearch(query: string): Entry[] {
  const q = query.toLowerCase();
  return MOCK_ENTRIES.filter(
    (e) =>
      e.transcript.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.tags.some((t) => t.includes(q)) ||
      e.summary.toLowerCase().includes(q) ||
      e.people.some((p) => p.toLowerCase().includes(q)),
  );
}

export function mockAskResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("sleep") || q.includes("tired") || q.includes("rest"))
    return MOCK_ASK_RESPONSES.sleep;
  if (
    q.includes("trading") ||
    q.includes("mnq") ||
    q.includes("gold") ||
    q.includes("polymarket") ||
    q.includes("strategy")
  )
    return MOCK_ASK_RESPONSES.trading;
  if (
    q.includes("people") ||
    q.includes("who") ||
    q.includes("mention") ||
    q.includes("talk to")
  )
    return MOCK_ASK_RESPONSES.people;
  return MOCK_ASK_RESPONSES.default;
}
