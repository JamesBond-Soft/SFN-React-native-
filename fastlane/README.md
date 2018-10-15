fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

## Choose your installation method:

<table width="100%" >
<tr>
<th width="33%"><a href="http://brew.sh">Homebrew</a></th>
<th width="33%">Installer Script</th>
<th width="33%">RubyGems</th>
</tr>
<tr>
<td width="33%" align="center">macOS</td>
<td width="33%" align="center">macOS</td>
<td width="33%" align="center">macOS or Linux with Ruby 2.0.0 or above</td>
</tr>
<tr>
<td width="33%"><code>brew cask install fastlane</code></td>
<td width="33%"><a href="https://download.fastlane.tools">Download the zip file</a>. Then double click on the <code>install</code> script (or run it in a terminal window).</td>
<td width="33%"><code>sudo gem install fastlane -NV</code></td>
</tr>
</table>

# Available Actions
## iOS
### ios certs
```
fastlane ios certs
```
iOS codesign certificates
### ios code_push_stg
```
fastlane ios code_push_stg
```
Build and deploy iOS react-native code via CodePush to staging
### ios code_push_prod
```
fastlane ios code_push_prod
```
Build and deploy iOS react-native code via CodePush to production
### ios test
```
fastlane ios test
```
Runs all the tests
### ios beta
```
fastlane ios beta
```
Ship to Testflight
### ios beta_prod
```
fastlane ios beta_prod
```
Ship to Testflight (Release Promotion Build)
### ios release
```
fastlane ios release
```
Deploy a new version to the App Store

----

## Android
### android code_push_stg
```
fastlane android code_push_stg
```
Build the Android application

Build and deploy Android react-native code via CodePush to staging
### android code_push_prod
```
fastlane android code_push_prod
```
Build and deploy Android react-native code via CodePush to production
### android build_stg
```
fastlane android build_stg
```

### android beta
```
fastlane android beta
```
Ship to Playstore Beta
### android beta_prod
```
fastlane android beta_prod
```
Ship to Playstore Beta (Release Promotion Build)

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
