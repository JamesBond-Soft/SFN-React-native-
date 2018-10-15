// @flow
import Mixpanel from 'react-native-mixpanel'
import DeviceInfo from 'react-native-device-info'
import Config from 'react-native-config'
import { Platform, Dimensions } from 'react-native'
import type { UserJSON } from '../store/models'

const dd = (n: number): string => n > 9 ? `${n}` : `0${n}`
const viewStack = []
const APP_SESSION_EVT = 'appSession'
const APP_DEVICE_INFO = {
    os: Platform.OS,
    osVersion: Platform.Version,
    appVersion: DeviceInfo.getReadableVersion(),
    deviceCountry: DeviceInfo.getDeviceCountry(),
    deviceID: DeviceInfo.getUniqueID(),
    deviceLocale: DeviceInfo.getDeviceLocale(),
    deviceManufacturer: DeviceInfo.getManufacturer(),
    deviceModel: DeviceInfo.getModel(),
    deviceHeight: Dimensions.get('window').height,
    deviceWidth: Dimensions.get('window').width
}

if (!Config.MIXPANEL_TOKEN) {
    // TODO Raygun
    console.warn('No analytics token found!')
}

Mixpanel.sharedInstanceWithToken(Config.MIXPANEL_TOKEN)
Mixpanel.registerSuperProperties({ view: null })

export default {
    member(m: UserJSON): void {
        console.debug('Analytics::member', m.id)
        const id = `${m.id}`
        // TODO Need backend flag to determine first time login
        // Mixpanel.createAlias(id)
        Mixpanel.identify(id)
        Mixpanel.set({
            '$first_name': m.firstName,
            '$last_name': m.lastName,
            '$email': m.email,
            '$phone': m.phone,
            homeGym: m.homeGym
        })
    },

    // TODO Add global info
    // - App version (react native bundle version)
    appEnter(): void {
        console.debug('Analytics::appEnter')
        Mixpanel.registerSuperProperties(APP_DEVICE_INFO)
        Mixpanel.timeEvent(APP_SESSION_EVT)
    },

    appExit(): void {
        console.debug('Analytics::appExit')
        Mixpanel.track(APP_SESSION_EVT)
        Mixpanel.registerSuperProperties({ view: null })
    },

    // Call when login completes
    login(via: 'fb' | 'sfn' | 'refresh', status: number): void {
        console.debug('Analytics::login', via, status)
        Mixpanel.trackWithProperties('login', { via, status })
    },

    // Call when user logs out
    logout(via: 'fb' | 'sfn'): void {
        console.debug('Analytics::logout', via)
        Mixpanel.trackWithProperties('logout', { via })
    },

    // Call when a route view is loaded. Builds a view stack for nested views.
    // So if you navigate to the attendance page, your view would be ['attendance'],
    // and if you open a view there, say, the calendar, you would have
    // ['attendance', 'calendar'] in the view stack
    viewEnter(viewName: string): void {
        viewStack.push(viewName)
        const fullViewName = viewStack.join('-')
        console.debug('Analytics::viewEnter', fullViewName)

        Mixpanel.registerSuperProperties({ view: fullViewName })
        Mixpanel.timeEvent(`Screen-${fullViewName}`)
    },

    // Call when a route view component is unmounted. Tracks the current viewStack, then
    // pops the last view off the viewStack.
    viewExit(): void {
        const oldFullViewName = viewStack.join('-')
        console.debug('Analytics::viewExit', oldFullViewName)
        if (oldFullViewName) {
            Mixpanel.track(`Screen-${oldFullViewName}`)
        }

        viewStack.pop()
        const fullViewName = viewStack.join('-')
        // Order is important here, must set this prop after we track the event (above),
        // otherwise we mutate the global state value before it's tracked
        Mixpanel.registerSuperProperties({ view: fullViewName })
    },

    // Pop off the entire stack
    viewExitAll(): void {
        console.debug('Analytics.viewExitAll')
        while (viewStack.length) {
            this.viewExit()
        }
    },

    // Call when a distinct action is performed in a route view
    viewAction(actionName: string, data: {} = {}): void {
        console.debug('Analytics::viewAction', actionName, data)
        Mixpanel.trackWithProperties('viewAction', { ...data, action: actionName })
    },

    // Define a start time for an event. For instance, loading a video from the file system,
    // or uploading an image to the server.
    timeStart(eventName: string): void {
        console.debug('Analytics::timeStart', eventName)
        Mixpanel.timeEvent(eventName)
    },

    // Track a single event, or stop a timed event (that was triggered by timeStart)
    timeEnd(eventName: string): void {
        console.debug('Analytics::timeEnd', eventName)
        Mixpanel.track(eventName)
    },

    geofenceEvent(actionName: string, data: {} = {}): void {
        console.debug('Analytics::geofenceEvent', actionName, data)
        Mixpanel.trackWithProperties('geofenceEvent', { ...data, action: actionName })
    },

    // Helper to format a date to a format friendly for analytics consumption
    fmtDate(d: Date): string {
        return `${d.getUTCFullYear()}-${dd(d.getUTCMonth()+1)}` +
            `-${dd(d.getUTCDate())}${dd(d.getUTCHours())}:` +
            `${dd(d.getUTCMinutes())}:${dd(d.getUTCSeconds())}`
    }
}