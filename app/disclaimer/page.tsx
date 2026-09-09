// app/disclaimer/page.tsx v1.4.3
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "免责声明｜古籍通 AncientBook",
  description: "古籍通 AncientBook 免责声明：资源仅供学术研究与个人学习、非商用，内容仅供参考不构成专业意见。",
};

export default function DisclaimerPage() {
  return (
    <section id="disclaimer-page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>免责声明</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>免责声明</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 15 }}>
        请在使用本站前阅读以下声明。使用本平台即表示你理解并同意下述条款。
      </p>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">非商用</h3>
        <p>
          本站所有古籍与学术资源源自开源/公开仓库，<strong>仅供学术研究与传统文化传播</strong>。禁止商用、二次售卖、禁止篡改后伪造成原创资料库。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">内容仅供参考</h3>
        <p>
          平台提供的内容（含古籍文本、人物考据、检索结果）仅供参考学习，<strong>不构成任何专业学术结论或法律意见</strong>。考据数据虽尽力溯源，仍可能存在疏漏，引用时请核对原始史料。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">版权与责任</h3>
        <p>古籍原文版权归上游数据源所有，整理文本遵循其授权协议。用户使用平台资源产生的任何学术引用、商业行为，由使用者自行承担责任。</p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <h3 className="section-title">下载附言</h3>
        <p>
          本站提供的单本下载与书单导出均附「仅供学术研究与个人学习、禁止商用」声明。更多授权细节见 <Link href="/license">开源协议</Link>
          ，数据溯源见 <Link href="/data-source">数据来源</Link>。
        </p>
      </div>
    </section>
  );
}
