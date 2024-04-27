import {default as MuiLink, LinkProps as MuiLinkProps} from "@mui/material/Link";
import {LinkProps as RouterLinkProps, Link as RouterLink} from 'react-router-dom';
import {forwardRef} from "react";

interface LinkProps extends RouterLinkProps, Omit<MuiLinkProps, 'to' | 'component'> {

}

const ForwardedRouterLink = forwardRef<HTMLAnchorElement, LinkProps>((props: LinkProps, ref) => {
    return <RouterLink {...props} ref={ref}/>;
});

const Link = (props: LinkProps) => {
    return <MuiLink component={ForwardedRouterLink} {...props} />;
};

export default Link;
