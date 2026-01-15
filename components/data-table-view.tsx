"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, ArrowUpDown } from "lucide-react"

interface DataRow {
  id: string
  location: string
  value: number
  perCapitaValue?: number
  changePercent?: number
}

interface DataTableViewProps {
  data: DataRow[]
  isLoading?: boolean
  metric: string
}

export function DataTableView({ data, isLoading = false, metric }: DataTableViewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<"location" | "value" | "change">("value")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const columnLabels: Record<"location" | "value" | "change", string> = {
    location: "Location",
    value: metric,
    change: "Change %",
  }

  const itemsPerPage = 10
  const totalPages = Math.ceil(data.length / itemsPerPage)

  const sortedData = [...data].sort((a, b) => {
    let aValue: number | string = 0
    let bValue: number | string = 0

    if (sortColumn === "location") {
      aValue = a.location
      bValue = b.location
    } else if (sortColumn === "value") {
      aValue = a.value
      bValue = b.value
    } else {
      aValue = a.changePercent ?? 0
      bValue = b.changePercent ?? 0
    }

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return sortDirection === "asc" ? comparison : -comparison
  })

  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSort = (column: "location" | "value" | "change") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const SortIcon = ({ column }: { column: "location" | "value" | "change" }) => (
    <ArrowUpDown
      className={`h-4 w-4 inline-block ml-1 ${sortColumn === column ? "text-primary" : "text-muted-foreground"}`}
    />
  )

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Data Table</CardTitle>
          <CardDescription>Sorted by {columnLabels[sortColumn]}</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-transparent border-t-primary animate-spin mx-auto"></div>
              <p className="text-sm text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <p className="font-semibold text-foreground">No data found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="cursor-pointer hover:text-foreground" onClick={() => handleSort("location")}>
                      Location
                      <SortIcon column="location" />
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("value")}
                    >
                      {metric}
                      <SortIcon column="value" />
                    </TableHead>
                    <TableHead className="text-right">Per Capita</TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:text-foreground"
                      onClick={() => handleSort("change")}
                    >
                      Change %
                      <SortIcon column="change" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row) => {
                    const perCapitaText =
                      typeof row.perCapitaValue === "number" ? row.perCapitaValue.toFixed(2) : "—"
                    const changeValue =
                      typeof row.changePercent === "number" ? row.changePercent : null
                    const changeText =
                      changeValue !== null ? `${changeValue > 0 ? "+" : ""}${changeValue.toFixed(1)}%` : "—"
                    const changeClass =
                      changeValue === null
                        ? "text-muted-foreground"
                        : changeValue >= 0
                        ? "text-green-500"
                        : "text-destructive"

                    return (
                      <TableRow key={row.id} className="border-border">
                        <TableCell className="font-medium">{row.location}</TableCell>
                        <TableCell className="text-right">{row.value.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{perCapitaText}</TableCell>
                        <TableCell className={`text-right font-medium ${changeClass}`}>{changeText}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1
                      const isVisible = Math.abs(pageNum - currentPage) <= 1 || pageNum === 1 || pageNum === totalPages

                      if (!isVisible && (pageNum === 2 || pageNum === totalPages - 1)) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }

                      if (isVisible) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={pageNum === currentPage}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }

                      return null
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
