// @flow
import DeviceInfo from 'react-native-device-info'
import Config from 'react-native-config'
import { RESET_STORE } from '../store'
import { Platform } from 'react-native'
import type { InjectableStore } from '../store/configure'

const DEVICE_ID = DeviceInfo.getUniqueID()

console.log(`[SFNAPI] Read configured API URL: ${Config.API_URL}`)

// !!TODO IMPORTANT - Make these values configurable
export const API_BASE_URL: string = Platform.select({
    ios: Config.API_URL,
    // Use simulator URL in dev for android
    android: __DEV__ ? 'http://10.0.2.2:3232' : Config.API_URL
})

console.debug('[SFNAPI] API_BASE_URL', API_BASE_URL)

export const API_VERSION = 'v1'

export const codes = {
    OK: 'OK',
    E_FORBIDDEN: 'E_FORBIDDEN',
    E_NOT_FOUND: 'E_NOT_FOUND',
    E_MEMBER_NOT_FOUND: 'E_MEMBER_NOT_FOUND',
    E_INTERNAL_SERVER_ERROR: 'E_INTERNAL_SERVER_ERROR',
    UNAUTHORIZED_TOKEN_EXPIRED: 'UNAUTHORIZED_TOKEN_EXPIRED'
}

// Types
// TODO Actually make Data generic type to work
type Data<T> = { [key: string]: any } // eslint-disable-line no-unused-vars
type DataHandler<T: Data<*>> = (d: Array<T>) => void
type RequestFn<T: Data<*>> = (method: string, path: string, params?: {}) => Promise<Array<T>>

export type BaseAPIResponse<D> = {
    code: $Keys<typeof codes>,
    data: D,
    message: string
}

export type APIResponse<M: Data<*>> = BaseAPIResponse<Array<M>>

export function newAPI(token: string, store: ?InjectableStore) {
    const api = {
        hasToken(): boolean {
            return Boolean(token && token.length)
        },

        post<M: Data<*>>(path: string, params?: {} = {}): Promise<Array<M>> {
            return api.request('post', path, params)
        },

        put<M: Data<*>>(path: string, params?: {} = {}): Promise<Array<M>> {
            return api.request('put', path, params)
        },

        get<M: Data<*>>(path: string): Promise<Array<M>> {
            return api.request('get', path)
        },

        delete<M: Data<*>>(path: string, params?: {} = {}): Promise<Array<M>> {
            return api.request('delete', path, params)
        },

        async request<M: Data<*>>(method: string, path: string, params?: {} = {}): Promise<Array<M>> {
            method = method.toUpperCase()
            let args = {
                method,
                headers: {
                    // TODO IMPORTANT - This must come from the store
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Device-ID': DEVICE_ID
                }
            }

            if (method !== 'GET' && params) {
                args = { ...args, body: JSON.stringify(params) }
            }

            const url = apiURL(path)
            console.log('💻[SFNAPI] Making request to URL', url, args)

            const res: any = await fetch(url, args)
            if (res.status !== 200) {
                const err = new Error(`Got non-OK response url=${url} status=${res.status} method=${args.method}`)
                // $FlowFixMe
                err.status = res.status
                // Unauthorized means we blow everything out and reset state. Auth token is
                // expired or invalid
                if (res.status === 401 && store) {
                    store.dispatch({ type: RESET_STORE })
                }
                throw err
            }

            console.log('💻[SFNAPI] Got res (raw)', res)

            try {

                if (__DEV__) {
                    // When Chrome debugger is active, some API requests
                    // will stop here until a simple interaction with the screen
                    // is made. This is an issue with react-native
                    // as explained here:
                    // https://github.com/facebook/react-native/issues/6679
                    // Setting timeout to zero resolve this issue as suggested
                    // in the ticket above.
                    setTimeout(() => null, 0)
                }

                const apiRes: APIResponse<M> = await res.json()
                console.log(`💻[SFNAPI] Got response from ${path}`, apiRes)

                let data: Array<M>
                if (!Array.isArray(apiRes.data)) {
                    data = [apiRes.data]
                } else {
                    data = apiRes.data
                }
                return data
            }
            catch (err) {
                //TODO Raygun
                console.error('[SFNAPI] Error when waiting for response', err)
                throw err
            }
        }
    }
    return api
}
// Hacky type extraction
let T = newAPI('', null)
export type API = typeof T
export function apiURL(path: string): string {
    return `${API_BASE_URL}/${API_VERSION}${path}`
}
export function getMock<M: Data<*>, A: APIResponse<M>>(path: string, mockResult: A): Promise<Array<M>> {
    return mockRequest(mockResult)('get', path)
}
export function putMock<M: Data<*>, A: APIResponse<M>>(path: string, params: {}, mockResult: A): Promise<Array<M>> {
    return mockRequest(mockResult)('put', path, params)
}
export function postMock<M: Data<*>, A: APIResponse<M>>(path: string, params: {}, mockResult: A): Promise<Array<M>> {
    return mockRequest(mockResult)('post', path, params)
} // A = APIResponse // P = Action Payload // M = Data Model
export function delMock<M: Data<*>, A: APIResponse<M>>(path: string, mockResult: A): Promise<Array<M>> {
    return mockRequest(mockResult)('delete', path)
} // TODO Only for mock requests
const delayMs = 1000
export function mockRequest<M: Data<*>>(mockResult: APIResponse<M>): RequestFn<M> {
    return (method: string, path: string, params?: {} = {}): Promise<Array<M>> =>
        new Promise((resolve: DataHandler<M>): void => {
            const merged: APIResponse<M> = { ...params, ...mockResult }
            setTimeout(() => {
                console.log('💻[SFNAPI] mockRequest response', merged)
                resolve(merged.data)
            }, delayMs)
        })
}
