import { subscribeToPlayers, upsertPlayer, modifyPlayerCards, subscribeToCards, addCardUsage, setCardShowcase } from "@/services/firestore";
import { Player, PlayingCard } from "@/services/interfaces";
import { Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, TextField, Autocomplete, Box, IconButton, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import { ExpandMore, Delete, Add, Remove, Shuffle, Visibility } from '@mui/icons-material';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { rarities } from "@/services/constants";
import PlayCard from "../PlayCard/PlayCard";

const basePlayer: Player = {
    id: "",
    name: "",
    balance: 0,
    Cards: {}
};

const PlayerManagement: React.FC<{ CampaignID: string }> = ({ CampaignID }) => {
    const [playerList, setPlayerList] = useState<Player[]>([]);
    const [newPlayer, setNewPlayer] = useState<Player | null>(null);
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<PlayingCard[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [viewCard, setViewCard] = useState<{ cardId: string, timesUsed: number } | null>(null);
    const [rarityFilter, setRarityFilter] = useState<number | null>(null);

    useEffect(() => {
        return subscribeToPlayers(CampaignID, data => {
            setPlayerList(data);
        });
    }, [CampaignID]);

    useEffect(() => {
        return subscribeToCards(CampaignID, setCards);
    }, [CampaignID]);

    const playerSubmitError = {
        name: newPlayer?.name === "",
        balance: newPlayer?.balance === 0
    };

    const getCardName = (cardId: string) => {
        const card = cards.find(c => c.id === cardId);
        return card ? card.name : `Card ID: ${cardId}`;
    };

    const getCardUsage = (card: { cardId: string; timesUsed: number }) => {
        const cardInfo = cards.find(c => c.id === card.cardId);
        if (!cardInfo) return `Times Used: ${card.timesUsed}`;
        return cardInfo.usage === -1
            ? `Times Used: ${card.timesUsed} / ∞`
            : `Times Used: ${card.timesUsed} / ${cardInfo.usage}`;
    };

    const updatePlayerBalance = async (player: Player, amount: number, event: React.MouseEvent) => {
        event.stopPropagation();
        const updatedPlayer = { ...player, balance: player.balance + amount };
        await upsertPlayer(CampaignID, updatedPlayer);
    };

    const getFilteredCards = () => {
        return rarityFilter !== null
            ? cards.filter(card => card.rarity === rarityFilter)
            : cards;
    };

    const getRandomCard = () => {
        const filteredCards = getFilteredCards();
        const totalWeight = filteredCards.reduce((sum, card) => sum + card.rarity, 0);
        let random = Math.random() * totalWeight;
        for (const card of filteredCards) {
            random -= card.rarity;
            if (random <= 0) return card;
        }
        return filteredCards[0];
    };

    const addCardToInventory = async (card: PlayingCard) => {
        if (selectedPlayer) {
            await modifyPlayerCards(CampaignID, selectedPlayer.id, "add", card.id);
        }
    };

    const addCardToVisible = (card: PlayingCard) => {
        setSelectedCards(prev => [...prev, card]);
    };

    const clearVisibleCards = () => {
        setSelectedCards([]);
    };
    const handleShowcaseCard = async (cardId: string) => {
        await setCardShowcase(CampaignID, [cardId]);
    };

    return (
        <Card>
            <CardHeader title="Player Management" />
            <CardContent>
                <List>
                    {playerList.map((val, index) => (
                        <Accordion key={index}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <ListItemText
                                    primary={val.name}
                                    secondary={
                                        <>
                                            Balance: {val.balance}
                                            <Add onClick={(event) => updatePlayerBalance(val, 1, event)} />
                                            <Remove onClick={(event) => updatePlayerBalance(val, -1, event)} />
                                        </>
                                    }
                                />
                            </AccordionSummary>
                            <AccordionDetails>
                                <List>
                                    {Object.entries(val.Cards)
                                        .sort(([keyA, cardA], [keyB, cardB]) => {
                                            const nameA = getCardName(cardA.cardId);
                                            const nameB = getCardName(cardB.cardId);
                                            if (nameA === nameB) {
                                                return keyA.localeCompare(keyB);
                                            }
                                            return nameA.localeCompare(nameB);
                                        })
                                        .map(([key, card]) => (
                                            <ListItem key={key} style={{ backgroundColor: rarities[(cards.find(c => c.id === card.cardId)?.rarity || 1)].background }}>

                                                <ListItemText
                                                    primary={getCardName(card.cardId)}
                                                    secondary={<>
                                                        <Remove onClick={() => addCardUsage(CampaignID, val.id, key, -1)} />
                                                        {getCardUsage(card)}
                                                        <Add onClick={() => addCardUsage(CampaignID, val.id, key, 1)} />
                                                    </>}
                                                />
                                                <IconButton onClick={() => handleShowcaseCard(card.cardId)}>
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton onClick={() => modifyPlayerCards(CampaignID, val.id, "remove", key)}>
                                                    <Delete />
                                                </IconButton>
                                                <Box
                                                    component="img"
                                                    src={cards.find(c => c.id === card.cardId)?.background}
                                                    alt={getCardName(card.cardId)}
                                                    sx={{
                                                        width: 50,
                                                        height: 50,
                                                        objectFit: "cover",
                                                        marginLeft: 2,
                                                        borderRadius: 1,
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => setViewCard({ cardId: card.cardId, timesUsed: card.timesUsed })}
                                                />
                                            </ListItem>
                                        ))}
                                    <ListItem>
                                        <Button onClick={() => {
                                            setSelectedPlayer(val);
                                            setSelectedCards([]);
                                        }}>Add Card</Button>
                                    </ListItem>
                                </List>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                    <ListItem>
                        <ListItemText primary="New Player" />
                        <Button onClick={() => setNewPlayer({ ...basePlayer, id: "" })}>Create</Button>
                    </ListItem>
                </List>
                {newPlayer && (
                    <Dialog open={!!newPlayer} onClose={() => setNewPlayer(null)}>
                        <DialogTitle>Create New Player</DialogTitle>
                        <DialogContent>
                            <TextField
                                sx={{ marginTop: 2 }}
                                fullWidth
                                error={playerSubmitError.name}
                                id="playername"
                                label="Name"
                                variant="outlined"
                                value={newPlayer.name || ""}
                                onChange={(e) => setNewPlayer(d => ({ ...d!, name: e.target.value || "" }))}
                            />
                            <TextField
                                sx={{ marginTop: 2 }}
                                fullWidth
                                error={playerSubmitError.balance}
                                type="number"
                                id="balance"
                                label="Balance"
                                variant="outlined"
                                value={newPlayer.balance || ""}
                                onChange={(e) => setNewPlayer(d => ({ ...d!, balance: parseInt(e.target.value as string) || 0 }))}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setNewPlayer(null)}>Cancel</Button>
                            <Button
                                variant="contained"
                                disabled={playerSubmitError.name || playerSubmitError.balance}
                                onClick={() => {
                                    if (newPlayer) {
                                        upsertPlayer(CampaignID, newPlayer).then(() => setNewPlayer(null));
                                    }
                                }}
                            >
                                Submit
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
                {selectedPlayer && (
                    <Dialog open={!!selectedPlayer} onClose={() => setSelectedPlayer(null)}>
                        <DialogTitle>Add Card to {selectedPlayer.name}</DialogTitle>
                        <DialogContent>
                            <FormControl fullWidth sx={{ marginBottom: 2 }}>
                                <InputLabel id="rarity-filter-label">Rarity</InputLabel>
                                <Select
                                    labelId="rarity-filter-label"
                                    value={rarityFilter || ""}
                                    label="Rarity"
                                    onChange={(e) => setRarityFilter(e.target.value === "" ? null : parseInt(e.target.value as string))}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {Object.entries(rarities).map(([i, v]) => (
                                        <MenuItem key={i} value={i}>{v.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Autocomplete
                                options={getFilteredCards()}
                                getOptionLabel={(option) => option.name}
                                onChange={(event, value) => value && addCardToVisible(value)}
                                renderInput={(params) => <TextField {...params} label="Card Name" variant="outlined" />}
                            />
                            <Box display="flex" justifyContent="space-between" mt={2}>
                                <Button
                                    variant="contained"
                                    startIcon={<Shuffle />}
                                    onClick={() => addCardToVisible(getRandomCard())}
                                >
                                    Random
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={clearVisibleCards}
                                >
                                    Clear
                                </Button>
                            </Box>
                            {selectedCards.map((card, index) => (
                                <Box key={index} mt={2}>
                                    <PlayCard CampaignID={CampaignID} CardID={card.id} />
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={() => addCardToInventory(card)}
                                    >
                                        Add to Inventory
                                    </Button>
                                </Box>
                            ))}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedPlayer(null)}>Close</Button>
                        </DialogActions>
                    </Dialog>
                )}
                {viewCard && (
                    <Dialog open={!!viewCard} onClose={() => setViewCard(null)} PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}>
                        <PlayCard CampaignID={CampaignID} CardID={viewCard.cardId} timesUsed={viewCard.timesUsed} />
                    </Dialog>
                )}
            </CardContent>
        </Card>
    );
};

export default PlayerManagement;
