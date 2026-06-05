.PHONY: devspa devandroid buildandroid develectron buildelectron ensure-capacitor ensure-electron ensure-android-platform

NPM := npm
QUASAR := npx quasar
CAPACITOR := node ./node_modules/@capacitor/cli/bin/capacitor
CAPACITOR_ANDROID_STUDIO_PATH := $(HOME)/android-studio/bin/studio.sh

devspa:
	$(QUASAR) dev

ensure-capacitor:
	@test -d src-capacitor || $(QUASAR) mode add capacitor

ensure-android-platform: ensure-capacitor
	@test -d src-capacitor/android || (cd src-capacitor && $(CAPACITOR) add android)

devandroid: ensure-capacitor
	$(QUASAR) dev -m capacitor -T android

buildandroid: ensure-android-platform
	$(QUASAR) build -m capacitor -T android
	(cd src-capacitor && CAPACITOR_ANDROID_STUDIO_PATH="$(CAPACITOR_ANDROID_STUDIO_PATH)" $(CAPACITOR) open android)

ensure-electron:
	@test -d src-electron || $(QUASAR) mode add electron

develectron: ensure-electron
	$(QUASAR) dev -m electron

buildelectron: ensure-electron
	$(QUASAR) build -m electron