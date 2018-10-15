package com.socialfitnessnetwork.android

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.text.TextUtils
import android.util.Log

import com.android.volley.AuthFailureError
import com.android.volley.Request.Method
import com.android.volley.RequestQueue
import com.android.volley.Response
import com.android.volley.VolleyError
import com.android.volley.toolbox.Volley
import com.facebook.react.modules.storage.ReactDatabaseSupplier
import com.socialfitnessnetwork.BuildConfig
import com.socialfitnessnetwork.json.APIResult
import com.socialfitnessnetwork.json.GsonInstance
import com.socialfitnessnetwork.vendor.GsonWriteRequest

import android.provider.Settings.Secure

import java.util.ArrayList
import java.util.Arrays
import java.util.HashMap

/**
 * Application specific request handler
 * Created by johnbernardo on 7/8/17.
 */
internal class RequestManager(private val context: Context) {
    private val queue: RequestQueue = Volley.newRequestQueue(context)

    // Source => ReactDatabaseSupplier.java
    private val allKeys: List<String>
        get() {
            val columns = arrayOf(KEY_COLUMN)
            val l = ArrayList<String>()
            val cursor = dbRead()
                    .query(TABLE_CATALYST, columns, null, null, null, null, null)
            try {
                if (cursor.moveToFirst()) {
                    do {
                        l.add(cursor.getString(0))
                    } while (cursor.moveToNext())
                }
            } catch (e: Exception) {
                Log.e(TAG, "Encountered error while invoking getAllKeys()")
                throw RuntimeException(e)
            } finally {
                cursor.close()
            }

            return l
        }

    fun updateAttendance(
            attendanceID: Int,
            toStatus: AttendanceStatus,
            responseListener: Response.Listener<APIResult>,
            errListener: Response.ErrorListener
    ) {
        val action: String = when (toStatus) {
            AttendanceStatus.CONFIRMED -> "confirm"
            AttendanceStatus.DENIED -> "deny"
            else -> throw RuntimeException("Cannot update attendance ID=$attendanceID to '$toStatus'")
        }

        val url = apiURL(String.format("/v1/attendances/%s/%d", action, attendanceID))
        writeRequest(
                Method.PUT,
                url, null,
                responseListener,
                errListener
        )
    }

    fun createAttendance(
            gymID: Int,
            responseListener: Response.Listener<APIResult>,
            errListener: Response.ErrorListener
    ) {
        val jsonBody = HashMap<String, Any>()
        jsonBody.put("gym", gymID)
        writeRequest(
                Method.POST,
                apiURL("/v1/attendances/new"),
                jsonBody,
                responseListener,
                errListener
        )
    }

    private fun writeRequest(
            method: Int,
            url: String,
            jsonBody: Map<String, Any>?,
            responseListener: Response.Listener<APIResult>,
            errListener: Response.ErrorListener
    ) {
        val headers: Map<String, String>

        try {
            headers = apiHeaders()
        } catch (e: VolleyError) {
            errListener.onErrorResponse(e)
            return
        }

        val request = GsonWriteRequest(
                method,
                url,
                APIResult::class.java,
                headers,
                responseListener,
                errListener
        )

        if (jsonBody != null) {
            request.bodyContentType = "application/json"
            request.setBody(jsonBody)
        }

        this.queue.add(request)
    }

    private fun apiURL(suffix: String): String {
        return String.format("%s%s", apiBaseURL(), suffix)
    }

    private fun apiBaseURL(): String {
        // Simulator URL in dev, otherwise use configured env API_URL
        return if (BuildConfig.DEBUG) "http://10.0.2.2:3232" else BuildConfig.API_URL
    }

    // TODO Find a home
    @Throws(VolleyError::class)
    private fun apiHeaders(): Map<String, String> {
        val m = HashMap<String, String>()

        var authToken: String? = getItem(AUTH_TOKEN_DB_KEY)
        if (authToken == null || authToken.length == 0) {
            throw AuthFailureError("Invalid authToken (might not be logged in yet): '$authToken'")
        }

        authToken = GsonInstance.get().fromJson(authToken, String::class.java)

        m.put("Authorization", String.format("Bearer %s", authToken))
        // Source => RNDeviceModule.java
        m.put(BuildConfig.DEVICE_ID_HDR, Secure.getString(this.context.contentResolver, Secure.ANDROID_ID))
        return m
    }

    // Source => ReactDatabaseSupplier
    private fun getItem(key: String): String {
        val keys = arrayOf(key)
        var result = ""
        val columns = arrayOf(KEY_COLUMN, VALUE_COLUMN)
        val cursor = dbRead().query(
                TABLE_CATALYST,
                columns,
                buildKeySelection(1),
                keys, null, null, null
        )

        try {
            if (cursor.moveToFirst()) {
                do {
                    result = cursor.getString(1)
                } while (cursor.moveToNext())
            }
        } catch (e: Exception) {
            Log.e(TAG, "Encountered error while invoking getAllKeys()")
            throw RuntimeException(e)
        } finally {
            cursor.close()
        }

        return result
    }

    private fun dbRead(): SQLiteDatabase {
        return ReactDatabaseSupplier.getInstance(this.context).readableDatabase
    }

    private fun dbWrite(): SQLiteDatabase {
        return ReactDatabaseSupplier.getInstance(this.context).writableDatabase
    }

    companion object {
        // Source => ReactDatabaseSupplier
        // TODO Refactor this, it's really fragile and coupled to internal implementations of
        // react-native AsyncStorage and even redux-persist
        private val TABLE_CATALYST = "catalystLocalStorage"
        private val KEY_COLUMN = "key"
        private val VALUE_COLUMN = "value"
        private val AUTH_TOKEN_DB_KEY = "reduxPersist:authToken"

        private val TAG = "SFNBootstrap"

        // Source => AsyncLocalStorageUtil.java
        fun buildKeySelection(selectionCount: Int): String {
            val list = arrayOfNulls<String>(selectionCount)
            Arrays.fill(list, "?")
            return KEY_COLUMN + " IN (" + TextUtils.join(", ", list) + ")"
        }
    }
}
