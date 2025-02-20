import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientsGridSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="w-full">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-[180px]" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-4 w-4 mr-2" />
                  <Skeleton className="h-4 w-[220px]" />
                </div>
              </div>

              <Skeleton className="h-10 w-full mt-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
