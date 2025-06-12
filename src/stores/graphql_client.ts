import {createClient} from "urql";
import {invokeExchange} from "tauri-plugin-graphql-urql";
import {devtoolsExchange} from "@urql/devtools";

export const graphql_client = createClient({
    url: "graphql",
    exchanges: [invokeExchange, devtoolsExchange],
});
