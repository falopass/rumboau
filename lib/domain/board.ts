import { normalizeName } from "./format";
import type {
  BoardSortKey,
  PublicApplication,
  SortDirection,
} from "./types";

export type PaginationItem = number | "ellipsis";

const collator = new Intl.Collator("es-CL", {
  numeric: true,
  sensitivity: "base",
});

function sentDocumentCount(application: PublicApplication): number {
  return application.documents.filter((document) => document.state === "sent").length;
}

function compareBy(
  left: PublicApplication,
  right: PublicApplication,
  sort: BoardSortKey,
): number {
  switch (sort) {
    case "person":
      return collator.compare(normalizeName(left.displayName), normalizeName(right.displayName));
    case "status":
      return collator.compare(left.status.label, right.status.label);
    case "documents":
      return sentDocumentCount(left) - sentDocumentCount(right);
    case "wait":
      // Una fecha más reciente equivale a menos días de espera.
      return right.applicationDate.localeCompare(left.applicationDate);
    case "date":
    default:
      return left.applicationDate.localeCompare(right.applicationDate);
  }
}

export function sortBoardApplications<T extends PublicApplication>(
  applications: T[],
  sort: BoardSortKey,
  direction: SortDirection,
): T[] {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...applications].sort((left, right) => {
    const primary = compareBy(left, right, sort) * multiplier;
    if (primary !== 0) return primary;

    const byDate = left.applicationDate.localeCompare(right.applicationDate);
    if (byDate !== 0) return byDate;
    return left.publicId.localeCompare(right.publicId);
  });
}

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}
