export const KJ_IDENTITY_MANIFEST = {
  profile: {
    name: "KJ",
    avatarUrl: "/thewaitlist/assets/kj-smiling-portrait.jpg",
    bioHook: "I'll handle the plans; you just bring the sexy."
  },
  designSystem: {
    theme: "Strict Premium Minimalist White",
    accentGlow: "rgba(0, 0, 0, 0.03)",
    animationCurve: [0.16, 1, 0.3, 1] as [number, number, number, number] // Custom ease-out expo
  },
  curatedOptions: {
    food: {
      optionA: { label: "High-Fidelity Omakase", value: "sushi", description: "Fresh cuts, refined techniques, and intimate conversation" },
      optionB: { label: "Artisan Lounge Pasta", value: "pasta", description: "Warm carbs, rich conversations, and low-lit architectural vibes" }
    },
    vibe: {
      optionA: { label: "Competitive Vector Arcade", value: "arcade", description: "Playful high-score rivalry, pixel graphics, and neon vibes" },
      optionB: { label: "Cinematic Late-Night Crawl", value: "movies", description: "Atmospheric streetscapes, cozy frames, and late-night talks" }
    },
    qualifier: {
      optionA: { label: "Chaotic Creative Alignment", value: "chaotic", description: "Spontaneous inspiration, organic detours, and electric energy" },
      optionB: { label: "Deep, Hyper-Focused Sync", value: "focused", description: "Curated itineraries, optimized flow states, and seamless matching" }
    }
  }
};
