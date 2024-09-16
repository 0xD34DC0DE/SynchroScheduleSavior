import Button, {ButtonProps} from "@mui/material/Button";
import {LinkProps, Link} from 'react-router-dom';
import {forwardRef} from "react";
import {OmitWithPrefix} from "../../utils/type_utils.ts";


interface ButtonLinkProps extends Omit<LinkProps, 'color'>, Omit<OmitWithPrefix<'on', ButtonProps>, 'type'> {

}

const ForwardedLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>((props: ButtonLinkProps, ref) => {
    return <Link {...props} ref={ref}/>;
});

const ButtonLink = (props: ButtonLinkProps) => {
    return <Button component={ForwardedLink} {...props} />;
};

export default ButtonLink;
