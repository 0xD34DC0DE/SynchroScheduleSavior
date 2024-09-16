import {routes} from "../router";
import {matchRoutes, RouteObject, useResolvedPath} from "react-router-dom";

const useSplatPathChildrenRoutes = (): RouteObject[] => {
    const location = useResolvedPath("../");
    const matches = matchRoutes(routes, location.pathname)?.filter(
        (match) => match.pathname === location.pathname && match.route.path?.endsWith("*")
    );
    if (matches === undefined) throw new Error("No matched routes");
    return matches.at(-1)?.route.children ?? [];
}

export default useSplatPathChildrenRoutes;