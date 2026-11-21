import "./History.scss";
import { JSX } from "react";

export default function History({id="-1", selectedId="", logo, logoName, tagName = logoName, title, description, color}: {id?: string, selectedId?: string; logo?: string, logoName?: string, tagName?: string, title?: string, description?: JSX.Element, color?: string}) {
    return (
        <div className="history">
            <div className="history-container">
                <div className="history-container-content">
                    <div className="history-container-content-element">
                        <span
                            className="history-container-content-element_bubble"
                            style={{
                                backgroundColor: color,
                                borderColor: color,
                                ...(color && { transform: "scale(1.08)" })
                            }}>
                                {logo}
                            </span>
                        <span className="history-container-content-element_text">{logoName}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}