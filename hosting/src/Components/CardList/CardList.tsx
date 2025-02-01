import { useEffect, useState } from "react";
import { List, ListItem, ListItemText, Box, IconButton, Dialog, FormControl, InputLabel, Select, MenuItem, TextField } from "@mui/material";
import { Visibility, Edit } from "@mui/icons-material";
import { setCardShowcase, getCardInfo } from "@/services/firestore";
import { PlayingCard, Pack, Player } from "@/services/interfaces";
import PlayCard from "../PlayCard/PlayCard";
import CardEditor from "../DMComponent/CardEditor";
import { rarities } from "@/services/constants";

interface CardListProps {
    campaignID: string;
    dataSource: string[] | Pack | Player;
    isDM?: boolean;
    enableSorting?: boolean;
    enableFiltering?: boolean;
}

const CardList: React.FC<CardListProps> = ({ campaignID, dataSource, isDM = false, enableSorting = false, enableFiltering = false }) => {
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [viewCard, setViewCard] = useState<string | null>(null);
    const [cardEditorId, setCardEditorId] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<string>("name");
    const [rarityFilter, setRarityFilter] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [searchFilter, setSearchFilter] = useState<string>("");

    useEffect(() => {
        const fetchCards = async () => {
            if (Array.isArray(dataSource)) {
                const cardPromises = dataSource.map(cardId => getCardInfo(campaignID, cardId));
                const cardResults = await Promise.all(cardPromises);
                setCards(cardResults.filter(card => card !== null) as PlayingCard[]);
            } else if ('cardPool' in dataSource) {
                const cardPromises = dataSource.cardPool.map(({ cardId }) => getCardInfo(campaignID, cardId));
                const cardResults = await Promise.all(cardPromises);
                setCards(cardResults.filter(card => card !== null) as PlayingCard[]);
            } else if ('Cards' in dataSource) {
                const cardPromises = Object.values(dataSource.Cards).map(({ cardId }) => getCardInfo(campaignID, cardId));
                const cardResults = await Promise.all(cardPromises);
                setCards(cardResults.filter(card => card !== null) as PlayingCard[]);
            }
        };

        fetchCards();
    }, [campaignID, dataSource]);

    const handleShowcaseCard = async (cardId: string) => {
        await setCardShowcase(campaignID, [cardId]);
    };

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const getFilteredCards = () => {
        return cards.filter(card =>
            (rarityFilter === null || card.rarity === rarityFilter) &&
            (categoryFilter === "" || card.category === categoryFilter) &&
            (typeFilter === "" || card.type === typeFilter) &&
            (searchFilter === "" || normalizeString(card.name.toLowerCase()).includes(normalizeString(searchFilter.toLowerCase())) ||
                normalizeString(card.description.toLowerCase()).includes(normalizeString(searchFilter.toLowerCase())))
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
    const uniqueTypes = ["All", ...new Set(cards.map(card => card.type).filter(type => type !== ""))];

    return (
        <>
            {enableFiltering && (
                <Box>
                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                        <InputLabel id="rarity-filter-label">Rarity</InputLabel>
                        <Select
                            labelId="rarity-filter-label"
                            value={rarityFilter || ""}
                            label="Rarity"
                            onChange={(e) => setRarityFilter(e.target.value === "" ? null : parseInt(e.target.value as string))}
                        >
                            <MenuItem value="">All</MenuItem>
                            {Object.entries(rarities).map(([value, rarity]) => (
                                <MenuItem key={value} value={value}>{rarity.name}</MenuItem>
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
                                <MenuItem key={index} value={category}>{category}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ marginTop: 2 }}>
                        <InputLabel id="type-filter-label">Type</InputLabel>
                        <Select
                            labelId="type-filter-label"
                            value={typeFilter || "All"}
                            label="Type"
                            onChange={(e) => setTypeFilter(e.target.value === "All" ? "" : e.target.value)}
                        >
                            {uniqueTypes.map((type, index) => (
                                <MenuItem key={index} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        sx={{ marginTop: 2 }}
                        fullWidth
                        id="search-filter"
                        label="Search"
                        variant="outlined"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />
                </Box>
            )}
            {enableSorting && (
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
            )}
            <List>
                {getFilteredCards().map((card) => (
                    <ListItem key={card.id} style={{ marginBottom: 3, backgroundColor: rarities[card.rarity].color }}>
                        <ListItemText
                            primary={card.name}
                        />
                        {isDM && (
                            <IconButton onClick={() => setCardEditorId(card.id)}>
                                <Edit />
                            </IconButton>
                        )}
                        <IconButton onClick={() => handleShowcaseCard(card.id)}>
                            <Visibility />
                        </IconButton>
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
            {viewCard && (
                <Dialog open={!!viewCard} onClose={() => setViewCard(null)} PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }}>
                    <PlayCard CampaignID={campaignID} CardID={viewCard} />
                </Dialog>
            )}
            {cardEditorId !== null && (
                <CardEditor
                    open={!!cardEditorId}
                    cardId={cardEditorId}
                    campaignID={campaignID}
                    onClose={() => setCardEditorId(null)}
                    onSave={() => setCardEditorId(null)}
                />
            )}
        </>
    );
};

export default CardList;
