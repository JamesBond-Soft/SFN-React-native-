package com.socialfitnessnetwork.android

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

import com.transistorsoft.locationmanager.settings.Settings

/**
 * Created by johnbernardo on 5/6/17.
 */
class BootstrapService : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        // This initializes the service under the hood, if not already running
        if (Settings.isLocationTrackingMode()) {
            Settings.setTrackingMode("geofence")
        }

        if (Constants.GEOFENCE_ACTION == intent.action) {
            handleGeofence(context, intent)
        } else {
            // Notify every 1.5hrs if there was a geofence encountered
            MaybeNotifyService.setServiceAlarm(context, true)
        }
    }

    private fun handleGeofence(context: Context, intent: Intent) {
        val o = intent.extras?.get("geofence")
        val i = Intent(context, MaybeNotifyService::class.java)
        i.action = Constants.NEW_GEOFENCE
        i.putExtra(Constants.GEOFENCE_KEY, o.toString())
        context.startService(i)
    }

    companion object {
        private val TAG = "SFNBootstrap"
    }
}

