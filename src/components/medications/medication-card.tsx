"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pill, Clock, MoreVertical, Edit, Trash2, Loader2 } from "lucide-react"
import { formatTime, frequencyLabels } from "@/utils/medication-helpers"
import type { Medication } from "@/types/type"

interface MedicationCardProps {
  medication: Medication
  onEdit?: (medication: Medication) => void
  onDelete?: (medication: Medication) => void
  canEdit?: boolean
  isDeleting?: boolean
}

export const MedicationCard = ({
  medication,
  onEdit,
  onDelete,
  canEdit = true,
  isDeleting = false,
}: MedicationCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-600" />
            {medication.name}
          </CardTitle>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(medication)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(medication)} className="text-red-600" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dosage:</span>
            <span className="font-medium">{medication.dosage}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frequency:</span>
            <Badge variant="secondary" className="text-xs">
              {frequencyLabels[medication.frequency as keyof typeof frequencyLabels] || medication.frequency}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(medication.scheduled_time)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Added {new Date(medication.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  )
}
