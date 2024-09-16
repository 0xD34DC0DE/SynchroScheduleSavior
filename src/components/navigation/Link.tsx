import {default as MuiLink, LinkProps as MuiLinkProps} from "@mui/material/Link";
import {LinkProps as RouterLinkProps, Link as RouterLink} from 'react-router-dom';
import {forwardRef} from "react";

interface LinkProps extends Omit<RouterLinkProps, 'color'>, Omit<MuiLinkProps, 'to' | 'component'> {

}

type ForwardedRouteLinkProps = Omit<RouterLinkProps, 'color'>;

const ForwardedRouterLink = forwardRef<HTMLAnchorElement, ForwardedRouteLinkProps>(
    (props: ForwardedRouteLinkProps, ref) => {
        return <RouterLink {...props} ref={ref}/>;
    }
);

const Link = (props: LinkProps) => {
    const {color, ...rest} = props;
    return <MuiLink color={color} component={ForwardedRouterLink} {...rest} />;
};

export default Link;
