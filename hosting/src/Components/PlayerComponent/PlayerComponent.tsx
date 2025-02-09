import { Pack } from "@/services/interfaces";
import { useAppSelector } from "@/store/reduxHooks";
import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Card, CardContent, CardHeader, Dialog, Grid2, List, Tab, Tabs, Typography, Box } from "@mui/material";
import { useState } from "react";
import CardList from "../CardList/CardList";
import CardShowCase from "../CardShowCase/CardShowCase";
import PlayCard from "../PlayCard/PlayCard";
import "./style.css";
import _ from "lodash";

const PlayerComponent: React.FC<{ CampaignID: string, PlayerID: string }> = ({ CampaignID, PlayerID }) => {
    const players = useAppSelector(state => state.campaign.value?.players || []);
    const cards = useAppSelector(state => state.campaign.value?.cards || []);
    const packs = useAppSelector(state => state.campaign.value?.packs || []);
    const shop = useAppSelector(state => state.campaign.value?.shop || {});
    const [viewCard, setViewCard] = useState<{ cardId: string, timesUsed: number } | null>(null);
    const [viewPack, setViewPack] = useState<Pack | null>(null);
    const [tabIndex, setTabIndex] = useState(0);

    const currentPlayer = players.find(p => p.id === PlayerID);

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
                        <CardList
                            campaignID={CampaignID}
                            dataSource={viewPack}
                            enableSorting
                        />
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
                        <Tab label="Shop" />
                    </Tabs>
                    {tabIndex === 0 && (
                        <>
                            <Typography variant="h6">Your Inventory</Typography>
                            <Typography variant="h6">Balance: {currentPlayer?.balance}</Typography>
                            <CardList
                                campaignID={CampaignID}
                                dataSource={currentPlayer || []}
                                enableSorting />
                            <Typography variant="h6">Other Players Inventories</Typography>
                            <List>
                                {players.filter(p => p.id !== PlayerID).map((p) => (
                                    <Accordion key={p.id}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography>{p.name}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Typography variant="h6">Balance: {p.balance}</Typography>
                                            <CardList
                                                campaignID={CampaignID}
                                                dataSource={p}
                                                enableSorting />
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </List>
                        </>
                    )}
                    {tabIndex === 1 && (
                        <CardList
                            campaignID={CampaignID}
                            dataSource={cards.map(card => (card.id))}
                            enableFiltering
                            enableSorting
                        />
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
                    {tabIndex === 3 && (
                        <CardList
                            campaignID={CampaignID}
                            dataSource={_.reduce(Object.keys(shop), (prev, key) => ({...prev, [key]: shop[key].cardId}), {})}
                            customControls={(item) => (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1">Price: {shop[item.originalKey as string]?.price}</Typography>
                                </Box>
                            )}
                        />
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default PlayerComponent;
