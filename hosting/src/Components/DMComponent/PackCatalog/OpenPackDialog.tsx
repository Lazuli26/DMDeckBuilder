"use client"

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, Box, Typography, IconButton } from "@mui/material";
import { Pack, PlayingCard, PlayerCollection } from "../../../services/interfaces";
import { PersonAdd } from "@mui/icons-material";
import { useState } from "react";
import { rarities } from "@/services/constants";
import { useCardViewer } from "../../CardViewer/CardViewer";
import _ from "lodash";

interface OpenPackDialogProps {
    open: boolean;
    pack: { pack: Pack, pickedCards: PlayingCard[] } | null;
    players: PlayerCollection;
    onClose: () => void;
    onAddCardToPlayer: (playerId: string, cardId: string, index: number) => void;
    onShowcaseOpenedPack: () => void;
}

const OpenPackDialog: React.FC<OpenPackDialogProps> = ({
    open,
    pack,
    players,
    onClose,
    onAddCardToPlayer,
    onShowcaseOpenedPack
}) => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);
    const onViewCard = useCardViewer().setCardToShow;
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Opened Pack</DialogTitle>
            <DialogContent>
                <Typography>Please select {pack?.pack.picksPerPack}</Typography>
                <List>
                    {pack?.pickedCards.map((card, i) => (
                        <ListItem key={card.id + i} style={{ backgroundColor: rarities[card.rarity].background, minWidth: "30rem" }}>
                            <ListItemText primary={card.name} />
                            <IconButton onClick={() => setSelectedCard(card.id)}>
                                <PersonAdd />
                            </IconButton>
                            {selectedCard === card.id && (
                                <FormControl fullWidth>
                                    <InputLabel id={`player-select-label-${card.id}`}>Assign to Player</InputLabel>
                                    <Select
                                        labelId={`player-select-label-${card.id}`}
                                        onChange={(e) => {
                                            onAddCardToPlayer(e.target.value as string, card.id, i);
                                            setSelectedCard(null);
                                        }}
                                        label="Assign to Player"
                                    >
                                        {_.map(players, (player, id) => (
                                            <MenuItem key={id} value={id}>{player.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                            <Box
                                component="img"
                                src={card.background}
                                alt={card.name}
                                sx={{
                                    width: 50,
                                    height: 50,
                                    objectFit: "cover",
                                    marginLeft: 2,
                                    borderRadius: 1,
                                    cursor: 'pointer'
                                }}
                                onClick={() => onViewCard(card.id)}
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onShowcaseOpenedPack} variant="contained">Showcase</Button>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default OpenPackDialog;

