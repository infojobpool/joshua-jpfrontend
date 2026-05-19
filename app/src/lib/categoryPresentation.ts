import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Camera,
  Car,
  Dog,
  Dumbbell,
  Home,
  Laptop,
  Leaf,
  Music,
  PaintBucket,
  Pencil,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  Utensils,
  Wrench,
} from "lucide-react";

const ICON_RULES: { match: RegExp; icon: LucideIcon }[] = [
  { match: /plumb|pipe|water/i, icon: Wrench },
  { match: /tech|computer|laptop|it|software|web|digital/i, icon: Laptop },
  { match: /clean|maid|housekeep/i, icon: Sparkles },
  { match: /garden|lawn|landscap|plant/i, icon: Leaf },
  { match: /mov|deliver|transport|shifting/i, icon: Truck },
  { match: /photo|video|film/i, icon: Camera },
  { match: /pet|dog|cat|animal/i, icon: Dog },
  { match: /food|cater|chef|cook/i, icon: Utensils },
  { match: /car|auto|mechanic|vehicle/i, icon: Car },
  { match: /paint|renovat|improve|repair|handyman|electric|carpent/i, icon: PaintBucket },
  { match: /shop|retail|errand/i, icon: ShoppingBag },
  { match: /cloth|fashion|tailor|alter/i, icon: Shirt },
  { match: /music|audio|dj|event/i, icon: Music },
  { match: /fit|gym|sport|yoga/i, icon: Dumbbell },
  { match: /tutor|teach|education|class/i, icon: Pencil },
  { match: /business|office|admin|account/i, icon: Briefcase },
  { match: /home|property|furniture/i, icon: Home },
];

const PALETTES = [
  { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100", border: "border-blue-200" },
  { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", border: "border-emerald-200" },
  { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100", border: "border-violet-200" },
  { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-100", border: "border-amber-200" },
  { bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-100", border: "border-rose-200" },
  { bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-100", border: "border-cyan-200" },
  { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-100", border: "border-orange-200" },
  { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100", border: "border-indigo-200" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function categoryIcon(name: string): LucideIcon {
  for (const rule of ICON_RULES) {
    if (rule.match.test(name)) return rule.icon;
  }
  return Briefcase;
}

export function categoryPalette(key: string) {
  return PALETTES[hashString(key) % PALETTES.length];
}

export function categorySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
