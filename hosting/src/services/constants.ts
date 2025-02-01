import { Rarity } from "./interfaces";

export const rarities: {[key: number]: Rarity} = {
    1: {
        name: 'Legendary',
        color: 'rgba(226, 40, 40, 0.75)',
        background: 'https://i.imgur.com/nUWzBNa.jpeg'
    },
    2: {
        name: 'Rare',
        color: 'rgba(104, 93, 252, 0.75)',
        background: 'https://i.imgur.com/Be1ru4O.jpeg'
    },
    3: {
        name: 'Uncommon',
        color: 'rgba(166, 219, 154, 0.75)',
        background: 'https://i.imgur.com/44MShCg.jpeg'
    },
    4: {
        name: 'Common',
        color: 'rgba(225, 228, 203, 0.75)',
        background: 'https://i.imgur.com/UjcJonU.jpeg'
    }
};
