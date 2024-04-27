import Button, {ButtonProps} from "@mui/material/Button";
import {LinkProps, Link} from 'react-router-dom';
import {forwardRef} from "react";

type OmitCallbacks<T> = {
    [K in keyof T as K extends `on${any}` ? never : K]: T[K]
};

interface ButtonLinkProps extends Omit<LinkProps, 'color'>, Omit<OmitCallbacks<ButtonProps>, 'type'> {

}

const ForwardedLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>((props: ButtonLinkProps, ref) => {
    return <Link {...props} ref={ref}/>;
});

const ButtonLink = (props: ButtonLinkProps) => {
    return <Button component={ForwardedLink} {...props} />;
};

export default ButtonLink;
