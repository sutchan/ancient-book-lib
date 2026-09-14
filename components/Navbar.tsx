// components/Navbar.tsx v1.19.1
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toSimplified } from "@/lib/t2s";
import { useBookmarks } from "@/lib/useBookmarks";
import { BRAND_FULL } from "@/lib/constants";
import { type Lang, t } from "@/lib/i18n";

interface NavbarProps {
  current?: string;
  basePath?: string;
}

const MENU_KEYS = ["home", "catalog", "search", "people", "relation", "bookmarks", "help"] as const;
const MENU_HREFS: Record<typeof MENU_KEYS[number], string> = {
  home: "/",
  catalog: "/catalog",
  search: "/search",
  people: "/people",
  relation: "/relation",
  bookmarks: "/bookmarks",
  help: "/help",
};

export default function Navbar({ current: currentProp = "home" }: NavbarProps) {
  const pathname = usePathname();
  const current =
    currentProp !== "home"
      ? currentProp
      : (MENU_KEYS.find((k) => MENU_HREFS[k] !== "/" && pathname.startsWith(MENU_HREFS[k])) ||
        (pathname === "/" ? "home" : currentProp));

  const [theme, setTheme] = useState<"light" | "paper" | "dark">("light");
  const [simplified, setSimplified] = useState(false);
  const [lang, setLang] = useState<Lang>("zh");
  const [menuOpen, setMenuOpen] = useState(false);
  const initialRef = useRef(false);
  const bookmarks = useBookmarks();
  const bookmarkCount = bookmarks.length;

  useEffect(() => {
    if (initialRef.current) return;
    initialRef.current = true;
    const savedTheme = (localStorage.getItem("ab-theme") as "light" | "paper" | "dark") || "light";
    const savedSimple = localStorage.getItem("ab-simple") === "1";
    const savedLang = (localStorage.getItem("ab-lang") as Lang) || "zh";

    setTheme(savedTheme);
    setSimplified(savedSimple);
    setLang(savedLang);
    document.documentElement.dataset.theme = savedTheme;

    const handleStorage = () => {
      setSimplified(localStorage.getItem("ab-simple") === "1");
      setLang((localStorage.getItem("ab-lang") as Lang) || "zh");
      const st = (localStorage.getItem("ab-theme") as "light" | "paper" | "dark") || "light";
      setTheme(st);
      document.documentElement.dataset.theme = st;
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("ab-settings-change", handleStorage as EventListener);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("ab-settings-change", handleStorage as EventListener);
    };
  }, []);

  const applyTheme = useCallback((t: "light" | "paper" | "dark") => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem("ab-theme", t);
    window.dispatchEvent(new Event("ab-settings-change"));
  }, []);

  const toggleTheme = () => applyTheme(theme === "light" ? "paper" : theme === "paper" ? "dark" : "light");

  const toggleSimplified = () => {
    const next = !simplified;
    setSimplified(next);
    localStorage.setItem("ab-simple", next ? "1" : "0");
    window.dispatchEvent(new Event("ab-settings-change"));
  };

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("ab-lang", newLang);
    window.dispatchEvent(new Event("ab-settings-change"));
  };

  const themeLabel = theme === "light" ? "日间" : theme === "paper" ? "护眼" : "深色";

  return (
    <>
      <header className="navbar" id="site-navbar">
        <div className="nav-inner" id="nav-inner-container">
          <Link className="brand" href="/" id="brand-home-link">
            <img
              id="brand-logo"
              className="brand-logo"
              src={theme === "dark" ? "/brand/logo-full-light-512.png" : "/brand/logo-full-512.png"}
              alt={BRAND_FULL}
            />
          </Link>
          <nav className="nav-menu" id="primary-nav">
            {MENU_KEYS.map((k) => {
              const label = t(lang, k);
              const displayLabel = lang === "zh" && simplified ? toSimplified(label) : label;
              return (
                <Link
                  key={k}
                  href={MENU_HREFS[k]}
                  id={k === "bookmarks" ? "nav-bookmarks" : `nav-link-${k}`}
                  className={current === k ? "active" : ""}
                >
                  {displayLabel}
                  {k === "bookmarks" && bookmarkCount > 0 && (
                    <span className="nav-badge" aria-label={`${bookmarkCount} 个书签`} style={{ marginLeft: 4, fontSize: 11, background: "var(--color-primary, #8C3130)", color: "#fff", borderRadius: 10, padding: "0 6px", verticalAlign: "middle" }}>{bookmarkCount}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="nav-actions" id="nav-actions-group">
            {/* 语言切换 */}
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => changeLang(e.target.value as Lang)}
              className="btn-toggle"
              style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 4, padding: "3px 6px", fontSize: 13, cursor: "pointer", color: "var(--color-text)" }}
              aria-label="语言切换"
            >
              <option value="zh" style={{ background: "var(--color-card-bg)" }}>中文</option>
              <option value="en" style={{ background: "var(--color-card-bg)" }}>English</option>
              <option value="ja" style={{ background: "var(--color-card-bg)" }}>日本語</option>
              <option value="ko" style={{ background: "var(--color-card-bg)" }}>한국어</option>
            </select>

            {/* 仅在中文模式下显示简体/繁体切换 */}
            {lang === "zh" && (
              <button id="simple-toggle-btn" className="btn-toggle" onClick={toggleSimplified} aria-label="繁简切换">
                {simplified ? "繁體" : "简体"}
              </button>
            )}

            <button id="theme-toggle-btn" className="btn-toggle" onClick={toggleTheme} aria-label="主题切换">
              {themeLabel}
            </button>
          </div>
          <button id="hamburger-menu-btn" className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="菜单">
            ☰
          </button>
        </div>
      </header>
      <nav id="mobile-nav" className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {MENU_KEYS.map((k) => {
          const label = t(lang, k);
          const displayLabel = lang === "zh" && simplified ? toSimplified(label) : label;
          return (
            <Link key={k} href={MENU_HREFS[k]} className={current === k ? "active" : ""} onClick={() => setMenuOpen(false)}>
              {displayLabel}
              {k === "bookmarks" && bookmarkCount > 0 && (
                <span className="nav-badge" style={{ marginLeft: 4, fontSize: 11, background: "var(--color-primary, #8C3130)", color: "#fff", borderRadius: 10, padding: "0 6px" }}>{bookmarkCount}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
