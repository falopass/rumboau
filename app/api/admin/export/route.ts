import { getAdmin } from "@/lib/security/admin-session";
import { getRepository } from "@/lib/data/repository";
import { toCsv } from "@/lib/domain/format";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) {
    return new Response("Acceso denegado", { status: 403 });
  }
  const rows = await getRepository().exportPublicRows();
  const csv = `\uFEFF${toCsv(rows)}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rumbo-au-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

