package com.socialfitnessnetwork.android

import android.app.IntentService
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.support.v4.app.NotificationManagerCompat
import android.util.Log
import com.android.volley.Response
import com.android.volley.VolleyError
import com.socialfitnessnetwork.json.APIResult

/**
 * Handles notification intents sent by [MaybeNotifyService]
 * Created by johnbernardo on 5/6/17.
 */
class NotifyClickService : IntentService(TAG) {
    // TODO Singleton?
    private var requestManager: RequestManager? = null

    override fun onHandleIntent(intent: Intent?) {
        if (intent == null) {
            return
        }

        val action = intent.action
        if (action == null) {
            Log.e(TAG, String.format("Action was null!"))
            clearAllNotifications()
            return
        }

        val notifyID = intent.getIntExtra(Constants.NTFCN_EXTRA_ID, -1)
        if (notifyID == -1) {
            Log.e(TAG, String.format("Missing notifyID from extras for action: %s", action))
            // TODO Raygun
            clearAllNotifications()
            return
        }

        val (status, actionPress) = when {
            action.startsWith(Constants.NTFCN_CHECKIN_CONFIRM) ->
                AttendanceStatus.CONFIRMED to "confirm"
            action.startsWith(Constants.NTFCN_CHECKIN_DENY) ->
                AttendanceStatus.DENIED to "deny"
            action == Constants.NTFCN_DISMISS ->
                null to "dismiss"
            else ->
                null to ""
        }

        var props = mutableMapOf("actionPress" to (actionPress as Any))
        val attendanceID = intent.getIntExtra(Constants.ATTENDANCE_ID_KEY, -1)
        if (attendanceID == -1) {
            Log.e(TAG, "Missing attendanceID from extras for action: '$action'")
            // TODO Raygun
            clearNotification(notifyID)
            Analytics.instance(this).track(Constants.NOTIFY_BAD_PAYLOAD, props)
            return
        }

        val gymName = intent.getStringExtra(Constants.GYM_NAME_KEY)
        props.putAll(arrayListOf(
                "gymName" to gymName,
                "attendanceID" to attendanceID
        ))

        if (status != null) {
            // Ping analytics
            Analytics.instance(this).track(Constants.NOTIFY_ACTION, props)

            // Actually update the attendance now
            performRequest(attendanceID, gymName, status, this)
        } else {
            if (actionPress == "dismiss") {
                // Ping analytics
                Analytics.instance(this).track(Constants.NOTIFY_DISMISS, props)
            } else {
                Log.e(TAG, "Unknown action: '$action'")
            }
        }

        clearNotification(notifyID)
    }

    // Nuclear option
    private fun clearAllNotifications() {
        NotificationManagerCompat.from(this).cancelAll()
    }

    private fun clearNotification(notifyID: Int) {
        NotificationManagerCompat.from(this).cancel(Constants.NTFCN_GROUP_ID, notifyID)
    }

    private fun performRequest(
            attendanceID: Int,
            gymName: String,
            toStatus: AttendanceStatus,
            context: Context
    ) {
        val rm = getRequestManager()!!
        val onSuccess = object : Response.Listener<APIResult> {
            override fun onResponse(response: APIResult?) {
                // Noop
            }
        }
        val onErr = object : Response.ErrorListener {
            override fun onErrorResponse(error: VolleyError?) {
                Log.e(TAG, "Got error while updating attendanceID=$attendanceID", error)
                // TODO Requeue for handling?
                // Display notification asking the member to re-authenticate
                AuthFailureHandler.maybeHandle(context, gymName, error)
            }
        }

        rm.updateAttendance(attendanceID, toStatus, onSuccess, onErr)
    }

    private fun getRequestManager(): RequestManager? {
        if (this.requestManager == null) {
            this.requestManager = RequestManager(this)
        }

        return this.requestManager
    }

    companion object {
        private val TAG = "SFNNotifyClick"
        private val URI_ID = "sfn"
        private val CHEME_PREFIX = String.format("%s://%s", URI_ID, URI_ID)

        fun newPendingIntent(context: Context, i: Intent?): PendingIntent {
            val intent = i ?: Intent(context, NotifyClickService::class.java)
            return PendingIntent.getService(context, 0, intent, 0)
        }
    }
}

