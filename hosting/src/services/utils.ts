import { Pack, PlayingCard } from "./interfaces";

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

export function generatePackContents(pack: Pack, cards: PlayingCard[], presetRandom?: number): [Pack, string[]] {
    const cardPool = pack.cardPool
        .filter(card => cards.some(c => c.id === card.cardId))
        .map(card => {
            const playingCard = cards.find(c => c.id === card.cardId);
            return {
                ...card,
                weight: card.weight ?? playingCard?.rarity
            };
        });

    const totalWeight = cardPool.reduce((sum, card) => sum + card.weight!, 0);

    const pickCard = () => {
        const random = (presetRandom !== undefined ? presetRandom % 1 : Math.random()) * totalWeight;
        let cumulativeWeight = 0;
        for (const card of cardPool) {
            cumulativeWeight += card.weight!;
            if (random < cumulativeWeight) {
                return card.cardId;
            }
        }
        return cardPool[cardPool.length - 1].cardId; // Fallback
    };

    const pickedCards = Array.from({ length: pack.cardsPerPack }, pickCard);

    return [pack, pickedCards];
}