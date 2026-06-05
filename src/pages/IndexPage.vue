<template>
  <q-page class="page-shell">
    <div class="page-grid">
      <section class="panel-stack">
        <q-card class="system-card compact-card">
          <q-card-section class="system-header">
            <div class="system-header-main">
              <div class="system-header-row">
                <div class="system-title">EPSG:4326</div>
                <div class="system-actions">
                  <q-btn
                    flat
                    round
                    dense
                    class="header-icon-btn"
                    icon="content_paste"
                    aria-label="Paste EPSG:4326"
                    @click="pasteGroup('wgs84')"
                  >
                    <q-tooltip>Paste latitude and longitude from the clipboard</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    class="header-icon-btn"
                    icon="content_copy"
                    aria-label="Copy EPSG:4326"
                    @click="copyGroup('wgs84')"
                  >
                    <q-tooltip>Copy latitude and longitude to the clipboard</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <div class="system-caption">Latitude / Longitude</div>
            </div>
          </q-card-section>

          <q-card-section class="field-grid">
            <q-input v-model="form.wgs84.latitude" dense outlined label="Latitude">
              <q-tooltip>Enter the latitude in decimal degrees</q-tooltip>
            </q-input>
            <q-input v-model="form.wgs84.longitude" dense outlined label="Longitude">
              <q-tooltip>Enter the longitude in decimal degrees</q-tooltip>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="compact-actions">
            <q-btn color="primary" label="Use EPSG:4326" @click="convertFrom('wgs84')">
              <q-tooltip>Convert from latitude and longitude</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>

        <q-card class="system-card compact-card">
          <q-card-section class="system-header">
            <div class="system-header-main">
              <div class="system-header-row">
                <div class="system-title">EPSG:3763</div>
                <div class="system-actions">
                  <q-btn
                    flat
                    round
                    dense
                    class="header-icon-btn"
                    icon="content_paste"
                    aria-label="Paste EPSG:3763"
                    @click="pasteGroup('tm06')"
                  >
                    <q-tooltip>Paste easting and northing from the clipboard</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    class="header-icon-btn"
                    icon="content_copy"
                    aria-label="Copy EPSG:3763"
                    @click="copyGroup('tm06')"
                  >
                    <q-tooltip>Copy easting and northing to the clipboard</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <div class="system-caption">ETRS89 / Portugal TM06</div>
            </div>
          </q-card-section>

          <q-card-section class="field-grid">
            <q-input v-model="form.tm06.easting" dense outlined label="Easting">
              <q-tooltip>Enter the easting in meters</q-tooltip>
            </q-input>
            <q-input v-model="form.tm06.northing" dense outlined label="Northing">
              <q-tooltip>Enter the northing in meters</q-tooltip>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="compact-actions">
            <q-btn color="secondary" label="Use EPSG:3763" @click="convertFrom('tm06')">
              <q-tooltip>Convert from Portugal TM06 coordinates</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>

        <q-card class="system-card accent-card compact-card">
          <q-card-section class="system-header">
            <div class="system-header-main">
              <div class="system-header-row">
                <div class="system-title">Book M / P</div>
                <div class="system-actions">
                  <q-btn
                    flat
                    round
                    dense
                    class="header-icon-btn"
                    icon="content_paste"
                    aria-label="Paste book coordinates"
                    @click="pasteGroup('book')"
                  >
                    <q-tooltip>Paste book M and P values from the clipboard</q-tooltip>
                  </q-btn>
                  <q-btn
                    flat
                    round
                    dense
                    class="header-icon-btn"
                    icon="content_copy"
                    aria-label="Copy book coordinates"
                    @click="copyGroup('book')"
                  >
                    <q-tooltip>Copy book M and P values to the clipboard</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <div class="system-caption">Book shorthand</div>
            </div>
          </q-card-section>

          <q-card-section class="field-grid">
            <q-input v-model="form.book.meridiana" dense outlined label="M">
              <q-tooltip>Enter the book meridiana value</q-tooltip>
            </q-input>
            <q-input v-model="form.book.perpendicular" dense outlined label="P">
              <q-tooltip>Enter the book perpendicular value</q-tooltip>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="compact-actions">
            <q-btn color="accent" label="Decode Book Coords" @click="convertFrom('book')">
              <q-tooltip>Convert from book M and P coordinates</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </section>

      <section class="map-stack">
        <LeafletMap :point="mapPoint" @map-click="updateFromMapClick" />
      </section>
    </div>

    <q-card class="system-card preset-card page-footer-card">
      <q-card-section class="preset-card-header">
        <div>
          <div class="system-title">Sample Presets</div>
          <div class="system-caption">Olhão page, folha 607-4</div>
        </div>
      </q-card-section>

      <q-card-section class="preset-grid">
        <q-btn
          v-for="preset in samplePresets"
          :key="preset.title"
          outline
          no-caps
          class="preset-btn"
          @click="applyPreset(preset)"
        >
          <div class="preset-btn__title">{{ preset.title }}</div>
          <div class="preset-btn__meta">{{ preset.subtitle }}</div>
          <div class="preset-btn__coords">{{ preset.coords }}</div>
          <q-tooltip>Load the {{ preset.title }} sample coordinates</q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import LeafletMap from 'components/LeafletMap.vue'
import { summaryState } from 'src/lib/summaryState'
import {
  formatBookLabel,
  formatBookShort,
  formatBookText,
  formatLatLon,
  formatMeters,
  from3763,
  from4326,
  fromBookCoordinates,
  normalizeBookValue,
  parseCoordinateText,
} from 'src/lib/coordinates'

const $q = useQuasar()

const form = reactive({
  wgs84: {
    latitude: '',
    longitude: '',
  },
  tm06: {
    easting: '',
    northing: '',
  },
  book: {
    meridiana: '',
    perpendicular: '',
  },
})

const mapPoint = ref(null)

const samplePresets = [
  {
    title: 'Moncarapacho',
    subtitle: 'Represa · Romano',
    meridiana: '230.5',
    perpendicular: '13.6',
    coords: 'M-230.5 P-013.6',
  },
  {
    title: 'Horta do Padre Graca',
    subtitle: 'Vestigios diversos · Romano',
    meridiana: '230.6',
    perpendicular: '13.3',
    coords: 'M-230.6 P-013.3',
  },
  {
    title: 'Alfanxia',
    subtitle: 'Vestigios diversos · Romano',
    meridiana: '231.8',
    perpendicular: '11.2',
    coords: 'M-231.8 P-011.2',
  },
  {
    title: 'Paraiso',
    subtitle: 'Achado · Medieval',
    meridiana: '224.1',
    perpendicular: '10.9',
    coords: 'M-224.1 P-010.9',
  },
]

function notify(type, message) {
  $q.notify({
    type,
    message,
    position: 'top-right',
  })
}

function applyResult(result) {
  form.wgs84.latitude = formatLatLon(result.wgs84.latitude)
  form.wgs84.longitude = formatLatLon(result.wgs84.longitude)
  form.tm06.easting = formatMeters(result.tm06.easting)
  form.tm06.northing = formatMeters(result.tm06.northing)
  form.book.meridiana = formatBookShort(result.book.meridiana)
  form.book.perpendicular = formatBookShort(result.book.perpendicular)

  summaryState.wgs84 = `${formatLatLon(result.wgs84.latitude)}, ${formatLatLon(result.wgs84.longitude)}`
  summaryState.tm06 = `${formatMeters(result.tm06.easting)}, ${formatMeters(result.tm06.northing)}`
  summaryState.book = formatBookLabel(result.book.meridiana, result.book.perpendicular)

  mapPoint.value = {
    latitude: result.mapPoint.latitude,
    longitude: result.mapPoint.longitude,
    label: `${formatLatLon(result.mapPoint.latitude)}, ${formatLatLon(result.mapPoint.longitude)}`,
  }
}

function convertFrom(source) {
  try {
    let result

    if (source === 'wgs84') {
      result = from4326(form.wgs84.latitude, form.wgs84.longitude)
    } else if (source === 'tm06') {
      result = from3763(form.tm06.easting, form.tm06.northing)
    } else {
      result = fromBookCoordinates(form.book.meridiana, form.book.perpendicular)
    }

    applyResult(result)
    notify('positive', 'Coordinates converted successfully.')
  } catch (error) {
    notify('negative', error.message)
  }
}

function updateFromMapClick(point) {
  try {
    applyResult(from4326(point.latitude, point.longitude))
  } catch (error) {
    notify('negative', error.message)
  }
}

function applyPreset(preset) {
  form.book.meridiana = preset.meridiana
  form.book.perpendicular = preset.perpendicular
  convertFrom('book')
}

async function copyGroup(group) {
  try {
    let text

    if (group === 'wgs84') {
      text = `${form.wgs84.latitude}, ${form.wgs84.longitude}`
    } else if (group === 'tm06') {
      text = `${form.tm06.easting}, ${form.tm06.northing}`
    } else {
      text = formatBookText(form.book.meridiana, form.book.perpendicular)
    }

    await copyToClipboard(text)
    notify('positive', 'Coordinates copied to the clipboard.')
  } catch (error) {
    notify('negative', error.message || 'Unable to copy coordinates.')
  }
}

async function pasteGroup(group) {
  try {
    const text = await navigator.clipboard.readText()
    const [first, second] = parseCoordinateText(text)

    if (group === 'wgs84') {
      form.wgs84.latitude = String(first)
      form.wgs84.longitude = String(second)
    } else if (group === 'tm06') {
      form.tm06.easting = String(first)
      form.tm06.northing = String(second)
    } else {
      form.book.meridiana = normalizeBookValue(first)
      form.book.perpendicular = normalizeBookValue(second)
    }

    notify('positive', 'Coordinates pasted from the clipboard.')
  } catch (error) {
    notify('negative', error.message || 'Unable to read the clipboard.')
  }
}
</script>
