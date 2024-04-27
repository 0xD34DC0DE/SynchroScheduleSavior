import {Card, CardActions, CardContent, CardHeader} from "@mui/material";
import {ReactNode} from "react";

interface StepCardProps {
    title: string;
    actions?: ReactNode;
    children?: ReactNode;
}

const StepCard = ({title, actions, children}: StepCardProps) => {
    return (
        <Card>
            <CardHeader title={title}/>
            <CardContent>
                {children}
            </CardContent>
            <CardActions sx={{justifyContent: "flex-end"}}>
                {actions}
            </CardActions>
        </Card>
    );
};

export type {StepCardProps};
export default StepCard;
