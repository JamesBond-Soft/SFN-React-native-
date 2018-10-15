package com.socialfitnessnetwork;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Start up the Bootstrap service in case geofences are not already being monitored
        // Note: Removed, we rely on the plugin's BOOT action instead to initialize
//        Intent intent = new Intent(MainActivity.this, BootstrapService.class);
//        this.sendBroadcast(intent.setAction(Constants.BOOTSTRAP_INIT));
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        MainApplication.getCallbackManager().onActivityResult(requestCode, resultCode, data);
    }

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "SFN";
    }
}
