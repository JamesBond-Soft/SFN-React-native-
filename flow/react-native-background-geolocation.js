// @flow
// T = arg type
// R = return type

declare module 'react-native-background-geolocation-android' {
  declare function Func1<T, R>(arg: T): R;

  declare type Device = {
    manufacturer: string;
    available: true;
    platform: string;
    uuid: string;
    model: string;
    version: string;
  }

  declare export type ErrFunc = Func1<Error, void>;
  declare export type GeoStateFunc = Func1<GeotrackState, void>;

  declare type Params = {
     device: Device
  }

  declare export type GeotrackState = {
    stopOnTerminate: string;
    disableMotionActivityUpdates: boolean;
    url: string;
    desiredAccuracy: number;
    stopDetectionDelay: number;
    activityRecognitionInterval: number;
    distanceFilter: number;
    activityType: number;
    useSignificantChangesOnly: boolean;
    autoSync: boolean;
    isMoving: boolean;
    maxDaysToPersist: number;
    stopTimeout: number;
    enabled: boolean;
    debug: true;
    batchSync: boolean;
    headers: {};
    disableElasticity: boolean;
    stationaryRadius: number;
    params: Params;
    trackingMode: string;
  }

  declare export type GeofenceConf = {
    identifier: string;
    radius: number;
    latitude: number;
    longitude: number;
    notifyOnExit: boolean;
    notifyOnEntry: boolean;
    notifyOnDwell: boolean;
    extras: any;
  }

  declare export type Location = {
    activity: {
      confidence: number;
      type: string;
    };

    geofence: {
      action: string;
      identifier: string;
    };

    extras: any;
    timestamp: string;
    uuid: string;
  }

  declare export type GeofenceEvent = {
    action: string;
    identifier: string;
    location: Location;
    extras?: any;
  }

  declare type AuthRequest = 'Always' | 'WhenInUse';
  declare type ActivityType = 'Other' |   'Fitness' | 'OtherNavigation' | 'AutomotiveNavigation';
  declare type GeotrackEvent = 'location' | 'motionchange' | 'activitychange' | 'providerchange' | 'geofence' | 'geofenceschange' | 'heartbeat' | 'schedule' | 'http';

  declare export type GeotrackConf = {
    desiredAccuracy: number;
    distanceFilter?: number;
    stopAfterElapsedMinutes?: number;
    desiredOdometerAccuracy?: number;
    stationaryRadius?: number;
    useSignificantChangesOnly?: boolean;
    locationAuthorizationRequest?: AuthRequest;
    locationAuthorizationAlert?: {};
    activityRecognitionInterval?: number;
    stopTimeout?: number;
    minimumActivityRecognitionConfidence?: number;
    stopDetectionDelay?: number;
    disableStopDetection?: boolean;
    stopOnTerminate?: boolean;
    startOnBoot: boolean;
    heartbeatInterval?: number;
    schedule?: ?Array<mixed>;
    geofenceProximityRadius: number;
    geofenceInitialTriggerEntry?: boolean;
    debug?: boolean;
    logLevel?: number;
    logMaxDays?: number;
    // Android only
    locationUpdateInterval?: number;
    fastestLocationUpdateInterval?: number;
    deferTime?: number;
    foregroundService?: boolean;
    notificationTitle?: string;
    notificationText?: string;
    notificationColor?: ?string;
    notificationIcon?: string;
    forceReloadOnMotionChange?: boolean;
    forceReloadOnLocationChange?: boolean;
    forceReloadOnGeofence?: boolean;
    forceReloadOnHeartbeat?: boolean;
    forceReloadOnSchedule?: boolean;
    forceReloadOnBoot?: boolean;
    // iOS only
    activityType?: ActivityType;
    disableMotionActivityUpdates?: boolean;
    preventSuspend?: boolean;
  }

  declare class GeotrackPolyfill {
    LOG_LEVEL_OFF: number;
    LOG_LEVEL_ERROR: number;
    LOG_LEVEL_WARNING: number;
    LOG_LEVEL_INFO: number;
    LOG_LEVEL_DEBUG: number;
    LOG_LEVEL_VERBOSE: number;

    DESIRED_ACCURACY_HIGH: number;
    DESIRED_ACCURACY_MEDIUM: number;
    DESIRED_ACCURACY_LOW: number;
    DESIRED_ACCURACY_VERY_LOW: number;

    AUTHORIZATION_STATUS_NOT_DETERMINED: number;
    AUTHORIZATION_STATUS_RESTRICTED: number;
    AUTHORIZATION_STATUS_DENIED: number;
    AUTHORIZATION_STATUS_ALWAYS: number;
    AUTHORIZATION_STATUS_WHEN_IN_USE: number;

    getState(cb: GeoStateFunc): void;
    configure(conf: GeotrackConf, cb: GeoStateFunc, errback?: ErrFunc): void;
    setConfig(conf: GeotrackConf, cb: () => void, errback?: ErrFunc): void;
    removeListeners(): void;
    start(cb: GeoStateFunc, errback?: ErrFunc): void;
    stop(cb: GeoStateFunc, errback?: ErrFunc): void;
    startGeofences(cb: GeoStateFunc): void;
    addGeofence(fenceConf: GeofenceConf, cb?: () => void, errback?: ErrFunc): void;
    addGeofences(fenceConfs: Array<GeofenceConf>, cb?: () => void, errback?: ErrFunc): void;
    removeGeofence(id: string, cb?: () => void,  errback?: ErrFunc): void;
    getGeofences(cb: Func1<Array<GeofenceConf>, void>, errback?: ErrFunc): void;
    setLogLevel(level: number, cb?: () => void): void;
    getLog(cb: Func1<string, void>): void;
    destroyLog(cb: Function, errback?: ErrFunc): void;
    emailLog(email: string, cb?: Function): void;
    changePace(v: boolean, cb?: () => void, errback?: ErrFunc): void;
    on(event: GeotrackEvent, cb: Function): void;
    un(event: GeotrackEvent, cb: Function): void;
    finish(taskId: number): void;
  }

  declare export var Geotrack: typeof GeotrackPolyfill;

  // Works
  //declare var exports: GeotrackPolyfill;
  declare var API: typeof GeotrackPolyfill;
  declare export default API;
}