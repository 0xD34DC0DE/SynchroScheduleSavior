import {Grid2, Grid2Props} from "@mui/material";
import {ReactNode} from "react";

interface GridLayoutProps {
    children?: ReactNode;
    justifyContent?: Grid2Props["justifyContent"];
    alignItems?: Grid2Props["alignItems"];
    direction?: Grid2Props["direction"];
}

const GridLayout = ({children, justifyContent, alignItems, direction}: GridLayoutProps) => {
    return (
        <Grid2
            sx={{
                flexGrow: 1,
                height: "100vh",
                bgcolor: "lightgoldenrodyellow",
                display: "flex",
            }}
            container
            justifyContent={justifyContent}
            alignItems={alignItems}
            direction={direction}
        >
            {children}
        </Grid2>
    );
};

export default GridLayout;
