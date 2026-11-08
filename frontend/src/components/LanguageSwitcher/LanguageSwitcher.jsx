import { useLanguage } from "../../i18n/useLanguage.js"

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    return <label className="app-language">
    <select aria-label="Bahasa / Language" value={language} onChange={event => setLanguage(event.target.value)}>
      <option value="id">ID</option>
      <option value="en">EN</option>
    </select>
  </label>;
}
