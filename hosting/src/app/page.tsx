/* eslint-disable react/no-children-prop */
"use client"

import { DMComponent } from "@/Components/DMComponent/DMComponent";
import PlayerComponent from "@/Components/PlayerComponent/PlayerComponent";
import { getCampaignList, getCampaignPlayers, subscribeToCampaign } from "@/services/firestore";
import { createCampaign } from "@/services/firestore/campaign";
import { TextField, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Campaign } from "@/services/interfaces";
import { PlayerCollection } from "@/services/interfaces";
import { FormControl, InputLabel, Select, MenuItem, AppBar, Toolbar, Typography, IconButton, Box, CssBaseline, Tooltip, Button } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState, useEffect } from "react";
import { Provider } from 'react-redux';
import { setCampaign } from '@/store/campaignSlice';
import store from "@/store";
import React from "react";
import { ContextWrapper } from "@/Components/AppContext";
import AuthWrapper, { AuthContext, AuthContextProps } from "@/Components/AuthWrapper/AuthWrapper";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CardViewerProvider } from "@/Components/CardViewer/CardViewer";
import _ from "lodash";

const theme = createTheme({
  palette: {
    mode: 'dark', // You can change this to 'dark' for dark mode
    primary: {
      main: '#a6a6a6', // Primary color
    },
    secondary: {
      main: '#cc0000', // Secondary color
    },
    error: {
      main: '#cc00cc', // Error color
    },
    background: {
      default: '#383838', // Background color
    },
  },
  typography: {
    fontFamily: [
      'Geist',
      'Geist_Mono',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

export default function Home() {
  const [campaignList, setcampaignList] = useState<{ id: string, name: string }[]>([])
  const [selectedCampaign, selectCampaign] = useState(typeof window !== "undefined" ? localStorage.getItem("selectedCampaign") || "" : "");
  const [playerList, setPlayerList] = useState<PlayerCollection>({})
  const [selectedPlayer, selectPlayer] = useState<string | null>(typeof window !== "undefined" ? localStorage.getItem("selectedPlayer") : null);

  // State for creating a new campaign
  const [campaignDraft, setCampaignDraft] = useState<Partial<Campaign> | null>(null);

  useEffect(() => {
    getCampaignList().then(data => {
      setcampaignList(data)
    })
  }, []);

  const openCreateDialog = () => setCampaignDraft({ name: "", coverImage: "" });
  const closeCreateDialog = () => setCampaignDraft(null);

  const handleCreateCampaign = async (auth: AuthContextProps) => {
    if (!campaignDraft?.name) return;
    const uid = auth?.user?.uid;
    const payload: Partial<Campaign> = {
      ...campaignDraft,
      owner: uid ? [uid] : undefined,
    };
    console.log("Creating campaign with payload:", payload);
    const id = await createCampaign(payload);
    // Refresh campaign list and select the new campaign
    const list = await getCampaignList();
    setcampaignList(list);
    selectCampaign(id);
    // Clear draft which will close dialog
    setCampaignDraft(null);
  };

  useEffect(() => {
    if (selectedCampaign != "") {
      getCampaignPlayers(selectedCampaign).then(val => {
        setPlayerList(val)
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedCampaign", selectedCampaign);
      }
      const unsub = subscribeToCampaign(selectedCampaign, campaign => {
        if (campaign) {
          store.dispatch(setCampaign(campaign));
        }
      });
      return () => unsub();
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (selectedPlayer) {
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedPlayer", selectedPlayer);
      }
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("selectedPlayer");
      }
    }
  }, [selectedPlayer]);

  const clearSelection = () => {
    selectCampaign("");
    selectPlayer(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedCampaign");
      localStorage.removeItem("selectedPlayer");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <AuthWrapper>
          <AuthContext.Consumer children={(context) => {
            const { logout } = context || {};
            console.log("Auth context:", context);
            return <>
              <AppBar position="static" enableColorOnDark color="primary">
                <Toolbar>
                  <Tooltip title="Home">
                    <IconButton edge="start" color="inherit" aria-label="home" onClick={clearSelection}>
                      <HomeIcon />
                    </IconButton>
                  </Tooltip>

                  <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
                    {campaignList.find(v => v.id == selectedCampaign)?.name || "Dungeon Master Deck Builder"}
                  </Typography>
                  {logout && <Tooltip title="Logout">
                    <IconButton color="inherit" aria-label="logout" onClick={logout}>
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>}
                </Toolbar>
              </AppBar>
              <Provider store={store}>
                <ContextWrapper>
                  <CardViewerProvider CampaignID={selectedCampaign}>
                    <Box sx={{ width: "100%", overflow: "auto", height: "100%", maxHeight: "100%", padding: "1rem" }}>
                      {!selectedPlayer &&
                        <FormControl fullWidth>
                          <InputLabel id="campaign-selector-label">Select a campaign</InputLabel>
                          <Select
                            labelId="campaign-selector-label"
                            id="campaign-selector"
                            value={selectedCampaign}
                            label="Select a campaign"
                            onChange={e => {
                              selectCampaign(e.target.value);
                              selectPlayer(null);
                            }}
                          >
                            {campaignList.map((v, i) => <MenuItem key={i} value={v.id}>{v.name}</MenuItem>)}
                            {context?.profile?.admin && (
                              <MenuItem value="__create_new__" onClick={() => openCreateDialog()}>
                                Create new campaign
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      }
                      {selectedCampaign && !selectedPlayer &&
                        <FormControl fullWidth>
                          <InputLabel id="player-selector-label">Select a player</InputLabel>
                          <Select
                            labelId="player-selector-label"
                            id="player-selector"
                            value={selectedPlayer || ""}
                            label="Select a player"
                            onChange={e => selectPlayer(e.target.value)}
                          >{context?.profile.admin && <MenuItem value={"DM"}>DM</MenuItem>}
                            {_.map(playerList, (v, i) => <MenuItem key={i} value={i}>{v.name}</MenuItem>)}
                          </Select>
                        </FormControl>}
                      {selectedPlayer == "DM" ? <DMComponent CampaignID={selectedCampaign} /> : selectedPlayer && <PlayerComponent CampaignID={selectedCampaign} PlayerID={selectedPlayer} />}
                    </Box>
                    <Dialog open={campaignDraft != null} onClose={closeCreateDialog}>
                      <DialogTitle>Create new campaign</DialogTitle>
                      <DialogContent>
                        <TextField
                          autoFocus
                          margin="dense"
                          label="Campaign Name"
                          fullWidth
                          value={campaignDraft?.name || ""}
                          onChange={e => setCampaignDraft(d => ({ ...(d || {}), name: e.target.value }))}
                        />
                        <TextField
                          margin="dense"
                          label="Cover Image URL"
                          fullWidth
                          value={campaignDraft?.coverImage || ""}
                          onChange={e => setCampaignDraft(d => ({ ...(d || {}), coverImage: e.target.value }))}
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={closeCreateDialog}>Cancel</Button>
                        {context && <Button onClick={() => handleCreateCampaign(context)} variant="contained">Create</Button>}
                      </DialogActions>
                    </Dialog>
                  </CardViewerProvider>
                </ContextWrapper>
              </Provider>
            </>
          }} />
        </AuthWrapper>
      </Box>
    </ThemeProvider>
  );
}
