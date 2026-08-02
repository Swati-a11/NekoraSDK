import { BehaviorProfile } from "./types.js";

export class BehaviorProfileManager {
  private profileState: BehaviorProfile;

  constructor() {
    this.profileState = {
      communication: {},
      coding: {},
      habits: [],
    };
  }

  update(partial: Partial<BehaviorProfile>): void {
    if (partial.communication) {
      Object.assign(this.profileState.communication, partial.communication);
    }
    if (partial.coding) {
      Object.assign(this.profileState.coding, partial.coding);
    }
    if (partial.habits) {
      for (const h of partial.habits) {
        if (!this.profileState.habits.includes(h)) {
          this.profileState.habits.push(h);
        }
      }
    }
  }

  getProfile(): BehaviorProfile {
    return JSON.parse(JSON.stringify(this.profileState));
  }
}
