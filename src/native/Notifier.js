// @flow
import { NativeModules } from 'react-native'

export interface INotifier {
  CategoryAttendance: string;
  CategoryBasic: string;
  CodeNotifyFailed: string;
  send(id: string, title: string, body: string, category: string, data: any): Promise<void>;
}

type NModules = {
  Notifier: INotifier
}

const { Notifier }: NModules = NativeModules // eslint-disable-line

export default Notifier