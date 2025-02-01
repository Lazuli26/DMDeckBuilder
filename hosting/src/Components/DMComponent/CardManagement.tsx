import { getCardInfo, upsertCard, getCampaign, subscribeToCards, setCardShowcase } from "@/services/firestore";
import { PlayingCard } from "@/services/interfaces";
import { Autocomplete, Button, Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, List, ListItem, ListItemText, MenuItem, Select, TextField, Box, IconButton } from "@mui/material";
import { useEffect, useState } from "react";
import PlayCard from "../PlayCard/PlayCard";
import { rarities } from "./DMComponent";
import { generateUUID } from "@/services/utils";
import { rarityColors } from "../PlayCard/PlayCard";
import { Edit, Visibility } from "@mui/icons-material";

export const basePlayingCard: PlayingCard = {
    id: "",
    name: "",
    rarity: 1,
    type: "",
    description: "",
    usage: 0,
    background: "",
    category: "",
    activation_cost: ""
};

const CardManagement: React.FC<{ CampaignID: string }> = ({ CampaignID }) => {
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [nameFilter, setNameFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [rarityFilter, setRarityFilter] = useState<number | null>(null);
    const [viewCard, setViewCard] = useState("");
    const [campaignName, setCampaignName] = useState("");

    useEffect(() => {
        getCampaign(CampaignID).then(campaign => {
            if (campaign) setCampaignName(campaign.name);
        });
        // TODO: remove the basePlayingCard propagation once I make sure the cards are being properly initialized
        return subscribeToCards(CampaignID, data => setCards(data.map(val => ({ ...basePlayingCard, ...val }))));
    }, [CampaignID]);

    const [cardEditor, setCardEditor] = useState<PlayingCard | null>(null);

    const submitError = {
        name: cardEditor?.name == "",
        type: cardEditor?.type == "",
        uses: cardEditor?.usage == 0 || (cardEditor?.usage || 0) < -1,
        description: cardEditor?.description == ""
    };

    const backupCards = () => {
        const date = new Date();
        const formattedDate = date.toISOString().slice(0, 16).replace("T", " ");
        const fileName = `${campaignName} ${formattedDate}.json`;
        const json = JSON.stringify(cards, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getFilteredCards = () => {
        return cards.filter(card =>
            (nameFilter === "" || card.name.toLowerCase().includes(nameFilter.toLowerCase())) &&
            (categoryFilter === "" || card.category.toLowerCase().includes(categoryFilter.toLowerCase())) &&
            (rarityFilter === null || card.rarity === rarityFilter)
        );
    };

    const uniqueCategories = ["All", ...new Set(cards.map(card => card.category).filter(category => category !== ""))];

    const handleShowcaseCard = async (cardId: string) => {
        await setCardShowcase(CampaignID, [cardId]);
    };

    return (
        <>
            <Dialog PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }} open={viewCard != ""} sx={{ background: 'rgba(0,0,0,0)' }} onClose={() => setViewCard("")}>
                <PlayCard CampaignID={CampaignID} CardID={viewCard} />
            </Dialog>
            <Card>
                <CardHeader title="Card List" />
                <CardContent sx={{ overflow: "auto" }}>
                    <Button variant="contained" onClick={backupCards}>Backup Cards</Button>
                    <List dense>
                        <ListItem>
                            <TextField sx={{ marginTop: 2 }} fullWidth error={submitError.name} id="namefilter" label="Name filter" variant="outlined"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                            />
                        </ListItem>
                        <ListItem>
                            <FormControl fullWidth sx={{ marginTop: 2 }}>
                                <InputLabel id="category-filter-label">Category</InputLabel>
                                <Select
                                    labelId="category-filter-label"
                                    value={categoryFilter || "All"}
                                    label="Category"
                                    onChange={(e) => setCategoryFilter(e.target.value === "All" ? "" : e.target.value)}
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
                                    onChange={(e) => setRarityFilter(e.target.value === "" ? null : parseInt(e.target.value as string))}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {Object.entries(rarities).map(([i, v]) => (
                                        <MenuItem key={i} value={i}>{v}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </ListItem>
                        {getFilteredCards().sort((a, b) => a.name > b.name ? 1 : -1).map((val, index) => (
                            <ListItem key={index} style={{ backgroundColor: rarityColors[val.rarity - 1] }}>
                                <ListItemText
                                    primary={val.name}
                                    secondary={val.id}
                                />
                                <IconButton onClick={() => {
                                    getCardInfo(CampaignID, val.id).then(data => {
                                        if (data) setCardEditor(data);
                                    });
                                }}><Edit /></IconButton>
                                <IconButton onClick={() => handleShowcaseCard(val.id)}>
                                    <Visibility />
                                </IconButton>
                                <Box
                                    component="img"
                                    src={val.background}
                                    alt={val.name}
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        objectFit: "cover",
                                        marginLeft: 2,
                                        borderRadius: 1,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setViewCard(val.id)}
                                />
                            </ListItem>
                        ))}
                        <ListItem>
                            <ListItemText primary="New Item" />
                            <Button onClick={() => setCardEditor({ ...basePlayingCard })}>Create</Button>
                        </ListItem>
                    </List>
                    {cardEditor && <Dialog
                        aria-labelledby="customized-dialog-title"
                        open={!!cardEditor}
                    >
                        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                            {cardEditor.id}
                        </DialogTitle>
                        <DialogContent dividers>
                            <TextField sx={{ marginTop: 2 }} fullWidth error={submitError.name} id="cardname" label="Name" variant="outlined"
                                value={cardEditor.name || ""}
                                onChange={(e) => setCardEditor(d => ({ ...d!, name: e.target.value || "" }))}
                            />
                            <TextField sx={{ marginTop: 2 }} fullWidth error={submitError.type} id="type" label="Activation Type" variant="outlined"
                                value={cardEditor.type || ""}
                                onChange={(e) => setCardEditor(d => ({ ...d!, type: e.target.value || "" }))}
                            />
                            <Autocomplete onChange={(e, v) => setCardEditor(d => ({ ...d!, category: v || "" }))} freeSolo disableClearable value={cardEditor.category || ""} id="category-autocomplete" options={[...new Set(cards.map(c => c.category))].filter(val => val != "").sort()} renderInput={
                                (params) => <TextField {...params}
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            type: 'search',
                                        },
                                    }}
                                    sx={{ marginTop: 2 }} fullWidth id="category" label="Card Category" variant="outlined"
                                />
                            }>
                            </Autocomplete>
                            <FormControl sx={{ marginTop: 2 }} fullWidth>
                                <InputLabel id="rarity-selector-label">Rarity</InputLabel>
                                <Select
                                    labelId="rarity-selector-label"
                                    id="rarity-selector"
                                    value={cardEditor.rarity}
                                    label="Rarity"
                                    onChange={e => setCardEditor(d => ({ ...d!, rarity: parseInt(e.target.value as string) || 1 }))}
                                >
                                    {Object.entries(rarities).map(([i, v]) => <MenuItem key={i} value={i}>{v}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField sx={{ marginTop: 2 }} fullWidth error={submitError.uses} type="number" id="uses" label="Uses" variant="outlined"
                                value={cardEditor.usage || ""}
                                onChange={(e) => setCardEditor(d => ({ ...d!, usage: parseInt(e.target.value as string) || 0 }))}
                            />
                            <TextField sx={{ marginTop: 2 }} fullWidth id="cost" label="Activation Cost" variant="outlined"
                                value={cardEditor.activation_cost || ""}
                                onChange={(e) => setCardEditor(d => ({ ...d!, activation_cost: e.target.value || "" }))}
                            />
                            <TextField sx={{ marginTop: 2 }} fullWidth id="background" label="Background" variant="outlined"
                                value={cardEditor.background || ""}
                                onChange={(e) => setCardEditor(d => ({ ...d!, background: e.target.value || "" }))}
                            />
                            <TextField sx={{ marginTop: 2 }} fullWidth error={submitError.description} id="description" multiline label="Description" variant="outlined"
                                value={cardEditor.description || ""}
                                onChange={(e) => setCardEditor(d => ({ ...d!, description: e.target.value || "" }))}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setCardEditor(null)}>Cancel</Button>
                            <Button variant="contained" disabled={submitError.description || submitError.name || submitError.type || submitError.uses} onClick={() => {
                                if (cardEditor.id == "") {
                                    cardEditor.id = generateUUID();
                                }
                                upsertCard(CampaignID, cardEditor).then(() => setCardEditor(null));
                            }}>Send</Button>
                        </DialogActions>
                    </Dialog>
                    }
                </CardContent>
            </Card >
        </>
    );
};

export default CardManagement;
