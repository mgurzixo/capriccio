<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header">
      <div
        :class="[
          'header-shell q-px-lg q-py-sm',
          { 'header-shell--android-capacitor': isAndroidCapacitor },
        ]"
      >
        <q-toolbar class="header-toolbar q-pa-none">
          <q-toolbar-title class="toolbar-brand">
            <img class="toolbar-logo" :src="capriccioLogo" alt="Capriccio logo" />
            <div>
              <div class="toolbar-title">Capriccio</div>
              <div class="toolbar-subtitle">Portugal archaeology coordinates</div>
            </div>
          </q-toolbar-title>

          <div class="header-actions">
            <div class="toolbar-caption">EPSG:4326 · EPSG:3763 · M/P</div>
            <q-btn
              flat
              no-caps
              dense
              class="header-help-btn"
              icon="help_outline"
              label="Help"
              @click="helpOpen = true"
            >
              <q-tooltip>Open the usage guide</q-tooltip>
            </q-btn>
          </div>
        </q-toolbar>
      </div>
    </q-header>

    <q-dialog v-model="helpOpen">
      <q-card class="help-card">
        <q-card-section class="help-card__header row items-start no-wrap">
          <div class="col">
            <div class="help-card__title">Capriccio Help</div>
            <div class="help-card__subtitle">Simple guide for using the app</div>
          </div>
          <q-btn flat round dense icon="close" aria-label="Close help" @click="helpOpen = false">
            <q-tooltip>Close the help dialog</q-tooltip>
          </q-btn>
        </q-card-section>

        <q-card-section class="help-card__content">
          <p>
            <strong>Presentation of the app.</strong> Capriccio helps you work with location points
            used in Portuguese archaeology. It lets you read, convert, and compare the same place in
            three different coordinate systems.
          </p>

          <p>
            <strong>Rationale.</strong> Archaeological notes, books, GPS tools, and official maps do
            not always use the same way of writing a location. This app gives you one place to
            translate from one format to another and check the result visually on the map.
          </p>

          <p>
            <strong>The three coordinate systems.</strong> EPSG:4326 is the common latitude and
            longitude format used by GPS and online maps. EPSG:3763 is ETRS89 / Portugal TM06, a
            metric coordinate system used in Portuguese mapping. Book M / P is the shorthand style
            found in older Portuguese archaeological publications and field references, especially
            entries derived from the Carta Arqueologica de Portugal tradition. In projection terms,
            it is a Hayford-Gauss projected grid, which is a Transverse Mercator system written in
            abbreviated M and P values.
          </p>

          <p>
            <strong>App functionality.</strong> You can type coordinates in any of the three
            sections, paste them from the clipboard, convert them to the other two systems, copy the
            result, use sample presets, and click on the map to pick a point. When you click the
            map, the marker moves and all three coordinate sections are updated automatically.
          </p>

          <p><strong>Copyright.</strong> Michel Gouget 2026, gurzixo@platinn.com.</p>

          <p><strong>License.</strong> MIT.</p>
        </q-card-section>

        <q-card-actions align="right" class="help-card__actions">
          <q-btn color="primary" label="Close" @click="helpOpen = false">
            <q-tooltip>Close the help dialog</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import capriccioLogo from 'src/assets/capriccio-logo.svg'

const $q = useQuasar()
const helpOpen = ref(false)
const isAndroidCapacitor = $q.platform.is.capacitor === true && $q.platform.is.android === true
</script>
