import Link from 'next/link'
import { listBrainstorms } from '@/lib/services/brainstorm.service'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'

export default async function BrainstormsListPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const result = await listBrainstorms(projectId, { pageSize: 50 })
  if (!result.success) notFound()
  const { data } = result.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brainstorms"
        actions={
          <Button asChild>
            <Link href={`/projects/${projectId}/brainstorms/new`}>New Session</Link>
          </Button>
        }
      />

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground">No brainstorm sessions yet.</p>
          <Button className="mt-4" asChild>
            <Link href={`/projects/${projectId}/brainstorms/new`}>
              Create your first session
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((session) => (
            <li key={session.id}>
              <Link href={`/projects/${projectId}/brainstorms/${session.id}`}>
                <Card className="transition-shadow duration-150 hover:shadow-md">
                  <CardContent>
                    <h2 className="font-semibold">{session.title}</h2>
                    {session.author && (
                      <p className="mt-1 text-sm text-muted-foreground">by {session.author}</p>
                    )}
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {session.content.slice(0, 120)}
                      {session.content.length > 120 ? '\u2026' : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{session.source}</Badge>
                      {session.tags && (
                        <>
                          {(JSON.parse(session.tags) as string[]).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
