<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header">
      <div :class="[
        'header-shell q-px-lg q-py-sm',
        { 'header-shell--android-capacitor': isAndroidCapacitor },
      ]">
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
            <q-btn flat no-caps dense class="header-help-btn" icon="help_outline" label="Help"
              @click="helpOpen = true" />
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
          <q-btn flat round dense icon="close" aria-label="Close help" @click="helpOpen = false" />
        </q-card-section>

        <q-card-section class="help-card__content">
          <p>
            <strong>Presentation of the app</strong><br />
            Capriccio helps you work with location points used in
            Portuguese archaeology. It lets you read, convert, and compare the same place in three different
            coordinate systems.
          </p>

          <p>
            <strong>Rationale</strong><br />
            Archaeological notes, books, GPS tools, and official maps do not always
            use the same way of writing a location. This app gives you one place to translate from one
            format to another and check the result visually on the map.
          </p>

          <p>
            <strong>The three coordinate systems</strong><br />
            <strong>EPSG:4326</strong> called also <strong>WGS84</strong> is the common latitude and longitude format
            used by GPS and online maps.<br />
            <strong>EPSG:3763</strong> is <strong>ETRS89</strong> / <strong>Portugal TM06</strong>, a metric coordinate
            system used in some Portuguese mapping.<br />
            <strong>Book M / P</strong> is the shorthand style found in older archaeological publications and field
            references.
          </p>

          <p>
            <strong>App functionality</strong><br />
            You can type coordinates in any of the three sections, paste them
            from the clipboard, convert them to the other two systems, copy the result, use sample presets,
            and click on the map to pick a point. When you click the map, the marker moves and all three
            coordinate sections are updated automatically.
          </p>

          <p>
            <strong>Paste formats:</strong><br />
            <strong>EPSG:4326</strong>: paste expects latitude then longitude, for example
            37.1388155, -8.5385212.<br />
            <strong>EPSG:3763</strong> paste expects easting then northing, for example
            -6644.124, -109920.925.<br />
            <strong>Book M / P</strong>: paste expects the book pair, for example M-230.5 P-013.6.
          </p>

          <p>
            <strong>Technical note on Book M / P</strong><br />
            The book notation does not have its own public EPSG code. In this app it is treated as a shorthand for an
            older <strong>Hayford-Gauss / Datum Lisboa</strong> projected grid, implemented with a
            <strong>Transverse Mercator</strong> definition in <strong>proj4</strong> using an
            <strong>ESRI:102164-style</strong> parameter set. The conversion path used by the app is therefore
            <strong>Book M / P ⇄ Hayford-Gauss / Datum Lisboa ⇄ WGS84 / EPSG:4326</strong>, and from there to
            <strong>ETRS89 / Portugal TM06 / EPSG:3763</strong>. The algorithm used here comes from those embedded
            projection parameters rather than from a dedicated official specification for the shorthand itself.
          </p>

          <p>
            <strong>Copyright.</strong> Michel Gouget 2026, gurzixo AT platinn DOT com.
          </p>

          <p>
            <strong>License.</strong> MIT.
          </p>

          <p>
            <strong>Repository.</strong>
            <a href="https://github.com/mgurzixo/capriccio" target="_blank" rel="noopener noreferrer">
              https://github.com/mgurzixo/capriccio
            </a>
          </p>

        </q-card-section>

        <q-card-actions align="right" class="help-card__actions">
          <q-btn color="primary" label="Close" @click="helpOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import capriccioLogo from 'src/assets/capriccio-logo.svg';

const $q = useQuasar();
const helpOpen = ref(false);
const isAndroidCapacitor = $q.platform.is.capacitor === true && $q.platform.is.android === true;
</script>
