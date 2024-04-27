import {routes} from "../router";
import {RouteObject, useMatches, useOutlet} from "react-router-dom";
import React from "react";

const useChildrenRoutes = (): RouteObject[] => {
    const outletChildren = useOutlet();
    if (outletChildren === null) return [];

    if (!React.isValidElement(outletChildren)) throw new Error("Invalid element in outlet");
    const renderedElement = (outletChildren.props as any).children;
    if (!React.isValidElement(renderedElement)) throw new Error("Invalid element in outlet");

    const childComponentsName = React.Children.map((renderedElement.props as any).children, (child) => {
        if (!React.isValidElement(child)) throw new Error("Invalid element in outlet");
        return (child.type as any).name;
    });

    const matched_routes = useMatches();
    const deepestMatch = matched_routes.at(-1);
    if (deepestMatch === undefined) throw new Error("No matched routes");

    const routeIndices = deepestMatch.id.split("-").map(Number);
    const firstIndex = routeIndices.shift();
    if (firstIndex === undefined) throw new Error("No route indices");
    let currentRoute: RouteObject = routes[firstIndex];

    for (const index of routeIndices) {
        if (currentRoute?.children === undefined) throw new Error("Could not find children routes");
        for (const child of currentRoute.children) {
            if (childComponentsName.includes((child.element as any | undefined)?.type.name ?? "")) {
                return currentRoute.children;
            }
        }
        currentRoute = currentRoute.children[index];
    }

    throw new Error("Could not find children routes");
}

export default useChildrenRoutes;