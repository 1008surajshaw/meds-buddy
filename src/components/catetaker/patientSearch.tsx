
import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, User, Plus, Loader2, X, Check } from "lucide-react"
import type { PatientSearchResult } from "@/hooks/use-caretaker-patients"

interface PatientSearchProps {
  searchResults: PatientSearchResult[]
  searchLoading: boolean
  onSearch: (searchTerm: string) => void
  onAddPatient: (patientId: string, patientName: string) => Promise<{ success: boolean; message: string }>
  onClearSearch: () => void
}

export const PatientSearch = ({
  searchResults,
  searchLoading,
  onSearch,
  onAddPatient,
  onClearSearch,
}: PatientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [addingPatientId, setAddingPatientId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Memoize the search function to prevent unnecessary re-renders
  const debouncedSearch = useCallback(
    (term: string) => {
      if (term.trim()) {
        onSearch(term.trim())
      } else {
        onClearSearch()
      }
    },
    [onSearch, onClearSearch],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleAddPatient = async (patientId: string, patientName: string) => {
    try {
      setAddingPatientId(patientId)
      setError(null)

      const result = await onAddPatient(patientId, patientName)
      if (result.success) {
        setSearchTerm("")
        onClearSearch()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAddingPatientId(null)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    onClearSearch()
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search Patients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="patientSearch">Patient Name</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="patientSearch"
              type="text"
              placeholder="Enter patient name to search..."
              value={searchTerm}
              onChange={handleInputChange}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {searchLoading && searchTerm && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-muted-foreground">Searching patients...</span>
          </div>
        )}

        {!searchLoading && searchTerm && searchResults.length === 0 && (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No Patients Found</h4>
            <p className="text-muted-foreground text-sm">
              No patients found with the name "{searchTerm}". Try a different search term.
            </p>
          </div>
        )}

        {!searchLoading && searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Found {searchResults.length} patient{searchResults.length !== 1 ? "s" : ""} matching "{searchTerm}"
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((patient) => (
                <div
                  key={patient.user_id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined {new Date(patient.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {patient.already_assigned ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Already Added
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddPatient(patient.user_id, patient.name)}
                        disabled={addingPatientId === patient.user_id}
                        className="flex items-center gap-1"
                      >
                        {addingPatientId === patient.user_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Add Patient
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchTerm && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Search Tips:</p>
            <ul className="space-y-1">
              <li>• Enter at least part of the patient's name</li>
              <li>• Search is case-insensitive</li>
              <li>• Only patients with the "Patient" role will appear</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
