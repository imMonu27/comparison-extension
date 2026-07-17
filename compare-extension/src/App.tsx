import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'comparisonProperties'

type DetailRow = {
  label: string
  value?: string
}

type SourceRenderer = {
  title: string
  rows: DetailRow[]
}

const getSourceRenderers = (property: StoredProperty): SourceRenderer[] => {
  const renderers: SourceRenderer[] = []

  if (property.sources.propertyCom) {
    const d = property.sources.propertyCom

    renderers.push({
      title: 'property.com.au',
      rows: [
        { label: 'Carpet size', value: d.carpetSize },
        { label: 'Building size', value: d.buildingSize },
        { label: 'Bedrooms', value: d.bedrooms },
        { label: 'Bathrooms', value: d.bathrooms },
        { label: 'Parking', value: d.parking },
        { label: 'Build year', value: d.buildYear },
        {
          label: 'Government planning overlays',
          value: d.governmentPlanningOverlays,
        },
      ],
    })
  }

  // Future
  // if (property.sources.realEstate) {
  //   const d = property.sources.realEstate
  //
  //   renderers.push({
  //     title: 'realestate.com.au',
  //     rows: [
  //       { label: 'Land Size', value: d.landSize },
  //       { label: 'Floor Area', value: d.floorArea },
  //       { label: 'Bedrooms', value: d.bedrooms },
  //       { label: 'Bathrooms', value: d.bathrooms },
  //       { label: 'Car Spaces', value: d.carSpaces },
  //       { label: 'Estimated Value', value: d.estimatedValue },
  //     ],
  //   })
  // }

  // Future
  // if (property.sources.dsr) {
  //   const d = property.sources.dsr
  //
  //   renderers.push({
  //     title: 'DSR',
  //     rows: [
  //       { label: 'Rental Yield', value: d.rentalYield },
  //       { label: 'Vacancy Rate', value: d.vacancyRate },
  //     ],
  //   })
  // }

  return renderers
}

type EstimateCardProps = {
  title: string
  estimate?: PropertyEstimate | RentalEstimate
  color: 'purple' | 'blue'
}

function EstimateCard({
  title,
  estimate,
  color,
}: EstimateCardProps) {
  if (!estimate) return null

  return (
    <section className="estimate-card">
      <div className="estimate-header">
        <h4>{title}</h4>

        {estimate.updated && (
          <span>{estimate.updated}</span>
        )}
      </div>

      <div className={`estimate-body ${color}`}>
        {estimate.confidence && (
          <div className="estimate-confidence">
            {estimate.confidence}
          </div>
        )}

        <div className="estimate-price">
          {estimate.value}
        </div>

        {"pricePerSqm" in estimate &&
          estimate.pricePerSqm && (
            <div className="estimate-badge">
              {estimate.pricePerSqm}
            </div>
          )}
      </div>

      <div className="estimate-footer">
        <div>
          <h4>{estimate.lowRange}</h4>
          <span>Low range</span>
        </div>

        <div style={{ textAlign: "right" }}>
          <h4>{estimate.highRange}</h4>
          <span>High range</span>
        </div>
      </div>
    </section>
  )
}

type BoundaryCardProps = {
  boundary?: PropertyBoundary
}

function BoundaryCard({ boundary }: BoundaryCardProps) {

  if (
    !boundary ||
    typeof boundary !== "object" ||
    !("polygon" in boundary) ||
    !Array.isArray(boundary.polygon) ||
    boundary.polygon.length === 0
  ) {
    return null
  }

  const points = boundary.polygon
    .map(p => `${p.x},${p.y}`)
    .join(" ")


  const xs = boundary.polygon.map(p => p.x)
  const ys = boundary.polygon.map(p => p.y)

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)

  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const padding = 35

  const viewBox =
    `${minX - padding}
     ${minY - padding}
     ${maxX - minX + padding * 2}
     ${maxY - minY + padding * 2}`
  return (

    <section className="boundary-card">

      <div className="boundary-header">
        <h4>Property Boundary</h4>
        <span>{boundary.area?.value}</span>
      </div>

      <svg viewBox={viewBox}>

        <polygon

          points={
            boundary.polygon
              .map(p => `${p.x},${p.y}`)
              .join(" ")
          }

          fill="#E6D7FF"

          stroke="#7B2EFF"

          strokeWidth={2.5}


        />
        

        {boundary.polygon.map(point =>

          <circle

            cx={point.x}

            cy={point.y}

            r={5}

            fill="white"

            stroke="#7B2EFF"

            strokeWidth={2}

          />

        )}

        {
        boundary.area && (

          <g>

            <rect

              x={boundary.area.x - 28}

              y={boundary.area.y - 13}

              rx="12"

              width="56"

              height="26"

              fill="#7B2EFF"

            />

            <text

              x={boundary.area.x}

              y={boundary.area.y + 5}

              fill="white"

              fontSize="12"

              fontWeight="700"

              textAnchor="middle"

            >

              {boundary.area.text}

            </text>

          </g>

        )}

        

      </svg>

    </section>

  )

}


function App() {
  const [properties, setProperties] = useState<StoredProperty[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (items) => {
      setProperties(
        Array.isArray(items[STORAGE_KEY])
          ? (items[STORAGE_KEY] as StoredProperty[])
          : [],
      )
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
          <button
            className="clear-button"
            type="button"
            onClick={clearProperties}
          >
            Clear
          </button>
        )}
      </header>

      {isLoading && (
        <p className="status-text">Loading properties...</p>
      )}

      {!isLoading && sortedProperties.length === 0 && (
        <section className="empty-state">
          <h2>No property profile yet</h2>
          <p>
            Search an address on property.com.au and open its profile
            page. The details will appear here.
          </p>
        </section>
      )}

      {!isLoading && sortedProperties.length > 0 && (
        <section
          className="profile-list"
          aria-label={`${sortedProperties.length} saved property profiles`}
        >
          {sortedProperties.map((property) => {
            const renderers = getSourceRenderers(property)

            return (
              <article
                className="profile-card"
                key={property.id}
              >
                <div className="profile-title-row">
                  <div>
                    <h2>{property.title}</h2>
                    <p>{property.address}</p>
                  </div>

                  <button
                    className="open-button"
                    type="button"
                    onClick={() => openProperty(property.url)}
                  >
                    Open
                  </button>
                </div>

                {renderers.map((renderer) => {
                  const foundCount = renderer.rows.filter(
                    (row) => row.value,
                  ).length

                  return (
                    <details
                      key={renderer.title}
                      className="source-dropdown"
                      open
                    >
                      <summary>
                        <span>{renderer.title}</span>
                        <strong>{foundCount} found</strong>
                      </summary>

                      <div className="detail-grid">

                        {renderer.rows.map((row) => (
                          <div
                            className="detail-row"
                            key={row.label}
                          >
                            <dt>{row.label}</dt>

                            <dd
                              className={
                                row.value
                                  ? undefined
                                  : 'missing-value'
                              }
                            >
                              {row.value || 'Not found'}
                            </dd>
                          </div>
                        ))}

                      </div>
                      <div className="estimate">
                        <EstimateCard
                          title="Property Value"
                          estimate={property.sources.propertyCom?.propertyEstimate}
                          color="purple"
                        />

                        <EstimateCard
                          title="Rental Income"
                          estimate={property.sources.propertyCom?.rentalEstimate}
                          color="blue"
                        />
                      </div>
                      {property.sources.propertyCom?.propertyBoundary?.image && (
  <section className="boundary-card">
    <div className="boundary-header">
      <h4>Property Boundary</h4>
    </div>

    <img
      src={property.sources.propertyCom.propertyBoundary.image}
      alt="Property Boundary"
      className="boundary-image"
    />
  </section>
)}
                    </details>
                  )
                })}
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default App