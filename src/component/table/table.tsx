"use client";

import { Clock, Users, X } from "lucide-react"
import "./table.scss"
import { useState } from "react";

export default function Table({close, handleTogglePop}: {close: boolean, handleTogglePop: (state: boolean) => void}) {
    const [select, setSelect] = useState("");

    return (
        <>
            {close &&
                <>
                    <div className="extranet-table-filter" onClick={() => handleTogglePop(false)}></div>
                    <div className="extranet-table">
                        <div className="extranet-table-header">
                            <div className="extranet-table-header-head">
                                <h1 className="extranet-table-header-head_title">Choisir mes tableaux</h1>
                                <span className="extranet-table-header-head_subtitle">Sélectionnez les tableaux auxquels vous souhaitez participer</span>
                            </div>
                            <X size="18" style={{cursor: "pointer"}} onClick={() => handleTogglePop(false)} />
                        </div>
                        <div className="extranet-table-main">
                            <h2 className="extranet-table-main_date">Jeudi 9 Avril</h2>
                            <ul className="extranet-table-main-list">
                                <li className="extranet-table-main-list-li">
                                    <button className="extranet-table-main-list-li-btn" >
                                        <div className="extranet-table-main-list-li-btn_num">A</div>
                                        <div className="extranet-table-main-list-li-btn-contain">
                                            <div className="extranet-table-main-list-li-btn-contain-content">
                                                <span className="extranet-table-main-list-li-btn-contain-content_tb">Tableau A</span>
                                                <span className="extranet-table-main-list-li-btn-contain-content_classe">NC - 800 pts</span>
                                            </div>
                                            <div className="extranet-table-main-list-li-btn-contain-content">
                                                <span className="extranet-table-main-list-li-btn-contain-content_date"><Clock size="10" />10h</span>
                                                <span className="extranet-table-main-list-li-btn-contain-content_number"><Users size="10" /> 0/32</span>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </>
            }
        </>
    )
}