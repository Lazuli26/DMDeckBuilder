"use client"

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/reduxHooks";
import { Dialog, DialogContent, DialogActions, Box, IconButton, Typography } from "@mui/material";
import { setCardShowcase } from "../../services/firestore";
import PlayCard from "../PlayCard/PlayCard";
import { ArrowBack, ArrowForward } from "@mui/icons-material";

const CardShowCase: React.FC<{ CampaignID: string, isDM: boolean }> = ({ CampaignID, isDM }) => {
    const cardShowcase = useAppSelector(state => state.campaign.value?.cardShowcase || []);
    const cards = useAppSelector(state => state.campaign.value?.cards || []);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (cardShowcase.length > 0) {
            setCurrentIndex(0);
        }
    }, [cardShowcase]);

    const handleClose = async () => {
        if (isDM) {
            await setCardShowcase(CampaignID, []);
        }
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % cardShowcase.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + cardShowcase.length) % cardShowcase.length);
    };

    const currentCard = cards.find(card => card.id === cardShowcase[currentIndex]);

    return (
        <Dialog open={cardShowcase.length > 0} onClose={handleClose} PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}>
            <DialogContent>
                {currentCard && (
                    <PlayCard CampaignID={CampaignID} CardID={currentCard.id} />
                )}
            </DialogContent>
            <DialogActions>
                {cardShowcase.length > 1 && (
                    <Box display="flex" justifyContent="space-between" width="100%">
                        <IconButton onClick={handlePrev} sx={{ color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                            {currentIndex + 1} / {cardShowcase.length}
                        </Typography>
                        <IconButton onClick={handleNext} sx={{ color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                            <ArrowForward />
                        </IconButton>
                    </Box>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CardShowCase;
