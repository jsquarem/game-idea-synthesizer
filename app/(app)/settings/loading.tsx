import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full max-w-md" />
            <div className="flex flex-wrap gap-2 pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-9 w-16 mt-4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-16 mt-2" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="pb-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48 mt-1" />
            <Skeleton className="h-4 w-full max-w-md mt-4" />
          </div>
          <div className="border-t border-border pt-6">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full max-w-sm mt-2" />
            <Skeleton className="h-9 w-16 mt-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
