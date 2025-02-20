import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="grid gap-4">
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
