import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function SellerTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-6 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-[200px] rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
