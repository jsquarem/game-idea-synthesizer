import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function IdeaStreamLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-[360px] min-w-[280px] shrink-0">
        <CardHeader>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-9 w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="min-w-0 flex-1">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
