import { TableProperties } from "lucide-react"
import "./Button.scss"

export default function Button({className, type, onClick, variant, lib, width="max-content", height="max-content"}: {className?: string, onClick?: () => void, type?: "button" | "reset" | "submit", variant: "primary" | "secondary" | "tertiary" | "action", lib: string, width?: string, height?: string}) {
    return (
        <>
        {
        (variant.toLowerCase() === "primary" || 
        variant.toLowerCase() === "secondary" ||
        variant.toLowerCase() === "action" ||
        variant.toLowerCase() === "tertiary") &&
            <button
                className={`extranet-button-${variant.toLowerCase()} extranet-button-init ${className}`}
                type={type}
                style={{width: `${width}`, height: `${height}`}}
                onClick={onClick}
            >
                {variant.toLowerCase() === "action" && <TableProperties size="16" />} {lib}
            </button>
        }
        </>
    )
}