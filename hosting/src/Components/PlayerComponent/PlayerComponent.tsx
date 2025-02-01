import { useEffect, useState } from "react";
import { subscribeToPlayers, subscribeToCards, subscribeToPacks } from "@/services/firestore";
import { Player, PlayingCard, Pack } from "@/services/interfaces";
import { Card, CardContent, CardHeader, Dialog, List, ListItem, ListItemText, Tabs, Tab, Box, FormControl, InputLabel, Select, MenuItem, TextField, Accordion, AccordionSummary, AccordionDetails, Button, Typography, Grid2 } from "@mui/material";
import { ExpandMore } from '@mui/icons-material';
import PlayCard, { rarityColors } from "../PlayCard/PlayCard";
import CardShowCase from "../CardShowCase/CardShowCase";
import "./style.css";
import { rarities } from "../DMComponent/DMComponent";

const PlayerComponent: React.FC<{ CampaignID: string, PlayerID: string }> = ({ CampaignID, PlayerID }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [packs, setPacks] = useState<Pack[]>([]);
    const [viewCard, setViewCard] = useState<{ cardId: string, timesUsed: number } | null>(null);
    const [viewPack, setViewPack] = useState<Pack | null>(null); // Add this state
    const [tabIndex, setTabIndex] = useState(0);
    const [rarityFilter, setRarityFilter] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [nameFilter, setNameFilter] = useState<string>("");
    const [sortOption, setSortOption] = useState<string>("name");
    const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

    useEffect(() => {
        return subscribeToPlayers(CampaignID, setPlayers);
    }, [CampaignID]);

    useEffect(() => {
        return subscribeToCards(CampaignID, setCards);
    }, [CampaignID]);

    useEffect(() => {
        return subscribeToPacks(CampaignID, setPacks);
    }, [CampaignID]);

    const currentPlayer = players.find(p => p.id === PlayerID);

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

    const getCardDescription = (cardId: string) => {
        const card = cards.find(c => c.id === cardId);
        return card ? card.description : "";
    };

    const getCardBackground = (cardId: string) => {
        const card = cards.find(c => c.id === cardId);
        return card ? card.background : "";
    };

    const getFilteredCards = () => {
        return cards.filter(card =>
            (rarityFilter === null || card.rarity === rarityFilter) &&
            (categoryFilter === "" || card.category === categoryFilter) &&
            (nameFilter === "" || card.name.toLowerCase().includes(nameFilter.toLowerCase()))
        ).sort((a, b) => {
            if (sortOption === "name") {
                return a.name.localeCompare(b.name);
            } else if (sortOption === "rarity") {
                return a.rarity - b.rarity;
            }
            return 0;
        });
    };

    const uniqueCategories = ["All", ...new Set(cards.map(card => card.category).filter(category => category !== ""))];

    const clearFilters = () => {
        setRarityFilter(null);
        setCategoryFilter("");
        setNameFilter("");
        setSortOption("name");
    };

    return (
        <>
            {!!viewCard && <Dialog open={!!viewCard} onClose={() => setViewCard(null)} PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}>
                <PlayCard CampaignID={CampaignID} CardID={viewCard.cardId} timesUsed={viewCard.timesUsed} />
            </Dialog>}
            {!!viewPack && <Dialog open={!!viewPack} onClose={() => setViewPack(null)} maxWidth="sm" fullWidth>
                <Card>
                    <CardHeader title={viewPack.name} subheader={<>
                        Cost: {viewPack.price}<br />
                        Options: {viewPack.cardsPerPack}<br />
                        Picks: {viewPack.picksPerPack}
                    </>} />
                    <CardContent sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <List>
                            {viewPack.cardPool.map(({ cardId }) => {
                                const card = cards.find(c => c.id === cardId);
                                return card ? (
                                    <ListItem key={card.id} style={{ marginBottom: 3, backgroundColor: rarityColors[card.rarity - 1] }}>
                                        <ListItemText
                                            primary={card.name}
                                            secondary={card.description}
                                        />
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
                                            onClick={() => setViewCard({ cardId: card.id, timesUsed: 0 })}
                                        />
                                    </ListItem>
                                ) : null;
                            })}
                        </List>
                    </CardContent>
                </Card>
            </Dialog>}
            <CardShowCase CampaignID={CampaignID} isDM={false} />
            <Card>
                <CardHeader title={currentPlayer?.name} />
                <CardContent>
                    <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} variant="scrollable" scrollButtons="auto">
                        <Tab label="Inventory" />
                        <Tab label="Card Catalog" />
                        <Tab label="Pack Catalog" />
                    </Tabs>
                    {tabIndex === 0 && (
                        <>
                            <Typography variant="h6">Your Inventory</Typography>
                            Balance: {currentPlayer?.balance}
                            <List>
                                {currentPlayer && Object.entries(currentPlayer.Cards).map(([key, card]) => (
                                    <ListItem key={key} style={{ marginBottom: 3, backgroundColor: rarityColors[(cards.find(c => c.id === card.cardId)?.rarity || 1) - 1] }}>
                                        <ListItemText
                                            primary={getCardName(card.cardId)}
                                            secondary={<>
                                                {getCardUsage(card)}<br />
                                                {getCardDescription(card.cardId)}
                                            </>}
                                        />
                                        <Box
                                            component="img"
                                            src={getCardBackground(card.cardId)}
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
                            </List>
                            <Typography variant="h6">Other Players Inventories</Typography>
                            <List>
                                {players.filter(p => p.id !== PlayerID).map((p) => (
                                    <Accordion key={p.id}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography>{p.name}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <List>
                                                <ListItem>
                                                    <ListItemText
                                                        primary={<>Balance: {p.balance}</>}
                                                    ></ListItemText>
                                                </ListItem>
                                                {Object.entries(p.Cards).map(([key, card]) => (
                                                    <ListItem key={key} style={{ marginBottom: 3, backgroundColor: rarityColors[(cards.find(c => c.id === card.cardId)?.rarity || 1) - 1] }}>
                                                        <ListItemText
                                                            primary={getCardName(card.cardId)}
                                                            secondary={<>
                                                                {getCardUsage(card)}<br />
                                                                {getCardDescription(card.cardId)}
                                                            </>}
                                                        />
                                                        <Box
                                                            component="img"
                                                            src={getCardBackground(card.cardId)}
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
                                            </List>
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </List>
                        </>
                    )}
                    {tabIndex === 1 && (
                        <>
                            <Accordion expanded={filtersExpanded} onChange={() => setFiltersExpanded(!filtersExpanded)}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography>Filters</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
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
                                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                                        <InputLabel id="category-filter-label">Category</InputLabel>
                                        <Select
                                            labelId="category-filter-label"
                                            value={categoryFilter || "All"}
                                            label="Category"
                                            onChange={(e) => setCategoryFilter(e.target.value === "All" ? "" : e.target.value)}
                                        >
                                            {uniqueCategories.map((category, index) => (
                                                <MenuItem key={index} value={category}>{category || "Blank"}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        sx={{ marginTop: 2 }}
                                        fullWidth
                                        id="name-filter"
                                        label="Name filter"
                                        variant="outlined"
                                        value={nameFilter}
                                        onChange={(e) => setNameFilter(e.target.value)}
                                    />
                                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                                        <InputLabel id="sort-option-label">Sort By</InputLabel>
                                        <Select
                                            labelId="sort-option-label"
                                            value={sortOption}
                                            label="Sort By"
                                            onChange={(e) => setSortOption(e.target.value)}
                                        >
                                            <MenuItem value="name">Name</MenuItem>
                                            <MenuItem value="rarity">Rarity</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button variant="contained" onClick={clearFilters} sx={{ marginTop: 2 }}>Clear Filters</Button>
                                </AccordionDetails>
                            </Accordion>
                            <List>
                                {getFilteredCards().map((card) => (
                                    <ListItem key={card.id} style={{ marginBottom: 3, backgroundColor: rarityColors[card.rarity - 1] }}>
                                        <ListItemText
                                            primary={card.name}
                                            secondary={card.description}
                                        />
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
                                            onClick={() => setViewCard({ cardId: card.id, timesUsed: 0 })}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                    {tabIndex === 2 && (
                        <Grid2 container>
                            {packs.map((pack, i) => (
                                <Grid2 key={pack.id + i} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Card key={pack.id} sx={{ aspectRatio: "5 / 8", width: "auto", margin: 2, backgroundImage: `url(${pack.background})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' }} onClick={() => setViewPack(pack)}>
                                        <CardHeader
                                            title={pack.name}
                                            subheader={<>Cost: {pack.price}</>}
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                                '& .MuiCardHeader-title, & .MuiCardHeader-subheader': {
                                                    fontWeight: 'bold'
                                                }
                                            }}
                                        />
                                    </Card>
                                </Grid2>
                            ))}
                        </Grid2>
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default PlayerComponent;
