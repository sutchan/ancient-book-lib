// app/character/page.tsx v1.14.0
// 「人物考据」已并入人物库（CBDB 全量 661,350 位）。本路由改为引导页：
// 说明合并去向，并提供 28 位精选人物的直达链接（仍指向人物库详情页，单一数据源）。
import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "人物考据已并入人物库｜古籍通 AncientBook",
  description:
    "人物考据功能已统一接入 CBDB 全量人物索引（661,350 位历代人物），可在此进入人物库浏览、检索并查看考据详情。",
};

interface LegacyChar {
  id: string;
  name: string;
  zi?: string;
  dynasty?: string;
}

function loadFeatured(): LegacyChar[] {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public/index/characters.json"),
      "utf8"
    );
    return JSON.parse(raw) as LegacyChar[];
  } catch {
    return [];
  }
}

export default function CharacterPage() {
  const featured = loadFeatured();
  return (
    <section id="character-page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>人物考据</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>人物考据已并入人物库</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 15 }}>
        本站的人物考据能力现已统一接入 CBDB 全量人物索引（661,350 位历代人物）。姓名/别名检索、重名消歧、生卒与任职校验、亲属社会关系与馆藏典籍联动，均可在「人物库」中完成。点击下方进入人物库。
      </p>
      <div style={{ marginBottom: 28 }}>
        <Link href="/people" className="btn btn-primary">
          进入人物库（661,350 人）
        </Link>
      </div>

      {featured.length > 0 && (
        <>
          <h3 className="section-title">精选人物</h3>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 12 }}>
            28 位历史名人精选档案，点击直达其考据详情。
          </p>
          <div className="character-grid">
            {featured.map((c) => {
              const pid = c.id.replace(/^cbdb-/, "");
              return (
                <Link
                  key={c.id}
                  href={`/people/detail?id=${pid}`}
                  className="character-card"
                >
                  <div className="char-name">
                    <span>{c.name}</span>
                    {c.zi && <span className="char-zi">字 {c.zi}</span>}
                    {c.dynasty && <span className="char-zi">{c.dynasty}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
