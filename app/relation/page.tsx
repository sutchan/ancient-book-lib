import type { Metadata } from "next";
import RelationClient from "@/components/RelationClient";

export const metadata: Metadata = {
  title: "社会关系溯源｜古籍通 AncientBook",
  description: "古籍通人物社会关系网络：师生、君臣、思想传承等多维关系，支持双人关系溯源。",
};

export default function RelationPage() {
  return <RelationClient />;
}
