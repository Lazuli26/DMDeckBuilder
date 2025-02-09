"use client"

import { useState } from "react";
import { Tabs, Tab, Box, useMediaQuery, useTheme, Grid2, Button } from "@mui/material";
import CardManagement from "./CardCatalog/CardManagement";
import ShopManager from "./ShopManager";
import CardShowCase from "../CardShowCase/CardShowCase";
import PackManager from "./PackCatalog/PackManager";
import PlayerManagement from "./PlayerManagement";
import { getCampaign } from "@/services/firestore";

export const DMComponent: React.FC<{ CampaignID: string }> = ({ CampaignID }) => {
    const [tabIndex, setTabIndex] = useState(0);
    const theme = useTheme();
    const isLandscape = useMediaQuery(theme.breakpoints.up('md'));

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const handleBackupDownload = async () => {
        const data = await getCampaign(CampaignID);
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `${data?.name}_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <CardShowCase CampaignID={CampaignID} isDM={true} />
            <Button variant="contained" color="primary" onClick={handleBackupDownload}>
                Download Backup
            </Button>
            {isLandscape ? (
                <Grid2 container spacing={2} display="flex" width="100%" height="100%">
                    <Grid2 size={6} sx={{ maxHeight: "100%", overflow: "auto" }}>
                        <CardManagement CampaignID={CampaignID} />
                    </Grid2>
                    <Grid2 size={6} sx={{ maxHeight: "100%", overflow: "auto" }}>
                        <PlayerManagement CampaignID={CampaignID} />
                    </Grid2>
                    <Grid2 size={6} sx={{ maxHeight: "100%", overflow: "auto" }}>
                        <PackManager CampaignID={CampaignID} />
                    </Grid2>
                    <Grid2 size={6} sx={{ maxHeight: "100%", overflow: "auto" }}>
                        <ShopManager CampaignID={CampaignID} />
                    </Grid2>
                </Grid2>
            ) : (
                <>
                    <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                        <Tab label="Card Management" />
                        <Tab label="Player Management" />
                        <Tab label="Pack Management" />
                        <Tab label="Shop Management" />
                    </Tabs>
                    <Box hidden={tabIndex !== 0}>
                        <CardManagement CampaignID={CampaignID} />
                    </Box>
                    <Box hidden={tabIndex !== 1}>
                        <PlayerManagement CampaignID={CampaignID} />
                    </Box>
                    <Box hidden={tabIndex !== 2}>
                        <PackManager CampaignID={CampaignID} />
                    </Box>
                    <Box hidden={tabIndex !== 3}>
                        <ShopManager CampaignID={CampaignID} />
                    </Box>
                </>
            )}
        </>
    );
};