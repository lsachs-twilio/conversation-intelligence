# Conversation Insights Flex Plugin

The Conversation Insights Plugin creates a new navigation button in the Flex Side Nav container which links to a custom Flex view. The custom view features an analytics dashboard with your Segment customer data and their conversation trends. This plugin is specifically designed to leverage the intelligence pulled from Conversation Relay to produce actionable insights. The Plugin also contains a recommendation engine that surfaces a recommended audience to engage based on the conversation insights. The engine recommends the audience and surfaces a button to create that audience in your Segment workspace.

## Prerequisites

- Twilio Flex account
- Segment account
- Snowflake account
- Looker Studio account
- Node.js v18
- Npm
- Twilio CLI

## Endpoint Configurations
1. Create a `config.local.js` file in the `/src/config` directory by copying the `config.example.js` file located there.
2. Complete the recommendations endpoints with <your-conversation-relay-port> so the app can get recommendations from the conversation relay node server. The conversation-relay server prints out the correct URL for you when you run it (e.g. http://localhost:3001/get-recommendations)
3. In the looker UI when you're happy with the dashboard you want to embed as part of this plugin, grab the embed URL that looker generates for you and paste it in the variable "LOOKER_URL" in your config.local.js file.


## Running the plugin

1. Make sure you're in the conversation-insights-plugin folder and then install the dependencies:

```bash
npm install
```

2. Install the [Flex Plugin extension](https://github.com/twilio-labs/plugin-flex/tree/v1-beta) for the Twilio CLI:

```bash
twilio plugins:install @twilio-labs/plugin-flex
```

3. Finally, run flex with the plugin

```bash
twilio flex:plugins:start
```

## Other

For further details on Flex Plugins refer to our documentation on the [Twilio Docs](https://www.twilio.com/docs/flex/developer/plugins/cli) page.

