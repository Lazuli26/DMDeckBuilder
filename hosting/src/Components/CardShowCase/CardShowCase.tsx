"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogActions, Box, IconButton, Typography } from "@mui/material";
import { getCardInfo, setCardShowcase, subscribeToCardShowCase } from "../../services/firestore";
import { PlayingCard } from "../../services/interfaces";
import PlayCard from "../PlayCard/PlayCard";
import { ArrowBack, ArrowForward } from "@mui/icons-material";

const CardShowCase: React.FC<{ CampaignID: string, isDM: boolean }> = ({ CampaignID, isDM }) => {
    const [cardIds, setCardIds] = useState<string[]>([]);
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const unsubscribe = subscribeToCardShowCase(CampaignID, async (cardShowcase) => {
            if (cardShowcase && cardShowcase.length > 0) {
                setCardIds(cardShowcase);
                const cardData = await Promise.all(cardShowcase.map(id => getCardInfo(CampaignID, id)));
                setCards(cardData.filter(card => card !== null) as PlayingCard[]);
            } else {
                setCardIds([]);
                setCards([]);
                setCurrentIndex(0);
            }
        });
        return () => unsubscribe();
    }, [CampaignID]);

    const handleClose = async () => {
        if (isDM) {
            await setCardShowcase(CampaignID, []);
        }
    };

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + cards.length) % cards.length);
    };

    return (
        <Dialog open={cardIds.length > 0} onClose={handleClose} PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}>
            <DialogContent>
                {cards.length > 0 && (
                    <PlayCard CampaignID={CampaignID} CardID={cards[currentIndex].id} />
                )}
            </DialogContent>
            <DialogActions>
                {cards.length > 1 && (
                    <Box display="flex" justifyContent="space-between" width="100%">
                        <IconButton onClick={handlePrev} sx={{ color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                            {currentIndex + 1} / {cards.length}
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
