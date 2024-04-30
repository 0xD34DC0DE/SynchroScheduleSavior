import {Grid, Typography} from "@mui/material";
import {Dispatch, SetStateAction, useCallback, useState} from "react";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

interface SemesterSelectorProps {
    semesters: string[];
    setSelectedSemesters: Dispatch<SetStateAction<string[]>>
}

const SemesterSelector = ({semesters, setSelectedSemesters}: SemesterSelectorProps) => {
    const [selectedSemesters, setSelected] = useState<boolean[]>(new Array(semesters.length).fill(false));

    const toggleSemester = useCallback((index: number) => {
        setSelected(prev => {
            const newSelected = [...prev];
            newSelected[index] = !prev[index];
            return newSelected;
        });
        setSelectedSemesters(prev => {
            if (prev.includes(semesters[index])) {
                return prev.filter(semester => semester !== semesters[index]);
            } else {
                return [...prev, semesters[index]];
            }
        });
    }, [setSelected, setSelectedSemesters, semesters]);

    return (
        <Grid container justifyContent={"center"}>
            {semesters.map((semester, index) => (
                <Grid
                    container
                    item
                    justifyContent={"space-around"}
                    xs={12}
                    key={semester}
                    onClick={() => toggleSemester(index)}
                    borderRadius={3}
                    border={"1px solid transparent"}
                    py={1}
                    sx={{
                        cursor: "pointer",
                        ":hover": {
                            border: (theme) => `1px solid ${theme.palette.primary.main}`,
                            backgroundColor: (theme) => theme.palette.action.hover
                        },
                        ":not(:last-child)": {
                            mb: 1
                        },
                    }}

                >
                    <Grid item xs={7} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        <Typography variant={"h4"}>{semester}</Typography>
                    </Grid>
                    <Grid item display={"flex"} justifyContent={"center"} alignItems={"center"}>
                        {selectedSemesters[index] ? <CheckCircleIcon color={"success"}/> : <RadioButtonUncheckedIcon/>}
                    </Grid>
                </Grid>
            ))}
        </Grid>
    );
};

export default SemesterSelector;
