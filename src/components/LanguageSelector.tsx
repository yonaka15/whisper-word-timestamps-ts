interface LanguageSelectorProps {
  language: string;
  setLanguage: (language: string) => void;
  className?: string;
}

// Language options - this could be expanded based on the model's capabilities
const LANGUAGES = [
  { code: "ja", name: "日本語" },
  { code: "en", name: "英語" },
  { code: "zh", name: "中国語" },
  { code: "ko", name: "韓国語" },
  { code: "fr", name: "フランス語" },
  { code: "de", name: "ドイツ語" },
  { code: "es", name: "スペイン語" },
  { code: "it", name: "イタリア語" },
  { code: "pt", name: "ポルトガル語" },
  { code: "nl", name: "オランダ語" },
  { code: "pl", name: "ポーランド語" },
  { code: "ru", name: "ロシア語" },
  { code: "hi", name: "ヒンディー語" },
];

function LanguageSelector({
  language,
  setLanguage,
  className = "",
}: LanguageSelectorProps) {
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className={`${className} text-sm bg-transparent`}
    >
      {LANGUAGES.map(({ code, name }) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
}

export default LanguageSelector;
