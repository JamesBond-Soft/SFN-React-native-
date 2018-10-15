// @flow

declare type GymGeofence = {
    identifier: string,
    latitude: number,
    longitude: number,
    radius: number,
    loiteringDelay: number,
    notifyOnEntry: boolean,
    notifyOnExit: boolean,
    notifyOnDwell: boolean,
    extras: { gymID: number }
}
