// @flow
import React, { Component } from 'react'
import moment from 'moment'
import { theme } from '../common'
import { Calendar as RNCalendar, LocaleConfig } from 'sfn-rn-calendar'

LocaleConfig.locales['en'] = {
    monthNames: [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ],
    dayNames: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ]
}
LocaleConfig.locales['en'].monthNamesShort =
    LocaleConfig.locales['en'].monthNames.map((m) => m.substring(0, 3).toUpperCase())
LocaleConfig.locales['en'].dayNamesShort = LocaleConfig.locales['en'].dayNames.map((d) => d[0])
LocaleConfig.defaultLocale = 'en'

type P = {
    minDate: string,
    maxDate: string,
    selectedDate: string,
    current: moment.Moment,
    onDayPress: any => void,
    shouldHighlightWeek: any => boolean,
    markedDates: { [key: string]: any },
    dateWrapper: any => any
}

export const monthIntervalAgo = (m: moment.Moment) => m.day(0).subtract(3, 'weeks').startOf('day')
export const isLTE = (xd: any, d: Date) => xd.getTime() <= d.getTime()
export const isGTE = (xd: any, d: Date) => xd.getTime() >= d.getTime()
export const normalize = (m: moment.Moment, mutate: boolean = true) =>
    (mutate ? m : m.clone()).hour(0).minute(0).second(0).millisecond(0)

export function fmtDate(m: moment.Moment): string {
    return m.format('YYYY-MM-DD')
}

// A wrapper around react-native-calendars with some default SFN styling applied
export default class Calendar extends Component<void, P, void> {
    props: P;

    render() {
        let {
            minDate,
            maxDate,
            current,
            onDayPress,
            markedDates,
            dateWrapper,
            selectedDate,
            shouldHighlightWeek
        } = this.props

        markedDates[selectedDate] = markedDates[selectedDate] || { selected: true }

        return (
            <RNCalendar
                firstDay={0}
                shouldHighlightWeek={shouldHighlightWeek}
                markedDates={markedDates}
                markingType='simple'
                minDate={minDate}
                maxDate={maxDate}
                current={fmtDate(current)}
                onDayPress={onDayPress}
                dateWrapper={dateWrapper}
                theme={{
                    highlightWeekBackgroundColor: '#cbeaf0',
                    selectedDayTextColor: theme.primaryColor,
                    selectedDayBorderColor: theme.primaryTextColor,
                    dotColor: theme.disabledTextColor,
                    textMonthFontFamily: 'Graphik',
                    textMonthFontSize: 18,
                    textDayFontFamily: 'Graphik',
                    textDayFontSize: 14,
                    dayTextColor: theme.primaryTextColor,
                    todayTextColor: theme.primaryColor,
                    backgroundColor: theme.canvasColor,
                    monthTextColor: theme.accentColor,
                    arrowColor: theme.accentColor
                }}/>
        )
    }
}
