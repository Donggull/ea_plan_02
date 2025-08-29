import { 
  FileText, 
  Settings, 
  Headphones, 
  Palette, 
  Folder, 
  Code, 
  Eye, 
  Terminal, 
  Upload, 
  Bot, 
  Image,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  MessageSquare,
  Minimize2,
  Maximize2
} from 'lucide-react'

const iconMap = {
  FileText,
  Settings,
  Headphones,
  Palette,
  Folder,
  Code,
  Eye,
  Terminal,
  Upload,
  Bot,
  Image,
  Menu,
  X,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  MessageSquare,
  Minimize2,
  Maximize2
}

interface IconRendererProps {
  icon: keyof typeof iconMap
  className?: string
  size?: number
}

export function IconRenderer({ icon, className, size = 20 }: IconRendererProps) {
  const IconComponent = iconMap[icon]
  
  if (!IconComponent) {
    return null
  }

  return <IconComponent className={className} size={size} />
}