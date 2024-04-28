import GridLayout from "../../../components/layouts/GridLayout.tsx";
import {Outlet} from "react-router-dom";

interface CenteredGridLayoutProps {
}

const CenteredGridLayout = ({}: CenteredGridLayoutProps) => {
    return (
        <GridLayout justifyContent={"center"} alignItems={"center"}>
            <Outlet/>
        </GridLayout>
    );
};

export default CenteredGridLayout;
