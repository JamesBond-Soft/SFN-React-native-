// @flow
// Miscallenous requests
import DeviceInfo from 'react-native-device-info'
import Analytics from '../services/Analytics'
import { apiURL } from './api'
import type { UserJSON } from '../store/models'
import type { FBAuthData } from '../store'
import type { BaseAPIResponse } from './api'

type FacebookAuthData = {
    fbID: string,
    fbEmail: ?string,
    fbPhotoUrl: ?string
}

type SFNAuthData = {
    email: string,
    password: string
}

export type TokenResponse = {
    member: UserJSON,
    token: string
}

const DEVICE_ID = DeviceInfo.getUniqueID()
const OK_AUTH_STATUS = new Set([ 401, 403 ])

// Authenticate a member using their FB credentials
export async function facebookAuth(authData: FacebookAuthData): Promise<BaseAPIResponse<TokenResponse>> {
    try {
        const r = await auth('/mm/fbAuth', authData)
        Analytics.login('fb', 200)
        return r
    } catch (err) {
        // 401 is a normal occurrence, don't log it
        if (OK_AUTH_STATUS.has(err.status)) {
            Analytics.login('fb', err.status)
        }
        throw err
    }
}

// Authenticate a member using their SFN credentials
export async function sfnAuth(authData: SFNAuthData,
                              fbAuthData?: FBAuthData): Promise<BaseAPIResponse<TokenResponse>> {
    // TODO If fallback data, make request to /mm/signinFacebookAuth
    let data = {}
    let authURL = '/mm/auth'
    let token = ''

    if (fbAuthData && Object.keys(fbAuthData).length) {
        authURL = '/mm/signinFbAuth'
        token = fbAuthData.fbToken
        data = { fbEmail: fbAuthData.fbEmail, fbPhotoUrl: fbAuthData.fbPhotoUrl }
    }

    try {
        const r = await auth(authURL, { ...authData, ...data }, token)
        Analytics.login('sfn', 200)
        return r
    } catch (err) {
        // 401 is a normal occurrence, don't log it
        if (OK_AUTH_STATUS.has(err.status)) {
            Analytics.login('sfn', err.status)
        }
        throw err
    }
}

export async function refresh(authToken: string): Promise<BaseAPIResponse<TokenResponse>> {
    try {
        const r = await auth('/mm/refresh', { access_token: authToken })
        Analytics.login('refresh', 200)
        return r
    } catch (err) {
        if (OK_AUTH_STATUS.has(err.status)) {
            Analytics.login('refresh', err.status)
        }
        throw err
    }
}

async function auth(path: string, body: $Subtype<{}>, token?: string): Promise<BaseAPIResponse<TokenResponse>> {
    let args: $Subtype<{}> = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: '',
            'Content-Type': 'application/json',
            'X-Device-ID': DEVICE_ID
        },
        body: JSON.stringify(body)
    }

    if (token) {
        args.headers['Authorization'] = `Bearer ${token}`
    }

    let res: Response
    let apiRes: BaseAPIResponse<TokenResponse>
    let url: string = apiURL(path)

    try {
        res = await fetch(url, args)
        console.debug(`Fetch response (url=${url})`, res)
    } catch (err) {
        // TODO Raygun
        console.error(`Unexpected error waiting for fetch, (url=${url})`, err)
        throw err
    }

    try {
        apiRes = await res.json()
    } catch (err) {
        // TODO Raygun
        console.error(`Unexpected error waiting for JSON deserialization, url=${url}`, err)
        err.status = res.status
        throw err
    }

    if (res.status !== 200) {
        console.log(`Non-200 response for API call to ${path}`, res, apiRes)
        // $FlowFixMe
        throw Object.assign(
            new Error(`Got non-OK response url=${url} code=${apiRes.code} status=${res.status}`),
            { code: apiRes.code, status: res.status, data: apiRes.data }
        )
    }

    console.debug(`[SFNAuth] Got API response for ${path}`, apiRes)
    return apiRes
}
