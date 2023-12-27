import {Box, Button} from "@mui/material";
import {invoke} from "@tauri-apps/api";

const inject = async <T extends () => R, R>(fn: () => R, timeout_ms: number): Promise<R> => {
    return invoke<ReturnType<T>>("synchro_inject", {js: fn.toString(), timeoutMs: timeout_ms});
}

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
        inject(testString, 1000)
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        inject(testNumber, 1000)
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        inject(testBoolean, 1000)
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        inject(testArray, 1000)
            .then((res) => console.log(res, typeof res))
            .catch((err) => console.error(err));

        inject(testObject, 1000)
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
