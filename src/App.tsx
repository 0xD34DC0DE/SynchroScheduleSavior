import {Box, Button} from "@mui/material";
import {useUserConnectionStore} from "./stores/UserConnectionStore.ts";
import {useEffect} from "react";
import {invoke} from "@tauri-apps/api";

function App() {
    const userConnectionStore = useUserConnectionStore();

    useEffect(() => {
        if (userConnectionStore.userConnection === null) {
            console.log("User connection is null");
        }
    }, []);

    const openPuppet = () => {
       invoke("open_puppet", {"url": "https://saml.authentification.umontreal.ca/"}).then().catch((err) => {
           console.log(err);
       });
    }

    const testFunction = () => {
        document.querySelector("main")?.classList.remove("udem-bg-1");
        document.querySelector("main")?.classList.remove("udem-bg-2");
        document.querySelector("main")?.classList.remove("udem-bg-3");
        document.querySelector("main")?.classList.remove("udem-bg-4");
        document.querySelector("main")?.classList.remove("udem-bg-5");
        document.querySelector("main")?.classList.remove("udem-bg-6");
    }

    const testInjection = () => {
        const args = {
            "javascript": `(${testFunction})()`,
        }

        invoke("synchro_inject", args).then().catch((err) => {
            console.log(err);
        });
    }

    return (
        <Box sx={{
            width: "100%",
            height: "100%",
        }}>
        <Button onClick={openPuppet} variant={"contained"}>Open synchro</Button>
        <Button onClick={testInjection} variant={"contained"}>Test Injection</Button>
        </Box>
    );
}

export default App;
