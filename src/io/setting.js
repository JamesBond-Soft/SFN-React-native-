// @flow
import type { API } from './api'
import type { Dispatch } from 'redux'
import type { AnyThunk } from '../store'
import { settingFeedprivacy } from '../store'
import type { FeedPrivacy } from '../store/models'

export function updateFeedPrivacy(api: API, feedPrivacy: FeedPrivacy): AnyThunk {
    return async (dispatch: Dispatch<any>): Promise<void> => {
        await api.put('/setting/feedPrivacy', feedPrivacy )
        dispatch(settingFeedprivacy.action(feedPrivacy))
    }
}

export function getFeedPrivacy(api: API): AnyThunk {
    return async (dispatch: Dispatch<any>): Promise<void> => {
        let res = await api.get('/setting/feedPrivacy' )
        let feedPrivacy: FeedPrivacy = { memberId: res[0].member, privacy: res[0].feedPrivacy }
        dispatch(settingFeedprivacy.action(feedPrivacy))
    }
}
