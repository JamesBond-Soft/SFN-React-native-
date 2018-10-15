// @flow
import Analytics from '../services/Analytics'
import { addOrUpdate, maybeAddPrimitive } from '../util'
import type { API } from '../io/api'
import type { Dispatch, Store } from 'redux'
import type { Attendance, AttendanceStats, Gym, LocationType, User, UserJSON, FeedPrivacy } from '../store/models'

export type ActionResult<T> = {
    type: string,
    payload: T,
    meta: { lastUpdated: Date }
}

export type ActionCreator<T> = (payload: T) => ActionResult<{ [key: string]: T }>

type DeletePayload = { ids: Array<number> }

type Middleware<P> = {
    middleware?: (Store<any, *>) => ((ActionResult<P>) => any) => (ActionResult<P>) => any
}

export type StoreEntitySingle<M, P> = {
    action(M): ActionResult<P>
} & Reducer<M, ActionResult<P>> & Middleware<P>

// M = Model
// P = Action Payload
export type StoreEntity<M, P> = {
    action(Array<M>): ActionResult<P>,
} & Reducer<Array<M>, ActionResult<P>> & Middleware<P>

export type WithDelete<M, P> = {
    deleteAction(M): ActionResult<P>
}

export type Reducer<S, A: ActionResult<*>> = {
    reducer(state: S, action: A): S
}

// TODO Need to come up with a better pattern than this
export type WithFetch<P, T> = {
    fetch(api: API, params?: APIRequestParams): ThunkAction<ActionResult<P>, T>
}

export type WithUpdate<P, T> = {
    update(api: API, path: string, params?: APIRequestParams): ThunkAction<ActionResult<P>, T>
}

export type APIRequestParams = { id?: number }
export type ThunkAction<A: { type: $Subtype<string> }, S> = (dispatch: Dispatch<A>) => Promise<S>
export type AnyThunk = ThunkAction<any, any>

export type IsLoadingPayload = { isGlobalLoading: boolean }
const IS_LOADING_SET = 'isGlobalLoading/SET'
export const isGlobalLoading = {
    action(isGlobalLoading: boolean): ActionResult<IsLoadingPayload> {
        return {
            type: IS_LOADING_SET,
            payload: { isGlobalLoading },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: boolean = false, action: ActionResult<IsLoadingPayload>): boolean {
        if (action.type === IS_LOADING_SET) {
            return action.payload.isGlobalLoading
        } else {
            return state
        }
    }
}

export const loginModes = {
    Facebook: 'Facebook',
    SFNFallback: 'SFNFallback',
    SFN: 'SFN'
}
export type LoginModePayload = { loginMode: $Keys<typeof loginModes> }
const LOGIN_MODE_SET = 'loginMode/SET'
export const loginMode = {
    action(loginMode: $Keys<typeof loginModes>): ActionResult<LoginModePayload> {
        return {
            type: LOGIN_MODE_SET,
            payload: { loginMode },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: string = loginModes.Facebook, action: ActionResult<LoginModePayload>): string {
        if (action.type === LOGIN_MODE_SET) {
            return action.payload.loginMode
        } else {
            return state
        }
    }
}

export type AuthTokenPayload = { authToken: string }
const AUTH_TOKEN_SET = 'authToken/SET'
export const authToken = {
    action(authToken: string): ActionResult<AuthTokenPayload> {
        return {
            type: AUTH_TOKEN_SET,
            payload: { authToken },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: string = '', action: ActionResult<AuthTokenPayload>): string {
        if (action.type === AUTH_TOKEN_SET) {
            return action.payload.authToken
        } else {
            return state
        }
    }
}

// TODO Find a home?
const addKeys = (o: {}, set: Set<string>) => Object.keys(o).forEach((k) => set.add(k))

// TODO Find a home
// o1 is said to be dirty if it has any single attribute different from o2
const isDirty = (o1: {}, o2: {}) => {
    const keySpace = new Set()

    addKeys(o1, keySpace)
    addKeys(o2, keySpace)

    for (let key of keySpace) {
        if (o1[key] !== o2[key]) {
            return true
        }
    }

    return false
}

export type FBAuthData = { fbToken?: string, fbEmail?: string, fbPhotoUrl?: string }
const FB_AUTH_SET = 'fbAuthData/SET'
export const fbAuthData = {
    action(data: FBAuthData): ActionResult<FBAuthData> {
        return {
            type: FB_AUTH_SET,
            payload: data,
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: FBAuthData = {}, action: ActionResult<FBAuthData>): FBAuthData {
        if (action.type === FB_AUTH_SET && isDirty(action.payload, state)) {
            // Merge
            return { ...state, ...action.payload }
        } else {
            return state
        }
    }
}

export type FriendPayload = { friends: Array<string> }
const FRIENDS_SET = 'friends/SET'
export const friends: StoreEntity<string, FriendPayload> = {
    action(friends: Array<string>): ActionResult<FriendPayload> {
        return {
            type: FRIENDS_SET,
            payload: { friends },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: Array<string> = [], action: ActionResult<FriendPayload>): Array<string> {
        if (action.type === FRIENDS_SET) {
            let newState: Array<string> = state
            action.payload.friends.forEach((f) => {
                newState = maybeAddPrimitive(newState, f)
            })
            return newState
        } else {
            return state
        }
    }
}

export type SelfPayload = { self: UserJSON }
const DEFAULT_USER = {
    id: -1,
    email: '',
    firstName: '',
    lastName: '',
    photoUrl: '',
    status: '',
    phone: '',
    homeGym: -1,
    startDate: ''
}

type APIPayload = { api: API }
const API_SET = 'api/SET'
export const api = {
    action(api: API): ActionResult<APIPayload> {
        return {
            type: API_SET,
            payload: { api },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: API | {} = {}, action: ActionResult<APIPayload>): API | {} {
        if (action.type === API_SET) {
            return action.payload.api
        } else {
            return state
        }
    },

    fetch(api: API, user: UserJSON): ThunkAction<ActionResult<SelfPayload>, UserJSON> {
        return async (dispatch: Dispatch<ActionResult<SelfPayload>>): Promise<UserJSON> => {
            let result: Array<UserJSON> = await api.get(`/mm/${user.id}`)
            dispatch(self.action(result[0]))
            return result[0]
        }
    },

    update(api: API, user: UserJSON, params?: APIRequestParams): ThunkAction<ActionResult<SelfPayload>, UserJSON> {
        return async (dispatch: Dispatch<ActionResult<SelfPayload>>): Promise<UserJSON> => {
            let updatedSelf: Array<UserJSON> = await api.put(`/mm/${user.id}`, params)
            dispatch(self.action(updatedSelf[0]))
            return updatedSelf[0]
        }
    }
}

const SELF_SET = 'self/SET'
export const self = {
    middleware() {
        return (next: (ActionResult<SelfPayload>) => any) =>
            (action: ActionResult<SelfPayload>): any => {
                if (action.type === SELF_SET &&
                    action.payload && action.payload.self
                    && action.payload.self.id !== -1) {
                    Analytics.member(action.payload.self)
                }

                return next(action)
            }
    },

    action(self: UserJSON): ActionResult<SelfPayload> {
        return {
            type: SELF_SET,
            payload: { self },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: UserJSON = DEFAULT_USER, action: ActionResult<SelfPayload>): UserJSON {
        if (action.type === SELF_SET) {
            return Object.assign({}, state, action.payload.self)
        } else {
            return state
        }
    },

    fetch(api: API, user: UserJSON): ThunkAction<ActionResult<SelfPayload>, UserJSON> {
        return async (dispatch: Dispatch<ActionResult<SelfPayload>>): Promise<UserJSON> => {
            let result: Array<UserJSON> = await api.get(`/mm/${user.id}`)
            dispatch(self.action(result[0]))
            return result[0]
        }
    },

    update(api: API, user: UserJSON, params?: APIRequestParams): ThunkAction<ActionResult<SelfPayload>, UserJSON> {
        return async (dispatch: Dispatch<ActionResult<SelfPayload>>): Promise<UserJSON> => {
            let updatedSelf: Array<UserJSON> = await api.put(`/mm/${user.id}`, params)
            dispatch(self.action(updatedSelf[0]))
            return updatedSelf[0]
        }
    }
}

export type UserPayload = { users: Array<User> }
const USERS_SET = 'users/SET'
export const users: StoreEntity<User, UserPayload> = {
    action(users: Array<User>): ActionResult<UserPayload> {
        return {
            type: USERS_SET,
            payload: { users },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: Array<User> = [], action: ActionResult<UserPayload>): Array<User> {
        if (action.type === USERS_SET) {
            let newState: Array<User> = state
            action.payload.users.forEach((u) => {
                newState = addOrUpdate(newState, u, (u1) => u1.id === u.id)
            })
            state = newState
        }
        return state
    },

    fetch(api: API, params?: APIRequestParams): ThunkAction<ActionResult<UserPayload>, Array<User>> {
        let fetchUrl

        // TODO
        if (params && params.id) {
            // Fetch one
            fetchUrl = `/mm/${params.id}`
        } else {
            // Fetch all
            fetchUrl = '/mm'
        }

        return async (dispatch: Dispatch<ActionResult<UserPayload>>): Promise<Array<User>> => {
            let userList: Array<User> = []
            userList = await api.get(fetchUrl)
            dispatch(users.action(userList))
            return userList
        }
    }
}

type AttendancePayload = { attendance: Array<Attendance> }
type AttendanceEntity = StoreEntity<Attendance, any> &
WithFetch<AttendancePayload, Array<Attendance>> &
WithDelete<Array<number>, DeletePayload>

export const ATTENDANCE_SET = 'attendance/SET'
export const ATTENDANCE_DEL = 'attendance/DEL'
export const attendance: AttendanceEntity = {
    deleteAction(ids: Array<number>): ActionResult<DeletePayload> {
        return {
            type: ATTENDANCE_DEL,
            payload: { ids },
            meta: { lastUpdated: new Date() }
        }
    },

    action(attendance: Array<Attendance>): ActionResult<AttendancePayload> {
        return {
            type: ATTENDANCE_SET,
            payload: { attendance },
            meta: { lastUpdated: new Date() }
        }
    },

    // TODO Figure out Union type generics
    reducer(state: Array<Attendance> = [], action: ActionResult<any>): Array<Attendance> {
        if (action.type === ATTENDANCE_SET) {
            // TODO Optimize this?
            // Consider default sorting order in the store
            // Allows for quicker updates using binary search
            let newState: Array<Attendance> = state
            action.payload.attendance.forEach((a) => {
                newState = addOrUpdate(newState, a, (at) => at.id === a.id)
            })
            state = newState
        } else if (action.type === ATTENDANCE_DEL && action.payload.ids.length) {
            const ids = new Set(action.payload.ids)
            state = state.filter((at) => !ids.has(at.id))
        }

        return state
    },

    fetch(api: API, params?: APIRequestParams): ThunkAction<ActionResult<AttendancePayload>, Array<Attendance>> {
        if (params && params.id) {
            // Fetch one
        } else {
            // Fetch all
        }

        return async (dispatch: Dispatch<ActionResult<AttendancePayload>>): Promise<Array<Attendance>> => {
            let attendanceList: Array<Attendance> = []

            try {
                attendanceList = await api.get('/attendances')
                dispatch(attendance.action(attendanceList))
            } catch (err) {
                console.log(`[SFNStore] Error getting attendances code=${err.code} status=${err.status}`, err)
                throw err
            }

            return attendanceList
        }
    }
}

const GYM_SET = 'gym/SET'
type GymPayload = { gyms: Array<Gym> }
export const gyms: StoreEntity<Gym, GymPayload> & WithFetch<GymPayload, Array<Gym>> = {
    action(gyms: Array<Gym>): ActionResult<GymPayload> {
        return {
            type: GYM_SET,
            payload: { gyms },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: Array<Gym> = [], action: ActionResult<GymPayload>): Array<Gym> {
        if (action.type === GYM_SET) {
            return action.payload.gyms
        } else {
            return state
        }
    },

    fetch(api: API, params?: APIRequestParams): ThunkAction<ActionResult<GymPayload>, Array<Gym>> {
        // TODO
        if (params && params.id) {
            // Fetch one
        } else {
            // Fetch all
        }

        return async (dispatch: Dispatch<ActionResult<GymPayload>>): Promise<Array<Gym>> => {
            let gymList: Array<Gym> = []

            try {
                gymList = await api.get('/gyms')
                dispatch(gyms.action(gymList))
            } catch (err) {
                console.log(`[SFNStore] Error getting gyms code=${err.code} status=${err.status}`, err)
                throw err
            }

            return gymList
        }
    }
}

const _getCurrentPosition = (): Promise<LocationType> => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude })
    }, (error) => {
        reject(error)
    })
})

const CURRENT_LOCATION_SET = 'currentLocation/SET'
type CurrentLocationPayload = { currentPosition: LocationType }
export const currentLocation: StoreEntitySingle<LocationType, CurrentLocationPayload> &
WithFetch<CurrentLocationPayload, LocationType> = {
    action(currentPosition: LocationType): ActionResult<CurrentLocationPayload> {
        return {
            type: CURRENT_LOCATION_SET,
            payload: { currentPosition },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: LocationType = { lat: 0, lon: 0 },
            action: ActionResult<CurrentLocationPayload>): LocationType {
        if (action.type === CURRENT_LOCATION_SET &&
            action.payload.currentPosition.lat !== state.lat &&
            action.payload.currentPosition.lon !== state.lon) {
            return action.payload.currentPosition
        } else {
            return state
        }
    },

    fetch(): ThunkAction<ActionResult<CurrentLocationPayload>, LocationType> {
        return async (dispatch: Dispatch<ActionResult<CurrentLocationPayload>>): Promise<LocationType> => {
            try {
                // TODO redux-saga
                // Only create a new position instance if the values differ
                let currentPosition = await _getCurrentPosition()
                dispatch(currentLocation.action(currentPosition))
                return currentPosition
            } catch (err) {
                console.warn('[GeoLocation] Error getting current location', err)
                // TODO Don't use this, need a better way to send this back to caller
                return { lat: 0, lon: 0 }
            }
        }
    }
}

const SETTING_FEEDPRIVACY_SET = 'setting/feedPrivacy/SET'
type SettingFeedprivacyPayload = { feedPrivacy: FeedPrivacy }
export const settingFeedprivacy: StoreEntitySingle<FeedPrivacy, SettingFeedprivacyPayload> = {
    action(feedPrivacy: FeedPrivacy): ActionResult<SettingFeedprivacyPayload> {
        return {
            type: SETTING_FEEDPRIVACY_SET,
            payload: { feedPrivacy },
            meta: { lastUpdated: new Date() }
        }
    },

    reducer(state: FeedPrivacy = { memberId: 0, privacy: 'public' },
    action: ActionResult<SettingFeedprivacyPayload>): FeedPrivacy {
        if (action.type === SETTING_FEEDPRIVACY_SET) {
            return action.payload.feedPrivacy
        } else {
            return state
        }
    }
}

const ATTENDANCE_STATS_SET = 'attendanceStats/SET'
type AttendanceStatsPayload = { stats: AttendanceStats }
export const attendanceStats: StoreEntitySingle<AttendanceStats, AttendanceStatsPayload> &
    WithFetch<AttendanceStatsPayload, AttendanceStats> = {
        action(stats: AttendanceStats): ActionResult<AttendanceStatsPayload> {
            return {
                type: ATTENDANCE_STATS_SET,
                payload: { stats },
                meta: { lastUpdated: new Date() }
            }
        },

        reducer(
        state: AttendanceStats = { thisWeek: 0, avg: 0, allTime: 0 },
        action: ActionResult<AttendanceStatsPayload>
    ): AttendanceStats {
            if (action.type === ATTENDANCE_STATS_SET) {
                return action.payload.stats
            } else {
                return state
            }
        },

        fetch(api: API, params?: APIRequestParams): ThunkAction<ActionResult<AttendanceStatsPayload>, AttendanceStats> {
            return async (dispatch: Dispatch<ActionResult<AttendanceStatsPayload>>): Promise<AttendanceStats> => {
                try {
                    if (params && params.id) {
                    // Do nothing
                    }

                    let [stats]: Array<AttendanceStats> = await api.get('/attendances/stats')
                    dispatch(attendanceStats.action(stats))
                    return stats
                } catch (err) {
                    console.log(`[SFNStore] Error getting attendance stats code=${err.code} status=${err.status}`, err)
                    throw err
                }
            }
        }
    }

export const RESET_STORE = 'store/RESET'
export const AR: { [key: string]: Reducer<any, any> } = {
    // Maintain alpha-order
    api,
    attendance,
    attendanceStats,
    authToken,
    fbAuthData,
    friends,
    gyms,
    currentLocation,
    loginMode,
    self,
    users,
    isGlobalLoading,
    settingFeedprivacy
}
