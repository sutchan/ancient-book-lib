// app/data-source/page.tsx v1.4.3
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "数据来源｜古籍通 AncientBook",
  description: "古籍通数据来源：殆知阁 v20 全量古籍书目原文、哈佛 CBDB 人物考据等权威数据源与溯源说明。",
};

export default function DataSourcePage() {
  return (
    <section id="data-source-page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>数据来源</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>数据来源</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 15 }}>
        本站古籍原文与考据数据均来自下列权威数据源，阅读时按需加载，各数据源均可溯源。
      </p>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">古籍书目与原文（殆知阁 v20）</h3>
        <p>
          全馆藏 15,694 部古籍书目与原文来自殆知阁 v20（原始数据约 4.9 GB），阅读时按需拉取，保障原文保真。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">人物考据（哈佛 CBDB）</h3>
        <p>
          人物考据档案（姓名、字、号、籍贯、生卒、官职、著作）来自哈佛 CBDB（Chinese Biographical Database），遵循{" "}
          <strong>CC BY-NC-SA 4.0</strong> 授权，使用时须署名。已导入 28 位历史名人考据，详见{" "}
          <Link href="/character">人物考据</Link>。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">人物库与关系网络（CBDB 全量）</h3>
        <p>
          人物库 <Link href="/people">661,350 位历代人物</Link>（姓名、拼音、生卒年、指数年、性别、朝代、籍贯）来自
          CBDB 官方数据包（2026-09-05 版），
          遵循 CBDB 授权条款。          关系网络（亲属 56.1 万条、社会关系 19 万条、人物-著作 5.1 万条，覆盖 31.1 万人）、生平任职（59.1 万条、11,291 种官职）、籍贯分布与官职-朝代联动、字/號/別名（163,634 条）、科舉/入仕（26.5 万条）、史料來源（50.5 万条）与人物时间分布（30.8 万有效指数年）等维度，均由 CBDB 提供并经提取索引后随站加载，可溯源、不臆断。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">学术数据集</h3>
        <p>学术人物与关系数据同时参考中研院史语所、北京大学等公开学术数据集规范，确保史料严谨、可溯源、不臆断。</p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <h3 className="section-title">合规说明</h3>
        <p>
          所有数据遵循上游开源与学术协议，仅供学术研究与文化传播。更多授权细节见 <Link href="/license">开源协议</Link> 与{" "}
          <Link href="/disclaimer">免责声明</Link>。
        </p>
      </div>
    </section>
  );
}
