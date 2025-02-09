import React, { useState } from "react";
import { useAppSelector } from "@/store/reduxHooks";
import { Box, TextField, IconButton, Typography, Card, CardContent, CardHeader } from "@mui/material";
import { Close, Add } from "@mui/icons-material";
import { modifyShop } from "@/services/firestore";
import CardList from "../CardList/CardList";
import _ from "lodash";

interface ShopManagerProps {
    CampaignID: string;
}

const ShopManager: React.FC<ShopManagerProps> = ({ CampaignID }) => {
    const shop = useAppSelector(state => state.campaign.value?.shop || {});
    const cards = useAppSelector(state => state.campaign.value?.cards || []);
    const [newCardPrice, setNewCardPrice] = useState<{ [key: string]: number }>({});

    const handleAddCardToShop = async (cardId: string) => {
        const price = newCardPrice[cardId] || 0;
        await modifyShop(CampaignID, {type: "add", payload: { cardId, price }});
        setNewCardPrice(prev => ({ ...prev, [cardId]: 0 }));
    };

    const handleRemoveCardFromShop = async (key: string) => {
        await modifyShop(CampaignID, {type: "remove", key});
    };

    const handleChangeCardPrice = async (key: string, price: number) => {
        console.log("Changing price of card", key, shop[key], "to", price);
        await modifyShop(CampaignID, {type: "update", payload: {...shop[key], price }, key});
    };

    const availableCards = cards//.filter(card => !Object.values(shop).some((shopItem) => shopItem.cardId === card.id));

    return (
        <Card>
            <CardHeader title="Shop Management" />
            <CardContent>
                <Typography variant="h6">Shop Inventory</Typography>
                <CardList
                    campaignID={CampaignID}
                    dataSource={_.reduce(Object.keys(shop), (prev, key) => ({...prev, [key]: shop[key].cardId}), {})}
                    customControls={(item) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                label="Price"
                                type="number"
                                value={shop[item.originalKey]?.price || 0}
                                onChange={(e) => handleChangeCardPrice(item.originalKey as string, parseInt(e.target.value))}
                                sx={{ width: 100 }}
                            />
                            <IconButton onClick={() => handleRemoveCardFromShop(item.originalKey as string)}>
                                <Close />
                            </IconButton>
                        </Box>
                    )}
                />
                <Box sx={{ marginTop: 4 }}>
                    <Typography variant="h6">Add Cards to Shop</Typography>
                    <CardList
                        enableFiltering
                        campaignID={CampaignID}
                        dataSource={availableCards.map(card => card.id)}
                        customControls={(item) => (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TextField
                                    label="Price"
                                    type="number"
                                    value={newCardPrice[item.cardId!] || item}
                                    onChange={(e) => setNewCardPrice(prev => ({ ...prev, [item.cardId!]: parseInt(e.target.value) }))}
                                    sx={{ width: 100 }}
                                />
                                <IconButton onClick={() => handleAddCardToShop(item.cardId!)}>
                                    <Add />
                                </IconButton>
                            </Box>
                        )}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default ShopManager;
