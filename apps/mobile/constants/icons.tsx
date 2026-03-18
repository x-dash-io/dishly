import {
  Home, Compass, PlusSquare, Bookmark, User,          // Tab bar
  Heart, MessageCircle, Share2, Send,                  // Social actions
  Clock, ChefHat, Users, Flame, Star,                  // Recipe meta
  Camera, Image, Sparkles, Wand2, ScanLine,            // AI features
  Search, Filter, X, ChevronRight, ChevronLeft,        // Navigation
  ChevronDown, ChevronUp, Check, AlertCircle,          // State
  Play, Pause, RotateCcw, Timer,                       // Cook mode
  ShoppingCart, Calendar, Plus, Minus, Trash2,         // Actions
  Lock, Globe, UserCheck, LogOut, Settings, Info,      // Profile / auth
  TrendingUp, Zap, Menu,                               // Discovery
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { COLORS } from './colors';

/**
 * Dishly Icon Catalogue
 * Mapping semantic names to lucide-react-native components.
 * 
 * RULE 1: All AI feature icons must use color={COLORS.aiPurple} — no exceptions
 * RULE 2: Default strokeWidth is 1.75 (slightly thinner than Lucide default of 2)
 *         — matches Dishly's refined editorial aesthetic
 * RULE 3: Tab bar icons: size=22
 *         Action icons in cards: size=18
 *         Inline/text-adjacent icons: size=16
 *         Hero/CTA icons: size=24
 */

export const Icons = {
  // Tabs
  home:           Home,
  explore:        Compass,
  create:         PlusSquare,
  saved:          Bookmark,
  profile:        User,

  // Social
  like:           Heart,
  comment:        MessageCircle,
  share:          Share2,
  send:           Send,

  // Recipe meta
  clock:          Clock,
  chef:           ChefHat,
  servings:       Users,
  difficulty:     Flame,
  rating:         Star,

  // AI features (always rendered in COLORS.aiPurple)
  aiCamera:       Camera,
  aiScan:         ScanLine,
  aiGenerate:     Sparkles,
  aiWand:         Wand2,
  aiImage:        Image,

  // Navigation & UI
  search:         Search,
  filter:         Filter,
  close:          X,
  forward:        ChevronRight,
  back:           ChevronLeft,
  expand:         ChevronDown,
  collapse:       ChevronUp,
  check:          Check,
  alert:          AlertCircle,

  // Cook mode
  play:           Play,
  pause:          Pause,
  reset:          RotateCcw,
  timer:          Timer,

  // Actions
  cart:           ShoppingCart,
  calendar:       Calendar,
  add:            Plus,
  remove:         Minus,
  delete:         Trash2,
  trending:       TrendingUp,
  quick:          Zap,
  menu:           Menu,

  // Account
  info:           Info,
  private:        Lock,
  public:         Globe,
  follow:         UserCheck,
  logout:         LogOut,
  settings:       Settings,
} as const;

export type IconName = keyof typeof Icons;

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function AppIcon({ name, size = 20, color = COLORS.textPrimary, strokeWidth = 1.75 }: AppIconProps) {
  const IconComponent = Icons[name] as LucideIcon;
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
