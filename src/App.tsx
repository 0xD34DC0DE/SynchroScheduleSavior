import {Box, Button} from "@mui/material";
import {invoke} from "@tauri-apps/api";

function App() {

    const open_puppet = async () => {
        await invoke("open_puppet", {"url": "https://saml.authentification.umontreal.ca/"})
    }

    const testString = () => {
        return "test";
    }

    const testNumber = () => {
        return 1;
    }

    const testBoolean = () => {
        return true;
    }

    const testArray = () => {
        return [1, 2, 3];
    }

    const testObject = () => {
        return {
            a: "a_str",
            b: 1,
        };
    }

    const testInjection = async () => {
        invoke("synchro_inject", {js: testString.toString(), timeoutMs: 1000})
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        invoke("synchro_inject", {js: testNumber.toString(), timeoutMs: 1000})
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        invoke("synchro_inject", {js: testBoolean.toString(), timeoutMs: 1000})
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        invoke("synchro_inject", {js: testArray.toString(), timeoutMs: 1000})
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        invoke("synchro_inject", {js: testObject.toString(), timeoutMs: 1000})
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));
    }

    return (
        <Box sx={{
            width: "100%",
            height: "100%",
        }}>
            <Button onClick={open_puppet} variant={"contained"}>Open synchro</Button>
            <Button onClick={testInjection} variant={"contained"}>Test Injection</Button>
        </Box>
    );
}

export default App;
