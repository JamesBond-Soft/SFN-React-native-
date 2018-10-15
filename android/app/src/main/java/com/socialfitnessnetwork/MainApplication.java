package com.socialfitnessnetwork;

import android.app.Application;

import com.facebook.CallbackManager;
import com.facebook.FacebookSdk;
import com.facebook.appevents.AppEventsLogger;
import com.facebook.react.ReactApplication;
import com.microsoft.codepush.react.CodePush;
import com.transistorsoft.rnbackgroundgeolocation.RNBackgroundGeolocation;
import com.kevinejohn.RNMixpanel.RNMixpanel;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import com.brentvatne.react.ReactVideoPackage;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.reactnative.androidsdk.FBSDKPackage;
import com.facebook.soloader.SoLoader;
import com.microsoft.codepush.react.CodePush;
import com.oblador.vectoricons.VectorIconsPackage;
import com.react.rnspinkit.RNSpinkitPackage;
import com.BV.LinearGradient.LinearGradientPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    private static CallbackManager mCallbackManager = CallbackManager.Factory.create();

    protected static CallbackManager getCallbackManager() {
        return mCallbackManager;
    }

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

        @Override
        protected String getJSBundleFile() {
            return CodePush.getJSBundleFile();
        }

        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
                new MainReactPackage(),
                new CodePush(BuildConfig.CODEPUSH_KEY, MainApplication.this, BuildConfig.DEBUG),
                new RNMixpanel(),
                new PickerPackage(),
                new LinearGradientPackage(),
                new ReactVideoPackage(),
                new RNDeviceInfo(),
                new FBSDKPackage(mCallbackManager),
                new VectorIconsPackage(),
                new RNSpinkitPackage(),
                new RNBackgroundGeolocation(),
                new ReactNativeConfigPackage()
            );
        }
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        // Deprecated, but included as per https://github.com/facebook/react-native-fbsdk
        FacebookSdk.sdkInitialize(getApplicationContext());
        AppEventsLogger.activateApp(this);
        // Native code loader
        SoLoader.init(this, /* native exopackage */ false);
    }
}
