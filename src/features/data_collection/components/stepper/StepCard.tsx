import {Card, CardActions, CardContent, CardHeader, Grid} from "@mui/material";
import {ReactNode} from "react";
import Box from "@mui/material/Box";

interface StepCardProps {
    title: string;
    actions?: ReactNode;
    children?: ReactNode;
}

const StepCard = ({title, actions, children}: StepCardProps) => {
    return (
        <Grid item xs={12} sm={4}>
            <Card>
                <Box p={1}>
                    <CardHeader title={title} titleTypographyProps={{variant: "h4"}}/>
                    <CardContent>
                        {children}
                    </CardContent>
                    <CardActions sx={{justifyContent: "flex-end"}}>
                        {actions}
                    </CardActions>
                </Box>
            </Card>
        </Grid>
    );
};

export type {StepCardProps};
export default StepCard;
