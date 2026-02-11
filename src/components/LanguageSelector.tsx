"use client";
import { useTranslation } from "./LanguageContext";
import { Language } from "@/data/translations";

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  const langs: { code: Language; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "tw", label: "繁中" },
    { code: "ar", label: "عربي" }
  ];

  return (
    <div className="flex space-x-2 bg-[#161b22] p-1 rounded border border-[#30363d]">
      {langs.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1 text-[10px] font-black rounded transition ${
            language === lang.code ? "bg-[#58a6ff] text-white" : "text-gray-500 hover:text-white"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
