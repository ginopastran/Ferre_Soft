import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function BranchTableSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-6 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-full max-w-[200px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-full max-w-[300px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
