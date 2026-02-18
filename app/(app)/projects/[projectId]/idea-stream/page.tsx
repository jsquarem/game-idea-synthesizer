import { IdeaStreamContent } from './idea-stream-content'

export default async function IdeaStreamPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <IdeaStreamContent projectId={projectId} />
    </div>
  )
}
