"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toSimplified } from "@/lib/t2s";

interface NavbarProps {
  current?: string;
  basePath?: string;
}

const MENU: { key: string; href: string; label: string }[] = [
  { key: "home", href: "/", label: "首页" },
  { key: "category", href: "/category", label: "十大藏库" },
  { key: "book-list", href: "/book-list", label: "馆藏书籍" },
  { key: "search", href: "/search", label: "检索" },
  { key: "character", href: "/character", label: "人物考据" },
  { key: "relation", href: "/relation", label: "社会关系" },
  { key: "stats", href: "/stats", label: "数据统计" },
  { key: "help", href: "/help", label: "帮助" },
];

export default function Navbar({ current = "home" }: NavbarProps) {
  const [theme, setTheme] = useState<"light" | "paper" | "dark">("light");
  const [simplified, setSimplified] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initialRef = useRef(false);

  useEffect(() => {
    if (initialRef.current) return;
    initialRef.current = true;
    const savedTheme = (localStorage.getItem("ab-theme") as "light" | "paper" | "dark") || "light";
    const savedSimple = localStorage.getItem("ab-simple") === "1";
    setTheme(savedTheme);
    setSimplified(savedSimple);
    document.body.dataset.theme = savedTheme;
  }, []);

  const applyTheme = useCallback((t: "light" | "paper" | "dark") => {
    setTheme(t);
    document.body.dataset.theme = t;
    localStorage.setItem("ab-theme", t);
  }, []);

  const toggleTheme = () => applyTheme(theme === "light" ? "paper" : theme === "paper" ? "dark" : "light");

  const toggleSimplified = () => {
    const next = !simplified;
    setSimplified(next);
    localStorage.setItem("ab-simple", next ? "1" : "0");
  };

  const themeLabel = theme === "light" ? "日间" : theme === "paper" ? "护眼" : "深色";

  return (
    <>
      <header className="navbar">
        <div className="nav-inner">
          <a className="brand" href="/">
            <img
              className="brand-logo"
              src="/images/logo.png"
              alt="古籍通 AncientBook"
            />
          </a>
          <nav className="nav-menu">
            {MENU.map((m) => (
              <a key={m.key} href={m.href} className={current === m.key ? "active" : ""}>
                {simplified ? toSimplified(m.label) : m.label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="btn-toggle" onClick={toggleSimplified} aria-label="繁简切换">
              {simplified ? "繁體" : "简体"}
            </button>
            <button className="btn-toggle" onClick={toggleTheme} aria-label="主题切换">
              {themeLabel}
            </button>
          </div>
          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="菜单">
            ☰
          </button>
        </div>
      </header>
      <nav className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {MENU.map((m) => (
          <a key={m.key} href={m.href} className={current === m.key ? "active" : ""} onClick={() => setMenuOpen(false)}>
            {simplified ? toSimplified(m.label) : m.label}
          </a>
        ))}
      </nav>
    </>
  );
}
