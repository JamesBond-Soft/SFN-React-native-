package com.socialfitnessnetwork.vendor;

import com.android.volley.AuthFailureError;
import com.android.volley.Response;
import com.google.gson.Gson;
import com.socialfitnessnetwork.json.GsonInstance;

import java.util.Map;

/**
 * Created by johnbernardo on 7/8/17.
 */
public class GsonWriteRequest<T> extends GsonRequest<T> {
    private String bodyContentType;
    private Map<String, Object> body;

    public GsonWriteRequest(
            int method,
            String url,
            Class<T> clazz,
            Map<String, String> headers,
            Response.Listener<T> listener,
            Response.ErrorListener errorListener
    ) {
        super(method, url, clazz, headers, listener, errorListener);
    }

    public GsonWriteRequest<T> setBody(Map<String, Object> body) {
        this.body = body;
        return this;
    }

    public GsonWriteRequest<T> setBodyContentType(String bodyContentType) {
        this.bodyContentType = bodyContentType;
        return this;
    }

    @Override
    public byte[] getBody() throws AuthFailureError {
        return this.body == null ? super.getBody() : GsonInstance.INSTANCE.get().toJson(body).getBytes();
    }

    @Override
    public String getBodyContentType() {
        return this.bodyContentType == null ? super.getBodyContentType() : this.bodyContentType;
    }
}
