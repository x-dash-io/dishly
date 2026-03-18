export const COLORS = {
  // Brand
  primary:        '#E8531A',  // Spice Orange
  secondary:      '#3D7A4F',  // Forest Green
  aiPurple:       '#7C3AED',  // AI Purple — exclusive to AI features
  aiPurpleLight:  '#EDE9FE',  // AI Purple tint — AI card backgrounds

  // Backgrounds
  background:     '#FDF6ED',  // Parchment Cream — primary screen bg
  surface:        '#FFFFFF',  // Cards, sheets, inputs
  surfaceAlt:     '#F5F0EB',  // Alternate surface (skeleton loaders, tags)

  // Text
  textPrimary:    '#1A1A1A',
  textSecondary:  '#666666',
  textMuted:      '#999999',
  textInverse:    '#FFFFFF',

  // Headings / Nav
  mahogany:       '#5E3C2C',  // Rich Mahogany — headings
  navDark:        '#2C1A10',  // Bottom nav background

  // Semantic
  success:        '#3D7A4F',
  error:          '#DC2626',
  warning:        '#D97706',
  info:           '#2563EB',

  // Borders
  border:         '#E8E0D4',  // Default border
  borderStrong:   '#C4B8AA',

  // Overlays
  overlay:        'rgba(44, 26, 16, 0.6)',
  overlayLight:   'rgba(44, 26, 16, 0.3)',
} as const;

export type ColorKey = keyof typeof COLORS;
