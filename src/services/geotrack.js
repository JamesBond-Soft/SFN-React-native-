// @flow
import geo from 'react-native-background-geolocation-android'
import moment from 'moment'
import Notifier from '../native/Notifier'
import DeviceInfo from 'react-native-device-info'
import Config from 'react-native-config'
import Analytics from '../services/Analytics'
import { Platform, AsyncStorage } from 'react-native'
import { newAPI } from '../io/api'
import { AR, RESET_STORE } from '../store'
import type { InjectableStore } from '../store/configure'
import type { Gym, Attendance } from '../store/models'
import type {
    GeotrackState,
    GeofenceConf,
    Geotrack,
    GeoStateFunc,
    GeofenceEvent,
    ErrFunc
} from 'react-native-background-geolocation-android'

const events = {
    TooSoon: 'notifyTooSoon',
    Unauthorized: 'notifyUnauthorized',
    NoAuthToken: 'notifyNoAuthToken',
    Shown: 'notifyShown',
    ShownSessionExpired: 'notifyShownSessionExpired',
    TooSoonSessionExpired: 'notifyTooSoonSessionExpired'
}
const ONE_DAY = 1000 * 60 * 60 * 24
const LAST_CHECKIN_NOTIFY = 'LAST_CHECKIN_NOTIFY'
const LAST_AUTH_NOTIFY = 'LAST_AUTH_NOTIFY'
const DEVICE_ID = DeviceInfo.getUniqueID()
const AUTH_TOKEN_KEY = 'authToken'
;(function(requiredKeys: Array<string>) {
    requiredKeys.forEach((key) => {
        if (!AR.hasOwnProperty(key)) {
            let err = new Error(`Expected a key named '${key}' in the global redux state`)
            console.error(err)
            throw err
        }
    })
})([AUTH_TOKEN_KEY])

const geotrack = {
    get(store: InjectableStore): Promise<GeotrackState> {
        return new Promise((resolve: GeoStateFunc, reject: ErrFunc) => {
            geo.getState(async (state) => {
                initListeners(geo, store)
                try {
                    resolve(await maybeStartGeofences(geo, state))
                } catch (err) {
                    reject(err)
                }
            })
        }).then(maybeEnablePaceChange)
    },

    // Should never need to use this -- the service should stay on at all times
    kill(): Promise<void> {
        return new Promise((resolve, reject) => {
            geo.getState(({ enabled }) => {
                if (enabled) {
                    if (geo.removeListeners) {
                        geo.removeListeners()
                    }

                    let onSuccess = () => {
                        console.log('[SFNGeo] - Successfully stopped geo service')
                        resolve()
                    }

                    let onFail = (err) => {
                        console.error('[SFNGeo] - Failed to stop geo service', err)
                        reject(err)
                    }

                    console.log('[SFNGeo] - Killing geo service...')
                    geo.stop(onSuccess, onFail)
                }
            })
        })
    },

    addGeofences(gyms: Array<Gym>): Promise<void> {
        return new Promise((resolve, reject) => {
            geo.addGeofences(
                gyms
                    .filter((g) => g.longitude && g.latitude)
                    .map(({ latitude, longitude, name: identifier, id: gymID }: Gym): GymGeofence => ({
                        identifier,
                        longitude,
                        latitude,

                        radius: 120,
                        notifyOnEntry: true,
                        notifyOnExit: true,
                        notifyOnDwell: true,
                        loiteringDelay: 60 * 1000 * 15,
                        extras: { gymID }
                    })),
                resolve,
                reject
            )
        })
    }
}

async function initListeners(geo: Geotrack, store: InjectableStore): Promise<void> {
    // We only listen for these events on iOS. The treatment of iOS and Android differ greatly
    // when listening and servicing Geofence events due to the nature in app lifecycles and resource
    // management by each native OS.
    //
    // In iOS, when a Geofence is encountered, the native iOS system will start the app in a
    // "background-only" mode where the JS code can service the Geofence event. The app will
    // not appear in the user's active list of apps (when they double tap the home button).
    // It is worth noting however, that the React app in "background-only" mode will not render
    // it's full tree of components, rather it will run "headless" and only service the Geofence
    // event. If the app is actually opened deliberately and no longer backgrounded, then the
    // app's component tree will be rendered.
    //
    // Android operates entirely different. There are two parts to the Android app; the React
    // code and the native Java code. The React JS code hosts the UI for the main application.
    // It does not handle Geofence events. When a Geofence is encountered, a background service
    // is kicked off (IntentService) and notified of the Geofence event. This service runs on
    // the Dalvik Virtual Machine (native Android OS) and is implemented in Java (not JS). This
    // native code will then service the Geofence event. We could make the Android app behave
    // similarly to the iOS implementation (which has no native handling), but that would require
    // us to use forceReloadOnGeofence in the Geolocation library, which actually brings the main
    // React application into the user's list of running apps. That is, they can see the app open
    // in their app switcher despite them never manually opening it. This is somewhat disruptive
    // and not the best user experience.
    //
    // On both operating systems, when a Geofence is encountered, the user will be presented with
    // a native notification asking them if they'd like to check-in to the detected gym within the
    // Geofence region.
    //
    if (Platform.OS === 'ios') {
        console.info('[SFNGeo] Registering for location events...')

        geo.on('geofence', async (geofence: GeofenceEvent, taskId: number) => {
            let { identifier: gymName, extras } = geofence
            console.log('[SFNGeo] - [event:geofence]', geofence, taskId, typeof taskId)

            if (!extras || !extras.gymID) {
                // TODO Raygun
                console.error(`[SFNGeo] No gymID available for gymName=${gymName}`)
                return geo.finish(taskId)
            }

            let { authToken } = store.getState()

            // This is not a JSON object but rather a JSON string
            if (authToken && authToken.length) {
                // Don't even do any of this work if we've already notified them about
                // this gym before the interval is up
                let now = +new Date
                let checkinNotifyKey = `${LAST_CHECKIN_NOTIFY}-${extras.gymID}`
                let lastCheckNotify = await AsyncStorage.getItem(checkinNotifyKey)
                // If we checked previously, compare it and see if it's been too soon to notify
                if (lastCheckNotify) {
                    let checkinNotifyInterval = parseInt(Config.CHECKIN_NOTIFY_INTERVAL) || ONE_DAY
                    let delta = now - parseInt(lastCheckNotify)
                    // Check if it's been too soon
                    if (delta < checkinNotifyInterval) {
                        console.debug(
                            `[SFNGeo] Too soon to notify again for gym '${gymName}' (only ${now -
                                parseInt(lastCheckNotify)}ms has passed), skipping`
                        )

                        Analytics.geofenceEvent(events.TooSoon, {
                            deviceID: DEVICE_ID,
                            lastNotifiedAgoMins: moment.duration(delta).minutes(),
                            gymName
                        })

                        return geo.finish(taskId)
                    }
                }

                console.log(`[SFNGeo] lastCheckNotify=${lastCheckNotify}`)
                // We're actually going to notify (and subsequently create a new attendance record)
                // So we set up this timestamp now
                AsyncStorage.setItem(checkinNotifyKey, `${now}`)

                let api = newAPI(authToken, store)
                // Create a new attendance record in unverified status and wait for it to return
                let updatedAttendance: Array<Attendance>

                try {
                    updatedAttendance = await api.post('/attendances/new', { gym: extras.gymID })
                } catch (err) {
                    console.error(err)
                    if (err.status === 401) {
                        await handleUnauthorized(gymName, store)
                        Analytics.geofenceEvent(events.Unauthorized, { gymName, deviceID: DEVICE_ID })
                    }

                    return geo.finish(taskId)
                }

                if (updatedAttendance && updatedAttendance.length !== 1) {
                    console.error(
                        '[SFNGeo] Got unexpected length for updated attendance items, expected ' +
                            ` 1, got ${updatedAttendance.length}`
                    )
                    return geo.finish(taskId)
                }

                // Pass the ID along so the notification action knows what ID to update
                // on the backend
                let ctx = { id: updatedAttendance[0].id, deviceID: DEVICE_ID, authToken }

                try {
                    await Notifier.send(
                        `geofence-${updatedAttendance[0].gym}`,
                        'SFN Check-In',
                        `Check-in to ${gymName}?`,
                        Notifier.CategoryAttendance,
                        ctx
                    )

                    Analytics.geofenceEvent(events.Shown, {
                        deviceID: DEVICE_ID,
                        attendanceID: ctx.id,
                        gymName
                    })
                } catch (err) {
                    console.error(err)
                    return geo.finish(taskId)
                }
            } else {
                console.debug('[SFNGeo] Null or empty authToken, cannot proceed with request', authToken)
                Analytics.geofenceEvent(events.NoAuthToken, { gymName, deviceID: DEVICE_ID })
                await handleUnauthorized(gymName)
            }

            geo.finish(taskId)
        })

        // Geofences are fetched every 24 hours from the sfn-server. Auth token is a JWT token and reused. When
        // a request is made from the client and the token is expired, the user will receive a notification asking
        // them to re-authenticate.
        geo.on('geofenceschange', (event, taskId) => {
            console.log('[SFNGeo] - [event:geofenceschange]', event, taskId)
            geo.finish(taskId)
        })

        // TODO Handle re-auth notification if token is expired
        geo.on('heartbeat', (params, taskId) => {
            console.log('[SFNGeo] - [event:heartbeat]', params, taskId)
            geo.finish(taskId)
        })
    }
}

function maybeStartGeofences(geo: Geotrack, state: GeotrackState): Promise<GeotrackState> {
    let { enabled, trackingMode, isMoving } = state
    console.log('[SFNGeo] - maybeStartGeofences', { enabled, trackingMode, isMoving })

    return new Promise(async (resolve: GeoStateFunc, reject: ErrFunc) => {
        // At this point we know we should have an auth token, but double check to verify
        try {
            await configure(geo, state)
        } catch (err) {
            return reject(err)
        }

        geo.startGeofences((state: GeotrackState) => {
            console.log('[SFNGeo] - Successfully started. trackingMode:', state.trackingMode)
            resolve(state)
        })
    })
}

function configure(geo: Geotrack, state: GeotrackState): Promise<GeotrackState> {
    return new Promise((resolve: GeoStateFunc, reject: ErrFunc) => {
        let conf = {
            distanceFilter: 5,
            desiredAccuracy: 0,
            stopOnTerminate: true, // TODO Change back to false if re-enabling
            startOnBoot: false, // TODO Change back to true if re-enabling
            foregroundService: false,
            geofenceProximityRadius: 1600,
            fastestLocationUpdateInterval: 2000,
            activityRecognitionInterval: 1000,
            minimumActivityRecognitionConfidence: 60,
            locationAuthorizationRequest: 'Always',
            triggerActivities: 'walking, running, on_foot, on_bicycle, in_vehicle',
            stopTimeout: 10,
            stopDetectionDelay: 1,
            peventSuspend: true,
            logLevel: geo.LOG_LEVEL_WARNING,
            /* TODO consider using schedule here based on past activity history */
            debug: false
        }

        const readyHandler = (state: GeotrackState | void) => {
            console.log('[SFNGeo] - Background Geolocation configured!', state)
            resolve(state)
        }

        const failureHandler = (err: Error) => {
            // TODO Raygun
            console.error('[SFNGeo] - Failed to start geo service:', err)
            reject(err)
        }

        if (__DEV__) {
            conf = Object.assign(conf, {
                fastestLocationUpdateInterval: 500,
                activityRecognitionInterval: 500,
                // TODO Change this to true when debugging Geolocation
                // Disabled automatically for iOS -- notifications are annoying
                debug: Platform.select({ ios: false, android: true }),
                logLevel: geo.LOG_LEVEL_VERBOSE
            })
        }

        const args = [ conf, readyHandler, failureHandler ]
        console.log('[SFNGeo] Configuring using the following settings:', JSON.stringify(conf))

        if (state.enabled) {
            geo.setConfig(...args)
        } else {
            geo.configure(...args)
        }
    })
}

function maybeEnablePaceChange(state: GeotrackState): GeotrackState {
    if (!__DEV__) return state

    // Manually enable location services in a simulated environment. Normally, this would be triggered
    // by a detected change in the accelerometer. This is inconvenient and difficult to replicate in
    // a simulator, so we manually turn it on instead
    let { isMoving } = state
    console.log('[SFNGeo] - maybeEnablePaceChange', { isMoving })
    console.log('[SFNGeo] - Manually triggering location services by simulating movement')
    // For explicit location updates in dev
    geo.changePace(true)

    // More debugging, if you need it
    setTimeout(() => {
        geo.getState(({ isMoving, enabled, trackingMode }) => {
            console.log('[SFNGeo] - State poll:', { isMoving, enabled, trackingMode })
        })

        geo.getGeofences((geofences: Array<GeofenceConf>) => {
            geofences.forEach((gf: GeofenceConf) => {
                console.log(`[SFNGeo] - Got configured geofence: ${gf.identifier ? gf.identifier : 'UNKNOWN'} ` +
                    `lon=${gf.longitude} lat=${gf.latitude}`)
            })
        })

    }, 1000)

    return state
}

async function handleUnauthorized(gymName: string, store?: InjectableStore): Promise<void> {
    try {
        const now = +new Date()
        const lastAuthNotify = await AsyncStorage.getItem(LAST_AUTH_NOTIFY)
        let authInterval = parseInt(Config.AUTH_NOTIFY_INTERVAL)
        let firstTime = false

        if (!lastAuthNotify) {
            firstTime = true
        }

        console.log(`[SFNGeo] Last auth notify: ${lastAuthNotify}, now? ${now === lastAuthNotify ? 'YES' : 'NO'}`)
        authInterval = authInterval || ONE_DAY * 2 // 48h

        const delta = now - lastAuthNotify

        // If this is not the first time to show this notification
        // And if we haven't shown the notification recently
        if (!firstTime && delta < authInterval) {
            // Don't notify if it's too early
            Analytics.geofenceEvent(events.TooSoonSessionExpired, {
                deviceID: DEVICE_ID,
                lastNotifiedAgoMins: moment.duration(delta).minutes(),
                gymName
            })
            return
        }

        await Notifier.send(
            'unauthorized',
            'SFN Session Expired',
            `Login to check into ${gymName}`,
            Notifier.CategoryBasic,
            { deviceID: DEVICE_ID }
        )

        Analytics.geofenceEvent(events.ShownSessionExpired, { gymName, deviceID: DEVICE_ID })

        AsyncStorage.setItem(LAST_AUTH_NOTIFY, `${now}`)
        if (store) {
            store.dispatch({ type: RESET_STORE })
        }
    } catch (err) {
        // Fail silently
        // TODO Raygun
        console.error('[SFNGeo] Failed to display unauthorized notification', err)
    }
}

export default geotrack
