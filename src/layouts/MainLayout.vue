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
            <div class="toolbar-caption">EPSG:4326 · EPSG:3763 · C.A.P. M/P · Gauss X/Y</div>
            <q-btn flat no-caps dense class="header-help-btn" icon="help_outline" label="Help"
              @click="helpOpen = true" />
          </div>
        </q-toolbar>
      </div>
    </q-header>

    <q-dialog v-model="helpOpen" class="help-dialog">
      <q-card class="help-card full-width">
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
            Portuguese archaeology. It lets you read, convert, and compare the same place across four input cards:
            two modern coordinate reference systems and two legacy archaeological notations.
          </p>

          <p>
            <strong>Rationale</strong><br />
            Archaeological notes, books, GPS tools, and official maps do not always
            use the same way of writing a location. This app gives you one place to translate from one
            format to another and check the result visually on the map.
          </p>

          <p>
            <strong>The four formats used by the app</strong><br />
            <strong>EPSG:4326</strong> called also <strong>WGS84</strong> is the common latitude and longitude format
            used by GPS and online maps.<br />
            <strong>EPSG:3763</strong> is <strong>ETRS89</strong> / <strong>Portugal TM06</strong>, a metric coordinate
            system used in some Portuguese mapping.<br />
            <strong>Carta Arqueológica de Portugal M / P</strong> is the shorthand style printed in the
            <strong>Carta Arqueológica de Portugal</strong> volumes and reused in archaeological notes and field
            references.<br />
            <strong>Gauss X / Y</strong> is the military-map notation found in archaeological material such as the
            1996 OPHIUSSA article and related references that cite Portuguese military maps at
            <strong>1:25 000</strong>.
          </p>

          <p>
            <strong>App functionality</strong><br />
            You can type coordinates in any of the four sections, paste them
            from the clipboard, convert them to the other formats, copy the result, use sample presets,
            and click on the map to pick a point. When you click the map, the marker moves and all four
            coordinate sections are updated automatically.
          </p>

          <p>
            <strong>Paste formats:</strong><br />
            <strong>EPSG:4326</strong>: paste expects latitude then longitude, for example
            37.1388155, -8.5385212.<br />
            <strong>EPSG:3763</strong> paste expects easting then northing, for example
            -6644.124, -109920.925.<br />
            <strong>Carta Arqueológica de Portugal M / P</strong>: paste expects the Carta Arqueológica de Portugal
            pair, for example M-230.5 P-013.6.<br />
            <strong>Gauss X / Y</strong>: paste expects the military map pair, for example X 638.4; Y 4119.6,
            X 628.8; Y 4113.6, or X 629.2; Y 4113.5.
          </p>

          <p>
            <strong>Technical documentation for the two legacy archaeological formats</strong><br />
            <strong>1. Carta Arqueológica de Portugal M / P</strong><br />
            This is the compact notation used in the published volumes of the
            <strong>Carta Arqueológica de Portugal</strong>. In those books the coordinate pair is usually written as
            <strong>M</strong> and <strong>P</strong>, for example <strong>M-230.5 P-013.6</strong>. In practice this is
            a
            shorthand way of writing positions on an older projected grid rather than a modern EPSG-labelled
            format.<br />
            <strong>2. Gauss X / Y</strong><br />
            This is the notation found in archaeological references tied to the Portuguese military maps, including the
            1996 OPHIUSSA paper discussed during the preparation of this app. In those references the pair is written as
            <strong>X</strong> and <strong>Y</strong>, for example <strong>X 638.4; Y 4119.6</strong>.<br />
            <strong>Underlying technical system</strong><br />
            Both notations are treated here as two ways of writing the same older
            <strong>Hayford-Gauss / Datum Lisboa</strong> projected grid. That grid is implemented in the app with a
            <strong>Transverse Mercator</strong> definition in <strong>proj4</strong> using an
            <strong>ESRI:102164-style</strong> parameter set. It is not presented as a separate user card because the
            user-facing need is to decode the published archaeological notations, not to expose another technical CRS
            identifier.<br />
            <strong>Difference between M / P and X / Y</strong><br />
            The difference is the notation, not the base map projection. The
            <strong>Carta Arqueológica de Portugal</strong> shorthand uses <strong>M / P</strong>, while the
            military-map
            archaeological references use <strong>X / Y</strong>. In this app the relation is handled as a fixed shift
            in
            kilometre notation: <strong>M = X - 400</strong> and <strong>P = Y - 4100</strong>. That means
            <strong>Gauss X / Y</strong> and <strong>Carta Arqueológica de Portugal M / P</strong> describe the same
            underlying grid location, but with different labels and offsets.<br />
            <strong>Conversion path used by Capriccio</strong><br />
            <strong>M / P or X / Y ⇄ Hayford-Gauss / Datum Lisboa ⇄ WGS84 / EPSG:4326 ⇄ ETRS89 / Portugal TM06 /
              EPSG:3763</strong>.<br />
            This means the app first normalizes the legacy archaeological notation, then converts through the older
            Hayford-Gauss / Datum Lisboa grid, then derives WGS84 and TM06 outputs from that result.
          </p>

          <p>
            <strong>Version:</strong> {{ appVersion }}
          </p>

          <p>
            <strong>Copyright:</strong> Michel Gouget 2026, gurzixo HAT platinn DOTT com.
          </p>

          <p>
            <strong>License:</strong> MIT.
          </p>

          <p>
            <strong>Repository:</strong>
            <a href="https://github.com/mgurzixo/capriccio" target="_blank" rel="noopener noreferrer">
              https://github.com/mgurzixo/capriccio
            </a>
          </p>

        </q-card-section>

        <q-card-actions align="right" class="help-card__actions">
          <q-btn class="system-action-btn" label="Close" @click="helpOpen = false" />
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
import packageInfo from '../../package.json';
import capriccioLogo from 'src/assets/capriccio-logo.svg';

const $q = useQuasar();
const helpOpen = ref(false);
const isAndroidCapacitor = $q.platform.is.capacitor === true && $q.platform.is.android === true;
const appVersion = packageInfo.version;
</script>
