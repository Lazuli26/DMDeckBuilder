export interface Player {
    name: string;
    balance: number;
    Cards: { [key: string]: { cardId: string, timesUsed: number } };
    userId?: string;
}

export interface PlayingCard {
    id: string;
    name: string;
    rarity: number;
    type: string;
    tags?: string[];
    activation_cost: string;
    description: string;
    usage: number;
    background: string;
}

export interface Pack {
    id: string;
    name: string;
    price: number;
    cardsPerPack: number;
    picksPerPack: number;
    background: string;
    cardPool: { cardId: string; weight?: number }[];
}
export type ShopItem = { cardId: string; price: number };

export interface Rarity {
    name: string;
    color: string;
    background: string;
};

export type PlayerCollection = {[key: string]: Player}

export interface Campaign {
    name: string;
    players: PlayerCollection;
    users?: string[];
    cards: PlayingCard[];
    packs: Pack[];
    shop?: { [key: string]: ShopItem };
    cardShowcase?: string[]; // If not empty, a dialog will open with the cards in this array for all players and the DM
    owner?: string[];
    requests?: { [playerId: string]: { type: 'store/card' | 'store/pack', resourceId: string }[] }
}

export interface AppUser {
    lastLogin: string,
    displayName: string
}