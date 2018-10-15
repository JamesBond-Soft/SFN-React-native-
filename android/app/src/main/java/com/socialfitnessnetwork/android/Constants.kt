package com.socialfitnessnetwork.android

import com.socialfitnessnetwork.BuildConfig

/**
 * Created by johnbernardo on 5/6/17.
 */
object Constants {
    val PKG = "com.socialfitnessnetwork.android"
    val NEW_GEOFENCE = "$PKG.NEW_GEOFENCE"
    val GEOFENCE_KEY = "$PKG.GEOFENCE_KEY"
    val ATTENDANCE_ID_KEY = "$PKG.ATTENDANCE_ID"
    val GYM_NAME_KEY = "$PKG.GYM_NAME"
    val PREF_KEY = "$PKG.PREFS"
    val NOTIFICATIONS_ENABLED_PKEY = "$PKG.NOTIFY_ENABLED"
    // TODO Change this depending on environment (debug vs release)

    val NTFCN_GROUP_ID = "$PKG.SFNNotify"
    val NTFCN_EXTRA_ID = "$PKG.NTFCN_EXTRA_ID"
    val NTFCN_ID = "$PKG.NTFCN_ID"
    val NTFCN_CHECKIN_CONFIRM = "$PKG.CHECKIN_CONFIRM"
    val NTFCN_DISMISS = "$PKG.DISMISS"
    val NTFCN_CHECKIN_DENY = "$PKG.CHECKIN_DENY"
    val DEBUG = "$PKG.DEBUG"
    val GEOFENCE_ACTION = "com.transistorsoft.locationmanager.event.GEOFENCE"

    // Analytics constants
    // Actions under the geofenceEvent
    val GF_EVT = "geofenceEvent"
    val GF_NOTIFY_TOO_SOON = "notifyTooSoon"
    val GF_NOTIFY_SHOWN = "notifyShown"
    val GF_NOTIFY_TOO_SOON_EXPIRED = "${GF_NOTIFY_TOO_SOON}SessionExpired"
    val GF_NOTIFY_SHOWN_EXPIRED = "${GF_NOTIFY_SHOWN}SessionExpired"

    // Events of their own
    val NOTIFY_BAD_PAYLOAD = "notifyActionBadPayload"
    val NOTIFY_ACTION = "notifyAction"
    val NOTIFY_DISMISS = "notifyDismiss"
}

