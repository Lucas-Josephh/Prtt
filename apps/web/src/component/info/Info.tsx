import { JSX } from 'react'
import './Info.scss'

export default function Info({title, logo, line, color="#3b82f6", width, height}: {title: string, logo?: JSX.Element, line?: (string | JSX.Element)[], color?: string, width?: string, height?: string}) {
    return (
        <div className='extranet-info' style={{borderTop: `3px solid ${color}`, width: `${width}`, height: `${height}`}}>
            <div className='extranet-info-container' style={{color: `${color}`}}>
                {logo}<h1 className='extranet-info-container_title'>{title}</h1>
            </div>
            {line?.map((item, index) => (
                <div key={index} className='extranet-info_description'>{item}</div>
            ))}
            
        </div>
    )
}