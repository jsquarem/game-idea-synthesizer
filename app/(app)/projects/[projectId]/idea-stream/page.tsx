import { IdeaStreamContent } from './idea-stream-content'

export default async function IdeaStreamPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  return (
    <div
      className="-my-6 flex flex-col"
      style={{
        /*
         * Break out of the max-w-6xl mx-auto parent container.
         * The scrollable ancestor has container-type: inline-size,
         * so 100cqi = full width of the scrollable area (everything
         * to the right of the project sidebar).
         */
        width: '100cqi',
        maxWidth: 'none',
        marginLeft: 'calc(-50cqi + 50%)',
        height: 'calc(100vh - 3.5rem)',
      }}
    >
      <IdeaStreamContent projectId={projectId} />
    </div>
  )
}
