import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function OrderTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell className="py-4">
            <Skeleton className="h-6 w-16" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-6 w-32" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-6 w-32" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-6 w-28" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell className="py-4">
            <Skeleton className="h-8 w-20 rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
