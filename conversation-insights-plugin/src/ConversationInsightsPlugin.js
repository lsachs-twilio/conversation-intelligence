import React from 'react';
import { FlexPlugin } from "@twilio/flex-plugin"
import * as Flex from '@twilio/flex-ui';
require('dotenv').config()

import { CustomizationProvider } from "@twilio-paste/core/customization";
import { Theme } from '@twilio-paste/theme';
import { Heading } from "@twilio-paste/core/heading";
import Chart from './components/Chart/Chart';
import RecommendationEngine from './components/RecommendationEngine/RecommendationEngine';

Flex.setProviders({
  PasteThemeProvider: CustomizationProvider
});

const PLUGIN_NAME = "ConversationInsightsPlugin"

export default class ConversationInsightsPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME)
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */
  // async init(flex, manager) {
  //   flex.CRMContainer.defaultProps.uriCallback = (task) => {
  //     return task
  //       ? `https://www.ask.com/search?q=${task.attributes.name}`
  //       : "https://www.ask.com"
  //   }
  // }
    async init(flex, manager) {
      // Add a new SideLink with a Flex UI icon
      flex.SideNav.Content.add(
        <Flex.SideLink
          key="conversation-insights"
          icon={<Flex.Icon icon="Supervisor" />} // Use a default Flex UI icon
          onClick={() => { Flex.Actions.invokeAction("HistoryPush", `/conversation-insights`);}}
        >
          Custom View
        </Flex.SideLink>,
        { sortOrder: 7 } // Puts the nav element at the end
      );

      Flex.ViewCollection.Content.add(
        <Flex.View name="conversation-insights" key="conversation-insights">
          <Theme.Provider theme="light" style={{width: "100%", overflow: 'scroll'}}>
            <div style={{ padding: 16, width: "100%" }}>
              <Heading as="h2" variant="heading20" display={{color: 'white'}}>
                Conversation Intelligence
              </Heading>
              <Chart />
              <Heading as="h2" variant="heading20" display={{color: 'white'}}>
                Recommendation Engine
              </Heading>
              <RecommendationEngine />
            </div>
          </Theme.Provider>
        </Flex.View>
      );
  }
}
