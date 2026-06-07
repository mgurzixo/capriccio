<template>
  <div class="map-card">
    <div ref="mapElement" class="map-canvas" />
    <div v-if="zoomReady" class="map-control-stack">
      <button
        type="button"
        class="map-site-toggle"
        :aria-pressed="props.showSites === true"
        :aria-label="props.showSites ? 'Hide archaeological sites' : 'Show archaeological sites'"
        :title="props.showSites ? 'Hide archaeological sites' : 'Show archaeological sites'"
        @click.stop.prevent="emit('toggle-sites')"
      >
        <span class="map-site-toggle__icon" aria-hidden="true">🏛</span>
      </button>

      <div
        class="map-zoom-slider"
        @pointerdown.stop.prevent
        @click.stop.prevent
        @dblclick.stop.prevent
        @wheel.stop.prevent
      >
        <button
          type="button"
          class="map-zoom-slider__label"
          aria-label="Zoom in"
          @click.stop.prevent="zoomIn"
        >
          +
        </button>
        <div
          ref="zoomTrackWrap"
          class="map-zoom-slider__track-wrap"
          @pointerdown.stop.prevent="handleTrackPointerDown"
        >
          <div class="map-zoom-slider__track" />
          <div class="map-zoom-slider__fill" :style="zoomFillStyle" />
          <div
            class="map-zoom-slider__thumb"
            :style="zoomThumbStyle"
            @pointerdown.stop.prevent="handleThumbPointerDown"
          />
        </div>
        <button
          type="button"
          class="map-zoom-slider__label"
          aria-label="Zoom out"
          @click.stop.prevent="zoomOut"
        >
          -
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  point: {
    type: Object,
    default: null,
  },
  sites: {
    type: Array,
    default: () => [],
  },
  showSites: {
    type: Boolean,
    default: false,
  },
  selectedSiteId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['map-click', 'site-select', 'site-copy', 'toggle-sites'])

const mapElement = ref(null)
const zoomTrackWrap = ref(null)
const zoomLevel = ref(6)

const minZoom = 3
const maxZoom = 19
const sliderSteps = 1000
const zoomReady = ref(false)
const thumbSize = 18

let mapInstance
let tileLayer
let pointLayer
let siteLayer
let isZoomDragging = false
let zoomDragOffsetY = 0
const siteMarkersById = new Map()

const defaultSiteMarkerStyle = {
  radius: 7,
  weight: 2,
  color: '#15334a',
  fillColor: '#d7a441',
  fillOpacity: 0.9,
}

const selectedSiteMarkerStyle = {
  radius: 9,
  weight: 3,
  color: '#15334a',
  fillColor: '#3f8a83',
  fillOpacity: 0.95,
}

function setMapInteractionsEnabled(enabled) {
  if (!mapInstance) {
    return
  }

  const action = enabled ? 'enable' : 'disable'

  mapInstance.dragging[action]()
  mapInstance.touchZoom[action]()
  mapInstance.doubleClickZoom[action]()
  mapInstance.boxZoom[action]()
  mapInstance.keyboard[action]()
}

function stopEventPropagation(event) {
  event.preventDefault()
  event.stopPropagation()
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function handleWindowKeydown(event) {
  if (!mapInstance || isTypingTarget(event.target)) {
    return
  }

  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomIn()
    return
  }

  if (event.key === '-' || event.key === '_') {
    event.preventDefault()
    zoomOut()
  }
}

const zoomRatio = computed(() => {
  if (sliderSteps <= 0) {
    return 0
  }

  return Number(zoomLevel.value) / sliderSteps
})

const zoomThumbStyle = computed(() => ({
  bottom: `calc(${zoomRatio.value * 100}% - ${thumbSize / 2}px)`,
}))

const zoomFillStyle = computed(() => ({
  height: `${zoomRatio.value * 100}%`,
}))

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

function getSiteCoordinateLabel(site) {
  return `${site.latitude.toFixed(6)}, ${site.longitude.toFixed(6)}`
}

function getSiteLocationLabel(site) {
  return [site.parish, site.municipality].filter(Boolean).join(' · ')
}

function buildSitePopupContent(site) {
  const container = document.createElement('div')
  container.className = 'map-site-popup'

  const title = document.createElement('div')
  title.className = 'map-site-popup__title'
  title.textContent = site.name
  container.appendChild(title)

  const location = getSiteLocationLabel(site)

  if (location) {
    const locationNode = document.createElement('div')
    locationNode.className = 'map-site-popup__location'
    locationNode.textContent = location
    container.appendChild(locationNode)
  }

  const coordinates = document.createElement('div')
  coordinates.className = 'map-site-popup__coords'
  coordinates.textContent = getSiteCoordinateLabel(site)
  container.appendChild(coordinates)

  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.className = 'map-site-popup__copy'
  copyButton.textContent = 'Copy coordinates'
  copyButton.addEventListener('click', (event) => {
    stopEventPropagation(event)
    emit('site-copy', site)
  })
  container.appendChild(copyButton)

  return container
}

function applySelectedSiteMarkerStyle() {
  siteMarkersById.forEach((marker, markerId) => {
    marker.setStyle(markerId === props.selectedSiteId ? selectedSiteMarkerStyle : defaultSiteMarkerStyle)
  })
}

function focusSelectedSite(openPopup = false) {
  if (!mapInstance || props.showSites !== true || !props.selectedSiteId) {
    return
  }

  const marker = siteMarkersById.get(props.selectedSiteId)

  if (!marker) {
    return
  }

  marker.bringToFront()
  mapInstance.panTo(marker.getLatLng(), { animate: true })

  if (openPopup) {
    marker.openPopup()
  }
}

function updateSites() {
  if (!mapInstance) {
    return
  }

  if (!siteLayer) {
    siteLayer = L.layerGroup()
  }

  siteLayer.clearLayers()
  siteMarkersById.clear()

  if (mapInstance.hasLayer(siteLayer)) {
    mapInstance.removeLayer(siteLayer)
  }

  if (props.showSites !== true) {
    return
  }

  props.sites.forEach((site) => {
    const marker = L.circleMarker(
      [site.latitude, site.longitude],
      site.id === props.selectedSiteId ? selectedSiteMarkerStyle : defaultSiteMarkerStyle,
    )

    marker.bindPopup(buildSitePopupContent(site), {
      autoPan: true,
      closeButton: true,
    })
    marker.on('click', () => {
      emit('site-select', site)
    })
    marker.addTo(siteLayer)
    siteMarkersById.set(site.id, marker)
  })

  siteLayer.addTo(mapInstance)
  applySelectedSiteMarkerStyle()
  focusSelectedSite(true)
}

function syncZoomLevel() {
  if (!mapInstance) {
    return
  }

  const range = maxZoom - minZoom

  if (range <= 0) {
    zoomLevel.value = 0
    return
  }

  const ratio = (mapInstance.getZoom() - minZoom) / range
  zoomLevel.value = Math.min(sliderSteps, Math.max(0, ratio * sliderSteps))
}

function setZoom(nextZoom, options = {}) {
  if (!mapInstance) {
    return
  }

  const clampedZoom = Math.min(maxZoom, Math.max(minZoom, nextZoom))
  mapInstance.setZoom(clampedZoom, options)
}

function getClampedIntegerZoom(direction) {
  if (!mapInstance) {
    return minZoom
  }

  const currentZoom = mapInstance.getZoom()
  const nearestIntegerZoom = Math.round(currentZoom)
  const isIntegerZoom = Math.abs(currentZoom - nearestIntegerZoom) < 0.000001

  let nextZoom

  if (direction > 0) {
    nextZoom = isIntegerZoom ? nearestIntegerZoom + 1 : Math.ceil(currentZoom)
  } else {
    nextZoom = isIntegerZoom ? nearestIntegerZoom - 1 : Math.floor(currentZoom)
  }

  return Math.min(maxZoom, Math.max(minZoom, nextZoom))
}

function zoomIn() {
  if (!mapInstance) {
    return
  }

  const targetZoom = getClampedIntegerZoom(1)

  if (targetZoom === mapInstance.getZoom()) {
    return
  }

  mapInstance.stop()
  setZoom(targetZoom)
}

function zoomOut() {
  if (!mapInstance) {
    return
  }

  const targetZoom = getClampedIntegerZoom(-1)

  if (targetZoom === mapInstance.getZoom()) {
    return
  }

  mapInstance.stop()
  setZoom(targetZoom)
}

function updateZoomFromPointer(clientY) {
  const trackBounds = zoomTrackWrap.value?.getBoundingClientRect()

  if (!trackBounds) {
    return
  }

  const effectiveClientY = clientY - zoomDragOffsetY
  const offsetFromBottom = trackBounds.bottom - effectiveClientY
  const ratio = Math.min(1, Math.max(0, offsetFromBottom / trackBounds.height))
  const sliderValue = ratio * sliderSteps
  const nextZoom = minZoom + (sliderValue / sliderSteps) * (maxZoom - minZoom)

  setZoom(nextZoom, { animate: true })
}

function handleZoomPointerMove(event) {
  if (!isZoomDragging) {
    return
  }

  stopEventPropagation(event)
  updateZoomFromPointer(event.clientY)
}

function stopZoomDrag(event) {
  if (event) {
    stopEventPropagation(event)
  }

  isZoomDragging = false
  zoomDragOffsetY = 0
  setMapInteractionsEnabled(true)

  if (zoomTrackWrap.value && event?.pointerId !== undefined) {
    zoomTrackWrap.value.releasePointerCapture(event.pointerId)
  }

  window.removeEventListener('pointermove', handleZoomPointerMove)
  window.removeEventListener('pointerup', stopZoomDrag)
  window.removeEventListener('pointercancel', stopZoomDrag)
}

function startZoomDrag(event, dragOffsetY = 0) {
  isZoomDragging = true
  zoomDragOffsetY = dragOffsetY
  setMapInteractionsEnabled(false)

  if (zoomTrackWrap.value && event.pointerId !== undefined) {
    zoomTrackWrap.value.setPointerCapture(event.pointerId)
  }

  window.addEventListener('pointermove', handleZoomPointerMove)
  window.addEventListener('pointerup', stopZoomDrag)
  window.addEventListener('pointercancel', stopZoomDrag)
}

function handleTrackPointerDown(event) {
  if (event.button !== 0) {
    return
  }

  stopEventPropagation(event)
  startZoomDrag(event, 0)
  updateZoomFromPointer(event.clientY)
}

function handleThumbPointerDown(event) {
  if (event.button !== 0) {
    return
  }

  stopEventPropagation(event)
  const trackBounds = zoomTrackWrap.value?.getBoundingClientRect()

  if (!trackBounds) {
    return
  }

  const thumbCenterY = trackBounds.bottom - zoomRatio.value * trackBounds.height
  startZoomDrag(event, event.clientY - thumbCenterY)
}

onMounted(() => {
  mapInstance = L.map(mapElement.value, {
    zoomControl: false,
    minZoom,
    maxZoom,
    zoomSnap: 0,
    zoomDelta: 1,
  }).setView([39.5, -8.0], 6)

  L.control
    .scale({
      position: 'bottomleft',
      metric: true,
      imperial: false,
    })
    .addTo(mapInstance)

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
  mapInstance.on('zoomend', syncZoomLevel)
  window.addEventListener('keydown', handleWindowKeydown)
  mapElement.value.title = 'Click the map to set the current coordinates'
  updatePoint(props.point)
  updateSites()
  syncZoomLevel()
  zoomReady.value = true
})

watch(
  () => props.point,
  (point) => {
    updatePoint(point)
  },
  { deep: true },
)

watch(
  () => [props.showSites, props.sites],
  () => {
    updateSites()
  },
  { deep: true },
)

watch(
  () => props.selectedSiteId,
  (selectedSiteId) => {
    applySelectedSiteMarkerStyle()

    if (selectedSiteId) {
      focusSelectedSite(true)
    }
  },
)

onBeforeUnmount(() => {
  stopZoomDrag()

  if (mapInstance) {
    mapInstance.off('zoomend', syncZoomLevel)
    mapInstance.remove()
  }

  window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<style scoped>
.map-card {
  position: relative;
}

.map-control-stack {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 500;
  display: grid;
  gap: 10px;
}

.map-site-toggle {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid rgba(21, 51, 74, 0.14);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 249, 239, 0.97), rgba(243, 235, 221, 0.94));
  box-shadow: 0 10px 28px rgba(21, 51, 74, 0.2);
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 120ms ease;
}

.map-site-toggle:hover,
.map-site-toggle:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(21, 51, 74, 0.24);
}

.map-site-toggle[aria-pressed='true'] {
  background: linear-gradient(180deg, rgba(230, 243, 239, 0.98), rgba(201, 228, 221, 0.95));
}

.map-site-toggle__icon {
  font-size: 1.05rem;
  line-height: 1;
}

.map-zoom-slider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 38px;
  padding: 10px 0 12px;
  border-radius: 16px;
  border: 1px solid rgba(21, 51, 74, 0.14);
  background: linear-gradient(180deg, rgba(255, 249, 239, 0.97), rgba(243, 235, 221, 0.94));
  box-shadow: 0 10px 28px rgba(21, 51, 74, 0.2);
  backdrop-filter: blur(10px);
  user-select: none;
  touch-action: none;
  pointer-events: auto;
}

.map-zoom-slider__label {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  color: #15334a;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  border-radius: 999px;
  background: rgba(21, 51, 74, 0.06);
  cursor: pointer;
  transition:
    background-color 120ms ease,
    transform 120ms ease;
}

.map-zoom-slider__label:hover {
  background: rgba(21, 51, 74, 0.12);
}

.map-zoom-slider__label:active {
  transform: scale(0.96);
}

.map-zoom-slider__track-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  width: 24px;
  height: 180px;
  touch-action: none;
  cursor: ns-resize;
}

.map-zoom-slider__track,
.map-zoom-slider__fill {
  position: absolute;
  left: 50%;
  width: 8px;
  border-radius: 999px;
  transform: translateX(-50%);
}

.map-zoom-slider__track {
  top: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(21, 51, 74, 0.08), rgba(21, 51, 74, 0.18));
}

.map-zoom-slider__fill {
  bottom: 0;
  background: linear-gradient(180deg, #4f738f, #15334a);
}

.map-zoom-slider__thumb {
  position: absolute;
  left: 50%;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 249, 239, 0.92);
  border-radius: 999px;
  background: #15334a;
  box-shadow: 0 4px 12px rgba(21, 51, 74, 0.24);
  transform: translate(-50%, 50%);
  cursor: grab;
  touch-action: none;
  transition: box-shadow 120ms ease;
}

.map-zoom-slider__track-wrap:active .map-zoom-slider__thumb {
  cursor: grabbing;
  box-shadow: 0 6px 16px rgba(21, 51, 74, 0.3);
}

:global(.map-site-popup) {
  display: grid;
  gap: 6px;
  min-width: 220px;
}

:global(.map-site-popup__title) {
  font-weight: 700;
  color: #15334a;
}

:global(.map-site-popup__location) {
  color: rgba(21, 51, 74, 0.78);
  font-size: 0.86rem;
}

:global(.map-site-popup__coords) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.84rem;
  color: #15334a;
}

:global(.map-site-popup__copy) {
  justify-self: start;
  padding: 6px 10px;
  border: 0;
  border-radius: 999px;
  color: #fff9f1;
  font-weight: 700;
  background: linear-gradient(135deg, #15334a, #29516f 72%);
  cursor: pointer;
}

@media (max-width: 640px) {
  .map-control-stack {
    top: 10px;
    left: 10px;
  }
}
</style>
