package com.socialfitnessnetwork.android

import android.content.Context
import android.os.Build

import com.mixpanel.android.mpmetrics.MixpanelAPI
import com.socialfitnessnetwork.BuildConfig
import org.json.JSONObject

/**
 * Created by johnbernardo on 10/20/17.
 * Requires parity with:
 *   1. The BaseApp.swift iOS implementation
 *   2. The Analytics.js and geotrack.js implementation (runs for iOS)
 */
class Analytics(private val mp: MixpanelAPI) {
    private val geofenceProps: Map<String, Any> by lazy {
        mapOf(
                "deviceID" to Build.BOARD
        )
    }

    private fun makeGeofenceProps(): JSONObject {
        val props = JSONObject()
        geofenceProps.forEach { (key, value) -> props.put(key, value) }
        return props
    }

    fun track(eventName: String, data: Map<String, Any> = emptyMap()): Unit {
        val props = JSONObject()
        data.forEach { (key, value) -> props.put(key, value) }
        mp.track(eventName, props)
    }

    fun geofenceEvent(actionName: String, gymName: String, data: Map<String, Any> = emptyMap()): Unit {
        val props = makeGeofenceProps()
        data.forEach { (key, value) -> props.put(key, value) }
        props.put("gymName", gymName)
        props.put("action", actionName)
        mp.track(Constants.GF_EVT, props)
    }

    companion object {
        fun instance(ctx: Context): Analytics {
            return Analytics(MixpanelAPI.getInstance(ctx, BuildConfig.MIXPANEL_TOKEN)!!)
        }
    }
}
