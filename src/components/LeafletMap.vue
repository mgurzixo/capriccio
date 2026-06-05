<template>
  <div class="map-card">
    <div ref="mapElement" class="map-canvas" />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  point: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['map-click'])

const mapElement = ref(null)

let mapInstance
let tileLayer
let pointLayer

function refocusMapWithoutScroll(event) {
  if (!mapInstance || !event || event.screenX <= 0 || event.screenY <= 0) {
    return
  }

  const mapContainer = mapInstance.getContainer()

  try {
    mapContainer.focus({ preventScroll: true })
  } catch {
    mapContainer.focus()
  }
}

function setupZoomControl(control, label) {
  if (!control) {
    return
  }

  control.title = label
  control.setAttribute('aria-label', label)

  if (mapInstance?.zoomControl?._refocusOnMap) {
    L.DomEvent.off(control, 'click', mapInstance.zoomControl._refocusOnMap, mapInstance.zoomControl)
    L.DomEvent.on(control, 'click', refocusMapWithoutScroll)
  }
}

function updatePoint(point) {
  if (!mapInstance || !point) {
    return
  }

  const latLng = [point.latitude, point.longitude]

  if (!pointLayer) {
    pointLayer = L.circleMarker(latLng, {
      radius: 10,
      weight: 3,
      color: '#15334a',
      fillColor: '#e6492d',
      fillOpacity: 0.95,
    }).addTo(mapInstance)
  } else {
    pointLayer.setLatLng(latLng)
  }

  pointLayer.bindTooltip(point.label, { direction: 'top' })
  mapInstance.panTo(latLng, { animate: true })
}

function applyMapTooltips() {
  if (!mapElement.value) {
    return
  }

  mapElement.value.title = 'Click the map to set the current coordinates'

  const zoomInControl = mapElement.value.querySelector('.leaflet-control-zoom-in')
  const zoomOutControl = mapElement.value.querySelector('.leaflet-control-zoom-out')

  setupZoomControl(zoomInControl, 'Zoom in')
  setupZoomControl(zoomOutControl, 'Zoom out')
}

onMounted(() => {
  mapInstance = L.map(mapElement.value, {
    zoomControl: true,
  }).setView([39.5, -8.0], 6)

  tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  })

  tileLayer.addTo(mapInstance)
  mapInstance.on('click', (event) => {
    emit('map-click', {
      latitude: event.latlng.lat,
      longitude: event.latlng.lng,
    })
  })
  applyMapTooltips()
  updatePoint(props.point)
})

watch(
  () => props.point,
  (point) => {
    updatePoint(point)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
  }
})
</script>
