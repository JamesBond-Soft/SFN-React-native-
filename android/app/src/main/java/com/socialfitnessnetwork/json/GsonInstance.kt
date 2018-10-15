package com.socialfitnessnetwork.json

import com.google.gson.Gson

/**
 * Creating a Gson instance is somewhat expensive. So here we cache a singleton
 * Gson instance for reuse.
 * Created by johnbernardo on 7/9/17.
 */
object GsonInstance {
    // This class and the instance is not loaded into the JVM until the GsonInstance.get()
    // method is called for the first time
    private val instance: Gson by lazy { Gson() }

    fun get(): Gson {
        return instance
    }
}
