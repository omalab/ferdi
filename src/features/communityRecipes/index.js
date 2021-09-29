import { reaction } from 'mobx';
import { CommunityRecipesStore } from './store';

const debug = require('debug')('EngageDock:feature:communityRecipes');

export const communityRecipesStore = new CommunityRecipesStore();

export default function initCommunityRecipes(stores, actions) {
  const { features } = stores;

  communityRecipesStore.start(stores, actions);

  // Toggle communityRecipe premium status
  reaction(
    () => (
      features.features.isCommunityRecipesIncludedInCurrentPlan
    ),
    (isPremiumFeature) => {
      debug('Community recipes is premium feature: ', isPremiumFeature);
      communityRecipesStore.isCommunityRecipesIncludedInCurrentPlan = true;
    },
    {
      fireImmediately: true,
    },
  );
}
