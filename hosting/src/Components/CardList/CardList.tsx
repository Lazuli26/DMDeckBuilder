import { useEffect, useState, useContext } from "react";
import { useAppSelector } from "@/store/reduxHooks";
import { List, ListItem, ListItemText, Box, IconButton, Dialog, FormControl, InputLabel, Select, MenuItem, TextField, Checkbox, Button, Grid2, Pagination } from "@mui/material";
import { Visibility, Edit, Delete, Close, Remove, Add, SwapHoriz } from "@mui/icons-material";
import { modifyPlayerCards, setCardShowcase, addCardUsage } from "@/services/firestore";
import { PlayingCard, Pack, Player } from "@/services/interfaces";
import PlayCard from "../PlayCard/PlayCard";
import CardEditor from "../DMComponent/CardEditor";
import { rarities, basePlayingCard } from "@/services/constants";
import { AppContext } from "../AppContext";

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
    cards: [PlayingCard, CardListItem | undefined][],
    rarityFilter: number | null,
    typeFilter: string,
    searchFilter: string,
    sortOption: string,
    tagFilter: string[],
    tagFilterMode: "AND" | "OR"
) => {
    return cards
        .filter(([card]) => {
            const tagMatch = tagFilterMode === "AND"
                ? tagFilter.every(tag => card.tags?.includes(tag))
                : tagFilter.some(tag => card.tags?.includes(tag));

            return card !== undefined &&
                (rarityFilter === null || card.rarity === rarityFilter) &&
                (typeFilter === "" || card.type === typeFilter) &&
                (searchFilter === "" || normalizeString(card.name.toLowerCase()).includes(normalizeString(searchFilter.toLowerCase())) ||
                    normalizeString(card.description.toLowerCase()).includes(normalizeString(searchFilter.toLowerCase()))) &&
                (tagFilter.length === 0 || tagMatch);
        })
        .sort((cardA, cardB) => {
            const itemA = cardA[1];
            const itemB = cardB[1];

            if (!!itemA == !!itemB) {
                if (sortOption === "rarity") {
                    if (cardA[0]!.rarity !== cardB[0]!.rarity) {
                        return cardA[0]!.rarity - cardB[0]!.rarity;
                    } else return cardA[0]!.name.localeCompare(cardB[0]!.name);
                }
                else if (sortOption === "name") {
                    return cardA[0]!.name.localeCompare(cardB[0]!.name);
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
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [searchFilter, setSearchFilter] = useState<string>("");
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [tagFilterMode, setTagFilterMode] = useState<"AND" | "OR">("OR");
    const { types: uniqueTypes, tags: uniqueTags } = useContext(AppContext);
    const [page, setPage] = useState<number>(1);
    const cardsPerPage = 10;

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



    const carListRender: [PlayingCard, CardListItem | undefined][] = []

    if (packEditControls) {
        for (const card of cardCatalog) {
            const item = cardListData.find(item => item.cardId === card.id);
            carListRender.push([card, item])
        }
    }
    else {
        for (const cardListItem of cardListData) {
            const item = cardCatalog.find(item => item.id === cardListItem.cardId);
            if (item) {
                carListRender.push([item, cardListItem])
            }
        }
    }

    const sortedCardItems = getFilteredCardListItems(carListRender, rarityFilter, typeFilter, searchFilter, sortOption, tagFilter, tagFilterMode);

    const toggleTagFilterMode = () => {
        setTagFilterMode(prevMode => (prevMode === "AND" ? "OR" : "AND"));
    };

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const paginatedCardItems = sortedCardItems.slice((page - 1) * cardsPerPage, page * cardsPerPage);

    return (
        <>
            {enableFiltering && (
                <Box>
                    <TextField
                        sx={{ marginTop: 2 }}
                        fullWidth
                        id="search-filter"
                        label="Search"
                        variant="outlined"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                    />
                    <Grid2 container spacing={2} sx={{ marginTop: 2 }}>
                        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth>
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
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel id="type-filter-label">Type</InputLabel>
                                <Select
                                    labelId="type-filter-label"
                                    value={typeFilter || "All"}
                                    label="Type"
                                    onChange={(e) => setTypeFilter(e.target.value === "All" ? "" : e.target.value)}
                                >
                                    <MenuItem value="All">All</MenuItem>
                                    {uniqueTypes.map((type, index) => (
                                        <MenuItem key={index} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth>
                                <InputLabel id="tag-filter-label">Tags</InputLabel>
                                <Select
                                    labelId="tag-filter-label"
                                    multiple
                                    value={tagFilter}
                                    onChange={(e) => setTagFilter(e.target.value as string[])}
                                    renderValue={(selected) => selected.join(', ')}
                                    endAdornment={
                                        <IconButton onClick={toggleTagFilterMode}>
                                            <SwapHoriz />
                                        </IconButton>
                                    }
                                >
                                    {uniqueTags.map((tag, index) => (
                                        <MenuItem key={index} value={tag}>
                                            <Checkbox checked={tagFilter.indexOf(tag) > -1} />
                                            {tag}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid2>
                        {enableSorting && (
                            <Grid2 size={{ xs: 12, sm: 6, md: 3 }}>
                                <FormControl fullWidth>
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
                            </Grid2>
                        )}
                    </Grid2>
                </Box>
            )}
            <List>
                {paginatedCardItems.map(([card, item], index) => {
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
            {(() => {
                if (sortedCardItems.length <= cardsPerPage) {
                    if (page !== 1) setPage(1);
                    return null
                };
                return <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                    <Pagination
                        count={Math.ceil(sortedCardItems.length / cardsPerPage)}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                    />
                </Box>
            })()}
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
