import {Grid} from "@mui/material";
import {ReactNode} from "react";
import {GridProps} from "@mui/material/Grid/Grid";

interface GridLayoutProps {
    children?: ReactNode;
    justifyContent?: GridProps["justifyContent"];
    alignItems?: GridProps["alignItems"];
}

const GridLayout = ({children, justifyContent, alignItems}: GridLayoutProps) => {
    return (
        <Grid
            sx={{
                flexGrow: 1,
                height: "100vh",
                bgcolor: "lightgoldenrodyellow",
            }}
            container
            justifyContent={justifyContent}
            alignItems={alignItems}
        >
            {children}
        </Grid>
    );
};

export default GridLayout;
