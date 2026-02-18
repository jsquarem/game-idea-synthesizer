import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-9 w-28" />
        </CardHeader>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-xl">
            <CardContent className="flex flex-col gap-2 p-6">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="rounded-xl">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-9 flex-1 min-w-[200px]" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i}>
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Skeleton className="h-8 w-14" />
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-14" />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
