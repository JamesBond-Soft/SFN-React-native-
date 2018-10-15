// @flow
import { attendance, attendanceStats, users } from '../store'
import { attendanceStatus } from '../store/models'
import type { API } from './api'
import type { Dispatch } from 'redux'
import type { ActionResult, ThunkAction, AnyThunk } from '../store'
import type { Attendance, User, AttendanceStats } from '../store/models'

type Payload = {
    attendance: Array<Attendance>
}

type IDPayload = {
    ids: Array<number>
}

export function newAttendance(
    api: API,
    gym: number,
    status?: $Keys<typeof attendanceStatus>
): ThunkAction<ActionResult<Payload>, Array<Attendance>> {
    return async (dispatch: Dispatch<ActionResult<Payload>>): Promise<Array<Attendance>> => {
        const attendanceList: Array<Attendance> = await api.post('/attendances/new', { status, gym })
        console.log('[SFNAttendance] Dispatching created attendance', attendanceList)
        dispatch(attendance.action(attendanceList))
        return attendanceList
    }
}

export function undoAttendance(api: API): ThunkAction<ActionResult<IDPayload>, void> {
    return async (dispatch: Dispatch<ActionResult<IDPayload>>): Promise<void> => {
        const arr: Array<{ id: number }> = await api.delete('/attendances/undo')
        console.log('[SFNAttendance] Dispatching deleted attendance', arr)
        dispatch(attendance.deleteAction(arr.map((o) => o.id)))
    }
}

export function updateAttendanceStatus(
    api: API,
    attendanceID: number,
    status: $Keys<typeof attendanceStatus>
): ThunkAction<ActionResult<Payload>, Array<Attendance>> {
    let suffix: string

    switch (status) {
    case attendanceStatus.Confirmed:
        suffix = 'confirm'
        break
    case attendanceStatus.Denied:
        suffix = 'deny'
        break
    default:
        throw new Error(
                `Can only resolve an attendance record to '${attendanceStatus.Confirmed}' ` +
                    `and '${attendanceStatus.Denied}'`
            )
    }

    console.log(`[SFNAttendance] updating attendance with ID=${attendanceID} to status=${status}`)
    return async (dispatch: Dispatch<ActionResult<Payload>>): Promise<Array<Attendance>> => {
        let params = { status }
        let attendanceList: Array<Attendance> = await api.put(`/attendances/${suffix}/${attendanceID}`, params)
        console.log('[SFNAttendance] Dispatching updated attendance', attendanceList)
        dispatch(attendance.action(attendanceList))
        return attendanceList
    }
}

export function feed(api: API): AnyThunk {
    return async (dispatch: Dispatch<any>): Promise<void> => {
        let feedDataArr: Array<any> = await api.get('/attendances/feed')
        let { members, attendances }: { members: Array<User>, attendances: Array<Attendance> } = feedDataArr[0]
        dispatch(users.action(members))
        dispatch(attendance.action(attendances))
    }
}

export function stats(api: API): AnyThunk {
    return async (dispatch: Dispatch<any>): Promise<void> => {
        let data: Array<any> = await api.get('/attendances/stats')
        let stats: AttendanceStats = data[0]
        dispatch(attendanceStats.action(stats))
    }
}
