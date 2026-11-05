"use client";
import { use } from "react";
import Link from "next/link";
import { AreaDetail } from "@/components/AreaDetail";
import { PageTitle, Panel } from "@/components/ui";
import { areaById } from "@/lib/data/areas";

export default function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const area = areaById(id);
  if (!area) return <p className="text-ash-400">Бүс олдсонгүй.</p>;
  return (
    <>
      <PageTitle title="Area Guide" sub="Бүсийн дэлгэрэнгүй" />
      <Panel><AreaDetail area={area} /></Panel>
      <Link href={`/map?focus=${area.id}`} className="btn mt-4">Газрын зураг дээр</Link>
    </>
  );
}
