// app/character/page.tsx v1.13.2
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CharacterDossier from "@/components/CharacterDossier";

export const metadata: Metadata = {
  title: "人物考据｜古籍通 AncientBook",
  description:
    "古籍通人物考据工作台：直连 CBDB 全量 661,350 位人物索引，支持姓名/字号检索、重名候选消歧（按朝代、活動時段、籍贯区分）、生卒与任职的数据校验提示、完整度评分，以及亲属社会关系与馆藏典籍的联动跳转。数据来源 CBDB（CC BY-NC-SA 4.0）。",
};

export default function CharacterPage() {
  return (
    <section id="character-page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>人物考据</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>人物考据工作台</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        输入姓名或字号即可检索 CBDB 全量人物；命中多位同名人物时，系统会按朝代、活動時段、籍贯给出区分线索，
        选定后生成单份考据档案——含生卒、科举入仕、任职、著作、亲属与社会关系，并附带数据冲突校验提示与完整度评分，
        可直接跳转到馆藏典籍与关系溯源。数据来源 CBDB（CC BY-NC-SA 4.0）。
      </p>
      {/* CharacterDossier 使用 useSearchParams 还原分享链接；静态导出（output: "export"）
          下必须包 Suspense，否则构建会退化整页为客户端渲染并丢失预渲染内容。 */}
      <Suspense
        fallback={
          <div style={{ padding: 60, textAlign: "center", color: "var(--color-text-secondary)" }}>
            正在加载考据工作台…
          </div>
        }
      >
        <CharacterDossier />
      </Suspense>
    </section>
  );
}
