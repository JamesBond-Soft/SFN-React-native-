# Setup
[Add your ssh key to your GitHub account](https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/). If you don't have GitHub, you'll need an account. We have a forked repo on GitHub which requires installation directly from the repo.

```
yarn
```

# iOS

### Setup
Follow the basic setup on the [React Native - Getting Started](https://facebook.github.io/react-native/docs/getting-started.html) guide for iOS.

#### Carthage
One of our dependencies (Mixpanel for analytics) uses the Carthage package manager. It's like Cocoapods. [Install it here](https://github.com/Carthage/Carthage).

```
cd ios
carthage bootstrap
```

# Android

### Setup
Follow the basic setup on the [React Native - Getting Started](https://facebook.github.io/react-native/docs/getting-started.html) guide for Android.

##### HAXM Acceleration
Needed in order to run on the Android simulator. Follow the [installation instructions](https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-mac-os-x) to get setup.

### Tips

##### Copy/paste into the Android emulator
1. Tap the text field you want to add your copy/pasted text into
2. `adb shell input text '<YOUR TEXT HERE>'`