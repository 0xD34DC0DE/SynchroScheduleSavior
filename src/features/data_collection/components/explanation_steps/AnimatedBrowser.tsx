import {animated} from "react-spring";
import {ReactNode} from "react";

interface AnimatedBrowserProps {
    title?: ReactNode;
    header?: ReactNode
    mainContent?: ReactNode;
    footer?: ReactNode;
}

const AnimatedBrowser = ({title, header, mainContent, footer}: AnimatedBrowserProps) => {
    return (
        <animated.div>
            <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
                {/* Background and Window Controls */}
                <rect x="10" y="10" width="780" height="580" fill="#f0f0f0" stroke="#ccc" strokeWidth="1"/>
                <circle cx="30" cy="30" r="10" fill="#ff5f56"/>
                <circle cx="60" cy="30" r="10" fill="#ffbd2e"/>
                <circle cx="90" cy="30" r="10" fill="#27c93f"/>
                <text x="115" y="35" fill="#333" fontSize="16" fontFamily="Arial, sans-serif">{title}</text>

                {/* Header */}
                <rect x="10" y="50" width="780" height="50" fill="#333"/>
                <text x="20" y="80" fill="#fff" fontSize="20" fontFamily="Arial, sans-serif">{header}</text>

                {/* Main Content */}
                <rect x="10" y="100" width="760" height="440" fill="#f7f7f7"/>
                <text x="128" y="350" fill="#333" fontSize="48" fontFamily="Arial, sans-serif">
                    {mainContent}
                </text>

                {/* Scrollbar */}
                <rect x="770" y="100" width="20" height="440" fill="#ddd"/>
                <rect x="770" y="100" width="20" height="100" fill="#bbb"/>

                {/* Footer */}
                <rect x="10" y="540" width="780" height="50" fill="#666"/>
                <text x="20" y="570" fill="#fff" fontSize="12" fontFamily="Arial, sans-serif">{footer}</text>
            </svg>
        </animated.div>
    );
};

export default AnimatedBrowser;
