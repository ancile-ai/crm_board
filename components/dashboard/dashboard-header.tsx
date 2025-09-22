"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, LogOut } from "lucide-react"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleSignOut = () => {
    setIsOpen(false)
    window.location.href = '/api/logout'
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Ancile AI - CRM</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 relative">
          <Button
            variant="outline"
            className="relative h-10 w-10 rounded-full border-2 border-primary hover:bg-accent"
            onClick={toggleDropdown}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>

          {isOpen && (
            <div className="absolute right-0 top-12 w-56 bg-popover border border-border rounded-lg shadow-lg z-[200]">
              <div className="p-4 border-b">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="py-2">
                <button
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-destructive/10 transition-colors text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}

          {/* Click outside to close */}
          {isOpen && (
            <div
              className="fixed inset-0 z-[150]"
              onClick={() => setIsOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  )
}
