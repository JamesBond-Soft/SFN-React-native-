//
//  Models.swift
//  Quiz
//
//  Created by John Bernardo on 7/4/17.
//  Copyright © 2017 John Bernardo. All rights reserved.
//

import Foundation

class Gym {
  let id: Int
  let affiliateId: Int
  let name: String
  let websiteUrl: String?
  let description: String?
  
  init(_ id: Int, _ affiliateId: Int, _ name: String, _ websiteUrl: String?, _ description: String?) {
    self.id = id
    self.affiliateId = affiliateId
    self.name = name
    self.websiteUrl = websiteUrl
    self.description = description
  }
}

enum AttendanceAction: String {
  case confirm, deny
}

enum WebResults<Model> {
  case success(ResponseMulti<Model>)
  case failure(Error)
}

enum WebResult<Model> {
  case success(ResponseSingle<Model>)
  case failure(Error)
}

class ResponseMulti<Model>: WebResponse<Model> {
  let data: [Model]
  init(message: String, code: String, data: [Model]) {
    self.data = data
    super.init(message, code)
  }
}

class ResponseSingle<Model>: WebResponse<Model> {
  let data: Model
  init(message: String, code: String, data: Model) {
    self.data = data
    super.init(message, code)
  }
}

class WebResponse<Model> {
  let message: String
  let code: String
  
  init(_ message: String, _ code: String) {
    self.message = message
    self.code = code
  }
}
