import { LogPanelHeader } from './LogPanelHeader'
import { LogList } from './LogList'
import { useLogStore } from '@/stores/logStore'
import { useClientStore } from '@/stores/clientStore'

export function LogPanel(): React.ReactElement {
  const { getFilteredEntries } = useLogStore()
  const { selectedClientId } = useClientStore()
  const entries = getFilteredEntries()

  const title = selectedClientId ? 'LOG PANEL' : 'ALL AGENTS LOG'

  return (
    <div className="flex flex-col h-full bg-background">
      <LogPanelHeader title={title} entryCount={entries.length} />
      <LogList entries={entries} />
    </div>
  )
}
