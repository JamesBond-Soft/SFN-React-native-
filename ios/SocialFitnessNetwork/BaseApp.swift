//
// Created by John Bernardo on 5/23/17.
// Copyright (c) 2017 Facebook. All rights reserved.
//

import Foundation
import UserNotifications

class BaseApp: UIResponder, UNUserNotificationCenterDelegate, UIApplicationDelegate {

  lazy var analytics: Mixpanel = {
    let mpToken = ReactNativeConfig.env(for: "MIXPANEL_TOKEN")
    return Mixpanel.sharedInstance(withToken: mpToken!)
  }()
  
  var serverStore: ServerStore!
  
  internal func bootstrap(application: UIApplication, moduleName: String) -> Void {
        let center = UNUserNotificationCenter.current()
        let this = self
        center.delegate = self
        center.requestAuthorization(options: [.alert, .sound, .badge]) {
            (granted, err) in
            if let e = err {
                // TODO Raygun
                NSLog("Error while granting notification access: \(e)")
            } else if !granted {
                NSLog("Notification access was not granted")
                this.analytics.track("notifyPermissionDenied")
            } else {
                NSLog("Notification access granted!")
                let confirm = UNNotificationAction.init(identifier: "Confirm", title: "Confirm", options: [])
                let deny = UNNotificationAction.init(identifier: "Deny", title: "Deny", options: [])
                // TODO Consider .customDismissAction which denies the check-in
                let attendanceCategory = UNNotificationCategory.init(identifier: NotifierCategory.Attendance.rawValue,
                        actions: [confirm, deny], intentIdentifiers: [], options: [])
                let basicCategory = UNNotificationCategory.init(identifier: NotifierCategory.Basic.rawValue, actions: [], intentIdentifiers: [], options: [])
                center.setNotificationCategories([attendanceCategory, basicCategory])
            }
        }
    
        serverStore = ServerStore()
      
        // Once per day we fetch gyms
        application.setMinimumBackgroundFetchInterval(UIApplicationBackgroundFetchIntervalMinimum)
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let n: UNNotification = response.notification
        let c: UNNotificationContent = n.request.content
        // Handle action here
      
        // default actionIdentifier => UNNotificationDefaultActionIdentifier
        NSLog("[SFNNative] Got notification action: action=\(response.actionIdentifier) userInfo=\(c.userInfo) category=\(c.categoryIdentifier)")
      
        var action: AttendanceAction? = nil
      
        switch response.actionIdentifier {
          case "Confirm":
            NSLog("[SFNNative] Entered confirm block, action=\(String(describing: action))")
            action = AttendanceAction.confirm
            // confirm and deny do the same exact thing, so we reuse the same logic via fallthrough
            fallthrough
          case "Deny":
            if action == nil {
              action = AttendanceAction.deny
            }
            
            NSLog("[SFNNative] Entered deny block, action=\(action!.rawValue)")
            
            // Make HTTP request (confirmed)
            guard
              let data = c.userInfo["data"] as? [AnyHashable:Any],
              let id = data["id"] as? Int,
              let authToken = data["authToken"] as? String,
              let deviceID = data["deviceID"] as? String else {
                NSLog("[SFNNative] Got \(action!.rawValue) attendance action but data payload was invalid \(String(describing: c.userInfo["data"]))")
                
                var properties = ["actionPress": action!.rawValue]
                  
                if let data = c.userInfo["data"] as? [AnyHashable:Any],
                   let deviceID = data["deviceID"] as? String,
                   let id = data["id"] as? Int {
                   properties["deviceID"] = deviceID
                   properties["attendanceID"] = String(id)
                }
                  
                analytics.track("notifyActionBadPayload", properties: properties)
                
                completionHandler()
                return
            }
            
            let properties = [
                "actionPress": action!.rawValue,
                "deviceID": deviceID,
                "attendanceID": String(id)
            ]
              
            analytics.track("notifyAction", properties: properties)
            
            NSLog("[SFNNative] Got data on \(action!.rawValue) action: \(data)")
            ServerAPI.resolveAttendance(id: id, deviceID: deviceID, authToken: authToken, action: action!, s: serverStore.session) { (webResult: WebResult<[String:Any]>) in
              switch (webResult) {
              case let .success(res):
                NSLog("[SFNNative] Successfully resolved attendance: \(res)")
              case let .failure(err):
                // TODO Raygun
                NSLog("[SFNNative] Failed to resolve attendance: \(err)")
              }
              
              completionHandler()
            }
            
            return
          // Triggered when the user taps on the notification itself, but not any actions within it
          case UNNotificationDefaultActionIdentifier:
            // Open app and route to attendance page right away
            let shared = UIApplication.shared
            let urlString: String?
            
            if c.categoryIdentifier == NotifierCategory.Attendance.rawValue {
              urlString = "t/attendance"
            } else if c.categoryIdentifier == NotifierCategory.Basic.rawValue {
              urlString = "login"
            } else {
              NSLog("[SFNNative] Error - Unexpected category: \(c.categoryIdentifier)")
              break
            }
            
            NSLog("[SFNNative] Got default notification action for category=\(c.categoryIdentifier) will open url=\(urlString!)")
            
            let url = URL(string: "sfn://\(urlString!)")
            let canOpen = shared.canOpenURL(url!)
            
            if canOpen {
              let this = self
              UIApplication.shared.open(url!) { b in
                this.analytics.track("notifyDeepLink", properties: ["category": c.categoryIdentifier])
                completionHandler()
              }
              
              // Return early and avoid calling completionHandler below since open() is async
              return
            }
          
            NSLog("[SFNNative] Could not open URL: \(String(describing: url)) in response to action: \(response.actionIdentifier)")
            break
          case UNNotificationDismissActionIdentifier:
            NSLog("[SFNative] Notification was dismissed category=\(c.categoryIdentifier)")
            var properties: [String : String] = ["category": c.categoryIdentifier]
            
            if let data = c.userInfo["data"] as? [AnyHashable:Any],
               let deviceID = data["deviceID"] as? String,
               let id = data["id"] as? Int {
               properties["deviceID"] = deviceID
               properties["attendanceID"] = String(id)
            }
            
            analytics.track("notifyDismissed", properties: properties)
            break
          default:
            NSLog("[SFNative] Unknown action: \(SFNError.unknownNotificationAction(action: response.actionIdentifier))")
        }
      
        completionHandler()
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let c: UNNotificationContent = notification.request.content
        center.getNotificationCategories { categories in
            NSLog("Notification categories=\(categories)")
        }
        NSLog("Got notification: title=\(c.title) category=\(c.categoryIdentifier) userInfo=\(c.userInfo)")
        completionHandler([.alert, .sound, .badge])
    }

    // TSLocationManager background fetch
//    func application(_ application: UIApplication,
//                     performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
//        var bgFetchComplete: (UIBackgroundFetchResult) -> Void = completionHandler
//      
//        let lastFetchKey: String = "SFN::lastGymFetchTs"
//        // Minutes
//        let gymFetchIntervalMs: Double = 1000 * 60 * 15
//        let lastFetchTs: Double = UserDefaults.standard.double(forKey: lastFetchKey)
//        let now: Double = Date().timeIntervalSince1970
//        let delta: Double = now - lastFetchTs
      
//        if (delta > gymFetchIntervalMs) {
//          // Perform fetch of gyms
//          ServerAPI.getGyms(session: serverStore.session) {
//            (webResults) -> Void in
//            switch webResults {
//            case let .success(res):
//              NSLog("Successfully fetched gyms: \(res)")
//              for gym in res.data {
//                NSLog("id: \(gym.id), name: \(gym.name)")
//              }
//              
//            case let .failure(err):
//              NSLog("Error fetching gyms: \(err)")
//            }
//          }
//        }
      
//        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: lastFetchKey)
//        if let fetchManager = TSBackgroundFetch.sharedInstance() {
//            NSLog("[SFNNative] Performing background fetch")
//            fetchManager.perform(completionHandler: completionHandler, applicationState: application.applicationState)
//        } else {
//            NSLog("[SFNNative] Error - RNBackgroundFetch fetchManager was nil!")
//        }
//    }
  
    func application(_ application: UIApplication, open url: URL, sourceApplication: String?, annotation: Any) -> Bool {
      NSLog("[SFN] UIApplication openURL")
    
      // FB first
      var handled = FBSDKApplicationDelegate.sharedInstance().application(application, open: url, sourceApplication: sourceApplication, annotation: annotation)
    
      if !handled {
        // Deep link (react-navigation, maybe)
        handled = RCTLinkingManager.application(_: application, open: url, sourceApplication:   sourceApplication, annotation: annotation)
      }
    
      return handled
    }
}

