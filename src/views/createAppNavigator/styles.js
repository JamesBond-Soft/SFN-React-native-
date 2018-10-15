import { theme } from '../../common'
import { Platform } from 'react-native'

export const styles = {
    tabs: {
        style: {
            backgroundColor: theme.canvasColor3,
            borderTopWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)'
        },

        iconStyle: {
            width: 50,
            height: 50
        },

        labelStyle: {
            fontSize: Platform.select({ ios: 12, android: 14 })
        },

        indicatorStyle: {
            backgroundColor: 'transparent'
        },

        tabStyle: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 0,
            height: 48,
        },

        activeTintColor: theme.accentColor
    },

    // Note: Unused since we hide the header, but if we ever need it again, it's here
    navigation: {
        headerTintColor: theme.secondaryTextColor,
        headerStyle: {
            backgroundColor: theme.canvasColor3,
            borderColor: 'rgba(0,0,0,0.05)',
            borderBottomWidth: 0.5
        }
    }
}
