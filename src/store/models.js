// @flow
export const attendanceStatus = {
    Unverified: 'Unverified',
    Confirmed: 'Confirmed',
    Denied: 'Denied'
}

export const privacyStatus = {
    public: 'public',
    friends: 'friends',
    private: 'private'
}

type BaseUser = {
    id: number,
    email: string,
    firstName: string,
    lastName: string,
    photoUrl: string,
    status: string,
    phone: string
}

// User as it comes back from the JSON endpoint before being serialized to User
export type UserJSON = {
    homeGym: number,
    startDate: string
} & BaseUser

// Generic user for most use cases
// TODO: use Member instead as the name
// is more consistent with the back-end
export type User = {
    homeGym: string,
    startDate: Date,
    // This field is only provided when members are returned from attendance feed endpoints
    connectedVia?: 'fb' | 'sfn' | 'ab'
} & BaseUser

export type Attendance = {
    id: number,
    member: number,
    gym: number,
    // Only populated if this was attendance record was resolved by a portal user (should only be done by admins)
    resolvedByUser: ?number,
    // Portal user ID, or null. If null, then it was initiated by the user's mobile app on device
    initiatedByUser: ?number,
    // Same as checkinTime
    createdAt: Date,
    updatedAt: Date,
    status: $Keys<typeof attendanceStatus>
}

export type AttendanceStats = {
    thisWeek: number,
    avg: number,
    allTime: number
}

export type Gym = {
    id: number,
    name: string,
    affiliateId: number,
    address1: string,
    address2: ?string,
    city: string,
    state: string,
    zipCode: string,
    latitude: number,
    longitude: number,
    description: ?string
}

export type LocationType = {
    lat: number,
    lon: number
}

export type FeedPrivacy = {
    privacy: $Keys<typeof privacyStatus>,
    memberId: number
}