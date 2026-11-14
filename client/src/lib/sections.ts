import {
  Apple,
  Car,
  Package,
  PackageCheck,
  Shapes,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ListingSection } from '../types';

export interface SectionDef {
  value: ListingSection;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const LISTING_SECTIONS: SectionDef[] = [
  { value: 'vegetables', label: 'خضار', hint: 'خضروات وفواكه طازجة ومصنفة', icon: Sprout },
  { value: 'fruits', label: 'فواكه', hint: 'فواكه موسمية ومستوردة', icon: Apple },
  { value: 'supplies', label: 'مواد زراعية', hint: 'أسمدة وبذور ومعدات ومستلزمات', icon: Package },
  { value: 'labor', label: 'عمالة', hint: 'عمالة زراعية وموسمية', icon: Users },
  { value: 'transport', label: 'خدمات نقل', hint: 'نقل المحاصيل والمستلزمات', icon: Car },
  { value: 'packing', label: 'مشغل توضيب', hint: 'تعبئة وتغليف وتصنيع', icon: PackageCheck },
  { value: 'other', label: 'أخرى', hint: 'أي قسم غير مذكور — اكتب وصفه', icon: Shapes },
];

export const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  LISTING_SECTIONS.map((s) => [s.value, s.label]),
);
