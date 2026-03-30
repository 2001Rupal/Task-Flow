import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '../../lib/utils'

const Avatar = ({ className, ...props }) => (
  <AvatarPrimitive.Root className={cn('relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full', className)} {...props} />
)

const AvatarImage = ({ className, ...props }) => (
  <AvatarPrimitive.Image className={cn('aspect-square h-full w-full', className)} {...props} />
)

const AvatarFallback = ({ className, style, ...props }) => (
  <AvatarPrimitive.Fallback
    className={cn('flex h-full w-full items-center justify-center rounded-full text-xs font-semibold text-white', className)}
    style={style}
    {...props}
  />
)

export { Avatar, AvatarImage, AvatarFallback }
