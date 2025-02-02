import { useEffect, useState } from "react";
import { subscribeToPlayers, subscribeToCards, subscribeToPacks } from "@/services/firestore";
import { Player, PlayingCard, Pack } from "@/services/interfaces";
import { Card, CardContent, CardHeader, Dialog, List, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails, Typography, Grid2 } from "@mui/material";
import { ExpandMore } from '@mui/icons-material';
import PlayCard from "../PlayCard/PlayCard";
import CardShowCase from "../CardShowCase/CardShowCase";
import "./style.css";
import CardList from "../CardList/CardList";

const PlayerComponent: React.FC<{ CampaignID: string, PlayerID: string }> = ({ CampaignID, PlayerID }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [packs, setPacks] = useState<Pack[]>([]);
    const [viewCard, setViewCard] = useState<{ cardId: string, timesUsed: number } | null>(null);
    const [viewPack, setViewPack] = useState<Pack | null>(null); // Add this state
    const [tabIndex, setTabIndex] = useState(0);

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
                </CardContent>
            </Card>
        </>
    );
};

export default PlayerComponent;
