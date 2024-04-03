import {Outlet, PathRouteProps, Route, Routes, useNavigate} from "react-router-dom";
import ScraperProvider from "./ScraperProvider.tsx";
import ScraperLoader from "./ScraperLoader.tsx";

interface ScraperRouteGuardProps extends PathRouteProps {
    windowClosedRedirectPath: string;
    windowCreateArgs: {
        label: string;
        title: string;
        url: string;
    }
}

const ScraperRouteGuard = ({
                               windowClosedRedirectPath,
                               windowCreateArgs,
                               ...routerProps
                           }: ScraperRouteGuardProps) => {
    const navigate = useNavigate();
    const onWindowClose = () => navigate(windowClosedRedirectPath);

    return (
        <Routes>
            <Route
                element={
                    <ScraperProvider>
                        <ScraperLoader windowArgs={windowCreateArgs} onWindowClose={onWindowClose}>
                            <Outlet/>
                        </ScraperLoader>
                    </ScraperProvider>
                }
            >
                <Route {...routerProps}/>
            </Route>
        </Routes>
    );
};

export default ScraperRouteGuard;