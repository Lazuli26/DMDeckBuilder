import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/reduxHooks";
import { List, ListItem, ListItemText, Box, IconButton, Dialog, FormControl, InputLabel, Select, MenuItem, TextField, Checkbox, Button } from "@mui/material";
import { Visibility, Edit, Delete, Close, Remove, Add } from "@mui/icons-material";
import { modifyPlayerCards, setCardShowcase, addCardUsage } from "@/services/firestore";
import { PlayingCard, Pack, Player } from "@/services/interfaces";
import PlayCard from "../PlayCard/PlayCard";
import CardEditor from "../DMComponent/CardEditor";
import { rarities, basePlayingCard } from "@/services/constants";

interface CardListProps {
    campaignID: string;
    dataSource: string[] | Pack | Player;
    packEditControls?: { toggleCard: (cardId: string) => void, changeWeight: (cardId: string, weight: number | null) => void };
    isDM?: boolean;
    enableSorting?: boolean;
    enableFiltering?: boolean;
}

type CardListItem = {
    cardId?: string;
    packInfo?: Omit<Pack["cardPool"][0], "cardId">;
    playerInfo?: Omit<Player["Cards"][string], "cardId"> & { inventoryKey: string };
}

const normalizeString = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const getFilteredCardListItems = (
    cardCatalog: PlayingCard[],
    cardListData: CardListItem[],
    rarityFilter: number | null,
    categoryFilter: string,
    typeFilter: string,
    searchFilter: string,
    sortOption: string
) => {
    return cardCatalog
        .filter(card => {
            return card !== undefined &&
                (rarityFilter === null || card.rarity === rarityFilter) &&
                (categoryFilter === "" || card.category === categoryFilter) &&
                (typeFilter === "" || card.type === typeFilter) &&
                (searchFilter === "" || normalizeString(card.name.toLowerCase()).includes(normalizeString(searchFilter.toLowerCase())) ||
                    normalizeString(card.description.toLowerCase()).includes(normalizeString(searchFilter.toLowerCase())));
        })
        .sort((cardA, cardB) => {
            const itemA = cardListData.find(item => item.cardId === cardA.id);
            const itemB = cardListData.find(item => item.cardId === cardB.id);

            if (!!itemA == !!itemB) {
                if (sortOption === "rarity") {
                    if (cardA!.rarity !== cardB!.rarity) {
                        return cardA!.rarity - cardB!.rarity;
                    } else return cardA!.name.localeCompare(cardB!.name);
                }
                else if (sortOption === "name") {
                    return cardA!.name.localeCompare(cardB!.name);
                }
            }
            else {
                if (!!itemA !== !!itemB) {
                    return !!itemA ? -1 : 1;
                }
            }
            return 0;
        });
};

const getCardUsageText = (card: PlayingCard, timesUsed: number) => {
    return card.usage === -1 ? `Times Used: ${timesUsed} / ∞` : `Times Used: ${timesUsed} / ${card.usage}`;
};

const CardList: React.FC<CardListProps> = ({ campaignID, dataSource, isDM = false, packEditControls, enableSorting = false, enableFiltering = false }) => {
    const cardCatalog = useAppSelector(state => state.campaign.value?.cards || []).map(card => ({ ...basePlayingCard, ...card }));
    const [cardListData, setCardListData] = useState<CardListItem[]>([]);
    const [viewCard, setViewCard] = useState<string | null>(null);
    const [cardEditorId, setCardEditorId] = useState<string | null>(null);
    const [sortOption, setSortOption] = useState<string>("name");
    const [rarityFilter, setRarityFilter] = useState<number | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [searchFilter, setSearchFilter] = useState<string>("");

    useEffect(() => {
        const cardListData: CardListItem[] = [];
        if (Array.isArray(dataSource)) {
            for (const cardId of dataSource) {
                cardListData.push({ cardId });
            }
        } else if ('cardPool' in dataSource) {
            for (const { cardId, weight } of dataSource.cardPool) {

                const packCardData: CardListItem = { cardId, packInfo: { weight } };
                cardListData.push(packCardData);
            }
        } else if ('Cards' in dataSource) {
            for (const [inventoryKey, { cardId, timesUsed }] of Object.entries(dataSource.Cards)) {
                const playerCardData: CardListItem = { cardId, playerInfo: { inventoryKey, timesUsed } };
                cardListData.push(playerCardData);
            }
        }
        setCardListData(cardListData);
    }, [campaignID, dataSource]);
    

    const handleShowcaseCard = async (cardId: string) => {
        await setCardShowcase(campaignID, [cardId]);
    };

    const handleRemoveCardFromPlayer = async (playerId: string, inventoryKey: string) => {
        await modifyPlayerCards(campaignID, playerId, "remove", inventoryKey);
    };

    const handleAddCardUsage = async (playerId: string, inventoryKey: string, amount: number) => {
        await addCardUsage(campaignID, playerId, inventoryKey, amount);
    };

    const uniqueCategories = ["All", ...new Set(cardCatalog.map(card => card.category).filter(category => category !== ""))];
    const uniqueTypes = ["All", ...new Set(cardCatalog.map(card => card.type).filter(type => type !== ""))];

    const sortedCardItems = getFilteredCardListItems(cardCatalog, cardListData, rarityFilter, categoryFilter, typeFilter, searchFilter, sortOption);

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
                {sortedCardItems.map((card, index) => {
                    const item: CardListItem | undefined = cardListData.find(item => item.cardId === card!.id);
                    if (!item && !packEditControls) return null;
                    return (
                        <ListItem key={card!.id + index} style={{ marginBottom: 3, background: "whitesmoke", borderWidth: "1vh", borderColor: rarities[card!.rarity].color }}>
                            <ListItemText
                                primary={
                                    packEditControls ? (
                                        <>
                                            <Checkbox
                                                checked={!!item}
                                                onChange={() => packEditControls.toggleCard(card!.id)}
                                            />
                                            {card!.name}
                                        </>
                                    ) : (
                                        card!.name
                                    )
                                }
                                secondary={
                                    <>
                                        {item && item.playerInfo && (<>{isDM && (
                                            <IconButton onClick={() => handleAddCardUsage((dataSource as Player).id, item.playerInfo!.inventoryKey, -1)}>
                                                <Remove />
                                            </IconButton>
                                        )}
                                            {getCardUsageText(card!, item.playerInfo.timesUsed)}
                                            {isDM && (
                                                <IconButton onClick={() => handleAddCardUsage((dataSource as Player).id, item.playerInfo!.inventoryKey, 1)}>
                                                    <Add />
                                                </IconButton>
                                            )}
                                            <br />
                                        </>)
                                        }
                                        {card!.description}
                                    </>
                                }
                            />
                            {isDM && (
                                <>
                                    <IconButton onClick={() => setCardEditorId(card!.id)}>
                                        <Edit />
                                    </IconButton>
                                    {item && item.playerInfo && 'id' in dataSource && (
                                        <IconButton onClick={() => handleRemoveCardFromPlayer((dataSource as Player).id, item.playerInfo!.inventoryKey)}>
                                            <Delete />
                                        </IconButton>
                                    )}
                                </>
                            )}
                            {isDM && <IconButton onClick={() => handleShowcaseCard(card!.id)}>
                                <Visibility />
                            </IconButton>
                            }
                            {packEditControls && (
                                <Box sx={{ marginLeft: 2 }}>
                                    {item && item.packInfo?.weight ? (
                                        <TextField
                                            label="Weight"
                                            type="number"
                                            value={item.packInfo.weight}
                                            onChange={(e) => packEditControls.changeWeight(card!.id, parseInt(e.target.value))}
                                            sx={{ width: 120 }}
                                            slotProps={{
                                                input: {
                                                    endAdornment: <IconButton onClick={() => packEditControls.changeWeight(card!.id, null)}><Close /></IconButton>,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <Button variant="contained" sx={{ width: 120 }} onClick={() => packEditControls.changeWeight(card!.id, card!.rarity)}>
                                            Weight: {card!.rarity}
                                        </Button>
                                    )}
                                </Box>
                            )}
                            <Box
                                component="img"
                                src={card!.background}
                                alt={card!.name}
                                sx={{
                                    width: 50,
                                    height: 50,
                                    objectFit: "cover",
                                    marginLeft: 2,
                                    borderRadius: 1,
                                    cursor: 'pointer'
                                }}
                                onClick={() => setViewCard(card!.id)}
                            />
                        </ListItem>
                    );
                })}
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
