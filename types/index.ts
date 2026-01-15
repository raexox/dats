// User and Auth types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: Date
}

// Search and Map types
export interface SearchQuery {
  id: string
  phrase: string
  metric: string
  geography: "state" | "county"
  timeRange: [number, number]
  perCapita: boolean
  timestamp: Date
  userId?: string
}

export interface MapData {
  id: string
  state?: string
  county?: string
  value: number
  population?: number
  displayValue: string
}

export interface DataTable {
  id: string
  location: string
  value: number
  perCapitaValue?: number
  changePercent?: number
}

// Mock API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
