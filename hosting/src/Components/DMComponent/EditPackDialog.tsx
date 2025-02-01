"use client"

import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, Box, List, ListItem, FormControl, InputLabel, Select, MenuItem, Checkbox, IconButton, ListItemText, Typography } from "@mui/material";
import { Pack, PlayingCard } from "../../services/interfaces";
import { Edit, Clear } from "@mui/icons-material";
import { rarityColors } from "../PlayCard/PlayCard";
import { rarities } from "./DMComponent";
import PlayCard from "../PlayCard/PlayCard";

interface EditPackDialogProps {
    campaignID: string;
    open: boolean;
    pack: Pack | null;
    cards: PlayingCard[];
    nameFilter: string;
    categoryFilter: string;
    rarityFilter: number | null;
    tabIndex: number;
    onClose: () => void;
    onSave: (pack: Pack) => void;
    onPackChange: (field: keyof Pack, value: string | number) => void;
    onToggleCardInPack: (cardId: string) => void;
    onWeightChange: (cardId: string, weight: number | null) => void;
    onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    onNameFilterChange: (value: string) => void;
    onCategoryFilterChange: (value: string) => void;
    onRarityFilterChange: (value: number | null) => void;
}

const EditPackDialog: React.FC<EditPackDialogProps> = ({
    open,
    pack,
    cards,
    campaignID,
    nameFilter,
    categoryFilter,
    rarityFilter,
    tabIndex,
    onClose,
    onSave,
    onPackChange,
    onToggleCardInPack,
    onWeightChange,
    onTabChange,
    onNameFilterChange,
    onCategoryFilterChange,
    onRarityFilterChange
}) => {
    const [viewCard, setViewCard] = useState<string | null>(null);

    const getFilteredCards = () => {
        return cards.filter(card =>
            (nameFilter === "" || card.name.toLowerCase().includes(nameFilter.toLowerCase())) &&
            (categoryFilter === "" || card.category.toLowerCase().includes(categoryFilter.toLowerCase())) &&
            (rarityFilter === null || card.rarity === rarityFilter)
        );
    };

    const sortedCards = getFilteredCards().sort((a, b) => {
        const aChecked = pack?.cardPool.some(content => content.cardId === a.id);
        const bChecked = pack?.cardPool.some(content => content.cardId === b.id);
        if (aChecked === bChecked) {
            return a.name.localeCompare(b.name);
        }
        return aChecked ? -1 : 1;
    });

    const uniqueCategories = ["All", ...new Set(cards.map(card => card.category).filter(category => category !== ""))];

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Edit Pack</DialogTitle>
            <DialogContent>
                <Tabs value={tabIndex} onChange={onTabChange} centered>
                    <Tab label="Pack Details" />
                    <Tab label="Pack Contents" />
                </Tabs>
                <Box hidden={tabIndex !== 0}>
                    <TextField
                        label="Pack Name"
                        value={pack?.name || ""}
                        onChange={(e) => onPackChange("name", e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Pack Price"
                        type="number"
                        value={pack?.price || 0}
                        onChange={(e) => onPackChange("price", parseFloat(e.target.value))}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Cards Per Pack"
                        type="number"
                        value={pack?.cardsPerPack || 1}
                        onChange={(e) => onPackChange("cardsPerPack", parseInt(e.target.value))}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Picks Per Pack"
                        type="number"
                        value={pack?.picksPerPack || 1}
                        onChange={(e) => onPackChange("picksPerPack", parseInt(e.target.value))}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Background Image URL"
                        value={pack?.background || ""}
                        onChange={(e) => onPackChange("background", e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                </Box>
                <Box hidden={tabIndex !== 1}>
                    <Typography variant="h6">Pick {pack?.picksPerPack}</Typography>
                    <List>
                        <ListItem>
                            <TextField sx={{ marginTop: 2 }} fullWidth id="namefilter" label="Name filter" variant="outlined"
                                value={nameFilter}
                                onChange={(e) => onNameFilterChange(e.target.value)}
                            />
                        </ListItem>
                        <ListItem>
                            <FormControl fullWidth sx={{ marginTop: 2 }}>
                                <InputLabel id="category-filter-label">Category</InputLabel>
                                <Select
                                    labelId="category-filter-label"
                                    value={categoryFilter || "All"}
                                    label="Category"
                                    onChange={(e) => onCategoryFilterChange(e.target.value === "All" ? "" : e.target.value)}
                                >
                                    {uniqueCategories.map((category, index) => (
                                        <MenuItem key={index} value={category}>{category}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </ListItem>
                        <ListItem>
                            <FormControl fullWidth sx={{ marginTop: 2 }}>
                                <InputLabel id="rarity-filter-label">Rarity</InputLabel>
                                <Select
                                    labelId="rarity-filter-label"
                                    value={rarityFilter || ""}
                                    label="Rarity"
                                    onChange={(e) => onRarityFilterChange(e.target.value === "" ? null : parseInt(e.target.value as string))}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {Object.entries(rarities).map(([i, v]) => (
                                        <MenuItem key={i} value={i}>{v}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </ListItem>
                        {sortedCards.map(card => (
                            <ListItem key={card.id} style={{ backgroundColor: rarityColors[card.rarity - 1], minWidth: "30rem" }}>
                                <Checkbox
                                    checked={pack?.cardPool.some(content => content.cardId === card.id) || false}
                                    onChange={() => onToggleCardInPack(card.id)}
                                />
                                <ListItemText primary={card.name} />
                                {pack?.cardPool.some(content => content.cardId === card.id) ? (
                                    pack.cardPool.find(content => content.cardId === card.id)?.weight !== undefined ? (
                                        <>
                                            <IconButton onClick={() => onWeightChange(card.id, null)}>
                                                <Clear />
                                            </IconButton>
                                            <TextField
                                                label="Weight"
                                                type="number"
                                                value={pack.cardPool.find(content => content.cardId === card.id)?.weight ?? 1}
                                                onChange={(e) => onWeightChange(card.id, parseInt(e.target.value))}
                                                sx={{ width: 100, marginLeft: 2 }}
                                            />
                                        </>
                                    ) : (
                                        <Button
                                            sx={{ marginLeft: 2, cursor: 'pointer' }}
                                            onClick={() => onWeightChange(card.id, card.rarity)}
                                            variant="contained"
                                        >
                                            <Edit />
                                            Weight: {card.rarity}
                                        </Button>
                                    )
                                ) : null}
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
                                    onClick={() => setViewCard(card.id)}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={() => pack && onSave(pack)} variant="contained">Save</Button>
            </DialogActions>
            {viewCard && (
                <Dialog PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }} open={!!viewCard} onClose={() => setViewCard(null)}>
                    <PlayCard CampaignID={campaignID} CardID={viewCard} />
                </Dialog>
            )}
        </Dialog>
    );
};

export default EditPackDialog;
