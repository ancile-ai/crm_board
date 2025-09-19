"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "Only users with @ancile.io email addresses can access this application.",
          suggestion: "Please use your Ancile company email address to sign in.",
        }
      case "Configuration":
        return {
          title: "Configuration Error",
          description: "There is a problem with the server configuration.",
          suggestion: "Please contact your administrator.",
        }
      default:
        return {
          title: "Authentication Error",
          description: "An error occurred during authentication.",
          suggestion: "Please try again or contact support if the problem persists.",
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">{errorInfo.title}</CardTitle>
          <CardDescription className="text-muted-foreground">{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">{errorInfo.suggestion}</p>
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/login">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="mailto:support@ancile.io">Contact Support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
