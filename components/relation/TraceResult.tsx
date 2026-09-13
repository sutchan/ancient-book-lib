// components/relation/TraceResult.tsx v1.15.8
"use client";

/** 双人溯源结果：关系路径（A —rel— B —rel— C…）与提示文案，从 RelationClient.tsx 拆出 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadRelNames } from "@/lib/cbdb";
import type { RelationPathStep } from "@/lib/cbdb";

export function PathNode({ id }: { id: number }) {
  const [name, setName] = useState("");
  useEffect(() => {
    loadRelNames().then((m) => setName(m.get(id) || `人物 ${id}`)).catch(() => setName(`人物 ${id}`));
  }, [id]);
  return (
    <Link href={`/people/detail?id=${id}`} style={{ fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
      {name}
    </Link>
  );
}

export function TracePathCard({ path }: { path: RelationPathStep[] }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }} id="relation-trace-path">
      <h4 style={{ margin: "0 0 12px" }}>关系路径</h4>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 14 }}>
        <PathNode id={path[0].from} />
        {path.map((step, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "var(--color-primary)", fontSize: 13 }}>— {step.rel} —</span>
            <PathNode id={step.to} />
          </span>
        ))}
      </div>
    </div>
  );
}
