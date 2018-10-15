package com.socialfitnessnetwork.android

import android.content.Context

import java.util.concurrent.atomic.AtomicInteger

/**
 * Created by johnbernardo on 7/9/17.
 */

object NotificationID {
    private var id: AtomicInteger? = null

    internal fun last(): Int {
        return if (id == null) 0 else id!!.get()
    }

    internal fun next(context: Context): Int {
        val prefs = context.getSharedPreferences(Constants.PREF_KEY, Context.MODE_PRIVATE)

        if (id == null) {
            // Init to the last used ID or start from 0
            val ntfcnID = prefs.getInt(Constants.NTFCN_ID, -1)
            if (ntfcnID == -1) {
                id = AtomicInteger(0)
            } else {
                id = AtomicInteger(ntfcnID)
            }
        }

        val nextID = id!!.incrementAndGet()
        val prefsEditor = prefs.edit()
        prefsEditor.putInt(Constants.NTFCN_ID, nextID)
        // Async update
        prefsEditor.apply()

        return nextID
    }
}
