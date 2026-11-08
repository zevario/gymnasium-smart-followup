import { House, LayoutDashboard, List, Users, ChartColumn, Settings, Search, Bell, ChevronRight, X, Sparkles, Clock, Check, Copy, LogOut, Menu, Ellipsis, ChevronLeft, Calendar } from "lucide-react"
import { useT } from "../../i18n/useLanguage.js"

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
}
export function Icon({name,size=18}) {
  const Symbol = icons[name]
  return Symbol ? <Symbol size={size} strokeWidth={1.8} aria-hidden="true" /> : null
}

export function Badge({ children, tone = "neutral", }) {
    const t = useT();
    return <span className={`badge badge-${tone}`}>{t(children)}</span>;
}

export function Avatar({ initials, dark = false, }) {
    const t = useT();
    return (<span className={`avatar ${dark ? "avatar-dark" : ""}`}>{t(initials)}</span>);
}

export function Field({ icon, value, onChange, placeholder, }) {
    const t = useT();
    return (<label className="field">
      {icon && <Icon name={icon} size={17}/>}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t(placeholder)}/>
    </label>);
}

export function PageIntro({ eyebrow, title, subtitle, right, }) {
    const t = useT();
    return (<div className="page-intro">
      <div>
        {eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}
        <h1>{t(title)}</h1>
        <p>{t(subtitle)}</p>
      </div>
      {t(right)}
    </div>);
}
