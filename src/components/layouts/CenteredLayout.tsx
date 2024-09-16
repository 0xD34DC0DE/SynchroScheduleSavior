import {ReactNode} from "react";
import Box from "@mui/material/Box";

interface CenteredLayoutProps {
    children?: ReactNode;
}

const CenteredLayout = ({children}: CenteredLayoutProps) => {
    return (
        <Box height="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="lightgoldenrodyellow">
            {children}
        </Box>
    );
};

export default CenteredLayout;
