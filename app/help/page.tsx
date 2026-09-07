import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "帮助与说明｜古籍通 AncientBook",
  description: "古籍通帮助中心：平台架构、数据管理方案、使用指南、开源协议与FAQ。",
};

export default function HelpPage() {
  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>帮助与说明</span>
      </div>
      <h2 style={{ marginBottom: 24 }}>帮助与说明</h2>

      <h3 className="section-title">平台架构</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p><strong>纯静态无数据库：</strong>本站采用 Next.js 全静态生成（SSG）+ 前端内存检索架构，不依赖任何服务端数据库。</p>
        <p><strong>数据管理：</strong>5GB 古籍全文以 TXT 分片托管于 GitHub 仓库（LFS 大文件存储），正文内容按字节范围（HTTP Range）分片懒加载，首屏仅拉取 2–4KB 分片。</p>
        <p><strong>索引策略：</strong>构建期由 <code style={{ background: "var(--color-highlight)", padding: "1px 6px", borderRadius: 4 }}>scripts/build-index.mjs</code> 预构建目录索引（书名、章节、人物、朝代、馆藏），前端内存检索毫秒级返回；全文检索按需分片拉取后局部匹配。</p>
      </div>

      <h3 className="section-title">数据管理方案（PRD 决议）</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>存储选型：</strong>原始 TXT 压缩后约 2.5–3.5GB（中文文本压缩率高），存入传统数据库（MySQL 等）会因索引与行开销膨胀至原始体积 1.2–2 倍，故采用「Git LFS 原文件 + 静态索引」方案。</li>
          <li><strong>检索：</strong>不使用数据库的替代方案为「构建期预索引 + 前端内存检索 + HTTP Range 分片」三层组合，满足 GitHub 托管与毫秒级体验。</li>
          <li><strong>索引覆盖：</strong>本站可对 GitHub 仓库内 TXT 建立索引（需要仓库启用 LFS 与 RAW 直链），PRD 已给出 Range 分片验证路径。</li>
        </ul>
      </div>

      <h3 className="section-title">使用指南</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <ul style={{ paddingLeft: 20 }}>
          <li><strong>检索：</strong>支持标题/全文双模式，命中片段高亮，可按馆藏与朝代筛选。</li>
          <li><strong>阅读：</strong>支持繁简切换（古籍保真）、字号行距调节、章节切换、生僻字点击释义、原书影像对照。</li>
          <li><strong>考据：</strong>人物档案与史料出处聚合，双人关系溯源支持直接与一度间接关系。</li>
          <li><strong>主题：</strong>日间 / 护眼（纸感）/ 深色三套主题，右上角一键切换，选择自动保存。</li>
        </ul>
      </div>

      <h3 className="section-title">开源与协议</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p>本项目以开源形式发布，代码遵循 MIT 协议。古籍原文为公有领域（Public Domain）资源，整理文本遵循原数据源授权协议。数据仅供学术研究与个人学习使用，商用需自行核实版权状态。</p>
        <p><strong>访问统计说明：</strong>本站使用 Google Analytics 4 进行匿名访问统计（页面浏览量、来源、设备类型），已开启 IP 匿名化，不采集姓名、账号、联系方式等个人身份信息。您在浏览器隐私设置中屏蔽第三方 Cookie 即可停止统计。</p>
      </div>

      <h3 className="section-title">常见问题 FAQ</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p><strong>Q：为什么不用数据库？</strong></p>
        <p>A：5GB TXT 入库会膨胀且需付费托管；GitHub Pages / 静态托管免费承载本项目，前端内存检索已满足目录级毫秒检索。</p>
        <p><strong>Q：数据库体积会膨胀还是压缩？</strong></p>
        <p>A：相对原始 TXT，数据库通常膨胀 1.2–2 倍（行存储 + 索引 + 冗余）；若只存正文不建索引则与原文接近，但检索需全表扫描。本项目选择不建库。</p>
        <p><strong>Q：如何贡献古籍校对？</strong></p>
        <p>A：提交 PR 至仓库 docs/校对区，经人工复核后并入整理文本；全文分片贡献走 LFS 提交流程。</p>
      </div>
    </section>
  );
}
