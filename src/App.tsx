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
        <Box sx={{
            width: "100%",
            height: "100%",
        }}>
            <Button onClick={beginScraping} variant={"contained"}>Open synchro</Button>
            <Button onClick={testInjection} variant={"contained"}>Test Injection</Button>
        </Box>
    );
}

export default App;
