import { attendanceStatus } from './models'
// Millisecond conversions
let time = {
    Second: 1000,
    get Minute() {
        return this.Second * 60
    },
    get Hour() {
        return this.Minute * 60
    },
    get Day() {
        return this.Hour * 24
    }
}

let startMs = +new Date()

export const attendanceData = [
    {
        id: 1,
        member: 960,
        gym: 1014,
        resolvedByUser: null,
        initiatedByUser: -1,
        createdAt: new Date(startMs - (1 * time.Day + 3 * time.Hour)),
        updatedAt: new Date(startMs - (1 * time.Day + 2 * time.Hour)),
        status: attendanceStatus.Unverified
    },
    {
        id: 20,
        member: 960,
        gym: 1034,
        resolvedByUser: null,
        initiatedByUser: 14,
        createdAt: new Date(startMs - (2 * time.Day - 5 * time.Hour)),
        updatedAt: new Date(startMs - 1 * time.Day),
        status: attendanceStatus.Confirmed
    },
    {
        id: 29,
        member: 960,
        gym: 1034,
        resolvedByUser: null,
        initiatedByUser: 14,
        createdAt: new Date(startMs - (1 * time.Day - 1 * time.Hour)),
        updatedAt: new Date(startMs - 6 * time.Hour),
        status: attendanceStatus.Denied
    },
    {
        id: 4,
        member: 960,
        gym: 1014,
        resolvedByUser: null,
        initiatedByUser: -1,
        createdAt: new Date(startMs - (1.5 * time.Day + 1 * time.Hour)),
        updatedAt: new Date(startMs - 1.5 * time.Day),
        status: attendanceStatus.Unverified
    },
    {
        id: 9,
        member: 960,
        gym: 1018,
        resolvedByUser: null,
        initiatedByUser: -1,
        createdAt: new Date(startMs - (1.5 * time.Day - 1.5 * time.Hour)),
        updatedAt: new Date(startMs - 2 * time.Hour),
        status: attendanceStatus.Confirmed
    },
    {
        id: 14,
        member: 960,
        gym: 1040,
        resolvedByUser: null,
        initiatedByUser: -1,
        createdAt: new Date(startMs - (0.5 * time.Day - 3.37 * time.Hour)),
        updatedAt: new Date(startMs - 1 * time.Hour),
        status: attendanceStatus.Confirmed
    }
]
