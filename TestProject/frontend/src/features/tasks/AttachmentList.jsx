import { useState, useEffect, useRef } from 'react'
import * as tasksApi from '../../api/tasks'
import { Paperclip, Download, Trash2, Upload, FileText, File, X, ChevronLeft, ChevronRight, ZoomIn, ExternalLink } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import toast from 'react-hot-toast'

function isImage(mimetype) {
  return mimetype?.startsWith('image/')
}

function fileIcon(mimetype) {
  if (!mimetype) return File
  if (mimetype === 'application/pdf') return FileText
  return File
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Lightbox ──────────────────────────────────
function Lightbox({ attachments, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const att = attachments[idx]

  useEffect(() => {
    let url
    setLoading(true)
    setBlobUrl(null)
    tasksApi.fetchAttachmentBlobUrl(att._id)
      .then(u => { url = u; setBlobUrl(u) })
      .catch(() => toast.error('Could not load image'))
      .finally(() => setLoading(false))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [att._id])

  // keyboard nav
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx(i => Math.min(attachments.length - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [attachments.length, onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-1.5"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {idx > 0 && (
        <button
          className="absolute left-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2"
          onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Image */}
      <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-3" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="h-64 w-64 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
        ) : blobUrl ? (
          <img
            src={blobUrl}
            alt={att.originalName}
            className="max-w-[90vw] max-h-[75vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="text-white/60 text-sm">Failed to load image</div>
        )}

        {/* Caption + download */}
        <div className="flex items-center gap-3 text-white/80 text-[13px] font-medium mt-2">
          <span className="truncate max-w-[300px]">{att.originalName}</span>
          <span className="text-white/40">·</span>
          <span>{formatSize(att.size)}</span>
          <a href={blobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10" title="Open in new tab">
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
          <button
            className="flex items-center gap-1.5 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
            onClick={() => tasksApi.downloadAttachmentAuth(att._id, att.originalName).catch(() => toast.error('Download failed'))}
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        </div>

        {/* Thumbnail strip */}
        {attachments.length > 1 && (
          <div className="flex gap-2">
            {attachments.map((a, i) => (
              <button
                key={a._id}
                onClick={() => setIdx(i)}
                className={cn(
                  'h-10 w-10 rounded border-2 overflow-hidden transition-all',
                  i === idx ? 'border-white' : 'border-white/30 opacity-60 hover:opacity-100'
                )}
              >
                <ImageThumb attachment={a} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Next */}
      {idx < attachments.length - 1 && (
        <button
          className="absolute right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2"
          onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

// Small thumbnail that loads its own blob URL
function ImageThumb({ attachment, onClick, className }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let blobUrl
    tasksApi.fetchAttachmentBlobUrl(attachment._id)
      .then(u => { blobUrl = u; setUrl(u) })
      .catch(() => {})
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [attachment._id])

  if (!url) {
    return (
      <div className={cn('bg-muted flex items-center justify-center h-full w-full', className)}>
        <div className="h-3 w-3 rounded-full border border-muted-foreground border-t-transparent animate-spin" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={attachment.originalName}
      className={cn('h-full w-full object-cover', className)}
      onClick={onClick}
    />
  )
}

// ── Main component ────────────────────────────
export default function AttachmentList({ taskId, isViewer }) {
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const [confirmDeleteAtt, setConfirmDeleteAtt] = useState(null) // { id, name }
  const inputRef = useRef(null)

  useEffect(() => {
    if (!taskId) return
    tasksApi.getAttachments(taskId)
      .then(({ data }) => setAttachments(data.attachments || []))
      .catch(() => {})
  }, [taskId])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const { data } = await tasksApi.uploadAttachment(taskId, formData)
      setAttachments(a => [...a, data.attachment])
      toast.success(`"${file.name}" uploaded`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id, name) => {
    try {
      await tasksApi.deleteAttachment(id)
      setAttachments(a => a.filter(att => att._id !== id))
      setConfirmDeleteAtt(null)
      toast.success('Attachment deleted')
    } catch {
      toast.error('Failed to delete attachment')
    }
  }

  const canUpload = !isViewer && attachments.length < 5
  const images = attachments.filter(a => isImage(a.mimetype))
  const files  = attachments.filter(a => !isImage(a.mimetype))

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" />
            Attachments
            <span className="text-muted-foreground font-normal">({attachments.length}/5)</span>
          </p>
          {canUpload && (
            <>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.docx,.xlsx,.zip"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                {uploading ? 'Uploading…' : 'Upload file'}
              </Button>
            </>
          )}
        </div>

        {attachments.length === 0 ? (
          <div
            className={cn(
              'border-2 border-dashed border-border rounded-lg p-4 text-center',
              canUpload && 'cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors'
            )}
            onClick={() => canUpload && inputRef.current?.click()}
          >
            <Paperclip className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">
              {canUpload ? 'Click to upload or drag a file here' : 'No attachments'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              JPG, PNG, PDF, DOCX, XLSX, ZIP · max 10 MB
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* ── Image grid ── */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {images.map((att, i) => (
                  <div key={att._id} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-muted">
                    <ImageThumb
                      attachment={att}
                      className="cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setLightboxIdx(images.indexOf(att))}
                    />
                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center cursor-pointer"
                      onClick={() => setLightboxIdx(images.indexOf(att))}
                    >
                      <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Delete button */}
                    {!isViewer && (
                      <button
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                        onClick={e => { e.stopPropagation(); setConfirmDeleteAtt({ id: att._id, name: att.originalName }) }}
                        title="Delete"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── File list (non-images) ── */}
            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map(att => {
                  const Icon = fileIcon(att.mimetype)
                  return (
                    <div
                      key={att._id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted/20 group hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={async () => {
                        try {
                          const url = await tasksApi.fetchAttachmentBlobUrl(att._id)
                          window.open(url, '_blank')
                        } catch { toast.error('Preview failed') }
                      }}
                      title="Click to preview file"
                    >
                      <div className="h-8 w-8 rounded-md bg-background border border-border flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{att.originalName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatSize(att.size)}
                          {att.uploadedBy?.displayName && ` · ${att.uploadedBy.displayName}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Download"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            tasksApi.downloadAttachmentAuth(att._id, att.originalName).catch(() => toast.error('Download failed'))
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        {!isViewer && (
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteAtt({ id: att._id, name: att.originalName }) }}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add more */}
            {canUpload && (
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-muted/20 transition-colors"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3 w-3" />
                {uploading ? 'Uploading…' : 'Add another file'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox portal */}
      {lightboxIdx !== null && (
        <Lightbox
          attachments={images}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmDeleteAtt}
        onConfirm={() => handleDelete(confirmDeleteAtt.id, confirmDeleteAtt.name)}
        onCancel={() => setConfirmDeleteAtt(null)}
        title={`Delete "${confirmDeleteAtt?.name}"?`}
        description="This attachment will be permanently removed."
        confirmLabel="Delete"
      />
    </>
  )
}
