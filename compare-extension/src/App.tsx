import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'comparisonProperties'

type DetailRow = {
  label: string
  value?: string
}

const propertyComRows = (details?: PropertyComDetails): DetailRow[] => [
  { label: 'Carpet size', value: details?.carpetSize },
  { label: 'Building size', value: details?.buildingSize },
  { label: 'Bedrooms', value: details?.bedrooms },
  { label: 'Bathrooms', value: details?.bathrooms },
  { label: 'Parking', value: details?.parking },
  { label: 'Estimated cost/value', value: details?.estimatedCost },
  { label: 'Build year', value: details?.buildYear },
  { label: 'Property boundary', value: details?.propertyBoundary },
  { label: 'Government planning overlays', value: details?.governmentPlanningOverlays },
]

function App() {
  const [properties, setProperties] = useState<StoredProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (items) => {
      setProperties(Array.isArray(items[STORAGE_KEY]) ? (items[STORAGE_KEY] as StoredProperty[]) : [])
      setIsLoading(false)
    })
  }, [])

  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => b.savedAt - a.savedAt),
    [properties],
  )

  const clearProperties = () => {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      setProperties([])
    })
  }

  const openProperty = (url: string) => {
    if (chrome.tabs?.create) {
      chrome.tabs.create({ url })
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Property comparison</p>
          <h1>Saved profiles</h1>
        </div>

        {sortedProperties.length > 0 && (
          <button className="clear-button" type="button" onClick={clearProperties}>
            Clear
          </button>
        )}
      </header>

      {isLoading && <p className="status-text">Loading properties...</p>}

      {!isLoading && sortedProperties.length === 0 && (
        <section className="empty-state">
          <h2>No property profile yet</h2>
          <p>Search an address on property.com.au and open its profile page. The details will appear here.</p>
        </section>
      )}

      {!isLoading && sortedProperties.length > 0 && (
        <section className="profile-list" aria-label={`${sortedProperties.length} saved property profiles`}>
          {sortedProperties.map((property) => {
            const propertyComDetails = property.sources.propertyCom
            const foundCount = propertyComRows(propertyComDetails).filter((row) => row.value).length

            return (
              <article className="profile-card" key={property.id}>
                <div className="profile-title-row">
                  <div>
                    <h2>{property.title}</h2>
                    <p>{property.address}</p>
                  </div>

                  <button className="open-button" type="button" onClick={() => openProperty(property.url)}>
                    Open
                  </button>
                </div>

                <details className="source-dropdown" open>
                  <summary>
                    <span>property.com.au</span>
                    <strong>{foundCount} found</strong>
                  </summary>

                  <div className="detail-grid">
                    {propertyComRows(propertyComDetails).map((row) => (
                      <div className="detail-row" key={row.label}>
                        <dt>{row.label}</dt>
                        <dd className={row.value ? undefined : 'missing-value'}>{row.value || 'Not found'}</dd>
                      </div>
                    ))}
                  </div>
                </details>

                <details className="source-dropdown disabled-dropdown">
                  <summary>
                    <span>realestate.com.au</span>
                    <strong>Coming next</strong>
                  </summary>
                </details>

                <details className="source-dropdown disabled-dropdown">
                  <summary>
                    <span>DSR</span>
                    <strong>Coming next</strong>
                  </summary>
                </details>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default App
