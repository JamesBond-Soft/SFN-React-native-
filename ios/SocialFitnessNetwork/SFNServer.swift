//
//  SFNServer.swift
//  Quiz
//
//  Created by John Bernardo on 5/13/17.
//  Copyright © 2017 John Bernardo. All rights reserved.
//

import Foundation

// TODO
// This performs a fetch of data needed from the server
// For other pieces, such as making requests to attendance endpoints, this
// approach would be most viable

class ServerStore {
  // Anonymous function
  internal let session: URLSession = {
    let config = URLSessionConfiguration.default
    return URLSession(configuration: config)
  }()
}

class DevServerDelegate: NSObject, URLSessionTaskDelegate {
  func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    let authMethod = challenge.protectionSpace.authenticationMethod
    var creds = challenge.proposedCredential
    if authMethod == NSURLAuthenticationMethodServerTrust {
      let host = challenge.protectionSpace.host
      if host == "www.sfnet.work", challenge.protectionSpace.serverTrust != nil {
        NSLog("ServerTrust encountered, handling...")
        if let sender = challenge.sender {
          creds = URLCredential(trust: challenge.protectionSpace.serverTrust!)
          NSLog("Got challenge sender: \(sender)")
        } else {
          NSLog("No challenge sender found")
        }
        
        completionHandler(.useCredential, creds)
      } else {
        NSLog("Trust not found or wrong host=\(host) performing default handling")
        completionHandler(.performDefaultHandling, creds)
      }
    } else {
      NSLog("Unknown authentication method: \(authMethod), performing default handling")
      completionHandler(.performDefaultHandling, creds)
    }
  }
}

struct ServerAPI {
  // !! TODO Make configureable
  private static let baseURL = "\(ReactNativeConfig.env(for: "API_URL")!)/v1"
  
  // Computed property
  private static var gymsURL: URL {
    let components = URLComponents(string: "\(baseURL)/gyms")!
    return components.url!
  }
  private static var attendanceURL: URL {
    NSLog("[SFNNative] Read baseURL from config: \(baseURL)")
    let components = URLComponents(string: "\(baseURL)/attendances")!
    return components.url!
  }
  
  internal static func pathSuffix(url: URL, suffix: Any) -> URL {
    return URLComponents(string: "\(url.absoluteString)\(suffix)")!.url!
  }
  
  internal static func resolveAttendance(id: Int, deviceID: String, authToken: String, action: AttendanceAction, s: URLSession, callback cb: @escaping (WebResult<[String:Any]>) -> Void) {
    let url = pathSuffix(url: attendanceURL, suffix: "/\(action.rawValue)/\(id)")
    var request = URLRequest(url: url)
    request.httpMethod = "put"
    request.addValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    request.addValue(deviceID, forHTTPHeaderField: "X-Device-ID")
    
    NSLog("Making '\(request.httpMethod!)' request to '\(url)'")
    
    // Trailing closure usage
    // https://developer.apple.com/library/content/documentation/Swift/Conceptual/Swift_Programming_Language/Closures.html#//apple_ref/doc/uid/TP40014097-CH11-ID102
    let task = s.dataTask(with: request) {
      (data, response, error) -> Void in
      if let jsonData = data {
        do {
          let jsonObject = try JSONSerialization.jsonObject(with: jsonData, options: [])
          guard
            let jsonDict = jsonObject as? [AnyHashable:Any],
            let message = jsonDict["message"] as? String,
            let code = jsonDict["code"] as? String,
            let jsonAttendance = jsonDict["data"] as? [String:Any] else {
              let jsonString: String! = String(data: jsonData, encoding: .utf8)
              // TODO Raygun
              return cb(.failure(SFNError.jsonParse(desc: "Invalid JSON structure: \(jsonString)")))
          }
          
          if code != "OK" {
            var status: Int = -1
            if let httpRes = response as? HTTPURLResponse {
              status = httpRes.statusCode
            }
            return cb(.failure(SFNError.badResponse(code: code, status: status)))
          }
          
          let res = ResponseSingle<[String:Any]>(message: message, code: code, data: jsonAttendance)
          return cb(.success(res))
        } catch let error {
          // TODO Raygun
          return cb(.failure(error))
        }
      } else if let requestError = error {
        NSLog("Error while resolving attendance: \(requestError)")
        if let res = response {
          NSLog("Response: \(res)")
        } else {
          NSLog("No response")
        }
      } else {
        NSLog("Unexpected error while resolving attendance")
      }
    }
    
    task.resume()
  }
  
  fileprivate static func toGyms(_ jsonGyms: [[String:Any]]) throws -> [Gym] {
    var gyms = [Gym]()
    
    for json in jsonGyms {
      gyms.append(try toGym(json))
    }
    
    return gyms
  }
  
  fileprivate static func toGym(_ json: [String:Any]) throws -> Gym {
    guard
      let id = json["id"] as? Int,
      let name = json["name"] as? String,
      let afi = json["affiliateId"] as? String,
      let affiliateId = Int(afi) else {
        throw SFNError.jsonParse(desc: "Could not parse gym (missing required fields): \(json)")
    }
    
    let websiteUrl = json["websiteUrl"] as? String
    let description = json["description"] as? String
    
    return Gym(id, affiliateId, name, websiteUrl, description)
  }
}
