/* eslint-disable react/no-children-prop */
"use client"

import { DMComponent } from "@/Components/DMComponent/DMComponent";
import PlayerComponent from "@/Components/PlayerComponent/PlayerComponent";
import { getCampaignList, getCampaignPlayers, subscribeToCampaign } from "@/services/firestore";
import { Player } from "@/services/interfaces";
import { FormControl, InputLabel, Select, MenuItem, AppBar, Toolbar, Typography, IconButton, Box, CssBaseline, Tooltip } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState, useEffect } from "react";
import { Provider } from 'react-redux';
import { setCampaign } from '@/store/campaignSlice';
import store from "@/store";
import React from "react";
import { ContextWrapper } from "@/Components/AppContext";
import AuthWrapper, { AuthContext } from "@/Components/AuthWrapper/AuthWrapper";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CardViewerProvider } from "@/Components/CardViewer/CardViewer";

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
  const [playerList, setPlayerList] = useState<Player[]>([])
  const [selectedPlayer, selectPlayer] = useState<string | null>(typeof window !== "undefined" ? localStorage.getItem("selectedPlayer") : null);

  useEffect(() => {
    getCampaignList().then(data => {
      setcampaignList(data)
    })
  }, []);

  useEffect(() => {
    if (selectedCampaign != "") {
      getCampaignPlayers(selectedCampaign).then(val => {
        setPlayerList(val)
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedCampaign", selectedCampaign);
      }
      // Fetch and set the campaign data
      subscribeToCampaign(selectedCampaign, campaign => {
        if (campaign) {
          store.dispatch(setCampaign(campaign));
        }
      });
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
                          ><MenuItem value={"DM"}>DM</MenuItem>
                            {playerList.map((v, i) => <MenuItem key={i} value={v.id}>{v.name}</MenuItem>)}
                          </Select>
                        </FormControl>}
                      {selectedPlayer == "DM" ? <DMComponent CampaignID={selectedCampaign} /> : selectedPlayer && <PlayerComponent CampaignID={selectedCampaign} PlayerID={selectedPlayer} />}
                    </Box>
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
