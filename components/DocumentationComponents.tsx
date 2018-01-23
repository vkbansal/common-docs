import { NavLink } from 'react-router-dom';
import glamorous, {
    GlamorousComponent,
    CSSProperties,
    StyleFunction,
    ExtraGlamorousProps
} from 'glamorous';

const SIDEBAR_WIDTH = 300;
const CONTAINER_WIDTH = 800;
const CONTAINER_PADDING = 16;

export type StyleOverrides<T = any> = Record<
    string,
    CSSProperties | StyleFunction<CSSProperties, T>
>;

function getStyleOverrides<T>(name: string) {
    return (props: T & ExtraGlamorousProps, ...rest: any[]) => {
        const overrides: CSSProperties | StyleFunction<CSSProperties, T> = (props.theme as any)
            .commonDocs[name];

        if (typeof overrides === 'function') {
            return overrides(props, ...rest);
        }

        return overrides || {};
    };
}

export const MainWrapper = glamorous.div(
    {
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'stretch',
        minWidth: '960px'
    },
    getStyleOverrides('MainWrapper')
);

MainWrapper.displayName = 'MainWrapper';

export const Sidebar = glamorous.nav(
    'pure-menu',
    {
        background: '#eee',
        width: `${SIDEBAR_WIDTH}px`,
        padding: '16px 0',
        maxHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto'
    },
    getStyleOverrides('SideBar')
);

Sidebar.displayName = 'Sidebar';

export const Content = glamorous.section(
    {
        background: '#fff',
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        minWidth: '600px',
        boxShadow: '-2px 0px 8px -2px rgba(0, 0,0, 0.2)',
        maxHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto'
    },
    getStyleOverrides('Content')
);

Content.displayName = 'Content';

export const NavHeading = glamorous.div(
    'pure-menu-heading',
    {
        fontWeight: 'bold'
    },
    getStyleOverrides('NavHeading')
);

NavHeading.displayName = 'NavHeading';

export const Nav = glamorous.ul(
    'pure-menu-list',
    {
        margin: 0,
        padding: 0,
        listStyleType: 'none',
        fontSize: '0.9rem'
    },
    getStyleOverrides('Nav')
);

Nav.displayName = 'Nav';

export const NavItem = glamorous.li(
    'pure-menu-item',
    {
        height: 'auto',
        '&::before': {
            content: '""',
            margin: 0
        }
    },
    getStyleOverrides('NavItem')
);

NavItem.displayName = 'NavItem';

export const Link = glamorous(NavLink)(
    'pure-menu-link',
    {
        position: 'relative',
        transition: 'background 0.2s linear',
        '&:hover': {
            background: 'rgba(0, 0, 0, 0.07)'
        },
        '&.active': {
            color: '#e94949',
            '&::after': {
                opacity: 1
            }
        },
        '&::after': {
            content: '""',
            position: 'absolute',
            display: 'block',
            width: 0,
            height: 0,
            border: '8px solid transparent',
            borderRightColor: '#fff',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0,
            transition: 'opacity 0.2s linear'
        }
    },
    getStyleOverrides('Link')
);

Link.displayName = 'Link';

export const Container = glamorous.div(
    'container',
    {
        maxWidth: `${CONTAINER_WIDTH}px`,
        minWidth: '600px',
        padding: `0 ${CONTAINER_PADDING}px`,
        margin: '0 auto',
        '& pre': {
            margin: '8px 0',
            padding: '16px',
            position: 'relative',
            borderRadius: '4px'
        }
    },
    getStyleOverrides('Container')
);

Container.displayName = 'Container';
