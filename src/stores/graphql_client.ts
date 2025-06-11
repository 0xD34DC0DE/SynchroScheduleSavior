import {createClient} from "urql";
import {invokeExchange} from "tauri-plugin-graphql-urql";

export const graphql_client = createClient({
    url: "graphql",
    exchanges: [invokeExchange],
});
