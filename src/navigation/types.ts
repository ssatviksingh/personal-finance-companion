export type RootStackParamList = {
  MainTabs: undefined;
  AddTransaction: undefined;
  EditTransaction: { id: string };
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Insights: undefined;
  Goal: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
