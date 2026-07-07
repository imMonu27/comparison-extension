type PropertyComDetails = {
  carpetSize?: string
  buildingSize?: string
  bedrooms?: string
  bathrooms?: string
  parking?: string
  estimatedCost?: string
  buildYear?: string
  propertyBoundary?: string
  governmentPlanningOverlays?: string
  rawFields?: Record<string, string>
  capturedAt: number
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
