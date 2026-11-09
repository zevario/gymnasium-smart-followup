import {
  House,
  LayoutDashboard,
  List,
  Users,
  ChartColumn,
  Settings,
  Search,
  Bell,
  ChevronRight,
  X,
  Sparkles,
  Clock,
  Check,
  Copy,
  LogOut,
  Menu,
  Ellipsis,
  ChevronLeft,
  Calendar,
} from 'lucide-react';

const icons = {
  home: House,
  dashboard: LayoutDashboard,
  list: List,
  users: Users,
  chart: ChartColumn,
  settings: Settings,
  search: Search,
  bell: Bell,
  chevron: ChevronRight,
  close: X,
  spark: Sparkles,
  clock: Clock,
  check: Check,
  copy: Copy,
  logout: LogOut,
  menu: Menu,
  more: Ellipsis,
  arrow: ChevronLeft,
  calendar: Calendar,
};
export function Icon({ name, size = 18 }) {
  const Symbol = icons[name];
  return Symbol ? <Symbol size={size} strokeWidth={1.8} aria-hidden="true" /> : null;
}
