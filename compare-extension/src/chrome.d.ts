type PropertyComDetails = {
  carpetSize?: string
  buildingSize?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string
  propertyEstimate?: PropertyEstimate
  rentalEstimate?: RentalEstimate
  buildYear?: string
  propertyBoundary?: PropertyBoundary
  governmentPlanningOverlays?: string
  rawFields?: Record<string, string>
  capturedAt: number
}
type PropertyEstimate = {
  confidence?: string
  value?: string
  pricePerSqm?: string
  lowRange?: string
  highRange?: string
  updated?: string
}

type BoundaryPoint = {
  x: number
  y: number
}

type BoundaryMeasurement = {
  text: string
  x: number
  y: number
}

type BoundaryArea = {
  text: string
  x: number
  y: number
}

type PropertyBoundary = {
  image?: string
  
}

type RentalEstimate = {
  confidence?: string
  value?: string
  lowRange?: string
  highRange?: string
  updated?: string
}
type StoredProperty = {
  id: string
  title: string
  address: string
  url: string
  savedAt: number
  sources: {
    propertyCom?: PropertyComDetails
  }
}

declare const chrome: {
  storage: {
    local: {
      get(
        keys: string | string[] | Record<string, unknown> | null,
        callback: (items: Record<string, unknown>) => void,
      ): void
      set(items: Record<string, unknown>, callback?: () => void): void
    }
  }
  tabs?: {
    create(options: { url: string }): void
  }
}
