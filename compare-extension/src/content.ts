import { scrapePropertyCom } from './scrappers/propertycom'

const STORAGE_KEY = 'comparisonProperties'
const MAX_SAVED_PROPERTIES = 40
const DEBUG = true

const cleanText = (value?: string | null) => value?.replace(/\s+/g, ' ').trim() ?? ''

const debugLog = (message: string, details?: Record<string, unknown>) => {
  if (DEBUG) {
    console.info(`[Property Compare] ${message}`, details ?? '')
  }
}

const isPropertyComPage = () => ['property.com.au', 'www.property.com.au'].includes(location.hostname)

const normalizeUrl = (href: string) => {
  try {
    const url = new URL(href, location.origin)
    url.hash = ''
    url.search = ''
    return url.href
  } catch {
    return location.href
  }
}




const makeId = (value: string) => value.toLowerCase().replace(/^https?:\/\//, '').replace(/[^\w-]+/g, '-')

const pageText = () => cleanText(document.body.innerText)

const propertyDetailSignals = () => {
  const text = pageText().toLowerCase()

  return [
    'estimated value',
    'estimated cost',
    'property value',
    'bedroom',
    'bathroom',
    'car space',
    'parking',
    'land size',
    'floor area',
    'building size',
    'government planning overlays',
    'planning overlays',
    'year built',
  ].filter((signal) => text.includes(signal))
}

const profileReadiness = () => {
  const path = location.pathname.toLowerCase()
  const isHomeOrSearch = path === '/' || path.includes('/search') || path.includes('/news')
  const address = extractAddress()
  const signals = propertyDetailSignals()

  if (isHomeOrSearch) {
    return { isReady: false, reason: 'home or search page', address, signals }
  }

  if (!address || address.length < 5 || !/\d/.test(address)) {
    return { isReady: false, reason: 'missing address', address, signals }
  }

  if (signals.length === 0) {
    return { isReady: false, reason: 'missing profile signals', address, signals }
  }

  return { isReady: true, reason: 'ready', address, signals }
}

const headingText = () => {
  const heading = document.querySelector('h1')
  return cleanText(heading?.textContent)
}

const titleFromDocument = () => {
  const heading = headingText()
  if (heading) {
    return heading
  }

  return cleanText(document.title.replace(/\|.*$/g, '').replace(/Property.*$/i, ''))
}

const extractAddress = () => {
  const heading = headingText()
  if (heading && /\d/.test(heading)) {
    return heading
  }

  const addressElement = Array.from(document.querySelectorAll<HTMLElement>('[data-testid*="address"], [class*="address"]'))
    .map((element) => cleanText(element.textContent))
    .find((value) => /\d/.test(value))

  return addressElement || titleFromDocument()
}

const nearbyValue = (labelPatterns: RegExp[]) => {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('div, section, li, dl, tr, p, span'))

  for (const element of elements) {
    const ownText = cleanText(element.textContent)
    if (!ownText || ownText.length > 180) {
      continue
    }

    const matchingLabel = labelPatterns.find((pattern) => pattern.test(ownText))
    if (!matchingLabel) {
      continue
    }

    const splitValue = ownText
      .replace(matchingLabel, '')
      .replace(/^[:-\s]+/, '')
      .trim()

    if (splitValue && splitValue.length < ownText.length) {
      return splitValue
    }

    const parentText = cleanText(element.parentElement?.textContent)
    const siblingText = cleanText(element.nextElementSibling?.textContent)

    if (siblingText && siblingText.length < 80) {
      return siblingText
    }

    if (parentText && parentText.length < 220) {
      return parentText.replace(matchingLabel, '').replace(/^[:-\s]+/, '').trim()
    }
  }

  return undefined
}

const regexValue = (patterns: RegExp[]) => {
  const text = pageText()

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return cleanText(match[1])
    }
  }

  return undefined
}

const valueFrom = (labels: RegExp[], patterns: RegExp[]) => nearbyValue(labels) || regexValue(patterns)

const extractRawFields = () => {
  const rawFields: Record<string, string> = {}
  const elements = Array.from(document.querySelectorAll<HTMLElement>('li, tr, dl, div, p'))

  elements.forEach((element) => {
    const text = cleanText(element.textContent)
    if (!text || text.length > 140) {
      return
    }

    const separatorMatch = text.match(/^([^:]{3,45}):\s*(.{1,80})$/)
    if (separatorMatch) {
      rawFields[separatorMatch[1]] = separatorMatch[2]
    }
  })

  return Object.keys(rawFields).length ? rawFields : undefined
}


const getStoredProperties = () =>
  new Promise<StoredProperty[]>((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (items) => {
      resolve(Array.isArray(items[STORAGE_KEY]) ? (items[STORAGE_KEY] as StoredProperty[]) : [])
    })
  })

const saveProperty = async (property: StoredProperty) => {
  const existing = await getStoredProperties()
  const matchKey = property.address.toLowerCase() || property.url
  const existingIndex = existing.findIndex(
    (storedProperty) => storedProperty.url === property.url || storedProperty.address.toLowerCase() === matchKey,
  )

  const nextProperties = [...existing]
  if (existingIndex >= 0) {
    nextProperties[existingIndex] = {
      ...nextProperties[existingIndex],
      ...property,
      sources: {
        ...nextProperties[existingIndex].sources,
        propertyCom: property.sources.propertyCom,
      },
    }
  } else {
    nextProperties.unshift(property)
  }

  chrome.storage.local.set({
    [STORAGE_KEY]: nextProperties.sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_SAVED_PROPERTIES),
  }, () => {
    debugLog('saved property profile', {
      address: property.address,
      url: property.url,
      total: nextProperties.length,
    })
  })
}

const collectPropertyProfile = async () => {
  if (!isPropertyComPage()) {
    debugLog('skipped capture: not property.com.au', { host: location.hostname })
    return
  }

  const readiness = profileReadiness()
  if (!readiness.isReady) {
    debugLog(`skipped capture: ${readiness.reason}`, {
      path: location.pathname,
      address: readiness.address,
      signals: readiness.signals,
    })
    return
  }

  const url = normalizeUrl(location.href)
  const address = readiness.address
  const title = titleFromDocument() || address

  if (!address || address.length < 5) {
    debugLog('skipped capture: missing address after readiness check', { url })
    return
  }

  const property = await scrapePropertyCom();

await saveProperty({
    id: makeId(address || url),
    title,
    address,
    url,
    savedAt: Date.now(),
    sources: {
        propertyCom: property,
    },
});
}

let collectTimer: number | undefined

const scheduleCollection = () => {
  window.clearTimeout(collectTimer)
  collectTimer = window.setTimeout(collectPropertyProfile, 700)
}

if (isPropertyComPage()) {
  debugLog('content script loaded', {
    url: location.href,
    readyState: document.readyState,
  })

  scheduleCollection()

  const observer = new MutationObserver(scheduleCollection)
  observer.observe(document.body, { childList: true, subtree: true })
}
