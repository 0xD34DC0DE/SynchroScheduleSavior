import {Box, Button} from "@mui/material";
import Scraper from "./apis/Scraper.ts";

function App() {

    const beginScraping = async () => {
        await Scraper.begin("https://academique-dmz.synchro.umontreal.ca/");
    }

    const testInjection = async () => {
        try {
            await Scraper.navigateToPath("/psp/acprpr9/EMPLOYEE/SA/c/SA_LEARNER_SERVICES.SSS_STUDENT_CENTER.GBL", 1000);
        } catch (e) {
            console.error(e);
        }
    }

    return (
        <FlexBox sx={{width: "100%", height: "100%", backgroundColor: "rgb(255,247,240)"}}
                 horizontalAlignment={"center"} verticalAlignment={"center"}>
            <Paper sx={{p: 2}} elevation={2}>
                <FlexBox gap={"2rem"}>
                    <Button onClick={startScraper}>Begin scraping</Button>
                    <Button onClick={testInjection}>Test injection</Button>
                </FlexBox>
            </Paper>
        </FlexBox>
    );
}

export default App;
