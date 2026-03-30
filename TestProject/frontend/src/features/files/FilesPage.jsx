import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../../api/axiosClient'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'
import { toast } from 'react-hot-toast'
import {
  FileText, Download, Image as ImageIcon,
  FileArchive, FileCode, Search, Grid, List as ListIcon,
  Trash2, MoreHorizontal, ExternalLink, FileVideo, FileAudio, 
  X, Maximize2, CheckSquare, Layers, Share2, Mail, Send
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from '../../components/ui/dropdown-menu'

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function getFileIcon(mimetype) {
  if (!mimetype) return FileText
  if (mimetype.startsWith('image/')) return ImageIcon
  if (mimetype.startsWith('video/')) return FileVideo
  if (mimetype.startsWith('audio/')) return FileAudio
  if (mimetype.includes('zip') || mimetype.includes('tar') || mimetype.includes('rar')) return FileArchive
  if (mimetype.includes('javascript') || mimetype.includes('json') || mimetype.includes('html')) return FileCode
  return FileText
}

function getFileColor(mimetype) {
  if (!mimetype) return 'text-slate-500 bg-slate-100 dark:bg-slate-800'
  if (mimetype.startsWith('image/')) return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
  if (mimetype.startsWith('video/')) return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
  if (mimetype.includes('pdf')) return 'text-red-500 bg-red-100 dark:bg-red-900/30'
  if (mimetype.includes('zip') || mimetype.includes('tar')) return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'text-green-500 bg-green-100 dark:bg-green-900/30'
  return 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
}

function getFileTextColor(mimetype) {
  if (!mimetype) return 'text-slate-500'
  if (mimetype.startsWith('image/')) return 'text-blue-500'
  if (mimetype.startsWith('video/')) return 'text-purple-500'
  if (mimetype.includes('pdf')) return 'text-red-500'
  if (mimetype.includes('zip') || mimetype.includes('tar')) return 'text-yellow-500'
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'text-green-500'
  return 'text-indigo-500'
}

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [filterType, setFilterType] = useState('all')
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState([])

  // Preview State
  const [previewFile, setPreviewFile] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [filesToShare, setFilesToShare] = useState([]) // Array of full file objects
  const [shareEmails, setShareEmails] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [sharing, setSharing] = useState(false)

  const { user } = useSelector(s => s.auth)

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const res = await api.get('/attachments/all')
      setFiles(res.data.attachments || [])
    } catch (err) {
      setError('Failed to load files.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  useEffect(() => {
    return () => {
      if (previewFile?.previewUrl && !previewFile.previewUrl.startsWith('http')) {
        URL.revokeObjectURL(previewFile.previewUrl)
      }
    }
  }, [previewFile])

  const handleDelete = async (id, e) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    if (!window.confirm('Are you sure you want to delete this file?')) return
    try {
      await api.delete(`/attachments/${id}`)
      setFiles(files.filter(f => f._id !== id))
      setSelectedIds(prev => prev.filter(sid => sid !== id))
      if (previewFile && previewFile._id === id) setPreviewFile(null)
      toast.success('File deleted')
    } catch (error) {
      toast.error('Failed to delete file.')
    }
  }

  const handleDownload = async (id, filename, e) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    toast.loading('Downloading...', { id: 'download' })
    try {
      const response = await api.get(`/attachments/${id}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      setTimeout(() => window.URL.revokeObjectURL(url), 100)
      toast.success('Download started', { id: 'download' })
    } catch (err) {
      toast.error('Failed to download file.', { id: 'download' })
    }
  }

  const handleView = async (file, e) => {
    if (e) { e.preventDefault(); e.stopPropagation() }

    // If we have Cloudinary URL
    if (file.url && !file.mimetype?.includes('zip')) {
      if (file.mimetype?.startsWith('image/')) {
        setPreviewFile({ ...file, previewUrl: file.url })
      } else {
        window.open(file.url, '_blank')
      }
      return
    }
    
    // For images on local disk (show in Lightbox)
    if (file.mimetype?.startsWith('image/')) {
      setLoadingPreview(true)
      try {
        const res = await api.get(`/attachments/${file._id}/download`, { responseType: 'blob' })
        const previewUrl = window.URL.createObjectURL(new Blob([res.data], { type: file.mimetype }))
        setPreviewFile({ ...file, previewUrl })
      } catch (err) {
        toast.error('Could not load image preview.')
      } finally {
        setLoadingPreview(false)
      }
      return
    }

    // For PDFs, text, json, etc. on local disk (Open in new tab instead of automatic download)
    const viewableTypes = ['pdf', 'text', 'json', 'javascript', 'html'];
    const isViewable = viewableTypes.some(t => file.mimetype?.includes(t));

    if (isViewable) {
      toast.loading('Opening...', { id: 'view' })
      try {
        const res = await api.get(`/attachments/${file._id}/download`, { responseType: 'blob' })
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: file.mimetype || 'application/pdf' }))
        window.open(blobUrl, '_blank')
        toast.dismiss('view')
        // Clean up URL after a minute so the browser tab has time to load it
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000)
      } catch (err) {
        toast.error('Could not open file.', { id: 'view' })
      }
      return;
    }

    // Default fallback: force download (like ZIPs, Excel, etc)
    handleDownload(file._id, file.originalName)
  }

  const toggleSelection = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const openShareModal = (fileOrFiles = null) => {
    if (Array.isArray(fileOrFiles)) {
      setFilesToShare(fileOrFiles)
    } else if (fileOrFiles) {
      setFilesToShare([fileOrFiles])
    } else {
      // Use selected from state
      setFilesToShare(files.filter(f => selectedIds.includes(f._id)))
    }
    setShareEmails('')
    setShareMessage('')
    setShareModalOpen(true)
  }

  const submitShare = async (e) => {
    e.preventDefault()
    if (!shareEmails) return toast.error("Please enter at least one email.")
    if (filesToShare.length === 0) return toast.error("No files selected to share.")

    const emailList = shareEmails.split(',').map(s => s.trim()).filter(Boolean)
    if (!emailList.length) return toast.error("Invalid email addresses.")

    setSharing(true)
    try {
      await api.post('/attachments/share-email', {
        attachmentIds: filesToShare.map(f => f._id),
        emails: emailList,
        message: shareMessage
      })
      toast.success(`Successfully shared ${filesToShare.length} file(s)!`)
      setShareModalOpen(false)
      setSelectedIds([]) // Clear selection after sharing
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send share emails.')
    } finally {
      setSharing(false)
    }
  }

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      if (search && !f.originalName.toLowerCase().includes(search.toLowerCase())) return false
      
      if (filterType === 'images' && !f.mimetype?.startsWith('image/')) return false
      if (filterType === 'documents' && (f.mimetype?.startsWith('image/') || f.mimetype?.startsWith('video/') || f.mimetype?.includes('zip'))) return false
      if (filterType === 'archives' && !f.mimetype?.includes('zip') && !f.mimetype?.includes('tar') && !f.mimetype?.includes('rar')) return false
      
      return true
    })
  }, [files, search, filterType])

  const groupedFiles = useMemo(() => {
    const groups = {}
    filteredFiles.forEach(f => {
      const groupName = f.projectName || 'Other Attachments'
      if (!groups[groupName]) {
        groups[groupName] = {
          name: groupName,
          color: f.projectColor || '#94a3b8',
          projectId: f.projectId,
          files: []
        }
      }
      groups[groupName].files.push(f)
    })
    return Object.values(groups).sort((a,b) => {
      if (a.name === 'Other Attachments') return 1
      if (b.name === 'Other Attachments') return -1
      return a.name.localeCompare(b.name)
    })
  }, [filteredFiles])

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      
      {/* Sleek Header Section */}
      <div className="px-6 pt-5 pb-0 shrink-0 z-10 border-b border-border bg-background">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground flex items-center gap-2">
            Files
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-border bg-background hover:bg-muted/50 focus:bg-background rounded-md text-[13px] ring-[1px] ring-transparent transition-all focus-visible:outline-none focus-visible:border-primary focus-visible:ring-primary/20 w-[240px]"
              />
            </div>

            <div className="flex bg-muted/30 rounded-md border border-border p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-[4px] transition-colors', viewMode === 'list' ? 'bg-background shadow-sm border border-border text-foreground' : 'text-muted-foreground hover:text-foreground border border-transparent')}
                title="List view"
              >
                <ListIcon className="h-[15px] w-[15px]" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-1.5 rounded-[4px] transition-colors', viewMode === 'grid' ? 'bg-background shadow-sm border border-border text-foreground' : 'text-muted-foreground hover:text-foreground border border-transparent')}
                title="Grid view"
              >
                <Grid className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Line Filtering Tabs */}
        <div className="flex items-center gap-6 mt-6">
          {['all', 'images', 'documents', 'archives'].map(type => (
            <button
              key={type}
              onClick={() => { setFilterType(type); setSelectedIds([]); }}
              className={cn(
                "pb-3 text-[13px] font-medium capitalize transition-all border-b-2",
                filterType === type 
                  ? "border-primary text-foreground" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {type} {filterType === type && <span className="ml-1 text-xs text-muted-foreground">({filteredFiles.length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto z-10 bg-[#fafafa] dark:bg-background relative">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-destructive text-[13px]">{error}</div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center mt-12 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-20 mb-3" />
            <p className="text-[14px]">No files match your filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-5 pb-24">
            {filteredFiles.map(file => (
              <FileCard 
                key={file._id} 
                file={file} 
                isSelected={selectedIds.includes(file._id)}
                onSelect={(e) => toggleSelection(file._id, e)}
                onDelete={handleDelete} 
                onDownload={handleDownload} 
                onShare={() => openShareModal(file)}
                onView={handleView} 
                currentUserId={user?._id} 
              />
            ))}
          </div>
        ) : (
          <div className="p-6 max-w-7xl pb-24">
            {groupedFiles.map(group => (
              <div key={group.name} className="mb-10">
                <div className="flex items-center gap-2 mb-2 px-2 sticky top-0 bg-[#fafafa] dark:bg-background z-20 pb-2 border-b border-border/30">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  <h3 className="text-[14px] font-medium text-foreground tracking-tight">{group.name}</h3>
                  <span className="text-[12px] text-muted-foreground ml-1">{group.files.length} files</span>
                </div>
                
                <div className="w-full">
                  <table className="w-full text-left text-[13px] whitespace-nowrap border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground bg-transparent">
                        <th className="font-medium px-3 py-2 w-8 text-center">
                          <input 
                            type="checkbox" 
                            className="w-3.5 h-3.5 rounded-sm border-muted-foreground/40 accent-primary cursor-pointer align-middle"
                            checked={group.files.length > 0 && group.files.every(f => selectedIds.includes(f._id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newIds = group.files.map(f => f._id).filter(id => !selectedIds.includes(id))
                                setSelectedIds([...selectedIds, ...newIds])
                              } else {
                                const removeIds = group.files.map(f => f._id)
                                setSelectedIds(selectedIds.filter(id => !removeIds.includes(id)))
                              }
                            }}
                          />
                        </th>
                        <th className="font-medium px-4 py-2 w-full lg:w-4/12">Name</th>
                        <th className="font-medium px-4 py-2 hidden md:table-cell lg:w-3/12">Task</th>
                        <th className="font-medium px-4 py-2 hidden lg:table-cell lg:w-2/12">Uploaded by</th>
                        <th className="font-medium px-4 py-2 lg:w-1/12">Date</th>
                        <th className="font-medium px-4 py-2 lg:w-1/12 text-right">Size</th>
                        <th className="font-medium px-4 py-2 w-16 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {group.files.map(file => (
                        <FileRow 
                          key={file._id} 
                          file={file} 
                          isSelected={selectedIds.includes(file._id)}
                          onSelect={(e) => toggleSelection(file._id, e)}
                          onDelete={handleDelete} 
                          onDownload={handleDownload} 
                          onShare={() => openShareModal(file)}
                          onView={handleView} 
                          currentUserId={user?._id} 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Bar (Bulk Select) */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[80] bg-slate-900 border border-slate-700 text-slate-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5">
           <span className="text-[13px] font-medium flex items-center gap-2">
             <div className="w-5 h-5 flex items-center justify-center bg-white/10 rounded-full text-[11px] font-bold">{selectedIds.length}</div>
             Selected
           </span>
           <div className="w-px h-6 bg-slate-700 mx-2" />
           <div className="flex gap-2">
             <button onClick={() => openShareModal()} className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-[13px] font-semibold rounded-full hover:bg-primary/90 transition-colors">
               <Share2 className="w-4 h-4" /> Share
             </button>
             <button onClick={() => setSelectedIds([])} className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-slate-300 text-[13px] font-semibold rounded-full hover:bg-slate-700 transition-colors">
               Cancel
             </button>
           </div>
        </div>
      )}

      {/* Lightbox / Previewer Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
          <button onClick={() => setPreviewFile(null)} className="absolute top-4 right-4 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors shadow-xl text-xs flex items-center gap-2">
            <X className="w-4 h-4"/> Close
          </button>

          <div className="flex-1 min-w-0 flex items-center justify-center relative p-12 overflow-hidden">
             <img src={previewFile.previewUrl} alt={previewFile.originalName} className="object-contain max-h-full max-w-full rounded-md shadow-2xl select-none" />
          </div>

          <div className="w-[320px] bg-slate-900 border-l border-white/5 p-6 flex flex-col text-slate-300 shadow-2xl shrink-0 overflow-y-auto">
             <div className="flex items-center gap-3 text-white/50 mb-6 mt-4">
                <FileText className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest font-semibold font-mono">File Details</span>
             </div>
             
             <h3 className="font-semibold text-white text-lg leading-snug break-words">{previewFile.originalName}</h3>
             <p className="text-sm text-white/50 mt-1 mb-6">{formatBytes(previewFile.size)} • {previewFile.mimetype}</p>

             <div className="space-y-5 text-[13px]">
               <div>
                 <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2 font-medium">Uploaded by</p>
                 <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: previewFile.uploadedBy?.avatarColor }}>
                     {previewFile.uploadedBy?.displayName?.slice(0,2).toUpperCase() || '?'}
                   </div>
                   <p className="text-white/90 font-medium">{previewFile.uploadedBy?.displayName}</p>
                 </div>
               </div>

               <div className="pt-4 border-t border-white/10">
                 <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2 font-medium">Associated Task</p>
                 <div className="flex items-start gap-2 bg-white/5 p-3 rounded-md">
                   <CheckSquare className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                   <p className="text-white/90 leading-tight">{previewFile.taskName || 'Unknown Task'}</p>
                 </div>
               </div>

               {previewFile.projectName && (
                 <div>
                   <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2 font-medium">Project</p>
                   <Link to={`/projects/${previewFile.projectId}`} onClick={() => setPreviewFile(null)} className="flex items-center gap-2 bg-white/5 p-3 rounded-md hover:bg-white/10 transition-colors">
                     <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: previewFile.projectColor }} />
                     <p className="text-white/90 leading-tight flex-1 truncate">{previewFile.projectName}</p>
                   </Link>
                 </div>
               )}
             </div>

             <div className="mt-auto pt-8 flex flex-col gap-2">
                <button onClick={() => {openShareModal(previewFile); setPreviewFile(null);}} className="flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 py-2.5 rounded-md text-[13px] font-semibold transition-colors">
                  <Share2 className="w-4 h-4" /> Share via Email
                </button>
                <button onClick={(e) => handleDownload(previewFile._id, previewFile.originalName, e)} className="flex items-center justify-center gap-2 bg-white/10 text-white hover:bg-white/20 py-2.5 rounded-md text-[13px] font-semibold transition-colors">
                  <Download className="w-4 h-4" /> Download
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-[480px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Mail className="w-5 h-5 text-primary" /> Share Files via Email
              </h2>
              <button disabled={sharing} onClick={() => setShareModalOpen(false)} className="text-muted-foreground hover:text-foreground bg-background border border-border rounded-md p-1 shadow-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={submitShare} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1">To: (Email Recipients)</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="alice@example.com, bob@example.com" 
                  value={shareEmails}
                  onChange={e => setShareEmails(e.target.value)}
                  className="w-full text-[13px] py-2 px-3 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">Separate multiple emails with commas.</p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1">Message (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Here are the files we discussed..." 
                  value={shareMessage}
                  onChange={e => setShareMessage(e.target.value)}
                  className="w-full text-[13px] py-2 px-3 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Files being shared ({filesToShare.length})</h4>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                  {filesToShare.map(f => {
                    const Icon = getFileIcon(f.mimetype);
                    return (
                    <div key={f._id} className="flex items-center gap-2.5 bg-background p-2 rounded border border-border/60 shadow-sm">
                      <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0", getFileColor(f.mimetype))}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-foreground font-medium truncate leading-none mb-1">{f.originalName}</p>
                        <p className="text-[10px] text-muted-foreground leading-none">{formatBytes(f.size)}</p>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2 border-t border-border pt-5">
                <button type="button" disabled={sharing} onClick={() => setShareModalOpen(false)} className="px-4 py-2 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-muted border border-border transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={sharing} className="px-5 py-2 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {sharing ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Email</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

function FileCard({ file, isSelected, onSelect, onDelete, onDownload, onView, onShare, currentUserId }) {
  const Icon = getFileIcon(file.mimetype)
  const isImage = file.mimetype?.startsWith('image/')
  const isOwner = file.uploadedBy?._id === currentUserId
  
  return (
    <div 
      className={cn(
        "group relative flex flex-col bg-white dark:bg-slate-950 border rounded-md shadow-sm transition-all overflow-hidden",
        isSelected ? "border-primary ring-[1.5px] ring-primary shadow-md" : "border-border hover:border-border/80 hover:shadow-md"
      )}
    >
      <div className="relative aspect-square bg-muted/20 flex flex-col items-center justify-center overflow-hidden border-b border-border/50 p-2 cursor-pointer" onClick={(e) => onView(file, e)}>
        {isImage ? (
          <img src={file.url} alt="" className="object-cover w-full h-full rounded-[2px] opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" loading="lazy" />
        ) : (
          <Icon className={cn("h-10 w-10 opacity-70", getFileColor(file.mimetype))} />
        )}
        
        {/* Overlay Checkbox (Top Left) */}
        <div 
          className={cn("absolute top-2 left-2 z-10 bg-background/90 p-1 rounded backdrop-blur-sm transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")} 
          onClick={e => e.stopPropagation()}
        >
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={onSelect}
            className="w-3.5 h-3.5 rounded-sm border-muted-foreground/40 accent-primary cursor-pointer align-middle"
          />
        </div>

        <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors pointer-events-none" />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <button onClick={e => e.stopPropagation()} className="p-1 bg-background border border-border shadow-sm text-foreground rounded hover:bg-muted transition-colors">
                 <MoreHorizontal className="h-4 w-4" />
               </button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-48 text-[13px]">
               <DropdownMenuItem onClick={(e) => onView(file, e)} className="gap-2 cursor-pointer focus:bg-primary/10">
                 <Maximize2 className="h-4 w-4 text-muted-foreground" /> View File
               </DropdownMenuItem>
               <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }} className="gap-2 cursor-pointer focus:bg-primary/10">
                 <Share2 className="h-4 w-4 text-muted-foreground" /> Share via Email
               </DropdownMenuItem>
               <DropdownMenuItem onClick={(e) => onDownload(file._id, file.originalName, e)} className="gap-2 cursor-pointer focus:bg-primary/10">
                 <Download className="h-4 w-4 text-muted-foreground" /> Download
               </DropdownMenuItem>
               {isOwner && (
                 <>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={(e) => onDelete(file._id, e)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                     <Trash2 className="h-4 w-4" /> Delete
                   </DropdownMenuItem>
                 </>
               )}
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <div className="p-3 flex flex-col bg-background cursor-pointer" onClick={(e) => onView(file, e)}>
        <h4 className="font-semibold text-[13px] truncate text-foreground pr-2" title={file.originalName}>{file.originalName}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">{formatBytes(file.size)}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-auto truncate pt-2 border-t border-border/50">
          <Layers className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{file.taskName || 'Unknown task'}</span>
        </div>
      </div>
    </div>
  )
}

function FileRow({ file, isSelected, onSelect, onDelete, onDownload, onView, onShare, currentUserId }) {
  const Icon = getFileIcon(file.mimetype)
  const isOwner = file.uploadedBy?._id === currentUserId
  const isImage = file.mimetype?.startsWith('image/')

  return (
    <tr className={cn("transition-colors group cursor-pointer", isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40")} onClick={(e) => onView(file, e)}>
      <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
         <input 
           type="checkbox" 
           checked={isSelected}
           onChange={onSelect}
           className="w-3.5 h-3.5 rounded-sm border-muted-foreground/40 accent-primary cursor-pointer align-middle"
         />
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center justify-center shrink-0 w-5 h-5", getFileTextColor(file.mimetype))}>
             {isImage && file.url ? (
               <img src={file.url} className="w-5 h-5 object-cover rounded shadow-sm border border-border/50" />
             ) : (
               <Icon className="h-4 w-4" />
             )}
          </div>
          <p className="text-[13px] text-foreground truncate max-w-[200px] lg:max-w-xs group-hover:text-primary transition-colors" title={file.originalName}>
            {file.originalName}
          </p>
        </div>
      </td>
      
      <td className="px-4 py-2 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground truncate max-w-[180px]" title={file.taskName}>
           <CheckSquare className="h-3 w-3 shrink-0 opacity-60" />
           <span className="truncate">{file.taskName || '-'}</span>
        </div>
      </td>

      <td className="px-4 py-2 hidden lg:table-cell">
        <div className="flex items-center gap-1.5">
          {file.uploadedBy ? (
             <>
               <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: file.uploadedBy.avatarColor || '#6366f1' }}>
                 {file.uploadedBy.displayName?.slice(0, 2).toUpperCase() || '?'}
               </span>
               <span className="text-[12px] text-muted-foreground truncate max-w-[100px]">{file.uploadedBy.displayName || 'User'}</span>
             </>
          ) : (
            <span className="text-muted-foreground/50 text-[12px] italic">-</span>
          )}
        </div>
      </td>

      <td className="px-4 py-2 text-[12px] text-muted-foreground whitespace-nowrap">
        {format(new Date(file.createdAt), 'MMM d, yyyy')}
      </td>

      <td className="px-4 py-2 text-[12px] text-muted-foreground text-right whitespace-nowrap">
        {formatBytes(file.size)}
      </td>
      
      <td className="px-4 py-2 text-center" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity outline-none focus:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-[13px]">
            <DropdownMenuItem onClick={(e) => onView(file, e)} className="gap-2 focus:bg-primary/10 cursor-pointer">
              <Maximize2 className="h-4 w-4 text-muted-foreground" /> View File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }} className="gap-2 cursor-pointer focus:bg-primary/10">
              <Share2 className="h-4 w-4 text-muted-foreground" /> Share via Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => onDownload(file._id, file.originalName, e)} className="gap-2 focus:bg-primary/10 cursor-pointer">
              <Download className="h-4 w-4 text-muted-foreground" /> Download
            </DropdownMenuItem>
            {isOwner && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => onDelete(file._id, e)} className="gap-2 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
