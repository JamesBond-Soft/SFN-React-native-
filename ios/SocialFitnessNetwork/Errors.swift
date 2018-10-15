//
//  Errors.swift
//  SocialFitnessNetwork
//
//  Created by John Bernardo on 7/4/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

import Foundation

enum SFNError: Error {
  case jsonParse(desc: String)
  case unknownNotificationAction(action: String)
  case badResponse(code: String, status: Int)
}
