import type { Metadata } from "next";
import Link from "next/link";
import CharacterList from "@/components/CharacterList";

export const metadata: Metadata = {
  title: "人物考据｜古籍通 AncientBook",
  description: "古籍通历史人物考据档案：字、号、籍贯、生卒、官职、著作与史料出处，支持重名人物多维区分与典籍记载聚合。",
};

export default function CharacterPage() {
  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>人物考据</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>人物考据档案</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24 }}>
        人物考据与关系溯源数据待接入——将随 CBDB 等权威元数据导入后开放，支持重名人物按朝代+籍贯+官职多维区分与关联典籍聚合。
      </p>
      <CharacterList />
    </section>
  );
}
