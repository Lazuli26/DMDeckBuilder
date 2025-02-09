import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { AppUser, Player } from "../interfaces";
import { getCampaign } from "../firestore";

// ...existing code...

export async function getUsers(): Promise<{ [key: string]: AppUser }> {
    const usersSnap = await getDocs(collection(db, "users"));
    const users: { [key: string]: AppUser } = {};
    usersSnap.forEach(doc => {
        users[doc.id] = doc.data() as AppUser;
    });
    return users;
}

export async function getCampaignUsers(campaignId: string): Promise<{ [key: string]: AppUser }> {
    const campaign = await getCampaign(campaignId);
    if (!campaign) return {};

    const userIds = campaign.users || [];
    const usersSnap = await getDocs(collection(db, "users"));
    const users: { [key: string]: AppUser } = {};

    usersSnap.forEach(doc => {
        if (userIds.includes(doc.id)) {
            users[doc.id] = doc.data() as AppUser;
        }
    });

    return users;
}

// Link a user to a player in a campaign
export async function linkUserToPlayer(campaignId: string, playerId: string, userId: string): Promise<void> {
    const playerRef = doc(db, "campaigns", campaignId, 'players', playerId);
    const playerSnap = await getDoc(playerRef);
    if (!playerSnap.exists()) return;

    const player = playerSnap.data() as Player;
    if (!player) return;

    await updateDoc(playerRef, { userId });
}

// ...exis+ting code...
