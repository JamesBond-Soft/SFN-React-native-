# Android RNPM Installation

```shell
npm install git+https://git@github.com:transistorsoft/react-native-background-geolocation-android.git --save
```

#### With React Native 0.27+

```shell
react-native link react-native-background-geolocation-android
```

#### With older versions of React Native

You need [`rnpm`](https://github.com/rnpm/rnpm) (`npm install -g rnpm`)

```shell
rnpm link react-native-background-geolocation-android
```

## Gradle Configuration

react-native link does a nice job, but we need to do a bit of manual setup.

* :open_file_folder: **`android/build.gradle`**

```diff
allprojects {
    repositories {
        mavenLocal()
        jcenter()
        maven {
            // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
            url "$rootDir/../node_modules/react-native/android"
        }
        // Google now hosts their latest API dependencies on their own maven server.  
        // React Native will eventually add this to their app template.
+       maven {
+           url 'https://maven.google.com'
+       }
    }
}
```

* :open_file_folder: **`android/app/build.gradle`**

```diff
android {
    // BackgroundGeolocation REQUIRES SDK >=26 for new features in Android 8
+   compileSdkVersion 26
    // Use latest available buildToolsVersion
+   buildToolsVersion "26.0.2"
    .
    .
    .
}
.
.
.
+repositories {
+   flatDir {
+       dirs "../../node_modules/react-native-background-geolocation-android/android/libs"
+   }
+}

dependencies {
+   compile(name: 'tslocationmanager', ext: 'aar')
+   compile "com.android.support:appcompat-v7:26.1.0"  // Or later
}
```


## AndroidManifest.xml

```diff
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.transistorsoft.backgroundgeolocation.react">

  <application
    android:name=".MainApplication"
    android:allowBackup="true"
    android:label="@string/app_name"
    android:icon="@mipmap/ic_launcher"
    android:theme="@style/AppTheme">

    <!-- react-native-background-geolocation licence -->
+   <meta-data android:name="com.transistorsoft.locationmanager.license" android:value="YOUR_LICENCE_KEY_HERE" />
    .
    .
    .
  </application>
</manifest>

```


## Proguard Config
* In your `proguard-rules.pro` (`android/app/proguard-rules.pro`)

```proguard
# BackgroundGeolocation lib tslocationmanager.aar is *already* proguarded
-keep class com.transistorsoft.** { *; }
-dontwarn com.transistorsoft.**

# BackgroundGeolocation (EventBus)
-keepclassmembers class * extends de.greenrobot.event.util.ThrowableFailureEvent {
    <init>(java.lang.Throwable);
}
-keepattributes *Annotation*
-keepclassmembers class ** {
    @org.greenrobot.eventbus.Subscribe <methods>;
}
-keep enum org.greenrobot.eventbus.ThreadMode { *; }
-keepclassmembers class * extends org.greenrobot.eventbus.util.ThrowableFailureEvent {
    <init>(java.lang.Throwable);
}

# logback
-keep class ch.qos.** { *; }
-keep class org.slf4j.** { *; }
-dontwarn ch.qos.logback.core.net.*

# OkHttp3
-dontwarn okio.**
```

