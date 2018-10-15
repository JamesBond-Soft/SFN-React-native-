// @flow
import color from 'color'
import { Platform, PixelRatio } from 'react-native'

// Based on iPhone 8, iPhone X and Nexus 6P
const BASE_RATIO = 3
const DEVICE_RATIO = PixelRatio.get()
const RATIO = DEVICE_RATIO / BASE_RATIO
const norm = (size: number): number => Platform.select({
    ios: PixelRatio.roundToNearestPixel(size * RATIO),
    android: PixelRatio.roundToNearestPixel(size * RATIO) - 1
})

const fontSizes = {
    tiny: { fontSize: 10 },
    mini: { fontSize: 12 },
    small: { fontSize: 16 },
    med: { fontSize: 18 },
    large: { fontSize: 20 },
    xlarge: { fontSize: 24 },
    huge: { fontSize: 42 }
}


// Comment out to help with debugging
// console.log('PixelRatio', Platform.OS, PixelRatio.get(),
//     PixelRatio.getPixelSizeForLayoutSize(18), PixelRatio.getPixelSizeForLayoutSize(18.44),
//     PixelRatio.roundToNearestPixel(16.34), PixelRatio.roundToNearestPixel(16),
//     PixelRatio.getFontScale())
// console.log('normalize', norm(15))
// console.log('windowWidth', Dimensions.get('window').width)
const fontSpacing = (spacing: number): number => Math.round(spacing * RATIO * Platform.select({ android: .6, ios: .8 }))

// https://goo.gl/UQHW8c
const darkUI = {
    norm,
    fontSizes,
    fontSpacing,
    primaryColor: '#141820', // '#21242B', '#455a64'
    accentColor: '#6EB9CD', // '#7c4dff',
    accentColorRGB(alpha: number = 0.8) {
        return `rgba(110, 185, 205, ${alpha})`
    },
    primaryTextColor: '#636D6F', // '#96A5BC' // '#263238'
    secondaryTextColor: '#000', // '#506686' '#757575',
    alternateTextColor: '#c5d9f7',
    gradient1: '#242728',
    gradient2: '#407889',
    canvasColor: '#fff',
    canvasColor2: '#DDE5EA',
    canvasColor3: '#F6F7F7',
    // Other canvas colors
    // 'rgba(33, 40, 54, 1)', '#27333a',
    // '#303e46', '#37474f',
    // '#292C33', '#546e7a',
    // '#78909c' '#cfd8dc'
    borderColor: '#E4EAED', // '#24272E', '#bdbdbd',
    disabledColor: color('#fff').alpha(0.38).toString(),
    disabledCanvasColor: color('#000').alpha(0.25).toString(),
    disabledTextColor: color('#000').alpha(0.15).toString(),
    disabledTextColor2: color('#000').alpha(0.02).toString(),
    semiTransBg: color('#000').alpha(0.7).toString(),
    activeIcon: color('#fff').alpha(0.54).toString(),
    inactiveIcon: color('#fff').alpha(0.38).toString(),
    redColor: '#EF5350',
    greenColor: '#1DE9B6',
    tabIcon: {
        size: Platform.select({ ios: 30, android: 28 }) * 0.9
    },
    linearGradSpec: {
        colors: [ '#407889', '#242728' ],
        start: { x: 0.5, y: 0 },
        end: { x: 0.80, y: 1 }
    }
}

export default darkUI
