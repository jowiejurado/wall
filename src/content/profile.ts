/** The person whose wall this is. Swap these to make it yours. */
export const profile = {
  name: "Jowie Trence Jurado",
  photo: "/profile.webp",
  headline: "Junior full-stack developer. I build things with React and Next.js.",
  bio: "Thanks for stopping by! Leave a note, a GIF, or just say hi. Every post shows up here live.",
  facts: [
    { icon: "work", label: "Junior Full Stack Developer at RushHour Digital" },
    { icon: "school", label: "BS Information Technology, University of Caloocan" },
    { icon: "place", label: "Bulacan, Philippines" },
  ] as const,
  links: {
    portfolio: "https://www.jowiejurado.dev/",
    source: "https://github.com/jowiejurado/wall",
  },
  site: "https://wall.jowiejurado.dev",
};
