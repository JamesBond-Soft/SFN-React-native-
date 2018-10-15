//
//  NotifierBridge.m
//  SocialFitnessNetwork
//
//  Created by John Bernardo on 5/23/17.
//
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(Notifier, NSObject)

// Objective-C is the ugliest
RCT_EXTERN_METHOD(send:(NSString *)id title:(NSString *)title body:(nonnull NSString *)body category:(nonnull NSString *)
        category data:(nonnull NSDictionary *)data resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)
        reject)

@end
