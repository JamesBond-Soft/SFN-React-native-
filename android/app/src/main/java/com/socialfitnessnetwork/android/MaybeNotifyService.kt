package com.socialfitnessnetwork.android

import android.app.AlarmManager
import android.app.IntentService
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.support.v4.app.NotificationManagerCompat
import android.support.v7.app.NotificationCompat
import android.util.Log
import com.android.volley.Response
import com.android.volley.VolleyError

import com.socialfitnessnetwork.BuildConfig
import com.socialfitnessnetwork.R
import com.socialfitnessnetwork.json.APIResult
import com.socialfitnessnetwork.json.Attendance

import org.json.JSONException
import org.json.JSONObject

import java.util.HashMap

/**
 * Created by johnbernardo on 5/6/17.
 */
class MaybeNotifyService : IntentService(TAG) {

    // TODO Do we even need this or can we use Intent extras?
    private var latestGeofence: JSONObject? = null
    private var requestManager: RequestManager? = null

    private fun checkNotificationsEnabled() {
        val prefs = this.getSharedPreferences(Constants.PREF_KEY, Context.MODE_PRIVATE)
        val isEnabled = NotificationManagerCompat.from(this).areNotificationsEnabled()
        val wasEnabled = prefs.getBoolean(Constants.NOTIFICATIONS_ENABLED_PKEY, true)

        // Values differ
        if (isEnabled != wasEnabled) {
            // If it was enabled previously, and is now disabled, we need to know
            if (!isEnabled) {
                Analytics.instance(this).track("notifyPermissionDenied")
            }

            val prefsEditor = prefs.edit()
            prefsEditor.putBoolean(Constants.NOTIFICATIONS_ENABLED_PKEY, isEnabled)
            // Async update
            prefsEditor.apply()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        checkNotificationsEnabled()

        if (intent != null) {
            if (Constants.NEW_GEOFENCE == intent.action) {
                val json = intent.getStringExtra(Constants.GEOFENCE_KEY)

                try {
                    latestGeofence = JSONObject(json)
                } catch (e: JSONException) {
                    Log.e(TAG, "Caught error while parsing JSON for new Geofence", e)
                }
            }
        } else {
            Log.d(TAG, "Intent was null")
        }

        return super.onStartCommand(intent, flags, startId)
    }

    override fun onHandleIntent(intent: Intent?) {
        // We got a geofence; perform the notification
        if (latestGeofence != null) {
            val json = latestGeofence!!.toString()
            val gymName: String
            val gymID: Int

            try {
                gymName = latestGeofence!!.getString("identifier")
                val extras = latestGeofence!!.getJSONObject("extras")
                gymID = extras.getInt("gymID")
            } catch (e: JSONException) {
                Log.e(TAG, "Error occurred while trying to obtain Geofence fields", e)
                return
            }

            // Only display notification if we haven't displayed it since the interval
            maybeNotify(gymName, gymID)
        }
    }

    private fun maybeNotify(gymName: String, gymID: Int) {
        val prefs = this.getSharedPreferences(Constants.PREF_KEY, Context.MODE_PRIVATE)

        val now = System.currentTimeMillis()
        var lastNotified = prefs.getLong(lastNotifyKey(gymID), -1)
        if (lastNotified == (-1).toLong()) {
            lastNotified = now
        }

        // Delta greater than the interval specified means we're clear to notify
        // Zero delta means this is the first notification ever, meaning clear to notify
        val delta = now - lastNotified
        if (delta > CHECKIN_NOTIFY_INTERVAL || delta == 0L) {
            // We're clear
            val prefsEditor = prefs.edit()
            prefsEditor.putLong(lastNotifyKey(gymID), now)
            // Async update
            prefsEditor.apply()
            // Make request
            performRequest(gymName, gymID, this)
            return
        }

        Analytics.instance(this).geofenceEvent(Constants.GF_NOTIFY_TOO_SOON, gymName, mapOf(
                "lastNotifiedAgoMins" to (delta / 60000)
        ))
    }

    private fun performRequest(gymName: String, gymID: Int, context: Context) {
        val onSuccess = object : Response.Listener<APIResult> {
            override fun onResponse(response: APIResult?) {
                val attendance = response!!.getData(Attendance().javaClass)
                // Display notification
                displayNotification(gymName, attendance.id)
                // Make room for the next Geofence we might encounter
                latestGeofence = null
            }
        }
        val onErr = object : Response.ErrorListener {
            override fun onErrorResponse(error: VolleyError?) {
                val fmt = "Got error while attempting to create attendance for gymID=%d"
                Log.e(TAG, String.format(fmt, gymID), error)
                // TODO Handle errors
                // Auth error:
                //   - Push latestGeofence for deferred handling later (after authenticating)
                //     in a local DB/queue
                // Everything else - Report it to Raygun
                // Make room for the next Geofence we might encounter

                // Display notification asking the member to re-authenticate
                AuthFailureHandler.maybeHandle(context, gymName, error)
                latestGeofence = null
            }
        }

        getRequestManager()!!.createAttendance(gymID, onSuccess, onErr)
    }

    private fun displayNotification(gymName: String, attendanceID: Int) {
        val r = resources
        val nm = NotificationManagerCompat.from(this)

        // Cancel existing notification if it happens to exist
        var notifyID = NotificationID.last()
        if (notifyID > 0) {
            nm.cancel(notifyID)
        }

        notifyID = NotificationID.next(this)

        // Build notification
        val dismissIntent = Intent(this, NotifyClickService::class.java)
        dismissIntent.action = String.format("%s:%d", Constants.NTFCN_CHECKIN_CONFIRM, attendanceID)
        val confirmIntent = Intent(this, NotifyClickService::class.java)
        confirmIntent.action = String.format("%s:%d", Constants.NTFCN_CHECKIN_CONFIRM, attendanceID)
        val denyIntent = Intent(this, NotifyClickService::class.java)
        denyIntent.action = String.format("%s:%d", Constants.NTFCN_CHECKIN_DENY, attendanceID)

        val commonProps = arrayListOf(
                Constants.GYM_NAME_KEY to gymName,
                Constants.ATTENDANCE_ID_KEY to attendanceID,
                Constants.NTFCN_EXTRA_ID to notifyID
        )

        arrayOf(dismissIntent, confirmIntent, denyIntent).forEach { i ->
            commonProps.forEach { (k, v) ->
                when (v) {
                    is Int -> i.putExtra(k, v)
                    is String -> i.putExtra(k, v)
                }
            }
        }

        val dismissPI = NotifyClickService.newPendingIntent(this, dismissIntent)
        val confirmPI = NotifyClickService.newPendingIntent(this, confirmIntent)
        val denyPI = NotifyClickService.newPendingIntent(this, denyIntent)

        val n = NotificationCompat.Builder(this)
                .setTicker(String.format(r.getString(R.string.gf_ntfcn_ticker), gymName))
                .setSmallIcon(R.drawable.ic_sfn_ntfcn)
                .setContentTitle(r.getString(R.string.gf_ntfcn_title))
                .setContentText(String.format(r.getString(R.string.gf_ntfcn_text), gymName))
                .setDeleteIntent(dismissPI)
                .addAction(R.drawable.ic_sfn_ntfcn_confirm, r.getString(R.string.yes), confirmPI)
                .addAction(R.drawable.ic_sfn_ntfcn_deny, r.getString(R.string.no), denyPI)
                .setOngoing(true)
                .build()

        Log.d(TAG, String.format(
                "Sending notification Gym='%s' attendanceID=%d notifyID=%d",
                gymName,
                attendanceID,
                notifyID))

        // Ping analytics
        val analytics = Analytics.instance(this)
        val props = HashMap<String, Any>()
        props.put("attendanceID", attendanceID)
        analytics.geofenceEvent(Constants.GF_NOTIFY_SHOWN, gymName, props)

        nm.notify(Constants.NTFCN_GROUP_ID, notifyID, n)
    }

    private fun getRequestManager(): RequestManager? {
        if (this.requestManager == null) {
            this.requestManager = RequestManager(this)
        }

        return this.requestManager
    }

    companion object {
        private val TAG = "SFNMaybeNotify"
        private val LAST_CHECKIN_NOTIFY = String.format("%s.LAST_CHECKIN_NOTIFY", Constants.PKG)
        private val CHECKIN_NOTIFY_INTERVAL = java.lang.Long.parseLong(BuildConfig.CHECKIN_NOTIFY_INTERVAL)

        fun newPendingIntent(context: Context, i: Intent?): PendingIntent {
            val intent = i ?: Intent(context, MaybeNotifyService::class.java)
            return PendingIntent.getService(context, 0, intent, 0)
        }

        fun setServiceAlarm(context: Context, enable: Boolean) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val pi = newPendingIntent(context, null)

            if (enable) {
                alarmManager.setInexactRepeating(AlarmManager.ELAPSED_REALTIME,
                        SystemClock.elapsedRealtime(), BuildConfig.NOTIFY_POLL_MS.toLong(), pi)
            } else {
                alarmManager.cancel(pi)
                pi.cancel()
            }
        }

        private fun lastNotifyKey(gymID: Int): String {
            return "$LAST_CHECKIN_NOTIFY-$gymID"
        }
    }
}

