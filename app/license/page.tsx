import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "开源协议｜古籍通 AncientBook",
  description: "古籍通 AncientBook 开源协议说明：项目代码 MIT 协议、古籍原文公有领域与上游授权、非商用公益定位。",
};

export default function LicensePage() {
  return (
    <section id="license-page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>开源协议</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>开源协议</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 15 }}>
        古籍通 AncientBook 是公益免费、开源共享、非商用的传统文化传播工具。下方说明项目代码、古籍资源与学术数据的授权方式。
      </p>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">项目代码</h3>
        <p>
          本项目源代码以 <strong>MIT 协议</strong> 开源（详见仓库根目录{" "}
          <code style={{ background: "var(--color-highlight)", padding: "1px 6px", borderRadius: 4 }}>
            LICENSE
          </code>{" "}
          文件），允许在遵守协议的前提下自由使用、修改与再分发。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">古籍原文</h3>
        <p>
          古籍原文属公有领域资源，整理文本遵循上游数据源授权协议（殆知阁开源古籍资源）。本站资源<strong>仅供学术研究与个人学习</strong>
          ，禁止商用、二次售卖或篡改后伪造成原创资料库；商用或二次分发需自行核实版权状态并获授权。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">学术数据（人物考据）</h3>
        <p>
          人物考据数据来自哈佛 CBDB 等公开学术数据集，遵循其 <strong>CC BY-NC-SA 4.0</strong> 授权，使用时须署名并标注非商用。所有人物数据均标注史料来源，可溯源、不杜撰。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <h3 className="section-title">非商用定位</h3>
        <p>
          全站无广告、无弹窗、无付费功能、无商业变现模块；全功能零注册、零登录、零门槛开放。详见{" "}
          <Link href="/disclaimer">免责声明</Link> 与 <Link href="/data-source">数据来源</Link>。
        </p>
      </div>
    </section>
  );
}
