"use client"

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, Box, Typography, IconButton } from "@mui/material";
import { Pack, PlayingCard, Player } from "../../services/interfaces";
import { PersonAdd } from "@mui/icons-material";
import { useState } from "react";
import { rarities } from "@/services/constants";

interface OpenPackDialogProps {
    open: boolean;
    pack: { pack: Pack, pickedCards: PlayingCard[] } | null;
    players: Player[];
    onClose: () => void;
    onAddCardToPlayer: (playerId: string, cardId: string, index: number) => void;
    onShowcaseOpenedPack: () => void;
    onViewCard: (cardId: string) => void;
}

const OpenPackDialog: React.FC<OpenPackDialogProps> = ({
    open,
    pack,
    players,
    onClose,
    onAddCardToPlayer,
    onShowcaseOpenedPack,
    onViewCard
}) => {
    const [selectedCard, setSelectedCard] = useState<string | null>(null);

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
                                        {players.map(player => (
                                            <MenuItem key={player.id} value={player.id}>{player.name}</MenuItem>
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

