import { theme } from '../common'

export default {
    container: {
        flex: 1,
        backgroundColor: theme.canvasColor
    },
    mt: {
        width: '100%',
        marginTop: 18
    },
    content: {
        flex: 1,
        position: 'relative'
    },
    globalLoading: {
        opacity: 1,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        position: 'absolute',
        zIndex: 98,
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        marginTop: 0
    },
    spinner: {
        marginTop: '-50%'
    }
}
