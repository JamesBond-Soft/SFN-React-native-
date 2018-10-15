# CHANGELOG

## Unreleased

- [Fixed] iOS manual `#sync` was not executing *any* callback if database was empty.
- [Added] Impmlement Android 8 `NotificationChannel`, now required for displaying application notifications (ie: `foregroundService` notification).
- [Changed] Your `app/build.gradle` now requires `compileSdkVersion: 26, buildToolsVersion: "26.0.2"` (or latest) for the plugin's Android 8 support.  See updated Android SETUP guide.
- [Changed] You `app/build.gradle` now requires `"com.android.support:appcompat-v7:26.1.0"` (or later) for Android 8 support.  See updated Android SETUP guide.
- [Added] iOS Implement `requiresMainQueueSetup`
- [Fixed] iOS not always firing location `failure` callback.
- [Fixed] iOS was not forcing an HTTP flush on `motionchange` event when `autoSyncThreshold` was used.
- [Fixed] Android `getGeofences` crash with geofence having `null` `#extras`.
- [Fixed] iOS Add sanity-check for Settings `boolean` type.  It was possible to corrupt the Settings when a `boolean`-type setting was provided with a non-boolean value (eg: `{}`, `[]`).
- [Fixed] Android `getState` could cause an NPE if executed before `#configure`.
- [Fixed] Work around iOS 11 bug with `CLLocationManager#stopMonitoringSignificantLocationChanges` (SLC):  When this method is called upon *any* single `CLLocationManager` instance, it would cause *all* instances to `#stopMonitoringSignificantLocationChanges`.  This caused problems with Scheduler evaluation, since SLC is required to periodically evaluate the schedule.

## [2.9.4] - 2017-09-25
- [Added] Re-build for iOS 11, XCode 9
- [Added] Implement new `powersavechange` event in addition to `isPowerSaveMode` method for determining if OS "Power saving" mode is enabled.
- [Added] New config `elasticityMultiplier` for controlling the scale of `distanceFilter` elasticity calculation.
- [Fixed] Android bug not firing `schedule` Javascript listeners
- [Fixed] Android crash `onGooglePlayServicesConnectdError` when Google Play Services needs to be updated on device.

## [2.9.3] - 2017-09-14

- [Changed] Refactor Android `onDestroy` mechanism attempting to solve nagging and un-reproducible null pointer exceptions.
- [Added] Implement Android location permissions handling using `PermissionsAndroid` API.  You no longer need to use 3rd-party permissions module to obtain Android location permission.
- [Fixed] Fixed bug not where `stopAfterElapsedMinutes` is not evaluated when executing `#getCurrentPosition`.
- [Fixed] Modifications for Android O.  For now, `foregroundService: true` will be enforced when running on Android O (api 26).

## [2.9.2] - 2017-08-28
- [Changed] iOS `motionchange` position will be fetch by `CLLocationManager#startUpdatingLocation` rather than `#requestLocation`, since `#requestLocation` cannot keep the app alive in the background.  This could cause the app to be suspended when `motionchange` position was requested due to a background-fetch event.
- [Fixed] Android `stopOnTerminate` was not setting the `enabled` value to `false` when terminated.  This caused the plugin to automatically `#start` the first time the app was booted (it would work correctly every boot thereafter).
- [Changed] Change Android HTTP layer to use more modern library `OkHttp3` instead of `Volley`.  Some users reported weird issues with some devices on some servers.  `OkHttp` seems to have solved it for them.  `OkHttp` is a much simpler library to use than `Volley`

## [2.9.1] - 2017-08-21
- [Changed] Update `react-native-background-fetch` to `~2.1.0`
- [Added] Javascript API to plugin's logging system.
- [Fixed] Minor issue with iOS flush where multiple threads might create multiple background-tasks, leaving some unfinished.

## [2.9.0] - 2017-08-16
- [Changed] Refactor iOS / Android core library event-subscription API.
- [Added] Removing single event-listeners with `#removeListener` (alias `#un`) is snow fully supported!  There will no longer be warnings "No listeners for event X", since the plugin completely removes event-listeners from the core library.  You will no longer have to create `noop` event-listeners on events you're not using simply to suppress these warnings.

## [2.8.5] - 2017-07-27
- [Changed] Improve iOS/Android acquisition of `motionchange` location to ensure a recent location is fetched.
- [Changed] Implement `#getSensors` method for both iOS & Android.  Returns an object indicating the presense of *accelerometer*, *gyroscope* and *magnetometer*.  If any of these sensors are missing, the motion-detection system for that device will poor.
- [Changed] The `activitychange` success callback method signature has been changed from `{String} activityName` -> `{Object}` containing both `activityName` as well as `confidence`.  This event only used to fire after the `activityName` changed (eg: `on_foot` -> `in_vehicle`), regardless of `confidence`.  This event will now fire for *any* change in activity, including `confidence` changes.
- [Changed] iOS `emailLog` will gzip the attached log file.
- [Added] Implement new Android config `notificationPriority` for controlling the behaviour of the `foregroundService` notification and notification-bar icon.
- [Changed] Tweak iOS Location Authorization to not show locationAuthorizationAlert if user initially denies location permission.
- [Fixed] Android:  Remove isMoving condition from geofence proximity evaluator.
- [Fixed] Android was creating a foreground notification even when `foregroundService: false`
- [Fixed] iOS 11 fix:  Added new location-authorization string `NSLocationAlwaysAndWhenInUseUsageDescription`.  iOS 11 now requires location-authorization popup to allow user to select either `Always` or `WhenInUse`.

## [2.8.4] -  2017-07-10
- [Fixed] Android & iOS will ensure old location samples are ignored with `getCurrentPosition`
- [Fixed] Android `providerchange` event would continue to persist a providerchange location even when plugin was disabled for the case where location-services is disabled by user.
- [Fixed] Don't mutate iOS `url` to lowercase.  Just lowercase the comparison when checking for `301` redirects. 
- [Changed] Android will attempt up to 5 `motionchange` samples instead of 3.  Cheaper devices can take longer to lock onto GPS.
- [Changed] Android foregroundService notification priority set to `PRIORITY_MIN` so that notification doesn't always appear on top.
- [Fixed] Android plugin was not nullifying the odometer reference location when `#stop` method is executed, resulting in erroneous odometer calculations if plugin was stopped, moved some distance then started again.
- [Added] Android plugin will detect presense of Sensors `ACCELEROMETER`, `GYROSCOPE`, `MAGNETOMETER` and `SIGNIFICANT_MOTION`.  If any of these sensors are missing, the Android `ActivityRecognitionAPI` is considered non-optimal and plugin will add extra intelligence to assist determining when device is moving.
- [Fixed] Bug in broadcast event `GEOFENCE` not being fired when `MainActivity` is terminated (only applies to those use `HeadlessJS`).
- [Added] Implement Javascript API for `removeAllListeners` for...you guessed it:  removing all event-listeners.
- [Fixed] Android scheduler issue when device is rebooted and plugin is currently within a scheduled ON period (fails to start)
- [Fixed] (Android) Fix error calling `stopWatchPosition` before `#configure` callback has executed.  Also add support for executing `#getCurrentPosition` before `#configure` callback has fired.
- [Added] (Android) Listen to LocationResult while stopTimeout is engaged and perform manual motion-detection by checking if location distance from stoppedAtLocation is > stationaryRadius
- [Fixed] Bug in literal schedule parsing for both iOS and Android
- [Fixed] Bug in Android scheduler after app terminated.  Configured schedules were not having their `onTime` and `offTime` zeroed, resulting in incorrect time comparison.

## [2.8.3] - 2017-06-15
- [Fixed] Bug in Android scheduler after app terminated.  Configured schedules were not having their `SECOND` and `MILLISECOND` zeroed resulting in incorrect time comparison.

## [2.8.2] - 2017-06-14
- [Added] New config `stopOnStationary` for both iOS and Android.  Allows you to automatically `#stop` tracking when the `stopTimeout` timer elapses.
- [Added] Support for configuring the "Large Icon" (`notificationLargeIcon`) on Android `foregroundService` notification.  `notificationIcon` has now been aliased -> `notificationSmallIcon`.
- [Fixed] iOS timing issue when fetching `motionchange` position after initial `#start` -- since the significant-location-changes API (SLC) is engaged in the `#stop` method and eagerly returns a location ASAP, that first SLC location could sometimes be several minutes old and come from cell-tower triangulation (ie: ~1000m accuracy).  The plugin could mistakenly capture this location as the `motionchange` location instead of waiting for the highest possible accuracy location that was requested.  SLC API will be engaged only after the `motionchange` location has been received. 
- [Fixed] Headless JS `RNBackgroundGeolocationEventReceiver` was broken in `react-native 0.45.0` -- they removed a mechanism for fetching the `ReactApplication`.  Changed to using a much simpler, backwards-compatible mechansim using simple `context.getApplicationContext()`.
- [Fixed] On Android, when adding a *massive* number of geofences (ie: *thousands*), it can take several minutes to perform all `INSERT` queries.  There was a threading issue which could cause the main-thread to be blocked while waiting for the database lock from the geofence queries to be released, resulting in an ANR (app isn't responding) warning.
- [Changed] Changing the Android foreground-service notification is now supported (you no longer need to `#stop` / `#start` the plugin for changes to take effect).
- [Added] New config option `httpTimeout` (milliseconds) for configuring the timeout where the plugin will give up on sending an HTTP request.
- [Added] Improved `react-native link` automation for iOS.  XCode setup is now completely handled!
- [Fixed] Android bug in `RNBackgroundGeolocationEventReceiver`.  Catch errors when `ReactNativeApplication` can not be referenced (this can happen during `startOnBoot` when the react native App has not yet booted, thus no `registerHeadlessTask` has been executed yet.  It can also occur if the plugin has not been configured with `foregroundService: true` -- Headless JS **requires** `foregroundService: true`)
- [Fixed] When iOS engages the `stopTimeout` timer, the OS will pause background-execution if there's no work being performed, in spite of `startBackgroundTask`, preventing the `stopTimeout` timer from running.  iOS will now keep location updates running at minimum accuracy during `stopTimeout` to prevent this.
- [Fixed] Ensure iOS background "location" capability is enabled before asking `CLLocationManager` to `setBackgroundLocationEnabled`.
- [Added] Implement ability to provide literal dates to schedule (eg: `2017-06-01 09:00-17:00`) 
- [Added] When Android motion-activity handler detects `stopTimeout` has expired, it will initiate a `motionchange` without waiting for the `stopTimeout` timer to expire (there were cases where the `stopTimeout` timer could be delayed from firing due likely to vendor-based battery-saving software)

## [2.8.1] - 2017-05-12
- [Fixed] iOS has a new hook to execute an HTTP flush when network reachability is detected.  However, it was not checking if `autoSync: true` or state of `autoSyncThreshold`.

## [2.8.0] - 2017-05-08
- [Added] When iOS detects a network connection with `autoSync: true`, an HTTP flush will be initiated.
- [Fixed] Improve switching between tracking-mode location and geofence.  It's not necessary to call `#stop` before executing `#start` / `#startGeofences`.
- Fixed] iOS `maximumAge` with `getCurrentPosition` wasn't clearing the callbacks when current-location-age was `<= maximumAge`
- [Fixed] iOS when `#stop` is executed, nullify the odometer reference location.
- [Fixed] iOS issue with `preventSuspend: true`:  When a `motionchange` event with `is_moving: false` occurred, the event was incorrectly set to `heartbeat` instead of `motionchange`.
- [Fixed] Android null pointer exception when using `startOnBoot: true, forceReloadOnBoot: true`:  there was a case where last known location failed to return a location.  The lib will check for null location in this case.
- [Changed] iOS minimum version is now `8.4`.  Plugin will log an error when used on versions of iOS that don't implement the method `CLLocationManager#requestLocation`
- [Fixed] iOS bug executing `#setConfig` multiple times too quickly can crash the plugin when multiple threads attempt to modify an `NSMutableDictionary`

## [2.7.1] - 2017-04-18
- [Fixed] Android was rounding `battery_level` to 1 decimal place.
- [Fixed] iOS geofences-only mode was not using significant-location-change events to evaluate geofences within proximity.
- [Changed] iOS now uses `CLLocationManager requestLocation` to request the `motionchange` position, rather than counting samples.  This is a more robust way to get a single location
- [Fixed] iOS crash when providing `null` values in `Object` config options (ie: `#extras`, `#params`, `#headers`, etc)
- [Fixed] iOS was creating `backgroundTask` in `location` listener even if no listeners were registered, resulting in growing list of background-tasks which would eventually be `FORCE KILLED`.
- [Added] New config option `locationsOrderDirection [ASC|DESC]` for controlling the order that locations are selected from the database (and synced to your server).  Defaults to `ASC`.
- [Added] Support for React Native "Headless JS"
- [Added] Support for iOS geofence `DWELL` transitions.

## [2.7.0] - 2017-03-09
- [Changed] Updated **proguard config** to ignore `com.transistorsoft.**` -- `tslocationmanager.aar` is *already* pro-guarded.
- [Fixed] iOS bug when composing geofence data for peristence.  Sometimes it appended a `location.geofence.location` due to a shared `NSDictionary`
- [Fixed] Android issue with applying default settings the first time an app boots.  If you execute `#getState` before `#configure` is called, `#getState` would return an empty `{}`.
- [Changed] The licensing model of Android now enforces license only for **release** builds.  If an invalid license is configured while runningin **debug** mode, a Toast warning will appear **"BackgroundGeolocation is running in evaluation mode."**, but the plugin *will* work.
- [Fixed] iOS bug with HTTP `401` handling.
- [Added] The Android plugin now broadcasts all its events using the Android `BroadcastReceiver` mechanism.  You're free to implement your own native Android handler to receive and react to these events as you wish.

## [2.6.1] - 2017-03-01
- [Changed] Refactor Settings Management for both iOS and Android.
- [Fixed] Android database migration issue when upgrading from very old version to latest.  Was missing "geofences" table migration.

## [2.6.0] - 2017-02-22
- [Fixed] Issue #186: `geofence` event not passing Geofence `#extras`.
- [Fixed] iOS geofence identifiers containing ":" character were split and only the last chunk returned.  The plugin itself prefixes all geofences it creates with the string `TSGeofenceManager:` and the string-splitter was too naive.  Uses a `RegExp` replace to clear the plugin's internal prefix. 
- [Changed] Refactored API Documentation
- [Added] HTTP JSON template features.  See [HTTP Features](./docs/http.md).  You can now template your entire JSON request data sent to the server by the plugin's HTTP layer.

## [2.5.0] - 2017-02-08
- [Changed] **BREAKING** License key is no longer provided to `BackgroundGeolocation#configure` -- You will now add your license key to `AndroidManifest`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.transistorsoft.backgroundgeolocation.react">

    <application
      android:name=".MainApplication"
      android:allowBackup="true"
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:theme="@style/AppTheme">

      <!-- react-native-background-geolocation-android licence -->
      <meta-data android:name="com.transistorsoft.locationmanager.license" android:value="YOUR_LICENSE_KEY" />
      .
      .
      .
    </application>
</manifest>
```

## [2.4.2] - 2017-02-07
- [Changed] Make iOS plugin work for both pre and post `0.40.0`.
- [Fixed] Fix issue with Location Authorization alert popup up when not desired.  Fixes Issue #190

## [2.4.1] - 2017-01-12
- [Fixed] Rounded location attribute Floats rendered as string (eg: `speed`, `odometer`, `heading`).  Fixes issue #162

## [2.4.0] - 2017-01-11
- [Fixed] Support for `react-native-0.40.0`

## [2.3.0] - 2017-01-09
- [Fixed] Locale issue when formatting Floats.  Some locale use "," as decimal separator.  Force Locale -> US when performing rounding.  Proper locale will be applied during the JSON encoding.
- [Added] Add `mock` attribute to Location data; present when the location comes from a mock provider (ie: when location is being simulated).
- [Added] Ability to provide optional arbitrary meta-data `extras` on geofences.
- [Changed] Location parameters `heading`, `accuracy`, `odometer`, `speed`, `altitude`, `altitudeAccuracy` are now fixed at 2 decimal places.
- [Fixed] Bug reported with `EventBus already registered` error.  Found a few cases where `EventBus.isRegistered` was not being used.
- [Added] Android will attempt to auto-sync on heartbeat events.
- [Changed] permission `android.hardware.location.gps" **android:required="false"**` 
- [Added] Implement `IntentFilter` to capture `MY_PACKAGE_REPLACED`, broadcast when user upgrades the app.  If you've configured `startOnBoot: true, stopOnTerminate: false` and optionally `foreceRelaodOnBoot: true`, the plugin will automatically restart when user upgrades the app.
- [Changed] When adding a geofence (either `#addGeofence` or `#addGeofences`), if a geofence already exists with the provided `identifier`, the plugin will first destroy the existing one before creating the new one.
- [Changed] Merge iOS platform.  You no longer have to install both projects.
- [Fixed] Use more precise Alarm mechanism for `stopTimeout`.  Was using `AlarmManager#set`.  Changed `AlaramManager#setExact` (only works for API >= `19`).  Some were reporting that `stopTimeout` could run several minutes beyond what was configured.
- [Fixed] Improve odometer accuracy.  Introduce `desiredOdometerAccuracy` for setting a threshold of location accuracy for calculating odometer.  Any location having `accuracy > desiredOdometerAccuracy` will not be used for odometer calculation.
- [Fixed] When configured with a schedule, the Schedule parser wasn't ordering the schedule entries by start-time.  Since the scheduler seeks the first matching schedule-entry, it could fail to pick the latest entry.
- [Changed] Add ability to set odometer to any arbitrary value.  Before, odometer could only be reset to `0` via `resetOdometer`.  The plugin now uses `setOdometer(Float, successFn, failureFn`.  `resetOdometer` is now just an alias for `setOdometer(0)`.  `setOdometer` will now internally perform a `#getCurrentPosition`, so it can know the exact location where the odometer was set at.  As a result, using `#setOdometer` is exactly like performing a `#getCurrentPosition` and the `success` / `failure` callbacks use the same method-signature, where the `success` callback is provided the `location`.

## [2.2.0] - 2016-11-21
- [Changed] The plugin will ignore `autoSyncThreshold` when a `motionchange` event occurs.
- [Fixed] Bug with Android geofences not posting `event: geofence` and the actual `geofence` data was missing (The data sent to Javascript callback was ok, just the data sent to HTTP.
- [Added] Geofences-only mode.  Start geofences-only mode with method `#startGeofences`.
- [Fixed] Bug in Android Scheduler, failing to `startOnBoot`.  Issue #985

## [2.1.3] - 2016-10-26
- [Added] Add new `@config {Boolean} geofenceInitialTriggerEntry [true]`, allowing you to control the behaviour of initially triggering a geofence when the device is already within the newly added geofence, defaults to `true`.

## [2.1.2] - 2016-10-19
- [Changed] Introduce database-logging for Android.  Like iOS, the Android module's logs are now stored in the database!  By default, logs are stored for 3 days, but is configurable with `logMaxDays`.  Logs can now be filtered by logLevel:

| logLevel | Label |
|---|---|
|`0`|`LOG_LEVEL_OFF`|
|`1`|`LOG_LEVEL_ERROR`|
|`2`|`LOG_LEVEL_WARNING`|
|`3`|`LOG_LEVEL_INFO`|
|`4`|`LOG_LEVEL_DEBUG`|
|`5`|`LOG_LEVEL_VERBOSE`|

These constants are available on the `BackgroundGeolocation` module:
```Javascript
import {BackgroundGeolocation} from "react-native-background-geolocation-android";

console.log(BackgroundGeolocation.LOG_LEVEL_ERROR);
```

fetch logs with `#getLog` or `#emailLog` methods.  Destroy logs with `#destroyLog`.
- [Fixed] Implement `onHostDestroy` to signal to `BackgroundGeolocation` when `MainActivity` is terminated (was using only `onCatalystInstanceDestroy` previously)
- [Fixed] Issues with Scheduler.
- [Fixed] Issues with `startOnBoot`
- [Added] Added `#removeListener` (@alias `#un`) method to Javascript API.  This is particularly important when using `stopOnTerminate: false`.  You should remove listeners on `BackgroundGeolocation` in `componentWillUnmount`:
```Javascript
  componentWillUnmount: function() {
    // Unregister BackgroundGeolocation event-listeners!
    BackgroundGeolocation.un("location", this.onLocation);
    BackgroundGeolocation.un("http", this.onHttp);
    BackgroundGeolocation.un("geofence", this.onGeofence);
    BackgroundGeolocation.un("heartbeat", this.onHeartbeat);
    BackgroundGeolocation.un("error", this.onError);
    BackgroundGeolocation.un("motionchange", this.onMotionChange);
    BackgroundGeolocation.un("schedule", this.onSchedule);
    BackgroundGeolocation.un("geofenceschange", this.onGeofencesChange);
  }
```
- [Changed] Implement a mechanism for removing listeners `removeListener` (@alias `un`).  This is particularly important for Android when using `stopOnTerminate: false`.  Listeners on `BackgroundGeolocation` should be removed in `componentDidUnmount`:
```Javascript
  componentDidMount() {
    BackgroundGeolocation.on('location', this.onLocation);
  }
  onLocation(location) {
    console.log('- Location: ', location);
  }
  componentDidUnmount() {
    BackgroundGeolocation.un('location', this.onLocation);
  }
```

## [2.1.1] - 2016-10-17
- [Changed] Android will filter-out received locations detected to be same-as-last by comparing `latitude`, `longitude`, `speed` & `bearing`.

## [2.1.0] - 2016-10-10
- [Changed] Refactored Geolocation system.  The plugin is no longer bound by native platform limits on number of geofences which can be monitored (iOS: 20; Android: 100).  You may now monitor infinite geofences.  The plugin now stores geofences in its SQLite db and performs a geospatial query, activating only those geofences in proximity of the device (@config #geofenceProximityRadius, @event `geofenceschange`).  See the new [Geofencing Guide](./docs/geofencing.md)

## [2.0.4] - 2016-09-22
- [Added] New required android permission `<uses-feature android:name="android.hardware.location.gps" />`.  See Setup docs.
- [Changed] Changed API of `watchPosition` to match iOS.  See docs.
- [Changed] Refactor setup guides.  Implement `Cocoapod` and `RNPM` guides.
- [Changed] Render `-1`if location has no speed, bearing or altitude
- [Fixed] Fix Android crash when resetOdometer called before `#configure`. 
- [Fixed] found bug where `TSLocationManager` doesn't initialize its odometer from Settings when first instantiated.

## [2.0.3] - 2016-08-29
- [Fixed] Issue where Android pukes when configured with an empty schedule `[]`- [Fixed] Android when configured with `batchSync: true, autoSync: true` was failing because the plugin automatically tweaked `autoSync: false` but failed to reset it to the configured value.  This behaviour was obsolete and has been removed.
- [Added] Add new config `@param {Integer} autoSyncThreshold [0]`.  Allows you to specify a minimum number of persisted records to trigger an auto-sync action.
- [Fixed] `SimpleDateFormat` used to format timestamps was not being used in a thread-safe manner, resulting in corrupted timestamps for some
- [Fixed] React module was setting up listeners on `BackgroundGeolocation` adapter before the app javascript code had a change to subscribe to events, resulting in lost events when MainActivity was launched due to a forceReload event
- [Changed] Accept callbacks to `#stop` method

## [2.0.2] - 2016-08-17
- [Fixed] GoogleApiClient null pointer exeception
- [Changed] Remove `android-compat-v7` from dependencies
- [Changed] Change error message when `#removeGeofence` fails.
- [Fixed] Implement `http` error callback.
- [Fixed] Android heartbeat location wasn't having its meta-data updated (ie: `event: 'heartbeat', battery:<current-data>, uuid: <new uuid>`)
- [Changed] Reduce Android `minimumActivityRecognitionConfidence` default from `80` to `75`
- [Changed] Android will catch `java.lang.SecurityException` when attempting to request location-updates without "Location Permission"

## [2.0.1] - 2016-08-08
- [Fixed] Parse error in Scheduler.
- [Fixed] Sending wrong event `EVENT_GEOFENCE` for schedule-event.  Should have been `EVENT_SCHEDULE` (copy/paste bug).

## [2.0.0] - 2016-08-01
- [Changed] Major Android refactor with significant architectural changes.  Introduce new `adapter.BackgroundGeolocation`, a proxy between the Cordova plugin and `BackgroundGeolocationService`.  Up until now, the functionality of the plugin has been contained within a large, monolithic Android Service class.  This monolithic functionality has mostly been moved into the proxy object now, in addition to spreading among a number of new Helper classes.  The functionality of the HTTP, SQLite, Location and ActivityRecognition layers are largely unchanged, just re-orgnanized.  This new structure will make it much easier going forward with adding new features.
- [Changed] SQLite & HTTP layers have been moved from the BackgroundGeolocationService -> the proxy.  This means that database & http operations can now be performed without enabling the plugin with start() method.
- [Changed] Upgrade EventBus to latest.
- [Changed] Implement new watchPosition method (Android-only), allowing you to get a continues stream of locations without using Javascript setInterval (Android-only currently)
- [Added] Implement new event "providerchange" allowing you to listen to Location-services change events (eg: user turns off GPS, user turns off location services).  Whenever a "providerchange" event occurs, the plugin will automatically fetch the current position and persist the location adding the event: "providerchange" as well as append the provider state-object to the location.
- [Changed] Significantly simplified ReactNativeModule by moving boiler-plate code into the Proxy object.  This significantly simplifies the Cordova plugin, making it much easier to support all the different frameworks the plugin has been ported to (ie: Cordova, NativeScript).
- [Fixed] Breaking changes with react-native-0.29.0

## [1.3.0] - 2016-06-10
- [Changed] `Scheduler` will use `Locale.US` in its Calendar operations, such that the days-of-week correspond to Sunday=1..Saturday=6.
- [Fixed] Bug in `start` method, invoking incorrect Callback reference, which can be null.
- [Changed] Refactor odometer calculation for both iOS and Android.  No longer filters out locations based upon average location accuracy of previous 10 locations; instead, it will only use the current location for odometer calculation if it has accuracy < 100.
- [Changed] Updata binary build to use latest `play-services-location:9.0.1`
- [Added] **Android-only currently, beta** New geofence-only tracking-mode, where the plugin will not actively track location, only geofences.  This mode is engaged with the new API method `#startGeofences` (instead of `#start`, which engages the usual location-tracking mode).  `#getState` returns a new param `#trackingMode [location|geofences]`
- [Changed] **Android** Refactor the Android "Location Request" system to be more robust and better handle "single-location" requests / asynchronous requests, such as `#getCurrentPosition` and stationary-position to fetch multiple samples (3), selecting the most accurate (ios has always done this, heard with the debug sound `tick`).  In debug mode, you'll hear these location-samples with new debug sound "US dialtone".  Just like iOS, these location-samples will be returned to your `#onLocation` event-listener with the property `{sample: true}`.  If you're doing your own HTTP in Javascript, you should **NOT** send these locations to your server.  Use them instead to simply update the current position on the Map, if you're using one.
- [Added] new `#getCurrentPosition` options `#samples` and `#desiredAccuracy`. `#samples` allows you to configure how many location samples to fetch before settling sending the most accurate to your `callbackFn`.  `#desiredAccuracy` will keep sampling until an location having accuracy `<= desiredAccuracy` is achieved (or `#timeout` elapses).
- [Added] new `#event` type `heartbeat` added to `location` params (`#is_heartbeat` is **@deprecated**).
- [Fixed] Issue #676.  Don't engage foreground-service when executing `#getCurrentPosition` while plugin is in disabled state.
- [Fixed] When enabling iOS battery-state monitoring, use setter method `setBatteryMonitoringEnabled` rather than setting property.  This seems to have changed with latest iOS

- [Added] Implement `disableStopDetection` for Android
- [Changed] `android.permission.GET_TASKS` changed to `android.permission.GET_REAL_TASKS`.  Hoping this removes deprecation warning.  This permission is required for Android `#forceReload` configs.
- [Added] New Anddroid config `#notificationIcon`, allowing you to customize the icon shown on notification when using `foregroundServcie: true`.
- [Changed] Take better care with applying `DEFAULT` settings.
- [Changed] Default settings: `startOnBoot: false`, `stopOnTerminate: true`, `distanceFilter: 10`.
- [Added] Allow setting `isMoving` as a config param to `#configure`.  Allows the plugin to automatically do a `#changePace` to your desired value when the plugin is first `#configure`d.
- [Added] New event `activitychange` for listening to changes from the Activit Recognition system.  See **Events** section in API docs for details.  Fixes issue #703.
- [Added] Allow Android `foregroundService` config to be changed dynamically with `#setConfig` (used to have to restart the start to apply this).

## [1.2.3] - 2016-05-25
- [Fixed] Rebuild binary `tslocationmanager.aar` excluding dependencies `appcompat-v7` and `play-services`.  I was experiencing build-failures with latest react-native since other libs may include these dependencies:
- [Fixed] App will no longer crash when license-validation fails.
- [Fixed] Android `GeofenceService` namespace was changed from `com.transistorsoft.locationmanager.GeofenceService` to `com.transistorsoft.locationmanager.geofence.GeofenceService`.  Your `AndroidManifest.xml` will have to be modified.  See installation guide in [Wiki](https://github.com/transistorsoft/react-native-background-geolocation-android/wiki/Installation)

## [1.2.2] - 2016-05-07
- [Changed] Refactor HTTP Layer to stop spamming server when it returns an error (used to keep iterating through the entire queue).  It will now stop syncing as soon as server returns an error (good for throttling servers).
- [Fixed] bugs in Scheduler

## [1.2.1] - 2016-05-02
- [Fixed] Wrap `getCurrentPositionCallbacks` in `synchronized` block to prevent `ConcurrentModificationException` if `getCurrentPosition` is called in quick succession.

## [1.2.0] - 2016-05-01
- [Added] Introduce new [Scheduling feature](http://shop.transistorsoft.com/blogs/news/98537665-background-geolocation-scheduler)

## [1.1.1] - 2016-04-15
- [Fixed] Refactor `startOnBoot` system.  Added missing instruction to configure `BootReceiver` in `AndroidManifest`.  See [Installation Guide](https://github.com/transistorsoft/react-native-background-geolocation-android/wiki/Installation)
- [Added] Android `heartbeat` event, configured with `heartbeatInterval`.

## [1.1.0] - 2016-04-04
- [Fixed] Android 5 geofence limit.  Refactored Geofence system.  Was using a `PendingIntent` per geofence; now uses a single `PendingIntent` for all geofences.
- [Fixed] Edge-case issue when executing `#getCurrentPosition` followed immediately by `#start` in cases where location-timeout occurs.
- [Changed] Volley dependency to official version `com.android.volley`
- [Changed] When plugin is manually stopped, update state of `isMoving` to `false`.
- [Fixed] If location-request times-out while acquiring stationary-location, try to use last-known-location
- [Added] `maxRecordsToPersist` to limit the max number of records persisted in plugin's SQLite database.
- [Added] API methods `#addGeofences` (for adding a list-of-geofences), `#removeGeofences`
- [Changed] The plugin will no longer delete geofences when `#stop` is called; it will merely stop monitoring them.  When the plugin is `#start`ed again, it will start monitoringt any geofences it holds in memory.  To completely delete geofences, use new method `#removeGeofences`.
- [Fixed] Issue with `forceReloadOnX` params. These were not forcing the activity to reload on device reboot when configured with `startOnBoot: true`
- [Fixed] `stopOnTerminate: false` was not working.

## [1.0.1] - 2016-03-14
- [Changed] Standardize the Javascript API methods to send both a `success` as well as `failure` callbacks.
- [Changed] Upgrade plugin for react-native `v0.21.0`
- [Changed] Document new installation steps
- [Changed] Upgrade `emailLog` method to attach log as email-attachment rather than rendering to email-body.  The result of `#getState` is now rendered to the email-body
- [Changed] Android `getState` method was only returning the value of `isMoving` and `isEnabled`.  It now returns the entire current-configuration as supplied to the `#configure` method.
- [Added] Intelligence for `stopTimeout`.  When stop-timer is initiated, save a reference to the current-location.  If another location is recorded while during stop-timer, calculate the distance from location when stop-timer initiated:  if `distance > stationaryRadius`, cancel the stop-timer and stay in "moving" state.
- [Added] New debug sound **"booooop"**:  Signals the initiation of stop-timer of `stopTimeout` minutes.
- [Added] New debug sound **"boop-boop-boop"**: Signals the cancelation of stop-timer due to movement beyond `stationaryRadius`.
- [Added] `mapToJson`, `jsonToMap` methods.
- [Added] CHANGELOG
- [Added] Document `#getLog`, `#emailLog`
- [Fixed] When using setConfig to change `distanceFilter` while location-updates are already engaged, was mistakenly using value for `desiredAccuracy`

## [1.0.0] - 2016-03-08
- [Changed] Introduce new per-app licensing scheme.  I'm phasing out the unlimited 'god-mode' license in favour of generating a distinct license-key for each bundle ID.  This cooresponds with new Customer Dashboard for generating application keys and managing team-members.
- [Changed] Upgrade plugin for react-native v `0.20.0`.

## [0.4.0] - 2016-02-28

- [Fixed] Fix bug transmitting `motionchange` event.
- [Fixed] HTTP listener not being called on server error
- [Fixed] Fix location-timeout; wasn't being fired in right thread.
- [Added] `#insertLocation` method for manually adding locations to plugin's SQLite db
- [Added] `#getCount` retrieve count of records in plugin's SQLite db.
- [Changed] Upgrade react-native dep to 0.19.0
- [Changed] Significant refactor of `LocationManager`
- [Changed] SQLite multi-threading support.
- [Changed] Native HTTP layer will not follow HTTP `301` (redirect) response.
- [Changed] Cache `odometer` between app restart / device reboot.
- [Added] `@param {Boolean} foregroundService` Allow service to run as "foreground service".  This makes the service more impervious to closure by OS due to memory pressure.  Since a foreground service must display a persistent notification in Android notifiction-bar, config-params for modifying the `@param {String} notificaitonTitle`, `@param {String} notificationText` and `@param {String} notificationColor`.
- [Added] Methods `getLog` and `emailLog` for fetching the current applicaiton log at run-time.

## [0.3.1] - 2016-02-20
