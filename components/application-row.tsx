import Link from "next/link";
import { formatDate, daysSince } from "@/lib/domain/format";
import type { PublicApplication } from "@/lib/domain/types";
import { StatusBadge } from "./status-badge";

export function ApplicationRow({ application }: { application: PublicApplication }) {
  const sent = application.documents.filter((document) => document.state === "sent").length;
  return (
    <Link className="ledger-row" href={`/postulaciones/${application.publicId}`}>
      <span className="ledger-date">
        {formatDate(application.applicationDate).replaceAll("-", "/")}
      </span>
      <span>
        <span className="ledger-name">{application.displayName}</span>
        <span className="ledger-sub">
          {application.originCountry} · intento {application.attemptNumber}
        </span>
        <span className="phone-line">
          {application.maskedPhone}
          {application.membershipVerified ? <span>Grupo verificado</span> : null}
        </span>
      </span>
      <StatusBadge status={application.status} />
      <span className="mini-list">
        {application.banks.length ? (
          application.banks.slice(0, 2).map((bank) => <span key={bank}>{bank}</span>)
        ) : (
          <span>Sin banco declarado</span>
        )}
        <span>{sent} doc. enviados</span>
      </span>
      <span className="ledger-sub">{daysSince(application.applicationDate)} días</span>
      <span className="row-arrow" aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
