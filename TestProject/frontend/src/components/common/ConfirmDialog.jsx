import { useEffect, useRef } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

/**
 * Reusable confirmation dialog.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *     title="Delete task?"
 *     description="This cannot be undone."
 *     confirmLabel="Delete"
 *     variant="destructive"   // "destructive" | "default"
 *   />
 */
export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
}) {
  const confirmRef = useRef(null)

  // Focus confirm button on open, handle Escape
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => confirmRef.current?.focus(), 50)
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handler) }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon + title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
            variant === 'destructive' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted'
          )}>
            {variant === 'destructive'
              ? <Trash2 className="h-5 w-5 text-red-500" />
              : <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            size="sm"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
            className="gap-1.5 min-w-[80px]"
          >
            {loading && <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
