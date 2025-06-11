import React from "react";
import ReactDOM from "react-dom/client";
import {RouterProvider} from "react-router-dom";
import router from "./router.tsx";
import "./style.css"
import {graphql_client} from "./stores/graphql_client.ts";
import {Provider} from "urql";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <Provider value={graphql_client}>
            <RouterProvider router={router}/>
        </Provider>
    </React.StrictMode>,
);
