"use client"

import { useState, useEffect } from "react";
import { List, ListItem, ListItemText, Card, CardContent, Typography, IconButton, Button, Dialog } from "@mui/material";
import { subscribeToPacks, upsertPack, subscribeToCards, subscribeToPlayers, modifyPlayerCards, setCardShowcase } from "../../services/firestore";
import { Pack, PlayingCard, Player } from "../../services/interfaces";
import { Edit, OpenInNew, Visibility } from "@mui/icons-material";
import PlayCard from "../PlayCard/PlayCard";
import { basePlayingCard } from "./CardManagement";
import { generateUUID, generatePackContents } from "../../services/utils";
import EditPackDialog from "./EditPackDialog";
import OpenPackDialog from "./OpenPackDialog";

const PackManager: React.FC<{ CampaignID: string }> = ({ CampaignID }) => {
    const [packs, setPacks] = useState<Pack[]>([]);
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [editPack, setEditPack] = useState<Pack | null>(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [viewCard, setViewCard] = useState<string | null>(null);
    const [nameFilter, setNameFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [rarityFilter, setRarityFilter] = useState<number | null>(null);
    const [openedPackCards, setOpenedPackCards] = useState<{ pack: Pack, pickedCards: PlayingCard[] } | null>(null);


    useEffect(() => {
        return subscribeToPacks(CampaignID, setPacks)
    }, [CampaignID]);

    useEffect(() => {
        return subscribeToPlayers(CampaignID, setPlayers)
    }, [CampaignID]);

    useEffect(() => {
        return subscribeToCards(CampaignID, data => {
            const validCards = data.map(val => ({ ...basePlayingCard, ...val }));
            setCards(validCards);
        })
    }, [CampaignID]);

    useEffect(() => {
        setEditPack(editPackState => {
            if (editPackState) {
                const validCardIds = cards.map(card => card.id);
                const validContents = editPackState.cardPool.filter(content => validCardIds.includes(content.cardId));
                return { ...editPackState, cardPool: validContents }
            }
            else return editPackState
        });
    }, [cards]);

    const handlePackChange = (field: keyof Pack, value: string | number) => {
        if (editPack) {
            if (field === "price" || field === "cardsPerPack" || field === "picksPerPack") {
                value = parseInt(value as string);
                console.log(value);
                switch (field) {
                    case "price":
                        if (value < 0) value = 0;
                        break;
                    case "cardsPerPack":
                        if (value < 1) value = 1;
                        break;
                    case "picksPerPack":
                        if (value > editPack.cardsPerPack) value = editPack.cardsPerPack;
                        break;
                }
            }
            setEditPack({ ...editPack, [field]: value });
        }
    };

    const handleSavePack = async (pack: Pack) => {
        await upsertPack(CampaignID, pack);
        setEditPack(null);
    };

    const handleToggleCardInPack = (cardId: string) => {
        console.log("toggle card", cardId);
        if (editPack) {
            const contents = editPack.cardPool.some(content => content.cardId === cardId)
                ? editPack.cardPool.filter(content => content.cardId !== cardId)
                : [...editPack.cardPool, { cardId }];
            setEditPack({ ...editPack, cardPool: contents });
        }
    };

    const handleWeightChange = (cardId: string, weight: number | null) => {
        console.log("change weight", cardId, weight);
        if (weight !== null) {
            weight = Math.max(1, weight);
        }
        if (editPack) {
            const contents = editPack.cardPool.map(content =>
                content.cardId === cardId ? { ...content, weight: weight ?? undefined } : content
            );
            setEditPack({ ...editPack, cardPool: contents });
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const handleCreateNewPack = () => {
        const newPack: Pack = {
            id: generateUUID(),
            name: "",
            price: 0,
            cardsPerPack: 1,
            picksPerPack: 1,
            background: "",
            cardPool: []
        };
        setEditPack(newPack);
        setTabIndex(0);
    };

    const handleOpenPack = (pack: Pack) => {
        const [, pickedCardIds] = generatePackContents(pack, cards);
        const pickedCards = pickedCardIds.map(cardId => cards.find(card => card.id === cardId)!);
        setOpenedPackCards({ pack, pickedCards });
    };

    const handleAddCardToPlayer = async (playerId: string, cardId: string, index: number) => {
        if (openedPackCards) {
            await modifyPlayerCards(CampaignID, playerId, "add", cardId);
            const remainingCards = [...openedPackCards.pickedCards];
            remainingCards.splice(index, 1);
            setOpenedPackCards({ ...openedPackCards, pickedCards: remainingCards });
        }
    };

    const handleShowcasePack = async (pack: Pack) => {
        const cardIds = pack.cardPool.map(content => content.cardId);
        await setCardShowcase(CampaignID, cardIds);
    };

    const handleShowcaseOpenedPack = async () => {
        if (openedPackCards) {
            const cardIds = openedPackCards.pickedCards.map(card => card.id);
            await setCardShowcase(CampaignID, cardIds);
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h5">Pack Manager</Typography>
                <Button variant="contained" onClick={handleCreateNewPack}>Create New Pack</Button>
                <List>
                    {packs.map(pack => (
                        <ListItem key={pack.id}>
                            <ListItemText primary={pack.name} secondary={`Price: ${pack.price}`} />
                            <IconButton onClick={() => setEditPack(pack)}>
                                <Edit />
                            </IconButton>
                            <IconButton onClick={() => handleOpenPack(pack)}>
                                <OpenInNew />
                            </IconButton>
                            <IconButton onClick={() => handleShowcasePack(pack)}>
                                <Visibility />
                            </IconButton>
                        </ListItem>
                    ))}
                </List>
                {editPack && <EditPackDialog
                    campaignID={CampaignID}
                    open={!!editPack}
                    pack={editPack}
                    cards={cards}
                    nameFilter={nameFilter}
                    categoryFilter={categoryFilter}
                    rarityFilter={rarityFilter}
                    tabIndex={tabIndex}
                    onClose={() => setEditPack(null)}
                    onSave={handleSavePack}
                    onPackChange={handlePackChange}
                    onToggleCardInPack={handleToggleCardInPack}
                    onWeightChange={handleWeightChange}
                    onTabChange={handleTabChange}
                    onNameFilterChange={setNameFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    onRarityFilterChange={setRarityFilter}
                />
                }
                {viewCard && (
                    <Dialog PaperProps={{ style: { backgroundColor: 'transparent', boxShadow: 'none' } }} open={!!viewCard} onClose={() => setViewCard(null)}>
                        <PlayCard CampaignID={CampaignID} CardID={viewCard} />
                    </Dialog>
                )}
                <OpenPackDialog
                    open={!!openedPackCards}
                    pack={openedPackCards}
                    players={players}
                    onClose={() => setOpenedPackCards(null)}
                    onAddCardToPlayer={handleAddCardToPlayer}
                    onShowcaseOpenedPack={handleShowcaseOpenedPack}
                    onViewCard={setViewCard}
                />
            </CardContent>
        </Card>
    );
};

export default PackManager;
