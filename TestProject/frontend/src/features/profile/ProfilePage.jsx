import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateUserProfile } from '../auth/authSlice'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Loader2, User, Bell, Palette, Monitor } from 'lucide-react'
import { getInitials, cn } from '../../lib/utils'
import { useTheme } from '../../hooks/useTheme'
import toast from 'react-hot-toast'

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316',
  '#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6',
  '#f06a6a','#64748b',
]

const NOTIF_TYPES = [
  { key: 'mentioned',            label: 'Mentions',           desc: 'When someone @mentions you' },
  { key: 'task_assigned',        label: 'Task assignments',   desc: 'When a task is assigned to you' },
  { key: 'comment_added',        label: 'Comments',           desc: 'When someone comments on your tasks' },
  { key: 'task_status_changed',  label: 'Status changes',     desc: 'When a task status is updated' },
  { key: 'due_date_approaching', label: 'Due date reminders', desc: 'When a task due date is approaching' },
]

const SECTIONS = [
  { id: 'profile',       label: 'Profile',        icon: User },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150',
        checked ? 'bg-primary' : 'bg-muted-foreground/25'
      )}
    >
      <span className={cn(
        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150',
        checked ? 'translate-x-4' : 'translate-x-0'
      )} />
    </button>
  )
}

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { theme, toggle } = useTheme()
  const [section, setSection] = useState('profile')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || '#6366f1')
  const [saving, setSaving] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const p = {}
    NOTIF_TYPES.forEach(t => { p[t.key] = { inApp: true, email: true } })
    return user?.notificationPreferences || p
  })

  const togglePref = (type, channel) =>
    setNotifPrefs(prev => ({ ...prev, [type]: { ...prev[type], [channel]: !prev[type]?.[channel] } }))

  const handleSave = async () => {
    setSaving(true)
    const result = await dispatch(updateUserProfile({ displayName, avatarColor, notificationPreferences: notifPrefs }))
    setSaving(false)
    if (updateUserProfile.fulfilled.match(result)) toast.success('Profile updated')
    else toast.error('Failed to update profile')
  }

  return (
    <div className="flex h-full">
      {/* ── Left nav ── */}
      <div className="w-56 shrink-0 border-r border-border bg-muted/20 px-3 py-5 space-y-0.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Account</p>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
              section === s.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <s.icon className="h-4 w-4 shrink-0" />
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl px-8 py-6 space-y-6">

          {/* Profile */}
          {section === 'profile' && (
            <>
              <div>
                <h2 className="text-lg font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Your personal information</p>
              </div>

              {/* Avatar card — full width */}
              <div className="flex items-center gap-5 p-5 rounded-xl border border-border bg-card">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarFallback style={{ backgroundColor: avatarColor }} className="text-xl text-white font-bold">
                    {getInitials(displayName, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base">{displayName || user?.email?.split('@')[0]}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {AVATAR_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setAvatarColor(c)}
                        className={cn(
                          'h-6 w-6 rounded-full transition-all hover:scale-110',
                          avatarColor === c && 'ring-2 ring-offset-2 ring-ring scale-110'
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Fields — two column */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Display name</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" maxLength={50} />
                  <p className="text-xs text-muted-foreground">Shown to teammates across the app</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted/40" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </>
          )}

          {/* Appearance */}
          {section === 'appearance' && (
            <>
              <div>
                <h2 className="text-lg font-semibold">Appearance</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Customize how the app looks</p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm">
                {['light', 'dark'].map(t => (
                  <button
                    key={t}
                    onClick={() => { if (theme !== t) toggle() }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      theme === t ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80 hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'h-10 w-full rounded-lg flex items-center justify-center',
                      t === 'light' ? 'bg-white border border-border' : 'bg-slate-900'
                    )}>
                      <Monitor className={cn('h-5 w-5', t === 'light' ? 'text-slate-700' : 'text-slate-300')} />
                    </div>
                    <span className={cn('text-sm font-medium capitalize', theme === t && 'text-primary')}>{t}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Notifications */}
          {section === 'notifications' && (
            <>
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Choose how you want to be notified</p>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center px-5 py-3 bg-muted/40 border-b border-border">
                  <div className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</div>
                  <div className="flex items-center gap-8 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="w-14 text-center">In-app</span>
                    <span className="w-14 text-center">Email</span>
                  </div>
                </div>
                {NOTIF_TYPES.map((t, i) => (
                  <div key={t.key} className={cn('flex items-center px-5 py-3.5', i < NOTIF_TYPES.length - 1 && 'border-b border-border/60')}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="w-14 flex justify-center">
                        <Toggle checked={notifPrefs[t.key]?.inApp !== false} onChange={() => togglePref(t.key, 'inApp')} />
                      </div>
                      <div className="w-14 flex justify-center">
                        <Toggle checked={notifPrefs[t.key]?.email !== false} onChange={() => togglePref(t.key, 'email')} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save preferences
              </Button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
