//
// Created by John Bernardo on 5/21/17.
// Copyright (c) 2017 Facebook. All rights reserved.
//

import Foundation
import UIKit
import UserNotifications

@UIApplicationMain
class AppDelegate: BaseApp {

    var window: UIWindow?
    var bridge: RCTBridge!
  
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        FBSDKApplicationDelegate.sharedInstance().application(application, didFinishLaunchingWithOptions: launchOptions)
      
        var jsCodeLocation: URL
        let moduleName = "SFN"
      
        #if DEBUG
            NSLog("Loading bundle from local system...")
            jsCodeLocation = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index.ios", fallbackResource: nil)
        #else
            NSLog("Loading bundle from CodePush...")
            jsCodeLocation = CodePush.bundleURL()
        #endif
      
      /*Uncomment to print all available font families and names*/
      /*for family in UIFont.familyNames {
        NSLog("\(family)")
        for name in UIFont.fontNames(forFamilyName: family) {
          NSLog("\(name)")
        }
      }*/

        NSLog("API_URL=\(ReactNativeConfig.env(for:"API_URL"))")
        NSLog("jsbundle=\(jsCodeLocation)")
      
        let rootView = RCTRootView(bundleURL: jsCodeLocation, moduleName: moduleName, initialProperties: nil, launchOptions: launchOptions)
        rootView!.backgroundColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1)

        self.bridge = rootView!.bridge
        self.window = UIWindow(frame: UIScreen.main.bounds)

        let rootViewController = UIViewController()
        rootViewController.view = rootView
        self.window!.rootViewController = rootViewController
        self.window!.makeKeyAndVisible()

        // Do work
        bootstrap(application: application, moduleName: moduleName)
        return true
    }
}

