import {Button, Dialog, Stack, Typography} from "@mui/material";
import {ButtonProps} from "@mui/material/Button/Button";
import {useState} from "react";

export interface ConfirmButtonProps extends Omit<ButtonProps, "onClick"> {
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

const ConfirmButton = ({message, onConfirm, onCancel, children, ...button_props}: ConfirmButtonProps) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} {...button_props}>
                {children}
            </Button>
            <Dialog
                open={open}
                onClose={() => {setOpen(false); onCancel && onCancel();}}
            >
                <Typography>{message}</Typography>
                <Stack direction={"row"} spacing={1} justifyContent={"center"} sx={{pt: 2}}>
                    <Button onClick={() => {
                        setOpen(false);
                        onCancel && onCancel();
                    }} variant={"contained"}>
                        Cancel
                    </Button>
                    <Button onClick={() => {
                        setOpen(false);
                        onConfirm();
                    }} variant={"contained"}>
                        Confirm
                    </Button>
                </Stack>
            </Dialog>
        </>
    );
};

export default ConfirmButton;