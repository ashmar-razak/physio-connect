// Warm, calm, human — inspired by the softer visual language of wellness/
// therapy apps (cream backgrounds, terracotta accents, rounded everything)
// rather than a cold clinical blue/white healthcare look, adapted to our
// own palette.
export const colors = {
  primary: "#D97757",
  primaryDark: "#B85C3E",
  primaryLight: "#F6DFD2",
  background: "#FAF6F1",
  surface: "#FFFFFF",
  border: "#EDE3D8",
  text: "#2A2420",
  textMuted: "#8C7F72",
  danger: "#C74A3C",
  dangerLight: "#FBE4E0",
  success: "#4C8B5F",
  successLight: "#E1EEE3",
  warning: "#C98A2E",
  warningLight: "#F6E9D2",
  gold: "#A6791F",
  goldLight: "#F3E6C4",
  silver: "#6B6259",
  silverLight: "#E9E3DB",
  bronze: "#8A4A2E",
  bronzeLight: "#F0DCC9",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

// Soft, diffuse elevation instead of hard borders — cards read as gently
// "floating" rather than boxed-in.
export const shadow = {
  card: {
    shadowColor: "#3A2A1E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  button: {
    shadowColor: "#B85C3E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
