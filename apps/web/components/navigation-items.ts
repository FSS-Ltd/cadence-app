export const primaryNavigation = [
  { href: "/", label: "Today", icon: "◷" },
  { href: "/library", label: "Library", icon: "▤" },
  { href: "/create", label: "Create", icon: "+" },
  { href: "/review", label: "Review", icon: "✓" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/learn", label: "Learn", icon: "↗" },
  { href: "/settings", label: "Settings", icon: "⚙" },
] as const;

export const mobileNavigation = [
  { href: "/", label: "Today", icon: "◷" },
  { href: "/create", label: "Capture", icon: "+" },
  { href: "/review", label: "Review", icon: "✓" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/settings", label: "More", icon: "···" },
] as const;
