import { upsertPlayer, modifyPlayerCards } from "@/services/firestore";
import { Player } from "@/services/interfaces";
import { Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, TextField, Box, FormControl, InputLabel, Select, MenuItem, IconButton } from "@mui/material";
import { useState } from "react";
import { ExpandMore, Add, Remove, Shuffle } from '@mui/icons-material';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { rarities } from "@/services/constants";
import CardList from "../CardList/CardList";
import { useAppSelector } from "@/store/reduxHooks";

const basePlayer: Player = {
    id: "",
    name: "",
    balance: 0,
    Cards: {}
};

const PlayerManagement: React.FC<{ CampaignID: string }> = ({ CampaignID }) => {
    const playerList = useAppSelector(state => state.campaign.value?.players || []);
    const cards = useAppSelector(state => state.campaign.value?.cards || []);
    const [newPlayer, setNewPlayer] = useState<Player | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [rarityFilter, setRarityFilter] = useState<number | null>(null);

    const playerSubmitError = {
        name: newPlayer?.name === "",
        balance: newPlayer?.balance === 0
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

    const addCardToInventory = async (cardID: string) => {
        if (selectedPlayer) {
            await modifyPlayerCards(CampaignID, selectedPlayer.id, "add", cardID);
        }
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
                                            <Remove onClick={(event) => updatePlayerBalance(val, -1, event)} />
                                            Balance: {val.balance}
                                            <Add onClick={(event) => updatePlayerBalance(val, 1, event)} />
                                        </>
                                    }
                                />
                            </AccordionSummary>
                            <AccordionDetails>
                                <Button variant="contained" onClick={() => setSelectedPlayer(val)}>Add Card</Button>
                                <CardList
                                    campaignID={CampaignID}
                                    dataSource={val}
                                    isDM={true}
                                />
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
                            <CardList
                                campaignID={CampaignID}
                                dataSource={getFilteredCards().map(card => card.id)}
                                enableFiltering
                                enableSorting
                                customControls={(item) => (
                                    <IconButton
                                        onClick={() => addCardToInventory(item.cardId)}
                                    >
                                        <Add />
                                    </IconButton>
                                )}
                            />
                            <Box display="flex" justifyContent="space-between" mt={2}>
                                <Button
                                    variant="contained"
                                    startIcon={<Shuffle />}
                                    onClick={() => addCardToInventory(getRandomCard().id)}
                                >
                                    Random
                                </Button>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedPlayer(null)}>Close</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    );
};

export default PlayerManagement;
