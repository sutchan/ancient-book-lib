// app/feedback/page.tsx v1.4.3
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "反馈渠道｜古籍通 AncientBook",
  description: "古籍通 AncientBook 反馈渠道：内容勘误、功能建议与问题反馈方式，欢迎社区共建。",
};

export default function FeedbackPage() {
  return (
    <section id="feedback-page">
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>反馈渠道</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>反馈渠道</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 15 }}>
        古籍通是公益开源项目，由社区共建。欢迎你通过以下方式提交勘误、建议与问题。
      </p>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">GitHub Issues（主渠道）</h3>
        <p>
          提交内容勘误（原文、繁简映射、人物考据）、功能建议或使用问题，请使用仓库的 Issue 模板：
          <Link href="https://github.com/sutchan/ancient-book-lib/issues" target="_blank" rel="noopener noreferrer">
            github.com/sutchan/ancient-book-lib/issues
          </Link>
          。勘误请务必<strong>附史料来源</strong>，便于核实与修正。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15, marginBottom: 16 }}>
        <h3 className="section-title">反馈范围</h3>
        <p>
          我们关注：① 古籍原文 / 繁简映射 / 人物考据的错漏；② 检索、阅读、下载等功能异常；③ 产品与内容改进建议。一般性咨询可在 Issue 中提出。
        </p>
      </div>

      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <h3 className="section-title">说明</h3>
        <p>
          作为公益开源项目，我们暂无专职客服，但会定期审阅 Issue 并逐步改进。你的每一条反馈都是项目成长的动力，感谢参与共建。
        </p>
      </div>
    </section>
  );
}
