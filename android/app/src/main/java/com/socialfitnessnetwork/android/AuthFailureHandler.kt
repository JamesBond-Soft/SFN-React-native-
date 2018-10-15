package com.socialfitnessnetwork.android

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.support.v4.app.NotificationCompat
import android.support.v4.app.NotificationManagerCompat
import android.util.Log

import com.android.volley.AuthFailureError
import com.android.volley.VolleyError
import com.socialfitnessnetwork.BuildConfig
import com.socialfitnessnetwork.MainActivity
import com.socialfitnessnetwork.R

/**
 * Created by johnbernardo on 7/9/17.
 */
internal object AuthFailureHandler {
    private val TAG = "SFNAuthFailureHandler"
    private val LAST_AUTH_NOTIFIED = String.format("%s.LAST_AUTH_NOTIFIED", Constants.PKG)
    private val AUTH_NOTIFY_INTERVAL = java.lang.Long.parseLong(BuildConfig.AUTH_NOTIFY_INTERVAL)

    fun maybeHandle(context: Context, gymName: String, error: VolleyError?) {
        if (error is AuthFailureError) {
            handle(context, gymName, error)
        }
    }

    fun handle(context: Context, gymName: String, error: AuthFailureError) {
        val now = System.currentTimeMillis()
        val lastNotified = lastNotified(context, now)
        val delta = now - lastNotified
        val analytics = Analytics.instance(context)

        // Delta greater than the interval specified means we're clear to notify
        // Zero delta means this is the first notification ever, meaning clear to notify
        if (delta > AUTH_NOTIFY_INTERVAL || delta == 0L) {
            showAuthNotification(context, now)
            analytics.geofenceEvent(Constants.GF_NOTIFY_SHOWN_EXPIRED, gymName)
            return
        }

        Log.d(TAG, String.format(
                "Can't display notification, not enough time has elapsed delta=%d interval=%d",
                delta,
                AUTH_NOTIFY_INTERVAL))

        // Ping analytics
        analytics.geofenceEvent(Constants.GF_NOTIFY_TOO_SOON_EXPIRED, gymName, mapOf(
              "lastNotifiedAgoMins" to (delta / 60000)
        ))
    }

    private fun showAuthNotification(context: Context, now: Long) {
        val prefsEditor = prefs(context).edit()
        prefsEditor.putLong(LAST_AUTH_NOTIFIED, now)
        // Async update
        prefsEditor.apply()

        val r = context.resources
        val nm = NotificationManagerCompat.from(context)

        val intent = Intent(context, MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        val pendingIntent = PendingIntent.getActivity(context, 0, intent, 0)

        // TODO Make this also pass data to the react app which:
        // - Allows the react app to create the notification based on the intent passed in
        // - Routes the member to the attendance view after logging in
        val n = NotificationCompat.Builder(context)
                .setContentIntent(pendingIntent)
                .setTicker(r.getString(R.string.auth_fail_ticker))
                .setSmallIcon(R.drawable.ic_sfn_ntfcn)
                .setContentTitle(r.getString(R.string.auth_fail_title))
                .setContentText(r.getString(R.string.auth_fail_text))
                .setOngoing(true)
                .build()

        n.flags = n.flags or Notification.FLAG_AUTO_CANCEL

        // Clear any others, just in case
        nm.cancelAll()
        nm.notify(Constants.NTFCN_GROUP_ID, NotificationID.next(context), n)
    }

    private fun prefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(Constants.PREF_KEY, Context.MODE_PRIVATE)
    }

    private fun lastNotified(context: Context, now: Long): Long {
        val prefs = prefs(context)
        var lastNotified = prefs.getLong(LAST_AUTH_NOTIFIED, -1)

        if (lastNotified == (-1).toLong()) {
            lastNotified = now
        }

        return lastNotified
    }
}
