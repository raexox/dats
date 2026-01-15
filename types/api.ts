export type MapGeoLevel = "state" | "county"

export interface QueryRequest {
  phrase: string
  metric: string
  geography: MapGeoLevel
  timeRange: [number, number]
  perCapita: boolean
}

export interface DatasetRow {
  id: string
  location: string
  value: number
  perCapitaValue?: number
  changePercent?: number
}

export interface SourceMetadata {
  name: string
  updatedAt: string
  notes?: string
}

export interface QueryResponse {
  request: QueryRequest
  rows: DatasetRow[]
  source: SourceMetadata
}

export interface NoDataResponse {
  status: "no_data"
  message: string
}

export interface ErrorResponse {
  status: "error"
  message: string
  code?: string
}

export interface AuthUser {
  id: string
  email: string
  name?: string
  createdAt: string
}

export interface AuthRegisterRequest {
  email: string
  password: string
  name?: string
}

export interface AuthLoginRequest {
  email: string
  password: string
}
