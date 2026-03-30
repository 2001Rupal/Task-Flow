import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Open command palette' },
  { keys: ['N'], label: 'New task (in project view)' },
  { keys: ['/'], label: 'Search' },
  { keys: ['?'], label: 'Show keyboard shortcuts' },
  { keys: ['Esc'], label: 'Close panel / modal' },
  { keys: ['I'], label: 'Go to Inbox' },
  { keys: ['Enter'], label: 'Confirm inline task creation' },
]

export default function ShortcutsModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-1">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className="flex items-center gap-1">
                {keys.map(k => (
                  <kbd key={k} className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
