package com.socialfitnessnetwork.json

/**
 * Created by johnbernardo on 7/8/17.
 */
class APIResult(var code: String, var message: String, var data: Any) {

    fun <T> getData(classOfT: Class<T>): T {
        val gson = GsonInstance.get()
        return gson.fromJson(gson.toJsonTree(data), classOfT)
    }

    override fun toString(): String {
        val fmt = "{\n" +
                "\tcode: '%s',\n" +
                "\tmessage: '%s',\n" +
                "\tdata: '%s'\n" +
                "}\n"
        return String.format(fmt, this.code, this.message, this.data)
    }
}
