"use client"

import { Search, Edit3, Mic, Image as ImageIcon, ChevronRight, ChevronDown, MoreHorizontal, LogOut, Code, User as UserIcon, Settings, ChevronsLeft, Database } from "lucide-react"
import { ChatMeta } from "@/lib/chatApi"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"

interface SidebarProps {
  chats: ChatMeta[]
  selectedChatId: string | null
  profileName?: string | null
  profileEmail?: string | null
  onLogout: () => Promise<void> | void
  onCreateChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  onRenameChat?: (chatId: string, newTitle: string) => void
}

const Sidebar = ({ chats, selectedChatId, profileName, profileEmail, onLogout, onCreateChat, onSelectChat, onDeleteChat, onRenameChat }: SidebarProps) => {
  const router = useRouter()
  const displayName = profileName?.trim() || "User"
  const initials = displayName.slice(0, 1).toUpperCase()

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] px-3 py-4 text-zinc-950 dark:text-zinc-200">

      {/* Top Header */}
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Code className="h-5 w-5" />
          <span>TaskMinds</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          <ChevronsLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Nav Actions */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center gap-2 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors mb-2">
          <Search className="h-4 w-4" />
          <span className="flex-1 font-medium">Search</span>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">Ctrl+K</span>
        </div>

        <NavItem icon={<Edit3 className="h-[18px] w-[18px]" />} label="Chat" active onClick={onCreateChat} />
        <NavItem icon={<Database className="h-[18px] w-[18px]" />} label="Feed" badge={true} onClick={() => router.push("/c/feed")} />
      </div>



      {/* History */}
      <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
        <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer transition-colors group">
          <span>History</span>
          <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="mt-2 flex flex-col gap-0.5">
          <div className="px-3 py-1 text-[11px] font-medium text-zinc-400 mt-2 mb-1">Recent</div>
          {chats.map((chat) => (
            <div
              key={chat.chatId}
              onClick={() => onSelectChat(chat.chatId)}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-[13px] cursor-pointer transition-colors ${selectedChatId === chat.chatId
                ? "bg-zinc-200/50 dark:bg-zinc-800 bg-opacity-80 text-zinc-950 dark:text-zinc-50 font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
            >
              <div className="truncate pr-2 flex-1">
                {chat.chatTitle || "New conversation"}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <MoreHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    onClick={() => {
                      const currentTitle = chat.chatTitle || "New conversation";
                      const newTitle = window.prompt("Enter new chat title:", currentTitle);
                      if (newTitle && newTitle.trim() !== "" && newTitle !== currentTitle) {
                        onRenameChat?.(chat.chatId, newTitle.trim());
                      }
                    }}
                    className="text-[13px]"
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteChat(chat.chatId)} className="text-[13px] text-red-500 focus:text-red-500">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="px-3 py-2 text-[13px] text-zinc-500">No recent chats</div>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="mt-auto pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer text-left">
              <Avatar className="h-8 w-8 rounded-full border border-zinc-200 dark:border-zinc-700">
                <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 text-sm font-semibold rounded-full">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{displayName}</p>
                <p className="truncate text-[11px] text-zinc-500">{profileEmail}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-[200px] mb-2 p-1 rounded-xl shadow-lg border-zinc-200 dark:border-zinc-800">
            <div className="px-2 py-2 mb-1 flex flex-col gap-0.5 border-b border-zinc-100 dark:border-zinc-800/50">
              <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{displayName}</span>
              <span className="text-xs text-zinc-500">{profileEmail}</span>
            </div>
            <DropdownMenuItem className="text-[13px] py-2 cursor-pointer rounded-lg">
              <UserIcon className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[13px] py-2 cursor-pointer rounded-lg">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 my-1" />
            <DropdownMenuItem onClick={onLogout} className="text-[13px] py-2 text-red-600 focus:text-red-600 cursor-pointer rounded-lg">
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </div>
  )
}

function NavItem({ icon, label, active, onClick, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, badge?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium cursor-pointer transition-all ${active
        ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-950 dark:text-zinc-100"
        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/30 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-100"
        }`}
    >
      <div className="text-zinc-500 dark:text-zinc-400 w-5 flex justify-center">{icon}</div>
      <span className="flex-1">{label}</span>
      {badge && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
    </div>
  )
}

export default Sidebar