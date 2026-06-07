import { create } from 'zustand';
import { api } from '../services/api';

const useStore = create((set, get) => ({
  // State
  oeeData: [],
  originalOeeData: [],
  alerts: [],
  sensorData: [],
  executiveSummary: null,
  isLoading: true,
  
  // Initialize Data with retry
  fetchInitialData: async () => {
    set({ isLoading: true });
    
    const MAX_RETRIES = 4;
    const RETRY_DELAY_MS = 1500;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const [oeeRes, alertsRes, sensorRes, summaryRes] = await Promise.all([
          api.getOeeHistory(),
          api.getRcaTimeline(),
          api.getDigitalTwinResults(),
          api.getExecutiveSummary()
        ]);

        set({
          oeeData: oeeRes.data,
          originalOeeData: oeeRes.data,
          alerts: alertsRes.data,
          sensorData: sensorRes.data,
          executiveSummary: summaryRes.data,
          isLoading: false
        });
        return; // success — exit retry loop
      } catch (error) {
        console.warn(`[useStore] fetchInitialData attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        } else {
          console.error("[useStore] All retries failed. App will show empty data.");
          set({ isLoading: false });
        }
      }
    }
  },


  // Actions
  simulateWhatIf: async (downtimeReduction, cycleSpeedup, scrapAmount) => {
    // API Call Simulate (POST)
    try {
      const res = await api.simulate({
        baseData: get().originalOeeData.length > 0 ? get().originalOeeData : get().oeeData,
        downtimeReductionPercent: downtimeReduction,
        cycleSpeedupPercent: cycleSpeedup,
        scrapAmount: scrapAmount
      });
      set({ oeeData: res.data });
    } catch (error) {
      console.error("Simulation failed", error);
    }
  },
  
  resetWhatIf: () => {
    // Restore cached original data
    set({ oeeData: get().originalOeeData });
  },
}));

export default useStore;
