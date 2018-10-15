//
//  Notifier.swift
//  SocialFitnessNetwork
//
//  Created by John Bernardo on 5/23/17.
//

import Foundation

import Foundation
import UserNotifications

@objc(Notifier)
class Notifier: RCTEventEmitter {

    @objc
    override func constantsToExport() -> [String: Any]! {
        return [
          "CategoryAttendance": NotifierCategory.Attendance.rawValue,
          "CategoryBasic": NotifierCategory.Basic.rawValue,
          "CodeNotifyFailed": NotifierCode.Failed.rawValue
        ]
    }

    @objc
    override func supportedEvents() -> [String] {
        return super.supportedEvents()
    }

    @objc(send:title:body:category:data:resolve:reject:)
    func send(_ id: String, _ title: String, _ body: String, _ category: String, _ data: [AnyHashable:Any],
              _ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) -> Void {
        let c = UNMutableNotificationContent()
        c.title = title
        c.body = body
        c.sound = UNNotificationSound.default()
        c.userInfo = ["data": data]
        c.categoryIdentifier = category
      
        // TODO Need this while app is open?
        c.setValue("YES", forKeyPath: "shouldAlwaysAlertWhileAppIsForeground")

        let t = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let req = UNNotificationRequest(identifier: id, content: c, trigger: t)
      
        NSLog("[SFNNative] Got notification data=\(data)")

        let center = UNUserNotificationCenter.current()
        center.add(req) { (err) -> Void in
            if let theErr = err {
                NSLog("[SFNNative] Failed to add notification, got error: \(theErr)")
                reject(NotifierCode.Failed.rawValue, "Failed to add notification", theErr)
            } else {
                resolve(nil)
            }
        }
    }
}

enum NotifierCategory: String {
    case Attendance = "socialFitnessNetwork/ATTENDANCE"
    case Basic = "socialFitnessNetwork/BASIC"
}

enum NotifierCode: String {
    case Failed = "NOTIFY_FAILED"
}
