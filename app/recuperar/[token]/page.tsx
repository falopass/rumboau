import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="page-width page-content">
      <div className="page-heading">
        <p className="eyebrow">Recuperación administrada</p>
        <h1>Vuelve a entrar a tu registro</h1>
        <p>Este enlace vence en 24 horas y deja de funcionar después de usarlo.</p>
      </div>
      <div className="form-layout">
        <ResetPasswordForm token={token} />
        <aside className="side-note">
          <h2>Tu contraseña sigue siendo privada</h2>
          <p>La administración emitió el enlace, pero no puede ver la contraseña que definas.</p>
        </aside>
      </div>
    </div>
  );
}

