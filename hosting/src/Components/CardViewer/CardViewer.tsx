import React, { createContext, useState, useContext } from "react";
import { Dialog } from "@mui/material";
import PlayCard from "../PlayCard/PlayCard";

interface CardViewerContextProps {
    setCardToShow: (payload: string | null) => void;
}

const CardViewerContext = createContext<CardViewerContextProps | undefined>(undefined);

export const useCardViewer = () => {
    const context = useContext(CardViewerContext);
    if (!context) {
        throw new Error("useCardViewer must be used within a CardViewerProvider");
    }
    return context;
};

export const CardViewerProvider: React.FC<{ children: React.ReactNode, CampaignID: string}> = ({ children, CampaignID }) => {
    const [cardToShow, setCardToShow] = useState<string | null>(null);
    return (
        <CardViewerContext.Provider value={{ setCardToShow }}>
            {children}
            {cardToShow && (
                <Dialog open={!!cardToShow} onClose={() => setCardToShow(null)} slotProps={{paper: { style: { backgroundColor: 'transparent', boxShadow: 'none' } }}}>
                    <PlayCard CampaignID={CampaignID} CardID={cardToShow} />
                </Dialog>
            )}
        </CardViewerContext.Provider>
    );
};
