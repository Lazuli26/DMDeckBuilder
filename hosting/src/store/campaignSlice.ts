import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Campaign } from '@/services/interfaces';

interface CampaignState {
  value: Campaign | null;
}

const initialState: CampaignState = {
  value: null,
};

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    setCampaign(state, action: PayloadAction<Campaign>) {
      state.value = action.payload;
    },
  },
});

export const { setCampaign } = campaignSlice.actions;
export default campaignSlice.reducer;
