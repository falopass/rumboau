import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Rumbo AU, ir al tablero">
      <Image
        className="brand-mark"
        src="/visuals/logo-mark.svg"
        alt=""
        aria-hidden="true"
        width={40}
        height={40}
      />
      <span className="brand-name">
        Rumbo<span>·AU</span>
      </span>
    </Link>
  );
}
