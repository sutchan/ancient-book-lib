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
        本站采用「零复制」架构：仅存储书目索引，古籍原文与考据数据阅读时按需从上游权威源加载。各数据源均可溯源。
      </p>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">古籍书目与原文（殆知阁 v20）</h3>
        <p>
          全馆藏 15,694 部古籍书目与原文来自开源仓库{" "}
          <code style={{ background: "var(--color-highlight)", padding: "1px 6px", borderRadius: 4 }}>
            garychowcmu/daizhigev20
          </code>
          （殆知阁 v20，原始数据约 4.9 GB）。本仓库不复制原文，阅读时按字节区间（HTTP Range）向上游按需拉取，保障原文保真。
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
        <h3 className="section-title">人物库（CBDB 全量）</h3>
        <p>
          人物库 <Link href="/people">661,350 位历代人物</Link>（姓名、拼音、生卒年、指数年、性别、朝代、籍贯）来自
          CBDB 官方 SQLite 数据包（<code>cbdb-project/cbdb_sqlite</code>，2026-09-05 版，SHA-256{" "}
          <code style={{ fontSize: 13, wordBreak: "break-all" }}>437a253a8e49cb24d2d5209234781d03fcbcc04476aafc3cf9d68453cea7e980</code>），
          遵循 CBDB 授权条款。本地仅保存 49.8MB 提取索引（按姓氏分片），新增版本可经 GitHub Actions 手动重建。
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
