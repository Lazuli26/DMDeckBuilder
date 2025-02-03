import { rarities, baseTags } from "@/services/constants";
import { Rarity } from "@/services/interfaces";
import { useAppSelector } from "@/store/reduxHooks";
import React from "react";

export const AppContext = React.createContext<{ tags: string[], types: string[], rarities: { [key: number]: Rarity } }>(
  {
    tags: [],
    types: [],
    rarities: rarities
  }
);

export const ContextWrapper: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
  const tags = useAppSelector(state => {
    const campaignTags = state.campaign.value?.cards?.flatMap(card => card.tags || []) || [];
    return [...new Set([...baseTags, ...campaignTags])].sort();
  });

  const types = useAppSelector(state => {
    const campaignTypes = state.campaign.value?.cards?.flatMap(card => card.type) || [];
    return [...new Set(campaignTypes)].sort();
  });

  return <AppContext.Provider value={{ tags, types, rarities }}>{children}</AppContext.Provider>;
}