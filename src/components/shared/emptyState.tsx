
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) => {
  return (
    <Card className={className}>
      <CardContent className="text-center py-12">
        <Icon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h4 className="text-xl font-medium mb-2">{title}</h4>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
