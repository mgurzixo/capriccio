import proj4 from 'proj4'

const EPSG4326 = 'EPSG:4326'
const EPSG3763 = 'EPSG:3763'
const HAYFORD_GAUSS = 'ESRI:102164'

proj4.defs(
  EPSG3763,
  '+proj=tmerc +lat_0=39.6682583333333 +lon_0=-8.13310833333333 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
)

proj4.defs(
  HAYFORD_GAUSS,
  '+proj=tmerc +lat_0=39.6666666666667 +lon_0=-8.13190611111111 +k=1 +x_0=200000 +y_0=300000 +ellps=intl +towgs84=-288.885,-91.744,126.244,-1.691,0.41,-0.211,-4.598 +units=m +no_defs +type=crs',
)

function parseNumber(value, label) {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.')

  if (normalized.length === 0) {
    throw new Error(`${label} is required.`)
  }

  const parsed = Number(normalized)

  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be numeric.`)
  }

  return parsed
}

function assertLatLon(latitude, longitude) {
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90.')
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180.')
  }
}

function toBookMeters(value, label) {
  const parsed = parseNumber(value, label)
  return Math.abs(parsed) < 1000 ? parsed * 1000 : parsed
}

export function from4326(latitudeValue, longitudeValue) {
  const latitude = parseNumber(latitudeValue, 'Latitude')
  const longitude = parseNumber(longitudeValue, 'Longitude')
  assertLatLon(latitude, longitude)

  const [tm06Easting, tm06Northing] = proj4(EPSG4326, EPSG3763, [longitude, latitude])
  const [bookMeridiana, bookPerpendicular] = proj4(EPSG4326, HAYFORD_GAUSS, [longitude, latitude])

  return {
    wgs84: {
      latitude,
      longitude,
    },
    tm06: {
      easting: tm06Easting,
      northing: tm06Northing,
    },
    book: {
      meridiana: bookMeridiana,
      perpendicular: bookPerpendicular,
    },
    mapPoint: {
      latitude,
      longitude,
    },
  }
}

export function from3763(eastingValue, northingValue) {
  const easting = parseNumber(eastingValue, 'TM06 Easting')
  const northing = parseNumber(northingValue, 'TM06 Northing')
  const [longitude, latitude] = proj4(EPSG3763, EPSG4326, [easting, northing])

  return from4326(latitude, longitude)
}

export function fromBookCoordinates(meridianaValue, perpendicularValue) {
  const meridiana = toBookMeters(meridianaValue, 'Book M')
  const perpendicular = toBookMeters(perpendicularValue, 'Book P')
  const [longitude, latitude] = proj4(HAYFORD_GAUSS, EPSG4326, [meridiana, perpendicular])

  return from4326(latitude, longitude)
}

export function formatLatLon(value) {
  return value.toFixed(6)
}

export function formatMeters(value) {
  return value.toFixed(3)
}

export function formatBookShort(value) {
  return (value / 1000).toFixed(1)
}

export function formatBookLabel(meridiana, perpendicular) {
  return `M-${formatBookShort(meridiana)} P-${formatBookShort(perpendicular)}`
}

export function parseCoordinateText(text) {
  const values = String(text ?? '')
    .replace(/([A-Za-z])-(\d)/g, '$1 $2')
    .match(/[-+]?\d+(?:[.,]\d+)?/g)
    ?.map((value) => Number(value.replace(',', '.')))

  if (!values || values.length < 2) {
    throw new Error('Paste must include two numeric values.')
  }

  return [values[0], values[1]]
}

export function normalizeBookValue(value) {
  const meters = toBookMeters(value, 'Book coordinate')
  return formatBookShort(meters)
}

export function formatBookText(meridianaValue, perpendicularValue) {
  const meridiana = toBookMeters(meridianaValue, 'Book M')
  const perpendicular = toBookMeters(perpendicularValue, 'Book P')
  return formatBookLabel(meridiana, perpendicular)
}
