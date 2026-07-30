import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdmin } from "@/lib/security/admin-session";
import { isDemoMode } from "@/lib/data/repository";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/data/demo-repository";

export const metadata: Metadata = { title: "Acceso administrativo" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="page-width page-content">
      <div className="page-heading">
        <p className="eyebrow">Moderación y soporte</p>
        <h1>Panel administrativo</h1>
        <p>El rol se valida en servidor; ocultar controles no sustituye autorización.</p>
      </div>
      <div className="form-layout">
        <AdminLoginForm
          demoCredentials={
            isDemoMode()
              ? { email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD }
              : undefined
          }
        />
        <aside className="side-note">
          <h2>Acciones auditadas</h2>
          <p>Visibilidad, recuperación, moderación y notas internas quedan asociadas a la cuenta administradora.</p>
        </aside>
      </div>
    </div>
  );
}

