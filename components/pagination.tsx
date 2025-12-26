
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={!prevPage}
      >
        {prevPage ? (
          <Link href={`${baseUrl}?page=${prevPage}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span className="opacity-50 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
      </Button>

      <span className="text-sm font-medium">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={!nextPage}
      >
        {nextPage ? (
          <Link href={`${baseUrl}?page=${nextPage}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="opacity-50 cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
